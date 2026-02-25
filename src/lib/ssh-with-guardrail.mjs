/** @import {NodeSSH} from "node-ssh" */

import chalk from 'chalk';

/**
 * @param {NodeSSH} sshConnection
 * @param {string} cwd
 * @param {string} command
 * @param {string} opName
 */
export async function sshWithGuardrail(sshConnection, cwd, command, opName) {
  const result = await sshConnection.exec('sh', ['-c', command], {
    cwd,
    stream: 'both',
    onStdout: (data) => {
      console.log(chalk.grey(data.toString()));
    },
    onStderr: (data) => {
      console.error(chalk.red('stderr'), chalk.grey(data.toString().trim()));
    },
  });

  if (result.code !== 0) {
    console.error(chalk.red(`error: error running ${opName}`));
    sshConnection.dispose();
    process.exit(result.code);
  }
}
