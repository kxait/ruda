/** @import {Command} from "commander" */

import chalk from 'chalk';
import { elegantExit } from '../../lib/elegant-exit.mjs';
import { getCommandContextWithEnv } from '../../lib/get-command-context.mjs';

/** @this {Command} */
export async function envPubkey() {
  const name = this.args[0];

  const { sshConnection, remoteConfig, envPath, hasIdRsa } =
    await getCommandContextWithEnv({
      envName: name,
    });

  if (!hasIdRsa) {
    console.error(chalk.red(`error: env ${name} does not have identity file`));
    await elegantExit(1);
  }

  const pubkey = await sshConnection.exec('sh', [
    '-c',
    `ssh-keygen -y -f ${envPath}/id_rsa`,
  ]);

  console.log(pubkey);
}
