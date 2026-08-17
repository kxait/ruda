/** @import {Command} from "commander" */

import chalk from 'chalk';
import { commandNames } from './command-names.mjs';
import { elegantExit } from '../lib/elegant-exit.mjs';
import { getCommandContextWithEnv } from '../lib/get-command-context.mjs';

/** @this {Command} */
export async function removeEnv() {
  const name = this.args[0];

  const { sshConnection, remoteConfig, envPath } =
    await getCommandContextWithEnv({
      envName: name,
    });

  if (
    (Object.keys(remoteConfig.files).length > 0 ||
      remoteConfig.didGenerateIdRsa) &&
    !this.opts().force
  ) {
    console.error(
      chalk.red(
        `error: env ${name} has files or generated identity file, use --force to remove`,
      ),
    );
    await elegantExit(1);
  }

  await sshConnection.exec('sh', ['-c', `rm -rf ${envPath}`]);

  console.log(chalk.blue(commandNames.remove), `done`);
}
