# Phase 1：TetraMorph Design System v1.0

> 状态：已验收并推送。产品源码候选为 `99e5a0f`，阶段恢复点为
> `fcd612e`。本文件保留最初的 Phase 1 产品意图；已执行的精确边界、修正和
> 证据以 `docs/CURRENT_TASK.md`、`docs/DESIGN.md` 与工作流日志为准。

解谜选关界面不在本阶段修改。

## 执行团队与可回退检查点

- writer：协调者作为 `t15_phase1_writer`。
- 规则/Token QA：`t14_readonly_qa`。
- 字体/视觉差异 QA：`phase1_visual_delta`。
- 检查点：Token 与颜色桥接 → 本地字体和依赖锁 → 字体族修正 → 候选证据 →
  双 QA → 协调者验收与推送。
- Phase 1 只建立基础，不以它代替 Settings、HUD 或模式专属阶段的可见验收。

重新确认一下后续策略：

- **不做全面重构**
- **不一次性修改所有系统**
- 按“大厂产品迭代流程”推进：
  1. 视觉系统基础（字体、颜色、间距、组件规范）
  2. 设置面板
  3. 游戏主 HUD / 布局
  4. 生存模式设计
  5. 异变模式表现
  6. 经典模式微调

每一步完成后截图验收，再进入下一阶段。

------

# 原始目标：建立 TetraMorph Design System

原因：

目前很多问题其实不是单独页面问题，而是设计 Token 不统一。

例如：

- 不同页面圆角不同；
- 字号层级混乱；
- 边框强弱不一致；
- 卡片密度不统一；
- 模式颜色没有统一约束。

如果直接改设置面板，后续还会返工。

------

# Phase 1 目标

建立：

```
TetraMorph Design System v1.0
```

不改变布局。

只统一：

- 字体
- 颜色
- 尺寸
- 卡片
- 按钮
- 状态显示

------

# 1. 字体规范

## 当前问题

你的字体风格整体偏干净，但存在：

- 中文依赖浏览器默认字体；
- 数字和中文视觉重量接近；
- 分数区域缺少游戏感。

## 修改方案

### 品牌

保持：

```
Playwrite NZ Basic
```

仅用于：

```
TetraMorph
```

不要用于任何 UI。

------

### 英文 UI

统一：

```
Space Grotesk
```

用途：

- Classic
- Survival
- Mutation
- Puzzle
- Next
- Score

权重：

```
500
600
700
```

------

### 数字

统一：

```
JetBrains Mono
```

用途：

- 分数
- 时间
- 行数
- 倒计时

例如：

现在：

```
326
```

未来：

```
326
```

但视觉重量更强。

------

### 中文

新增：

优先：

```
Noto Sans SC
```

Fallback：

```
PingFang SC,
Microsoft YaHei
```

------

# 2. 字号体系

建立：

```ts
Typography
```

不要每个页面自己写。

规范：

## Display

模式标题：

```
28px
700
```

例如：

```
TetraMorph 经典
```

------

## Heading

弹窗标题：

```
24px
700
```

例如：

```
设置
```

------

## Card Title

卡片标题：

```
14px
600
```

例如：

```
分数
```

------

## Value

核心数字：

```
24px
700
```

例如：

```
12580
```

------

## Body

普通文本：

```
14px
500
```

------

## Caption

辅助：

```
12px
500
```

------

# 3. 颜色系统

建立：

```
src/design/tokens/colors.ts
```

------

## Base

Background:

```
#DCE7F1
```

Surface:

```
#F8FAFC
```

Surface Secondary:

```
#EDF3F7
```

Border:

```
#C4D4DF
```

Text Primary:

```
#102A43
```

Text Secondary:

```
#627D98
```

------

## Game Board

保持你的深色棋盘：

```
#071522
```

不要改。

这是目前游戏最稳定的视觉资产。

------

# 4. 模式颜色

不要修改规则。

只统一。

## Classic

当前青色方向：

```
#31978D
```

用途：

- 图标
- 当前状态
- 按钮

------

## Survival

蓝色：

```
#5878C4
```

------

## Mutation

橙色：

```
#C77A35
```

------

## Puzzle

紫色：

```
#8A63B3
```

------

# 5. Card System

目前最大问题：

卡片太多。

建立三级：

## Level 1

页面容器

例如：

游戏大白框。

属性：

```
radius:16
border:1px
```

------

## Level 2

功能卡

例如：

分数卡。

属性：

```
radius:10
padding:16
```

------

## Level 3

内部状态

例如：

进度条。

属性：

```
radius:6
```

禁止：

四层嵌套。

------

# 6. Button System

统一：

## Primary Button

例如：

继续游戏

```
height:40

radius:8

font-size:14

weight:600
```

------

## Secondary Button

例如：

重新开始

透明背景：

```
border 1px
```

------

## Icon Button

设置按钮：

```
36x36
radius:8
```

------

# 7. Animation Token

不要马上加大量动画。

先统一。

建立：

```
animationTokens.ts
```

规范：

Hover：

```
120ms
ease-out
```

Click：

```
80ms
```

Modal：

```
220ms
```

Page transition：

```
300ms
```

------

# Phase 1 验收标准

完成后：

## 不应该出现：

❌ 新功能

❌ 新页面

❌ 新动画

只应该看到：

✅ 字体统一

✅ 数字更像游戏

✅ 卡片层级统一

✅ 颜色统一

✅ UI 更轻

------

# 给 Codex 的执行 Prompt（Phase 1）

```md
# TetraMorph Design System Phase 1

你现在负责建立项目统一设计系统。

不要修改任何玩法。

不要修改页面布局。

不要增加新组件。

目标：

统一 Typography / Color / Card / Button / Animation Tokens。


任务：

1.
创建：

src/design/tokens/


包含：

colors.ts

typography.ts

spacing.ts

radius.ts

animation.ts


2.

替换项目中散落的：

颜色值

字号

圆角

间距


3.

建立：

Noto Sans SC

Space Grotesk

JetBrains Mono

字体规范。


4.

保持：

棋盘颜色

方块材质

现有游戏逻辑


5.

完成后输出：

- 修改文件列表
- Token 表
- 截图对比
- 是否影响测试


禁止：

重新设计 UI。

禁止：

增加功能。

这是 Design System 基础阶段。
```

------

Phase 1 已完成。后续消费这些 Token 的可见重排分别由 Phase 2（设置）和
Phase 3（HUD）负责，不能以 Phase 1 已完成为理由跳过各自的视觉验收。
