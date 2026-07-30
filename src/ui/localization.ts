import type { GameMode, MutationItem, PuzzleId } from '../game/core';

export type AppLanguage = 'zh-CN' | 'en';
export type PuzzleCelebrationOutcome = 'first' | 'record' | 'replay';
export type RuleFactId =
  | 'goal'
  | 'pace'
  | 'start'
  | 'pressure'
  | 'stonefall'
  | 'carriers'
  | 'items'
  | 'queue'
  | 'undo'
  | 'record'
  | 'end';

export type RuleFact = Readonly<{
  id: RuleFactId;
  label: string;
  value: string;
}>;

export const DEFAULT_LANGUAGE: AppLanguage = 'zh-CN';
export const LANGUAGE_STORAGE_KEY = 'tetramorph:language:v1';

type ModeCopy = {
  label: string;
  detail: string;
  action: string;
};

type Translation = {
  modes: Record<GameMode, ModeCopy>;
  rules: Record<GameMode, readonly RuleFact[]>;
  items: Record<MutationItem, string>;
  labels: {
    language: string;
    chinese: string;
    english: string;
    settings: string;
    controls: string;
    rules: string;
    keyboard: string;
    gameplayControls: string;
    shortcuts: string;
    selectMode: string;
    skipToGame: string;
    loading: string;
    back: string;
    start: string;
    okay: string;
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
    soundControls: string;
    turnSoundOn: string;
    turnSoundOff: string;
    score: string;
    lines: string;
    bedrock: string;
    nextRise: string;
    survivalTime: string;
    stonefall: string;
    level: string;
    originalBlocks: string;
    placed: string;
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
    puzzlePages: string;
    modeHome: string;
    currentRecord: string;
    notCompleted: string;
    best: string;
    leaderboard: string;
    resultLeaderboard: string;
    noRecords: string;
    currentRun: string;
    currentRunMissedLeaderboard: string;
    resultSummary: string;
    pauseTitle: string;
    restartTitle: string;
    undoTitle: string;
    leaveTitle: string;
    leaveRun: string;
    leavePuzzle: string;
    resultTitle: string;
    gamePanel: string;
    gameArea: string;
    board: string;
    twoUpcoming: string;
    nextPiece: string;
    followingPiece: string;
    touchControls: string;
    puzzleTouchControls: string;
    touchGestureHint: string;
    mutationStatus: string;
    mutationActive: string;
    superMultiplier: string;
    waitingForCore: string;
    carrierCore: string;
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
    bedrockRise: (rows: number) => string;
    minimumMoves: (moves: number) => string;
    currentBest: (moves: number) => string;
    originalBlocks: (remaining: number, total: number) => string;
    modeLeaderboard: (mode: string) => string;
    leaderboardCriterion: (survival: boolean) => string;
    leaderboardSummary: (score: string, pieces: number, lines: number, survival: boolean, mutation: boolean) => string;
    terminalPuzzleSuccess: (pieces: number, lines: number) => { title: string; detail: string };
    puzzleCelebration: (outcome: PuzzleCelebrationOutcome, best: number) => {
      title: string;
      detail: string;
      eyebrow: string;
      best: string;
    };
    terminalPuzzleFailure: (remaining: number, pieces: number) => { title: string; detail: string };
    terminalMutation: () => { title: string; detail: string };
    terminalSurvival: () => { title: string; detail: string };
    terminalClassic: () => { title: string; detail: string };
    selectedPuzzle: (name: string) => string;
    puzzleBoard: (name: string) => string;
    startPuzzle: (name: string) => string;
    puzzleList: (count: number) => string;
    puzzlePage: (start: number, end: number) => string;
    rowBand: (rows: number) => string;
    levelNode: (index: string, name: string, rows: number, complete: boolean, best: number | null) => string;
    boardLabel: string;
    eventLinesCleared: (count: number) => string;
    eventBedrockRaised: (height: number) => string;
    eventBedrockLowered: (height: number) => string;
    eventItemTriggered: (item: string) => string;
    mutationTimer: (item: string, seconds: number) => string;
    mutationPreview: (piece: string, item: string) => string;
  };
};

const ENGLISH_LEVEL_NAMES: Readonly<Record<PuzzleId, string>> = {
  't3r-shaft-01': 'Gap',
  't3r-shaft-02': 'Side Well',
  't3r-shaft-03': 'Offset',
  't3r-shaft-04': 'Turn',
  't3r-cascade-05': 'Twin Wells',
  't3r-cascade-06': 'Switchback',
  't5r-delta-07': 'Shaft',
  't5r-drift-08': 'Pillar',
  't5r-lattice-09': 'Interlock',
  't5r-rift-10': 'Twin Gate',
  't5r-prism-11': 'Stair',
  't5r-current-12': 'Overhang',
  't5r-arc-13': 'Well',
  't5r-pulse-14': 'Platform',
  't5r-horizon-15': 'Twin Shafts',
  't6r-veil-16': 'Junction',
  't6r-cairn-17': 'Backfill',
  't6r-terrace-18': 'Side Shelf',
  't6r-bastion-19': 'Narrow Gate',
  't6r-keystone-20': 'Bridge',
  'tm-puzzle-21': 'Gatepost',
  'tm-puzzle-22': 'Corridor',
  'tm-puzzle-23': 'Center Post',
  'tm-puzzle-24': 'Slope',
  'tm-puzzle-25': 'Pinched Well',
  'tm-puzzle-26': 'Offset Shelf',
  'tm-puzzle-27': 'Ramp',
  'tm-puzzle-28': 'Side Bridge',
  'tm-puzzle-29': 'Double Layer',
  'tm-puzzle-30': 'Split Shelf',
  'tm-puzzle-31': 'Bent Well',
  'tm-puzzle-32': 'Left Gate',
  'tm-puzzle-33': 'Offset Bridge',
  'tm-puzzle-34': 'Stepped Well',
  'tm-puzzle-35': 'Hanging Shelf',
  'tm-puzzle-36': 'Right Gate',
  'tm-puzzle-37': 'Twin Channel',
  'tm-puzzle-38': 'Loop Well',
  'tm-puzzle-39': 'Edge Tower',
  'tm-puzzle-40': 'Bent Bridge',
  'tm-puzzle-41': 'Cross Trench',
  'tm-puzzle-42': 'Center Steps',
  'tm-puzzle-43': 'Split Gallery',
  'tm-puzzle-44': 'Twin Towers',
  'tm-puzzle-45': 'Sloped Gallery',
  'tm-puzzle-46': 'Edge Well',
  'tm-puzzle-47': 'Deep Channel',
  'tm-puzzle-48': 'Broken Channel',
  'tm-puzzle-49': 'Layered Well',
  'tm-puzzle-50': 'Forked Passage',
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
      marathon: [
        { id: 'goal', label: '目标', value: '补满横行，消除并得分。' },
        { id: 'pace', label: '节奏', value: '每累计 10 行，下落提速一级。' },
        { id: 'end', label: '结束', value: '方块堆到顶端。' },
      ],
      race: [
        { id: 'start', label: '开局', value: '带 3 层上升基岩。' },
        { id: 'pressure', label: '压力', value: '13 秒逐步缩短至 6 秒；每消 3 行移除一层基岩。' },
        { id: 'stonefall', label: '落石', value: '20 秒开始，每次缩短 1 秒至 10 秒；每次随机 1–2 块可消落石，在同一随机列以普通方块 2 倍速度坠落。' },
        { id: 'end', label: '结束', value: '基岩把堆叠顶到顶端。' },
      ],
      sprint: [
        { id: 'goal', label: '目标', value: '像经典一样清行；每累计 6 行，下落提速一级。' },
        { id: 'carriers', label: '载具', value: '特殊整块任一格被清除时，立即释放一次道具。' },
        { id: 'items', label: '效果', value: '冰冻把自动下落固定为 1.0 秒/格；超重使各列独立下沉；炸弹清除底部 3 行；加倍让消行得分 ×2。计时效果重复触发会刷新为 10 秒；加倍再次触发升级为超级加倍 ×4。' },
        { id: 'end', label: '结束', value: '方块堆到顶端。' },
      ],
      puzzle: [
        { id: 'goal', label: '目标', value: '清除全部原有方块。' },
        { id: 'queue', label: '序列', value: '方块按固定顺序出现，没有落子上限。' },
        { id: 'undo', label: '撤回', value: '按 Z 回到上一个方块刚出现的时刻。' },
        { id: 'record', label: '纪录', value: '通关后保存历史最优步数。' },
      ],
    },
    items: { freeze: '冰冻', collapse: '超重', bomb: '炸弹', multiplier: '加倍' },
    labels: {
      language: '语言', chinese: '中文', english: 'English', settings: '设置', controls: '控制', rules: '规则', keyboard: '键盘', gameplayControls: '玩法操作', shortcuts: '快捷键', selectMode: '选择游戏模式', skipToGame: '跳到游戏', loading: 'TetraMorph 正在加载', back: '返回', start: '开始', okay: '好的', continue: '继续游戏', returnToPause: '返回暂停', restart: '重新开始', confirm: '确认', cancel: '取消', playAgain: '再来一局', replay: '重来', settingsShortcut: '设置', pauseResume: '暂停 / 继续', restartConfirm: '重开确认', undo: '撤回', move: '移动', rotate: '旋转', softDrop: '快速下落', hardDrop: '直接落底', volume: '音量', soundOn: '音效开', soundOff: '音效关', soundControls: '声音控制', turnSoundOn: '开启音效', turnSoundOff: '关闭音效', score: '分数', lines: '消行', bedrock: '基岩', nextRise: '下一层', survivalTime: '生存时间', stonefall: '落石', level: '关卡', originalBlocks: '原有方块', placed: '操作数', fall: '下落速度', core: '核心', combo: '连消', next: 'Next', puzzle: '解谜', selectedPuzzle: '已选残局', puzzleTraits: '残局特性', fixedAnchors: '固定锚点', puzzleRoute: '开放解谜残局', puzzleBands: '残局行数分段', puzzlePages: '关卡页', modeHome: '返回模式', currentRecord: '当前关纪录', notCompleted: '尚未通关', best: '最少', leaderboard: '本模式排行', resultLeaderboard: '排行榜', noRecords: '暂无记录', currentRun: '本局', currentRunMissedLeaderboard: '未进入前 5', resultSummary: '本局结果', pauseTitle: '已暂停', restartTitle: '重新开始？', undoTitle: '撤回上一步？', leaveTitle: '离开本局？', leaveRun: '返回模式首页', leavePuzzle: '返回关卡库', resultTitle: '本局结束', gamePanel: '游戏面板', gameArea: '游戏区', board: '游戏棋盘', twoUpcoming: '后续两个方块：1 为下一个，2 为后一个', nextPiece: '下一个方块', followingPiece: '后一个方块', touchControls: '触控操作', puzzleTouchControls: '解谜触控操作', touchGestureHint: '触控：轻点旋转；左右滑动移动；向下短滑加速，长滑直接落底。', mutationStatus: '异变状态', mutationActive: '生效中', superMultiplier: '超级加倍 ×4', waitingForCore: '等待核心方块', carrierCore: '核心', pendingRise: '待上升', pausedMessage: '本局已暂停。', resumedMessage: '继续本局。', undoMessage: '已撤回上一次落子。', targetReached: '目标已达成。', runEnded: '本局结束。', runStarted: 'TetraMorph 已开始。', modeData: '模式数据', moveLeft: '左移', moveRight: '右移', stay: '留在本局', select: '选择', switch: '切换', activate: '执行',
    },
    phrasing: {
      elapsed: (minutes, seconds) => `${minutes} 分 ${seconds} 秒`,
      cadence: (seconds) => `${seconds} 秒/格`,
      seconds: (seconds) => `${seconds} 秒`,
      lineCount: (lines) => `${lines} 行`,
      pieceCount: (pieces) => `${pieces} 方块`,
      bedrockCount: (rows) => `${rows} 层基岩`,
      bedrockRise: () => '上升',
      minimumMoves: (moves) => `最少 ${moves} 步`,
      currentBest: (moves) => `当前最优步数：${moves}步`,
      originalBlocks: (remaining, total) => `原有方块（${remaining}/${total}）`,
      modeLeaderboard: (mode) => `${mode}排行`,
      leaderboardCriterion: () => '前 5',
      leaderboardSummary: (score, pieces, lines, survival, mutation) => mutation ? `${score} 分  ${pieces} 方块` : survival ? `${lines} 行` : `${score} 分`,
      terminalPuzzleSuccess: (pieces, lines) => ({ title: '原有方块已清除', detail: `${pieces} 方块 · ${lines} 消行` }),
      puzzleCelebration: (outcome, best) => {
        if (outcome === 'first') {
          return {
            title: '恭喜你破解谜题',
            detail: '',
            eyebrow: '首次破解',
            best: `当前最优：${best}步`,
          };
        }
        if (outcome === 'record') {
          return {
            title: '新的个人纪录',
            detail: '',
            eyebrow: '个人最佳',
            best: `当前最优：${best}步`,
          };
        }
        return {
          title: '谜题再次破解',
          detail: '',
          eyebrow: '再次完成',
          best: `当前最优：${best}步`,
        };
      },
      terminalPuzzleFailure: (remaining, pieces) => ({ title: '堆叠到顶', detail: `剩余 ${remaining} 原有方块 · 已落 ${pieces} 块` }),
      terminalMutation: () => ({ title: '异变结束', detail: '' }),
      terminalSurvival: () => ({ title: '生存结束', detail: '' }),
      terminalClassic: () => ({ title: '堆叠到顶', detail: '' }),
      selectedPuzzle: (name) => `已选残局：${name}`,
      puzzleBoard: (name) => `${name}棋盘轮廓`,
      startPuzzle: (name) => `开始 ${name}`,
      puzzleList: (count) => `${count} 个开放解谜残局`,
      puzzlePage: (start, end) => `第 ${start} 至 ${end} 关`,
      rowBand: (rows) => `${rows} 行残局`,
      levelNode: (index, name, rows, complete, best) => `${index} ${name}，${rows} 行残局${complete ? '，已完成' : '，可进入'}${best !== null ? `，最少 ${best} 步` : ''}`,
      boardLabel: 'TetraMorph 10 × 20 游戏棋盘',
      eventLinesCleared: (count) => `消除了 ${count} 行。`,
      eventBedrockRaised: (height) => `基岩升至 ${height} 层。`,
      eventBedrockLowered: (height) => `基岩降至 ${height} 层。`,
      eventItemTriggered: (item) => `${item} 已触发，持续 10 秒。`,
      mutationTimer: (item, seconds) => `${item}：${seconds} 秒`,
      mutationPreview: (piece, item) => `${piece} 方块，携带${item}道具`,
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
      marathon: [
        { id: 'goal', label: 'Goal', value: 'Complete rows to clear and score.' },
        { id: 'pace', label: 'Pace', value: 'Gravity rises one tier every 10 cleared lines.' },
        { id: 'end', label: 'End', value: 'The stack reaches the top.' },
      ],
      race: [
        { id: 'start', label: 'Start', value: 'Begin above 3 rising bedrock rows.' },
        { id: 'pressure', label: 'Pressure', value: 'The timer drops from 13 to 6 seconds; every 3 lines removes one bedrock row.' },
        { id: 'stonefall', label: 'Stonefall', value: 'Starts at 20 seconds, then shortens by 1 to 10; each event drops 1–2 clearable rocks at 2× normal speed in one random column.' },
        { id: 'end', label: 'End', value: 'Bedrock pushes the stack to the top.' },
      ],
      sprint: [
        { id: 'goal', label: 'Goal', value: 'Clear rows as in Classic; gravity rises one tier every 6 lines.' },
        { id: 'carriers', label: 'Carriers', value: 'Clear any cell in a special whole piece to release its item once.' },
        { id: 'items', label: 'Items', value: 'Freeze fixes automatic gravity at 1.0 seconds per cell; Supergravity settles columns independently; Bomb clears the bottom 3 rows; Double scores line clears ×2. Repeating a timed item refreshes it to 10 seconds; a repeated Double becomes Super Double ×4.' },
        { id: 'end', label: 'End', value: 'The stack reaches the top.' },
      ],
      puzzle: [
        { id: 'goal', label: 'Goal', value: 'Clear every original block.' },
        { id: 'queue', label: 'Queue', value: 'Pieces arrive in a fixed order with no placement limit.' },
        { id: 'undo', label: 'Undo', value: 'Press Z to return to the instant the prior piece appeared.' },
        { id: 'record', label: 'Record', value: 'Completion saves this level’s best piece count.' },
      ],
    },
    items: { freeze: 'Freeze', collapse: 'Supergravity', bomb: 'Bomb', multiplier: 'Double' },
    labels: {
      language: 'Language', chinese: 'Chinese', english: 'English', settings: 'Settings', controls: 'Controls', rules: 'Rules', keyboard: 'Keyboard', gameplayControls: 'Gameplay', shortcuts: 'Shortcuts', selectMode: 'Choose a game mode', skipToGame: 'Skip to game', loading: 'TetraMorph is loading', back: 'Back', start: 'Start', okay: 'Got it', continue: 'Continue', returnToPause: 'Return to pause', restart: 'Restart', confirm: 'Confirm', cancel: 'Cancel', playAgain: 'Play again', replay: 'Replay', settingsShortcut: 'Settings', pauseResume: 'Pause / resume', restartConfirm: 'Restart confirmation', undo: 'Undo', move: 'Move', rotate: 'Rotate', softDrop: 'Soft drop', hardDrop: 'Hard drop', volume: 'Volume', soundOn: 'SFX on', soundOff: 'SFX off', soundControls: 'Sound controls', turnSoundOn: 'Turn sound effects on', turnSoundOff: 'Turn sound effects off', score: 'Score', lines: 'Lines', bedrock: 'Bedrock', nextRise: 'Next rise', survivalTime: 'Survival time', stonefall: 'Stonefall', level: 'Level', originalBlocks: 'Original blocks', placed: 'Moves', fall: 'Fall speed', core: 'Core', combo: 'Combo', next: 'Next', puzzle: 'Puzzle', selectedPuzzle: 'Selected puzzle', puzzleTraits: 'Puzzle traits', fixedAnchors: 'Fixed anchors', puzzleRoute: 'Open puzzle routes', puzzleBands: 'Puzzle row bands', puzzlePages: 'Level pages', modeHome: 'Back to modes', currentRecord: 'Current record', notCompleted: 'Not completed', best: 'Best', leaderboard: 'This mode', resultLeaderboard: 'Leaderboard', noRecords: 'No records yet', currentRun: 'This run', currentRunMissedLeaderboard: 'Outside the top 5', resultSummary: 'Run result', pauseTitle: 'Paused', restartTitle: 'Restart?', undoTitle: 'Undo last move?', leaveTitle: 'Leave this run?', leaveRun: 'Back to modes', leavePuzzle: 'Back to puzzle library', resultTitle: 'Run complete', gamePanel: 'game panel', gameArea: 'game area', board: 'game board', twoUpcoming: 'Two upcoming pieces: 1 is next; 2 follows it', nextPiece: 'Next piece', followingPiece: 'Following piece', touchControls: 'Touch controls', puzzleTouchControls: 'Puzzle touch controls', touchGestureHint: 'Touch: tap to rotate; swipe sideways to move; swipe down to soft-drop or hard-drop.', mutationStatus: 'Mutation status', mutationActive: 'Active', superMultiplier: 'Super Double ×4', waitingForCore: 'Waiting for a core piece', carrierCore: 'Core', pendingRise: 'Rising next', pausedMessage: 'Run paused.', resumedMessage: 'Run resumed.', undoMessage: 'Last placement undone.', targetReached: 'Goal reached.', runEnded: 'Run ended.', runStarted: 'TetraMorph started.', modeData: 'mode data', moveLeft: 'Move left', moveRight: 'Move right', stay: 'Stay in this run', select: 'Select', switch: 'Move between controls', activate: 'Activate',
    },
    phrasing: {
      elapsed: (minutes, seconds) => `${minutes}m ${seconds}s`,
      cadence: (seconds) => `${seconds} s/cell`,
      seconds: (seconds) => `${seconds}s`,
      lineCount: (lines) => `${lines} lines`,
      pieceCount: (pieces) => `${pieces} pieces`,
      bedrockCount: (rows) => `${rows} bedrock rows`,
      bedrockRise: () => 'Rise',
      minimumMoves: (moves) => `Best ${moves} moves`,
      currentBest: (moves) => `Current best: ${moves} steps`,
      originalBlocks: (remaining, total) => `Original blocks (${remaining}/${total})`,
      modeLeaderboard: (mode) => `${mode} leaderboard`,
      leaderboardCriterion: () => 'Top 5',
      leaderboardSummary: (score, pieces, lines, survival, mutation) => mutation ? `${score} pts  ${pieces} pieces` : survival ? `${lines} lines` : `${score} pts`,
      terminalPuzzleSuccess: (pieces, lines) => ({ title: 'Original blocks cleared', detail: `${pieces} pieces · ${lines} lines` }),
      puzzleCelebration: (outcome, best) => {
        if (outcome === 'first') {
          return {
            title: 'Puzzle solved',
            detail: '',
            eyebrow: 'First clear',
            best: `Current best: ${best} moves`,
          };
        }
        if (outcome === 'record') {
          return {
            title: 'New personal best',
            detail: '',
            eyebrow: 'Personal best',
            best: `Current best: ${best} moves`,
          };
        }
        return {
          title: 'Puzzle solved again',
          detail: '',
          eyebrow: 'Clear complete',
          best: `Current best: ${best} moves`,
        };
      },
      terminalPuzzleFailure: (remaining, pieces) => ({ title: 'Stacked out', detail: `${remaining} original blocks left · ${pieces} pieces placed` }),
      terminalMutation: () => ({ title: 'Mutation ended', detail: '' }),
      terminalSurvival: () => ({ title: 'Survival ended', detail: '' }),
      terminalClassic: () => ({ title: 'Stacked out', detail: '' }),
      selectedPuzzle: (name) => `Selected puzzle: ${name}`,
      puzzleBoard: (name) => `${name} board outline`,
      startPuzzle: (name) => `Start ${name}`,
      puzzleList: (count) => `${count} open puzzle routes`,
      puzzlePage: (start, end) => `Levels ${start} to ${end}`,
      rowBand: (rows) => `${rows}-row puzzle`,
      levelNode: (index, name, rows, complete, best) => `${index} ${name}, ${rows}-row puzzle${complete ? ', completed' : ', ready'}${best !== null ? `, best ${best} moves` : ''}`,
      boardLabel: 'TetraMorph 10 by 20 game board',
      eventLinesCleared: (count) => `${count} lines cleared.`,
      eventBedrockRaised: (height) => `Bedrock rose to ${height} rows.`,
      eventBedrockLowered: (height) => `Bedrock fell to ${height} rows.`,
      eventItemTriggered: (item) => `${item} activated for 10 seconds.`,
      mutationTimer: (item, seconds) => `${item}: ${seconds}s`,
      mutationPreview: (piece, item) => `${piece} piece carrying ${item}`,
    },
  },
};

export function appCopy(language: AppLanguage): Translation {
  return COPY[language];
}

export function modeCopy(language: AppLanguage, mode: GameMode): ModeCopy {
  return COPY[language].modes[mode];
}

export function modeRules(language: AppLanguage, mode: GameMode): readonly RuleFact[] {
  return COPY[language].rules[mode];
}

export function modeRulesTitle(language: AppLanguage, mode: GameMode): string {
  const translation = COPY[language];
  const modeLabel = translation.modes[mode].label;
  return language === 'zh-CN'
    ? `${modeLabel}${translation.labels.rules}`
    : `${modeLabel} ${translation.labels.rules}`;
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
