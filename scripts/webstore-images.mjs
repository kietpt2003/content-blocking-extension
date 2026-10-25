import { chromium } from 'playwright';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const output = path.resolve('artifacts/webstore-images');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), 'webstore-images-'));
const extension = path.resolve('dist/extension');
let context;
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
  await page.locator('#enabled:not(:disabled)').waitFor();
  await page.waitForFunction(() =>
    document.querySelector('#status').textContent.includes('cục bộ'),
  );
  await page.screenshot({
    path: `${output}/screenshot-01-settings-1280x800.png`,
    animations: 'disabled',
  });
  await page.locator('#customDomains').fill('ads.example.com\ntracking.example.com');
  await page.locator('#customCosmetic').fill('example.com##.advertisement');
  await page
    .locator('#customDomains')
    .evaluate((element) => element.closest('section').scrollIntoView({ block: 'start' }));
  await page.screenshot({
    path: `${output}/screenshot-02-custom-rules-1280x800.png`,
    animations: 'disabled',
  });
  const icon = `data:image/png;base64,${(await readFile(`${extension}/icons/128.png`)).toString('base64')}`;
  const css = `
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}
    body{font-family:Arial,Helvetica,sans-serif;color:#173f33;background:#f3f5ef}
    .brand{display:flex;align-items:center;gap:14px;font-size:22px;font-weight:700;letter-spacing:-.4px}
    .brand img{width:48px;height:48px;border-radius:13px}
    .chips{display:flex;gap:10px}.chips span{border:1px solid #c8d8c9;border-radius:24px;padding:9px 16px;font-size:16px}
    h1{margin:0;letter-spacing:-2.8px;font-weight:750;line-height:1.08}
    .marquee{position:relative;padding:44px 62px;width:1400px;height:560px;background:linear-gradient(115deg,#f7f8f2 0%,#edf3e8 70%)}
    .marquee h1{font-size:64px;margin:35px 0 20px;max-width:800px}
    .marquee p{font-size:21px;color:#577063;line-height:1.5;max-width:720px;margin:0 0 29px}
    .panel{position:absolute;right:62px;top:70px;width:354px;background:white;border:1px solid #d4e0d0;border-radius:24px;padding:27px;box-shadow:0 22px 55px #173f3315}
    .panel .name{font-size:21px;font-weight:700;margin-bottom:22px}.eyebrow{font-size:11px;letter-spacing:2px;color:#647b6a;margin:0 0 12px;font-weight:700}
    .row{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e7ece2;padding:22px 0;font-size:16px;line-height:1.4;font-weight:600}
    .toggle{width:40px;height:24px;flex-shrink:0;border-radius:20px;background:#17684c;position:relative;margin-left:10px}.toggle:after{content:'';position:absolute;width:18px;height:18px;top:3px;right:3px;border-radius:50%;background:#fff}
    .panel .foot{font-size:13px;line-height:1.6;color:#647b6a;margin-top:12px;border-radius:10px;background:#f1f5eb;padding:13px}
    .small{width:440px;height:280px;background:#17684c;color:#f5f8ed;padding:25px 28px;position:relative}
    .small .brand{font-size:18px;gap:10px;letter-spacing:-.3px}.small .brand img{width:38px;height:38px;border-radius:10px;outline:1px solid #6b947b}
    .small h1{font-size:42px;letter-spacing:-1.8px;line-height:1.06;margin:19px 0 12px}
    .small p{font-size:14px;margin:0;color:#d3e4cd}.small .platforms{margin-top:18px;font-size:12px;color:#d3e4cd;letter-spacing:.2px}
  `;
  const render = async (width, height, body, filename) => {
    const visual = await context.newPage();
    await visual.setViewportSize({ width, height });
    await visual.setContent(
      `<!doctype html><html lang="vi"><meta charset="utf-8"><style>${css}</style><body>${body}</body></html>`,
    );
    await visual.evaluate(() => document.fonts.ready);
    await visual.screenshot({
      path: `${output}/${filename}`,
      animations: 'disabled',
      omitBackground: false,
    });
    await visual.close();
  };
  const brand = `<div class="brand"><img src="${icon}" alt="">Home Content Blocker</div>`;
  await render(
    440,
    280,
    `<div class="small">${brand}<h1>Duyệt web<br>gọn hơn.</h1><p>Chặn request. Lọc nội dung.</p><div class="platforms">YouTube &nbsp;·&nbsp; Facebook &nbsp;·&nbsp; TikTok</div></div>`,
    'promo-small-440x280.png',
  );
  await render(
    1400,
    560,
    `<div class="marquee">${brand}<h1>Duyệt web gọn hơn.<br>Chủ động hơn.</h1><p>Chặn request quảng cáo và lọc nội dung phiền nhiễu.<br>Cấu hình lưu ngay trên trình duyệt của bạn.</p><div class="chips"><span>YouTube</span><span>Facebook</span><span>TikTok</span></div><div class="panel"><div class="eyebrow">HOME CONTENT BLOCKER</div><div class="name">Quy tắc của bạn.</div><div class="row">Chặn domain / URL<i class="toggle"></i></div><div class="row">Ẩn thành phần HTML<i class="toggle"></i></div><div class="row">Lọc theo website<i class="toggle"></i></div><div class="foot">Bật, tắt và tùy chỉnh bộ lọc<br>ngay trong trình duyệt.</div></div></div>`,
    'promo-marquee-1400x560.png',
  );
  const dimensions = [
    ['screenshot-01-settings-1280x800.png', 1280, 800],
    ['screenshot-02-custom-rules-1280x800.png', 1280, 800],
    ['promo-small-440x280.png', 440, 280],
    ['promo-marquee-1400x560.png', 1400, 560],
  ];
  for (const [file, width, height] of dimensions) {
    const png = await readFile(`${output}/${file}`);
    if (
      png.readUInt32BE(16) !== width ||
      png.readUInt32BE(20) !== height ||
      png[24] !== 8 ||
      png[25] !== 2
    )
      throw new Error(`Unexpected PNG dimensions/color: ${file}`);
  }
  await writeFile(
    `${output}/README.txt`,
    'Screenshots: screenshot-01 / screenshot-02 (1280x800)\nSmall promo tile: promo-small (440x280)\nMarquee promo tile: promo-marquee (1400x560)\nAll files: PNG RGB 24-bit, no alpha.\n',
  );
  const zip = path.resolve('artifacts/webstore-images.zip');
  await rm(zip, { force: true });
  execFileSync('zip', ['-q', zip, ...dimensions.map(([file]) => file), 'README.txt'], {
    cwd: output,
  });
  console.log(`Created and validated 4 RGB images: ${output}`);
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
