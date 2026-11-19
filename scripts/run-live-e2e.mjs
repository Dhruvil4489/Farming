import { spawn } from 'child_process';

const PORT = 3005;
const BASE = `http://localhost:${PORT}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status >= 200 && res.status < 500) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function main() {
  console.log(`Starting production Next.js server on port ${PORT}...`);
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' },
  });

  server.stdout.on('data', (d) => {
    const s = d.toString().trim();
    if (s) console.log(`[server] ${s}`);
  });

  server.stderr.on('data', (d) => {
    const s = d.toString();
    if (!s.includes('DeprecationWarning')) process.stderr.write(`[server] ${s}`);
  });

  let exitCode = 1;
  try {
    await waitForServer(BASE);
    const scriptTarget = process.argv[2] || 'scripts/verify-all-17-phases.mjs';
    console.log(`Server ready at ${BASE}. Running ${scriptTarget}...\n`);

    const tester = spawn('node', [scriptTarget], {
      stdio: 'inherit',
      env: { ...process.env, TEST_BASE_URL: BASE },
    });

    exitCode = await new Promise((resolve) => {
      tester.on('exit', (code) => resolve(code ?? 1));
    });
  } finally {
    console.log('\nStopping temporary verification server...');
    if (process.platform === 'win32' && server.pid) {
      spawn('taskkill', ['/pid', String(server.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
    await sleep(600);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
