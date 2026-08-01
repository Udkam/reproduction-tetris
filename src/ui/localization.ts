import type {
  GameMode,
  MutationItem,
  PuzzleId,
} from '../game/core';
import type { PuzzleTechnique } from '../puzzleLessons';

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
    piecesUsed: string;
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
    puzzleIntro: string;
    puzzleEasy: string;
    puzzleHard: string;
    mastery: string;
    hardUnlockHint: string;
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
    rockfallPieces: (pieces: number) => string;
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
    puzzleCategory: (category: string, count: number) => string;
    masteryThreshold: (technique: string, prerequisite: string, required: number, best: number | null) => string;
    rowBand: (rows: number) => string;
    levelNode: (index: string, name: string, rows: number, complete: boolean, unlocked: boolean, best: number | null) => string;
    boardLabel: string;
    eventLinesCleared: (count: number) => string;
    eventBedrockRaised: (height: number) => string;
    eventBedrockLowered: (height: number) => string;
    eventItemTriggered: (item: string) => string;
    mutationTimer: (item: string, seconds: number) => string;
    mutationPreview: (piece: string, item: string) => string;
    puzzleLesson: (technique: PuzzleTechnique) => { title: string; body: string };
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
        { id: 'goal', label: '消行', value: '移动、旋转并落下方块；填满一整行即可消除并得分。' },
        { id: 'pace', label: '加速', value: '累计消除 10 行后，下落速度提升一级。' },
        { id: 'end', label: '结束', value: '新方块无法进入棋盘时，本局结束。' },
      ],
      race: [
        { id: 'start', label: '岩壁', value: '开局连续升起 3 层基岩；之后每 13 秒上升一层，逐步加快至每 6 秒。' },
        { id: 'pressure', label: '反制', value: '每累计消除 3 行，移除最上方一层基岩。' },
        { id: 'stonefall', label: '落石', value: '最初每使用 8 个方块，随下一个方块落下同列的 1–2 块落石；每触发 4 次，间隔减少 1 个，最低为 4 个。落石以普通方块 4 倍速度下落，也能参与消行。' },
        { id: 'end', label: '结束', value: '基岩或堆叠令新方块无法进入棋盘时，本局结束。' },
      ],
      sprint: [
        { id: 'goal', label: '消行', value: '基础规则与经典相同；每累计消除 6 行，下落速度提升一级。' },
        { id: 'carriers', label: '携带', value: '带有彩色核心标记的方块携带道具；该方块任意一格被消除时立即触发。' },
        { id: 'items', label: '道具', value: '冰冻令方块以 1.0 秒/格下落；超重令落地时各列独立下沉；炸弹清除底部 3 行；加倍令消行得分 ×2；重塑把生成后 Next 中的方块变为 I。计时效果再次触发会刷新为 10 秒，加倍叠加后升级为超级加倍 ×4。' },
        { id: 'end', label: '结束', value: '新方块无法进入棋盘时，本局结束。' },
      ],
      puzzle: [
        { id: 'goal', label: '破解', value: '通过消行清除棋盘中全部原有方块；不可消除的锚点只会阻挡移动。' },
        { id: 'queue', label: '推演', value: '每关使用固定方块序列，Next 同时展示后续两个方块，操作数没有上限。' },
        { id: 'undo', label: '撤回', value: '按 Z 直接回到上一个方块尚未出现的状态，并重新开始它的下落。' },
        { id: 'record', label: '纪录', value: '通关后保存该关最少操作数；精通部分简单关可解锁相同技巧的困难关。' },
      ],
    },
    items: { freeze: '冰冻', collapse: '超重', bomb: '炸弹', multiplier: '加倍', reshape: '重塑' },
    labels: {
      language: '语言', chinese: '中文', english: 'English', settings: '设置', controls: '控制', rules: '规则', keyboard: '键盘', gameplayControls: '玩法操作', shortcuts: '快捷键', selectMode: '选择游戏模式', skipToGame: '跳到游戏', loading: 'TetraMorph 正在加载', back: '返回', start: '开始', okay: '好的', continue: '继续游戏', returnToPause: '返回暂停', restart: '重新开始', confirm: '确认', cancel: '取消', playAgain: '再来一局', replay: '重来', settingsShortcut: '设置', pauseResume: '暂停 / 继续', restartConfirm: '重开确认', undo: '撤回', move: '移动', rotate: '旋转', softDrop: '快速下落', hardDrop: '直接落底', volume: '音量', soundOn: '音效开', soundOff: '音效关', soundControls: '声音控制', turnSoundOn: '开启音效', turnSoundOff: '关闭音效', score: '分数', piecesUsed: '使用方块', lines: '消行', bedrock: '基岩', nextRise: '下一层', survivalTime: '生存时间', stonefall: '距离落石', level: '关卡', originalBlocks: '原有方块', placed: '操作数', fall: '下落速度', core: '核心', combo: '连消', next: 'Next', puzzle: '解谜', selectedPuzzle: '已选残局', puzzleTraits: '残局特性', fixedAnchors: '固定锚点', puzzleRoute: '开放解谜残局', puzzleBands: '残局行数分段', puzzlePages: '关卡页', puzzleIntro: '入门', puzzleEasy: '简单', puzzleHard: '困难', mastery: '技巧精通', hardUnlockHint: '困难关由对应简单关的精通成绩解锁。', modeHome: '返回首页', currentRecord: '当前关纪录', notCompleted: '尚未通关', best: '最少', leaderboard: '本模式排行', resultLeaderboard: '排行榜', noRecords: '暂无记录', currentRun: '本局', currentRunMissedLeaderboard: '未进入前 5', resultSummary: '本局结果', pauseTitle: '已暂停', restartTitle: '重新开始？', undoTitle: '撤回上一步？', leaveTitle: '离开本局？', leaveRun: '返回首页', leavePuzzle: '返回关卡库', resultTitle: '本局结束', gamePanel: '游戏面板', gameArea: '游戏区', board: '游戏棋盘', twoUpcoming: '后续两个方块：1 为下一个，2 为后一个', nextPiece: '下一个方块', followingPiece: '后一个方块', touchControls: '触控操作', puzzleTouchControls: '解谜触控操作', touchGestureHint: '触控：轻点旋转；左右滑动移动；向下短滑加速，长滑直接落底。', mutationStatus: '异变状态', mutationActive: '生效中', superMultiplier: '超级加倍 ×4', waitingForCore: '等待核心方块', carrierCore: '核心', pendingRise: '待上升', pausedMessage: '本局已暂停。', resumedMessage: '继续本局。', undoMessage: '已撤回上一次落子。', targetReached: '目标已达成。', runEnded: '本局结束。', runStarted: 'TetraMorph 已开始。', modeData: '模式数据', moveLeft: '左移', moveRight: '右移', stay: '留在本局', select: '选择', switch: '切换', activate: '执行',
    },
    phrasing: {
      elapsed: (minutes, seconds) => `${minutes} 分 ${seconds} 秒`,
      cadence: (seconds) => `${seconds} 秒/格`,
      seconds: (seconds) => `${seconds} 秒`,
      rockfallPieces: (pieces) => `${pieces}块`,
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
            best: `当前最优步数：${best}步`,
          };
        }
        if (outcome === 'record') {
          return {
            title: '刷新个人纪录',
            detail: '',
            best: `当前最优步数：${best}步`,
          };
        }
        return {
          title: '谜题已破解',
          detail: '',
          best: `当前最优步数：${best}步`,
        };
      },
      terminalPuzzleFailure: (remaining, pieces) => ({ title: '堆叠到顶', detail: `剩余 ${remaining} 原有方块 · 已落 ${pieces} 块` }),
      terminalMutation: () => ({ title: '异变结果', detail: '' }),
      terminalSurvival: () => ({ title: '生存结果', detail: '' }),
      terminalClassic: () => ({ title: '经典结果', detail: '' }),
      selectedPuzzle: (name) => `已选残局：${name}`,
      puzzleBoard: (name) => `${name}棋盘轮廓`,
      startPuzzle: (name) => `开始 ${name}`,
      puzzleList: (count) => `${count} 个开放解谜残局`,
      puzzleCategory: (category, count) => `${category}，${count} 关`,
      masteryThreshold: (technique, prerequisite, required, best) => best === null
        ? `在“${prerequisite}”中用 ${required} 步内通关，掌握“${technique}”后解锁。`
        : best <= required
          ? `已通过“${prerequisite}”以 ${best} 步掌握“${technique}”。`
          : `“${prerequisite}”当前 ${best} 步；达到 ${required} 步内即可掌握“${technique}”。`,
      rowBand: (rows) => `${rows} 行残局`,
      levelNode: (index, name, rows, complete, unlocked, best) => `${index} ${name}，${rows} 行残局${complete ? '，已完成' : unlocked ? '，可进入' : '，未解锁'}${best !== null ? `，最少 ${best} 步` : ''}`,
      boardLabel: 'TetraMorph 10 × 20 游戏棋盘',
      eventLinesCleared: (count) => `消除了 ${count} 行。`,
      eventBedrockRaised: (height) => `基岩升至 ${height} 层。`,
      eventBedrockLowered: (height) => `基岩降至 ${height} 层。`,
      eventItemTriggered: (item) => `${item} 已触发，持续 10 秒。`,
      mutationTimer: (item, seconds) => `${item}：${seconds} 秒`,
      mutationPreview: (piece, item) => `${piece} 方块，携带${item}道具`,
      puzzleLesson: (technique) => ({
        'complete-row': { title: '先完成一行', body: '先补最接近完整的目标行；消行腾出的空间会让后续更清楚。' },
        'preserve-well': { title: '保留竖井', body: '不要先封住窄槽，把直达底部的通道留给形状匹配的长边。' },
        'build-support': { title: '先铺支撑', body: '先把承接面铺稳再盖上层；悬空封顶会把空格埋成洞。' },
        'avoid-hole': { title: '不埋空格', body: '落下前看方块下方；被盖住的空格通常要多清几行才能救回。' },
        'read-queue': { title: '两块一起看', body: '先判断第 2 块需要的槽口，再用第 1 块为它保留支撑和入口。' },
        'retain-opening': { title: '压平但留口', body: '降低高差时别封死唯一入口；平整和可进入必须同时满足。' },
        'anchor-geometry': { title: '锚点不会消失', body: '把锚点当作固定墙面规划路径；目标是清原有方块，不是清掉锚点。' },
        'anchor-side-slip': { title: '贴锚侧滑', body: '先快速下落到锚点附近，再立即横移，滑进从顶部直落到不了的位置。' },
      })[technique],
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
        { id: 'goal', label: 'Clear', value: 'Move, rotate, and drop pieces. Completing a row clears it and awards points.' },
        { id: 'pace', label: 'Speed', value: 'Gravity increases one tier after every 10 cleared lines.' },
        { id: 'end', label: 'End', value: 'The run ends when a new piece cannot enter the board.' },
      ],
      race: [
        { id: 'start', label: 'Wall', value: 'Three bedrock rows rise during the opening. Another row rises every 13 seconds, accelerating to every 6 seconds.' },
        { id: 'pressure', label: 'Relief', value: 'Every 3 cleared lines removes the top bedrock row.' },
        { id: 'stonefall', label: 'Rockfall', value: 'At first, every 8 used pieces schedules 1–2 joined rocks with the next piece. Every 4 rockfalls shortens the interval by one, to a minimum of 4. Rocks fall at 4× piece speed and can complete lines.' },
        { id: 'end', label: 'End', value: 'The run ends when bedrock or the stack prevents a new piece from entering.' },
      ],
      sprint: [
        { id: 'goal', label: 'Clear', value: 'Classic rules apply; gravity increases one tier after every 6 cleared lines.' },
        { id: 'carriers', label: 'Carriers', value: 'A piece with a colored core carries an item. Clearing any cell of that piece triggers it immediately.' },
        { id: 'items', label: 'Items', value: 'Freeze sets gravity to 1.0 s/cell; Supergravity settles each column independently; Bomb clears the bottom 3 rows; Double makes line-clear scores ×2; Reshape turns the post-spawn Next piece into I. Repeating a timed item refreshes it to 10 seconds, while stacked Double becomes Super Double ×4.' },
        { id: 'end', label: 'End', value: 'The run ends when a new piece cannot enter the board.' },
      ],
      puzzle: [
        { id: 'goal', label: 'Solve', value: 'Clear every original block. Permanent anchors block movement but cannot be removed.' },
        { id: 'queue', label: 'Plan', value: 'Each level has a fixed sequence. Next shows the following two pieces, with no move limit.' },
        { id: 'undo', label: 'Undo', value: 'Press Z to return to the state before the previous piece appeared, then play it again.' },
        { id: 'record', label: 'Record', value: 'Completion saves the fewest moves. Mastering selected Easy levels unlocks Hard levels that use the same technique.' },
      ],
    },
    items: { freeze: 'Freeze', collapse: 'Supergravity', bomb: 'Bomb', multiplier: 'Double', reshape: 'Reshape' },
    labels: {
      language: 'Language', chinese: 'Chinese', english: 'English', settings: 'Settings', controls: 'Controls', rules: 'Rules', keyboard: 'Keyboard', gameplayControls: 'Gameplay', shortcuts: 'Shortcuts', selectMode: 'Choose a game mode', skipToGame: 'Skip to game', loading: 'TetraMorph is loading', back: 'Back', start: 'Start', okay: 'Got it', continue: 'Continue', returnToPause: 'Return to pause', restart: 'Restart', confirm: 'Confirm', cancel: 'Cancel', playAgain: 'Play again', replay: 'Replay', settingsShortcut: 'Settings', pauseResume: 'Pause / resume', restartConfirm: 'Restart confirmation', undo: 'Undo', move: 'Move', rotate: 'Rotate', softDrop: 'Soft drop', hardDrop: 'Hard drop', volume: 'Volume', soundOn: 'SFX on', soundOff: 'SFX off', soundControls: 'Sound controls', turnSoundOn: 'Turn sound effects on', turnSoundOff: 'Turn sound effects off', score: 'Score', piecesUsed: 'Pieces used', lines: 'Lines', bedrock: 'Bedrock', nextRise: 'Next rise', survivalTime: 'Survival time', stonefall: 'Until rockfall', level: 'Level', originalBlocks: 'Original blocks', placed: 'Moves', fall: 'Fall speed', core: 'Core', combo: 'Combo', next: 'Next', puzzle: 'Puzzle', selectedPuzzle: 'Selected puzzle', puzzleTraits: 'Puzzle traits', fixedAnchors: 'Fixed anchors', puzzleRoute: 'Open puzzle routes', puzzleBands: 'Puzzle row bands', puzzlePages: 'Level pages', puzzleIntro: 'Intro', puzzleEasy: 'Easy', puzzleHard: 'Hard', mastery: 'Technique mastery', hardUnlockHint: 'Hard puzzles unlock through mastery scores in related Easy puzzles.', modeHome: 'Back to home', currentRecord: 'Current record', notCompleted: 'Not completed', best: 'Best', leaderboard: 'This mode', resultLeaderboard: 'Leaderboard', noRecords: 'No records yet', currentRun: 'This run', currentRunMissedLeaderboard: 'Outside the top 5', resultSummary: 'Run result', pauseTitle: 'Paused', restartTitle: 'Restart?', undoTitle: 'Undo last move?', leaveTitle: 'Leave this run?', leaveRun: 'Back to home', leavePuzzle: 'Back to puzzle library', resultTitle: 'Run complete', gamePanel: 'game panel', gameArea: 'game area', board: 'game board', twoUpcoming: 'Two upcoming pieces: 1 is next; 2 follows it', nextPiece: 'Next piece', followingPiece: 'Following piece', touchControls: 'Touch controls', puzzleTouchControls: 'Puzzle touch controls', touchGestureHint: 'Touch: tap to rotate; swipe sideways to move; swipe down to soft-drop or hard-drop.', mutationStatus: 'Mutation status', mutationActive: 'Active', superMultiplier: 'Super Double ×4', waitingForCore: 'Waiting for a core piece', carrierCore: 'Core', pendingRise: 'Rising next', pausedMessage: 'Run paused.', resumedMessage: 'Run resumed.', undoMessage: 'Last placement undone.', targetReached: 'Goal reached.', runEnded: 'Run ended.', runStarted: 'TetraMorph started.', modeData: 'mode data', moveLeft: 'Move left', moveRight: 'Move right', stay: 'Stay in this run', select: 'Select', switch: 'Move between controls', activate: 'Activate',
    },
    phrasing: {
      elapsed: (minutes, seconds) => `${minutes}m ${seconds}s`,
      cadence: (seconds) => `${seconds} s/cell`,
      seconds: (seconds) => `${seconds}s`,
      rockfallPieces: (pieces) => `${pieces} pc`,
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
            best: `Current best: ${best} moves`,
          };
        }
        if (outcome === 'record') {
          return {
            title: 'New personal best',
            detail: '',
            best: `Current best: ${best} moves`,
          };
        }
        return {
          title: 'Puzzle solved',
          detail: '',
          best: `Current best: ${best} moves`,
        };
      },
      terminalPuzzleFailure: (remaining, pieces) => ({ title: 'Stacked out', detail: `${remaining} original blocks left · ${pieces} pieces placed` }),
      terminalMutation: () => ({ title: 'Mutation result', detail: '' }),
      terminalSurvival: () => ({ title: 'Survival result', detail: '' }),
      terminalClassic: () => ({ title: 'Classic result', detail: '' }),
      selectedPuzzle: (name) => `Selected puzzle: ${name}`,
      puzzleBoard: (name) => `${name} board outline`,
      startPuzzle: (name) => `Start ${name}`,
      puzzleList: (count) => `${count} open puzzle routes`,
      puzzleCategory: (category, count) => `${category}, ${count} levels`,
      masteryThreshold: (technique, prerequisite, required, best) => best === null
        ? `Finish “${prerequisite}” in ${required} moves or fewer to master “${technique}”.`
        : best <= required
          ? `“${technique}” mastered in “${prerequisite}” with ${best} moves.`
          : `Current “${prerequisite}” best: ${best}; reach ${required} moves to master “${technique}”.`,
      rowBand: (rows) => `${rows}-row puzzle`,
      levelNode: (index, name, rows, complete, unlocked, best) => `${index} ${name}, ${rows}-row puzzle${complete ? ', completed' : unlocked ? ', ready' : ', locked'}${best !== null ? `, best ${best} moves` : ''}`,
      boardLabel: 'TetraMorph 10 by 20 game board',
      eventLinesCleared: (count) => `${count} lines cleared.`,
      eventBedrockRaised: (height) => `Bedrock rose to ${height} rows.`,
      eventBedrockLowered: (height) => `Bedrock fell to ${height} rows.`,
      eventItemTriggered: (item) => `${item} activated for 10 seconds.`,
      mutationTimer: (item, seconds) => `${item}: ${seconds}s`,
      mutationPreview: (piece, item) => `${piece} piece carrying ${item}`,
      puzzleLesson: (technique) => ({
        'complete-row': { title: 'Finish one row first', body: 'Close the nearest prepared row; the clear creates room for every choice after it.' },
        'preserve-well': { title: 'Keep the well open', body: 'Do not cap a narrow channel before the matching long or vertical body arrives.' },
        'build-support': { title: 'Build support first', body: 'Level the support before capping it; an unsupported cap buries a hole.' },
        'avoid-hole': { title: 'Do not bury space', body: 'Check below the piece before locking; a covered cell usually costs several later clears.' },
        'read-queue': { title: 'Plan both pieces', body: 'Choose piece 2’s opening first, then use piece 1 to preserve its support and entry.' },
        'retain-opening': { title: 'Flatten, keep an entry', body: 'Reduce height without sealing the only route into the remaining target space.' },
        'anchor-geometry': { title: 'Anchors do not clear', body: 'Treat the anchor as a fixed wall; clear original blocks around it, not the anchor itself.' },
        'anchor-side-slip': { title: 'Side-slip past the anchor', body: 'Soft-drop beside the anchor, then move immediately into a landing a straight drop cannot reach.' },
      })[technique],
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
