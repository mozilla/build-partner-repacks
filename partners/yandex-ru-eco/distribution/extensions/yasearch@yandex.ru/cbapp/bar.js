'use strict';
const EXPORTED_SYMBOLS = ['barApplication'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const GLOBAL = this;
Cu.import('resource://gre/modules/Services.jsm');
const barApplication = {
        init: function BarApp_init(core) {
            this._barCore = core;
            core.Lib.sysutils.copyProperties(core.Lib, GLOBAL);
            this._logger = Log4Moz.repository.getLogger(core.appName + '.App');
            this._dirs._barApp = this;
            this._wndControllerName = this.name + 'OverlayController';
            this._init();
            this.addonManager.saveBuildDataToPreferences();
            try {
                this.widgetLibrary.persist(false, true);
            } catch (e) {
                this._logger.error('Failed writing plugins list. ' + strutils.formatError(e));
            }
            new sysutils.Timer(function cleanupFunc() {
                try {
                    this._logger.debug('Preferences cleanup started');
                    this._cleanupPreferences();
                } catch (e) {
                    this._logger.error('Failed cleaning preferences. ' + strutils.formatError(e));
                }
            }.bind(this), 2 * 60 * 1000);
        },
        finalize: function BarApp_finalize(callback) {
            var doFinalCleanup = this.addonManager.isAddonUninstalling;
            var addonId = this.addonManager.addonId;
            this.addonManager.isAddonDisabled().then(function (addonDisabled) {
                if (!(addonDisabled || doFinalCleanup))
                    return;
                try {
                    this.overlayProvider.removeWidgetsFromToolbars();
                } catch (e) {
                    this._logger.error('Failed remove widgets from toolbars. ' + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
                try {
                    this.overlayProvider.returnNativeElements();
                } catch (e) {
                    this._logger.error('Failed return native elements. ' + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
                try {
                    this.overlayProvider.removeToolbarsCollapsedState();
                } catch (e) {
                    this._logger.error('Failed remove toolbars collapsed state. ' + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
            }.bind(this)).then(function () {
                var partsFinalizedCallback = function partsFinalizedCallback() {
                        this._logger.debug('Finalize process finished.');
                        if (doFinalCleanup) {
                            this._finalCleanup(addonId);
                        }
                        this._logger = null;
                        this._barCore = null;
                        callback();
                    }.bind(this);
                this._finalizeParts(doFinalCleanup, partsFinalizedCallback);
            }.bind(this));
        },
        get core() {
            return this._barCore;
        },
        get name() {
            return this._barCore.appName;
        },
        get barless() {
            if (this._barless === null) {
                this._barless = this.branding.barless;
            }
            return this._barless;
        },
        get defaultPresetURL() {
            return Preferences.get(this.name + this._consts.PREF_DEFAULT_PRESET_URL, null);
        },
        get defaultPreset() {
            return this._defaultPreset;
        },
        set defaultPreset(newPreset) {
            if (!(newPreset instanceof this.BarPlatform.Preset))
                throw new CustomErrors.EArgType('newPreset', 'Preset', newPreset);
            this._defaultPreset = newPreset;
        },
        get internalDefaultPreset() {
            var presetDoc = fileutils.xmlDocFromStream(this.addonFS.getStream('$content/presets/' + this._consts.DEF_PRESET_FILE_NAME));
            return new this.BarPlatform.Preset(presetDoc);
        },
        get usingInternalPreset() {
            return this._usingInternalPreset;
        },
        get preferencesBranch() {
            var appPrefsBranch = 'extensions.' + this.addonManager.addonId + '.';
            delete this.preferencesBranch;
            this.__defineGetter__('preferencesBranch', function () appPrefsBranch);
            return appPrefsBranch;
        },
        get preferences() {
            var appPrefs = new Preferences(this.preferencesBranch);
            delete this.preferences;
            this.__defineGetter__('preferences', function () appPrefs);
            return appPrefs;
        },
        get openLinksInNewTab() {
            return this.preferences.get('openLinksInNewTab', false);
        },
        _delayMultiplier: 0,
        _lastGeneratedDelay: 0,
        generateDelay: function BarApp_generateDelay() {
            if (!this._delayMultiplier)
                this._delayMultiplier = this.preferences.get('debug.delayMultiplier', 60);
            this._lastGeneratedDelay += this._delayMultiplier;
            return this._lastGeneratedDelay;
        },
        getLogger: function BarApp_getLogger(name) {
            return Log4Moz.repository.getLogger(this.name + '.' + name);
        },
        get localeString() {
            if (!this._localeString) {
                let xulChromeReg = Cc['@mozilla.org/chrome/chrome-registry;1'].getService(Ci.nsIXULChromeRegistry);
                try {
                    this._localeString = xulChromeReg.getSelectedLocale(this.name);
                } catch (ex) {
                    this._localeString = xulChromeReg.getSelectedLocale('global');
                }
            }
            return this._localeString || 'en';
        },
        get locale() {
            if (!this._locale)
                this._locale = misc.parseLocale(this.localeString);
            return this._locale;
        },
        get directories() {
            return this._dirs;
        },
        get partsURL() {
            return 'resource://' + this.name + '-app/parts/';
        },
        restartComponents: function BarApp_restartComponents(packageID) {
            this.switchWidgets(packageID, false);
            var pluginsState = this.widgetLibrary.getCurrentPluginsState();
            this.widgetLibrary.flushPlugins(packageID);
            this.packageManager.reloadPackage(packageID);
            this.widgetLibrary.setPluginsState(pluginsState);
            this.switchWidgets(packageID, true);
        },
        switchWidgets: function BarApp_switchWidgets(packageID, on) {
            this.forEachWindow(function switchWidgets(controller) {
                controller.switchWidgets(packageID, on);
            });
        },
        forEachWindow: function BarApp_forEachWindow(func, contextObj, handleExceptions) {
            if (typeof func !== 'function')
                throw CustomErrors.EArgType('func', 'Function', func);
            var browserWindows = misc.getBrowserWindows();
            let (i = browserWindows.length) {
                for (; i--;) {
                    try {
                        let controller = browserWindows[i][this._wndControllerName];
                        if (controller)
                            func.call(contextObj, controller);
                    } catch (e) {
                        if (!handleExceptions)
                            throw e;
                        let errMsg = strutils.formatString('Could not call browser controller. Caller: \'%1\'. %2', [
                                func.name,
                                e
                            ]);
                        this._logger.error(errMsg);
                        this._logger.debug(e.stack);
                    }
                }
            }
        },
        openSettingsDialog: function BarApp_openSettingsDialog(navigatorWindow) {
            var chromePath = 'chrome://' + this.name + '/content/preferences/preferences.xul';
            var windowClass = this.name + ':Preferences';
            var resizeable = true;
            var modal = false;
            var windowArgs = Array.slice(arguments, 1);
            var focusIfOpened = true;
            this._openWindow.apply(this, [
                navigatorWindow,
                chromePath,
                windowClass,
                focusIfOpened,
                resizeable,
                modal,
                windowArgs
            ]);
        },
        openAboutDialog: function BarApp_openAboutDialog() {
            return this.openSettingsDialog(null, undefined, 'about');
        },
        selectBestPackage: function BarApp_selectBestPackage(manifest) {
            if (!(manifest instanceof this.BarPlatform.PackageManifest))
                throw new CustomErrors.EArgType('manifest', 'PackageManifest', manifest);
            var platformInfo = sysutils.platformInfo;
            var platformVersion = this._barCore.CONFIG.PLATFORM.VERSION;
            var bestPackageInfo = null;
            var bestVersion = '0';
            var bestPackageInfo2 = null;
            var bestVersion2 = '0';
            var comparator = sysutils.versionComparator;
            var packagesInfo = manifest.packagesInfo;
            let (i = 0, length = packagesInfo.length) {
                for (; i < length; i++) {
                    let packageInfo = packagesInfo[i];
                    if (packageInfo.browser && packageInfo.browser != platformInfo.browser.name) {
                        this._logger.trace('Package \'' + packageInfo.id + '\' for browser \'' + packageInfo.browser + '\' ' + 'is not usable on \'' + platformInfo.browser.name + '\'');
                        continue;
                    }
                    if (packageInfo.os && packageInfo.os != platformInfo.os.name) {
                        this._logger.trace('Package \'' + packageInfo.id + '\' for os \'' + packageInfo.os + '\' ' + 'is not usable on \'' + platformInfo.os.name + '\'');
                        continue;
                    }
                    if (packageInfo.architecture && packageInfo.architecture != platformInfo.browser.simpleArchitecture) {
                        this._logger.trace('Package \'' + packageInfo.id + '\' for architecture \'' + packageInfo.architecture + '\' ' + 'is not usable on \'' + platformInfo.browser.simpleArchitecture + '\'');
                        continue;
                    }
                    if (packageInfo.platformMin <= platformVersion) {
                        let newerPackage = comparator.compare(packageInfo.version, bestVersion) > 0, newerPlatform = bestPackageInfo && packageInfo.platformMin > bestPackageInfo.platformMin;
                        if (newerPackage || newerPlatform) {
                            bestPackageInfo = packageInfo;
                            bestVersion = packageInfo.version;
                        }
                    } else {
                        if (comparator.compare(packageInfo.version, bestVersion2) > 0) {
                            bestPackageInfo2 = packageInfo;
                            bestVersion2 = packageInfo.version;
                        }
                    }
                }
            }
            return [
                bestPackageInfo,
                bestPackageInfo2
            ];
        },
        isYandexHost: function BarApp_isYandexHost(hostName) {
            return this._yandexHostsPattern.test(hostName);
        },
        isPrivilegedPackageURL: function BarApp_isPrivilegedPackageURL(url) {
            return this.isPrivilegedPackageURI(netutils.newURI(url));
        },
        isPrivilegedPackageURI: function BarApp_isPrivilegedPackageURI(uri) {
            if (!(uri instanceof Ci.nsIURI))
                throw new CustomErrors.EArgType('uri', 'nsIURI', uri);
            if (uri.scheme != 'http' && uri.scheme != 'https')
                return false;
            return uri.host == this._consts.WIDGET_LIBRARY_HOST && /^\/packages\/(approved|249|250|251)\//.test(uri.path) || uri.host in this._consts.BAR_HOSTS && uri.path.indexOf('/packages/') == 0 || uri.host == this._consts.DOWNLOAD_HOST_NAME || this.isBarQADebuggingURI(uri) || false;
        },
        isTrustedPackageURL: function BarApp_isTrustedPackageURL(url) {
            return this.isTrustedPackageURI(netutils.newURI(url));
        },
        isTrustedPackageURI: function BarApp_isTrustedPackageURI(uri) {
            return uri.host == this._consts.WIDGET_LIBRARY_HOST && uri.path.indexOf('/packages/') === 0 || this.isPrivilegedPackageURI(uri) || false;
        },
        isBarQADebuggingURI: function BarApp_isBarQADebuggingURI(uri) {
            return uri.host == this._consts.BARQA_HOST_NAME && uri.path.indexOf('/notapp/') == -1;
        },
        onNewBrowserReady: function BarApp_onNewBrowserReady(controller) {
            var isFirstWindow = ++this._navigatorID == 1;
            if (!isFirstWindow)
                return;
            try {
                if (this._introducedWEntries.length > 0)
                    controller.placeWidgets(this._introducedWEntries, false, true);
            } catch (e) {
                this._logger.error('Could not place introduced widgets on toolbar. ' + strutils.formatError(e));
            }
            try {
                this.incomingCompMgr.activateIncoming(controller);
            } catch (e) {
                this._logger.error('Could not place preinstalled widgets on toolbar. ' + strutils.formatError(e));
            }
            try {
                this.componentsUsage.onFisrtNavigatorReady();
            } catch (e) {
                this._logger.error('componentsUsage.onFisrtNavigatorReady failed. ' + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        },
        _consts: {
            PREF_DEFAULT_PRESET_URL: '.default.preset.url',
            DEF_PRESET_FILE_NAME: 'default.xml',
            DOWNLOAD_HOST_NAME: 'download.yandex.ru',
            BARQA_HOST_NAME: 'bar.qa.yandex.net',
            BAR_HOSTS: {
                'bar.yandex.ru': 0,
                'toolbar.yandex.ru': 0
            },
            WIDGET_LIBRARY_HOST: 'bar-widgets.yandex.ru'
        },
        _barCore: null,
        _barless: null,
        _logger: null,
        _defaultPreset: null,
        _usingInternalPreset: false,
        _introducedWEntries: [],
        _introducedPEntries: [],
        _overlayProvider: null,
        _navigatorID: 0,
        _localeString: null,
        _wndControllerName: undefined,
        _yandexHostsPattern: /(^|\.)yandex\.(ru|ua|by|kz|net|com)$/i,
        _dirs: {
            get appRootDir() {
                if (!this._appRoot)
                    this._appRoot = this._barApp.core.rootDir;
                var dirFile = this._appRoot.clone();
                this._forceDir(dirFile);
                return dirFile;
            },
            get packagesDir() {
                var packagesDir = this.appRootDir;
                packagesDir.append('packages');
                this._forceDir(packagesDir);
                return packagesDir;
            },
            get parsedCompsDir() {
                var parsedDir = this.appRootDir;
                parsedDir.append('parsed_comps');
                this._forceDir(parsedDir);
                return parsedDir;
            },
            get presetsDir() {
                var presetsDir = this.appRootDir;
                presetsDir.append('presets');
                this._forceDir(presetsDir);
                return presetsDir;
            },
            get nativeStorageDir() {
                var storageDir = this.appRootDir;
                storageDir.append('native_storage');
                this._forceDir(storageDir);
                return storageDir;
            },
            get vendorDir() {
                var vendorDir = this.appRootDir;
                vendorDir.append('vendor');
                this._forceDir(vendorDir);
                return vendorDir;
            },
            get userDir() {
                var isWindowsOS = sysutils.platformInfo.os.name == 'windows';
                var userDir = Services.dirsvc.get(isWindowsOS ? 'AppData' : 'Home', Ci.nsIFile);
                userDir.append(isWindowsOS ? 'Yandex' : '.yandex');
                this.__defineGetter__('userDir', function _userDir() {
                    this._forceDir(userDir);
                    return userDir.clone();
                }.bind(this));
                return this.userDir;
            },
            makePackageDirName: function BarApp_makePackageDirName() {
                return this._uuidGen.generateUUID().toString();
            },
            _barApp: null,
            _uuidGen: Cc['@mozilla.org/uuid-generator;1'].getService(Ci.nsIUUIDGenerator),
            _forceDir: function BarAppDirs_forceDir(dirFile, perm) {
                fileutils.forceDirectories(dirFile, perm);
            }
        },
        _parts: {},
        _partNames: [
            {
                name: 'addonManager',
                file: 'addonmgr.js'
            },
            {
                name: 'yCookie',
                file: 'ycookie.js'
            },
            {
                name: 'addonFS',
                file: 'addonfs.js'
            },
            {
                name: 'appStrings',
                file: 'strbundle.js'
            },
            {
                name: 'BarPlatform',
                file: 'platform.js'
            },
            {
                name: 'clids',
                file: 'clids.js'
            },
            {
                name: 'branding',
                file: 'branding.js'
            },
            {
                name: 'brandProviders',
                file: 'brand_prov.js'
            },
            {
                name: 'addonStatus',
                file: 'addonStatus.js'
            },
            {
                name: 'distribution',
                file: 'distribution.js'
            },
            {
                name: 'installer',
                file: 'installer.js'
            },
            {
                name: 'notifications',
                file: 'notifications.js'
            },
            {
                name: 'defender',
                file: 'defender.js'
            },
            {
                name: 'vendorCookie',
                file: 'vendorCookie.js'
            },
            {
                name: 'overlayProvider',
                file: 'overlay_prov.js'
            },
            {
                name: 'componentsUsage',
                file: 'compsusage.js'
            },
            {
                name: 'packageManager',
                file: 'pacman.js'
            },
            {
                name: 'NativeComponents',
                file: 'native_comps.js'
            },
            {
                name: 'XB',
                file: 'xb.js'
            },
            {
                name: 'widgetLibrary',
                file: 'widgetlib.js'
            },
            {
                name: 'incomingCompMgr',
                file: 'incoming.js'
            },
            {
                name: 'updater',
                file: 'update.js'
            },
            {
                name: 'aboutSupport',
                file: 'aboutSupport.js'
            },
            {
                name: 'browserUsage',
                file: 'browserUsage.js'
            },
            {
                name: 'barnavig',
                file: 'barnavig.js'
            },
            {
                name: 'migration',
                file: 'migration.js'
            },
            {
                name: 'autoinstaller',
                file: 'autoinst.js'
            },
            {
                name: 'slices',
                file: 'slices.js'
            },
            {
                name: 'anonymousStatistic',
                file: 'anonymousStatistic.js'
            }
        ],
        _PREV_BUILTIN_WIDS: [
            'http://bar.yandex.ru/packages/yandexbar#logo',
            'http://bar.yandex.ru/packages/yandexbar#search',
            'http://bar.yandex.ru/packages/yandexbar#cy',
            'http://bar.yandex.ru/packages/yandexbar#spam',
            'http://bar.yandex.ru/packages/yandexbar#opinions',
            'http://bar.yandex.ru/packages/yandexbar#spellchecker',
            'http://bar.yandex.ru/packages/yandexbar#translator',
            'http://bar.yandex.ru/packages/yandexbar#pagetranslator',
            'http://bar.yandex.ru/packages/yandexbar#login',
            'http://bar.yandex.ru/packages/yandexbar#mail',
            'http://bar.yandex.ru/packages/yandexbar#fotki',
            'http://bar.yandex.ru/packages/yandexbar#yaru',
            'http://bar.yandex.ru/packages/yandexbar#moikrug',
            'http://bar.yandex.ru/packages/yandexbar#lenta',
            'http://bar.yandex.ru/packages/yandexbar#zakladki',
            'http://bar.yandex.ru/packages/yandexbar#widget-news',
            'http://bar.yandex.ru/packages/yandexbar#settings'
        ],
        _finalCleanup: function BarApp__finalCleanup(aAddonId) {
            this._logger.debug('Cleanup...');
            var prefBranches = [
                    this._barCore.xbWidgetsPrefsPath,
                    this._barCore.nativesPrefsPath,
                    this._barCore.staticPrefsPath,
                    this.name + '.versions.'
                ];
            if (aAddonId)
                prefBranches.push('extensions.' + aAddonId + '.');
            prefBranches.forEach(function (prefBranch) {
                try {
                    Preferences.resetBranch(prefBranch);
                } catch (e) {
                    this._logger.error('Final cleanup: can\'t reset branch \'' + prefBranch + '\'. ' + strutils.formatError(e));
                }
            }, this);
            var prefs = [this.name + this._consts.PREF_DEFAULT_PRESET_URL];
            prefs.forEach(function (pref) {
                try {
                    Preferences.reset(pref);
                } catch (e) {
                    this._logger.error('Final cleanup: can\'t reset pref \'' + pref + '\'. ' + strutils.formatError(e));
                }
            }, this);
            this._logger.debug('Removing all files');
            this._barCore.logging = false;
            fileutils.removeFileSafe(this.directories.appRootDir);
        },
        _init: function BarApp__init() {
            var httpHandler = Cc['@mozilla.org/network/protocol;1?name=http'].getService(Ci.nsIHttpProtocolHandler);
            var initString = 'Initializing Bar platform ' + this._barCore.CONFIG.PLATFORM.VERSION + ' r' + this._barCore.buidRevision + ', UA: ' + httpHandler.userAgent;
            this._logger.config(initString);
            var startTime = Date.now();
            try {
                this._loadParts();
            } catch (e) {
                this._finalizeParts();
                throw e;
            }
            this._hackKnownSkins();
            this._findDefaultPreset();
            var installInfo = this.addonManager.info;
            if (installInfo.isFreshAddonInstall) {
                try {
                    this._switchDefaultPresetAutoComps();
                } catch (e) {
                    this._logger.error('Failed switching default preset \'auto\' components. ' + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
                try {
                    this.overlayProvider.removeWidgetsFromToolbars();
                    this._logger.debug('Fresh install detected. Remove widgets from toolbars.');
                } catch (e) {
                    this._logger.error('Failed remove widgets from toolbars. ' + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
            } else if (installInfo.addonVersionChanged) {
                this._logger.config('Addon version changed. Checking default preset stuff...');
                try {
                    if (!this._usingInternalPreset)
                        this._fixOldPresetIfNeeded();
                    let internalPreset = new this.BarPlatform.Preset(fileutils.xmlDocFromStream(this.addonFS.getStream('$content/presets/' + this._consts.DEF_PRESET_FILE_NAME)));
                    let widgetLibrary = this.widgetLibrary;
                    let currDefPreset = this._defaultPreset;
                    this._introducedWEntries = internalPreset.widgetEntries.filter(function (widgetEntry) {
                        var widgetID = widgetEntry.componentID;
                        return !widgetLibrary.isKnownWidget(widgetID) && !currDefPreset.refsWidget(widgetID);
                    });
                    this._introducedPEntries = internalPreset.pluginEntries.filter(function (pluginEntry) !widgetLibrary.isKnownPlugin(pluginEntry.componentID));
                    if (!this._usingInternalPreset) {
                        if (internalPreset.url == this._defaultPreset.url) {
                            this._logger.config('Replacing existing default preset with internal version...');
                            this._replaceDefaultPresetWith(internalPreset);
                            this._usingInternalPreset = true;
                        } else {
                            let defaultPresetFile = this._barCore.extensionPathFile;
                            ('defaults/presets/' + encodeURIComponent(this._defaultPreset.url)).split('/').forEach(function (s) defaultPresetFile.append(s));
                            if (defaultPresetFile.exists() && defaultPresetFile.isFile()) {
                                let preset = new this.BarPlatform.Preset(fileutils.xmlDocFromFile(defaultPresetFile));
                                this._logger.config('Replacing existing default preset with new version' + ' from defaults/presets/' + this._defaultPreset.url);
                                this._replaceDefaultPresetWith(preset);
                            }
                        }
                    }
                } catch (e) {
                    this._logger.error('Failed in default preset check routines. ' + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
            }
            var normalWidgetIDs = [wID for (wID in this._defaultPreset.widgetIDs)].filter(function (id) {
                    return [
                        'http://bar.yandex.ru/packages/yandexbar#spring',
                        'http://bar.yandex.ru/packages/yandexbar#settings',
                        'http://bar.yandex.ru/packages/yandexbar#separator'
                    ].indexOf(id) === -1;
                });
            this._introducedWEntries.forEach(function (widgetEntry) normalWidgetIDs.push(widgetEntry.componentID));
            this.widgetLibrary.registerWidgets(normalWidgetIDs, true);
            var pluginIDs = [pID for (pID in this._defaultPreset.pluginIDs)];
            this.widgetLibrary.registerPlugins(pluginIDs, true);
            this._introducedPEntries.forEach(function (pluginEntry) {
                var pluginID = pluginEntry.componentID;
                this.widgetLibrary.registerPlugins(pluginID, true);
                if (pluginEntry.enabled != pluginEntry.ENABLED_YES)
                    return;
                try {
                    this.widgetLibrary.getPlugin(pluginID).enable();
                } catch (e) {
                    this._logger.warn('Could not activate introduced plugin ' + pluginID + '. ' + strutils.formatError(e));
                }
            }, this);
            this.widgetLibrary.activatePlugins();
            this.addonStatus.onApplicationInitialized();
            this._logger.config('Init done in ' + (Date.now() - startTime) + 'ms');
        },
        _replaceDefaultPresetWith: function BarApp__replaceDefaultPresetWith(newPreset) {
            this._defaultPreset = newPreset;
            var presetFileName = encodeURIComponent(this._defaultPreset.url);
            var presetFile = this.directories.presetsDir;
            presetFile.append(presetFileName);
            fileutils.removeFileSafe(presetFile);
            this.addonFS.copySource('$content/presets/' + this._consts.DEF_PRESET_FILE_NAME, this.directories.presetsDir, presetFileName, parseInt('0755', 8));
        },
        _fixOldPresetIfNeeded: function BarApp__fixOldPresetIfNeeded() {
            if (sysutils.versionComparator.compare(this._defaultPreset.formatVersion, '2.0') >= 0)
                return;
            try {
                let oldPresetWidgetIDs = this._defaultPreset.widgetIDs;
                this._logger.config('Fixing old default preset...');
                let CompEntryProps = this.BarPlatform.Preset.ComponentEntry.prototype;
                for (let [
                            ,
                            invisWidgetID
                        ] in Iterator(this._PREV_BUILTIN_WIDS)) {
                    if (invisWidgetID in oldPresetWidgetIDs)
                        continue;
                    let entryDescr = {
                            componentType: CompEntryProps.TYPE_WIDGET,
                            componentID: invisWidgetID,
                            enabled: CompEntryProps.ENABLED_NO
                        };
                    this._defaultPreset.appendEntry(entryDescr);
                }
                this._defaultPreset.formatVersion = '2.0';
                let presetFile = this.directories.presetsDir;
                presetFile.append(encodeURIComponent(this._defaultPreset.url));
                this._defaultPreset.saveToFile(presetFile);
            } catch (e) {
                this._logger.fatal('Could not fix default preset. ' + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        },
        _switchDefaultPresetAutoComps: function BarApp__switchDefaultPresetAutoComps() {
            try {
                this._logger.config('Components autoactivation started');
                let componentsActivated = [];
                for (let presetCompEntry in this.autoinstaller.genHistoryRelevantEntries(this.defaultPreset)) {
                    presetCompEntry.enabled = presetCompEntry.ENABLED_YES;
                    componentsActivated.push(presetCompEntry.componentID);
                }
                this._logger.debug('Total ' + componentsActivated.length + ' components activated: ' + componentsActivated);
            } catch (e) {
                this._logger.error('Could not modify default preset. ' + strutils.formatError(e));
                this._logger.debug(e.stack);
            }
            const separatorID = 'http://bar.yandex.ru/packages/yandexbar#separator';
            const searchFieldID = 'http://bar.yandex.ru/packages/yandexbar#search';
            var separatedVisWidgets = 0;
            this._defaultPreset.allEntries.forEach(function (compEntry) {
                if (compEntry.enabled == compEntry.ENABLED_AUTO) {
                    compEntry.enabled = compEntry.ENABLED_NO;
                }
                var entryID = compEntry.componentID;
                var isSearchField = entryID == searchFieldID;
                if (isSearchField || entryID == separatorID) {
                    if (separatedVisWidgets > 0)
                        separatedVisWidgets = 0;
                    else if (!isSearchField)
                        compEntry.enabled = compEntry.ENABLED_NO;
                } else if (compEntry.enabled == compEntry.ENABLED_YES) {
                    separatedVisWidgets++;
                }
            });
            var presetFile = this.directories.presetsDir;
            presetFile.append(encodeURIComponent(this._defaultPreset.url));
            this._defaultPreset.saveToFile(presetFile);
        },
        _loadParts: function BarApp__loadParts() {
            const partsDirPath = this.partsURL;
            let (i = 0, len = this._partNames.length) {
                for (; i < len; i++) {
                    let partDescr = this._partNames[i];
                    let partName = partDescr.name;
                    let partPath = partsDirPath + partDescr.file;
                    this._logger.debug('Loading ' + partName + ' part from ' + partPath);
                    Cu.import(partPath, this._parts);
                    let part = this._parts[partName];
                    if (!part)
                        throw new Error('Part ' + partName + ' not loaded!');
                    sysutils.defineLazyGetter(this, partName, function () part);
                    if (typeof part.init == 'function')
                        part.init(this);
                }
            }
        },
        _finalizeParts: function BarApp__finalizeParts(doCleanup, partsFinalizedCallback) {
            var partNames = this._partNames;
            var asyncFinalizingParts = {};
            var finalizeInProgress = true;
            var callback = function callback() {
                if (finalizeInProgress)
                    return;
                if (typeof partsFinalizedCallback === 'function' && sysutils.isEmptyObject(asyncFinalizingParts))
                    partsFinalizedCallback();
            };
            this._partNames.reverse().forEach(function (part) {
                var partName = part.name;
                var part = this._parts[partName];
                if (part && typeof part.finalize == 'function') {
                    this._logger.debug('Finalizing ' + partName + ' part');
                    try {
                        let finalizeIsAsync = part.finalize(doCleanup, function () {
                                delete asyncFinalizingParts[partName];
                                callback();
                            }.bind(this));
                        if (finalizeIsAsync === true)
                            asyncFinalizingParts[partName] = true;
                    } catch (e) {
                        this._logger.error('Error finalizing part. ' + strutils.formatError(e));
                        this._logger.debug(e.stack);
                    }
                }
                delete this._parts[partName];
                delete this[partName];
            }, this);
            finalizeInProgress = false;
            callback();
        },
        _findDefaultPreset: function BarApp__findDefaultPreset() {
            this._logger.config('Looking for default preset...');
            var defaultPresetUrlPrefPath = this.name + this._consts.PREF_DEFAULT_PRESET_URL;
            var internalPresetPath = '$content/presets/' + this._consts.DEF_PRESET_FILE_NAME;
            var presetFile;
            try {
                let presetUrl = Preferences.get(defaultPresetUrlPrefPath, null);
                if (!presetUrl)
                    throw new Error('Can\'t get default preset preference value.');
                let presetFileName = encodeURIComponent(presetUrl);
                presetFile = this.directories.presetsDir;
                presetFile.append(presetFileName);
                return this._defaultPreset = new this.BarPlatform.Preset(presetFile, presetUrl);
            } catch (e) {
                let presetFilePath = presetFile ? presetFile.path : 'no file';
                this._logger.debug(strutils.formatString('Failed parsing normal default preset (%1).\n %2', [
                    presetFilePath,
                    strutils.formatError(e)
                ]));
                if (presetFile)
                    fileutils.removeFileSafe(presetFile);
                let extPresetFile = this.directories.presetsDir;
                extPresetFile.append(this._consts.DEF_PRESET_FILE_NAME);
                try {
                    let preset = new this.BarPlatform.Preset(extPresetFile);
                    try {
                        extPresetFile.moveTo(null, encodeURIComponent(preset.url));
                        Preferences.set(defaultPresetUrlPrefPath, preset.url);
                    } catch (e) {
                        this._logger.error('Could not set external default preset as active. ' + strutils.formatError(e));
                    }
                    return this._defaultPreset = preset;
                } catch (e) {
                    if (extPresetFile.exists()) {
                        this._logger.debug('Failed parsing external default preset.\n' + strutils.formatError(e));
                        fileutils.removeFileSafe(extPresetFile);
                    }
                    try {
                        let presetDoc = fileutils.xmlDocFromStream(this.addonFS.getStream(internalPresetPath));
                        let preset = new this.BarPlatform.Preset(presetDoc);
                        try {
                            let destFileName = encodeURIComponent(preset.url);
                            let fMask = parseInt('0755', 8);
                            this.addonFS.copySource(internalPresetPath, this.directories.presetsDir, destFileName, fMask);
                            Preferences.set(defaultPresetUrlPrefPath, preset.url);
                        } catch (e) {
                            this._logger.error('Could not extract internal preset.\n' + strutils.formatError(e));
                        }
                        this._usingInternalPreset = true;
                        return this._defaultPreset = preset;
                    } catch (e) {
                        this._logger.fatal('Failed parsing internal default preset.\n' + strutils.formatError(e));
                        this._logger.debug(e.stack);
                    }
                }
            }
            return null;
        },
        _hackKnownSkins: function BarApp__hackKnownSkins() {
            var selectedSkin = Preferences.get('extensions.lastSelectedSkin') || Preferences.get('general.skins.selectedSkin');
            if (!selectedSkin)
                return;
            if (selectedSkin == 'classic/1.0')
                selectedSkin = 'classic';
            var skinPaths = [
                    selectedSkin,
                    sysutils.platformInfo.os.name + '/' + selectedSkin
                ];
            const SS_SERVICE = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
            const USER_SHEET = SS_SERVICE.USER_SHEET;
            skinPaths.forEach(function YS__hackKnownSkins_register(aSkinPath) {
                try {
                    let uri = netutils.newURI('chrome://' + this.name + '/skin/hacks/themes/' + aSkinPath + '.css');
                    if (!SS_SERVICE.sheetRegistered(uri, USER_SHEET))
                        SS_SERVICE.loadAndRegisterSheet(uri, USER_SHEET);
                } catch (e) {
                    if (!('result' in e && e.result === Components.results.NS_ERROR_FILE_NOT_FOUND))
                        this._logger.debug('Error while loading css for \'' + aSkinPath + '\' skin. ' + e);
                }
            }, this);
        },
        _cleanupPreferences: function BarApp__clearPreferences() {
            var currentSetData = this.overlayProvider.currentSetIds;
            if (sysutils.isEmptyObject(currentSetData))
                return;
            var settingKeyPattern = /^(.+#.+)\.(\d+)\..+$/;
            function checkBranch(prefBranch) {
                prefBranch.getChildList('', {}).forEach(function (key) {
                    var keyMatch = key.match(settingKeyPattern);
                    if (!keyMatch)
                        return;
                    var prefProtoID = keyMatch[1];
                    var prefInstID = keyMatch[2];
                    var instArray = currentSetData[prefProtoID];
                    if (!instArray) {
                        prefBranch.deleteBranch(prefProtoID);
                    } else {
                        if (instArray.indexOf(prefInstID) < 0) {
                            let settingKey = prefProtoID + '.' + prefInstID;
                            prefBranch.deleteBranch(settingKey);
                        }
                    }
                });
            }
            checkBranch(Services.prefs.getBranch(this._barCore.xbWidgetsPrefsPath));
            checkBranch(Services.prefs.getBranch(this._barCore.nativesPrefsPath));
        },
        _openWindow: function BarApp__openWindow(navigatorWindow, path, windowClass, focusIfOpened, resizeable, modal, windowArgs) {
            var baseNameMatch = path.match(/(\w+)\.x[um]l$/i);
            windowClass = windowClass || (this.name + baseNameMatch ? ':' + baseNameMatch[1] : '');
            if (focusIfOpened) {
                let chromeWindow = misc.getTopWindowOfType(windowClass);
                if (chromeWindow) {
                    chromeWindow.focus();
                    return chromeWindow;
                }
            }
            var features = [
                    'chrome',
                    'titlebar',
                    'toolbar',
                    'centerscreen',
                    modal ? 'modal' : 'dialog=no'
                ];
            if (resizeable)
                features.push('resizable');
            var ownerWindow = navigatorWindow || misc.getTopBrowserWindow();
            var openParams = [
                    path,
                    windowClass,
                    features.join()
                ].concat(windowArgs);
            return ownerWindow.openDialog.apply(ownerWindow, openParams);
        }
    };
