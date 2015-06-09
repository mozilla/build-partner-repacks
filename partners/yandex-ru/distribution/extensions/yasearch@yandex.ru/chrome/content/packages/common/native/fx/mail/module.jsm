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
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#mail";
const core = {
    counterValue: 0,
    mailSlices: Object.create(null),
    get authManager() {
        return this.API.Passport;
    },
    get API() {
        return this._api;
    },
    get canShowNotifications() {
        return this.API.Environment.os.name !== "linux";
    },
    init: function (api) {
        this._api = api;
        this._logger = api.logger;
        this._pkgRootURL = api.Package.resolvePath("/");
        this._loadModules();
        this.authManager.addListener(this.authManager.EVENTS.AUTH_STATE_CHANGED, this);
    },
    finalize: function () {
        this.authManager.removeListener(this.authManager.EVENTS.AUTH_STATE_CHANGED, this);
        delete this._pkgRootURL;
        delete this.utils;
        delete this._api;
        delete this._logger;
        delete this.__stringBundle;
    },
    buildWidget: function (WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
        if (this.authManager.isAuthorized()) {
            this._createInstSlice(WIID);
        }
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
    onNoMoreInstProjections: function (WIID) {
        this._destroyInstSlice(WIID);
    },
    Settings: {
        getMainTemplate: function (aWidgetUnitName, aWidgetInstanceId) {
            return core.API.Package.getFileInputChannel("/native/fx/mail/settings.xml").contentStream;
        }
    },
    dayuseStatProvider: {
        isAuthorized: function () {
            return core.authManager.isAuthorized();
        },
        hasSavedLogins: function () {
            return core.authManager.hasSavedLogins();
        },
        isNotificationsEnabled: function () {
            return core.canShowNotifications && core.getPref("showTextAlert", true) === true;
        }
    },
    getPref: function (strPrefName, defaultValue) {
        return this.API.Settings.getValue(strPrefName);
    },
    setPref: function (strPrefName, strPrefValue) {
        this.API.Settings.setValue(strPrefName, strPrefValue);
    },
    mailto: function (event, mailAddress) {
        let strMailURL = this.getYaMailURL();
        let mailURL = strMailURL + "compose?mailto=" + encodeURIComponent(mailAddress.replace(/^mailto\:/, ""));
        this._navigateToMailURL(mailURL, event);
    },
    onButtonClick: function (event, widget) {
    },
    refreshData: function (event, callback) {
    },
    sendPageToYaMail: function (event) {
        let url = this.getYaMailURL() + "compose";
        this._sendPage(url, event);
    },
    openAuthDialog: function () {
        this.authManager.openAuthDialog({ retpath: this.getYaMailURL() });
    },
    __stringBundle: null,
    _MAX_UNREAD_MAIL: 30,
    get _MAIL_HOST() {
        let mailHost = this.API.Localization.createStringBundle("/urls/mail.properties").get("MailHost");
        delete this._MAIL_HOST;
        return this._MAIL_HOST = mailHost;
    },
    get _stringBundle() {
        return this.__stringBundle || (this.__stringBundle = this.API.Localization.createStringBundle("/native/fx/mail.properties"));
    },
    _navigateToMailURL: function (strMailURL, origEvent) {
        this.API.Controls.navigateBrowser({
            url: strMailURL,
            eventInfo: origEvent
        });
    },
    _makeSliceURL: function (WIID) {
        return this._pkgRootURL + "native/fx/mail/slice/index.html";
    },
    _makeUsersDataForNotification: function () {
        let defaultAccount = this.authManager.defaultAccount;
        let accountsData = {
            domain: this.authManager.authdefs.DOMAINS.MAIN_DOMAIN,
            defaultUid: defaultAccount && defaultAccount.uid || "",
            list: []
        };
        this.authManager.allAccounts.filter(function (aAccount) {
            return !aAccount.isSocial;
        }).forEach(function (aAccount) {
            accountsData.list.push({
                uid: aAccount.uid,
                login: aAccount.login,
                displayName: aAccount.displayName,
                isAuthorized: aAccount.authorized
            });
        });
        return accountsData;
    },
    _notifySliceAboutAllUsers: function () {
        this._notifySlices({
            message: "user:all",
            data: this._makeUsersDataForNotification()
        });
    },
    _messageHandler: function (aMessage) {
        switch (aMessage.message) {
        case "mail:data":
            this.counterValue = aMessage.data.count;
            this.API.Controls.getAllWidgetItems().forEach(function (item) {
                if ("updateCounterText" in item) {
                    item.updateCounterText(this.counterValue);
                }
            }, this);
            break;
        case "user:get-all":
            this._notifySliceAboutAllUsers();
            break;
        case "user:auth-error":
            this.authManager.logoutAccount(aMessage.data.uid, { silent: true });
            break;
        case "user:logout":
            this.authManager.logoutAccount(aMessage.data.uid);
            break;
        case "user:login": {
                let {uid} = aMessage.data;
                if (uid) {
                    this.authManager.switchAccount(uid);
                } else {
                    this.openAuthDialog();
                }
                break;
            }
        }
    },
    _createInstSlice: function (WIID) {
        if (this.mailSlices[WIID]) {
            return;
        }
        this.mailSlices[WIID] = this.API.Controls.createSlice({
            url: this._makeSliceURL(WIID),
            messageHandler: this._messageHandler.bind(this)
        }, WIID);
    },
    _destroyInstSlice: function (WIID) {
        let slice = this.mailSlices[WIID];
        if (slice) {
            slice.destroy();
            delete this.mailSlices[WIID];
        }
    },
    _notifySlices: function (aData) {
        for (let [
                    ,
                    slice
                ] in Iterator(this.mailSlices)) {
            slice.notify(aData);
        }
    },
    getYaMailURL: function () {
        return "https://" + this._MAIL_HOST + "/";
    },
    _getBuildMailURL: function (strDomain) {
        return this.getYaMailURL() + "message?ids=";
    },
    _sendPage: function (strURL, origEvent) {
        let currentWindow = this.utils.mostRecentBrowserWindow;
        let dataToSend = {
            body: this.utils.getDocumentDescription(currentWindow.content.document) + currentWindow.content.location.href,
            subject: currentWindow.content.document.title
        };
        let strParams = "subject=" + encodeURIComponent(dataToSend.subject.substr(0, 1000000)) + "&body=" + encodeURIComponent(dataToSend.body.substr(0, 1000000));
        if (strParams.length > 8192 && /^https?:\/\/mail\.yandex\./.test(strURL)) {
            strURL = strURL.replace("/compose?", "/classic/compose?");
        }
        this.API.Controls.navigateBrowser({
            target: "new tab",
            url: strURL,
            eventInfo: origEvent,
            postData: strParams
        });
    },
    shareContent: function (shareData, event) {
        const LINE_BREAK = "\n\n";
        const srcChromeWnd = event.target.ownerDocument.defaultView;
        const sharedDoc = srcChromeWnd.content.document;
        let dataToSend = {
            body: "",
            subject: "",
            url: ""
        };
        let pageAddress = srcChromeWnd.content.location.href;
        let srcLine = this._stringBundle.get("sendContentSource", [pageAddress + LINE_BREAK]);
        switch (shareData.contentType) {
        case "SharePage": {
                dataToSend.url = pageAddress;
                dataToSend.subject = sharedDoc.title;
                let sharedDocDescr = this._getDescriptionMeta(sharedDoc);
                if (sharedDocDescr) {
                    dataToSend.body = sharedDocDescr + LINE_BREAK;
                }
                dataToSend.body += pageAddress;
                break;
            }
        case "ShareSelection": {
                let imgHintTemplate = this._stringBundle.get("sendImageTemplate");
                dataToSend.body = srcLine + this.utils.getSelectionString(srcChromeWnd, imgHintTemplate);
                break;
            }
        case "ShareImage": {
                let imgData = shareData.image;
                if (imgData) {
                    dataToSend.body = srcLine + "<img src='" + imgData.imageURL + "' " + "alt='" + (imgData.imageName || imgData.imageURL) + "' " + "title='" + imgData.imageName + "' " + "/>";
                    dataToSend.message_type = "html";
                }
                break;
            }
        }
        this._send(this.getYaMailURL() + "compose?mailto=", dataToSend);
    },
    _send: function (url, dataToSend) {
        let postParams = [];
        for (let [
                    paramName,
                    paramValue
                ] in Iterator(dataToSend)) {
            if (paramName && paramValue) {
                postParams.push(paramName + "=" + encodeURIComponent(paramValue.substr(0, 1000000)));
            }
        }
        this.API.Controls.navigateBrowser({
            url: url,
            target: "new tab",
            postData: postParams.join("&")
        });
    },
    _getDescriptionMeta: function (doc) {
        let metaElements = doc.getElementsByTagName("meta");
        for (let i = 0, len = metaElements.length; i < len; i++) {
            let metaElement = metaElements[i];
            let metaName = (metaElement.name || "").toLowerCase();
            if (metaName == "description" && metaElement.content) {
                return metaElement.content;
            }
        }
        return null;
    },
    observe: function (aSubject, aTopic, aData) {
        switch (aTopic) {
        case this.authManager.EVENTS.AUTH_STATE_CHANGED:
            if (this.authManager.isAuthorized()) {
                this.API.Controls.getAllWidgetItems().forEach(function (item) {
                    if ("updateCounterText" in item) {
                        item.updateCounterText(this.counterValue);
                    }
                    this._createInstSlice(item.getAttribute("yb-native-widget-wiid"));
                }, this);
            } else {
                this.counterValue = 0;
                this.API.Controls.getAllWidgetItems().forEach(function (item) {
                    if ("updateCounterText" in item) {
                        item.updateCounterText(this.counterValue);
                    }
                    this._destroyInstSlice(item.getAttribute("yb-native-widget-wiid"));
                }, this);
            }
            this._notifySliceAboutAllUsers();
            break;
        }
    },
    _MODULES: {
        utils: "utils.jsm",
        dlgman: "dlgman.jsm"
    },
    _loadModules: function () {
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
