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
const core = {
    init: function TranslatePlugin_init(api) {
        this._api = api;
        this._logger = api.logger;
        this.URI = api.Package.resolvePath("/");
        this.Prefs = api.Settings;
        this._detectedLangs = {};
        this._langDetector = Cu.import(this._api.Package.resolvePath("/native/fx/modules/lang-detector.jsm"), {}).langDetector;
        this._langDetector.init(this._api);
        this.updateLangsXML();
        this.Prefs.observeChanges(this);
        if (this.brandType == "cb") {
            this.xutils = this.importModule("xutils.jsm");
            const SETTINGS_FILE_NAME = "tc_settings.json";
            let StorableObject = this.importModule("StorableObject.jsm", api.Files);
            let storage = new StorableObject(SETTINGS_FILE_NAME);
            let saveSettings = function saveSettings() {
                storage.__save__(SETTINGS_FILE_NAME);
            };
            this.storageSsid = storage.ssid;
            if (!storage.ssid) {
                let topicTranGetssid = "tran_getssid_89347578163785671875913347fjdghj";
                let topicSendSsid = "srank_send_ssid_8345tuh2478yt75y8248u54895786837";
                let that = this;
                let observObj = {
                    observe: function (subject, topic, data) {
                        that.storageSsid = storage.ssid = data;
                        saveSettings();
                        Services.obs.removeObserver(observObj, topicSendSsid);
                        observObj = null;
                    }
                };
                Services.obs.addObserver(observObj, topicSendSsid, false);
                let tmr = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
                tmr.initWithCallback(function () {
                    Services.obs.notifyObservers(null, topicTranGetssid, "");
                }, 500, Ci.nsITimer.TYPE_ONE_SHOT);
            }
        }
    },
    finalize: function TranslatePlugin_finalize() {
        this.Prefs.ignoreChanges(this);
        this._cache.clear();
        delete this.xutils;
        delete this._langDetector;
        delete this._api;
        delete this._logger;
        delete this._detectedLangs;
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
    },
    getPageLanguage: function TranslatePlugin_getPageLanguage(pageURL, contentDocument) {
        if (this._detectedLangs[pageURL]) {
            return this._detectedLangs[pageURL];
        }
        let content = "";
        try {
            content = contentDocument.body.innerHTML;
        } catch (ex1) {
            try {
                content = contentDocument.documentElement.textContent;
            } catch (ex2) {
                content = this.xmlSerializer.serializeToString(contentDocument);
            }
        }
        return this._detectedLangs[pageURL] = this._langDetector.detect(content, false);
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
        return this.Prefs.getValue(this.TRANSLATE_ON_HOVER_OPTION_PREF);
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
        let version = this.API.Package.info.version.replace(".", "-", "g");
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
    SSID_URL_CZ: "http://reg.software.seznam.cz:80/RPC2",
    TRANSLATE_URL_CZ: "http://api.slovnik.seznam.cz:80/RPC2",
    ALL_TR_URL_CZ: "http://slovnik.seznam.cz/?q={text}&lang={lang}",
    minShowBalloonInterval: 1000,
    timerUpdXML: null,
    isBadText: function TranslatePlugin_isBadText(text) {
        return !text || /^\u00D7+$/.test(text);
    },
    get API() {
        return this._api;
    },
    Settings: {
        getMainTemplate: function TranslatePlugin_getMainTemplate() {
            return core.API.Package.getFileInputChannel("/native/fx/translator/settings.xml").contentStream;
        }
    },
    importModule: function TranslatePlugin_importModule(module) {
        let path = this._api.Package.resolvePath("native/fx/translator/scripts/" + module);
        let scope = {};
        Cu.import(path, scope);
        arguments[0] = this;
        return scope.module && scope.module.apply(scope, arguments);
    },
    get defaultLanguage() {
        let stringBundle = this._api.Localization.createStringBundle("/native/fx/translator/translator.properties");
        let defaultLanguage = stringBundle.get("defaultLanguage");
        delete this.defaultLanguage;
        return this.defaultLanguage = defaultLanguage;
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
            let cached = {};
            for (let name in {
                    from: 0,
                    to: 0,
                    text: 0,
                    url: 0,
                    translations: 0
                }) {
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
                for (let name in {
                        url: 0,
                        translations: 0
                    }) {
                    balloon[name] = cached[name];
                }
            }
            return balloon;
        }
    },
    get locale() {
        return this._locale || (this._locale = this.getString("locale"));
    },
    get brandId() {
        if (this.__brandId) {
            return this.__brandId;
        }
        try {
            let listener = {
                observeServiceEvent: function () {
                }
            };
            let service = this._api.Services.obtainService("ru.yandex.custombar.branding", "package", listener);
            try {
                this.__brandId = service ? service.getBrandID() : "";
            } finally {
                this._api.Services.releaseService("ru.yandex.custombar.branding", "package", listener);
            }
        } catch (exc) {
            this.__brandId = "";
        }
        return this.__brandId;
    },
    get brandType() {
        let bid = this.brandId;
        return bid ? {
            bzcb: "cb",
            bztb: "tb"
        }[bid] || bid : "";
    },
    get langs() {
        if (!this._langs) {
            let csAdd = [
                "en",
                "de",
                "fr",
                "it",
                "es",
                "ru"
            ];
            let bid = this.brandId;
            let csb = {
                cb: 1,
                bzcb: 1
            }[bid];
            let parseXml = function parseXml(xml) {
                try {
                    let langs = Object.create(null);
                    Array.slice(xml.querySelectorAll("dir")).forEach(function (el) {
                        let from = el.querySelector("from").textContent;
                        let to = el.querySelector("to").textContent;
                        if (from != "cs" || csb) {
                            langs[from] = langs[from] || [];
                            if (to != "cs" || csb) {
                                langs[from].push(to);
                            }
                        }
                    });
                    return langs;
                } catch (e) {
                    return null;
                }
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
                        __proto__: null,
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
    getTranslatableTextFromString: function TranslatePlugin_getTranslatableTextFromString(aString, aOffset) {
        if (!aString) {
            return [];
        }
        let text = aString;
        let offset = aOffset || 0;
        let getLength = function getLength(aString, aReverse) {
            let str = aReverse ? aString.split("").reverse().join("") : aString;
            return (str.match(/^[\u0041-\u005a\u0061-\u007a\u00c0-\u1fff\-\'\u2019]+/) || [""])[0].length;
        };
        let begin = offset - getLength(text.substr(0, offset), true);
        let end = offset + getLength(text.substr(offset), false);
        text = end - begin <= 0 ? "" : text.substr(begin, end - begin);
        if (!text || /(^\-)|(\-$)|(\-{2,})|([\'\u2019]{2,})/.test(text)) {
            return [];
        }
        return [
            text,
            begin,
            end
        ];
    },
    getString: function TranslatePlugin_getString(aKey, aArgs) {
        if (!this._stringBundle) {
            this._stringBundle = Services.strings.createBundle(this.API.Package.resolvePath("/native/fx/translator.properties"));
        }
        if (aArgs) {
            return this._stringBundle.formatStringFromName(aKey, aArgs, aArgs.length);
        }
        return this._stringBundle.GetStringFromName(aKey);
    },
    _getXMLDocFromPackage: function TranslatePlugin__getXMLDocFromPackage(aURL) {
        let uri = Services.io.newURI(this._api.Package.resolvePath(aURL), null, null);
        let channel = Services.io.newChannelFromURI(uri);
        let stream = channel.open();
        return this._api.XMLUtils.xmlDocFromStream(stream, uri, uri, true);
    },
    get xmlSerializer() {
        delete this.xmlSerializer;
        return this.xmlSerializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].getService(Ci.nsIDOMSerializer);
    },
    _api: null,
    _logger: null,
    _detectedLangs: null,
    _langDetector: null,
    URI: null,
    Prefs: null
};
