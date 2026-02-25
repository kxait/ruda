import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
/**
 * @import {Command} from "commander"
 * @import {NodeSSH} from "node-ssh"
 */

/**
 * [target='rbuild'] -e, --env <env name> -r, --revision <revision>
 *
 * @this {Command}
 */
export async function build() {
  // cd ~/ruda/<env name>/repo
  // git restore .
  // git pull
  // copy all files from ~/ruda/<env name>/files to ~/ruda/<env name>/repo as per config
  // export all env vars from ~/ruda/<env name>/config.yml
  // make <target>
  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const repoExists = await sshConnection.exec('sh', [
    '-c',
    `test -d ~/ruda/${env.name}/repo && echo $? || echo $?`,
  ]);

  const homePath = await sshConnection.exec('sh', ['-c', 'echo $HOME']);
  const envPath = `${homePath.trim()}/ruda/${env.name}`;
  const repoPath = `${homePath.trim()}/ruda/${env.name}/repo`;

  const remoteConfig = await getRemoteConfig(env, sshConnection);

  const gitSshCommand = remoteConfig.idRsaPath
    ? `ssh -i ${remoteConfig.idRsaPath} -o StrictHostKeyChecking=no -o IdentitiesOnly=yes`
    : 'ssh -o StrictHostKeyChecking=no -o IdentitiesOnly=yes';

  console.log(
    remoteConfig.idRsaPath
      ? `using identity file ${remoteConfig.idRsaPath}`
      : 'not using identity file',
  );

  if (repoExists.trim() !== '0') {
    console.log(`repo does not exist, cloning into ${repoPath}`);
    await withGuardrail(
      sshConnection,
      envPath,
      `GIT_SSH_COMMAND="${gitSshCommand}" git clone ${env.repo} ${repoPath}`,
      'repo clone',
    );

    console.log('done cloning repo');
  }

  const target = this.opts().target ?? 'rbuild';
  console.log(`running target ${target}`);

  await withGuardrail(sshConnection, repoPath, 'git restore .', 'git restore');
  await withGuardrail(
    sshConnection,
    repoPath,
    `GIT_SSH_COMMAND="${gitSshCommand}" git fetch --all`,
    'git fetch',
  );

  if (this.opts().revision) {
    const revision = this.opts().revision;
    console.log(`checking out revision ${revision}`);
    await withGuardrail(
      sshConnection,
      repoPath,
      `GIT_SSH_COMMAND="${gitSshCommand}" git checkout ${revision}`,
      'git checkout',
    );
  }

  await withGuardrail(
    sshConnection,
    repoPath,
    `GIT_SSH_COMMAND="${gitSshCommand}" git pull`,
    'git pull',
  );

  for (const [fileSha256, remotePath] of Object.entries(remoteConfig.files)) {
    const filePath = `${envPath}/files/${fileSha256}`;
    const targetRemotePath = `${repoPath}/${remotePath}`;
    // TODO: make sure the dir exists
    await sshConnection.exec('sh', [
      '-c',
      `cp ${filePath} ${targetRemotePath}`,
    ]);
  }

  const envVars = Object.entries(remoteConfig.env)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');

  await withGuardrail(
    sshConnection,
    repoPath,
    `${envVars} make ${target}`.trim(),
    `make ${target}`,
  );

  sshConnection.dispose();
  console.log('done');
}

/**
 * @param {NodeSSH} sshConnection
 * @param {string} repoPath
 * @param {string} command
 * @param {string} opName
 */
async function withGuardrail(sshConnection, repoPath, command, opName) {
  const result = await sshConnection.exec('sh', ['-c', command], {
    cwd: repoPath,
    stream: 'both',
    onStdout: (data) => {
      console.log(data.toString());
    },
    onStderr: (data) => {
      console.error(data.toString());
    },
  });

  if (result.code !== 0) {
    console.error(`error: error running ${opName}`);
    sshConnection.dispose();
    process.exit(result.code);
  }
}
