# T15 分阶段目标索引

本目录把 T15 总目标拆成可执行、可比较审计、可独立回退的阶段。它不是第二
套状态登记表：

- `docs/CURRENT_TASK.md` 是当前执行事实与精确产品合同；
- `docs/DESIGN.md` 是视觉和交互设计约束；
- `docs/workstreams/tetris-t15-coordinator/PHASE_MATRIX.md` 是人员、SHA 与状态登记；
- 本目录中的文件说明每个 Phase 为什么做、做什么、不做什么、由谁验收；
- 每个 Phase 的 `THREAD_LOG.md` 保存实际命令、证据、发现、修正和恢复点。

若文件之间出现冲突，以用户最新指令和 `docs/CURRENT_TASK.md` 的较新合同为准，
协调者必须先修正文档，再允许产品源码继续。

## 总体顺序

| Phase | 目标文档 | 当前状态 | 写入团队 | 独立比较审计 |
| --- | --- | --- | --- | --- |
| 1 | [Design System](<phase 1.md>) | 已推送 | `t15_phase1_writer` | 规则 QA + 视觉 QA |
| 1.5 | [Modal Compositor](<phase 1.5.md>) | 已推送 | `t15_modal_writer` | 规则 QA + 视觉 QA + 证据 QA |
| 2 | [Settings](<phase 2.md>) | 已推送 | `t15_settings_writer` | 规则 QA + 视觉 QA + 证据 QA |
| 3 | [HUD](<phase 3.md>) | 合同冻结 / 待实施 | `t15_hud_writer` | 规则 QA + 视觉 QA |
| 4 | [Survival](<phase 4.md>) | 待执行 | Core → Render → UI 三个顺序 writer | 规则 QA + 视觉 QA |
| 5 | [Mutation](<phase 5.md>) | 待执行；冰冻规则已补充 | Core/性能 → VFX → UI 三个顺序 writer | 规则 QA + 视觉 QA + 性能/证据 QA |
| 6 | [Classic](<phase 6.md>) | 待执行 | `t15_classic_writer` | 规则 QA + 视觉 QA |
| 7 | [Puzzle 50](<phase 7.md>) | 待执行 | Schema → 五批关卡 → Progress/UI | 求解/规则 QA + 视觉 QA + 证据 QA |
| 8 | [Integration](<phase 8.md>) | 待执行 | 协调者 | 总体规则 QA + 总体视觉 QA + 证据 QA |

## 每阶段不可跳过的状态机

1. `contract`：先冻结目标、排除项、精确路径、团队和回退基线，只提交文档。
2. `source-*`：一个 commit 只交付一个可验证声明；共享路径一次仅一个 writer。
3. `candidate`：停止写入，生成不可变候选 SHA。
4. `evidence`：从该 SHA 的干净构建产生测试、截图、几何和性能证据。
5. `qa-rules`、`qa-visual`、`qa-evidence`：不同智能体独立对比目标和候选。
6. `correction-*`：任何相关 P0/P1 或用户相关 P2 返回原 writer 修正，再重新取证和审计。
7. `acceptance`：协调者逐项处置发现、更新日志和 changelog；不得以“测试绿”代替视觉验收。
8. `push`：清理本阶段服务、端口、临时浏览器和工作树后，非强制推送恢复点。

下一 Phase 只有在上一 Phase 已验收并推送后才能取得共享源码路径。整体目标
只有在 Phase 8 的全局验收完成后才可标记完成。

## 2026-07-28 规则补充

- Mutation 面向玩家的中文道具名由“冻结”统一为“冰冻”。
- 冰冻持续期间不是完全停落；自动重力固定为 1 秒/格，主动操作仍然可用。
- 附件识别必须同时覆盖活动方块、锁定方块和 Next，并使用颜色以外的轮廓、
  纹理、核心符号和局部动效区分四类道具。
- 坍缩不再允许横跨十列或贴在棋盘顶部的整行长条；仅在实际受影响列显示局部
  重力与沉降反馈。
- 普通消行的精致化归入 Phase 6 的共享 Renderer 检查点，必须清楚表达消除行
  的位置和过程，同时避免全屏闪白、输入阻断和过长遮挡。
- 以上补充属于 Phase 5，不提前修改 Phase 3 HUD，也不重设 Puzzle 选关界面。
