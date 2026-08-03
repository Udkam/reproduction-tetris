import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const origin = 'http://127.0.0.1:4191';
const capture = path.join(repository, 'docs/evidence/t26/phase-e/capture-phase-e-evidence.mjs');
const server = await createServer({
  root: repository,
  logLevel: 'silent',
  server: {
    host: '127.0.0.1',
    port: 4191,
    strictPort: true,
  },
});

const runCapture = () => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [capture, origin], {
    cwd: repository,
    stdio: 'inherit',
    windowsHide: true,
  });
  child.once('error', reject);
  child.once('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`${path.basename(capture)} exited with code ${code}.`));
  });
});

try {
  await server.listen();
  process.stdout.write(`dev_server_owner_pid=${process.pid}\n`);
  await runCapture();
} finally {
  await server.close();
  process.stdout.write(`dev_server_released=${process.pid}\n`);
}
