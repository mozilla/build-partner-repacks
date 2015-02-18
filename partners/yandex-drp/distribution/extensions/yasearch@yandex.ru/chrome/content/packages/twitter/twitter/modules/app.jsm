EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var SLICE_URL = "content/slice/application.html";
    var slice = null;
    var sliceOpen = false;
    app.init = function () {
        this.log("*** init");
        sliceOpen = false;
        this.hasNewDataItems = false;
        this.credStorage = common.storage("settings.json");
        this.URI = common.resolvePath("/");
        this.utils = this.importModule("utils");
        this.importModule("slice-commands");
        var TwitterAPIConstructor = this.importModule("twitter-api");
        this.twitterAccount = new TwitterAPIConstructor(this);
        if (!this.twitterAccount.setSavedCredentials(this.credStorage.accountData)) {
            this.credStorage.clear().save();
        }
    };
    app.finalize = function () {
        this.destroySlice();
    };
    app.dayuseStatProvider = {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return app.isAuth();
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            return common.loginManager.hasSavedLogins({ formSubmitURL: "https://twitter.com" });
        }
    };
    app.onSettingChange = function (key, value, instanceId) {
        if (key != "update-interval") {
            common.observerService.notify("display");
        }
    };
    app.onLogin = function () {
        this.credStorage.save("accountData", {
            type: "twitter",
            active: true,
            credentials: this.twitterAccount.credentials,
            displayName: this.twitterAccount.displayName
        });
        common.observerService.notify("display");
        sliceOpen = false;
        slice = this.api.Controls.createSlice({
            url: this.URI + SLICE_URL,
            messageHandler: onSliceMsg
        }, this.WIID);
    };
    app.onLogout = function () {
        sliceOpen = false;
        this.destroySlice();
        this.credStorage.clear().save();
        common.observerService.notify("display");
    };
    app.onLoginError = function (err) {
        this.logr("oauth error " + err);
    };
    var onSliceMsg = function (aMessage) {
        var handler = app.sliceCommands[aMessage.message || aMessage];
        if (handler) {
            handler.call(app, aMessage.data, aMessage.message || aMessage);
        }
    };
    app.uiCommands = {
        auth: function (command, eventData) {
            this.twitterAccount.connect();
        },
        slice: function (command, eventData) {
            this.showSlice(eventData.widget);
        }
    };
    app.destroySlice = function () {
        if (slice) {
            slice.destroy();
            slice = null;
        }
    };
    app.isAuth = function () {
        return this.twitterAccount.active;
    };
    app.getUserName = function () {
        return this.twitterAccount.displayName || "";
    };
    app.notifySlice = function (p) {
        if (slice) {
            slice.notify(p);
        }
    };
    var msgPopup = { message: "before-popup" };
    var msgHide = { message: "before-hide" };
    app.showSlice = function (widget) {
        this.log("showSlice");
        if (slice) {
            if (!sliceOpen) {
                sliceOpen = true;
                msgPopup.data = { url: common.ui.getCurrentURL() };
                slice.notify(msgPopup);
                slice.show(widget, function onHide() {
                    sliceOpen = false;
                    slice.notify(msgHide);
                });
            }
        }
    };
};
