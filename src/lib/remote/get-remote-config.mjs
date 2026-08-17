import { NodeSSH } from 'node-ssh';
import { parse } from 'yaml';
import { remoteConfigSchema } from './remote-config-schema.mjs';
import chalk from 'chalk';
import { elegantExit } from '../elegant-exit.mjs';

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @returns {Promise<remoteConfigSchema>}
 */
export async function getRemoteConfigGen2(sshConnection, envPath) {
  const configPath = `${envPath}/config.yml`;
  const configText = await sshConnection.exec('sh', [
    '-c',
    `cat ${configPath}`,
  ]);

  try {
    const configParsed = parse(configText);
    return remoteConfigSchema.parse(configParsed);
  } catch (e) {
    console.error(
      chalk.red(`error: could not parse remote config at ${configPath}`),
    );
    console.error('config text: ', configText);
    console.error(e);
    await elegantExit(1);
    // @ts-ignore - elegantExit has process.exit
    return {};
  }
}
