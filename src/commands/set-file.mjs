import { hash } from 'node:crypto';
import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
import { writeRemoteConfig } from '../lib/write-remote-config.mjs';
import { readFile, stat } from 'node:fs/promises';
/** @import {Command} from "commander" */

/**
 * <local file>
 * <remote path>
 * -e, --env <env name>
 *
 * @this {Command}
 */
export async function setFile() {
  const path = this.args[0];
  const statResult = await stat(path);
  if (!statResult.isFile()) {
    console.error('error: file does not exist');
    process.exit(1);
  }
  const fileContent = await readFile(path, 'utf8');
  const fileSha256 = hash('sha256', fileContent);

  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const config = await getRemoteConfig(env, sshConnection);

  const homePath = await sshConnection.exec('sh', ['-c', 'echo $HOME']);
  const filePath = `${homePath.trim()}/ruda/${env.name}/files/${fileSha256}`;

  await sshConnection.putFile(path, filePath);

  config.files[fileSha256] = this.args[1];

  await writeRemoteConfig(env, sshConnection, config);

  sshConnection.dispose();
  console.log('done');
}
