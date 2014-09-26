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
  echo "usage example: compare-aol aol.patch"
  exit 1;
fi

# hard coded distros
DISTROS=( aol aol_de aol_huffington aol_uk )
EDITOR=k
# js interpreter for syntax checking. can be compiled from moz sources, or use
# Komodo if you feel lazy
JS="/Applications/Komodo IDE 8.app/Contents/MacOS/js"
#JS=

get_abs_filename() {
  # $1 : relative filename
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

PATCH_FILE=$(get_abs_filename $1)
AOL_TMP=~/test-aol

cd $BASE_DIR
hg qpop -a

rm -rf $AOL_TMP
mkdir $AOL_TMP

function unpack_widgets {
  for f in *
  do
    echo "zip file $f"
    if [[ $f =~ (.*).zip$ ]]
    then
      # get the match and replace _ with - for directory names
      b=${BASH_REMATCH[1]/_/-}
      echo "directory: $b"
      mkdir $b
      cd $b
      echo "we are in " `pwd`
      unzip ../$f
      cd ..
      rm $f
    fi
  done
}

function unpack_chrome {
  for f in *
  do
    echo "jar file $f"
    if [[ $f =~ (.*).jar$ ]]
    then
      unzip $f
      rm $f
    fi
  done
}

function unpack {
  echo unpacking $BASE_DIR/partners/$1 to $AOL_TMP/$1.$2
  pushd .
  cd $AOL_TMP
  cp -R $BASE_DIR/partners/$1/distribution $1.$2
  for d in $1.$2/extensions/*
  do
    echo "extension $d"
    pushd .
    cd $d/widgets
    unpack_widgets
    popd
    pushd .
    cd $d/chrome
    unpack_chrome
    popd
  done


  popd
}

# unpack the unpatched sources
for i in "${DISTROS[@]}"
do
  unpack $i 1
done

# patch the partner
hg qimp $PATCH_FILE
hg qpush
hg qser -s -v

# unpack the patched sources
for i in "${DISTROS[@]}"
do
  unpack $i 2
done


# syntax check the changes
function checkjs {
  echo Syntax Checking JavaScript files
  for f in `find $AOL_TMP/$1.2 -name "*.js" -o -name "*.jsm"`
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
  for i in "${DISTROS[@]}"
  do
    rm errors-$i.txt
    checkjs $i
  done
fi

hg qpop
hg qdel $(basename "$PATCH_FILE")

# produce our diff and load it
for i in "${DISTROS[@]}"
do
  diff -w -r -u -N --exclude="META-INF" $AOL_TMP/$i.1 $AOL_TMP/$i.2 > $i.diff
  $EDITOR $i.diff
done
