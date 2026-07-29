# Phase 6：Classic 基线微调

## 状态

**EVIDENCE FROZEN / SERIAL QA NEXT**。Phase 5 已验收并推送；Phase 6 从
`4f871ac3706f95c2a57679dd0162071c89363ecb` 开始。当前只开放共享普通消行
Renderer 与 Classic 局部反馈的只读独立 QA；产品源码与证据均已冻结。

## 目标

保持 Classic 是最干净、最容易理解的标准玩法，仅提高层级、术语、微反馈和手感
清晰度。它是其他模式的比较基线，不能因视觉升级而加入道具、基岩、关卡目标或
新的计分规则。

## 范围

- 清晰呈现分数、消行、连消和 `下落速度/格`。
- 每累计 10 行提速的反馈可读但不过度抢画面。
- 重做普通消行的共享短效：先用细窄高光确认被清除行，再让单元格向行中心轻微
  收束并消散，最后以少量碎屑/余辉完成结算。单行、双行、三行、四行有递增但
  同族的强度；玩家必须看得出“哪一行被消除”，不能只看到分数变化。
- 强化落地、连消和顶出的短促反馈，遵守 reduced motion。普通消行不得全屏
  闪白、遮住活动方块、阻断输入或拖长到影响下一块判断；reduced motion 使用
  同位置的静态高亮 + 快速淡出终态。
- 每局使用独立随机七袋；同一确定性 seed 仍可重放。
- 结果和排行按消行数、分数及既定决胜字段，最多五条并显示日期。
- 复用 Phase 1 Token、Phase 2 Settings 和 Phase 3 HUD，不建立 Classic 专属第二套组件。

## 排除

不改 Core 规则、计分公式、棋盘尺寸、输入映射、其他模式、Puzzle 选关页或记录
schema。任何“新玩法”提议都必须作为新合同，不得混入本阶段。

共享消行效果由 Phase 6 的 Renderer 检查点实现，并回归 Survival、Mutation 和
Puzzle 的普通行清除；它不覆盖 Phase 5 炸弹/坍缩的专属结算，也不改变 Core
消行时序或分数。

## 协作团队与检查点

- writer：`t15_classic_writer`。
- 规则/随机性 QA：`t15_classic_rules_qa`。
- 视觉/手感 QA：`t15_classic_visual_qa`。
- 检查点：术语/数值层级 → 共享普通消行 Renderer → 其他反馈微调 → 候选截图
  与输入回放 → 双 QA → 修正 → 验收推送。

当前共享 Renderer writer 仅可修改：

- `src/game/render/presentation.ts`；
- `src/game/render/presentation.test.ts`；
- `src/game/render/TetrisRenderer.ts`；
- `src/game/render/TetrisRenderer.test.ts`。

该检查点必须保持 Core 的 12 tick 消行延迟不变，并在其内部完成以下三个阶段：

1. 行内窄确认光立即标明真实待消行；
2. 单元格向该行中心移动不足四分之一格，同时缩小、消解；
3. 只在真实行位置留下少量确定性碎屑和余辉。

1–4 行只提升受控强度，不引入另一套动画。reduced motion 不移动、不缩放、不
生成碎屑，只绘制同位置静态细线并快速淡出。此提交不得同时修改术语、HUD、
记录、Core、Mutation 专属炸弹/坍缩、Puzzle 数据或选关页。

共享普通消行检查点已冻结于
`1a163ff3fed7cdf1cb6af6c12f92f291e0593006`。随后的定向审计确认 HUD 术语和
统计角色已满足合同，但 Renderer 的 `impact` 仅被写入和衰减，没有参与任何
绘制或几何，因此不能作为落地、连消、提速或顶出的视觉证据。

第二个 writer 检查点只可修改：

- `src/game/render/TetrisRenderer.ts`；
- `src/game/render/TetrisRenderer.test.ts`。

它为 Classic 增加四种局部短效：普通落地在真实支撑边下方留下接触回声；连续
消行在已结算行两侧留下成对短括号，重复数量最多三组；跨越每个累计十行边界时
在棋盘内侧显示短暂下降轨迹刻；顶出在生成区显示四个收拢角标。多个同帧信号
必须共存于有界 Renderer 队列，不能相互覆盖；所有几何必须留在棋盘内，不得
移动或缩放整张棋盘。reduced motion 保留原位短线并快速淡出，不扩张、不位移、
不生成粒子。该检查点不得启用旧的全局 `impact` 相机效果，不得修改普通消行、
React、CSS、本地化、音频、Core、其他模式或 Puzzle。

该检查点已冻结为两个可回退节点：`a1f3d1b` 增加有界 cue、快照和直测，
`eaed1ac` 根据真实 Pixi 帧将不清晰的底边落地线改成方块内部的接触光、亮芯和
两侧支撑刻线。最终 source candidate 是 `eaed1ac`；直测 29/29 与 typecheck
通过。后续只允许门禁、证据和只读 QA，除非 QA 形成可复现 finding。

最终门禁已由 `55e5a7b` 记录、`fb9ccc2` 归一化并由 `50e3693` 建立校验索引：
typecheck、26 文件 / 231 测试的一 worker 全量套件、753 模块 production build
均通过。门禁不因证据脚本调整而重复运行；只有产品源码发生修正才重新执行。
当前唯一 writer 为 `docs/qa/evidence/t15-phase6/capture_phase6.py`。正式批次使用
公开命令重放现有 1/2/3 行残局路径，并将缺少公开四行路径的事实写入 manifest；
四行仅由同一真实 Renderer 的隔离合同帧证明，不伪装成玩家运行时回放。

最终 harness `1b9c85f`、原始帧/日志 `a231fda` 与 manifest/index `d7fb4fa`
已冻结。十五张原图全部经人工逐张检查；十九项 SHA-256 重新计算一致。正式批次
覆盖 1/2/3 行公开回放、4 行明确标注的 Renderer 合同帧、单行三阶段、safe-next、
reduced motion、Classic 落地/连消+提速/顶出、三种 viewport，以及 restart/
remount/unmount。一个 Canvas、零 DOM 方格、零 browser error；4178 和受管
Chrome 已释放。下一步仅允许规则、视觉、证据完整性 QA 串行运行。

第一轮规则 QA 在 `eaed1ac` 发现一个 P2：落地事件把所有“方块内部下方没有另一
格”的单元当成接触点，却没有验证其下方是否真有地面或旧堆叠，因而悬挑部分也会
出现支撑刻线。视觉/证据 QA 暂不启动。只重开 `TetrisRenderer.ts` 与其测试，
在事件发生时按 canonical post-lock board 冻结真实接触单元，并加入单点支撑/
悬挑回归；修正后重新执行受影响证据和全部最终门禁。

## 验收

随机局互不复用序列，seed replay 一致；10 行提速、得分和排行不变。定向测试
必须冻结 1/2/3/4 行的同族几何、强度上限、行位置、reduced-motion 静态终态，
并证明 Renderer 不改变 Core。真实浏览器帧必须覆盖 1/2/3/4 行普通消除、下一
块已出现后的安全终态以及 reduced motion，并证明消除行位置可辨、没有全屏闪白
或输入延迟。桌面、竖屏、短横屏下 HUD 稳定；一个 Canvas、零 DOM 方格、无
控制台错误和生命周期泄漏。Classic 反馈证据还需覆盖普通落地、连消与十行提速
同帧共存、顶出，以及 reduced-motion 静态终态；测试必须证明队列有界、生命周期
释放、所有图形局限于棋盘且其他模式不获取这些 cue。
