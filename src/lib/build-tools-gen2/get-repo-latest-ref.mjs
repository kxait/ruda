/** @import {NodeSSH} from "node-ssh" */

import { getSshCommand } from './get-ssh-command.mjs';

/**
 * Gets the latest ref available on the remote
 *
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @param {boolean} hasIdRsa
 * @returns {Promise<string>}
 */
export async function getLatestRef(sshConnection, envPath, hasIdRsa) {
  const repoPath = `${envPath}/repo`;
  const ref = await sshConnection.exec(
    'sh',
    [
      '-c',
      `GIT_SSH_COMMAND="${getSshCommand(envPath, hasIdRsa)}" git rev-parse origin/HEAD`,
    ],
    { cwd: repoPath },
  );
  return ref.trim();
}
