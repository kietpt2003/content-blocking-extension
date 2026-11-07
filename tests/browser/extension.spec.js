import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { DEFAULTS } from '../../src/config/defaults.js';

let context, control, extensionId, profile, upstream, port;
let adRequests = 0;
const errors = [];

test.beforeAll(async () => {
  profile = await mkdtemp(path.join(os.tmpdir(), 'content-blocker-browser-'));
  const extension = path.resolve('dist/extension');
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker');
  worker.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  extensionId = worker.url().split('/')[2];
  control = await context.newPage();
  await control.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(control.locator('#status')).toContainText('cục bộ');
  upstream = createServer((request, response) => {
    if (request.url === '/blocked.js') {
      adRequests++;
      response.writeHead(200, {
        'content-type': 'application/javascript',
        'cache-control': 'no-store',
      });
      response.end('window.fixtureAdLoaded = true;');
    } else {
      response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
      response.end(
        `<html><head><title>Network fixture</title></head><body><p>Organic</p><script src="http://127.0.0.1:${port}/blocked.js"></script></body></html>`,
      );
    }
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  port = upstream.address().port;
});

test.afterAll(async () => {
  await context?.close();
  if (upstream) await new Promise((resolve) => upstream.close(resolve));
  if (profile) await rm(profile, { recursive: true, force: true });
});

async function setSettings(patch = {}) {
  const result = await control.evaluate(
    (settings) => chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', patch: settings }),
    { ...structuredClone(DEFAULTS), ...patch },
  );
  expect(result.ok, result.error).toBe(true);
}

async function fixture(url, html) {
  const page = await context.newPage();
  await page.route('**/*', (route) =>
    route.request().isNavigationRequest()
      ? route.fulfill({
          contentType: 'text/html',
          body: `<!doctype html><html><head><meta charset="utf-8"><title>Fixture</title></head><body>${html}</body></html>`,
        })
      : route.abort(),
  );
  await page.goto(url);
  return page;
}

test.beforeEach(async () => {
  await setSettings();
});

test.afterEach(async () => {
  for (const page of context.pages()) if (page !== control) await page.close();
});

test('XVideos early ad gate preserves content and restores native behavior when disabled', async () => {
  await setSettings();
  const html = `<html><head><script>
    function Player() { this.source = 'content.m3u8'; }
    window.HTML5Player = Player;
    Player.prototype = { _checkVideoAdsCommon: function() { return true; } };
    window.player = new HTML5Player();
    window.earlyAdAllowed = player._checkVideoAdsCommon('preroll');
  </script></head><body>Player fixture</body></html>`;
  const page = await fixture('https://www.xvideos.com/video.fixture/test', html);
  expect(await page.evaluate(() => window.earlyAdAllowed)).toBe(false);
  expect(await page.evaluate(() => player.source)).toBe('content.m3u8');
  await setSettings({ network: false });
  await expect.poll(() => page.evaluate(() => player._checkVideoAdsCommon('preroll'))).toBe(true);
  await setSettings();
  await expect.poll(() => page.evaluate(() => player._checkVideoAdsCommon('postroll'))).toBe(false);
  await page.close();
  await setSettings({ disabledSites: ['xvideos.com'] });
  const excluded = await fixture('https://www.xvideos.com/video.fixture/excluded', html);
  expect(await excluded.evaluate(() => window.earlyAdAllowed)).toBe(true);
  await excluded.close();
  await setSettings();
});

test('XVideos switch in settings and popup controls both player and VAST requests', async () => {
  const page = await fixture(
    'https://www.xvideos.com/video.fixture/switch',
    `<script>
    window.HTML5Player = function() {};
    HTML5Player.prototype._checkVideoAdsCommon = function() { return true; };
    window.player = new HTML5Player();
    window.earlyAdAllowed = player._checkVideoAdsCommon('preroll');
  </script>`,
  );
  await page.route('https://s.pemsrv.com/**', (route) =>
    route.fulfill({
      contentType: 'text/plain',
      headers: { 'access-control-allow-origin': '*' },
      body: 'allowed',
    }),
  );
  const fetchAd = () =>
    page.evaluate(async () => {
      try {
        return await (await fetch('https://s.pemsrv.com/v1/vast.php?fixture=' + Date.now())).text();
      } catch {
        return 'blocked';
      }
    });
  expect(await page.evaluate(() => window.earlyAdAllowed)).toBe(false);
  expect(await fetchAd()).toBe('blocked');
  await control.reload();
  await expect(control.locator('#xvideos')).toBeChecked();
  await control.locator('#xvideos').uncheck();
  await control.locator('#save').click();
  await expect(control.locator('#status')).toContainText('Đã lưu');
  await expect.poll(() => page.evaluate(() => player._checkVideoAdsCommon('preroll'))).toBe(true);
  expect(await fetchAd()).toBe('allowed');
  await page.reload();
  expect(await page.evaluate(() => window.earlyAdAllowed)).toBe(true);
  await control.reload();
  await expect(control.locator('#xvideos')).not.toBeChecked();
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.locator('#xvideos')).toBeEnabled();
  await expect(popup.locator('#xvideos')).not.toBeChecked();
  await popup.locator('#xvideos').check();
  await expect(popup.locator('#status')).toContainText('Đã cập nhật chặn QC XVideos');
  await page.reload();
  expect(await page.evaluate(() => window.earlyAdAllowed)).toBe(false);
  expect(await fetchAd()).toBe('blocked');
  await control.reload();
  await expect(control.locator('#xvideos')).toBeChecked();
  expect(
    (await control.evaluate(() => chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }))).settings
      .sites.youtube,
  ).toBe(true);
});

test('VLXX blocks popunder scripts and supplies an empty schedule without stalling the iframe player', async () => {
  const supplierURL = 'https://cdn.adxcontent.com/vlxx/vl-inplayer-adx.js?v=123';
  const vastURL = 'https://cdn.adxcontent.com/vlxx/tvc/man88.xml';
  const page = await context.newPage();
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'chrome-extension:') return route.continue();
    let contentType = 'text/html';
    let body = '';
    if (url.hostname === 'play.vlstream.net') {
      body = `<script src="${supplierURL}"></script><script>
        window.originalSources = [{file:'https://media.example.test/content.m3u8'}];
        const timer = setInterval(() => {
          if (typeof window.funcGetvastAdx !== 'function') return;
          clearInterval(timer);
          window.playerConfig = {sources: originalSources, schedule: funcGetvastAdx()};
          window.fixtureReady = true;
        }, 10);
      </script><button id="play" onclick="window.fixturePlaying=!!window.fixtureReady">Play</button>`;
    } else if (url.hostname === 'cdn.adxcontent.com') {
      contentType = 'application/javascript';
      body = url.pathname.includes('inplayer')
        ? `window.COUNT_VAST=2;window.nativeSupplier=true;window.funcGetvastAdx=()=>[{tag:'${vastURL}'}];window.funcJWonReadyVAST=()=>{};`
        : 'window.popunderScriptLoaded=true;';
    } else {
      body = `<div id="vl-top-adx">Banner</div><div class="banner-preload">Popup</div>
        <a id="organic" href="#content">Content</a><div id="content">Original content</div>
        <script src="https://cdn.adxcontent.com/vlxx/vl-main-adx.js"></script>
        <iframe src="https://play.vlstream.net/embed/fixture"></iframe>`;
    }
    await route.fulfill({ contentType, body, headers: { 'access-control-allow-origin': '*' } });
  });
  for (const host of ['vlxx.app', 'vlxx.phd']) {
    await setSettings();
    await page.goto(`https://${host}/video/fixture`);
    let frame = page.frames().find((f) => f.url().startsWith('https://play.vlstream.net/'));
    await expect.poll(() => frame.evaluate(() => window.fixtureReady)).toBe(true);
    expect(await frame.evaluate(() => window.COUNT_VAST)).toBe(0);
    expect(await frame.evaluate(() => window.playerConfig.schedule)).toEqual([]);
    expect(await frame.evaluate(() => window.playerConfig.sources === window.originalSources)).toBe(
      true,
    );
    await frame.locator('#play').click();
    expect(await frame.evaluate(() => window.fixturePlaying)).toBe(true);
    expect(await page.evaluate(() => window.popunderScriptLoaded)).toBeUndefined();
    await expect(page.locator('#vl-top-adx')).toBeHidden();
    await expect(page.locator('.banner-preload')).toBeHidden();
    await expect(page.locator('#organic')).toBeVisible();
    const fetchAd = () =>
      frame.evaluate(async (url) => {
        try {
          await fetch(url);
          return 'allowed';
        } catch {
          return 'blocked';
        }
      }, vastURL);
    expect(await fetchAd()).toBe('blocked');
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.locator('#vlxx')).toBeChecked();
    await popup.locator('#vlxx').uncheck();
    await expect(popup.locator('#status')).toContainText('Đã cập nhật chặn QC VLXX');
    await expect(page.locator('#vl-top-adx')).toBeVisible();
    await page.reload();
    frame = page.frames().find((f) => f.url().startsWith('https://play.vlstream.net/'));
    await expect.poll(() => frame.evaluate(() => window.fixtureReady)).toBe(true);
    expect(await frame.evaluate(() => window.nativeSupplier)).toBe(true);
    expect(await frame.evaluate(() => window.playerConfig.schedule.length)).toBe(1);
    expect(await page.evaluate(() => window.popunderScriptLoaded)).toBe(true);
    expect(await fetchAd()).toBe('allowed');
    await popup.locator('#vlxx').check();
    await expect(popup.locator('#status')).toContainText('Đã cập nhật chặn QC VLXX');
    await page.reload();
    frame = page.frames().find((f) => f.url().startsWith('https://play.vlstream.net/'));
    await expect.poll(() => frame.evaluate(() => window.fixtureReady)).toBe(true);
    expect(await frame.evaluate(() => window.playerConfig.schedule)).toEqual([]);
    await popup.close();
    await setSettings({ disabledSites: [host] });
    await page.reload();
    frame = page.frames().find((f) => f.url().startsWith('https://play.vlstream.net/'));
    await expect.poll(() => frame.evaluate(() => window.fixtureReady)).toBe(true);
    expect(await frame.evaluate(() => window.nativeSupplier)).toBe(true);
    expect(await fetchAd()).toBe('allowed');
  }
});

test('Viet69 switch blocks click ads, restores banners and preserves its iframe player', async () => {
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'cdn2.vietadx.net') {
      return route.fulfill({
        contentType: 'application/javascript',
        body: `
        window.fixtureAdLoaded=true;
        document.addEventListener('click',()=>window.fixtureAdClicks=(window.fixtureAdClicks||0)+1);
      `,
      });
    }
    return route.fulfill({
      contentType: 'text/html',
      body:
        url.hostname === 'emb.cd-vs.com'
          ? '<button id="play" onclick="window.fixturePlaying=true">Play</button>'
          : `<div id="vl-top-adx">Banner</div><div id="vl-underplayer-adx">Banner</div>
        <div class="catfish-bottom">Floating banner</div><div class="banner-preload">Popup</div>
        <button id="content">Content action</button>
        <script src="https://cdn2.vietadx.net/v/v-main-adx.js?v=123"></script>
        <iframe src="https://emb.cd-vs.com/embed/fixture"></iframe>`,
    });
  });
  await page.goto('https://viet69.be/fixture/');
  await page.locator('#content').click();
  expect(await page.evaluate(() => window.fixtureAdLoaded)).toBeUndefined();
  expect(await page.evaluate(() => window.fixtureAdClicks)).toBeUndefined();
  for (const selector of [
    '#vl-top-adx',
    '#vl-underplayer-adx',
    '.catfish-bottom',
    '.banner-preload',
  ]) {
    await expect(page.locator(selector)).toBeHidden();
  }
  await page.frameLocator('iframe').locator('#play').click();
  await expect
    .poll(() =>
      page
        .frameLocator('iframe')
        .locator('#play')
        .evaluate(() => window.fixturePlaying),
    )
    .toBe(true);
  await control.reload();
  await expect(control.locator('#viet69')).toBeChecked();
  await control.locator('#viet69').uncheck();
  await control.locator('#save').click();
  await expect(control.locator('#status')).toContainText('Đã lưu');
  await expect(page.locator('#vl-top-adx')).toBeVisible();
  await page.reload();
  await page.locator('#content').click();
  expect(await page.evaluate(() => window.fixtureAdLoaded)).toBe(true);
  expect(await page.evaluate(() => window.fixtureAdClicks)).toBe(1);
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.locator('#viet69')).not.toBeChecked();
  await popup.locator('#viet69').check();
  await expect(popup.locator('#status')).toContainText('Đã cập nhật chặn QC Viet69');
  await page.reload();
  expect(await page.evaluate(() => window.fixtureAdLoaded)).toBeUndefined();
  await expect(page.locator('#vl-top-adx')).toBeHidden();
  await setSettings({ disabledSites: ['viet69.be'] });
  await page.reload();
  expect(await page.evaluate(() => window.fixtureAdLoaded)).toBe(true);
  await expect(page.locator('#vl-top-adx')).toBeVisible();
  await setSettings();
  await page.goto('https://news.example.com/fixture/');
  expect(await page.evaluate(() => window.fixtureAdLoaded)).toBe(true);
  await expect(page.locator('#vl-top-adx')).toBeVisible();
});

test('Viet69 hides the live related-before banner and recycled slots without hiding content', async () => {
  const page = await fixture(
    'https://viet69.be/fixture/banner',
    `
    <div id="player"><video></video></div>
    <div class="app-ad app-ad--related-before" id="remaining-ad">
      <div id="__clb-spot_1926112_qts_1"><iframe id="__clb-spot_1926112_qts_1_container"></iframe></div>
    </div>
    <div class="app-advertisement-guide" id="content">Content</div>`,
  );
  await expect(page.locator('#remaining-ad')).toBeHidden();
  await expect(page.locator('#player')).toBeVisible();
  await expect(page.locator('#content')).toBeVisible();
  await page.route('https://vertigovitalitywieldable.com/**', (route) =>
    route.fulfill({
      contentType: 'text/plain',
      body: 'allowed',
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
  const fetchAd = () =>
    page.evaluate(async () => {
      try {
        return await (await fetch('https://vertigovitalitywieldable.com/bn.js')).text();
      } catch {
        return 'blocked';
      }
    });
  expect(await fetchAd()).toBe('blocked');
  await page.evaluate(() => {
    const ad = document.createElement('div');
    ad.className = 'app-ad app-ad--related-before';
    ad.id = 'late-ad';
    ad.textContent = 'Late banner';
    document.body.append(ad);
  });
  await expect(page.locator('#late-ad')).toBeHidden();
  await setSettings({ sites: { ...DEFAULTS.sites, viet69: false } });
  await expect(page.locator('#remaining-ad')).toBeVisible();
  await expect(page.locator('#late-ad')).toBeVisible();
  expect(await fetchAd()).toBe('allowed');
  await setSettings();
  await expect(page.locator('#remaining-ad')).toBeHidden();
  await page.evaluate(() => (document.querySelector('#late-ad').className = 'ordinary'));
  await expect(page.locator('#late-ad')).toBeVisible();
  await page.goto('https://vlxx.app/fixture/banner');
  await expect(page.locator('#remaining-ad')).toBeVisible();
});

test('Facebook hides marked ads, keeps ordinary text, and handles recycled/lazy feed nodes', async () => {
  const page = await fixture(
    'https://www.facebook.com/__fixture__',
    `
    <div role="feed"><div role="article" id="organic">Sponsored is a word in this ordinary post.<button>Like</button><div role="article" id="comment"><a href="/ads/about/?id=comment">Discussing an ad link</a></div></div>
    <div role="article" id="advert"><a aria-label="Được tài trợ" href="#">Brand</a><p>Ad</p></div></div>`,
  );
  await expect(page.locator('#advert')).toBeHidden();
  await expect(page.locator('#organic')).toBeVisible();
  await expect(page.locator('#comment')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Like' })).toBeVisible();
  await page.evaluate(() => document.querySelector('#advert a').removeAttribute('aria-label'));
  await expect(page.locator('#advert')).toBeVisible();
  await page.evaluate(() => {
    history.pushState({}, '', '/__fixture__/next');
    const post = document.createElement('div');
    post.id = 'new-ad';
    post.setAttribute('role', 'article');
    post.innerHTML = '<a href="/ads/about/?id=1">Sponsored</a><p>New ad</p>';
    document.querySelector('[role=feed]').append(post);
  });
  await expect(page.locator('#new-ad')).toBeHidden();
  await setSettings({ enabled: false });
  await expect(page.locator('#new-ad')).toBeVisible();
  await expect(page.locator('#new-ad')).not.toHaveAttribute('data-content-blocker-hidden');
  await page.close();
});

test('Facebook sidebar hides Sponsored image cards and preserves Contacts, Birthdays and normal posts', async () => {
  const page = await fixture(
    'https://www.facebook.com/__sidebar__',
    `
    <aside role="complementary" id="sidebar">
      <section id="sidebar-ads" style="display:flex">
        <div><div><div><span><div><h3><span>Spon\u200bsored</span></h3></div></span></div></div></div>
        <a href="https://example.com/ad-one"><img alt="Ad one">Ad one</a>
        <a href="https://example.com/ad-two"><img alt="Ad two">Ad two</a>
      </section>
      <section id="contacts"><h3>Contacts</h3><a href="/friend"><img alt="Friend">Friend</a><span>Sponsored</span></section>
      <section id="birthdays"><h3>Birthdays</h3><a href="/birthday">Birthday</a></section>
    </aside>
    <main role="feed"><div role="article" id="organic"><h3>Sponsored</h3><a href="https://example.com"><img alt="A normal photo">Discussing sponsorship</a></div></main>`,
  );
  await expect(page.locator('#sidebar-ads')).toBeHidden();
  for (const id of ['sidebar', 'contacts', 'birthdays', 'organic'])
    await expect(page.locator(`#${id}`)).toBeVisible();
  await setSettings({ sites: { youtube: true, facebook: false, tiktok: true } });
  await expect(page.locator('#sidebar-ads')).toBeVisible();
  expect(await page.locator('#sidebar-ads').evaluate((e) => e.style.display)).toBe('flex');
  await setSettings();
  await expect(page.locator('#sidebar-ads')).toBeHidden();
});

test('Facebook sidebar handles late nested images and restores a section whose heading changes', async () => {
  const page = await fixture(
    'https://www.facebook.com/__sidebar-lazy__',
    `
    <aside role="complementary"><section id="lazy"><div><h3>Được tài trợ</h3></div>
    <a id="card" href="https://example.com/ad"><span id="image-slot"></span>Advert</a></section>
    <section id="contacts"><h3>Contacts</h3><a href="/friend"><img alt="Friend">Friend</a></section></aside>`,
  );
  await expect(page.locator('#lazy')).toBeVisible();
  await page.locator('#image-slot').evaluate((e) => {
    const image = document.createElement('img');
    image.alt = 'Advert';
    e.append(image);
  });
  await expect(page.locator('#lazy')).toBeHidden();
  await expect(page.locator('#contacts')).toBeVisible();
  await page.locator('#lazy h3').evaluate((e) => {
    e.textContent = 'Contacts';
  });
  await expect(page.locator('#lazy')).toBeVisible();
  await expect(page.locator('#lazy')).not.toHaveAttribute('data-content-blocker-hidden');
});

test('TikTok hides sponsored cards while keeping ordinary videos', async () => {
  const page = await fixture(
    'https://www.tiktok.com/__fixture__',
    `
    <div data-e2e="recommend-list-item-container" id="organic">An ordinary video mentioning ads</div>
    <div data-e2e="recommend-list-item-container" id="advert"><span data-e2e="ad-label">Sponsored</span></div>`,
  );
  await expect(page.locator('#advert')).toBeHidden();
  await expect(page.locator('#organic')).toBeVisible();
  await setSettings({ sites: { youtube: true, facebook: true, tiktok: false } });
  await expect(page.locator('#advert')).toBeVisible();
  await page.close();
});

test('YouTube hides feed ad HTML without hiding playback or organic controls', async () => {
  const page = await fixture(
    'https://www.youtube.com/watch?v=fixture',
    `
    <div id="movie_player"><video></video><button>Play</button></div>
    <ytd-ad-slot-renderer id="advert">Ad</ytd-ad-slot-renderer>
    <ytd-video-renderer id="organic">Ordinary video</ytd-video-renderer>`,
  );
  await expect(page.locator('#advert')).toBeHidden();
  await expect(page.locator('#movie_player')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect(page.locator('#organic')).toBeVisible();
  await page.close();
});

test('site exceptions restore HTML; custom selectors work on other websites', async () => {
  await setSettings({ customCosmetic: [{ domain: 'example.com', selector: '.fixture-ad' }] });
  const page = await fixture(
    'https://news.example.com/__fixture__',
    '<div class="fixture-ad" id="advert" style="display:flex">Ad</div><p id="organic">News</p>',
  );
  await expect(page.locator('#advert')).toBeHidden();
  await setSettings({
    customCosmetic: [{ domain: 'example.com', selector: '.fixture-ad' }],
    disabledSites: ['example.com'],
  });
  await expect(page.locator('#advert')).toBeVisible();
  expect(await page.locator('#advert').evaluate((element) => element.style.display)).toBe('flex');
  await page.close();
});

test('Chrome actually blocks network requests and clearing settings removes the block', async () => {
  adRequests = 0;
  await control.reload();
  await control.locator('#customDomains').fill('127.0.0.1');
  await control.getByRole('button', { name: 'Lưu cấu hình' }).click();
  await expect(control.locator('#status')).toContainText('Đã lưu');
  const page = await context.newPage();
  await page.goto(`http://localhost:${port}/network`);
  expect(await page.evaluate(() => window.fixtureAdLoaded)).toBeUndefined();
  expect(adRequests).toBe(0);
  await setSettings({ network: false });
  await page.reload();
  expect(await page.evaluate(() => window.fixtureAdLoaded)).toBe(true);
  expect(adRequests).toBe(1);
  await setSettings({ customDomains: ['127.0.0.1'], disabledSites: ['localhost'] });
  await page.reload();
  expect(await page.evaluate(() => window.fixtureAdLoaded)).toBe(true);
  expect(adRequests).toBe(2);
  await page.close();
});

test('YouTube network rules block ad endpoints and keep ordinary media requests', async () => {
  const page = await context.newPage();
  await page.route('**/*', (route) =>
    route.fulfill({
      contentType: route.request().isNavigationRequest() ? 'text/html' : 'text/plain',
      headers: { 'access-control-allow-origin': '*' },
      body: route.request().isNavigationRequest() ? '<p>Network fixture</p>' : 'allowed',
    }),
  );
  await page.goto('https://www.youtube.com/watch?v=network');
  const fetchable = (url) =>
    page.evaluate(async (value) => {
      try {
        return await (await fetch(value)).text();
      } catch {
        return 'blocked';
      }
    }, url);
  for (const url of [
    'https://googleads.g.doubleclick.net/pagead/ads',
    'https://pagead2.googlesyndication.com/pagead/ads',
    'https://www.youtube.com/pagead/adview',
    'https://www.youtube.com/get_midroll_info?video_id=fixture',
    'https://rr1.googlevideo.com/initplayback?source=youtube&c=TVHTML5&oad=1',
  ])
    expect(await fetchable(url)).toBe('blocked');
  for (const url of [
    'https://rr1.googlevideo.com/videoplayback?id=organic',
    'https://rr1.googlevideo.com/initplayback?source=youtube&c=TVHTML5',
    'https://rr1.googlevideo.com/initplayback?source=youtube&c=WEB&oad=1',
    'https://www.youtube.com/get_midroll_info-other?video_id=fixture',
    'https://googlevideo.com.example.com/initplayback?source=youtube&c=TVHTML5&oad=1',
  ])
    expect(await fetchable(url)).toBe('allowed');
  await setSettings({ network: false });
  expect(await fetchable('https://googleads.g.doubleclick.net/pagead/ads')).toBe('allowed');
  await setSettings({ disabledSites: ['youtube.com'] });
  expect(
    await fetchable('https://rr1.googlevideo.com/initplayback?source=youtube&c=TVHTML5&oad=1'),
  ).toBe('allowed');
  await setSettings();
  await page.goto('https://news.example.com/');
  expect(await fetchable('https://www.youtube.com/get_midroll_info?video_id=fixture')).toBe(
    'allowed',
  );
  expect(
    await fetchable('https://rr1.googlevideo.com/initplayback?source=youtube&c=TVHTML5&oad=1'),
  ).toBe('allowed');
});

test('YouTube never auto-clicks Skip, seeks or resumes ad media', async () => {
  const wav = Buffer.alloc(44 + 16000);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(wav.length - 44, 40);
  const page = await fixture(
    'https://www.youtube.com/watch?v=no-auto-skip',
    `<div id="movie_player"><video muted preload="auto" src="data:audio/wav;base64,${wav.toString('base64')}"></video>
      <div class="ytp-ad-player-overlay"><button class="ytp-skip-ad-button" onclick="window.skipClicks++">Skip</button></div>
    </div><script>window.skipClicks = 0;</script>`,
  );
  await page.waitForFunction(() => document.querySelector('video').readyState >= 1);
  await expect.poll(youtubeStatus).toMatchObject({ active: true });
  await page.locator('#movie_player').evaluate((player) => player.classList.add('ad-showing'));
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.skipClicks)).toBe(0);
  await expect(page.locator('button')).toBeVisible();
  await page.locator('button').evaluate((button) => {
    button.disabled = true;
  });
  await page.waitForTimeout(1200);
  expect(
    await page.locator('video').evaluate((video) => ({
      time: video.currentTime,
      paused: video.paused,
      rate: video.playbackRate,
    })),
  ).toEqual({ time: 0, paused: true, rate: 1 });
});

test('network capture is opt-in, restricted to one tab, sanitized and clearable', async () => {
  const page = await fixture(
    'https://www.youtube.com/watch?v=capture',
    '<div id="movie_player" class="ad-showing"><video></video></div>',
  );
  const other = await fixture('https://www.youtube.com/watch?v=other', '<p>Other tab</p>');
  for (const tab of [page, other])
    await tab.route('https://*.googlevideo.com/**', (route) =>
      route.fulfill({
        contentType: 'text/plain',
        headers: { 'access-control-allow-origin': '*' },
        body: 'fixture',
      }),
    );
  const tabId = await control.evaluate(
    async () => (await chrome.tabs.query({ url: 'https://www.youtube.com/watch?v=capture' }))[0].id,
  );
  const message = (type) =>
    control.evaluate((value) => chrome.runtime.sendMessage(value), { type, tabId });
  expect((await message('GET_NETWORK_DIAGNOSTICS')).network.capture.requests).toEqual([]);
  expect((await message('START_NETWORK_CAPTURE')).ok).toBe(true);
  await page.evaluate(async () => {
    await fetch(
      'https://rr1.googlevideo.com/videoplayback?c=WEB&source=youtube&oad=secret-token&sig=secret-token&id=private-video',
    );
  });
  await expect
    .poll(async () => (await message('GET_NETWORK_DIAGNOSTICS')).network.capture.requests.length)
    .toBeGreaterThan(0);
  const report = (await message('GET_NETWORK_DIAGNOSTICS')).network.capture;
  expect(report.recording).toBe(true);
  expect(report.requests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        host: 'rr1.googlevideo.com',
        path: '/videoplayback',
        adAtObservation: true,
        parameters: { client: 'WEB', source: 'youtube', oad: 'present' },
      }),
    ]),
  );
  expect(JSON.stringify(report)).not.toMatch(/secret-token|private-video|requestId|signature/);
  await other.evaluate(async () => {
    await fetch('https://rr2.googlevideo.com/videoplayback?c=WEB');
  });
  await message('STOP_NETWORK_CAPTURE');
  expect(
    (await message('GET_NETWORK_DIAGNOSTICS')).network.capture.requests.some(
      (item) => item.host === 'rr2.googlevideo.com',
    ),
  ).toBe(false);
  await page.evaluate(async () => {
    await fetch('https://rr3.googlevideo.com/videoplayback?c=WEB');
  });
  const stopped = (await message('GET_NETWORK_DIAGNOSTICS')).network.capture;
  expect(stopped.recording).toBe(false);
  expect(stopped.requests.some((item) => item.host === 'rr3.googlevideo.com')).toBe(false);
  expect((await message('CLEAR_NETWORK_CAPTURE')).network.capture.requests).toEqual([]);
});

test('popup starts, stops and clears network capture for the active YouTube tab', async () => {
  const page = await fixture('https://www.youtube.com/watch?v=capture-ui', '<p>YouTube</p>');
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.bringToFront();
  await popup.reload();
  await expect(popup.locator('#host')).toHaveText('www.youtube.com');
  await popup.locator('#capture-network').click();
  await expect(popup.locator('#capture-network')).toHaveText('Dừng ghi request');
  await expect(popup.locator('#network-state')).toContainText('đang ghi');
  await popup.locator('#capture-network').click();
  await expect(popup.locator('#capture-network')).toHaveText('Ghi 60 giây và tải lại tab');
  await popup.locator('#clear-network').click();
  await expect(popup.locator('#status')).toHaveText('Đã xóa bản ghi request.');
});

test('capture is armed before automatic reload requests the first media segment', async () => {
  const page = await context.newPage();
  let navigations = 0;
  await page.route('https://www.youtube.com/watch?v=reload-capture', (route) => {
    navigations++;
    return route.fulfill({
      contentType: 'text/html',
      body: '<script>fetch("https://rr1.googlevideo.com/videoplayback?c=WEB&source=youtube").catch(() => {})</script>',
    });
  });
  await page.route('https://rr1.googlevideo.com/**', (route) =>
    route.fulfill({
      contentType: 'text/plain',
      headers: { 'access-control-allow-origin': '*' },
      body: 'segment',
    }),
  );
  await page.goto('https://www.youtube.com/watch?v=reload-capture');
  const tabId = await control.evaluate(
    async () =>
      (await chrome.tabs.query({ url: 'https://www.youtube.com/watch?v=reload-capture' }))[0].id,
  );
  const start = await control.evaluate(
    (tabId) =>
      chrome.runtime.sendMessage({ type: 'START_NETWORK_CAPTURE', tabId, reloadTab: true }),
    tabId,
  );
  expect(start.ok).toBe(true);
  expect(start.network.capture.startedWithReload).toBe(true);
  await expect
    .poll(async () => {
      const result = await control.evaluate(
        (tabId) => chrome.runtime.sendMessage({ type: 'GET_NETWORK_DIAGNOSTICS', tabId }),
        tabId,
      );
      return result.network.capture.requests.some(
        (request) => request.path === '/videoplayback' && request.host === 'rr1.googlevideo.com',
      );
    })
    .toBe(true);
  expect(navigations).toBe(2);
  await control.evaluate(
    (tabId) => chrome.runtime.sendMessage({ type: 'STOP_NETWORK_CAPTURE', tabId }),
    tabId,
  );
});

test('DOM hiding works under strict page CSP without changing the policy', async () => {
  const page = await context.newPage();
  const policy = "default-src 'none'; style-src 'none'; script-src 'none'";
  await page.route('https://news.example.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      headers: { 'content-security-policy': policy },
      body: '<html><head><meta charset="utf-8"></head><body><ins class="adsbygoogle" id="advert">Ad</ins><p id="organic">News</p></body></html>',
    }),
  );
  const response = await page.goto('https://news.example.com/__fixture__');
  expect(response.headers()['content-security-policy']).toBe(policy);
  await expect(page.locator('#advert')).toBeHidden();
  await expect(page.locator('#organic')).toBeVisible();
  await page.close();
});

test('experimental YouTube fetch filtering preserves response metadata and supports pause', async () => {
  await setSettings({ youtubeData: true });
  const page = await context.newPage();
  await page.route('https://www.youtube.com/**', (route) => {
    if (route.request().url().includes('/youtubei/'))
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          adPlacements: [1],
          streamingData: { formats: [{ url: 'keep' }] },
          playabilityStatus: { status: 'OK' },
        }),
      });
    return route.fulfill({
      contentType: 'text/html',
      body: '<html><head></head><body><p>Player fixture</p></body></html>',
    });
  });
  await page.goto('https://www.youtube.com/watch?v=fixture');
  // Poll fetch rather than depending on cross-world startup event ordering.
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch('/youtubei/v1/player');
        return { data: await response.json(), url: response.url, status: response.status };
      }),
    )
    .toEqual({
      data: { streamingData: { formats: [{ url: 'keep' }] }, playabilityStatus: { status: 'OK' } },
      url: 'https://www.youtube.com/youtubei/v1/player',
      status: 200,
    });
  await setSettings({ youtubeData: false });
  await expect
    .poll(() =>
      page.evaluate(async () => (await (await fetch('/youtubei/v1/player')).json()).adPlacements),
    )
    .toEqual([1]);
  await page.close();
});

test('options reject malformed selectors and import/export remain local', async () => {
  await control.reload();
  await control.locator('#customCosmetic').fill('example.com##[');
  await control.getByRole('button', { name: 'Lưu cấu hình' }).click();
  await expect(control.locator('#status')).toContainText('CSS selector không hợp lệ');
  await control.locator('#file').setInputFiles({
    name: 'settings.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...DEFAULTS, customDomains: ['ads.example.com'] })),
  });
  await expect(control.locator('#customDomains')).toHaveValue('ads.example.com');
  await expect(control.locator('#status')).toContainText('Bấm Lưu');
  await control.getByRole('button', { name: 'Lưu cấu hình' }).click();
  await expect(control.locator('#status')).toContainText('Đã lưu');
  const download = control.waitForEvent('download');
  await control.getByRole('button', { name: 'Xuất JSON' }).click();
  expect((await download).suggestedFilename()).toBe('home-content-blocker.json');
  await mkdir('artifacts', { recursive: true });
  await control.screenshot({
    path: 'artifacts/options.png',
    fullPage: true,
    animations: 'disabled',
  });
  const popup = await context.newPage();
  await popup.setViewportSize({ width: 360, height: 560 });
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.locator('#enabled')).toBeChecked();
  await popup.screenshot({ path: 'artifacts/popup.png', fullPage: true, animations: 'disabled' });
  await popup.close();
  expect(errors).toEqual([]);
});

async function youtubeStatus() {
  return control.evaluate(async () => {
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
    return chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_STATUS' }, { frameId: 0 });
  });
}

test('initial YouTube player data is cleaned while existing references remain valid', async () => {
  await setSettings({ youtubeData: true });
  const page = await fixture(
    'https://www.youtube.com/watch?v=initial',
    `
    <script>
      window.ytInitialPlayerResponse = { adPlacements: [1], streamingData: { formats: ['keep'] }, playabilityStatus: { status: 'OK' } };
      window.playerHeldReference = window.ytInitialPlayerResponse;
      window.adsConsumedDuringBootstrap = Boolean(window.ytInitialPlayerResponse.adPlacements);
    </script><p>Initial player fixture</p>`,
  );
  await page.waitForFunction(() => Boolean(window.playerHeldReference?.streamingData));
  expect(await page.evaluate(() => window.adsConsumedDuringBootstrap)).toBe(false);
  await expect
    .poll(() => page.evaluate(() => window.playerHeldReference.adPlacements))
    .toBeUndefined();
  expect(
    await page.evaluate(() => window.playerHeldReference === window.ytInitialPlayerResponse),
  ).toBe(true);
  expect(await page.evaluate(() => window.playerHeldReference.streamingData.formats)).toEqual([
    'keep',
  ]);
  await expect
    .poll(youtubeStatus)
    .toMatchObject({ youtube: { enabled: true, hooks: { initial: true } } });
  const status = await youtubeStatus();
  expect(status.youtube.initialChanged).toBeGreaterThan(0);
  const later = await page.evaluate(() => {
    const value = { playerAds: [2], streamingData: { formats: ['later'] } };
    window.ytInitialPlayerResponse = value;
    return { ads: value.playerAds, formats: value.streamingData.formats };
  });
  expect(later).toEqual({ ads: undefined, formats: ['later'] });
  await page.close();
});

test('YouTube get_watch ads are filtered before the caller reads the response', async () => {
  await setSettings({ youtubeData: true });
  const page = await context.newPage();
  await page.route('https://www.youtube.com/**', (route) =>
    route.request().url().includes('/youtubei/v1/get_watch')
      ? route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            playerResponse: {
              adSlots: [{ adSlotRenderer: {} }],
              streamingData: { formats: ['keep'] },
            },
            contents: [{ adSlotRenderer: {} }, { videoRenderer: { videoId: 'organic' } }],
          }),
        })
      : route.fulfill({ contentType: 'text/html', body: '<p>Get watch</p>' }),
  );
  await page.goto('https://www.youtube.com/watch?v=get-watch');
  await expect
    .poll(() =>
      page.evaluate(
        async () => await (await fetch('/youtubei/v1/get_watch?prettyPrint=false')).json(),
      ),
    )
    .toEqual({
      playerResponse: { streamingData: { formats: ['keep'] } },
      contents: [{ videoRenderer: { videoId: 'organic' } }],
    });
});

test('early JSON hook stays absent when disabled or excluded by policy', async () => {
  for (const patch of [
    { youtubeData: false },
    { youtubeData: true, disabledSites: ['youtube.com'] },
    { youtubeData: true, sites: { youtube: false, facebook: true, tiktok: true } },
  ]) {
    await setSettings(patch);
    const page = await fixture(
      'https://www.youtube.com/watch?v=excluded-bootstrap',
      '<script>window.ytInitialPlayerResponse = { adSlots: [1] }; window.initialAdsPresent = Boolean(window.ytInitialPlayerResponse.adSlots);</script>',
    );
    expect(await page.evaluate(() => window.initialAdsPresent)).toBe(true);
    await expect.poll(youtubeStatus).toMatchObject({ youtube: null });
    await page.close();
  }
});

test('XHR text and JSON filtering preserves events, metadata, identity and native type errors', async () => {
  await setSettings({ youtubeData: true });
  const page = await context.newPage();
  await page.route('https://www.youtube.com/**', (route) =>
    route.request().url().includes('/youtubei/')
      ? route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ playerAds: [1], streamingData: { formats: ['keep'] } }),
        })
      : route.fulfill({
          contentType: 'text/html',
          body: '<html><head><meta charset="utf-8"></head><body>XHR fixture</body></html>',
        }),
  );
  await page.goto('https://www.youtube.com/watch?v=xhr');
  await expect
    .poll(youtubeStatus)
    .toMatchObject({ youtube: { enabled: true, hooks: { xhr: true } } });
  for (const type of ['', 'text', 'json']) {
    const value = await page.evaluate(
      (responseType) =>
        new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.addEventListener('load', () => {
            const response = xhr.response;
            let error = null;
            try {
              void xhr.responseText;
            } catch (exception) {
              error = exception.name;
            }
            resolve({
              status: xhr.status,
              url: xhr.responseURL,
              same: xhr.response === response,
              error,
              data: responseType === 'json' ? response : JSON.parse(xhr.responseText),
            });
          });
          xhr.addEventListener('error', () => reject(new Error('XHR failed')));
          xhr.open('GET', '/youtubei/v1/player');
          xhr.responseType = responseType;
          xhr.send();
        }),
      type,
    );
    expect(value).toEqual({
      status: 200,
      url: 'https://www.youtube.com/youtubei/v1/player',
      same: true,
      error: type === 'json' ? 'InvalidStateError' : null,
      data: { streamingData: { formats: ['keep'] } },
    });
  }
  const binary = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(JSON.parse(new TextDecoder().decode(xhr.response)).playerAds);
        xhr.open('GET', '/youtubei/v1/player');
        xhr.responseType = 'arraybuffer';
        xhr.send();
      }),
  );
  expect(binary).toEqual([1]);
  const status = await youtubeStatus();
  expect(status.youtube.xhrChanged).toBe(3);
  expect(status.youtube.removedFields).toBeGreaterThanOrEqual(3);
  expect(JSON.stringify(status.youtube)).not.toContain('streamingData');
  await setSettings({ youtubeData: false });
  await expect.poll(youtubeStatus).toMatchObject({ youtube: { enabled: false } });
  const unfiltered = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(JSON.parse(xhr.responseText).playerAds);
        xhr.open('GET', '/youtubei/v1/player');
        xhr.send();
      }),
  );
  expect(unfiltered).toEqual([1]);
  await page.close();
});

function promptMedia() {
  const wav = Buffer.alloc(44 + 320000);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(wav.length - 44, 40);
  return `<div id="movie_player"><video muted preload="auto" src="data:audio/wav;base64,${wav.toString('base64')}"></video></div>`;
}

test('YouTube idle confirmation resumes real media, repeats after navigation and preserves manual pause', async () => {
  const page = await fixture('https://www.youtube.com/watch?v=idle', promptMedia());
  await page.locator('video').evaluate(async (video) => {
    await video.play();
    video.pause();
  });
  const showIdle = () =>
    page.evaluate(() => {
      const dialog = document.createElement('tp-yt-paper-dialog');
      dialog.id = 'idle';
      dialog.innerHTML =
        '<yt-confirm-dialog-renderer>Video paused. Continue watching?<div id="confirm-button"><button>Yes</button></div></yt-confirm-dialog-renderer>';
      dialog.querySelector('button').onclick = () => {
        window.confirmations = (window.confirmations || 0) + 1;
        dialog.remove();
      };
      document.body.append(dialog);
    });
  await showIdle();
  await expect.poll(() => page.evaluate(() => window.confirmations)).toBe(1);
  await expect.poll(() => page.locator('video').evaluate((v) => v.paused)).toBe(false);
  await expect.poll(() => page.locator('video').evaluate((v) => v.currentTime)).toBeGreaterThan(0);
  await page.locator('video').evaluate((v) => v.pause());
  await page.waitForTimeout(1300);
  expect(await page.locator('video').evaluate((v) => v.paused)).toBe(true);
  await page.evaluate(() => history.pushState({}, '', '/watch?v=idle-next'));
  await showIdle();
  await expect.poll(() => page.evaluate(() => window.confirmations)).toBe(2);
  await expect.poll(() => page.locator('video').evaluate((v) => v.paused)).toBe(false);
});

test('YouTube handles late idle controls and Vietnamese prompts without resuming ad media', async () => {
  const page = await fixture(
    'https://www.youtube.com/watch?v=idle-late',
    `${promptMedia()}
    <tp-yt-paper-dialog id="idle"><yt-confirm-dialog-renderer>Video đã tạm dừng. Tiếp tục xem?</yt-confirm-dialog-renderer></tp-yt-paper-dialog>`,
  );
  await expect(page.locator('#idle')).toBeHidden();
  await page.evaluate(() => {
    document.querySelector('#movie_player').classList.add('ad-showing');
    const button = document.createElement('button');
    button.textContent = 'Có';
    button.onclick = () => {
      window.idleClicked = true;
      document.querySelector('#idle').hidden = true;
    };
    document.querySelector('yt-confirm-dialog-renderer').append(button);
  });
  await expect.poll(() => page.evaluate(() => window.idleClicked)).toBe(true);
  expect(await page.locator('video').evaluate((v) => v.paused)).toBe(true);
});

test('YouTube hides interruption toasts, restores recycled notifications and respects disable settings', async () => {
  const page = await fixture(
    'https://www.youtube.com/watch?v=toast',
    `
    <tp-yt-paper-toast id="notice" style="display:block">Experiencing interruptions?</tp-yt-paper-toast>
    <div id="movie_player"><div class="ytp-suggested-action" id="badge">Experiencing interruptions?</div></div>
    <ytd-comment-renderer id="comment">Experiencing interruptions? Ad blockers are not allowed on YouTube</ytd-comment-renderer>
    <tp-yt-paper-toast id="saved">Saved to playlist</tp-yt-paper-toast>`,
  );
  await expect(page.locator('#notice')).toBeHidden();
  await expect(page.locator('#badge')).toBeHidden();
  await expect(page.locator('#comment')).toBeVisible();
  await expect(page.locator('#saved')).toBeVisible();
  await page.locator('#notice').evaluate((node) => {
    node.textContent = 'Added to queue';
  });
  await expect(page.locator('#notice')).toBeVisible();
  expect(await page.locator('#notice').evaluate((node) => node.style.display)).toBe('block');
  for (const patch of [
    { enabled: false },
    { cosmetic: false },
    { sites: { youtube: false, facebook: true, tiktok: true } },
    { disabledSites: ['youtube.com'] },
  ]) {
    await setSettings(patch);
    await expect(page.locator('#badge')).toBeVisible();
    await setSettings();
    await expect(page.locator('#badge')).toBeHidden();
  }
});

test('YouTube dismisses ad blocker dialogs without choosing Allow ads and preserves other dialogs', async () => {
  const page = await fixture(
    'https://www.youtube.com/watch?v=ad-warning',
    `
    <tp-yt-iron-overlay-backdrop style="display:block">Backdrop</tp-yt-iron-overlay-backdrop>
    <tp-yt-paper-dialog id="warning"><ytd-enforcement-message-view-model>Ad blockers are not allowed on YouTube
      <button onclick="window.allowed = true">Allow ads</button>
      <button aria-label="Close" onclick="window.closedWarning = true; this.closest('tp-yt-paper-dialog').hidden = true">X</button>
    </ytd-enforcement-message-view-model></tp-yt-paper-dialog>`,
  );
  await expect.poll(() => page.evaluate(() => window.closedWarning)).toBe(true);
  await expect(page.locator('#warning')).toBeHidden();
  expect(await page.evaluate(() => window.allowed)).toBeUndefined();
  // An enforcement surface without a close control still hides its own modal/backdrop.
  await page.evaluate(() => {
    document.body.style.overflow = 'hidden';
    document.querySelector('#warning').remove();
    const dialog = document.createElement('tp-yt-paper-dialog');
    dialog.id = 'new-warning';
    dialog.innerHTML =
      '<ytd-enforcement-message-view-model>Ad blockers violate YouTube terms</ytd-enforcement-message-view-model>';
    document.body.append(dialog);
  });
  await expect(page.locator('#new-warning')).toBeHidden();
  await expect(page.locator('body')).toHaveCSS('overflow', 'auto');
  await expect(page.locator('tp-yt-iron-overlay-backdrop')).toBeHidden();
  await page.evaluate(() => {
    const dialog = document.createElement('div');
    dialog.id = 'share';
    dialog.setAttribute('role', 'dialog');
    dialog.textContent = 'Share video';
    document.body.append(dialog);
  });
  await expect(page.locator('#share')).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expect(page.locator('tp-yt-iron-overlay-backdrop')).toBeVisible();
  await setSettings({ cosmetic: false });
  await expect(page.locator('#new-warning')).toBeVisible();
});

test('YouTube prompt logic leaves other hosts and hidden idle templates untouched', async () => {
  for (const host of ['www.youtube.com', 'news.example.com']) {
    const page = await fixture(
      `https://${host}/watch?v=hidden-idle`,
      `${promptMedia()}
      <div role="dialog" id="template" hidden>Video paused. Continue watching?<button onclick="window.templateClicked = true">Yes</button></div>
      <tp-yt-paper-toast id="notice">Experiencing interruptions?</tp-yt-paper-toast>`,
    );
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.templateClicked)).toBeUndefined();
    expect(await page.locator('video').evaluate((v) => v.paused)).toBe(true);
    if (host === 'news.example.com') await expect(page.locator('#notice')).toBeVisible();
    await page.close();
  }
});

test('YouTube reuses idle dialogs and does not confirm while the site is disabled', async () => {
  await setSettings({ disabledSites: ['youtube.com'] });
  const page = await fixture(
    'https://www.youtube.com/watch?v=idle-reuse',
    `
    <tp-yt-paper-dialog id="idle"><yt-confirm-dialog-renderer>Video paused. Continue watching?
      <button onclick="window.confirmations++; document.querySelector('#idle').hidden = true">Yes</button>
    </yt-confirm-dialog-renderer></tp-yt-paper-dialog><script>window.confirmations = 0</script>`,
  );
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.confirmations)).toBe(0);
  await expect(page.locator('#idle')).toBeVisible();
  await setSettings();
  await expect.poll(() => page.evaluate(() => window.confirmations)).toBe(1);
  // Let the observer see the native hidden state before YouTube reopens the same node.
  await page.waitForTimeout(100);
  await page.locator('#idle').evaluate((node) => {
    node.hidden = false;
  });
  await expect.poll(() => page.evaluate(() => window.confirmations)).toBe(2);
});

test('YouTube hides the live snackbar layout including its hit area and restores recycled messages', async () => {
  const page = await fixture(
    'https://www.youtube.com/watch?v=live-snackbar',
    `
    <snackbar-container class="ytSnackbarContainerHost">
      <div id="notice" class="ytSnackbarContainerSnackbarContainer ytSnackbarContainerOpened" style="display:flex">
        <snackbar-view-model class="snackbarViewModelHost snackbarViewModelSwipeable">
          <div class="snackbarViewModelEngagementBarWrapper"><div class="snackbarViewModelTitleSubtextWrapper">
            <div class="snackbarViewModelTitle"><span class="ytAttributedStringHost ytAttributedStringWhiteSpacePreWrap">Experiencing interruptions?</span></div>
          </div></div>
        </snackbar-view-model>
      </div>
      <div id="saved" class="ytSnackbarContainerSnackbarContainer ytSnackbarContainerOpened"><snackbar-view-model>Saved to playlist</snackbar-view-model></div>
    </snackbar-container>
    <yt-ephemeral-actions aria-live="polite"></yt-ephemeral-actions>
    <div id="movie_player"><video></video><button>Play</button></div>`,
  );
  await expect(page.locator('#notice')).toBeHidden();
  expect(await page.locator('#notice').evaluate((node) => node.getBoundingClientRect().width)).toBe(
    0,
  );
  await expect(page.locator('#saved')).toBeVisible();
  await expect(page.locator('#movie_player')).toBeVisible();
  await page.locator('.snackbarViewModelTitle span').evaluate((node) => {
    node.textContent = 'Added to queue';
  });
  await expect(page.locator('#notice')).toBeVisible();
  expect(await page.locator('#notice').evaluate((node) => node.style.display)).toBe('flex');
  await page.locator('.snackbarViewModelTitle span').evaluate((node) => {
    node.textContent = 'Experiencing interruptions?';
  });
  await expect(page.locator('#notice')).toBeHidden();
  await setSettings({ cosmetic: false });
  await expect(page.locator('#notice')).toBeVisible();
  await setSettings();
  await expect(page.locator('#notice')).toBeHidden();
  await page.evaluate(() => {
    document.querySelector('#notice').remove();
    const notice = document.createElement('snackbar-view-model');
    notice.id = 'late-notice';
    notice.textContent = 'Experiencing interruptions?';
    document.querySelector('snackbar-container').append(notice);
  });
  await expect(page.locator('#late-notice')).toBeHidden();
  await expect(page.locator('#saved')).toBeVisible();
});

test('YouTube startup recovers an interrupted empty stream once and starts real media', async () => {
  await setSettings({ youtubeData: true });
  const media = promptMedia().match(/src="([^"]+)"/u)[1];
  const page = await fixture(
    'https://www.youtube.com/watch?v=startup-fixture',
    `
    <div id="movie_player"><video muted></video></div>
    <script>
      const player = document.querySelector('#movie_player');
      const video = player.querySelector('video');
      const nativeAdd = player.addEventListener.bind(player);
      const nativeRemove = player.removeEventListener.bind(player);
      player.addEventListener = (event, fn, ...args) => event === 'onSnackbarMessage' ? window.startupSignal = fn : nativeAdd(event, fn, ...args);
      player.removeEventListener = (event, fn, ...args) => event === 'onSnackbarMessage' ? window.startupSignal = null : nativeRemove(event, fn, ...args);
      player.getPlayerResponse = () => ({ videoDetails: { videoId: 'startup-fixture' }, playabilityStatus: { status: 'OK' }, streamingData: { serverAbrStreamingUrl: 'https://media.example.test/sabr' } });
      player.getCurrentTime = () => 0;
      player.getPlaylistId = () => null;
      window.reloads = 0;
      player.loadVideoById = (id, start) => {
        window.reloads++;
        window.reloadedVideo = { id, start };
        video.src = ${JSON.stringify(media)};
        void video.play().catch(() => {});
      };
      window.beginStartup = () => {
        void video.play().catch(() => {});
        video.dispatchEvent(new Event('waiting'));
        window.startupSignal?.(1);
      };
    </script>`,
  );
  await page.evaluate(() => window.beginStartup());
  await expect.poll(() => page.evaluate(() => window.reloads)).toBe(1);
  expect(await page.evaluate(() => window.reloadedVideo)).toEqual({
    id: 'startup-fixture',
    start: 0,
  });
  await expect.poll(() => page.locator('video').evaluate((v) => v.currentTime)).toBeGreaterThan(0);
  await page.locator('video').evaluate((v) => v.pause());
  await page.evaluate(() => window.startupSignal?.(1));
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.reloads)).toBe(1);
  expect(await page.locator('video').evaluate((v) => v.paused)).toBe(true);
});
