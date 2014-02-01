#!/bin/bash

signing_server="signing4.srv.releng.scl3.mozilla.com:9120"
my_ip=`/sbin/ifconfig | grep inet | grep "10\." | cut -f2 -d" "`
token_file="`pwd`/token"
nonce_file="`pwd`/nonce"
tools_repo="https://hg.mozilla.org/build/tools"
signing_dir="`pwd`/tools/release/signing"

# Clear out the nonce. Invalid nonces will cause our newly created token to be
# deleted.
rm -f $nonce_file

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
