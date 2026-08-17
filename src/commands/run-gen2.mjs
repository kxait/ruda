/** @import {Command} from "commander" */

import { getRepoRef } from '../lib/build-tools-gen2/get-repo-ref.mjs';
import { sshWithGuardrail } from '../lib/ssh/ssh-with-guardrail.mjs';
import { getCommandContextWithEnv } from '../lib/get-command-context.mjs';

/** @this {Command} */
export async function runGen2() {
  const name = this.args[0];

  const { sshConnection, remoteConfig, envPath, hasIdRsa } =
    await getCommandContextWithEnv({
      envName: name,
    });

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
