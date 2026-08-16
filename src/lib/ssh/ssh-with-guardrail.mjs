/** @import {NodeSSH} from "node-ssh" */

import chalk from 'chalk';
import { elegantExit } from '../elegant-exit.mjs';

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
      console.log(
        chalk.grey('remote'),
        data
          .toString()
          .trim()
          .replaceAll('\n', `\n${chalk.grey('remote')} `),
      );
    },
    // most stderr is not an error, so we don't want to print it to stderr
    onStderr: (data) => {
      console.log(
        `${chalk.red('!')}${chalk.grey('remote')}`,
        chalk
          .grey(data.toString().trim())
          .replaceAll('\n', `\n${chalk.red('!')}${chalk.grey('remote')} `),
      );
    },
  });

  if (result.code !== 0) {
    console.error(
      chalk.red(`error: error running ${opName} (result code ${result.code})`),
    );
    await elegantExit(result.code ?? 1);
  }
}
