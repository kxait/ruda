/**
 * @import {NodeSSH} from "node-ssh"
 * @import {RudaYmlResultEnv} from "./config.mjs"
 * @import {remoteConfigSchema} from "./remote/remote-config-schema.mjs"
 */

import { stringify } from 'yaml';
import { encodeTransport } from './encode-transport.mjs';

/**
 * @param {RudaYmlResultEnv} env
 * @param {NodeSSH} sshConnection
 * @param {remoteConfigSchema} config
 */
export async function writeRemoteConfig(env, sshConnection, config) {
  const configSerialized = stringify(config);

  const encodedConfig = encodeTransport(configSerialized);
  await sshConnection.exec('sh', [
    '-c',
    `echo ${encodedConfig} | base64 -d > ~/ruda/${env.name}/config.yml`,
  ]);
}
