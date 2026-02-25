.PHONY: rbuild rdeploy
rbuild:
	echo "building"
rdeploy:
	echo "deploying"

init:
	RUDA_YML=_test_dir/.ruda.yml npm run start init

clean:
	ssh -i ~/.ssh/id_generated_ed25519 ci@srv1 "rm -rf ~/ruda"

set:
	RUDA_YML=_test_dir/.ruda.yml npm run start set env test

unset:
	RUDA_YML=_test_dir/.ruda.yml npm run start set env

set2:
	RUDA_YML=_test_dir/.ruda.yml npm run start set secure true

set-e:
	RUDA_YML=_test_dir/.ruda.yml npm run start -- set env testt -e ruda-prd

set-all:
	RUDA_YML=_test_dir/.ruda.yml npm run start set-all _test_dir/env

set-file:
	RUDA_YML=_test_dir/.ruda.yml npm run start set-file remote-path/to/file.txt _test_dir/file.txt 

del-file:
	RUDA_YML=_test_dir/.ruda.yml npm run start set-file remote-path/to/file.txt
