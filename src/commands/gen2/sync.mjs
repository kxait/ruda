/** @import {Command} from "commander" */

import { syncRepo } from '../../lib/build-tools-gen2/sync-repo.mjs';
import { commandNames } from './command-names.mjs';
import chalk from 'chalk';
import { getCommandContextWithEnv } from '../../lib/get-command-context.mjs';
import { repoCopyFiles } from '../../lib/build-tools-gen2/repo-copy-files.mjs';

/** @this {Command} */
export async function sync() {
  const name = this.args[0];

  const { sshConnection, remoteConfig, envPath } =
    await getCommandContextWithEnv({
      envName: name,
    });

  await syncRepo(sshConnection, envPath, remoteConfig, {
    targetRef: this.opts().targetRef,
  });

  await repoCopyFiles(sshConnection, envPath, remoteConfig);

  console.log(chalk.blue(commandNames.sync), `done`);
}
