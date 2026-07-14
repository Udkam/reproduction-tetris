from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


OUT = Path("docs/screenshots/tetris/d4-dev")
OUT.mkdir(parents=True, exist_ok=True)


def collect(page: Page) -> dict:
    return page.evaluate("() => window.__TETRIS_D4_QA__.collect()")


def capture(page: Page, name: str, result: dict) -> None:
    page.wait_for_timeout(240)
    page.screenshot(path=str(OUT / f"{name}.png"), full_page=False)
    result[name] = collect(page)


def start_run(page: Page) -> None:
    page.get_by_role("button", name="开始", exact=True).click()
    page.wait_for_timeout(240)


def pause_run(page: Page) -> None:
    page.keyboard.press("Escape")
    page.wait_for_timeout(160)


def switch_mode(page: Page) -> None:
    page.get_by_role("button", name="切换模式", exact=True).click()
    page.wait_for_timeout(160)


def new_page(browser, viewport: dict[str, int], dpr: int, errors: list[str]) -> Page:
    context = browser.new_context(viewport=viewport, device_scale_factor=dpr)
    page = context.new_page()
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror:{error}"))
    page.goto("http://127.0.0.1:5180", wait_until="networkidle")
    page.wait_for_selector("[data-testid='game-canvas']")
    return page


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    output: dict[str, object] = {"consoleErrors": []}
    errors: list[str] = output["consoleErrors"]  # type: ignore[assignment]

    desktop = new_page(browser, {"width": 1440, "height": 900}, 1, errors)
    capture(desktop, "desktop-ready-1440x900", output)
    start_run(desktop)
    capture(desktop, "desktop-playing-1440x900", output)
    pause_run(desktop)
    capture(desktop, "desktop-paused-1440x900", output)
    switch_mode(desktop)
    capture(desktop, "desktop-mode-switch-1440x900", output)
    proof = desktop.evaluate("""() => {
      const replay = window.__SIGNAL_FOUNDRY_QA__.replayScenario('puzzle-rotation');
      return { replay, canonical: window.__SIGNAL_FOUNDRY_QA__.getState() };
    }""")
    output["puzzleProof"] = proof
    desktop.context.close()

    portrait = new_page(browser, {"width": 390, "height": 844}, 3, errors)
    start_run(portrait)
    capture(portrait, "portrait-playing-390x844", output)
    pause_run(portrait)
    capture(portrait, "portrait-paused-390x844", output)
    switch_mode(portrait)
    capture(portrait, "portrait-mode-switch-390x844", output)
    portrait.context.close()

    landscape = new_page(browser, {"width": 844, "height": 390}, 3, errors)
    start_run(landscape)
    capture(landscape, "landscape-playing-844x390", output)
    pause_run(landscape)
    capture(landscape, "landscape-paused-844x390", output)
    switch_mode(landscape)
    capture(landscape, "landscape-mode-switch-844x390", output)
    landscape.context.close()
    browser.close()

(OUT / "geometry-dev.json").write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
print((OUT / "geometry-dev.json").resolve())
