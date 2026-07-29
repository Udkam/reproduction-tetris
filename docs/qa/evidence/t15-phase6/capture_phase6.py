from __future__ import annotations

import argparse
import base64
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
SOURCE_CANDIDATE = "eaed1ac0962ba7256b44136f7bd4f0faef603970"
ROUTE_ARTIFACT = ROOT / "docs/workstreams/tetris-t13-core/puzzle-endgame-results.json"
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
PUBLICATION_FILES = (
    "phase6-browser-evidence.json",
    "SHA256SUMS-browser.txt",
    "phase6-vite-stdout.log",
    "phase6-vite-stderr.log",
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


def png_dimensions(data: bytes) -> dict[str, int]:
    assert data.startswith(b"\x89PNG\r\n\x1a\n")
    return {
        "width": int.from_bytes(data[16:20], "big"),
        "height": int.from_bytes(data[20:24], "big"),
    }


def candidate_binding() -> dict[str, Any]:
    resolved = git("rev-parse", f"{SOURCE_CANDIDATE}^{{commit}}").stdout.strip()
    head = git("rev-parse", "HEAD").stdout.strip()
    script = Path(__file__).resolve()
    relative = script.relative_to(ROOT).as_posix()
    product_status = git("status", "--short", "--", *PRODUCT_PATHS).stdout.splitlines()
    script_status = git("status", "--short", "--", relative).stdout.splitlines()
    product_diff = git("diff", "--quiet", SOURCE_CANDIDATE, "--", *PRODUCT_PATHS, check=False)
    script_head_blob = git("rev-parse", f"HEAD:{relative}").stdout.strip()
    script_worktree_blob = git("hash-object", "--no-filters", relative).stdout.strip()
    assert resolved == SOURCE_CANDIDATE
    assert product_status == []
    assert script_status == []
    assert product_diff.returncode == 0
    assert script_head_blob == script_worktree_blob
    return {
        "sourceCandidate": SOURCE_CANDIDATE,
        "gitHead": head,
        "productTreeMatchesCandidate": True,
        "productPaths": list(PRODUCT_PATHS),
        "productStatus": product_status,
        "routeArtifact": {
            "relativePath": ROUTE_ARTIFACT.relative_to(ROOT).as_posix(),
            "sha256": sha256(ROUTE_ARTIFACT),
        },
        "captureScript": {
            "relativePath": relative,
            "sha256": sha256(script),
            "gitBlob": script_head_blob,
            "status": script_status,
        },
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
    stdout_path = ARTIFACT_OUT / "phase6-vite-stdout.log"
    stderr_path = ARTIFACT_OUT / "phase6-vite-stderr.log"
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


def lifecycle_snapshot(page: Page) -> dict[str, Any]:
    settle_two_frames(page)
    return page.evaluate(
        """
        () => ({
          sameCanvas: window.__phase6Canvas
            ? window.__phase6Canvas === document.querySelector("canvas")
            : null,
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


def runtime_snapshot(page: Page) -> dict[str, Any]:
    return page.evaluate(
        """
        () => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          if (!qa) throw new Error("Runtime QA surface is unavailable.");
          const state = qa.getState();
          const renderer = qa.getRendererSnapshot();
          const next = document.querySelector("[data-testid='next-slot']");
          const rect = (node) => {
            if (!(node instanceof HTMLElement)) return null;
            const box = node.getBoundingClientRect();
            return {x: box.x, y: box.y, width: box.width, height: box.height};
          };
          const nextStyle = next instanceof HTMLElement ? getComputedStyle(next) : null;
          return {
            state: {
              mode: state.mode,
              status: state.status,
              phase: state.phase,
              phaseTicks: state.phaseTicks,
              pendingClearRows: [...state.pendingClearRows],
              lines: state.lines,
              combo: state.combo,
              pieceCount: state.pieceCount,
              puzzleId: state.puzzleId,
              active: state.active,
              next: state.queue.slice(0, state.mode === "puzzle" ? 2 : 1),
            },
            renderer,
            viewport: {
              width: innerWidth,
              height: innerHeight,
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight,
            },
            bounds: {
              board: rect(document.querySelector("[data-testid='board-frame']")),
              next: rect(next),
            },
            assertions: {
              canvasCount: document.querySelectorAll("canvas").length,
              domCellCount: document.querySelectorAll("[data-game-cell]").length,
              noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
              noVerticalOverflow: document.documentElement.scrollHeight <= innerHeight,
              nextVisible: Boolean(
                next
                && nextStyle
                && nextStyle.display !== "none"
                && nextStyle.visibility !== "hidden"
                && next.getBoundingClientRect().width > 0
                && next.getBoundingClientRect().height > 0
              ),
              puzzleNextSegments: document.querySelectorAll("[data-testid='puzzle-next-segment']").length,
            },
            lifecycle: window.__T15_LIFECYCLE__.snapshot(),
          };
        }
        """
    )


def validate_runtime(snapshot: dict[str, Any], *, mode: str) -> None:
    assertions = snapshot["assertions"]
    assert snapshot["state"]["mode"] == mode
    assert assertions["canvasCount"] == 1
    assert assertions["domCellCount"] == 0
    assert assertions["noHorizontalOverflow"]
    assert assertions["noVerticalOverflow"]
    assert assertions["nextVisible"]
    assert snapshot["renderer"]["previewLayerVisible"]
    assert snapshot["renderer"]["previewPiece"] is not None
    if mode == "puzzle":
        assert assertions["puzzleNextSegments"] == 2
        assert len(snapshot["renderer"]["previewPieces"]) == 2


def save_viewport_capture(
    page: Page,
    captures: list[dict[str, Any]],
    name: str,
    *,
    mode: str,
    purpose: str,
) -> dict[str, Any]:
    settle_two_frames(page)
    before = runtime_snapshot(page)
    validate_runtime(before, mode=mode)
    path = ARTIFACT_OUT / name
    page.screenshot(path=str(path), animations="disabled")
    after = runtime_snapshot(page)
    validate_runtime(after, mode=mode)
    data = path.read_bytes()
    record = {
        "file": name,
        "sha256": sha256(path),
        "dimensions": png_dimensions(data),
        "kind": "product-viewport",
        "purpose": purpose,
        "binding": {"before": before, "after": after},
    }
    captures.append(record)
    return record


def save_runtime_board_capture(
    page: Page,
    captures: list[dict[str, Any]],
    name: str,
    *,
    purpose: str,
) -> dict[str, Any]:
    payload = page.evaluate(
        """
        () => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          if (!qa) throw new Error("Runtime QA surface is unavailable.");
          const snap = () => {
            const state = qa.getState();
            const renderer = qa.getRendererSnapshot();
            return {
              state: {
                mode: state.mode,
                status: state.status,
                phase: state.phase,
                phaseTicks: state.phaseTicks,
                pendingClearRows: [...state.pendingClearRows],
                lines: state.lines,
                combo: state.combo,
                pieceCount: state.pieceCount,
                puzzleId: state.puzzleId,
                active: state.active,
                next: state.queue.slice(0, state.mode === "puzzle" ? 2 : 1),
              },
              renderer,
              canvasCount: document.querySelectorAll("canvas").length,
              domCellCount: document.querySelectorAll("[data-game-cell]").length,
            };
          };
          const before = snap();
          const extracted = qa.captureBoardPng();
          const after = snap();
          return {before, after, extracted};
        }
        """
    )
    extracted = payload.pop("extracted")
    data_url = extracted.pop("dataUrl")
    assert data_url.startswith("data:image/png;base64,")
    data = base64.b64decode(data_url.split(",", 1)[1], validate=True)
    dimensions = png_dimensions(data)
    assert dimensions == extracted["outputPixels"]
    assert extracted["pixelProbe"]["nonTransparentSamples"] >= 16
    assert extracted["pixelProbe"]["distinctBuckets"] >= 4
    assert payload["before"]["canvasCount"] == payload["after"]["canvasCount"] == 1
    assert payload["before"]["domCellCount"] == payload["after"]["domCellCount"] == 0
    path = ARTIFACT_OUT / name
    path.write_bytes(data)
    record = {
        "file": name,
        "sha256": sha256(path),
        "dimensions": dimensions,
        "kind": "runtime-pixi-extract",
        "purpose": purpose,
        "binding": payload,
        "extract": extracted,
    }
    captures.append(record)
    return record


def start_mode_from_home(page: Page, test_id: str, *, direct_start: bool) -> dict[str, Any]:
    page.locator(f"[data-testid='{test_id}']").click()
    page.wait_for_timeout(80)
    intro_start = page.locator("[role='dialog'] .primary-action")
    if intro_start.count() == 1 and intro_start.is_visible():
        intro_start.click()
    page.wait_for_function("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
    if direct_start:
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.start()")
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=6000,
    )
    mounted = lifecycle_snapshot(page)
    assert mounted["canvasCount"] == 1
    return mounted


def exit_game(page: Page, expected_test_id: str) -> dict[str, Any]:
    page.locator("[data-testid='exit-game']").click()
    page.locator("[role='dialog'] .secondary-action").click()
    page.wait_for_selector(f"[data-testid='{expected_test_id}']")
    page.wait_for_function(
        "() => !window.__SIGNAL_FOUNDRY_QA__ && document.querySelectorAll('canvas').length === 0"
    )
    return lifecycle_snapshot(page)


def audit_public_routes(page: Page, levels: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return page.evaluate(
        """
        async (levels) => {
          const {createInitialState, dispatch} = await import("/src/game/core/index.ts");
          const decode = (token) => {
            if (token === "S") return {type: "start"};
            if (token === "T") return {type: "tick"};
            if (token === "L") return {type: "move", dx: -1};
            if (token === "R") return {type: "move", dx: 1};
            if (token === "H") return {type: "hard-drop"};
            return {type: "rotate", direction: 1};
          };
          const witnesses = [];
          for (const level of levels) {
            for (const route of level.routes) {
              let state = createInitialState(0x51a1f00d, "puzzle", level.id);
              for (let index = 0; index < route.commandStream.length; index += 1) {
                const transition = dispatch(state, decode(route.commandStream[index]));
                const started = transition.events.find((event) => event.type === "clear-started");
                if (started) {
                  witnesses.push({
                    level: level.id,
                    route: route.id,
                    count: started.rows.length,
                    commandIndex: index,
                    prefix: route.commandStream.slice(0, index + 1),
                  });
                }
                state = transition.state;
              }
            }
          }
          return [1, 2, 3, 4].map((count) => {
            const matches = witnesses
              .filter((witness) => witness.count === count)
              .sort((left, right) => left.prefix.length - right.prefix.length);
            return matches[0] || {count, missing: true};
          });
        }
        """,
        levels,
    )


def prepare_runtime_puzzle(page: Page, witness: dict[str, Any]) -> None:
    page.evaluate(
        """
        (witness) => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          qa.restart();
          qa.selectPuzzle(witness.level);
          qa.start();
        }
        """,
        witness,
    )
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'"
    )


def replay_runtime_prefix(page: Page, witness: dict[str, Any]) -> dict[str, Any]:
    prepare_runtime_puzzle(page, witness)
    result = page.evaluate(
        """
        (prefix) => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          for (const token of prefix.slice(1)) {
            if (token === "T") qa.advanceTicks(1);
            else if (token === "L") qa.action("left");
            else if (token === "R") qa.action("right");
            else if (token === "H") qa.action("hard-drop");
            else qa.action("rotate-cw");
          }
          const state = qa.getState();
          return {
            mode: state.mode,
            status: state.status,
            phase: state.phase,
            phaseTicks: state.phaseTicks,
            pendingClearRows: [...state.pendingClearRows],
            puzzleId: state.puzzleId,
          };
        }
        """,
        witness["prefix"],
    )
    assert result["mode"] == "puzzle"
    assert result["phase"] == "line-clear"
    assert len(result["pendingClearRows"]) == witness["count"]
    assert result["puzzleId"] == witness["level"]
    return result


def advance_to_safe_next(page: Page) -> dict[str, Any]:
    for _ in range(24):
        state = page.evaluate(
            """
            () => {
              const qa = window.__SIGNAL_FOUNDRY_QA__;
              qa.advanceTicks(1);
              const state = qa.getState();
              return {
                status: state.status,
                phase: state.phase,
                active: state.active,
                pendingClearRows: [...state.pendingClearRows],
              };
            }
            """
        )
        if state["status"] == "playing" and state["phase"] != "line-clear" and state["active"]:
            return state
    raise AssertionError("The next active piece did not appear after the ordinary clear.")


def save_isolated_renderer_capture(
    page: Page,
    captures: list[dict[str, Any]],
    name: str,
    *,
    scenario: str,
    reduced_motion: bool = False,
) -> dict[str, Any]:
    assert page.locator("canvas").count() == 0
    payload = page.evaluate(
        """
        async ({scenario, reducedMotion}) => {
          const {createInitialState} = await import("/src/game/core/index.ts");
          const {TetrisRenderer} = await import("/src/game/render/TetrisRenderer.ts");
          const host = document.createElement("div");
          host.dataset.phase6Isolated = scenario;
          Object.assign(host.style, {
            position: "fixed",
            inset: "0",
            width: "900px",
            height: "900px",
            zIndex: "99999",
            background: "#dce7f1",
          });
          document.body.append(host);
          const renderer = new TetrisRenderer();
          await renderer.init(host);
          renderer.setOptions({reducedMotion});

          const base = createInitialState(0x61c6, "marathon");
          const board = base.board.map((row) => [...row]);
          const bottom = board.length - 1;
          const fillRow = (row, offset = 0) => {
            const pieces = ["I", "O", "T", "S", "Z", "J", "L"];
            for (let x = 0; x < board[row].length; x += 1) {
              board[row][x] = pieces[(x + offset) % pieces.length];
            }
          };
          let state = {
            ...base,
            board,
            status: "playing",
            phase: "active",
            phaseTicks: 0,
            pendingClearRows: [],
            active: null,
            queue: [],
            combo: 0,
            lines: 0,
          };
          let events = [];

          if (scenario === "clear-four" || scenario === "clear-reduced") {
            const count = scenario === "clear-four" ? 4 : 1;
            const rows = [];
            for (let index = 0; index < count; index += 1) {
              const row = bottom - index;
              fillRow(row, index);
              rows.push(row);
            }
            state = {...state, board, phase: "line-clear", phaseTicks: 0, pendingClearRows: rows};
            events = [{type: "clear-started", rows}];
            renderer.render(state, events, 0);
            state = {...state, phaseTicks: 5};
            renderer.render(state, [], 84);
          } else if (scenario === "combo-speed" || scenario === "combo-speed-reduced") {
            for (let x = 1; x < board[bottom].length - 1; x += 1) {
              board[bottom][x] = x % 2 ? "J" : "L";
            }
            state = {...state, board, lines: 10, combo: 3};
            events = [{type: "lines-cleared", rows: [bottom], count: 1, score: 300}];
            renderer.render(state, events, 0);
            renderer.render(state, [], reducedMotion ? 20 : 56);
          } else if (scenario === "top-out") {
            for (let x = 3; x <= 6; x += 1) board[20][x] = "Z";
            state = {...state, board, status: "game-over"};
            events = [{type: "game-over", reason: "block-out"}];
            renderer.render(state, events, 0);
            renderer.render(state, [], 42);
          } else {
            throw new Error(`Unknown isolated scenario: ${scenario}`);
          }

          const before = renderer.getSnapshot();
          const extracted = renderer.captureBoardPng();
          const after = renderer.getSnapshot();
          const canvasCountDuring = document.querySelectorAll("canvas").length;
          renderer.destroy();
          host.remove();
          const canvasCountAfter = document.querySelectorAll("canvas").length;
          return {
            scenario,
            reducedMotion,
            state: {
              status: state.status,
              phase: state.phase,
              phaseTicks: state.phaseTicks,
              pendingClearRows: [...state.pendingClearRows],
              lines: state.lines,
              combo: state.combo,
            },
            events,
            before,
            after,
            canvasCountDuring,
            canvasCountAfter,
            extracted,
          };
        }
        """,
        {"scenario": scenario, "reducedMotion": reduced_motion},
    )
    extracted = payload.pop("extracted")
    data_url = extracted.pop("dataUrl")
    data = base64.b64decode(data_url.split(",", 1)[1], validate=True)
    dimensions = png_dimensions(data)
    assert dimensions == extracted["outputPixels"]
    assert payload["canvasCountDuring"] == 1
    assert payload["canvasCountAfter"] == 0
    assert payload["before"]["previewPiece"] is None
    assert payload["before"]["previewPieces"] == []
    assert extracted["pixelProbe"]["nonTransparentSamples"] >= 16
    assert extracted["pixelProbe"]["distinctBuckets"] >= 4
    path = ARTIFACT_OUT / name
    path.write_bytes(data)
    record = {
        "file": name,
        "sha256": sha256(path),
        "dimensions": dimensions,
        "kind": "isolated-real-renderer-contract",
        "purpose": scenario,
        "binding": payload,
        "extract": extracted,
    }
    captures.append(record)
    return record


def run(context: BrowserContext) -> dict[str, Any]:
    page = context.new_page()
    errors = attach_error_capture(page)
    captures: list[dict[str, Any]] = []
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_selector("[data-testid='mode-home']")
    settle_two_frames(page)
    baseline = page.evaluate("window.__T15_LIFECYCLE__.snapshot()")

    route_data = json.loads(ROUTE_ARTIFACT.read_text(encoding="utf-8"))
    route_matrix = audit_public_routes(page, route_data["levels"])
    assert [entry["count"] for entry in route_matrix] == [1, 2, 3, 4]
    assert all(not route_matrix[index].get("missing") for index in range(3))
    assert route_matrix[3].get("missing") is True

    first_mount = start_mode_from_home(page, "enter-marathon", direct_start=False)
    page.evaluate("window.__phase6Canvas = document.querySelector('canvas')")
    page.set_viewport_size({"width": 1440, "height": 900})
    save_viewport_capture(
        page,
        captures,
        "phase6-classic-desktop.png",
        mode="marathon",
        purpose="desktop HUD, board and Next",
    )
    page.set_viewport_size({"width": 390, "height": 844})
    save_viewport_capture(
        page,
        captures,
        "phase6-classic-portrait.png",
        mode="marathon",
        purpose="portrait responsive layout",
    )
    page.set_viewport_size({"width": 844, "height": 390})
    save_viewport_capture(
        page,
        captures,
        "phase6-classic-landscape.png",
        mode="marathon",
        purpose="short landscape responsive layout",
    )
    page.set_viewport_size({"width": 1440, "height": 900})

    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('hard-drop')")
    landing = save_runtime_board_capture(
        page,
        captures,
        "phase6-classic-landing.png",
        purpose="public-runtime ordinary landing cue",
    )
    landing_cues = landing["binding"]["before"]["renderer"]["classicFeedback"]
    assert [cue["kind"] for cue in landing_cues] == ["landing"]

    before_restart = lifecycle_snapshot(page)
    page.locator("[data-testid='open-settings']").click()
    page.locator("[data-testid='settings-restart']").click()
    page.locator("[data-testid='confirm-restart']").click()
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=6000,
    )
    after_restart = lifecycle_snapshot(page)
    assert before_restart["canvasCount"] == after_restart["canvasCount"] == 1
    assert after_restart["sameCanvas"]
    assert before_restart["lifecycle"]["globalListenerCount"] == after_restart["lifecycle"]["globalListenerCount"]
    assert before_restart["lifecycle"]["globalListeners"] == after_restart["lifecycle"]["globalListeners"]
    assert before_restart["lifecycle"]["openAudioContexts"] == after_restart["lifecycle"]["openAudioContexts"]

    first_unmount = exit_game(page, "mode-home")
    assert_home_lifecycle(first_unmount, baseline)

    second_mount = start_mode_from_home(page, "enter-marathon", direct_start=True)
    assert second_mount["canvasCount"] == first_mount["canvasCount"] == 1
    assert second_mount["lifecycle"]["globalListenerCount"] == first_mount["lifecycle"]["globalListenerCount"]
    assert second_mount["lifecycle"]["globalListeners"] == first_mount["lifecycle"]["globalListeners"]
    second_unmount = exit_game(page, "mode-home")
    assert_home_lifecycle(second_unmount, baseline)

    page.locator("[data-testid='enter-puzzle']").click()
    page.wait_for_timeout(80)
    intro_start = page.locator("[role='dialog'] .primary-action")
    if intro_start.count() == 1 and intro_start.is_visible():
        intro_start.click()
    page.wait_for_selector("[data-testid='puzzle-library']")
    first_witness = route_matrix[0]
    page.locator(f"[data-level-id='{first_witness['level']}']").click()
    page.locator("[data-testid='start-selected-puzzle']").click()
    page.wait_for_function("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
    page.evaluate(
        """
        () => {
          window.__SIGNAL_FOUNDRY_QA__.setFrozen(true);
          window.__SIGNAL_FOUNDRY_QA__.start();
        }
        """
    )
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'"
    )

    replay_runtime_prefix(page, first_witness)
    confirmation = save_runtime_board_capture(
        page,
        captures,
        "phase6-clear-1-confirmation.png",
        purpose="one-row public-route confirmation frame",
    )
    assert confirmation["binding"]["before"]["state"]["phaseTicks"] == 0
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(5)")
    contraction = save_runtime_board_capture(
        page,
        captures,
        "phase6-clear-1-contraction.png",
        purpose="one-row public-route contraction frame",
    )
    assert contraction["binding"]["before"]["state"]["phaseTicks"] == 5
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(4)")
    afterglow = save_runtime_board_capture(
        page,
        captures,
        "phase6-clear-1-afterglow.png",
        purpose="one-row public-route afterglow frame",
    )
    assert afterglow["binding"]["before"]["state"]["phaseTicks"] == 9
    safe_next = advance_to_safe_next(page)
    assert safe_next["active"] is not None
    save_viewport_capture(
        page,
        captures,
        "phase6-clear-safe-next.png",
        mode="puzzle",
        purpose="next active piece after ordinary-clear resolution",
    )

    for witness in route_matrix[1:3]:
        replay_runtime_prefix(page, witness)
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(5)")
        capture = save_runtime_board_capture(
            page,
            captures,
            f"phase6-clear-{witness['count']}-matrix.png",
            purpose=f"{witness['count']}-row public-route contraction matrix",
        )
        state = capture["binding"]["before"]["state"]
        assert state["phaseTicks"] == 5
        assert len(state["pendingClearRows"]) == witness["count"]

    puzzle_unmount = exit_game(page, "puzzle-library")
    page.locator(".library-back").click()
    page.wait_for_selector("[data-testid='mode-home']")
    settle_two_frames(page)
    home_after_puzzle = page.evaluate(
        """
        () => ({
          canvasCount: document.querySelectorAll("canvas").length,
          qaPresent: Boolean(window.__SIGNAL_FOUNDRY_QA__),
          lifecycle: window.__T15_LIFECYCLE__.snapshot(),
        })
        """
    )
    assert puzzle_unmount["canvasCount"] == 0
    assert_home_lifecycle(home_after_puzzle, baseline)

    four = save_isolated_renderer_capture(
        page,
        captures,
        "phase6-clear-4-renderer-contract.png",
        scenario="clear-four",
    )
    assert len(four["binding"]["state"]["pendingClearRows"]) == 4
    reduced_clear = save_isolated_renderer_capture(
        page,
        captures,
        "phase6-clear-reduced-motion.png",
        scenario="clear-reduced",
        reduced_motion=True,
    )
    assert reduced_clear["binding"]["reducedMotion"]
    combo_speed = save_isolated_renderer_capture(
        page,
        captures,
        "phase6-classic-combo-speed.png",
        scenario="combo-speed",
    )
    assert {cue["kind"] for cue in combo_speed["binding"]["before"]["classicFeedback"]} == {"combo", "speed-up"}
    top_out = save_isolated_renderer_capture(
        page,
        captures,
        "phase6-classic-top-out.png",
        scenario="top-out",
    )
    assert [cue["kind"] for cue in top_out["binding"]["before"]["classicFeedback"]] == ["top-out"]
    reduced_feedback = save_isolated_renderer_capture(
        page,
        captures,
        "phase6-classic-feedback-reduced.png",
        scenario="combo-speed-reduced",
        reduced_motion=True,
    )
    assert reduced_feedback["binding"]["reducedMotion"]
    assert {cue["kind"] for cue in reduced_feedback["binding"]["before"]["classicFeedback"]} == {"combo", "speed-up"}

    assert page.locator("canvas").count() == 0
    assert errors == []
    return {
        "routeMatrix": route_matrix,
        "captures": captures,
        "coverage": {
            "ordinaryClear": {
                "runtimeRows": [1, 2, 3],
                "isolatedRendererRows": [4],
                "fourRowRuntimeRouteAbsent": True,
                "oneRowStages": ["confirmation", "contraction", "afterglow"],
                "safeNextFrame": True,
                "reducedMotion": True,
            },
            "classicFeedback": {
                "runtime": ["landing"],
                "isolatedRenderer": ["combo", "speed-up", "top-out"],
                "reducedMotion": ["combo", "speed-up"],
            },
            "responsiveViewports": [
                {"width": 1440, "height": 900},
                {"width": 390, "height": 844},
                {"width": 844, "height": 390},
            ],
        },
        "lifecycle": {
            "baseline": baseline,
            "firstMount": first_mount,
            "beforeRestart": before_restart,
            "afterRestart": after_restart,
            "firstUnmount": first_unmount,
            "secondMount": second_mount,
            "secondUnmount": second_unmount,
            "puzzleUnmount": puzzle_unmount,
            "homeAfterPuzzle": home_after_puzzle,
        },
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
        *OUT.glob("phase6-*.png"),
        *stale_partials,
        *(OUT / name for name in PUBLICATION_FILES if (OUT / name).exists()),
    ]
    assert generated == [], f"Refusing to mix prior evidence: {[path.name for path in generated]}"


def write_and_publish_manifest(payload: dict[str, Any]) -> None:
    captures = payload["result"]["captures"]
    capture_names = [capture["file"] for capture in captures]
    assert len(capture_names) == len(set(capture_names))
    assert {path.name for path in ARTIFACT_OUT.glob("*.png")} == set(capture_names)
    for capture in captures:
        assert sha256(ARTIFACT_OUT / capture["file"]) == capture["sha256"]

    manifest = ARTIFACT_OUT / "phase6-browser-evidence.json"
    payload["artifactFiles"] = sorted(
        {
            Path(__file__).name,
            *capture_names,
            "phase6-vite-stdout.log",
            "phase6-vite-stderr.log",
            manifest.name,
            "SHA256SUMS-browser.txt",
        }
    )
    manifest.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
        newline="\n",
    )
    checksum_inputs = sorted(
        [
            Path(__file__),
            manifest,
            *(ARTIFACT_OUT / name for name in capture_names),
            ARTIFACT_OUT / "phase6-vite-stdout.log",
            ARTIFACT_OUT / "phase6-vite-stderr.log",
        ],
        key=lambda path: path.name,
    )
    sums = "\n".join(f"{sha256(path)}  {path.name}" for path in checksum_inputs) + "\n"
    sums_path = ARTIFACT_OUT / "SHA256SUMS-browser.txt"
    sums_path.write_text(sums, encoding="utf-8", newline="\n")

    expected = {
        *capture_names,
        "phase6-vite-stdout.log",
        "phase6-vite-stderr.log",
        manifest.name,
        sums_path.name,
    }
    assert {path.name for path in ARTIFACT_OUT.iterdir() if path.is_file()} == expected
    assert_clean_publication_target(allowed_partial=ARTIFACT_OUT)
    publication_order = [
        *sorted(capture_names),
        "phase6-vite-stderr.log",
        "phase6-vite-stdout.log",
        manifest.name,
        sums_path.name,
    ]
    assert publication_order[-1] == "SHA256SUMS-browser.txt"
    published: list[Path] = []
    try:
        for name in publication_order:
            destination = OUT / name
            (ARTIFACT_OUT / name).replace(destination)
            published.append(destination)
    except BaseException:
        for destination in reversed(published):
            if destination.exists():
                destination.replace(ARTIFACT_OUT / destination.name)
        raise


def main() -> None:
    global ARTIFACT_OUT
    OUT.mkdir(parents=True, exist_ok=True)
    assert_clean_publication_target()
    ARTIFACT_OUT = Path(tempfile.mkdtemp(prefix=".partial-", dir=OUT))
    try:
        before = candidate_binding()
        with managed_vite_server() as server:
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
                    )
                    try:
                        context.add_init_script(FIXED_SEED_INIT_SCRIPT)
                        context.add_init_script(LIFECYCLE_INIT_SCRIPT)
                        result = run(context)
                    finally:
                        context.close()
                finally:
                    browser.close()
                    browser_closed = True
        normalise_log(ARTIFACT_OUT / "phase6-vite-stdout.log")
        normalise_log(ARTIFACT_OUT / "phase6-vite-stderr.log")
        after = candidate_binding()
        assert before == after
        assert server["ready"] and server["released"]
        assert browser_closed
        assert result["errors"] == []
        payload = {
            "candidate": {"before": before, "after": after},
            "server": server,
            "browserClosed": browser_closed,
            "result": result,
        }
        write_and_publish_manifest(payload)
    finally:
        shutil.rmtree(ARTIFACT_OUT, ignore_errors=True)
        ARTIFACT_OUT = OUT

    print(
        json.dumps(
            {
                "candidate": before["sourceCandidate"],
                "captures": len(result["captures"]),
                "coverage": result["coverage"],
                "lifecycle": result["lifecycle"],
                "errors": result["errors"],
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
            "Capture source-bound T15 Phase-6 Classic/ordinary-clear evidence. "
            "The run owns one strict-port Vite/Chrome lifecycle and accepts no options."
        )
    )
    parser.parse_args()


if __name__ == "__main__":
    parse_args()
    main()
