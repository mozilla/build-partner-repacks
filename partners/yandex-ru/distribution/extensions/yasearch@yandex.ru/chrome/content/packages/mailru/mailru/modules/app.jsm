EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    app.config = {
        useClickStatistics: true,
        observeBranding: false,
        uniqueWidget: true,
        navigateUrl: {
            inbox: "http://e.mail.ru/cgi-bin/msglist?folder=0",
            read: "http://e.mail.ru/cgi-bin/msglist?folder=0",
            compose: "http://e.mail.ru/cgi-bin/sentmsg?compose",
            addressbook: "http://e.mail.ru/cgi-bin/addressbook"
        },
        appCredentials: {
            client_id: "642290",
            private_key: "675bf0e42caef0d1b1a7b8f903c40be2",
            secret_key: "337f8e24312e12f3c381e5dad1a4a562"
        }
    };
    var timer;
    app.init = function () {
        this.log("*** init");
        this.oauth = this.importModule("oauth");
        this.mailru = this.importModule("api");
        this.mailru.init(this);
        this.oauth.init(this, this.config.appCredentials);
        timer = common.timers.create(5 * 60 * 1000, this._updateData, this);
    };
    app.dayuseStatProvider = {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return app.isAuth();
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return common.loginManager.hasSavedLogins({ formSubmitURL: "https://auth.mail.ru" });
        }
    };
    app.onSettingChange = function (key, value, instanceId) {
        if (key == "update-interval") {
        } else {
            common.observerService.notify("showitems");
        }
    };
    app.onLogin = function (newLogin) {
        this.log("app.onLogin");
        this.mailru.setCredentials(this.config.appCredentials, this.oauth.credentials);
        this.mailru.update(newLogin);
        if (newLogin) {
            timer.setExpanding(false);
        }
        timer.start();
    };
    app.onLogout = function () {
        timer.stop();
        this.mailru.clearData();
        common.observerService.notify("throbber");
        common.observerService.notify("display");
    };
    app.onUpdate = function (error) {
        common.observerService.notify("throbber");
        common.observerService.notify("display");
        timer.setExpanding(error ? error.status > 0 : false);
        if (this.mailru.userData) {
            this.oauth.setEMail(this.mailru.userData.mail);
        }
        if (error) {
            this.logObj(error);
            if (error.text == "code_102") {
                this.logr("error 102, update token");
                this.oauth.updateToken();
            }
        }
    };
    app.uiCommands = {
        "auth": function () {
            this.oauth.login(true);
        },
        "logout": function () {
            this.oauth.logout();
        },
        "update": function () {
            this._updateData(true);
        }
    };
    app.isAuth = function () {
        return !!this.oauth.credentials;
    };
    app.getUserData = function () {
        return this.isAuth() ? this.mailru.userData : null;
    };
    app._updateData = function (fromXB) {
        if (fromXB) {
            common.observerService.notify("throbber", true);
        }
        if (this.mailru.updating) {
            return;
        }
        this.log("updateData");
        this.oauth.testCredentials();
    };
};
