"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const EXT_ID = "yasearch@yandex.ru";
const PERMS_FILE = parseInt("0644", 8);
const PERMS_DIRECTORY = parseInt("0755", 8);
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
this.__defineGetter__("AddonManager", function addonManagerGetter() {
    delete this.AddonManager;
    Cu.import("resource://yasearch-mod/AddonManager.jsm", this);
    return this.AddonManager;
});
var gYaInstaller = {
    __installed: true,
    APP_ACTION_QUIT_TOPIC: "quit-application",
    startup: function YaInstaller_startup() {
        Services.obs.addObserver(this, this.APP_ACTION_QUIT_TOPIC, false);
        AddonManager.addAddonListener(this);
    },
    shutdown: function YaInstaller_shutdown() {
        AddonManager.removeAddonListener(this);
        Services.obs.removeObserver(this, this.APP_ACTION_QUIT_TOPIC);
        if (this.__installed === false) {
            this._proccessUninstall();
        }
    },
    onAddonEvent: function YaInstaller_onAddonEvent(aEventType, aAddon, aPendingRestart) {
        if (aAddon.id === EXT_ID) {
            this.__installed = aEventType !== "onUninstalling";
        }
    },
    observe: function YaInstaller_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case this.APP_ACTION_QUIT_TOPIC:
            this.shutdown();
            break;
        default:
            break;
        }
    },
    _proccessUninstall: function YaInstaller__proccessUninstall() {
        function resetPref(aPrefName) {
            try {
                Services.prefs.clearUserPref(aPrefName);
            } catch (e) {
            }
        }
        function removeFile(aFile) {
            if (!(aFile instanceof Ci.nsIFile)) {
                throw new Error("nsYaSearch.removeFile: not nsIFile.");
            }
            if (!aFile.exists()) {
                return true;
            }
            if (!aFile.isFile() && !aFile.isDirectory()) {
                throw new Error("nsYaSearch.removeFile: not a file or directory.");
            }
            try {
                aFile.remove(true);
                return true;
            } catch (e) {
            }
            let tmpDir = Services.dirsvc.get("TmpD", Ci.nsIFile);
            let tmpFile = tmpDir.clone();
            tmpFile.append(aFile.leafName);
            if (aFile.isFile()) {
                tmpFile.createUnique(tmpFile.NORMAL_FILE_TYPE, PERMS_FILE);
            } else {
                tmpFile.createUnique(tmpFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
            }
            aFile.moveTo(tmpDir, tmpFile.leafName);
            return true;
        }
        resetPref("yasearch.general.lastVersion");
        resetPref("yasearch.license.accepted");
        resetPref("yasearch.welcomepage.version.introduced");
        resetPref("yasearch.guid.clids.creationDate");
        resetPref("yasearch.general.stt");
        resetPref("yasearch.general.app.bar.type");
        let asyncModule = gYaSearchService.customBarApp.core.Lib.async;
        let yandexDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        yandexDir.append("yandex");
        if (yandexDir.exists()) {
            [
                "cities.data.xml",
                "regions.data.xml",
                "services.mybar.xml",
                "maps.data.xml",
                "services.data.xml",
                "ftab.data.xml",
                "yasearch-storage.sqlite",
                "bar-logo.ico",
                "ftab-data",
                "users.sqlite"
            ].forEach(function (aFileOrDirectoryName) {
                let fileToRemove = yandexDir.clone();
                fileToRemove.append(aFileOrDirectoryName);
                try {
                    asyncModule.nextTick(function () {
                        removeFile(fileToRemove);
                    });
                } catch (e) {
                    Cu.reportError(e);
                }
            });
            asyncModule.nextTick(function () {
                if (!yandexDir.directoryEntries.hasMoreElements()) {
                    try {
                        removeFile(yandexDir);
                    } catch (e) {
                        Cu.reportError(e);
                    }
                }
            });
        }
    }
};
function nsIYaSearch() {
    this.version = "201502040600";
    this.wrappedJSObject = this;
    this._inited = false;
}
nsIYaSearch.prototype = {
    log: function (msg) {
    },
    get customBarApp() {
        return this._customBarApp || (this._customBarApp = Cc["@yandex.ru/custombarcore;yasearch"].getService().wrappedJSObject.application);
    },
    get barnavigR1String() {
        return this.customBarApp.barnavig.barnavigR1String;
    },
    set barnavigR1String(aR1String) {
        this.customBarApp.barnavig.barnavigR1String = aR1String || "";
    },
    get initialized() {
        return this._inited;
    },
    init: function () {
        if (this.initialized) {
            return;
        }
        if (!this.customBarApp) {
            Services.obs.addObserver(this, "yasearch-state-changed", false);
            return;
        }
        Services.obs.addObserver(this, "profile-before-change", true);
        try {
            gYaInstaller.startup();
        } catch (e) {
            Cu.reportError(e);
            Cu.reportError("Error running gYaInstaller startup");
        }
        this._inited = true;
        Services.obs.notifyObservers(null, "yasearch-state-changed", "initialized");
    },
    uninit: function () {
        if (!this._inited) {
            return;
        }
        this._inited = false;
        Services.obs.notifyObservers(null, "yasearch-state-changed", "before-finalized");
        Services.obs.notifyObservers(null, "yasearch-state-changed", "finalized");
    },
    observe: function (aSubject, aTopic, aData) {
        switch (aTopic) {
        case "yasearch-state-changed":
            switch (aData) {
            case "custombar-initialized":
                this.init();
                break;
            }
            break;
        case "profile-after-change":
            this.init();
            break;
        case "profile-before-change":
            this.uninit();
            break;
        case "app-startup":
            Services.obs.addObserver(this, "profile-after-change", true);
            break;
        }
    },
    classDescription: "nsYaSearch JS component",
    contractID: "@yandex.ru/yasearch;1",
    classID: Components.ID("{3F79261A-508E-47a3-B61C-D1F29E2068F3}"),
    _xpcom_categories: [{
            category: "app-startup",
            service: true
        }],
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIYaSearch,
        Ci.nsIObserver,
        Ci.nsISupportsWeakReference
    ])
};
var NSGetFactory = XPCOMUtils.generateNSGetFactory([nsIYaSearch]);
this.__defineGetter__("gYaSearchService", function gYaSearchServiceGetter() {
    delete this.gYaSearchService;
    return this.gYaSearchService = Cc["@yandex.ru/yasearch;1"].getService(Ci.nsIYaSearch).wrappedJSObject;
});
