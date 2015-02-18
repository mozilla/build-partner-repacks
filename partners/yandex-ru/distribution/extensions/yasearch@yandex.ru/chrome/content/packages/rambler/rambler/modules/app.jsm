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
        statName: "mailrambler",
        navigateUrl: {
            inbox: "http://mail.rambler.ru/",
            compose: "http://mail.rambler.ru/#/compose/?r=c132",
            addressbook: "http://mail.rambler.ru/mail/contacts.cgi?r=c132",
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
        branding: { tb: { domains: { ymail: "com.tr" } } },
        rxServiceUrl: /^https?:\/\/mail\.google\.com\/mail\//i
    };
    var timer;
    var firstUpdateAfterLogin = false;
    var INTERVAL_MS = 5 * 60 * 1000;
    app.init = function () {
        this.log("*** init");
        this.rambler = this.importModule("api");
        this.rambler.init(this);
        timer = common.timers.create(INTERVAL_MS, this._updateData, this);
        this.rambler.update();
    };
    app.dayuseStatProvider = {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return app.rambler.isAuth();
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return common.loginManager.hasSavedLogins({ formSubmitURL: "https://id.rambler.ru" });
        }
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
        this.logObj(this.rambler.userData, "onUpdate: ");
        common.observerService.notify("throbber");
        common.observerService.notify("display");
        timer.setExpanding(false);
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
            this.rambler.saveCurrentTime();
        }
    };
    app.canShowNotifications = function () {
        return app.config.enableNotifications && common.ui.canShowNotifications();
    };
    app.getUserData = function () {
        return this.rambler.userData;
    };
    app._updateData = function (fromXB) {
        if (fromXB) {
            common.observerService.notify("throbber", true);
        }
        if (this.rambler.updating) {
            return;
        }
        this.log("updateData");
        this.rambler.update();
    };
};
