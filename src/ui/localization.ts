import type { GameMode, MutationItem, PuzzleId } from '../game/core';

export type AppLanguage = 'zh-CN' | 'en';

export const DEFAULT_LANGUAGE: AppLanguage = 'zh-CN';
export const LANGUAGE_STORAGE_KEY = 'tetramorph:language:v1';

type ModeCopy = {
  label: string;
  detail: string;
  action: string;
};

type Translation = {
  modes: Record<GameMode, ModeCopy>;
  rules: Record<GameMode, readonly string[]>;
  items: Record<MutationItem, string>;
  labels: {
    language: string;
    chinese: string;
    english: string;
    settings: string;
    controls: string;
    rules: string;
    keyboard: string;
    selectMode: string;
    skipToGame: string;
    loading: string;
    back: string;
    start: string;
    continue: string;
    returnToPause: string;
    restart: string;
    confirm: string;
    cancel: string;
    playAgain: string;
    replay: string;
    settingsShortcut: string;
    pauseResume: string;
    restartConfirm: string;
    undo: string;
    move: string;
    rotate: string;
    softDrop: string;
    hardDrop: string;
    volume: string;
    soundOn: string;
    soundOff: string;
    musicOn: string;
    musicOff: string;
    soundControls: string;
    turnSoundOn: string;
    turnSoundOff: string;
    turnMusicOn: string;
    turnMusicOff: string;
    score: string;
    lines: string;
    bedrock: string;
    nextRise: string;
    level: string;
    originalBlocks: string;
    placed: string;
    goal: string;
    clearOriginalBlocks: string;
    fall: string;
    core: string;
    combo: string;
    next: string;
    puzzle: string;
    selectedPuzzle: string;
    puzzleTraits: string;
    fixedAnchors: string;
    puzzleRoute: string;
    puzzleBands: string;
    modeHome: string;
    currentRecord: string;
    notCompleted: string;
    best: string;
    leaderboard: string;
    noRecords: string;
    currentRunMissedLeaderboard: string;
    pauseTitle: string;
    restartTitle: string;
    undoTitle: string;
    leaveTitle: string;
    leaveRun: string;
    leavePuzzle: string;
    resultTitle: string;
    rulesIntro: string;
    firstEntry: string;
    gamePanel: string;
    gameArea: string;
    board: string;
    twoUpcoming: string;
    nextPiece: string;
    touchControls: string;
    puzzleTouchControls: string;
    mutationStatus: string;
    waitingForCore: string;
    carrierCore: string;
    bombResolved: string;
    pendingRise: string;
    pausedMessage: string;
    resumedMessage: string;
    undoMessage: string;
    targetReached: string;
    runEnded: string;
    runStarted: string;
    modeData: string;
    moveLeft: string;
    moveRight: string;
    stay: string;
    select: string;
    switch: string;
    activate: string;
  };
  phrasing: {
    elapsed: (minutes: number, seconds: number) => string;
    cadence: (seconds: string) => string;
    seconds: (seconds: number) => string;
    lineCount: (lines: number) => string;
    pieceCount: (pieces: number) => string;
    bedrockCount: (rows: number) => string;
    minimumMoves: (moves: number) => string;
    currentBest: (moves: number) => string;
    originalBlocks: (remaining: number, total: number) => string;
    modeLeaderboard: (mode: string) => string;
    leaderboardCriterion: (survival: boolean) => string;
    leaderboardDetail: (score: string, pieces: number, lines: number, survival: boolean, mutation: boolean, date: string) => string;
    terminalPuzzleSuccess: (pieces: number, lines: number) => { title: string; detail: string };
    terminalPuzzleFailure: (remaining: number, pieces: number) => { title: string; detail: string };
    terminalMutation: (lines: number, score: string) => { title: string; detail: string };
    terminalSurvival: (lines: number, pieces: number, bedrock: number) => { title: string; detail: string };
    terminalClassic: (lines: number, score: string) => { title: string; detail: string };
    selectedPuzzle: (name: string) => string;
    puzzleBoard: (name: string) => string;
    startPuzzle: (name: string) => string;
    puzzleList: (count: number) => string;
    rowBand: (rows: number) => string;
    levelNode: (index: string, name: string, rows: number, complete: boolean, best: number | null) => string;
    boardLabel: string;
    eventLinesCleared: (count: number) => string;
    eventBedrockRaised: (height: number) => string;
    eventBedrockLowered: (height: number) => string;
    eventItemTriggered: (item: string) => string;
    mutationTimer: (item: string, seconds: number) => string;
  };
};

const ENGLISH_LEVEL_NAMES: Readonly<Record<PuzzleId, string>> = {
  't3r-shaft-01': 'First Step',
  't3r-shaft-02': 'Corner',
  't3r-shaft-03': 'Offset',
  't3r-shaft-04': 'Side Path',
  't3r-cascade-05': 'Patch',
  't3r-cascade-06': 'Elbow',
  't5r-delta-07': 'Long Bridge',
  't5r-drift-08': 'Interlace',
  't5r-lattice-09': 'Link',
  't5r-rift-10': 'Twin Gate',
  't5r-prism-11': 'Basin',
  't5r-current-12': 'Return',
  't5r-arc-13': 'Arc',
  't5r-pulse-14': 'Ridge',
  't5r-horizon-15': 'Open Space',
  't6r-veil-16': 'Deep Well',
  't6r-cairn-17': 'High Ground',
  't6r-terrace-18': 'Steps',
  't6r-bastion-19': 'Crossroads',
  't6r-keystone-20': 'Closure',
};

const COPY: Record<AppLanguage, Translation> = {
  'zh-CN': {
    modes: {
      marathon: { label: '经典', detail: '补全横行获得分数；每消 10 行下落加快。', action: '开始' },
      race: { label: '生存', detail: '在上升基岩上坚持；每消 3 行移除一层。', action: '开始' },
      sprint: { label: '异变', detail: '核心方块触发道具；每消 6 行下落加快。', action: '开始' },
      puzzle: { label: '解谜', detail: '清除全部原有方块；固定序列，可直接撤回。', action: '选关' },
    },
    rules: {
      marathon: ['补满任意横行即可消除并得分。', '每累计消除 10 行，下落速度提升一级。', '方块堆到顶端时，本局结束。'],
      race: ['开局有 3 层基岩，基岩会持续向上推进。', '压力从 13 秒逐步缩短至 6 秒；每消 3 行移除一层基岩。', '方块被基岩顶到顶端时，本局结束。'],
      sprint: ['像经典模式一样补满横行；每累计消除 6 行，下落速度提升一级。', '带核心标记的方块携带道具，消除其任一格即可触发一次效果。', '冻结停止自动下落；坍缩让各列独立下沉；炸弹清除底部 3 行；倍增在 10 秒内使消行得分翻倍。', '方块堆到顶端时，本局结束。'],
      puzzle: ['使用固定出现顺序的方块，清除全部原有方块即可通关。', '没有落子数量限制；按 Z 可直接回到上一个方块刚出现时。', '清除完成后记录本关最少落子数。'],
    },
    items: { freeze: '冻结', collapse: '坍缩', bomb: '炸弹', multiplier: '倍增' },
    labels: {
      language: '语言', chinese: '中文', english: 'English', settings: '设置', controls: '控制', rules: '规则', keyboard: '键盘', selectMode: '选择游戏模式', skipToGame: '跳到游戏', loading: 'TetraMorph 正在加载', back: '返回', start: '开始', continue: '继续游戏', returnToPause: '返回暂停', restart: '重新开始', confirm: '确认', cancel: '取消', playAgain: '再来一局', replay: '重来', settingsShortcut: '设置', pauseResume: '暂停 / 继续', restartConfirm: '重开确认', undo: '撤回', move: '移动', rotate: '旋转', softDrop: '快速下落', hardDrop: '直接落底', volume: '音量', soundOn: '音效开', soundOff: '音效关', musicOn: '音乐开', musicOff: '音乐关', soundControls: '声音控制', turnSoundOn: '开启音效', turnSoundOff: '关闭音效', turnMusicOn: '开启音乐', turnMusicOff: '关闭音乐', score: '分数', lines: '消行', bedrock: '基岩', nextRise: '下一层', level: '关卡', originalBlocks: '原有方块', placed: '已落子', goal: '通关目标', clearOriginalBlocks: '清除全部原有方块', fall: '下落', core: '核心', combo: '连消', next: 'Next', puzzle: '解谜', selectedPuzzle: '已选残局', puzzleTraits: '残局特性', fixedAnchors: '固定锚点', puzzleRoute: '开放解谜残局', puzzleBands: '残局行数分段', modeHome: '返回模式', currentRecord: '当前关纪录', notCompleted: '尚未通关', best: '最少', leaderboard: '本模式排行', noRecords: '暂无记录', currentRunMissedLeaderboard: '本局未进入排行榜', pauseTitle: '已暂停', restartTitle: '重新开始？', undoTitle: '撤回上一步？', leaveTitle: '离开本局？', leaveRun: '返回模式首页', leavePuzzle: '返回关卡库', resultTitle: '本局结束', rulesIntro: '规则', firstEntry: '首次进入说明', gamePanel: '游戏面板', gameArea: '游戏区', board: '游戏棋盘', twoUpcoming: '后续两个方块，按顺序显示', nextPiece: '下一个方块', touchControls: '触控操作', puzzleTouchControls: '解谜触控操作', mutationStatus: '异变状态', waitingForCore: '等待核心方块', carrierCore: '核心', bombResolved: '炸弹 · 底部 3 行已清除', pendingRise: '待上升', pausedMessage: '本局已暂停。', resumedMessage: '继续本局。', undoMessage: '已撤回上一次落子。', targetReached: '目标已达成。', runEnded: '本局结束。', runStarted: 'TetraMorph 已开始。', modeData: '模式数据', moveLeft: '左移', moveRight: '右移', stay: '留在本局', select: '选择', switch: '切换', activate: '执行',
    },
    phrasing: {
      elapsed: (minutes, seconds) => `${minutes} 分 ${seconds} 秒`,
      cadence: (seconds) => `${seconds} 秒/格`,
      seconds: (seconds) => `${seconds} 秒`,
      lineCount: (lines) => `${lines} 行`,
      pieceCount: (pieces) => `${pieces} 方块`,
      bedrockCount: (rows) => `${rows} 层基岩`,
      minimumMoves: (moves) => `最少 ${moves} 步`,
      currentBest: (moves) => `当前最优步数：${moves}步`,
      originalBlocks: (remaining, total) => `原有方块（${remaining}/${total}）`,
      modeLeaderboard: (mode) => `${mode}排行`,
      leaderboardCriterion: (survival) => survival ? '生存时间 · 前 5' : '消行 · 前 5',
      leaderboardDetail: (score, pieces, lines, survival, mutation, date) => mutation ? `${score} 分 · ${pieces} 方块 · ${date}` : survival ? `${lines} 行 · ${pieces} 方块 · ${date}` : `${score} 分 · ${date}`,
      terminalPuzzleSuccess: (pieces, lines) => ({ title: '原有方块已清除', detail: `${pieces} 方块 · ${lines} 消行` }),
      terminalPuzzleFailure: (remaining, pieces) => ({ title: '堆叠到顶', detail: `剩余 ${remaining} 原有方块 · 已落 ${pieces} 块` }),
      terminalMutation: (lines, score) => ({ title: '异变到顶', detail: `${lines} 消行 · ${score} 分` }),
      terminalSurvival: (lines, pieces, bedrock) => ({ title: '生存结束', detail: `${lines} 消行 · ${pieces} 方块 · ${bedrock} 层基岩` }),
      terminalClassic: (lines, score) => ({ title: '堆叠到顶', detail: `${score} 分 · ${lines} 消行` }),
      selectedPuzzle: (name) => `已选残局：${name}`,
      puzzleBoard: (name) => `${name}棋盘轮廓`,
      startPuzzle: (name) => `开始 ${name}`,
      puzzleList: (count) => `${count} 个开放解谜残局`,
      rowBand: (rows) => `${rows} 行残局`,
      levelNode: (index, name, rows, complete, best) => `${index} ${name}，${rows} 行残局${complete ? '，已完成' : '，可进入'}${best !== null ? `，最少 ${best} 步` : ''}`,
      boardLabel: 'TetraMorph 10 × 20 游戏棋盘',
      eventLinesCleared: (count) => `消除了 ${count} 行。`,
      eventBedrockRaised: (height) => `基岩升至 ${height} 层。`,
      eventBedrockLowered: (height) => `基岩降至 ${height} 层。`,
      eventItemTriggered: (item) => `${item} 已触发，持续 10 秒。`,
      mutationTimer: (item, seconds) => `${item} · ${seconds} 秒`,
    },
  },
  en: {
    modes: {
      marathon: { label: 'Classic', detail: 'Complete rows to score; speed rises every 10 lines.', action: 'Play' },
      race: { label: 'Survival', detail: 'Outlast rising bedrock; remove one layer every 3 lines.', action: 'Play' },
      sprint: { label: 'Mutation', detail: 'Core pieces trigger items; speed rises every 6 lines.', action: 'Play' },
      puzzle: { label: 'Puzzle', detail: 'Clear every original block with a fixed queue and direct undo.', action: 'Levels' },
    },
    rules: {
      marathon: ['Complete any horizontal row to clear it and score.', 'Gravity speeds up one tier every 10 cleared lines.', 'The run ends when the stack reaches the top.'],
      race: ['Start above 3 bedrock rows that keep rising.', 'Pressure drops from 13 to 6 seconds; every 3 cleared lines removes one bedrock row.', 'The run ends when bedrock pushes the stack to the top.'],
      sprint: ['Complete rows as in Classic; gravity speeds up one tier every 6 cleared lines.', 'A core-marked piece carries an item. Clear any one of its cells to trigger it once.', 'Freeze stops auto-fall; Collapse settles columns; Bomb clears the bottom 3 rows; Multiplier doubles line-clear score for 10 seconds.', 'The run ends when the stack reaches the top.'],
      puzzle: ['Use the fixed piece order to clear every original block.', 'There is no piece limit. Press Z to return directly to the moment the previous piece appeared.', 'Completion records the fewest placed pieces for this level.'],
    },
    items: { freeze: 'Freeze', collapse: 'Collapse', bomb: 'Bomb', multiplier: 'Multiplier' },
    labels: {
      language: 'Language', chinese: 'Chinese', english: 'English', settings: 'Settings', controls: 'Controls', rules: 'Rules', keyboard: 'Keyboard', selectMode: 'Choose a game mode', skipToGame: 'Skip to game', loading: 'TetraMorph is loading', back: 'Back', start: 'Start', continue: 'Continue', returnToPause: 'Return to pause', restart: 'Restart', confirm: 'Confirm', cancel: 'Cancel', playAgain: 'Play again', replay: 'Replay', settingsShortcut: 'Settings', pauseResume: 'Pause / resume', restartConfirm: 'Restart confirmation', undo: 'Undo', move: 'Move', rotate: 'Rotate', softDrop: 'Soft drop', hardDrop: 'Hard drop', volume: 'Volume', soundOn: 'SFX on', soundOff: 'SFX off', musicOn: 'Music on', musicOff: 'Music off', soundControls: 'Sound controls', turnSoundOn: 'Turn sound effects on', turnSoundOff: 'Turn sound effects off', turnMusicOn: 'Turn music on', turnMusicOff: 'Turn music off', score: 'Score', lines: 'Lines', bedrock: 'Bedrock', nextRise: 'Next rise', level: 'Level', originalBlocks: 'Original blocks', placed: 'Placed', goal: 'Goal', clearOriginalBlocks: 'Clear all original blocks', fall: 'Fall', core: 'Core', combo: 'Combo', next: 'Next', puzzle: 'Puzzle', selectedPuzzle: 'Selected puzzle', puzzleTraits: 'Puzzle traits', fixedAnchors: 'Fixed anchors', puzzleRoute: 'Open puzzle routes', puzzleBands: 'Puzzle row bands', modeHome: 'Back to modes', currentRecord: 'Current record', notCompleted: 'Not completed', best: 'Best', leaderboard: 'This mode', noRecords: 'No records yet', currentRunMissedLeaderboard: 'This run did not enter the leaderboard', pauseTitle: 'Paused', restartTitle: 'Restart?', undoTitle: 'Undo last move?', leaveTitle: 'Leave this run?', leaveRun: 'Back to modes', leavePuzzle: 'Back to puzzle library', resultTitle: 'Run complete', rulesIntro: 'Rules', firstEntry: 'First-time overview', gamePanel: 'game panel', gameArea: 'game area', board: 'game board', twoUpcoming: 'Two upcoming pieces, in order', nextPiece: 'Next piece', touchControls: 'Touch controls', puzzleTouchControls: 'Puzzle touch controls', mutationStatus: 'Mutation status', waitingForCore: 'Waiting for a core piece', carrierCore: 'Core', bombResolved: 'Bomb · bottom 3 rows cleared', pendingRise: 'Rising next', pausedMessage: 'Run paused.', resumedMessage: 'Run resumed.', undoMessage: 'Last placement undone.', targetReached: 'Goal reached.', runEnded: 'Run ended.', runStarted: 'TetraMorph started.', modeData: 'mode data', moveLeft: 'Move left', moveRight: 'Move right', stay: 'Stay in this run', select: 'Select', switch: 'Move between controls', activate: 'Activate',
    },
    phrasing: {
      elapsed: (minutes, seconds) => `${minutes}m ${seconds}s`,
      cadence: (seconds) => `${seconds}s / cell`,
      seconds: (seconds) => `${seconds}s`,
      lineCount: (lines) => `${lines} lines`,
      pieceCount: (pieces) => `${pieces} pieces`,
      bedrockCount: (rows) => `${rows} bedrock rows`,
      minimumMoves: (moves) => `Best ${moves} moves`,
      currentBest: (moves) => `Current best: ${moves} moves`,
      originalBlocks: (remaining, total) => `Original blocks (${remaining}/${total})`,
      modeLeaderboard: (mode) => `${mode} leaderboard`,
      leaderboardCriterion: (survival) => survival ? 'Survival time · Top 5' : 'Lines · Top 5',
      leaderboardDetail: (score, pieces, lines, survival, mutation, date) => mutation ? `${score} pts · ${pieces} pieces · ${date}` : survival ? `${lines} lines · ${pieces} pieces · ${date}` : `${score} pts · ${date}`,
      terminalPuzzleSuccess: (pieces, lines) => ({ title: 'Original blocks cleared', detail: `${pieces} pieces · ${lines} lines` }),
      terminalPuzzleFailure: (remaining, pieces) => ({ title: 'Stacked out', detail: `${remaining} original blocks left · ${pieces} pieces placed` }),
      terminalMutation: (lines, score) => ({ title: 'Mutation stacked out', detail: `${lines} lines · ${score} pts` }),
      terminalSurvival: (lines, pieces, bedrock) => ({ title: 'Survival ended', detail: `${lines} lines · ${pieces} pieces · ${bedrock} bedrock rows` }),
      terminalClassic: (lines, score) => ({ title: 'Stacked out', detail: `${score} pts · ${lines} lines` }),
      selectedPuzzle: (name) => `Selected puzzle: ${name}`,
      puzzleBoard: (name) => `${name} board outline`,
      startPuzzle: (name) => `Start ${name}`,
      puzzleList: (count) => `${count} open puzzle routes`,
      rowBand: (rows) => `${rows}-row puzzle`,
      levelNode: (index, name, rows, complete, best) => `${index} ${name}, ${rows}-row puzzle${complete ? ', completed' : ', ready'}${best !== null ? `, best ${best} moves` : ''}`,
      boardLabel: 'TetraMorph 10 by 20 game board',
      eventLinesCleared: (count) => `${count} lines cleared.`,
      eventBedrockRaised: (height) => `Bedrock rose to ${height} rows.`,
      eventBedrockLowered: (height) => `Bedrock fell to ${height} rows.`,
      eventItemTriggered: (item) => `${item} activated for 10 seconds.`,
      mutationTimer: (item, seconds) => `${item} · ${seconds}s`,
    },
  },
};

export function appCopy(language: AppLanguage): Translation {
  return COPY[language];
}

export function modeCopy(language: AppLanguage, mode: GameMode): ModeCopy {
  return COPY[language].modes[mode];
}

export function modeRules(language: AppLanguage, mode: GameMode): readonly string[] {
  return COPY[language].rules[mode];
}

export function itemLabel(language: AppLanguage, item: MutationItem): string {
  return COPY[language].items[item];
}

export function puzzleDisplayName(language: AppLanguage, id: PuzzleId, fallback: string): string {
  return language === 'en' ? ENGLISH_LEVEL_NAMES[id] : fallback;
}

export function initialLanguage(preferredLanguage: string | null | undefined): AppLanguage {
  return preferredLanguage?.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LANGUAGE;
}

export function parseLanguage(value: string | null | undefined): AppLanguage | null {
  return value === 'zh-CN' || value === 'en' ? value : null;
}

export function formatNumber(value: number, language: AppLanguage): string {
  return Math.max(0, value).toLocaleString(language);
}

export function formatDate(isoDate: string, language: AppLanguage): string {
  const [date] = isoDate.split('T');
  return language === 'en' ? date ?? '' : (date ?? '').replaceAll('-', '.');
}
