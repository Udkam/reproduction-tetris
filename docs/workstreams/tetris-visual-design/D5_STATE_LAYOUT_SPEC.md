# D5 State & Layout Contract

## 共同规则

- Board 永远是 10 × 20，外框 DOMRect 比率为 `2.00 ± .02`。双层矿脊脚包含在可测外框中。
- `Tetris` 小字标独立于棋盘；header 只有这个完整字标，保留真实安全 top inset 和固定高度，标题 DOMRect 必须完整落在 viewport 内。
- 一局只有一个 Next；Next、stats、controls 与棋盘的可见 rect 不相交。
- 所有关键文字在 desktop 和 portrait 最小 12px；五个触控区宽高均至少 44px。
- 生产值都来自游戏 state。原型中的 `42,600`、`02:18`、`3/6`、`04` 是同一文档化 mock state 的布局样例；ready 不显示进行中 telemetry。

## 尺寸合约

| Viewport | 游戏簇 | Board | Context / stats / controls |
| --- | --- | --- |
| 1440 × 900 | 620px 轨道，居中 | ready/playing/paused 306 × 612px（68vh）；select 可为 166 × 332px 以给多关行留位 | ready rail 620px；运行 context 310px；stats 与 controls 310px，均垂直贴近 board |
| 390 × 844 | 260px 单列、两侧 ≥16px | 常规 266 × 532px；解谜局 216 × 432px；关卡选择 166 × 332px | header → context/flat rows → board → stats → help → 连续五键轨；无侧列 |
| 844 × 390 | 812px 横向舞台 | 156 × 312px，居中 | 左侧 context/关卡行、右侧 300px stats 与五键轨；均不压入棋盘，所有 essential/help/control/action 文本 ≥12px |
| 360 × 800 probe | 260px 单列 | 解谜局 216 × 432px | 容纳长值 `3/6　示例：玄武裂隙 · 困难`、`12 块`、`12`，不裁切 |

## 状态合同

| 状态 | 可见内容与优先级 | 交互边界 |
| --- | --- | --- |
| ready | 三完整模式名 rail → 已选模式一行目标/结束 → 144px `开始` → 空棋盘（只可有 ghost） → help/五键 | 无活跃/锁定方块；不显示局内 stats 或 Next |
| marathon playing | 当前 `马拉松模式`、切换模式、唯一 Next、暂停；board；得分为主，消行/等级为辅 | 外部暂停按钮只在 playing；stats 在 board 下 |
| race playing | 当前 `竞速模式`、切换模式、唯一 Next、暂停；目标为完成 20 行；board；用时为主，剩余行/速度档为辅 | 不显示分数或无意义等级 |
| paused | 保持当前 context、Next、stats、controls；board 内 58px（≤18% board 高度）纸带写 `暂停 / 继续 / 重新开始` | 棋盘外 `暂停` count 必须为 0；不暗化页面 |
| mode switch | 三完整模式名 rail、已选目标/结束、`应用并重新开始`、`返回本局`；board 冻结降对比 | board `innerText` 为空；没有 modal、确认层或棋盘内说明 |
| puzzle-level-select | `解谜模式 · 选择关卡`；代表性、可滚动的六条以上扁平关卡行：`关卡 N/总数`、名称/难度、固定后续序列、清空棋盘目标；已选摘要；开始/返回 | 不使用关卡卡片网格或 modal；board 仅作低对比预览；所有行必须可滚到 |
| puzzle-playing | 当前 `解谜模式`、切换模式、唯一 Next、暂停、`重新开始关卡`/`返回关卡选择`；board；关卡 N/总数+代表性名称/难度、固定后续序列、剩余方块、清空棋盘目标 | 不显示得分或速度档；剩余方块耗尽即失败 |
| puzzle-complete / fail | puzzle-playing 保持；board 内 result band 分别显示 `解谜完成 / 棋盘已清空` 或 `未完成 / 方块已用尽` | result 不越出 board；关卡动作仍在 board 外 |

## Bounds 与文字规则

- board 水平中心相对 viewport 中心偏差 ≤ 8px；portrait 中 Next 位于 board 上方，stats 位于 board 下方。
- 可见关键模块必须完全在 viewport 内，页面无横向或纵向滚动；所有文本 scrollWidth/scrollHeight 不得大于自身客户端边界。可滚动 `.level-list` 是唯一例外：它必须保留平行的扁平行，并自动证明最后一行可达。
- mode rail 是连续的一条边界线：没有竖向 divider。selected rail 只允许短矿物线+赭石脚标。
- 触控 help 明示 `← → 移动、↑ 旋转、↓ 快速下落、空格/⇣ 直接落底`；portrait 固定断成两行，避免留下孤立字符。
