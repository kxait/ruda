/** @import {Command} from "commander" */

import { ok } from 'assert';
import { getRemoteConfigGen2 } from '../lib/remote/get-remote-config-gen2.mjs';
import { getRemoteValidRudaDirPath } from '../lib/remote/get-remote-valid-ruda-dir-path.mjs';
import { getDefaultSshConnectionPool } from '../lib/ssh/ssh-connection-pool.mjs';
import { syncRepo } from '../lib/build-tools-gen2/sync-repo.mjs';
import { commandNames } from './command-names.mjs';
import chalk from 'chalk';

/** @this {Command} */
export async function sync() {
  const name = this.args[0];

  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);
  const envPath = `${remoteRudaPath}/${name}`;
  const remoteConfig = await getRemoteConfigGen2(sshConnection, envPath);

  await syncRepo(sshConnection, envPath, remoteConfig, {
    targetRef: this.opts().targetRef,
  });

  console.log(chalk.blue(commandNames.sync), `done`);
}
