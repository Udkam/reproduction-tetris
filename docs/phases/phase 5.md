# Phase 5：Mutation 附着道具、强识别与高冲击反馈

## 状态

**Core 已本地接受，Renderer/VFX 检查点已开放。** Phase 4 验收/恢复记录 `fd7ef8d`
已推送至 `origin/main`；Phase 5 以该提交为回退基线，审计文档头为
`fae3c96`。Core/性能、Renderer/VFX 和 UI/Next 三路只读审计一致判定当前
T14 基线为 `GAP`，因此没有沿用历史验收。首个产品源码检查点 `f344f49`
已隔离附件 RNG、实现冰冻 60 tick/格，并补 body+item Next、全部主动控制、
最终冰冻 tick/恢复速度、重触发与并存直接测试。后续 `2e10789` 用同一个
40 × 10 单遍压实结果同时更新棋盘和 carrier metadata，`94c2d66` 直接证明
同一 transition 的 FIFO 进入 Renderer，`3ceb6c2` 补齐多 carrier、空源索引、
空 carrier 移除与恰好一次交付回归；`f2d51ca` 又直接固定三种非异变模式的
item RNG / replay / hash 隔离。最新定向 40 测试和 typecheck 通过。
第一份候选审计未发现 P0/P1 产品缺陷，但因直接证据和记录缺口判为 `GAP`；
修正后的 exact product head `f2d51ca` 已由完整规则审计与独立性能/FIFO
审计分别接受，均为 P0–P3 = 0。Core 边界现本地接受，允许进入下列 Renderer /
timeline 精确路径；Phase 5 整体仍需 VFX、UI、浏览器证据、复验、记录与 push。
Renderer 已产生首个可靠性回退点 `2484b67`：炸弹延迟到 impact 才发射碎片，
连续触发共享固定对象池而不清除前一批粒子，运行时 reduced-motion 切换保留
当前触发、FIFO 与计时场，Collapse 禁用全棋盘位移滤镜，Next 缓存绑定独立附件
随机流。后续 `e66cbf8` 为四类载体增加各自的边缘/符号语法、四种不同的
reduced-motion 静态终态和显式 2× / 4× 持续场；`8488dd2` 则移除 Collapse
触发态与持续态的全宽横带，把触发重力井绑定到 carrier 实际列，并用固定数组
扫描得出的真实移动列/最大落距绘制落定轨迹。定向 Renderer/timeline 测试
24/24 与 typecheck 通过。精确产品头 `8488dd2` 已形成 Renderer 候选，但尚未
经过两路独立审计、UI/localization、最终源码浏览器证据和全量门禁，因此不构成
Renderer 或 Phase 5 验收。首轮独立视觉合同审计静态接受产品实现，但发现原
测试把颜色/alpha 混入几何签名、stub 掉真实倍增字形且使用错误的同锁消行事件，
因此整体判为 `GAP`。修正 `e2858a2` 改用纯几何签名，直接固定 Surface/Core 在
locked/active/Next 的共用入口、真实 2× / 4× 字形、所有长矩形/长线段和
`piece-locked + clear-started`，定向测试提升为 25/25。该候选仍待两路复验。
第二轮视觉复验又发现 Core 签名仍混入其内部 Rim，且三状态路由 stub 掉了
真实 Core，删除 Core→Rim 调用仍会假通过。`6599764` 把 Core/Rim 分离采样并
包装真实 Core，直接证明 locked/active/Next 三个入口都到达 Rim；25/25 与
typecheck 再次通过。精确候选改为 `6599764`，仍待最终视觉复验与独立性能/
生命周期审计。
最终视觉合同复验对 `6599764` 给出 `PASS`、P0–P3 = 0。独立性能/生命周期
审计静态接受实现，但发现连续 burst 不清前批与 Collapse trail 到期释放没有
直接测试，整体判为 `GAP`。`69730a1` 增加旧 Bomb 粒子在 Freeze 发射后仍存活、
trail 在 259 ms 存在且 260 ms 释放的断言；25/25 与 typecheck 通过。精确候选
现为 `69730a1`。修正后的性能/生命周期复验给出 `PASS`、P0–P3 = 0，与视觉
合同 PASS 一致。Renderer 静态边界已本地接受，允许打开冻结的 UI semantics /
localization 路径；最终浏览器帧、60 FPS 和生命周期实机证据仍属于 Phase 5
最终验收，不能由静态结论替代。
UI semantics 候选 `7968bb1` 已完成 `冰冻` / 1 秒每格双语规则、仅活动状态行、
body+item Next 无障碍描述和同 transition 多事件 source-order live region。
`src/App.test.ts` 34/34 与 typecheck 通过。首轮独立静态审计发现 entry /
line-clear 的 `active=null` 过渡帧仍会漏报 Next 附件。修正 `287c426` 以即将
spawn 时的 piece count 判定资格，并直接固定两种延迟帧预测等于实际 carrier、
state hash 不变及 ARIA 在 `active=null` 时仍包含附件；Core/App 定向 55/55
与 typecheck 通过。复验确认产品逻辑正确，但发现两个 Core fixture 恰好都抽到
空附件，旧 guard 仍可能让直接证明假通过。`65ffd19` 将 entry 和 line-clear
分别绑定到确定产生附件的独立流并显式断言非空；最终复验为 `PASS`、P0–P3 = 0。
响应式候选 `d819d92` 随后只修改冻结的三条 CSS/test 路径：空闲态沿用普通两列，
活动态才以 `:has(.mutation-status)` 打开第三列，一至三个状态使用真实数量的
auto rows/auto-fit columns，并移除会以更高 specificity 隐藏 stats/Next 的旧移动端
覆盖。App/HUD 定向 40/40、typecheck 和 diff check 通过。本次高 CPU 下没有
启动 Vite 或 Chrome，因此不声称动态证据。独立响应式审计接受精确候选
`d819d92`，P0–P3 = 0：空闲/活动 specificity、
一至三个真实轨道、短高 auto-fit、12 px 字号下限、reduced motion 和非异变
模式隔离均通过。最终源码 typecheck、26 文件 / 223 测试和 753 modules 生产
构建均通过；动态帧、60 FPS、生命周期、证据捕获和重复最终审计仍未完成。
最终证据预审现于浏览器启动前判定首版 harness 为 `GAP`：只核对本地 Git 而连接
既有 4178 服务不能证明页面来自 `d819d92`；Core 的 `mutationLastItem` 不能代表
Renderer FIFO 当前播放项；Bomb 等待可能停在 impact 前；单次 mount/unmount
也不足以证明生命周期回收。一个最终的有界观测性修正现只开放
`TetrisRenderer` snapshot/test 与 Phase-5 capture harness：增加只读 current
flash timing、queue depth、active particle count 和 Collapse trail columns，
由 harness 自行启动/关闭 strict-port Vite，按 Renderer 当前时间线捕获 Bomb
impact，约束真实 rAF mean/p95，并以 home baseline 连续验证两次
mount/unmount。此修正不得注入状态、改变玩法或 VFX 几何。

**Temporary pause (2026-07-29):** product source remains `f6fa06e`. Final gates are
source-bound at `96a3841` (typecheck, 26/224 tests, 753-module build). Dynamic capture
published no artifacts: the first rejected run exposed stale FIFO sampling; committed
correction `3d01e9f` passed two independent static re-audits, while its next run
correctly rejected a screenshot that crossed the current activation under sustained
80%–90% external CPU load. Phase 5 remains `OPEN`, unaccepted and unpushed. Chrome,
ports 4178/5178/5179 and `.partial-*` directories are clear. Resume from `3d01e9f`,
rerun the same managed harness in a trustworthy resource window, then finish visual /
evidence QA, acceptance and non-force push before Phase 6.

**Resume correction (2026-07-29):** a third fail-closed run reproduced the
post-screenshot FIFO assertion even with sampled CPU below the 60% admission limit.
The harness had coupled the rAF FIFO proof to one full-viewport PNG that must remain
inside the shortest 300 ms activation. That PNG is not the FIFO proof: the fixed
expected sequence, queue suffix, instance index and frame-by-frame observer are.
The bounded correction removes only the ambiguous FIFO witness screenshot while
retaining the complete observer trace; the four separately labelled activation PNGs
remain mandatory visual evidence. `--help` and unsupported arguments must also exit
before a partial directory, Vite process or browser is created. Product source,
visible VFX geometry and the committed gate evidence remain unchanged.
Fresh independent review adds three blocking evidence requirements. Consecutive equal
labels advance only when their activation elapsed time resets; queue shrink alone is
insufficient. The browser batch must also publish one non-empty actual-column Collapse
settlement PNG and one reduced-motion activation PNG for each of Freeze, Collapse,
Bomb and Multiplier. These are harness-only proof corrections, not product changes.
Two fail-closed managed runs then demonstrated that SwiftShader can take longer than
the full 260 ms Collapse trail to complete even a cropped DevTools screenshot. A
bounded live diagnostic further proved that copying the presented WebGL Canvas returns
transparent pixels without `preserveDrawingBuffer`. Transient activation/trail PNGs
must therefore use Pixi `ExtractSystem` to synchronously rerender the current stage's
exact board frame into an unmounted 2D Canvas. Sample Renderer pre/post state and
encode PNG in the same JavaScript turn; reject blank pixels, mismatched CSS/Pixi
bounds, dimensions, instance identity or hashes. This read-only DEV QA path requires
direct Renderer/runtime tests and a refreshed final gate batch. It may not retain or
mount the extracted Canvas, enable `preserveDrawingBuffer`, alter VFX duration, pause
gameplay, or replace full-page layout screenshots.

**Hardware-run correction (2026-07-29):** the first hardware-backed formal batch was
correctly fail-closed after all three current timed effects expired on the same Core
tick, producing a valid `3 → 0` transition rather than the harness-assumed `3 → 1`.
No product or partial evidence changed. The one-state layout is still mandatory, but
need not come from the current stack's expiry. After the full three-state performance
sample passes, the bounded harness correction may advance the current clocks one tick
at a time and, if they reach zero together, resume the same fixed-seed QA-frozen
autoplay until a genuine single timed effect is visible. Capture that real UI within a
finite bound or fail closed. State injection, timer rewriting, seed/product changes,
synthetic pixels, threshold relaxation, and reuse of the failed run are forbidden.

**Lifecycle-sampling correction (2026-07-29):** the corrected one-state proof passed
in the next formal run, which then failed closed because restart was sampled before its
two intentional nested focus rAF callbacks had drained. The harness may not waive
pending-frame equality. Instead it must sample every active-game lifecycle checkpoint
after the same two real rAF boundaries, then compare exact pending-frame, listener,
Canvas and audio-context values. Home/unmount must still equal the original baseline.
This changes only evidence sampling time; product source and lifecycle behavior remain
frozen unless the stabilized exact checks prove a real leak.

## 重启恢复边界（2026-07-29）

本节是电脑重启后继续 Phase 5 的直接执行合同。若历史描述与本节冲突，以
`AGENTS.md`、`docs/CURRENT_TASK.md` 和本节中更严格的约束为准。

### 1. 精确状态与已冻结基线

| 边界 | 精确提交 / 状态 | 含义 |
| --- | --- | --- |
| 产品源码 | `ee2aac542529c116c915c38e0603584a7099b5e8` | Core、Runtime、Renderer、UI、CSS、localization 均冻结 |
| 最终源码门禁 | `6d9fc6ae00099e3a1eb27240bd3c369216f3b007` | typecheck PASS；26 文件 / 225 测试 PASS；753 modules build PASS |
| 正式 evidence harness | `e30a8d72aa5fa934fdea79db4223cab9ef0a0386` | 保留真实单状态 fallback；主动生命周期检查统一到两个真实 rAF 后的稳定边界 |
| 浏览器静态放行记录 | `0adb29631960ac9d128ec6498ff9a4ca9dd7a8d2` | 两路独立审计 P0–P3 = 0，只放行一次正式批次 |
| 资源合同基线 | `57f3662506cb014dff73fbca81bac3b9ff54e1fc` | 串行执行、禁用 WMI/CIM、加强浏览器准入 |
| 正式浏览器产物 | **不存在** | 先前失败均 fail-closed；不得称为已有证据 |
| Phase 5 | **OPEN / UNACCEPTED / UNPUSHED** | Phase 6 与 Puzzle 50 仍关闭 |

重启不会授权重新设计、重跑源码门禁或修改产品。除非新的正式浏览器证据直接
证明产品缺陷，否则 `src/**`、依赖、配置、规则、VFX 和 UI 均不得编辑。若必须
重开产品源码，先停止、更新合同、创建独立 source checkpoint，并在最后一次
源码改动后重新运行完整门禁和正式浏览器批次；不得沿用当前 gate/browser 结论。

### 2. 允许范围

重启后的首个执行片只允许：

1. 只读核对 Git、上述五个提交、证据目录和资源基线；
2. 先按上述边界修正并静态审计 evidence harness；在全部资源准入条件通过后，
   运行一次新提交的 `docs/qa/evidence/t15-phase5/capture_phase5.py`；
3. 校验并人工检查该批次生成的 PNG、Vite 日志、browser manifest 和校验和；
4. 按 `browser-raw`、`browser-index` 两个独立 checkpoint 精确提交；
5. 依次进行 rules、visual、evidence 三个只读 QA，并分别记录 verdict；
6. 写 acceptance / changelog，清理资源，non-force push `main`，然后暂停。

允许写入的路径仅限正式 evidence 输出、对应 QA verdict、Phase-5
workstream/contract/changelog 和最终 acceptance 文档。临时 contact sheet、
浏览器 profile、控制日志和诊断输出只能放在 `%TEMP%`，不得提交。

### 3. 明确禁止

- 不开始 Phase 6，不实现 Puzzle 50，不修改解谜选关页面。
- 不修改冻结的产品源码、测试、依赖或 lockfile。
- 不重跑 typecheck、完整测试或 build；当前源码未变时，
  `6d9fc6a` 仍是唯一最终门禁。只有产品源码改变才整体重跑。
- 不并行启动 sub-agent、浏览器、Vite、测试、build、诊断或截图流程。
- 不启动 Serena、MCP、language server 或额外浏览器 helper，除非当前唯一动作
  明确需要；动作结束立即释放。
- 不调用 WMI/CIM、`wmic`、`Get-WmiObject` 或 `Get-CimInstance` 做进程或资源
  轮询。不得结束 Defender、WMI/Windows 服务、Codex app-server、用户控制窗口
  或仅凭进程名猜测归属的进程。
- 不使用 `git add .`、`git add -A`、wildcard staging、squash、rebase、
  force-push、history rewrite 或跨 checkpoint 混合提交。
- 不把 `.partial-*`、失败批次、临时截图或缺少最终校验和的目录发布为证据。

### 4. 资源与协作准则

- 协调者始终是唯一执行者。正式 capture 与 PNG 人工检查期间不使用 sub-agent。
- 最终独立 QA 必须串行：同时最多一个 agent；禁止 agent 再派生子 agent；该
  agent 只读，不得启动浏览器、server、测试、build、MCP、Serena 或 WMI。
  一个 verdict 完成且资源复核为零后，才允许开始下一个。
- 重型树数量恒为 0 或 1。正式 capture 自行拥有且只拥有一个 Python runner、
  一个 Vite/Node 树和一个 Chrome 树；不得附着既有端口服务。
- 不再使用固定八次 CPU 样本。每个重型动作启动前只取一次轻量 PDH 当前快照，
  并建立一个资源租约，写清 owner、用途、命令、预期 PID/子树、端口、临时路径、
  完成条件和回收检查。只有前一个租约完全释放后才能创建下一个。正常准入仍要求
  当前 CPU 有充足余量（通常低于 60%）、可用物理内存至少 6 GiB、committed
  memory 不高于 75%、disk queue 不高于 1.0；不得通过连续轮询等待一个偶然
  低值。资源紧张时先释放闲置项并等待，再做一次新的单点快照。
- 准入前还必须为：4178/5178/5179 无 listener、无 `capture_phase5.py`
  runner、无 Phase-5 Chrome/Vite、无外部控制日志、无 `.partial-*`、无已发布
  browser artifact。
- 若总 CPU 持续达到 90%，停止准入，仅清理命令行、父子关系、启动时间和端口
  都能证明属于本项目的进程。安全/系统服务与共享 Codex 进程不属于清理目标。
- 已释放的历史浪费包括 Serena/TypeScript server、8 个 MCP bridge 和 22 个
  重复 `personal-web` preview Node。Codex 固定 `node_repl` 池会自动补位，
  不得反复终止制造重启抖动。2026-07-29 重启后又释放了两套自动启动的
  Serena/TypeScript 树和三组 MCP bridge，共 24 个进程、约 1.2 GiB 工作集；
  它们未获得 Phase-5 租约，因此不得常驻。

### 5. 重启后的唯一恢复顺序

1. 完整读取 `AGENTS.md`、`docs/DESIGN.md`、`docs/CURRENT_TASK.md`、本文件、
   `docs/COMMIT_POLICY.md` 和最新 `docs/logs/CHANGELOG.md`。
2. 只读核对 `main`、HEAD、`origin/main`、`git status --short`；工作树必须
   干净。确认当前产品路径相对 `ee2aac5` 无差异、gate 文件相对 `6d9fc6a`
   无差异、harness 相对 `07e7a55` 无差异。
3. 用 `Get-Process`、native process API、`netstat` 和 PDH 检查资源；禁止 WMI。
   任一准入条件不满足就等待，不启动 capture。
4. 条件全部满足后，只运行一次正式 harness。runner 必须隐藏启动、重定向
   stdout/stderr 到 `%TEMP%`，并由协调者串行轮询；不得同时跑其他命令。
5. 成功后先验证：正式 JSON `errors=[]`、硬件 GPU 非软件 backend、性能阈值、
   FIFO、Collapse、生命周期、34 个唯一 PNG/hash、artifact set 和
   `SHA256SUMS.txt` 全部一致；失败则不得发布任何 partial 内容。
6. 在 `%TEMP%` 生成带标签 contact sheet，并逐张检查全部 34 个 PNG。重点单独
   查看四种灰阶 Next、四种普通/四种 reduced activation、Collapse settlement、
   1/2/3 状态、桌面/竖屏/横屏/英文。检查 `冰冻` 文案、无全宽坍缩条、附件可辨、
   无裁切/溢出、始终只有一个 gameplay Canvas。
7. 先精确提交 34 PNG 与两份 Vite raw log；再单独提交 browser manifest 与
   checksum。两个 checkpoint 均不得包含产品或验收文档。
8. 串行完成三份独立 QA。只修复确证的 P0–P2；若修复触及产品源码，当前
   gate/browser 证据作废并回到第 2 步重新建立。
9. 三份 QA 全部接受后，再更新 `docs/CURRENT_TASK.md`、`docs/DESIGN.md`、
   `docs/logs/CHANGELOG.md`、本文件和 workstream log，提交 acceptance。
10. 非强制 push `main`，验证本地 HEAD 等于 `origin/main`；清理控制日志、
    contact sheet、Chrome/Vite/Python、已知端口和 partial 目录；确认工作树干净。
    Phase 5 完整接受并推送后立即暂停。

### 6. Fail-closed 停止条件

遇到以下任一情况必须停止当前批次、清理本项目资源、记录事实，不得通过降阈值
或伪造状态继续：

- Git/source/gate/harness 漂移或工作树不干净；
- 资源准入不通过或运行中出现持续 90% CPU；
- GPU 为 SwiftShader、llvmpipe、lavapipe、softpipe、WARP、Basic Render 或
  其他软件 backend；
- rAF / Renderer 阈值、FIFO、Collapse、生命周期或 one-canvas 断言失败；
- PNG 数量、名称、hash、capture binding、manifest、checksum 或文件集合不一致；
- 34 张图任一未人工检查，或观察到不可辨识附件、全宽坍缩条、裁切、溢出、
  错误文案、空白画面、第二 Canvas、console/page error；
- 独立 QA 尚有 P0–P2，或任何结论只基于旧候选。

## 目标

把冰冻、坍缩、炸弹、倍增设计成附着在普通方块上的效果，而不是四类固定形状。
任意 I/O/T/S/Z/J/L 都可携带任一道具；棋盘、活动方块和 Next 必须用同一套
“普通主体 + 道具附件”语言，并在多道具同时触发时不丢失反馈。面向玩家的中文
名称统一使用 **冰冻**，不再显示“冻结”；为避免破坏存档和确定性协议，内部
`freeze` 标识及英文 `Freeze` 可保留。

## 必须实现

1. 保留全部 7 × 4 = 28 组合，且 Next 精确预示下一块实际携带的附件，不消费
   RNG。任一画面都必须同时回答“是否携带”和“携带哪一种”。
2. 冰冻、坍缩、倍增重触发时把各自剩余时间**重置为 10 秒**；多个计时状态可
   并存。炸弹是一次性视觉冲击，不占用状态说明。
3. **冰冻规则：**持续 10 秒；活动方块不会停住，而是把自动重力固定为
   **1 秒/格（60 个 60 Hz tick）**。玩家主动移动、旋转、软降和硬降仍可用；
   到期后恢复异变模式当时的正常速度。冰冻覆盖 Phase 5 的普通 0.1 秒/格速度
   下限，而不是把它改成另一个全局上限。
4. 冰冻使用冰晶核心、破霜边缘和全场结霜；坍缩使用高重力核心、纵向压迫和列
   下沉；炸弹使用警示核心、冲击、震波和碎片；倍增使用星核、金色能量与全场
   发光，2× 可升 4×。
   坍缩不得再绘制横跨十列的整行长条，棋盘顶部也不得出现同类长条。触发时只在
   实际受影响列建立局部重力井、纵向压缩、向下流动的细粒子和边缘折射；列落定
   后以短促沉降波结束，不制造一个像新方块或 UI 条的水平实体。
5. 四类附件不能只换颜色：核心轮廓、表面纹理、边缘形态、静态符号和局部动效
   至少有三项不同。普通方块主体色与轮廓始终可读，附件不得把一整块替换成
   “道具专属方块”。活动、锁定和 Next 使用相同识别语法。
6. 同一 Core transition 的多个触发进入 FIFO，短效依次完整播放，不能覆盖丢失。
7. Collapse 计算使用数组索引/复用数据，避免字符串坐标和临时集合造成卡顿。
8. 非冰冻状态下 Mutation 最快下落为 0.1 秒/格（6 个 60 Hz tick），不影响
   其他模式。
9. 状态栏在无效果时紧凑，激活时显示身份、剩余时间和进度；视觉本身应足以表达
   Bomb，去掉冗余炸弹说明。
10. 特效在普通和 reduced-motion 下都有高对比终态，并遵守对象池/粒子/平面
    预算。色弱或灰阶状态仍能通过轮廓、纹理和符号分辨四类附件。

## 基线误差审计（`fae3c96`）

三路审计确认可保留的基础是 7 × 4 附件交叉、无副作用 immediate-Next 预测、
三个独立计时字段、2×→4×、一次性 Bomb、Renderer FIFO、120 槽粒子池与两个
复用 filter。下列误差必须由本阶段修复：

1. 附件抽取错误地复用普通七袋 `randomizer`，未实现合同要求的独立确定性流。
2. 冰冻仍把每 tick 的 `gravityTicks` 清零并完全停住自动重力；现有测试也固化
   了旧规则。必须改成 59 tick 不落、第 60 tick 恰落一格，并在到期后恢复当时
   的 Mutation cadence。
3. Collapse Core 虽已使用数组索引，但棋盘与 carrier metadata 重复扫描，并
   每次分配新的映射/集合；需要共享一次逐列压实结果并补专项性能证据。
4. Collapse 的持续态仍有约 98% 棋盘宽的顶部条与约 96% 的底部条，触发态另有
   约 95% 的横带和固定全局 lanes；filter、粒子和沉降也未绑定实际移动列。
5. Bomb fragments 在 warning 阶段提前出现；Multiplier 十秒持续态和
   reduced-motion 终态不能区分 2× / 4×。
6. 运行中切换 reduced-motion 会清空尚未播放的 Mutation FIFO，造成反馈丢失。
7. 中文仍显示“冻结”，规则仍写“停落”；空闲状态卡仍保留三条占位；
   Mutation Next 的 ARIA 只报告主体形状、不报告附件；同一 transition 的多个
   live-region 事件只播报最后一个。

## 已冻结 writer 路径与检查点

1. **Core RNG / Ice / direct semantics**
   - `src/game/core/constants.ts`
   - `src/game/core/types.ts`
   - `src/game/core/engine.ts`
   - `src/game/core/sprint.test.ts`
2. **Core Collapse shared mapping / performance**
   - `src/game/core/sprint.ts`
   - `src/game/core/mutation.ts`
   - `src/game/core/engine.ts`
   - `src/game/core/sprint.test.ts`
3. **Runtime FIFO handoff proof**
   - `src/game/runtime/GameRuntime.test.ts`
4. **Renderer carrier / timeline / actual-column VFX**
   - `src/game/render/TetrisRenderer.ts`
   - `src/game/render/TetrisRenderer.test.ts`
   - `src/animation/mutationTimeline.ts`
   - `src/animation/mutationTimeline.test.ts`
   - 仅当现有 token 无法表达最终节奏时，才加入
     `src/design/mutationTokens.ts` 与其直接测试。
5. **UI semantics / localization**
   - `src/App.tsx`
   - `src/App.test.ts`
   - `src/ui/localization.ts`
6. **UI responsive status layout**
   - `src/styles/mutation-vfx.css`
   - `src/styles/hud.css`
   - `src/styles/hud.test.ts`
7. **Final evidence observability**
   - `src/game/render/TetrisRenderer.ts`
   - `src/game/render/TetrisRenderer.test.ts`
   - `src/game/runtime/GameRuntime.ts`
   - `src/game/runtime/GameRuntime.test.ts`
   - `docs/qa/evidence/t15-phase5/capture_phase5.py`
   - root `.gitattributes`, limited to LF/binary rules for
     `docs/qa/evidence/t15-phase5/*`

同一 Core writer 串行完成前两个共享 `engine.ts` / `sprint.test.ts` 检查点；
Renderer 等 Core 接口稳定后再开始；UI 等 Core 和 Renderer 的 Next/计时接口
稳定后再开始。任何后一 writer 遇到前一检查点未提交的共享路径都必须停止。

## 分段团队

- `t15_mutation_core_writer`：附件状态、无副作用 Next 预测、FIFO、冰冻 1 秒/格、
  非冰冻 0.1 秒下限、Collapse 性能和 28 组合测试。
- `t15_mutation_vfx_writer`：Renderer 附件、全场状态、Bomb 时间线、对象池。
- `t15_mutation_ui_writer`：状态卡、计时和 Next/ARIA。
- `t15_mutation_rules_qa`：规则、RNG、重触发、并发状态和生命周期。
- `t15_mutation_visual_qa`：28 组合抽样、四状态、Next 一致性和 reduced motion。
- `t15_mutation_evidence_qa`：候选 SHA、截图、性能和事件队列证据完整性。

Core/性能、VFX、UI 必须分别提交和可回退；后一 writer 不覆盖前一 writer 未验收
的共享路径。

### 剩余动态证据检查点

Phase 5 不以一个大 evidence commit 收口。最终动态阶段按以下顺序保留独立回退点：

1. `gates`：最终 typecheck、完整测试、build 原始日志及 source-bound gate manifest；
2. `browser-raw`：受管 Vite 日志与完整 PNG 批次，不含验收结论；
3. `browser-index`：JSON manifest 与 SHA256SUMS 完成标记；
4. `qa-rules`、`qa-visual`、`qa-evidence`：三份独立只读结论分别记录；
5. 每一修正、重跑证据、复审各自提交；
6. `acceptance`：协调者状态/changelog；随后清理资源并执行 non-force push。

以上检查点不得 squash。Phase 5 push 后立即暂停，不获取 Phase 6 writer 路径。

## 验收

直接测试覆盖 28 组合、Next 预测等于实际生成、多事件不丢、10 秒重置、2×→4×、
炸弹顺序、冰冻生效前 59 tick 不落/第 60 tick 下落一格、冰冻到期恢复速度、
主动软硬降不受禁用、非冰冻 0.1 秒下限、Collapse 正确性与性能。浏览器证据覆盖
四种附件在活动/锁定/Next 三种状态中的识别、四种激活效果、并发状态、灰阶检查、
桌面/紧凑/reduced motion；首次观察 100 ms 内可判断附件身份，60 FPS 预算内，
无对象、音效、ticker、Canvas 或 listener 泄漏。像素/几何审计还必须证明坍缩
帧中不存在覆盖 80% 以上棋盘宽度的连续水平状态条，顶部没有第二条伪方块带，
效果位置与实际下沉列一致。
