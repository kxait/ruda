import { build } from './commands/build.mjs';
import { deploy } from './commands/deploy.mjs';
import { init } from './commands/init.mjs';
import { program } from 'commander';
import { setAll } from './commands/set-all.mjs';
import { setFile } from './commands/set-file.mjs';
import { uploadCert } from './commands/upload-cert.mjs';
import { set } from './commands/set.mjs';
/**
  * @import {rudaYmlSchema} from './config.mjs'
  * @import {rudaYmlEnvironmentSchema} from './config.mjs'
  */

program.description('simple remote task runner').command('init').action(init)
program.command('upload-cert <cert-path>').action(uploadCert)
program.command('set <var-name> <value>').action(set)
program.command('set-all <env-file>').action(setAll)
program.command('set-file <local-file> <remote-path>').action(setFile)
program.command('build').action(build)
program.command('deploy').action(deploy)
program.parse()
