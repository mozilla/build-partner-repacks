"use strict";
(function (global) {
    const {
        classes: Cc,
        interfaces: Ci,
        results: Cr,
        utils: Cu
    } = Components;
    Cu.import("resource://gre/modules/Services.jsm");
    Cu.import("resource://gre/modules/AddonManager.jsm");
    const EXTENSION_PREFS_WHITELIST = [
        "extensions." + appCore.application.addonManager.addonId + ".",
        appCore.appName + "."
    ];
    const BROWSER_PREFS_WHITELIST = [
        "browser.display.",
        "browser.fixup.",
        "browser.history_expire_",
        "browser.link.open_newwindow",
        "browser.places.",
        "browser.privatebrowsing.",
        "browser.search.",
        "browser.sessionstore.",
        "browser.startup.homepage",
        "browser.tabs.",
        "browser.urlbar.",
        "browser.zoom.",
        "dom.",
        "extensions.checkCompatibility",
        "extensions.lastAppVersion",
        "general.useragent.",
        "javascript.",
        "keyword.",
        "network.",
        "places.",
        "plugin.",
        "plugins."
    ];
    const PREFS_BLACKLIST = [
        /^network\.proxy\./,
        /\.print_to_filename$/
    ];
    const COMPONENTS_BLACK_LIST = [
        "http://bar.yandex.ru/packages/yandexbar#spring",
        "http://bar.yandex.ru/packages/yandexbar#separator"
    ];
    let dataProviders = {
        extension: function dataProviders_extension(done) {
            let data = {
                version: appCore.application.addonManager.addonVersion,
                revision: appCore.buidRevision,
                date: appCore.Lib.strutils.formatDate(appCore.buildDate, "%D.%M.%Y")
            };
            done(data);
        },
        application: function dataProviders_application(done) {
            let info = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo).QueryInterface(Ci.nsIXULRuntime);
            let data = {
                name: Services.appinfo.name,
                version: Services.appinfo.version,
                os: info.OS + "; " + info.XPCOMABI,
                userAgent: Cc["@mozilla.org/network/protocol;1?name=http"].getService(Ci.nsIHttpProtocolHandler).userAgent,
                vendor: getPref("app.support.vendor")
            };
            AddonManager.getAddonsByTypes(["theme"], function (themes) {
                themes.forEach(function (theme) {
                    if (!theme.isActive) {
                        return;
                    }
                    if (theme.id === "{972ce4c6-7e08-4474-a285-3208198ce6fd}") {
                        return;
                    }
                    if (theme.version) {
                        data.theme = theme.name + " (" + theme.id + (theme.homepageURL ? "; " + theme.homepageURL : "") + ")";
                    } else {
                        data.lightweightTheme = theme.name + " (" + theme.id + ")";
                    }
                });
                done(data);
            });
        },
        extensions: function dataProviders_extensions(done) {
            AddonManager.getAddonsByTypes(["extension"], function (extensions) {
                extensions.sort(function (a, b) {
                    if (a.isActive != b.isActive) {
                        return b.isActive ? 1 : -1;
                    }
                    let lc = a.name.localeCompare(b.name);
                    if (lc !== 0) {
                        return lc;
                    }
                    if (a.version !== b.version) {
                        return a.version > b.version ? 1 : -1;
                    }
                    return 0;
                });
                let props = [
                    "name",
                    "version",
                    "isActive",
                    "id",
                    "homepageURL"
                ];
                done(extensions.map(function (ext) {
                    return props.reduce(function (extData, prop) {
                        extData[prop] = ext[prop] === null ? "" : ext[prop];
                        return extData;
                    }, {});
                }));
            });
        },
        components: function dataProviders_components(done) {
            let componentsByPackage = Object.create(null);
            let widgetLibrary = appCore.application.widgetLibrary;
            let packageManager = appCore.application.packageManager;
            if (packageManager) {
                packageManager.packageIDs.forEach(function (packageID) {
                    let package_ = packageManager.getPackage(packageID);
                    let packageInfo = packageManager.getPackageInfo(packageID);
                    if (!(packageID in componentsByPackage)) {
                        componentsByPackage[packageID] = {
                            id: packageID,
                            version: packageInfo.version,
                            components: []
                        };
                    }
                    widgetLibrary.getComponentsInfo(packageID).forEach(function (componentInfo) {
                        if (COMPONENTS_BLACK_LIST.indexOf(componentInfo.id) !== -1) {
                            return;
                        }
                        let enabled = componentInfo.type == "widget" ? widgetLibrary.widgetProtoInstantiated(componentInfo.id) : widgetLibrary.pluginEnabled(componentInfo.id);
                        componentsByPackage[packageID].components.push({
                            id: componentInfo.id.replace(packageID + "#", ""),
                            type: componentInfo.type,
                            name: componentInfo.name,
                            enabled: enabled
                        });
                    });
                    componentsByPackage[packageID].components.sort(function (a, b) {
                        if (a.enabled !== b.enabled) {
                            return b.enabled ? 1 : -1;
                        }
                        return a.name.localeCompare(b.name);
                    });
                });
            }
            let pkgs = [];
            for (let [
                        id,
                        pkg
                    ] in Iterator(componentsByPackage)) {
                pkgs.push(pkg);
            }
            done(pkgs);
        },
        modifiedBrowserPreferences: function dataProviders_modifiedBrowserPreferences(done) {
            done(getPrefs(BROWSER_PREFS_WHITELIST));
        },
        modifiedExtensionPreferences: function dataProviders_modifiedExtensionPreferences(done) {
            done(getPrefs(EXTENSION_PREFS_WHITELIST));
        },
        backup: function dataProviders_backup(done) {
            let backupList = null;
            if (appCore.appName === "yandex-vb") {
                backupList = appCore.application.backup.list;
            }
            done(backupList);
        }
    };
    function getPref(prefName, defaultValue) {
        let prefsService = Services.prefs;
        switch (prefsService.getPrefType(prefName)) {
        case Ci.nsIPrefBranch.PREF_STRING:
            return prefsService.getComplexValue(prefName, Ci.nsISupportsString).data;
        case Ci.nsIPrefBranch.PREF_INT:
            return prefsService.getIntPref(prefName);
        case Ci.nsIPrefBranch.PREF_BOOL:
            return prefsService.getBoolPref(prefName);
        case Ci.nsIPrefBranch.PREF_INVALID:
            return defaultValue;
        default:
            throw new Error("Unknown preference type " + prefsService.getPrefType(prefName) + " for " + prefName);
        }
    }
    function getPrefs(whitelist) {
        return whitelist.reduce(function (prefs, branch) {
            Services.prefs.getChildList(branch).forEach(function (name) {
                if (Services.prefs.prefHasUserValue(name) && !PREFS_BLACKLIST.some(re => re.test(name))) {
                    prefs[name] = getPref(name);
                }
            });
            return prefs;
        }, {});
    }
    global.Snapshoter = {
        capture: function Snapshoter_capture(done) {
            let snapshot = Object.create(null);
            let numPending = Object.keys(dataProviders).length;
            function providerDone(providerName, providerData) {
                snapshot[providerName] = providerData;
                if (--numPending === 0) {
                    Services.tm.mainThread.dispatch(done.bind(null, snapshot), Ci.nsIThread.DISPATCH_NORMAL);
                }
            }
            for (let name in dataProviders) {
                try {
                    dataProviders[name](providerDone.bind(null, name));
                } catch (e) {
                    let msg = "Snapshoter data provider failed: " + name + "\n" + e;
                    Cu.reportError(msg);
                    providerDone(name, msg);
                }
            }
        },
        getFastdialInfo: function Snapshoter_getFastdialInfo() {
            if (appCore.appName !== "yandex-vb") {
                return null;
            }
            const DB_FILENAME = "fastdial.sqlite";
            let dbFile = appCore.rootDir;
            dbFile.append(DB_FILENAME);
            let database = new appCore.Lib.Database(dbFile);
            let res = {
                blacklist: database.execQuery("SELECT domain FROM blacklist").map(row => row.domain),
                thumbs: database.execQuery("SELECT rowid, url, title, backgroundImage, backgroundColor, favicon" + " FROM thumbs ORDER BY rowid"),
                thumbs_shown: database.execQuery("SELECT thumb_id, position, fixed" + " FROM thumbs_shown ORDER BY thumb_id")
            };
            database.close();
            return res;
        },
        restoreBackup: function Snapshoter_restoreBackup(leafName) {
            if (appCore.appName !== "yandex-vb") {
                return null;
            }
            appCore.application.backup.restore(leafName);
        }
    };
}(this));
