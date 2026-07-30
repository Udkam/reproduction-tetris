# Phase 9：洞穴压力与紧凑导航

## 状态

**ACCEPTED LOCALLY / PUBLICATION PENDING（2026-07-31）。**

恢复基线为已推送的 `main@87121af42330ab9aea9456e28dfa42e5edc62536`。
本阶段由主协调任务作为唯一 writer。三个前置设计智能体只读比较了生存洞穴、
普通落底/消行和选关/首页，各自提交三案后退出；不得把它们当作生产修改证据。

## 目标

把玩家最新六点反馈转成四个相互独立、可回退的产品检查点：

1. 生存 Core：同列随机一至两块、双石时刚性堆叠、严格两倍速度。
2. 生存 Renderer：同族但可区分的冷灰岩基岩/落石、倒计时逐层升岩和局部洞穴压力。
3. 共享微反馈：短促落底压印与无横线的普通消行面光。
4. 页面导航：五十关无滚动矩阵和真正完成的首页优化。

设计选择、精确规则和响应式边界以 `docs/DESIGN.md` 的 Phase-9 合同为准。

## Checkpoint A — Survival Core

### 行为

- 保持生存方块 `40 ticks/格`，落石改为 `20 ticks/格`。
- 独立 RNG 在两秒预警开始时冻结一个数量（1 或 2）和一个预警列；阻塞后
  原数量、原列等待，不得重抽。
- 一次事件只有一个身份。一块事件为单格；两块事件在同列上下相邻、一起
  出生、一起下降、一起落定；任一所需入口阻塞都不得部分出生。
- 落定单元可消除并使用原生存计分。普通七袋、压力 `13→6` 秒、落石事件
  `20→10` 秒、三行去一层基岩和排行榜均不改变。
- 暂停、重开、行消、基岩升降、顶出和哈希保持确定性。

### 路径

`src/game/core/constants.ts`、`types.ts`、`engine.ts`、`race.test.ts`，以及因
公开状态形状而必须调整的直接消费/测试。不得修改 Puzzle 或 Mutation Core。

### 检查

Focused race/Core tests and typecheck. Commit the first green deterministic claim
before Renderer work.

## Checkpoint B — Survival cavern Renderer

### 表现

- 保留清楚格线；用冷灰板岩族、固定坐标变体、不规则断面、短斜裂纹和缺角表现洞穴。
- 基岩暗且压实；可消落石亮且新鲜；双石共用外轮廓和中缝，单石不得画出
  幽灵第二格。禁止暖棕木纹、横向层理、木板和砖墙感。
- 顶部裂隙预警取代箭头，并准确显示本次一格或两格轮廓。飞行只有短尘尾；
  落地只做 `120–160 ms` 局部接触；
  基岩升降只强调新边界。
- reduced motion 删除插值、脉冲和尘粒，保留静态危险位置和材质身份。
- `3 / 2 / 1` 倒计时分别只显示底部 `1 / 2 / 3` 层基岩；新层从下方向上
  升入规范格位。该过程只改 Renderer 展示，不改 Core 的确定性三层初始棋盘。

### 路径

`src/game/render/theme.ts`、`theme.test.ts`、`presentation.ts`、
`presentation.test.ts`、`TetrisRenderer.ts`、`TetrisRenderer.test.ts`，
以及规则说明文本/App 公开状态。

### 目标帧

桌面：三层初始基岩、T−2 预警、半入场、空中、落地、补行、基岩上升、
基岩下降。另取竖屏、短横屏、英文和 reduced-motion 真实帧。

## Checkpoint C — ordinary micro-feedback

### 表现

- 普通落底最多 6 ticks；真实支撑点压印；不移动/缩放棋盘或方块。
- 硬降最多四条、三 ticks 的列向短迹。触发消行时取消短迹并削弱压印。
- 普通消行最多 9 ticks；按中间到两侧激活每格内部的固定面光；主体原位、
  原尺寸、可辨；不得画横线或整行带状图形，粒子为零。
- reduced motion 仍保留静态接触与同时出现的十格面光淡出。
- Survival 落石、Mutation Bomb/Collapse、Puzzle 锚点维持各自边界。

### 路径

Renderer/presentation/theme 及其直接测试。Core、音频和模式规则冻结。

### 目标帧

普通锁/硬降/清行锁各 `0/2/6 tick`；单行与四行 `0/2/5/9/12 tick`；
normal/reduced-motion；Classic/Survival/Mutation/Puzzle 共存帧。

## Checkpoint D — Puzzle bench and mode home

### Puzzle

- 顶部紧凑预览条：真实残局预览、名字/当前最优、Start。
- 下部完整矩阵：桌面/横屏 `10×5`，竖屏 `5×10`；所有五十关无滚动。
- 五行分别对应真实 `3/4/5/6/7` 目标行课程；第五/六列间可保留一次功能间隔。
- 节点至少 44px；完成对勾、选中态、最佳步数、焦点态与中英文清楚。
- roving tabindex：十列矩阵上下 ±10；五列矩阵上下 ±5；Enter 选择。

### Home

- 一个 `TetraMorph` 字标；四模式改成 `2×2` 功能矩阵。
- 四个真实四格 glyph、四模式色、稳定文字指标；选择不改变 CTA 色。
- 方向键在四入口移动，Enter 进入；组件 CSS 在 tokens 后生效。

### 首次规则页

- 中文标题直接连接模式名与“规则”，例如“生存规则”；英文自然显示
  “Survival Rules”。
- 去掉“首次进入说明 / First-time overview”和内容框内重复的“规则 / Rules”。
- 主按钮统一为“好的 / Got it”，次按钮保留“返回 / Back”。
- 生存规则明确写成：每次随机一至两块可消落石，共用同一随机列，以普通
  方块两倍速度下落；不得再写成固定双石。

### 路径

`src/App.tsx`、`App.test.ts`、`styles.css`、`styles/tokens.css`、最终组件权威层
`styles/navigation.css` 及其直接测试、`main.tsx`、`ui/localization.ts`。
`navigation.css` 必须在语义 tokens 与现有模式/HUD 层之后加载；不得再向历史
`styles.css` 追加导航覆盖。不得修改关卡定义、路线、解锁/存储或记录语义。

### 目标帧

`1440×900` 中英首页、`1280×720` selector、`2048×1152`、`844×390`、
`390×844`、`360×800`，并覆盖未通关/通关/选中/第 50 关、键盘焦点和
reduced-motion。每帧断言 document 与 matrix 的纵横 overflow 均为零。

## Checkpoint E — clean entry, result ledger, and two-page gallery

Latest direct review supersedes the accepted one-page selector composition while
retaining the repaired home grid and short-landscape height budget as recovery
evidence.

### 倒计时

- Core 保留确定性的 active/queue；Renderer 以 `state.status === 'ready'` 为
  唯一显示门。`ready` 的 active、ghost、carrier、Next 图形和公开 snapshot
  均为空。
- 生存 `3 / 2 / 1` 只显示数字和正在升起的 `1 / 2 / 3` 层基岩。进入
  `playing` 的第一帧才同时恢复 active、ghost 和 Next。

### 普通模式结算

- 经典、生存、异变使用矿物白成绩单，模式色仅用于窄顶缘、主数据、当局
  排行和主按钮；不得使用统一危险色或点分隔摘要。
- 数据固定为：经典“消行 / 分数”，生存“生存时间 / 消行”，异变“消行 /
  分数”。生存不显示方块数或基岩层数。
- 入榜不显示独立的“本局第 N 名”；排行榜中带模式色并明确标注的当局行
  已足以表达名次。未入榜显示“未进入前 5”；排行榜保留前五、日期与
  当局明确标识。解谜成功继续使用独立庆祝窗口。
- 左右键切换两个操作、Enter 执行、Esc 返回；窄屏/短横屏无裁切，
  reduced-motion 无结果入场位移。

### 双页残局画廊

- 页面一为 `01–25`，页面二为 `26–50`；每页一个 `5×5` 功能矩阵，节点
  必须为正方形且至少 `44×44 px`。矩阵在目录面板内居中，不得通过拉伸
  行高填满剩余空间；节点之间保留清晰间距。
- 桌面与短横屏左侧为深靛真实残局预览，右侧为分页和矩阵；竖屏上下堆叠。
  关卡名、当前最优步数、开始键与预览连接成一个主视觉。
- 两个范围键使用 tablist。页内方向键 `±1 / ±5`，Home/End 到页首/页尾，
  跨 `25/26` 自动换页并保留焦点。完成关替换为对勾，选中同时使用实底、
  外轮廓和 `aria-selected/pressed`，不得只靠颜色。
- 最佳步数只在预览出现；页面没有行数标签、节点缩略图、滚动条或装饰性
  说明。切页/预览最长 `180 ms`，reduced-motion 立即切换。

### 首页瞬时高亮

- 初始帧没有 active 卡片。鼠标高亮只由真实 `:hover` 表达，离开模式区域
  一帧内清除；不保留 `mode-gate--active` 或伪 pressed 状态。
- 键盘 roving tab index 与 pointer 独立，`:focus-visible` 不因 pointerleave
  丢失，方向键和 Enter 行为不变。

### 新权威路径与证据

- `src/styles/result.css` 只拥有结算成绩单。
- `src/styles/puzzle-library.css` 只拥有双页图库，并在
  `navigation.css` 后加载；不得向历史 `styles.css` 追加本次覆盖。
- 新证据至少包含中英结果窗口、入榜/未入榜、生存倒计时三帧及启动首帧，
  以及 `1440×900`、`844×390`、`390×844`、`360×800` 两个图库页面、
  首页 pointerleave、键盘焦点和 reduced-motion。每帧均核对单 Canvas、
  零 DOM 棋盘格、零 console/page error 和纵横零 overflow。

### 源码检查点

- `2c1a13d..724e152`：双页 `5×5` 图库和首页瞬时 hover 已实现。组件每次只挂载
  二十五个功能节点；两个范围键为 tablist，方向键可跨 `25/26` 换页并保留
  焦点；预览、名字、当前最优和 Start 共用一个连接舞台。
- 首页不再生成 `mode-gate--active`、`data-selected`、`aria-pressed` 或
  pointer-enter 状态。键盘仍使用单一 roving tab stop 和 `:focus-visible`。
- 聚焦 App/navigation/gallery 验证通过 `48/48`，typecheck 通过。预验收
  四视口均无溢出，紧凑预览裁切和 360 px 返回标签换行已修复，但首轮
  图库节点因轨道拉伸成为纵向长方形并被视觉拒绝。最终候选必须改为
  居中的正方形节点与更宽松间距，再验收两页、中英文、键盘和
  reduced-motion。
- `348209f` 完成正方形修正：四个目标视口节点宽高严格相等，矩阵与页面
  均无溢出；桌面、短横屏与竖屏分别使用有呼吸感且符合空间预算的间距。
  该恢复点仍需最终门禁和重新生成的候选证据。
- 证据检查点 `eae9a1f` 被独立 QA 拒绝：`844×390` 未入榜五行成绩单裁切
  第五行和两个操作；Puzzle 两个范围 tab 缺少 tablist 自身的方向键操作。
  修正必须让短横屏成绩/榜单并排并完整显示操作，同时为 tab 加入
  Left/Right/Home/End 焦点与激活语义，不改变关卡矩阵导航。
- 高屏外框不得继续拉满视口制造结构性留白；图库工作台最大高度收紧至
  `740 px` 并在可用内容行内垂直居中，小视口仍使用全部可用高度，节点
  尺寸和间距不回退。
- 第一行关卡悬停时不得向裁切边界外位移，上边框必须完整；选中节点左上角
  两个无功能含义的装饰方块删除。

### 最终验收

- 最终产品源码为 `ba6bbb6`，证据检查点为 `25cfebf`。短横屏成绩单完整
  显示五行榜单和两个操作；入榜只通过榜单内“本局 / This run”行表达，
  不再重复“本局第 N 名 / This run · #N”。
- 高屏图库外框最大高度为 `740 px` 并在内容行内垂直居中；四个目标视口的
  节点均为正方形，最小边长 `46 px`，网格与文档均无滚动。第一行 hover
  纵向位移为 `0 px`、上边框保持 `1 px`；无意义双角标已删除。
- tablist 的 Left/Right/Home/End 与关卡矩阵的页内/跨页键盘路径均通过；
  首页 pointer leave 后 hover 和持久选择状态均为零。
- 最终 typecheck、`29` 文件 / `261` 测试、`756` 模块生产构建通过。
  二十六项证据清单复算 `26/26`；倒计时、结算、中英文、reduced-motion、
  单 Canvas、零 DOM 棋盘格、零 overflow、零 console/page error 均已核对。
- 两次独立只读终审均给出 ACCEPT，P0/P1/P2 = 0。

## 最终门禁与 QA

最后一次源码修改后只运行一次最终：

1. `npm.cmd run typecheck`
2. `npm.cmd run test -- --maxWorkers=1`
3. `npm.cmd run build`
4. 一个受管 Vite/Chrome 租约和官方 `develop-web-game` client 动作 burst
5. source-bound 几何、截图、console/page error、输入和生命周期清单

独立 `rules`、`visual`、`evidence` QA 审计同一 candidate。P0/P1 或与本次
用户要求直接相关的 P2 必须回到原 writer，产生新的源码 checkpoint 和证据；
不以多数票忽略可复现问题。

## 资源与恢复

- 绿色资源最多四个本项目任务、最多两个重任务；实际写入始终只有主任务。
- 琥珀降为两个并串行新增重任务；红色不启动测试、构建、浏览器或子智能体。
- 不使用 WMI/CIM、Serena、常驻索引、LSP/MCP 或无需求的 Node watcher。
- Vite、Chrome、runner 只在取证批次存活；记录命令、父子链、端口和用途，
  完成后释放 4178/5178/5179 并核对工作树。
- 文档合同、Core、Survival Renderer、共享反馈、页面、证据、三路 QA、
  验收记录分别提交；精确 staging，禁止 `git add .` / `git add -A`。
- 最终范围受限 gitleaks 无敏感输出，非强制 push，并核对 local/tracking/
  remote 精确相等。
