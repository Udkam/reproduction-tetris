# Phase 5：Mutation 附着道具与高冲击反馈

## 状态

待 Phase 4 验收并推送后开始。已有 T14 实现是审计基线，不因“已有特效”而直接
视为本阶段通过。

## 目标

把 Freeze、Collapse、Bomb、Multiplier 设计成附着在普通方块上的效果，而不是
四类固定形状。任意 I/O/T/S/Z/J/L 都可携带任一道具；棋盘、活动方块和 Next
必须用同一套“普通主体 + 道具附件”语言，并在多道具同时触发时不丢失反馈。

## 必须实现

1. 保留全部 7×4=28 组合，且 Next 精确预示下一块实际携带的附件，不消费 RNG。
2. Freeze、Collapse、Multiplier 重触发时把各自剩余时间刷新为 10 秒；多个计时
   状态可并存。Bomb 是一次性视觉冲击，不占用状态说明。
3. Freeze：清晰冰晶附件和全场结霜；Collapse：高重力附件、纵向压迫和列下沉；
   Bomb：预警→冲击→震波→碎片；Multiplier：金色能量与全场发光，2× 可升 4×。
4. 同一 Core transition 的多个触发进入 FIFO，短效依次完整播放，不能覆盖丢失。
5. Collapse 计算使用数组索引/复用数据，避免字符串坐标和临时集合造成卡顿。
6. Mutation 最快下落为 0.1 秒/格（6 个 60 Hz tick），不影响其他模式。
7. 状态栏在无效果时紧凑，激活时显示身份、剩余时间和进度；视觉本身应足以表达
   Bomb，去掉冗余炸弹说明。
8. 特效在普通和 reduced-motion 下都有高对比终态，并遵守对象池/粒子/平面预算。

## 分段团队

- `t15_mutation_core_writer`：附件状态、无副作用 Next 预测、FIFO、0.1 秒下限、
  Collapse 性能和 28 组合测试。
- `t15_mutation_vfx_writer`：Renderer 附件、全场状态、Bomb 时间线、对象池。
- `t15_mutation_ui_writer`：状态卡、计时和 Next/ARIA。
- `t15_mutation_rules_qa`：规则、RNG、重触发、并发状态和生命周期。
- `t15_mutation_visual_qa`：28 组合抽样、四状态、Next 一致性和 reduced motion。
- `t15_mutation_evidence_qa`：候选 SHA、截图、性能和事件队列证据完整性。

Core/性能、VFX、UI 必须分别提交和可回退；后一 writer 不覆盖前一 writer 未验收
的共享路径。

## 验收

直接测试覆盖 28 组合、Next 预测等于实际生成、多事件不丢、10 秒刷新、2×→4×、
Bomb 顺序、0.1 秒下限、Collapse 正确性与性能。浏览器证据覆盖四种携带方块、
四种激活效果、并发状态、桌面/紧凑/reduced motion；60 FPS 预算内，无对象、
音效、ticker、Canvas 或 listener 泄漏。
