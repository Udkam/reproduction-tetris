import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';

const root = path.resolve('.');
const origin = 'http://127.0.0.1:4194';
const preview = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4194', '--strictPort'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);

let previewError = '';
preview.stderr.setEncoding('utf8');
preview.stderr.on('data', (chunk) => { previewError += chunk; });

const waitForPreview = async () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Preview did not become ready. ${previewError}`);
};

try {
  await waitForPreview();
  const capture = spawn(
    process.execPath,
    ['docs/evidence/t27-r1/capture-t27-r1.mjs', origin],
    { cwd: root, stdio: 'inherit', windowsHide: true },
  );
  const [code] = await once(capture, 'exit');
  if (code !== 0) throw new Error(`Evidence capture exited with code ${code}.`);
} finally {
  if (preview.exitCode === null) preview.kill('SIGTERM');
  if (preview.exitCode === null) await once(preview, 'exit');
}

console.log('T27-R1 preview stopped after evidence capture.');
