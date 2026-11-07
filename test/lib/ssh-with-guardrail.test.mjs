import test from 'node:test';
import assert from 'node:assert/strict';

import { setDebug } from '../../src/lib/debug.mjs';
import { sshWithGuardrail } from '../../src/lib/ssh/ssh-with-guardrail.mjs';
import { createFakeSsh } from '../../test-support/fake-ssh.mjs';

const cwd = '/home/ci/ruda/prd/repo';
const command =
  'NODE_ENV=production ENV=prd REF=abc123 make build --target "release app"';

test('sshWithGuardrail debug-prints the entire command when enabled', async (t) => {
  t.after(() => setDebug(false));
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args.join(' ')));
  setDebug(true);

  const ssh = createFakeSsh(() => ({ code: 0 }));
  await sshWithGuardrail(ssh, cwd, command, 'make build');

  const output = logs.join('\n');
  assert.match(output, /\[debug\]/);
  assert.ok(output.includes(cwd));
  assert.ok(output.includes(command));
  assert.equal(ssh.calls[0].text, command);
});

test('sshWithGuardrail stays quiet when debug mode is off', async (t) => {
  t.after(() => setDebug(false));
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args.join(' ')));
  setDebug(false);

  const ssh = createFakeSsh(() => ({ code: 0 }));
  await sshWithGuardrail(ssh, cwd, command, 'make build');

  assert.deepEqual(logs, []);
});
