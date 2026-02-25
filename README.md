# ruda

simple remote task runner

- build and deploy software remotely without installing agents on remote
- manageable via cli
- easy to add, remove projects, run builds etc
- easy to add configuration for each project

## getting started

### getting the project ready

ruda works with Makefiles, so create a Makefile with targets build and deploy

```makefile
.PHONY: rbuild rdeploy
rbuild:
	docker compose build
rdeploy:
	docker compose up -d
```

### first time setup

create a .ruda.yml file in your project root

```yaml
environments:
  service-prd:
    keyPath: ~/.ssh/id_my-awesome-server
    hostname: my-awesome-server.com
    username: ci
    repo: git@github.com:you/service-prd.git
```

then run to init the env fresh

```bash
$ ruda init
```

upload your repo certfile

```bash
$ ruda upload-cert ~/.ssh/id_somecert
```

upload config

```bash
$ ruda set var-name var-value
```

or upload entire config files (.env formatted)

```bash
$ ruda set-all .env
```

you can also upload a single file to live in a specific path

```bash
$ ruda set-file remote-path-to-file.json super/secret/some-local-secret.json
```

### running builds

```bash
$ ruda build
```

### running deployments

```bash
$ ruda deploy
```
