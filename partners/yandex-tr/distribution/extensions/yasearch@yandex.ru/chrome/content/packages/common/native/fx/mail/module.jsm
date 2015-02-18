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
        return this.authAdapter.authManager;
    },
    get API() {
        return this._api;
    },
    get canShowNotifications() {
        return this.API.Environment.os.name !== "linux";
    },
    init: function MailWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        this._pkgRootURL = api.Package.resolvePath("/");
        this._loadModules();
        this.authManager.addListener(this.authManager.EVENTS.AUTH_STATE_CHANGED, this);
    },
    finalize: function MailWidget_finalize() {
        this.authManager.removeListener(this.authManager.EVENTS.AUTH_STATE_CHANGED, this);
        delete this._pkgRootURL;
        delete this.utils;
        delete this._api;
        delete this._logger;
        delete this.__stringBundle;
    },
    buildWidget: function MailWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
        if (this.authManager.authorized) {
            this._createInstSlice(WIID);
        }
    },
    destroyWidget: function MailWidget_destroyWidget(WIID, item, context) {
        try {
            if (typeof item.destroy == "function") {
                item.destroy();
            }
        } finally {
            item.removeAttribute("yb-native-widget-name");
            item.removeAttribute("yb-native-widget-wiid");
        }
    },
    onNoMoreInstProjections: function MailWidget_onNoMoreInstProjections(WIID) {
        this._destroyInstSlice(WIID);
    },
    Settings: {
        getMainTemplate: function MailWidget_getMainTemplate(aWidgetUnitName, aWidgetInstanceId) {
            return core.API.Package.getFileInputChannel("/native/fx/mail/settings.xml").contentStream;
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
    getPref: function MailWidget_getPref(strPrefName, defaultValue) {
        return this.API.Settings.getValue(strPrefName);
    },
    setPref: function MailWidget_setPref(strPrefName, strPrefValue) {
        this.API.Settings.setValue(strPrefName, strPrefValue);
    },
    mailto: function MailWidget_mailto(event, mailAddress) {
        let strMailURL = this.getYaMailURL();
        let mailURL = strMailURL + "compose?mailto=" + encodeURIComponent(mailAddress.replace(/^mailto\:/, ""));
        this._navigateToMailURL(mailURL, event);
    },
    onButtonClick: function MailWidget_onButtonClick(event, widget) {
    },
    refreshData: function MailWidget_refreshData(event, callback) {
    },
    sendPageToYaMail: function MailWidget_sendPageToYaMail(event) {
        let url = this.getYaMailURL() + "compose";
        this._sendPage(url, event);
    },
    openAuthDialog: function MailWidget_openAuthDialog() {
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
    _navigateToMailURL: function MailWidget__navigateToMailURL(strMailURL, origEvent) {
        this.API.Controls.navigateBrowser({
            url: strMailURL,
            eventInfo: origEvent
        });
    },
    _makeSliceURL: function MailWidget__makeSliceURL(WIID) {
        return this._pkgRootURL + "native/fx/mail/slice/index.html";
    },
    _makeUsersDataForNotification: function MailWidget__makeUsersDataForNotification() {
        let auth = this.authManager;
        let defaultUser = auth.getTopUser();
        let usersData = {
            domain: auth.authdefs.DOMAINS.MAIN_DOMAIN,
            defaultUid: defaultUser && defaultUser.uid || "",
            list: []
        };
        auth.allUsers.filter(function (aUser) {
            return !aUser.isSocial;
        }).forEach(function (user) {
            usersData.list.push({
                uid: user.uid,
                login: user.login,
                displayName: user.displayName,
                isAuthorized: user.authorized
            });
        });
        return usersData;
    },
    _notifySliceAboutAllUsers: function MailWidget__notifySliceAboutAllUsers() {
        this._notifySlices({
            message: "user:all",
            data: this._makeUsersDataForNotification()
        });
    },
    _messageHandler: function MailWidget__messageHandler(aMessage) {
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
        case "user:logout": {
                this.authManager.initLogoutProcess(aMessage.data.uid);
                break;
            }
        case "user:login": {
                let {uid} = aMessage.data;
                if (uid) {
                    this.authManager.switchUser(uid);
                } else {
                    this.openAuthDialog();
                }
                break;
            }
        }
    },
    _createInstSlice: function MailWidget__createInstSlice(WIID) {
        if (this.mailSlices[WIID]) {
            return;
        }
        this.mailSlices[WIID] = this.API.Controls.createSlice({
            url: this._makeSliceURL(WIID),
            messageHandler: this._messageHandler.bind(this)
        }, WIID);
    },
    _destroyInstSlice: function MailWidget__destroyInstSlice(WIID) {
        let slice = this.mailSlices[WIID];
        if (slice) {
            slice.destroy();
            delete this.mailSlices[WIID];
        }
    },
    _notifySlices: function MailWidget__notifySlices(aData) {
        for (let [
                    ,
                    slice
                ] in Iterator(this.mailSlices)) {
            slice.notify(aData);
        }
    },
    getYaMailURL: function MailWidget_getYaMailURL() {
        return "https://" + this._MAIL_HOST + "/";
    },
    _getBuildMailURL: function MailWidget__getBuildMailURL(strDomain) {
        return this.getYaMailURL() + "message?ids=";
    },
    _sendPage: function MailWidget__sendPage(strURL, origEvent) {
        let currentWindow = this.utils.mostRecentBrowserWindow;
        let dataToSend = {
            body: this.utils.getDocumentDescription(currentWindow.content.document) + currentWindow.content.location.href,
            subject: currentWindow.content.document.title
        };
        let strParams = "subject=" + encodeURIComponent(dataToSend.subject.substr(0, 1000000)) + "&body=" + encodeURIComponent(dataToSend.body.substr(0, 1000000));
        if (strParams.length > 8192 && /^https?:\/\/mail\.yandex\./.test(strURL)) {
            strURL = strURL.replace("/compose?", "/classic/compose?");
        }
        let stringStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        stringStream.setData(strParams, strParams.length);
        let postData = Cc["@mozilla.org/network/mime-input-stream;1"].createInstance(Ci.nsIMIMEInputStream);
        postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
        postData.addContentLength = true;
        postData.setData(stringStream);
        this.API.Controls.navigateBrowser({
            target: "new tab",
            url: strURL,
            eventInfo: origEvent,
            postData: postData
        });
    },
    shareContent: function MailWidget_shareContent(shareData, event) {
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
    _send: function MailWidget__send(url, dataToSend) {
        let postParams = [];
        for (let [
                    paramName,
                    paramValue
                ] in Iterator(dataToSend)) {
            if (paramName && paramValue) {
                postParams.push(paramName + "=" + encodeURIComponent(paramValue.substr(0, 1000000)));
            }
        }
        postParams = postParams.join("&");
        let postStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        postStream.setData(postParams, postParams.length);
        let postData = Cc["@mozilla.org/network/mime-input-stream;1"].createInstance(Ci.nsIMIMEInputStream);
        postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
        postData.addContentLength = true;
        postData.setData(postStream);
        this.API.Controls.navigateBrowser({
            url: url,
            target: "new tab",
            postData: postData
        });
    },
    _getDescriptionMeta: function MailWidget__getDescriptionMeta(doc) {
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
    observe: function MailWidget_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case this.authManager.EVENTS.AUTH_STATE_CHANGED:
            if (this.authManager.authorized) {
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
        utils: "common-auth/utils.jsm",
        dlgman: "dlgman.jsm",
        authAdapter: "yauth.jsm"
    },
    _loadModules: function MailWidget__loadModules() {
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
