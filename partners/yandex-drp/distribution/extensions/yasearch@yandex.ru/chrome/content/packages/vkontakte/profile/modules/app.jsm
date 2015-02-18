EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    app.config = {
        useClickStatistics: true,
        statName: "vk",
        observeBranding: false,
        uniqueWidget: true,
        navigateUrl: {
            home: "http://vk.com/",
            messages: "http://vk.com/im",
            friends_new: "http://vk.com/friends?section=requests",
            friends: "http://vk.com/friends?section=all",
            events: "http://vk.com/events",
            groups: "http://vk.com/groups",
            photos: "http://vk.com/photos.php",
            video: "http://vk.com/video",
            notes: "http://vk.com/notes",
            audio: "http://vk.com/audio",
            news: "http://vk.com/feed",
            bookmarks: "http://vk.com/fave",
            ads: "http://vk.com/matches.php",
            opinions: "http://vk.com/opinions.php",
            applications: "http://vk.com/apps",
            questions: "http://vk.com/questions.php",
            comments: "http://vk.com/feed?section=comments",
            notifications: "http://vk.com/feed?section=notifications",
            mentions: "http://vk.com/feed?section=comments",
            topic: "http://vk.com/topic{PARAM}",
            wall: "http://vk.com/wall{PARAM}",
            thread: "http://vk.com/im?sel={PARAM}",
            message: "http://vk.com/mail?act=show&id={PARAM}",
            user: "http://vk.com/id{PARAM}",
            club: "http://vk.com/club{PARAM}"
        },
        credentials: { client_id: "2438613" },
        rxServiceUrl: /^https?:\/\/(www\.)?vk\.com\//i
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
            return common.loginManager.hasSavedLogins({ formSubmitURL: "https://login.vk.com" });
        },
        isNotificationsEnabled: function dayuseStatProvider_isNotificationsEnabled() {
            return app.canShowNotifications() && app.api.Settings.getValue("show-notifications") === true;
        }
    };
    var timer = null;
    app.init = function () {
        this.log("*** init");
        this.vk = this.importModule("api");
        this.oauth = this.importModule("oauth");
        this.notifications = this.importModule("notifications");
        this.notifications.init();
        this.vk.init(this);
        this.oauth.init(this, this.config.credentials);
        if (!this.api.Settings.getValue("show-notifications")) {
            [
                "message",
                "friend",
                "comment",
                "mention"
            ].forEach(function (a) {
                this.setValue("show-notif-" + a, false);
            }, this.api.Settings);
            this.api.Settings.setValue("show-notifications", true);
        }
        timer = common.timers.create(5 * 60 * 1000, function () {
            this.vk.update();
        }, this);
    };
    app.onSettingChange = function (key, value, instanceId) {
        if (key == "update-interval") {
        } else {
            if (/^display-/.test(key)) {
                common.observerService.notify("showitems");
            }
        }
    };
    app.onLogin = function () {
        this.vk.setCredentials(this.config.credentials, this.oauth.credentials);
        this.vk.update();
        timer.start();
    };
    app.onLogout = function () {
        timer.stop();
        this.vk.stopLongPoll();
        common.observerService.notify("throbber");
        common.observerService.notify("display");
    };
    app.onNeedNotify = function () {
        return this.notifications.enabled;
    };
    app.onUpdate = function () {
        common.observerService.notify("throbber");
        common.observerService.notify("display");
        timer.setExpanding(false);
    };
    app.onNotify = function () {
        this.notifications.popup(this.vk.userData);
    };
    app.onChangeMsgList = function () {
        common.observerService.notify("messages");
    };
    app.onUpdateError = function (status, text) {
        this.log("onUpdateError: " + status + " " + text);
        if (status == 400 && text == "token") {
            this.oauth.login();
        } else {
            common.observerService.notify("throbber");
            timer.setExpanding(status > 0);
            common.observerService.notify("display");
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
            if (this.vk.updating) {
                return;
            }
            common.observerService.notify("throbber", eventData.param);
            this.vk.update(true);
        }
    };
    app.canShowNotifications = function () {
        return common.ui.canShowNotifications();
    };
    app.isAuth = function () {
        return !!this.oauth.credentials;
    };
    app.getUserData = function () {
        return this.isAuth() ? {
            data: this.vk.userData,
            user: this.vk.userData.me._profile
        } : null;
    };
    app.getMsgText = function (msg) {
        if (msg.body) {
            return msg.body;
        }
        var _f = msg._profile && msg._profile.sex == 1 ? "_f" : "";
        return this.entities.text("vk.notify.messages_file" + _f);
    };
};
