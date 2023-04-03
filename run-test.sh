#!/bin/bash
tester_dir="$(dirname ${BASH_SOURCE[0]})"

data_dir="$tester_dir/../../mock-data"
test_conf="$tester_dir/test-setup.json"
ln_to_platform="$tester_dir/test-runner"
signup_url="https://3nweb.net/signup/"

if [ -n "$1" ]
then
	platform="$1"
elif ! readlink "$ln_to_platform" > /dev/null
then
	echo "You should either provide path to platform executable in the first argument, or have link it symbolically at $ln_to_platform"
	exit 1;
else
	platform="$(readlink "$ln_to_platform")"
fi

# for port in 8099 #9000
# do
# 	PORT=$port ./node_modules/.bin/vue-devtools &
# done

echo "Starting test run on $platform with data folder $data_dir"

$platform -- "--signup-url=$signup_url" "--data-dir=$data_dir" --allow-multi-instances --devtools "--test-stand=$test_conf"
