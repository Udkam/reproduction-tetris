import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { transformWithOxc } from 'vite';


const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(evidenceDir, '..', '..', '..');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).trim();
const sampleRate = 48_000;
const masterGain = 1.42;
const busLevels = { gameplay: 0.9, reward: 1, mutation: 0.96, ambient: 0.14, ui: 0.7 };

const suites = [
  {
    file: '01-controls-fast-repeat.wav',
    description: 'Rapid repeated movement, rotation, and soft-drop input; listen for separation without clicky fatigue.',
    cues: [
      ['move', 0.16], ['move', 0.24], ['move', 0.32], ['move', 0.40],
      ['rotate', 0.60], ['soft-drop', 0.86], ['soft-drop', 0.98],
      ['move', 1.18], ['rotate', 1.36],
    ],
  },
  {
    file: '02-contact-and-clear-hierarchy.wav',
    description: 'Contact and reward ladder from lock through four-row clear, level-up, and completion.',
    cues: [
      ['lock', 0.16], ['hard-drop', 0.58], ['clear-1', 1.05], ['clear-2', 1.78],
      ['clear-3', 2.62], ['clear-4', 3.56], ['level-up', 4.54], ['finished', 5.42],
    ],
  },
  {
    file: '03-mutation-signatures.wav',
    description: 'Short state signatures only: Freeze, Supergravity, Bomb, Double, and Super Double; no sustained loops.',
    cues: [
      ['freeze', 0.16], ['supergravity', 1.02], ['bomb', 1.88],
      ['multiplier-2', 2.78], ['multiplier-4', 3.52],
    ],
  },
  {
    file: '04-survival-and-ui.wav',
    description: 'Survival pressure and restrained interface feedback without an ambient bed.',
    cues: [
      ['stone-warning', 0.16], ['stone-spawn', 0.72], ['stone-land', 1.18],
      ['bedrock-rise', 1.72], ['bedrock-lower', 2.72], ['pause', 3.68],
      ['resume', 4.12], ['puzzle-undo', 4.62], ['game-over', 5.22],
    ],
  },
  {
    file: '05-countdown-three-pulse.wav',
    description: 'Exactly three related countdown pulses; the final pulse is longer and no cover-exit sound follows it.',
    cues: [
      ['countdown-tick', 0.20], ['countdown-tick', 1.20], ['countdown-resolve', 2.20],
    ],
    tailSeconds: 0.72,
  },
  {
    file: '06-interaction-mix.wav',
    description: 'Representative play cadence for masking, stacking, hierarchy, and peak-control review.',
    cues: [
      ['move', 0.16], ['move', 0.25], ['rotate', 0.39], ['soft-drop', 0.55],
      ['hard-drop', 0.78], ['clear-1', 1.18], ['move', 1.72], ['rotate', 1.86],
      ['hard-drop', 2.08], ['clear-2', 2.46], ['stone-warning', 3.12],
      ['stone-spawn', 3.48], ['stone-land', 3.82], ['freeze', 4.22],
      ['move', 4.82], ['hard-drop', 5.08], ['clear-4', 5.48],
    ],
  },
];

async function importTypeScript(relativePath) {
  const source = await readFile(path.join(repositoryRoot, relativePath), 'utf8');
  const { code: output } = await transformWithOxc(source, relativePath);
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}

function encodeWav(samples, targetRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index] ?? 0));
    view.setInt16(44 + index * 2, Math.round(value < 0 ? value * 32768 : value * 32767), true);
  }
  return Buffer.from(buffer);
}

function compressSample(sample) {
  const threshold = 10 ** (-3 / 20);
  const magnitude = Math.abs(sample);
  if (magnitude <= threshold) return sample;
  const compressed = threshold + (magnitude - threshold) / 2.2;
  return Math.sign(sample) * compressed;
}

function analyze(samples) {
  let peak = 0;
  let squareSum = 0;
  let clippedSamples = 0;
  for (const sample of samples) {
    const magnitude = Math.abs(sample);
    peak = Math.max(peak, magnitude);
    squareSum += sample * sample;
    if (magnitude >= 0.999) clippedSamples += 1;
  }
  return {
    peak,
    rms: Math.sqrt(squareSum / Math.max(1, samples.length)),
    clippedSamples,
  };
}

function asMarkdown(manifest) {
  const rows = manifest.files.map((item) => (
    `| ${item.file} | ${item.durationSeconds.toFixed(2)} s | ${item.peak.toFixed(4)} | ${item.rms.toFixed(4)} | ${item.clippedSamples} | ${item.repetitionDensity.toFixed(2)} cues/s | ${item.description} |`
  ));
  return [
    '# T36 Kinetic-Harmonic Audio Audition',
    '',
    'These mono 48 kHz WAV suites are rendered directly from the production `audioPalette` and deterministic procedural PCM instruments.',
    'The one-shot renderer applies production bus and master gains plus the production compressor threshold and ratio as a static offline transfer. It starts no server, browser, watcher, or audio device.',
    `Source SHA: \`${manifest.sourceSha}\``,
    '',
    '| File | Duration | Peak | RMS | Clipped samples | Density | Listen for |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
    ...rows,
    '',
    '## Cue boundaries',
    '',
    ...manifest.files.map((item) => (
      `- **${item.file}:** ${item.cueBoundaries.map((cue) => `${cue.id} ${cue.startSeconds.toFixed(2)}-${cue.endSeconds.toFixed(2)} s`).join('; ')}`
    )),
    '',
    'Human listening remains the acceptance boundary. Measurements verify render integrity, not whether the direction is approved.',
    '',
  ].join('\n');
}

const gestureModule = await importTypeScript('src/game/audio/audioGesture.ts');
const paletteModule = await importTypeScript('src/game/audio/audioPalette.ts');
const { gestureDuration, renderProceduralSamples } = gestureModule;
const { audioCue } = paletteModule;

await mkdir(evidenceDir, { recursive: true });
const rendered = [];
for (const suite of suites) {
  const longest = suite.cues.reduce((end, [id, at]) => (
    Math.max(end, at + gestureDuration(audioCue(id)))
  ), 0);
  const durationSeconds = longest + (suite.tailSeconds ?? 0.36);
  const mixed = new Float32Array(Math.ceil(durationSeconds * sampleRate));
  const cueBoundaries = [];

  for (const [id, at] of suite.cues) {
    const cue = audioCue(id);
    const cueEnd = at + gestureDuration(cue);
    cueBoundaries.push({ id, startSeconds: at, endSeconds: cueEnd });
    for (const layer of cue.layers) {
      if (layer.kind !== 'procedural') {
        throw new Error(`T36 evidence encountered non-procedural layer in ${id}`);
      }
      const voice = renderProceduralSamples(layer, sampleRate);
      const offset = Math.round((at + (layer.delay ?? 0)) * sampleRate);
      const level = layer.gain * busLevels[cue.bus] * masterGain;
      for (let index = 0; index < voice.length && offset + index < mixed.length; index += 1) {
        mixed[offset + index] += (voice[index] ?? 0) * level;
      }
    }
  }

  for (let index = 0; index < mixed.length; index += 1) {
    mixed[index] = compressSample(mixed[index] ?? 0);
  }
  const metrics = analyze(mixed);
  const metadata = {
    file: suite.file,
    description: suite.description,
    sequence: suite.cues.map(([id]) => id),
    cueBoundaries,
    durationSeconds,
    repetitionDensity: suite.cues.length / durationSeconds,
    ...metrics,
  };
  await writeFile(path.join(evidenceDir, suite.file), encodeWav(mixed, sampleRate));
  rendered.push(metadata);
}

const manifest = {
  sourceSha,
  generatedAt: new Date().toISOString(),
  renderer: 'one-shot Node renderer using production audioPalette + renderProceduralSamples, production bus/master gains, and static production compressor transfer',
  sampleRate,
  files: rendered,
};
await writeFile(path.join(evidenceDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await writeFile(path.join(evidenceDir, 'README.md'), asMarkdown(manifest), 'utf8');
process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
