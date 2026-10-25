import assert from 'node:assert/strict';
import test from 'node:test';
import { DomEngine } from '../../src/content/dom-engine.js';
import { DEFAULTS } from '../../src/config/defaults.js';

test('configuration before the root exists allows DOMContentLoaded to start the engine later', (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'MutationObserver');
  let observations = 0;
  Object.defineProperty(globalThis, 'MutationObserver', {
    configurable: true,
    value: class {
      disconnect() {}
      observe() {
        observations++;
      }
    },
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'MutationObserver', original);
    else delete globalThis.MutationObserver;
  });
  const document = { documentElement: null };
  const engine = new DomEngine(document, 'www.youtube.com');
  t.after(() => engine.stop());
  engine.configure(DEFAULTS, true);
  assert.equal(engine.active, false);
  assert.equal(observations, 0);
  document.documentElement = {};
  t.mock.method(engine, 'scan', () => {});
  engine.configure(DEFAULTS, true);
  assert.equal(engine.active, true);
  assert.equal(observations, 1);
});
