import chalk from 'chalk';
import { NodeSSH } from 'node-ssh';
import { readFile } from 'node:fs/promises';
import { untildify } from '../untildify.mjs';
import { getMetaconfig } from '../meta/get-metaconfig.mjs';
import { elegantExit } from '../elegant-exit.mjs';

/**
 * @typedef {() => Promise<{
 *   host: string;
 *   user: string;
 *   port: string;
 *   keyPath: string;
 * }>} AsyncSshConnectionPoolConfigFactory
 */

export class SshConnectionPool {
  /**
   * @param {number} limit
   * @param {AsyncSshConnectionPoolConfigFactory} configFactory
   */
  constructor(limit, configFactory) {
    this.limit = limit;
    this.configFactory = configFactory;
  }

  /** @type {{ ssh: NodeSSH; active: boolean }[]} */
  connections = [];

  /** @returns {Promise<NodeSSH | 'busy'>} */
  async getConnection() {
    // has free connection?
    const freeConnection = this.connections.find((c) => !c.active);
    if (freeConnection) {
      freeConnection.active = true;
      return freeConnection.ssh;
    }

    // no free connections, create new
    if (this.connections.length >= this.limit) {
      return 'busy';
    }

    const config = await this.configFactory();
    const keyPath = untildify(config.keyPath);
    let privateKey = '';
    try {
      privateKey = await readFile(keyPath, 'utf8');
    } catch (e) {
      console.error(
        chalk.red(`error: could not read private key at ${keyPath}`),
      );
      console.error(e);
      await elegantExit(1);
    }

    try {
      const ssh = new NodeSSH();
      await ssh.connect({
        host: config.host,
        username: config.user,
        privateKey: privateKey,
        port: parseInt(config.port),
      });
      this.connections.push({ ssh, active: true });
      return ssh;
    } catch (e) {
      console.error(chalk.red('error: could not connect to ssh server'));
      console.error(e);
      await elegantExit(1);
      // @ts-ignore - elegantExit has process.exit
      return {};
    }
  }

  /** @param {NodeSSH} ssh */
  async free(ssh) {
    const connection = this.connections.find((c) => c.ssh === ssh);
    if (!connection) {
      return;
    }
    connection.active = false;
  }

  // cleanup
  async disposeAll() {
    for (const connection of this.connections) {
      connection.ssh.dispose();
    }
  }
}

/** @type {SshConnectionPool | undefined} */
let defaultSshConnectionPool;

export function getDefaultSshConnectionPool() {
  if (!defaultSshConnectionPool) {
    defaultSshConnectionPool = new SshConnectionPool(1, async () => {
      const { metaconfigYml } = await getMetaconfig();
      return {
        host: metaconfigYml.sshHost,
        user: metaconfigYml.sshUser,
        port: metaconfigYml.sshPort,
        keyPath: metaconfigYml.sshKeyPath,
      };
    });
  }
  return defaultSshConnectionPool;
}
