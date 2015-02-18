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
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#cy";
Cu.import("resource://gre/modules/Services.jsm");
const core = {
    get API() {
        return this._api;
    },
    init: function CYWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        this._loadModules();
        api.Statistics.BarNavig.addDataProvider(barNavigDataProvider);
        barNavigDataProvider._dataContainer = api.SysUtils.createDataContainer({ expirationTime: 2 * 60 * 60 * 1000 });
        this._REGION_REG = new RegExp(this.utils.utf8Tounicode("Регион: (.*)"), "g");
        this._THEME_REG = new RegExp(this.utils.utf8Tounicode("^\\s*Тема:\\s*"), "");
    },
    finalize: function CYWidget_finalize() {
        this._api.Statistics.BarNavig.removeDataProvider(barNavigDataProvider);
        barNavigDataProvider._dataContainer.finalize();
        barNavigDataProvider._dataContainer = null;
        delete this.utils;
        delete this._api;
        delete this._logger;
    },
    buildWidget: function CYWidget_buildWidget(WIID, item) {
        item.setAttribute("yb-native-widget-name", WIDGET_NAME);
        item.setAttribute("yb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function CYWidget_destroyWidget(WIID, item, context) {
        try {
            if (typeof item.cyDestroy == "function") {
                item.cyDestroy();
            }
        } finally {
            item.removeAttribute("yb-native-widget-name");
            item.removeAttribute("yb-native-widget-wiid");
        }
    },
    gotoIndex: function CYWidget_gotoIndex(hostURL, event) {
        this._navToCYPage(this._CY_URL + "host=" + encodeURIComponent(hostURL) + "&base=0", event);
    },
    gotoAllPages: function CYWidget_gotoAllPages(hostURL, event) {
        let searchURL = this._api.Localization.createStringBundle("/urls/cy.properties").get("AllPagesSearchURL");
        this._navToCYPage(searchURL + encodeURIComponent("host:" + hostURL), event);
    },
    getPref: function CYWidget_getPref(strPrefName, defaultValue) {
        let prefFullName = this._api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this._api.Settings.PrefsModule;
        return prefsModule.get(prefFullName, defaultValue);
    },
    setPref: function CYWidget_setPref(strPrefName, strPrefValue) {
        let prefFullName = this._api.Settings.getComponentBranchPath() + strPrefName;
        let prefsModule = this._api.Settings.PrefsModule;
        return prefsModule.set(prefFullName, strPrefValue);
    },
    get stringBundle() {
        return this._stringBundle || (this._stringBundle = this._api.Localization.createStringBundle("/native/fx/cy.properties"));
    },
    _MODULES: { utils: "common-auth/utils.jsm" },
    _CY_URL: "http://www.yandex.ru/cy?",
    _loadModules: function CYWidget__loadModules() {
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
    },
    _navToCYPage: function CYWidget__navToCYPage(strURL, origEvent) {
        this.API.Controls.navigateBrowser({
            url: strURL,
            eventInfo: origEvent
        });
    },
    sendBarNavigRequest: function CYWidget_sendBarNavigRequest(aBrowser, aManual) {
        let url = aBrowser.currentURI.spec;
        let data = barNavigDataProvider._getData(url);
        if (aManual && data.state !== this.DATA_STATE_REQUEST || data.state === this.DATA_STATE_UNKNOWN && aBrowser.contentDocument.readyState === "complete") {
            data.state = this.DATA_STATE_REQUEST;
            this.API.Statistics.BarNavig.sendRequest({
                url: url,
                tic: 1
            }, barNavigDataProvider);
        } else {
            this.updateToolbaritemData(url, data);
        }
        return data;
    },
    updateToolbaritemData: function CYWidget_updateToolbaritemData(aURL, aData) {
        let urlToCompare = aURL.split("#")[0];
        this._api.Controls.getAllWidgetItems().forEach(function (toolbaritem) {
            if (!("setCY" in toolbaritem)) {
                return;
            }
            let currentURL = toolbaritem.ownerDocument.defaultView.gBrowser.currentURI.spec;
            if (currentURL === "about:blank") {
                currentURL = "";
            }
            if (currentURL.split("#")[0] !== urlToCompare) {
                return;
            }
            toolbaritem.setCY(aData);
        }, this);
    }
};
const barNavigDataProvider = {
    onWindowLocationChange: function CYWidget_BNDP_onWindowLocationChange(aParams) {
        if (!aParams.windowListenerData.isCurrentTab) {
            return false;
        }
        let data = this._getData(aParams.url);
        if (data.state === this.DATA_STATE_UNKNOWN && aParams.windowListenerData.readyState === "complete") {
            data.state = this.DATA_STATE_REQUEST;
            aParams.barNavigParams.tic = 1;
            core.updateToolbaritemData(aParams.url, data);
            return this;
        }
        core.updateToolbaritemData(aParams.url, data);
        return false;
    },
    onPageLoad: function CYWidget_BNDP_onPageLoad(aParams) {
        if (!aParams.windowListenerData.isCurrentTab) {
            return false;
        }
        let data = this._getData(aParams.url);
        if (data.isGoodURL) {
            data.state = this.DATA_STATE_REQUEST;
            aParams.barNavigParams.tic = 1;
            core.updateToolbaritemData(aParams.url, data);
            return this;
        }
        core.updateToolbaritemData(aParams.url, data);
        return false;
    },
    onBarNavigResponse: function CYWidget_BNDP_onBarNavigResponse(aParams) {
        let url = aParams.url || aParams.barNavigParams.url;
        let data = this._getData(url);
        data.state = this.DATA_STATE_ERROR;
        if (aParams.responseXML) {
            let urlinfo = aParams.responseXML.querySelector("urlinfo");
            if (urlinfo) {
                let domain = urlinfo.querySelector("yaca[url]");
                data.domain = domain && domain.getAttribute("url") || "";
                try {
                    data.domain = Services.uriFixup.createFixupURI(data.domain, Services.uriFixup.FIXUP_FLAG_NONE).host;
                } catch (e) {
                }
                let tcy = urlinfo.querySelector("tcy");
                data.value = tcy && parseInt(tcy.getAttribute("value"), 10) || 0;
                data.rang = tcy && parseInt(tcy.getAttribute("rang"), 10) || 0;
                let titles = [];
                Array.slice(urlinfo.querySelectorAll("topics > topic")).forEach(function (topic) {
                    let title = topic.getAttribute("title").replace(core._THEME_REG, "");
                    if (title) {
                        titles.push(title);
                    }
                });
                data.theme = titles.join(", ");
                let textinfo = urlinfo.querySelector("textinfo");
                textinfo = textinfo && textinfo.textContent;
                let region = textinfo && core._REGION_REG.exec(textinfo);
                data.region = region && region[1] || null;
            }
            data.state = this.DATA_STATE_RESPONSE;
        }
        core.updateToolbaritemData(url, data);
    },
    DATA_STATE_UNKNOWN: 1 << 0,
    DATA_STATE_TIMED_REQUEST: 1 << 1,
    DATA_STATE_REQUEST: 1 << 2,
    DATA_STATE_ERROR: 1 << 3,
    DATA_STATE_RESPONSE: 1 << 4,
    _dataContainer: null,
    get _emptyDataObject() {
        return {
            STATES: {
                UNKNOWN: this.DATA_STATE_UNKNOWN,
                TIMED_REQUEST: this.DATA_STATE_TIMED_REQUEST,
                REQUEST: this.DATA_STATE_REQUEST,
                ERROR: this.DATA_STATE_ERROR,
                RESPONSE: this.DATA_STATE_RESPONSE
            },
            domain: "",
            value: 0,
            rang: 0,
            theme: "",
            region: null
        };
    },
    _getData: function CYWidget_BNDP__getData(aURL) {
        let data = aURL && this._dataContainer.get(aURL);
        if (data) {
            return data;
        }
        data = this._emptyDataObject;
        data.isGoodURL = aURL && /^https?:\/\//.test(aURL);
        data.state = data.isGoodURL ? this.DATA_STATE_UNKNOWN : this.DATA_STATE_RESPONSE;
        data.url = aURL;
        return this._dataContainer.set(aURL, data).value;
    }
};
