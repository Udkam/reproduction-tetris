import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const repository = path.resolve(import.meta.dirname, '../../../..');
const output = path.resolve(import.meta.dirname, 'mutation-scenarios.json');
const server = await createServer({
  root: repository,
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
});

const commandForAction = (action) => {
  if (action === 'left') return { type: 'move', dx: -1 };
  if (action === 'right') return { type: 'move', dx: 1 };
  if (action === 'rotate-cw') return { type: 'rotate', direction: 1 };
  if (action === 'hard-drop') return { type: 'hard-drop' };
  throw new Error(`Unsupported search action: ${action}`);
};

try {
  const core = await server.ssrLoadModule('/src/game/core/index.ts');
  const items = ['freeze', 'collapse', 'bomb', 'multiplier', 'reshape'];

  const applyActions = (state, actions) => {
    let current = state;
    const events = [];
    for (const action of actions) {
      const transition = core.dispatch(current, commandForAction(action));
      current = transition.state;
      events.push(...transition.events);
    }
    return { state: current, events };
  };

  const advanceToActive = (state) => {
    let current = state;
    const events = [];
    for (let tick = 0; tick < 90 && current.active === null && current.status === 'playing'; tick += 1) {
      const transition = core.dispatch(current, { type: 'tick' });
      current = transition.state;
      events.push(...transition.events);
    }
    return { state: current, events };
  };

  const placements = (state) => {
    const candidates = [];
    const seen = new Set();
    for (let rotations = 0; rotations < 4; rotations += 1) {
      const rotated = applyActions(state, Array.from({ length: rotations }, () => 'rotate-cw')).state;
      let leftmost = rotated;
      let leftMoves = 0;
      for (let guard = 0; guard < 12; guard += 1) {
        const moved = core.dispatch(leftmost, { type: 'move', dx: -1 }).state;
        if (moved.active?.x === leftmost.active?.x) break;
        leftmost = moved;
        leftMoves += 1;
      }

      let positioned = leftmost;
      for (let rightMoves = 0; rightMoves < 12; rightMoves += 1) {
        const key = `${positioned.active?.rotation}:${positioned.active?.x}`;
        if (!seen.has(key)) {
          seen.add(key);
          candidates.push({
            state: positioned,
            actions: [
              ...Array.from({ length: rotations }, () => 'rotate-cw'),
              ...Array.from({ length: leftMoves }, () => 'left'),
              ...Array.from({ length: rightMoves }, () => 'right'),
              'hard-drop',
            ],
          });
        }
        const moved = core.dispatch(positioned, { type: 'move', dx: 1 }).state;
        if (moved.active?.x === positioned.active?.x) break;
        positioned = moved;
      }
    }
    return candidates;
  };

  const lockPlacement = (candidate) => {
    const locked = applyActions(candidate.state, ['hard-drop']);
    const spawned = advanceToActive(locked.state);
    return {
      state: spawned.state,
      events: [...locked.events, ...spawned.events],
    };
  };

  const scenarios = {};
  const candidateByItemAndPieces = new Map();
  for (let seed = 1; seed <= 4_096; seed += 1) {
    const initial = core.createInitialState(seed, 'sprint');
    const started = core.dispatch(initial, { type: 'start' }).state;
    const afterFirst = lockPlacement({ state: started, actions: ['hard-drop'] });
    const afterSecond = lockPlacement({ state: afterFirst.state, actions: ['hard-drop'] });
    const item = afterSecond.state.mutationActiveCarrier?.item ?? null;
    if (!item || afterSecond.state.active === null) continue;
    const pieces = [started.active?.type, afterFirst.state.active?.type, afterSecond.state.active?.type];
    const key = `${item}:${pieces.join('')}`;
    if (!candidateByItemAndPieces.has(key)) candidateByItemAndPieces.set(key, { seed, item, pieces });
  }

  for (const candidate of candidateByItemAndPieces.values()) {
    if (scenarios[candidate.item]) continue;
    const initial = core.createInitialState(candidate.seed, 'sprint');
    const started = core.dispatch(initial, { type: 'start' }).state;
    const firstPlacements = placements(started);
    for (const first of firstPlacements) {
      const afterFirst = lockPlacement(first);
      if (afterFirst.state.status !== 'playing' || afterFirst.state.active === null) continue;
      for (const second of placements(afterFirst.state)) {
        const afterSecond = lockPlacement(second);
        const item = afterSecond.state.mutationActiveCarrier?.item ?? null;
        if (item !== candidate.item || scenarios[item] || afterSecond.state.active === null) continue;
        for (const third of placements(afterSecond.state)) {
          const lockedThird = applyActions(third.state, ['hard-drop']);
          const resolvedThird = advanceToActive(lockedThird.state);
          const activation = [...lockedThird.events, ...resolvedThird.events]
            .find((event) => event.type === 'mutation-activated' && event.item === item);
          if (!activation) continue;
          scenarios[item] = {
            seed: candidate.seed,
            pieces: [started.active?.type, afterFirst.state.active?.type, afterSecond.state.active?.type],
            actions: [first.actions, second.actions, third.actions],
            activation: {
              durationTicks: activation.durationTicks,
              score: activation.score,
              rowsRemoved: activation.rowsRemoved,
            },
          };
          process.stdout.write(`found ${item} seed=${candidate.seed}\n`);
          break;
        }
      }
    }
    if (Object.keys(scenarios).length === items.length) break;
  }

  const missing = items.filter((item) => !scenarios[item]);
  if (missing.length > 0) throw new Error(`No three-piece activation scenario for: ${missing.join(', ')}`);
  fs.writeFileSync(output, `${JSON.stringify(scenarios, null, 2)}\n`, 'utf8');
} finally {
  await server.close();
}
