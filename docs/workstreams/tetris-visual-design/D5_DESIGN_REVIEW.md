# D5 Design Review — Mineral Shelf

## 结论

D5 以浅色矿物棋盘和双层矿脊脚取代被否决方向的巨大标题、斜色带、深色棋盘井和松散侧栏。它是设计候选，不是生产授权；没有修改任何 `src`、根设计文档、package/config 或 Temple 文件。

## 被否决问题与对应修复

| 旧问题 | D5 修复 |
| --- | --- |
| 巨大标题、对角条幅、深墨井抢占玩法 | 24px 小型完整 `Tetris`；无斜带；棋盘为 `#E1E5DC` 轻矿物表面 |
| desktop 像表单，棋盘过小 | 1440 × 900 ready/playing/paused 的 board 为 306 × 612px（68vh），游戏簇居中 |
| 竖向 mode 说明重复且像卡片 | 一条三等分 typographic rail，只显示 selected 的目标/结束行；没有竖线、卡片或 pill |
| full-width 开始条像 dashboard | 144 × 46px 主要开始按钮，居于 rule/board 轴 |
| header 复写模式名 | header 只保留 `Tetris`；当前完整模式只在 context 或 selector 承担 |
| Pause 覆盖舞台 / 外部重复暂停 | 小于 board 高度 18% 的棋盘内纸带，外部暂停按钮在 paused 时为零 |
| 触控区把 soft/hard drop 合并或标签微小 | 五个连续、可分辨、≥44px 的按键；desktop/portrait 关键文字 ≥12px |
| 解谜只是一张单层面板 | flat rows 展示 `关卡 N/总数`、名称/难度、固定序列、剩余方块与清空目标；局内有 restart/back |

## 自动验收

[`d5-geometry-evidence.json`](d5-geometry-evidence.json) 汇总 16 个 Chromium 静态状态：

- `1440 × 900`：ready、race playing、paused、puzzle-select、puzzle-playing。
- `390 × 844`：ready、playing、paused、puzzle-select、puzzle-playing、mode switch、complete/fail。
- `844 × 390`：playing、puzzle-select；另有 `360 × 800` 解谜长值压力。
- 每案断言页面无横纵溢出、关键 rect 均在 viewport、模块无重叠、board 比率 `2 ± .02`、一个 Next、五个 controls ≥44px、完整模式名、禁止 Hold/暂存/旧设计词、零 console error。
- paused 断言外部 `暂停` 为 0、纸带在 board 内且高度 ≤18%；mode switch 断言 board 无文字且有 `应用并重新开始` / `返回本局`。
- desktop / portrait 额外断言可见 essential text 的计算字号最低 12px；所有可见文本无 clip。

## 人工复核

逐张检查 12 张正式 PNG：desktop 的 board-first 比例、ready/playing/paused 的状态差异、portrait 的单列层级、解谜关卡行，以及 landscape 的左右信息分工均清楚。没有深色井、对角 banner、卡片阵列、伪数据、Hold/暂存或页面背景网格。

## 生产落地风险

- 生产必须把 mock 数值替换为真实 game state，并按模式隐藏无关 stats。
- 真实 Pixi canvas 的可测 board 外框必须保持 10 × 20 与双层矿脊脚的几何口径；不能把 DOM 原型格线直接作为生产 cell grid。
- 真实输入要保留五个独立命令、键盘提示、暂停局部化与 reduced-motion；音频、存档和状态转换仍需由实现工作流验证。
