import chalk from 'chalk';
import { NodeSSH } from 'node-ssh';
import { elegantExit } from '../elegant-exit.mjs';

/** @param {NodeSSH} ssh */
export async function getRemoteValidRudaDirPath(ssh, create = false) {
  const homedir = await ssh.exec('sh', ['-c', 'echo $HOME']);
  const rudaDir = `${homedir.trim()}/ruda`;

  if (create) {
    await ssh.exec('sh', ['-c', `mkdir -p ${rudaDir}`]);
  } else {
    const existsDir = await ssh.exec('sh', [
      '-c',
      `test -d ${rudaDir} && echo $? || echo $?`,
    ]);
    if (existsDir.trim() !== '0') {
      console.error(chalk.red(`error: dir ${rudaDir} does not exist`));
      await elegantExit(1);
    }
  }

  return rudaDir;
}
