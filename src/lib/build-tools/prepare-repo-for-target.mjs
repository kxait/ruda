import { execSync } from 'node:child_process';
import { sshWithGuardrail } from '../ssh/ssh-with-guardrail.mjs';
import { getSshCommand } from './get-ssh-command.mjs';
import chalk from 'chalk';
/**
 * @import {NodeSSH} from "node-ssh"
 * @import {remoteConfigSchema} from "../remote/remote-config-schema.mjs"
 */

/**
 * @param {NodeSSH} sshConnection
 * @param {remoteConfigSchema} remoteConfig
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

  const currentRef = (() => {
    try {
      return execSync('git rev-parse HEAD');
    } catch (e) {
      console.error(chalk.red('error: could not get current ref'));
      sshConnection.dispose();
      process.exit(1);
    }
  })();

  const ref = revision ?? currentRef;
  await sshWithGuardrail(
    sshConnection,
    repoPath,
    `GIT_SSH_COMMAND="${gitSshCommand}" git checkout ${ref}`,
    'git checkout',
  );

  /*await sshWithGuardrail(
    sshConnection,
    repoPath,
    `GIT_SSH_COMMAND="${gitSshCommand}" git pull`,
    'git pull',
  );*/

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
