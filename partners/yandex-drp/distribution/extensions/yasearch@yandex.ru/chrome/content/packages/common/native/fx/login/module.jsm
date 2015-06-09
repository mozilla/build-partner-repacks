"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const resources = { browser: { styles: ["/native/fx/bindings.css"] } };
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#login";
const AVATAR_SRC = "https://yapic.yandex.ru/get/{account_uid}/islands-middle";
const core = {
    get API() {
        return this._api;
    },
    init: function (api) {
        this._api = api;
        this._logger = api.logger;
        this._loadModules();
    },
    finalize: function () {
        delete this.utils;
        delete this._api;
        delete this._logger;
    },
    buildWidget: function (WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function (WIID, item, context) {
        try {
            if (typeof item.destroy == "function") {
                item.destroy();
            }
        } finally {
            item.removeAttribute("yb-native-widget-name");
            item.removeAttribute("yb-native-widget-wiid");
        }
    },
    dayuseStatProvider: {
        isAuthorized: function () {
            return core.API.Passport.isAuthorized();
        },
        hasSavedLogins: function () {
            return core.API.Passport.hasSavedLogins();
        }
    },
    getPref: function (strPrefName, defaultValue) {
        let prefFullName = this.API.Settings.getPackageBranchPath() + strPrefName;
        let prefsModule = this.API.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    },
    setPref: function (strPrefName, strPrefValue) {
        let prefFullName = this.API.Settings.getPackageBranchPath() + strPrefName;
        let prefsModule = this.API.Settings.PrefsModule;
        return prefsModule.set(prefFullName, strPrefValue);
    },
    onButtonClick: function (event, widget) {
        this.sendStatistics("button.authoff");
        let dialogParams = { retpath: "http://" + this.API.Passport.authdefs.DOMAINS.MAIN_DOMAIN };
        this.API.Passport.openAuthDialog(dialogParams);
    },
    switchAccount: function (aAccountId) {
        return this.API.Passport.switchAccount(aAccountId);
    },
    logoutDefaultAccount: function () {
        return this.logoutAccount(this.API.Passport.defaultAccount);
    },
    logoutAccount: function (aAccount) {
        return this.API.Passport.logoutAccount(aAccount);
    },
    logoutAll: function () {
        return this.API.Passport.logoutAllAccounts();
    },
    buildMenu: function () {
        let accounts = this.API.Passport.allAccounts;
        return this._buildMenuItems(accounts);
    },
    createAccountAvatarURL: function (aUid) {
        aUid = aUid || 0;
        return AVATAR_SRC.replace("{account_uid}", aUid);
    },
    sendStatistics: function (aAction) {
        this.API.Statistics.logClickStatistics({
            cid: 72359,
            path: "fx.yalogin." + aAction
        });
    },
    _buildMenuItems: function (aAccounts) {
        let menuItems = [];
        let document = this.utils.mostRecentBrowserWindow.document;
        let defaultAccount = this.API.Passport.defaultAccount;
        for (let [
                    ,
                    account
                ] in Iterator(aAccounts)) {
            let menuitem = document.createElement("menuitem");
            menuitem.setAttribute("crop", "end");
            menuitem.setAttribute("class", "menuitem-iconic avatar-item");
            menuitem.setAttribute("image", this.createAccountAvatarURL(account.uid));
            menuitem.setAttribute("yb-user", account.login || account.uid);
            menuitem.setAttribute("yb-user-uid", account.uid);
            menuitem.setAttribute("yb-user-no-auth", !account.authorized);
            let label = account.displayName;
            if (account === defaultAccount) {
                menuitem.setAttribute("yb-default-user", true);
            }
            menuitem.setAttribute("label", label);
            if (account === defaultAccount) {
                menuItems.splice(0, 0, menuitem);
            } else {
                menuItems.push(menuitem);
            }
        }
        return menuItems;
    },
    _MODULES: { utils: "utils.jsm" },
    _loadModules: function () {
        let shAPI = this.API.shareableAPI;
        for (let [
                    moduleName,
                    moduleFileName
                ] in Iterator(this._MODULES)) {
            Cu.import(this.API.Package.resolvePath("/native/fx/modules/" + moduleFileName), this);
            let module = this[moduleName];
            if (typeof module.init == "function") {
                module.init(shAPI);
            }
        }
    }
};
