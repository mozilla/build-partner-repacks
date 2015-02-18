EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function urlFriends(url, urlReq) {
        return function (p) {
            return p == "all" ? url : urlReq;
        };
    }
    app.config = {
        useClickStatistics: true,
        observeBranding: false,
        uniqueWidget: true,
        navigateUrl: {
            main: "http://www.facebook.com/",
            profile: "http://www.facebook.com/profile.php?id={PARAM}",
            news: "http://www.facebook.com/home.php?sk=nf",
            wall: "http://www.facebook.com/profile.php?id={PARAM}&sk=wall",
            friends: urlFriends("http://www.facebook.com/friends/", "https://www.facebook.com/friends/requests/"),
            messages: "http://www.facebook.com/messages/",
            message_thread: "http://www.facebook.com/messages/{PARAM}",
            notifications: "http://www.facebook.com/notifications.php",
            notification: "http://www.facebook.com/notifications.php",
            photos: "http://www.facebook.com/home.php?sk=media",
            videos: "http://www.facebook.com/home.php?sk=video",
            media: "http://www.facebook.com/home.php?sk=media",
            notes: "http://www.facebook.com/notes/",
            groups: "http://www.facebook.com/groups/",
            events: "http://www.facebook.com/events/"
        },
        FBdomain: {
            api: "https://api.facebook.com/",
            api_read: "https://api-read.facebook.com/",
            cdn: "http://static.ak.fbcdn.net/",
            https_cdn: "https://s-static.ak.fbcdn.net/",
            graph: "https://graph.facebook.com/",
            staticfb: "http://static.ak.facebook.com/",
            https_staticfb: "https://s-static.ak.facebook.com/",
            www: "http://www.facebook.com/",
            https_www: "https://www.facebook.com/"
        },
        credentials: {
            client_id: "132922660054643",
            redirect_uri: "http://yandex.ru/ECC39565E4D14833A5194891B2815746/BA3F557F7135430187C7EEFC829B5ECE"
        },
        branding: {},
        rxServiceUrl: /^https?:\/\/(www\.)?facebook\.com\//i
    };
    app.Settings = {
        getMainTemplate: function CoreSettings_getMainTemplate(aWidgetUnitName, aWidgetInstanceId) {
            return common.utils.readFile("content/settings.xml").replace("{component}", app.componentName);
        }
    };
    app.dayuseStatProvider = {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return app.isAuth();
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return common.loginManager.hasSavedLogins({ formSubmitURL: "https://www.facebook.com" });
        },
        isNotificationsEnabled: function dayuseStatProvider_isNotificationsEnabled() {
            return app.canShowNotifications() && app.api.Settings.getValue("show-notifications") === true;
        }
    };
    var timer = null;
    var INTERVAL_MS = 5 * 60 * 1000;
    app.init = function () {
        this.log("*** init");
        this.fb = this.importModule("api");
        this.oauth = this.importModule("oauth");
        this.notifier = this.importModule("notifications").init();
        this.fb.init(this);
        this.oauth.init(this);
        if (!this.api.Settings.getValue("show-notifications")) {
            [
                "messages",
                "friends",
                "notifications"
            ].forEach(function (a) {
                this.setValue("show-notif-" + a, false);
            }, this.api.Settings);
            this.api.Settings.setValue("show-notifications", true);
        }
        timer = common.timers.create(INTERVAL_MS, updateData, this);
    };
    app.onSettingChange = function (key, value, instanceId) {
        if (key == "update-interval") {
        } else {
            if (/^show-.+-button$/.test(key)) {
                common.observerService.notify("showitems");
            }
        }
    };
    app.onLogin = function (force) {
        this.fb.setCredentials(this.oauth.credentials);
        timer.start();
        this.fb.update(force);
    };
    app.onLogout = function () {
        timer.stop();
        this.fb.clearData();
        common.observerService.notify("throbber");
        common.observerService.notify("display");
    };
    app.onNeedNotify = function (type, testUrl) {
        return !type ? this.notifier.enabled : this.notifier.typeEnabled(type, testUrl);
    };
    app.onUpdate = function () {
        this.log("onUpdate");
        timer.setExpanding(false);
        common.observerService.notify("throbber");
        common.observerService.notify("display");
    };
    app.onNotify = function () {
        this.notifier.popup(this.getUserData());
    };
    app.onUpdateError = function (status, text) {
        this.log("onUpdateError: " + status + " " + text);
        timer.setExpanding(status > 0);
        if (status == 401 && text == "*token*") {
            this.logr("token expired, relogin");
            this.oauth.login();
        } else {
            common.observerService.notify("throbber");
            if (status == 403 && text == "*denied*") {
                this.logr("access denied, widget logout");
                this.oauth.logout(true);
            } else {
                common.observerService.notify("display");
            }
        }
    };
    app.uiCommands = {
        "auth": function (command, eventData) {
            if (!this.isAuth()) {
                this.oauth.login(true);
            }
        },
        "logout": function () {
            common.observerService.notify("throbber");
            this.oauth.logout();
        },
        "update": function (command, eventData) {
            if (this.fb.updating) {
                return;
            }
            this.log("update");
            common.observerService.notify("throbber", eventData.param);
            app.oauth.testCredentials(true);
        },
        "share": function () {
            this.oauth.showSharePage(common.ui.getCurrentURL());
        },
        "post": function () {
            this.oauth.showPostPage();
        }
    };
    app.onLocationChange = function (url) {
        if (app.config.rxServiceUrl.test(url)) {
            this.fb.saveCurrentTime();
        }
    };
    app.canShowNotifications = function () {
        return common.ui.canShowNotifications();
    };
    function updateData() {
        app.oauth.testCredentials();
    }
    app.isAuth = function () {
        return !!this.oauth.credentials;
    };
    app.getUserData = function () {
        return this.isAuth() ? this.fb.userData : null;
    };
};
