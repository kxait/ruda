import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
import { writeRemoteConfig } from '../lib/write-remote-config.mjs';
/** @import {Command} from "commander" */

/**
 * <var name>
 * [value]
 * -e, --env <env name>
 *
 * @this {Command}
 */
export async function set() {
  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const config = await getRemoteConfig(env, sshConnection);

  config.env[this.args[0]] = this.args[1];

  await writeRemoteConfig(env, sshConnection, config);

  sshConnection.dispose();
  console.log('done');
}
