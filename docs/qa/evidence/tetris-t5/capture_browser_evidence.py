from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright


SCRIPT_PATH = Path(__file__).resolve()
OUTPUT_DIR = SCRIPT_PATH.parent
REPO_ROOT = SCRIPT_PATH.parents[4]
REFERENCES_PATH = REPO_ROOT / "docs" / "workstreams" / "tetris-t5-core" / "puzzle-references.json"
BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4175/"

CAPTURES: list[dict[str, Any]] = []
CHECKS: dict[str, Any] = {}
ERRORS: list[dict[str, str]] = []
BANNED_VISIBLE_TEXT = (
    "青流方阵",
    "AQUA ROUTE",
    "路线",
    "20 行",
    "剩余行",
    "完成目标",
    "方块预算",
    "难度",
    "锁定",
    "剩余方块",
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def attach_error_tracking(page: Page, label: str) -> list[dict[str, str]]:
    page_errors: list[dict[str, str]] = []

    def on_console(message: Any) -> None:
        if message.type == "error":
            page_errors.append({"capture": label, "type": "console.error", "text": message.text})

    def on_page_error(error: Any) -> None:
        page_errors.append({"capture": label, "type": "pageerror", "text": str(error)})

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    return page_errors


def open_page(
    browser: Browser,
    *,
    width: int,
    height: int,
    dpr: int,
    label: str,
    has_touch: bool = False,
) -> tuple[BrowserContext, Page, list[dict[str, str]]]:
    context = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=dpr,
        color_scheme="light",
        reduced_motion="no-preference",
        locale="zh-CN",
        has_touch=has_touch,
    )
    page = context.new_page()
    page_errors = attach_error_tracking(page, label)
    page.goto(BASE_URL, wait_until="networkidle")
    page.evaluate("document.fonts && document.fonts.ready")
    page.wait_for_timeout(150)
    return context, page, page_errors


def qa_state(page: Page) -> dict[str, Any] | None:
    return page.evaluate(
        "() => window.__SIGNAL_FOUNDRY_QA__ ? window.__SIGNAL_FOUNDRY_QA__.getState() : null"
    )


def wait_for_game(page: Page, expected_mode: str) -> None:
    page.locator('[data-testid="game-screen"]').wait_for(state="visible")
    page.wait_for_function(
        "mode => Boolean(window.__SIGNAL_FOUNDRY_QA__)"
        " && window.__SIGNAL_FOUNDRY_QA__.getState().mode === mode"
        " && window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'"
        " && Boolean(window.__SIGNAL_FOUNDRY_QA__.getState().active)",
        arg=expected_mode,
    )
    page.wait_for_function("() => document.querySelectorAll('canvas').length === 1")
    page.wait_for_timeout(120)


def enter_mode(page: Page, mode: str, puzzle_id: str | None = None) -> None:
    page.locator(f'[data-testid="enter-{mode}"]').click()
    if mode == "puzzle":
        page.locator('[data-testid="puzzle-library"]').wait_for(state="visible")
        require(page.locator('[data-testid="level-row"]:not([disabled])').count() == 6, "All six Puzzle levels must be enabled.")
        if puzzle_id is not None:
            page.locator(f'[data-level-id="{puzzle_id}"]').click()
        started = False
        for selector in ('[data-testid="start-selected-puzzle"]', '[data-testid="start-selected-puzzle-mobile"]'):
            control = page.locator(selector)
            if control.count() and control.is_visible():
                control.click()
                started = True
                break
        require(started, "No visible Puzzle start action was found.")
    wait_for_game(page, mode)


def hard_drop(page: Page, *, touch: bool = False) -> dict[str, Any]:
    before = qa_state(page)
    require(before is not None, "Runtime state is unavailable before hard drop.")
    before_count = int(before["pieceCount"])
    if touch:
        page.locator('[data-testid="touch-hard-drop"]').tap()
    else:
        page.keyboard.press("Space")
    page.wait_for_function(
        "beforeCount => {"
        " const qa = window.__SIGNAL_FOUNDRY_QA__;"
        " if (!qa) return false;"
        " const state = qa.getState();"
        " return state.pieceCount > beforeCount || state.status === 'game-over' || state.status === 'finished';"
        "}",
        arg=before_count,
    )
    page.wait_for_function(
        "() => {"
        " const qa = window.__SIGNAL_FOUNDRY_QA__;"
        " if (!qa) return false;"
        " const state = qa.getState();"
        " return state.status !== 'playing' || (state.phase === 'active' && Boolean(state.active));"
        "}",
    )
    page.wait_for_timeout(30)
    after = qa_state(page)
    require(after is not None, "Runtime state is unavailable after hard drop.")
    return after


def gravity_lock(page: Page) -> dict[str, Any]:
    before = qa_state(page)
    require(before is not None, "Runtime state is unavailable before gravity lock.")
    before_count = int(before["pieceCount"])
    require(page.evaluate("() => typeof window.advanceTime === 'function'"), "Deterministic time hook is unavailable.")
    for _ in range(40):
        page.evaluate("() => window.advanceTime(1000)")
        page.wait_for_timeout(4)
        after = qa_state(page)
        if after and int(after["pieceCount"]) > before_count:
            page.wait_for_function(
                "() => {"
                " const qa = window.__SIGNAL_FOUNDRY_QA__;"
                " if (!qa) return false;"
                " const state = qa.getState();"
                " return state.status !== 'playing' || (state.phase === 'active' && Boolean(state.active));"
                "}",
            )
            settled = qa_state(page)
            require(settled is not None, "Runtime state disappeared after gravity lock.")
            return settled
    raise AssertionError(f"Normal gravity did not lock a piece after count {before_count}.")


def rect_metrics(page: Page) -> dict[str, Any]:
    return page.evaluate(
        """() => {
          const visible = (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          };
          const rectFor = (selector) => {
            const element = document.querySelector(selector);
            if (!element || !visible(element)) return null;
            const rect = element.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
          };
          const overlap = (left, right) => {
            if (!left || !right) return 0;
            const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.x, right.x));
            const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.y, right.y));
            return width * height;
          };
          const buttons = [...document.querySelectorAll('button')]
            .filter(visible)
            .map((button) => {
              const rect = button.getBoundingClientRect();
              return { text: (button.textContent || '').trim(), width: rect.width, height: rect.height };
            });
          const fontSizes = (selector) => [...document.querySelectorAll(selector)]
            .filter(visible)
            .map((element) => Number.parseFloat(getComputedStyle(element).fontSize));
          const rectsFor = (selector) => [...document.querySelectorAll(selector)]
            .filter(visible)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                text: (element.textContent || '').trim(),
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                right: rect.right,
                bottom: rect.bottom,
                disabled: 'disabled' in element ? Boolean(element.disabled) : false,
                firstViewport: rect.top >= -0.5 && rect.left >= -0.5
                  && rect.right <= innerWidth + 0.5 && rect.bottom <= innerHeight + 0.5,
              };
            });
          const board = rectFor('[data-testid="board-frame"]');
          const stats = rectFor('[data-testid="stats"]');
          const next = rectFor('[data-testid="next-slot"]');
          const touch = rectFor('[data-testid="touch-rail"]');
          const state = window.__SIGNAL_FOUNDRY_QA__ ? window.__SIGNAL_FOUNDRY_QA__.getState() : null;
          const qaCollect = window.__TETRIS_D4_QA__ ? window.__TETRIS_D4_QA__.collect() : null;
          const textState = typeof window.render_game_to_text === 'function'
            ? JSON.parse(window.render_game_to_text())
            : null;
          const brandElements = [...document.querySelectorAll('[data-testid="brand"]')].filter(visible);
          const brandTexts = brandElements.map((element) => (element.textContent || '').trim());
          const bodyText = document.body.innerText;
          const phaseElements = [...document.querySelectorAll('[data-testid="phase-seam"]')].filter(visible);
          const phase = phaseElements.length === 1 ? phaseElements[0] : null;
          const phaseRect = phase ? phase.getBoundingClientRect() : null;
          const renderer = qaCollect?.renderer || null;
          const animated = [...document.querySelectorAll('*')].filter((element) => {
            if (!visible(element)) return false;
            const style = getComputedStyle(element);
            return style.animationName !== 'none' && Number.parseFloat(style.animationDuration) > 0;
          });
          return {
            viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
            document: {
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight,
              clientWidth: document.documentElement.clientWidth,
              clientHeight: document.documentElement.clientHeight,
            },
            screen: document.querySelector('main')?.dataset.testid || null,
            canvasCount: document.querySelectorAll('canvas').length,
            domCellCount: document.querySelectorAll('[data-cell], [data-game-cell], .board-cell, .mino-cell').length,
            runtimeQaPresent: Boolean(window.__SIGNAL_FOUNDRY_QA__),
            qaCollectPresent: Boolean(qaCollect),
            brand: {
              count: brandElements.length,
              texts: brandTexts,
              hasGraphic: brandElements.some((element) => Boolean(element.querySelector('img, svg, canvas, picture'))),
            },
            bannedVisibleText: %s.filter((text) => bodyText.includes(text)),
            buttonMinimum: buttons.length ? {
              width: Math.min(...buttons.map((button) => button.width)),
              height: Math.min(...buttons.map((button) => button.height)),
            } : null,
            buttons,
            home: {
              modes: {
                marathon: rectFor('[data-testid="enter-marathon"]'),
                race: rectFor('[data-testid="enter-race"]'),
                puzzle: rectFor('[data-testid="enter-puzzle"]'),
              },
              phaseCount: phaseElements.length,
              phase: phaseRect ? {
                x: phaseRect.x,
                y: phaseRect.y,
                width: phaseRect.width,
                height: phaseRect.height,
                transitionDuration: getComputedStyle(phase).transitionDuration,
              } : null,
              selection: document.querySelector('[data-testid="mode-list"]')?.getAttribute('data-selection') || null,
              fonts: {
                previewKicker: fontSizes('.mode-preview__copy small'),
                previewCopy: fontSizes('.mode-preview__copy p'),
                input: fontSizes('.mode-preview__input'),
                intro: fontSizes('.landing-intro > p'),
                modeCopy: fontSizes('.mode-gate__body span'),
              },
            },
            library: {
              rows: rectsFor('[data-testid="level-row"]'),
              starts: rectsFor('[data-testid="start-selected-puzzle"], [data-testid="start-selected-puzzle-mobile"]'),
            },
            fonts: {
              statLabels: fontSizes('.run-stats span'),
              statValues: fontSizes('.run-stats strong'),
              touchLabels: fontSizes('.touch-key small'),
            },
            motion: {
              animatedCount: animated.length,
              infiniteCount: animated.filter((element) => getComputedStyle(element).animationIterationCount === 'infinite').length,
            },
            bounds: { board, stats, next, touch, canvasHost: rectFor('[data-testid="canvas-host"]') },
            boardRatio: board ? board.height / board.width : null,
            overlap: {
              statsBoard: overlap(stats, board),
              nextBoard: overlap(next, board),
              touchBoard: overlap(touch, board),
            },
            state: state ? {
              mode: state.mode,
              status: state.status,
              phase: state.phase,
              puzzleId: state.puzzleId,
              puzzleCompletion: state.puzzleCompletion,
              pieceCount: state.pieceCount,
              lines: state.lines,
              active: state.active ? { type: state.active.type, x: state.active.x, y: state.active.y, rotation: state.active.rotation } : null,
              next: state.queue[0] || null,
            } : null,
            textState,
            renderer: renderer ? {
              canvas: renderer.canvas,
              board: renderer.board,
              preview: renderer.preview,
              previewLayerVisible: renderer.previewLayerVisible,
              previewPiece: renderer.previewPiece,
              activeCells: renderer.activeCells,
              ghostCells: renderer.ghostCells,
              visibleLockedCells: renderer.visibleLockedCells,
              presentation: renderer.presentation,
            } : null,
            runtimeAssertions: qaCollect?.assertions || null,
          };
        }""" % json.dumps(list(BANNED_VISIBLE_TEXT), ensure_ascii=False)
    )


def validate_layout(metrics: dict[str, Any], *, gameplay: bool) -> None:
    document = metrics["document"]
    viewport = metrics["viewport"]
    require(document["scrollWidth"] <= viewport["width"] + 1, f"Horizontal overflow: {metrics}")
    require(not metrics["bannedVisibleText"], f"Banned visible copy remains: {metrics['bannedVisibleText']}")
    brand = metrics["brand"]
    require(brand["count"] <= 1, f"Duplicate visible Tetris brands: {brand}")
    require(not brand["hasGraphic"], "Tetris brand must remain plain text without a logo graphic.")
    require(all(text == "Tetris" for text in brand["texts"]), f"Brand copy drifted: {brand}")
    minimum = metrics["buttonMinimum"]
    if minimum:
        require(minimum["width"] >= 43.5 and minimum["height"] >= 43.5, f"Visible button below 44 px: {minimum}")
    if not gameplay:
        require(metrics["canvasCount"] == 0, "Non-game page mounted a canvas.")
        require(metrics["runtimeQaPresent"] is False, "Non-game page retained runtime QA surface.")
        require(brand["count"] == 1, f"Non-game page must show one plain Tetris title: {brand}")
        if metrics["screen"] == "mode-home":
            require(document["scrollHeight"] <= viewport["height"] + 1, f"Mode home vertical overflow: {metrics}")
            modes = metrics["home"]["modes"]
            require(all(modes.values()), f"Mode home is missing an entrance: {modes}")
            require(all(rect["bottom"] <= viewport["height"] + 0.5 for rect in modes.values()), f"Mode entrance below first viewport: {modes}")
            marathon, race, puzzle = modes["marathon"], modes["race"], modes["puzzle"]
            require(abs(marathon["x"] - race["x"]) <= 1.5, f"Marathon/Race left edge drift: {modes}")
            require(abs(marathon["right"] - puzzle["right"]) <= 1.5, f"Marathon/Puzzle right edge drift: {modes}")
            require(abs(race["y"] - puzzle["y"]) <= 1.5 and abs(race["height"] - puzzle["height"]) <= 1.5, f"Second-row mode geometry drift: {modes}")
            require(abs(marathon["width"] - (race["width"] + puzzle["width"])) <= 2.5, f"Home is not continuous 1+2 geometry: {modes}")
            phase = metrics["home"]
            require(phase["phaseCount"] == 1 and phase["phase"], f"Home must expose one phase seam: {phase}")
            require(abs(phase["phase"]["height"] - 2) <= 0.6, f"Phase seam thickness drifted: {phase}")
            if viewport["width"] <= 599 or viewport["height"] <= 520:
                home_fonts = [size for values in phase["fonts"].values() for size in values]
                require(home_fonts and min(home_fonts) >= 11.9, f"Mobile home helper text below 12 px: {phase['fonts']}")
        if metrics["screen"] == "puzzle-library":
            rows = metrics["library"]["rows"]
            require(len(rows) == 6 and all(not row["disabled"] for row in rows), f"Puzzle library must expose six enabled levels: {rows}")
            if viewport["width"] >= 600 and viewport["height"] <= 520:
                require(document["scrollHeight"] <= viewport["height"] + 1, f"Short-landscape library overflow: {metrics}")
                require(all(row["firstViewport"] for row in rows), f"Short-landscape library hides levels: {rows}")
                require(any(item["firstViewport"] for item in metrics["library"]["starts"]), "Short-landscape start action is below the first viewport.")
        return
    require(document["scrollHeight"] <= viewport["height"] + 1, f"Gameplay vertical overflow: {metrics}")
    require(metrics["canvasCount"] == 1, "Gameplay must mount exactly one canvas.")
    require(metrics["domCellCount"] == 0, "Gameplay must not render a DOM cell grid.")
    require(metrics["qaCollectPresent"], "Gameplay evidence requires the detached D4 QA snapshot.")
    require(abs(float(metrics["boardRatio"]) - 2.0) <= 0.03, f"Board is not 1:2: {metrics['boardRatio']}")
    for key, area in metrics["overlap"].items():
        require(float(area) <= 0.5, f"Gameplay overlap {key}: {area}")
    state = metrics["state"]
    text_state = metrics["textState"]
    if state and text_state:
        require(state["mode"] == text_state["mode"], "Text state mode drift.")
        require(state["pieceCount"] == text_state["placedPieces"], "Text state piece-count drift.")
        require(state["active"] == text_state["active"], "Text state active-piece drift.")
        require(state["next"] == text_state["next"], "Text state Next drift.")
    renderer = metrics["renderer"]
    require(renderer and state, "Renderer/canonical snapshot is unavailable.")
    runtime_assertions = metrics["runtimeAssertions"]
    require(runtime_assertions["canvasCount"] == 1, f"Runtime QA canvas count drift: {runtime_assertions}")
    require(runtime_assertions["domCellCount"] == 0, f"Runtime QA found DOM gameplay cells: {runtime_assertions}")
    require(runtime_assertions["minButtonWidth"] >= 43.5 and runtime_assertions["minButtonHeight"] >= 43.5, f"Runtime QA found a sub-44px control: {runtime_assertions}")
    require(runtime_assertions["noHorizontalOverflow"] and runtime_assertions["noVerticalOverflow"], f"Runtime QA found gameplay overflow: {runtime_assertions}")
    if state["status"] in {"playing", "paused"}:
        require(renderer["previewLayerVisible"] is True, "Renderer Next preview is not visible during play.")
        require(renderer["previewPiece"] == state["next"], "Renderer Next preview drifted from canonical queue.")
        require(len(renderer["activeCells"]) == 4 and len(renderer["ghostCells"]) == 4, "Renderer active/ghost cell snapshot is incomplete.")
    else:
        require(state["active"] is None, f"Terminal canonical state retained an active piece: {state}")
        require(renderer["previewLayerVisible"] is False and renderer["previewPiece"] is None, f"Terminal renderer retained a Next preview: {renderer}")
        require(not renderer["activeCells"] and not renderer["ghostCells"], f"Terminal renderer retained active cells: {renderer}")
    require(abs(float(renderer["board"]["width"]) - float(metrics["bounds"]["board"]["width"])) <= 1.5, "Renderer/DOM board width drift.")
    require(abs(float(renderer["board"]["height"]) - float(metrics["bounds"]["board"]["height"])) <= 1.5, "Renderer/DOM board height drift.")
    canvas_host = metrics["bounds"]["canvasHost"]
    require(canvas_host is not None, "Canvas host bounds are unavailable.")
    require(abs(float(canvas_host["x"]) + float(renderer["board"]["x"]) - float(metrics["bounds"]["board"]["x"])) <= 1.5, "Renderer/DOM board x alignment drift.")
    require(abs(float(canvas_host["y"]) + float(renderer["board"]["y"]) - float(metrics["bounds"]["board"]["y"])) <= 1.5, "Renderer/DOM board y alignment drift.")
    visible_locked = sum(character != "." for row in text_state["visibleBoard"] for character in row)
    require(renderer["visibleLockedCells"] == visible_locked, f"Renderer/text locked-cell count drift: {renderer['visibleLockedCells']} != {visible_locked}")
    if viewport["width"] <= 599 or viewport["height"] <= 520:
        fonts = metrics["fonts"]
        require(fonts["statLabels"] and min(fonts["statLabels"]) >= 13.9, f"Mobile stat label below 14 px: {fonts}")
        require(fonts["statValues"] and min(fonts["statValues"]) >= 17.9, f"Mobile stat value below 18 px: {fonts}")
        require(fonts["touchLabels"] and min(fonts["touchLabels"]) >= 11.9, f"Mobile touch label below 12 px: {fonts}")


def capture(page: Page, name: str, *, gameplay: bool, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    page.wait_for_timeout(100)
    metrics = rect_metrics(page)
    validate_layout(metrics, gameplay=gameplay)
    path = OUTPUT_DIR / name
    page.screenshot(path=str(path), full_page=False)
    record: dict[str, Any] = {"file": name, "sha256": sha256(path), "metrics": metrics}
    if extra:
        record["checks"] = extra
    CAPTURES.append(record)
    return record


def assert_no_page_errors(page_errors: list[dict[str, str]]) -> None:
    ERRORS.extend(page_errors)
    require(not page_errors, f"Browser errors: {page_errors}")


def exercise_marathon_desktop(browser: Browser) -> None:
    context, page, page_errors = open_page(browser, width=1440, height=900, dpr=1, label="desktop-marathon")
    try:
        initial_home = capture(page, "desktop-home-1440x900.png", gameplay=False)
        initial_phase = initial_home["metrics"]["home"]["phase"]
        require(initial_home["metrics"]["home"]["selection"] == "marathon", "Home must default to Marathon selection.")
        require(abs(float(initial_phase["width"]) - 72) <= 0.6, f"Idle phase seam width drifted: {initial_phase}")

        page.locator('[data-testid="enter-race"]').focus()
        page.wait_for_function("() => document.querySelector('[data-testid=mode-list]')?.getAttribute('data-selection') === 'race'")
        page.wait_for_timeout(260)
        race_phase = rect_metrics(page)["home"]["phase"]
        page.locator('[data-testid="enter-puzzle"]').focus()
        page.wait_for_function("() => document.querySelector('[data-testid=mode-list]')?.getAttribute('data-selection') === 'puzzle'")
        page.wait_for_timeout(260)
        puzzle_focus = capture(page, "desktop-home-phase-focus-1440x900.png", gameplay=False)
        puzzle_phase = puzzle_focus["metrics"]["home"]["phase"]
        require(float(race_phase["y"]) > float(initial_phase["y"]), "Race focus did not move the phase seam to row two.")
        require(float(puzzle_phase["x"]) > float(race_phase["x"]), "Puzzle focus did not move the phase seam to column two.")
        require(float(race_phase["width"]) > float(initial_phase["width"]), "Focus did not extend the phase seam.")
        CHECKS["homePhaseSeam"] = {
            "count": initial_home["metrics"]["home"]["phaseCount"],
            "idleWidth": initial_phase["width"],
            "focusWidth": puzzle_phase["width"],
            "raceY": race_phase["y"],
            "puzzleX": puzzle_phase["x"],
        }

        enter_mode(page, "marathon")
        hard_drop(page)
        hard_drop(page)
        capture(page, "desktop-marathon-playing-1440x900.png", gameplay=True)

        page.get_by_role("button", name="暂停", exact=True).click()
        page.get_by_role("dialog", name="本局已暂停").wait_for(state="visible")
        require(qa_state(page)["status"] == "paused", "Pause sheet did not pause canonical state.")
        require(page.evaluate("document.activeElement?.textContent?.trim()") == "继续游戏", "Pause initial focus is wrong.")
        page.keyboard.press("Shift+Tab")
        require(page.evaluate("document.activeElement?.textContent?.trim()") == "离开本局", "Shift+Tab focus trap failed.")
        page.keyboard.press("Tab")
        require(page.evaluate("document.activeElement?.textContent?.trim()") == "继续游戏", "Tab focus trap failed.")
        capture(page, "desktop-marathon-paused-1440x900.png", gameplay=True)
        page.keyboard.press("Escape")
        page.wait_for_function("() => window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'")

        page.get_by_role("button", name="暂停", exact=True).click()
        page.get_by_role("button", name="重新开始", exact=True).click()
        page.wait_for_function(
            "() => window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'"
            " && window.__SIGNAL_FOUNDRY_QA__.getState().pieceCount === 0"
        )
        CHECKS["restartVisibleUi"] = True

        page.get_by_role("button", name="← 模式首页", exact=True).click()
        page.get_by_role("dialog", name="要离开本局吗？").wait_for(state="visible")
        page.get_by_role("button", name="留在本局", exact=True).click()
        page.wait_for_function("() => window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'")
        page.get_by_role("button", name="← 模式首页", exact=True).click()
        page.get_by_role("button", name="返回模式首页", exact=True).click()
        page.locator('[data-testid="mode-home"]').wait_for(state="visible")
        page.wait_for_function(
            "() => document.querySelectorAll('canvas').length === 0 && !window.__SIGNAL_FOUNDRY_QA__"
        )
        capture(page, "desktop-home-returned-1440x900.png", gameplay=False)
        CHECKS["homeGameHomeTeardown"] = {
            "canvasCount": page.locator("canvas").count(),
            "runtimeQaPresent": page.evaluate("() => Boolean(window.__SIGNAL_FOUNDRY_QA__)")
        }

        enter_mode(page, "marathon")
        reentry_state = hard_drop(page)
        require(reentry_state["pieceCount"] == 1, "Re-entry hard drop indicates duplicate lifecycle/input handling.")
        CHECKS["homeGameHomeReentryInput"] = {"pieceCount": reentry_state["pieceCount"]}

        isolation = page.evaluate(
            """() => {
              const canonicalBefore = JSON.stringify(window.__SIGNAL_FOUNDRY_QA__.getState());
              const collectedBefore = window.__TETRIS_D4_QA__.collect();
              const rendererBefore = JSON.stringify(collectedBefore.renderer);
              collectedBefore.state.status = 'game-over';
              if (collectedBefore.state.active) collectedBefore.state.active.x = 999;
              collectedBefore.state.queue[0] = 'O';
              collectedBefore.state.board[0][0] = 'I';
              collectedBefore.renderer.previewPiece = 'O';
              if (collectedBefore.renderer.activeCells[0]) collectedBefore.renderer.activeCells[0].x = 999;
              const canonicalAfter = JSON.stringify(window.__SIGNAL_FOUNDRY_QA__.getState());
              const collectedAfter = window.__TETRIS_D4_QA__.collect();
              return {
                canonicalDetached: canonicalBefore === canonicalAfter,
                collectedStateDetached: canonicalBefore === JSON.stringify(collectedAfter.state),
                rendererDetached: rendererBefore === JSON.stringify(collectedAfter.renderer),
              };
            }"""
        )
        require(all(isolation.values()), f"QA snapshot mutation leaked into live state: {isolation}")
        CHECKS["detachedQaSnapshot"] = isolation

        page.get_by_role("button", name="暂停", exact=True).click()
        page.wait_for_function("() => window.__SIGNAL_FOUNDRY_QA__.getState().status === 'paused'")
        canonical_before = page.evaluate("JSON.stringify(window.__SIGNAL_FOUNDRY_QA__.getState())")
        page.emulate_media(reduced_motion="reduce")
        page.wait_for_timeout(100)
        canonical_after = page.evaluate("JSON.stringify(window.__SIGNAL_FOUNDRY_QA__.getState())")
        require(canonical_before == canonical_after, "Reduced-motion change mutated canonical state.")
        CHECKS["liveReducedMotionPreservesState"] = True
        page.keyboard.press("Escape")
    finally:
        assert_no_page_errors(page_errors)
        context.close()


def exercise_race_wide(browser: Browser) -> None:
    context, page, page_errors = open_page(browser, width=2048, height=1152, dpr=1, label="wide-race")
    try:
        enter_mode(page, "race")
        body = page.locator("body").inner_text()
        require("无终点" in body, "Race endless copy is missing.")
        for forbidden in ("20 行", "剩余行", "完成目标"):
            require(forbidden not in body, f"Obsolete Race copy remains: {forbidden}")
        hard_drop(page)
        hard_drop(page)
        capture(page, "wide-race-playing-2048x1152.png", gameplay=True)

        terminal = qa_state(page)
        for _ in range(80):
            if terminal and terminal["status"] == "game-over":
                break
            terminal = hard_drop(page)
        require(terminal is not None and terminal["status"] == "game-over", "Race did not reach ordinary top-out.")
        page.get_by_role("dialog", name="本轮竞速结束").wait_for(state="visible")
        capture(page, "wide-race-topout-2048x1152.png", gameplay=True)
        CHECKS["raceTopOutOnlyTerminal"] = {
            "pieceCount": terminal["pieceCount"],
            "lines": terminal["lines"],
        }
    finally:
        assert_no_page_errors(page_errors)
        context.close()


def exercise_puzzle_portrait(browser: Browser) -> None:
    context, page, page_errors = open_page(
        browser, width=390, height=844, dpr=3, label="portrait-puzzle", has_touch=True
    )
    try:
        capture(page, "portrait-home-390x844-dpr3.png", gameplay=False)
        page.locator('[data-testid="enter-puzzle"]').click()
        page.locator('[data-testid="puzzle-library"]').wait_for(state="visible")
        capture(page, "portrait-puzzle-library-390x844-dpr3.png", gameplay=False)
        page.locator('[data-level-id="t3r-shaft-01"]').click()
        start = page.locator('[data-testid="start-selected-puzzle-mobile"]')
        start.wait_for(state="visible")
        start.tap()
        wait_for_game(page, "puzzle")
        for _ in range(3):
            gravity_lock(page)
        state = qa_state(page)
        require(state is not None and state["puzzleId"] == "t3r-shaft-01", "Visible level selection drifted.")
        require(state["pieceCount"] == 3, "Three normal-gravity Puzzle locks did not lock three pieces.")
        body = page.locator("body").inner_text()
        require("青脊回旋" in body and "关卡 1/6" in body, "Visible Puzzle identity drifted from canonical level.")
        for forbidden in ("难度", "锁定", "剩余方块", "方块预算"):
            require(forbidden not in body, f"Obsolete Puzzle UI remains: {forbidden}")
        page.get_by_role("button", name="暂停", exact=True).click()
        page.get_by_role("dialog", name="本局已暂停").wait_for(state="visible")
        paused_metrics = rect_metrics(page)
        require(paused_metrics["state"]["status"] == "paused", "Puzzle pause did not freeze canonical state.")
        require(paused_metrics["state"]["active"] == paused_metrics["textState"]["active"], "Paused active-piece text drift.")
        require(paused_metrics["state"]["next"] == paused_metrics["renderer"]["previewPiece"], "Paused renderer Next drift.")
        page.keyboard.press("Escape")
        page.wait_for_function("() => window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'")
        page.evaluate("() => window.__SIGNAL_FOUNDRY_QA__.setFrozen(true)")
        capture(
            page,
            "portrait-puzzle-three-locks-390x844-dpr3.png",
            gameplay=True,
            extra={
                "input": "normal gravity only",
                "puzzleId": state["puzzleId"],
                "pieceCount": state["pieceCount"],
                "next": state["queue"][0],
                "pausedStateCompared": True,
            },
        )
        CHECKS["puzzleThreeNormalGravityLocks"] = {
            "puzzleId": state["puzzleId"],
            "pieceCount": state["pieceCount"],
            "status": state["status"],
        }
    finally:
        assert_no_page_errors(page_errors)
        context.close()


def exercise_other_viewports(browser: Browser) -> None:
    context, page, page_errors = open_page(
        browser, width=844, height=390, dpr=3, label="landscape-marathon", has_touch=True
    )
    try:
        capture(page, "landscape-home-844x390-dpr3.png", gameplay=False)
        page.locator('[data-testid="enter-puzzle"]').tap()
        page.locator('[data-testid="puzzle-library"]').wait_for(state="visible")
        capture(page, "landscape-puzzle-library-844x390-dpr3.png", gameplay=False)
        page.get_by_role("button", name="← 返回模式首页", exact=True).tap()
        page.locator('[data-testid="mode-home"]').wait_for(state="visible")
        enter_mode(page, "marathon")
        state = hard_drop(page, touch=True)
        require(state["pieceCount"] == 1, "Landscape touch hard drop did not lock exactly one piece.")
        capture(page, "landscape-marathon-844x390-dpr3.png", gameplay=True)
    finally:
        assert_no_page_errors(page_errors)
        context.close()

    context, page, page_errors = open_page(
        browser, width=360, height=800, dpr=1, label="narrow-puzzle", has_touch=True
    )
    try:
        capture(page, "narrow-home-360x800.png", gameplay=False)
        enter_mode(page, "puzzle", "t3r-shaft-04")
        hard_drop(page, touch=True)
        capture(page, "narrow-puzzle-360x800.png", gameplay=True)
    finally:
        assert_no_page_errors(page_errors)
        context.close()


def drive_reference_route(page: Page, route: dict[str, Any]) -> dict[str, Any]:
    for index, placement in enumerate(route["placements"]):
        page.wait_for_function(
            "() => {"
            " const state = window.__SIGNAL_FOUNDRY_QA__.getState();"
            " return state.status === 'playing' && state.phase === 'active' && Boolean(state.active);"
            "}"
        )
        state = qa_state(page)
        require(state is not None and state["active"]["type"] == placement["type"], f"Route type drift at {index}.")
        for _ in range(int(placement["rotation"])):
            page.keyboard.press("ArrowUp")
        state = qa_state(page)
        require(state is not None and state["active"]["rotation"] == placement["rotation"], f"Route rotation drift at {index}.")
        target_x = int(placement["x"])
        for _ in range(16):
            state = qa_state(page)
            require(state is not None and state["active"] is not None, f"Missing active piece at {index}.")
            current_x = int(state["active"]["x"])
            if current_x == target_x:
                break
            page.keyboard.press("ArrowLeft" if target_x < current_x else "ArrowRight")
        state = qa_state(page)
        require(state is not None and int(state["active"]["x"]) == target_x, f"Route x drift at {index}.")
        state = hard_drop(page)
        if index < len(route["placements"]) - 1:
            require(state["status"] == "playing", f"Route ended early at placement {index}.")
    return state


def exercise_puzzle_success(browser: Browser) -> None:
    references = json.loads(REFERENCES_PATH.read_text(encoding="utf-8"))
    level = references["levels"][0]
    route = level["routes"][0]
    context, page, page_errors = open_page(browser, width=1440, height=900, dpr=1, label="puzzle-success")
    try:
        enter_mode(page, "puzzle", level["id"])
        terminal = drive_reference_route(page, route)
        require(terminal["status"] == "finished", "Visible-keyboard Puzzle route did not finish.")
        require(terminal["puzzleCompletion"] == "finished", "Puzzle completion state is not finished.")
        page.get_by_role("dialog", name="棋盘已清空").wait_for(state="visible")
        capture(
            page,
            "desktop-puzzle-success-1440x900.png",
            gameplay=True,
            extra={"routeId": route["id"], "pieceCount": terminal["pieceCount"], "lines": terminal["lines"]},
        )
        CHECKS["puzzleVisibleKeyboardSuccess"] = {
            "levelId": level["id"],
            "routeId": route["id"],
            "pieceCount": terminal["pieceCount"],
        }
    finally:
        assert_no_page_errors(page_errors)
        context.close()


def write_manifest(candidate_sha: str) -> None:
    manifest = {
        "taskId": "TETRIS-T5-FINAL-BROWSER-002",
        "candidateSha": candidate_sha,
        "baseUrl": BASE_URL,
        "method": (
            "First-viewport screenshots from visible UI; real keyboard and touch input; three Puzzle locks by normal gravity; "
            "detached canonical/text/renderer snapshot comparison only. Deterministic time advances ticks without replacing state, "
            "and no terminal state is fabricated."
        ),
        "captures": CAPTURES,
        "checks": CHECKS,
        "errors": ERRORS,
    }
    manifest_path = OUTPUT_DIR / "browser-evidence.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    hashed_files = sorted(path for path in OUTPUT_DIR.iterdir() if path.suffix in {".png", ".json", ".py"})
    checksum_lines = [f"{sha256(path)}  {path.name}" for path in hashed_files]
    (OUTPUT_DIR / "SHA256SUMS.txt").write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    candidate_sha = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=REPO_ROOT, text=True, encoding="utf-8"
    ).strip()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            args=["--use-gl=angle", "--use-angle=swiftshader"],
        )
        try:
            exercise_marathon_desktop(browser)
            exercise_race_wide(browser)
            exercise_puzzle_portrait(browser)
            exercise_other_viewports(browser)
            exercise_puzzle_success(browser)
        finally:
            browser.close()
    require(not ERRORS, f"Browser errors were recorded: {ERRORS}")
    write_manifest(candidate_sha)
    print(json.dumps({"candidateSha": candidate_sha, "captures": len(CAPTURES), "checks": CHECKS}, ensure_ascii=False))


if __name__ == "__main__":
    main()
