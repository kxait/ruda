import { NodeSSH } from "node-ssh"
import { readFile, stat } from "node:fs/promises"
import { homedir } from "node:os"
import z from "zod"
/**
  * @import { rudaYmlEnvironmentSchema } from "./config.mjs"
  */

/**
  * @param {z.infer<typeof rudaYmlEnvironmentSchema>} env
  */
export async function getSshConnection(env) {
  const p = untildify(env.keyPath)

  if (!(await stat(p)).isFile()) {
    console.error('ssh key file not found')
    process.exit(1)
  }

  const sshKey = await readFile(p, 'utf8')
  try {
    return await new NodeSSH().connect({
      host: env.hostname,
      username: env.username,
      privateKey: sshKey
    })
  } catch (error) {
    console.error('could not connect to ssh server')
    console.error(error)
    process.exit(1)
  }
}

/**
  * @param {string} p
  * @returns {string}
  */
function untildify(p) {
  return p.replace(/^~/, homedir())
}
