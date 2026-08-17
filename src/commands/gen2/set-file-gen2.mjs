/** @import {Command} from "commander" */

/** @this {Command} */
export async function setFileGen2() {
  throw new Error('not implemented');
  /*
  const name = this.args[0];
  const filePathRemote = this.args[1];
  const filePathLocal = this.args[2];

  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection);
  const envPath = `${remoteRudaPath}/${name}`;
  const remoteConfig = await getRemoteConfigGen2(sshConnection, envPath);



  remoteConfig.files[filePathRemote] = filePathLocal;

  await writeRemoteConfigGen2(sshConnection, envPath, remoteConfig);

  console.log(chalk.blue(commandNames.setFile2), `done`);
  */
}
