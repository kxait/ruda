/** @import {NodeSSH} from "node-ssh" */

import { stringify } from 'yaml';
import { remoteConfigSchema } from './remote-config-schema.mjs';
import { encodeTransport } from '../encode-transport.mjs';

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @param {remoteConfigSchema} config
 * @returns
 */
export async function writeRemoteConfig(sshConnection, envPath, config) {
  const configPath = `${envPath}/config.yml`;

  const configSerialized = stringify(config);
  const configEncoded = encodeTransport(configSerialized);

  await sshConnection.exec('sh', [
    '-c',
    `echo ${configEncoded} | base64 -d > ${configPath}`,
  ]);
}
