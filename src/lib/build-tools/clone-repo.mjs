/** @import {NodeSSH} from "node-ssh" */

import { remoteConfigSchema } from '../remote/remote-config-schema.mjs';
import { sshWithGuardrail } from '../ssh/ssh-with-guardrail.mjs';
import { getSshCommand } from './get-ssh-command.mjs';

/** @typedef {{ hasIdRsa: boolean; targetRef?: string }} CloneOptions */

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @param {remoteConfigSchema} remoteConfig
 * @param {CloneOptions} options
 */
export async function cloneRepo(sshConnection, envPath, remoteConfig, options) {
  const gitSshCommand = getSshCommand(envPath, options.hasIdRsa);
  const repoPath = `${envPath}/repo`;

  let gitCommand = `GIT_SSH_COMMAND="${gitSshCommand}" git clone ${remoteConfig.remoteUrl}`;

  if (options.targetRef) {
    gitCommand += ` --branch ${options.targetRef}`;
  }

  gitCommand += ` ${repoPath}`;

  await sshWithGuardrail(sshConnection, envPath, gitCommand, 'repo clone');
}
