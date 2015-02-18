"use strict";
const EXPORTED_SYMBOLS = ["feeds"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
var utils;
const feeds = {
    _DEFAULT_FILE_PATH: "native/fx/templates",
    _FEEDS_GROUPS_LIST_URL: "https://mail.yandex.ru/lenta/bar/count",
    _FEEDS_GROUPS_LIST_XSL: "feedsmenulist.xsl",
    init: function Feeds_init(api, expiredDays) {
        if (!this._initialized) {
            this._initialized = true;
            this._api = api;
            Cu.import(this._api.Package.resolvePath("/native/fx/modules/common-auth/utils.jsm"));
            utils.NotificationSource.objectMixIn(this);
        }
    },
    _initialized: false,
    _api: null,
    requireFeedsGroupsList: function Feeds_requestFeedsGroupsList(listener) {
        this.addListener("feedsGroups", listener);
        utils.sendRequest(this._FEEDS_GROUPS_LIST_URL, { callbackFunc: this._onFeedsGroupsListResponse.bind(this) });
    },
    _onFeedsGroupsListResponse: function Feeds__onFeedsGroupsListResponse(req) {
        let xslFeedsGroupsListDoc = this._xslFeedsGroupsListDoc;
        let destDoc = this._api.XMLUtils.getDOMParser(null, null, true).parseFromString("<emptyDoc/>", "text/xml");
        let xulFrag = null;
        if (!utils.isReqError(req)) {
            let responseXMLDoc = req.target.responseXML;
            xulFrag = this._api.XMLUtils.transformXMLToFragment(responseXMLDoc, xslFeedsGroupsListDoc, destDoc);
        } else {
            let parser = this._api.XMLUtils.getDOMParser();
            xulFrag = this._api.XMLUtils.transformXMLToFragment(parser.parseFromString("<error/>", "text/xml"), xslFeedsGroupsListDoc, destDoc);
        }
        this._notifyListeners("feedsGroups", xulFrag);
    },
    ignoreFeedsGroupsService: function Feeds_ignoreFeedsGroupsService(listener) {
        this.removeListener("feedsGroups", listener);
    },
    getFeedsMenuList: function Feeds_getFeedsMenuList() {
        const WM = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        let window = WM.getMostRecentWindow("navigator:browser");
        let srcDoc = this._api.XMLUtils.getDOMParser().parseFromString("<feeds/>", "text/xml");
        let feeds = "feeds" in window.gBrowser.mCurrentBrowser ? window.gBrowser.mCurrentBrowser.feeds : null;
        if (feeds) {
            for (let [
                        ,
                        feed
                    ] in Iterator(feeds)) {
                let baseTitle = feed.title || feed.href;
                let feedElement = srcDoc.createElement("feed");
                feedElement.setAttribute("label", baseTitle);
                feedElement.setAttribute("href", feed.href);
                srcDoc.documentElement.appendChild(feedElement);
            }
        }
        let destDoc = this._api.XMLUtils.getDOMParser(null, null, true).parseFromString("<emptyDoc/>", "text/xml");
        return this._api.XMLUtils.transformXMLToFragment(srcDoc, this._xslFeedsGroupsListDoc, destDoc);
    },
    insertNewFeed: function Feeds_insertNewFeed(data) {
        utils.sendRequest("https://mail.yandex.ru/lenta/bar/feed_add", {
            callbackFunc: this._feedsInsertNewItemCallback.bind(this, data),
            data: "url=" + encodeURIComponent(data.url) + "&group_id=" + encodeURIComponent(data.groupId) + "&yasoft=" + encodeURIComponent(this._api.Environment.addon.type)
        });
    },
    insertNewGroup: function Feeds_insertNewGroup(data) {
        if (data.groupTitle && data.groupTitle !== "") {
            utils.sendRequest("https://mail.yandex.ru/lenta/bar/group_add", {
                callbackFunc: this._feedsInsertNewGroupCallback.bind(this, data),
                data: "title=" + encodeURIComponent(data.groupTitle) + "&yasoft=" + encodeURIComponent(this._api.Environment.addon.type)
            });
        }
    },
    _feedsInsertNewGroupCallback: function Feeds_feedsInsertNewGroupCallback(data, req) {
        let error;
        if (utils.isReqError(req)) {
            error = "errorNewGroup1";
        } else {
            let groupId = this._api.XMLUtils.queryXMLDoc("//status/added/@id", req.target.responseXML);
            if (groupId.length) {
                data.groupId = groupId[0].value;
            } else {
                error = "errorNewGroup2";
            }
        }
        return error ? data.callback(error) : this.insertNewFeed(data);
    },
    _feedsInsertNewItemCallback: function Feeds_feedsInsertNewItemCallback(data, req) {
        this.feedsLastGroupId = data.group_id;
        let error;
        if (utils.isReqError(req)) {
            error = "errorNewItem1";
        } else {
            let ok = this._api.XMLUtils.queryXMLDoc("//ok", req.target.responseXML);
            if (!ok.length) {
                error = "errorNewItem2";
            }
        }
        return data.callback(error);
    },
    get _xslFeedsGroupsListDoc() {
        try {
            let filePath = this._DEFAULT_FILE_PATH + "/" + this._FEEDS_GROUPS_LIST_XSL;
            let channel = this._api.Package.getFileInputChannel(filePath);
            let xslDoc = this._api.XMLUtils.xmlDocFromStream(channel.contentStream, utils.newURI(this._api.Package.resolvePath(filePath), null, null), null, true);
            delete this._xslFeedsGroupsListDoc;
            this.__defineGetter__("_xslFeedsGroupsListDoc", function () {
                return xslDoc;
            });
            return xslDoc;
        } catch (ex) {
            this._api.logger.error(ex);
        }
        return null;
    },
    _getModule: function Feeds__getModule(moduleName, modulePath) {
        let mScope = {};
        Cu.import(this._api.Package.resolvePath(modulePath), mScope);
        let module = mScope[moduleName];
        if (!module) {
            throw new Error("No module '" + moduleName + "' in " + modulePath);
        }
        if (typeof module.init == "function") {
            module.init(this._api);
        }
        return module;
    }
};
