import { hash } from 'node:crypto';
import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
import { writeRemoteConfig } from '../lib/write-remote-config.mjs';
import { readFile, stat } from 'node:fs/promises';
import chalk from 'chalk';
/** @import {Command} from "commander" */

/**
 * <remote path>
 * [local file]
 * -e, --env <env name>
 *
 * @this {Command}
 */
export async function setFile() {
  if (!this.args[1]) {
    await del(this);
  } else {
    await upload(this);
  }

  console.log(chalk.blue('set-file'), 'done');
}

// TODO: deduplicate this code

/** @param {Command} self */
async function upload(self) {
  const path = self.args[1];
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
    console.error(chalk.red('error: file does not exist or is a dir'));
    process.exit(1);
  }

  const yml = await readRudaYml();

  const env = getSingleEnv(self, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const config = await getRemoteConfig(env, sshConnection);

  const fileAtThisPathSha256 = Object.entries(config.files).find(
    ([_, v]) => v === self.args[0],
  )?.[0];
  if (fileAtThisPathSha256) {
    console.error(
      chalk.red(
        `error: file already exists at this path, run 'ruda set-file ${self.args[0]}' to remove`,
      ),
    );
    process.exit(1);
  }

  const homePath = await sshConnection.exec('sh', ['-c', 'echo $HOME']);

  const fileContent = await readFile(path, 'utf8');

  const fileSha256 = hash('sha256', fileContent);
  const filePath = `${homePath.trim()}/ruda/${env.name}/files/${fileSha256}`;

  await sshConnection.putFile(path, filePath);

  config.files[fileSha256] = self.args[0];

  await writeRemoteConfig(env, sshConnection, config);

  sshConnection.dispose();
}

/** @param {Command} self */
async function del(self) {
  const yml = await readRudaYml();

  const env = getSingleEnv(self, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const config = await getRemoteConfig(env, sshConnection);

  const homePath = await sshConnection.exec('sh', ['-c', 'echo $HOME']);

  const row = Object.entries(config.files).find(([_, v]) => v === self.args[0]);
  if (!row) {
    console.error(chalk.red('error: file does not exist on remote'));
    process.exit(1);
  }
  const [fileSha256] = row;

  const filePath = `${homePath.trim()}/ruda/${env.name}/files/${fileSha256}`;

  await sshConnection.exec('sh', ['-c', `rm -f ${filePath}`]);

  delete config.files[fileSha256];

  await writeRemoteConfig(env, sshConnection, config);

  sshConnection.dispose();
}
