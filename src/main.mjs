import { NodeSSH } from 'node-ssh'

const ssh = new NodeSSH();

async function main() {
  const connection = await ssh.connect({
    host: 'srv1',
    username: 'kx',
    password: ''
  })

  const unameAResult = await connection.execCommand('uname -a');
  connection.dispose()
  console.log(unameAResult.stdout);
}

/**
  *
  */
async function init() {
  // read .ruda.yml file
  // find env list
  // ssh mkdir ~/ruda
  // for every env ssh:
  // mkdir ~/ruda/<env name>/files
  // touch ~/ruda/<env name>/config.yml
  // touch ~/ruda/<env name>/env.yml
}

/**
  *
  * <cert path>
  * -e, --env <env name>
  */
async function uploadCert() {
  // if not -e, check if .ruda.yml contains exactly one env
  // if not, exit with error message
  // upload <cert path> to ~/ruda/<env name>/ssh_id
}

/**
  *
  * <var name>
  * <value>
  * -e, --env <env name>
  */
async function set() {
  // if not -e, check if .ruda.yml contains exactly one env
  // if not, exit with error message
  // set ~/ruda/<env name>/config.yml $.env.<var name> = <value>
}

/**
  *
  * <env file>
  * -e, --env <env name>
  */
async function setAll() {
  // check if <env file> is .env formatted
  // if not -e, check if .ruda.yml contains exactly one env
  // if not, exit with error message
  // set ~/ruda/<env name>/config.yml $.env.{<every var name in file>} = <value>
}

/**
  *
  * <local file>
  * <remote path>
  * -e, --env <env name>
  */
async function setFile() {
  // if not -e, check if .ruda.yml contains exactly one env
  // if not, exit with error message
  // upload <local file> as ~/ruda/<env name>/files/<local file hash>
  // set ~/ruda/<env name>/config.yml $.files.[].path = <remote path>
  // set ~/ruda/<env name>/config.yml $.files.[].sha256 = <local file hash>
}

/**
  * [target='build']
  * -e, --env <env name>
  */
async function build() {
  // if not -e, check if .ruda.yml contains exactly one env
  // if not, exit with error message

  // export GIT_SSH_COMMAND="ssh -i ~/ruda/<env name>/ssh_id -o StrictHostKeyChecking=no -o IdentitiesOnly=yes"
  // if not exists ~/ruda/<env name>/repo:
  //   git clone the repo from .ruda.yml into ~/ruda/<env name>/repo
  // 
  // cd ~/ruda/<env name>/repo
  // git restore .
  // git pull
  // copy all files from ~/ruda/<env name>/files to ~/ruda/<env name>/repo as per config
  // export all env vars from ~/ruda/<env name>/config.yml
  // make <target>
}

/**
  * [target='deploy']
  * -e, --env <env name>
  */
async function deploy() {
  // if not -e, check if .ruda.yml contains exactly one env
  // if not, exit with error message

  // export GIT_SSH_COMMAND="ssh -i ~/ruda/<env name>/ssh_id -o StrictHostKeyChecking=no -o IdentitiesOnly=yes"
  // if not exists ~/ruda/<env name>/repo:
  //   git clone the repo from .ruda.yml into ~/ruda/<env name>/repo
  // 
  // cd ~/ruda/<env name>/repo
  // git restore .
  // git pull
  // copy all files from ~/ruda/<env name>/files to ~/ruda/<env name>/repo as per config
  // export all env vars from ~/ruda/<env name>/config.yml
  // make deploy
}

main().catch(console.error);
