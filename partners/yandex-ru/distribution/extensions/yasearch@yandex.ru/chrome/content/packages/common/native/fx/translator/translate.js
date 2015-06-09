"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const PLUGIN_NAME = "http://bar.yandex.ru/packages/yandexbar#translator";
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const resources = {
    browser: {
        styles: ["/native/fx/translator/css/browser.css"],
        urlBarItems: { button: 12000 }
    }
};
const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const PREFERENCES_MESSAGE_NAME = "yasearch@yandex.ru:translator:preferences";
const core = {
    init: function TranslatePlugin_init(api) {
        this._api = api;
        this._logger = api.logger;
        this.URI = api.Package.resolvePath("/");
        this.Prefs = api.Settings;
        this.updateLangsXML();
        this._api.Browser.messageManager.addMessageListener({
            messageName: PREFERENCES_MESSAGE_NAME,
            listener: this
        });
        this._api.Browser.messageManager.loadFrameScript({ url: this._api.Package.resolvePath("/native/fx/translator/frameScript.js") });
        this.Prefs.observeChanges(this);
    },
    finalize: function TranslatePlugin_finalize() {
        this.Prefs.ignoreChanges(this);
        this._api.Browser.messageManager.removeDelayedFrameScript({ url: this._api.Package.resolvePath("/native/fx/translator/frameScript.js") });
        this._api.Browser.messageManager.removeMessageListener({
            messageName: PREFERENCES_MESSAGE_NAME,
            listener: this
        });
        this._cache.clear();
        delete this._api;
        delete this._logger;
    },
    initURLBarItem: function TranslatePlugin_initURLBarItem(itemElement, itemClass) {
        itemElement.module = this;
        itemElement.setAttribute("yb-native-widget-name", PLUGIN_NAME);
        return {
            finalize: function () {
                itemElement.style.mozBinding = "none";
            }
        };
    },
    onSettingChange: function TranslatePlugin_onSettingChange(settingName, newValue) {
        if (settingName === this.TRANSLATE_ONHOVER_PREF) {
            this.logClickStatistics("settings." + (newValue ? "hover" : "hotkey"));
        }
        switch (settingName) {
        case this.TRANSLATE_ONHOVER_PREF:
        case this.TRANSLATE_ON_HOVER_OPTION_PREF:
        case this.INTERVAL_SHOW_PREF:
            this._api.Browser.messageManager.broadcastAsyncMessage({
                messageName: PREFERENCES_MESSAGE_NAME,
                obj: { type: "drop" }
            });
            break;
        }
    },
    receiveMessage: function TranslatePlugin_receiveMessage(message) {
        let {
            name,
            data,
            target: tab,
            objects
        } = message;
        if (data.type !== "get") {
            return;
        }
        let xbURI = Services.io.newURI(this.API.Package.resolvePath("/native/fx/modules/lang-detector.jsm"), null, null);
        xbURI.QueryInterface(Ci.nsIFileURL);
        let langDetectorPath = "file://" + xbURI.file.path;
        return {
            intervalShow: this.intervalShow,
            translateOnHover: this.translateOnHover,
            translateOnHoverOption: this.translateOnHoverOption,
            isMac: this.API.Environment.os.name === "mac",
            TRANSLATE_ON_CTRLKEY: this.TRANSLATE_ON_CTRLKEY,
            TRANSLATE_ON_SHIFTKEY: this.TRANSLATE_ON_SHIFTKEY,
            langDetectorPath: langDetectorPath
        };
    },
    getTextLanguage: function TranslatePlugin_getTextLanguage(text) {
        return this._langDetector.detect(text, true);
    },
    updateLangsXML: function TranslatePlugin_updateLangsXML() {
        if (this.timerUpdXML) {
            this.timerUpdXML.cancel();
            this.timerUpdXML = null;
        }
        if (this._storage && this._storage.exists()) {
            let updateInterval = (parseInt(this.Prefs.getValue(this.UPDATE_INTERVAL), 10) || 7) * 1000 * 60 * 60 * 24;
            if (updateInterval > Math.abs(parseInt(this.Prefs.getValue(this.LAST_UPDATE), 10) - Date.now())) {
                return;
            }
        }
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.open("POST", this.UPDATE_URL, true);
        let that = this;
        request.onreadystatechange = function () {
            that.updateLangsXMLCallback(request);
        };
        request.send("");
    },
    updateLangsXMLCallback: function TranslatePlugin_updateLangsXMLCallback(request) {
        if (request.readyState !== 4) {
            return;
        }
        let that = this;
        if (!(request && request.status == 200 && request.responseText)) {
            if (!this._storage || !this._storage.exists()) {
                this.timerUpdXML = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
                this.timerUpdXML.initWithCallback(function () {
                    that.timerUpdXML = null;
                    that.updateLangsXML();
                }, 10 * 60000, Ci.nsITimer.TYPE_ONE_SHOT);
            }
            return;
        }
        this.Prefs.setValue(this.LAST_UPDATE, String(Date.now()));
        try {
            this.API.Files.writeTextFile(this._storage, request.responseText);
        } catch (e) {
            this._logger.error("Error writing updated translate-langs.xml to disk. " + e);
        }
    },
    get translateOnHover() {
        return this.Prefs.getValue(this.TRANSLATE_ONHOVER_PREF);
    },
    get translateOnHoverOption() {
        return parseInt(this.Prefs.getValue(this.TRANSLATE_ON_HOVER_OPTION_PREF), 10);
    },
    get intervalShow() {
        delete this.intervalShow;
        this.intervalShow = Math.min(this.INTERVAL_MAX, Math.max(this.INTERVAL_MIN, this.Prefs.getValue(this.INTERVAL_SHOW_PREF)));
        return this.intervalShow;
    },
    logClickStatistics: function TranslatePlugin_logClickStatistics(paramString) {
        if (!this.API.Statistics.alwaysSendUsageStat) {
            return;
        }
        let version = this.API.Package.info.version.replace(/\./g, "-");
        this.API.Statistics.logClickStatistics({
            cid: 72553,
            path: [
                "fx",
                version,
                paramString
            ].join(".")
        });
    },
    TRANSLATE_ONHOVER_PREF: "translate_on_hover",
    TRANSLATE_ON_HOVER_OPTION_PREF: "translate_on_hover_option",
    INTERVAL_SHOW_PREF: "interval_show",
    INTERVAL_MIN: 500,
    INTERVAL_MAX: 5000,
    TRANSLATE_ON_CTRLKEY: 1,
    TRANSLATE_ON_SHIFTKEY: 2,
    LAST_UPDATE: "last_update",
    UPDATE_INTERVAL: "update_interval",
    get EXPORT_URL() {
        let exportURL = this._api.Localization.createStringBundle("/urls/common.properties").get("exportURL");
        delete this.EXPORT_URL;
        return this.EXPORT_URL = exportURL;
    },
    get UPDATE_URL() {
        delete this.UPDATE_URL;
        return this.UPDATE_URL = this.EXPORT_URL + "bar/translate-langs.xml";
    },
    get TRANSLATE_URL() {
        delete this.TRANSLATE_URL;
        return this.TRANSLATE_URL = this.EXPORT_URL + "bar/translate.xml";
    },
    minShowBalloonInterval: 1000,
    timerUpdXML: null,
    get API() {
        return this._api;
    },
    Settings: {
        getMainTemplate: function TranslatePlugin_getMainTemplate() {
            return core.API.Package.getFileInputChannel("/native/fx/translator/settings.xml").contentStream;
        }
    },
    get defaultLanguage() {
        let defaultLanguage = this._api.Localization.createStringBundle("/native/fx/translator/translator.properties").get("defaultLanguage");
        delete this.defaultLanguage;
        return this.defaultLanguage = defaultLanguage;
    },
    get _langDetector() {
        let langDetector = Cu.import(this._api.Package.resolvePath("/native/fx/modules/lang-detector.jsm"), {}).langDetector;
        delete this.langDetector;
        return this.langDetector = langDetector;
    },
    _cache: {
        MAX_CACHED_COUNT: 256,
        _cachedBallons: [],
        clear: function TranslatePlugin_clear() {
            this._cachedBallons = [];
        },
        _balloonId: function TranslatePlugin__balloonId(balloon) {
            return [
                balloon.from,
                balloon.to,
                balloon.text.toLowerCase()
            ].join("|");
        },
        storeBalloon: function TranslatePlugin_storeBalloon(balloon) {
            let cached = Object.create(null);
            for (let name of [
                    "from",
                    "to",
                    "text",
                    "url",
                    "translations"
                ]) {
                cached[name] = balloon[name];
            }
            cached.balloonId = this._balloonId(balloon);
            if (this._cachedBallons.unshift(cached) > this.MAX_CACHED_COUNT) {
                this._cachedBallons.splice(-this.MAX_CACHED_COUNT / 2);
            }
        },
        restoreBalloon: function TranslatePlugin_restoreBalloon(balloon) {
            let cached;
            let balloonId = this._balloonId(balloon);
            this._cachedBallons.some(function (aBalloon) {
                return balloonId === aBalloon.balloonId && (cached = aBalloon);
            });
            if (cached) {
                for (let name of [
                        "url",
                        "translations"
                    ]) {
                    balloon[name] = cached[name];
                }
            }
            return balloon;
        }
    },
    get locale() {
        delete this.locale;
        return this.locale = this._api.Environment.addon.locale.language || "ru";
    },
    get brandId() {
        return this._api.Environment.branding.brandID;
    },
    get langs() {
        if (!this._langs) {
            let parseXml = function parseXml(xml) {
                try {
                    let langs = Object.create(null);
                    Array.slice(xml.querySelectorAll("dir")).forEach(function (el) {
                        let from = el.querySelector("from").textContent;
                        let to = el.querySelector("to").textContent;
                        if (!from || !to) {
                            return;
                        }
                        langs[from] = langs[from] || [];
                        langs[from].push(to);
                    });
                    return langs;
                } catch (e) {
                }
                return null;
            };
            this._langs = parseXml(this.getLangsXMLDoc()) || this._getDefaultXML();
        }
        return this._langs;
    },
    get texts() {
        return this._texts || (this._texts = this._parseTextsXML(this.getLangsXMLDoc()) || this._parseTextsXML(this._getDefaultXML()));
    },
    getLangName: function TranslatePlugin_getLangName(lang, form) {
        let locale;
        [
            this.locale,
            "en",
            "ru"
        ].forEach(function (el) {
            if (!locale && Boolean(this.texts[el])) {
                locale = el;
            }
        }, this);
        if (!locale) {
            return "";
        }
        return this.texts[locale] && this.texts[locale][lang] && this.texts[locale][lang][form] || "";
    },
    _parseTextsXML: function TranslatePlugin__parseTextsXML(aXML) {
        try {
            let texts = Object.create(null);
            Array.slice(aXML.getElementsByTagName("langtranslate")[0].getElementsByTagName("to")).forEach(function (el) {
                let translations = Object.create(null);
                Array.slice(el.querySelectorAll("lang")).forEach(function (el) {
                    let pair = {
                        short: el.querySelector("short").textContent,
                        full: el.querySelector("full").textContent
                    };
                    translations[el.getAttribute("id")] = pair;
                });
                texts[el.getAttribute("id")] = translations;
            });
            return texts;
        } catch (e) {
        }
        return null;
    },
    getLangsXMLDoc: function TranslatePlugin_getLangsXMLDoc() {
        if (this._storage && this._storage.exists()) {
            try {
                return this.API.XMLUtils.xmlDocFromFile(this._storage, false);
            } catch (e) {
                this._logger.debug("Error reading translate xml file from storage. " + e);
            }
        }
        return this._getDefaultXML();
    },
    get _storage() {
        if (!this.__storage || !this.__storage.exists()) {
            try {
                let storage = this.API.Files.getWidgetStorage(true);
                storage.append("translate-langs.xml");
                this.__storage = storage;
            } catch (e) {
                this._logger.error("Cannot obtain storage for translate widget: " + e);
                this.__storage = null;
            }
        }
        return this.__storage;
    },
    _getDefaultXML: function TranslatePlugin__getDefaultXML() {
        return this._getXMLDocFromPackage("native/fx/translator/langs.xml");
    },
    _getXMLDocFromPackage: function TranslatePlugin__getXMLDocFromPackage(aURL) {
        let uri = Services.io.newURI(this._api.Package.resolvePath(aURL), null, null);
        let channel = Services.io.newChannelFromURI(uri);
        let stream = channel.open();
        return this._api.XMLUtils.xmlDocFromStream(stream, uri, uri, true);
    },
    _api: null,
    _logger: null,
    URI: null,
    Prefs: null
};
