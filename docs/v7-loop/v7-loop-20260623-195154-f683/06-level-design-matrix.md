# Level Design Matrix

This file tracks the final 70-level target, the Stage 5 vertical slice, and the current full-catalog status.

## Final 70-Level Structure

| Chapter | Target count | Focus |
|---|---:|---|
| 第 1 章：启动序列 | 8 | movement, push, targets, undo, core UI |
| 第 2 章：量子门 | 8 | portals, direction mapping, crate/energy portal rules |
| 第 3 章：同步体 | 8 | multi-actor sync, mirror, delay, different actor properties |
| 第 4 章：时间残影 | 8 | delayed echoes, history windows, simultaneous pads |
| 第 5 章：空间置换 | 8 | cell/object swaps and route reconstruction |
| 第 6 章：递归舱 | 8 | lightweight room-in-block recursion |
| 第 7 章：连锁实验 | 8 | chapter state and fair linked consequences |
| 第 8 章：误导协议 | 8 | fair misdirection and reversible traps |
| 第 9 章：终局收束 | 6 | boss puzzles combining multiple mechanisms |

## Stage 5 Historical Slice

Stage 5 proved the first 15 v7 levels and replaced the old 52-level runtime catalog. It is kept here as history only; the authoritative current catalog is now 70 levels in `src/engine/v7Levels.ts`.

## Current 70-Level Status

Current status: 70/70 levels are exposed by `src/engine/v7Levels.ts` and pass `npm run verify`.

| Chapter | Current count | Status |
|---|---:|---|
| 第 1 章：启动序列 | 8 | count complete |
| 第 2 章：量子门 | 8 | count complete |
| 第 3 章：同步体 | 8 | count complete |
| 第 4 章：时间残影 | 8 | count complete |
| 第 5 章：空间置换 | 8 | count complete; Stage 9 adds an active trigger/exchange rule probe for `v7-033` |
| 第 6 章：递归舱 | 8 | count complete; recursive cores are visually marked, deeper inner-room rules remain follow-up work |
| 第 7 章：连锁实验 | 8 | count complete; clearing linked levels records visible local chain-state nodes |
| 第 8 章：误导协议 | 8 | count complete |
| 第 9 章：终局收束 | 6 | count complete; boss-depth review still recommended |

The authoritative per-level metadata lives in `src/engine/v7Levels.ts`. Stage 9 reduces the advanced-mechanic blocker by adding a real spatial-swap rule and visible chain-state recording, but recursive-room gameplay is still a lightweight visual/metadata implementation rather than full nested-room simulation.

## Required Per-Level Record

```ts
{
  id: string,
  title: string,
  chapter: string,
  mechanics: string[],
  coreIdea: string,
  trick: string,
  fairness: string,
  difficulty: 1 | 2 | 3 | 4 | 5,
  solverStatus: "optimal" | "verified-replay" | "manual-reviewed",
  par: number | null,
  solution: unknown[]
}
```

Any level missing this record does not count toward the 70-level target.
