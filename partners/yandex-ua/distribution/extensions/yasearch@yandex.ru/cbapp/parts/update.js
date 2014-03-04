'use strict';
const EXPORTED_SYMBOLS = ['updater'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
const GLOBAL = this;
Cu.import('resource://gre/modules/Services.jsm');
var barApplication;
function DefaultController() {
}
DefaultController.prototype = {
    constructor: DefaultController,
    start: function DefaultController_start(updateProcess) {
        this._updateProcess = updateProcess;
        this._updateProcess.checkUserPackagesUpdates();
    },
    onUserComponentsDataReady: function DefaultController_onUserComponentsDataReady(packageInfoList) {
        if (!packageInfoList.length) {
            this._logger.debug(this._consts.MSG_NO_NEW_COMPS);
            return;
        }
        this._logger.debug(strutils.formatString(this._consts.MSG_FOUND_COMPS, [packageInfoList.length]));
        try {
            this._updateProcess.updateUserComponents(packageInfoList);
        } catch (e) {
            this._logger.error(this._consts.ERR_START_SILENT + e);
            this._logger.debug(e.stack);
        }
    },
    onUserComponentsUpdated: function DefaultController_onUserComponentsUpdated() {
        this._logger.debug(this._consts.MSG_SILENT_FINISHED);
    },
    get _logger() {
        var logger = barApplication.getLogger('DefUpdCtrl');
        this.__defineGetter__('_logger', function () logger);
        return this._logger;
    },
    _consts: {
        MSG_FOUND_COMPS: 'Found %1 new packages.',
        MSG_NO_NEW_COMPS: 'No new components found. Update check finished.',
        MSG_SILENT_FINISHED: 'Silent updates finished.',
        ERR_START_SILENT: 'Could not start updating components. '
    }
};
const updater = {
        init: function Updater_init(application) {
            barApplication = this._application = application;
            barApplication.core.Lib.sysutils.copyProperties(barApplication.core.Lib, GLOBAL);
            this._logger = application.getLogger('CompUpdater');
            this._timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
            var nextInterval = this._nextCheckInterval;
            this._timer.initWithCallback(this, nextInterval, this._timer.TYPE_ONE_SHOT);
            this._logger.config('Components updates will be checked in ' + parseInt(nextInterval / 60 / 1000, 10) + ' minutes');
        },
        finalize: function Updater_finalize() {
            this._timer.cancel();
        },
        checkUpdates: function Updater_checkUpdates(updateController) {
            try {
                if (!misc.getTopBrowserWindow())
                    return;
                this._logger.debug('Updates check initiated');
                this._updateComponents(updateController);
            } finally {
                this._timer.cancel();
                this._timer.initWithCallback(this, this._updateInterval, this._timer.TYPE_ONE_SHOT);
                this._logger.config('Components updates will be checked in ' + parseInt(this._updateInterval / 60 / 1000, 10) + ' minutes');
                this._lastUpdateTimestamp = Date.now();
            }
        },
        notify: function Updater_notify() {
            try {
                this.checkUpdates(new DefaultController());
            } catch (e) {
                this._logger.error('Could not check updates. ' + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        },
        _consts: {
            ERR_MFS_DL: 'Manifest %1 was not downloaded. Status code: %2. Error: %3',
            ERR_PKG_DL: 'Package %1 was not downloaded. Status code: %2. Error: %3',
            ERR_WUNIT_FAIL: 'Could not get unit for widget \'%1\'. %2',
            ERR_PUNIT_FAIL: 'Could not get unit for plugin \'%1\'. %2',
            ERR_W_MISSING: 'Widget \'%1\' is missing',
            ERR_P_MISSING: 'Plugin \'%1\' is missing'
        },
        get _lastUpdatePrefName() {
            return this._application.name + '.updates.widgets.lastUpdateTime';
        },
        get _lastUpdateTimestamp() {
            return parseInt(Preferences.get(this._lastUpdatePrefName, 0), 10) * 1000;
        },
        set _lastUpdateTimestamp(val) {
            Preferences.set(this._lastUpdatePrefName, Math.round(val / 1000));
        },
        get _updateInterval() {
            return 24 * 60 * 60 * 1000;
        },
        get _nextCheckInterval() {
            var nextCheckInterval = this._updateInterval - Math.abs(this._lastUpdateTimestamp - Date.now());
            nextCheckInterval = Math.max(nextCheckInterval, this._application.generateDelay() * 1000);
            return nextCheckInterval;
        },
        _makeTempFile: function Updater__makeTempFile(URLStr) {
            var fileName;
            try {
                let stdURL = Cc['@mozilla.org/network/standard-url;1'].createInstance(Ci.nsIStandardURL);
                stdURL.init(Ci.nsIStandardURL.URLTYPE_STANDARD, -1, URLStr, null, null);
                let url = stdURL.QueryInterface(Ci.nsIURL);
                fileName = url.fileName;
            } catch (e) {
                this._logger.warn('Could not extract URL fileName. ' + e);
            }
            var tempFile = Services.dirsvc.get('TmpD', Ci.nsIFile);
            tempFile.append(fileName || misc.CryptoHash.getFromString(URLStr, 'MD5'));
            tempFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt('0666', 8));
            return tempFile;
        },
        _gatherUnknownComponents: function Updater__gatherUnknownComponents(preset) {
            var widgetLibrary = this._application.widgetLibrary;
            var unknownWIDs = {};
            var unknownPIDs = {};
            preset.allEntries.forEach(function (presetEntry) {
                switch (presetEntry.componentType) {
                case presetEntry.TYPE_WIDGET:
                    if (!widgetLibrary.isKnownWidget(presetEntry.componentID))
                        unknownWIDs[presetEntry.componentID] = 1;
                    break;
                case presetEntry.TYPE_PLUGIN:
                    if (!widgetLibrary.isKnownPlugin(presetEntry.componentID))
                        unknownPIDs[presetEntry.componentID] = 1;
                    break;
                }
            });
            return [
                unknownWIDs,
                unknownPIDs
            ];
        },
        _startAsyncDownloads: function Updater__startAsyncDownloads(URLs, bypassCache, onDownloadsComplete, noFiles) {
            var downloadQueue = new patterns.AsyncTaskQueue(onDownloadsComplete);
            URLs.forEach(function (url) {
                try {
                    downloadQueue.addTask(new netutils.DownloadTask(url, noFiles ? undefined : this._makeTempFile(url), undefined, bypassCache));
                } catch (e) {
                    this._logger.warn('Could not add download task for URL ' + url + '. ' + e);
                }
            }, this);
            downloadQueue.startTasks();
        },
        _check4NewManifests: function Updater__check4NewManifests(downloadQueue) {
            this._logger.debug('Checking manifests');
            var pacMan = this._application.packageManager;
            var manifestsCheckResult = {};
            downloadQueue.finishedTasks.forEach(function (mfsDlTask) {
                var manifestURL = mfsDlTask.originalURI.spec;
                manifestsCheckResult[manifestURL] = undefined;
                if (mfsDlTask.statusCode === Cr.NS_OK) {
                    try {
                        let manifestDoc = fileutils.xmlDocFromStream(mfsDlTask.getContentInputStream(), mfsDlTask.originalURI);
                        let packageManifest = new this._application.BarPlatform.PackageManifest(manifestURL, manifestDoc, this._application.isTrustedPackageURL(manifestURL));
                        let [newPkgInfo] = this._application.selectBestPackage(packageManifest);
                        if (!newPkgInfo)
                            return;
                        if (pacMan.isPackageInstalled(manifestURL)) {
                            let currPkgInfo = pacMan.getPackageInfo(manifestURL);
                            if (Services.vc.compare(newPkgInfo.version, currPkgInfo.version) <= 0)
                                return;
                        }
                        manifestsCheckResult[manifestURL] = newPkgInfo;
                    } catch (e) {
                        if (manifestURL !== 'http://bar.yandex.ru/packages/yandexbar')
                            this._logger.warn('Could not check new manifest from URL [' + manifestURL + '] \n' + strutils.formatError(e));
                    }
                } else {
                    this._logger.warn(strutils.formatString(this._consts.ERR_MFS_DL, [
                        manifestURL,
                        mfsDlTask.statusCode,
                        mfsDlTask.error
                    ]));
                }
            }, this);
            return manifestsCheckResult;
        },
        _preinstallPackage: function Updater__preinstallPackage(packageInfo, archiveFile) {
            var preinstDir = archiveFile.clone();
            preinstDir.createUnique(Ci.nsIFile.DIRECTORY_TYPE, parseInt('0755', 8));
            fileutils.extractZipArchive(archiveFile, preinstDir);
            var preinstPkg = new this._application.BarPlatform.ComponentPackage(preinstDir, packageInfo.id, packageInfo.permissions);
            return preinstPkg;
        },
        _getComponentIDsRemovedFromPackage: function Updater__getComponentIDsRemovedFromPackage(newPackage) {
            const BarPlatform = this._application.BarPlatform;
            const widgetLibrary = this._application.widgetLibrary;
            if (!(newPackage instanceof BarPlatform.ComponentPackage))
                throw new CustomErrors.EArgType('newPackage', 'BarPlatform.ComponentPackage', newPackage);
            var removedWIDs = [];
            var removedPIDs = [];
            widgetLibrary.getWidgetIDs(newPackage.id).forEach(function (widgetID) {
                try {
                    let [
                            packageID,
                            widgetName
                        ] = BarPlatform.parseComponentID(widgetID);
                    let unit = newPackage.getUnit(widgetName);
                    unit.checkSecurity();
                    if (unit.componentInfo.type != 'widget')
                        removedWIDs.push(widgetID);
                } catch (e) {
                    this._logger.warn(strutils.formatString(this._consts.ERR_WUNIT_FAIL, [
                        widgetID,
                        e
                    ]));
                    removedWIDs.push(widgetID);
                }
            }, this);
            widgetLibrary.getPluginIDs(newPackage.id).forEach(function (pluginID) {
                try {
                    let [
                            packageID,
                            pluginName
                        ] = BarPlatform.parseComponentID(pluginID);
                    let unit = newPackage.getUnit(pluginName);
                    unit.checkSecurity();
                    if (unit.componentInfo.type != 'plugin')
                        removedPIDs.push(pluginID);
                } catch (e) {
                    this._logger.warn(strutils.formatString(this._consts.ERR_PUNIT_FAIL, [
                        pluginID,
                        e
                    ]));
                    removedPIDs.push(pluginID);
                }
            }, this);
            return [
                removedWIDs,
                removedPIDs
            ];
        },
        _checkForMissingComponents: function Updater__checkForMissingComponents(newPackages, expectedWidgets, expectedPlugins) {
            const BarPlatform = this._application.BarPlatform;
            const pacMan = this._application.packageManager;
            var missingWIDs = [];
            var missingPIDs = [];
            this._logger.debug('Expecting widgets: "' + misc.mapKeysToArray(expectedWidgets) + '".' + 'Expecting plugins: "' + misc.mapKeysToArray(expectedPlugins) + '".');
            for (let widgetID in expectedWidgets) {
                try {
                    let [
                            packageID,
                            widgetName
                        ] = BarPlatform.parseComponentID(widgetID);
                    let isNewPackage = packageID in newPackages;
                    let checkedPackage = isNewPackage ? newPackages[packageID].tempPackage : pacMan.getPackage(packageID);
                    let unit = checkedPackage.getUnit(widgetName);
                    if (isNewPackage)
                        unit.checkSecurity();
                    if (unit.componentInfo.type != 'widget')
                        missingWIDs.push(widgetID);
                } catch (e) {
                    this._logger.warn(strutils.formatString(this._consts.ERR_WUNIT_FAIL, [
                        widgetID,
                        e
                    ]));
                    missingWIDs.push(widgetID);
                }
            }
            for (let pluginID in expectedPlugins) {
                try {
                    let [
                            packageID,
                            pluginName
                        ] = BarPlatform.parseComponentID(pluginID);
                    let isNewPackage = packageID in newPackages;
                    let checkedPackage = isNewPackage ? newPackages[packageID].tempPackage : pacMan.getPackage(packageID);
                    let unit = checkedPackage.getUnit(pluginName);
                    if (isNewPackage)
                        unit.checkSecurity();
                    if (unit.componentInfo.type != 'plugin')
                        missingPIDs.push(pluginID);
                } catch (e) {
                    this._logger.warn(strutils.formatString(this._consts.ERR_PUNIT_FAIL, [
                        pluginID,
                        e
                    ]));
                    missingPIDs.push(pluginID);
                }
            }
            return [
                missingWIDs,
                missingPIDs
            ];
        },
        _installUpdatePackage: function Updater__installUpdatePackage(newPackage, packageInfo) {
            var widgetLibrary = this._application.widgetLibrary;
            if (!(newPackage instanceof this._application.BarPlatform.ComponentPackage))
                throw new CustomErrors.EArgType('newPackage', 'BarPlatform.ComponentPackage', newPackage);
            var packageID = packageInfo.id;
            var [
                    removedWIDs,
                    removedPIDs
                ] = this._getComponentIDsRemovedFromPackage(newPackage);
            if (removedWIDs.length)
                this._logger.info('The following widgets will no longer be available: ' + removedWIDs);
            if (removedPIDs.length)
                this._logger.info('The following plugins will no longer be available: ' + removedPIDs);
            var prevPluginsState = widgetLibrary.getCurrentPluginsState(packageID);
            this._application.switchWidgets(packageID, false);
            try {
                let widgetsChanged = widgetLibrary.forgetWidgets(removedWIDs, true);
                let pluginsChanged = widgetLibrary.forgetPlugins(removedPIDs, true);
                widgetLibrary.persist(widgetsChanged > 0, pluginsChanged > 0);
                widgetLibrary.flushWidgets(packageID);
                widgetLibrary.cleanPackageParserCache(packageID);
                widgetLibrary.flushPlugins(packageID);
                this._application.packageManager.installPackage(newPackage.rootDirectory, packageInfo);
                this._updateBrowserWindows([packageID], removedWIDs);
            } finally {
                widgetLibrary.setPluginsState(prevPluginsState, true);
                this._application.switchWidgets(packageID, true);
            }
        },
        _updateBrowserWindows: function Updater__updateBrowserWindows(changedPackageIDs, obsoleteWIDs) {
            if (!(changedPackageIDs && changedPackageIDs.length) && !(obsoleteWIDs && obsoleteWIDs.length))
                return;
            barApplication.forEachWindow(function UpdateProcess_updBrowserWnds(controller) {
                if (obsoleteWIDs)
                    obsoleteWIDs.forEach(function (widgetID) controller.removeWidgetsOfProto(widgetID));
                if (changedPackageIDs)
                    controller.updatePalette(changedPackageIDs);
            }, this, true);
        },
        _storePreset: function Updater__storePreset(preset) {
            var presetFile = this._application.directories.presetsDir;
            presetFile.append(encodeURIComponent(preset.address));
            preset.saveToFile(presetFile);
        },
        _updateComponents: function Updater__updateComponents(updateController) {
            new UpdateProcess(updateController);
        }
    };
const UpdateProcess = function UpdateProcess(updateController) {
    this._logger = barApplication.getLogger('CompUpdater');
    this._updateController = updateController;
    updateController.start(this);
};
UpdateProcess.prototype = {
    constructor: UpdateProcess,
    checkUserPackagesUpdates: function UpdateProcess_checkUserPackagesUpdates() {
        this._logger.debug('User components update started.');
        var packageIDsSet = {};
        for (let [
                    ,
                    packageID
                ] in Iterator(barApplication.packageManager.packageIDs))
            packageIDsSet[packageID] = 1;
        var URLsList = misc.mapKeysToArray(packageIDsSet);
        if (URLsList.length) {
            this._logger.debug('Need to check manifests: ' + URLsList);
            updater._startAsyncDownloads(URLsList, true, this._onUserManifestsDownloaded.bind(this), true);
        } else {
            this._updateController.onUserComponentsDataReady([]);
        }
    },
    updateUserComponents: function UpdateProcess_startPackagesInstallation(packageInfoList) {
        var packageInfoSet = {};
        packageInfoList.forEach(function (packageInfo) packageInfoSet[packageInfo.id] = packageInfo);
        this._startPackageDownloads(packageInfoSet, this._onUsrPkgsPreinstalled.bind(this));
    },
    _updateController: null,
    _startPackageDownloads: function UpdateProcess__startPackageDownloads(manifestsCheckResult, onPreinstalled) {
        if (typeof onPreinstalled != 'function')
            throw new CustomErrors.EArgType('onPreinstalled', 'Function', onPreinstalled);
        var packageDlQueue = new patterns.AsyncTaskQueue(this._preinstallPackages.bind(this, manifestsCheckResult, onPreinstalled));
        for (let [
                    packageID,
                    packageInfo
                ] in Iterator(manifestsCheckResult)) {
            if (!packageInfo)
                continue;
            try {
                this._logger.debug('Adding download task for package ' + packageID);
                let archiveDlTask = new netutils.DownloadTask(packageInfo.fileURL, updater._makeTempFile(packageInfo.fileURL), undefined, true);
                archiveDlTask.packageID = packageID;
                packageDlQueue.addTask(archiveDlTask);
            } catch (e) {
                this._logger.warn('Could not add archive download task for URL ' + packageInfo.fileURL + '. ' + e);
            }
        }
        var numDlTasks = packageDlQueue.pendingTasks.length;
        if (numDlTasks > 0) {
            this._logger.debug('Downloading ' + numDlTasks + ' package archives...');
            packageDlQueue.startTasks();
        } else {
            this._logger.debug('No new packages are available right now.');
            onPreinstalled({});
        }
    },
    _preinstallPackages: function UpdateProcess__preinstallPackages(packageInfoSet, onPreinstalled, pkgsQueue) {
        const pacMan = barApplication.packageManager;
        var preinstalledPackages = {};
        if (pkgsQueue) {
            pkgsQueue.finishedTasks.forEach(function (pkgDlTask) {
                try {
                    let packageID = pkgDlTask.packageID;
                    let archiveURL = pkgDlTask.originalURI.spec;
                    if (pkgDlTask.statusCode !== Cr.NS_OK) {
                        this._logger.warn(strutils.formatString(updater._consts.ERR_PKG_DL, [
                            archiveURL,
                            pkgDlTask.statusCode,
                            pkgDlTask.error
                        ]));
                        return;
                    }
                    let packageInfo = packageInfoSet[packageID];
                    if (!packageInfo) {
                        this._logger.warn('Strange thing happened. Could not find PackageInfo for ' + [
                            packageID,
                            archiveURL
                        ]);
                        return;
                    }
                    try {
                        preinstalledPackages[packageID] = {
                            tempPackage: updater._preinstallPackage(packageInfo, pkgDlTask.outputFile),
                            packageInfo: packageInfo
                        };
                    } catch (e) {
                        this._logger.error('Could not preinstall package from ' + archiveURL + '. ' + strutils.formatError(e));
                    }
                } finally {
                    fileutils.removeFileSafe(pkgDlTask.outputFile);
                }
            }, this);
        }
        try {
            onPreinstalled(preinstalledPackages);
        } finally {
            for (let [
                        ,
                        preinstInfo
                    ] in Iterator(preinstalledPackages)) {
                let rootDir = preinstInfo.tempPackage.rootDirectory;
                preinstInfo.tempPackage.finalize();
                fileutils.removeFileSafe(rootDir);
            }
        }
    },
    _onUsrPkgsPreinstalled: function UpdateProcess__onUsrPkgsPreinstalled(preinstalledPackages) {
        this._logger.debug('User components are ready to update');
        try {
            for (let [
                        ,
                        preinstInfo
                    ] in Iterator(preinstalledPackages)) {
                let newPackage = preinstInfo.tempPackage;
                try {
                    updater._installUpdatePackage(newPackage, preinstInfo.packageInfo);
                } catch (e) {
                    this._logger.warn(strutils.formatString('Package %1 failed to install/update. %2', [
                        newPackage.id,
                        e
                    ]));
                    this._logger.debug(e.stack);
                }
            }
            try {
                let [
                        newWIDsSet,
                        newPIDsSet
                    ] = updater._gatherUnknownComponents(barApplication.defaultPreset);
                this._ensureComponentsAvailable([], newWIDsSet, newPIDsSet);
                this._registerNewComponents(newWIDsSet, newPIDsSet);
            } catch (e) {
                this._logger.warn('Preset failed to update.');
                this._logger.debug(e.stack);
            }
        } catch (e) {
            this._logger.error('Silent components update failed. ' + strutils.formatError(e));
            this._logger.debug(e.stack);
        }
        this._updateController.onUserComponentsUpdated();
    },
    _ensureComponentsAvailable: function UpdateProcess__ensureComponentsAvailable(preinstalledPackages, newWIDsSet, newPIDsSet) {
        var [
                missingWIDs,
                missingPIDs
            ] = updater._checkForMissingComponents(preinstalledPackages, newWIDsSet, newPIDsSet);
        var errorMessage = '';
        if (missingWIDs.length)
            errorMessage += 'Missing widgets: ' + missingWIDs + '.';
        if (missingPIDs.length)
            errorMessage += 'Missing plugins: ' + missingPIDs + '.';
        if (errorMessage)
            throw new Error(errorMessage);
    },
    _registerNewComponents: function UpdateProcess__registerNewComponents(newWIDsSet, newPIDsSet) {
        var widgetLibrary = barApplication.widgetLibrary;
        var widgetsChanged = 0;
        var pluginsChanged = 0;
        for (let widgetID in newWIDsSet) {
            if (widgetLibrary.registerWidgets(widgetID, true, true)) {
                widgetsChanged++;
                this._tryAddToAllPalettes([widgetID]);
            }
        }
        for (let pluginID in newPIDsSet)
            pluginsChanged += widgetLibrary.registerPlugins(pluginID, true, true);
        widgetLibrary.persist(widgetsChanged > 0, pluginsChanged > 0);
    },
    _tryAddToAllPalettes: function UpdateProcess__tryAddToAllPalettes(widgetIDs) {
        try {
            barApplication.forEachWindow(function (controller) {
                controller.appendToPalette(widgetIDs);
            });
        } catch (e) {
            this._logger.error('Could not add following items to palettes: ' + widgetIDs + '. ' + strutils.formatError(e));
            this._logger.debug(e.stack);
        }
    },
    _onUserManifestsDownloaded: function UpdateProcess__onUserManifestsDownloaded(mfsQueue) {
        var manifestsCheckResult = updater._check4NewManifests(mfsQueue);
        var packageInfoList = [];
        for (let [
                    ,
                    packageInfo
                ] in Iterator(manifestsCheckResult)) {
            if (packageInfo)
                packageInfoList.push(packageInfo);
        }
        this._updateController.onUserComponentsDataReady(packageInfoList);
    }
};
