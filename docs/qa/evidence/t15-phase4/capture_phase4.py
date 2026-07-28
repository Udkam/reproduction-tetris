from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright


ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
BASE_URL = "http://127.0.0.1:4178/"
CANDIDATE = "cc8c71f"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def start_survival(context: BrowserContext) -> tuple[Page, list[str]]:
    page = context.new_page()
    errors: list[str] = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE_URL, wait_until="networkidle")

    entry = page.locator("[data-testid='enter-race']")
    assert entry.count() == 1
    entry.click()
    dialog = page.locator("[role='dialog']")
    if dialog.count() == 0 or not dialog.is_visible():
        entry.click()
    intro_start = page.get_by_role("button", name="开始", exact=True)
    if intro_start.count() == 1 and intro_start.is_visible():
        intro_start.click()

    page.wait_for_function("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
    page.wait_for_function("window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'", timeout=6000)
    return page, errors


def collect(page: Page) -> dict[str, Any]:
    return page.evaluate(
        """
        () => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          const state = qa.getState();
          const renderer = qa.getRendererSnapshot();
          const rect = (selector) => {
            const node = document.querySelector(selector);
            if (!node) return null;
            const box = node.getBoundingClientRect();
            return {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              right: box.right,
              bottom: box.bottom,
            };
          };
          return {
            state: {
              status: state.status,
              mode: state.mode,
              lines: state.lines,
              elapsedTicks: state.elapsedTicks,
              bedrockRows: state.survivalBedrockRows,
              bedrockIntervalTicks: state.survivalIntervalTicks,
              stoneIntervalSeconds: state.survivalDebrisIntervalSeconds,
              stoneIntervalTicks: state.survivalDebrisIntervalTicks,
              warningColumns: [...state.survivalDebrisWarningColumns],
              debris: state.survivalDebris.map((stone) => ({ ...stone })),
            },
            renderer: {
              board: renderer.board,
              warningColumns: [...renderer.survivalDebrisWarningColumns],
              debris: renderer.survivalDebris.map((stone) => ({ ...stone })),
              cueCount: renderer.survivalStoneCueCount,
            },
            stats: [...document.querySelectorAll("[data-testid='stats'] article")].map((node) => node.textContent?.trim()),
            bounds: {
              board: rect("[data-testid='board-frame']"),
              stats: rect("[data-testid='stats']"),
              next: rect("[data-testid='next-slot']"),
            },
            viewport: {
              width: innerWidth,
              height: innerHeight,
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight,
            },
            assertions: {
              canvasCount: document.querySelectorAll("canvas").length,
              domCellCount: document.querySelectorAll("[data-game-cell]").length,
              noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
              noVerticalOverflow: document.documentElement.scrollHeight <= innerHeight,
              reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
            },
          };
        }
        """
    )


def capture(page: Page, name: str) -> dict[str, Any]:
    path = OUT / f"{name}.png"
    page.screenshot(path=str(path), full_page=True)
    return {
        "name": name,
        "path": str(path.relative_to(ROOT)).replace("\\", "/"),
        "sha256": sha256(path),
        "snapshot": collect(page),
    }


def assert_surface(snapshot: dict[str, Any], width: int, height: int) -> None:
    assert snapshot["state"]["mode"] == "race"
    assert snapshot["assertions"]["canvasCount"] == 1
    assert snapshot["assertions"]["domCellCount"] == 0
    assert snapshot["assertions"]["noHorizontalOverflow"]
    assert snapshot["viewport"]["width"] == width
    assert snapshot["viewport"]["height"] == height
    assert len(snapshot["stats"]) == 4
    assert snapshot["bounds"]["board"] is not None
    assert snapshot["bounds"]["stats"] is not None
    assert snapshot["bounds"]["next"] is not None


def advance_to_warning(page: Page) -> tuple[list[int], dict[str, Any]]:
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(1080)")
    warning = collect(page)
    columns = warning["state"]["warningColumns"]
    assert 1 <= len(columns) <= 2
    assert len(columns) == len(set(columns))
    assert columns == warning["renderer"]["warningColumns"]
    assert warning["state"]["debris"] == []
    assert warning["state"]["stoneIntervalTicks"] == 1080
    return columns, warning


def run_desktop(browser: Browser) -> dict[str, Any]:
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        device_scale_factor=1,
        reduced_motion="no-preference",
    )
    page, errors = start_survival(context)
    baseline = collect(page)
    assert_surface(baseline, 1280, 720)
    assert baseline["state"]["bedrockRows"] == 3

    columns, warning = advance_to_warning(page)
    warning_capture = capture(page, "desktop-warning")

    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(119)")
    before_spawn = collect(page)
    assert before_spawn["state"]["debris"] == []
    assert before_spawn["state"]["warningColumns"] == columns
    assert before_spawn["state"]["stoneIntervalTicks"] == 1199

    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(1)")
    spawned = collect(page)
    spawn_columns = sorted(stone["x"] for stone in spawned["state"]["debris"])
    assert spawn_columns == sorted(columns)
    assert spawned["state"]["warningColumns"] == []
    assert spawned["state"]["stoneIntervalTicks"] == 0
    assert spawned["state"]["stoneIntervalSeconds"] == 19
    assert spawned["renderer"]["cueCount"] >= 1
    spawn_capture = capture(page, "desktop-spawn")

    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(40)")
    falling = collect(page)
    assert falling["state"]["debris"]
    for stone in falling["renderer"]["debris"]:
        assert stone["presentationY"] <= stone["y"]
    falling_capture = capture(page, "desktop-falling")

    landed_after = page.evaluate(
        """
        () => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          let ticks = 0;
          while (qa.getState().survivalDebris.length > 0 && ticks < 900) {
            qa.advanceTicks(1);
            ticks += 1;
          }
          return ticks;
        }
        """
    )
    landed = collect(page)
    assert landed_after < 900
    assert landed["state"]["debris"] == []
    assert landed["renderer"]["cueCount"] >= 1
    landed_capture = capture(page, "desktop-landed")
    assert errors == []
    context.close()
    return {
        "scenario": "desktop",
        "errors": errors,
        "baseline": baseline,
        "warning": warning,
        "spawned": spawned,
        "falling": falling,
        "landed": landed,
        "landedAfterTicks": landed_after,
        "captures": [warning_capture, spawn_capture, falling_capture, landed_capture],
    }


def run_compact(
    browser: Browser,
    name: str,
    width: int,
    height: int,
    reduced_motion: str,
) -> dict[str, Any]:
    context = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=1,
        reduced_motion=reduced_motion,
        has_touch=True,
    )
    page, errors = start_survival(context)
    columns, warning = advance_to_warning(page)
    assert_surface(warning, width, height)
    assert warning["assertions"]["reducedMotion"] == (reduced_motion == "reduce")
    capture_result = capture(page, f"{name}-warning")
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.advanceTicks(120)")
    spawned = collect(page)
    assert sorted(stone["x"] for stone in spawned["state"]["debris"]) == sorted(columns)
    assert spawned["renderer"]["warningColumns"] == []
    if reduced_motion == "reduce":
        assert all(stone["presentationY"] == stone["y"] for stone in spawned["renderer"]["debris"])
    assert errors == []
    context.close()
    return {
        "scenario": name,
        "errors": errors,
        "warning": warning,
        "spawned": spawned,
        "capture": capture_result,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--use-gl=angle",
                "--use-angle=swiftshader",
            ],
        )
        result = {
            "candidate": CANDIDATE,
            "baseUrl": BASE_URL,
            "browserVersion": browser.version,
            "desktop": run_desktop(browser),
            "portrait": run_compact(browser, "portrait", 390, 844, "no-preference"),
            "landscapeReduced": run_compact(browser, "landscape-reduced", 844, 390, "reduce"),
        }
        browser.close()

    evidence_path = OUT / "phase4-browser-evidence.json"
    evidence_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "result": "passed",
                "candidate": CANDIDATE,
                "browserVersion": result["browserVersion"],
                "desktopWarningColumns": result["desktop"]["warning"]["state"]["warningColumns"],
                "desktopSpawnColumns": [
                    stone["x"] for stone in result["desktop"]["spawned"]["state"]["debris"]
                ],
                "desktopLandingTicks": result["desktop"]["landedAfterTicks"],
                "portraitOverflow": result["portrait"]["warning"]["assertions"]["noHorizontalOverflow"],
                "reducedMotion": result["landscapeReduced"]["warning"]["assertions"]["reducedMotion"],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
