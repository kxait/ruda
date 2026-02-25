import { sshWithGuardrail } from '../ssh-with-guardrail.mjs';
import { getSshCommand } from './get-ssh-command.mjs';
/**
 * @import {NodeSSH} from "node-ssh"
 * @import {RemoteConfig} from "../remote-config-schema.mjs"
 */

/**
 * @param {NodeSSH} sshConnection
 * @param {RemoteConfig} remoteConfig
 * @param {string} envPath
 * @param {string} [revision]
 * @returns {Promise<{ envVars: string }>}
 */
export async function prepareRepoForTarget(
  sshConnection,
  remoteConfig,
  envPath,
  revision,
) {
  const gitSshCommand = getSshCommand(remoteConfig);
  const repoPath = `${envPath}/repo`;

  await sshWithGuardrail(
    sshConnection,
    repoPath,
    'git restore .',
    'git restore',
  );
  await sshWithGuardrail(
    sshConnection,
    repoPath,
    `GIT_SSH_COMMAND="${gitSshCommand}" git fetch --all`,
    'git fetch',
  );

  if (revision) {
    console.log(`checking out revision ${revision}`);
    await sshWithGuardrail(
      sshConnection,
      repoPath,
      `GIT_SSH_COMMAND="${gitSshCommand}" git checkout ${revision}`,
      'git checkout',
    );
  }

  await sshWithGuardrail(
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

  return { envVars };
}
