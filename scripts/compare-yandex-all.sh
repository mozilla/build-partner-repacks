#!/bin/sh
# usage: compare-yandex-all.sh [patch-dir]

BASE_DIR=`pwd`
if [[ ! -d "$BASE_DIR/partners" ]]; then
  echo "execute this script from the partner-repacks repo"
  exit 1;
fi
if [[ "$1" == "" ]]; then
  echo "usage: compare-yandex-all.sh [patch-dir]"
  exit 1;
fi
if [[ ! -d "$1" ]]; then
  echo "patch directory doesn't exist"
  exit 1;
fi

get_abs_filename() {
  # $1 : relative filename
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

for f in $1/*
do
  echo "$f"
  if [[ $f =~ yandex_(.*).diff$ ]]
  then
    # get the match and replace _ with - for directory names
    b=${BASH_REMATCH[1]/_/-}
    # patches come as "eco" rathern than "ru-eco"
    if [[ $b = "eco" ]]
    then
      b=ru-eco
    fi
    scripts/compare-yandex.sh $b $f
  fi
done

# at this point, you can diff the first diff with each of the others to verify
# no differences (other than minor id/date stuff), leaving only one patch to
# focus on reviewing
