import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

await mkdir('artifacts', { recursive: true });
const { name, version } = JSON.parse(await readFile('package.json', 'utf8'));
const filename = `${name}-${version}.zip`;
const staging = await mkdtemp(path.join(os.tmpdir(), `${name}-store-`));
try {
  await cp('dist/extension', staging, { recursive: true });
  const manifestPath = path.join(staging, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  // The Developer Dashboard rejects a manifest key on new-item uploads.
  // Retain the development identity in dist, but let the Store assign its own identity.
  delete manifest.key;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  await rm(path.resolve('artifacts', filename), { force: true });
  execFileSync('zip', ['-qr', path.resolve('artifacts', filename), '.'], { cwd: staging });
} finally {
  await rm(staging, { recursive: true, force: true });
}
const digest = createHash('sha256')
  .update(await readFile(`artifacts/${filename}`))
  .digest('hex');
await writeFile('artifacts/SHA256SUMS', `${digest}  ${filename}\n`);
console.log(`Packaged artifacts/${filename}`);
