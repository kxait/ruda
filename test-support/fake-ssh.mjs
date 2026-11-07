/**
 * Minimal NodeSSH stand-in that records calls and lets each test decide what a
 * remote command returns. `exec` calls are `(command, args, options)` just like
 * node-ssh.
 *
 * @param {(call: {
 *   command: string;
 *   args: string[];
 *   options?: object;
 *   text: string;
 * }) => any} [handler]
 */
export function createFakeSsh(handler) {
  /** @type {any[]} */
  const calls = [];

  const ssh = {
    calls,
    async exec(command, args, options) {
      const text = args?.[1] ?? '';
      const call = { command, args, options, text };
      calls.push(call);
      if (handler) {
        return handler(call);
      }
      return { code: 0, stdout: '', stderr: '' };
    },
    async putFile(localPath, remotePath) {
      const call = { command: 'putFile', localPath, remotePath };
      calls.push(call);
    },
  };

  return ssh;
}
