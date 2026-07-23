import { PIECE_TYPES, type PieceType, type RandomizerState } from './types';

function nextSeed(seed: number): number {
  let value = seed >>> 0;
  if (value === 0) value = 0x6d2b79f5;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

/**
 * Draws a deterministic scalar without disturbing the seven-bag itself. The fourth
 * mode uses this only for optional carrier scheduling; all modes keep their normal
 * bag guarantees.
 */
export function drawRandom(randomizer: RandomizerState): { value: number; randomizer: RandomizerState } {
  const seed = nextSeed(randomizer.seed);
  return {
    value: seed / 0x1_0000_0000,
    randomizer: { seed, bag: [...randomizer.bag] },
  };
}

export function createRandomizer(seed: number): RandomizerState {
  return { seed: seed >>> 0 || 0x6d2b79f5, bag: [] };
}

function shuffledBag(seed: number): { seed: number; bag: PieceType[] } {
  const bag = [...PIECE_TYPES];
  let next = seed;
  for (let index = bag.length - 1; index > 0; index -= 1) {
    next = nextSeed(next);
    const swapIndex = next % (index + 1);
    [bag[index], bag[swapIndex]] = [bag[swapIndex]!, bag[index]!];
  }
  return { seed: next, bag };
}

export function drawPiece(randomizer: RandomizerState): { piece: PieceType; randomizer: RandomizerState } {
  let bag = [...randomizer.bag];
  let seed = randomizer.seed;
  if (bag.length === 0) {
    const nextBag = shuffledBag(seed);
    bag = nextBag.bag;
    seed = nextBag.seed;
  }
  const piece = bag.shift();
  if (!piece) throw new Error('The deterministic bag was unexpectedly empty.');
  return { piece, randomizer: { seed, bag } };
}
