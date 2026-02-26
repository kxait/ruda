import chalk from 'chalk';
import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';

export async function init() {
  const { envs } = await readRudaYml();
  for (const [envName, env] of Object.entries(envs)) {
    const sshConnection = await getSshConnection(env);
    await sshConnection.exec('sh', ['-c', `mkdir -p ~/ruda/${envName}/files`]);
    await sshConnection.exec('sh', [
      '-c',
      `touch ~/ruda/${envName}/config.yml`,
    ]);
    sshConnection.dispose();
    console.log(chalk.blue('init'), `env ${envName} initialized`);
  }
  console.log(chalk.blue('init'), `done`);
}
