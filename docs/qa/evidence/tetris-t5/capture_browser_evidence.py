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
) -> tuple[BrowserContext, Page, list[dict[str, str]]]:
    context = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=dpr,
        color_scheme="light",
        reduced_motion="no-preference",
        locale="zh-CN",
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
        page.get_by_role("button", name="进入所选关卡").click()
    wait_for_game(page, mode)


def hard_drop(page: Page, *, touch: bool = False) -> dict[str, Any]:
    before = qa_state(page)
    require(before is not None, "Runtime state is unavailable before hard drop.")
    before_count = int(before["pieceCount"])
    if touch:
        page.locator('[data-testid="touch-hard-drop"]').click()
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
          const board = rectFor('[data-testid="board-frame"]');
          const stats = rectFor('[data-testid="stats"]');
          const next = rectFor('[data-testid="next-slot"]');
          const touch = rectFor('[data-testid="touch-rail"]');
          const state = window.__SIGNAL_FOUNDRY_QA__ ? window.__SIGNAL_FOUNDRY_QA__.getState() : null;
          const textState = typeof window.render_game_to_text === 'function'
            ? JSON.parse(window.render_game_to_text())
            : null;
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
            domCellCount: document.querySelectorAll('[data-cell], .board-cell, .mino-cell').length,
            runtimeQaPresent: Boolean(window.__SIGNAL_FOUNDRY_QA__),
            renderedTetrisBrand: /tetris/i.test(document.body.innerText),
            buttonMinimum: buttons.length ? {
              width: Math.min(...buttons.map((button) => button.width)),
              height: Math.min(...buttons.map((button) => button.height)),
            } : null,
            buttons,
            bounds: { board, stats, next, touch },
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
          };
        }"""
    )


def validate_layout(metrics: dict[str, Any], *, gameplay: bool) -> None:
    document = metrics["document"]
    viewport = metrics["viewport"]
    require(document["scrollWidth"] <= viewport["width"] + 1, f"Horizontal overflow: {metrics}")
    require(metrics["renderedTetrisBrand"] is False, "Player-facing Tetris brand remains in page content.")
    minimum = metrics["buttonMinimum"]
    if minimum:
        require(minimum["width"] >= 43.5 and minimum["height"] >= 43.5, f"Visible button below 44 px: {minimum}")
    if not gameplay:
        require(metrics["canvasCount"] == 0, "Non-game page mounted a canvas.")
        require(metrics["runtimeQaPresent"] is False, "Non-game page retained runtime QA surface.")
        return
    require(document["scrollHeight"] <= viewport["height"] + 1, f"Gameplay vertical overflow: {metrics}")
    require(metrics["canvasCount"] == 1, "Gameplay must mount exactly one canvas.")
    require(metrics["domCellCount"] == 0, "Gameplay must not render a DOM cell grid.")
    require(abs(float(metrics["boardRatio"]) - 2.0) <= 0.03, f"Board is not 1:2: {metrics['boardRatio']}")
    for key, area in metrics["overlap"].items():
        require(float(area) <= 0.5, f"Gameplay overlap {key}: {area}")
    state = metrics["state"]
    text_state = metrics["textState"]
    if state and text_state:
        require(state["mode"] == text_state["mode"], "Text state mode drift.")
        require(state["pieceCount"] == text_state["placedPieces"], "Text state piece-count drift.")
        require(state["next"] == text_state["next"], "Text state Next drift.")


def capture(page: Page, name: str, *, gameplay: bool, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    page.wait_for_timeout(100)
    metrics = rect_metrics(page)
    validate_layout(metrics, gameplay=gameplay)
    path = OUTPUT_DIR / name
    page.screenshot(path=str(path), full_page=True)
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
        capture(page, "desktop-home-1440x900.png", gameplay=False)
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
        page.get_by_role("dialog", name="要离开当前路线吗？").wait_for(state="visible")
        page.get_by_role("button", name="留在本局", exact=True).click()
        page.wait_for_function("() => window.__SIGNAL_FOUNDRY_QA__.getState().status === 'playing'")
        page.get_by_role("button", name="← 模式首页", exact=True).click()
        page.get_by_role("button", name="返回模式首页", exact=True).click()
        page.locator('[data-testid="mode-home"]').wait_for(state="visible")
        page.wait_for_function(
            "() => document.querySelectorAll('canvas').length === 0 && !window.__SIGNAL_FOUNDRY_QA__"
        )
        capture(page, "desktop-home-returned-1440x900.png", gameplay=False)
        CHECKS["homeGameHomeTeardown"] = True

        enter_mode(page, "marathon")
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
    context, page, page_errors = open_page(browser, width=390, height=844, dpr=3, label="portrait-puzzle")
    try:
        page.locator('[data-testid="enter-puzzle"]').click()
        page.locator('[data-testid="puzzle-library"]').wait_for(state="visible")
        capture(page, "portrait-puzzle-library-390x844-dpr3.png", gameplay=False)
        page.locator('[data-level-id="t3r-cascade-06"]').click()
        page.get_by_role("button", name="进入所选关卡").click()
        wait_for_game(page, "puzzle")
        for _ in range(3):
            hard_drop(page, touch=True)
        state = qa_state(page)
        require(state is not None and state["puzzleId"] == "t3r-cascade-06", "Visible level selection drifted.")
        require(state["pieceCount"] == 3, "Three visible Puzzle hard drops did not lock three pieces.")
        body = page.locator("body").inner_text()
        for forbidden in ("难度", "锁定", "剩余方块", "方块预算"):
            require(forbidden not in body, f"Obsolete Puzzle UI remains: {forbidden}")
        capture(
            page,
            "portrait-puzzle-three-locks-390x844-dpr3.png",
            gameplay=True,
            extra={"puzzleId": state["puzzleId"], "pieceCount": state["pieceCount"], "next": state["queue"][0]},
        )
        CHECKS["puzzleThreeVisibleLocks"] = True
    finally:
        assert_no_page_errors(page_errors)
        context.close()


def exercise_other_viewports(browser: Browser) -> None:
    context, page, page_errors = open_page(browser, width=844, height=390, dpr=3, label="landscape-marathon")
    try:
        enter_mode(page, "marathon")
        hard_drop(page)
        capture(page, "landscape-marathon-844x390-dpr3.png", gameplay=True)
    finally:
        assert_no_page_errors(page_errors)
        context.close()

    context, page, page_errors = open_page(browser, width=360, height=800, dpr=1, label="narrow-puzzle")
    try:
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
        "taskId": "TETRIS-T5-FINAL-BROWSER-001",
        "candidateSha": candidate_sha,
        "baseUrl": BASE_URL,
        "method": "Visible UI keyboard/pointer input plus read-only canonical-state comparison; no state replacement or fabricated terminal state.",
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
