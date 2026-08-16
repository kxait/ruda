import { sshWithGuardrail } from '../ssh/ssh-with-guardrail.mjs';
import { getSshCommand } from './get-ssh-command.mjs';
/**
 * @import {NodeSSH} from "node-ssh"
 * @import {RudaYmlResultEnv} from "../config.mjs"
 * @import {remoteConfigSchema} from "../remote/remote-config-schema.mjs"
 */

/**
 * @param {NodeSSH} sshConnection
 * @param {RudaYmlResultEnv} env
 * @param {remoteConfigSchema} remoteConfig
 * @param {string} envPath
 */
export async function cloneRepo(sshConnection, env, remoteConfig, envPath) {
  const gitSshCommand = getSshCommand(remoteConfig);
  const repoPath = `${envPath}/repo`;
  await sshWithGuardrail(
    sshConnection,
    envPath,
    `GIT_SSH_COMMAND="${gitSshCommand}" git clone ${env.repo_url} ${repoPath}`,
    'repo clone',
  );
}
