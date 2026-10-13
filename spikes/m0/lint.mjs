import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const directory = fileURLToPath(new URL('.', import.meta.url));
for (const name of await readdir(directory)) {
  if (!name.endsWith('.mjs')) continue;
  const result = spawnSync(process.execPath, ['--check', `${directory}/${name}`], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(1);
}
const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'docs/spec/checks'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
