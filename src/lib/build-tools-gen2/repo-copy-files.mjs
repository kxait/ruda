/** @import {NodeSSH} from "node-ssh" */

import chalk from 'chalk';
import { remoteConfigGen2Schema } from '../remote/remote-config-gen2-schema.mjs';
import path from 'node:path';

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @param {remoteConfigGen2Schema} remoteConfig
 */
export async function repoCopyFiles(sshConnection, envPath, remoteConfig) {
  const files = Object.entries(remoteConfig.files).map(
    ([hash, remotePath]) => ({ hash, remotePath }),
  );

  for (const { hash, remotePath } of files) {
    const targetRemotePath = path.join(`${envPath}/repo`, remotePath);
    const targetRemoteFileExists = await sshConnection.exec('sh', [
      '-c',
      `test -f ${targetRemotePath} && echo $? || echo $?`,
    ]);
    if (targetRemoteFileExists.trim() === '0') {
      console.log(
        chalk.blue('sync'),
        `file ${targetRemotePath} already exists, skipping`,
      );
      continue;
    }

    const sourceRemotePath = `${envPath}/files/${hash}`;
    console.log(
      chalk.blue('sync'),
      `copying ${sourceRemotePath} to ${targetRemotePath}`,
    );
    await sshConnection.exec('sh', [
      '-c',
      `cp ${sourceRemotePath} ${targetRemotePath}`,
    ]);
  }
}
