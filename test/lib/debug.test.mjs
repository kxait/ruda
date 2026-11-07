import test from 'node:test';
import assert from 'node:assert/strict';

import { isDebug, setDebug } from '../../src/lib/debug.mjs';

test('debug mode is off by default and can be toggled', (t) => {
  t.after(() => setDebug(false));

  setDebug(false);
  assert.equal(isDebug(), false);

  setDebug(true);
  assert.equal(isDebug(), true);

  setDebug(false);
  assert.equal(isDebug(), false);
});

test('isDebug is exposed globally', (t) => {
  t.after(() => setDebug(false));

  setDebug(true);
  assert.equal(globalThis.isDebug(), true);

  setDebug(false);
  assert.equal(globalThis.isDebug(), false);
});
