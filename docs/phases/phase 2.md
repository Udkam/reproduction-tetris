# Phase 2：紧凑 Settings 控制台

## 状态与基线

- 状态：候选 `26e4db3` 已通过三方独立复审；验收记录 `092c91d` 已推送。
- 回退基线：`fd26652`。
- 合同提交：`590e2bf`。
- 禁止修改 Puzzle 选关页构图。

## 目标

把 Settings 重排为一块自然高度、紧凑、双语、可键盘完整操作的连接控制台。
信息和 DOM 顺序固定为：**控制 → 键盘 → 规则 → 记录**。不同模式只渲染真实
内容，不使用等高拉伸、空占位、微型字号或预留五行空榜来“填满”。

## 必须实现

1. Controls 保留语言、音效、0–100% 音量、重开和继续，不恢复音乐。
2. Keyboard 先玩法、后快捷键，每组两列；Puzzle 单独增加 `Z`。
3. Rules 改为带稳定 ID 的结构化事实；Classic 三项，其他模式四项。
4. Records 位于最后：普通模式只显示实际 0–5 条；Survival 只显示时间、消行、
   日期；Puzzle 只显示当前关最少操作数或尚未通关。
5. Settings/Exit 在 3→2→1 中打开时冻结当前数字、Core ready 和输入；最后一个
   窗口关闭后继续同一数字，且 runtime 只 start 一次。
6. Settings 方向键按显式行列几何移动，Enter 执行；range 保留原生方向键。
7. 英文结果排行榜必须收到当前语言，不能回退中文。
8. 桌面最大宽度约 800 px，内容自然高；短横屏滚动，不缩小到 12 px 正文和
   44 px 命中区以下。

## 协作团队

- writer：协调者作为 `t15_settings_writer`，独占 `App.tsx`、`App.test.ts`、
  `localization.ts`、Settings CSS 和 ActionSheet 的坐标导航分支。
- 规则 QA：`t15_settings_rules_qa`。
- 视觉 QA：`t15_settings_visual_qa`。
- 证据 QA：`t15_settings_evidence_qa`。
- 预审映射智能体只读，不获得写权限。

## 可回退检查点

1. `behavior-content`：倒计时生命周期、坐标导航、结构化规则、英文结果及测试。
2. `layout-style`：单一权威 Settings CSS 和几何合同测试。
3. `candidate/evidence`：冻结 SHA 后运行最终门禁和多视口浏览器矩阵。
4. `correction-*`：发现返回对应检查点，不与 Phase 3 混合。
5. `acceptance/push`：三方接受后记录、释放资源并推送。

## 验收

覆盖四模式、两语言、空/满记录、Puzzle 已/未通关、1440×900、390×844、
844×390、1056×480 和 reduced motion。断言无结构性尾部空白、无 tiny type、
无横向溢出、同一 Canvas 可见且被压暗、活动窗口焦点正确、零页面/控制台错误。

## 2026-07-28 验收结果

- 行为/内容源：`cc35738`；布局源：`2f94d16`；portrait 修正候选：
  `26e4db39dba1a0e43bd66d4bd4c48a0997bef40c`。
- 最终门禁通过：typecheck、25 个测试文件 / 190 项测试、752-module build。
- 候选绑定的生产浏览器矩阵包含 11 个主场景及 3 个滚动到底补充帧；同一
  Canvas 在窗口打开前、中、后保持身份一致，Canvas 数为 1，DOM 方格为 0，
  窗口蒙版可恢复，零页面/控制台错误。
- 390 × 844 portrait 弹窗左右各约 16.9 px 安全余量；短视口底部内容可达，
  最小文字 12 px、按钮 44 px。
- 规则、视觉和证据完整性智能体均 ACCEPT，无 P0–P2。证据智能体独立重算
  manifest 24/24 个文件的字节数与 SHA-256，全部匹配。
- 非阻断维护债务：不可达的旧 `.settings-sheet` CSS 仍在源码中；活动 DOM
  零引用。历史 `2f94d16` 超过默认 500 行检查点预算，作为流程 P3 记录，
  不改写历史。
