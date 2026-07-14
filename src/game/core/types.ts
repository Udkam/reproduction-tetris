export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

export type PieceType = (typeof PIECE_TYPES)[number];
export type Rotation = 0 | 1 | 2 | 3;

export interface Cell {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export type BoardCell = PieceType | null;
export type Board = BoardCell[][];

export interface RandomizerState {
  seed: number;
  bag: PieceType[];
}

export type GameStatus = 'ready' | 'playing' | 'paused' | 'game-over' | 'finished';
export type GamePhase = 'active' | 'entry' | 'line-clear';
export type GameMode = 'marathon' | 'race' | 'puzzle';
export type PuzzleId = 'offset-01' | 'offset-02' | 'offset-03';

export interface GameState {
  board: Board;
  active: ActivePiece | null;
  queue: PieceType[];
  score: number;
  lines: number;
  level: number;
  mode: GameMode;
  puzzleId: PuzzleId | null;
  puzzleTargetLines: number | null;
  puzzlePieceBudget: number | null;
  pieceCount: number;
  status: GameStatus;
  phase: GamePhase;
  phaseTicks: number;
  pendingClearRows: number[];
  gravityTicks: number;
  lockTicks: number;
  lockResets: number;
  elapsedTicks: number;
  randomizer: RandomizerState;
  seed: number;
}

export type GameCommand =
  | { type: 'start' }
  | { type: 'tick' }
  | { type: 'move'; dx: -1 | 1 }
  | { type: 'soft-drop' }
  | { type: 'hard-drop' }
  | { type: 'rotate'; direction: -1 | 1 }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'restart'; seed?: number; mode?: GameMode; puzzleId?: PuzzleId };

export type GameEvent =
  | { type: 'started' }
  | { type: 'restarted' }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'piece-moved'; piece: PieceType; dx: number; dy: number; cause: 'move' | 'gravity' | 'soft-drop' }
  | { type: 'piece-rotated'; piece: PieceType; direction: -1 | 1 }
  | { type: 'hard-dropped'; piece: PieceType; distance: number }
  | { type: 'piece-locked'; piece: PieceType; cells: Cell[] }
  | { type: 'clear-started'; rows: number[] }
  | { type: 'lines-cleared'; rows: number[]; count: number; score: number }
  | { type: 'level-up'; level: number }
  | { type: 'finished'; completionTicks: number }
  | { type: 'game-over'; reason: 'block-out' | 'lock-out' | 'puzzle-budget' | 'invalid-state' };

export interface GameTransition {
  state: GameState;
  events: GameEvent[];
}
