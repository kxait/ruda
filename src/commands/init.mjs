import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';

/**
 *
 */
export async function init() {
  const { environments } = await readRudaYml();
  for (const [envName, env] of Object.entries(environments)) {
    console.log(`initializing env ${envName}`);
    const sshConnection = await getSshConnection(env);
    await sshConnection.exec('sh', ['-c', `mkdir -p ~/ruda/${envName}/files`]);
    await sshConnection.exec('sh', [
      '-c',
      `touch ~/ruda/${envName}/config.yml`,
    ]);
    await sshConnection.exec('sh', ['-c', `touch ~/ruda/${envName}/env.yml`]);
    sshConnection.dispose();
    console.log(`done`);
  }
}
