# Phase 8：全局集成与发布准备验收

## 状态

仅在 Phase 1–7 均已独立验收、清理并推送后开始。本阶段不新增玩法或重设计页面。

## 目标

证明所有阶段能在同一产品中稳定共存，并达到“可继续打包和准备 Steam 上架”的
产品质量边界。当前不接入 Steam SDK、不制作商店素材、也不实际打包，除非用户
另行明确要求。

## 集成门禁

1. 最终源码变更后只运行一次最终 typecheck、完整测试、production build。
2. 所有 50 个 Puzzle 关卡进行确定性 solver/replay 和迁移验证。
3. 四模式覆盖桌面、竖屏、短横屏、reduced motion、中英文、键盘和触控。
4. 验证一个 Pixi Canvas、零 DOM 方格、无控制台/page error、无横向溢出。
5. 验证重启、退出、切换语言、Settings/Pause/Restart/结果链的焦点与输入。
6. 验证 listener、ticker、audio、Canvas、对象池和 preview 服务在卸载后释放。
7. 检查依赖、许可证、字体本地化、生产路径和未来桌面壳适配，不引入在线必需项。
8. 更新 `CURRENT_TASK`、`DESIGN`、changelog、各 workstream log、证据清单与哈希。

## 协作团队

- 集成 writer/协调者：主任务，只允许处置跨阶段集成缺陷和最终文档。
- `t15_final_rules_qa`：规则、确定性、记录、迁移、生命周期和范围。
- `t15_final_visual_qa`：逐模式目标帧、响应式、动效、字体、颜色和可访问性。
- `t15_final_evidence_qa`：候选 SHA、干净构建、报告/截图哈希、状态覆盖和资源释放。
- verdict 冲突时创建只读 tie-break QA；不能用多数票忽略可复现缺陷。

产品缺陷必须返回其原 Phase 的 writer 和可回退检查点修正，再重新进入集成；
Phase 8 不把多个子系统修补压成一个巨型提交。

## 完成条件

三方独立接受同一最终候选，无未处置 P0/P1 或用户相关 P2；所有资源释放；工作树
仅保留明确归属的用户文件；验收文档和 changelog 已提交；`main` 非强制推送成功。
只有此时才可将总体目标标记完成。
