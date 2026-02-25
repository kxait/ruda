import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
import { getRepoExists } from '../lib/build-tools/get-repo-exists.mjs';
import { sshWithGuardrail } from '../lib/ssh-with-guardrail.mjs';
import { getEnvPath } from '../lib/get-env-path.mjs';
import { prepareRepoForTarget } from '../lib/build-tools/prepare-repo-for-target.mjs';
import chalk from 'chalk';
/** @import {Command} from "commander" */

/**
 * [target='rdeploy'] -e, --env <env name> -r, --revision <revision>
 *
 * @this {Command}
 */
export async function deploy() {
  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const repoExists = await getRepoExists(sshConnection, env);

  const envPath = await getEnvPath(sshConnection, env);
  const repoPath = `${envPath}/repo`;

  const remoteConfig = await getRemoteConfig(env, sshConnection);

  console.log(
    chalk.blue('deploy'),
    remoteConfig.idRsaPath
      ? `using identity file ${remoteConfig.idRsaPath}`
      : 'not using identity file',
  );

  if (!repoExists) {
    console.error(chalk.red('error: repo does not exist, run build first'));
  }

  const target = this.opts().target ?? 'rdeploy';

  const { envVars } = await prepareRepoForTarget(
    sshConnection,
    remoteConfig,
    envPath,
    this.opts().revision,
  );

  console.log(chalk.blue('deploy'), `running target ${target}`);

  await sshWithGuardrail(
    sshConnection,
    repoPath,
    `${envVars} make ${target}`.trim(),
    `make ${target}`,
  );

  sshConnection.dispose();
  console.log(chalk.blue('deploy'), 'done');
}
