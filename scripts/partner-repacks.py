#!/usr/bin/env python

import os, sys
from shutil import copy, copytree, move
from subprocess import Popen
from optparse import OptionParser


#HG_REPO = "http://hg.mozilla.org/users/coop_mozilla.com/partner-repacks"
PARTNERS_DIR = "../partners"
BUILD_NUMBER = "1"
STAGING_SERVER = "stage.mozilla.org"

#########################################################################
# Source: 
# http://stackoverflow.com/questions/377017/test-if-executable-exists-in-python
def which(program):
    def is_exe(fpath):
        return os.path.exists(fpath) and os.access(fpath, os.X_OK)

    fpath, fname = os.path.split(program)
    if fpath:
        if is_exe(program):
            return program
    else:
        for path in os.environ["PATH"].split(os.pathsep):
            exe_file = os.path.join(path, program)
            if is_exe(exe_file):
                return exe_file

    return None

#########################################################################
def rmdirRecursive(dir):
    """This is a replacement for shutil.rmtree that works better under
    windows. Thanks to Bear at the OSAF for the code.
    (Borrowed from buildbot.slave.commands)"""
    if not os.path.exists(dir):
        # This handles broken links
        if os.path.islink(dir):
            os.remove(dir)
        return

    if os.path.islink(dir):
        os.remove(dir)
        return

    # Verify the directory is read/write/execute for the current user
    os.chmod(dir, 0700)

    for name in os.listdir(dir):
        full_name = os.path.join(dir, name)
        # on Windows, if we don't have write permission we can't remove
        # the file/directory either, so turn that on
        if os.name == 'nt':
            if not os.access(full_name, os.W_OK):
                # I think this is now redundant, but I don't have an NT
                # machine to test on, so I'm going to leave it in place
                # -warner
                os.chmod(full_name, 0600)

        if os.path.isdir(full_name):
            rmdirRecursive(full_name)
        else:
            # Don't try to chmod links
            if not os.path.islink(full_name):
                os.chmod(full_name, 0700)
            os.remove(full_name)
    os.rmdir(dir)

#########################################################################
def shellCommand(cmd):
    p = Popen(cmd, shell=True)
    return os.waitpid(p.pid, 0)
   
#########################################################################
def mkdir(dir, mode=0777):
    if not os.path.exists(dir):
        return os.makedirs(dir, mode)
    return True
   
#########################################################################
def isLinux(platform):
    if (platform.find('linux') != -1):
        return True
    return False
#########################################################################
def isMac(platform):
    if (platform.find('mac') != -1):
        return True
    return False

#########################################################################
def isWin(platform):
    if (platform.find('win') != -1):
        return True
    return False

#########################################################################
def parseRepackConfig(file):
    config = {}
    
    config['platforms'] = []
    f= open(file, 'r')
    for line in f:
        line = line.rstrip("\n")
        [key, value] = line.split('=',2)
        value = value.strip('"')
        if key == 'dist_id':
            config['dist_id'] = value
            continue
        if key == 'locales':
            config['locales'] = value.split(' ')
            continue
        if isLinux(key) or isMac(key) or isWin(key):
            if value == 'true':
                config['platforms'].append(key)
            continue
    return config

#########################################################################
def getFormattedPlatform(platform):
    '''Returns the platform in the format used in building package names.
    '''
    if isLinux(platform):
        return "linux-i686"
    if isMac(platform):
        return "mac"
    if isWin(platform):
        return "win32"
    return None

#########################################################################
def getFileExtension(platform):
    if (platform == 'linux-i686'):
        return "tar.bz2"
    if (platform == 'mac'):
        return "dmg"
    if (platform == 'win32'):
        return "installer.exe"
    return None

#########################################################################
def repackLinux(build, partner_dir, build_dir, repack_dir):
    print "Repacking linux build %s" % build

    base_dir = os.getcwd();
    full_build_path = "%s/%s/%s" % (base_dir, build_dir, build)
    full_partner_path = "%s/%s" % (base_dir, partner_dir)
    working_dir = "%s/working" % repack_dir
    mkdir(working_dir)
    os.chdir(working_dir)

    copy(full_build_path, '.')
    uncompressed_build = build.replace('.bz2','')
    bunzip2_cmd = "bunzip2 %s" % build
    shellCommand(bunzip2_cmd)
    if not os.path.exists(uncompressed_build):
        print "Unable to uncompress build %s" % build
        sys.exit(1)

    # Check whether we've already copied files over for this partner.
    if not os.path.exists('firefox'):
        mkdir('firefox')
        for i in ['distribution', 'extensions', 'searchplugins']:
            full_path = "%s/%s" % (full_partner_path, i)
            if os.path.exists(full_path):
                copytree(full_path, "firefox/%s" % i)
 
    tar_cmd = "tar rvf %s firefox" % uncompressed_build
    shellCommand(tar_cmd)
    
    bzip2_command = "bzip2 %s" % uncompressed_build
    shellCommand(bzip2_command)
    
    move(build, '..')
 
    os.chdir(base_dir)

#########################################################################
def repackMac(build, partner_dir, build_dir, repack_dir):
    print "Repacking Mac build %s" % build

    base_dir = os.getcwd();
    full_build_path = "%s/%s/%s" % (base_dir, build_dir, build)
    full_partner_path = "%s/%s" % (base_dir, partner_dir)
    working_dir = "%s/working" % repack_dir
    mkdir(working_dir)
    os.chdir(working_dir)

    mountpoint = "/tmp/FirefoxInstaller"
    mkdir(mountpoint)

    # Verify that Firefox isn't currently mounted on our mountpoint.
    if os.path.exists("%s/Firefox.app" % mountpoint):
        print "Firefox is already mounted at %s" % mountpoint
        sys.exit(1)
    
    attach_cmd = "hdiutil attach -mountpoint %s -readonly -private -noautoopen %s" % (mountpoint, full_build_path)
    shellCommand(attach_cmd)
    rsync_cmd  = "rsync -a %s/ stage/" % mountpoint
    shellCommand(rsync_cmd)
    eject_cmd  = "hdiutil eject %s" % mountpoint
    shellCommand(eject_cmd)
    os.remove("stage/ ")
    for i in ['distribution', 'extensions', 'searchplugins']:
        full_path = "%s/%s" % (full_partner_path, i)
        if os.path.exists(full_path):
            cp_cmd = "cp -r %s stage/Firefox.app/Contents/MacOS" % full_path
            shellCommand(cp_cmd)
    pkg_cmd = "pkg-dmg --source stage/ --target ../%s --volname 'Firefox' --icon stage/.VolumeIcon.icns --symlink '/Applications':' '" % build
    shellCommand(pkg_cmd)
    rmdirRecursive("stage")

    os.chdir(base_dir)

#########################################################################
def repackWin32(build, partner_dir, build_dir, repack_dir):
    print "Repacking win32 build %s" % build

    base_dir = os.getcwd();
    full_build_path = "%s/%s/%s" % (base_dir, build_dir, build)
    full_partner_path = "%s/%s" % (base_dir, partner_dir)
    working_dir = "%s/working" % repack_dir
    mkdir(working_dir)
    os.chdir(working_dir)

    copy(full_build_path, '.')

    # Check whether we've already copied files over for this partner.
    if not os.path.exists('nonlocalized'):
        mkdir('nonlocalized')
        for i in ['distribution', 'extensions', 'searchplugins']:
            full_path = "%s/%s" % (full_partner_path, i)
            if os.path.exists(full_path):
                copytree(full_path, "nonlocalized/%s" % i)
 
    zip_cmd = "7za a %s nonlocalized" % build
    shellCommand(zip_cmd)
    
    move(build, '..')
 
    os.chdir(base_dir)

#########################################################################
if __name__ == '__main__':
    error = False
    partner_builds = {}
    repack_build = {'linux-i686': repackLinux,
                    'mac':        repackMac,
                    'win32':      repackWin32
    }

    parser = OptionParser(usage="usage: %prog [options]")
    parser.add_option("-d", 
                      "--partners-dir",
                      action="store", 
                      dest="partners_dir",
                      default=PARTNERS_DIR,
                      help="Specify the directory where the partner config files are found.")
    parser.add_option("-p",
                      "--partner",
                      action="store",
                      dest="partner",
                      help="Repack for a single partner, specified by name."
                     )
    parser.add_option("-v",
                      "--version",
                      action="store",
                      dest="version",
                      help="Set the version number for repacking")
    parser.add_option("-n",
                      "--build-number",
                      action="store",
                      dest="build_number",
                      default=BUILD_NUMBER,
                      help="Set the build number for repacking")
    (options, args) = parser.parse_args()

    # Pre-flight checks
    if len(args) < 0 or not options.version:
        print "Error: you must specify a version number."
        error = True

    if not which("7za"):
        print "Error: couldn't find the 7za executable in PATH."
        error = True

    if not which("pkg-dmg"):
        print "Error: couldn't find the pkg-dmg executable in PATH."
        error = True 

    if not os.path.isdir(options.partners_dir):
        print "Error: partners dir %s is not a directory." % partners_dir
        error = True

    if error:
        sys.exit(1)

    base_workdir = os.getcwd();
    
    # Remote dir where we can find builds.
    candidates_web_dir = "/pub/mozilla.org/firefox/nightly/%s-candidates/build%s" % (options.version, options.build_number)
 
    # Local directories for builds
    original_builds_dir = "original_builds/%s" % options.version
    repacked_builds_dir = "repacked_builds/%s" % options.version
    if not os.path.exists(original_builds_dir):
        mkdir(original_builds_dir)
    if not os.path.exists(repacked_builds_dir):
        mkdir(repacked_builds_dir)

    print

# For each partner in the partners dir
##    Read/check the config file
##    Download required builds (if not already on disk)
##    Perform repacks
##    Upload repacks back to ???stage

    for partner_dir in os.listdir(options.partners_dir):
        full_partner_dir = "%s/%s" % (options.partners_dir,partner_dir)
        if not os.path.isdir(full_partner_dir):
            continue
        repack_cfg = "%s/repack.cfg" % str(full_partner_dir)
        print "Starting repack process for partner: %s" % partner_dir
        if not os.path.exists(repack_cfg):
            print "%s doesn't exist, skipping this partner" % repack_cfg
            continue
        repack_info = parseRepackConfig(repack_cfg)

        partner_repack_dir = "%s/%s" % (repacked_builds_dir, partner_dir)
        if os.path.exists(partner_repack_dir):
            rmdirRecursive(partner_repack_dir)
        mkdir(partner_repack_dir)
 
        # Figure out which base builds we need to repack.
        for locale in repack_info['locales']:
            for platform in repack_info['platforms']:
                platform_formatted = getFormattedPlatform(platform)
                file_ext = getFileExtension(platform_formatted);
                filename = "firefox-%s.%s.%s.%s" % (options.version,
                                                    locale,
                                                    platform_formatted,
                                                    file_ext)
                local_filepath = "%s/%s" % (original_builds_dir,
                                            filename)

                # Check to see if this build is already on disk, i.e.
                # has already been downloaded.
                if os.path.exists(local_filepath):
                    print "Found %s on disk, not downloading" % filename
                else:
                    # Download original build from stage
                    print os.getcwd()
                    os.chdir(original_builds_dir)
                    original_build_url = "http://%s%s/%s" % (STAGING_SERVER,
                                                             candidates_web_dir,
                                                             filename
                                                            )
                    wget_cmd = "wget %s" % original_build_url
                    shellCommand(wget_cmd)
                    os.chdir(base_workdir);
 
                    # Make sure we have the local file now               
                    if not os.path.exists(local_filepath):
                        print "Unable to retrieve %s" % filename
                        sys.exit(1)
                
                repack_build[platform_formatted](filename,
                                                 full_partner_dir,
                                                 original_builds_dir,
                                                 partner_repack_dir)
        
        print