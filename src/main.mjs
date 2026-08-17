#!/usr/bin/env node
import { program } from 'commander';
import { defaultMetaconfigPath } from './lib/meta/default-metaconfig-path.mjs';
import { elegantExit } from './lib/elegant-exit.mjs';
import { commandNames } from './commands/command-names.mjs';
import { metaconfig } from './commands/metaconfig.mjs';
import { describeEnv } from './commands/describe-env.mjs';
import { envPubkey } from './commands/env-pubkey.mjs';
import { initEnv } from './commands/init-env.mjs';
import { initMetaconfig } from './commands/init-metaconfig.mjs';
import { listEnvs } from './commands/list-envs.mjs';
import { removeEnv } from './commands/remove-env.mjs';
import { runCommand } from './commands/run-command.mjs';
import { setFile } from './commands/set-file.mjs';
import { setVariable } from './commands/set-variable.mjs';
import { setMetaconfig } from './commands/set-metaconfig.mjs';
import { sync } from './commands/sync.mjs';

program.description('remote deployment tool');

program
  .command(commandNames.metaGet)
  .action(metaconfig)
  .description(`read meta config stored at ${defaultMetaconfigPath}`);

program
  .command(commandNames.metaInit)
  .action(initMetaconfig)
  .description('init meta config file')
  .option('--ssh-host <ssh-host>', 'ssh host')
  .option('--ssh-user <ssh-user>', 'ssh user')
  .option('--ssh-port <ssh-port>', 'ssh port');

program
  .command(commandNames.metaSet)
  .argument('key', 'one of: sshHost, sshUser, sshPort, sshKeyPath')
  .argument('value', 'value to set')
  .action(setMetaconfig)
  .description('set a meta config value');

program
  .command(commandNames.list)
  .action(listEnvs)
  .description('list all remote environments');

program
  .command(commandNames.init)
  .argument('name')
  .argument('remote-url', 'git repo url')
  .action(initEnv)
  .option('--generate-identity', 'generate git repo identity file')
  .option('--identity-file <path>', 'git repo identity file path to upload')
  .description('init a new remote environment');

program
  .command(commandNames.remove)
  .argument('name')
  .action(removeEnv)
  .option('-f, --force', 'remove despite warnings')
  .description('remove a remote environment');

program
  .command(commandNames.pubkey)
  .argument('name')
  .action(envPubkey)
  .description(
    'retrieve the public key of a remote environment identity file (if environment has one)',
  );

program
  .command(commandNames.describe)
  .argument('name')
  .action(describeEnv)
  .description('describe a remote environment');

program
  .command(commandNames.set)
  .action(setVariable)
  .argument('env-name')
  .argument('key')
  .argument('[value]', 'value to set, will unset if not provided')
  .description('set a value in the env vars for a remote environment');

program
  .command(commandNames.setFile)
  .action(setFile)
  .argument('env-name')
  .argument('remote-path')
  .argument(
    '[local-path]',
    'local file path to be uploaded, will remove if not provided',
  )
  .description('upload a file to be used during remote deployment');

program
  .command(commandNames.sync)
  .argument('env-name')
  .action(sync)
  .option('-r, --ref <ref>', 'target ref to sync to')
  .description(
    'sync a remote environment git repo, either to a specific ref or to the latest origin/HEAD',
  );

program
  .command(commandNames.run)
  .argument('env-name')
  .argument('<command-text...>')
  .action(runCommand)
  .description('run a command in the remote environment');

program.hook('postAction', async () => {
  await elegantExit(0);
});

program.parse();
