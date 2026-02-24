/**
  *
  * <env file>
  * -e, --env <env name>
  */
export async function setAll() {
  // check if <env file> is .env formatted
  // if not -e, check if .ruda.yml contains exactly one env
  // if not, exit with error message
  // set ~/ruda/<env name>/config.yml $.env.{<every var name in file>} = <value>
}
