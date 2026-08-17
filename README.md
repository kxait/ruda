# ruda

simple remote task runner

- build and deploy software remotely without installing agents on remote
- manageable via cli
- easy to add, remove projects, run builds etc
- easy to add configuration for each project

## getting started

init the meta config file: this sits in your home directory and contains the remote login credentials

```bash
$ ruda meta-init
```

set your ssh host, user, and port

```bash
$ ruda meta-set sshHost my-awesome-server.com
$ ruda meta-set sshUser ci
$ ruda meta-set sshPort 22
```

set your ssh key path

```bash
$ ruda meta-set sshKeyPath ~/.ssh/id_my-awesome-server
```

## creating an environment

```bash
$ ruda init service-prd git@github.com:you/service-prd.git
```

will create an environment on the remote without an id_rsa identity. you can also init with an identity file or generate one

```bash
$ ruda init service-prd git@github.com:you/service-prd.git --generate-identity
```

or

```bash
$ ruda init service-prd git@github.com:you/service-prd.git --identity-file ./id_rsa
```

## syncing the repo

```bash
$ ruda sync service-prd # --ref <ref>
```

will sync the repo to the given ref or the latest origin/HEAD. will also copy any files that you have set to the repo

## setting variables

you can set variables on the remote. they will be injected into any commands as env variables

```bash
$ ruda set service-prd var-name var-value
```

you can also unset them by not providing a value

## uploading files

you can upload files to the remote and they will be available to the repo once you sync

```bash
$ ruda set-file service-prd src/some-file-on-the-remote-repo.json /some/local/path/to/file.json
```

you can remove the file by not providing a local path

## running commands

run a command in the remote environment

```bash
$ ruda run service-prd make build
```

```bash
$ ruda run service-prd "docker compose logs -f"
```

```bash
$ ruda run service-prd "sudo rm -rf /"
```

stdin is supported

## other commands

list all remote environments

```bash
$ ruda list
```

describe a remote environment

```bash
$ ruda describe service-prd
```

remove a remote environment

```bash
$ ruda remove service-prd
```

get an environment id_rsa public key (useful for setting up github build keys)

```bash
$ ruda pubkey service-prd
```

read the meta config file

```bash
$ ruda meta-get
```
