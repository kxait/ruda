/** @import {Command} from "commander" */

import chalk from 'chalk';
import { getCommandContextWithEnv } from '../../lib/get-command-context.mjs';
import { commandNames } from './command-names.mjs';

/** @this {Command} */
export async function describeEnv() {
  const name = this.args[0];

  const { sshConnection, remoteConfig, hasIdRsa, envPath } =
    await getCommandContextWithEnv({
      envName: name,
    });

  console.log(chalk.blue(commandNames.envDescribe), chalk.green('name'), name);

  console.log(
    chalk.blue(commandNames.envDescribe),
    chalk.green('env path'),
    envPath,
  );

  console.log(
    chalk.blue(commandNames.envDescribe),
    chalk.green('cfg version'),
    remoteConfig.version,
  );

  console.log(
    chalk.blue(commandNames.envDescribe),
    chalk.green('remote url'),
    remoteConfig.remoteUrl,
  );

  console.log(
    chalk.blue(commandNames.envDescribe),
    chalk.green('has ssh identity'),
    hasIdRsa
      ? remoteConfig.didGenerateIdRsa
        ? 'yes, generated'
        : 'yes'
      : 'no',
  );

  if (hasIdRsa) {
    const pubkey = await sshConnection.exec('sh', [
      '-c',
      `ssh-keygen -y -f ${envPath}/id_rsa`,
    ]);
    console.log(chalk.blue(commandNames.envDescribe), chalk.green('pubkey'));
    console.log(pubkey);
  }

  console.log(chalk.blue(commandNames.envDescribe), chalk.green('env vars'));

  const envEntries = Object.entries(remoteConfig.env);
  if (envEntries.length === 0) {
    console.log('  none');
  }
  for (const [key, value] of Object.entries(remoteConfig.env)) {
    console.log('  ', chalk.green(key), chalk.gray('='), value);
  }

  console.log(chalk.blue(commandNames.envDescribe), chalk.green('files'));

  const fileEntries = Object.entries(remoteConfig.files);
  if (fileEntries.length === 0) {
    console.log('  none');
  }
  for (const [key, value] of Object.entries(remoteConfig.files)) {
    console.log('  ', chalk.green(key), chalk.gray('->'), value);
  }

  const repoDir = `${envPath}/repo`;
  const repoDirExists = await sshConnection.exec('sh', [
    '-c',
    `test -d ${repoDir} && echo $? || echo $?`,
  ]);
  if (repoDirExists.trim() === '0') {
    console.log(
      chalk.blue(commandNames.envDescribe),
      chalk.green('repo status'),
    );
    const repoStatus = await sshConnection.exec('sh', [
      '-c',
      `cd ${repoDir} && git status`,
    ]);
    console.log(repoStatus);
  }
}
