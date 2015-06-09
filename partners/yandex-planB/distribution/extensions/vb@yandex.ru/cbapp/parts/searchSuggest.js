"use strict";
const EXPORTED_SYMBOLS = ["searchSuggest"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PrivateBrowsingUtils", "resource://gre/modules/PrivateBrowsingUtils.jsm");
const searchSuggest = {
    SUGGEST_TIMEOUT: 5000,
    init: function searchSuggest_init(application) {
        this._application = application;
        this._logger = application.getLogger("searchSuggest");
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
    },
    finalize: function searchSuggest_finalize() {
        this._application = null;
        this._logger = null;
    },
    searchWeb: function searchSuggest_searchWeb(queryString, callback) {
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.mozBackgroundRequest = true;
        request.open("GET", this._makeURLForQuery(queryString), true);
        request.setRequestHeader("Cache-Control", "no-cache");
        let listenerCallback = function listenerCallback(data) {
            return callback(data || JSON.stringify([
                queryString,
                []
            ]));
        };
        let timer = new this._application.core.Lib.sysutils.Timer(function abortOnTimeout() {
            request.abort();
        }, this.SUGGEST_TIMEOUT);
        let listener = new searchRequestListener(request, timer, listenerCallback);
        if (PrivateBrowsingUtils && request.channel instanceof Ci.nsIPrivateBrowsingChannel) {
            let topBrowserWindow = Services.wm.getMostRecentWindow("navigator:browser");
            if (topBrowserWindow) {
                request.channel.setPrivate(PrivateBrowsingUtils.isWindowPrivate(topBrowserWindow));
            }
        }
        request.send(null);
    },
    useExample: function searchSuggest_useExample(query) {
        let gURLBar = misc.getTopBrowserWindow().gURLBar;
        let currentPos = 0;
        let self = this;
        if (this._useExampleTimer) {
            this._useExampleTimer.cancel();
        }
        gURLBar.focus();
        gURLBar.inputField.value = "";
        this._useExampleTimer = new sysutils.Timer(function () {
            gURLBar.inputField.value += query.substr(currentPos, 1);
            currentPos += 1;
            if (currentPos === query.length) {
                try {
                    gURLBar.mController.startSearch(gURLBar.inputField.value);
                } catch (e) {
                    self._logger.error(e.message);
                }
            }
        }, 25, true, query.length);
    },
    suppressTutorial: function searchSuggest_suppressTutorial() {
        this._application.preferences.set("ftabs.searchStudyOmnibox", false);
        this._application.fastdial.requestInit();
    },
    get isFormVisible() {
        return [
            0,
            2
        ].indexOf(this._application.preferences.get("ftabs.searchStatus")) !== -1;
    },
    _makeURLForQuery: function searchSuggest__makeURLForQuery(queryString) {
        return this._application.branding.expandBrandTemplatesEscape(this._brandingSuggestURL, { searchTerms: queryString });
    },
    get _brandingSuggestURL() {
        delete this._brandingSuggestURL;
        this._brandingSuggestURL = this._application.fastdial.brandingXMLDoc.querySelector("search").getAttribute("suggest");
        return this._brandingSuggestURL;
    },
    _application: null,
    _logger: null,
    _useExampleTimer: null
};
function searchRequestListener(request, timer, callback) {
    this._request = request;
    this._callback = callback;
    this._timer = timer;
    request.QueryInterface(Ci.nsIDOMEventTarget);
    this._addEventListeners();
}
searchRequestListener.prototype = {
    _finalize: function searchRequestListener__finalize() {
        this._request = null;
        this._callback = null;
        this._timer = null;
    },
    _addEventListeners: function searchRequestListener__addEventListeners() {
        this._request.addEventListener("error", this, false);
        this._request.addEventListener("abort", this, false);
        this._request.addEventListener("load", this, false);
    },
    _removeEventListeners: function searchRequestListener__removeEventListeners() {
        this._request.removeEventListener("error", this, false);
        this._request.removeEventListener("abort", this, false);
        this._request.removeEventListener("load", this, false);
    },
    handleEvent: function searchRequestListener_handleEvent(event) {
        this._removeEventListeners();
        this._timer.cancel();
        let data = event.type === "load" ? this._request.responseText : "";
        this._callback(data);
        this._finalize();
    }
};
