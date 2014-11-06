"use strict";
const EXPORTED_SYMBOLS = ["integration"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
const integration = {
    init: function integration_init(application) {
        this._application = application;
        this._logger = this._application.getLogger("integration");
    },
    finalize: function integration_finalize() {
        this._application = null;
        this._logger = null;
    },
    get yandexBrowser() {
        let yb = new YandexBrowser(this._application);
        delete this.yandexBrowser;
        return this.yandexBrowser = yb;
    },
    get yandexDisk() {
        let yandexDisk = new YandexDisk(this._application, this._logger);
        delete this.yandexDisk;
        return this.yandexDisk = yandexDisk;
    }
};
function YandexBrowser(aApplication) {
    this._app = aApplication;
    this._platform = this._app.core.Lib.sysutils.platformInfo.os.name;
}
YandexBrowser.prototype = {
    constructor: YandexBrowser,
    _app: null,
    _platform: null,
    get _winReg() {
        let winReg = Cu.import("resource://" + this._app.name + "-mod/WinReg.jsm", {}).WinReg;
        this.__defineGetter__("_winReg", () => winReg);
        return this._winReg;
    },
    get browserExcecutable() {
        return this._getBrowserExecutable();
    },
    get isInstalled() {
        return !!this.browserExcecutable;
    },
    get isDefaultBrowser() {
        return this._isDefaultBrowser();
    },
    get lastLaunch() {
        if (this._platform !== "windows")
            return 0;
        let WinReg = this._winReg;
        let lastLaunch = Number(WinReg.read("HKCU", "Software\\Yandex\\YandexBrowser", "lastrun"));
        if (!lastLaunch)
            return 0;
        return Math.floor((lastLaunch - 11644473600000000) / 1000);
    },
    get version() {
        let version;
        let browserExcecutable = this.browserExcecutable;
        if (browserExcecutable) {
            switch (this._platform) {
            case "windows": {
                    let wshScriptText = "                                                                               var browserPath = WScript.Arguments.Item(0);                                                    var fso  = WScript.CreateObject(\"Scripting.FileSystemObject\");                                  var ver = fso.GetFileVersion(browserPath);                                                      echo(ver);                                                                                  ";
                    version = this._runWSHScriptWin("bversion", wshScriptText, [browserExcecutable.path]);
                    break;
                }
            case "mac": {
                    let plistFile = browserExcecutable.clone();
                    plistFile.append("Contents");
                    plistFile.append("Info.plist");
                    version = this._runBashScriptMac("bversion", "defaults read " + plistFile.path + " CFBundleChromiumShortVersionString");
                    break;
                }
            default:
                break;
            }
        }
        if (!(version && /^\d+\.\d+/.test(version)))
            version = undefined;
        return version;
    },
    openBrowser: function YandexBrowser_openBrowser(aURL) {
        let browserExecutable = this.browserExcecutable;
        if (!browserExecutable) {
            return;
        }
        let args;
        let execFile;
        switch (this._platform) {
        case "windows":
            args = aURL ? [aURL] : [];
            execFile = browserExecutable;
            break;
        case "mac":
            execFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            execFile.initWithPath("/bin/bash");
            args = [
                "-c",
                "open -a '" + browserExecutable.path + "'; " + "sleep 1; " + "open -a '" + browserExecutable.path + "' " + JSON.stringify(decodeURI(aURL))
            ];
            break;
        }
        try {
            let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
            process.init(execFile);
            process.runw(false, args, args.length);
        } catch (e) {
        }
    },
    _getBrowserExecutable: function YandexBrowser__getBrowserExecutable() {
        switch (this._platform) {
        case "windows":
            return this._getBrowserExecutableWin();
        case "mac":
            return this._getBrowserExecutableMac();
        default:
            return null;
        }
    },
    _getBrowserExecutableMac: function YandexBrowser__getBrowserExecutableMac() {
        let mwaUtils = Cc["@mozilla.org/widget/mac-web-app-utils;1"].createInstance(Ci.nsIMacWebAppUtils);
        let distribLocation = mwaUtils.pathForAppWithIdentifier("ru.yandex.desktop.yandex-browser");
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
    _getBrowserExecutableWin: function YandexBrowser__getBrowserExecutableWin() {
        const DISTRIB_EXECUTABLE = "browser.exe";
        let distribLocation = this._winReg.read("HKCU", "Software\\Yandex\\YandexBrowser", "InstallerSuccessLaunchCmdLine") || this._winReg.read("HKCU", "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YandexBrowser", "InstallLocation") || this._winReg.read("HKCU", "Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YandexBrowser", "InstallLocation");
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
        let possiblePaths = [
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
        for (let i = 0; i < possiblePaths.length; i++) {
            let possiblePath = possiblePaths[i];
            let file = Services.dirsvc.get(possiblePath[0], Ci.nsIFile);
            file.appendRelativePath(possiblePath[1] + "\\" + DISTRIB_EXECUTABLE);
            if (file.exists() && file.isExecutable()) {
                return file;
            }
        }
        return null;
    },
    _isDefaultBrowser: function YandexBrowser__isDefaultBrowser() {
        switch (this._platform) {
        case "windows":
            return this._isDefaultBrowserWin();
        case "mac":
            return this._isDefaultBrowserMac();
        default:
            return;
        }
    },
    _isDefaultBrowserMac: function YandexBrowser__isDefaultBrowserMac() {
        let browserExecutable = this.browserExcecutable;
        if (!browserExecutable) {
            return;
        }
        let browserExecutableName = browserExecutable.leafName.replace(/\.app$/, "");
        let result = this._runBashScriptMac("http", "export VERSIONER_PERL_PREFER_32_BIT=yes; " + "perl -MMac::InternetConfig -le 'print +(GetICHelper \"http\")[1]'");
        return result === browserExecutableName;
    },
    _isDefaultBrowserWin: function YandexBrowser__isDefaultBrowserWin() {
        let browserExecutable = this.browserExcecutable;
        if (!browserExecutable) {
            return;
        }
        let defaultBrowser = this._winReg.read("HKCU", "Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice", "Progid");
        if (!defaultBrowser) {
            return;
        }
        defaultBrowser = defaultBrowser.replace(/^"|"$/g, "");
        if (defaultBrowser.indexOf("YandexHTML") === 0) {
            return true;
        }
        return false;
    },
    _runWSHScriptWin: function YandexBrowser__runWSHScriptWin(aType, aWSHScriptText, aWSHScriptArguments) {
        let result = null;
        let tmpFileIn = this._tryCreateTmpFile("integration-yb-bash-in-" + aType + ".js");
        if (!tmpFileIn)
            return result;
        let tmpFileOut = this._tryCreateTmpFile("integration-yb-bash-out-" + aType + ".txt");
        if (!tmpFileOut)
            return result;
        aWSHScriptText = "function echo(msg) {" + "    var outFilePath = " + JSON.stringify(tmpFileOut.path) + "; " + "    var fso  = WScript.CreateObject(\"Scripting.FileSystemObject\"); " + "    var outFile = fso.OpenTextFile(outFilePath, 2, true, -1); " + "    outFile.Write(msg);" + "}" + aWSHScriptText;
        let args = [tmpFileIn.path].concat(aWSHScriptArguments || []).concat([
            "//nologo",
            "//B"
        ]);
        let wscriptFile = Services.dirsvc.get("SysD", Ci.nsIFile);
        wscriptFile.append("wscript.exe");
        let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        try {
            this._app.core.Lib.fileutils.writeTextFile(tmpFileIn, aWSHScriptText);
            process.init(wscriptFile);
            process.runw(true, args, args.length);
            result = this._app.core.Lib.fileutils.readTextFile(tmpFileOut, "UTF-16").trim();
        } catch (e) {
        } finally {
            this._app.core.Lib.fileutils.removeFileSafe(tmpFileIn);
            this._app.core.Lib.fileutils.removeFileSafe(tmpFileOut);
        }
        return result;
    },
    _runBashScriptMac: function YandexBrowser__runBashScriptMac(aType, aArgsString) {
        let result = null;
        let tmpFile = this._tryCreateTmpFile("integration-yb-bash-out-" + aType + ".txt");
        if (!tmpFile)
            return result;
        let args = [
            "-c",
            aArgsString + " > " + tmpFile.path.replace(/\W/g, "\\$&") + " 2> /dev/null"
        ];
        let bashFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
        bashFile.initWithPath("/bin/bash");
        let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
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
    _tryCreateTmpFile: function YandexBrowser__tryCreateTmpFile(aFileName) {
        let tmpFile = Services.dirsvc.get("TmpD", Ci.nsIFile);
        tmpFile.append(aFileName);
        try {
            tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
            return tmpFile;
        } catch (e) {
        }
        return null;
    }
};
function YandexDisk(aApplication, aLogger) {
    this._app = aApplication;
    this._logger = aLogger;
    this._platform = this._app.core.Lib.sysutils.platformInfo.os.name;
}
YandexDisk.prototype = {
    constructor: YandexDisk,
    get version() {
        let diskVersion = null;
        switch (this._platform) {
        case "windows": {
                let regPath = "Software\\Yandex\\Yandex.Disk.Installer3";
                let regName = "FullVersion";
                diskVersion = this._winReg.read("HKCU", regPath, regName) || this._winReg.read("HKLM", regPath, regName) || null;
                if (!/^\d+/.test(diskVersion))
                    diskVersion = null;
                break;
            }
        case "mac": {
                let tmpDir = Services.dirsvc.get("TmpD", Ci.nsIFile);
                let tmpFile = tmpDir.clone();
                tmpFile.append("integration-yd-bash-out.txt");
                tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
                let args = [
                    "-c",
                    "IFS=$'\n'; for f in $(mdfind \"kMDItemCFBundleIdentifier=ru.yandex.desktop.disk\");                      do defaults read \"$f/Contents/Info.plist\" CFBundleShortVersionString 2> /dev/null;                      done | sort -n -r > " + tmpFile.path.replace(/\W/g, "\\$&")
                ];
                let bashFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                bashFile.initWithPath("/bin/bash");
                let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
                try {
                    process.init(bashFile);
                    process.runw(true, args, args.length);
                    diskVersion = this._app.core.Lib.fileutils.readTextFile(tmpFile).split("\n")[0] || null;
                    if (!/^\d+/.test(diskVersion))
                        diskVersion = null;
                } catch (e) {
                    this._logger.error("Can not run process for get Yandex.Disk version.");
                    this._logger.debug(e);
                }
                break;
            }
        }
        return diskVersion;
    },
    get _winReg() {
        let winReg = Cu.import("resource://" + this._app.name + "-mod/WinReg.jsm", {}).WinReg;
        this.__defineGetter__("_winReg", () => winReg);
        return this._winReg;
    }
};
