import { NodeSSH } from 'node-ssh';
import { userInfo, hostname } from 'node:os';
import { elegantExit } from '../elegant-exit.mjs';

/**
 * @param {NodeSSH} sshConnection
 * @param {string} envPath
 * @returns {Promise<string>}
 */
export async function remoteGenerateEd25519(sshConnection, envPath) {
  const generatedIdRsaPath = `${envPath}/id_rsa`;
  const comment = generateSSHComment();

  const sshKeygenOutput = await sshConnection.exec('sh', [
    '-c',
    `ssh-keygen -t ed25519 -f ${generatedIdRsaPath} -N "" -C "${comment}"`,
  ]);

  const exitCode = await sshConnection.exec('sh', ['-c', `echo $?`]);

  if (exitCode.trim() !== '0') {
    console.error(
      `error: could not generate git repo identity file at ${generatedIdRsaPath}`,
    );
    console.error(sshKeygenOutput);
    await elegantExit(1);
  }

  await sshConnection.exec('sh', ['-c', `chmod 600 ${generatedIdRsaPath}`]);

  const sshKeygenPubOutput = await sshConnection.exec('sh', [
    '-c',
    `ssh-keygen -y -f ${generatedIdRsaPath}`,
  ]);

  return sshKeygenPubOutput;
}

function generateSSHComment() {
  const username = userInfo().username;
  const host = hostname();
  return `${username}@${host}`;
}
