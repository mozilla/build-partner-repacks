#!/usr/bin/env python

import os
import re
import sys
from os import path
from shutil import copy, copytree, move
from subprocess import Popen
from optparse import OptionParser
from util.retry import retry
import urllib
import logging
import json

logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                    format="%(asctime)-15s - %(message)s")
log = logging.getLogger(__name__)


# Set default values.
PARTNERS_DIR = path.join(path.dirname(__file__), path.join('..', 'partners'))
BUILD_NUMBER = '1'
STAGING_SERVER = 'stage.mozilla.org'
HGROOT = 'https://hg.mozilla.org'
REPO = 'releases/mozilla-release'
DEFAULT_OUTPUT_DIR = 'partner-repacks/%(partner)s/%(platform)s/%(locale)s'
TASKCLUSTER_INDEX='https://index.taskcluster.net/v1/task/buildbot.revisions.%(revision).%(base_repo).%(platform)'
TASKCLUSTER_ARTIFACT='https://queue.taskcluster.net/v1/task/%(taskId)/artifacts/public/build/'

PKG_DMG = 'pkg-dmg'
SEVENZIP_BIN = '7za'
UPX_BIN = 'upx'

SEVENZIP_BUNDLE = 'app.7z'
SEVENZIP_APPTAG = 'app.tag'
SEVENZIP_APPTAG_PATH = path.join('browser/installer/windows', SEVENZIP_APPTAG)
SEVENZIP_HEADER = '7zSD.sfx'
SEVENZIP_HEADER_PATH = path.join('other-licenses/7zstub/firefox',
                                 SEVENZIP_HEADER)
SEVENZIP_HEADER_COMPRESSED = SEVENZIP_HEADER + '.compressed'

WINDOWS_DEST_DIR = 'core'


class StrictFancyURLopener(urllib.FancyURLopener):
    """Unlike FancyURLopener this class raises exceptions for generic HTTP
    errors, like 404, 500. It reuses URLopener.http_error_default redefined in
    FancyURLopener"""

    def http_error_default(self, url, fp, errcode, errmsg, headers):
        urllib.URLopener.http_error_default(self, url, fp, errcode, errmsg,
                                            headers)


# Source:
# http://stackoverflow.com/questions/377017/test-if-executable-exists-in-python
def which(program):

    def is_exe(fpath):
        return path.exists(fpath) and os.access(fpath, os.X_OK)

    try:
        fpath = path.dirname(program)
    except AttributeError:
        return None
    if fpath:
        if is_exe(program):
            return program
    else:
        for p in os.environ["PATH"].split(os.pathsep):
            exe_file = path.join(p, program)
            if is_exe(exe_file):
                return exe_file

    return None


def rmdirRecursive(directory):
    """This is a replacement for shutil.rmtree that works better under
    windows. Thanks to Bear at the OSAF for the code.
    (Borrowed from buildbot.slave.commands)"""
    if not path.exists(directory):
        # This handles broken links
        if path.islink(directory):
            os.remove(directory)
        return

    if path.islink(directory):
        os.remove(directory)
        return

    # Verify the directory is read/write/execute for the current user
    os.chmod(directory, 0700)

    for name in os.listdir(directory):
        full_name = path.join(directory, name)
        # on Windows, if we don't have write permission we can't remove
        # the file/directory either, so turn that on
        if os.name == 'nt':
            if not os.access(full_name, os.W_OK):
                # I think this is now redundant, but I don't have an NT
                # machine to test on, so I'm going to leave it in place
                # -warner
                os.chmod(full_name, 0600)

        if path.isdir(full_name):
            rmdirRecursive(full_name)
        else:
            # Don't try to chmod links
            if not path.islink(full_name):
                os.chmod(full_name, 0700)
            os.remove(full_name)
    os.rmdir(directory)


def printSeparator():
    log.info("##################################################")


def shellCommand(cmd):
    log.debug('Executing %s' % cmd)
    log.debug('in %s' % os.getcwd())
    # Shell command output gets dumped immediately to stdout, whereas
    # print statements get buffered unless we flush them explicitly.
    sys.stdout.flush()
    p = Popen(cmd, shell=True)
    (_, ret) = os.waitpid(p.pid, 0)
    if ret != 0:
        ret_real = (ret & 0xFF00) >> 8
        log.error('Error: shellCommand had non-zero exit status: %d' %
                  ret_real)
        log.error('Command: %s' % cmd, exc_info=True)
        sys.exit(ret_real)
    return True


def mkdir(directory, mode=0755):
    if not path.exists(directory):
        return os.makedirs(directory, mode)
    return True


def isLinux(platform):
    return 'linux' in platform


def isLinux32(platform):
    return ('linux32' in platform or 'linux-i686' in platform or
            platform == 'linux')


def isLinux64(platform):
    return ('linux64' in platform or 'linux-x86_64' in platform)


def isMac(platform):
    return 'mac' in platform


def isMac32(platform):
    return isMac(platform)


def isMac64(platform):
    return ('macosx64' in platform or 'mac64' in platform)


def isWin(platform):
    return 'win' in platform


def isWin32(platform):
    return 'win32' in platform


def isWin64(platform):
    return 'win64' in platform


def isValidPlatform(platform):
    return (isLinux64(platform) or isLinux32(platform) or isMac64(platform)
            or isMac32(platform) or isWin64(platform) or isWin32(platform))


def createTagFromVersion(version):
    return 'FIREFOX_' + str(version).replace('.', '_') + '_RELEASE'


def parseRepackConfig(filename, platforms):
    config = {}
    config['platforms'] = []
    f = open(filename, 'r')
    for line in f:
        line = line.rstrip("\n")
        # Ignore empty lines
        if line.strip() == "":
            continue
        [key, value] = line.split('=', 2)
        value = value.strip('"')
        if key == 'dist_id':
            config['dist_id'] = value
            continue
        if key == 'locales':
            config['locales'] = value.split(' ')
            continue
        if key == 'migrationWizardDisabled':
            if value.lower() == 'true':
                config['migrationWizardDisabled'] = True
            continue
        if key == 'oem':
            if value.lower() == 'true':
                config['oem'] = True
            continue
        if key == 'deb_section':
            config['deb_section'] = re.sub('/', '\/', value)
            continue
        if key == 'output_dir':
            config['output_dir'] = value
            continue
        if key == 'padding':
            config['padding'] = int(value)
            continue
        if isValidPlatform(key):
            ftp_platform = getFtpPlatform(key)
            if ftp_platform in [getFtpPlatform(p)
                                for p in platforms] \
               and value.lower() == 'true':
                config['platforms'].append(ftp_platform)
            continue
    if config['platforms']:
        return config


def getFtpPlatform(platform):
    '''Returns the platform in the format used in building package names.
       Note: we rely on this code being idempotent
       i.e. getFtpPlatform(getFtpPlatform(foo)) should work
    '''
    if isLinux64(platform):
        return "linux-x86_64"
    if isLinux(platform):
        return "linux-i686"
    # With Firefox4, we produce a single universal binary (32bit/64bit)
    # that goes into the mac/ dir for candidates/releases.
    if isMac64(platform):
        return "mac"
    if isMac(platform):
        return "mac"
    if isWin64(platform):
        return "win64"
    if isWin(platform):
        return "win32"
    return None


def getFilename(version, platform, file_ext, locale, pretty_names=True):
    '''Returns the properly formatted filename based on the version string.
       File location/nomenclature changed starting with 3.5.
    '''
    if pretty_names:
        if isLinux(platform):
            return "firefox-%s.%s" % (version, file_ext)
        if isMac(platform):
            return "Firefox %s.%s" % (version, file_ext)
        if isWin(platform):
            return "Firefox Setup %s.%s" % (version, file_ext)
    else:
        return "firefox-%s.%s.%s.%s" % (version, locale, platform, file_ext)
    return None


def getFileExtension(platform):
    if isLinux(platform):
        return "tar.bz2"
    if isMac(platform):
        return "dmg"
    if isWin(platform):
        return "exe"
    return None


class RepackBase(object):
    def __init__(self, build, partner_dir, build_dir, working_dir, final_dir,
                 ftp_platform, repack_info, signing_command, file_mode=0644,
                 external_signing_formats=None, internal_signing_formats=None):
        self.base_dir = os.getcwd()
        self.build = build
        self.full_build_path = path.join(build_dir, build)
        if not os.path.isabs(self.full_build_path):
            self.full_build_path = path.join(self.base_dir,
                                             self.full_build_path)
        self.full_partner_path = path.join(self.base_dir, partner_dir)
        self.working_dir = working_dir
        self.final_dir = final_dir
        self.ftp_platform = ftp_platform
        self.repack_info = repack_info
        self.file_mode = file_mode
        self.signing_command = signing_command
        self.external_signing_formats = external_signing_formats
        self.internal_signing_formats = internal_signing_formats
        mkdir(self.working_dir)

    def announceStart(self):
        log.info('Repacking %s build %s' % (self.ftp_platform, self.build))

    def announceSuccess(self):
        log.info('Done repacking %s build %s' % (self.ftp_platform, self.build))

    def unpackBuild(self):
        copy(self.full_build_path, '.')

    def createOverrideIni(self, partner_path):
        ''' Some partners need to override the migration wizard. This is done
            by adding an override.ini file to the base install dir.
        '''
        filename = path.join(partner_path, 'override.ini')
        if 'migrationWizardDisabled' in self.repack_info:
            if not path.isfile(filename):
                f = open(filename, 'w')
                f.write('[XRE]\n')
                f.write('EnableProfileMigrator=0\n')
                f.close()

    def copyFiles(self, platform_dir):
        # Check whether we've already copied files over for this partner.
        if not path.exists(platform_dir):
            mkdir(platform_dir)
            for i in ['distribution', 'extensions', 'searchplugins']:
                full_path = path.join(self.full_partner_path, i)
                if path.exists(full_path):
                    copytree(full_path, path.join(platform_dir, i))
            self.createOverrideIni(platform_dir)

    def addPadding(self):
        pass

    def internallySignBuild(self):
        pass

    def repackBuild(self):
        pass

    def externallySignBuild(self):
        signing_cmd = self.signing_command
        for f in self.external_signing_formats:
            signing_cmd += ' --formats %s' % f
        signing_cmd += ' "%s"' % self.build
        shellCommand(signing_cmd)

    def cleanup(self):
        move(self.build, self.final_dir)
        os.chmod(path.join(self.final_dir, path.basename(self.build)),
                 self.file_mode)
        if self.signing_command and 'gpg' in self.external_signing_formats:
            move('%s.asc' % self.build, self.final_dir)
            os.chmod(path.join(self.final_dir,
                               path.basename('%s.asc' % self.build)),
                     self.file_mode)

    def doRepack(self):
        self.announceStart()
        os.chdir(self.working_dir)
        self.unpackBuild()
        self.copyFiles()
        self.addPadding()
        if self.signing_command and self.internal_signing_formats:
            self.internallySignBuild()
        self.repackBuild()
        if self.signing_command and self.external_signing_formats:
            self.externallySignBuild()
        self.announceSuccess()
        self.cleanup()
        os.chdir(self.base_dir)


class RepackLinux(RepackBase):
    def __init__(self, build, partner_dir, build_dir, working_dir, final_dir,
                 ftp_platform, repack_info, signing_command,
                 external_signing_formats=['gpg']):
        super(RepackLinux, self).__init__(build, partner_dir, build_dir,
                                          working_dir, final_dir,
                                          ftp_platform, repack_info,
                                          signing_command,
                                          external_signing_formats=external_signing_formats)
        self.uncompressed_build = build.replace('.bz2', '')

    def unpackBuild(self):
        super(RepackLinux, self).unpackBuild()
        bunzip2_cmd = "bunzip2 %s" % self.build
        shellCommand(bunzip2_cmd)
        if not path.exists(self.uncompressed_build):
            log.error("Error: Unable to uncompress build %s" % self.build)
            sys.exit(1)

    def copyFiles(self):
        super(RepackLinux, self).copyFiles('firefox')

    def repackBuild(self):
        if options.quiet:
            tar_flags = "rf"
        else:
            tar_flags = "rvf"
        tar_cmd = "tar %s %s firefox" % (tar_flags, self.uncompressed_build)
        shellCommand(tar_cmd)
        bzip2_command = "bzip2 %s" % self.uncompressed_build
        shellCommand(bzip2_command)


class RepackMac(RepackBase):
    def __init__(self, build, partner_dir, build_dir, working_dir, final_dir,
                 ftp_platform, repack_info, signing_command,
                 external_signing_formats=['gpg'],
                 internal_signing_formats=['dmgv2']):
        super(RepackMac, self).__init__(build, partner_dir, build_dir,
                                        working_dir, final_dir,
                                        ftp_platform, repack_info,
                                        signing_command,
                                        external_signing_formats=external_signing_formats,
                                        internal_signing_formats=internal_signing_formats)
        self.mountpoint = path.join("/tmp", "FirefoxInstaller")

    def unpackBuild(self):
        cmd = '%s "%s" "%s" stage/' % (options.dmg_extract_script,
                                       self.full_build_path, self.mountpoint)
        shellCommand(cmd)
        # Disk images contain a link " " to "Applications/" that we need
        # to get rid of while working with it uncompressed.
        os.remove("stage/ ")

    def copyFiles(self):
        if path.exists(path.join("stage", "Firefox.app", "Contents", "Resources", "defaults")):
            target_dir = path.join("stage", "Firefox.app", "Contents", "Resources")
        else:
            target_dir = path.join("stage", "Firefox.app", "Contents", "MacOS")
        for i in ['distribution', 'extensions', 'searchplugins']:
            full_path = path.join(self.full_partner_path, i)
            if path.exists(full_path):
                cp_cmd = "cp -r %s %s" % (full_path, target_dir)
                shellCommand(cp_cmd)
        self.createOverrideIni(target_dir)

    def internallySignBuild(self):
        cwd = os.getcwd()
        try:
            os.chdir("stage")
            signing_cmd = self.signing_command
            for f in self.internal_signing_formats:
                signing_cmd += " --formats %s" % f
            signing_cmd += " Firefox.app"
            shellCommand(signing_cmd)
        finally:
            os.chdir(cwd)

    def repackBuild(self):
        if options.quiet:
            quiet_flag = "--verbosity 0"
        else:
            quiet_flag = ""
        pkg_cmd = "%s --source stage/ --target \"%s\" --volname 'Firefox' " \
            "--icon stage/.VolumeIcon.icns --symlink '/Applications':' ' %s" \
            % (options.pkg_dmg, self.build, quiet_flag)
        shellCommand(pkg_cmd)

    def cleanup(self):
        super(RepackMac, self).cleanup()
        rmdirRecursive("stage")


class RepackWinBase(RepackBase):
    def copyFiles(self):
        super(RepackWinBase, self).copyFiles(WINDOWS_DEST_DIR)

    def addPadding(self):
        if 'padding' in self.repack_info:
            f = open('padding', 'wb')
            f.write(os.urandom(self.repack_info['padding']))
            f.close()

    def repackBuild(self):
        if options.quiet:
            zip_redirect = ">/dev/null"
        else:
            zip_redirect = ""
        targets = WINDOWS_DEST_DIR
        if 'padding' in self.repack_info:
            targets += ' padding'
        zip_cmd = "%s a \"%s\" %s %s" % (SEVENZIP_BIN,
                                         self.build,
                                         targets,
                                         zip_redirect)
        shellCommand(zip_cmd)


class RepackWin(RepackWinBase):
    def __init__(self, build, partner_dir, build_dir, working_dir, final_dir,
                 ftp_platform, repack_info, signing_command,
                 external_signing_formats=['gpg', 'signcode']):
        super(RepackWin, self).__init__(build, partner_dir, build_dir,
                                        working_dir, final_dir,
                                        ftp_platform, repack_info,
                                        signing_command,
                                        external_signing_formats=external_signing_formats)


class RepackWin64(RepackWinBase):
    def __init__(self, build, partner_dir, build_dir, working_dir, final_dir,
                 ftp_platform, repack_info, signing_command,
                 external_signing_formats=['gpg', 'osslsigncode']):
        super(RepackWin64, self).__init__(build, partner_dir, build_dir,
                                        working_dir, final_dir,
                                        ftp_platform, repack_info,
                                        signing_command,
                                        external_signing_formats=external_signing_formats)


def repackSignedBuilds(repack_dir):
    log.info('Repacking signed builds in %s' % repack_dir)
    cwd = os.getcwd()
    os.chdir(script_directory)

    if not path.exists(SEVENZIP_APPTAG):
        if not getSingleFileFromHg(SEVENZIP_APPTAG_PATH):
            log.error("Error: Unable to retrieve %s" % SEVENZIP_APPTAG)
            sys.exit(1)
    if not path.exists(SEVENZIP_HEADER_COMPRESSED):
        if not path.exists(SEVENZIP_HEADER) and \
           not getSingleFileFromHg(SEVENZIP_HEADER_PATH):
            log.error("Error: Unable to retrieve %s" % SEVENZIP_HEADER)
            sys.exit(1)
        upx_cmd = '%s --best -o \"%s\" \"%s\"' % (UPX_BIN,
                                                  SEVENZIP_HEADER_COMPRESSED,
                                                  SEVENZIP_HEADER)
        shellCommand(upx_cmd)
        if not path.exists(SEVENZIP_HEADER_COMPRESSED):
            log.error("Error: Unable to compress %s" % SEVENZIP_HEADER)
            sys.exit(1)

    for f in [SEVENZIP_HEADER_COMPRESSED, SEVENZIP_APPTAG, 'repack-signed.sh']:
        copy(f, repack_dir)

    os.chdir(repack_dir)
    log.info("Running repack.sh")
    shellCommand('./repack-signed.sh')
    for f in [SEVENZIP_HEADER_COMPRESSED, SEVENZIP_APPTAG, 'repack-signed.sh']:
        os.remove(f)
    os.chdir(cwd)


def retrieveFile(url, file_path):
    success = True
    url = urllib.quote(url, safe=':/')
    log.info('Downloading from %s' % url)
    log.info('To: %s', file_path)
    log.info('CWD: %s' % os.getcwd())
    try:
        # use URLopener, which handles errors properly
        retry(StrictFancyURLopener().retrieve,
              kwargs=dict(url=url, filename=file_path))
    except IOError:
        log.error("Error downloading %s" % url, exc_info=True)
        success = False
        try:
            os.remove(file_path)
        except OSError:
            log.info("Cannot remove %s" % file_path, exc_info=True)

    return success


def getSingleFileFromHg(filename):
    file_path = path.basename(filename)
    url = path.join(options.hgroot, options.repo,
                    'raw-file', options.tag, filename)
    return retrieveFile(url, file_path)


if __name__ == '__main__':
    error = False
    partner_builds = {}
    default_platforms = ['linux-i686', 'linux-x86_64', 'mac', 'win32', 'win64']
    repack_build = {'linux-i686':    RepackLinux,
                    'linux-x86_64':  RepackLinux,
                    'mac':           RepackMac,
                    'win32':         RepackWin,
                    'win64':         RepackWin64, }
    signing_command = os.environ.get('MOZ_SIGN_CMD')

    parser = OptionParser(usage="usage: %prog [options]")
    parser.add_option(
        "-d", "--partners-dir", dest="partners_dir", default=PARTNERS_DIR,
        help="Specify the directory where the partner config files are found"
    )
    parser.add_option(
        "-p", "--partner", dest="partner",
        help="Repack for a single partner, specified by name"
    )
    parser.add_option(
        "--platform", action="append", dest="platforms",
        help="Specify platform (multiples ok, e.g. " \
        "--platform win32 --platform mac64)"
    )
    parser.add_option(
        "--nightly-dir", dest="nightly_dir", default="firefox/nightly",
        help="Specify the subdirectory where candidates live " \
        "(default firefox/nightly)"
    )
    parser.add_option(
        "-v", "--version", dest="version",
        help="Set the version number for repacking"
    )
    parser.add_option(
        "-n", "--build-number", dest="build_number", default=BUILD_NUMBER,
        help="Set the build number for repacking"
    )
    parser.add_option(
        "--signed", action="store_true", dest="use_signed", default=False,
        help="Use Windows builds that have already been signed"
    )
    parser.add_option(
        "--include-oem", action="store_true", dest="include_oem", default=False,
        help="Process partners marked as OEM (these are usually one-offs)"
    )
    parser.add_option(
        "--hgroot", dest="hgroot", default=HGROOT,
        help="Set the root URL for retrieving files from hg"
    )
    parser.add_option(
        "-r", "--repo", dest="repo", default=REPO,
        help="Set the repo used for retrieving files from hg"
    )
    parser.add_option(
        "-t", "--tag", dest="tag",
        help="Set the release tag used for retrieving files from hg"
    )
    parser.add_option(
        "-R", "--revision", dest="revision",
        help="Set the (gecko) revision to use from tinderbox-builds"
    )
    parser.add_option(
        "--pkg-dmg", dest="pkg_dmg", default=PKG_DMG,
        help="Set the path to the pkg-dmg for Mac packaging"
    )
    parser.add_option(
        "--dmg-extract-script", dest="dmg_extract_script",
        help="Set the path to the dmg extracting tool"
    )
    parser.add_option(
        "--staging-server", dest="staging_server",  default=STAGING_SERVER,
        help="Set the staging server to use for downloading/uploading"
    )
    parser.add_option(
        "--skip-missing", action="store_true", dest="skip_missing",
        default=False,
        help="Skip missing locales/installers and continue processing repacks")
    parser.add_option(
        "--use-release-builds", action="store_true", dest="use_release_builds",
        default=False,
        help="Use release builds rather than candidate builds"
    )
    parser.add_option(
        "--use-tinderbox-builds", action="store_true", dest="use_tinderbox_builds",
        default=False,
        help="Use tinderbox builds (ie release promotion)"
    )
    parser.add_option(
        "--verify-only", action="store_true", dest="verify_only",
        default=False,
        help="Check for existing partner repacks"
    )
    parser.add_option(
        "-q", "--quiet",  action="store_true", dest="quiet",
        default=False,
        help="Suppress standard output from the packaging tools"
    )

    (options, args) = parser.parse_args()

    if not options.quiet:
        log.setLevel(logging.DEBUG)
    else:
        log.setLevel(logging.WARNING)

    ## Pre-flight checks
    # Specify a repo & revision and we'll pull taskcluster artifacts
    # for tindbox-builds, otherwise we'll look on ftp in the candidates dir,
    # or in releases dir with -use-release-builds
    if options.use_tinderbox_builds:
        if not options.revision:
            log.error("Error: you must specify a revision.")
            error = True
    else:
        if not options.version:
            log.error("Error: you must specify a version number.")
            error = True

        if not options.tag:
            options.tag = createTagFromVersion(options.version)
            if not options.tag:
                log.error("Error: you must specify a release tag for hg.")
                error = True

    if not path.isdir(options.partners_dir):
        log.error("Error: partners dir %s is not a directory." %
                  options.partners_dir)
        error = True

    if not options.platforms:
        options.platforms = default_platforms

    if options.use_signed:
        log.warning("Warning: use of --signed is deprecated. It is now the default.")

    # We only care about the tools if we're actually going to
    # do some repacking.
    if not options.verify_only:
        if ("win32" in options.platforms or "win64" in options.platforms) and not which(SEVENZIP_BIN):
            log.error("Error: couldn't find the %s executable in PATH." %
                      SEVENZIP_BIN)
            error = True

        if ("win32" in options.platforms or "win64" in options.platforms) and not which(UPX_BIN):
            log.error("Error: couldn't find the %s executable in PATH." %
                      UPX_BIN)
            error = True

        if "mac" in options.platforms and not which(options.pkg_dmg):
            log.error("Error: couldn't find the pkg-dmg executable in PATH.")
            error = True

        if "mac" in options.platforms and \
           not which(options.dmg_extract_script):
            log.error("Error: couldn't find the dmg extract script.")
            error = True

    if error:
        sys.exit(1)

    base_workdir = os.getcwd()

    # Remote dir where we can find builds.
    if options.revision:
        base_repo = path.basename(options.repo)
        task_IDs = {}
        # maybe a macosx64 vs macosx issue here
        for platform in platforms:
            try:
                retrieve_file(TASKCLUSTER_INDEX % locals(), 'tc_index.json')
                tc_index = json.load(open('tc_index.json'))
                task_IDs[platform] = tc_index['taskId']
            except:
                log.error('Failed to get taskId from TaskCluster')
    elif options.use_release_builds:
        original_web_dir = "/pub/mozilla.org/firefox/releases/%s" % \
            options.version
    else:
        original_web_dir = "/pub/mozilla.org/%s/%s-candidates/build%s" % \
            (options.nightly_dir, options.version, options.build_number)

    # Local directories for builds
    script_directory = os.getcwd()
    original_builds_dir = path.join(script_directory, "original_builds",
                                    options.version,
                                    "build%s" % options.build_number)
    repacked_builds_dir = path.join(script_directory, "repacked_builds",
                                    options.version,
                                    "build%s" % options.build_number)
    if not signing_command:
        repacked_builds_dir = path.join(repacked_builds_dir, "unsigned")
    if not options.verify_only:
        mkdir(original_builds_dir)
        mkdir(repacked_builds_dir)
        printSeparator()

    # For each partner in the partners dir
    #    Read/check the config file
    #    Download required builds (if not already on disk)
    #    Perform repacks

    failed_downloads = {}
    for partner in os.listdir(options.partners_dir):
        if options.partner:
            if options.partner != partner:
                continue
        full_partner_dir = path.join(options.partners_dir, partner)
        if not path.isdir(full_partner_dir):
            continue
        repack_cfg = path.join(str(full_partner_dir), "repack.cfg")
        if not options.verify_only:
            log.info("Starting repack process for partner: %s" % partner)
        else:
            log.info("Verifying existing repacks for partner: %s" % partner)
        if not path.exists(repack_cfg):
            log.info("%s doesn't exist, skipping this partner" % repack_cfg)
            continue
        repack_info = parseRepackConfig(repack_cfg, options.platforms)
        if not repack_info:
            continue
        if repack_info.has_key('oem') and options.include_oem is False:
            log.info("Skipping partner: %s  - marked as OEM and --include-oem was not set" % partner)
            continue

        partner_repack_dir = path.join(repacked_builds_dir,
                                       repack_info.get('output_dir',
                                                       DEFAULT_OUTPUT_DIR))

        # Figure out which base builds we need to repack.
        for locale in repack_info['locales']:
            for platform in repack_info['platforms']:
                # ja-JP-mac only exists for Mac, so skip non-existent
                # platform/locale combos.
                if (locale == 'ja' and isMac(platform)) or \
                   (locale == 'ja-JP-mac' and not isMac(platform)):
                    continue
                ftp_platform = getFtpPlatform(platform)

                file_ext = getFileExtension(ftp_platform)
                filename = getFilename(options.version, ftp_platform,
                                       file_ext, locale,
                                       pretty_names=not options.use_tinderbox_builds)

                local_filepath = path.join(original_builds_dir, ftp_platform,
                                           locale)
                if not options.verify_only:
                    mkdir(local_filepath)
                local_filename = path.join(local_filepath, filename)
                final_dir = partner_repack_dir % locals()
                if not options.verify_only:
                    if path.exists(final_dir):
                        rmdirRecursive(final_dir)
                    mkdir(final_dir)
                    working_dir = path.join(final_dir, "working")
                    mkdir(working_dir)

                # Check to see if this build is already on disk, i.e.
                # has already been downloaded.
                if not options.verify_only:
                    if path.exists(local_filename):
                        log.info("Found %s on disk, not downloading" %
                                 local_filename)
                    else:
                        # Download original build
                        os.chdir(local_filepath)
                        if options.use_tinderbox_builds:
                            original_build_url = "%s%s" % (
                                TASKCLUSTER_ARTIFACT % task_Ids[platform],
                                filename)
                        else:
                            original_build_url = "http://%s%s/%s/%s/%s" % \
                                (options.staging_server, original_web_dir,
                                ftp_platform, locale, filename)

                        retrieveFile(original_build_url, filename)
                        if isWin(platform):
                            # The following removes signatures by
                            # repacking the source file
                            repackSignedBuilds(os.getcwd())
                        os.chdir(base_workdir)

                    # Make sure we have the local file now
                    if not path.exists(local_filename):
                        log.info("Error: Unable to retrieve %s\n" % filename)
                        if options.skip_missing:
                            # Add failed download to reporting list for later
                            # display.
                            if locale in failed_downloads:
                                if original_build_url in failed_downloads[locale]:
                                    failed_downloads[locale][original_build_url].append(partner)
                                else:
                                    failed_downloads[locale][original_build_url] = [partner]
                            else:
                                failed_downloads[locale] = {original_build_url: [partner]}
                            continue
                        else:
                            sys.exit(1)

                    repackObj = repack_build[ftp_platform](
                        filename, full_partner_dir, local_filepath,
                        working_dir, final_dir, ftp_platform,
                        repack_info, signing_command)
                    repackObj.doRepack()
                    rmdirRecursive(working_dir)
                else:
                    repacked_build = path.join(partner_repack_dir, final_dir,
                                               filename)
                    if not path.exists(repacked_build):
                        log.error("Error: missing expected repack for partner "
                                  "%s (%s/%s): %s" % (partner,
                                                      ftp_platform,
                                                      locale, filename))
                        error = True

    if options.skip_missing and len(failed_downloads) > 0:
        log.error("Failed downloads:")
        for locale in failed_downloads:
            log.error("Locale: %s" % locale)
            for url in failed_downloads[locale]:
                log.error("URL: %s" % url)
                log.error("Which affects the following partners: %s" %
                          failed_downloads[locale][url])
    if error:
        sys.exit(1)
