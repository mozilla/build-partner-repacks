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
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#lenta";
const core = {
    counterServiceID: 44,
    counterXpathExpr: "number(/s/c/lenta/@v)",
    get authManager() {
        return this.authAdapter.authManager;
    },
    get API() {
        return this._api;
    },
    get SERVICE_URL() {
        let url = this._api.Localization.createStringBundle("/urls/lenta.properties").get("LentaURL");
        delete this.SERVICE_URL;
        return this.SERVICE_URL = url;
    },
    get canShowNotifications() {
        return this.API.Environment.os.name !== "linux";
    },
    init: function LentaWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        this._loadModules();
        this._api.Notifications.addListener(this);
    },
    finalize: function LentaWidget_finalize() {
        this._api.Notifications.removeListener(this);
        delete this._api;
        delete this._logger;
        delete this.__stringBundle;
    },
    buildWidget: function LentaWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function LentaWidget_destroyWidget(WIID, item, context) {
        item.removeAttribute("yb-native-widget-name");
        item.removeAttribute("yb-native-widget-wiid");
        this.dlgman.closeFeedsDialog();
    },
    Settings: {
        getMainTemplate: function MailWidget_getMainTemplate(aWidgetUnitName, aWidgetInstanceId) {
            return core.API.Package.getFileInputChannel("/native/fx/lenta/settings.xml").contentStream;
        }
    },
    dayuseStatProvider: {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return core.authManager.authorized;
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return core.authManager.pwdmng.hasSavedAccounts;
        },
        isNotificationsEnabled: function dayuseStatProvider_isNotificationsEnabled() {
            return core.canShowNotifications && core.getPref("showTextAlert", true) === true;
        }
    },
    onButtonClick: function LentaWidget_onButtonClick(event, widget) {
        if (this.authManager.authorized) {
            this.gotoMessages(event);
        } else {
            let dialogParams = { retpath: this.SERVICE_URL };
            this.authManager.openAuthDialog(dialogParams);
        }
    },
    refreshData: function LentaWidget_refreshData(event, callback) {
        this.counters.forceUpdate(this.counterServiceID, callback);
    },
    gotoMessages: function LentaWidget_gotoMessages(event) {
        this._navToLentaPage("", event);
    },
    addFeeds: function LentaWidget_addFeeds() {
        this.dlgman.openFeedsDialog();
    },
    notificationClicked: function LentaWidget_notificationClicked(id, data, target) {
        let notifications = this._api.Notifications;
        switch (target) {
        case notifications.CLICK_TARGET_OPTIONS:
            this._api.Controls.openSettingsDialog(null, this._api.Controls.allWidgetInstanceIDs[0]);
            break;
        case notifications.CLICK_TARGET_TITLE:
        case notifications.CLICK_TARGET_OTHER:
            this._api.Controls.navigateBrowser({
                url: this.SERVICE_URL,
                target: "new tab"
            });
            break;
        default:
            this._logger.warn("Unknow target");
            break;
        }
    },
    getPref: function LentaWidget_getPref(strPrefName, defaultValue) {
        let prefFullName = this._api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this._api.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    },
    setPref: function LentaWidget_setPref(strPrefName, strPrefValue) {
        let prefFullName = this._api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this._api.Settings.PrefsModule;
        return prefsModule.set(prefFullName, strPrefValue);
    },
    __stringBundle: null,
    get _stringBundle() {
        return this.__stringBundle || (this.__stringBundle = this._api.Localization.createStringBundle("/native/fx/lenta.properties"));
    },
    get _activeTabIsServicePage() {
        let currentWindow = this.utils.mostRecentBrowserWindow;
        let activeTabURL = currentWindow && currentWindow.gBrowser.currentURI.spec || "";
        return /^https?:\/\/mail\.yandex(\.[a-z]{2,3}){1,2}\/(my\/#)?lenta/.test(activeTabURL);
    },
    _navToLentaPage: function LentaWidget__navToLentaPage(page, origEvent) {
        let lentaURL = this.SERVICE_URL + page;
        this.API.Controls.navigateBrowser({
            url: lentaURL,
            eventInfo: origEvent
        });
    },
    _MODULES: {
        utils: "common-auth/utils.jsm",
        counters: "counters.jsm",
        dlgman: "dlgman.jsm",
        authAdapter: "yauth.jsm"
    },
    _loadModules: function LentaWidget__loadModules() {
        let shAPI = this._api.shareableAPI;
        for (let [
                    moduleName,
                    moduleFileName
                ] in Iterator(this._MODULES)) {
            Cu.import(this._api.Package.resolvePath("/native/fx/modules/" + moduleFileName), this);
            let module = this[moduleName];
            if (typeof module.init == "function") {
                module.init(shAPI);
            }
        }
    }
};
