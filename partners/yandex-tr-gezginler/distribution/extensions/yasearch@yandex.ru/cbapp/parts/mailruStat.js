"use strict";
const EXPORTED_SYMBOLS = ["mailruStat"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const GLOBAL = this;
const ADDON_INSTALLED_VERSION_PREF_NAME = "mailruStat.sversion";
const UTILITY_INSTALLED_VERSION_PREF_NAME = "mailruStat.gversion";
const mailruStat = {
    _application: null,
    _delayedParseTimer: null,
    _sputnik: { version: null },
    _guard: { version: null },
    init: function mailruStat_init(aApplication) {
        this._application = aApplication;
        aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
        this._delayedParseTimer = new sysutils.Timer(() => {
            AddonManager.gre_AddonManager.getAddonByID("{37964A3C-4EE8-47b1-8321-34DE2C39BA4D}", this._parseAddon.bind(this));
            this._parseGuard();
        }, 20000);
    },
    finalize: function mailruStat_finalize() {
        this._delayedParseTimer.cancel();
        this._delayedParseTimer = null;
        this._application = null;
    },
    _parseAddon: function mailruStat__parseAddon(aAddon) {
        if (!aAddon) {
            this._application.preferences.overwrite(ADDON_INSTALLED_VERSION_PREF_NAME, "0");
            return;
        }
        this._sputnik.version = aAddon.version;
    },
    _parseGuard: function mailruStat__parseGuard() {
        if (sysutils.platformInfo.os.name !== "windows") {
            return;
        }
        const WinReg = Cu.import("resource://" + this._application.name + "-mod/WinReg.jsm", {}).WinReg;
        let path = "\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Guard.Mail.ru";
        let guardVersion = WinReg.read("HKLM", "Software" + path, "DisplayVersion") || WinReg.read("HKLM", "Software\\Wow6432Node" + path, "DisplayVersion");
        if (!guardVersion) {
            this._application.preferences.overwrite(UTILITY_INSTALLED_VERSION_PREF_NAME, "0");
            return;
        }
        this._guard.version = guardVersion;
    },
    getParam: function mailruStat_getParam() {
        let res = Object.create(null);
        if (this._sputnik.version) {
            let usage = "dayuse";
            let installedVersion = this._application.preferences.get(ADDON_INSTALLED_VERSION_PREF_NAME, null);
            if (installedVersion == "0") {
                usage = "install";
            }
            this._application.preferences.overwrite(ADDON_INSTALLED_VERSION_PREF_NAME, String(this._sputnik.version));
            res.ms = usage + "|" + this._sputnik.version;
        }
        if (this._guard.version) {
            let usage = "dayuse";
            let installedVersion = this._application.preferences.get(UTILITY_INSTALLED_VERSION_PREF_NAME, null);
            if (installedVersion == "0") {
                usage = "install";
            }
            this._application.preferences.overwrite(UTILITY_INSTALLED_VERSION_PREF_NAME, String(this._guard.version));
            res.mg = usage + "|" + this._guard.version;
        }
        return res;
    }
};
