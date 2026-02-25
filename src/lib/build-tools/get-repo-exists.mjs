/**
 * @import {NodeSSH} from "node-ssh"
 * @import {RudaYmlResultEnv} from "../config.mjs"
 */

/**
 * @param {NodeSSH} sshConnection
 * @param {RudaYmlResultEnv} env
 * @returns {Promise<boolean>}
 */
export async function getRepoExists(sshConnection, env) {
  const repoExists = await sshConnection.exec('sh', [
    '-c',
    `test -d ~/ruda/${env.name}/repo && echo $? || echo $?`,
  ]);
  return repoExists.trim() === '0';
}
