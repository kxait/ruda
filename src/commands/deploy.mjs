/**
  * [target='deploy']
  * -e, --env <env name>
  */
export async function deploy() {
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
