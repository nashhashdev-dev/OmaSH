import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Supply --codex-bin, --work-dir, and --output. Use dummy fixture credentials only.');
  process.exit(2);
}
const result = spawnSync('python3', ['spikes/m0/probe.py', ...args], { stdio: 'inherit' });
process.exit(result.status ?? 1);
