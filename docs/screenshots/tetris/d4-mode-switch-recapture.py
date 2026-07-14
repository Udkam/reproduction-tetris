from __future__ import annotations

import json
from pathlib import Path

from PIL import Image
from playwright.sync_api import Page, sync_playwright


ROOT = Path.cwd()
OUT = ROOT / "docs" / "screenshots" / "tetris" / "d4-dev"
SUMMARY_PATH = OUT / "geometry-summary.json"

PIECE_RGB = {
    "I": [(226, 105, 68), (241, 138, 107), (255, 217, 205)],
    "O": [(18, 174, 157), (77, 198, 184), (212, 248, 243)],
    "T": [(213, 154, 56), (230, 185, 97), (255, 237, 208)],
    "S": [(78, 115, 176), (119, 147, 195), (221, 230, 246)],
    "Z": [(117, 166, 92), (151, 189, 132), (228, 243, 221)],
    "J": [(78, 73, 176), (119, 114, 202), (226, 224, 248)],
    "L": [(182, 95, 130), (206, 134, 162), (245, 218, 228)],
}


def collect(page: Page) -> dict:
    return page.evaluate("() => window.__TETRIS_D4_QA__.collect()")


def color_near(value: tuple[int, int, int], candidate: tuple[int, int, int], tolerance: int = 18) -> bool:
    return sum((left - right) ** 2 for left, right in zip(value, candidate)) <= tolerance ** 2


def preview_residue(screenshot: Path, geometry: dict, dpr: int) -> tuple[bool, dict]:
    renderer = geometry["renderer"]
    clear_bounds = renderer["previewClearBounds"]
    host = geometry["bounds"]["canvasHost"]
    piece = renderer["previewClearPiece"]
    if not clear_bounds or not host or not piece:
        raise AssertionError("Mode-switch renderer did not expose the prior preview clear bounds and piece.")
    image = Image.open(screenshot).convert("RGB")
    left = round((host["left"] + clear_bounds["x"]) * dpr)
    top = round((host["top"] + clear_bounds["y"]) * dpr)
    right = round((host["left"] + clear_bounds["x"] + clear_bounds["width"]) * dpr)
    bottom = round((host["top"] + clear_bounds["y"] + clear_bounds["height"]) * dpr)
    crop = image.crop((left, top, right, bottom))
    materials = PIECE_RGB[piece]
    for pixel in crop.getdata():
        if any(color_near(pixel, material) for material in materials):
            return True, {"left": left, "top": top, "right": right, "bottom": bottom, "piece": piece}
    return False, {"left": left, "top": top, "right": right, "bottom": bottom, "piece": piece}


def open_mode_switch(page: Page) -> None:
    page.get_by_role("button", name="开始", exact=True).click()
    page.wait_for_timeout(160)
    page.keyboard.press("Escape")
    page.wait_for_timeout(120)
    page.get_by_role("button", name="切换模式", exact=True).click()
    page.wait_for_timeout(260)


def recapture(browser, key: str, filename: str, viewport: dict[str, int], errors: list[str], summary: dict) -> None:
    context = browser.new_context(viewport={"width": viewport["width"], "height": viewport["height"]}, device_scale_factor=viewport["dpr"])
    page = context.new_page()
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror:{error}"))
    page.goto("http://127.0.0.1:5180", wait_until="networkidle")
    page.wait_for_selector("[data-testid='game-canvas']")
    open_mode_switch(page)
    geometry = collect(page)
    renderer = geometry["renderer"]
    if renderer["preview"] is not None or renderer["previewLayerVisible"] or geometry["assertions"]["previewLayerHidden"] is not True:
        raise AssertionError(f"{key}: renderer still reports a visible preview layer.")
    if geometry["assertions"]["boardText"]:
        raise AssertionError(f"{key}: mode-switch board text is not empty.")
    screenshot = OUT / filename
    page.screenshot(path=str(screenshot), full_page=False)
    residue, region = preview_residue(screenshot, geometry, viewport["dpr"])
    if residue:
        raise AssertionError(f"{key}: preview-colour residual pixels remain in the cleared canvas region.")
    record = summary[key]
    record["renderer"] = renderer
    record["bounds"] = geometry["bounds"]
    record["assertions"] = {
        **geometry["assertions"],
        "previewCanvasResidue": False,
        "previewClearRegion": region,
    }
    record["consoleErrors"] = list(errors)
    context.close()


summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
errors: list[str] = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    recapture(browser, "desktop-mode-switch-1440x900", "desktop-mode-switch-1440x900.png", {"width": 1440, "height": 900, "dpr": 1}, errors, summary)
    recapture(browser, "landscape-mode-switch-844x390", "landscape-mode-switch-844x390.png", {"width": 844, "height": 390, "dpr": 3}, errors, summary)
    browser.close()

if errors:
    raise AssertionError(f"Console/page errors during recapture: {errors}")
summary["consoleErrors"] = []
SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(SUMMARY_PATH.resolve())
