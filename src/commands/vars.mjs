import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
import chalk from 'chalk';
/** @import {Command} from "commander" */

/**
 * -e, --env <env name>
 *
 * @this {Command}
 */
export async function vars() {
  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const config = await getRemoteConfig(env, sshConnection);

  const localVars = Object.entries(env.env ?? {});
  const localVarNames = Object.keys(env.env ?? {});

  const remoteVars = Object.entries(config.env ?? {});

  const localFiles = env.files;
  const remoteFiles = Object.values(config.files);

  if (localVars.length > 0) {
    console.log(
      chalk.blue('vars'),
      chalk.bold('==> local vars (local config yaml):'),
    );
    for (const localKv of localVars) {
      console.log(
        chalk.blue('vars'),
        `${chalk.green(localKv[0])}: ${localKv[1]}`,
      );
    }
  }
  if (remoteVars.length > 0) {
    console.log(
      chalk.blue('vars'),
      chalk.bold('==> remote vars (remote config yaml):'),
    );
    for (const remoteKv of remoteVars) {
      const overrides = localVarNames.includes(remoteKv[0]);
      console.log(
        chalk.blue('vars'),
        `${overrides ? chalk.red('overrides local! ') : ''}${chalk.yellow(remoteKv[0])}: ${remoteKv[1]}`,
      );
    }
  }

  if (remoteFiles.length > 0) {
    console.log(chalk.blue('vars'), chalk.bold('==> remote files:'));
    for (const [sha256, remotePath] of Object.entries(config.files)) {
      console.log(
        chalk.blue('vars'),
        `${chalk.yellow(remotePath)}: ${sha256.substr(0, 8)}`,
      );
    }
  }

  const missingFiles =
    localFiles?.filter((f) => !remoteFiles.includes(f)) ?? [];
  if (missingFiles.length > 0) {
    for (const missingFile of missingFiles) {
      console.log(
        chalk.blue('vars'),
        `${chalk.red('missing file (present in local list, missing on remote)')}: ${missingFile}`,
      );
    }
  }

  sshConnection.dispose();
  console.log(chalk.blue('vars'), 'done');
}
