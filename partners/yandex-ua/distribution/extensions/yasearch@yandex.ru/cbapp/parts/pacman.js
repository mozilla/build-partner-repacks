'use strict';
const EXPORTED_SYMBOLS = ['packageManager'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const GLOBAL = this;
const packageManager = {
        init: function PacMan_init(barApplication) {
            this._logger = barApplication.getLogger('PacMan');
            this._barApp = barApplication;
            barApplication.core.Lib.sysutils.copyProperties(barApplication.core.Lib, GLOBAL);
            this._packagesInfo = {};
            this._cachedPackages = {};
            this._constDomains = this._barApp.preferences.get('pacman.const_pkg_domains', true);
            this.rescanPackages();
        },
        get packageIDs() {
            return [packageID for (packageID in this._packagesInfo)];
        },
        rescanPackages: function PacMan_rescanPackages() {
            this._logger.debug('Looking for packages...');
            this._unloadPackages();
            this._packagesInfo = {};
            var packagesDir = this._barApp.directories.packagesDir;
            var entries = packagesDir.directoryEntries;
            while (entries.hasMoreElements()) {
                let packageDir = entries.getNext().QueryInterface(Ci.nsIFile);
                if (packageDir.isDirectory()) {
                    let packageInfo = this._checkPackageDir(packageDir);
                    if (!packageInfo) {
                        fileutils.removeFileSafe(packageDir);
                        continue;
                    }
                    if (packageInfo.id in this._packagesInfo) {
                        this._logger.warn(strutils.formatString(this._consts.MSG_DUPLICATE_PKG, [
                            packageInfo.id,
                            this._packagesInfo[packageInfo.id].installDir.leafName,
                            packageDir.leafName
                        ]));
                        fileutils.removeFileSafe(packageDir);
                        continue;
                    }
                    this._logger.debug(strutils.formatString(this._consts.STR_FOUND_PACKAGE, [
                        packageInfo.id,
                        packageDir.leafName
                    ]));
                    this._packagesInfo[packageInfo.id] = packageInfo;
                }
            }
        },
        installPackage: function PacMan_installPackage(srcFile, packageInfo) {
            if (!(srcFile instanceof Ci.nsILocalFile))
                throw new CustomErrors.EArgType('srcFile', 'nsILocalFile', typeof srcFile);
            packageInfo = sysutils.copyObj(packageInfo);
            this._validatePackageInfo(packageInfo);
            this._logger.config('Installing package ' + packageInfo.id);
            var packageDir;
            if (srcFile.isDirectory()) {
                packageDir = srcFile.clone();
            } else {
                packageDir = srcFile.parent;
                packageDir.append('0');
                packageDir.createUnique(Ci.nsIFile.DIRECTORY_TYPE, parseInt('0755', 8));
                fileutils.extractZipArchive(srcFile, packageDir);
                srcFile.remove(true);
            }
            if (this.isPackageInstalled(packageInfo.id))
                this.uninstallPackage(packageInfo.id);
            var packagesDirectory = this._barApp.directories.packagesDir;
            var destDirName = this._barApp.directories.makePackageDirName();
            var destPackageDir = packagesDirectory.clone();
            destPackageDir.append(destDirName);
            fileutils.removeFileSafe(destPackageDir.clone());
            try {
                packageDir.moveTo(packagesDirectory, destDirName);
                this._savePackageInfo(packageInfo, destPackageDir);
            } catch (e) {
                this._logger.error('Could not write package files or metadata to its final location. ' + strutils.formatError(e));
                fileutils.removeFileSafe(destPackageDir);
                fileutils.removeFileSafe(srcFile);
                throw e;
            }
            packageInfo.installDir = destPackageDir;
            this._packagesInfo[packageInfo.id] = packageInfo;
            this._logger.config('Package ' + packageInfo.id + ' installed');
        },
        uninstallPackage: function PacMan_uninstallPackage(packageID, cleanup) {
            this.unloadPackage(packageID);
            fileutils.removeFileSafe(this._packagesInfo[packageID].installDir);
            if (cleanup)
                fileutils.removeFileSafe(this._barApp.NativeComponents.getPackageStorage(packageID));
            delete this._packagesInfo[packageID];
            this._logger.config('Package ' + packageID + ' uninstalled');
        },
        isPackageInstalled: function PacMan_isPackageInstalled(packageID) {
            return !!this._packagesInfo[packageID];
        },
        getPackage: function PacMan_getPackage(packageID) {
            var pkg = this._cachedPackages[packageID];
            if (pkg)
                return pkg;
            var packageInfo = this.getPackageInfo(packageID);
            var packageDomain = this._constDomains ? packageInfo.installDir.leafName.replace(/[^\w\-]/g, '') : undefined;
            var package_ = new this._barApp.BarPlatform.ComponentPackage(packageInfo.installDir, packageID, packageInfo.permissions, packageDomain);
            this._cachedPackages[packageID] = package_;
            return package_;
        },
        unloadPackage: function PacMan_unloadPackage(packageID) {
            if (!this._packagesInfo[packageID])
                throw new Error(this._consts.ERR_NO_SUCH_PACKAGE + ' ' + packageID);
            var wl = this._barApp.widgetLibrary;
            if (wl) {
                wl.flushWidgets(packageID);
                wl.flushPlugins(packageID);
            }
            var pkg = this._cachedPackages[packageID];
            if (!pkg)
                return;
            pkg.finalize();
            delete this._cachedPackages[packageID];
        },
        reloadPackage: function PacMan_reloadPackage(packageID) {
            this.unloadPackage(packageID);
            this.getPackage(packageID);
        },
        finalize: function PacMan_finalize() {
            this._unloadPackages();
            this._cachedPackages = null;
            this._packagesInfo = null;
        },
        getPackageInfo: function PacMan_getPackageInfo(packageID) {
            var packageInfo = this._getPackageInstallInfo(packageID);
            packageInfo = sysutils.copyObj(packageInfo, false);
            packageInfo.installDir = packageInfo.installDir.clone();
            return packageInfo;
        },
        _unloadPackages: function PacMan__unloadPackages() {
            for (let packageID in this._cachedPackages) {
                try {
                    this.unloadPackage(packageID);
                } catch (e) {
                    this._logger.error('Error finalizing package ' + packageID + '. ' + strutils.formatError(e));
                }
            }
        },
        _getPackageInstallInfo: function PacMan__getPackageInstallInfo(packageID) {
            var packageInfo = this._packagesInfo[packageID];
            if (!packageInfo) {
                let error = new Error(this._consts.ERR_NO_SUCH_PACKAGE + ' "' + packageID + '"');
                this._logger.warn('PacMan_getPackageInstallInfo: ' + strutils.formatError(error));
                this._logger.trace(error.stack);
                throw error;
            }
            return packageInfo;
        },
        _checkPackageDir: function PacMan__checkPackageDir(packageDir) {
            var dirName = '';
            try {
                dirName = packageDir.leafName;
                this._logger.trace('Checking directory ' + dirName);
                let pkgInfoFile = packageDir.clone();
                pkgInfoFile.append(this._consts.STR_PKGINFO_FILE_NAME);
                if (!(pkgInfoFile.exists() && pkgInfoFile.isReadable())) {
                    this._logger.warn('Directory \'' + dirName + '\' does not contain a valid package');
                    return null;
                }
                let packageInfo = JSON.parse(fileutils.readTextFile(pkgInfoFile));
                if (packageInfo.permissions) {
                    let permissionsName = this._barApp.isTrustedPackageURL(packageInfo.id) ? 'TrustedPackagePermissions' : 'Permissions';
                    let Permissions = this._barApp.BarPlatform[permissionsName];
                    packageInfo.permissions = new Permissions.fromJSON(packageInfo.permissions);
                } else
                    packageInfo.permissions = new this._barApp.BarPlatform.FullPermissions.fromNull();
                this._validatePackageInfo(packageInfo);
                if (packageInfo.platformMin > this._barApp.core.CONFIG.PLATFORM.VERSION) {
                    this._logger.warn('Package in directory \'' + dirName + '\' does not fit this platform');
                    return null;
                }
                packageInfo.installDir = packageDir;
                return packageInfo;
            } catch (e) {
                this._logger.error('An error occured while checking package directory ' + dirName + '. ' + strutils.formatError(e));
                this._logger.debug(e.stack);
                return null;
            }
        },
        _validatePackageInfo: function PacMan__validatePackageInfo(packageInfo) {
            if (!sysutils.isObject(packageInfo))
                throw new CustomErrors.EArgType('packageInfo', 'Object', packageInfo);
            for (let propName in this._metainfoPropNames)
                if (!(propName in packageInfo))
                    throw new SyntaxError(this._consts.ERR_CORRUPT_PKGINFOFILE + ' (' + propName + ')');
            for (let propName in packageInfo)
                if (!(propName in this._metainfoPropNames))
                    delete packageInfo[propName];
        },
        _savePackageInfo: function PacMan__savePackageInfo(packageInfo, toDirectory) {
            var metaInfoFile = toDirectory.clone();
            metaInfoFile.append(this._consts.STR_PKGINFO_FILE_NAME);
            fileutils.writeTextFile(metaInfoFile, JSON.stringify(packageInfo));
        },
        _consts: {
            STR_PKGINFO_FILE_NAME: '.package.json',
            STR_FOUND_PACKAGE: '  Found package \'%1\' located in \'%2\'.',
            MSG_DUPLICATE_PKG: '  Package \'%1\' was found in directories \'%2\' and \'%3\'. Will remove the later.',
            ERR_NO_SUCH_PACKAGE: 'No such package',
            ERR_CORRUPT_PKGINFOFILE: 'Package information file is corrupt'
        },
        _metainfoPropNames: {
            id: 0,
            uri: 0,
            version: 0,
            platformMin: 0,
            permissions: 0,
            __proto__: null
        },
        _barApp: null,
        _logger: null,
        _packagesInfo: null,
        _cachedPackages: null,
        _constDomains: true
    };
