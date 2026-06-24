#!/usr/bin/env node
/**
 * scripts/dev.js
 * Starts backend (Express + Socket.io) and frontend (Vite) in parallel,
 * prefixes each line of output with a colour-coded tag, and kills both
 * when either exits or when the user presses Ctrl-C.
 *
 * Run from the repo root:  node scripts/dev.js  (or: npm run dev)
 */

const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

const RESET = '\x1b[0m';
const TEAL  = '\x1b[36m';   // backend
const AMBER = '\x1b[33m';   // frontend

function spawnPrefixed({ cmd, args, cwd, label, color }) {
  const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });

  const prefix = `${color}[${label}]${RESET} `;

  child.stdout.on('data', (d) =>
    d.toString().split('\n').filter(Boolean).forEach((l) => process.stdout.write(prefix + l + '\n'))
  );
  child.stderr.on('data', (d) =>
    d.toString().split('\n').filter(Boolean).forEach((l) => process.stderr.write(prefix + l + '\n'))
  );

  child.on('exit', (code) => {
    console.log(`${prefix}exited (code ${code})`);
    process.exit(code ?? 0);
  });

  return child;
}

console.log(`${TEAL}[backend]${RESET} Starting Express + Socket.io on :4000`);
console.log(`${AMBER}[frontend]${RESET} Starting Vite on :5173\n`);

const backend = spawnPrefixed({
  cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
  args: ['run', 'dev'],
  cwd: path.join(root, 'backend'),
  label: 'backend',
  color: TEAL,
});

const frontend = spawnPrefixed({
  cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
  args: ['run', 'dev'],
  cwd: path.join(root, 'frontend'),
  label: 'frontend',
  color: AMBER,
});

function shutdown() {
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);
