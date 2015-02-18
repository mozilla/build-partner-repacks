EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function tplYM(url) {
        return function (email) {
            return url.replace("{domain}", app.config.domains.ymail).replace("{email}", email || "");
        };
    }
    app.config = {
        useClickStatistics: true,
        observeBranding: false,
        uniqueWidget: true,
        navigateUrl: {
            inbox: "https://gmail.com/",
            compose: "https://mail.google.com/mail/#compose",
            addressbook: "https://mail.google.com/mail/#contacts",
            ymail: tplYM("http://mail.yandex.{domain}/neo2/#setup/collectors/email={email}")
        },
        domains: {
            ymail: "ru",
            locale: {
                be: { ymail: "by" },
                uk: { ymail: "ua" },
                kk: { ymail: "kz" }
            }
        },
        enableNotifications: false,
        branding: {
            tb: {
                domains: { ymail: "com.tr" },
                enableNotifications: true
            }
        },
        rxServiceUrl: /^https?:\/\/mail\.google\.com\/mail\//i
    };
    app.Settings = {
        getMainTemplate: function CoreSettings_getMainTemplate(aWidgetUnitName, aWidgetInstanceId) {
            if (!app.canShowNotifications())
                return null;
            return common.utils.readFile("content/settings.xml");
        }
    };
    app.dayuseStatProvider = {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return app.isAuth();
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return common.loginManager.hasSavedLogins({ formSubmitURL: "https://accounts.google.com" });
        },
        isNotificationsEnabled: function dayuseStatProvider_isNotificationsEnabled() {
            return app.canShowNotifications() && app.api.Settings.getValue("show-notifications") === true;
        }
    };
    var timer;
    var firstUpdateAfterLogin = false;
    function popupData() {
        app.notif.popup(app.gmail.userData);
    }
    app.init = function () {
        this.log("*** init");
        this.gmail = this.importModule("api");
        this.notif = this.importModule("notifications").init();
        this.gmail.init(this);
        timer = common.timers.create(5 * 60 * 1000, this._updateData, this);
        this.gmail.update();
    };
    app.onSettingChange = function (key, value, instanceId) {
        if (key == "update-interval") {
        } else {
            if (key != "show-notifications") {
                common.observerService.notify("showitems");
            }
        }
    };
    app.onLogin = function (newLogin) {
        timer.start();
        firstUpdateAfterLogin = true;
    };
    app.onLogout = function () {
        timer.stop();
        firstUpdateAfterLogin = false;
    };
    app.onUpdate = function () {
        this.logObj(this.gmail.userData, "onUpdate: ");
        common.observerService.notify("throbber");
        common.observerService.notify("display");
        timer.setExpanding(false);
        this.log("this.notif.popup();");
        if (firstUpdateAfterLogin) {
            common.timers.setTimeout(popupData, 1500);
        } else {
            popupData();
        }
        firstUpdateAfterLogin = false;
    };
    app.onUpdateError = function (status) {
        common.observerService.notify("throbber");
        common.observerService.notify("display");
        timer.setExpanding(status > 0);
    };
    app.uiCommands = {
        update: function () {
            this._updateData(true);
        }
    };
    app.onLocationChange = function (url) {
        if (app.config.rxServiceUrl.test(url)) {
            this.gmail.saveCurrentTime();
        }
    };
    app.canShowNotifications = function () {
        return app.config.enableNotifications && common.ui.canShowNotifications();
    };
    app.isAuth = function () {
        return this.gmail.isAuth();
    };
    app.getUserData = function () {
        return this.gmail.userData;
    };
    app._updateData = function (fromXB) {
        if (fromXB) {
            common.observerService.notify("throbber", true);
        }
        if (this.gmail.updating) {
            return;
        }
        this.log("updateData");
        this.gmail.update();
    };
};
