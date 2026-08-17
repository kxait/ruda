/** @import {NodeSSH} from "node-ssh" */

import { sshWithGuardrail } from '../ssh/ssh-with-guardrail.mjs';
import { getSshCommand } from './get-ssh-command.mjs';

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @param {boolean} hasIdRsa
 */
export async function restoreFetchRepo(sshConnection, envPath, hasIdRsa) {
  const gitSshCommand = getSshCommand(envPath, hasIdRsa);
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
}
