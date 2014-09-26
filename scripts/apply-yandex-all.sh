#!/bin/sh
# usage: apply-yandex-all.sh [patch-dir] "Bug XXXX yandex partner drop, r=XXXX"

BASE_DIR=`pwd`
if [[ ! -d "$BASE_DIR/partners" ]]; then
  echo "execute this script from the partner-repacks repo"
  exit 1;
fi
if [[ ! -d "$1" ]]; then
  echo "usage: apply-yandex-all.sh [patch-dir] \"Bug XXXX yandex partner drop, r=XXXX\""
  exit 1;
fi
if [[ "$2" == "" ]]; then
  echo "usage: apply-yandex-all.sh [patch-dir] \"Bug XXXX yandex partner drop, r=XXXX\""
  exit 1;
fi
if [[ `hg qser` != "" ]]; then
  echo "cannot proceed with existing patches applied"
fi

get_abs_filename() {
  # $1 : relative filename
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

hg pull -u

for f in $1/*
do
  echo "$f"
  if [[ $f =~ yandex_(.*).diff$ ]]
  then
    hg qimp $f
    hg qpush
    hg qrefresh -m "$2"
  fi
done

# assuming everything applied cleanly, qfin it all
for f in `hg qser`
do
  echo "$f"
  hg qfin $f
done

hg push ssh://hg.mozilla.org/build/partner-repacks

