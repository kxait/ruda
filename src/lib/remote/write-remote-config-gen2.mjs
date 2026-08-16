/** @import {NodeSSH} from "node-ssh" */

import { stringify } from 'yaml';
import { remoteConfigGen2Schema } from './remote-config-gen2-schema.mjs';
import { encodeTransport } from '../encode-transport.mjs';

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @param {remoteConfigGen2Schema} config
 * @returns
 */
export async function writeRemoteConfigGen2(sshConnection, envPath, config) {
  const configPath = `${envPath}/config.yml`;

  const configSerialized = stringify(config);
  const configEncoded = encodeTransport(configSerialized);

  await sshConnection.exec('sh', [
    '-c',
    `echo ${configEncoded} | base64 -d > ${configPath}`,
  ]);
}
