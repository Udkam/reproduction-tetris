from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright


ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
BASE_URL = "http://127.0.0.1:4178/"
CANDIDATE = "2af2adfc1640b2d5be2197ec1bf92db8637f70ef"
FIXED_RUN_SEED = 0x5A0E
FIXED_SEED_INIT_SCRIPT = f"""
Object.defineProperty(window.crypto, "getRandomValues", {{
  configurable: true,
  value: (values) => {{
    for (let index = 0; index < values.length; index += 1) values[index] = {FIXED_RUN_SEED};
    return values;
  }},
}});
"""
PRODUCT_PATHS = (
    "src",
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
)
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


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=ROOT,
        check=check,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def candidate_binding() -> dict[str, Any]:
    resolved = git("rev-parse", f"{CANDIDATE}^{{commit}}").stdout.strip()
    head = git("rev-parse", "HEAD").stdout.strip()
    product_status = git("status", "--short", "--", *PRODUCT_PATHS).stdout.splitlines()
    product_diff = git("diff", "--quiet", CANDIDATE, "--", *PRODUCT_PATHS, check=False)
    assert resolved == CANDIDATE
    assert head == CANDIDATE
    assert product_status == []
    assert product_diff.returncode == 0
    return {
        "sourceCandidate": CANDIDATE,
        "gitHead": head,
        "headMatchesCandidate": head == CANDIDATE,
        "productTreeMatchesCandidate": product_diff.returncode == 0,
        "productStatus": product_status,
        "productPaths": list(PRODUCT_PATHS),
    }


def attach_error_capture(page: Page) -> list[str]:
    errors: list[str] = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    return errors


def open_home(context: BrowserContext) -> tuple[Page, list[str]]:
    page = context.new_page()
    errors = attach_error_capture(page)
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_selector("[data-testid='enter-race']")
    return page, errors


def enter_survival(page: Page, *, wait_for_playing: bool = True) -> None:
    entry = page.locator("[data-testid='enter-race']")
    assert entry.count() == 1
    entry.click()
    page.wait_for_timeout(100)
    if (
        page.locator("[role='dialog']").count() == 0
        and page.locator("[data-testid='game-screen']").count() == 0
    ):
        entry.click()
        page.wait_for_timeout(100)
    intro_start = page.locator("[role='dialog'] .primary-action")
    if intro_start.count() == 1 and intro_start.is_visible():
        intro_start.click()

    page.wait_for_function("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
    if wait_for_playing:
        page.wait_for_function(
            "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
            timeout=6000,
        )


def start_survival(context: BrowserContext) -> tuple[Page, list[str]]:
    page, errors = open_home(context)
    enter_survival(page, wait_for_playing=False)
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=6000,
    )
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
              bedrockIntervalTicks: state.survivalPressureTicks,
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
    page.evaluate(
        """
        () => {
          const qa = window.__SIGNAL_FOUNDRY_QA__;
          // Resolve the first 13-second bedrock rise through a real player lock.
          // This prevents an unattended proof run from legitimately topping out
          // while the first stone is still crossing the entry rows.
          qa.advanceTicks(780);
          qa.action("hard-drop");
          qa.advanceTicks(3);
          qa.advanceTicks(297);
        }
        """
    )
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
    context.add_init_script(FIXED_SEED_INIT_SCRIPT)
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
    context.add_init_script(FIXED_SEED_INIT_SCRIPT)
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


def lifecycle_snapshot(page: Page) -> dict[str, Any]:
    return page.evaluate(
        """
        () => ({
          ...window.__T15_LIFECYCLE__.snapshot(),
          canvasCount: document.querySelectorAll("canvas").length,
          qaMounted: Boolean(window.__SIGNAL_FOUNDRY_QA__),
          gameScreenMounted: Boolean(document.querySelector("[data-testid='game-screen']")),
          dialogTitle: document.querySelector("[role='dialog'] h2")?.textContent?.trim() ?? null,
        })
        """
    )


def run_lifecycle(browser: Browser) -> dict[str, Any]:
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        device_scale_factor=1,
        reduced_motion="no-preference",
    )
    context.add_init_script(FIXED_SEED_INIT_SCRIPT)
    context.add_init_script(LIFECYCLE_INIT_SCRIPT)
    page, errors = open_home(context)
    page.wait_for_timeout(250)
    baseline = lifecycle_snapshot(page)
    assert baseline["canvasCount"] == 0
    assert not baseline["qaMounted"]
    assert baseline["openAudioContexts"] == 0

    enter_survival(page, wait_for_playing=False)
    page.wait_for_selector("[data-testid='entry-countdown']")
    countdown_before = page.locator("[data-testid='entry-countdown']").get_attribute("data-countdown")
    page.locator("[data-testid='open-settings']").click()
    page.wait_for_selector("[data-testid='settings-sheet']")
    page.wait_for_timeout(1200)
    countdown_during = page.locator("[data-testid='entry-countdown']").get_attribute("data-countdown")
    assert countdown_before == countdown_during
    settings_capture = capture(page, "lifecycle-countdown-settings")
    page.locator("[data-testid='settings-sheet'] .primary-action").click()

    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=6000,
    )
    page.evaluate(
        """
        () => {
          window.__SIGNAL_FOUNDRY_QA__.setFrozen(true);
          document.querySelector("canvas").dataset.t15LifecycleCanvas = "first";
        }
        """
    )
    mounted = lifecycle_snapshot(page)
    assert mounted["canvasCount"] == 1
    assert mounted["qaMounted"]
    assert mounted["globalListenerCount"] > baseline["globalListenerCount"]
    assert mounted["pendingAnimationFrames"] >= baseline["pendingAnimationFrames"]

    page.keyboard.press("p")
    page.wait_for_selector("[role='dialog']")
    paused = lifecycle_snapshot(page)
    assert page.locator("[role='dialog']").is_visible()
    assert page.locator("[role='dialog'] .primary-action").count() == 1
    paused_capture = capture(page, "lifecycle-paused")
    page.locator("[role='dialog'] .primary-action").click()
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=3000,
    )

    page.locator("[data-testid='open-settings']").click()
    page.locator("[data-testid='settings-restart']").click()
    page.wait_for_selector("[data-testid='confirm-restart']")
    page.locator("[data-testid='confirm-restart']").click()
    page.wait_for_function(
        "window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'",
        timeout=3000,
    )
    after_restart = lifecycle_snapshot(page)
    same_canvas_after_restart = page.evaluate(
        "document.querySelector('canvas')?.dataset.t15LifecycleCanvas === 'first'"
    )
    assert same_canvas_after_restart
    assert after_restart["canvasCount"] == 1

    page.locator("[data-testid='exit-game']").click()
    page.wait_for_selector("[role='dialog']")
    page.locator("[role='dialog'] .secondary-action").click()
    page.wait_for_selector("[data-testid='enter-race']")
    page.wait_for_function("() => !window.__SIGNAL_FOUNDRY_QA__")
    page.wait_for_timeout(350)
    after_unmount = lifecycle_snapshot(page)
    assert after_unmount["canvasCount"] == 0
    assert not after_unmount["qaMounted"]
    assert after_unmount["globalListeners"] == baseline["globalListeners"]
    assert after_unmount["pendingAnimationFrames"] == baseline["pendingAnimationFrames"]
    assert after_unmount["openAudioContexts"] == 0

    enter_survival(page)
    page.evaluate("window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
    remounted = lifecycle_snapshot(page)
    assert remounted["canvasCount"] == 1
    assert remounted["qaMounted"]
    assert remounted["globalListenerCount"] > baseline["globalListenerCount"]

    page.locator("[data-testid='exit-game']").click()
    page.locator("[role='dialog'] .secondary-action").click()
    page.wait_for_selector("[data-testid='enter-race']")
    page.wait_for_function("() => !window.__SIGNAL_FOUNDRY_QA__")
    page.wait_for_timeout(350)
    after_second_unmount = lifecycle_snapshot(page)
    assert after_second_unmount["canvasCount"] == 0
    assert not after_second_unmount["qaMounted"]
    assert after_second_unmount["globalListeners"] == baseline["globalListeners"]
    assert after_second_unmount["pendingAnimationFrames"] == baseline["pendingAnimationFrames"]
    assert after_second_unmount["openAudioContexts"] == 0
    assert errors == []
    context.close()
    return {
        "scenario": "lifecycle",
        "errors": errors,
        "countdown": {
            "beforeSettings": countdown_before,
            "after1200msInSettings": countdown_during,
            "frozen": countdown_before == countdown_during,
        },
        "sameCanvasAfterRestart": same_canvas_after_restart,
        "baseline": baseline,
        "mounted": mounted,
        "paused": paused,
        "afterRestart": after_restart,
        "afterUnmount": after_unmount,
        "remounted": remounted,
        "afterSecondUnmount": after_second_unmount,
        "captures": [settings_capture, paused_capture],
    }


def run_english(browser: Browser) -> dict[str, Any]:
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        device_scale_factor=1,
        reduced_motion="no-preference",
    )
    context.add_init_script(FIXED_SEED_INIT_SCRIPT)
    context.add_init_script(
        "window.localStorage.setItem('tetramorph:language:v1', 'en')"
    )
    page, errors = start_survival(context)
    columns, warning = advance_to_warning(page)
    assert_surface(warning, 1280, 720)
    stats_text = " ".join(item or "" for item in warning["stats"])
    for expected in ("Survival time", "Lines", "Bedrock", "Stonefall", "0:18"):
        assert expected in stats_text
    capture_result = capture(page, "english-warning")
    assert errors == []
    context.close()
    return {
        "scenario": "english",
        "errors": errors,
        "warningColumns": columns,
        "warning": warning,
        "capture": capture_result,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    binding = candidate_binding()
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
            "candidateBinding": binding,
            "baseUrl": BASE_URL,
            "browserVersion": browser.version,
            "desktop": run_desktop(browser),
            "portrait": run_compact(browser, "portrait", 390, 844, "no-preference"),
            "landscapeReduced": run_compact(browser, "landscape-reduced", 844, 390, "reduce"),
            "english": run_english(browser),
            "lifecycle": run_lifecycle(browser),
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
                "englishWarningColumns": result["english"]["warningColumns"],
                "countdownFrozenInSettings": result["lifecycle"]["countdown"]["frozen"],
                "sameCanvasAfterRestart": result["lifecycle"]["sameCanvasAfterRestart"],
                "listenerBaselineRestored": (
                    result["lifecycle"]["baseline"]["globalListeners"]
                    == result["lifecycle"]["afterSecondUnmount"]["globalListeners"]
                ),
                "openAudioContextsAfterUnmount": result["lifecycle"]["afterSecondUnmount"][
                    "openAudioContexts"
                ],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
