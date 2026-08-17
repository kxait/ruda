/** @import {Command} from "commander" */

import chalk from 'chalk';
import { getCommandContextWithEnv } from '../../lib/get-command-context.mjs';
import { elegantExit } from '../../lib/elegant-exit.mjs';
import { readFile, stat } from 'node:fs/promises';
import { hash } from 'node:crypto';
import { writeRemoteConfigGen2 } from '../../lib/remote/write-remote-config-gen2.mjs';
import { commandNames } from './command-names.mjs';
import path from 'node:path';

/** @this {Command} */
export async function setFileGen2() {
  const name = this.args[0];
  const filePathRemote = this.args[1];
  const filePathLocal = this.args[2];

  const { sshConnection, remoteConfig, envPath } =
    await getCommandContextWithEnv({
      envName: name,
    });

  // delete
  if (!filePathLocal) {
    const entry = Object.entries(remoteConfig.files).find(
      ([k, v]) => v === filePathRemote,
    );
    if (!entry) {
      console.error(
        chalk.red(
          `error: file ${filePathRemote} does not exist on remote, cannot remove`,
        ),
      );
      await elegantExit(1);
      return;
    }

    const remotePath = `${envPath}/files/${entry[0]}`;
    console.log(chalk.blue(commandNames.setFile2), `removing ${remotePath}`);
    await sshConnection.exec('sh', ['-c', `rm ${remotePath}`]);

    const repoPath = `${envPath}/repo`;
    const fileInRepo = path.join(repoPath, entry[1]);
    const fileExistsInRepo = await sshConnection.exec('sh', [
      '-c',
      `test -f ${fileInRepo} && echo $? || echo $?`,
    ]);
    if (fileExistsInRepo.trim() === '0') {
      console.log(chalk.blue(commandNames.setFile2), `removing ${fileInRepo}`);
      await sshConnection.exec('sh', ['-c', `rm ${fileInRepo}`]);
    } else {
      console.log(
        chalk.blue(commandNames.setFile2),
        `file ${fileInRepo} does not exist, skipping`,
      );
    }

    delete remoteConfig.files[entry[0]];
    await writeRemoteConfigGen2(sshConnection, envPath, remoteConfig);
    console.log(chalk.blue(commandNames.setFile2), `done`);
    return;
  }

  // upload
  const fileExistsLocal = await (async () => {
    try {
      const statResult = await stat(filePathLocal);
      if (!statResult.isFile()) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  })();
  if (!fileExistsLocal) {
    console.error(
      chalk.red(`error: local file ${filePathLocal} does not exist`),
    );
    await elegantExit(1);
  }

  if (Object.values(remoteConfig).find((v) => v === filePathRemote)) {
    console.error(
      chalk.red(`error: file ${filePathRemote} already exists on remote`),
    );
    await elegantExit(1);
  }

  const fileContent = await readFile(filePathLocal, 'utf8');
  const fileSha256 = hash('sha256', fileContent);

  remoteConfig.files[fileSha256] = filePathRemote;

  const remotePath = `${envPath}/files/${fileSha256}`;

  console.log(chalk.blue(commandNames.setFile2), `uploading to ${remotePath}`);

  await sshConnection.putFile(filePathLocal, remotePath);

  await writeRemoteConfigGen2(sshConnection, envPath, remoteConfig);

  console.log(chalk.blue(commandNames.setFile2), `done`);
}
