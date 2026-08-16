/** @import {Command} from "commander" */

import { ok } from 'assert';
import { getRemoteValidRudaDirPath } from '../lib/remote/get-remote-valid-ruda-dir-path.mjs';
import { getDefaultSshConnectionPool } from '../lib/ssh/ssh-connection-pool.mjs';
import { getRemoteConfigGen2 } from '../lib/remote/get-remote-config-gen2.mjs';
import { writeRemoteConfigGen2 } from '../lib/remote/write-remote-config-gen2.mjs';
import { commandNames } from './command-names.mjs';
import chalk from 'chalk';

/** @this {Command} */
export async function setGen2() {
  const name = this.args[0];
  const key = this.args[1];
  const value = this.args[2];

  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);
  const envPath = `${remoteRudaPath}/${name}`;
  const remoteConfig = await getRemoteConfigGen2(sshConnection, envPath);

  remoteConfig.env[key] = value;

  await writeRemoteConfigGen2(sshConnection, envPath, remoteConfig);

  console.log(chalk.blue(commandNames.set2), `done`);
}
