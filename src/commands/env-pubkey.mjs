/** @import {Command} from "commander" */

import { ok } from 'assert';
import chalk from 'chalk';
import { getRemoteValidRudaDirPath } from '../lib/remote/get-remote-valid-ruda-dir-path.mjs';
import { remoteGenerateEd25519 } from '../lib/remote/remote-generate-ed25519.mjs';
import { getDefaultSshConnectionPool } from '../lib/ssh/ssh-connection-pool.mjs';
import { commandNames } from './command-names.mjs';
import { getRemoteConfigGen2 } from '../lib/remote/get-remote-config-gen2.mjs';
import { elegantExit } from '../lib/elegant-exit.mjs';

/** @this {Command} */
export async function envPubkey() {
  const name = this.args[0];

  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);

  const envPath = `${remoteRudaPath}/${name}`;

  const hasIdRsa = await sshConnection.exec('sh', [
    '-c',
    `test -f ${envPath}/id_rsa && echo $? || echo $?`,
  ]);

  if (hasIdRsa.trim() !== '0') {
    console.error(chalk.red(`error: env ${name} does not have identity file`));
    await elegantExit(1);
  }

  const pubkey = await sshConnection.exec('sh', [
    '-c',
    `ssh-keygen -y -f ${envPath}/id_rsa`,
  ]);

  console.log(pubkey);
}
