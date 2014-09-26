#!/bin/sh
# usage: compare-yandex ru patches/patch-ru.patch
# this should work from whereever you run it, as long as you set the BASE_DIR
# that contains your hg clone of partner-repacks

BASE_DIR=`pwd`
if [[ ! -d "$BASE_DIR/partners" ]]; then
  echo "execute this script from the partner-repacks repo"
  exit 1;
fi
if [[ "$1" == "" ]]; then
  echo "usage example: compare-yandex ru patches/patch-ru.patch"
  exit 1;
fi
if [[ "$2" == "" ]]; then
  echo "usage example: compare-yandex ru patches/patch-ru.patch"
  exit 1;
fi


EDITOR=k
# js interpreter for syntax checking. can be compiled from moz sources, or use
# Komodo if you feel lazy
#JS="/Applications/Komodo IDE 8.app/Contents/MacOS/js"
JS=

get_abs_filename() {
  # $1 : relative filename
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

PATCH_FILE=$(get_abs_filename $2)
YAND_TMP=~/test-yandex

cd $BASE_DIR
hg qpop -a

rm -rf $YAND_TMP
mkdir $YAND_TMP

function unpack {
  echo unpacking $BASE_DIR/partners/yandex-$1 to $YAND_TMP/$1.$2
  pushd .
  cd $YAND_TMP
  cp -R $BASE_DIR/partners/yandex-$1/distribution $1.$2
  cd $1.$2/extensions/yasearch@yandex.ru/chrome
  unzip yasearch.jar
  rm yasearch.jar
  cd ../../vb\@yandex.ru/chrome
  unzip yandex-vb.jar
  rm yandex-vb.jar
  popd
}

# unpack the unpatched sources
unpack $1 1

# patch the partner
hg qimp $PATCH_FILE
hg qpush
hg qser -s -v

# unpack the patched sources
unpack $1 2

# syntax check the changes
rm errors-$1.txt
function checkjs {
  echo Syntax Checking JavaScript files
  for f in `find $YAND_TMP/$1.2 -name "*.js" -o -name "*.jsm"`
  do
    OUT=`"$JS" -c $f 2>&1`
    if [[ $OUT != "" ]]
    then
      echo $f >> errors-$1.txt
      echo $OUT >> errors-$1.txt
    fi
  done
}
if [[ $JS != "" ]]
then
  checkjs $1
fi

hg qpop
hg qdel $(basename "$PATCH_FILE")

# produce our diff and load it
diff -w -r -u -N --exclude="META-INF" $YAND_TMP/$1.1 $YAND_TMP/$1.2 > yandex-$1.diff
$EDITOR yandex-$1.diff

