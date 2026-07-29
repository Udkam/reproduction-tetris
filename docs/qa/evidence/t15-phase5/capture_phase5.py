from __future__ import annotations

import argparse
import base64
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import shutil
import statistics
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
SOURCE_CANDIDATE = "ee2aac542529c116c915c38e0603584a7099b5e8"
FIXED_RUN_SEED = 0x7115
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

FIXED_SEED_INIT_SCRIPT = f"""
Object.defineProperty(window.crypto, "getRandomValues", {{
  configurable: true,
  value: (values) => {{
    for (let index = 0; index < values.length; index += 1) values[index] = {FIXED_RUN_SEED};
    return values;
  }},
}});
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
    handle = originalRequestAnimationFrame((time) => {
      pendingAnimationFrames.delete(handle);
      callback(time);
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
      const listenerCounts = {};
      for (const key of activeGlobalListeners) {
        const [target, type] = key.split(":");
        const label = `${target}:${type}`;
        listenerCounts[label] = (listenerCounts[label] || 0) + 1;
      }
      return {
        globalListenerCount: activeGlobalListeners.size,
        globalListeners: Object.fromEntries(Object.entries(listenerCounts).sort()),
        pendingAnimationFrames: pendingAnimationFrames.size,
        audioContextsCreated,
        audioContextsClosed,
        openAudioContexts: audioContextsCreated - audioContextsClosed,
      };
    },
  };
})();
"""

AUTOPLAYER_SCRIPT = r"""
(() => {
  const shapes = {
    I: [
      [[0,1],[1,1],[2,1],[3,1]],
      [[2,0],[2,1],[2,2],[2,3]],
      [[0,2],[1,2],[2,2],[3,2]],
      [[1,0],[1,1],[1,2],[1,3]],
    ],
    O: [
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[1,0],[0,1],[1,1]],
    ],
    T: [
      [[1,0],[0,1],[1,1],[2,1]],
      [[1,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[2,1],[1,2]],
      [[1,0],[0,1],[1,1],[1,2]],
    ],
    S: [
      [[1,0],[2,0],[0,1],[1,1]],
      [[1,0],[1,1],[2,1],[2,2]],
      [[1,1],[2,1],[0,2],[1,2]],
      [[0,0],[0,1],[1,1],[1,2]],
    ],
    Z: [
      [[0,0],[1,0],[1,1],[2,1]],
      [[2,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[1,2],[2,2]],
      [[1,0],[0,1],[1,1],[0,2]],
    ],
    J: [
      [[0,0],[0,1],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[1,2]],
      [[0,1],[1,1],[2,1],[2,2]],
      [[1,0],[1,1],[0,2],[1,2]],
    ],
    L: [
      [[2,0],[0,1],[1,1],[2,1]],
      [[1,0],[1,1],[1,2],[2,2]],
      [[0,1],[1,1],[2,1],[0,2]],
      [[0,0],[1,0],[1,1],[1,2]],
    ],
  };

  const cloneBoard = (board) => board.map((row) => [...row]);
  const canPlace = (board, cells, x, y) => cells.every(([dx, dy]) => {
    const px = x + dx;
    const py = y + dy;
    return px >= 0 && px < board[0].length && py >= 0 && py < board.length && board[py][px] === null;
  });
  const evaluateBoard = (board, completedLines) => {
    const width = board[0].length;
    const height = board.length;
    const heights = [];
    let holes = 0;
    for (let x = 0; x < width; x += 1) {
      let top = height;
      for (let y = 0; y < height; y += 1) {
        if (board[y][x] !== null) {
          top = y;
          break;
        }
      }
      heights.push(height - top);
      for (let y = top; y < height; y += 1) {
        if (board[y][x] === null) holes += 1;
      }
    }
    const aggregate = heights.reduce((sum, value) => sum + value, 0);
    const maximum = Math.max(...heights);
    const bumpiness = heights.slice(1).reduce((sum, value, index) => sum + Math.abs(value - heights[index]), 0);
    const wells = heights.reduce((sum, value, index) => {
      const left = index === 0 ? height : heights[index - 1];
      const right = index === width - 1 ? height : heights[index + 1];
      return sum + Math.max(0, Math.min(left, right) - value);
    }, 0);
    const danger = Math.max(0, maximum - 16);
    return aggregate * 0.55 + holes * 8 + bumpiness * 0.42 + wells * 0.12
      + maximum * 0.9 + danger * danger * 6 - completedLines * 12;
  };
  const candidateFor = (state, rotation, x) => {
    const board = cloneBoard(state.board);
    const cells = shapes[state.active.type][rotation];
    let y = state.active.y;
    if (!canPlace(board, cells, x, y)) return null;
    while (canPlace(board, cells, x, y + 1)) y += 1;
    for (const [dx, dy] of cells) board[y + dy][x + dx] = state.active.type;
    const kept = board.filter((row) => row.some((cell) => cell === null));
    const cleared = board.length - kept.length;
    while (kept.length < board.length) kept.unshift(Array(board[0].length).fill(null));
    return { rotation, x, y, score: evaluateBoard(kept, cleared), cleared };
  };

  window.__T15_AUTOPLAY_STEP__ = () => {
    const qa = window.__SIGNAL_FOUNDRY_QA__;
    let state = qa.getState();
    if (state.status !== "playing") return { stopped: state.status };
    for (let tick = 0; tick < 20 && state.active === null; tick += 1) {
      qa.advanceTicks(1);
      state = qa.getState();
    }
    if (!state.active) return { stopped: state.status, phase: state.phase };

    const options = [];
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const cells = shapes[state.active.type][rotation];
      const minX = Math.min(...cells.map(([x]) => x));
      const maxX = Math.max(...cells.map(([x]) => x));
      for (let x = -minX; x < state.board[0].length - maxX; x += 1) {
        const option = candidateFor(state, rotation, x);
        if (option) options.push(option);
      }
    }
    options.sort((left, right) => left.score - right.score || right.cleared - left.cleared || left.x - right.x || left.rotation - right.rotation);
    const best = options[0];
    if (!best) return { stopped: "no-placement" };

    for (let rotation = 0; rotation < best.rotation; rotation += 1) qa.action("rotate-cw");
    state = qa.getState();
    const direction = best.x < state.active.x ? "left" : "right";
    for (let step = 0; step < Math.abs(best.x - state.active.x); step += 1) qa.action(direction);
    qa.action("hard-drop");

    state = qa.getState();
    for (let tick = 0; tick < 20 && state.active === null && state.status === "playing"; tick += 1) {
      qa.advanceTicks(1);
      state = qa.getState();
    }
    return {
      plan: best,
      status: state.status,
      phase: state.phase,
      pieceCount: state.pieceCount,
      lines: state.lines,
      lastItem: state.mutationLastItem,
      lastItemTicks: state.mutationLastItemTicks,
      timers: [state.mutationFreezeTicks, state.mutationCollapseTicks, state.mutationMultiplierTicks],
    };
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


def candidate_binding() -> dict[str, Any]:
    resolved = git("rev-parse", f"{SOURCE_CANDIDATE}^{{commit}}").stdout.strip()
    head = git("rev-parse", "HEAD").stdout.strip()
    script_path = Path(__file__).resolve()
    script_relative = script_path.relative_to(ROOT).as_posix()
    product_status = git("status", "--short", "--", *PRODUCT_PATHS).stdout.splitlines()
    script_status = git("status", "--short", "--", script_relative).stdout.splitlines()
    product_diff = git("diff", "--quiet", SOURCE_CANDIDATE, "--", *PRODUCT_PATHS, check=False)
    script_head_blob = git("rev-parse", f"HEAD:{script_relative}").stdout.strip()
    script_worktree_blob = git(
        "hash-object",
        "--no-filters",
        script_relative,
    ).stdout.strip()
    assert resolved == SOURCE_CANDIDATE
    assert product_status == []
    assert script_status == []
    assert product_diff.returncode == 0
    assert script_worktree_blob == script_head_blob
    return {
        "sourceCandidate": SOURCE_CANDIDATE,
        "gitHead": head,
        "productTreeMatchesCandidate": True,
        "productStatus": product_status,
        "productPaths": list(PRODUCT_PATHS),
        "captureScript": {
            "file": script_path.name,
            "relativePath": script_relative,
            "sha256": sha256(script_path),
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
    stdout_path = ARTIFACT_OUT / "vite-stdout.log"
    stderr_path = ARTIFACT_OUT / "vite-stderr.log"
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
        "kind": "candidate-source DEV-QA",
        "command": command,
        "cwd": str(ROOT),
        "pid": process.pid,
        "listenerPid": None,
        "ready": False,
        "released": False,
        "stdout": stdout_path.name,
        "stderr": stderr_path.name,
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


def start_mutation_from_home(page: Page) -> dict[str, Any]:
    page.locator("[data-testid='enter-sprint']").click()
    page.wait_for_timeout(100)
    intro_start = page.locator("[role='dialog'] .primary-action")
    if intro_start.count() == 1 and intro_start.is_visible():
        intro_start.click()
    page.wait_for_function("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=6000,
    )
    mounted = page.evaluate(
        """
        () => ({
          canvasCount: document.querySelectorAll("canvas").length,
          lifecycle: window.__T15_LIFECYCLE__.snapshot(),
        })
        """
    )
    assert mounted["canvasCount"] == 1
    return mounted


def exit_mutation_to_home(page: Page) -> dict[str, Any]:
    page.locator("[data-testid='exit-game']").click()
    page.locator("[role='dialog'] .secondary-action").click()
    page.wait_for_selector("[data-testid='mode-home']")
    page.wait_for_function(
        "() => !window.__SIGNAL_FOUNDRY_QA__ && document.querySelectorAll('canvas').length === 0"
    )
    page.wait_for_timeout(100)
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
    lifecycle = snapshot["lifecycle"]
    assert lifecycle["globalListenerCount"] == baseline["globalListenerCount"]
    assert lifecycle["globalListeners"] == baseline["globalListeners"]
    assert lifecycle["pendingAnimationFrames"] == baseline["pendingAnimationFrames"]
    assert lifecycle["openAudioContexts"] == baseline["openAudioContexts"]


def enter_mutation(page: Page) -> tuple[dict[str, Any], dict[str, Any]]:
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(100)
    lifecycle_baseline = page.evaluate("window.__T15_LIFECYCLE__.snapshot()")
    page.add_style_tag(
        content="""
          html[data-t15-grayscale="true"] #game {
            filter: grayscale(1) !important;
          }
        """
    )
    mounted = start_mutation_from_home(page)
    page.evaluate(AUTOPLAYER_SCRIPT)
    return lifecycle_baseline, mounted


def rect_script(selector: str) -> str:
    return f"""
      (() => {{
        const node = document.querySelector({json.dumps(selector)});
        if (!node) return null;
        const box = node.getBoundingClientRect();
        return {{left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height}};
      }})()
    """


def collect(page: Page) -> dict[str, Any]:
    return page.evaluate(
        r"""
        () => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          const state = qa.getState();
          const renderer = qa.getRendererSnapshot();
          const rect = (selector) => {
            const node = document.querySelector(selector);
            if (!node) return null;
            const box = node.getBoundingClientRect();
            return {left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height};
          };
          const splitTracks = (value) => value === "none" ? [] : value.trim().split(/\s+/);
          const statusRows = [...document.querySelectorAll(".mutation-status__effect")];
          const buttons = [...document.querySelectorAll("button")].map((node) => node.getBoundingClientRect());
          const timedItems = [
            ["freeze", state.mutationFreezeTicks],
            ["collapse", state.mutationCollapseTicks],
            ["multiplier", state.mutationMultiplierTicks],
          ].filter(([, ticks]) => ticks > 0).map(([item]) => item);
          const rail = document.querySelector("[data-testid='side-rail']");
          const ledger = document.querySelector(".mutation-status__ledger");
          return {
            viewport: {
              width: innerWidth,
              height: innerHeight,
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight,
            },
            state: {
              mode: state.mode,
              status: state.status,
              phase: state.phase,
              seed: state.seed,
              pieceCount: state.pieceCount,
              lines: state.lines,
              active: state.active,
              activeCarrier: state.mutationActiveCarrier,
              lockedCarriers: state.mutationCarriers,
              previewItem: renderer.previewMutationItem,
              freezeTicks: state.mutationFreezeTicks,
              collapseTicks: state.mutationCollapseTicks,
              multiplierTicks: state.mutationMultiplierTicks,
              multiplierFactor: state.mutationMultiplierFactor,
              lastItem: state.mutationLastItem,
              lastItemTicks: state.mutationLastItemTicks,
              visibleBoard: state.board.slice(-20).map((row) => row.map((cell) => cell ?? ".").join("")),
            },
            renderer,
            bounds: {
              board: rect("[data-testid='board-frame']"),
              stats: rect("[data-testid='stats']"),
              status: rect("[data-testid='mutation-status']"),
              next: rect("[data-testid='next-slot']"),
              touch: rect("[data-testid='touch-rail']"),
            },
            layout: {
              sideColumns: rail ? splitTracks(getComputedStyle(rail).gridTemplateColumns) : [],
              ledgerColumns: ledger ? splitTracks(getComputedStyle(ledger).gridTemplateColumns) : [],
              ledgerRows: ledger ? splitTracks(getComputedStyle(ledger).gridTemplateRows) : [],
              statusRowCount: statusRows.length,
              statusFontPixels: statusRows.map((row) => parseFloat(getComputedStyle(row.querySelector("b")).fontSize)),
              timedItems,
            },
            assertions: {
              canvasCount: document.querySelectorAll("canvas").length,
              domCellCount: document.querySelectorAll("[data-game-cell]").length,
              noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
              noVerticalOverflow: document.documentElement.scrollHeight <= innerHeight,
              minButtonWidth: buttons.length ? Math.min(...buttons.map((box) => box.width)) : null,
              minButtonHeight: buttons.length ? Math.min(...buttons.map((box) => box.height)) : null,
            },
            lifecycle: window.__T15_LIFECYCLE__.snapshot(),
          };
        }
        """
    )


def validate_common(snapshot: dict[str, Any]) -> None:
    assertions = snapshot["assertions"]
    assert assertions["canvasCount"] == 1
    assert assertions["domCellCount"] == 0
    assert assertions["noHorizontalOverflow"]
    assert assertions["noVerticalOverflow"]
    assert snapshot["renderer"]["previewLayerVisible"]
    assert snapshot["renderer"]["previewPiece"] is not None
    assert snapshot["state"]["mode"] == "sprint"
    assert snapshot["state"]["status"] == "playing"
    assert snapshot["layout"]["statusRowCount"] == len(snapshot["layout"]["timedItems"])
    assert all(size >= 12 for size in snapshot["layout"]["statusFontPixels"])


def capture_atomic_board_pixels(page: Page, crop_selector: str) -> dict[str, Any]:
    payload = page.evaluate(
        """
        (selector) => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          const board = document.querySelector(selector);
          const canvas = document.querySelector("canvas[data-testid='game-canvas']");
          if (!qa || !(board instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
            throw new Error("Atomic board capture prerequisites are missing.");
          }
          const snapshot = () => {
            const state = qa.getState();
            const renderer = qa.getRendererSnapshot();
            return {
              state: {
                mode: state.mode,
                status: state.status,
                pieceCount: state.pieceCount,
              },
              renderer: {
                canvas: renderer.canvas,
                board: renderer.board,
                mutationActivation: renderer.mutationActivation,
                mutationActivationQueueItems: [...renderer.mutationActivationQueueItems],
                mutationActiveParticleCount: renderer.mutationActiveParticleCount,
                mutationCollapseTrail: renderer.mutationCollapseTrail,
              },
            };
          };
          const boardRect = board.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          if (
            boardRect.width <= 0
            || boardRect.height <= 0
            || canvasRect.width <= 0
            || canvasRect.height <= 0
          ) {
            throw new Error("Atomic board capture has empty CSS bounds.");
          }
          const before = snapshot();
          const startedAt = performance.now();
          const extracted = qa.captureBoardPng();
          const after = snapshot();
          return {
            before,
            after,
            dataUrl: extracted.dataUrl,
            captureMs: performance.now() - startedAt,
            cssClip: {
              x: boardRect.left,
              y: boardRect.top,
              width: boardRect.width,
              height: boardRect.height,
            },
            canvasCssBounds: {
              x: canvasRect.left,
              y: canvasRect.top,
              width: canvasRect.width,
              height: canvasRect.height,
            },
            pixiFrame: extracted.frame,
            resolution: extracted.resolution,
            outputPixels: extracted.outputPixels,
            pixelProbe: extracted.pixelProbe,
          };
        }
        """,
        crop_selector,
    )
    data_url = payload.pop("dataUrl")
    assert data_url.startswith("data:image/png;base64,")
    png = base64.b64decode(data_url.split(",", 1)[1], validate=True)
    assert png.startswith(b"\x89PNG\r\n\x1a\n")
    assert len(png) > 1024
    width = int.from_bytes(png[16:20], "big")
    height = int.from_bytes(png[20:24], "big")
    assert width == payload["outputPixels"]["width"]
    assert height == payload["outputPixels"]["height"]
    probe = payload["pixelProbe"]
    assert probe["samples"] >= 256
    assert probe["nonTransparentSamples"] >= max(16, probe["samples"] // 10)
    assert probe["distinctBuckets"] >= 4
    pixi_frame = payload["pixiFrame"]
    renderer_canvas = payload["before"]["renderer"]["canvas"]
    renderer_board = payload["before"]["renderer"]["board"]
    for key in ("x", "y", "width", "height"):
        assert abs(pixi_frame[key] - renderer_board[key]) <= 0.01
    assert payload["resolution"] > 0
    assert abs(width - pixi_frame["width"] * payload["resolution"]) <= 1
    assert abs(height - pixi_frame["height"] * payload["resolution"]) <= 1
    css_aspect = payload["cssClip"]["width"] / payload["cssClip"]["height"]
    pixi_aspect = pixi_frame["width"] / pixi_frame["height"]
    assert abs(css_aspect - pixi_aspect) <= 0.01
    assert renderer_canvas["width"] > 0
    assert renderer_canvas["height"] > 0
    assert abs(renderer_canvas["resolution"] - payload["resolution"]) <= 0.01
    canvas_css = payload["canvasCssBounds"]
    expected_css_clip = {
        "x": canvas_css["x"] + pixi_frame["x"] * canvas_css["width"] / renderer_canvas["width"],
        "y": canvas_css["y"] + pixi_frame["y"] * canvas_css["height"] / renderer_canvas["height"],
        "width": pixi_frame["width"] * canvas_css["width"] / renderer_canvas["width"],
        "height": pixi_frame["height"] * canvas_css["height"] / renderer_canvas["height"],
    }
    for key in ("x", "y", "width", "height"):
        assert abs(payload["cssClip"][key] - expected_css_clip[key]) <= 1
    payload["expectedCssClip"] = expected_css_clip
    payload["pngBytes"] = png
    payload["pngDimensions"] = {"width": width, "height": height}
    return payload


def capture(
    page: Page,
    name: str,
    *,
    settle_ms: int = 80,
    grayscale: bool = False,
    crop_selector: str | None = None,
    observed_snapshot: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if grayscale:
        page.evaluate("document.documentElement.dataset.t15Grayscale = 'true'")
    try:
        if observed_snapshot is None:
            page.wait_for_timeout(settle_ms)
            snapshot = collect(page)
        else:
            assert settle_ms == 0
            snapshot = dict(observed_snapshot)
        validate_common(snapshot)
        path = ARTIFACT_OUT / f"{name}.png"
        clip: dict[str, float] | None = None
        atomic: dict[str, Any] | None = None
        if observed_snapshot is not None:
            assert crop_selector is not None
            atomic = capture_atomic_board_pixels(page, crop_selector)
            path.write_bytes(atomic.pop("pngBytes"))
            clip = atomic["cssClip"]
        elif crop_selector is None:
            page.screenshot(path=str(path), full_page=False)
        else:
            crop = page.locator(crop_selector).bounding_box()
            assert crop is not None
            assert crop["width"] > 0 and crop["height"] > 0
            board_bounds = snapshot["bounds"]["board"]
            assert board_bounds is not None
            assert abs(crop["x"] - board_bounds["left"]) <= 1
            assert abs(crop["y"] - board_bounds["top"]) <= 1
            assert abs(crop["width"] - board_bounds["width"]) <= 1
            assert abs(crop["height"] - board_bounds["height"]) <= 1
            clip = {
                "x": crop["x"],
                "y": crop["y"],
                "width": crop["width"],
                "height": crop["height"],
            }
            page.screenshot(path=str(path), clip=crop)
        if observed_snapshot is not None:
            board_bounds = observed_snapshot["bounds"]["board"]
            assert board_bounds is not None
            assert clip is not None
            assert abs(clip["x"] - board_bounds["left"]) <= 1
            assert abs(clip["y"] - board_bounds["top"]) <= 1
            assert abs(clip["width"] - board_bounds["width"]) <= 1
            assert abs(clip["height"] - board_bounds["height"]) <= 1
            capture_before = {
                "pieceCountBefore": observed_snapshot["state"]["pieceCount"],
                "mutationActivationBefore": observed_snapshot["renderer"]["mutationActivation"],
                "mutationActivationQueueBefore": observed_snapshot["renderer"][
                    "mutationActivationQueueItems"
                ],
                "mutationCollapseTrailBefore": observed_snapshot["renderer"]["mutationCollapseTrail"],
                "atomicBefore": atomic["before"],
                "atomicAfter": atomic["after"],
                "canvasCssBounds": atomic["canvasCssBounds"],
                "expectedCssClip": atomic["expectedCssClip"],
                "pixiFrame": atomic["pixiFrame"],
                "resolution": atomic["resolution"],
                "outputPixels": atomic["outputPixels"],
                "pngDimensions": atomic["pngDimensions"],
                "pixelProbe": atomic["pixelProbe"],
                "captureMs": atomic["captureMs"],
            }
        snapshot["file"] = path.name
        snapshot["sha256"] = sha256(path)
        snapshot["grayscale"] = grayscale
        snapshot["cropSelector"] = crop_selector
        snapshot["clip"] = clip
        snapshot["captureMethod"] = (
            "pixi-extract"
            if observed_snapshot is not None
            else "playwright-screenshot"
        )
        if observed_snapshot is not None:
            snapshot["captureBinding"] = {
                **capture_before,
                "clip": clip,
                "file": snapshot["file"],
                "sha256": snapshot["sha256"],
            }
        return snapshot
    finally:
        if grayscale:
            page.evaluate("delete document.documentElement.dataset.t15Grayscale")


def item_sets(snapshot: dict[str, Any]) -> tuple[set[str], set[str], set[str]]:
    state = snapshot["state"]
    active = {state["activeCarrier"]["item"]} if state["activeCarrier"] else set()
    preview = {state["previewItem"]} if state["previewItem"] else set()
    locked = {carrier["item"] for carrier in state["lockedCarriers"]}
    return active, preview, locked


def timed_count(snapshot: dict[str, Any]) -> int:
    return len(snapshot["layout"]["timedItems"])


def change_language_to_english(page: Page) -> None:
    page.locator("[data-testid='open-settings']").click()
    page.locator("[data-testid='language-en']").click()
    backdrop = page.locator("[data-testid='action-sheet-backdrop']")
    box = backdrop.bounding_box()
    assert box is not None
    page.mouse.click(box["x"] + 4, box["y"] + 4)
    page.wait_for_function("document.documentElement.lang === 'en'")
    page.wait_for_selector("[data-testid='settings-sheet']", state="detached")
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'"
    )


def frame_budget(page: Page) -> dict[str, Any]:
    render = page.evaluate("window.__SIGNAL_FOUNDRY_QA__.benchmarkRender(180)")
    frame_deltas = page.evaluate(
        """
        () => new Promise((resolve) => {
          const deltas = [];
          let previous = performance.now();
          const sample = (now) => {
            deltas.push(now - previous);
            previous = now;
            if (deltas.length >= 120) resolve(deltas.slice(1));
            else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        })
        """
    )
    ordered = sorted(frame_deltas)
    p95 = ordered[min(len(ordered) - 1, int(len(ordered) * 0.95))]
    dropped = sum(delta > 20 for delta in frame_deltas)
    return {
        "renderBenchmark": render,
        "raf": {
            "samples": len(frame_deltas),
            "meanMs": statistics.fmean(frame_deltas),
            "p95Ms": p95,
            "maxMs": max(frame_deltas),
            "over20MsCount": dropped,
            "over20MsRatio": dropped / len(frame_deltas),
        },
    }


def activation_capture_ready(
    snapshot: dict[str, Any],
    *,
    reduced_motion: bool = False,
    phase_progress_limit: float = 0.75,
) -> bool:
    renderer = snapshot["renderer"]
    activation = renderer["mutationActivation"]
    if activation is None:
        return False
    if activation["item"] == "bomb":
        impact = next(
            (phase for phase in activation["phases"] if phase["id"] == "impact"),
            None,
        )
        return bool(
            impact
            and impact["active"]
            and impact["progress"] <= min(phase_progress_limit, 0.65)
            and activation["particlesEmitted"]
            and (
                reduced_motion
                or renderer["mutationActiveParticleCount"] > 0
            )
        )
    active_phases = [phase for phase in activation["phases"] if phase["active"]]
    return bool(
        active_phases
        and min(phase["progress"] for phase in active_phases) <= phase_progress_limit
    )


def assert_activation_capture_window(
    before: dict[str, Any],
    capture_snapshot: dict[str, Any],
    *,
    reduced_motion: bool,
) -> None:
    before_activation = before["renderer"]["mutationActivation"]
    binding = capture_snapshot["captureBinding"]
    atomic_before = binding["atomicBefore"]
    atomic_after = binding["atomicAfter"]
    captured_before = atomic_before["renderer"]["mutationActivation"]
    captured_after = atomic_after["renderer"]["mutationActivation"]
    assert before_activation is not None
    assert captured_before is not None
    assert captured_after is not None
    assert atomic_before == atomic_after
    assert before["state"]["pieceCount"] == atomic_before["state"]["pieceCount"]
    assert captured_before["item"] == before_activation["item"]
    assert captured_before["durationMs"] == before_activation["durationMs"]
    assert captured_before["elapsedMs"] + 0.5 >= before_activation["elapsedMs"]
    assert captured_after["elapsedMs"] < captured_after["durationMs"]
    assert (
        atomic_before["renderer"]["mutationActivationQueueItems"]
        == before["renderer"]["mutationActivationQueueItems"]
    )
    assert activation_capture_ready(atomic_after, reduced_motion=reduced_motion)


def assert_collapse_trail_capture_window(
    before: dict[str, Any],
    capture_snapshot: dict[str, Any],
) -> None:
    before_trail = before["renderer"]["mutationCollapseTrail"]
    binding = capture_snapshot["captureBinding"]
    atomic_before = binding["atomicBefore"]
    atomic_after = binding["atomicAfter"]
    captured_before = atomic_before["renderer"]["mutationCollapseTrail"]
    captured_after = atomic_after["renderer"]["mutationCollapseTrail"]
    assert before_trail is not None
    assert captured_before is not None
    assert captured_after is not None
    assert atomic_before == atomic_after
    assert before["state"]["pieceCount"] == atomic_before["state"]["pieceCount"]
    assert captured_before["columns"] == before_trail["columns"]
    assert captured_before["maxDrop"] == before_trail["maxDrop"]
    assert captured_before["durationMs"] == before_trail["durationMs"]
    assert captured_before["elapsedMs"] + 0.5 >= before_trail["elapsedMs"]
    assert captured_after["elapsedMs"] < captured_after["durationMs"]


def install_fifo_observer(
    page: Page,
    expected: list[str],
    initial_activation: dict[str, Any],
) -> None:
    assert len(expected) >= 2
    page.evaluate(
        """
        ({ expectedItems, initialActivation }) => {
          if (window.__T15_FIFO_OBSERVER__) {
            throw new Error("A FIFO observer is already installed.");
          }
          const expected = [...expectedItems];
          const state = {
            expected,
            observed: [expected[0]],
            transitions: [],
            frameSamples: 0,
            currentIndex: 0,
            complete: false,
            error: null,
            startedAt: performance.now(),
            lastElapsedMs: initialActivation.elapsedMs,
            lastDurationMs: initialActivation.durationMs,
          };
          window.__T15_FIFO_OBSERVER__ = state;
          const fail = (message) => {
            state.error = message;
          };
          const sameItems = (left, right) =>
            left.length === right.length && left.every((item, index) => item === right[index]);
          const observe = () => {
            if (state.complete || state.error) return;
            if (performance.now() - state.startedAt > 20000) {
              fail(`FIFO drain timed out: ${JSON.stringify(state)}`);
              return;
            }
            const renderer = window.__SIGNAL_FOUNDRY_QA__.getRendererSnapshot();
            const activation = renderer.mutationActivation;
            const queue = [...renderer.mutationActivationQueueItems];
            state.frameSamples += 1;
            if (!activation) {
              fail(`FIFO current activation disappeared: ${JSON.stringify({expected, queue})}`);
              return;
            }
            const index = expected.length - queue.length - 1;
            if (index < state.currentIndex || index > state.currentIndex + 1) {
              fail(`FIFO queue length skipped an instance: ${JSON.stringify({
                expected,
                queue,
                currentIndex: state.currentIndex,
                derivedIndex: index,
              })}`);
              return;
            }
            if (index < 0 || index >= expected.length || activation.item !== expected[index]) {
              fail(`FIFO current item differs from the fixed witness: ${JSON.stringify({
                expected,
                queue,
                current: activation.item,
                derivedIndex: index,
              })}`);
              return;
            }
            const expectedQueue = expected.slice(index + 1);
            if (!sameItems(queue, expectedQueue)) {
              fail(`FIFO live queue differs from the fixed witness suffix: ${JSON.stringify({
                expectedQueue,
                queue,
                derivedIndex: index,
              })}`);
              return;
            }
            if (
              !Number.isFinite(activation.elapsedMs)
              || !Number.isFinite(activation.durationMs)
              || activation.durationMs <= 0
            ) {
              fail(`FIFO activation timing is invalid: ${JSON.stringify({
                item: activation.item,
                elapsedMs: activation.elapsedMs,
                durationMs: activation.durationMs,
              })}`);
              return;
            }
            if (index === state.currentIndex) {
              if (activation.durationMs !== state.lastDurationMs) {
                fail(`FIFO current activation duration changed in place: ${JSON.stringify({
                  item: activation.item,
                  previousDurationMs: state.lastDurationMs,
                  durationMs: activation.durationMs,
                })}`);
                return;
              }
              if (activation.elapsedMs + 0.5 < state.lastElapsedMs) {
                fail(`FIFO current activation elapsed time rewound in place: ${JSON.stringify({
                  item: activation.item,
                  previousElapsedMs: state.lastElapsedMs,
                  elapsedMs: activation.elapsedMs,
                })}`);
                return;
              }
            }
            if (index === state.currentIndex + 1) {
              const previousItem = expected[state.currentIndex];
              if (
                activation.item === previousItem
                && !(
                  activation.durationMs === state.lastDurationMs
                  && activation.elapsedMs + 0.5 < state.lastElapsedMs
                )
              ) {
                fail(`FIFO equal-item instance did not reset its timeline: ${JSON.stringify({
                  item: activation.item,
                  previousElapsedMs: state.lastElapsedMs,
                  elapsedMs: activation.elapsedMs,
                  previousDurationMs: state.lastDurationMs,
                  durationMs: activation.durationMs,
                })}`);
                return;
              }
              state.currentIndex = index;
              state.observed.push(activation.item);
              state.transitions.push({
                index,
                item: activation.item,
                previousItem,
                previousElapsedMs: state.lastElapsedMs,
                elapsedMs: activation.elapsedMs,
                durationMs: activation.durationMs,
                remainingQueue: queue,
              });
            }
            state.lastElapsedMs = activation.elapsedMs;
            state.lastDurationMs = activation.durationMs;
            if (state.observed.length === expected.length) {
              state.complete = true;
              return;
            }
            requestAnimationFrame(observe);
          };
          requestAnimationFrame(observe);
        }
        """,
        {
            "expectedItems": expected,
            "initialActivation": {
                "elapsedMs": initial_activation["elapsedMs"],
                "durationMs": initial_activation["durationMs"],
            },
        },
    )


def finish_fifo_observer(page: Page) -> dict[str, Any]:
    page.wait_for_function(
        """
        () => Boolean(
          window.__T15_FIFO_OBSERVER__?.complete
          || window.__T15_FIFO_OBSERVER__?.error
        )
        """,
        timeout=22000,
    )
    result = page.evaluate("structuredClone(window.__T15_FIFO_OBSERVER__)")
    page.evaluate("delete window.__T15_FIFO_OBSERVER__")
    assert result["error"] is None, result["error"]
    assert result["complete"]
    assert result["observed"] == result["expected"]
    assert result["currentIndex"] == len(result["expected"]) - 1
    assert result["frameSamples"] > 0
    return result


def capture_fifo_witness(page: Page, snapshot: dict[str, Any]) -> dict[str, Any]:
    activation = snapshot["renderer"]["mutationActivation"]
    queued_items = snapshot["renderer"]["mutationActivationQueueItems"]
    assert activation is not None
    assert queued_items
    expected = [activation["item"], *queued_items]
    install_fifo_observer(page, expected, activation)
    fifo_trace = finish_fifo_observer(page)
    refreshed = collect(page)
    validate_common(refreshed)
    return {
        "expected": expected,
        "observed": fifo_trace["observed"],
        "snapshot": refreshed,
        "witness": {
            "pieceCount": snapshot["state"]["pieceCount"],
            "current": expected[0],
            "queued": expected[1:],
            "currentElapsedMs": activation["elapsedMs"],
            "currentDurationMs": activation["durationMs"],
            "trace": fifo_trace,
        },
    }


def run(context: BrowserContext) -> dict[str, Any]:
    page = context.new_page()
    errors = attach_error_capture(page)
    lifecycle_baseline, first_mount = enter_mutation(page)

    captures: list[dict[str, Any]] = []
    page.set_viewport_size({"width": 1440, "height": 900})
    idle = capture(page, "desktop-idle")
    assert idle["layout"]["statusRowCount"] == 0
    assert idle["bounds"]["status"] is None

    page.set_viewport_size({"width": 390, "height": 844})
    portrait_idle = capture(page, "portrait-idle")
    assert len(portrait_idle["layout"]["sideColumns"]) == 2
    page.set_viewport_size({"width": 1440, "height": 900})
    captures.extend([idle, portrait_idle])

    required_items = {"freeze", "collapse", "bomb", "multiplier"}
    active_seen: set[str] = set()
    preview_seen: set[str] = set()
    locked_seen: set[str] = set()
    activation_seen: set[str] = set()
    timed_seen: set[int] = set()
    single_status_advance_ticks: int | None = None
    fifo_expected: list[str] | None = None
    fifo_observed: list[str] = []
    fifo_witness: dict[str, Any] | None = None
    collapse_trail_witness: dict[str, Any] | None = None
    reduced_activation_files: dict[str, dict[str, Any]] = {}

    for step in range(1, 501):
        result = page.evaluate("window.__T15_AUTOPLAY_STEP__()")
        if result.get("stopped"):
            raise AssertionError(f"Autoplayer stopped at step {step}: {result}")
        snapshot = collect(page)
        validate_common(snapshot)

        activation = snapshot["renderer"]["mutationActivation"]
        queued_items = snapshot["renderer"]["mutationActivationQueueItems"]
        if fifo_expected is None and not (activation and queued_items):
            page.wait_for_timeout(18)
            snapshot = collect(page)
            validate_common(snapshot)
            activation = snapshot["renderer"]["mutationActivation"]
            queued_items = snapshot["renderer"]["mutationActivationQueueItems"]
        elif fifo_expected is not None:
            page.wait_for_timeout(18)
            snapshot = collect(page)
            validate_common(snapshot)
            activation = snapshot["renderer"]["mutationActivation"]
            queued_items = snapshot["renderer"]["mutationActivationQueueItems"]

        if fifo_expected is None and activation and queued_items:
            fifo_result = capture_fifo_witness(page, snapshot)
            fifo_expected = fifo_result["expected"]
            fifo_observed = fifo_result["observed"]
            fifo_witness = fifo_result["witness"]
            snapshot = fifo_result["snapshot"]
            activation = snapshot["renderer"]["mutationActivation"]

        # The Collapse settlement endpoint lives for only 260 ms. Capture it
        # before any carrier or status screenshot, and only during its first
        # quarter so the post-screenshot continuity gate has a real margin.
        collapse_trail = snapshot["renderer"]["mutationCollapseTrail"]
        if (
            collapse_trail_witness is None
            and collapse_trail is not None
            and collapse_trail["columns"]
            and collapse_trail["maxDrop"] > 0
            and collapse_trail["elapsedMs"] <= collapse_trail["durationMs"] * 0.25
        ):
            trail_capture = capture(
                page,
                "collapse-settlement-columns",
                settle_ms=0,
                crop_selector="[data-testid='board-frame']",
                observed_snapshot=snapshot,
            )
            assert_collapse_trail_capture_window(snapshot, trail_capture)
            captured_trail = trail_capture["captureBinding"]["atomicAfter"][
                "renderer"
            ]["mutationCollapseTrail"]
            assert captured_trail is not None
            assert captured_trail["columns"]
            assert captured_trail["maxDrop"] > 0
            captures.append(trail_capture)
            collapse_trail_witness = {
                "file": trail_capture["file"],
                "sha256": trail_capture["sha256"],
                "trail": captured_trail,
                "captureBinding": trail_capture["captureBinding"],
            }
            snapshot = trail_capture
            activation = snapshot["renderer"]["mutationActivation"]

        # Activation endpoints are also transient. Prioritise them before the
        # longer-lived carrier/Next/locked evidence, then keep only a frame
        # whose post-screenshot snapshot is still the same visible instance.
        if (
            activation
            and activation["item"] not in activation_seen
            and activation_capture_ready(snapshot, phase_progress_limit=0.45)
        ):
            activation_capture = capture(
                page,
                f"activation-{activation['item']}",
                settle_ms=0,
                crop_selector="[data-testid='board-frame']",
                observed_snapshot=snapshot,
            )
            assert_activation_capture_window(
                snapshot,
                activation_capture,
                reduced_motion=False,
            )
            captured_renderer = activation_capture["captureBinding"]["atomicAfter"][
                "renderer"
            ]
            captured_activation = captured_renderer["mutationActivation"]
            assert captured_activation is not None
            assert captured_activation["item"] == activation["item"]
            if activation["item"] == "bomb":
                captured_impact = next(
                    phase
                    for phase in captured_activation["phases"]
                    if phase["id"] == "impact"
                )
                assert captured_impact["active"]
                assert captured_activation["particlesEmitted"]
                assert captured_renderer["mutationActiveParticleCount"] > 0
            captures.append(activation_capture)
            activation_seen.add(activation["item"])
            snapshot = activation_capture

        current_active, current_preview, current_locked = item_sets(snapshot)
        for item in sorted(current_active - active_seen):
            captures.append(capture(page, f"carrier-active-{item}", settle_ms=24))
            active_seen.add(item)
        for item in sorted(current_preview - preview_seen):
            captures.append(capture(page, f"carrier-next-{item}", settle_ms=24))
            captures.append(capture(page, f"carrier-next-{item}-grayscale", settle_ms=24, grayscale=True))
            preview_seen.add(item)
        for item in sorted(current_locked - locked_seen):
            captures.append(capture(page, f"carrier-locked-{item}", settle_ms=24))
            locked_seen.add(item)

        # Carrier screenshots can advance Core and Renderer time. Refresh before
        # counting current status rows and checking the loop exit condition.
        snapshot = collect(page)
        validate_common(snapshot)

        count = timed_count(snapshot)
        if count in {1, 2, 3} and count not in timed_seen:
            captures.append(capture(page, f"status-{count}"))
            timed_seen.add(count)
            if count == 1:
                single_status_advance_ticks = 0

        if (
            active_seen == required_items
            and preview_seen == required_items
            and locked_seen == required_items
            and activation_seen == required_items
            and {2, 3}.issubset(timed_seen)
            and fifo_expected is not None
            and fifo_observed == fifo_expected
            and collapse_trail_witness is not None
            and count == 3
        ):
            break
    else:
        raise AssertionError(
            "Autoplayer exhausted: "
            f"active={active_seen}, preview={preview_seen}, locked={locked_seen}, "
            f"activations={activation_seen}, timed={timed_seen}, "
            f"fifoExpected={fifo_expected}, fifoObserved={fifo_observed}, "
            f"collapseTrail={collapse_trail_witness}"
        )

    page.set_viewport_size({"width": 390, "height": 844})
    portrait = capture(page, "portrait-three-status")
    assert timed_count(portrait) == 3
    assert len(portrait["layout"]["sideColumns"]) == 3
    assert len(portrait["layout"]["ledgerRows"]) == 3
    captures.append(portrait)

    page.set_viewport_size({"width": 844, "height": 390})
    landscape = capture(page, "landscape-three-status")
    assert timed_count(landscape) == 3
    assert len(landscape["layout"]["ledgerColumns"]) == 3
    captures.append(landscape)

    page.emulate_media(reduced_motion="reduce")
    reduced = capture(page, "landscape-three-status-reduced")
    assert timed_count(reduced) == 3
    captures.append(reduced)

    reduced_activation_seen: set[str] = set()
    for step in range(1, 501):
        result = page.evaluate("window.__T15_AUTOPLAY_STEP__()")
        if result.get("stopped"):
            raise AssertionError(
                f"Reduced-motion autoplayer stopped at step {step}: {result}"
            )
        page.wait_for_timeout(18)
        snapshot = collect(page)
        validate_common(snapshot)
        activation = snapshot["renderer"]["mutationActivation"]
        if (
            activation
            and activation["item"] not in reduced_activation_seen
            and activation_capture_ready(
                snapshot,
                reduced_motion=True,
                phase_progress_limit=0.45,
            )
        ):
            activation_capture = capture(
                page,
                f"activation-{activation['item']}-reduced",
                settle_ms=0,
                crop_selector="[data-testid='board-frame']",
                observed_snapshot=snapshot,
            )
            assert_activation_capture_window(
                snapshot,
                activation_capture,
                reduced_motion=True,
            )
            captured_renderer = activation_capture["captureBinding"]["atomicAfter"][
                "renderer"
            ]
            captured_activation = captured_renderer["mutationActivation"]
            assert captured_activation is not None
            assert captured_activation["item"] == activation["item"]
            if activation["item"] == "bomb":
                captured_impact = next(
                    phase
                    for phase in captured_activation["phases"]
                    if phase["id"] == "impact"
                )
                assert captured_impact["active"]
                assert captured_activation["particlesEmitted"]
                assert (
                    captured_renderer["mutationActiveParticleCount"] == 0
                )
            captures.append(activation_capture)
            reduced_activation_seen.add(activation["item"])
            reduced_activation_files[activation["item"]] = {
                "file": activation_capture["file"],
                "sha256": activation_capture["sha256"],
                "captureBinding": activation_capture["captureBinding"],
            }
        if reduced_activation_seen == required_items:
            break
    else:
        raise AssertionError(
            "Reduced-motion autoplayer exhausted: "
            f"activations={reduced_activation_seen}"
        )

    page.emulate_media(reduced_motion="no-preference")
    page.set_viewport_size({"width": 390, "height": 844})
    change_language_to_english(page)
    english = capture(page, "portrait-three-status-english")
    assert timed_count(english) == 3
    captures.append(english)

    page.set_viewport_size({"width": 1440, "height": 900})
    performance = frame_budget(page)
    assert performance["renderBenchmark"]["p95Ms"] < 16.67
    assert performance["raf"]["meanMs"] < 17.5
    assert performance["raf"]["p95Ms"] < 20
    assert performance["raf"]["over20MsRatio"] <= 0.05
    assert performance["raf"]["maxMs"] < 50

    if 1 not in timed_seen:
        for advanced_ticks in range(1, 1201):
            page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(1)")
            snapshot = collect(page)
            validate_common(snapshot)
            count = timed_count(snapshot)
            assert count > 0, "Timed Mutation statuses expired without a real one-status state."
            if count == 1:
                single_status = capture(page, "status-1")
                assert timed_count(single_status) == 1
                captures.append(single_status)
                timed_seen.add(1)
                single_status_advance_ticks = advanced_ticks
                break
        else:
            raise AssertionError("Timed Mutation statuses never reached exactly one after 1200 ticks.")
    assert timed_seen == {1, 2, 3}
    assert single_status_advance_ticks is not None

    page.evaluate("window.__t15Canvas = document.querySelector('canvas')")
    before_restart = page.evaluate(
        """
        () => ({
          canvasCount: document.querySelectorAll("canvas").length,
          lifecycle: window.__T15_LIFECYCLE__.snapshot(),
        })
        """
    )
    page.locator("[data-testid='open-settings']").click()
    page.locator("[data-testid='settings-restart']").click()
    page.locator("[data-testid='confirm-restart']").click()
    page.wait_for_function("window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'", timeout=6000)
    after_restart = page.evaluate(
        """
        () => ({
          sameCanvas: window.__t15Canvas === document.querySelector("canvas"),
          canvasCount: document.querySelectorAll("canvas").length,
          lifecycle: window.__T15_LIFECYCLE__.snapshot(),
        })
        """
    )
    same_canvas_restart = after_restart["sameCanvas"]
    assert same_canvas_restart
    assert before_restart["canvasCount"] == after_restart["canvasCount"] == 1
    assert before_restart["lifecycle"]["globalListenerCount"] == after_restart["lifecycle"]["globalListenerCount"]
    assert before_restart["lifecycle"]["globalListeners"] == after_restart["lifecycle"]["globalListeners"]
    assert before_restart["lifecycle"]["pendingAnimationFrames"] == after_restart["lifecycle"]["pendingAnimationFrames"]
    assert before_restart["lifecycle"]["openAudioContexts"] == after_restart["lifecycle"]["openAudioContexts"]

    first_unmount = exit_mutation_to_home(page)
    assert_home_lifecycle(first_unmount, lifecycle_baseline)

    second_mount = start_mutation_from_home(page)
    assert second_mount["canvasCount"] == first_mount["canvasCount"] == 1
    assert second_mount["lifecycle"]["globalListenerCount"] == first_mount["lifecycle"]["globalListenerCount"]
    assert second_mount["lifecycle"]["globalListeners"] == first_mount["lifecycle"]["globalListeners"]
    assert second_mount["lifecycle"]["pendingAnimationFrames"] == first_mount["lifecycle"]["pendingAnimationFrames"]
    second_unmount = exit_mutation_to_home(page)
    assert_home_lifecycle(second_unmount, lifecycle_baseline)

    return {
        "fixedSeed": FIXED_RUN_SEED,
        "autoplayPieces": max(capture["state"]["pieceCount"] for capture in captures),
        "coverage": {
            "active": sorted(active_seen),
            "next": sorted(preview_seen),
            "nextGrayscale": sorted(preview_seen),
            "locked": sorted(locked_seen),
            "activations": sorted(activation_seen),
            "activationsReduced": sorted(reduced_activation_seen),
            "activationReducedCaptures": reduced_activation_files,
            "timedCounts": sorted(timed_seen),
            "singleStatusAdvanceTicks": single_status_advance_ticks,
            "collapseSettlement": collapse_trail_witness,
            "rendererFifo": {
                "witness": fifo_witness,
                "expected": fifo_expected,
                "observed": fifo_observed,
            },
        },
        "captures": captures,
        "performance": performance,
        "lifecycle": {
            "baseline": lifecycle_baseline,
            "firstMount": first_mount,
            "beforeRestart": before_restart,
            "afterRestart": after_restart,
            "sameCanvasAfterRestart": same_canvas_restart,
            "firstUnmount": first_unmount,
            "secondMount": second_mount,
            "secondUnmount": second_unmount,
        },
        "errors": errors,
    }


def assert_clean_publication_target(*, allowed_partial: Path | None = None) -> None:
    allowed_resolved = allowed_partial.resolve() if allowed_partial is not None else None
    stale_partials = [
        path
        for path in OUT.glob(".partial-*")
        if allowed_resolved is None or path.resolve() != allowed_resolved
    ]
    generated = [
        *OUT.glob("*.png"),
        *stale_partials,
        *(OUT / name for name in (
            "phase5-browser-evidence.json",
            "SHA256SUMS.txt",
            "vite-stdout.log",
            "vite-stderr.log",
        ) if (OUT / name).exists()),
    ]
    assert generated == [], f"Refusing to mix prior evidence: {[path.name for path in generated]}"


def write_and_publish_manifest(result: dict[str, Any]) -> None:
    assert ARTIFACT_OUT != OUT
    capture_names = [capture["file"] for capture in result["result"]["captures"]]
    assert len(capture_names) == len(set(capture_names))
    actual_png_names = {path.name for path in ARTIFACT_OUT.glob("*.png")}
    assert actual_png_names == set(capture_names)

    def validate_capture_files() -> dict[str, str]:
        hashes: dict[str, str] = {}
        for capture in result["result"]["captures"]:
            name = capture["file"]
            current_hash = sha256(ARTIFACT_OUT / name)
            assert current_hash == capture["sha256"]
            binding = capture.get("captureBinding")
            if binding is not None:
                assert binding["file"] == name
                assert binding["sha256"] == current_hash
            hashes[name] = current_hash
        assert len(hashes.values()) == len(set(hashes.values()))
        return hashes

    capture_hashes = validate_capture_files()
    log_names = {"vite-stdout.log", "vite-stderr.log"}
    assert all((ARTIFACT_OUT / name).is_file() for name in log_names)

    result["captureScript"] = result["candidate"]["before"]["captureScript"]
    assert result["captureScript"] == result["candidate"]["after"]["captureScript"]
    result["artifactFiles"] = sorted({
        Path(__file__).name,
        *capture_names,
        *log_names,
        "phase5-browser-evidence.json",
        "SHA256SUMS.txt",
    })
    manifest_path = ARTIFACT_OUT / "phase5-browser-evidence.json"
    manifest_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
        newline="\n",
    )
    checksum_files = sorted(
        [
            Path(__file__),
            manifest_path,
            *(ARTIFACT_OUT / name for name in capture_names),
            *(ARTIFACT_OUT / name for name in log_names),
        ],
        key=lambda candidate: candidate.name,
    )
    sums = "\n".join(f"{sha256(path)}  {path.name}" for path in checksum_files) + "\n"
    sums_path = ARTIFACT_OUT / "SHA256SUMS.txt"
    sums_path.write_text(sums, encoding="utf-8", newline="\n")

    expected_staged = {
        *capture_names,
        *log_names,
        manifest_path.name,
        sums_path.name,
    }
    actual_staged = {
        path.name
        for path in ARTIFACT_OUT.iterdir()
        if path.is_file()
    }
    assert actual_staged == expected_staged
    assert validate_capture_files() == capture_hashes
    assert_clean_publication_target(allowed_partial=ARTIFACT_OUT)
    publication_order = [
        *sorted(capture_names),
        *sorted(log_names),
        manifest_path.name,
        sums_path.name,
    ]
    assert publication_order[-1] == "SHA256SUMS.txt"
    assert set(publication_order) == expected_staged
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
        binding_before = candidate_binding()
        with managed_vite_server() as server:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    headless=True,
                    channel="chrome",
                    args=["--use-gl=angle", "--use-angle=swiftshader", "--disable-extensions"],
                )
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

        assert result["errors"] == []
        binding_after = candidate_binding()
        assert binding_after == binding_before
        assert server["ready"] and server["released"]
        payload = {
            "candidate": {
                "before": binding_before,
                "after": binding_after,
            },
            "server": server,
            "result": result,
        }
        write_and_publish_manifest(payload)
    finally:
        shutil.rmtree(ARTIFACT_OUT, ignore_errors=True)
        ARTIFACT_OUT = OUT

    print(json.dumps(
        {
            "candidate": binding_before["sourceCandidate"],
            "captures": len(result["captures"]),
            "coverage": result["coverage"],
            "performance": result["performance"],
            "lifecycle": result["lifecycle"],
            "errors": result["errors"],
        },
        ensure_ascii=False,
        indent=2,
    ))


def parse_args() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Capture the source-bound T15 Phase-5 Mutation browser evidence. "
            "The run owns its Vite and Chrome lifecycle and accepts no runtime options."
        )
    )
    parser.parse_args()


if __name__ == "__main__":
    parse_args()
    main()
