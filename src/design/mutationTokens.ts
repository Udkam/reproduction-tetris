import type { MutationItem } from '../game/core';

/**
 * T14 mutation-art contract.
 *
 * These values are intentionally renderer-facing only: Core still decides
 * which item appears, when it activates, and how long its game effect lasts.
 * Keeping the art/audio numbers here makes the four item families read as one
 * instrument instead of four unrelated recolours.
 */
export interface MutationVfxToken {
  palette: {
    primary: number;
    highlight: number;
    deep: number;
    glow: number;
  };
  particles: {
    burst: number;
    drift: number;
    lifeMs: number;
    speed: number;
    size: number;
  };
  shader: {
    /** Local vector-grade settings; no browser filter or second canvas. */
    fieldAlpha: number;
    edgeGlow: number;
    distortion: number;
  };
  animation: {
    enterMs: number;
    pulseMs: number;
    exitMs: number;
    activationMs: number;
  };
  audio: {
    activateHz: number;
    accentHz: number;
    waveform: OscillatorType;
    gain: number;
  };
}

/** The deep-space canvas grade shared by every mutation state. */
export const MUTATION_VFX_BACKGROUND = {
  well: 0x07111f,
  support: 0x10243a,
} as const;

/** Hard cap for the fixed renderer-side particle pool. */
export const MUTATION_PARTICLE_LIMIT = 120;

/** The board keeps one ordinary effects Graphics layer plus one mutation layer. */
export const MUTATION_MAX_EFFECT_PLANES = 2;

export const MUTATION_VFX_TOKENS: Record<MutationItem, MutationVfxToken> = {
  freeze: {
    palette: { primary: 0x8debff, highlight: 0xd9f7ff, deep: 0x287b99, glow: 0xbaf2ff },
    particles: { burst: 18, drift: 12, lifeMs: 920, speed: 0.058, size: 0.28 },
    shader: { fieldAlpha: 0.18, edgeGlow: 0.82, distortion: 0.06 },
    animation: { enterMs: 500, pulseMs: 800, exitMs: 1000, activationMs: 500 },
    audio: { activateHz: 659, accentHz: 783, waveform: 'triangle', gain: 0.11 },
  },
  collapse: {
    palette: { primary: 0x9b6cff, highlight: 0xd8b4fe, deep: 0x35145f, glow: 0xc396ff },
    particles: { burst: 16, drift: 18, lifeMs: 560, speed: 0.082, size: 0.24 },
    shader: { fieldAlpha: 0.16, edgeGlow: 0.76, distortion: 0.14 },
    animation: { enterMs: 180, pulseMs: 120, exitMs: 420, activationMs: 300 },
    audio: { activateHz: 148, accentHz: 93, waveform: 'triangle', gain: 0.13 },
  },
  bomb: {
    palette: { primary: 0xff6b35, highlight: 0xffe8a3, deep: 0x5a1a20, glow: 0xffb347 },
    particles: { burst: 72, drift: 18, lifeMs: 900, speed: 0.16, size: 0.34 },
    shader: { fieldAlpha: 0.26, edgeGlow: 0.96, distortion: 0.22 },
    animation: { enterMs: 200, pulseMs: 200, exitMs: 500, activationMs: 900 },
    audio: { activateHz: 74, accentHz: 111, waveform: 'triangle', gain: 0.16 },
  },
  multiplier: {
    palette: { primary: 0xffd166, highlight: 0xfff2b2, deep: 0x8d5b10, glow: 0xffe29a },
    particles: { burst: 28, drift: 18, lifeMs: 620, speed: 0.092, size: 0.3 },
    shader: { fieldAlpha: 0.2, edgeGlow: 0.9, distortion: 0.04 },
    animation: { enterMs: 260, pulseMs: 520, exitMs: 520, activationMs: 520 },
    audio: { activateHz: 523, accentHz: 659, waveform: 'sine', gain: 0.13 },
  },
};

export function mutationVfxToken(item: MutationItem): MutationVfxToken {
  return MUTATION_VFX_TOKENS[item];
}
