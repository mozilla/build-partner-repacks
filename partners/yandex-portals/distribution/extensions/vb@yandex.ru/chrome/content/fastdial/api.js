(function (exports) {
    "use strict";
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const Cu = Components.utils;
    function typesCheck(args, types) {
        for (let i = 0; i < types.length; i++) {
            if (types[i] !== null && typeof args[i] !== types[i]) {
                throw new Error("Wrong value passed: " + args[i] + ", expected: " + types[i]);
            }
        }
    }
    let utils = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
    let outerWindowId = utils.outerWindowID;
    let wrappedWindow = new XPCNativeWrapper(window);
    let app = Cc["@yandex.ru/vb-core;1"].getService().wrappedJSObject.application;
    app.fastdial.setListenersForWindow(outerWindowId);
    let VBDOMObjectProto = {
        navigator: "firefox",
        get osName() {
            return app.core.Lib.sysutils.platformInfo.os.name;
        },
        get navigatorMajorVersion() {
            return parseInt(app.core.Lib.sysutils.platformInfo.browser.version, 10);
        },
        get locale() {
            return app.locale.language;
        },
        getLocalizedString: function VBDOMObject_getLocalizedString(key) {
            typesCheck(arguments, ["string"]);
            return app.fastdial.getLocalizedString(key);
        },
        requestSettings: function VBDOMObject_requestSettings(callback) {
            typesCheck(arguments, ["function"]);
            return app.fastdial.requestSettings(callback);
        },
        setBackgroundImage: function VBDOMObject_setBackgroundImage(bgImageId) {
            typesCheck(arguments, ["string"]);
            return app.backgroundImages.select(outerWindowId, bgImageId);
        },
        pinThumb: function VBDOMObject_pinThumb(index) {
            typesCheck(arguments, ["number"]);
            app.thumbs.changePinState(index, true);
        },
        unpinThumb: function VBDOMObject_unpinThumb(index) {
            typesCheck(arguments, ["number"]);
            app.thumbs.changePinState(index, false);
        },
        requestAppsList: function VBDOMObject_requestAppsList(callback) {
        },
        launchApp: function VBDOMObject_launchApp(id) {
        },
        requestClosedPagesList: function VBDOMObject_requestClosedPagesList(callback) {
            typesCheck(arguments, ["function"]);
            app.fastdial.requestRecentlyClosedTabs(callback);
        },
        restoreTab: function VBDOMObject_restoreTab(id) {
            typesCheck(arguments, ["string"]);
            app.fastdial.restoreTab(id);
        },
        requestLastVisited: function VBDOMObject_requestLastVisited(offset, callback) {
            typesCheck(arguments, [
                "number",
                "function"
            ]);
            app.thumbsSuggest.requestLastVisited(offset, callback);
        },
        requestPopularSites: function VBDOMObject_requestPopularSites(offset, callback) {
            typesCheck(arguments, [
                "number",
                "function"
            ]);
            app.thumbsSuggest.requestTopSites(offset, callback);
        },
        requestThumbData: function VBDOMObject_requestThumbData(url) {
            typesCheck(arguments, ["string"]);
            app.thumbsSuggest.requestThumbData(url);
        },
        applySettings: function VBDOMObject_applySettings(showBookmarks, showSearchForm, showAdvertisement, thumbStyle) {
            typesCheck(arguments, [
                "boolean",
                "boolean",
                "boolean",
                "number"
            ]);
            return app.fastdial.applySettings(showBookmarks, showSearchForm, showAdvertisement, thumbStyle);
        },
        setThumbsCount: function VBDOMObject_setThumbsCount(thumbsCount) {
            typesCheck(arguments, ["number"]);
            return app.fastdial.setThumbsCount(thumbsCount);
        },
        restoreThumbs: function VBDOMObject_restoreThumbs(thumbs) {
            typesCheck(arguments, ["object"]);
            return app.fastdial.restoreThumbs(thumbs);
        },
        setSendStatistics: function VBDOMObject_setSendStatistics(sendStat, isModalChoice) {
            typesCheck(arguments, [
                "boolean",
                "boolean"
            ]);
            app.statistics.sendUsageStat = sendStat;
        },
        saveThumb: function VBDOMObject_saveThumb(index, data) {
            typesCheck(arguments, [
                "number",
                "object"
            ]);
            app.thumbs.saveThumb(index, data);
        },
        removeThumb: function VBDOMObject_removeThumb(index) {
            typesCheck(arguments, ["number"]);
            app.thumbs.remove(index, { addToBlacklist: true });
        },
        swapThumbs: function VBDOMObject_swapThumb(oldIndex, newIndex) {
            typesCheck(arguments, [
                "number",
                "number"
            ]);
            app.thumbs.swap(oldIndex, newIndex);
        },
        requestInit: function VBDOMObject_requestInit() {
            app.fastdial.requestInit(outerWindowId);
        },
        uploadUserBackground: function VBDOMObject_uploadUserBackground(callback) {
            typesCheck(arguments, ["function"]);
            app.backgroundImages.upload(wrappedWindow, callback);
        },
        requestBookmarksBranch: function VBDOMObject_requestBookmarksBranch(id, callback) {
            typesCheck(arguments, [
                "string",
                "function"
            ]);
            if (id.length === 0) {
                throw new Error("bookmark folder ID cannot be empty");
            }
            app.bookmarks.requestBranch(id, callback);
        },
        openThumb: function VBDOMObject_openThumb(url, index, navigateCode) {
            typesCheck(arguments, [
                "string",
                "number",
                "number"
            ]);
            app.fastdial.thumbOpened(outerWindowId, url, index, navigateCode);
        },
        openSpeculativeConnect: function VBDOMObject_openSpeculativeConnect(url) {
            typesCheck(arguments, ["string"]);
            app.fastdial.openSpeculativeConnect(url);
        },
        navigateUrlWithReferer: function VBDOMObject_navigateUrlWithReferer(url, navigateCode) {
            typesCheck(arguments, [
                "string",
                "number"
            ]);
            app.fastdial.navigateUrlWithReferer(url, navigateCode);
        },
        setAsHomePage: function VBDOMObject_setAsHomePage() {
            app.fastdial.setAsHomePage();
        },
        log: function VBDOMObject_log(level, msg, url, line, trace) {
            typesCheck(arguments, [
                "string",
                "string"
            ]);
            app.frontendHelper.logMessage(level, msg, url, line, trace);
        },
        openExternalWindow: function VBDOMObject_openExternalWindow(windowName) {
            typesCheck(arguments, ["string"]);
            app.fastdial.openExternalWindow(windowName, wrappedWindow);
        },
        stat: function VBDOMObject_stat(param) {
            typesCheck(arguments, ["string"]);
            app.fastdial.sendClickerRequest(param);
        },
        onContextmenu: function VBDOMObject_onContextmenu(thumbId, state) {
            typesCheck(arguments, [
                "number",
                "number"
            ]);
            app.thumbs.onContextmenu(thumbId, state);
        },
        onLinkClicked: function VBDOMObject_onLinkClicked() {
        },
        scrollInfo: function VBDOMObject_scrollInfo(pageHasVerticalScroll) {
            app.dayuse.updateScrollInfo(pageHasVerticalScroll);
        },
        search: {
            suggest: function VBDOMObject_search_suggest(query, callback) {
                typesCheck(arguments, [
                    "string",
                    "function"
                ]);
                app.searchSuggest.searchWeb(query, callback);
            },
            suggestURLs: function VBDOMObject_search_suggestURLs(query, callback) {
                typesCheck(arguments, [
                    "string",
                    "function"
                ]);
                app.thumbsSuggest.suggestURLs(query, callback);
            },
            suppressTutorial: function VBDOMObject_search_suppressTutorial() {
                app.searchSuggest.suppressTutorial();
            },
            useExample: function VBDOMObject_search_useExample(query) {
                typesCheck(arguments, ["string"]);
                app.searchSuggest.useExample(query);
            }
        },
        sync: {
            openWP: function VBDOMObject_sync_openWP() {
                app.sync.openWP();
            },
            enableSyncVB: function VBDOMObject_sync_enableSyncVB() {
                app.sync.enableSyncVB();
            }
        },
        auth: {
            login: function (userId) {
                app.auth.login(userId);
            },
            logout: function () {
                app.auth.logout();
            },
            openPassport: function () {
                window.location.href = app.auth.getURLFromBranding("passport");
            },
            openTune: function () {
                window.location.href = app.auth.getURLFromBranding("settings");
            }
        },
        advertisement: {
            refuse: function VBDOMObject_advertisement_refuse(timeout = 0) {
                typesCheck([timeout], ["number"]);
                app.advertisement.refuse(timeout);
            },
            hide: function VBDOMObject_advertisement_hide(timeout = 0) {
                typesCheck([timeout], ["number"]);
                app.advertisement.hideActiveAd(timeout);
            },
            getLocalizedString: function VBDOMObject_advertisement_getLocalizedString(str, callback) {
                typesCheck(arguments, [
                    "string",
                    "function"
                ]);
                callback(app.advertisement.getLocalizedString(str));
            },
            getLocalizedURL: function VBDOMObject_advertisement_getLocalizedURL(str, callback) {
                typesCheck(arguments, [
                    "string",
                    "function"
                ]);
                callback(app.advertisement.getLocalizedURL(str));
            },
            openYandexBrowser: function VBDOMObject_advertisement_openYandexBrowser(url) {
                typesCheck(arguments, ["string"]);
                app.integration.yandexBrowser.openBrowser(url);
                app.advertisement.sendBarnavigRequest();
            },
            stat: function VBDOMObject_advertisement_stat(param) {
                typesCheck(arguments, ["string"]);
                app.advertisement.sendClickerRequest(param);
            },
            setYandexAsCurrentSearchEngine: function VBDOMObject_advertisement_setYandexAsCurrentSearchEngine() {
                app.searchOffer.setYandexAsCurrentSearchEngine();
            },
            setYandexAsHomePage: function VBDOMObject_advertisement_setYandexAsHomePage() {
                app.searchOffer.setYandexAsHomePage();
            }
        },
        onRequest: {
            addListener: function VBDOMObject_OnReq_addListener(command, callback) {
                app.fastdial.setListenersForWindow.apply(app.fastdial, [outerWindowId].concat(Array.prototype.slice.call(arguments, 0)));
            },
            removeListener: function VBDOMObject_OnReq_removeListener(command, callback) {
                app.fastdial.removeListenersForWindow.apply(app.fastdial, [outerWindowId].concat(Array.prototype.slice.call(arguments, 0)));
            },
            hasListener: function VBDOMObject_OnReq_hasListener(command, callback) {
                return app.fastdial.hasListenerForWindow.apply(app.fastdial, [outerWindowId].concat(Array.prototype.slice.call(arguments, 0)));
            },
            _outerWindowId: null
        },
        debug: {
            pickupThumbs: function VBDOMObject_Debug_pickupThumbs(options) {
                app.pickup.run(options);
            },
            get thumbs() {
                return app.internalStructure.fullDebugStructure;
            }
        }
    };
    exports.vb = Object.create(VBDOMObjectProto);
}(window));
