/** @import {Command} from "commander" */

import { ok } from 'node:assert';
import { getRemoteValidRudaDirPath } from '../lib/remote/get-remote-valid-ruda-dir-path.mjs';
import { getDefaultSshConnectionPool } from '../lib/ssh/ssh-connection-pool.mjs';

/** @this {Command} */
export async function listEnvs() {
  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');

  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);
  const dirsInRudaPath = await sshConnection.exec('sh', [
    '-c',
    `ls ${remoteRudaPath}`,
  ]);

  console.log(dirsInRudaPath);
}
