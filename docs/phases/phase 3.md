# Phase 3：主 HUD 与游戏布局

## 状态

待 Phase 2 验收并推送后开始。不得提前取得 `App.tsx`、`App.test.ts` 或
`styles.css` 的写权限。

## 目标

让唯一 Pixi 棋盘成为视觉中心，使顶部栏、数值信息、状态区和 Next 与棋盘形成
同一套清晰层级。消除重复卡片和对不齐的分栏，同时保留键盘、触控、紧凑屏幕、
倒计时和模式专属信息。

## 必须实现

1. 3→2→1 数字与蒙版稳定可见；普通和 reduced-motion 状态都不能丢失语义。
2. 棋盘、统计、Next 的几何对齐不随模式内容跳动；方块出生区不得溢出棋盘。
3. Classic/Mutation 的 `下落速度/格`、Puzzle 的 `操作数` 与原有方块进度使用
   一致但有区分的数值层级。
4. 普通模式 Next 显示一个；Puzzle 在同一个普通深色 Next 框内分两行显示两个，
   左侧使用清晰的 JetBrains Mono `1`、`2`。
5. 右栏不再重复键盘说明；设置是完整键盘参考的唯一位置。
6. 保持一个 Canvas、零 DOM 方格、现有深色棋盘、触控手势和可访问名称。

## 排除

- 不改变任一模式 Core 规则、分数、随机序列、记录排序或 Puzzle 选关页。
- 不借 HUD 阶段重做 Mutation/Survival 材质；其专属表现留给 Phase 4/5。

## 协作团队与检查点

- writer：`t15_hud_writer`。
- 规则/可访问性 QA：`t15_hud_rules_qa`。
- 视觉/几何 QA：`t15_hud_visual_qa`。
- 检查点：DOM 语义 → Renderer/Canvas 几何 → 样式与响应式 → 候选证据 →
  双 QA → 修正 → 验收推送。

## 验收

四模式在桌面、竖屏、短横屏、reduced motion 下均无溢出、遮挡和几何跳变；
倒计时、统计和 Next 可读；出生方块完整位于棋盘；触控命中安全；一个 Canvas、
零 DOM 方格、零控制台错误。
