import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeRequest, captureReport } from '../../src/core/network-diagnostics.js';

test('network summaries retain known markers but discard tokens, IDs, arbitrary paths and query values', () => {
  const request = summarizeRequest({
    url: 'https://rr1.googlevideo.com/videoplayback?id=private-video&sig=secret&expire=123&c=WEB&source=youtube&oad=secret&adformat=secret&ctier=A',
    type: 'media',
    headers: { Cookie: 'private' },
  });
  assert.deepEqual(request, {
    host: 'rr1.googlevideo.com',
    path: '/videoplayback',
    type: 'media',
    parameters: {
      client: 'WEB',
      source: 'youtube',
      oad: 'present',
      adformat: 'present',
      tier: 'A',
    },
  });
  assert(!JSON.stringify(request).includes('secret'));
  assert(!JSON.stringify(request).includes('private'));
  assert.equal(
    summarizeRequest({
      url: 'https://example.com/private-video?c=PRIVATE_TOKEN&source=private-token&ctier=private',
      type: 'image',
    }).path,
    '[other]',
  );
  assert.deepEqual(
    summarizeRequest({
      url: 'https://example.com/?c=PRIVATE_TOKEN&source=private&ctier=private',
      type: 'image',
    }).parameters,
    { client: '[other]', source: '[other]', tier: '[other]' },
  );
  assert.equal(summarizeRequest({ url: 'data:text/plain,secret' }), null);
  assert.equal(summarizeRequest({ url: 'invalid' }), null);
});

test('capture reports expire and strip internal tab/request identifiers', () => {
  const capture = {
    tabId: 42,
    recording: true,
    expiresAt: 2000,
    requests: [{ requestId: 'internal', host: 'example.com' }],
  };
  assert.deepEqual(captureReport(capture, 1000), {
    recording: true,
    remainingSeconds: 1,
    limit: 200,
    startedWithReload: false,
    droppedRequests: 0,
    requests: [{ host: 'example.com' }],
  });
  assert.equal(captureReport(capture, 2000).recording, false);
  assert.equal(captureReport(capture, 3000).remainingSeconds, 0);
  assert.deepEqual(captureReport(null), { recording: false, requests: [] });
});

test('YouTube telemetry paths remain distinguishable without exporting query values', () => {
  const request = summarizeRequest({
    url: 'https://www.youtube.com/api/stats/watchtime?adformat=1&docid=private-video',
    type: 'xmlhttprequest',
  });
  assert.equal(request.path, '/api/stats/watchtime');
  assert.deepEqual(request.parameters, { adformat: 'present' });
  assert(!JSON.stringify(request).includes('private-video'));
});
