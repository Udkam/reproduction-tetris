import artifactFile from '../docs/workstreams/tetris-t12-core/puzzle-solver-results.json';
import { PUZZLE_DEFINITIONS, TICKS_PER_SECOND, type GameState, type PuzzleId } from './game/core';
import { replayPuzzleRoute } from './game/core/puzzleRouteSearch';

/** Separate from completion progression: a player earns a guide after making a real attempt. */
export const PUZZLE_HINT_PROGRESS_KEY = 'tetra:puzzle-hints:v1';
export const PUZZLE_HINT_UNLOCK_PIECES = 2;
export const PUZZLE_HINT_UNLOCK_SECONDS = 20;
const HINT_PROGRESS_VERSION = 1;

export interface PuzzleHintProgress {
  version: typeof HINT_PROGRESS_VERSION;
  unlockedLevelIds: PuzzleId[];
}

export interface PuzzleHintStep {
  index: number;
  title: string;
  detail: string;
}

export interface PuzzleHintStrategy {
  id: 'primary' | 'alternate';
  title: string;
  summary: string;
  steps: readonly PuzzleHintStep[];
}

export interface PuzzleHintGuide {
  id: PuzzleId;
  cue: string;
  strategies: readonly [PuzzleHintStrategy, PuzzleHintStrategy];
}

type ArtifactRoute = {
  id: 'primary' | 'alternate';
  commandStream: string;
};

type ArtifactLevel = {
  id: PuzzleId;
  routes: readonly [ArtifactRoute, ArtifactRoute];
};

type GuideCopy = {
  cue: string;
  primary: { title: string; summary: string };
  alternate: { title: string; summary: string };
};

const artifact = artifactFile as unknown as { schemaVersion: number; levels: readonly ArtifactLevel[] };
const PUZZLE_IDS = Object.freeze(PUZZLE_DEFINITIONS.map((level) => level.id));
const PUZZLE_ID_SET = new Set<PuzzleId>(PUZZLE_IDS);

/** The small amount of authored language turns a replay into a reading aid, not a raw answer key. */
const GUIDE_COPY: Record<PuzzleId, GuideCopy> = {
  't3r-shaft-01': {
    cue: '三行共用一条竖槽。先盯住最低端：直补和边缘搭桥都能把通道留活。',
    primary: { title: '直补通道', summary: '第一块就对准共用缺口，尽快让三行具备收口条件。' },
    alternate: { title: '边缘搭桥', summary: '先垫平外沿，再从侧面回收竖槽，给自己多一次调整机会。' },
  },
  't3r-shaft-02': {
    cue: '左侧锚点不参与消行；把它当作边界，别让中部回转空间被第一块堵死。',
    primary: { title: '顺流填槽', summary: '沿着低槽推进，把旋转留给最后的窄口。' },
    alternate: { title: '回填搭桥', summary: '先铺出一层可站的平台，再回到左下缺口。' },
  },
  't3r-shaft-03': {
    cue: '两岸缺口高度不同。先选一岸做支点，另一岸可以作为回收路线。',
    primary: { title: '右岸直入', summary: '先压住较低的一岸，让后续块自然收向中缝。' },
    alternate: { title: '左岸回旋', summary: '先在左侧形成稳定台面，再把中缝接回去。' },
  },
  't3r-shaft-04': {
    cue: '这是由下向上变窄的台阶；先让底层保持连通，锚点右侧不要提前封死。',
    primary: { title: '低层上推', summary: '从最宽处开始逐层抬高，最后才处理顶端窄口。' },
    alternate: { title: '外沿缓冲', summary: '把第一块放在外沿当桥面，换取一次中段重排。' },
  },
  't3r-cascade-05': {
    cue: '两处错位湾口会互相借力。每落一块都检查底行是否仍能一口气连通。',
    primary: { title: '双湾顺填', summary: '先补更低的湾口，再让下一块跨向另一侧。' },
    alternate: { title: '桥面回收', summary: '先形成横向桥面，再从中间向两边回填。' },
  },
  't3r-cascade-06': {
    cue: '转角很多，但没有时机要求。先找能同时服务两行的落点，不必急着塞最深的洞。',
    primary: { title: '转角直补', summary: '用连续转向沿着内侧阶梯推进。' },
    alternate: { title: '平面回填', summary: '先做出平整落脚面，再利用横块回收深角。' },
  },
  't5r-delta-07': {
    cue: '宽槽已经把棋盘分成两半。看 Next 后决定是直接穿过，还是先给中段留缓冲。',
    primary: { title: '穿槽直流', summary: '优先把长缺口接通，让每次落子都靠近消行。' },
    alternate: { title: '中段缓冲', summary: '先让第一块成为台面，随后从两侧往中间收。' },
  },
  't5r-drift-08': {
    cue: '底行断点和中列凹口要同时照顾。别把后续两块的共同落点提前占掉。',
    primary: { title: '中缝直补', summary: '先锁定中间低槽，保持右侧回收口完整。' },
    alternate: { title: '侧翼回填', summary: '先稳住一侧，再借台面把中缝补齐。' },
  },
  't5r-lattice-09': {
    cue: '右侧锚点只是一道边界。真正的选择在左侧低槽：直补更快，搭桥更宽容。',
    primary: { title: '低槽优先', summary: '先填最深的连续缺口，避免把左岸切成孤岛。' },
    alternate: { title: '桥接回收', summary: '先做出跨槽桥面，再回收被分开的两段。' },
  },
  't5r-rift-10': {
    cue: '首块之后才出现真正分流。先保留左低右高的过渡带，第二块再决定方向。',
    primary: { title: '内侧收束', summary: '顺着内侧阶梯压低高度，最后收口。' },
    alternate: { title: '外沿绕行', summary: '把中段留给回转，用外沿先建立支撑。' },
  },
  't5r-prism-11': {
    cue: '窄盆地旁有固定锚点。锚点不是目标，先让盆地底部可清，再处理外侧余量。',
    primary: { title: '盆地直补', summary: '以最窄处为主线，保持每层都有落脚面。' },
    alternate: { title: '外侧回收', summary: '先把外沿垫高一层，再从侧向收回盆地。' },
  },
  't5r-current-12': {
    cue: '阶梯前两块可以共用，第三块才是分流点。提前给转角留一格横向空间。',
    primary: { title: '阶梯顺推', summary: '沿低到高的顺序推进，让台阶自然变平。' },
    alternate: { title: '中段折返', summary: '先在中部搭一个折返点，再回补两端。' },
  },
  't5r-arc-13': {
    cue: '弧形通道最怕中间断层。先让底边连续，再把高度差留给可旋转的块。',
    primary: { title: '弧底连通', summary: '沿着弧底铺开，尽量不制造单格凹陷。' },
    alternate: { title: '高侧回收', summary: '先稳住高侧，再借中部台面回补低侧。' },
  },
  't5r-pulse-14': {
    cue: '两颗锚点把两端固定住。中间仍可自由整形，优先保留一条横向通路。',
    primary: { title: '中线直补', summary: '先把中线压平，让两端锚点只充当边界。' },
    alternate: { title: '双端回填', summary: '先在两端各留可落点，再从中间一次回收。' },
  },
  't5r-horizon-15': {
    cue: '紧密编织不是速度关。每次转向前都确认下一块还有平面可站。',
    primary: { title: '内线编织', summary: '沿内侧的连续缺口走，逐层缩小收口。' },
    alternate: { title: '外线缓冲', summary: '先在外侧建立一层，换来更宽的回转空间。' },
  },
  't6r-veil-16': {
    cue: '深槽从低处开始才透明。左侧锚点附近不需要填满，保留它上方的回流带。',
    primary: { title: '深槽直流', summary: '按最低层到最高层推进，持续保持一条开口。' },
    alternate: { title: '回流台面', summary: '先做出中段台面，再从右侧向深槽回流。' },
  },
  't6r-cairn-17': {
    cue: '层岩结构可从两边进入。选择一边做主坡，另一边就会成为自然的回收带。',
    primary: { title: '主坡上推', summary: '顺着主坡逐层补齐，避免在中层留下尖洞。' },
    alternate: { title: '双坡交替', summary: '两边轮流落子，让中线保持平整。' },
  },
  't6r-terrace-18': {
    cue: '台阶多但每层都能做平台。先确定哪侧承担高度，再用 Next 安排回收。',
    primary: { title: '台阶顺填', summary: '沿着连续低阶推进，最后再收最窄的一层。' },
    alternate: { title: '平台折返', summary: '先建宽平台，用更长的回收路线解开中段。' },
  },
  't6r-bastion-19': {
    cue: '首块可以共用，第二块才决定交叉方式。先把交汇口留空，别急着封边。',
    primary: { title: '交叉内收', summary: '从交汇口向内压缩，让两侧同步靠近消行。' },
    alternate: { title: '外环回补', summary: '先绕外沿建立缓冲，再回到交汇口收束。' },
  },
  't6r-keystone-20': {
    cue: '这一关的钥匙是第二块后的中段选择。先保留基石两侧的通路，再决定哪侧先收。',
    primary: { title: '基石内收', summary: '围绕中段缺口逐层收紧，保持底部连续。' },
    alternate: { title: '双侧回流', summary: '先从两侧铺出回流带，最后在中段合拢。' },
  },
};

function isPuzzleId(value: unknown): value is PuzzleId {
  return typeof value === 'string' && PUZZLE_ID_SET.has(value as PuzzleId);
}

function orderedUnique(ids: readonly PuzzleId[]): PuzzleId[] {
  const unlocked = new Set(ids);
  return PUZZLE_IDS.filter((id) => unlocked.has(id));
}

function routePlacementDetail(
  piece: string,
  cells: readonly { x: number; y: number }[],
  index: number,
  total: number,
): string {
  const center = cells.reduce((sum, cell) => sum + cell.x, 0) / cells.length;
  const columns = new Set(cells.map((cell) => cell.x)).size;
  const rows = new Set(cells.map((cell) => cell.y)).size;
  const lane = center < 3.4 ? '左侧' : center > 5.6 ? '右侧' : '中段';
  const posture = columns === 1 ? '立放' : rows === 1 ? '横放' : '转角落位';
  const purpose = index + 1 === total
    ? '把已连通的目标行收口。'
    : index === 0
      ? '先把这条路线的起点定稳。'
      : '保持低槽与下一块的落点连通。';
  return `将 ${piece} 放到${lane}${posture}，${purpose}`;
}

function buildStrategy(levelId: PuzzleId, route: ArtifactRoute, copy: GuideCopy['primary']): PuzzleHintStrategy {
  const replay = replayPuzzleRoute(levelId, route.commandStream);
  if (replay.state.status !== 'finished' || replay.state.puzzleCompletion !== 'finished') {
    throw new Error(`Puzzle guidance route ${levelId}/${route.id} is not Core-finished.`);
  }
  return Object.freeze({
    id: route.id,
    title: copy.title,
    summary: copy.summary,
    steps: Object.freeze(replay.locks.map((lock, index) => Object.freeze({
      index: index + 1,
      title: `第 ${index + 1} 块 · ${lock.piece}`,
      detail: routePlacementDetail(lock.piece, lock.cells, index, replay.locks.length),
    }))),
  });
}

const GUIDE_BY_ID: ReadonlyMap<PuzzleId, PuzzleHintGuide> = new Map(
  artifact.levels.map((level) => {
    const copy = GUIDE_COPY[level.id];
    if (!copy || level.routes[0]?.id !== 'primary' || level.routes[1]?.id !== 'alternate') {
      throw new Error(`Puzzle guidance metadata is incomplete for ${level.id}.`);
    }
    const strategies = [
      buildStrategy(level.id, level.routes[0], copy.primary),
      buildStrategy(level.id, level.routes[1], copy.alternate),
    ] as const;
    return [level.id, Object.freeze({
      id: level.id,
      cue: copy.cue,
      strategies,
    })] as const;
  }),
);

export function puzzleHintGuide(id: PuzzleId): PuzzleHintGuide {
  const guide = GUIDE_BY_ID.get(id);
  if (!guide) throw new Error(`Missing Puzzle guidance for ${id}.`);
  return guide;
}

export function defaultPuzzleHintProgress(): PuzzleHintProgress {
  return { version: HINT_PROGRESS_VERSION, unlockedLevelIds: [] };
}

export function parsePuzzleHintProgress(raw: string | null): PuzzleHintProgress {
  if (raw === null) return defaultPuzzleHintProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleHintProgress();
    const candidate = value as { version?: unknown; unlockedLevelIds?: unknown };
    if (candidate.version !== HINT_PROGRESS_VERSION || !Array.isArray(candidate.unlockedLevelIds)) return defaultPuzzleHintProgress();
    if (!candidate.unlockedLevelIds.every(isPuzzleId)) return defaultPuzzleHintProgress();
    return { version: HINT_PROGRESS_VERSION, unlockedLevelIds: orderedUnique(candidate.unlockedLevelIds) };
  } catch {
    return defaultPuzzleHintProgress();
  }
}

export function isPuzzleHintUnlocked(progress: PuzzleHintProgress, id: PuzzleId): boolean {
  return progress.unlockedLevelIds.includes(id);
}

export function unlockPuzzleHint(progress: PuzzleHintProgress, id: PuzzleId): PuzzleHintProgress {
  if (isPuzzleHintUnlocked(progress, id)) return progress;
  return { version: HINT_PROGRESS_VERSION, unlockedLevelIds: orderedUnique([...progress.unlockedLevelIds, id]) };
}

export function shouldUnlockPuzzleHint(state: GameState): boolean {
  return state.mode === 'puzzle'
    && state.puzzleId !== null
    && (state.pieceCount >= PUZZLE_HINT_UNLOCK_PIECES || state.elapsedTicks >= PUZZLE_HINT_UNLOCK_SECONDS * TICKS_PER_SECOND);
}

export function puzzleHintLockCopy(state: GameState): string {
  const pieces = Math.max(0, PUZZLE_HINT_UNLOCK_PIECES - state.pieceCount);
  const seconds = Math.max(0, Math.ceil((PUZZLE_HINT_UNLOCK_SECONDS * TICKS_PER_SECOND - state.elapsedTicks) / TICKS_PER_SECOND));
  if (pieces === 0 || seconds === 0) return '策略提示已解锁。';
  return `再落 ${pieces} 块，或继续观察 ${seconds} 秒，即可解锁两条参考路线。`;
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readPuzzleHintProgress(storage: Storage | null = browserStorage()): PuzzleHintProgress {
  try {
    return parsePuzzleHintProgress(storage?.getItem(PUZZLE_HINT_PROGRESS_KEY) ?? null);
  } catch {
    return defaultPuzzleHintProgress();
  }
}

export function persistPuzzleHintProgress(progress: PuzzleHintProgress, storage: Storage | null = browserStorage()): void {
  try {
    storage?.setItem(PUZZLE_HINT_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Local hints are a convenience. Storage denial must not affect the game run.
  }
}
