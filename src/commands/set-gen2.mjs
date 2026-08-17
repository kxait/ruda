/** @import {Command} from "commander" */

import { writeRemoteConfig } from '../lib/remote/write-remote-config.mjs';
import { commandNames } from './command-names.mjs';
import chalk from 'chalk';
import { getCommandContextWithEnv } from '../lib/get-command-context.mjs';

/** @this {Command} */
export async function setGen2() {
  const name = this.args[0];
  const key = this.args[1];
  const value = this.args[2];

  const { sshConnection, remoteConfig, envPath } =
    await getCommandContextWithEnv({
      envName: name,
    });

  remoteConfig.env[key] = value;

  await writeRemoteConfig(sshConnection, envPath, remoteConfig);

  console.log(chalk.blue(commandNames.set), `done`);
}
