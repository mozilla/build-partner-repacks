"use strict";
const EXPORTED_SYMBOLS = ["safeBrowsing"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
const safeBrowsing = {
        init: function safeBrowsing_init(aApplication) {
            this._application = aApplication;
            this._logger = this._application.getLogger("SafeBrowsing");
            Components.manager.QueryInterface(Ci.nsIComponentRegistrar).registerFactory(this.CLASS_ID, this.CLASS_DESCRIPTION, "@mozilla.org/network/protocol/about;1?what=blocked", this);
        },
        finalize: function Defender_finalize(aDoCleanup) {
            Components.manager.QueryInterface(Ci.nsIComponentRegistrar).unregisterFactory(this.CLASS_ID, this);
            this._logger = null;
            this._application = null;
        },
        CLASS_ID: Components.ID("{1f22ce1e-c5a4-11e3-9d3a-10ddb1b80741}"),
        CLASS_DESCRIPTION: "Yandex Elements about:blocked page protocol handler",
        createInstance: function safeBrowsing_createInstance(outer, iid) {
            if (outer !== null)
                throw Cr.NS_ERROR_NO_AGGREGATION;
            return this.QueryInterface(iid);
        },
        QueryInterface: XPCOMUtils.generateQI([
            Ci.nsIFactory,
            Ci.nsIAboutModule
        ]),
        getURIFlags: function safeBrowsing_getURIFlags() {
            return Ci.nsIAboutModule.ALLOW_SCRIPT | Ci.nsIAboutModule.HIDE_FROM_ABOUTABOUT;
        },
        get _appProtocol() {
            delete this._appProtocol;
            var appConfig = this._application.core.CONFIG.APP;
            return this._appProtocol = appConfig.PROTOCOL || appConfig.NAME;
        },
        newChannel: function safeBrowsing_newChannel(aURI) {
            var url = "chrome://browser/content/blockedSite.xhtml";
            var blockedURL = aURI.spec;
            if (/[&?]e=(malwareBlocked|phishingBlocked)(&|$)/.test(blockedURL)) {
                url = "chrome://" + this._appProtocol + "/content/safebrowsing/index.xhtml";
            }
            var channel = Services.io.newChannel(url, null, null);
            channel.originalURI = aURI;
            return channel;
        },
        get config() {
            var sbconf = new SafeBrowsingConfig(this._application);
            delete this.config;
            return this.config = {
                get lang() sbconf.language,
                get yandexBrowser() sbconf.yandexBrowser,
                performBrowser: function config_performBrowser() sbconf.performBrowser(),
                sendStatistics: function config_sendStatistics(aAction) sbconf.sendStatistics(aAction)
            };
        }
    };
function SafeBrowsingConfig(app) {
    this._app = app;
    this._links = {
        install: "http://browser.yandex.ru/desktop/",
        launch: "http://browser.yandex.ru/desktop/"
    };
    this._platform = this._app.core.Lib.sysutils.platformInfo.os.name;
    this._brandID = this._app.branding.brandID;
    var sbDoc;
    try {
        sbDoc = this._app.branding.brandPackage.getXMLDocument("/safebrowsing/safebrowsing.xml");
    } catch (e) {
    }
    if (sbDoc) {
        let browserInstallElement = sbDoc.querySelector("BrowserInstallUrl");
        if (browserInstallElement && browserInstallElement.textContent) {
            this._links.install = browserInstallElement.textContent;
        }
        let browserLaunchURL = sbDoc.querySelector("BrowserLaunchUrl");
        if (browserLaunchURL && browserLaunchURL.textContent) {
            this._links.launch = browserLaunchURL.textContent;
        }
    }
}
SafeBrowsingConfig.prototype = {
    constructor: SafeBrowsingConfig,
    get language() this._app.locale.language,
    get _winReg() {
        var winReg = Cu.import("resource://" + this._app.name + "-mod/WinReg.jsm", {}).WinReg;
        this.__defineGetter__("_winReg", function _winReg() winReg);
        return this._winReg;
    },
    get yandexBrowser() {
        var flags = {
                showNothing: 0,
                showNotInstalled: 1,
                showInstalled: 2
            };
        if ([
                "mac",
                "windows"
            ].indexOf(this._platform) === -1) {
            return flags.showNothing;
        }
        if (this._brandID !== "yandex") {
            return flags.showNothing;
        }
        var eclipseTime = 21 * 24 * 60 * 60 * 1000;
        var lastActionTime = Math.max(this._getPref("installed"), this._getPref("notInstalled"));
        if (Math.abs(Date.now() - lastActionTime) < eclipseTime) {
            return flags.showNothing;
        }
        var browserExecutable = this._getBrowserExecutable();
        if (browserExecutable) {
            if (this._installedBrowserShowSuggest()) {
                return flags.showInstalled;
            }
        } else {
            return flags.showNotInstalled;
        }
        return flags.showNothing;
    },
    performBrowser: function SafeBrowsingConfig_performBrowser() {
        var browserExecutable = this._getBrowserExecutable();
        if (browserExecutable) {
            this._setPref("installed", Date.now().toString());
            let args;
            let execFile;
            switch (this._platform) {
            case "windows":
                args = [this._links.launch];
                execFile = browserExecutable;
                break;
            case "mac":
                execFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                execFile.initWithPath("/bin/bash");
                args = [
                    "-c",
                    "open -a '" + browserExecutable.path + "'; " + "sleep 1; " + "open -a '" + browserExecutable.path + "' '" + this._links.launch + "'"
                ];
                break;
            }
            try {
                let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
                process.init(execFile);
                process.run(false, args, args.length);
            } catch (e) {
            }
        } else {
            this._setPref("notInstalled", Date.now().toString());
            this._app.core.Lib.misc.navigateBrowser({
                url: this._links.install,
                target: "new tab"
            });
        }
    },
    sendStatistics: function SafeBrowsingConfig_sendStatistics(aAction) {
        switch (aAction) {
        case "addbbinstall":
        case "addbbrun":
        case "install":
        case "run":
            break;
        default:
            return;
        }
        var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.open("GET", "http://clck.yandex.ru/click/dtype=stred/pid=12/cid=72308/path=fx." + aAction + "/*http://yandex.ru", true);
        request.send(null);
    },
    ACTION_PREF_PREFIX: "safebrowsing.yandexBrowser.date.action.",
    _getPref: function SafeBrowsingConfig__getPref(prefName) {
        return this._app.preferences.get(this.ACTION_PREF_PREFIX + prefName, null);
    },
    _setPref: function SafeBrowsingConfig__setPref(prefName, value) {
        this._app.preferences.set(this.ACTION_PREF_PREFIX + prefName, value);
    },
    _getBrowserExecutable: function SafeBrowsingConfig__getBrowserExecutable() {
        switch (this._platform) {
        case "windows":
            return this._getBrowserExecutableWin();
        case "mac":
            return this._getBrowserExecutableMac();
        default:
            return null;
        }
    },
    _getBrowserExecutableMac: function SafeBrowsingConfig__getBrowserExecutableMac() {
        var mwaUtils = Cc["@mozilla.org/widget/mac-web-app-utils;1"].createInstance(Ci.nsIMacWebAppUtils);
        var distribLocation = mwaUtils.pathForAppWithIdentifier("ru.yandex.desktop.yandex-browser");
        if (distribLocation) {
            try {
                let distribFile = new FileUtils.File(distribLocation);
                if (distribFile.exists() && distribFile.isExecutable()) {
                    return distribFile;
                }
            } catch (e) {
            }
        }
        return null;
    },
    _getBrowserExecutableWin: function SafeBrowsingConfig__getBrowserExecutableWin() {
        const DISTRIB_EXECUTABLE = "browser.exe";
        var distribLocation = this._winReg.read("HKCU", "Software\\Yandex\\YandexBrowser", "InstallerSuccessLaunchCmdLine") || this._winReg.read("HKCU", "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YandexBrowser", "InstallLocation") || this._winReg.read("HKCU", "Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YandexBrowser", "InstallLocation");
        this._winReg.read("HKLM", "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YandexBrowser", "InstallLocation") || this._winReg.read("HKLM", "Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YandexBrowser", "InstallLocation");
        if (distribLocation) {
            distribLocation = distribLocation.replace(/^"|"$/g, "");
            let dIndex = distribLocation.indexOf("\\" + DISTRIB_EXECUTABLE, distribLocation.length - (DISTRIB_EXECUTABLE.length + 1));
            try {
                let distribFile = new FileUtils.File(distribLocation);
                if (dIndex == -1) {
                    distribFile.append(DISTRIB_EXECUTABLE);
                }
                if (distribFile.exists() && distribFile.isExecutable()) {
                    return distribFile;
                }
            } catch (e) {
            }
        }
        var possiblePaths = [
                [
                    "LocalAppData",
                    "Yandex\\YandexBrowser\\Application"
                ],
                [
                    "ProgF",
                    "Yandex\\YandexBrowser\\Application"
                ],
                [
                    "ProgF",
                    "Yandex\\YandexBrowser"
                ]
            ];
        let (i = 0) {
            for (; i < possiblePaths.length; i++) {
                let possiblePath = possiblePaths[i];
                let file = Services.dirsvc.get(possiblePath[0], Ci.nsIFile);
                file.appendRelativePath(possiblePath[1] + "\\" + DISTRIB_EXECUTABLE);
                if (file.exists() && file.isExecutable()) {
                    return file;
                }
            }
        }
        return null;
    },
    _installedBrowserShowSuggest: function SafeBrowsingConfig__installedBrowserShowSuggest() {
        switch (this._platform) {
        case "windows":
            return this._installedBrowserShowSuggestWin();
        case "mac":
            return this._installedBrowserShowSuggestMac();
        default:
            return false;
        }
    },
    _installedBrowserShowSuggestMac: function SafeBrowsingConfig__installedBrowserShowSuggestMac() {
        var browserExecutable = this._getBrowserExecutableMac();
        if (!browserExecutable)
            return false;
        var browserExecutableName = browserExecutable.leafName.replace(/\.app$/, "");
        var result = this._runBashScriptMac("http", "export VERSIONER_PERL_PREFER_32_BIT=yes; " + "perl -MMac::InternetConfig -le 'print +(GetICHelper \"http\")[1]'");
        return result !== browserExecutableName;
    },
    _installedBrowserShowSuggestWin: function SafeBrowsingConfig__installedBrowserShowSuggestWin() {
        var lastLaunch = Number(this._winReg.read("HKCU", "Software\\Yandex\\YandexBrowser", "lastrun")) || 0;
        if (!lastLaunch) {
            return false;
        }
        var defaultBrowser = this._winReg.read("HKCU", "Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice", "Progid");
        if (!defaultBrowser) {
            return false;
        }
        defaultBrowser = defaultBrowser.replace(/^"|"$/g, "");
        if (defaultBrowser.indexOf("YandexHTML") === 0) {
            return false;
        }
        return true;
    },
    _runBashScriptMac: function SafeBrowsingConfig__runBashScriptMac(aType, aArgsString) {
        var tmpFile = Services.dirsvc.get("TmpD", Ci.nsIFile);
        tmpFile.append("safebrowsing-bash-out-" + aType + ".txt");
        tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
        var args = [
                "-c",
                aArgsString + " > " + tmpFile.path.replace(/\W/g, "\\$&") + " 2> /dev/null"
            ];
        var bashFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
        bashFile.initWithPath("/bin/bash");
        var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        var result = null;
        try {
            process.init(bashFile);
            process.run(true, args, args.length);
            result = this._app.core.Lib.fileutils.readTextFile(tmpFile).trim();
        } catch (e) {
        } finally {
            this._app.core.Lib.fileutils.removeFileSafe(tmpFile);
        }
        return result;
    },
    _app: null,
    _links: null,
    _platform: null,
    _brandID: null
};
