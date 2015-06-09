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
const resources = {
    browser: {
        styles: ["/native/styles/browser.css"],
        urlBarItems: { button: 8000 }
    }
};
const WIDGET_ID = "http://bar.yandex.ru/packages/yandexbar#altsearch";
const PANEL_ID = "http://bar.yandex.ru/packages/yandexbar#altsearch-panel";
const URIHelper = {
    DEFAULT_QUERY_CHARSET: "ISO-8859-1",
    convertQueryForURI: function URIHelper_convertQueryForURI(aData, aQueryCharset) {
        let data = "";
        try {
            data = this._textToSubURIService.ConvertAndEscape(aQueryCharset, aData);
        } catch (ex) {
            data = this._textToSubURIService.ConvertAndEscape(this.DEFAULT_QUERY_CHARSET, aData);
        }
        return data;
    },
    decodeURIComponent: function URIHelper_decodeURIComponent(aString) {
        try {
            return decodeURIComponent(aString);
        } catch (e) {
        }
        return this._textToSubURIService.unEscapeURIForUI("windows-1251", aString);
    },
    get _textToSubURIService() {
        delete this._textToSubURIService;
        return this._textToSubURIService = Cc["@mozilla.org/intl/texttosuburi;1"].getService(Ci.nsITextToSubURI);
    }
};
const core = {
    init: function AltSearch_init(api) {
        this._api = api;
    },
    finalize: function AltSearch_finalize() {
        this._api = null;
    },
    initURLBarItem: function AltSearch_initURLBarItem(itemElement, itemClass) {
        return new AltSearchUBItem(itemElement, itemClass, this);
    },
    get WIDGET_ID() {
        return WIDGET_ID;
    },
    get PANEL_ID() {
        return PANEL_ID;
    },
    get API() {
        return this._api;
    },
    getSearchPropsFromURI: function AltSearch_getSearchPropsFromURI(aURI) {
        return searchExtractor.getFromURI(aURI);
    },
    get searchEnginesInfo() {
        return this._brandingData.engines;
    },
    getPageInputName: function AltSearch_getPageInputName(aURI) {
        let [
            engineId,
            searchString
        ] = this.getSearchPropsFromURI(aURI);
        if (!engineId) {
            return null;
        }
        let name = "q";
        switch (engineId) {
        case "yahoo":
            name = "p";
            break;
        }
        return name;
    },
    getEngineData: function AltSearch_getEngineData(aEngineId, aSearchString) {
        let engineData = this.searchEnginesInfo.filter(engine => engine.id == aEngineId)[0];
        let terms = URIHelper.convertQueryForURI(aSearchString || "", "utf-8");
        engineData.prepearedQuery = this._api.Environment.branding.expandBrandTemplates(engineData.query, { searchTerms: terms });
        return engineData;
    },
    _api: null,
    get _brandingData() {
        delete this._brandingData;
        let brandingData;
        try {
            brandingData = JSON.parse(this._api.Package.readTextFile("/engines.json"));
        } catch (e) {
            this._api.logger.error(e);
            brandingData = { engines: [] };
        }
        this._brandingData = { engines: brandingData.engines };
        return this._brandingData;
    }
};
function AltSearchUBItem(aItemElement, aItemClass, aModule) {
    this._itemElement = aItemElement;
    aItemElement.module = aModule;
    aItemElement.setAttribute("yb-native-widget-name", WIDGET_ID);
}
AltSearchUBItem.prototype = {
    _itemElement: null,
    finalize: function AltSearchUBItem_finalize() {
        this._itemElement.wdgtxDestructor();
        this._itemElement.module = null;
        this._itemElement = null;
    }
};
const searchExtractor = {
    getFromURI: function searchExtractor_getFromURI(aURI) {
        let [spec] = this._getURIParam(aURI, ["spec"]);
        if (!spec) {
            return [
                null,
                null
            ];
        }
        let hostId = this._searchWordsRe.getHostId(spec);
        if (hostId) {
            spec = "#" + spec.split("#").reverse().join("#");
            if (spec.match(this._searchWordsRe.getPhraseRe(hostId))) {
                return [
                    hostId,
                    URIHelper.decodeURIComponent(RegExp.$1.replace(/\+/g, " "))
                ];
            }
        }
        return [
            null,
            null
        ];
    },
    _getURIParam: function searchExtractor__getURIParam(aURI, aParamsArray) {
        try {
            return aParamsArray.map(p => aURI[p]);
        } catch (e) {
        }
        return [];
    },
    _searchWordsRe: {
        _phrasesRe: Object.create(null),
        urlRe: /^https?:\/\/(?:www\.)?(go\.(mail)\.ru|(bing)\.com|(?:[a-z]{2}\.)?search\.(yahoo)\.com|(google)(?:\.com)?\.[a-z]{2,3})\/(?:search|webhp)?[;#&?]/i,
        getHostId: function searchExtractor_SWRe_getHostId(aURL) {
            let res = aURL.match(this.urlRe);
            let id = String(res).split(",").splice(2).join("").toLowerCase();
            if (id == "google" && /[#&?]tbm=/.test(aURL)) {
                id = "";
            }
            return id || null;
        },
        getPhraseRe: function searchExtractor_SWRe_getPhraseRe(aHostId) {
            if (!this._phrasesRe[aHostId]) {
                let q = "q";
                switch (aHostId) {
                case "yahoo":
                    q = "p";
                    break;
                }
                this._phrasesRe[aHostId] = new RegExp("[?&#]" + q + "=([^#&?]*)");
            }
            return this._phrasesRe[aHostId];
        }
    }
};
