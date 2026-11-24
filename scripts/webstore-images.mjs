import { chromium } from 'playwright';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { CATALOGS, translate } from '../src/core/i18n.js';

const output = path.resolve('artifacts/webstore-images');
const listings = JSON.parse(await readFile('docs/store-listing/listings.json', 'utf8'));
const extension = path.resolve('dist/extension');
const manifest = JSON.parse(await readFile(`${extension}/manifest.json`, 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
if (manifest.version !== pkg.version) throw new Error('Run npm run build first.');
if (JSON.stringify(Object.keys(listings).sort()) !== JSON.stringify(Object.keys(CATALOGS).sort()))
  throw new Error('Store listing languages must match the extension.');
// Rebuild this generated directory so old, unlocalized screenshots cannot enter the ZIP.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), 'webstore-images-'));
const images = [];
const files = [];
let context;

async function saveText(file, value) {
  await writeFile(path.join(output, file), value + '\n');
  files.push(file);
}
async function frameSection(locator) {
  await locator.evaluate(async (element) => {
    await document.fonts.ready;
    document.activeElement?.blur();
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - 24,
      behavior: 'instant',
    });
    const bounds = element.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > window.innerHeight)
      throw new Error('Settings section would be cropped in the screenshot.');
  });
}
async function screenshot(page, file, width, height) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, file), animations: 'disabled' });
  const png = await readFile(path.join(output, file));
  if (
    png.readUInt32BE(16) !== width ||
    png.readUInt32BE(20) !== height ||
    png[24] !== 8 ||
    png[25] !== 2
  )
    throw new Error(`Unexpected PNG dimensions/color: ${file}`);
  images.push({ file, width, height, format: 'PNG RGB 24-bit, no alpha' });
  files.push(file);
}

try {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const id = worker.url().split('/')[2];
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/options.html`);
  await page.waitForFunction(() => document.querySelector('#status').textContent.length > 0);
  for (const [language, listing] of Object.entries(listings)) {
    await mkdir(`${output}/${language}`, { recursive: true });
    // Exercise the real language selector and wait for persisted settings and translated UI.
    await page.locator('#language').selectOption(language);
    await page.waitForFunction(
      async ({ language }) => {
        const { settings } = await chrome.storage.local.get('settings');
        return (
          settings?.language === language &&
          document.documentElement.lang === language &&
          !document.querySelector('#language').disabled
        );
      },
      { language },
    );
    // Reload to capture the localized status and prove the language survives reopening settings.
    await page.reload();
    await page.waitForFunction(
      ({ language, status }) =>
        document.documentElement.lang === language &&
        document.querySelector('#status').textContent === status,
      { language, status: translate(language, 'settings_local') },
    );
    const catalog = JSON.parse(
      await readFile(`${extension}/_locales/${listing.storeLocale}/messages.json`, 'utf8'),
    );
    for (const key of ['extension_name', 'extension_description']) {
      if (catalog[key].message !== translate(language, key))
        throw new Error(`Build has stale locale metadata: ${language}/${key}`);
    }
    const short = catalog.extension_description.message;
    if (short.length > 132) throw new Error(`Short description exceeds 132: ${language}`);
    const description = listing.description.join('\n\n');
    if (!description.trim() || description.length > 16000)
      throw new Error(`Invalid detailed description: ${language}`);
    await saveText(`${language}/name.txt`, catalog.extension_name.message);
    await saveText(`${language}/short-description.txt`, short);
    await saveText(`${language}/description.txt`, description);
    await page.evaluate(() => window.scrollTo(0, 0));
    await screenshot(page, `${language}/screenshot-01-settings-1280x800.png`, 1280, 800);
    const websites = page.locator('#youtube').locator('xpath=ancestor::section');
    await frameSection(websites);
    await screenshot(page, `${language}/screenshot-02-site-filters-1280x800.png`, 1280, 800);
    await page.locator('#playerDomains').fill('video.example.com');
    await page.locator('#save').click();
    await page.waitForFunction(() => !document.querySelector('#save').disabled);
    await frameSection(page.locator('#player-settings'));
    await screenshot(page, `${language}/screenshot-04-player-domains-1280x800.png`, 1280, 800);
    await page.locator('#playerDomains').fill('');
    // Save illustrative rules in this disposable profile only. These use reserved example domains.
    await page.locator('#customDomains').fill('ads.example.com\ntracking.example.com');
    await page.locator('#customCosmetic').fill('example.com##.advertisement');
    await page.locator('#disabledSites').fill('news.example.com');
    await page.locator('#save').click();
    await page.waitForFunction(
      ({ status }) =>
        document.querySelector('#status').textContent === status &&
        !document.querySelector('#save').disabled,
      { status: translate(language, 'saved') },
    );
    await frameSection(page.locator('#customDomains').locator('xpath=ancestor::section'));
    await screenshot(page, `${language}/screenshot-03-custom-rules-1280x800.png`, 1280, 800);
    // Reset only the example rules before the next language's overview.
    for (const field of ['customDomains', 'customCosmetic', 'disabledSites'])
      await page.locator(`#${field}`).fill('');
    await page.locator('#save').click();
    await page.waitForFunction(
      ({ status }) =>
        document.querySelector('#status').textContent === status &&
        !document.querySelector('#save').disabled,
      { status: translate(language, 'saved') },
    );
  }
  await page.close();
  await mkdir(`${output}/global`, { recursive: true });
  await cp(`${extension}/icons/128.png`, `${output}/global/icon-128.png`);
  files.push('global/icon-128.png');
  const icon = `data:image/png;base64,${(await readFile(`${extension}/icons/128.png`)).toString('base64')}`;
  // Shared promotional art uses the product name and graphical filtering cues, no localized copy.
  const css = `
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}
    body{font-family:Arial,Helvetica,sans-serif;background:#edf3e8;color:#173f33}
    .canvas{position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(ellipse at 85% 20%,#d8e8c7,transparent 65%),#f2f5ed}
    .brand{display:flex;align-items:center;gap:20px;font-size:42px;font-weight:700;letter-spacing:-1px}
    .brand img{width:84px;height:84px;border-radius:22px}
    .marquee .brand{position:absolute;left:66px;top:70px;max-width:430px;line-height:1.1}
    .browser{position:absolute;background:#fff;border:1px solid #cbd8c6;border-radius:24px;box-shadow:0 24px 70px #173f3318;overflow:hidden}
    .bar{height:42px;background:#e7eee2;display:flex;align-items:center;gap:7px;padding:0 18px}
    .bar i{width:7px;height:7px;border-radius:50%;background:#9caf9e}
    .address{height:14px;width:48%;background:#f8faf5;border-radius:9px;margin-left:17px}
    .content{padding:24px;display:grid;grid-template-columns:1fr 30%;gap:18px}
    .article{height:100%;}.picture{height:118px;background:linear-gradient(135deg,#c4d9b6,#e4eddb);border-radius:12px;position:relative;overflow:hidden}
    .picture:after{content:'';position:absolute;width:160px;height:160px;border-radius:50%;background:#85ad92;right:-26px;bottom:-95px}
    .line{height:10px;border-radius:5px;background:#dfe8da;margin-top:13px}.line.short{width:66%}
    .ad{height:118px;background:repeating-linear-gradient(135deg,#f4e8df,#f4e8df 7px,#f8f0e8 7px,#f8f0e8 14px);border:1px solid #e4cbbc;border-radius:12px;display:grid;place-items:center;color:#b17a60;font-size:38px;font-weight:400}
    .clean .content{grid-template-columns:1fr}.clean .picture{height:156px}
    .before{width:340px;height:292px;left:70px;top:213px;transform:rotate(-5deg)}
    .after{width:570px;height:372px;right:74px;top:92px;transform:rotate(3deg)}
    .shield{position:absolute;left:605px;top:248px;width:124px;height:138px;object-fit:contain;border-radius:24px;filter:drop-shadow(0 12px 14px #173f3325)}
    .arrow{position:absolute;left:474px;top:325px;font-size:64px;color:#17684c;font-weight:400}
    .small{background:#17684c;color:#f6f8ee}.small .brand{position:absolute;left:25px;top:24px;gap:12px;font-size:21px;letter-spacing:-.5px}
    .small .brand img{width:44px;height:44px;border-radius:12px}
    .small .browser{width:302px;height:204px;left:70px;top:98px;border-radius:15px;transform:rotate(-5deg)}
    .small .bar{height:27px;padding:0 12px;gap:5px}.small .bar i{width:5px;height:5px}.small .address{height:10px}
    .small .content{padding:15px;gap:12px}.small .picture{height:76px}.small .ad{height:76px;font-size:28px}
    .small .line{height:7px;margin-top:9px}.small .shield{width:86px;height:94px;left:311px;top:162px}
  `;
  const brand = `<div class="brand"><img src="${icon}" alt="">Leaf Content Guard</div>`;
  const browser = (classes, blocked) =>
    `<div class="browser ${classes}"><div class="bar"><i></i><i></i><i></i><div class="address"></div></div><div class="content"><div class="article"><div class="picture"></div><div class="line"></div><div class="line short"></div><div class="line"></div></div>${blocked ? '<div class="ad">×</div>' : ''}</div></div>`;
  for (const [width, height, body, file] of [
    [
      440,
      280,
      `<div class="canvas small">${brand}${browser('', true)}<img class="shield" src="${icon}" alt=""></div>`,
      'promo-small-440x280.png',
    ],
    [
      1400,
      560,
      `<div class="canvas marquee">${brand}${browser('before', true)}<div class="arrow">→</div>${browser('after clean', false)}<img class="shield" src="${icon}" alt=""></div>`,
      'promo-marquee-1400x560.png',
    ],
  ]) {
    const visual = await context.newPage();
    await visual.setViewportSize({ width, height });
    await visual.setContent(
      `<!doctype html><html lang="en"><meta charset="utf-8"><style>${css}</style><body>${body}</body></html>`,
    );
    await screenshot(visual, `global/${file}`, width, height);
    await visual.close();
  }
  await saveText(
    'manifest.json',
    JSON.stringify(
      {
        version: pkg.version,
        images,
        locales: Object.fromEntries(
          Object.entries(listings).map(([language, { label, storeLocale }]) => [
            language,
            { label, storeLocale },
          ]),
        ),
      },
      null,
      2,
    ),
  );
  await saveText('README.md', await readFile('docs/store-listing/README.md', 'utf8'));
  const zip = path.resolve(`artifacts/${pkg.name}-webstore-images-${pkg.version}.zip`);
  await rm(zip, { force: true });
  execFileSync('zip', ['-q', zip, ...files], { cwd: output });
  console.log(
    `Created and validated ${images.length} RGB images for ${Object.keys(listings).join(', ')}; version ${pkg.version}.`,
  );
  console.log(`Listing bundle: ${zip}`);
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
