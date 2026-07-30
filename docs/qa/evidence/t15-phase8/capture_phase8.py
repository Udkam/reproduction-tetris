from __future__ import annotations

import argparse
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from typing import Any, Iterator
from urllib.request import urlopen

from playwright.sync_api import BrowserContext, Page, sync_playwright


ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
ARTIFACT_OUT = OUT
BASE_URL = "http://127.0.0.1:4178/"
PRODUCT_CANDIDATE = "4e4cca1e26554323d5712a2e28386c4a9fb4f7e2"
MUTATION_CANDIDATE = "ee2aac542529c116c915c38e0603584a7099b5e8"
OFFICIAL_CLIENT = (
    Path.home()
    / ".codex"
    / "skills"
    / "develop-web-game"
    / "scripts"
    / "web_game_playwright_client.js"
)
PHASE5_OUT = ROOT / "docs/qa/evidence/t15-phase5"
PUZZLE_OUT = ROOT / "docs/workstreams/tetris-t15-puzzle"
PRODUCT_PATHS = (
    "src",
    "public",
    ":(glob).env*",
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
)
PUZZLE_ARTIFACTS = tuple(
    PUZZLE_OUT / f"puzzle-levels-{start:02d}-{start + 9:02d}.json"
    for start in range(1, 50, 10)
)


FIXED_SEED_INIT_SCRIPT = """
Object.defineProperty(window.crypto, "getRandomValues", {
  configurable: true,
  value: (values) => {
    for (let index = 0; index < values.length; index += 1) values[index] = 0x7116;
    return values;
  },
});
"""


LIFECYCLE_INIT_SCRIPT = r"""
(() => {
  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;
  const listenerIds = new WeakMap();
  const activeGlobalListeners = new Set();
  let nextListenerId = 1;

  const listenerId = (listener) => {
    if ((typeof listener !== "function" && typeof listener !== "object") || listener === null) return "null";
    if (!listenerIds.has(listener)) listenerIds.set(listener, nextListenerId++);
    return listenerIds.get(listener);
  };
  const captureValue = (options) => typeof options === "boolean" ? options : Boolean(options?.capture);
  const targetName = (target) => target === window ? "window" : target === document ? "document" : null;
  const listenerKey = (target, type, listener, options) => {
    const name = targetName(target);
    return name ? `${name}:${type}:${listenerId(listener)}:${captureValue(options) ? 1 : 0}` : null;
  };

  EventTarget.prototype.addEventListener = function(type, listener, options) {
    const key = listenerKey(this, type, listener, options);
    if (key) activeGlobalListeners.add(key);
    return originalAdd.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    const key = listenerKey(this, type, listener, options);
    if (key) activeGlobalListeners.delete(key);
    return originalRemove.call(this, type, listener, options);
  };

  const originalRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const originalCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  const pendingAnimationFrames = new Set();
  window.requestAnimationFrame = (callback) => {
    let handle = 0;
    handle = originalRequestAnimationFrame((now) => {
      pendingAnimationFrames.delete(handle);
      callback(now);
    });
    pendingAnimationFrames.add(handle);
    return handle;
  };
  window.cancelAnimationFrame = (handle) => {
    pendingAnimationFrames.delete(handle);
    return originalCancelAnimationFrame(handle);
  };

  let audioContextsCreated = 0;
  let audioContextsClosed = 0;
  const closedContexts = new WeakSet();
  const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OriginalAudioContext) {
    class InstrumentedAudioContext extends OriginalAudioContext {
      constructor(...args) {
        super(...args);
        audioContextsCreated += 1;
      }
      close() {
        if (!closedContexts.has(this)) {
          closedContexts.add(this);
          audioContextsClosed += 1;
        }
        return super.close();
      }
    }
    window.AudioContext = InstrumentedAudioContext;
    if (window.webkitAudioContext) window.webkitAudioContext = InstrumentedAudioContext;
  }

  window.__T15_LIFECYCLE__ = {
    snapshot() {
      const counts = {};
      for (const key of activeGlobalListeners) {
        const [target, type] = key.split(":");
        const label = `${target}:${type}`;
        counts[label] = (counts[label] || 0) + 1;
      }
      return {
        globalListenerCount: activeGlobalListeners.size,
        globalListeners: Object.fromEntries(Object.entries(counts).sort()),
        pendingAnimationFrames: pendingAnimationFrames.size,
        audioContextsCreated,
        audioContextsClosed,
        openAudioContexts: audioContextsCreated - audioContextsClosed,
      };
    },
  };
})();
"""


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=ROOT,
        check=check,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def png_dimensions(path: Path) -> dict[str, int]:
    data = path.read_bytes()
    assert data.startswith(b"\x89PNG\r\n\x1a\n"), f"{path.name} is not a PNG."
    return {
        "width": int.from_bytes(data[16:20], "big"),
        "height": int.from_bytes(data[20:24], "big"),
    }


def candidate_binding() -> dict[str, Any]:
    assert git("rev-parse", f"{PRODUCT_CANDIDATE}^{{commit}}").stdout.strip() == PRODUCT_CANDIDATE
    head = git("rev-parse", "HEAD").stdout.strip()
    script = Path(__file__).resolve()
    relative = script.relative_to(ROOT).as_posix()
    product_status = git("status", "--short", "--", *PRODUCT_PATHS).stdout.splitlines()
    script_status = git("status", "--short", "--", relative).stdout.splitlines()
    product_diff = git("diff", "--quiet", PRODUCT_CANDIDATE, "--", *PRODUCT_PATHS, check=False)
    script_head_blob = git("rev-parse", f"HEAD:{relative}").stdout.strip()
    script_worktree_blob = git("hash-object", "--no-filters", relative).stdout.strip()
    assert product_status == []
    assert script_status == []
    assert product_diff.returncode == 0
    assert script_head_blob == script_worktree_blob
    assert OFFICIAL_CLIENT.is_file()
    return {
        "productCandidate": PRODUCT_CANDIDATE,
        "gitHead": head,
        "productTreeMatchesCandidate": True,
        "productPaths": list(PRODUCT_PATHS),
        "productStatus": product_status,
        "captureScript": {
            "relativePath": relative,
            "sha256": sha256(script),
            "gitBlob": script_head_blob,
            "status": script_status,
        },
        "officialClient": {
            "path": str(OFFICIAL_CLIENT),
            "sha256": sha256(OFFICIAL_CLIENT),
        },
    }


def verify_checksum_file(directory: Path, filename: str) -> dict[str, Any]:
    checksum_path = directory / filename
    assert checksum_path.is_file()
    entries: list[dict[str, str]] = []
    for raw_line in checksum_path.read_text(encoding="utf-8").splitlines():
        if not raw_line.strip():
            continue
        digest, name = raw_line.split(maxsplit=1)
        relative = name.strip().lstrip("*")
        target = directory / relative
        assert target.is_file(), f"Missing checksum target: {target}"
        assert sha256(target) == digest, f"Checksum mismatch: {target}"
        entries.append({"file": relative, "sha256": digest})
    return {
        "file": checksum_path.relative_to(ROOT).as_posix(),
        "sha256": sha256(checksum_path),
        "entries": len(entries),
    }


def verify_phase5_evidence() -> dict[str, Any]:
    browser_manifest_path = PHASE5_OUT / "phase5-browser-evidence.json"
    browser_manifest = json.loads(browser_manifest_path.read_text(encoding="utf-8"))
    candidate_blob = json.dumps(browser_manifest.get("candidate", {}), ensure_ascii=False)
    assert MUTATION_CANDIDATE in candidate_blob
    assert browser_manifest.get("result", {}).get("errors", []) == []
    browser_sums = verify_checksum_file(PHASE5_OUT, "SHA256SUMS.txt")
    gate_sums = verify_checksum_file(PHASE5_OUT, "SHA256SUMS-gates.txt")
    pngs = sorted(PHASE5_OUT.glob("*.png"))
    assert len(pngs) == 34
    return {
        "sourceCandidate": MUTATION_CANDIDATE,
        "manifest": {
            "file": browser_manifest_path.relative_to(ROOT).as_posix(),
            "sha256": sha256(browser_manifest_path),
        },
        "captureCount": len(pngs),
        "browserChecksums": browser_sums,
        "gateChecksums": gate_sums,
    }


def verify_puzzle_artifacts() -> dict[str, Any]:
    levels: list[dict[str, Any]] = []
    files: list[dict[str, Any]] = []
    for artifact in PUZZLE_ARTIFACTS:
        payload = json.loads(artifact.read_text(encoding="utf-8"))
        assert payload["schemaVersion"] == 7
        assert len(payload["levels"]) == 10
        levels.extend(payload["levels"])
        files.append(
            {
                "file": artifact.relative_to(ROOT).as_posix(),
                "sha256": sha256(artifact),
                "batch": payload["batch"],
            }
        )
    ids = [level["id"] for level in levels]
    positions = [level["curriculumPosition"] for level in levels]
    routes = [route for level in levels for route in level["routes"]]
    streams = [route["commandStream"] for route in routes]
    assert len(levels) == len(set(ids)) == 50
    assert sorted(positions) == list(range(1, 51))
    assert all(len(level["routes"]) == 2 for level in levels)
    assert len(routes) == len(set(streams)) == 100
    tiers: dict[int, int] = {}
    for level in levels:
        rows = int(level["targetRowCount"])
        tiers[rows] = tiers.get(rows, 0) + 1
    assert tiers == {3: 10, 4: 10, 5: 10, 6: 10, 7: 10}
    return {
        "schemaVersion": 7,
        "levels": len(levels),
        "routes": len(routes),
        "uniqueStreams": len(set(streams)),
        "tiers": {str(key): value for key, value in sorted(tiers.items())},
        "files": files,
    }


def listener_pids(port: int) -> set[int]:
    result = subprocess.run(
        ["netstat", "-ano", "-p", "tcp"],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    found: set[int] = set()
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) < 5 or parts[0].upper() != "TCP" or parts[-2].upper() != "LISTENING":
            continue
        try:
            local_port = int(parts[1].rsplit(":", 1)[1])
            pid = int(parts[-1])
        except (IndexError, ValueError):
            continue
        if local_port == port:
            found.add(pid)
    return found


@contextmanager
def managed_vite_server() -> Iterator[dict[str, Any]]:
    assert listener_pids(4178) == set(), "Port 4178 must be free before evidence starts."
    node = shutil.which("node")
    vite = ROOT / "node_modules" / "vite" / "bin" / "vite.js"
    assert node is not None
    assert vite.is_file()
    command = [
        node,
        str(vite),
        "--host",
        "127.0.0.1",
        "--port",
        "4178",
        "--strictPort",
    ]
    stdout_path = ARTIFACT_OUT / "phase8-vite-stdout.log"
    stderr_path = ARTIFACT_OUT / "phase8-vite-stderr.log"
    stdout_handle = stdout_path.open("w", encoding="utf-8", newline="\n")
    stderr_handle = stderr_path.open("w", encoding="utf-8", newline="\n")
    creation_flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    process = subprocess.Popen(
        command,
        cwd=ROOT,
        stdout=stdout_handle,
        stderr=stderr_handle,
        text=True,
        encoding="utf-8",
        creationflags=creation_flags,
    )
    record: dict[str, Any] = {
        "command": command,
        "cwd": str(ROOT),
        "pid": process.pid,
        "listenerPid": None,
        "ready": False,
        "released": False,
    }
    try:
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError(f"Managed Vite exited early with code {process.returncode}.")
            pids = listener_pids(4178)
            if pids == {process.pid}:
                try:
                    with urlopen(BASE_URL, timeout=1) as response:
                        if response.status == 200:
                            record["listenerPid"] = process.pid
                            record["ready"] = True
                            break
                except OSError:
                    pass
            time.sleep(0.1)
        assert record["ready"], "Managed Vite did not become ready on its own PID."
        yield record
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=8)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
        record["exitCode"] = process.returncode
        stdout_handle.close()
        stderr_handle.close()
        deadline = time.monotonic() + 8
        while listener_pids(4178) and time.monotonic() < deadline:
            time.sleep(0.1)
        record["released"] = listener_pids(4178) == set()
        assert record["released"], "Managed Vite listener leaked after shutdown."


def run_official_client() -> dict[str, Any]:
    node = shutil.which("node")
    assert node is not None
    output = ARTIFACT_OUT / "official-client"
    output.mkdir()
    actions = {
        "steps": [
            {"buttons": ["enter"], "frames": 1},
            {"buttons": ["left"], "frames": 6},
            {"buttons": ["up"], "frames": 3},
            {"buttons": ["space"], "frames": 3},
        ]
    }
    command = [
        node,
        str(OFFICIAL_CLIENT),
        "--url",
        BASE_URL,
        "--click-selector",
        "[data-testid='enter-marathon']",
        "--actions-json",
        json.dumps(actions, separators=(",", ":")),
        "--iterations",
        "2",
        "--pause-ms",
        "3300",
        "--screenshot-dir",
        str(output),
    ]
    completed = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=60,
    )
    (ARTIFACT_OUT / "official-client-stdout.log").write_text(
        completed.stdout,
        encoding="utf-8",
        newline="\n",
    )
    (ARTIFACT_OUT / "official-client-stderr.log").write_text(
        completed.stderr,
        encoding="utf-8",
        newline="\n",
    )
    assert completed.returncode == 0, completed.stderr
    assert not list(output.glob("errors-*.json"))
    shots = sorted(output.glob("shot-*.png"))
    states = sorted(output.glob("state-*.json"))
    assert len(shots) == 2
    assert states
    parsed_states = [json.loads(path.read_text(encoding="utf-8")) for path in states]
    assert any(state.get("mode") == "marathon" and state.get("status") == "playing" for state in parsed_states)
    assert all(path.stat().st_size > 1024 for path in shots)
    assert listener_pids(4178)
    return {
        "command": command,
        "returnCode": completed.returncode,
        "screenshots": [
            {
                "file": path.relative_to(ARTIFACT_OUT).as_posix(),
                "sha256": sha256(path),
                "dimensions": png_dimensions(path),
            }
            for path in shots
        ],
        "states": [
            {
                "file": path.relative_to(ARTIFACT_OUT).as_posix(),
                "sha256": sha256(path),
                "mode": state.get("mode"),
                "status": state.get("status"),
                "pieceCount": state.get("placedPieces"),
            }
            for path, state in zip(states, parsed_states, strict=True)
        ],
        "errors": [],
        "browserClosed": True,
    }


def attach_error_capture(page: Page) -> list[str]:
    errors: list[str] = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    return errors


def settle_two_frames(page: Page) -> None:
    page.evaluate(
        """
        async () => {
          await new Promise((resolve, reject) => {
            const timeout = window.setTimeout(
              () => reject(new Error("Two animation frames did not settle within 2000 ms.")),
              2000,
            );
            requestAnimationFrame(() => requestAnimationFrame(() => {
              window.clearTimeout(timeout);
              resolve();
            }));
          });
        }
        """
    )


def runtime_state(page: Page) -> dict[str, Any]:
    return page.evaluate(
        """
        () => {
          const state = window.__SIGNAL_FOUNDRY_QA__?.getState();
          if (!state) throw new Error("Runtime QA surface is unavailable.");
          return {
            mode: state.mode,
            status: state.status,
            phase: state.phase,
            active: state.active,
            lines: state.lines,
            pieceCount: state.pieceCount,
            queue: state.queue.slice(0, state.mode === "puzzle" ? 2 : 1),
            puzzleId: state.puzzleId,
            puzzleTargets: state.puzzleTargetCells.length,
            puzzleUndoDepth: state.puzzleUndoHistory.length,
            survivalBedrockRows: state.survivalBedrockRows,
            survivalDebris: state.survivalDebris.map((stone) => ({x: stone.x, y: stone.y})),
            mutationActiveCarrier: state.mutationActiveCarrier?.item ?? null,
            mutationLockedCarriers: state.mutationCarriers.length,
            mutationFreezeTicks: state.mutationFreezeTicks,
            mutationCollapseTicks: state.mutationCollapseTicks,
            mutationMultiplierTicks: state.mutationMultiplierTicks,
          };
        }
        """
    )


def page_snapshot(page: Page) -> dict[str, Any]:
    settle_two_frames(page)
    return page.evaluate(
        """
        () => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          const state = qa?.getState() ?? null;
          const renderer = qa?.getRendererSnapshot() ?? null;
          const rect = (node) => {
            if (!(node instanceof HTMLElement)) return null;
            const box = node.getBoundingClientRect();
            return {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              visible: box.width > 0
                && box.height > 0
                && box.right > 0
                && box.bottom > 0
                && box.left < innerWidth
                && box.top < innerHeight,
            };
          };
          const active = document.activeElement;
          const dialog = document.querySelector("[role='dialog'][aria-modal='true']");
          return {
            language: document.documentElement.lang,
            reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
            screen: document.querySelector("[data-testid='mode-home']")
              ? "home"
              : document.querySelector("[data-testid='puzzle-library']")
                ? "puzzle-library"
                : document.querySelector("[data-testid='game-screen']")
                  ? "game"
                  : "unknown",
            state: state ? {
              mode: state.mode,
              status: state.status,
              phase: state.phase,
              active: state.active,
              lines: state.lines,
              pieceCount: state.pieceCount,
              puzzleId: state.puzzleId,
              puzzleTargets: state.puzzleTargetCells.length,
              puzzleUndoDepth: state.puzzleUndoHistory.length,
              survivalBedrockRows: state.survivalBedrockRows,
              survivalDebrisCount: state.survivalDebris.length,
              mutationActiveCarrier: state.mutationActiveCarrier?.item ?? null,
              mutationLockedCarriers: state.mutationCarriers.length,
              mutationFreezeTicks: state.mutationFreezeTicks,
              mutationCollapseTicks: state.mutationCollapseTicks,
              mutationMultiplierTicks: state.mutationMultiplierTicks,
            } : null,
            renderer,
            viewport: {
              width: innerWidth,
              height: innerHeight,
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight,
            },
            bounds: {
              board: rect(document.querySelector("[data-testid='board-frame']")),
              side: rect(document.querySelector("[data-testid='side-rail']")),
              next: rect(document.querySelector("[data-testid='next-slot']")),
              dialog: rect(dialog),
            },
            ui: {
              currentMode: document.querySelector("[data-testid='current-mode']")?.textContent?.trim() ?? null,
              countdown: document.querySelector("[data-testid='entry-countdown']")?.getAttribute("data-countdown") ?? null,
              nextAria: document.querySelector("[data-testid='next-slot']")?.getAttribute("aria-label") ?? null,
              nextSegments: [...document.querySelectorAll("[data-testid='puzzle-next-segment']")].map((node) => ({
                segment: node.getAttribute("data-preview-segment"),
                aria: node.getAttribute("aria-label"),
                label: node.querySelector("b")?.textContent?.trim() ?? null,
              })),
              dialogTitle: dialog?.querySelector("h2")?.textContent?.trim() ?? null,
              activeElement: active instanceof HTMLElement ? {
                tag: active.tagName,
                testId: active.dataset.testid ?? null,
                text: active.textContent?.trim() ?? null,
              } : null,
              dialogContainsFocus: Boolean(dialog && active && dialog.contains(active)),
            },
            assertions: {
              canvasCount: document.querySelectorAll("canvas").length,
              domCellCount: document.querySelectorAll("[data-game-cell]").length,
              noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
              noVerticalOverflow: document.documentElement.scrollHeight <= innerHeight,
            },
            lifecycle: window.__T15_LIFECYCLE__.snapshot(),
          };
        }
        """
    )


def validate_snapshot(snapshot: dict[str, Any], mode: str | None) -> None:
    assertions = snapshot["assertions"]
    assert assertions["domCellCount"] == 0
    assert assertions["noHorizontalOverflow"]
    assert assertions["noVerticalOverflow"]
    if mode is None:
        assert snapshot["screen"] == "home"
        assert assertions["canvasCount"] == 0
        return
    assert snapshot["screen"] == "game"
    assert assertions["canvasCount"] == 1
    assert snapshot["state"]["mode"] == mode
    assert snapshot["renderer"]["previewLayerVisible"]
    assert snapshot["bounds"]["board"]["visible"]
    assert snapshot["bounds"]["side"]["visible"]
    assert snapshot["bounds"]["next"]["visible"]
    if mode == "puzzle":
        assert [entry["label"] for entry in snapshot["ui"]["nextSegments"]] == ["1", "2"]
        assert [entry["segment"] for entry in snapshot["ui"]["nextSegments"]] == ["1", "2"]
        assert len(snapshot["renderer"]["previewPieces"]) == 2
    else:
        assert snapshot["ui"]["nextSegments"] == []
        assert snapshot["renderer"]["previewPiece"] is not None


def save_capture(
    page: Page,
    captures: list[dict[str, Any]],
    name: str,
    *,
    purpose: str,
    mode: str | None,
) -> dict[str, Any]:
    before = page_snapshot(page)
    validate_snapshot(before, mode)
    path = ARTIFACT_OUT / name
    page.screenshot(path=str(path), animations="disabled")
    after = page_snapshot(page)
    validate_snapshot(after, mode)
    record = {
        "file": name,
        "sha256": sha256(path),
        "dimensions": png_dimensions(path),
        "purpose": purpose,
        "binding": {"before": before, "after": after},
    }
    captures.append(record)
    return record


def lifecycle_snapshot(page: Page) -> dict[str, Any]:
    settle_two_frames(page)
    return page.evaluate(
        """
        () => ({
          canvasCount: document.querySelectorAll("canvas").length,
          qaPresent: Boolean(window.__SIGNAL_FOUNDRY_QA__),
          lifecycle: window.__T15_LIFECYCLE__.snapshot(),
        })
        """
    )


def assert_home_lifecycle(snapshot: dict[str, Any], baseline: dict[str, Any]) -> None:
    assert snapshot["canvasCount"] == 0
    assert not snapshot["qaPresent"]
    current = snapshot["lifecycle"]
    assert current["globalListenerCount"] == baseline["globalListenerCount"]
    assert current["globalListeners"] == baseline["globalListeners"]
    assert current["pendingAnimationFrames"] == baseline["pendingAnimationFrames"]
    assert current["openAudioContexts"] == baseline["openAudioContexts"]


def dismiss_rule_intro(page: Page) -> bool:
    rules = page.locator("[data-testid='entry-mode-rules']")
    if rules.count() == 0 or not rules.is_visible():
        return False
    dialog = rules.locator("xpath=ancestor::*[@role='dialog']")
    dialog.locator(".primary-action").click()
    return True


def enter_game_mode(
    page: Page,
    test_id: str,
    mode: str,
    *,
    captures: list[dict[str, Any]],
    capture_countdown: bool = False,
) -> dict[str, Any]:
    page.locator(f"[data-testid='{test_id}']").click()
    page.wait_for_timeout(80)
    introduced = dismiss_rule_intro(page)
    page.wait_for_function("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
    countdown_record = None
    if capture_countdown:
        page.wait_for_selector("[data-testid='entry-countdown'][data-countdown='3']")
        countdown_record = save_capture(
            page,
            captures,
            "phase8-classic-countdown.png",
            purpose="board-local input-gated 3 countdown mask",
            mode=mode,
        )
        assert countdown_record["binding"]["before"]["state"]["status"] == "ready"
    page.wait_for_function(
        f"window.__SIGNAL_FOUNDRY_QA__.getState().mode === '{mode}'"
        " && window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=6000,
    )
    return {
        "mode": mode,
        "introduced": introduced,
        "countdownCaptured": countdown_record is not None,
        "mounted": lifecycle_snapshot(page),
    }


def exit_to_home(page: Page, *, from_puzzle: bool) -> dict[str, Any]:
    page.keyboard.press("Escape")
    page.wait_for_selector("[role='dialog'][aria-modal='true']")
    page.keyboard.press("ArrowRight")
    selected = page.locator("[role='dialog'] .action-sheet__actions > button").nth(1)
    assert selected.get_attribute("data-action-selected") == "true"
    page.keyboard.press("Enter")
    expected = "puzzle-library" if from_puzzle else "mode-home"
    page.wait_for_selector(f"[data-testid='{expected}']")
    page.wait_for_function(
        "() => !window.__SIGNAL_FOUNDRY_QA__ && document.querySelectorAll('canvas').length === 0"
    )
    if from_puzzle:
        page.locator(".library-back").click()
        page.wait_for_selector("[data-testid='mode-home']")
    return lifecycle_snapshot(page)


def ensure_mutation_preview(page: Page) -> dict[str, Any]:
    for _ in range(10):
        snapshot = page_snapshot(page)
        if snapshot["renderer"]["previewMutationItem"] is not None:
            return snapshot
        page.evaluate(
            """
            () => {
              const qa = window.__SIGNAL_FOUNDRY_QA__;
              qa.action("hard-drop");
              qa.advanceTicks(16);
            }
            """
        )
        state = runtime_state(page)
        assert state["status"] == "playing", "Mutation preview search topped out."
    raise AssertionError("No Mutation carrier appeared in the bounded deterministic preview search.")


def run_browser(context: BrowserContext) -> dict[str, Any]:
    page = context.new_page()
    errors = attach_error_capture(page)
    captures: list[dict[str, Any]] = []
    transitions: list[dict[str, Any]] = []
    lifecycle: dict[str, Any] = {}
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_selector("[data-testid='mode-home']")
    page.set_viewport_size({"width": 1440, "height": 900})
    baseline = page.evaluate("window.__T15_LIFECYCLE__.snapshot()")
    lifecycle["baseline"] = baseline
    save_capture(
        page,
        captures,
        "phase8-home-desktop.png",
        purpose="Chinese desktop mode home",
        mode=None,
    )

    classic = enter_game_mode(
        page,
        "enter-marathon",
        "marathon",
        captures=captures,
        capture_countdown=True,
    )
    transitions.append(classic)
    save_capture(
        page,
        captures,
        "phase8-classic-desktop.png",
        purpose="Classic Chinese desktop board, HUD and Next",
        mode="marathon",
    )

    before_keyboard = runtime_state(page)
    page.keyboard.press("ArrowLeft")
    page.keyboard.press("ArrowUp")
    after_keyboard = runtime_state(page)
    assert before_keyboard["active"] != after_keyboard["active"]
    page.keyboard.press("Space")
    after_hard_drop = runtime_state(page)
    assert after_hard_drop["pieceCount"] == before_keyboard["pieceCount"] + 1

    for _ in range(4):
        state = runtime_state(page)
        if state["active"]["type"] != "O":
            break
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('hard-drop')")
    before_touch = runtime_state(page)
    assert before_touch["active"]["type"] != "O"
    board = page.locator("[data-testid='board-frame']").bounding_box()
    assert board is not None
    page.touchscreen.tap(board["x"] + board["width"] / 2, board["y"] + board["height"] / 2)
    page.wait_for_timeout(60)
    after_touch = runtime_state(page)
    assert before_touch["active"]["rotation"] != after_touch["active"]["rotation"]

    page.set_viewport_size({"width": 390, "height": 844})
    save_capture(
        page,
        captures,
        "phase8-classic-portrait.png",
        purpose="Classic 390x844 responsive layout",
        mode="marathon",
    )
    page.set_viewport_size({"width": 1440, "height": 900})

    page.keyboard.press("s")
    page.wait_for_selector("[data-testid='settings-sheet']")
    settings_before = page_snapshot(page)
    assert settings_before["ui"]["dialogContainsFocus"]
    save_capture(
        page,
        captures,
        "phase8-settings-zh.png",
        purpose="compact Chinese Settings, rules, keyboard and records",
        mode="marathon",
    )
    focus_before = settings_before["ui"]["activeElement"]
    page.keyboard.press("ArrowUp")
    focus_after = page_snapshot(page)["ui"]["activeElement"]
    assert focus_after != focus_before
    page.locator("[data-testid='language-en']").click()
    page.wait_for_function("document.documentElement.lang === 'en'")
    save_capture(
        page,
        captures,
        "phase8-settings-en.png",
        purpose="complete English Settings adaptation",
        mode="marathon",
    )
    page.locator("[data-testid='language-zh']").click()
    page.wait_for_function("document.documentElement.lang === 'zh-CN'")
    page.locator("[data-testid='action-sheet-backdrop']").click(position={"x": 8, "y": 8})
    page.wait_for_function("() => !document.querySelector('[data-testid=\"settings-sheet\"]')")
    assert runtime_state(page)["status"] == "playing"

    page.keyboard.press("p")
    page.wait_for_function("window.__SIGNAL_FOUNDRY_QA__.getState().status === 'paused'")
    save_capture(
        page,
        captures,
        "phase8-classic-paused.png",
        purpose="keyboard Pause modal and board mask",
        mode="marathon",
    )
    page.keyboard.press("Enter")
    page.wait_for_function("window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'")

    pre_cancel_restart = runtime_state(page)
    page.keyboard.press("r")
    page.wait_for_selector("[data-testid='confirm-restart']")
    save_capture(
        page,
        captures,
        "phase8-restart-confirm.png",
        purpose="restart confirmation with arrow and Enter selection",
        mode="marathon",
    )
    page.keyboard.press("ArrowRight")
    assert page.locator("[role='dialog'] .action-sheet__actions > button").nth(1).get_attribute(
        "data-action-selected"
    ) == "true"
    page.keyboard.press("Enter")
    page.wait_for_function("() => !document.querySelector('[data-testid=\"confirm-restart\"]')")
    assert runtime_state(page)["pieceCount"] == pre_cancel_restart["pieceCount"]
    page.keyboard.press("r")
    page.wait_for_selector("[data-testid='confirm-restart']")
    page.keyboard.press("Enter")
    page.wait_for_function(
        "() => !document.querySelector('[data-testid=\"confirm-restart\"]')"
        " && window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'"
    )
    assert runtime_state(page)["pieceCount"] == 0
    lifecycle["classicUnmount"] = exit_to_home(page, from_puzzle=False)
    assert_home_lifecycle(lifecycle["classicUnmount"], baseline)

    survival = enter_game_mode(
        page,
        "enter-race",
        "race",
        captures=captures,
    )
    transitions.append(survival)
    survival_capture = save_capture(
        page,
        captures,
        "phase8-survival-desktop.png",
        purpose="Survival Chinese desktop with three brown bedrock rows",
        mode="race",
    )
    assert survival_capture["binding"]["before"]["state"]["survivalBedrockRows"] == 3
    lifecycle["survivalUnmount"] = exit_to_home(page, from_puzzle=False)
    assert_home_lifecycle(lifecycle["survivalUnmount"], baseline)

    mutation = enter_game_mode(
        page,
        "enter-sprint",
        "sprint",
        captures=captures,
    )
    transitions.append(mutation)
    mutation_preview = ensure_mutation_preview(page)
    assert mutation_preview["renderer"]["previewMutationItem"] in {
        "freeze",
        "collapse",
        "bomb",
        "multiplier",
    }
    save_capture(
        page,
        captures,
        "phase8-mutation-desktop.png",
        purpose="Mutation Chinese desktop with source-bound carrier Next",
        mode="sprint",
    )
    lifecycle["mutationUnmount"] = exit_to_home(page, from_puzzle=False)
    assert_home_lifecycle(lifecycle["mutationUnmount"], baseline)

    page.locator("[data-testid='enter-puzzle']").click()
    page.wait_for_timeout(80)
    puzzle_introduced = dismiss_rule_intro(page)
    page.wait_for_selector("[data-testid='puzzle-library']")
    page.locator("[data-testid='start-selected-puzzle']").click()
    page.wait_for_function("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().mode === 'puzzle'"
        " && window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=6000,
    )
    transitions.append(
        {
            "mode": "puzzle",
            "introduced": puzzle_introduced,
            "mounted": lifecycle_snapshot(page),
        }
    )
    puzzle_capture = save_capture(
        page,
        captures,
        "phase8-puzzle-desktop.png",
        purpose="Puzzle Chinese desktop with clearly labelled dual Next",
        mode="puzzle",
    )
    assert [entry["aria"].split(" ", 1)[0] for entry in puzzle_capture["binding"]["before"]["ui"]["nextSegments"]] == [
        "1",
        "2",
    ]
    puzzle_before = runtime_state(page)
    page.keyboard.press("Space")
    puzzle_locked = runtime_state(page)
    assert puzzle_locked["pieceCount"] == puzzle_before["pieceCount"] + 1
    assert puzzle_locked["puzzleUndoDepth"] == puzzle_before["puzzleUndoDepth"] + 1
    page.keyboard.press("z")
    page.wait_for_timeout(60)
    puzzle_undone = runtime_state(page)
    assert puzzle_undone["pieceCount"] == puzzle_before["pieceCount"]
    assert puzzle_undone["puzzleUndoDepth"] == puzzle_before["puzzleUndoDepth"]
    assert page.locator("[data-testid='confirm-puzzle-undo']").count() == 0
    page.set_viewport_size({"width": 844, "height": 390})
    save_capture(
        page,
        captures,
        "phase8-puzzle-landscape.png",
        purpose="Puzzle 844x390 responsive dual-Next layout",
        mode="puzzle",
    )
    lifecycle["puzzleUnmount"] = exit_to_home(page, from_puzzle=True)
    assert_home_lifecycle(lifecycle["puzzleUnmount"], baseline)

    page.set_viewport_size({"width": 1440, "height": 900})
    page.emulate_media(reduced_motion="reduce")
    reduced_mutation = enter_game_mode(
        page,
        "enter-sprint",
        "sprint",
        captures=captures,
    )
    transitions.append({**reduced_mutation, "reducedMotion": True})
    reduced_capture = save_capture(
        page,
        captures,
        "phase8-mutation-reduced.png",
        purpose="Mutation reduced-motion endpoint without removed information",
        mode="sprint",
    )
    assert reduced_capture["binding"]["before"]["reducedMotion"]
    lifecycle["reducedMutationUnmount"] = exit_to_home(page, from_puzzle=False)
    assert_home_lifecycle(lifecycle["reducedMutationUnmount"], baseline)
    page.emulate_media(reduced_motion="no-preference")

    assert errors == []
    assert page.locator("canvas").count() == 0
    return {
        "captures": captures,
        "transitions": transitions,
        "inputs": {
            "keyboard": {
                "moveAndRotate": {"before": before_keyboard, "after": after_keyboard},
                "hardDrop": after_hard_drop,
                "settingsShortcut": True,
                "settingsArrowNavigation": {"before": focus_before, "after": focus_after},
                "settingsBackdropResume": True,
                "pauseEnterResume": True,
                "restartArrowCancel": True,
                "restartEnterConfirm": True,
                "escapeArrowEnterExit": True,
                "puzzleDirectUndo": {
                    "before": puzzle_before,
                    "locked": puzzle_locked,
                    "undone": puzzle_undone,
                },
            },
            "touch": {"before": before_touch, "after": after_touch, "tapRotate": True},
        },
        "coverage": {
            "modes": ["marathon", "race", "sprint", "puzzle"],
            "viewports": [
                {"width": 1440, "height": 900},
                {"width": 390, "height": 844},
                {"width": 844, "height": 390},
            ],
            "languages": ["zh-CN", "en"],
            "reducedMotion": True,
            "puzzleDualNext": ["1", "2"],
            "mutationPreviewItem": mutation_preview["renderer"]["previewMutationItem"],
        },
        "lifecycle": lifecycle,
        "errors": errors,
    }


def normalise_log(path: Path) -> None:
    lines = [line.rstrip() for line in path.read_text(encoding="utf-8").splitlines()]
    while lines and not lines[-1]:
        lines.pop()
    path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8", newline="\n")


def assert_clean_publication_target(*, allowed_partial: Path | None = None) -> None:
    allowed = allowed_partial.resolve() if allowed_partial is not None else None
    stale_partials = [
        path
        for path in OUT.glob(".partial-*")
        if allowed is None or path.resolve() != allowed
    ]
    generated = [
        *OUT.glob("phase8-*.png"),
        *OUT.glob("phase8-*.json"),
        *OUT.glob("phase8-*.log"),
        *stale_partials,
        *(path for path in [OUT / "official-client", OUT / "SHA256SUMS.txt"] if path.exists()),
    ]
    assert generated == [], f"Refusing to mix prior evidence: {[path.name for path in generated]}"


def publish(payload: dict[str, Any]) -> None:
    captures = payload["browser"]["captures"]
    names = [capture["file"] for capture in captures]
    assert len(names) == len(set(names))
    assert {path.name for path in ARTIFACT_OUT.glob("phase8-*.png")} == set(names)
    for capture in captures:
        assert sha256(ARTIFACT_OUT / capture["file"]) == capture["sha256"]

    manifest = ARTIFACT_OUT / "phase8-browser-evidence.json"
    manifest.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
        newline="\n",
    )
    checksum_inputs = [
        Path(__file__),
        *(path for path in ARTIFACT_OUT.rglob("*") if path.is_file()),
    ]
    checksum_inputs = sorted(
        (path for path in checksum_inputs if path.name != "SHA256SUMS.txt"),
        key=lambda path: (
            "capture_phase8.py" if path == Path(__file__) else path.relative_to(ARTIFACT_OUT).as_posix()
        ),
    )
    lines: list[str] = []
    for path in checksum_inputs:
        name = path.name if path == Path(__file__) else path.relative_to(ARTIFACT_OUT).as_posix()
        lines.append(f"{sha256(path)}  {name}")
    sums_path = ARTIFACT_OUT / "SHA256SUMS.txt"
    sums_path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    payload["artifactFiles"] = sorted(
        path.relative_to(ARTIFACT_OUT).as_posix()
        for path in ARTIFACT_OUT.rglob("*")
        if path.is_file()
    )
    manifest.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
        newline="\n",
    )
    # Recompute after artifactFiles becomes part of the manifest.
    lines = []
    for path in checksum_inputs:
        name = path.name if path == Path(__file__) else path.relative_to(ARTIFACT_OUT).as_posix()
        lines.append(f"{sha256(path)}  {name}")
    sums_path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")

    assert_clean_publication_target(allowed_partial=ARTIFACT_OUT)
    for path in sorted(ARTIFACT_OUT.iterdir(), key=lambda item: item.name):
        path.replace(OUT / path.name)


def main() -> None:
    global ARTIFACT_OUT
    OUT.mkdir(parents=True, exist_ok=True)
    assert_clean_publication_target()
    ARTIFACT_OUT = Path(tempfile.mkdtemp(prefix=".partial-", dir=OUT))
    try:
        before = candidate_binding()
        phase5 = verify_phase5_evidence()
        puzzles = verify_puzzle_artifacts()
        with managed_vite_server() as server:
            official = run_official_client()
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    headless=True,
                    channel="chrome",
                    args=["--disable-extensions"],
                )
                browser_closed = False
                try:
                    context = browser.new_context(
                        viewport={"width": 1440, "height": 900},
                        device_scale_factor=1,
                        has_touch=True,
                    )
                    try:
                        context.add_init_script(FIXED_SEED_INIT_SCRIPT)
                        context.add_init_script(LIFECYCLE_INIT_SCRIPT)
                        browser_result = run_browser(context)
                    finally:
                        context.close()
                finally:
                    browser.close()
                    browser_closed = True
        for log in [
            "phase8-vite-stdout.log",
            "phase8-vite-stderr.log",
            "official-client-stdout.log",
            "official-client-stderr.log",
        ]:
            normalise_log(ARTIFACT_OUT / log)
        after = candidate_binding()
        assert before == after
        assert server["ready"] and server["released"]
        assert official["browserClosed"] and browser_closed
        assert browser_result["errors"] == []
        payload = {
            "candidate": {"before": before, "after": after},
            "phase5Integrity": phase5,
            "puzzleArtifacts": puzzles,
            "server": server,
            "officialClient": official,
            "browserClosed": browser_closed,
            "browser": browser_result,
        }
        publish(payload)
    finally:
        shutil.rmtree(ARTIFACT_OUT, ignore_errors=True)
        ARTIFACT_OUT = OUT

    print(
        json.dumps(
            {
                "productCandidate": before["productCandidate"],
                "head": before["gitHead"],
                "captures": len(browser_result["captures"]),
                "officialScreenshots": len(official["screenshots"]),
                "modes": browser_result["coverage"]["modes"],
                "puzzleLevels": puzzles["levels"],
                "puzzleRoutes": puzzles["routes"],
                "phase5Captures": phase5["captureCount"],
                "errors": browser_result["errors"],
                "serverReleased": server["released"],
                "browserClosed": browser_closed,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def parse_args() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Capture fail-closed T15 Phase-8 integration evidence with one strict-port "
            "Vite lease and serial official-client/Chrome browser ownership."
        )
    )
    parser.parse_args()


if __name__ == "__main__":
    parse_args()
    main()
