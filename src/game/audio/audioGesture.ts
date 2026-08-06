export type AudioBus = 'gameplay' | 'reward' | 'mutation' | 'ambient' | 'ui';

interface GestureLayerBase {
  delay?: number;
  duration: number;
  gain: number;
  attack?: number;
}

export interface ResonatorLayer extends GestureLayerBase {
  kind: 'resonator';
  frequency: number;
  endFrequency?: number;
  waveform?: OscillatorType;
}

export interface AirLayer extends GestureLayerBase {
  kind: 'air';
  filter: BiquadFilterType;
  startFrequency: number;
  endFrequency?: number;
  q?: number;
  seed?: number;
  /** A long attack turns a noise impulse into a pressure build. */
  release?: number;
}

export type GestureLayer = ResonatorLayer | AirLayer;

export interface AudioGesture {
  bus: AudioBus;
  layers: readonly GestureLayer[];
  mutationOwned?: boolean;
}

export interface GestureVoice {
  source: AudioScheduledSourceNode;
  gain: GainNode;
  stop(at?: number): void;
  disconnect(): void;
}

export interface ScheduleGestureOptions {
  startAt?: number;
  maxVoices?: number;
  onVoiceStart?: (voice: GestureVoice) => void;
  onVoiceEnd?: (voice: GestureVoice) => void;
}

const SILENCE = 0.0001;

function deterministicNoise(target: Float32Array, seed: number): void {
  let state = (seed >>> 0) || 0x6d2b79f5;
  for (let index = 0; index < target.length; index += 1) {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    target[index] = (((value ^ (value >>> 14)) >>> 0) / 2147483648) - 1;
  }
}

function scheduleEnvelope(
  gain: AudioParam,
  start: number,
  duration: number,
  peak: number,
  attack = 0.004,
  release = 1,
): void {
  const end = start + duration;
  const attackEnd = Math.min(end - 0.003, start + Math.max(0.002, Math.min(attack, duration * 0.82)));
  const releaseStart = Math.min(
    end - 0.002,
    Math.max(attackEnd + 0.001, start + duration * Math.max(0.12, Math.min(0.96, release))),
  );
  gain.setValueAtTime(SILENCE, start);
  gain.exponentialRampToValueAtTime(Math.max(SILENCE, peak), attackEnd);
  if (releaseStart > attackEnd + 0.0005) {
    gain.exponentialRampToValueAtTime(Math.max(SILENCE, peak * 0.72), releaseStart);
  }
  gain.exponentialRampToValueAtTime(SILENCE, end);
}

function makeVoice(
  source: AudioScheduledSourceNode,
  gain: GainNode,
  nodes: readonly AudioNode[],
  onEnd?: (voice: GestureVoice) => void,
): GestureVoice {
  let disconnected = false;
  const voice: GestureVoice = {
    source,
    gain,
    stop(at = 0): void {
      try { source.stop(at); } catch { /* The short voice may already have ended. */ }
    },
    disconnect(): void {
      if (disconnected) return;
      disconnected = true;
      source.disconnect();
      for (const node of nodes) node.disconnect();
    },
  };
  source.onended = () => {
    voice.disconnect();
    onEnd?.(voice);
  };
  return voice;
}

function scheduleResonator(
  context: BaseAudioContext,
  destination: AudioNode,
  layer: ResonatorLayer,
  baseStart: number,
  onEnd?: (voice: GestureVoice) => void,
): GestureVoice {
  const start = baseStart + (layer.delay ?? 0);
  const end = start + layer.duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = layer.waveform ?? 'sine';
  oscillator.frequency.setValueAtTime(Math.max(1, layer.frequency), start);
  if (layer.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, layer.endFrequency), end);
  }
  scheduleEnvelope(gain.gain, start, layer.duration, layer.gain, layer.attack, 0.18);
  oscillator.connect(gain);
  gain.connect(destination);
  const voice = makeVoice(oscillator, gain, [gain], onEnd);
  oscillator.start(start);
  oscillator.stop(end + 0.008);
  return voice;
}

function scheduleAir(
  context: BaseAudioContext,
  destination: AudioNode,
  layer: AirLayer,
  baseStart: number,
  onEnd?: (voice: GestureVoice) => void,
): GestureVoice {
  const start = baseStart + (layer.delay ?? 0);
  const end = start + layer.duration;
  const frameCount = Math.max(1, Math.round(context.sampleRate * layer.duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  deterministicNoise(buffer.getChannelData(0), layer.seed ?? 0x74657472);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = layer.filter;
  filter.frequency.setValueAtTime(Math.max(1, layer.startFrequency), start);
  if (layer.endFrequency) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, layer.endFrequency), end);
  }
  filter.Q.setValueAtTime(layer.q ?? 0.78, start);
  scheduleEnvelope(gain.gain, start, layer.duration, layer.gain, layer.attack, layer.release ?? 0.3);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  const voice = makeVoice(source, gain, [filter, gain], onEnd);
  source.start(start);
  source.stop(end + 0.008);
  return voice;
}

export function scheduleGesture(
  context: BaseAudioContext,
  destination: AudioNode,
  gesture: AudioGesture,
  options: ScheduleGestureOptions = {},
): GestureVoice[] {
  const startAt = options.startAt ?? context.currentTime;
  const maxVoices = Math.max(0, options.maxVoices ?? gesture.layers.length);
  const voices: GestureVoice[] = [];
  for (const layer of gesture.layers.slice(0, maxVoices)) {
    const voice = layer.kind === 'resonator'
      ? scheduleResonator(context, destination, layer, startAt, options.onVoiceEnd)
      : scheduleAir(context, destination, layer, startAt, options.onVoiceEnd);
    voices.push(voice);
    options.onVoiceStart?.(voice);
  }
  return voices;
}

export function gestureDuration(gesture: AudioGesture): number {
  return gesture.layers.reduce((longest, layer) => (
    Math.max(longest, (layer.delay ?? 0) + layer.duration)
  ), 0);
}
