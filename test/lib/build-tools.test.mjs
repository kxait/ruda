import test from 'node:test';
import assert from 'node:assert/strict';

import { checkoutRepo } from '../../src/lib/build-tools/checkout-repo.mjs';
import { cloneRepo } from '../../src/lib/build-tools/clone-repo.mjs';
import { getLatestRef } from '../../src/lib/build-tools/get-repo-latest-ref.mjs';
import { getRepoRef } from '../../src/lib/build-tools/get-repo-ref.mjs';
import { repoCopyFiles } from '../../src/lib/build-tools/repo-copy-files.mjs';
import { restoreFetchRepo } from '../../src/lib/build-tools/restore-fetch-repo.mjs';
import { syncRepo } from '../../src/lib/build-tools/sync-repo.mjs';
import { createFakeSsh } from '../../test-support/fake-ssh.mjs';

const envPath = '/home/ci/ruda/prd';
const repoPath = `${envPath}/repo`;
const sshCommand =
  'ssh -i /home/ci/ruda/prd/id_rsa -o StrictHostKeyChecking=no -o IdentitiesOnly=yes';
const sshCommandWithoutIdentity =
  'ssh -o StrictHostKeyChecking=no -o IdentitiesOnly=yes';

test('cloneRepo clones into the environment repo path', async () => {
  const ssh = createFakeSsh(() => ({ code: 0 }));
  const remoteConfig = { remoteUrl: 'git@github.com:you/service.git' };

  await cloneRepo(ssh, envPath, remoteConfig, {
    hasIdRsa: true,
    targetRef: 'main',
  });

  assert.equal(ssh.calls.length, 1);
  assert.equal(ssh.calls[0].options.cwd, envPath);
  assert.equal(
    ssh.calls[0].text,
    `GIT_SSH_COMMAND="${sshCommand}" git clone git@github.com:you/service.git --branch main ${repoPath}`,
  );
});

test('cloneRepo omits --branch when no ref is requested', async () => {
  const ssh = createFakeSsh(() => ({ code: 0 }));

  await cloneRepo(
    ssh,
    envPath,
    { remoteUrl: 'git@example.com:repo.git' },
    {
      hasIdRsa: false,
    },
  );

  assert.equal(
    ssh.calls[0].text,
    `GIT_SSH_COMMAND="${sshCommandWithoutIdentity}" git clone git@example.com:repo.git ${repoPath}`,
  );
});

test('checkoutRepo checks out the requested ref in the repo dir', async () => {
  const ssh = createFakeSsh(() => ({ code: 0 }));

  await checkoutRepo(ssh, envPath, true, 'release');

  assert.equal(ssh.calls[0].options.cwd, repoPath);
  assert.equal(
    ssh.calls[0].text,
    `GIT_SSH_COMMAND="${sshCommand}" git checkout release`,
  );
});

test('restoreFetchRepo restores changes before fetching', async () => {
  const ssh = createFakeSsh(() => ({ code: 0 }));

  await restoreFetchRepo(ssh, envPath, true);

  assert.deepEqual(
    ssh.calls.map((call) => call.text),
    ['git restore .', `GIT_SSH_COMMAND="${sshCommand}" git fetch --all`],
  );
  assert.deepEqual(
    ssh.calls.map((call) => call.options.cwd),
    [repoPath, repoPath],
  );
});

test('getRepoRef and getLatestRef return trimmed refs', async () => {
  const ssh = createFakeSsh(({ text }) => {
    if (text.includes('git rev-parse origin/HEAD')) {
      return '  latest-ref  \n';
    }
    if (text.includes('git rev-parse HEAD')) {
      return '  current-ref  \n';
    }
    throw new Error(`unexpected command: ${text}`);
  });

  assert.equal(await getRepoRef(ssh, envPath, false), 'current-ref');
  assert.equal(await getLatestRef(ssh, envPath, false), 'latest-ref');
  assert.deepEqual(
    ssh.calls.map((call) => call.options.cwd),
    [repoPath, repoPath],
  );
  assert.match(ssh.calls[0].text, /git rev-parse HEAD/);
  assert.match(ssh.calls[1].text, /git rev-parse origin\/HEAD/);
});

test('syncRepo clones when the repo does not exist yet', async (t) => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args.join(' ')));

  const ssh = createFakeSsh(({ text }) => {
    if (
      text.includes('test -f') &&
      text.endsWith('/id_rsa && echo $? || echo $?')
    ) {
      return '1';
    }
    if (
      text.includes('test -d') &&
      text.endsWith('/repo && echo $? || echo $?')
    ) {
      return '1';
    }
    if (text.includes('git clone')) {
      return { code: 0 };
    }
    if (text.includes('git rev-parse HEAD')) {
      return 'cloned-ref\n';
    }
    throw new Error(`unexpected command: ${text}`);
  });

  await syncRepo(ssh, envPath, {
    remoteUrl: 'git@github.com:you/service.git',
  });

  const cloneCall = ssh.calls.find((call) => call.text.includes('git clone'));
  assert.ok(cloneCall);
  assert.equal(cloneCall.options.cwd, envPath);
  assert.match(logs.join('\n'), /repo cloned at cloned-ref/);
});

test('syncRepo does nothing when already at the latest ref', async (t) => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args.join(' ')));

  const ssh = createFakeSsh(({ text }) => {
    if (
      text.includes('test -f') &&
      text.endsWith('/id_rsa && echo $? || echo $?')
    ) {
      return '1';
    }
    if (
      text.includes('test -d') &&
      text.endsWith('/repo && echo $? || echo $?')
    ) {
      return '0';
    }
    if (text === 'git restore .' || text.includes('git fetch --all')) {
      return { code: 0 };
    }
    if (text.includes('git rev-parse origin/HEAD')) {
      return 'same-ref\n';
    }
    if (text.includes('git rev-parse HEAD')) {
      return 'same-ref\n';
    }
    throw new Error(`unexpected command: ${text}`);
  });

  await syncRepo(ssh, envPath, {
    remoteUrl: 'git@github.com:you/service.git',
  });

  assert.equal(
    ssh.calls.some((call) => call.text.includes('git checkout')),
    false,
  );
  assert.match(logs.join('\n'), /repo already at same-ref/);
});

test('syncRepo checks out a newly fetched ref', async (t) => {
  t.mock.method(console, 'log', () => {});

  const ssh = createFakeSsh(({ text }) => {
    if (
      text.includes('test -f') &&
      text.endsWith('/id_rsa && echo $? || echo $?')
    ) {
      return '1';
    }
    if (
      text.includes('test -d') &&
      text.endsWith('/repo && echo $? || echo $?')
    ) {
      return '0';
    }
    if (text === 'git restore .' || text.includes('git fetch --all')) {
      return { code: 0 };
    }
    if (text.includes('git rev-parse origin/HEAD')) {
      return 'new-ref\n';
    }
    if (text.includes('git rev-parse HEAD')) {
      return 'old-ref\n';
    }
    if (text.includes('git checkout new-ref')) {
      return { code: 0 };
    }
    throw new Error(`unexpected command: ${text}`);
  });

  await syncRepo(ssh, envPath, {
    remoteUrl: 'git@github.com:you/service.git',
  });

  const checkoutCall = ssh.calls.find((call) =>
    call.text.includes('git checkout'),
  );
  assert.ok(checkoutCall);
  assert.equal(checkoutCall.options.cwd, repoPath);
  assert.match(checkoutCall.text, /git checkout new-ref$/);
});

test('repoCopyFiles skips existing targets and copies missing ones', async (t) => {
  const logs = [];
  t.mock.method(console, 'log', (...args) => logs.push(args.join(' ')));

  const ssh = createFakeSsh(({ text }) => {
    if (text.startsWith(`test -f ${repoPath}/.env `)) {
      return '0';
    }
    if (text.startsWith(`test -f ${repoPath}/config/secret.json `)) {
      return '1';
    }
    if (text.startsWith(`cp ${envPath}/files/hash-b `)) {
      return { code: 0 };
    }
    throw new Error(`unexpected command: ${text}`);
  });

  await repoCopyFiles(ssh, envPath, {
    files: {
      'hash-a': '.env',
      'hash-b': 'config/secret.json',
    },
  });

  assert.equal(
    ssh.calls.some((call) =>
      call.text.startsWith(`cp ${envPath}/files/hash-a `),
    ),
    false,
  );
  assert.equal(
    ssh.calls.some(
      (call) =>
        call.text ===
        `cp ${envPath}/files/hash-b ${repoPath}/config/secret.json`,
    ),
    true,
  );
  assert.match(logs.join('\n'), /already exists, skipping/);
  assert.match(logs.join('\n'), /copying/);
});
