.PHONY: rbuild rdeploy

RUDA_YML ?= _test_dir/.ruda.yml

RUDA := RUDA_YML=$(RUDA_YML) npm run start

rbuild:
	@echo "building with env set to $(env) $env"
rdeploy:
	@echo "deploying"

clean:
	ssh -i ~/.ssh/id_generated_ed25519 ci@srv1 "rm -rf ~/ruda"

init:
	$(RUDA) init

set:
	$(RUDA) set foo bar

unset:
	$(RUDA) set foo

set2:
	$(RUDA) set baz quz

set-all:
	$(RUDA) set-all _test_dir/env

set-file:
	$(RUDA) set-file remote-path/to/file.txt _test_dir/file.txt 

del-file:
	$(RUDA) set-file remote-path/to/file.txt

upload-cert:
	$(RUDA) upload-cert ~/.ssh/id_ed25519_ruda_github

build:
	$(RUDA) build
