/**
 * @import {NodeSSH} from "node-ssh"
 * @import {RudaYmlResultEnv} from "./config.mjs"
 */

/**
 * @param {RudaYmlResultEnv} env
 * @param {NodeSSH} sshConnection
 */
export async function checkEnvInitialized(env, sshConnection) {
  const remoteConfigPath = `~/ruda/${env.name}/config.yml`;

  const configExists = await sshConnection.exec('sh', [
    '-c',
    `test -f ${remoteConfigPath} && echo $? || echo $?`,
  ]);

  if (configExists.trim() !== '0') {
    console.error(`error: env ${env.name} not initialized`);
    sshConnection.dispose();
    process.exit(1);
  }
}
