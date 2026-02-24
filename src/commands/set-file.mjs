/**
  *
  * <local file>
  * <remote path>
  * -e, --env <env name>
  */
export async function setFile() {
  // if not -e, check if .ruda.yml contains exactly one env
  // if not, exit with error message
  // upload <local file> as ~/ruda/<env name>/files/<local file hash>
  // set ~/ruda/<env name>/config.yml $.files.[].path = <remote path>
  // set ~/ruda/<env name>/config.yml $.files.[].sha256 = <local file hash>
}
