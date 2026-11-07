import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createIcons } from './icons.mjs';
import { CATALOGS } from '../src/core/i18n.js';

const output = 'dist/extension';
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await build({
  entryPoints: {
    background: 'src/background.js',
    content: 'src/content/index.js',
    'youtube-main': 'src/content/youtube-main.js',
    'xvideos-main': 'src/content/xvideos-main.js',
    'vlxx-no-ads': 'src/content/vlxx-no-ads.js',
    popup: 'src/ui/popup.js',
    options: 'src/ui/options.js',
  },
  bundle: true,
  outdir: output,
  format: 'iife',
  target: ['chrome120'],
  charset: 'utf8',
  legalComments: 'none',
});
for (const file of ['popup.html', 'options.html', 'ui.css'])
  await cp(`src/ui/${file}`, `${output}/${file}`);
const manifest = JSON.parse(await readFile('src/manifest.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
manifest.version = pkg.version;
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
for (const [language, messages] of Object.entries(CATALOGS)) {
  const directory = `${output}/_locales/${language.replace('-', '_')}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/messages.json`, JSON.stringify(messages, null, 2) + '\n');
}
await createIcons(`${output}/icons`);
console.log(`Built Chrome MV3 extension: ${output}`);
