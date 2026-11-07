import test from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';

import { encodeTransport } from '../../src/lib/encode-transport.mjs';
import { untildify } from '../../src/lib/untildify.mjs';
import { getSshCommand } from '../../src/lib/build-tools/get-ssh-command.mjs';
import { metaconfigSchema } from '../../src/lib/meta/metaconfig-schema.mjs';
import { remoteConfigSchema } from '../../src/lib/remote/remote-config-schema.mjs';

test('untildify expands only a leading ~', () => {
  assert.equal(untildify('~/projects/ruda'), `${homedir()}/projects/ruda`);
  assert.equal(untildify('~'), homedir());
  assert.equal(untildify('/tmp/~/ruda'), '/tmp/~/ruda');
  assert.equal(untildify('relative/~/ruda'), 'relative/~/ruda');
});

test('encodeTransport round-trips through base64', () => {
  const input = 'FOO=bar\nSECRET="quoted value" $HOME\nunicodé ✅\n';

  const encoded = encodeTransport(input);

  assert.match(encoded, /^[A-Za-z0-9+/]*={0,2}$/);
  assert.equal(Buffer.from(encoded, 'base64').toString('utf8'), input);
});

test('getSshCommand uses the environment identity when present', () => {
  assert.equal(
    getSshCommand('/home/ci/ruda/prd', true),
    'ssh -i /home/ci/ruda/prd/id_rsa -o StrictHostKeyChecking=no -o IdentitiesOnly=yes',
  );
  assert.equal(
    getSshCommand('/home/ci/ruda/prd', false),
    'ssh -o StrictHostKeyChecking=no -o IdentitiesOnly=yes',
  );
});

test('metaconfig schema accepts v1 and rejects other shapes', () => {
  const metaconfig = {
    version: '1',
    sshHost: 'example.com',
    sshUser: 'ci',
    sshPort: '22',
    sshKeyPath: '~/.ssh/id_ed25519',
  };

  assert.deepEqual(metaconfigSchema.parse(metaconfig), metaconfig);
  assert.throws(() => metaconfigSchema.parse({ ...metaconfig, version: '2' }));
  assert.throws(() => {
    const { sshHost: _sshHost, ...missingHost } = metaconfig;
    return metaconfigSchema.parse(missingHost);
  });
});

test('remote config schema accepts v2 and rejects other versions', () => {
  const remoteConfig = {
    version: '2',
    env: { NODE_ENV: 'production' },
    files: { abc123: '.env' },
    remoteUrl: 'git@github.com:you/service.git',
    didGenerateIdRsa: false,
  };

  assert.deepEqual(remoteConfigSchema.parse(remoteConfig), remoteConfig);
  assert.throws(() =>
    remoteConfigSchema.parse({ ...remoteConfig, version: '1' }),
  );
  assert.throws(() =>
    remoteConfigSchema.parse({ ...remoteConfig, didGenerateIdRsa: 'yes' }),
  );
});
