import artifactFile from '../docs/workstreams/tetris-t13-core/puzzle-endgame-results.json';
import { PUZZLE_DEFINITIONS, TICKS_PER_SECOND, type GameState, type PuzzleId } from './game/core';
import { replayPuzzleRoute } from './game/core/puzzleRouteSearch';
import { browserPlatform } from './platform/browserPlatform';

/** Separate from completion history: a player earns a guide after making a real attempt. */
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

/** Curated language names a structural choice without disclosing an input transcript. */
const GUIDE_COPY: Record<PuzzleId, GuideCopy> = {
  't3r-shaft-01': {
    cue: '右下固定块会替你封住底边末端。先让中段保持回流，再决定是直补还是先搭桥。',
    primary: { title: '直补通道', summary: '把第一块用于贯通中缝，尽早让底层具备自然收口。' },
    alternate: { title: '边缘搭桥', summary: '先稳住外沿，再从侧面回收中缝，给旋转留出余地。' },
  },
  't3r-shaft-02': {
    cue: '右墙的竖向残片和左侧湾口相互牵制。不要急着填最深的洞，先留下回转层。',
    primary: { title: '深湾顺流', summary: '沿低处推进，让中段台阶逐层变平。' },
    alternate: { title: '右墙回收', summary: '先借右侧立边建立平台，再折返补低湾。' },
  },
  't3r-shaft-03': {
    cue: '两岸高度不等，中缝是共享资源。选一岸做主坡时，另一岸要保持可回收。',
    primary: { title: '左坡下沉', summary: '先压住左侧较深的台阶，让中缝持续可用。' },
    alternate: { title: '右岸桥接', summary: '先在右边形成落脚面，再向中部合拢。' },
  },
  't3r-cascade-05': {
    cue: '两段错层会彼此借力。每落一块都看底行是否仍保留横向连通。',
    primary: { title: '双湾顺填', summary: '先服务低湾，再让下一块跨向另一侧。' },
    alternate: { title: '桥面回收', summary: '先做横向桥面，随后从中间向两端回填。' },
  },
  't3r-shaft-04': {
    cue: '底部 I 形梁已经给出一条长边。关键是别把梁上方的窄槽提前封死。',
    primary: { title: '梁上递进', summary: '沿着长边由低到高推进，最后才处理顶端小口。' },
    alternate: { title: '外沿缓冲', summary: '让外沿先成为平台，再回到中段收束。' },
  },
  't3r-cascade-06': {
    cue: '六行残局出现了连续折角。优先寻找能同时服务两层的落点，而不是逐洞填塞。',
    primary: { title: '折角直补', summary: '顺着内侧阶梯推进，保持下一次旋转的入口。' },
    alternate: { title: '平面回填', summary: '先铺出稳定台面，再从横向回收深角。' },
  },
  't5r-delta-07': {
    cue: '右侧高台与左下长槽把棋盘拉开。先看 Next：可以穿槽，也可以把它当缓冲带。',
    primary: { title: '穿槽直流', summary: '优先接通长缺口，让每次落子都接近一条完整行。' },
    alternate: { title: '中段缓冲', summary: '先用首块做台面，再从两侧向中间回收。' },
  },
  't5r-lattice-09': {
    cue: '左下固定块是释放底行的最后一格，不是要避开的装饰。中段桥面仍有两种建法。',
    primary: { title: '低槽优先', summary: '先填最深的连续缺口，避免左岸被切成孤岛。' },
    alternate: { title: '桥接回收', summary: '先跨过低槽搭桥，随后回收两段结构。' },
  },
  't5r-drift-08': {
    cue: '左下竖墙和右侧阶梯需要同时照顾。不要让一块方便的填充占掉两块的共同落点。',
    primary: { title: '中缝直补', summary: '先锁定中间低槽，保持右侧回收口完整。' },
    alternate: { title: '侧翼回填', summary: '先稳住一侧，再借台面把中缝补齐。' },
  },
  't5r-rift-10': {
    cue: '横向梁把底部变成两个可互通的口袋。第一块可以铺路，第二块再决定收束方向。',
    primary: { title: '内侧收束', summary: '顺着内侧阶梯压低高度，保留最后的窄口。' },
    alternate: { title: '外沿绕行', summary: '先在外沿建立支撑，把中段留给回转。' },
  },
  't5r-pulse-14': {
    cue: '七行结构开始有纵深：左侧竖脊和底部横梁之间的空带，是整局的呼吸口。',
    primary: { title: '中线整形', summary: '先压平中线，使两侧高度能互相消化。' },
    alternate: { title: '双端回填', summary: '两端各保留一块落脚面，再从中间合拢。' },
  },
  't5r-arc-13': {
    cue: '右侧弧壁连续但中间有断层。先让底边能连通，再把高度差交给可旋转的块。',
    primary: { title: '弧底连通', summary: '沿弧底铺开，尽量不制造新的单格凹陷。' },
    alternate: { title: '高侧回收', summary: '先稳住高侧，再借中部台面回补低侧。' },
  },
  't5r-current-12': {
    cue: '左下固定块会在首个完整底行后留下稳定边界。真正的选择是先抬中段还是先接右坡。',
    primary: { title: '阶梯顺推', summary: '沿低到高的顺序推进，让台阶自然变平。' },
    alternate: { title: '中段折返', summary: '先在中部做折返点，再回补两端。' },
  },
  't5r-prism-11': {
    cue: '中部盆地很窄，但外侧仍有回旋空间。别只盯着最深点，先确保它有可落的上沿。',
    primary: { title: '盆地直补', summary: '以窄处为主线，保持每层都有落脚面。' },
    alternate: { title: '外侧回收', summary: '先垫出外沿，再从侧向收回盆地。' },
  },
  't5r-horizon-15': {
    cue: '中下固定块把底行变成一条有缺口的地平线。先保留它两侧的通路，再决定谁先落低。',
    primary: { title: '内线编织', summary: '沿内侧连续缺口走，逐层缩小收口。' },
    alternate: { title: '外线缓冲', summary: '先在外侧建立一层，换取更宽的回转空间。' },
  },
  't6r-cairn-17': {
    cue: '右下固定块封住一角，八行层岩却可从两侧进入。选择主坡，另一侧自然成为回收带。',
    primary: { title: '主坡上推', summary: '顺主坡逐层补齐，避免在中层留下尖洞。' },
    alternate: { title: '双坡交替', summary: '两边轮流落子，让中线始终平整。' },
  },
  't6r-terrace-18': {
    cue: '台阶很多但每层都能做平台。先确定哪侧承担高度，再为 Next 预留回收落点。',
    primary: { title: '台阶顺填', summary: '沿连续低阶推进，最后再收最窄的一层。' },
    alternate: { title: '平台折返', summary: '先建宽平台，用长一点的路线解开中段。' },
  },
  't6r-keystone-20': {
    cue: '中下固定块是“基石”：它会固定一个释放点，却没有替你决定左右哪边先收。',
    primary: { title: '基石内收', summary: '围绕中段缺口逐层收紧，保持底部连续。' },
    alternate: { title: '双侧回流', summary: '先从两侧铺出回流带，最后在中段合拢。' },
  },
  't6r-bastion-19': {
    cue: '右上堡垒与底部横梁给出交叉结构。把交汇口留空，比抢着封边更重要。',
    primary: { title: '交叉内收', summary: '从交汇口向内压缩，让两侧同步靠近消行。' },
    alternate: { title: '外环回补', summary: '先绕外沿建立缓冲，再回到交汇口收束。' },
  },
  't6r-veil-16': {
    cue: '最深的八行残局有多条可见缺口。先从低处读出一条回流线，不必急着填满任何一侧。',
    primary: { title: '深槽直流', summary: '按最低层到最高层推进，持续保留一条开口。' },
    alternate: { title: '回流台面', summary: '先做中段台面，再从侧面向深槽回流。' },
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
    ? '只在目标行已经连通时再收口。'
    : index === 0
      ? '先定住路线的起手，同时保留另一条回收线。'
      : '检查低槽与下一块的落点仍然相通。';
  return `让 ${piece} 在${lane}${posture}，${purpose}`;
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

if (artifact.schemaVersion !== 6 || artifact.levels.length !== PUZZLE_DEFINITIONS.length) {
  throw new Error('Puzzle guidance requires the complete schema-6 T13 route artifact.');
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

export function readPuzzleHintProgress(storage: Storage | null = browserPlatform.storage()): PuzzleHintProgress {
  try {
    return parsePuzzleHintProgress(storage?.getItem(PUZZLE_HINT_PROGRESS_KEY) ?? null);
  } catch {
    return defaultPuzzleHintProgress();
  }
}

export function persistPuzzleHintProgress(progress: PuzzleHintProgress, storage: Storage | null = browserPlatform.storage()): void {
  try {
    storage?.setItem(PUZZLE_HINT_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Local hints are a convenience. Storage denial must not affect the game run.
  }
}
