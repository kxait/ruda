/** @import {NodeSSH} from "node-ssh" */

import { sshWithGuardrail } from '../ssh/ssh-with-guardrail.mjs';
import { getSshCommand } from './get-ssh-command.mjs';

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @param {boolean} hasIdRsa
 * @param {string} targetRef
 */
export async function checkoutRepo(
  sshConnection,
  envPath,
  hasIdRsa,
  targetRef,
) {
  const gitSshCommand = getSshCommand(envPath, hasIdRsa);
  const repoPath = `${envPath}/repo`;

  await sshWithGuardrail(
    sshConnection,
    repoPath,
    `GIT_SSH_COMMAND="${gitSshCommand}" git checkout ${targetRef}`,
    'git checkout',
  );
}
