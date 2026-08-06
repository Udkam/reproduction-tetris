import type { AudioBus, AudioGesture, GestureLayer } from './audioGesture';

export type AudioCueId =
  | 'move' | 'rotate' | 'soft-drop' | 'hard-drop' | 'lock' | 'puzzle-undo'
  | 'clear-1' | 'clear-2' | 'clear-3' | 'clear-4'
  | 'bedrock-rise' | 'bedrock-lower' | 'stone-warning' | 'stone-spawn' | 'stone-land'
  | 'level-up' | 'finished' | 'game-over' | 'pause' | 'resume'
  | 'countdown-tick' | 'countdown-resolve'
  | 'freeze' | 'supergravity' | 'bomb' | 'multiplier-2' | 'multiplier-4';

const resonance = (
  frequency: number,
  duration: number,
  gain: number,
  delay = 0,
  endFrequency?: number,
  waveform: OscillatorType = 'sine',
): GestureLayer => ({
  kind: 'resonator', frequency, duration, gain, delay, endFrequency, waveform,
  attack: Math.min(0.009, duration * 0.12),
});

const air = (
  startFrequency: number,
  endFrequency: number,
  duration: number,
  gain: number,
  delay = 0,
  filter: BiquadFilterType = 'bandpass',
  seed = 0x74657472,
  attack = 0.003,
  release = 0.3,
): GestureLayer => ({
  kind: 'air', filter, startFrequency, endFrequency, duration, gain, delay,
  seed, attack, release, q: filter === 'bandpass' ? 1.15 : 0.72,
});

const gesture = (bus: AudioBus, layers: readonly GestureLayer[], mutationOwned = false): AudioGesture => ({
  bus,
  layers,
  mutationOwned,
});

const CONTROL_CUES: Readonly<Record<'move' | 'rotate' | 'soft-drop', AudioGesture>> = {
  move: gesture('gameplay', [
    air(1_520, 760, 0.019, 0.0042, 0, 'bandpass', 0x11),
    resonance(176, 0.038, 0.014, 0.001, 158, 'triangle'),
    resonance(485, 0.024, 0.0055, 0.003, 454),
  ]),
  rotate: gesture('gameplay', [
    air(690, 2_050, 0.058, 0.008, 0, 'bandpass', 0x12, 0.007, 0.68),
    resonance(211, 0.057, 0.017, 0.002, 238, 'triangle'),
    resonance(581, 0.036, 0.0065, 0.012, 622),
  ]),
  'soft-drop': gesture('gameplay', [
    air(1_080, 430, 0.036, 0.0065, 0, 'bandpass', 0x13),
    resonance(131, 0.029, 0.009, 0.001, 108, 'triangle'),
  ]),
};

const CONTACT_CUES: Readonly<Record<'hard-drop' | 'lock', AudioGesture>> = {
  lock: gesture('gameplay', [
    resonance(86, 0.105, 0.032, 0, 64),
    resonance(237, 0.062, 0.012, 0.004, 206, 'triangle'),
    air(310, 145, 0.037, 0.008, 0.002, 'lowpass', 0x21),
  ]),
  'hard-drop': gesture('gameplay', [
    resonance(58, 0.18, 0.062, 0, 42),
    resonance(158, 0.095, 0.024, 0.003, 126, 'triangle'),
    air(390, 125, 0.082, 0.017, 0.001, 'lowpass', 0x22),
    resonance(431, 0.058, 0.009, 0.012, 389),
  ]),
};

const CLEAR_CUES: Readonly<Record<'clear-1' | 'clear-2' | 'clear-3' | 'clear-4', AudioGesture>> = {
  'clear-1': gesture('reward', [
    air(860, 1_820, 0.12, 0.015, 0, 'bandpass', 0x31, 0.012, 0.62),
    resonance(282, 0.16, 0.037, 0.004, 260),
    resonance(777, 0.09, 0.013, 0.012, 724),
  ]),
  'clear-2': gesture('reward', [
    air(720, 2_050, 0.17, 0.019, 0, 'bandpass', 0x32, 0.015, 0.66),
    resonance(246, 0.2, 0.042, 0.003, 224),
    resonance(678, 0.13, 0.016, 0.012, 615),
    resonance(329, 0.17, 0.031, 0.065, 302, 'triangle'),
    resonance(907, 0.095, 0.011, 0.076, 842),
  ]),
  'clear-3': gesture('reward', [
    air(560, 2_350, 0.27, 0.023, 0, 'bandpass', 0x33, 0.025, 0.7),
    resonance(174, 0.31, 0.049, 0.002, 151),
    resonance(480, 0.2, 0.019, 0.014, 431),
    resonance(941, 0.12, 0.012, 0.03, 872),
    resonance(253, 0.24, 0.036, 0.09, 229, 'triangle'),
    resonance(697, 0.14, 0.014, 0.105, 641),
  ]),
  'clear-4': gesture('reward', [
    air(190, 1_180, 0.58, 0.028, 0, 'bandpass', 0x34, 0.16, 0.84),
    resonance(48, 0.78, 0.083, 0.02, 36),
    resonance(232, 0.52, 0.048, 0.055, 204, 'triangle'),
    resonance(639, 0.38, 0.024, 0.095, 573),
    resonance(1_254, 0.22, 0.013, 0.15, 1_098),
    air(2_400, 880, 0.34, 0.017, 0.22, 'bandpass', 0x35, 0.04, 0.58),
  ]),
};

const MUTATION_CUES: Readonly<Record<'freeze' | 'supergravity' | 'bomb' | 'multiplier-2' | 'multiplier-4', AudioGesture>> = {
  freeze: gesture('mutation', [
    air(2_700, 780, 0.46, 0.025, 0, 'bandpass', 0x41, 0.055, 0.72),
    resonance(1_106, 0.12, 0.024, 0.025, 984),
    resonance(1_617, 0.09, 0.016, 0.1, 1_469),
    resonance(887, 0.14, 0.02, 0.18, 803),
    air(3_100, 1_400, 0.12, 0.012, 0.24, 'highpass', 0x42),
  ], true),
  supergravity: gesture('mutation', [
    air(340, 82, 0.42, 0.025, 0, 'lowpass', 0x43, 0.035, 0.7),
    resonance(118, 0.48, 0.086, 0.008, 38),
    resonance(326, 0.3, 0.031, 0.025, 102, 'triangle'),
    resonance(71, 0.22, 0.045, 0.16, 43),
  ], true),
  bomb: gesture('mutation', [
    air(120, 660, 0.27, 0.028, 0, 'lowpass', 0x44, 0.2, 0.9),
    resonance(62, 0.28, 0.095, 0.235, 42),
    air(1_700, 390, 0.19, 0.04, 0.235, 'highpass', 0x45, 0.002, 0.22),
    resonance(211, 0.17, 0.027, 0.245, 164, 'triangle'),
  ], true),
  'multiplier-2': gesture('mutation', [
    air(1_150, 1_900, 0.16, 0.012, 0, 'bandpass', 0x46, 0.018, 0.68),
    resonance(361, 0.19, 0.041, 0.006, 337, 'triangle'),
    resonance(995, 0.11, 0.016, 0.016, 913),
    resonance(423, 0.17, 0.033, 0.075, 396, 'triangle'),
  ], true),
  'multiplier-4': gesture('mutation', [
    air(980, 2_300, 0.25, 0.017, 0, 'bandpass', 0x47, 0.03, 0.72),
    resonance(338, 0.22, 0.043, 0.004, 312, 'triangle'),
    resonance(931, 0.13, 0.017, 0.015, 857),
    resonance(404, 0.2, 0.037, 0.07, 376, 'triangle'),
    resonance(1_114, 0.12, 0.015, 0.082, 1_032),
    resonance(476, 0.18, 0.031, 0.14, 448, 'triangle'),
  ], true),
};

const SECONDARY_CUES: Readonly<Record<Exclude<AudioCueId,
  keyof typeof CONTROL_CUES | keyof typeof CONTACT_CUES | keyof typeof CLEAR_CUES | keyof typeof MUTATION_CUES
>, AudioGesture>> = {
  'puzzle-undo': gesture('ui', [
    air(1_250, 480, 0.12, 0.011, 0, 'bandpass', 0x51),
    resonance(318, 0.13, 0.025, 0.004, 211, 'triangle'),
  ]),
  'bedrock-rise': gesture('gameplay', [
    air(180, 390, 0.72, 0.019, 0, 'lowpass', 0x52, 0.16, 0.8),
    resonance(67, 0.78, 0.052, 0.015, 93),
    resonance(184, 0.46, 0.018, 0.08, 229, 'triangle'),
  ]),
  'bedrock-lower': gesture('gameplay', [
    air(360, 135, 0.58, 0.016, 0, 'lowpass', 0x53, 0.06, 0.62),
    resonance(91, 0.62, 0.045, 0.012, 58),
    resonance(251, 0.34, 0.015, 0.045, 172, 'triangle'),
  ]),
  'stone-warning': gesture('ui', [
    resonance(151, 0.09, 0.026, 0, 132, 'triangle'),
    air(580, 280, 0.055, 0.008, 0.003, 'bandpass', 0x54),
    resonance(151, 0.09, 0.023, 0.16, 132, 'triangle'),
  ]),
  'stone-spawn': gesture('gameplay', [
    air(1_350, 290, 0.15, 0.015, 0, 'bandpass', 0x55),
    resonance(203, 0.15, 0.025, 0.006, 124, 'triangle'),
  ]),
  'stone-land': gesture('gameplay', [
    resonance(64, 0.2, 0.07, 0, 43),
    resonance(176, 0.1, 0.025, 0.004, 131, 'triangle'),
    air(420, 110, 0.09, 0.021, 0.002, 'lowpass', 0x56),
  ]),
  'level-up': gesture('reward', [
    air(440, 2_100, 0.34, 0.023, 0, 'bandpass', 0x57, 0.06, 0.76),
    resonance(197, 0.34, 0.05, 0.01, 223),
    resonance(543, 0.22, 0.02, 0.05, 618),
    resonance(307, 0.28, 0.037, 0.12, 349, 'triangle'),
  ]),
  finished: gesture('reward', [
    air(380, 2_600, 0.56, 0.028, 0, 'bandpass', 0x58, 0.09, 0.82),
    resonance(152, 0.58, 0.061, 0.01, 176),
    resonance(419, 0.38, 0.026, 0.055, 476),
    resonance(257, 0.42, 0.045, 0.14, 294, 'triangle'),
    resonance(708, 0.24, 0.018, 0.17, 814),
  ]),
  'game-over': gesture('reward', [
    air(760, 170, 0.42, 0.019, 0, 'lowpass', 0x59, 0.05, 0.7),
    resonance(164, 0.42, 0.046, 0.01, 108, 'triangle'),
    resonance(452, 0.24, 0.016, 0.025, 302),
  ]),
  pause: gesture('ui', [
    air(620, 250, 0.1, 0.007, 0, 'bandpass', 0x5a),
    resonance(203, 0.11, 0.019, 0.003, 174, 'triangle'),
  ]),
  resume: gesture('ui', [
    air(270, 780, 0.11, 0.0075, 0, 'bandpass', 0x5b, 0.015, 0.7),
    resonance(181, 0.12, 0.02, 0.003, 219, 'triangle'),
  ]),
  'countdown-tick': gesture('ui', [
    air(1_050, 630, 0.055, 0.008, 0, 'bandpass', 0x5c),
    resonance(188, 0.115, 0.041, 0.002, 176, 'triangle'),
    resonance(518, 0.06, 0.012, 0.005, 477),
  ]),
  'countdown-resolve': gesture('ui', [
    air(720, 1_850, 0.16, 0.012, 0, 'bandpass', 0x5d, 0.025, 0.72),
    resonance(224, 0.24, 0.052, 0.003, 211, 'triangle'),
    resonance(617, 0.14, 0.018, 0.01, 572),
  ]),
};

const PALETTE: Readonly<Record<AudioCueId, AudioGesture>> = {
  ...CONTROL_CUES,
  ...CONTACT_CUES,
  ...CLEAR_CUES,
  ...MUTATION_CUES,
  ...SECONDARY_CUES,
};

export const AUDIO_CUE_IDS = Object.freeze(Object.keys(PALETTE) as AudioCueId[]);

export function audioCue(id: AudioCueId): AudioGesture {
  return PALETTE[id];
}

export function cueEnergy(id: AudioCueId): number {
  return audioCue(id).layers.reduce((total, layer) => total + layer.gain * layer.duration, 0);
}
