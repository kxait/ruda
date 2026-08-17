/**
 * @param {string} envPath
 * @param {boolean} hasIdRsa
 * @returns {string}
 */
export function getSshCommand(envPath, hasIdRsa) {
  return hasIdRsa
    ? `ssh -i ${envPath}/id_rsa -o StrictHostKeyChecking=no -o IdentitiesOnly=yes`
    : 'ssh -o StrictHostKeyChecking=no -o IdentitiesOnly=yes';
}
