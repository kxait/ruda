import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
import { writeRemoteConfig } from '../lib/write-remote-config.mjs';
import { stat } from 'node:fs/promises';
/** @import {Command} from "commander" */

/**
 * <cert path>
 * -e, --env <env name>
 *
 * @this {Command}
 */
export async function uploadCert() {
  const path = this.args[0];
  const fileExists = await (async () => {
    try {
      const statResult = await stat(path);
      if (!statResult.isFile()) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  })();
  if (path && !fileExists) {
    console.error('error: file does not exist or is a dir');
    process.exit(1);
  }

  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const config = await getRemoteConfig(env, sshConnection);

  const homePath = await sshConnection.exec('sh', ['-c', 'echo $HOME']);

  const remotePath = `${homePath.trim()}/ruda/${env.name}/id_rsa`;

  await sshConnection.putFile(path, remotePath);
  await sshConnection.exec('sh', ['-c', `chmod 700 ${remotePath}`]);

  config.idRsaPath = remotePath;

  await writeRemoteConfig(env, sshConnection, config);

  sshConnection.dispose();

  console.log('done');
}
