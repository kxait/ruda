import { readRudaYml } from "../lib/config.mjs"
import { getSshConnection } from "../lib/get-ssh-connection.mjs"

/**
  *
  */
export async function init() {
  const { environments } = await readRudaYml()
  for (const [envName, env] of Object.entries(environments)) {
    console.log(`initializing env ${envName}`)
    const sshConnection = await getSshConnection(env)
    await sshConnection.exec('mkdir', ['-p', `~/ruda/${envName}/files`, '2>', '/dev/null'])
    await sshConnection.exec('touch', ['~/ruda/${envName}/config.yml'])
    await sshConnection.exec('touch', ['~/ruda/${envName}/env.yml'])
    sshConnection.dispose()
    console.log(`done`)
  }
}
