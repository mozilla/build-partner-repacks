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
        styles: ["/native/fx/pagetranslator/styles/browser.css"],
        urlBarItems: { button: 8000 }
    }
};
const core = {
    api: null,
    Prefs: null,
    item: null,
    get windowMediator() {
        delete this.windowMediator;
        return this.windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    },
    get ETLDService() {
        delete this.ETLDService;
        return this.ETLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
    },
    get globalMessageManager() {
        delete this.globalMessageManager;
        return this.globalMessageManager = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
    },
    get translator() {
        return TranslatorService;
    },
    get promoURL() {
        let url = this.api.Localization.createStringBundle("/urls/pagetranslator.properties").get("promoURL");
        delete this.promoURL;
        return this.promoURL = url;
    },
    init: function PluginTranslator_init(api) {
        this.api = api;
        this.Prefs = api.Settings;
        let version = "0";
        if (this.api.Package.info && this.api.Package.info.version) {
            version = this.api.Package.info.version;
        }
        this._packageVersion = version.replace(/\./g, "-");
        this.translator.init();
        this.Prefs.observeChanges(this.translator, this.api.componentID);
    },
    finalize: function PluginTranslator_finalize() {
        this.Prefs.ignoreChanges(this.api.componentID);
        this.translator.finalize();
        this.Prefs = null;
        this.api = null;
    },
    initURLBarItem: function PluginTranslator_initURLBarItem(itemElement, itemClass) {
        return new URLBarItem(itemElement, itemClass, this);
    },
    Settings: {
        getMainTemplate: function PluginTranslator_getMainTemplate() {
            return core.api.Package.getFileInputChannel("/native/fx/pagetranslator/settings.xml").contentStream;
        }
    },
    checkSuggestConditions: function PluginTranslator_checkSuggestConditions() {
        if ([
                "mac",
                "windows"
            ].indexOf(this.api.Environment.os.name) === -1) {
            return false;
        }
        if (this.api.Integration.yandexBrowser.isDefault === true) {
            return false;
        }
        if (this.api.Controls.isPluginEnabled("http://bar-widgets.yandex.ru/packages/approved/286/manifest.xml#browseroffer") !== true) {
            return false;
        }
        let counter = this.api.Settings.getValue("suggest.closedCounter");
        if (counter >= 3) {
            return false;
        }
        let shownAt = parseInt(this.api.Settings.getValue("suggest.shownAt"), 10);
        if (shownAt) {
            if (shownAt < 0) {
                let eclipseTime = 15 * 60 * 1000;
                let shownAtTime = -shownAt;
                if (Math.abs(Date.now() - shownAtTime) > eclipseTime) {
                    this.pauseSuggest(shownAt = shownAtTime + eclipseTime);
                }
            }
            if (shownAt > 0) {
                let eclipseTime = 14 * 24 * 60 * 60 * 1000;
                let shownAtTime = shownAt;
                if (Math.abs(Date.now() - shownAtTime) > eclipseTime) {
                    this._playSuggest();
                } else {
                    return false;
                }
            }
        } else {
            this._playSuggest();
        }
        return true;
    },
    checkIsYandexService: function PluginTranslator_checkIsYandexService(aStrHost) {
        let hostName = aStrHost.toLowerCase();
        if (/(?:^|\.)(?:ya|kinopoisk|auto)\.ru$/.test(hostName)) {
            return true;
        }
        if (/(?:^|\.)yadi\.sk$/.test(hostName)) {
            return true;
        }
        let baseHostName;
        try {
            let baseDomain = this.ETLDService.getBaseDomainFromHost(hostName);
            let publicSuffix = this.ETLDService.getPublicSuffixFromHost(hostName);
            baseHostName = baseDomain.substr(0, baseDomain.length - publicSuffix.length - 1);
        } catch (e) {
        }
        if (!baseHostName) {
            return;
        }
        return baseHostName == "yandex";
    },
    pauseSuggest: function PluginTranslator_pauseSuggest(aSinceTime) {
        aSinceTime = aSinceTime && aSinceTime > 0 ? aSinceTime : Date.now();
        let timeSetting = parseInt(this.api.Settings.getValue("suggest.shownAt"), 10);
        if (timeSetting > 0) {
            return;
        }
        let closed = this.api.Settings.getValue("suggest.closedCounter");
        this.api.Settings.setValue("suggest.closedCounter", ++closed);
        this.api.Settings.setValue("suggest.shownAt", aSinceTime.toString());
    },
    _playSuggest: function PluginTranslator_playSuggest() {
        this.api.Settings.setValue("suggest.shownAt", (-Date.now()).toString());
    },
    sendStatistic: function PluginTranslator_sendStatistic(aPart, aAction) {
        function validateAction(aValidActions, aSpecifiedAction) {
            let action = aSpecifiedAction || aAction;
            if (aValidActions.indexOf(action) === -1) {
                throw new Error("Wrong statistics action '" + action + "' for " + aPart);
            }
        }
        switch (aPart) {
        case "pagetranslator":
            validateAction([
                "showbutton",
                "clickoff",
                "clickon",
                "bar.back",
                "bar.langchange",
                "bar.close"
            ]);
            this.api.Statistics.logClickStatistics({
                cid: 72473,
                path: "fx." + this._packageVersion + "." + aAction
            });
            break;
        case "suggest":
            validateAction([
                "addbbrun",
                "run",
                "runclose",
                "addbbinstall",
                "install",
                "installclose"
            ]);
            this.api.Statistics.logClickStatistics({
                cid: 72551,
                path: "fx.translate." + aAction
            });
            break;
        default:
            throw new Error("Wrong statistics part '" + aPart + "'");
        }
    },
    _packageVersion: null
};
function URLBarItem(itemElement, itemClass, module) {
    itemElement.module = module;
    itemElement.setAttribute("yb-native-widget-name", "http://bar.yandex.ru/packages/yandexbar#pagetranslator");
    this.element = itemElement;
}
URLBarItem.prototype = {
    finalize: function TPluginTranslatorUBItem_finalize() {
        if (this.element && typeof this.element.wdgtxDestructor === "function") {
            this.element.wdgtxDestructor();
        }
        this.element = null;
    }
};
const TranslatorService = {
    init: function TranslatorService_init() {
        this._langDetector = Cu.import(core.api.Package.resolvePath("/native/fx/modules/lang-detector.jsm"), {}).langDetector;
        core.globalMessageManager.addMessageListener(this.GET_PROP_MESSAGE_NAME, this);
    },
    finalize: function TranslatorService_finalize() {
        core.globalMessageManager.removeMessageListener(this.GET_PROP_MESSAGE_NAME, this);
        this._langDetector = null;
    },
    onSettingChange: function TranslatorService_onSettingChange(name, variant, instanceID) {
        if (name !== "tlang") {
            return;
        }
        core.globalMessageManager.broadcastAsyncMessage(this.EVENT_MESSAGE_NAME, { type: "reset" });
    },
    detectLang: function TranslatorService_detectLang(doc) {
        return doc.body ? this.langDetector.detect(doc.body.innerHTML, false) : null;
    },
    matchLang: function TranslatorService_matchLang(lang) {
        return this.language === lang;
    },
    getLangPair: function TranslatorService_isAvailablePair(slang, tlang) {
        return this.getAvailablePair(slang + "-" + tlang);
    },
    getAvailablePair: function TranslatorService_getAvailablePair(pair) {
        return this._availablePairs[pair] || null;
    },
    get localeLanguage() {
        let localeString = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global");
        let lang = localeString.match(this._languagePattern)[0];
        delete this.localeLanguage;
        return this.localeLanguage = lang;
    },
    get language() {
        let lang = core.Prefs.getValue("tlang");
        if (!lang) {
            lang = this.localeLanguage;
        }
        if (this._availableLocaleLangs.indexOf(lang) === -1) {
            return null;
        }
        if (lang in this._mapLocaleLangs) {
            return this._mapLocaleLangs[lang];
        }
        return lang;
    },
    get langDetector() {
        return this._langDetector;
    },
    _availableLocaleLangs: [
        "ru",
        "en",
        "es",
        "it",
        "fr",
        "de",
        "uk",
        "be",
        "kk",
        "tr",
        "pl"
    ],
    _availablePairs: {
        "ru-en": "ru-en",
        "ru-uk": "ru-uk",
        "ru-tr": "ru-tr",
        "en-ru": "en-ru",
        "uk-ru": "uk-ru",
        "tr-ru": "tr-ru",
        "de-ru": "de-ru",
        "fr-ru": "fr-ru",
        "it-ru": "it-ru",
        "es-ru": "es-ru",
        "pl-ru": "pl-ru",
        "en-uk": "en-uk",
        "tr-uk": "tr-uk",
        "de-uk": "de-uk",
        "fr-uk": "fr-uk",
        "it-uk": "it-uk",
        "es-uk": "es-uk",
        "pl-uk": "pl-uk",
        "en-tr": "en-tr",
        "uk-tr": "uk-tr"
    },
    _mapLocaleLangs: {
        be: "ru",
        kk: "ru",
        de: "en",
        fr: "en",
        it: "en",
        es: "en",
        pl: "en"
    },
    _languagePattern: /^([a-z]{2})/,
    _langDetector: null,
    EVENT_MESSAGE_NAME: "yasearch@yandex.ru:pagetranslator:event",
    GET_PROP_MESSAGE_NAME: "yasearch@yandex.ru:pagetranslator:getdata",
    receiveMessage: function TranslatorService_receiveMessage({data}) {
        let result;
        switch (data.type) {
        case "getLangPair":
            result = this.getLangPair(data.slang, data.tlang);
            break;
        case "getLanguage":
            result = this.language;
            break;
        case "getScriptsText": {
                let readFile = function (fileName) {
                    return core.api.Package.readTextFile("/native/fx/pagetranslator/contentScripts/" + fileName);
                };
                result = {
                    "lib.js": readFile("lib.js"),
                    "tr-url.js": readFile("tr-url.js")
                };
                break;
            }
        default:
            break;
        }
        return result;
    }
};
