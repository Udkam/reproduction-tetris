import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(evidenceDir, '..', '..', '..');
const sampleRate = 48_000;
const port = 4187;

const suites = [
  {
    file: '01-controls-and-contact.wav',
    description: 'Routine movement through hard contact; repeated moves expose fatigue and click risk.',
    cues: [
      ['move', 0.18], ['move', 0.30], ['move', 0.42], ['rotate', 0.66],
      ['soft-drop', 0.92], ['soft-drop', 1.04], ['hard-drop', 1.34], ['lock', 1.82],
    ],
  },
  {
    file: '02-clear-hierarchy.wav',
    description: 'One through four cleared rows, with increasing spatial scale and no melody requirement.',
    cues: [
      ['clear-1', 0.18], ['clear-2', 0.72], ['clear-3', 1.43], ['clear-4', 2.38],
    ],
  },
  {
    file: '03-mutation-identities.wav',
    description: 'Freeze, Supergravity, Bomb, Double, and Super Double as concise state-change signatures.',
    cues: [
      ['freeze', 0.18], ['supergravity', 1.02], ['bomb', 1.82],
      ['multiplier-2', 2.70], ['multiplier-4', 3.35],
    ],
  },
  {
    file: '04-survival-and-ui.wav',
    description: 'Natural pressure and restrained interface feedback, including the complete countdown.',
    cues: [
      ['stone-warning', 0.18], ['stone-spawn', 0.72], ['stone-land', 1.12],
      ['bedrock-rise', 1.58], ['bedrock-lower', 2.62], ['countdown-tick', 3.52],
      ['countdown-tick', 4.52], ['countdown-resolve', 5.52], ['pause', 6.18],
      ['resume', 6.58], ['puzzle-undo', 7.02],
    ],
  },
  {
    file: '05-interaction-mix.wav',
    description: 'Representative play cadence used to expose masking, stacking, and excessive loudness.',
    cues: [
      ['move', 0.18], ['move', 0.27], ['rotate', 0.40], ['soft-drop', 0.55],
      ['hard-drop', 0.76], ['clear-1', 1.16], ['move', 1.70], ['rotate', 1.84],
      ['hard-drop', 2.06], ['clear-2', 2.44], ['stone-warning', 3.08],
      ['stone-spawn', 3.44], ['stone-land', 3.78], ['freeze', 4.18],
      ['move', 4.76], ['hard-drop', 5.02], ['clear-4', 5.42],
    ],
  },
];

function asMarkdown(manifest) {
  const rows = manifest.files.map((item) => (
    `| ${item.file} | ${item.durationSeconds.toFixed(2)} s | ${item.peak.toFixed(4)} | ${item.rms.toFixed(4)} | ${item.clippedSamples} | ${item.description} |`
  ));
  return [
    '# T35 Audio Audition',
    '',
    'These WAV files are rendered from the production gesture palette through the same bus gains, master gain, and compressor topology used by the game.',
    '',
    '| File | Duration | Peak | RMS | Clipped samples | Listen for |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...rows,
    '',
    '## Cue order',
    '',
    ...manifest.files.map((item) => `- **${item.file}:** ${item.sequence.join(' -> ')}`),
    '',
    'Human listening remains required. Passing level checks does not mean the sound direction is accepted.',
    '',
  ].join('\n');
}

await mkdir(evidenceDir, { recursive: true });
const server = await createServer({
  root: repositoryRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port, strictPort: true },
});
let browser;

try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });

  const rendered = await page.evaluate(async ({ suites: requested, sampleRate: rate }) => {
    const { audioCue } = await import('/src/game/audio/audioPalette.ts');
    const { gestureDuration, scheduleGesture } = await import('/src/game/audio/audioGesture.ts');
    const busLevels = { gameplay: 0.9, reward: 1, mutation: 0.96, ambient: 0.14, ui: 0.7 };

    const encodeWav = (samples, targetRate) => {
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);
      const text = (offset, value) => {
        for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
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
        const value = Math.max(-1, Math.min(1, samples[index]));
        view.setInt16(44 + index * 2, Math.round(value < 0 ? value * 32768 : value * 32767), true);
      }
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let start = 0; start < bytes.length; start += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
      }
      return btoa(binary);
    };

    const outputs = [];
    for (const suite of requested) {
      const longest = suite.cues.reduce((end, [id, at]) => Math.max(end, at + gestureDuration(audioCue(id))), 0);
      const duration = longest + 0.32;
      const context = new OfflineAudioContext(1, Math.ceil(duration * rate), rate);
      const compressor = context.createDynamicsCompressor();
      const master = context.createGain();
      const effects = context.createGain();
      compressor.threshold.value = -3;
      compressor.knee.value = 5;
      compressor.ratio.value = 2.2;
      compressor.attack.value = 0.007;
      compressor.release.value = 0.19;
      master.gain.value = 1.42;
      effects.connect(master);
      master.connect(compressor);
      compressor.connect(context.destination);
      const buses = {};
      for (const [name, level] of Object.entries(busLevels)) {
        const bus = context.createGain();
        bus.gain.value = level;
        bus.connect(effects);
        buses[name] = bus;
      }
      for (const [id, at] of suite.cues) {
        const cue = audioCue(id);
        scheduleGesture(context, buses[cue.bus], cue, { startAt: at });
      }
      const audio = await context.startRendering();
      const samples = audio.getChannelData(0);
      let peak = 0;
      let squareSum = 0;
      let clippedSamples = 0;
      for (const sample of samples) {
        const magnitude = Math.abs(sample);
        peak = Math.max(peak, magnitude);
        squareSum += sample * sample;
        if (magnitude >= 0.999) clippedSamples += 1;
      }
      outputs.push({
        file: suite.file,
        description: suite.description,
        sequence: suite.cues.map(([id]) => id),
        durationSeconds: samples.length / rate,
        peak,
        rms: Math.sqrt(squareSum / samples.length),
        clippedSamples,
        wavBase64: encodeWav(samples, rate),
      });
    }
    return outputs;
  }, { suites, sampleRate });

  const manifest = {
    generatedAt: new Date().toISOString(),
    renderer: 'production audioPalette + audioGesture through AudioEngine-equivalent bus/master/compressor topology',
    sampleRate,
    files: rendered.map(({ wavBase64: _wavBase64, ...metadata }) => metadata),
  };
  for (const item of rendered) {
    await writeFile(path.join(evidenceDir, item.file), Buffer.from(item.wavBase64, 'base64'));
  }
  await writeFile(path.join(evidenceDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(evidenceDir, 'README.md'), asMarkdown(manifest), 'utf8');
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
} finally {
  await browser?.close();
  await server.close();
}
