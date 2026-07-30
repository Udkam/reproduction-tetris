# Phase 8：全局集成与发布准备验收

## 状态

**ACCEPTED / PUSHED / CLOSED（2026-07-30）。** Phase 1–6、五十关
课程/持久化/进度和普通消行直接回退均已独立验收、清理并推送；冻结产品恢复点为
`4e4cca1`。Phase 8 没有修改产品源码、依赖或配置。被拒绝的 Puzzle selector 候选
完整保存在本地
`codex/t15-selector-wip-20260730@dce331b`，不属于 `main`，且本阶段明确不修改
或重新设计选关界面。

本阶段不新增玩法。`src/**`、依赖、配置、关卡定义/路线和产品视觉均保持冻结；
当前头只包含合同、一次性采集脚本、源绑定证据、门禁记录和三路只读 QA。

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

## 当前证据批次

- 候选：`main@4e4cca1`；运行前后都必须证明产品树和工作树不漂移。
- 目录：`docs/qa/evidence/t15-phase8/`；失败批次必须保留在临时目录且不得发布。
- 新鲜浏览器覆盖：
  - 中文桌面首页与四模式真实进入；
  - Classic、Survival、Mutation、Puzzle 各一个真实 gameplay Canvas；
  - 390×844 竖屏、844×390 短横屏、英文与 reduced motion；
  - Settings、Pause、Restart、Esc/Enter/方向键、Puzzle Z undo 的完整状态链；
  - 每一游戏态恰好一个 Canvas、零 DOM board cell、零 console/page error、
    零横向 overflow；
  - 两次 mount/restart/unmount 后 listener、rAF、audio 和 Canvas 回到首页基线。
- Phase-5 已验收的 34 图/manifest/38 哈希继续作为异变高瞬态证据；新批次只需
  证明其产品路径自 `ee2aac5` 后无语义漂移并在当前集成候选中正常进入，不重复
  制造同一瞬态截图。
- Phase-6 普通消行 normal/reduced Pixi 图继续作为 `760437d` 的源码精确证据；
  新批次验证当前应用壳、输入和卸载共存。
- 使用官方 `develop-web-game` client 完成至少一个真实动作 burst；更完整的断言
  由同一受管 Chrome/Vite 租约内的 source-bound harness 完成。只允许一个 server、
  一个 browser tree 和一个 runner，结束后必须释放 4178/5178/5179。

## 协作团队

- 集成 writer/协调者：主任务，只允许处置跨阶段集成缺陷和最终文档。
- `t15_final_rules_qa`：规则、确定性、记录、迁移、生命周期和范围。
- `t15_final_visual_qa`：逐模式目标帧、响应式、动效、字体、颜色和可访问性。
- `t15_final_evidence_qa`：候选 SHA、干净构建、报告/截图哈希、状态覆盖和资源释放。
- verdict 冲突时创建只读 tie-break QA；不能用多数票忽略可复现缺陷。

产品缺陷必须返回其原 Phase 的 writer 和可回退检查点修正，再重新进入集成；
Phase 8 不把多个子系统修补压成一个巨型提交。

## 验收结果

- 源绑定浏览器批次包含 13 张 Phase 8 目标帧和两张官方 web-game client 帧，
  覆盖四模式、桌面/竖屏/短横屏、中英文、reduced motion、键盘、触控和完整
  modal 输入链。
- `SHA256SUMS.txt` 的 23/23 项与 manifest 内嵌 18/18 项均重新计算一致；每个
  gameplay 状态恰好一个 Canvas、零 DOM board cell、零 console/page error，
  每次卸载都回到 listener/rAF/audio/Canvas 基线。
- 最终 typecheck、26/26 文件与 235/235 测试、753-module production build
  均通过；511.26 kB chunk 提示是既有 informational warning。
- rules QA：ACCEPT，`P0=0 / P1=0 / P2=0 / P3=1 / GAP=0`。
- visual QA：ACCEPT，`P0=0 / P1=0 / P2=0 / P3=1 / GAP=0`。
- evidence-integrity QA：ACCEPT，
  `P0=0 / P1=0 / P2=0 / P3=0 / GAP=0`。
- 唯一保留的 P3 是 390 px 三状态 Mutation HUD 的最长文本省略；道具图标、
  色系、顺序、剩余秒数和进度仍可辨识，不影响玩法或生命周期。
- 4178/5178/5179 已释放；没有 watcher、resident reader、Serena、MCP、LSP
  或常驻 Node 被留在本项目。

## 完成条件

三方独立接受同一最终候选，无未处置 P0/P1 或用户相关 P2；所有资源释放；工作树
仅保留明确归属的用户文件；验收文档和 changelog 已提交；`main` 非强制推送成功。
全部条件均已满足。协调者验收 checkpoint `c77790b` 已在范围受限、脱敏的
gitleaks 扫描无发现后非强制推送；本恢复记录推送后再次核对
local/tracking/remote 精确相等。
