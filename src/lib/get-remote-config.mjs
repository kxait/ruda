/**
 * @import {NodeSSH} from "node-ssh"
 * @import {RudaYmlResultEnv} from "./config.mjs"
 * @import {RemoteConfig} from "./remote-config-schema.mjs"
 */

import { parse } from 'yaml';
import { remoteConfigSchema } from './remote-config-schema.mjs';

/**
 * @param {RudaYmlResultEnv} env
 * @param {NodeSSH} sshConnection
 * @returns {Promise<RemoteConfig>}
 */
export async function getRemoteConfig(env, sshConnection) {
  const configText = await sshConnection.exec('sh', [
    '-c',
    `cat ~/ruda/${env.name}/config.yml`,
  ]);

  try {
    // you'd think you could somehow just do this with zod
    const configParsed = parse(configText);
    if (configParsed === null) {
      return { env: {}, files: {} };
    }
    const cfg = {
      env: configParsed['env'] ?? {},
      files: configParsed['files'] ?? {},
      idRsaPath: configParsed['idRsaPath'] ?? undefined,
    };
    return remoteConfigSchema.parse(cfg);
  } catch (e) {
    console.error('error: could not parse remote config', e);
    sshConnection.dispose();
    process.exit(1);
  }
}
