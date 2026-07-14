# Tetris Visual Design — Thread Log

## 线程

- 统筹线程：`019f4deb-7e83-7583-8cd5-8e6f075bc331`
- 本工作：独立 Tetris 原创视觉设计研究；design-only，不改生产源码。
- 日期：2026-07-14（Asia/Shanghai）；D1 `c1d5e0f` 后继为 D2 design-only candidate。

## 范围

- 允许写入：仅 `docs/workstreams/tetris-visual-design/`。
- 明确不写：根 `DESIGN.md`、`CURRENT_TASK.md`、`docs/logs/CHANGELOG.md`、任一 `src/`、生产 App/CSS、游戏测试或构建产物。
- 交付：原创方向、全状态布局规格、独立静态 HTML/CSS 原型、七张最终 D2 Playwright 截图、设计审查和本日志。

## 研究来源（只读）

- 当前 worktree：`AGENTS.md`、`DESIGN.md`、`CURRENT_TASK.md`、`docs/logs/CHANGELOG.md`。
- 方法参考：`E:\Proj\personal-web\DESIGN.md`、`README.md`、`src/`、`screenshots/home-1440x900-final.png`、`screenshots/home-1920x1080-final.png`。
- 否决样本：
  - `C:\Users\Alex Chen\AppData\Local\Temp\codex-clipboard-8a607198-cdd2-4573-b6d9-7d034423c4e5.png`
  - `C:\Users\Alex Chen\AppData\Local\Temp\codex-clipboard-e04568d9-faab-43d5-8f3d-009f95b9c279.png`
  - `C:\Users\Alex Chen\AppData\Local\Temp\codex-clipboard-c2f1a233-cea4-44df-81d9-c6d50f85c716.png`

## 产物

- `ORIGINAL_VISUAL_DIRECTION.md`
- `STATE_LAYOUT_SPEC.md`
- `offset-drop-mockup.html` / `offset-drop-mockup.css`
- `verify_mockup.py` / `geometry-evidence.json`
- `screenshots/desktop-ready.png`
- `screenshots/desktop-playing.png`
- `screenshots/desktop-paused.png`
- `screenshots/desktop-mode-switch.png`
- `screenshots/mobile-paused-390x844.png`
- `screenshots/mobile-playing-390x844.png`
- `screenshots/landscape-mode-switch-844x390.png`
- `DESIGN_REVIEW.md`

## 验证

- 使用本地 Playwright 静态页渲染：1440 × 900、390 × 844、844 × 390。
- 检查无页面横向溢出、棋盘比 1:2、Next/统计/控制无重叠、暂停面板被棋盘包含、零浏览器 console errors。
- 只做原型相关轻量检查；未运行游戏的 typecheck、全量测试或 production build。

## 互补工作流与具体影响

1. **Browser / control-in-app-browser（只读）**：核查 `https://foreseer.site/` 的可见 DOM，确认其首页是中心主标记加左右边界入口的低密度构图；结合最终截图和三张否决图，只提取“单一手势、低密度、结构化留白”三条方法。结果是本方案明确排除点阵、青绿色、符号、边界导航、相同 header/侧栏组织与字体组合。该 Browser 不能访问本地 `file://` 原型（URL policy 拒绝）；未绕过，改用下面的 Playwright 静态渲染和本地截图人工检查。
2. **frontend-design**：将研究归并为唯一原创语法——纯暖纸、深墨棋盘、朱砂下落色带、局部 2 px 套色边；定义 token、状态、触控与 reduced-motion 规则。它没有提供模板或组件结构。
3. **imagegen（preview-only）**：生成一张概念情绪板，默认输出位于 `C:\Users\Alex Chen\.codex\generated_images\019f5dc7-ae01-76d1-ada2-765eda931029\exec-71c890e5-ae06-4740-8223-772b16f0c18b.png`。它只确认纸张、朱砂、深墨与套色的材质情绪；未复制到 worktree、未被 HTML/CSS 引用，且无可用文字，因此不是生产资产或规范证据。
4. **webapp-testing / Playwright**：`verify_mockup.py` 使用真实 Chromium 静态页渲染六个 state/viewport 组合，输出五张最终截图与 `geometry-evidence.json`。它断言 DOMRect 无溢出/重叠、棋盘 1:2、暂停仅在棋盘、完整文本与禁止文本、对比度和零 console errors。
5. **人工视觉复核**：逐张查看最终五张本地 PNG，确认纸面没有网格/点阵、模式为横向玩法带、Next 与棋盘分离、暂停只在深墨棋盘内，且移动端操作键未重叠。

## 统筹预审修正

- 删除纸面 108 px 周期线以及棋盘内重复网格纹理；页面只用纯 `#F4EBDD` 纸色，无外部纹理资产。
- 删除 `OFF / 01 — 错版下落` 设计师标签；用户页面只显示完整 `Tetris` 品牌。
- 删除 `002,480` 与“慢稳”；ready 的可见字段改为 score/lines `0`、level `1`、speed tier `01`。生产实现必须从真实 state 读取字段。
- 删除暂停层元解释，只保留 `暂停` 和 `继续`。
- 模式从左侧 rail 移为 header 下的横向三段玩法带；stats/controls 都改到棋盘下方，避免个人网站边界导航换皮。
- 增加 `OFF / 01`、`慢稳`、`T.`、`Hold`、`暂存`、设计说明句等文本否定检查。

## 未决项

- 此方向等待统筹与用户批准后，才可转为生产界面实施范围。
- 动态游戏状态、真实 Pixi 方块渲染、音频和触控事件均不属于本设计候选。

## D2 后继记录

- 统筹确认 D1 已解决重叠/缩写/Hold/全舞台遮罩，但未达到游戏状态感；用户明确授权继续 D2，仅限本目录。
- D2 把棋盘提高到 desktop `min(720px, 78dvh)`，将页面收拢为居中的 `context + board` 游戏簇；标题上方不再出现通用网站 header action。
- ready/playing/paused/mode-switch 都改为不同可见结构。D2 的 mode-switch 删除了棋盘内的 `选择模式`/`确认` 层；paused 改为棋盘内高度受限的错版纸带。
- 新增 three-mode stats 合约和同一 mock state；ready 保留零值语义。触控改为连续印刷式按键轨。
- D2 `verify_mockup.py` 渲染 7 个截图和 7 个 state/viewport 组合，检查横纵无溢出、bounds、无重叠、状态差异、pause strip、mode-switch 空棋盘文字、模式完整性、禁止文本、对比度和 console。
- 人工查看全部 7 张 D2 PNG；未使用 Browser file:// 绕过。D1 保留在 Git 历史，`screenshots/` 与 `geometry-evidence.json` 只保留 D2 最终证据。

## D3 portrait correction

- 统筹视觉验收通过 D2 desktop ready/playing/paused/mode-switch 与 844 × 390 landscape；仅拒绝 390 × 844，因为 context/stats 被强行压在 board 右侧窄列。D2 `b06b1d2` 不授权生产。
- D3 只编辑本目录的静态 mockup、portrait 覆盖 CSS、验证脚本、规格、审查和本日志；未重做研究、情绪板、desktop/landscape 截图或游戏验证。
- portrait 现在是 header → 240 px 宽 prelude（当前完整模式 + `切换模式` + 一个 Next）→ 240 × 480 居中 board → 240 px 专属 stats rail → 连续四区 touch rail。ready 与 mode-switch 以完整三模式行替换 prelude；mode-switch 不再有棋盘内提示。
- paused 的 `.pause-button` 在 portrait 完全隐藏；只有 board 内 pause strip 的 `继续`。D3 保持色带、错版边、暖纸/深墨/朱砂/钴蓝 token，未引入页面 grid、侧栏仪表、玻璃或霓虹。
- 新增正式 D3 portrait 截图：`screenshots/mobile-ready-390x844.png`、`screenshots/mobile-playing-390x844.png`、`screenshots/mobile-paused-390x844.png`、`screenshots/mobile-mode-switch-390x844.png`。D2 desktop/landscape 旧图保留为已验收历史，不重新捕捉。
- `verify_mockup.py` D3 只运行 390 × 844 四状态及 360 × 800 playing/paused long-value 几何压力；检查无横纵溢出、关键元素在 viewport、board 1:2/240 px/中心偏差 ≤ 8、关键文字与 board gap ≥ 8、无文字 clip、Next 在 board 上、stats 在 board 下、四触控区完整、暂停 strip 内含且 ≤ 18%、外部 `暂停` count 为 0、完整模式名/禁止词、零 console errors和对比度。
- long-value 压力值为 `999,999`、`99:59`、`12`，仅由 `?stress=long` 驱动；它们记录布局容量，不是生产或装饰数据。
- 人工复核四张 D3 图：portrait 已成为单列游戏界面而非 desktop 缩小版；所有完整模式名、Next、stats 和触控轨与棋盘分区清楚。风险仍仅限未来生产实现必须按真实 state 提供长值并保留同样的上下次序与板内暂停边界。

## D4 controls and paused-mode correction

- 统筹独立复审保留 D3 视觉方向，但条件拒绝 `2aea0a0`：触控少了 hard-drop，paused 没有重开、mode-switch 没有返回本局。D4 是其直接子提交，仍只写本目录，不改生产、不 push、不重做整体构图。
- 触控轨在 portrait 和 landscape 都恢复为五个连续印刷区：`←`、`→`、`↑ 旋转`、`↓ 快速下落`、`⇣ 直接落底`。软降和直接落底不共享或改写语义；每区最小 44 px。
- 所有 paused 状态以 `[data-state="paused"] .pause-button{display:none}` 隐藏棋盘外 `暂停`；棋盘内错版纸带仍 ≤ board 高度 18%，并有 `继续` / `重新开始` 两个可读操作。模式入口仍留在 board 外。
- mode-switch 的 desktop 与 portrait 三完整模式行继续在棋盘外；在 `应用并重新开始` 后增加次要 `返回本局`。board innerText 继续为空，未引入 modal 或棋盘内文字。
- 受影响截图更新：`screenshots/desktop-paused.png`、`screenshots/desktop-mode-switch.png`、四张 `screenshots/mobile-*-390x844.png`、`screenshots/landscape-mode-switch-844x390.png`，新增 `screenshots/landscape-paused-844x390.png`。未重捕 desktop ready/playing 或 D2 以外无关状态。
- 一次定向 Playwright 静态验收覆盖 9 个组合：1440 × 900 paused/mode-switch、390 × 844 ready/playing/paused/mode-switch（五区触控）、844 × 390 paused/mode-switch（五区触控）、360 × 800 解谜 long state（关卡 `12`、剩余方块 `12`、目标进度 `12 / 20`）。结果：9/9 通过，7 个触控视口均断言五区及 ≥44 px，三视口 board ratio `2 ± .02`、零 console errors；`geometry-evidence.json` 已替换为 D4 结果。
- 人工复核 desktop、portrait、landscape 的 paused/mode-switch：D4 保持 Offset Drop 纸带/套色 signature 与 board-first 构图；暂停双行动没有扩大成卡片，返回本局留在棋盘外，landscape 的五区轨没有与棋盘或模式列相交。

## D5 design reboot — Mineral Shelf

### 范围与研究

- 线程：`019f4deb-7e83-7583-8cd5-8e6f075bc331` 的 design-only D5 委派；工作树为 `C:\Users\Alex Chen\.codex\worktrees\e469\Game-1`。只写本目录；未编辑 production、根 `DESIGN.md` / `CURRENT_TASK.md` / CHANGELOG、package/config 或 Temple，未 push。
- Python UTF-8 只读来源：当前 worktree 的 `AGENTS.md`、`DESIGN.md`、`CURRENT_TASK.md` 与本日志；`E:\Proj\Game-1` 在 `0700faffe6f50aa49af2fef81f07f90113bd7c70` 的已推送状态和 T2 正式证据；否决截图 `C:\Users\ALEXCH~1\AppData\Local\Temp\codex-clipboard-17f91a73-8aab-4744-aff6-c9aa1b148fa9.png`。
- 研究结论：否决方向的巨大标题、斜条、深色井和松散 rail 让游戏变成编辑页。D5 冻结唯一新方向 `浅岩台 / Mineral Shelf`：浅纸与浅矿物 board、双层赭石/蓝灰矿脊脚、小型完整 Tetris、board-first 和连续五键轨。

### 技能与具体影响

1. **frontend-design**：将方向定为单一的双层矿脊 signature，并定义浅色 token、mode rail、紧凑开始动作和状态优先级；没有采用 card/dashboard 模板。
2. **webapp-testing / Playwright**：独立静态 `d5-light-prototype.html` 使用 Chromium 检查 DOMRect、字号、文字裁切、模式/暂停/解谜语义和 console；没有运行游戏 build、测试或生产 server。
3. **未用 Browser/imagegen**：本轮明确不使用位图或浏览器自动化掩盖 code-native 布局问题；最终依据为 HTML/CSS 和 Playwright PNG。

### 统筹预审与最终修正

- 第一预览后，desktop ready/playing/paused board 固定为 `306 × 612px`（1440 × 900 的 68vh）；ready 改为横向三完整模式 rail、单条 selected 规则和 144 × 46px 开始动作；portrait 去除 header 重复模式名。
- 第二预审接受方向后，desktop header 最终只留完整 `Tetris`；mode rail 去除竖向 divider，改为矿物/赭石短下划线；desktop 和 portrait essential copy 计算字号都断言 ≥12px。
- 解谜 select/playing 最终明确展示 `关卡 N/总数`、名称/难度、固定后续序列、剩余方块与清空棋盘目标；局内有 `重新开始关卡` / `返回关卡选择`，select 有开始/返回。均为扁平行，没有 modal/card。

### 产物与验证

- 设计说明：`D5_LIGHT_VISUAL_DIRECTION.md`、`D5_STATE_LAYOUT_SPEC.md`、`D5_DESIGN_REVIEW.md`。
- 原型/检查：`d5-light-prototype.html`、`d5-light-prototype.css`、`d5-light-adjustments.css`、`d5-reboot-correction.css`、`verify_d5_light.py`、`d5-geometry-evidence.json`。
- 正式截图：
  - `d5-screenshots/d5-desktop-ready.png`
  - `d5-screenshots/d5-desktop-playing.png`
  - `d5-screenshots/d5-desktop-paused.png`
  - `d5-screenshots/d5-desktop-puzzle-select.png`
  - `d5-screenshots/d5-desktop-puzzle-playing.png`
  - `d5-screenshots/d5-portrait-ready.png`
  - `d5-screenshots/d5-portrait-playing.png`
  - `d5-screenshots/d5-portrait-paused.png`
  - `d5-screenshots/d5-portrait-puzzle-select.png`
  - `d5-screenshots/d5-portrait-puzzle-playing.png`
  - `d5-screenshots/d5-landscape-playing.png`
  - `d5-screenshots/d5-landscape-puzzle-select.png`
- 命令：每个 `D5_BATCH=0…5` 以 `D5_CAPTURE=1 python verify_d5_light.py` 渲染；再以 `D5_BATCH=merge python verify_d5_light.py` 汇总。最终报告为 16/16 cases、12 张正式图、0 console errors；断言无横纵溢出、无模块/文字重叠、board `2 ± .02`、五 controls ≥44px、一个 Next、完整模式名、禁止旧设计词、暂停带内含且 ≤18%、mode switch board 无文字、解谜状态与 360 × 800 长值。
- 人工逐图复核：12 张 PNG 的 ready/playing/paused、portrait 单列、多关解谜和 landscape 都有可辨识游戏状态；D5 不再包含巨大标题、斜带、深井或松散左 rail。

### 候选与未决项

- D5 candidate：本日志所在的 design-only commit，是当前 D4 `7fc8143` 的直接子提交；最终 SHA 由提交完成后回报统筹线程，避免在 commit 本身写入会因 amend 改变的自指 SHA。
- 未决仅限生产落地：必须把 mock state 替换为真实 core/UI state、用单一 Pixi canvas 实现等比棋盘与双层脚缘、接入真实输入/暂停/reduced-motion；本设计候选没有授权这些代码改动。
