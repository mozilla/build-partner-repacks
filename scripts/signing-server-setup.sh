#!/bin/bash

signing_server="signing3.srv.releng.scl3.mozilla.com:9120"
my_ip=`/sbin/ifconfig | grep inet | grep "10\." | cut -f2 -d" "`
token_file="`pwd`/token"
nonce_file="`pwd`/nonce"
tools_repo="http://hg.mozilla.org/build/tools"
signing_dir="`pwd`/tools/release/signing"

stty -echo
echo -n "Token generation password: "
read token_password
stty echo

if [ ! -e tools ]; then
    hg clone $tools_repo tools
else
    hg -R tools pull
    hg -R tools up
fi
python $signing_dir/get_token.py -c $signing_dir/host.cert -u cltsign -p $token_password -H $signing_server -d 7200 -i $my_ip > $token_file
echo "Copy and paste the following line to set-up the signing server:"
echo export MOZ_SIGN_CMD="\"python $signing_dir/signtool.py -t $token_file -n $nonce_file -c $signing_dir/host.cert -H $signing_server\""