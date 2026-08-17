/**
 * @import {NodeSSH} from "node-ssh"
 * @typedef {{
 *   envName: string;
 * }} CommandContextArgs
 *
 * @typedef {{
 *   sshConnection: NodeSSH;
 *   remoteRudaPath: string;
 *   envName: string;
 *   envPath: string;
 *   remoteConfig: remoteConfigSchema;
 *   hasIdRsa: boolean;
 * }} CommandContextWithEnv
 *
 *
 * @typedef {{
 *   sshConnection: NodeSSH;
 *   remoteRudaPath: string;
 * }} CommandContext
 */

import { ok } from 'assert';
import { getRemoteConfigGen2 } from './remote/get-remote-config.mjs';
import { getRemoteValidRudaDirPath } from './remote/get-remote-valid-ruda-dir-path.mjs';
import { remoteConfigSchema } from './remote/remote-config-schema.mjs';
import { getDefaultSshConnectionPool } from './ssh/ssh-connection-pool.mjs';
import chalk from 'chalk';
import { elegantExit } from './elegant-exit.mjs';

/**
 * @param {CommandContextArgs} args
 * @returns {Promise<CommandContextWithEnv>}
 */
export async function getCommandContextWithEnv({ envName }) {
  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);

  const baseContext = {
    sshConnection,
    remoteRudaPath,
  };

  const envPath = `${remoteRudaPath}/${envName}`;

  const dirExists = await sshConnection.exec('sh', [
    '-c',
    `test -d ${envPath} && echo $? || echo $?`,
  ]);

  if (dirExists.trim() !== '0') {
    console.error(chalk.red(`error: dir ${envPath} does not exist`));
    await elegantExit(1);
  }

  const remoteConfig = await getRemoteConfigGen2(sshConnection, envPath);
  const hasIdRsa =
    (await sshConnection.exec('sh', [
      '-c',
      `test -f ${envPath}/id_rsa && echo $? || echo $?`,
    ])) === '0';

  return {
    ...baseContext,
    envName,
    remoteConfig,
    hasIdRsa,
    envPath,
  };
}

/** @returns {Promise<CommandContext>} */
export async function getCommandContext() {
  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);

  const baseContext = {
    sshConnection,
    remoteRudaPath,
  };

  return baseContext;
}
