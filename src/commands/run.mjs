import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
import { getRepoExists } from '../lib/build-tools/get-repo-exists.mjs';
import { sshWithGuardrail } from '../lib/ssh-with-guardrail.mjs';
import { getEnvPath } from '../lib/get-env-path.mjs';
import { cloneRepo } from '../lib/build-tools/clone-repo.mjs';
import { prepareRepoForTarget } from '../lib/build-tools/prepare-repo-for-target.mjs';
import chalk from 'chalk';
/**
 * @import {Command} from "commander"
 * @import {RudaYmlResultEnv} from "../lib/config.mjs"
 */

/**
 * <target> -e, --env <env name> -r, --revision <revision>
 *
 * @this {Command}
 */
export async function run() {
  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const repoExists = await getRepoExists(sshConnection, env);

  const envPath = await getEnvPath(sshConnection, env);
  const repoPath = `${envPath}/repo`;

  const remoteConfig = await getRemoteConfig(env, sshConnection);

  for (const file of env.files ?? []) {
    const existsOnRemote = Object.values(remoteConfig.files).includes(file);
    if (!existsOnRemote) {
      console.error(chalk.red(`error: file ${file} not found on remote`));
      process.exit(1);
    }
  }

  if (!remoteConfig.idRsaPath) {
    console.log(chalk.blue('run'), 'not using identity file');
  }

  if (!repoExists) {
    console.log(
      chalk.blue('run'),
      `repo does not exist, cloning into ${repoPath}`,
    );
    await cloneRepo(sshConnection, env, remoteConfig, envPath);
  }

  const target = this.args[0];

  const { envVars: remoteEnvVars } = await prepareRepoForTarget(
    sshConnection,
    remoteConfig,
    envPath,
    this.opts().revision,
  );

  const localEnvVars = getRudaYmlEnvVars(env);
  const envVars = `${localEnvVars} ${remoteEnvVars}`.trim();

  console.log(chalk.blue('run'), `running target ${target}`);

  await sshWithGuardrail(
    sshConnection,
    repoPath,
    `${envVars} make ${target}`.trim(),
    `make ${target}`,
  );

  sshConnection.dispose();
  console.log(chalk.blue('run'), 'done');
}

/**
 * @param {RudaYmlResultEnv} env
 * @returns {string}
 */
function getRudaYmlEnvVars(env) {
  const pairs = Object.entries(env.env ?? {});
  return pairs.map(([k, v]) => `${k}=${v}`).join(' ');
}
