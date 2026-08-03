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
    /** Raised-cell facet blended from primary/deep so carrier faces stay legible on navy. */
    facet: number;
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
    /** Shared vector field values, resolved in board-cell units. */
    fieldAlpha: number;
    edgeGlow: number;
    distortion: number;
    /** Ice's upper-edge vector gradient profile; it never recolors the full board. */
    frost?: {
      noiseScale: number;
      edgeStrength: number;
      noise: number;
    };
    /** Supergravity's reusable generated-map Pixi displacement field. */
    displacement?: {
      strength: number;
      speed: number;
    };
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
    loopHz: number | null;
    loopGain: number;
    endHz: number | null;
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

/** Retained as a hard ceiling for renderer diagnostics; Phase 10 uses vector-local fields. */
export const MUTATION_MAX_ACTIVE_FILTERS = 2;

export const MUTATION_VFX_TOKENS: Record<MutationItem, MutationVfxToken> = {
  freeze: {
    palette: { primary: 0x8debff, highlight: 0xd9f7ff, deep: 0x287b99, facet: 0x65bed6, glow: 0xbaf2ff },
    particles: { burst: 18, drift: 12, lifeMs: 920, speed: 0.058, size: 0.28 },
    shader: {
      fieldAlpha: 0.18,
      edgeGlow: 0.82,
      distortion: 0.06,
      frost: { noiseScale: 0.8, edgeStrength: 1.5, noise: 0.035 },
    },
    animation: { enterMs: 320, pulseMs: 800, exitMs: 680, activationMs: 320 },
    audio: { activateHz: 659.25, accentHz: 783.99, waveform: 'triangle', gain: 0.08, loopHz: null, loopGain: 0, endHz: null },
  },
  collapse: {
    palette: { primary: 0x9b6cff, highlight: 0xd8b4fe, deep: 0x35145f, facet: 0x7249bf, glow: 0xc396ff },
    particles: { burst: 16, drift: 18, lifeMs: 560, speed: 0.082, size: 0.24 },
    shader: {
      fieldAlpha: 0.16,
      edgeGlow: 0.76,
      distortion: 0.14,
      displacement: { strength: 0.015, speed: 0.8 },
    },
    animation: { enterMs: 120, pulseMs: 100, exitMs: 300, activationMs: 220 },
    audio: { activateHz: 148, accentHz: 93, waveform: 'triangle', gain: 0.13, loopHz: 73.42, loopGain: 0.022, endHz: 196 },
  },
  bomb: {
    palette: { primary: 0xff6b35, highlight: 0xffe8a3, deep: 0x5a1a20, facet: 0xbd4b2d, glow: 0xffb347 },
    particles: { burst: 72, drift: 18, lifeMs: 900, speed: 0.16, size: 0.34 },
    shader: { fieldAlpha: 0.26, edgeGlow: 0.96, distortion: 0.22 },
    animation: { enterMs: 120, pulseMs: 100, exitMs: 320, activationMs: 620 },
    audio: { activateHz: 74, accentHz: 111, waveform: 'triangle', gain: 0.16, loopHz: null, loopGain: 0, endHz: null },
  },
  multiplier: {
    palette: { primary: 0xffd166, highlight: 0xfff2b2, deep: 0x8d5b10, facet: 0xd1a244, glow: 0xffe29a },
    particles: { burst: 28, drift: 18, lifeMs: 620, speed: 0.092, size: 0.3 },
    shader: { fieldAlpha: 0.2, edgeGlow: 0.9, distortion: 0.04 },
    animation: { enterMs: 180, pulseMs: 520, exitMs: 360, activationMs: 320 },
    audio: { activateHz: 523.25, accentHz: 659.25, waveform: 'sine', gain: 0.13, loopHz: null, loopGain: 0, endHz: null },
  },
  reshape: {
    palette: { primary: 0x54e0b3, highlight: 0xc9ffec, deep: 0x135844, facet: 0x2dac84, glow: 0x8ff5d2 },
    particles: { burst: 20, drift: 8, lifeMs: 480, speed: 0.074, size: 0.24 },
    shader: { fieldAlpha: 0.16, edgeGlow: 0.84, distortion: 0.03 },
    animation: { enterMs: 140, pulseMs: 140, exitMs: 300, activationMs: 420 },
    audio: { activateHz: 440, accentHz: 659.25, waveform: 'sine', gain: 0.1, loopHz: null, loopGain: 0, endHz: null },
  },
};

export function mutationVfxToken(item: MutationItem): MutationVfxToken {
  return MUTATION_VFX_TOKENS[item];
}
