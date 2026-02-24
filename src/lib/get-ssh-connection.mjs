import { NodeSSH } from "node-ssh"
import { readFile, stat } from "node:fs/promises"
import z from "zod"
/**
  * @import { rudaYmlEnvironmentSchema } from "./config.mjs"
  */

/**
  * @param {z.infer<typeof rudaYmlEnvironmentSchema>} env
  */
export async function getSshConnection(env) {
  if (!(await stat(env.sshKeyPath)).isFile()) {
    console.error('ssh key file not found')
    process.exit(1)
  }
  const sshKey = await readFile(env.sshKeyPath, 'utf8')
  try {
    return await new NodeSSH().connect({
      host: env.ssh,
      username: 'kx',
      privateKey: sshKey
    })
  } catch (error) {
    console.error('could not connect to ssh server')
    console.error(error)
    process.exit(1)
  }
}
