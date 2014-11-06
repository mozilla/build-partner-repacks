"use strict";
const EXPORTED_SYMBOLS = ["BarPlatform"];
const PLATFORM_SCRIPTS = [
    "preset.js",
    "manifest.js",
    "preset-with-manifest.js",
    "package.js",
    "unit.js",
    "cachedres.js"
];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
let barApp;
const BarPlatform = {
    init: function BarPlatform_init(barApplication) {
        barApp = this._application = barApplication;
        barApplication.core.Lib.sysutils.copyProperties(barApplication.core.Lib, GLOBAL);
        this._loggersRoot = barApplication.name + ".CP";
        this._logger = Log4Moz.repository.getLogger(this._loggersRoot);
        this._loadModules();
        this.CachedResources.init();
    },
    finalize: function BarPlatform_finalize(doCleanup, callback) {
        this._parsers = null;
        this._logger = null;
        return this.CachedResources.finalize(doCleanup, callback);
    },
    registerUnitParser: function BarPlatform_registerUnitParser(platformType, componentType, parser) {
        let parserKey = platformType + "#" + componentType;
        if (!parser) {
            delete this._parsers[parserKey];
        } else {
            this._parsers[parserKey] = parser;
        }
    },
    findPlatformMatch: function BarPlatform_findPlatformMatch(items) {
        if (!Array.isArray(items)) {
            throw new CustomErrors.EArgRange("items", "Array", items);
        }
        let platformInfo = sysutils.platformInfo;
        for (let i = 0, len = items.length; i < len; i++) {
            let item = items[i];
            if ("os" in item && item.os != platformInfo.os.name || "browser" in item && item.browser != platformInfo.browser.name || "architecture" in item && item.architecture != platformInfo.browser.simpleArchitecture) {
                continue;
            }
            return item;
        }
        return null;
    },
    findBestLocalizedElement: function BarPlatform_findBestLocalizedElement(elementsArray) {
        let localizedElements = Object.create(null);
        elementsArray.forEach(function (element) {
            let elemLocaleStr = element.getAttribute("locale") || element.getAttribute("lang") || "";
            localizedElements[elemLocaleStr] = element;
        });
        return misc.findBestLocalizedValue(localizedElements, this._application.locale);
    },
    parseComponentID: function BarPlatform_parseComponentID(componentID) {
        if (typeof componentID != "string") {
            throw new CustomErrors.EArgType("componentID", "string", componentID);
        }
        let separatorPos = componentID.indexOf("#");
        let packageID = componentID.substring(0, separatorPos);
        if (!packageID) {
            throw new Error(this._consts.ERR_INVALID_COMP_ID + componentID);
        }
        let compName = componentID.substring(separatorPos + 1);
        if (!compName) {
            throw new Error(this._consts.ERR_INVALID_COMP_ID + componentID);
        }
        return [
            packageID,
            compName
        ];
    },
    getNewWidgetInstanceID: function BarPlatform_getNewWidgetInstanceID() {
        return String(Date.now()) + String(this._newWID++);
    },
    parsePrefPath: function BarPlatform_parsePrefPath(prefPath, compID) {
        let appCore = this._application.core;
        let [
            packageID,
            compName
        ] = this.parseComponentID(compID);
        let partsRE = new RegExp(strutils.escapeRE(appCore.nativesPrefsPath + packageID) + "(#(.+)\\.(\\w+))?\\.settings\\.(.+)");
        let partsMatch = prefPath.match(partsRE);
        if (!partsMatch) {
            throw new Error("Invalid prefPath");
        }
        let isPackagePref = !partsMatch[1];
        let scope = partsMatch[3];
        let isInstancePref = !isPackagePref && scope != "all";
        let settingName = partsMatch[4];
        let prefProps = {
            settingName: settingName,
            isPackagePref: isPackagePref,
            isComponentPref: !(isPackagePref || isInstancePref),
            isInstancePref: isInstancePref,
            instanceID: isInstancePref ? scope : undefined
        };
        return prefProps;
    },
    eraseSettings: function BarPlatform_eraseSettings() {
        let barCore = this._application.core;
        Services.obs.notifyObservers(null, barCore.eventTopics.EVT_BEFORE_GLOBAL_RESET, null);
        try {
            Preferences.resetBranch(barCore.xbWidgetsPrefsPath);
            Preferences.resetBranch(barCore.nativesPrefsPath);
            fileutils.removeFileSafe(this._application.directories.nativeStorageDir);
        } finally {
            Services.obs.notifyObservers(null, barCore.eventTopics.EVT_AFTER_GLOBAL_RESET, null);
        }
    },
    makeCompLoggerName: function BarPlatform__makeCompLoggerName(unit) {
        return unit.componentInfo.name.replace(/[\s.]/g, "_");
    },
    navigateBrowser: function BarPlatform_navigateBrowser(aNavigateData) {
        if (typeof aNavigateData != "object") {
            throw new Error("Navigation data object required.");
        }
        if (!aNavigateData.target && barApp.openLinksInNewTab) {
            let sourceWindow = aNavigateData.sourceWindow || misc.getTopBrowserWindow();
            let currentBrowserURL;
            try {
                currentBrowserURL = sourceWindow.gBrowser.currentURI.spec;
            } catch (e) {
            }
            let blankURLs = [
                "about:newtab",
                "about:home",
                "about:blank",
                "yafd:tabs"
            ];
            let isBlankURL = blankURLs.indexOf(currentBrowserURL) > -1;
            aNavigateData.target = isBlankURL ? "current tab" : "new tab";
        }
        let eventInfo = aNavigateData.eventInfo;
        if (eventInfo) {
            if (eventInfo instanceof Ci.nsIDOMEvent) {
                if (eventInfo.ctrlKey || eventInfo.metaKey || eventInfo.button == 1) {
                    aNavigateData.target = "new tab";
                } else if (eventInfo.shiftKey) {
                    aNavigateData.target = "new window";
                }
            } else {
                if (eventInfo.keys.ctrl || eventInfo.keys.meta || eventInfo.mouse.button == 1) {
                    aNavigateData.target = "new tab";
                } else if (eventInfo.keys.shift) {
                    aNavigateData.target = "new window";
                }
            }
        }
        let url = aNavigateData.url || aNavigateData.unsafeURL;
        let uri = misc.tryCreateFixupURI(url);
        if (!uri) {
            throw new CustomErrors.EArgRange("url", "URL", url);
        }
        url = aNavigateData.url = uri.spec;
        if (!("url" in aNavigateData) && "unsafeURL" in aNavigateData) {
            if (!/^(http|ftp)s?$/.test(uri.scheme)) {
                throw new CustomErrors.ESecurityViolation("BarPlatform.navigateBrowser", "URL=" + url);
            }
            delete aNavigateData.unsafeURL;
        }
        if (aNavigateData.target === "new popup") {
            this.openPopupBrowser(aNavigateData);
        } else {
            let win = misc.navigateBrowser(aNavigateData);
            if (win) {
                win.focus();
            }
        }
    },
    openPopupBrowser: function BarPlatform_openPopupBrowser(aNavigateData) {
        const popupChromeURL = "chrome://" + barApp.name + "/content/dialogs/popup_browser/popup_browser.xul";
        let windowProperties = aNavigateData.windowProperties || {};
        let wndWidth = Math.max(parseInt(windowProperties.width, 10) || 300, 50);
        let wndHeight = Math.max(parseInt(windowProperties.height, 10) || 300, 50);
        let winFeatures = "chrome,all,dialog=no,resizable,centerscreen,width=" + wndWidth + ",height=" + wndHeight;
        let args = {
            url: aNavigateData.url,
            title: "title" in windowProperties ? windowProperties.title : null,
            postData: aNavigateData.postData || null,
            referrer: aNavigateData.referrer || null
        };
        args.wrappedJSObject = args;
        let sourceWindow = aNavigateData.sourceWindow || misc.getTopBrowserWindow();
        if (sourceWindow) {
            sourceWindow.openDialog(popupChromeURL, null, winFeatures, args);
        } else {
            Services.ww.openWindow(null, popupChromeURL, null, winFeatures, args);
        }
    },
    _parsers: {},
    _application: null,
    _loggersRoot: undefined,
    _logger: null,
    _newWID: 0,
    _consts: { ERR_INVALID_COMP_ID: "Invalid component ID " },
    _loadModules: function BarPlatform__loadModules() {
        const xbDirPath = this._application.partsURL + "platform/";
        const SCRIPT_LOADER = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
        PLATFORM_SCRIPTS.forEach(function BarPlatform_loadModule(scriptFileName) {
            this._logger.debug("  Including script " + scriptFileName);
            SCRIPT_LOADER.loadSubScript(xbDirPath + scriptFileName);
        }, this);
    },
    _getLogger: function BarPlatform__getLogger(name) {
        return Log4Moz.repository.getLogger(this._loggersRoot + "." + name);
    },
    _getParser: function BarPlatform__getParser(platformType, componentType) {
        let parser = this._parsers[platformType + "#" + componentType];
        if (!parser) {
            throw new Error(strutils.formatString("No \"%2\" parser registered for API \"%1\".", [
                platformType,
                componentType
            ]));
        }
        return parser;
    }
};
BarPlatform.__defineGetter__("IWidgetPrototype", function () {
    let intf = new sysutils.Interface("IWidgetPrototype", [
        "createInstance",
        "finalize"
    ], {
        id: "string",
        name: "string",
        isUnique: "boolean",
        unit: BarPlatform.Unit,
        pkg: BarPlatform.ComponentPackage,
        iconPath: "string",
        iconURI: "string",
        spawnedIDs: undefined,
        widgetSettings: undefined,
        packageSettings: undefined
    });
    delete BarPlatform.IWidgetPrototype;
    BarPlatform.__defineGetter__("IWidgetPrototype", function () {
        return intf;
    });
    return BarPlatform.IWidgetPrototype;
});
BarPlatform.__defineGetter__("IWidgetInstance", function () {
    let intf = new sysutils.Interface("IWidgetInstance", [
        "buildUI",
        "getSettingValue",
        "applySetting",
        "applySettings",
        "eraseSettings",
        "finalize"
    ], {
        id: "string",
        prototype: BarPlatform.IWidgetPrototype,
        host: "object",
        uiElement: undefined,
        instanceSettings: undefined
    });
    delete BarPlatform.IWidgetInstance;
    BarPlatform.__defineGetter__("IWidgetInstance", function () {
        return intf;
    });
    return BarPlatform.IWidgetInstance;
});
