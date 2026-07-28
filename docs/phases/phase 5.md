# Phase 5：Mutation 附着道具、强识别与高冲击反馈

## 状态

**Core 候选已完成，等待 exact-head 双重独立复验。** Phase 4 验收/恢复记录 `fd7ef8d`
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
修正后 exact product head `f2d51ca` 尚需两份新独立结论。下列精确路径与
检查点顺序继续约束其余实现，Renderer 在 Core 双重接受前不开放。

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

## 验收

直接测试覆盖 28 组合、Next 预测等于实际生成、多事件不丢、10 秒重置、2×→4×、
炸弹顺序、冰冻生效前 59 tick 不落/第 60 tick 下落一格、冰冻到期恢复速度、
主动软硬降不受禁用、非冰冻 0.1 秒下限、Collapse 正确性与性能。浏览器证据覆盖
四种附件在活动/锁定/Next 三种状态中的识别、四种激活效果、并发状态、灰阶检查、
桌面/紧凑/reduced motion；首次观察 100 ms 内可判断附件身份，60 FPS 预算内，
无对象、音效、ticker、Canvas 或 listener 泄漏。像素/几何审计还必须证明坍缩
帧中不存在覆盖 80% 以上棋盘宽度的连续水平状态条，顶部没有第二条伪方块带，
效果位置与实际下沉列一致。
