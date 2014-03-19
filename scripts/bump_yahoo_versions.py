#!/usr/bin/env python

import argparse
import datetime
import glob
import os
import re
from shutil import move
from stat import ST_MODE
from tempfile import mkstemp

def replace_all(text, dic):
    for i, j in dic.iteritems():
        text = re.sub(i, j, text)
    return text

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--previous_version", type=int, help="Previous version", required=True)
    parser.add_argument("--new_version", type=int, help="New version", required=True)
    args = parser.parse_args()

    today = datetime.date.today().strftime('%Y-%m-%d')
    substitutions = {
        re.compile(r'# Date: .*'): '# Date: %s' % today,
        re.compile(r'yff%s' % args.previous_version): 'yff%s' % args.new_version,
        re.compile(r'YFF%s' % args.previous_version): 'YFF%s' % args.new_version,
        re.compile(r'version=1.%s' % args.previous_version):  'version=1.%s' % args.new_version,
        re.compile(r'dist_version="1.%s"' % args.previous_version):  'dist_version="1.%s"' % args.new_version,
        }

    for d in glob.iglob('yahoo*'):
        if os.path.isdir(d):
            for f in ['distribution/distribution.ini', 'repack.cfg']:
                file_path = "%s/%s" % (d,f)
                fh, abs_path = mkstemp()
                new_file = open(abs_path,'w')
                old_mode = os.stat(file_path)[ST_MODE]
                old_file = open(file_path)
                for line in old_file:
                    new_file.write(replace_all(line, substitutions))
                new_file.close()
                os.close(fh)
                old_file.close()
                os.remove(file_path)
                os.chmod(abs_path, old_mode)
                move(abs_path, file_path)
