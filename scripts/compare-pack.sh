#!/bin/sh
# usage: compare-yandex ru patches/patch-ru.patch
# this should work from whereever you run it, as long as you set the BASE_DIR
# that contains your hg clone of partner-repacks

# some useful prereqs to help review
# install Komodo
# pip install jsbeautifier
# brew install expat

BASE_DIR=`pwd`
if [[ ! -d "$BASE_DIR/partners" ]]; then
  echo "execute this script from the partner-repacks repo"
  exit 1;
fi
if [[ "$1" == "" ]]; then
  echo "usage example: compare-aol updates.patch"
  exit 1;
fi

# get the distros that are updated from the patch
DISTROS=`grep -o -E "/partners/([a-zA-Z0-9\.\_-]*)" $1 | uniq | sed 's/\/partners\///g'`
for p in $DISTROS
do
  echo "partner $p"
done

EDITOR=k
# js interpreter for syntax checking. can be compiled from moz sources, or use
# Komodo if you feel lazy
JS="/Applications/Komodo IDE 8.app/Contents/MacOS/js"
CSS_LINT="/Applications/Komodo IDE 8.app/Contents/SharedSupport/lint/css/xpcshell_csslint.js"
XPCSHELL="/Applications/Komodo IDE 8.app/Contents/MacOS/xpcshell"
# brew install expat to get xmlwf, used to check well-formedness
XMLWF=`which xmlwf`
#JS=

get_abs_filename() {
  # $1 : relative filename
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

PATCH_FILE=$(get_abs_filename $1)
TEST_TMP=~/test-partner-pack

cd $BASE_DIR
hg qpop -a

rm -rf $TEST_TMP
mkdir $TEST_TMP

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
  echo unpacking $BASE_DIR/partners/$1 to $TEST_TMP/$1.$2
  pushd .
  cd $TEST_TMP
  cp -R $BASE_DIR/partners/$1/distribution $1.$2
  for d in $1.$2/extensions/*
  do
    echo "extension $d"
    # widgets is an aol thing
    if [[ -d "$d/widgets" ]]; then
      pushd .
      cd $d/widgets
      unpack_widgets
      popd
    fi
    # unpacking chrome, could be a bit smarter here and look at chrome.manifest
    # some partners have the jar in the top level addon directory
    pushd .
    cd $d
    unpack_chrome
    popd
    # some partners put the jar here
    if [[ -d "$d/chrome" ]]; then
      pushd .
      cd $d/chrome
      unpack_chrome
      popd
    fi
  done


  popd
}


function jsbeautify {
  echo Beautify JavaScript files in $1.$2
  for f in `find $TEST_TMP/$1.$2 -name "*.js" -o -name "*.jsm"`
  do
    # beautify
    js-beautify -o $f.tmp $f
    rm $f
    mv $f.tmp $f
  done  
}

# unpack the unpatched sources
for i in $DISTROS
do
  unpack $i 1
  jsbeautify $i 1
done

# patch the partner
hg qimp $PATCH_FILE
hg qpush
hg qser -s -v

# unpack the patched sources
for i in $DISTROS
do
  unpack $i 2
  jsbeautify $i 2
done

# lets examine the difference between the different distros, for the most part,
# most should be very very similar
read BASE __ <<< "$DISTROS"
for i in $DISTROS
do
  if [[ $BASE != $i ]]
  then
    diff -w -r -u -N --exclude="META-INF" $BASE_DIR/partners/$BASE $BASE_DIR/partners/$i > $BASE.$i.diff
  fi
done

# syntax check the changes
function checkjs {
  echo Syntax Checking JavaScript files in $1
  for f in `find $TEST_TMP/$1.2 -name "*.js" -o -name "*.jsm"`
  do
    OUT=`"$JS" -c $f 2>&1`
    if [[ $OUT != "" ]]
    then
      echo $f >> errors.txt
      echo $OUT >> errors.txt
    fi
  done
}
function checkcss {
  echo Checking CSS files in $1
  for f in `find $TEST_TMP/$1.2 -name "*.css"`
  do
    OUT=`"$XPCSHELL" "$CSS_LINT" $f 2>&1`
    if [[ $OUT != "[]" ]]
    then
      echo $f >> errors.txt
      echo $OUT >> errors.txt
    fi
  done
}
function checkxml {
  echo Checking XUL/XML files in $1
  for f in `find $TEST_TMP/$1.2 -name "*.xul" -o -name "*.xml"`
  do
    OUT=`"$XMLWF" $f 2>&1`
    if [[ $OUT != "" ]]
    then
      echo $f >> errors.txt
      echo $OUT >> errors.txt
    fi
  done
}
if [[ $JS != "" ]]
then
  rm errors.txt
  for i in $DISTROS
  do
    checkjs $i
    checkcss $i
    checkxml $i
  done
fi

hg qpop
# keeping the patch in queue for now
#hg qdel $(basename "$PATCH_FILE")

# produce our diff and load it
for i in $DISTROS
do
  diff -w -r -u -N --exclude="META-INF" $TEST_TMP/$i.1 $TEST_TMP/$i.2 > $i.diff
  # diffs can be very large
  #$EDITOR $i.diff
done
