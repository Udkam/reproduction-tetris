# Phase 1.5：Modal Compositor 完整性

## 状态与恢复点

- 状态：已验收并推送。
- 源码候选：`5ab9e7d`。
- 协调者验收：`6b1b76f`。
- 进入 Phase 2 的远端恢复基线：`fd26652`。

## 目标

所有 Pause、Settings、Restart、Exit 和 Puzzle 结果窗口都必须真实位于完整游戏
画面之上。唯一 Pixi Canvas 保持挂载、可见并被蒙版压暗，但绝不能穿透或盖住
窗口；窗口切换和关闭后，焦点回到正确的后继窗口或同一 Canvas。

## 范围与排除

- 仅允许修正 modal 堆叠、焦点交接及其直接测试。
- 不改 Core、Renderer 场景、玩法、记录、音频、Puzzle 选关页和面板内容布局。
- playing 来源最终回到同一 Canvas；paused 来源最终回到唯一 Pause 窗口。

## 协作团队

- writer：协调者作为 `t15_modal_writer`。
- 规则/焦点预审：`t15_modal_rules_preaudit`。
- 目标/像素审计：`t15_modal_target`。
- 证据完整性审计：`t15_modal_evidence_integrity`。

## 分段检查点

1. CSS 和直接测试；
2. 后继窗口焦点仲裁；
3. Settings → Restart → Cancel 的来源态修正；
4. 20 个浏览器状态与 18 个像素状态证据；
5. 三方验收、资源释放和推送。

## 验收结果

一个 Canvas、零 DOM 棋盘格、无溢出/控制台错误；所有活动窗口持有焦点，窗口
内容不被 Canvas 覆盖，最终焦点与 playing/paused 来源一致。该结果是 Phase 2
必须保持的冻结基线。
