"""Render and verify the standalone D5 Mineral Shelf prototype.

Run: python verify_d5_light.py
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent
HTML = (ROOT / "d5-light-prototype.html").as_uri()
SHOTS = ROOT / "d5-screenshots"
NAMES = ("马拉松模式", "竞速模式", "解谜模式")
TOUCH = ("←左移", "→右移", "↑旋转", "↓快速下落", "⇣直接落底")


def box_data(page, width: int, height: int, state: str, mode: str, filename: str | None, stress: str | None) -> dict[str, object]:
    page.set_viewport_size({"width": width, "height": height})
    suffix = f"&stress={stress}" if stress else ""
    page.goto(f"{HTML}?state={state}&mode={mode}{suffix}", wait_until="load")
    page.evaluate("window.scrollTo(0,0)")
    if filename and os.environ.get("D5_CAPTURE") == "1":
        page.screenshot(path=str(SHOTS / filename), full_page=False)
    return page.evaluate(
        """() => {
          const visible = el => !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
          const boxEl = el => { if (!el) return {left:0,top:0,right:0,bottom:0,width:0,height:0,visible:false}; const r=el.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible:visible(el)}; };
          const box = selector => boxEl(document.querySelector(selector));
          const overlaps = (a,b) => a.visible && b.visible && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          const contains = (a,b) => a.left <= b.left && a.top <= b.top && a.right >= b.right && a.bottom >= b.bottom;
          const activeStats = [...document.querySelectorAll('.stats dl')].filter(visible)[0];
          const context = [...document.querySelectorAll('.context')].filter(visible)[0];
           const board=box('.board-stage'), stats=boxEl(activeStats), controls=box('.control-rail'), help=box('.control-help'), pause=box('.pause-band'), result=box('.result-band'), next=box('.next-preview'), topbar=box('.topbar'), title=box('.topbar h1');
           const topbarStyle=getComputedStyle(document.querySelector('.topbar'));
          const buttons=[...document.querySelectorAll('.control-rail button')].filter(visible);
           const buttonBoxes=buttons.map(boxEl);
            const textEls=[...document.querySelectorAll('.topbar *, .context *, .stats *, .control-help, .control-rail *')].filter(el=>visible(el)&&el.textContent.trim()&&!el.classList.contains('level-list'));
           const essential=[...document.querySelectorAll('.eyebrow,.mode-choice,.selected-summary,.session-context .mode-row strong,.session-context .mode-row button,.next-preview p,.stats dt,.stats dd,.control-help,.control-rail small,.level-line strong,.level-line span,.level-line small,.selection-note,.primary-action,.secondary-action,.puzzle-actions button,.pause-band button,.result-band button')].filter(visible);
           const essentialFonts=essential.map(el=>({text:el.textContent.trim(),px:parseFloat(getComputedStyle(el).fontSize)}));
          const clipped=textEls.filter(el=>{const s=getComputedStyle(el); return (s.overflowX!=='visible'&&el.scrollWidth>el.clientWidth+1)||(s.overflowY!=='visible'&&el.scrollHeight>el.clientHeight+1);}).map(el=>el.textContent.trim());
          const externalPause=[...document.querySelectorAll('button')].filter(visible).filter(el=>el.textContent.trim()==='暂停'&&!document.querySelector('.board-stage').contains(el)).length;
           const visibleText=[...document.querySelectorAll('body *')].filter(visible).map(el=>el.childElementCount?'':el.textContent.trim()).filter(Boolean).join(' ');
           const levelList=document.querySelector('.level-list');
           const levelRows=levelList?[...levelList.querySelectorAll('.level-line')]:[];
           const levelReachability=(()=>{if(!visible(levelList))return {applicable:false,reachable:true}; const before=levelList.scrollTop; levelList.scrollTop=levelList.scrollHeight; const listBox=boxEl(levelList), lastBox=boxEl(levelRows.at(-1)); const reachable=lastBox.top>=listBox.top-1&&lastBox.bottom<=listBox.bottom+1; levelList.scrollTop=before; return {applicable:true,reachable,scrollHeight:levelList.scrollHeight,clientHeight:levelList.clientHeight};})();
          return {viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},board,context:boxEl(context),stats,controlsBox:controls,help,pause,result,next,topbar,title,topbarOverflow:{x:topbarStyle.overflowX,y:topbarStyle.overflowY},boardRatio:board.height/board.width,boardCenterError:Math.abs((board.left+board.right)/2-innerWidth/2),nonOverlap:{contextBoard:!overlaps(boxEl(context),board),boardStats:!overlaps(board,stats),boardHelp:!overlaps(board,help),boardControls:!overlaps(board,controls),statsControls:!overlaps(stats,controls),helpControls:!overlaps(help,controls)},inViewport:[board,boxEl(context),stats,controls,help,pause,result,next].filter(x=>x.visible).every(x=>x.left>=0&&x.top>=0&&x.right<=innerWidth&&x.bottom<=innerHeight),pauseInside:pause.visible?contains(board,pause):true,resultInside:result.visible?contains(board,result):true,clipped,externalPause,controls:{count:buttons.length,labels:buttons.map(el=>el.textContent.replace(/\\s+/g,'')),minWidth:Math.min(...buttonBoxes.map(x=>x.width)),minHeight:Math.min(...buttonBoxes.map(x=>x.height))},nextCount:[...document.querySelectorAll('.next-preview')].filter(visible).length,visibleText,allText:document.body.textContent,boardText:document.querySelector('.board-stage').innerText.trim(),h1:document.querySelectorAll('h1').length,topbarText:document.querySelector('.topbar').innerText.trim(),titleText:document.querySelector('.topbar h1').textContent.trim(),essentialFonts,levelRows:levelRows.length,levelReachability};
        }"""
    )


def assert_case(key: str, result: dict[str, object], state: str, mode: str, stress: str | None) -> None:
    viewport = result["viewport"]
    assert viewport["scrollWidth"] == viewport["width"] and viewport["scrollHeight"] <= viewport["height"], (key, viewport, result["board"], result["controls"])
    assert result["inViewport"] and abs(result["boardRatio"] - 2) <= .02, (key, result["context"], result["board"], result["stats"], result["help"], result["controlsBox"])
    assert result["h1"] == 1 and not result["clipped"] and all(result["nonOverlap"].values()), (key, result["clipped"], result["nonOverlap"])
    assert result["essentialFonts"] and min(item["px"] for item in result["essentialFonts"]) >= 12, (key, result["essentialFonts"])
    assert result["controls"]["count"] == 5 and tuple(result["controls"]["labels"]) == TOUCH, key
    assert result["controls"]["minWidth"] >= 44 and result["controls"]["minHeight"] >= 44, key
    text = result["visibleText"]
    assert "Tetris" in text and NAMES[{"marathon":0,"race":1,"puzzle":2}[mode]] in text, key
    assert result["topbarText"] == "Tetris" and result["titleText"] == "Tetris", key
    assert all(result["topbar"][edge] >= 0 for edge in ("left", "top")) and result["topbar"]["right"] <= viewport["width"] and result["topbar"]["bottom"] <= viewport["height"], (key, result["topbar"])
    assert all(result["title"][edge] >= 0 for edge in ("left", "top")) and result["title"]["right"] <= viewport["width"] and result["title"]["bottom"] <= viewport["height"], (key, result["title"])
    assert result["topbarOverflow"] == {"x":"visible","y":"visible"}, (key, result["topbarOverflow"])
    assert all(item not in result["allText"] for item in ("Hold", "暂存", "Offset Drop", "错版下落", "OFF / 01", "慢稳", "T.", "40 行")), key
    if state in ("ready", "modes"):
        assert all(name in text for name in NAMES), key
    if state in ("playing", "paused", "puzzle-playing", "puzzle-complete", "puzzle-fail"):
        assert result["nextCount"] == 1, key
    if state == "paused":
        assert result["externalPause"] == 0 and result["pause"]["visible"] and result["pauseInside"], key
        assert result["pause"]["height"] <= result["board"]["height"] * .18, key
        assert "继续" in text and "重新开始" in text, key
    if state == "modes":
        assert "应用并重新开始" in text and "返回本局" in text and result["boardText"] == "", key
    if state == "puzzle-select":
        assert "选择关卡" in text and "关卡 3/6" in text and "示例关卡（布局支持 6+）" in text and "固定后续序列" in text and "6 块" in text and "清空棋盘" in text and "返回模式选择" in text and result["levelRows"] >= 6 and result["levelReachability"]["reachable"], key
    if state in ("puzzle-playing", "puzzle-complete", "puzzle-fail"):
        assert "3/6" in text and "示例" in text and "困难" in text and "固定后续序列" in text and "剩余方块" in text and "清空棋盘" in text and "重新开始关卡" in text and "返回关卡选择" in text, key
    if state in ("puzzle-complete", "puzzle-fail"):
        assert result["result"]["visible"] and result["resultInside"], key
    if stress == "puzzle-long":
        assert "玄武裂隙 · 困难" in text and "12 块" in text and "12" in text, key
    if state == "modes" and mode == "race":
        assert "完成 20 行" in text, key


def main() -> None:
    SHOTS.mkdir(exist_ok=True)
    all_cases = [
        (1440, 900, "ready", "marathon", "d5-desktop-ready.png", None),
        (1440, 900, "playing", "race", "d5-desktop-playing.png", None),
        (1440, 900, "paused", "marathon", "d5-desktop-paused.png", None),
        (1440, 900, "puzzle-select", "puzzle", "d5-desktop-puzzle-select.png", None),
        (1440, 900, "puzzle-playing", "puzzle", "d5-desktop-puzzle-playing.png", None),
        (390, 844, "ready", "marathon", "d5-portrait-ready.png", None),
        (390, 844, "playing", "marathon", "d5-portrait-playing.png", None),
        (390, 844, "paused", "race", "d5-portrait-paused.png", None),
        (390, 844, "puzzle-select", "puzzle", "d5-portrait-puzzle-select.png", None),
        (390, 844, "puzzle-playing", "puzzle", "d5-portrait-puzzle-playing.png", None),
        (844, 390, "playing", "race", "d5-landscape-playing.png", None),
        (844, 390, "puzzle-select", "puzzle", "d5-landscape-puzzle-select.png", None),
        (360, 800, "puzzle-playing", "puzzle", None, "puzzle-long"),
        (390, 844, "puzzle-complete", "puzzle", None, None),
        (390, 844, "puzzle-fail", "puzzle", None, None),
        (390, 844, "modes", "race", None, None),
    ]
    console_errors: list[str] = []
    results: dict[str, object] = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
        for width, height, state, mode, filename, stress in all_cases:
            key = f"{width}x{height}-{state}-{mode}{'-long' if stress else ''}"
            result = box_data(page, width, height, state, mode, filename, stress)
            assert_case(key, result, state, mode, stress)
            results[key] = result
        browser.close()
    assert not console_errors, console_errors
    report = {"candidate":"D5 Mineral Shelf QA-001","results":results,"consoleErrors":console_errors,"checks":{"cases":len(results),"formalScreenshots":12,"touchSystems":len(results),"bannedOldTerms":8,"topbarBounds":len(results),"levelRows":6,"landscapeEssentialMinPx":12}}
    (ROOT / "d5-geometry-evidence.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"checked":list(results),"consoleErrors":console_errors,"formalScreenshots":12},ensure_ascii=False))


if __name__ == "__main__":
    main()
