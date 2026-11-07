import test from 'node:test';
import assert from 'node:assert/strict';
import { stringify } from 'yaml';

import { getRemoteConfigGen2 } from '../../src/lib/remote/get-remote-config.mjs';
import { getRemoteValidRudaDirPath } from '../../src/lib/remote/get-remote-valid-ruda-dir-path.mjs';
import { createFakeSsh } from '../../test-support/fake-ssh.mjs';

test('getRemoteConfigGen2 reads and validates config.yml', async () => {
  const envPath = '/home/ci/ruda/prd';
  const config = {
    version: '2',
    env: { NODE_ENV: 'production', API_URL: 'https://example.com' },
    files: { abc123: '.env' },
    remoteUrl: 'git@github.com:you/service.git',
    didGenerateIdRsa: true,
  };

  const ssh = createFakeSsh(({ text }) => {
    if (text === `cat ${envPath}/config.yml`) {
      return stringify(config);
    }
    throw new Error(`unexpected command: ${text}`);
  });

  const parsed = await getRemoteConfigGen2(ssh, envPath);

  assert.deepEqual(parsed, config);
  assert.equal(ssh.calls.length, 1);
});

test('getRemoteValidRudaDirPath returns the existing remote ruda dir', async () => {
  const ssh = createFakeSsh(({ text }) => {
    if (text === 'echo $HOME') {
      return '/home/ci\n';
    }
    if (text === 'test -d /home/ci/ruda && echo $? || echo $?') {
      return '0';
    }
    throw new Error(`unexpected command: ${text}`);
  });

  const rudaPath = await getRemoteValidRudaDirPath(ssh);

  assert.equal(rudaPath, '/home/ci/ruda');
  assert.equal(ssh.calls.length, 2);
});

test('getRemoteValidRudaDirPath creates the remote ruda dir when asked', async () => {
  const ssh = createFakeSsh(({ text }) => {
    if (text === 'echo $HOME') {
      return '/home/ci\n';
    }
    if (text === 'mkdir -p /home/ci/ruda') {
      return '';
    }
    throw new Error(`unexpected command: ${text}`);
  });

  const rudaPath = await getRemoteValidRudaDirPath(ssh, true);

  assert.equal(rudaPath, '/home/ci/ruda');
  assert.deepEqual(
    ssh.calls.map((call) => call.text),
    ['echo $HOME', 'mkdir -p /home/ci/ruda'],
  );
});
