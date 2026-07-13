from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOT_DIR = ROOT / "docs" / "screenshots" / "tetris"
EVIDENCE_PATH = ROOT / "docs" / "qa" / "tetris-browser-evidence.json"
BASE_URL = "http://127.0.0.1:5173"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def wait_for_runtime(page: Page) -> None:
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_function("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
    page.wait_for_selector("canvas[data-testid='game-canvas']")


def play_sequence(page: Page, pieces: int = 7) -> None:
    page.get_by_role("button", name="Initialize run").click()
    for index in range(pieces):
        if index % 3 == 0:
            page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('left')")
        elif index % 3 == 1:
            page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('right')")
        if index % 2 == 0:
            page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('rotate-cw')")
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('hard-drop')")
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(18)")
    page.wait_for_timeout(180)


def touch_point(page: Page, label: str) -> tuple[float, float]:
    button = page.get_by_role("button", name=label, exact=True)
    button.scroll_into_view_if_needed()
    box = button.bounding_box()
    assert box is not None, f"Touch control {label!r} has no rendered bounds"
    return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2


def touch_start(page: Page, session: Any, label: str) -> None:
    x, y = touch_point(page, label)
    session.send(
        "Input.dispatchTouchEvent",
        {
            "type": "touchStart",
            "touchPoints": [{"x": x, "y": y, "radiusX": 4, "radiusY": 4, "force": 1, "id": 1}],
        },
    )


def touch_end(session: Any) -> None:
    session.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def touch_tap(page: Page, session: Any, label: str) -> None:
    touch_start(page, session, label)
    touch_end(session)
    page.wait_for_timeout(12)


def play_touch_sequence(page: Page, session: Any, pieces: int = 7) -> None:
    page.get_by_role("button", name="Initialize run").click()
    for index in range(pieces):
        touch_tap(page, session, "Move left" if index % 2 == 0 else "Move right")
        if index % 2 == 0:
            touch_tap(page, session, "Rotate right")
        touch_tap(page, session, "Hard drop")
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(18)")


def exercise_touch_controls(page: Page, session: Any) -> dict[str, Any]:
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
    before_x = page.evaluate("window.__SIGNAL_FOUNDRY_QA__.getState().active.x")
    touch_start(page, session, "Move right")
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(12)")
    held_x = page.evaluate("window.__SIGNAL_FOUNDRY_QA__.getState().active.x")
    touch_end(session)
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(6)")
    released_x = page.evaluate("window.__SIGNAL_FOUNDRY_QA__.getState().active.x")
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(false)")
    assert held_x > before_x, {"before": before_x, "held": held_x}
    assert released_x == held_x, {"held": held_x, "released": released_x}

    touch_tap(page, session, "Pause")
    page.wait_for_function("window.__SIGNAL_FOUNDRY_QA__.getState().status === 'paused'")
    assert page.get_by_role("heading", name="Instrument paused").is_visible()
    touch_tap(page, session, "Resume")
    page.wait_for_function("window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'")
    return {
        "pointerType": "touch",
        "longHold": {"beforeX": before_x, "heldX": held_x, "releasedX": released_x},
        "releaseStoppedRepeat": True,
        "pauseResume": ["paused", "playing"],
    }


def geometry(page: Page) -> dict[str, Any]:
    return page.evaluate(
        """
        () => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          const renderer = qa.getRendererSnapshot();
          const state = qa.getState();
          return {
            renderer,
            state: {
              status: state.status,
              score: state.score,
              lines: state.lines,
              level: state.level,
              active: state.active,
              lockedCells: state.board.flat().filter(Boolean).length,
            },
            canvasCount: document.querySelectorAll('canvas').length,
            gameplayDomCells: document.querySelectorAll('[data-cell], .cell, .tetromino').length,
            viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
            scroll: {
              width: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
            },
          };
        }
        """
    )


def measure_frames(page: Page, frame_count: int = 120) -> dict[str, float]:
    return page.evaluate(
        """
        async (frameCount) => {
          const deltas = [];
          let previous = performance.now();
          for (let index = 0; index < frameCount; index += 1) {
            const now = await new Promise((resolve) => requestAnimationFrame(resolve));
            deltas.push(now - previous);
            previous = now;
          }
          deltas.sort((a, b) => a - b);
          const sum = deltas.reduce((total, value) => total + value, 0);
          return {
            meanMs: sum / deltas.length,
            p95Ms: deltas[Math.floor(deltas.length * 0.95)],
            maxMs: deltas[deltas.length - 1],
          };
        }
        """,
        frame_count,
    )


def assert_geometry(snapshot: dict[str, Any]) -> None:
    renderer = snapshot["renderer"]
    board = renderer["board"]
    canvas = renderer["canvas"]
    assert snapshot["canvasCount"] == 1, snapshot
    assert snapshot["gameplayDomCells"] == 0, snapshot
    assert board["cell"] > 8, snapshot
    assert abs(board["width"] / board["height"] - 0.5) < 0.0001, snapshot
    assert board["x"] >= -0.5 and board["y"] >= -0.5, snapshot
    assert board["x"] + board["width"] <= canvas["width"] + 0.5, snapshot
    assert board["y"] + board["height"] <= canvas["height"] + 0.5, snapshot
    assert snapshot["scroll"]["width"] <= snapshot["scroll"]["clientWidth"] + 1, snapshot


def capture_context(
    browser: Browser,
    name: str,
    width: int,
    height: int,
    dpr: float,
    play: bool,
) -> dict[str, Any]:
    context: BrowserContext = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=dpr,
        reduced_motion="no-preference",
        has_touch=True,
    )
    page = context.new_page()
    session = context.new_cdp_session(page)
    console_errors: list[str] = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: console_errors.append(str(error)))
    wait_for_runtime(page)
    touch_evidence = None
    if play:
        play_touch_sequence(page, session)
        touch_evidence = exercise_touch_controls(page, session)
    snapshot = geometry(page)
    assert_geometry(snapshot)
    if play:
        assert snapshot["state"]["status"] == "playing", snapshot
        assert snapshot["state"]["score"] > 0, snapshot
        assert snapshot["state"]["lockedCells"] > 0, snapshot
    screenshot_path = SCREENSHOT_DIR / f"{name}.png"
    page.screenshot(path=str(screenshot_path), full_page=True)
    result = {
        "name": name,
        "geometry": snapshot,
        "consoleErrors": console_errors,
        "screenshot": str(screenshot_path.relative_to(ROOT)).replace("\\", "/"),
        "sha256": sha256(screenshot_path),
    }
    if touch_evidence is not None:
        result["touchEvidence"] = touch_evidence
    assert not console_errors, result
    context.close()
    return result


def main() -> None:
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    captures: list[dict[str, Any]] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
            ],
        )

        desktop = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = desktop.new_page()
        console_errors: list[str] = []
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: console_errors.append(str(error)))
        wait_for_runtime(page)
        ready_path = SCREENSHOT_DIR / "desktop-ready.png"
        page.screenshot(path=str(ready_path), full_page=True)
        ready_geometry = geometry(page)
        assert_geometry(ready_geometry)
        play_sequence(page, pieces=9)
        playing_path = SCREENSHOT_DIR / "desktop-playing.png"
        page.screenshot(path=str(playing_path), full_page=True)
        playing_geometry = geometry(page)
        assert_geometry(playing_geometry)
        assert playing_geometry["state"]["score"] > 0
        assert playing_geometry["state"]["lockedCells"] > 0
        frame_metrics = measure_frames(page)
        render_cpu_metrics = page.evaluate("window.__SIGNAL_FOUNDRY_QA__.benchmarkRender(160)")
        assert render_cpu_metrics["p95Ms"] < 8, render_cpu_metrics

        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.loadScenario('four-line-clear')")
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('hard-drop')")
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(6)")
        clear_state = page.evaluate("window.__SIGNAL_FOUNDRY_QA__.getState()")
        assert clear_state["phase"] == "line-clear", clear_state
        assert clear_state["phaseTicks"] == 6, clear_state
        clear_path = SCREENSHOT_DIR / "desktop-four-line-midpoint.png"
        page.screenshot(path=str(clear_path), full_page=True)
        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(false)")

        page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('pause')")
        page.wait_for_timeout(80)
        pause_path = SCREENSHOT_DIR / "desktop-paused.png"
        page.screenshot(path=str(pause_path), full_page=True)
        assert page.get_by_role("heading", name="Instrument paused").is_visible()
        page.get_by_role("button", name="Cell codes").click()
        contrast_path = SCREENSHOT_DIR / "desktop-high-contrast.png"
        page.screenshot(path=str(contrast_path), full_page=True)
        assert not console_errors, console_errors
        captures.extend([
            {"name": "desktop-ready", "geometry": ready_geometry, "consoleErrors": console_errors, "screenshot": str(ready_path.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(ready_path)},
            {"name": "desktop-playing", "geometry": playing_geometry, "consoleErrors": console_errors, "screenshot": str(playing_path.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(playing_path)},
            {"name": "desktop-four-line-midpoint", "state": {"phase": clear_state["phase"], "phaseTicks": clear_state["phaseTicks"], "rows": clear_state["pendingClearRows"]}, "screenshot": str(clear_path.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(clear_path)},
            {"name": "desktop-paused", "screenshot": str(pause_path.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(pause_path)},
            {"name": "desktop-high-contrast", "screenshot": str(contrast_path.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(contrast_path)},
            {
                "name": "desktop-performance",
                "renderCpuMetrics": render_cpu_metrics,
                "headlessRafMetrics": frame_metrics,
                "note": "Render CPU preparation is the hard gate. Headless rAF can be environment-throttled and is recorded only.",
            },
        ])
        desktop.close()

        captures.append(capture_context(browser, "mobile-portrait", 390, 844, 3, True))
        captures.append(capture_context(browser, "mobile-landscape", 844, 390, 3, True))

        game_over = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        game_over_page = game_over.new_page()
        game_over_errors: list[str] = []
        game_over_page.on("console", lambda message: game_over_errors.append(message.text) if message.type == "error" else None)
        game_over_page.on("pageerror", lambda error: game_over_errors.append(str(error)))
        wait_for_runtime(game_over_page)
        game_over_page.get_by_role("button", name="Initialize run").click()
        for _ in range(60):
            status = game_over_page.evaluate("window.__SIGNAL_FOUNDRY_QA__.getState().status")
            if status == "game-over":
                break
            game_over_page.evaluate("window.__SIGNAL_FOUNDRY_QA__.action('hard-drop')")
            game_over_page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(18)")
        final_state = game_over_page.evaluate("window.__SIGNAL_FOUNDRY_QA__.getState()")
        assert final_state["status"] == "game-over", final_state
        assert game_over_page.get_by_role("heading", name="Matrix overflow").is_visible()
        game_over_path = SCREENSHOT_DIR / "desktop-game-over.png"
        game_over_page.screenshot(path=str(game_over_path), full_page=True)
        assert not game_over_errors, game_over_errors
        captures.append({
            "name": "desktop-game-over",
            "state": {"status": final_state["status"], "score": final_state["score"], "lines": final_state["lines"]},
            "consoleErrors": game_over_errors,
            "screenshot": str(game_over_path.relative_to(ROOT)).replace("\\", "/"),
            "sha256": sha256(game_over_path),
        })
        game_over.close()

        reduced = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            reduced_motion="reduce",
            has_touch=True,
        )
        reduced_page = reduced.new_page()
        reduced_session = reduced.new_cdp_session(reduced_page)
        reduced_errors: list[str] = []
        reduced_page.on("console", lambda message: reduced_errors.append(message.text) if message.type == "error" else None)
        reduced_page.on("pageerror", lambda error: reduced_errors.append(str(error)))
        wait_for_runtime(reduced_page)
        assert reduced_page.get_by_role("button", name="Quiet motion").get_attribute("aria-pressed") == "true"
        play_touch_sequence(reduced_page, reduced_session, pieces=4)
        reduced_touch_evidence = exercise_touch_controls(reduced_page, reduced_session)
        reduced_path = SCREENSHOT_DIR / "mobile-reduced-motion.png"
        reduced_page.screenshot(path=str(reduced_path), full_page=True)
        reduced_geometry = geometry(reduced_page)
        assert_geometry(reduced_geometry)
        assert not reduced_errors, reduced_errors
        captures.append({
            "name": "mobile-reduced-motion",
            "geometry": reduced_geometry,
            "reducedMotionEnabled": True,
            "touchEvidence": reduced_touch_evidence,
            "consoleErrors": reduced_errors,
            "screenshot": str(reduced_path.relative_to(ROOT)).replace("\\", "/"),
            "sha256": sha256(reduced_path),
        })
        reduced.close()
        browser.close()

    evidence = {
        "browser": "Playwright Chromium",
        "captures": captures,
        "result": "passed",
    }
    EVIDENCE_PATH.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"result": "passed", "captures": len(captures)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
