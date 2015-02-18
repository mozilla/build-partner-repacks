EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function tplUrl(url) {
        return function () {
            return url.replace("{UID}", this.getUserData().uid);
        };
    }
    app.config = {
        useClickStatistics: true,
        uniqueWidget: true,
        observeBranding: false,
        navigateUrl: {
            "home": "http://ok.ru",
            "messages": "http://ok.ru/messages?_uaid=BrowserToolbar_Messages",
            "notifications": "http://ok.ru/notifications?_uaid=BrowserToolbar_Notifications",
            "guests": "http://ok.ru/guests?_uaid=BrowserToolbar_Guests",
            "marks": "http://ok.ru/marks?_uaid=BrowserToolbar_PhotoMarks",
            "friends": tplUrl("http://ok.ru/profile/{UID}/friends"),
            "bd": "http://ok.ru/holidays",
            "comments": "http://ok.ru/discussions"
        },
        cred: {
            client_secret: "5E4DFBC278D1F82A3841A9FD",
            client_id: "696320",
            app_key: "CBABKLABABABABABA"
        },
        rxServiceUrl: /^https?:\/\/(www.)?(odnoklassniki|ok)\.ru(\/|$)/
    };
    app.Settings = {
        getMainTemplate: function CoreSettings_getMainTemplate(aWidgetUnitName, aWidgetInstanceId) {
            return common.utils.readFile("content/settings.xml");
        }
    };
    app.dayuseStatProvider = {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return app.isAuth();
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return common.loginManager.hasSavedLogins({ formSubmitURL: "https://www.ok.ru" }) || common.loginManager.hasSavedLogins({ formSubmitURL: "https://www.odnoklassniki.ru" });
        },
        isNotificationsEnabled: function dayuseStatProvider_isNotificationsEnabled() {
            return app.canShowNotifications() && app.api.Settings.getValue("notifications") === true;
        }
    };
    var timer = null;
    app.init = function () {
        this.log("*** init");
        this.odnoklassniki = this.importModule("api");
        this.oauth = this.importModule("oauth");
        this.notifier = this.importModule("notifications").init();
        this.odnoklassniki.init(this, true);
        this.oauth.init(this, this.config.cred);
        timer = common.timers.create(5 * 60 * 1000, this.odnoklassniki.update, this.odnoklassniki);
    };
    app.onSettingChange = function (key, value, instanceId) {
        if (key == "update-interval") {
        } else {
            common.observerService.notify("showitems");
        }
    };
    app.onLogin = function () {
        this.log("app.onLogin");
        this.odnoklassniki.setCredentials(this.config.cred, this.oauth.credentials);
        this.odnoklassniki.update(true);
        timer.start();
    };
    app.onLogout = function () {
        timer.stop();
        common.observerService.notify("throbber");
        common.observerService.notify("display");
    };
    app.onNeedNotify = function () {
        return this.notifier.enabled;
    };
    app.onUpdate = function () {
        common.observerService.notify("throbber");
        common.observerService.notify("display");
        timer.setExpanding(false);
    };
    app.onUpdateError = function (status, text) {
        this.log("onUpdateError: " + status + " " + text);
        common.observerService.notify("throbber");
        if (status == 401) {
            this.log("refresh token");
            this.oauth.refreshToken();
        } else {
            timer.setExpanding(status > 0);
        }
    };
    app.onNotify = function () {
        this.notifier.popup(this.getUserData());
    };
    app.onLocationChange = function (url) {
        if (app.config.rxServiceUrl.test(url)) {
            this.odnoklassniki.saveCurrentTime();
        }
    };
    app.uiCommands = {
        "auth": function (command, eventData) {
            this.oauth.login(true);
        },
        "quit": function () {
            this.oauth.logout();
        },
        "update": function (command, eventData) {
            if (this.odnoklassniki.updating) {
                return;
            }
            common.observerService.notify("throbber", eventData.param);
            this.odnoklassniki.update(true);
        }
    };
    app.canShowNotifications = function () {
        return common.ui.canShowNotifications();
    };
    app.isAuth = function () {
        return !!this.oauth.credentials;
    };
    app.updating = function () {
        return this.odnoklassniki.updating;
    };
    app.getUserData = function () {
        return this.isAuth() ? this.odnoklassniki.userData : null;
    };
};
