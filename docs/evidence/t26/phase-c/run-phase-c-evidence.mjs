import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const origin = 'http://127.0.0.1:4189';
const vite = path.join(repository, 'node_modules/vite/bin/vite.js');
const capture = path.join(repository, 'docs/evidence/t26/phase-c/capture-phase-c-evidence.mjs');

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '4189', '--strictPort'], {
  cwd: repository,
  stdio: ['ignore', 'ignore', 'pipe'],
  windowsHide: true,
});
let previewError = '';
preview.stderr.setEncoding('utf8');
preview.stderr.on('data', (chunk) => { previewError += chunk; });

const waitForPreview = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`Preview exited early (${preview.exitCode}). ${previewError}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The one owned preview process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Preview did not become ready. ${previewError}`);
};

const runNode = (script, args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [script, ...args], {
    cwd: repository,
    stdio: 'inherit',
    windowsHide: true,
  });
  child.once('error', reject);
  child.once('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`${path.basename(script)} exited with code ${code}.`));
  });
});

try {
  await waitForPreview();
  process.stdout.write(`preview_pid=${preview.pid}\n`);
  await runNode(capture, [origin]);
} finally {
  if (preview.exitCode === null) preview.kill();
  await Promise.race([
    new Promise((resolve) => preview.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
  if (preview.exitCode === null) preview.kill('SIGKILL');
  process.stdout.write(`preview_released=${preview.pid}\n`);
}
