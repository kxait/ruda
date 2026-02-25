/** @import {RemoteConfig} from "../remote-config-schema.mjs" */

/**
 * @param {RemoteConfig} remoteConfig
 * @returns {string}
 */
export function getSshCommand(remoteConfig) {
  return remoteConfig.idRsaPath
    ? `ssh -i ${remoteConfig.idRsaPath} -o StrictHostKeyChecking=no -o IdentitiesOnly=yes`
    : 'ssh -o StrictHostKeyChecking=no -o IdentitiesOnly=yes';
}
