import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const dist = path.resolve('dist');
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}

execSync('npx tsc --project tsconfig.build.json', { stdio: 'inherit' });

if (fs.existsSync(path.resolve('src/managed'))) {
  fs.cpSync(path.resolve('src/managed'), path.resolve('dist/managed'), { recursive: true });
}
if (fs.existsSync(path.resolve('src/shade.compact'))) {
  fs.copyFileSync(path.resolve('src/shade.compact'), path.resolve('dist/shade.compact'));
}

console.log('Contract build completed successfully.');
