/** @import {Command} from "commander" */

import { ok } from 'assert';
import chalk from 'chalk';
import { getRemoteValidRudaDirPath } from '../lib/remote/get-remote-valid-ruda-dir-path.mjs';
import { getDefaultSshConnectionPool } from '../lib/ssh/ssh-connection-pool.mjs';
import { getRemoteConfigGen2 } from '../lib/remote/get-remote-config-gen2.mjs';
import { commandNames } from './command-names.mjs';
import { elegantExit } from '../lib/elegant-exit.mjs';

/** @this {Command} */
export async function removeEnv() {
  const name = this.args[0];

  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);

  const envPath = `${remoteRudaPath}/${name}`;
  const existsDir = await sshConnection.exec('sh', [
    '-c',
    `test -d ${envPath} && echo $? || echo $?`,
  ]);

  if (existsDir.trim() !== '0') {
    console.error(chalk.red(`error: dir ${envPath} does not exist`));
    await elegantExit(1);
  }

  const remoteConfig = await getRemoteConfigGen2(sshConnection, envPath);
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

  console.log(chalk.blue(commandNames.envRemove), `done`);
}
