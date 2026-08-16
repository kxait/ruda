import { NodeSSH } from 'node-ssh';
import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { untildify } from './untildify.mjs';
/** @import {RudaYmlResultEnv} from "./config.mjs" */

/** @param {RudaYmlResultEnv} env */
export async function getSshConnection(env) {
  const p = untildify(env.ssh_key_path);

  if (!(await stat(p)).isFile()) {
    console.error('ssh key file not found');
    process.exit(1);
  }

  const sshKey = await readFile(p, 'utf8');
  try {
    return await new NodeSSH().connect({
      host: env.ssh_host,
      username: env.ssh_user,
      privateKey: sshKey,
      port: parseInt(env.ssh_port),
    });
  } catch (error) {
    console.error('could not connect to ssh server');
    console.error(error);
    process.exit(1);
  }
}
