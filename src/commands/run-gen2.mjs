/** @import {Command} from "commander" */

import { ok } from 'assert';
import { getRemoteConfigGen2 } from '../lib/remote/get-remote-config-gen2.mjs';
import { getRemoteValidRudaDirPath } from '../lib/remote/get-remote-valid-ruda-dir-path.mjs';
import { getDefaultSshConnectionPool } from '../lib/ssh/ssh-connection-pool.mjs';
import { getRepoRef } from '../lib/build-tools-gen2/get-repo-ref.mjs';
import { sshWithGuardrail } from '../lib/ssh/ssh-with-guardrail.mjs';

/** @this {Command} */
export async function runGen2() {
  const name = this.args[0];

  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);
  const envPath = `${remoteRudaPath}/${name}`;
  const remoteConfig = await getRemoteConfigGen2(sshConnection, envPath);

  const hasIdRsa =
    (await sshConnection.exec('sh', [
      '-c',
      `test -f ${envPath}/id_rsa && echo $? || echo $?`,
    ])) === '0';

  const ref = await getRepoRef(sshConnection, envPath, hasIdRsa);

  const envVars = {
    ...remoteConfig.env,
    ENV: name,
    REF: ref,
  };

  const envVarText = Object.entries(envVars)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');

  const commandText = this.args.slice(1).join(' ');

  const fullCommand = `${envVarText} ${commandText}`;

  const repoPath = `${envPath}/repo`;

  await sshWithGuardrail(sshConnection, repoPath, fullCommand, commandText);
}
