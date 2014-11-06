"use strict";
const EXPORTED_SYMBOLS = ["application"];
const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils, GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const application = {
    init: function VBApp_init(core) {
        this._barCore = core;
        core.Lib.sysutils.copyProperties(core.Lib, GLOBAL);
        this._logger = Log4Moz.repository.getLogger(core.appName + ".App");
        this._dirs._barApp = this;
        this._init();
        this.addonManager.saveBuildDataToPreferences();
    },
    finalize: function VBApp_finalize(callback) {
        let doFinalCleanup = this.addonManager.isAddonUninstalling;
        let addonId = this.addonManager.addonId;
        let partsFinalizedCallback = function partsFinalizedCallback() {
            this._logger.debug("Finalize process finished.");
            if (doFinalCleanup) {
                this._finalCleanup(addonId);
            }
            this._logger = null;
            this._barCore = null;
            callback();
        }.bind(this);
        this._finalizeParts(doFinalCleanup, partsFinalizedCallback);
    },
    get core() {
        return this._barCore;
    },
    get name() {
        return this._barCore.appName;
    },
    get preferencesBranch() {
        let appPrefsBranch = "extensions." + this.addonManager.addonId + ".";
        delete this.preferencesBranch;
        this.__defineGetter__("preferencesBranch", () => appPrefsBranch);
        return appPrefsBranch;
    },
    get preferences() {
        let appPrefs = new Preferences(this.preferencesBranch);
        delete this.preferences;
        this.__defineGetter__("preferences", () => appPrefs);
        return appPrefs;
    },
    generateDelay: function VBApp_generateDelay() {
        if (!this._delayMultiplier)
            this._delayMultiplier = this.preferences.get("debug.delayMultiplier", 60);
        this._lastGeneratedDelay += this._delayMultiplier;
        return this._lastGeneratedDelay;
    },
    getLogger: function VBApp_getLogger(name) {
        return Log4Moz.repository.getLogger(this.name + "." + name);
    },
    get localeString() {
        if (!this._localeString) {
            let xulChromeReg = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry);
            try {
                this._localeString = xulChromeReg.getSelectedLocale(this.name);
            } catch (ex) {
                this._localeString = xulChromeReg.getSelectedLocale("global");
            }
        }
        return this._localeString || "ru";
    },
    get locale() {
        if (!this._locale)
            this._locale = misc.parseLocale(this.localeString);
        return this._locale;
    },
    get soundsEnabled() {
        return this.preferences.get("sounds.enabled", true);
    },
    get directories() {
        return this._dirs;
    },
    get partsURL() {
        return "resource://" + this.name + "-app/parts/";
    },
    navigate: function VBApp_navigate(aNavigateData) {
        if (typeof aNavigateData != "object")
            throw new Error("Object required.");
        let url;
        let unsafe = false;
        if ("url" in aNavigateData) {
            url = aNavigateData.url;
        } else if ("unsafeURL" in aNavigateData) {
            url = aNavigateData.unsafeURL;
            unsafe = true;
        }
        if (!url)
            return false;
        let uri = misc.tryCreateFixupURI(url);
        if (!uri)
            throw new CustomErrors.EArgRange("url", "URL", url);
        if (unsafe && !/^(http|ftp)s?$/.test(uri.scheme))
            throw new CustomErrors.ESecurityViolation("application.navigate", "URL=" + url);
        url = uri.spec;
        let target = "target" in aNavigateData ? aNavigateData.target : null;
        if (!target) {
            let eventInfo = "eventInfo" in aNavigateData ? aNavigateData.eventInfo : null;
            if (eventInfo) {
                if (eventInfo instanceof Ci.nsIDOMEvent) {
                    if (eventInfo.ctrlKey || eventInfo.metaKey || eventInfo.button == 1)
                        target = "new tab";
                    else if (eventInfo.shiftKey)
                        target = "new window";
                } else {
                    if (eventInfo.keys.ctrl || eventInfo.keys.meta || eventInfo.mouse.button == 1)
                        target = "new tab";
                    else if (eventInfo.keys.shift)
                        target = "new window";
                }
            }
        }
        let postData = "postData" in aNavigateData ? aNavigateData.postData : null;
        let referrer = "referrer" in aNavigateData ? aNavigateData.referrer : null;
        let sourceWindow = "sourceWindow" in aNavigateData ? aNavigateData.sourceWindow : null;
        if (!sourceWindow && target != "new popup") {
            sourceWindow = misc.getTopBrowserWindow();
            if (!sourceWindow) {
                let sa = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
                let wuri = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
                wuri.data = url;
                let allowThirdPartyFixupSupports = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
                allowThirdPartyFixupSupports.data = false;
                sa.AppendElement(wuri);
                sa.AppendElement(null);
                sa.AppendElement(referrer);
                sa.AppendElement(postData);
                sa.AppendElement(allowThirdPartyFixupSupports);
                let windowWatcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
                windowWatcher.openWindow(null, "chrome://browser/content/browser.xul", null, "chrome,dialog=no,all", sa);
                return true;
            }
        }
        switch (target) {
        case "new tab":
            sourceWindow.gBrowser.loadOneTab(url, referrer, null, postData, false);
            break;
        case "new window":
            sourceWindow.openNewWindowWith(url, null, postData, false, referrer);
            break;
        case "new popup": {
                let windowProperties = "windowProperties" in aNavigateData ? aNavigateData.windowProperties : {};
                let title = "title" in windowProperties ? windowProperties.title : null;
                let wndWidth = Math.max(parseInt(windowProperties.width, 10) || 300, 50);
                let wndHeight = Math.max(parseInt(windowProperties.height, 10) || 300, 50);
                let winFeatures = "chrome,all,dialog=no,resizable,centerscreen,width=" + wndWidth + ",height=" + wndHeight;
                let args = {
                    url: url,
                    title: title,
                    postData: postData,
                    referrer: referrer
                };
                args.wrappedJSObject = args;
                let popupChromeURL = "chrome://" + this.name + "/content/dialogs/popup_browser/popup_browser.xul";
                if (sourceWindow) {
                    sourceWindow.openDialog(popupChromeURL, null, winFeatures, args);
                } else {
                    let windowWatcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
                    windowWatcher.openWindow(null, popupChromeURL, null, winFeatures, args);
                }
                break;
            }
        default:
            sourceWindow.gBrowser.loadURI(url, referrer, postData, false);
            break;
        }
        return true;
    },
    isYandexHost: function VBApp_isYandexHost(hostName) {
        return /(^|\.)(yandex\.(ru|ua|by|kz|net|com(\.tr)?)|(ya|narod|moikrug)\.ru)$/i.test(hostName);
    },
    isYandexURL: function VBApp_isYandexURL(url) {
        try {
            let uri = Services.io.newURI(url, null, null);
            return this.isYandexHost(uri.host);
        } catch (e) {
            return false;
        }
    },
    getHostAliases: function VBApp_getHostAliases(searchingHost) {
        let xmlDoc;
        try {
            xmlDoc = this.branding.brandPackage.getXMLDocument("fastdial/domaingroups.xml");
        } catch (err) {
        }
        if (!xmlDoc)
            return [];
        let matchedDomainGroupName;
        let domainGroups = Object.create(null);
        Array.forEach(xmlDoc.querySelectorAll("domain"), function (domainNode) {
            let domainGroupName = domainNode.parentNode.getAttribute("name");
            let domain = domainNode.textContent;
            if (searchingHost === domain)
                matchedDomainGroupName = domainGroupName;
            domainGroups[domainGroupName] = domainGroups[domainGroupName] || [];
            domainGroups[domainGroupName].push(domain);
        });
        if (matchedDomainGroupName)
            return domainGroups[matchedDomainGroupName];
        return [];
    },
    _consts: {
        DOWNLOAD_HOST_NAME: "download.yandex.ru",
        BARQA_HOST_NAME: "bar.qa.yandex.net",
        BAR_HOSTS: {
            "bar.yandex.ru": 0,
            "toolbar.yandex.ru": 0
        }
    },
    _barCore: null,
    _barless: null,
    _logger: null,
    _localeString: null,
    _dirs: {
        get appRootDir() {
            if (!this._appRoot) {
                this._appRoot = this._barApp.core.rootDir;
            }
            let dirFile = this._appRoot.clone();
            this._forceDir(dirFile);
            return dirFile;
        },
        get vendorDir() {
            let vendorDir = this.appRootDir;
            vendorDir.append("vendor");
            this._forceDir(vendorDir);
            return vendorDir;
        },
        get vbDataDir() {
            let vbDataDir = this.appRootDir;
            vbDataDir.append("ftab-data");
            this._forceDir(vbDataDir);
            return vbDataDir;
        },
        get vbShotsDir() {
            let shotsDir = this.vbDataDir;
            shotsDir.append("shots");
            this._forceDir(shotsDir);
            return shotsDir;
        },
        get userDir() {
            let isWindowsOS = sysutils.platformInfo.os.name == "windows";
            let userDir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get(isWindowsOS ? "AppData" : "Home", Ci.nsIFile);
            userDir.append(isWindowsOS ? "Yandex" : ".yandex");
            this.__defineGetter__("userDir", function _userDir() {
                this._forceDir(userDir);
                return userDir.clone();
            }.bind(this));
            return this.userDir;
        },
        makePackageDirName: function VBApp_makePackageDirName() {
            return this._uuidGen.generateUUID().toString();
        },
        _barApp: null,
        _uuidGen: Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator),
        _forceDir: function BarAppDirs_forceDir(dirFile, perm) {
            fileutils.forceDirectories(dirFile, perm);
        }
    },
    _finalCleanup: function VBApp__finalCleanup(aAddonId) {
        this._logger.debug("Cleanup...");
        [
            this.preferencesBranch,
            "yandex-vb."
        ].forEach(function (prefBranch) {
            try {
                Preferences.resetBranch(prefBranch);
            } catch (e) {
                this._logger.error("Final cleanup: can't reset branch '" + prefBranch + "'. " + strutils.formatError(e));
            }
        }, this);
        this._logger.debug("Removing all files");
        this._barCore.cleanup();
        fileutils.removeFileSafe(this.directories.appRootDir);
    },
    _init: function VBApp__init() {
        this._logger.config(strutils.formatString("Initializing '%1' application: r%2 dated %3", [
            this.name,
            this._barCore.buidRevision,
            this._barCore.buildDate
        ]));
        try {
            this._loadParts();
        } catch (e) {
            this._finalizeParts();
            throw e;
        }
        let resource = netutils.ioService.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
        let alias = netutils.ioService.newFileURI(this.core.rootDir);
        resource.setSubstitution("vb-profile-data", alias);
        let disableBarnavigIfYBarIsActive = function (aBarAddon) {
            if (!aBarAddon || !aBarAddon.isActive)
                return;
            try {
                let barAppBarNavig = Cc["@yandex.ru/custombarcore;yasearch"].getService().wrappedJSObject.application.barnavig;
                if (barAppBarNavig.alwaysSendUsageStat === false)
                    return;
            } catch (e) {
            }
            this._logger.config("Yandex.Bar is active. Will turn off barnavig events (page load, downloads, etc.) listening...");
            this.barnavig.listenStatEventsEnabled = false;
        }.bind(this);
        AddonManager.gre_AddonManager.getAddonByID("yasearch@yandex.ru", disableBarnavigIfYBarIsActive);
        this.addonStatus.onApplicationInitialized();
    },
    _loadParts: function VBApp__loadParts() {
        const partsDirPath = this.partsURL;
        for (let i = 0, len = this._partNames.length; i < len; i++) {
            let partDescr = this._partNames[i];
            let partName = partDescr.name;
            let partPath = partsDirPath + partDescr.file;
            this._logger.debug("Loading " + partName + " part from " + partPath + "...");
            Cu.import(partPath, this._parts);
            let part = this._parts[partName];
            if (!part)
                throw new Error("Part " + partName + " not loaded!");
            sysutils.defineLazyGetter(this, partName, () => part);
            if (typeof part.init == "function") {
                this._logger.trace("Part " + partName + " start init...");
                part.init(this);
                this._logger.trace("Part " + partName + " inited!");
            }
        }
    },
    _finalizeParts: function VBApp__finalizeParts(doCleanup, partsFinalizedCallback) {
        let partNames = this._partNames;
        let asyncFinalizingParts = {};
        let finalizeInProgress = true;
        let callback = function callback() {
            if (finalizeInProgress)
                return;
            if (typeof partsFinalizedCallback === "function" && sysutils.isEmptyObject(asyncFinalizingParts))
                partsFinalizedCallback();
        };
        this._partNames.reverse().forEach(function (part) {
            let partName = part.name;
            let loadedPart = this._parts[partName];
            if (loadedPart && typeof loadedPart.finalize == "function") {
                this._logger.debug("Finalizing " + partName + " part");
                try {
                    let finalizeIsAsync = loadedPart.finalize(doCleanup, function () {
                        delete asyncFinalizingParts[partName];
                        callback();
                    }.bind(this));
                    if (finalizeIsAsync === true)
                        asyncFinalizingParts[partName] = true;
                } catch (e) {
                    this._logger.error("Error finalizing part. " + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
            }
            delete this._parts[partName];
            delete this[partName];
        }, this);
        finalizeInProgress = false;
        callback();
    },
    _openWindow: function VBApp__openWindow(navigatorWindow, path, windowClass, focusIfOpened, resizeable, modal, windowArgs) {
        let baseNameMatch = path.match(/(\w+)\.x[um]l$/i);
        windowClass = windowClass || (this.name + baseNameMatch ? ":" + baseNameMatch[1] : "");
        if (focusIfOpened) {
            let chromeWindow = misc.getTopWindowOfType(windowClass);
            if (chromeWindow) {
                chromeWindow.focus();
                return chromeWindow;
            }
        }
        let features = [
            "chrome",
            "titlebar",
            "toolbar",
            "centerscreen",
            modal ? "modal" : "dialog=no"
        ];
        if (resizeable)
            features.push("resizable");
        let ownerWindow = navigatorWindow || misc.getTopBrowserWindow();
        let openParams = [
            path,
            windowClass,
            features.join()
        ].concat(windowArgs);
        return ownerWindow.openDialog.apply(ownerWindow, openParams);
    },
    _parts: {},
    _partNames: [
        {
            name: "addonManager",
            file: "addonmgr.js"
        },
        {
            name: "addonFS",
            file: "addonfs.js"
        },
        {
            name: "appStrings",
            file: "strbundle.js"
        },
        {
            name: "FilePackage",
            file: "package.js"
        },
        {
            name: "alarms",
            file: "alarms.js"
        },
        {
            name: "frontendHelper",
            file: "frontendHelper.js"
        },
        {
            name: "internalStructure",
            file: "internalStructure.js"
        },
        {
            name: "clids",
            file: "clids.js"
        },
        {
            name: "branding",
            file: "branding.js"
        },
        {
            name: "brandingPlus",
            file: "dataprovider.js"
        },
        {
            name: "addonStatus",
            file: "addonStatus.js"
        },
        {
            name: "installer",
            file: "installer.js"
        },
        {
            name: "statistics",
            file: "statistics.js"
        },
        {
            name: "yCookie",
            file: "ycookie.js"
        },
        {
            name: "integration",
            file: "integration.js"
        },
        {
            name: "aboutSupport",
            file: "aboutSupport.js"
        },
        {
            name: "barnavig",
            file: "barnavig.js"
        },
        {
            name: "metrika",
            file: "metrika.js"
        },
        {
            name: "databaseMigration",
            file: "databaseMigration.js"
        },
        {
            name: "migration",
            file: "migration.js"
        },
        {
            name: "authAdapter",
            file: "authAdapter.js"
        },
        {
            name: "auth",
            file: "auth.js"
        },
        {
            name: "commonUtils",
            file: "common-utils.js"
        },
        {
            name: "backgroundImages",
            file: "backgroundImages.js"
        },
        {
            name: "commonAdvertisement",
            file: "common-advertisement.js"
        },
        {
            name: "advertisement",
            file: "advertisement.js"
        },
        {
            name: "blacklist",
            file: "blacklist.js"
        },
        {
            name: "usageHistory",
            file: "usageHistory.js"
        },
        {
            name: "protocolSupport",
            file: "protocolSupport.js"
        },
        {
            name: "layout",
            file: "layout.js"
        },
        {
            name: "syncTopHistory",
            file: "syncTopHistory.js"
        },
        {
            name: "syncPinned",
            file: "syncPinned.js"
        },
        {
            name: "sync",
            file: "sync.js"
        },
        {
            name: "safebrowsing",
            file: "safebrowsing.js"
        },
        {
            name: "colors",
            file: "colors.js"
        },
        {
            name: "bookmarks",
            file: "bookmarks.js"
        },
        {
            name: "cloudSource",
            file: "cloudsource.js"
        },
        {
            name: "favicons",
            file: "favicons.js"
        },
        {
            name: "searchSuggest",
            file: "searchSuggest.js"
        },
        {
            name: "screenshots",
            file: "screenshots.js"
        },
        {
            name: "screenshotsGrabber",
            file: "screenshotsGrabber.js"
        },
        {
            name: "thumbsSuggest",
            file: "thumbsSuggest.js"
        },
        {
            name: "fastdial",
            file: "fastdial.js"
        },
        {
            name: "thumbs",
            file: "thumbs.js"
        },
        {
            name: "searchExample",
            file: "searchExample.js"
        },
        {
            name: "backup",
            file: "backup.js"
        },
        {
            name: "dayuse",
            file: "dayuse.js"
        }
    ],
    _delayMultiplier: 0,
    _lastGeneratedDelay: 0
};
