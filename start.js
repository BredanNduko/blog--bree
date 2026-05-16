/**
 * Stalk Quil Blog Platform — Start Script
 * Boots backend (port 3001) and frontend (port 3000) concurrently.
 */
const { spawn } = require('child_process');
const path = require('path');

const RESET  = '\x1b[0m';
const CYAN   = '\x1b[36m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM    = '\x1b[2m';

function start(name, cmd, args, cwd, color) {
  const proc = spawn(cmd, args, {
    cwd: path.join(__dirname, cwd),
    stdio: 'pipe',
    shell: process.platform === 'win32'
  });

  proc.stdout.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      console.log(`${color}[${name}]${RESET} ${line}`);
    });
  });

  proc.stderr.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      if (!line.includes('ExperimentalWarning') && !line.includes('npm warn')) {
        console.log(`${color}[${name}]${RESET} ${DIM}${line}${RESET}`);
      }
    });
  });

  proc.on('close', code => {
    if (code !== 0) console.log(`${color}[${name}]${RESET} exited with code ${code}`);
  });

  return proc;
}

console.log(`\n${CYAN}╔════════════════════════════════════╗`);
console.log(`║       STALK QUIL BLOG PLATFORM     ║`);
console.log(`╚════════════════════════════════════╝${RESET}\n`);

start('API',      'node', ['server.js'], 'backend',  GREEN);
setTimeout(() => {
  start('WEB',   'node', ['server.js'], 'frontend', CYAN);

  setTimeout(() => {
    console.log(`\n${GREEN}✓ Both servers running${RESET}`);
    console.log(`${DIM}─────────────────────────────────────${RESET}`);
    console.log(`  ${CYAN}Blog:${RESET}  http://localhost:3000`);
    console.log(`  ${YELLOW}Admin:${RESET} http://localhost:3000/admin.html`);
    console.log(`  ${DIM}API:   http://localhost:3001/api${RESET}`);
    console.log(`${DIM}─────────────────────────────────────${RESET}`);
    console.log(`  ${DIM}Default login: admin@blog.com / admin123${RESET}\n`);
  }, 1500);
}, 500);

process.on('SIGINT', () => {
  console.log('\n\nShutting down…');
  process.exit(0);
});
