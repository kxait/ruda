# AGENTS.md

## What this is

`ruda` is a Node.js ESM CLI ("simple remote task runner") that manages deployment
environments over SSH. There is no build step; source runs directly. Entrypoint is
`src/main.mjs`; user-facing usage is in `README.md`.

## Setup and verification

- `npm install`, then `npm link` to expose the global `ruda` command. Locally,
  `./src/main.mjs <command>` also works.
- Tests use Node's built-in test runner: `npm test` (or `npm run test:watch`).
  There are no extra test dependencies, CI workflows, or pre-commit hooks.
- Tests live in `test/**/*.test.mjs`; `test-support/fake-ssh.mjs` is a NodeSSH
  stand-in. CLI tests spawn `src/main.mjs` with a temporary `HOME`, so they do not
  touch the network.
- Formatting is the only installed check: `npm run format:check` /
  `npm run format`. Do not use `prettier --check .`; the repo's own
  `.prettierrc.json` and `jsconfig.json` already fail it.
- JSDoc types are checked by `jsconfig.json` (`checkJs`), but TypeScript is not a
  dependency.
- Real end-to-end verification requires a reachable SSH host configured in
  `~/.ruda-meta.yml`.

## Architecture

- `src/commands/*.mjs` holds one Commander handler per command. Command names are
  centralized in `command-names.mjs`; register new commands in both `src/main.mjs`
  and that map.
- `src/lib/get-command-context.mjs` builds the SSH plus remote-env context.
  `getCommandContextWithEnv` verifies `$HOME/ruda/<env>` exists and loads its config.
- Remote state per environment lives at `$HOME/ruda/<env>/`: `config.yml`, optional
  `id_rsa`, `files/<sha256>`, and `repo/`. The only local state is
  `~/.ruda-meta.yml`.
- Both configs are YAML validated with zod: local metaconfig schema v1, remote env
  config schema v2 (`{version:'2', env, files, remoteUrl, didGenerateIdRsa}`).
- SSH uses the singleton `SshConnectionPool` (limit 1), configured from
  `~/.ruda-meta.yml` (`sshHost`, `sshUser`, `sshPort`, `sshKeyPath`). Reuse the
  returned connection rather than requesting nested connections.
- Exit through `elegantExit()` so pooled SSH connections are disposed. It is also
  wired to Commander's `postAction`; avoid calling `process.exit` directly.
- Run remote commands via `sshWithGuardrail` (streams stdin, exits on nonzero) and
  build git commands with `getSshCommand` so the environment's `id_rsa` is used.
- Write remote config/files through `encodeTransport` (base64), as existing code
  does, to avoid shell quoting issues.

## Behavior gotchas

- `run` injects the configured env vars plus `ENV` and `REF`, with legacy aliases
  `RUDA_ENV_NAME` and `VERSION`, into the remote command.
- `sync` declares `--ref` in `src/main.mjs`, but `src/commands/sync.mjs` reads
  `this.opts().targetRef`, so `--ref` currently has no effect. If touching this,
  align the option and handler names.
- `init` refuses an existing environment directory; `remove` requires `--force`
  when the environment has files or a generated identity.
- `set-file` keys stored files by the SHA-256 of their contents. `sync` copies each
  stored file into `repo/` only if the target file does not already exist.
