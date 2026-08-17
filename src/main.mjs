#!/usr/bin/env node
import { init } from './commands/init.mjs';
import { program } from 'commander';
import { setAll } from './commands/set-all.mjs';
import { setFile } from './commands/set-file.mjs';
import { uploadCert } from './commands/upload-cert.mjs';
import { set } from './commands/set.mjs';
import { run } from './commands/run.mjs';
import { vars } from './commands/vars.mjs';
import { commandNames } from './commands/gen2/command-names.mjs';
import { defaultMetaconfigPath } from './lib/meta/default-metaconfig-path.mjs';
import { setGen2 } from './commands/gen2/set-gen2.mjs';
import { describeEnv } from './commands/gen2/describe-env.mjs';
import { setFileGen2 } from './commands/gen2/set-file-gen2.mjs';
import { sync } from './commands/gen2/sync.mjs';
import { runGen2 } from './commands/gen2/run-gen2.mjs';
import { elegantExit } from './lib/elegant-exit.mjs';
import { envPubkey } from './commands/gen2/env-pubkey.mjs';
import { initEnvGen2 } from './commands/gen2/init-env-gen2.mjs';
import { initMetaconfig } from './commands/gen2/init-metaconfig.mjs';
import { listEnvs } from './commands/gen2/list-envs.mjs';
import { metaconfig } from './commands/gen2/metaconfig.mjs';
import { removeEnv } from './commands/gen2/remove-env.mjs';
import { setMetaconfig } from './commands/gen2/set-metaconfig.mjs';
import { migrate } from './commands/gen2/migrate.mjs';

/** Gen1 */
program.description('remote deployment tool');

program.command('init').action(init);

program
  .command('upload-cert <cert-path>')
  .action(uploadCert)
  .option('-e, --env <env-name>', 'environment name');
program
  .command('set <var-name> [value]')
  .description(
    'set a variable in the config file, if no value is provided, the variable will be removed',
  )
  .action(set)
  .option('-e, --env <env-name>', 'environment name');

program
  .command('set-all <env-file>')
  .description(
    'upload all variables from a file to the remote server, the file must be in .env format',
  )
  .action(setAll)
  .option('-e, --env <env-name>', 'environment name');

program
  .command('set-file <remote-path> [local-file]')
  .description(
    'upload a file to the remote server, if no local file is provided, the file will be removed',
  )
  .action(setFile)
  .option('-e, --env <env-name>', 'environment name');

program
  .command('run <target>')
  .action(run)
  .option('-e, --env <env-name>', 'environment name')
  .option('-r, --revision <revision>', 'revision to build');

program
  .command('vars')
  .option('-e, --env <env-name>', 'environment name')
  .action(vars);

/** Gen2 */
program
  .command(commandNames.meta)
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
  .command(commandNames.env)
  .action(listEnvs)
  .description('list all remote environments');

program
  .command(commandNames.envInit)
  .argument('name')
  .argument('remote-url', 'git repo url')
  .action(initEnvGen2)
  .option('--generate-identity', 'generate git repo identity file')
  .option('--identity-file <path>', 'git repo identity file path to upload')
  .description('init a new remote environment');

program
  .command(commandNames.envRemove)
  .argument('name')
  .action(removeEnv)
  .option('-f, --force', 'remove despite warnings')
  .description('remove a remote environment');

program
  .command(commandNames.envPubkey)
  .argument('name')
  .action(envPubkey)
  .description(
    'retrieve the public key of a remote environment identity file (if environment has one)',
  );

program
  .command(commandNames.envDescribe)
  .argument('name')
  .action(describeEnv)
  .description('describe a remote environment');

program
  .command(commandNames.set2)
  .action(setGen2)
  .argument('env-name')
  .argument('key')
  .argument('[value]', 'value to set, will unset if not provided')
  .description('set a value in the env vars for a remote environment');

program
  .command(commandNames.setFile2)
  .action(setFileGen2)
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
  .command(commandNames.run2)
  .argument('env-name')
  .argument('<command-text...>')
  .action(runGen2)
  .description('run a command in the remote environment');

program.command(commandNames.migrate).argument('env-name').action(migrate);

program.hook('postAction', async () => {
  await elegantExit(0);
});

program.parse();
