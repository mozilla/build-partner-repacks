"use strict";
const EXPORTED_SYMBOLS = ["installer"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const GLOBAL = this;
let branding = null;
let barApp = null;
const TEMP_QS_PREF = "qs.temp";
const BROWSER_STARTUP_PAGE_PREF = "browser.startup.page";
const BROWSER_STARTUP_HOMEPAGE_PREF = "browser.startup.homepage";
const BROWSER_NTP_PREFNAME = "browser.newtab.url";
const installer = {
    init: function Installer_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = barApp = application;
        this._preferences = application.preferences;
        this._logger = application.getLogger("Installer");
        branding = application.branding;
        if (!this.checkLicenseAccepted()) {
            throw new Error("License agreement rejected");
        }
        Preferences.observe(BROWSER_NTP_PREFNAME, this);
        Services.obs.addObserver(this, "sessionstore-windows-restored", false);
        let addonManagerInfo = barApp.addonManager.info;
        if (!this._application.preferences.get("general.install.time")) {
            this._application.preferences.set("general.install.time", Math.round(Date.now() / 1000));
        }
        if (addonManagerInfo.addonVersionChanged && addonManagerInfo.addonUpgraded) {
            if (!addonManagerInfo.isFreshAddonInstall) {
                this._onAddonUpdated();
            }
        }
        if (addonManagerInfo.isFreshAddonInstall || this._application.preferences.get("disabled") === true) {
            this.setBrowserNewTabUrl();
            this._application.preferences.reset("disabled");
        }
        AddonManager.addAddonListener(this);
        if (this._preferences.get("installer.override.revertedOnDisable") === true) {
            this._revertChangedPreferencesOnDisablingCancelled();
        }
    },
    finalize: function Installer_finalize(doCleanup) {
        this._removeTempQuickSearches();
        Preferences.ignore(BROWSER_NTP_PREFNAME, this);
    },
    _removeTempQuickSearches: function Installer__removeTempQuickSearches() {
        let tempQSList;
        try {
            tempQSList = JSON.parse(this._preferences.get(TEMP_QS_PREF, null));
        } catch (e) {
        }
        if (!Array.isArray(tempQSList)) {
            return;
        }
        let searchPluginsDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        searchPluginsDir.append("searchplugins");
        tempQSList.forEach(function (qsFileName) {
            let qsFile = searchPluginsDir.clone();
            qsFile.append(qsFileName);
            fileutils.removeFileSafe(qsFile);
        });
        this._preferences.reset(TEMP_QS_PREF);
    },
    onAddonEvent: function Installer_onAddonEvent(aEventType, aAddon, aPendingRestart) {
        const ADDON_DISABLE_EVENTS = {
            onUninstalling: 1,
            onDisabling: 1
        };
        if (aAddon.id == this._application.addonManager.addonId && aEventType in ADDON_DISABLE_EVENTS) {
            this._onAddonDisabling();
        }
        if (aAddon.id == this._application.addonManager.addonId && aEventType === "onUninstalling") {
            this._onAddonUninstalling();
        }
        if (aAddon.id == this._application.addonManager.addonId && aEventType === "onOperationCancelled") {
            this._onAddonDisablingCancelled();
        }
    },
    observe: function Installer_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case "sessionstore-windows-restored":
            this._showWelcomePageOnStartup();
            Services.obs.removeObserver(this, aTopic, false);
            break;
        case "nsPref:changed":
            if (aData === BROWSER_NTP_PREFNAME) {
                if (!Preferences.isSet(BROWSER_NTP_PREFNAME)) {
                    Preferences.set(BROWSER_NTP_PREFNAME, this._application.core.CONFIG.APP.PROTOCOL + ":tabs");
                }
            }
            break;
        default:
            break;
        }
    },
    closeTabs: function Installer_closeTabs(url) {
        tabsHelper.closeByURL(url);
    },
    _getLocalizedPref: function Installer__getLocalizedPref(aPrefName, aDefault) {
        try {
            return Services.prefs.getComplexValue(aPrefName, Ci.nsIPrefLocalizedString).data;
        } catch (ex) {
        }
        return aDefault;
    },
    checkLicenseAccepted: function Installer_checkLicenseAccepted() {
        if (barApp.addonManager.isAddonUninstalling) {
            return false;
        }
        if (!this._application.preferences.get("license.accepted", false)) {
            if (!this.setupData.hiddenWizard) {
                try {
                    let accepted = this._showLicenseWindow();
                    if (!accepted) {
                        return false;
                    }
                } catch (e) {
                    Cu.reportError(e);
                }
            }
            this._application.preferences.set("license.accepted", true);
            this._onAddonInstall();
        }
        if (this._application.core.CONFIG.APP.TYPE === "barff") {
            this._removePromoFile();
        }
        return true;
    },
    _setupData: null,
    set setupData(aValue) {
        this._setupData = null;
    },
    get setupData() {
        if (!this._setupData) {
            let data = {
                hiddenWizard: true,
                License: {
                    display: false,
                    checked: false,
                    text: "",
                    url: branding.brandPackage.resolvePath("/license/fx/license.xhtml")
                },
                HomePage: {
                    display: false,
                    checked: false,
                    text: "",
                    title: "",
                    url: "",
                    force: false
                },
                DefaultSearch: {
                    display: false,
                    checked: false,
                    text: ""
                },
                UsageStat: {
                    display: false,
                    checked: false,
                    multipack: false,
                    text: ""
                },
                GoodbyePage: { url: "" }
            };
            let productXML;
            try {
                productXML = branding.brandPackage.getXMLDocument("/about/product.xml");
            } catch (e) {
                Cu.reportError(e);
            }
            let setupElement = productXML && productXML.querySelector("Product > Setup");
            if (setupElement) {
                [
                    "License",
                    "HomePage",
                    "DefaultSearch",
                    "UsageStat"
                ].forEach(function (aElementName) {
                    let el = setupElement.querySelector(aElementName);
                    if (el) {
                        for (let [
                                    prop,
                                    val
                                ] in Iterator(data[aElementName])) {
                            if (!el.hasAttribute(prop)) {
                                continue;
                            }
                            let attrValue = el.getAttribute(prop);
                            if (typeof val == "boolean") {
                                attrValue = attrValue == "true";
                            }
                            data[aElementName][prop] = attrValue;
                        }
                    }
                    if (data.hiddenWizard && data[aElementName].display) {
                        data.hiddenWizard = false;
                    }
                });
            }
            let fxProductXML;
            try {
                fxProductXML = branding.brandPackage.getXMLDocument("/fx/about/product.xml");
            } catch (e) {
            }
            let goodbyePageElement = fxProductXML && fxProductXML.querySelector("Product > GoodbyeUrl");
            if (goodbyePageElement) {
                let goodbyeURL = branding.expandBrandTemplatesEscape(goodbyePageElement.textContent);
                let extraParams = [];
                let ui = this._application.addonStatus.guidString;
                if (ui) {
                    extraParams.push("ui=" + encodeURIComponent(ui));
                }
                extraParams.push("version=" + encodeURIComponent(this._application.addonManager.addonVersion));
                let clidData = this._application.clids.vendorData.clid1;
                if (clidData && clidData.clidAndVid) {
                    extraParams.push("clid=" + encodeURIComponent(clidData.clidAndVid));
                }
                goodbyeURL += (/\?/.test(goodbyeURL) ? "&" : "?") + extraParams.join("&");
                data.GoodbyePage.url = goodbyeURL;
            }
            try {
                let configXML = branding.brandPackage.getXMLDocument("/browser/browserconf.xml");
                let configHPElement = configXML.querySelector("Browser > HomePage");
                if (configHPElement) {
                    let homePageURL = configHPElement.textContent;
                    data.HomePage.url = homePageURL && branding.expandBrandTemplatesEscape(homePageURL);
                    data.HomePage.title = configHPElement.getAttribute("title") || "";
                    data.HomePage.force = configHPElement.getAttribute("force") === "true";
                }
            } catch (e) {
                this._logger.error(e);
                this._logger.debug(e.stack);
            }
            let stringBundle = new barApp.appStrings.StringBundle("dialogs/license/wizard.properties");
            if (!data.HomePage.text && data.HomePage.display) {
                data.HomePage.text = stringBundle.get("homepage.label");
                if (branding.getYandexFeatureState("homepage-protection")) {
                    data.HomePage.text += " " + stringBundle.get("homepageProtect.label");
                }
            }
            if (!data.DefaultSearch.text && data.DefaultSearch.display) {
                data.DefaultSearch.text = stringBundle.get("defaultsearch.label");
            }
            if (!data.UsageStat.text && data.UsageStat.display) {
                data.UsageStat.text = stringBundle.get("confirmSendUsageStat.label");
            }
            data.productName = branding.productInfo.ProductName1.nom;
            this._setupData = data;
        }
        return this._setupData;
    },
    get isYandexFirefoxDistribution() {
        let isYandexDistrib = Preferences.get("app.distributor", false) == "yandex";
        if (!isYandexDistrib) {
            let curProcDir;
            try {
                curProcDir = Services.dirsvc.get("CurProcD", Ci.nsIFile);
                if (curProcDir.leafName === "browser") {
                    curProcDir = curProcDir.parent;
                }
            } catch (e) {
            }
            if (curProcDir) {
                [
                    "distribution",
                    "extensions",
                    "yasearch@yandex.ru"
                ].forEach(aPath => curProcDir.append(aPath));
                isYandexDistrib = curProcDir.exists();
            }
        }
        this.__defineGetter__("isYandexFirefoxDistribution", function () {
            return isYandexDistrib;
        });
        return this.isYandexFirefoxDistribution;
    },
    getBrowserHomePage: function Installer_getBrowserHomePage() {
        let currentHP = this._getLocalizedPref(BROWSER_STARTUP_HOMEPAGE_PREF, null);
        if (!currentHP) {
            let configBundle = Services.strings.createBundle("chrome://branding/locale/browserconfig.properties");
            currentHP = configBundle.GetStringFromName(BROWSER_STARTUP_HOMEPAGE_PREF);
        }
        return currentHP;
    },
    setBrowserHomePage: function Installer_setBrowserHomePage(aHomePageURL) {
        let url = arguments.length ? aHomePageURL : this.setupData.HomePage.url;
        this._setBrowserHomePage(url);
    },
    isYandexHomePage: function Installer_isYandexHomePage(aHomePageURL) {
        let url = arguments.length ? aHomePageURL : this.getBrowserHomePage();
        return Boolean(url && (/^(https?:\/\/)?([^.]+\.)*yandex\.(ru|ua|kz|by|com|com\.tr)(\/|$)/i.test(url) || /^(https?:\/\/)?ya\.ru(\/|$)/i.test(url) || url === "yafd:tabs"));
    },
    isYandexURL: function Installer_isYandexURL(aURL) {
        return Boolean(aURL && (/^(https?:\/\/)?(www\.)?yandex\.(ru|ua|kz|by|com|com\.tr)(\/|$)/i.test(aURL) || /^(https?:\/\/)?ya\.ru(\/|$)/i.test(aURL)));
    },
    isOverridableURL: function Installer_isOverridableURL(aURL) {
        return !(aURL && (this.isYandexURL(aURL) || /^(https?:\/\/)?((www|search)\.)?seznam\.cz(\/|$)/i.test(aURL) || /^(https?:\/\/)?(www\.)?bozzon\.com(\/|$)/i.test(aURL)));
    },
    setCurrentSearchEngine: function Installer_setCurrentSearchEngine() {
        if (this.isCurrentQSOverridable()) {
            this._writeQuickSearches({ onlyFirstEngine: true });
        }
    },
    isCurrentQSOverridable: function Installer_isCurrentQSOverridable() {
        let selectedEngineName = this._getLocalizedPref("browser.search.selectedEngine", null) || this._getLocalizedPref("browser.search.defaultenginename", null);
        return this.isQSOverridable(selectedEngineName);
    },
    isQSOverridable: function Installer_isQSOverridable(aQSName) {
        return this._overridableQSNames.indexOf(aQSName) == -1;
    },
    get _overridableQSNames() {
        delete this._overridableQSNames;
        this._overridableQSNames = [
            strutils.utf8Converter.ConvertToUnicode("Яндекс"),
            "Yandex",
            "Seznam",
            "Bozzon"
        ];
        return this._overridableQSNames;
    },
    _showWelcomePageOnStartup: function Installer__showWelcomePageOnStartup() {
        let needShow = true;
        let showPageUrl = "";
        let focusUrlBar = false;
        let wpPrefs = new Preferences(this._application.preferencesBranch + "welcomepage.");
        let wpVersionIntroduced = wpPrefs.get("version.introduced", "0");
        if (wpVersionIntroduced !== "0") {
            return;
        }
        new sysutils.Timer(function Installer_showWelcomePageOnStartup_timed() {
            barApp.navigate({
                url: barApp.protocolSupport.url,
                target: "new tab"
            });
            wpPrefs.set("version.introduced", barApp.addonManager.addonVersion);
            misc.getTopBrowserWindow().focusAndSelectUrlBar();
        }, 500);
    },
    _setupWelcomePageObjectProvider: function Installer__setupWelcomePageObjectProvider() {
        this._application.contentEnvironment.addPlatformObjectProvider({
            getListenerForPage: function installer_wppo_getListenerForPage({url, meta}) {
                if (meta !== "ru.yandex.welcomepage") {
                    return null;
                }
                let getWidgetItem = function getWidgetItem(componentId) {
                    let topBrowser = misc.getTopBrowserWindow();
                    let overlayController = topBrowser && topBrowser[barApp.name + "OverlayController"];
                    return overlayController && overlayController.getWidgetItems(componentId)[0];
                };
                return {
                    onPageMessage: function installer_wppo_onPageMessage(name, data) {
                        switch (name) {
                        case "ru.yandex.smartbox": {
                                if (data.command === "open") {
                                    if (installer._application.branding.brandID === "tb") {
                                        return false;
                                    }
                                    let componentId = "http://bar-widgets.yandex.ru/packages/approved/176/manifest.xml#smartbox";
                                    try {
                                        let omniboxPlugin = installer._application.widgetLibrary.getPlugin(componentId);
                                        if (omniboxPlugin && omniboxPlugin.enabled) {
                                            omniboxPlugin.nativeModule.core.showTutorWithText(data.text);
                                            return true;
                                        }
                                    } catch (e) {
                                        installer._logger.error(e);
                                    }
                                }
                                break;
                            }
                        case "ru.yandex.mail": {
                                if (data.command === "openSlice") {
                                    let componentDOMItem = getWidgetItem("http://bar.yandex.ru/packages/yandexbar#mail");
                                    if (componentDOMItem) {
                                        componentDOMItem.showMailSlice();
                                        return true;
                                    }
                                }
                                break;
                            }
                        case "ru.yandex.weather": {
                                if (data.command === "openSlice") {
                                    let componentDOMItem = getWidgetItem("http://bar.yandex.ru/packages/yandexbar#town");
                                    if (componentDOMItem) {
                                        componentDOMItem.mWeatherButton.doCommand();
                                        return true;
                                    }
                                }
                                break;
                            }
                        case "ru.yandex.powerfm": {
                                if (data.command === "openSlice") {
                                    let componentId = "http://bar-widgets.yandex.ru/packages/approved/287/manifest.xml#powerfm";
                                    let componentDOMItem = getWidgetItem(componentId);
                                    if (componentDOMItem) {
                                        if ("showSlice" in componentDOMItem) {
                                            componentDOMItem.showSlice();
                                            return true;
                                        } else {
                                            let button = componentDOMItem.ownerDocument.getAnonymousElementByAttribute(componentDOMItem, "anonid", "powerfm-button-main");
                                            if (button) {
                                                button.doCommand();
                                                return true;
                                            }
                                        }
                                    }
                                }
                                break;
                            }
                        }
                        return false;
                    }
                };
            }
        });
    },
    _onAddonInstall: function Installer__onAddonInstall() {
        let setupData = this.setupData;
        if (setupData.HomePage.checked) {
            this._setBrowserHomePage(setupData.HomePage.url);
        }
        if (setupData.DefaultSearch.checked) {
            this._writeQuickSearches();
        }
        if (!this._application.preferences.has("stat.usage.send")) {
            let usageStatChecked = setupData.UsageStat.checked;
            this._application.statistics.sendUsageStat = usageStatChecked;
        }
    },
    _onAddonUpdated: function Installer__onAddonUpdated() {
        this._writeQuickSearches({ onlyUpdateInstalled: true });
    },
    _onAddonDisabling: function Installer__onAddonDisabling() {
        this._revertChangedPreferencesOnDisabling();
        const ftabAddress = this._application.protocolSupport.url;
        const BROWSER_HOMEPAGE_PREFNAME = "browser.startup.homepage";
        this.closeTabs(ftabAddress);
        let ftabUrl = this._application.core.CONFIG.APP.PROTOCOL + ":tabs";
        if (Preferences.get(BROWSER_NTP_PREFNAME) === ftabUrl) {
            Preferences.ignore(BROWSER_NTP_PREFNAME, this);
            Preferences.reset(BROWSER_NTP_PREFNAME);
        }
        this._application.preferences.set("disabled", true);
        if (Preferences.get(BROWSER_HOMEPAGE_PREFNAME) === ftabAddress) {
            Preferences.reset(BROWSER_HOMEPAGE_PREFNAME);
        }
    },
    _onAddonDisablingCancelled: function Installer__onAddonDisablingCancelled() {
        this._revertChangedPreferencesOnDisablingCancelled();
        Preferences.observe(BROWSER_NTP_PREFNAME, this);
        this.setBrowserNewTabUrl();
        this._application.preferences.reset("disabled");
        let goodbyeURL = this.setupData.GoodbyePage.url;
        if (goodbyeURL) {
            this.closeTabs(goodbyeURL);
        }
    },
    _onAddonUninstalling: function Installer__onAddonUninstalling() {
        let goodbyeURL = this.setupData.GoodbyePage.url;
        if (goodbyeURL) {
            misc.navigateBrowser({
                url: goodbyeURL,
                target: "new tab",
                loadInBackground: true
            });
        }
        let currentHomePages = Preferences.get("browser.startup.homepage").split("|");
        if (currentHomePages.length > 1) {
            let index = currentHomePages.indexOf(this._application.protocolSupport.url);
            if (index !== -1) {
                currentHomePages.splice(index, 1);
                Preferences.set("browser.startup.homepage", currentHomePages.join("|"));
            }
        } else if (currentHomePages[0] === this._application.protocolSupport.url) {
            Preferences.reset("browser.startup.homepage");
        }
    },
    _setBrowserHomePage: function Installer__setBrowserHomePage(aHomePageURL) {
        if (!aHomePageURL) {
            this._logger.warn("Empty homepage url.");
            return;
        }
        let changedPreferences = Object.create(null);
        let currentStartupPage = Preferences.get(BROWSER_STARTUP_PAGE_PREF, 1);
        if (currentStartupPage === 0) {
            Preferences.set(BROWSER_STARTUP_PAGE_PREF, 1);
            changedPreferences.fromStartup = 0;
            changedPreferences.toStartup = 1;
        }
        let currentHP = this.getBrowserHomePage();
        let homePageURL = this.isOverridableURL(currentHP) ? aHomePageURL : currentHP;
        Preferences.set(BROWSER_STARTUP_HOMEPAGE_PREF, homePageURL);
        changedPreferences.toURL = homePageURL;
        changedPreferences.fromURL = currentHP;
        try {
            let previousData = JSON.parse(this._preferences.get("installer.override.homepage", null));
            if (previousData && typeof previousData === "object") {
                changedPreferences.fromStartup = previousData.fromStartup;
                changedPreferences.fromURL = previousData.fromURL;
            }
        } catch (e) {
        }
        this._preferences.set("installer.override.homepage", JSON.stringify(changedPreferences));
        Preferences.set(this._application.preferencesBranch + "defender.homepage.protected", homePageURL);
        this._logger.debug("Changed browser HP from '" + currentHP + "' to '" + homePageURL + "'");
    },
    _getDataForDistribution: function Installer__getDataForDistribution() {
        let homePageURL = this.setupData.HomePage.url;
        let currentHomePageURL = this.getBrowserHomePage();
        let homePageEqualDefault = currentHomePageURL == homePageURL || !this.isOverridableURL(currentHomePageURL) && !this.isOverridableURL(homePageURL);
        let quickSearchers = this._getQuickSearchers();
        let firstQSShortName = quickSearchers[0] && quickSearchers[0].shortName;
        let defaultEngineName = this._getLocalizedPref("browser.search.defaultenginename", null);
        let quickSearchEqualDefault = Boolean(defaultEngineName && (defaultEngineName == firstQSShortName || !this.isQSOverridable(defaultEngineName) && !this.isQSOverridable(firstQSShortName)));
        return {
            isHomepageChecked: false,
            isDefaultHomepage: homePageEqualDefault,
            HP: { url: homePageURL },
            isSearchChecked: false,
            isDefaultQS: quickSearchEqualDefault,
            QS: quickSearchers
        };
    },
    _getQuickSearchers: function Installer__getQuickSearchers() {
        let qsList = [];
        let quickSearches;
        let configXML;
        try {
            configXML = branding.brandPackage.getXMLDocument("/browser/browserconf.xml");
            quickSearches = configXML.querySelectorAll("Browser > QuickSearch > OpenSearchDescription");
        } catch (e) {
            Cu.reportError(e);
            return qsList;
        }
        if (!quickSearches || !quickSearches.length) {
            return qsList;
        }
        const DataURI = Cu.import("resource://" + barApp.name + "-mod/DataURI.jsm", {}).DataURI;
        const YB_NS = "http://bar.yandex.ru/";
        for (let i = 0, len = quickSearches.length; i < len; i++) {
            let qs = quickSearches[i];
            let uniqName = qs.getAttributeNS(YB_NS, "uniqName");
            if (!uniqName) {
                continue;
            }
            let shortName = qs.querySelector("ShortName");
            shortName = shortName && shortName.textContent || "";
            if (!shortName) {
                continue;
            }
            let osUrls = qs.querySelectorAll("Url");
            for (let j = 0, len = osUrls.length; j < len; j++) {
                let url = osUrls[j];
                let templateAttr = url.getAttribute("template");
                if (templateAttr) {
                    url.setAttribute("template", branding.expandBrandTemplatesEscape(templateAttr));
                }
            }
            let searchURL = "";
            let searchURLElement = qs.querySelector("Url:not([rel])[type='text/html']");
            if (searchURLElement && searchURLElement.hasAttribute("template")) {
                searchURL = searchURLElement.getAttribute("template");
            }
            let suggestURL = "";
            let suggestURLElement = qs.querySelector("Url[rel='suggestions'][type='application/json']");
            if (suggestURLElement && suggestURLElement.hasAttribute("template")) {
                suggestURL = suggestURLElement.getAttribute("template");
            }
            let inputEncoding = qs.querySelector("InputEncoding");
            inputEncoding = inputEncoding && inputEncoding.textContent || "UTF-8";
            let imageURL;
            let image = qs.querySelector("Image");
            if (image) {
                let imageFile;
                let imagePath = image.textContent;
                imageURL = imagePath;
                if (imagePath && (imageFile = branding.brandPackage.findFile(imagePath))) {
                    image.textContent = DataURI.fromFile(imageFile);
                    imageURL = image.textContent;
                }
            }
            let qsObject = {
                uniqName: uniqName,
                isDefault: i === 0,
                shortName: shortName,
                image: imageURL,
                searchURL: searchURL,
                suggestURL: suggestURL,
                inputEncoding: inputEncoding
            };
            qsList.push(qsObject);
        }
        return qsList;
    },
    _writeQuickSearches: function Installer__writeQuickSearches(options) {
        let writeQuickSearches = function () {
            new sysutils.Timer(function () {
                this.__writeQuickSearches(options);
            }.bind(this), 0);
        }.bind(this);
        Services.search.init({ onInitComplete: writeQuickSearches });
    },
    __writeQuickSearches: function Installer___writeQuickSearches(options = {}) {
        let quickSearches;
        let configXML;
        try {
            configXML = branding.brandPackage.getXMLDocument("/browser/browserconf.xml");
            quickSearches = configXML.querySelectorAll("Browser > QuickSearch > OpenSearchDescription");
        } catch (e) {
            Cu.reportError(e);
            return;
        }
        if (!quickSearches || !quickSearches.length) {
            return;
        }
        if (options.onlyFirstEngine) {
            quickSearches = [quickSearches[0]];
        }
        this._logger.debug("Found " + quickSearches.length + " search plugins in branding.");
        let searchPluginsDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        searchPluginsDir.append("searchplugins");
        fileutils.forceDirectories(searchPluginsDir);
        if (!searchPluginsDir.exists() || !searchPluginsDir.isDirectory()) {
            return;
        }
        let installedFilesPaths = [];
        let installedQS = Object.create(null);
        let searchPluginsDirEntries = searchPluginsDir.directoryEntries;
        while (searchPluginsDirEntries.hasMoreElements()) {
            let qsFile = searchPluginsDirEntries.getNext().QueryInterface(Ci.nsIFile);
            if (!qsFile.isFile()) {
                continue;
            }
            let uniqName = /^(?:yqs\-[^\-]+|ybqs)\-(.+)\.xml$/.exec(qsFile.leafName);
            if (uniqName && uniqName[1]) {
                installedQS[uniqName[1]] = qsFile;
            }
            installedFilesPaths.push(qsFile.path);
        }
        const QS_FILENAME_PREFIX = "yqs-" + this._application.core.CONFIG.APP.TYPE + "-";
        const DataURI = Cu.import("resource://" + barApp.name + "-mod/DataURI.jsm", {}).DataURI;
        const YB_NS = "http://bar.yandex.ru/";
        let searchService = Services.search;
        let selectedEngineName = null;
        for (let i = 0, len = quickSearches.length; i < len; i++) {
            let qs = quickSearches[i];
            let uniqName = qs.getAttributeNS(YB_NS, "uniqName");
            if (!uniqName) {
                this._logger.error("No 'uniqName' in the search plugin from branding.");
                continue;
            }
            let qsFileName = QS_FILENAME_PREFIX + uniqName + ".xml";
            this._convertQuickSearch(qs);
            let searchURLElement = qs.querySelector("Url[type='text/html']");
            let searchURL = searchURLElement && searchURLElement.getAttribute("template") || null;
            if (!searchURL) {
                this._logger.debug("Can not find search url in the '" + uniqName + "' search plugin.");
                continue;
            }
            if (options.onlyUpdateInstalled) {
                if (uniqName in installedQS) {
                    this._logger.debug("QS with name '" + uniqName + "' is already exists.");
                    let installedFile = installedQS[uniqName];
                    if (installedFile.leafName === qsFileName) {
                        fileutils.removeFileSafe(installedFile);
                        fileutils.writeTextFile(installedFile, xmlutils.serializeXML(qs));
                        this._logger.debug("Rewrite existed QS file for '" + uniqName + "'.");
                    }
                }
                continue;
            }
            let shortName = qs.querySelector("ShortName");
            shortName = shortName.textContent || "";
            if (i === 0) {
                if (!this.isCurrentQSOverridable()) {
                    continue;
                }
                const smartboxProtoID = "http://bar-widgets.yandex.ru/packages/approved/176/manifest.xml#smartbox";
                let smartboxPrefName = "extensions.yasearch@yandex.ru.native_comps." + smartboxProtoID + ".all.settings.searchName";
                if (Preferences.has(smartboxPrefName)) {
                    Preferences.set(smartboxPrefName, shortName);
                }
                selectedEngineName = shortName;
                this._logger.debug("Set '" + shortName + "' as selected engine.");
            } else if (uniqName in installedQS) {
                this._logger.debug("QS with name '" + uniqName + "' is already exists.");
                continue;
            }
            this._logger.debug("Add search engine '" + shortName + "'.");
            let getQSElementContent = function (elementName) {
                let element = qs.querySelector(elementName);
                return element = element.textContent || null;
            };
            if (!searchService.getEngineByName(shortName)) {
                try {
                    searchService.addEngineWithDetails(shortName, getQSElementContent("Image") || null, shortName, getQSElementContent("Description"), "get", searchURL);
                } catch (e) {
                    this._logger.error(e);
                }
            }
            let qsFile = searchPluginsDir.clone();
            qsFile.append(qsFileName);
            fileutils.removeFileSafe(qsFile);
            fileutils.writeTextFile(qsFile, xmlutils.serializeXML(qs));
            installedFilesPaths.push(qsFile.path);
        }
        if (options.onlyUpdateInstalled) {
            return;
        }
        if (selectedEngineName) {
            this._setSelectedEngine(selectedEngineName);
        }
        let tempQSList = [];
        searchPluginsDirEntries = searchPluginsDir.directoryEntries;
        while (searchPluginsDirEntries.hasMoreElements()) {
            let qsFile = searchPluginsDirEntries.getNext().QueryInterface(Ci.nsIFile);
            if (!qsFile.isFile()) {
                continue;
            }
            if (installedFilesPaths.indexOf(qsFile.path) === -1) {
                tempQSList.push(qsFile.leafName);
            }
        }
        this._preferences.set(TEMP_QS_PREF, JSON.stringify(tempQSList));
    },
    _convertQuickSearch: function Installer__convertQuickSearch(qsElement) {
        const DataURI = Cu.import("resource://" + this._application.name + "-mod/DataURI.jsm", {}).DataURI;
        let images = qsElement.querySelectorAll("Image");
        for (let i = 0, len = images.length; i < len; i++) {
            let image = images[i];
            if (image && image.textContent) {
                let imageFile = branding.brandPackage.findFile(image.textContent);
                if (imageFile) {
                    image.textContent = DataURI.fromFile(imageFile);
                }
            }
        }
        let description = qsElement.querySelector("Description");
        description = description.textContent || "";
        let osUrls = qsElement.querySelectorAll("Url");
        for (let i = 0, len = osUrls.length; i < len; i++) {
            let url = osUrls[i];
            let templateAttr = url.getAttribute("template");
            if (templateAttr) {
                url.setAttribute("template", branding.expandBrandTemplatesEscape(templateAttr));
            }
            let typeAttr = url.getAttribute("type");
            if (typeAttr == "application/json") {
                url.setAttribute("type", "application/x-suggestions+json");
            }
        }
        let searchFormURLElement = qsElement.querySelector("Url[rel='search-form'][type='text/html']");
        if (searchFormURLElement) {
            let searchFormURL = searchFormURLElement.getAttribute("template");
            searchFormURLElement.parentNode.removeChild(searchFormURLElement);
            let searchFormElement = qsElement.ownerDocument.createElement("SearchForm");
            searchFormElement.textContent = searchFormURL;
            qsElement.appendChild(searchFormElement);
        }
        return qsElement;
    },
    _setSelectedEngine: function Installer__setSelectedEngine(engineName) {
        new sysutils.Timer(function () {
            let searchService = Services.search;
            let changedPreferences = Object.create(null);
            try {
                let previousData = JSON.parse(this._preferences.get("installer.override.search", null));
                if (previousData && typeof previousData === "object") {
                    changedPreferences = previousData;
                }
            } catch (e) {
            }
            if (!("defaultFrom" in changedPreferences)) {
                let selectedDefaultEngine = searchService.defaultEngine;
                let selectedDefaultEngineName = selectedDefaultEngine && selectedDefaultEngine.name || null;
                changedPreferences.defaultFrom = selectedDefaultEngineName;
            }
            if (!("selectedFrom" in changedPreferences)) {
                let selectedCurrentEngine = searchService.currentEngine;
                let selectedCurrentEngineName = selectedCurrentEngine && selectedCurrentEngine.name || null;
                changedPreferences.selectedFrom = selectedCurrentEngineName;
            }
            changedPreferences.defaultTo = engineName;
            changedPreferences.selectedTo = engineName;
            let selectedEngine = searchService.getEngineByName(engineName);
            if (selectedEngine) {
                searchService.currentEngine = selectedEngine;
                searchService.defaultEngine = selectedEngine;
            }
            this._preferences.set("installer.override.search", JSON.stringify(changedPreferences));
            this._logger.debug("Changed browser QS to '" + engineName + "'");
        }.bind(this), 100);
    },
    getYandexQSApplicationFile: function Installer_getYandexQSApplicationFile() {
        let curProcDir;
        try {
            curProcDir = Services.dirsvc.get("CurProcD", Ci.nsIFile);
        } catch (e) {
            return null;
        }
        let yandexQSFile = curProcDir.clone();
        [
            "distribution",
            "searchplugins",
            "common",
            "yasearch.xml"
        ].forEach(aPath => yandexQSFile.append(aPath));
        [
            "yandex.xml",
            "yandex.ru-be.xml",
            "yandex-tr.xml"
        ].some(function (qsName) {
            if (yandexQSFile.exists() && yandexQSFile.isFile()) {
                return true;
            }
            yandexQSFile = curProcDir.clone();
            yandexQSFile.append("searchplugins");
            yandexQSFile.append(qsName);
            return false;
        });
        if (!(yandexQSFile.exists() && yandexQSFile.isFile())) {
            return null;
        }
        return yandexQSFile;
    },
    _showLicenseWindow: function Installer__showLicenseWindow() {
        let args = [
            sysutils.platformInfo.os.name,
            this.setupData
        ];
        args.wrappedJSObject = args;
        let windowURL = "chrome://" + barApp.name + "/content/dialogs/license/wizard.xul";
        try {
            let setupWin = Services.ww.openWindow(null, windowURL, null, "centerscreen,modal,popup=yes", args);
            let accepted = this.setupData.License.checked;
            if (accepted) {
                this._logLicenseWindowStatistics();
            }
            return accepted;
        } catch (e) {
            Cu.reportError(e);
        }
        return true;
    },
    _logLicenseWindowStatistics: function Installer__logLicenseWindowStatistics() {
        let flags = {
            defhp: "HomePage",
            defqs: "DefaultSearch",
            statsend: "UsageStat"
        };
        for (let [
                    flagName,
                    checkboxName
                ] in Iterator(flags)) {
            if (!(checkboxName in this.setupData) || !this.setupData[checkboxName].display) {
                delete flags[flagName];
            }
            flags[flagName] = this.setupData[checkboxName].checked ? 1 : 0;
        }
        this._application.addonStatus.logAddonEvents(flags);
    },
    _setBarNavigRequests: function Installer__setBarNavigRequests(aType, aData) {
        let requests = this._application.preferences.get("stat.usage.requests", "{}");
        try {
            requests = JSON.parse(requests);
        } catch (e) {
            Cu.reportError(e);
            requests = {};
        }
        if (!requests[aType]) {
            requests[aType] = [];
        }
        requests[aType].push(aData);
        this._application.preferences.set("stat.usage.requests", JSON.stringify(requests));
    },
    get _promoFile() {
        let offerDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        offerDir.append("yandex-offer");
        let promoFile = offerDir.clone();
        promoFile.append("promo.png");
        if (!(promoFile.exists() && promoFile.isFile())) {
            return null;
        }
        return promoFile;
    },
    _removePromoFile: function Installer__removePromoFile() {
        let promoFile = this._promoFile;
        if (!promoFile) {
            return null;
        }
        let offerDir = promoFile.parent;
        fileutils.removeFileSafe(promoFile);
        if (offerDir && offerDir.isDirectory() && !offerDir.directoryEntries.hasMoreElements()) {
            fileutils.removeFileSafe(offerDir);
        }
    },
    _setPersonasTheme: function Installer__setPersonasTheme() {
        let lwtData;
        let addonFS = this._application.addonFS;
        try {
            let dataStream = addonFS.getStream("defaults/personas-skin/data.json");
            lwtData = JSON.parse(fileutils.readStringFromStream(dataStream));
        } catch (e) {
        }
        if (!(lwtData && lwtData.id)) {
            return;
        }
        [
            "installDate",
            "updateDate"
        ].forEach(function (datePropName) {
            if (datePropName in lwtData) {
                lwtData[datePropName] = Date.now();
            }
        });
        let profileDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        [
            "header",
            "footer"
        ].forEach(function (imageType) {
            let name = "eco-personas-" + imageType + ".jpg";
            try {
                addonFS.copySource("defaults/personas-skin/" + imageType + ".jpg", profileDir, name);
            } catch (e) {
            }
            let fileCopy = profileDir.clone();
            fileCopy.append(name);
            if (fileCopy.exists() && fileCopy.isFile()) {
                try {
                    let uri = Services.io.newFileURI(fileCopy);
                    if (uri) {
                        lwtData[imageType + "URL"] = uri.spec;
                    }
                } catch (e) {
                }
            }
        });
        let tempScope = {};
        Cu.import("resource://gre/modules/LightweightThemeManager.jsm", tempScope);
        let lwtManager = tempScope.LightweightThemeManager;
        let currentTheme = lwtManager.currentTheme;
        lwtManager.setLocalTheme(lwtData);
    },
    setBrowserNewTabUrl: function Installer_setBrowserNewTabUrl() {
        let ftabUrl = this._application.core.CONFIG.APP.PROTOCOL + ":tabs";
        Preferences.set(BROWSER_NTP_PREFNAME, ftabUrl);
    },
    _revertChangedPreferencesOnDisabling: function Installer__revertChangedPreferencesOnDisabling() {
        this._revertChangedPreferences();
        this._preferences.set("installer.override.revertedOnDisable", true);
    },
    _revertChangedPreferencesOnDisablingCancelled: function Installer__revertChangedPreferencesOnDisablingCancelled() {
        this._revertChangedPreferences();
        this._preferences.reset("installer.override.revertedOnDisable");
    },
    _revertChangedPreferences: function Installer__revertChangedPreferences() {
        try {
            this._revertChangedHomepage();
            this._revertChangedQuickSearch();
        } catch (e) {
            this._logger.error("Can not change preferences.");
            this._logger.debug(e);
            this._preferences.reset("installer.override");
        }
    },
    _revertChangedHomepage: function Installer__revertChangedHomepage() {
        let changedHomepagePreferences;
        try {
            changedHomepagePreferences = JSON.parse(this._preferences.get("installer.override.homepage"));
        } catch (e) {
        }
        if (changedHomepagePreferences && typeof changedHomepagePreferences === "object") {
            if (changedHomepagePreferences.toURL === this.getBrowserHomePage()) {
                if (changedHomepagePreferences.fromURL) {
                    Preferences.set(BROWSER_STARTUP_HOMEPAGE_PREF, changedHomepagePreferences.fromURL);
                } else {
                    Preferences.reset(BROWSER_STARTUP_HOMEPAGE_PREF);
                }
                if (Preferences.get(BROWSER_STARTUP_PAGE_PREF, null) === changedHomepagePreferences.fromStartup) {
                    Preferences.set(BROWSER_STARTUP_PAGE_PREF, changedHomepagePreferences.toStartup);
                }
                let {
                    fromURL: toURL,
                    toURL: fromURL,
                    fromStartup: toStartup,
                    toStartup: fromStartup
                } = changedHomepagePreferences;
                changedHomepagePreferences.toURL = toURL;
                changedHomepagePreferences.fromURL = fromURL;
                changedHomepagePreferences.toStartup = toStartup;
                changedHomepagePreferences.fromStartup = fromStartup;
                this._preferences.set("installer.override.homepage", JSON.stringify(changedHomepagePreferences));
            } else {
                this._preferences.reset("installer.override.homepage");
            }
        }
    },
    _revertChangedQuickSearch: function Installer__revertChangedQuickSearch() {
        let changedQuickSearchPreferences;
        try {
            changedQuickSearchPreferences = JSON.parse(this._preferences.get("installer.override.search"));
        } catch (e) {
        }
        if (changedQuickSearchPreferences && typeof changedQuickSearchPreferences === "object") {
            const searchService = Services.search;
            let revertQuickSearch = function () {
                let selectedDefaultEngine = searchService.defaultEngine;
                let selectedDefaultEngineName = selectedDefaultEngine && selectedDefaultEngine.name || undefined;
                if (changedQuickSearchPreferences.defaultTo === selectedDefaultEngineName) {
                    let defaultEngine = searchService.getEngineByName(changedQuickSearchPreferences.defaultFrom);
                    if (defaultEngine) {
                        searchService.defaultEngine = defaultEngine;
                    }
                } else {
                    changedQuickSearchPreferences.defaultTo = null;
                    changedQuickSearchPreferences.defaultFrom = null;
                }
                let selectedCurrentEngine = searchService.currentEngine;
                let selectedCurrentEngineName = selectedCurrentEngine && selectedCurrentEngine.name || undefined;
                if (changedQuickSearchPreferences.selectedTo === selectedCurrentEngineName) {
                    let selectedEngine = searchService.getEngineByName(changedQuickSearchPreferences.selectedFrom) || searchService.defaultEngine;
                    if (selectedEngine) {
                        searchService.currentEngine = selectedEngine;
                    }
                } else {
                    changedQuickSearchPreferences.selectedTo = null;
                    changedQuickSearchPreferences.selectedFrom = null;
                }
                let {
                    defaultFrom: defaultTo,
                    defaultTo: defaultFrom,
                    selectedFrom: selectedTo,
                    selectedTo: selectedFrom
                } = changedQuickSearchPreferences;
                changedQuickSearchPreferences.defaultTo = defaultTo;
                changedQuickSearchPreferences.defaultFrom = defaultFrom;
                changedQuickSearchPreferences.selectedTo = selectedTo;
                changedQuickSearchPreferences.selectedFrom = selectedFrom;
                this._preferences.set("installer.override.search", JSON.stringify(changedQuickSearchPreferences));
            }.bind(this);
            searchService.init({
                onInitComplete: function () {
                    revertQuickSearch();
                }
            });
        }
    }
};
const tabsHelper = {
    closeByURL: function TabsHelper_closeByURL(url) {
        this._applyFunctionOnTabsByURL(url, (tabBrowser, tab) => tabBrowser.removeTab(tab));
    },
    selectByURL: function TabsHelper_selectByURL(url) {
        this._applyFunctionOnTabsByURL(url, (tabBrowser, tab) => tabBrowser.selectedTab = tab);
    },
    _applyFunctionOnTabsByURL: function TabsHelper__applyFunctionOnTabsByURL(url, functionToApply) {
        if (!url) {
            return;
        }
        let cropURL = function cropURL(str) {
            return str.split(/[?&#]/)[0].replace(/\/$/, "");
        };
        url = cropURL(url);
        misc.getBrowserWindows().forEach(function (chromeWin) {
            let tabBrowser = chromeWin.gBrowser;
            let tabs = tabBrowser && tabBrowser.tabContainer && Array.slice(tabBrowser.tabContainer.childNodes);
            if (!Array.isArray(tabs)) {
                return;
            }
            tabs.forEach(function (tab) {
                try {
                    if (cropURL(tab.linkedBrowser.currentURI.spec) === url) {
                        functionToApply(tabBrowser, tab);
                    }
                } catch (e) {
                }
            });
        });
    }
};
