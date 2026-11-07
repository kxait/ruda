import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

import { commandNames } from '../src/commands/command-names.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const cliPath = join(repoRoot, 'src/main.mjs');

function runCli(args, home) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
  });
}

async function createTempHome(t) {
  const home = await mkdtemp(join(tmpdir(), 'ruda-test-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  return home;
}

test('CLI help lists every registered command', async (t) => {
  const home = await createTempHome(t);

  const result = runCli(['--help'], home);
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 0);
  assert.match(output, /-v, --verbose/);
  for (const command of Object.values(commandNames)) {
    assert.match(output, new RegExp(`\\b${command}\\b`));
  }
});

test('CLI accepts -v/--verbose before or after a subcommand', async (t) => {
  const home = await createTempHome(t);

  const init = runCli(['-v', 'meta-init'], home);
  assert.equal(init.status, 0);

  const get = runCli(['meta-get', '--verbose'], home);
  assert.equal(get.status, 0);
});

test('meta config commands work against the HOME-scoped config file', async (t) => {
  const home = await createTempHome(t);
  const metaconfigPath = join(home, '.ruda-meta.yml');

  const missing = runCli(['meta-get'], home);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /metaconfig file does not exist/);

  const init = runCli(
    [
      'meta-init',
      '--ssh-host',
      'example.com',
      '--ssh-user',
      'ci',
      '--ssh-port',
      '2222',
    ],
    home,
  );
  assert.equal(init.status, 0);

  let metaconfig = parse(await readFile(metaconfigPath, 'utf8'));
  assert.deepEqual(metaconfig, {
    version: '1',
    sshHost: 'example.com',
    sshUser: 'ci',
    sshPort: '2222',
    sshKeyPath: '',
  });

  const setKey = runCli(['meta-set', 'sshKeyPath', '~/.ssh/id_test'], home);
  assert.equal(setKey.status, 0);

  metaconfig = parse(await readFile(metaconfigPath, 'utf8'));
  assert.equal(metaconfig.sshKeyPath, '~/.ssh/id_test');

  const get = runCli(['meta-get'], home);
  assert.equal(get.status, 0);
  assert.match(get.stdout, /sshHost: example\.com/);
  assert.match(get.stdout, /sshKeyPath: ~\/\.ssh\/id_test/);

  const reinit = runCli(['meta-init'], home);
  assert.equal(reinit.status, 1);
  assert.match(reinit.stderr, /metaconfig file already exists/);
});

test('meta-set rejects unknown keys', async (t) => {
  const home = await createTempHome(t);
  assert.equal(runCli(['meta-init'], home).status, 0);

  const result = runCli(['meta-set', 'notAKey', 'value'], home);

  assert.equal(result.status, 1);
  assert.match(`${result.stdout}${result.stderr}`, /sshHost/);
});
