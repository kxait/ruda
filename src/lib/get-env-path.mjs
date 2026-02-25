/**
 * @import {NodeSSH} from "node-ssh"
 * @import {RudaYmlResultEnv} from "./config.mjs"
 */

/**
 * @param {NodeSSH} sshConnection
 * @param {RudaYmlResultEnv} env
 * @returns {Promise<string>}
 */
export async function getEnvPath(sshConnection, env) {
  const homePath = await sshConnection.exec('sh', ['-c', 'echo $HOME']);

  return `${homePath.trim()}/ruda/${env.name}`;
}
