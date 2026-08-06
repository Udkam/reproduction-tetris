import { describe, expect, it } from 'vitest';
import { AUDIO_CUE_IDS, audioCue, cueEnergy, type AudioCueId } from './audioPalette';
import { gestureDuration } from './audioGesture';

describe('T35 material gesture palette', () => {
  it('defines a bounded, finite recipe for every public cue', () => {
    expect(AUDIO_CUE_IDS).toHaveLength(27);
    for (const id of AUDIO_CUE_IDS) {
      const cue = audioCue(id);
      expect(cue.layers.length, id).toBeGreaterThan(0);
      expect(cue.layers.length, id).toBeLessThanOrEqual(6);
      expect(gestureDuration(cue), id).toBeGreaterThan(0);
      expect(gestureDuration(cue), id).toBeLessThanOrEqual(0.8);
      for (const layer of cue.layers) {
        expect(Number.isFinite(layer.duration), id).toBe(true);
        expect(Number.isFinite(layer.gain), id).toBe(true);
        expect(layer.duration, id).toBeGreaterThan(0);
        expect(layer.gain, id).toBeGreaterThan(0);
      }
    }
  });

  it('keeps rapid controls concise and below physical contact', () => {
    for (const id of ['move', 'rotate', 'soft-drop'] satisfies AudioCueId[]) {
      expect(gestureDuration(audioCue(id)), id).toBeLessThan(0.1);
      expect(cueEnergy(id), id).toBeLessThan(cueEnergy('lock'));
    }
    expect(cueEnergy('lock')).toBeLessThan(cueEnergy('hard-drop'));
  });

  it('escalates clears by both energy and temporal width without chord-count coupling', () => {
    const ids = ['clear-1', 'clear-2', 'clear-3', 'clear-4'] satisfies AudioCueId[];
    const energies = ids.map(cueEnergy);
    const durations = ids.map((id) => gestureDuration(audioCue(id)));
    expect(energies[0]).toBeLessThan(energies[1] ?? 0);
    expect(energies[1]).toBeLessThan(energies[2] ?? 0);
    expect(energies[2]).toBeLessThan(energies[3] ?? 0);
    expect(durations).toEqual([...durations].sort((left, right) => left - right));
    expect(new Set(ids.map((id) => audioCue(id).layers.length)).size).toBeGreaterThan(1);
  });

  it('gives each Mutation a distinct material fingerprint and no sustained layer', () => {
    const mutationIds = ['freeze', 'supergravity', 'bomb', 'multiplier-2', 'multiplier-4'] satisfies AudioCueId[];
    const signatures = mutationIds.map((id) => audioCue(id).layers.map((layer) => (
      layer.kind === 'air'
        ? `air:${layer.filter}:${layer.startFrequency}:${layer.endFrequency}`
        : `mode:${layer.frequency}:${layer.endFrequency}`
    )).join('|'));
    expect(new Set(signatures).size).toBe(mutationIds.length);
    for (const id of mutationIds) {
      expect(audioCue(id).mutationOwned).toBe(true);
      expect(gestureDuration(audioCue(id)), id).toBeLessThan(0.8);
    }
  });

  it('resolves the final countdown beat longer and more energetic than repeated ticks', () => {
    expect(gestureDuration(audioCue('countdown-resolve'))).toBeGreaterThan(gestureDuration(audioCue('countdown-tick')));
    expect(cueEnergy('countdown-resolve')).toBeGreaterThan(cueEnergy('countdown-tick'));
  });
});
