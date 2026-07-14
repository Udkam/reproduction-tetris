from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

from PIL import Image
from playwright.sync_api import Page, sync_playwright


ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / "docs" / "qa" / "evidence" / "tetris-t2"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:5180"

PIECE_RGB = {
    "I": [(226, 105, 68), (241, 138, 107), (255, 217, 205)],
    "O": [(18, 174, 157), (77, 198, 184), (212, 248, 243)],
    "T": [(213, 154, 56), (230, 185, 97), (255, 237, 208)],
    "S": [(78, 115, 176), (119, 147, 195), (221, 230, 246)],
    "Z": [(117, 166, 92), (151, 189, 132), (228, 243, 221)],
    "J": [(78, 73, 176), (119, 114, 202), (226, 224, 248)],
    "L": [(182, 95, 130), (206, 134, 162), (245, 218, 228)],
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compact_state(state: dict) -> dict:
    return {
        key: state.get(key)
        for key in ("status", "mode", "score", "lines", "level", "pieceCount", "elapsedTicks", "puzzleId", "puzzleTargetLines", "puzzlePieceBudget", "active")
    }


def collect(page: Page) -> dict:
    return page.evaluate("() => window.__TETRIS_D4_QA__.collect()")


def color_near(value: tuple[int, int, int], candidate: tuple[int, int, int], tolerance: int = 18) -> bool:
    return sum((left - right) ** 2 for left, right in zip(value, candidate)) <= tolerance ** 2


def assert_preview_clear(screenshot: Path, geometry: dict, dpr: int) -> dict:
    renderer = geometry["renderer"]
    clear_bounds = renderer["previewClearBounds"]
    host = geometry["bounds"]["canvasHost"]
    piece = renderer["previewClearPiece"]
    if not clear_bounds or not host or not piece:
        raise AssertionError("mode-switch: renderer did not expose the prior preview clear bounds and piece")
    image = Image.open(screenshot).convert("RGB")
    left = round((host["left"] + clear_bounds["x"]) * dpr)
    top = round((host["top"] + clear_bounds["y"]) * dpr)
    right = round((host["left"] + clear_bounds["x"] + clear_bounds["width"]) * dpr)
    bottom = round((host["top"] + clear_bounds["y"] + clear_bounds["height"]) * dpr)
    materials = PIECE_RGB[piece]
    for pixel in image.crop((left, top, right, bottom)).getdata():
        if any(color_near(pixel, material) for material in materials):
            raise AssertionError("mode-switch: preview-colour residual pixels remain in the cleared canvas region")
    return {"left": left, "top": top, "right": right, "bottom": bottom, "piece": piece}


def assert_geometry(page: Page, geometry: dict, state_name: str, viewport: dict) -> None:
    assertions = geometry["assertions"]
    bounds = geometry["bounds"]
    if abs(assertions["boardRatio"] - 2) > 0.02:
        raise AssertionError(f"{state_name}: board ratio is not 1:2")
    if not assertions["noOverflow"] or assertions["canvasCount"] != 1 or assertions["domCellCount"] != 0:
        raise AssertionError(f"{state_name}: geometry/canvas assertion failed")
    if any(assertions["headerPairwiseIntersection"]) or any(assertions["structuralPairwiseIntersection"]):
        raise AssertionError(f"{state_name}: unexpected layout overlap")
    if state_name == "paused":
        if not assertions["pauseInsideBoard"] or assertions["pauseStripRatio"] > 0.18:
            raise AssertionError(f"{state_name}: pause strip escaped the board or exceeded 18%")
    if viewport["width"] <= 844:
        zones = [zone for zone in bounds["touchZones"] if zone]
        if len(zones) != 5 or min(zone["height"] for zone in zones) < 44:
            raise AssertionError(f"{state_name}: touch rail is not five zones at least 44px")
    body = page.locator("body").inner_text()
    for forbidden in ("Hold", "暂存", "已暂停", "T.", "Z/X"):
        if forbidden in body:
            raise AssertionError(f"{state_name}: visible forbidden copy {forbidden}")
    next_count = page.locator('[aria-label="下一个方块"]').count()
    expected_next = 0 if state_name in ("ready", "mode-switch") else 1
    if next_count != expected_next:
        raise AssertionError(f"{state_name}: expected {expected_next} Next slots, got {next_count}")
    if state_name in ("ready", "mode-switch"):
        for label in ("马拉松模式", "竞速模式", "解谜模式"):
            if label not in body:
                raise AssertionError(f"{state_name}: missing complete mode label {label}")
    if state_name == "mode-switch":
        renderer = geometry["renderer"]
        if assertions["boardText"]:
            raise AssertionError("mode-switch: board inner text is not empty")
        if renderer["preview"] is not None or renderer["previewLayerVisible"] or not assertions["previewLayerHidden"]:
            raise AssertionError("mode-switch: renderer still reports a visible Next preview layer")


def capture(page: Page, name: str, state_name: str, viewport: dict, console_errors: list[str], captures: list[dict]) -> None:
    page.wait_for_timeout(220)
    geometry = collect(page)
    assert_geometry(page, geometry, state_name, viewport)
    screenshot = OUT / f"{name}.png"
    page.screenshot(path=str(screenshot), full_page=False)
    if state_name == "mode-switch":
        geometry["assertions"]["previewCanvasResidue"] = False
        geometry["assertions"]["previewClearRegion"] = assert_preview_clear(screenshot, geometry, viewport["dpr"])
    captures.append({
        "name": name,
        "state": state_name,
        "viewport": viewport,
        "geometry": {"bounds": geometry["bounds"], "assertions": geometry["assertions"], "renderer": geometry["renderer"]},
        "canonical": compact_state(geometry["state"]),
        "consoleErrorsAtCapture": list(console_errors),
        "screenshot": str(screenshot.relative_to(ROOT)).replace("\\", "/"),
        "sha256": digest(screenshot),
    })


def new_page(browser, viewport: dict, errors: list[str]) -> Page:
    context = browser.new_context(viewport={"width": viewport["width"], "height": viewport["height"]}, device_scale_factor=viewport["dpr"])
    page = context.new_page()
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror:{error}"))
    page.goto(URL, wait_until="networkidle")
    page.wait_for_selector("[data-testid='game-canvas']")
    return page


def start(page: Page) -> None:
    page.get_by_role("button", name="开始", exact=True).click()
    page.wait_for_timeout(180)


def pause(page: Page) -> None:
    page.keyboard.press("Escape")
    page.wait_for_timeout(120)


def switch_mode(page: Page) -> None:
    page.get_by_role("button", name="切换模式", exact=True).click()
    page.wait_for_timeout(120)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    console_errors: list[str] = []
    captures: list[dict] = []
    profiles = [
        ("desktop", {"width": 1440, "height": 900, "dpr": 1}),
        ("portrait", {"width": 390, "height": 844, "dpr": 3}),
        ("landscape", {"width": 844, "height": 390, "dpr": 3}),
    ]
    for prefix, viewport in profiles:
        page = new_page(browser, viewport, console_errors)
        capture(page, f"{prefix}-ready", "ready", viewport, console_errors, captures)
        start(page)
        capture(page, f"{prefix}-playing", "playing", viewport, console_errors, captures)
        pause(page)
        capture(page, f"{prefix}-paused", "paused", viewport, console_errors, captures)
        switch_mode(page)
        capture(page, f"{prefix}-mode-switch", "mode-switch", viewport, console_errors, captures)
        page.context.close()

    input_page = new_page(browser, {"width": 390, "height": 844, "dpr": 3}, console_errors)
    start(input_page)
    keyboard_before = collect(input_page)["state"]
    input_page.keyboard.press("ArrowUp")
    input_page.wait_for_timeout(80)
    keyboard_after = collect(input_page)["state"]
    if keyboard_after["active"]["rotation"] == keyboard_before["active"]["rotation"]:
        raise AssertionError("ArrowUp did not dispatch clockwise rotation")
    touch_before = collect(input_page)["state"]
    input_page.get_by_test_id("touch-rotate-cw").click()
    input_page.get_by_test_id("touch-soft-drop").click()
    input_page.wait_for_timeout(80)
    touch_after = collect(input_page)["state"]
    if touch_after["active"]["rotation"] == touch_before["active"]["rotation"] or touch_after["active"]["y"] <= touch_before["active"]["y"]:
        raise AssertionError("Touch rotate or soft-drop did not dispatch")
    hard_before = touch_after["pieceCount"]
    input_page.get_by_test_id("touch-hard-drop").click()
    input_page.wait_for_timeout(80)
    hard_after = collect(input_page)["state"]
    if hard_after["pieceCount"] != hard_before + 1:
        raise AssertionError("Touch hard-drop did not lock exactly one piece")
    pause(input_page)
    paused_status = collect(input_page)["state"]["status"]
    pause(input_page)
    resumed_status = collect(input_page)["state"]["status"]
    if [paused_status, resumed_status] != ["paused", "playing"]:
        raise AssertionError("Keyboard pause/resume sequence failed")
    input_evidence = {
        "keyboardArrowUp": {"before": compact_state(keyboard_before), "after": compact_state(keyboard_after)},
        "touchRotateSoftDrop": {"before": compact_state(touch_before), "after": compact_state(touch_after)},
        "touchHardDrop": {"beforePieces": hard_before, "after": compact_state(hard_after)},
        "keyboardPauseResume": [paused_status, resumed_status],
    }
    input_page.context.close()

    race_page = new_page(browser, {"width": 1440, "height": 900, "dpr": 1}, console_errors)
    race_page.locator(".mode-lines button").filter(has_text="竞速模式").click()
    start(race_page)
    race_page.keyboard.press("Space")
    race_page.wait_for_timeout(100)
    race_first = collect(race_page)["state"]
    if race_first["mode"] != "race" or race_first["pieceCount"] != 1:
        raise AssertionError("Real Race selection/first-lock state is invalid")
    capture(race_page, "desktop-race-first-lock", "playing", {"width": 1440, "height": 900, "dpr": 1}, console_errors, captures)
    race_completion = race_page.evaluate("() => window.__SIGNAL_FOUNDRY_QA__.replayScenario('race-completion')")
    race_page.wait_for_timeout(160)
    race_finished = collect(race_page)["state"]
    if race_finished["status"] != "finished" or race_finished["lines"] != 20:
        raise AssertionError("Race replay did not finish at 20 lines")
    race_storage = race_page.evaluate("() => JSON.parse(localStorage.getItem('stack-order:leaderboard:v2') || '{}')")
    if any(record.get("mode") != "race" for record in race_storage.get("race", [])):
        raise AssertionError("Race completion record crossed leaderboard ownership")
    capture(race_page, "desktop-race-finished", "finished", {"width": 1440, "height": 900, "dpr": 1}, console_errors, captures)
    race_page.context.close()

    marathon_page = new_page(browser, {"width": 1440, "height": 900, "dpr": 1}, console_errors)
    start(marathon_page)
    marathon_terminal = marathon_page.evaluate("""() => {
      const qa = window.__SIGNAL_FOUNDRY_QA__;
      let commands = 0;
      while (qa.getState().status === 'playing' && commands < 80) {
        qa.action('hard-drop'); commands += 1; qa.advanceTicks(3);
      }
      return { commands, state: qa.getState() };
    }""")
    if marathon_terminal["state"]["status"] != "game-over":
        raise AssertionError("Marathon public-command sequence did not top out")
    marathon_storage = marathon_page.evaluate("() => JSON.parse(localStorage.getItem('stack-order:leaderboard:v2') || '{}')")
    if any(record.get("mode") != "marathon" for record in marathon_storage.get("marathon", [])):
        raise AssertionError("Marathon top-out record crossed leaderboard ownership")
    capture(marathon_page, "desktop-marathon-top-out", "game-over", {"width": 1440, "height": 900, "dpr": 1}, console_errors, captures)
    marathon_page.context.close()

    puzzle_page = new_page(browser, {"width": 1440, "height": 900, "dpr": 1}, console_errors)
    puzzle_replay = puzzle_page.evaluate("""() => {
      const replay = window.__SIGNAL_FOUNDRY_QA__.replayScenario('puzzle-rotation');
      return { replay, state: window.__SIGNAL_FOUNDRY_QA__.getState() };
    }""")
    if puzzle_replay["replay"]["hash"] != "e6936c36" or puzzle_replay["state"]["status"] != "finished":
        raise AssertionError("Puzzle rotation replay hash/status changed")
    capture(puzzle_page, "desktop-puzzle-rotation-finished", "finished", {"width": 1440, "height": 900, "dpr": 1}, console_errors, captures)
    puzzle_page.context.close()

    browser.close()
    result = {
        "sourceHead": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "browser": "Playwright Chromium (real Vite runtime)",
        "method": "All UI and replay states are reached through user events or existing public runtime QA command/replay surfaces; no canonical board is fabricated.",
        "captures": captures,
        "inputEvidence": input_evidence,
        "raceReplay": race_completion,
        "raceFirstLock": compact_state(race_first),
        "marathonTopOut": {"commands": marathon_terminal["commands"], "state": compact_state(marathon_terminal["state"])},
        "puzzleRotation": puzzle_replay,
        "consoleAndPageErrors": console_errors,
        "result": "passed" if not console_errors else "failed",
    }
    (OUT / "browser-evidence.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print((OUT / "browser-evidence.json").resolve())
