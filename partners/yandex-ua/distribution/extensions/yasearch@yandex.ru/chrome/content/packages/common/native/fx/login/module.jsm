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
const AVATAR_SRC = "https://yapic.yandex.ru/get/{user_uid}/islands-middle";
const core = {
    get authManager() {
        return this.authAdapter.authManager;
    },
    get API() {
        return this._api;
    },
    init: function LoginWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        this._loadModules();
    },
    finalize: function LoginWidget_finalize() {
        delete this.utils;
        delete this._api;
        delete this._logger;
    },
    buildWidget: function LoginWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function LoginWidget_destroyWidget(WIID, item, context) {
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
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return core.authManager.authorized;
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return core.authManager.pwdmng.hasSavedAccounts;
        }
    },
    getPref: function LoginWidget_getPref(strPrefName, defaultValue) {
        let prefFullName = this.API.Settings.getPackageBranchPath() + strPrefName;
        let prefsModule = this.API.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    },
    setPref: function LoginWidget_setPref(strPrefName, strPrefValue) {
        let prefFullName = this.API.Settings.getPackageBranchPath() + strPrefName;
        let prefsModule = this.API.Settings.PrefsModule;
        return prefsModule.set(prefFullName, strPrefValue);
    },
    onButtonClick: function LoginWidget_onButtonClick(event, widget) {
        this.sendStatistics("button.authoff");
        let dialogParams = { retpath: "http://" + this.authManager.authdefs.DOMAINS.MAIN_DOMAIN };
        this.authManager.openAuthDialog(dialogParams);
    },
    switchUser: function LoginWidget_switchUser(aStrUsername) {
        return this.authManager.switchUser(aStrUsername);
    },
    logoutUser: function LoginWidget_logoutUser(aUser) {
        return this.authManager.initLogoutProcess(aUser);
    },
    logoutAll: function LoginWidget_logoutAll() {
        this.authManager.initLogoutAll();
    },
    buildMenu: function LoginWidget_buildMenu() {
        let users = this.authManager.allUsers;
        return this._buildMenuItems(users);
    },
    createAccountAvatarURL: function LoginWidget_createAccountAvatarURL(aUid) {
        aUid = aUid || 0;
        return AVATAR_SRC.replace("{user_uid}", aUid);
    },
    sendStatistics: function LoginWidget_sendStatistics(aAction) {
        this.API.Statistics.logClickStatistics({
            cid: 72359,
            path: "fx.yalogin." + aAction
        });
    },
    _MODULES: {
        utils: "common-auth/utils.jsm",
        dlgman: "dlgman.jsm",
        authAdapter: "yauth.jsm"
    },
    _buildMenuItems: function LoginWidget__buildMenuItems(users) {
        let menuItems = [];
        let document = this.utils.mostRecentBrowserWindow.document;
        let defaultUser = this.authManager.getTopUser();
        for (let [
                    ,
                    user
                ] in Iterator(users)) {
            let menuitem = document.createElement("menuitem");
            menuitem.setAttribute("crop", "end");
            menuitem.setAttribute("class", "menuitem-iconic avatar-item");
            menuitem.setAttribute("image", this.createAccountAvatarURL(user.uid));
            menuitem.setAttribute("yb-user", user.login || user.uid);
            menuitem.setAttribute("yb-user-uid", user.uid);
            menuitem.setAttribute("yb-user-no-auth", !user.authorized);
            let label = user.displayName;
            if (user === defaultUser) {
                menuitem.setAttribute("yb-default-user", true);
            }
            menuitem.setAttribute("label", label);
            if (user === defaultUser) {
                menuItems.splice(0, 0, menuitem);
            } else {
                menuItems.push(menuitem);
            }
        }
        return menuItems;
    },
    _loadModules: function LoginWidget__loadModules() {
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
