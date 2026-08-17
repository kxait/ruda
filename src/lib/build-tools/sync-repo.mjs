/** @import {NodeSSH} from "node-ssh" */

import chalk from 'chalk';
import { remoteConfigSchema } from '../remote/remote-config-schema.mjs';
import { cloneRepo } from './clone-repo.mjs';
import { getRepoRef } from './get-repo-ref.mjs';
import { restoreFetchRepo } from './restore-fetch-repo.mjs';
import { getLatestRef } from './get-repo-latest-ref.mjs';
import { checkoutRepo } from './checkout-repo.mjs';

/** @typedef {{ targetRef?: string }} SyncOptions */

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @param {remoteConfigSchema} remoteConfig
 * @param {SyncOptions | undefined} options
 */
export async function syncRepo(sshConnection, envPath, remoteConfig, options) {
  const hasIdRsa =
    (await sshConnection.exec('sh', [
      '-c',
      `test -f ${envPath}/id_rsa && echo $? || echo $?`,
    ])) === '0';

  const repoExists =
    (await sshConnection.exec('sh', [
      '-c',
      `test -d ${envPath}/repo && echo $? || echo $?`,
    ])) === '0';

  if (!repoExists) {
    await cloneRepo(sshConnection, envPath, remoteConfig, {
      hasIdRsa,
      targetRef: options?.targetRef,
    });
    const ref = await getRepoRef(sshConnection, envPath, hasIdRsa);
    console.log(chalk.blue('sync'), `repo cloned at ${ref}`);
    return;
  }

  await restoreFetchRepo(sshConnection, envPath, hasIdRsa);
  const currentRef = await getRepoRef(sshConnection, envPath, hasIdRsa);
  const latestRef = await getLatestRef(sshConnection, envPath, hasIdRsa);
  const targetRef = options?.targetRef ?? latestRef;

  if (targetRef === latestRef && currentRef !== targetRef) {
    console.log(
      chalk.blue('sync'),
      `new version available on origin/HEAD, syncing to ${targetRef}`,
    );
  }

  if (currentRef === targetRef) {
    console.log(chalk.blue('sync'), `repo already at ${targetRef}`);
    return;
  }

  await checkoutRepo(sshConnection, envPath, hasIdRsa, targetRef);

  console.log(
    chalk.blue('sync'),
    `repo checked out at ${targetRef} (from ${currentRef})`,
  );
}
