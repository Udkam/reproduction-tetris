import { describe, expect, it } from 'vitest';
import {
  MUTATION_MAX_ACTIVE_FILTERS,
  MUTATION_MAX_EFFECT_PLANES,
  MUTATION_PARTICLE_LIMIT,
  MUTATION_VFX_TOKENS,
} from './mutationTokens';

describe('mutation VFX token contract', () => {
  it('keeps the four visual families distinct and within the renderer budget', () => {
    expect(MUTATION_PARTICLE_LIMIT).toBe(120);
    expect(MUTATION_MAX_EFFECT_PLANES).toBe(2);
    expect(MUTATION_MAX_ACTIVE_FILTERS).toBe(2);
    expect(MUTATION_VFX_TOKENS.freeze.palette.primary).toBe(0x8debff);
    expect(MUTATION_VFX_TOKENS.freeze.palette.facet).toBe(0x65bed6);
    expect(MUTATION_VFX_TOKENS.collapse.palette.primary).toBe(0x9b6cff);
    expect(MUTATION_VFX_TOKENS.collapse.palette.facet).toBe(0x7249bf);
    expect(MUTATION_VFX_TOKENS.bomb.palette.primary).toBe(0xff6b35);
    expect(MUTATION_VFX_TOKENS.bomb.palette.facet).toBe(0xbd4b2d);
    expect(MUTATION_VFX_TOKENS.multiplier.palette.primary).toBe(0xffd166);
    expect(MUTATION_VFX_TOKENS.multiplier.palette.facet).toBe(0xd1a244);
    expect(new Set(Object.values(MUTATION_VFX_TOKENS).map((token) => token.palette.primary)).size).toBe(4);
  });

  it('defines the required readable bomb and timed-state durations without changing Core ticks', () => {
    expect(MUTATION_VFX_TOKENS.bomb.animation.activationMs).toBe(900);
    expect(MUTATION_VFX_TOKENS.freeze.animation.enterMs).toBe(500);
    expect(MUTATION_VFX_TOKENS.freeze.animation.pulseMs).toBe(800);
    expect(MUTATION_VFX_TOKENS.freeze.animation.exitMs).toBe(1000);
  });

  it('keeps the two reusable board-filter profiles explicit and bounded', () => {
    expect(MUTATION_VFX_TOKENS.freeze.shader.frost).toEqual({
      noiseScale: 0.8,
      edgeStrength: 1.5,
      noise: 0.035,
    });
    expect(MUTATION_VFX_TOKENS.collapse.shader.displacement).toEqual({
      strength: 0.015,
      speed: 0.8,
    });
  });
});
