import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const dist = path.resolve('dist');
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}

execSync('npx tsc --project tsconfig.build.json', { stdio: 'inherit' });

console.log('CLI build completed successfully.');
