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
const PKG_UPD_TOPIC = "package updated";
let branding = null;
let barApp = null;
const TEMP_QS_PREF = "qs.temp";
const installer = {
    init: function Installer_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = barApp = application;
        this._preferences = application.preferences;
        this._logger = application.getLogger("Installer");
        this._brandPrefs = new Preferences(application.preferencesBranch + "branding.");
        branding = application.branding;
        this._cachedBrandTplMap = branding.brandTemplateMap, this._cachedBrowserConf = branding.browserConf;
        if (!this.checkLicenseAccepted()) {
            throw new Error("License agreement rejected");
        }
        this._loadDefaultBrowserPreferences();
        Services.obs.addObserver(this, "sessionstore-windows-restored", false);
        let addonManagerInfo = barApp.addonManager.info;
        if (addonManagerInfo.addonVersionChanged && addonManagerInfo.addonUpgraded) {
            if (this.isYandexURL(Preferences.get("keyword.URL", ""))) {
                Preferences.reset("keyword.URL");
            }
            if (!addonManagerInfo.isFreshAddonInstall) {
                this._onAddonUpdated();
            }
        }
        AddonManager.addAddonListener(this);
        if (!this._application.preferences.get("general.install.time")) {
            this._application.preferences.set("general.install.time", Math.round(Date.now() / 1000));
        }
        this._application.branding.addListener(PKG_UPD_TOPIC, this);
    },
    finalize: function Installer_finalize(doCleanup) {
        this._application.branding.removeListener(PKG_UPD_TOPIC, this);
        this._removeTempQuickSearches();
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
        case PKG_UPD_TOPIC:
            this._onBrandPkgUpdated();
            break;
        }
    },
    closeTabs: function Installer_closeTabs(url) {
        tabsHelper.closeByURL(url);
    },
    _onBrandPkgUpdated: function Installer__onBrandPkgUpdated() {
        try {
            this._logger.info("Applying branding package settings for HP, QS, etc...");
            this._applyPartnerSettings();
        } catch (e) {
            this._logger.error("Could not apply partner package settings. \n" + strutils.formatError(e));
            this._logger.debug(e.stack);
        } finally {
            this._cachedBrandTplMap = branding.brandTemplateMap;
            this._cachedBrowserConf = branding.browserConf;
        }
    },
    _getLocalizedPref: function Installer__getLocalizedPref(aPrefName, aDefault) {
        try {
            return Services.prefs.getComplexValue(aPrefName, Ci.nsIPrefLocalizedString).data;
        } catch (ex) {
        }
        return aDefault;
    },
    _brandPrefs: null,
    checkLicenseAccepted: function Installer_checkLicenseAccepted() {
        if (barApp.addonManager.isAddonUninstalling) {
            return false;
        }
        const acceptedPrefName = barApp.name + ".license.accepted";
        if (!Preferences.get(acceptedPrefName, false)) {
            let sendUsageStat = this._showOfferWindow();
            if (sendUsageStat !== null) {
                this._setStatUsageSend(sendUsageStat);
            } else if (!this.setupData.hiddenWizard) {
                try {
                    let accepted = this._showLicenseWindow();
                    if (!accepted) {
                        this._uninstallAddonOnLicenseRefuse();
                        return false;
                    }
                } catch (e) {
                    Cu.reportError(e);
                }
            }
            Preferences.set(acceptedPrefName, true);
            try {
                Services.prefs.savePrefFile(null);
            } catch (e) {
                this._logger.error("Could not write prefs file. " + e);
            }
            this._onAddonInstall();
        }
        new sysutils.Timer(function () {
            let selectedEngineName = this._getLocalizedPref("browser.search.selectedEngine", null);
            let defaultEngineName = this._getLocalizedPref("browser.search.defaultenginename", null);
            if ((!selectedEngineName || /^chrome:/.test(selectedEngineName)) && defaultEngineName) {
                Preferences.set("browser.search.selectedEngine", defaultEngineName);
            }
        }.bind(this), 2 * 60 * 1000);
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
                if (clidData && clidData.clid) {
                    extraParams.push("clid=" + encodeURIComponent(clidData.clid));
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
        const browserHPPrefName = "browser.startup.homepage";
        let currentHP = this._getLocalizedPref(browserHPPrefName, null);
        if (!currentHP) {
            let configBundle = Services.strings.createBundle("chrome://branding/locale/browserconfig.properties");
            currentHP = configBundle.GetStringFromName(browserHPPrefName);
        }
        return currentHP;
    },
    setBrowserHomePage: function Installer_setBrowserHomePage(aHomePageURL) {
        let url = arguments.length ? aHomePageURL : this.setupData.HomePage.url;
        this._setBrowserHomePage(url, true);
    },
    isYandexURL: function Installer_isYandexURL(aURL) {
        return Boolean(aURL && (/^(https?:\/\/)?(www\.)?yandex\.(ru|ua|kz|by|com|com\.tr)(\/|$)/i.test(aURL) || /^(https?:\/\/)?ya\.ru(\/|$)/i.test(aURL)));
    },
    isOverridableURL: function Installer_isOverridableURL(aURL) {
        return !(aURL && (this.isYandexURL(aURL) || /^(https?:\/\/)?((www|search)\.)?seznam\.cz(\/|$)/i.test(aURL) || /^(https?:\/\/)?(www\.)?bozzon\.com(\/|$)/i.test(aURL)));
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
        return this._overridableQSNames = [
            strutils.utf8Converter.ConvertToUnicode("Яндекс"),
            "Yandex",
            "Seznam",
            "Bozzon"
        ];
    },
    _showWelcomePageOnStartup: function Installer__showWelcomePageOnStartup() {
        this._setupWelcomePageObjectProvider();
        let wpPrefs = new Preferences(barApp.name + ".welcomepage.");
        if (wpPrefs.get("dontshow", true)) {
            wpPrefs.reset("dontshow");
            return;
        }
        let wpCurrentVersion = wpPrefs.get("version", "0");
        let wpIntroducedVersion = wpPrefs.get("version.introduced", "0");
        if (wpIntroducedVersion && Services.vc.compare(wpIntroducedVersion, wpCurrentVersion) >= 0) {
            return;
        }
        new sysutils.Timer(function Installer__showWelcomePageOnStartup_timed() {
            wpPrefs.set("version.introduced", wpCurrentVersion);
            let wpURL = branding.productInfo.WelcomePage.url;
            if (!wpURL) {
                return;
            }
            wpURL += "?lang=" + barApp.locale.language;
            let clidData = barApp.clids.vendorData.clid1;
            if (clidData && clidData.clid) {
                wpURL += "&clid=" + encodeURIComponent(clidData.clid);
            }
            let overlayController = misc.getTopBrowserWindow()[barApp.name + "OverlayController"];
            if (overlayController.chevronButton.isHidden) {
                wpURL += "&clear";
            }
            misc.navigateBrowser({
                url: wpURL,
                target: "new tab"
            });
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
                            }
                        case "ru.yandex.mail": {
                                if (data.command === "openSlice") {
                                    let componentDOMItem = getWidgetItem("http://bar.yandex.ru/packages/yandexbar#mail");
                                    if (componentDOMItem) {
                                        componentDOMItem.showMailSlice();
                                        return true;
                                    }
                                }
                            }
                        case "ru.yandex.weather": {
                                if (data.command === "openSlice") {
                                    let componentDOMItem = getWidgetItem("http://bar.yandex.ru/packages/yandexbar#town");
                                    if (componentDOMItem) {
                                        componentDOMItem.mWeatherButton.doCommand();
                                        return true;
                                    }
                                }
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
            this._setBrowserHomePage(setupData.HomePage.url, false, true);
        }
        if (setupData.DefaultSearch.checked) {
            Preferences.reset("keyword.URL");
        }
        this._writeQuickSearches(setupData.DefaultSearch.checked);
        let dataForDistribution = this._getDataForDistribution();
        dataForDistribution.isHomepageChecked = setupData.HomePage.checked;
        dataForDistribution.isSearchChecked = setupData.DefaultSearch.checked;
        this._application.distribution.onInstall(dataForDistribution);
        if (!this._application.preferences.has("stat.usage.send")) {
            let usageStatChecked = setupData.UsageStat.checked;
            if (!setupData.hiddenWizard && setupData.UsageStat.display) {
                this._setBarNavigRequests("common", { statsend: usageStatChecked ? 1 : 0 });
            }
            if (!usageStatChecked && setupData.hiddenWizard && this._application.core.CONFIG.APP.TYPE == "vbff") {
                usageStatChecked = Preferences.get("extensions.yasearch@yandex.ru.stat.usage.send", false);
            }
            this._application.preferences.set("stat.usage.send", usageStatChecked);
        }
        if (setupData.UsageStat.multipack && this._application.core.CONFIG.APP.TYPE == "barff") {
            let vbPrefName = "extensions.vb@yandex.ru.stat.usage.send";
            if (!Preferences.has(vbPrefName)) {
                Preferences.set(vbPrefName, setupData.UsageStat.checked);
            }
        }
    },
    _onAddonUpdated: function Installer__onAddonUpdated() {
        barApp.distribution.onUpdate(this._getDataForDistribution());
    },
    _onAddonDisabling: function Installer__onAddonDisabling() {
    },
    _onAddonDisablingCancelled: function Installer__onAddonDisablingCancelled() {
        let goodbyeURL = this.setupData.GoodbyePage.url;
        if (goodbyeURL) {
            tabsHelper.closeByURL(goodbyeURL);
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
    },
    _cachedBrandTplMap: null,
    _cachedBrowserConf: null,
    _applyPartnerSettings: function Installer__applyPartnerSettings() {
        let prevBrandMap = this._cachedBrandTplMap;
        let prevBrowserConf = this._cachedBrowserConf;
        this.setupData = null;
        let setupData = this.setupData;
        this._logger.debug("prevBrowserConf " + sysutils.dump(prevBrowserConf, 5));
        let prevBrandHP = branding.expandBrandTemplatesEscape(prevBrowserConf.HomePage, prevBrandMap);
        this._logger.debug("prevBrandHP " + prevBrandHP);
        this._setBrowserHomePage(setupData.HomePage.url, false, setupData.HomePage.force, prevBrandHP);
        let prevDefaultQSName;
        try {
            let osDescription = prevBrowserConf.QuickSearch && prevBrowserConf.QuickSearch.OpenSearchDescription;
            if (osDescription) {
                prevDefaultQSName = branding.expandBrandTemplates(osDescription.ShortName, prevBrandMap);
            }
        } catch (e) {
            this._logger.error("Could not get previous QS name. " + e);
        }
        this._writeQuickSearches(null, prevDefaultQSName);
    },
    _setBrowserHomePage: function Installer__setBrowserHomePage(aHomePageURL, aForce, aBrandForce, aPrevBrandHP) {
        if (!aHomePageURL) {
            return;
        }
        let currentHP = this.getBrowserHomePage();
        if (!(aForce || aBrandForce) && (!aPrevBrandHP || aPrevBrandHP !== currentHP)) {
            return;
        }
        let setCurrentHP = !aForce && !this.isOverridableURL(currentHP);
        let homePageURL = setCurrentHP ? currentHP : aHomePageURL;
        Preferences.set("browser.startup.homepage", homePageURL);
        if (Preferences.get("browser.startup.page", 1) === 0) {
            Preferences.set("browser.startup.page", 1);
        }
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
                isDefault: i == 0,
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
    _writeQuickSearches: function Installer__writeQuickSearches(forceSetDefault, prevDefaultQSName) {
        let searchPluginsDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        searchPluginsDir.append("searchplugins");
        let filesBeforeChanges = [];
        const QS_FILENAME_PREFIX = "yqs-" + this._application.core.CONFIG.APP.TYPE + "-";
        let installedQSNames = Object.create(null);
        if (searchPluginsDir.exists() && searchPluginsDir.isDirectory()) {
            let searchPluginsDirEntries = searchPluginsDir.directoryEntries;
            while (searchPluginsDirEntries.hasMoreElements()) {
                let qsFile = searchPluginsDirEntries.getNext().QueryInterface(Ci.nsIFile);
                if (!qsFile.isFile()) {
                    continue;
                }
                let name = qsFile.leafName;
                if (name.indexOf(QS_FILENAME_PREFIX) == 0 || name.indexOf("ybqs-") == 0 && this._application.core.CONFIG.APP.TYPE == "barff") {
                    fileutils.removeFileSafe(qsFile);
                    continue;
                }
                let uniqName = /^(?:yqs\-[^\-]+|ybqs)\-(.+)\.xml$/.exec(name);
                if (uniqName && uniqName[1]) {
                    installedQSNames[uniqName[1]] = true;
                }
                filesBeforeChanges.push(qsFile);
            }
        }
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
        fileutils.forceDirectories(searchPluginsDir);
        const DataURI = Cu.import("resource://" + barApp.name + "-mod/DataURI.jsm", {}).DataURI;
        const YB_NS = "http://bar.yandex.ru/";
        let searchService = Cc["@mozilla.org/browser/search-service;1"].getService(Ci.nsIBrowserSearchService);
        let selectedEngineName = null;
        for (let i = 0, len = quickSearches.length; i < len; i++) {
            let qs = quickSearches[i];
            let uniqName = qs.getAttributeNS(YB_NS, "uniqName");
            if (!uniqName) {
                continue;
            }
            if (i == 0 && forceSetDefault !== false && this.isCurrentQSOverridable()) {
                let shortName = qs.querySelector("ShortName");
                shortName = shortName && shortName.textContent || "";
                let browserDefaultEngineName = this._getLocalizedPref("browser.search.defaultenginename", "");
                if (forceSetDefault || shortName != prevDefaultQSName && prevDefaultQSName === browserDefaultEngineName) {
                    const smartboxProtoID = "http://bar-widgets.yandex.ru/packages/approved/176/manifest.xml#smartbox";
                    Preferences.set("yasearch.native_comps." + smartboxProtoID + ".all.settings.searchName", shortName);
                    selectedEngineName = shortName;
                }
            }
            if (uniqName in installedQSNames) {
                continue;
            }
            let shortName = qs.querySelector("ShortName");
            shortName = shortName.textContent || "";
            let qsFile = searchPluginsDir.clone();
            qsFile.append(QS_FILENAME_PREFIX + uniqName + ".xml");
            if (uniqName == "yandex") {
                let qsFileCopy = this._copyYandexQSFromApplication(qsFile);
                if (qsFileCopy) {
                    if (i == 0 && forceSetDefault) {
                        try {
                            let qsCopyXML = fileutils.xmlDocFromFile(qsFileCopy);
                            shortName = qsCopyXML.querySelector("ShortName");
                            shortName = shortName && shortName.textContent || "";
                            selectedEngineName = shortName;
                        } catch (e) {
                            this._logger.debug("Can not get shortName from copy of Yandex QS.\n" + e);
                        }
                    }
                    continue;
                }
            }
            let images = qs.querySelectorAll("Image");
            for (let j = 0, len = images.length; j < len; j++) {
                let image = images[j];
                if (image && image.textContent) {
                    let imageFile = branding.brandPackage.findFile(image.textContent);
                    if (imageFile) {
                        image.textContent = DataURI.fromFile(imageFile);
                    }
                }
            }
            let description = qs.querySelector("Description");
            description = description.textContent || "";
            let osUrls = qs.querySelectorAll("Url");
            for (let j = 0, len = osUrls.length; j < len; j++) {
                let url = osUrls[j];
                let templateAttr = url.getAttribute("template");
                if (templateAttr) {
                    url.setAttribute("template", branding.expandBrandTemplatesEscape(templateAttr));
                }
                let typeAttr = url.getAttribute("type");
                if (typeAttr == "application/json") {
                    url.setAttribute("type", "application/x-suggestions+json");
                }
            }
            let searchURLElement = qs.querySelector("Url[type='text/html']");
            let searchURL = searchURLElement && searchURLElement.getAttribute("template") || null;
            if (searchURL) {
                let existsEngine = searchService.getEngineByName(shortName);
                if (existsEngine) {
                    this._logger.debug("Search engine with name '" + shortName + "' exists. Remove it.");
                    searchService.removeEngine(existsEngine);
                }
                this._logger.debug("Add search engine '" + shortName + "'.");
                try {
                    searchService.addEngineWithDetails(shortName, images[0] && images[0].textContent || null, shortName, description, "get", searchURL);
                } catch (e) {
                    this._logger.error(e);
                }
            }
            let searchFormURLElement = qs.querySelector("Url[rel='search-form'][type='text/html']");
            if (searchFormURLElement) {
                let searchFormURL = searchFormURLElement.getAttribute("template");
                searchFormURLElement.parentNode.removeChild(searchFormURLElement);
                let searchFormElement = configXML.createElement("SearchForm");
                searchFormElement.textContent = searchFormURL;
                qs.appendChild(searchFormElement);
            }
            fileutils.writeTextFile(qsFile, xmlutils.serializeXML(qs));
        }
        if (selectedEngineName) {
            new sysutils.Timer(function () {
                Preferences.set("browser.search.selectedEngine", selectedEngineName);
                Preferences.set("browser.search.defaultenginename", selectedEngineName);
                let selectedEngine = searchService.getEngineByName(selectedEngineName);
                if (selectedEngine) {
                    searchService.currentEngine = selectedEngine;
                }
                this._logger.debug("Changed browser QS to '" + selectedEngineName + "'");
            }.bind(this), 100);
        }
        let tempQSList = [];
        let searchPluginsDirEntries = searchPluginsDir.directoryEntries;
        while (searchPluginsDirEntries.hasMoreElements()) {
            let qsFile = searchPluginsDirEntries.getNext().QueryInterface(Ci.nsIFile);
            if (!qsFile.isFile()) {
                continue;
            }
            if (filesBeforeChanges.indexOf(qsFile.leafName) === -1 && !/^(?:yqs\-[^\-]+|ybqs)\-(.+)\.xml$/.test(qsFile.leafName)) {
                tempQSList.push(qsFile.leafName);
            }
        }
        this._preferences.set(TEMP_QS_PREF, JSON.stringify(tempQSList));
    },
    _copyYandexQSFromApplication: function Installer__copyYandexQSFromApplication(aFile) {
        let curProcDir;
        try {
            curProcDir = Services.dirsvc.get("CurProcD", Ci.nsIFile);
        } catch (e) {
            return false;
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
        if (yandexQSFile.exists() && yandexQSFile.isFile()) {
            try {
                let resultFile = aFile.parent.clone();
                resultFile.append(aFile.leafName);
                yandexQSFile.copyTo(aFile.parent, aFile.leafName);
                return resultFile.exists() ? resultFile : false;
            } catch (e) {
            }
        }
        return false;
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
    _uninstallAddonOnLicenseRefuse: function Installer__uninstallAddonOnLicenseRefuse() {
        let addonsToUninstall = [barApp.addonManager.addonId];
        if (this.setupData.UsageStat.multipack && this._application.core.CONFIG.APP.TYPE == "barff") {
            addonsToUninstall.push("vb@yandex.ru");
        }
        AddonManager.uninstallAddonsByIDs(addonsToUninstall, true);
    },
    _showOfferWindow: function Installer__showOfferWindow() {
        if (this._application.core.CONFIG.APP.TYPE !== "barff") {
            return null;
        }
        let statUsageSend = this._application.preferences.get("stat.usage.send", false);
        if (statUsageSend) {
            return null;
        }
        let promoFile = this._promoFile;
        if (!promoFile) {
            return null;
        }
        let promoFileURI = Services.io.newFileURI(promoFile);
        let windowURL = "chrome://" + barApp.name + "/content/dialogs/postinstall-offer/dialog.xul";
        let sendUsageStat = { checked: false };
        let framesData = {
            license: branding.brandPackage.resolvePath("/license/fx/license.xhtml"),
            confidential: branding.brandPackage.resolvePath("/license/fx/confidential.xhtml"),
            apache: branding.brandPackage.resolvePath("/license/fx/sublicenses/apache.xhtml")
        };
        let args = [
            promoFileURI.spec,
            framesData,
            sendUsageStat
        ];
        args.wrappedJSObject = args;
        let result = null;
        try {
            let setupWin = Services.ww.openWindow(null, windowURL, null, "centerscreen,modal", args);
            result = sendUsageStat.checked;
        } catch (e) {
            Cu.reportError(e);
        }
        this._setBarNavigRequests("common", { statsend: result ? 1 : 0 });
        const WinReg = Cu.import("resource://" + this._application.name + "-mod/WinReg.jsm", {}).WinReg;
        let allowSYSKeyValue = WinReg.read("HKCU", "Software\\AppDataLow\\Software\\Yandex\\Toolbar", "AllowSYS") || WinReg.read("HKCU", "Software\\Yandex\\Toolbar", "AllowSYS");
        if (allowSYSKeyValue === 1) {
            this.setupData.DefaultSearch.checked = true;
        }
        let allowSYHKeyValue = WinReg.read("HKCU", "Software\\AppDataLow\\Software\\Yandex\\Toolbar", "AllowSYH") || WinReg.read("HKCU", "Software\\Yandex\\Toolbar", "AllowSYH");
        if (allowSYHKeyValue === 1) {
            this.setupData.HomePage.checked = true;
        }
        return result;
    },
    _setStatUsageSend: function Installer__setStatUsageSend(aEnable) {
        this._application.preferences.set("stat.usage.send", aEnable);
        this._application.preferences.set("distr.statChosen", true);
        if (this._application.installer.setupData.UsageStat.multipack && this._application.core.CONFIG.APP.TYPE == "barff") {
            this._application.core.Lib.Preferences.set("extensions.vb@yandex.ru.stat.usage.send", aEnable);
        }
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
    _loadDefaultBrowserPreferences: function Installer__loadDefaultBrowserPreferences() {
        if (!branding.getYandexFeatureState("safe-browsing")) {
            return;
        }
        let prefsDir = this._application.core.extensionPathFile;
        "defaults/dynamic-preferences".split("/").forEach(s => prefsDir.append(s));
        let loadPrefs = function loadPrefs(aFilePath) {
            let prefsFile = prefsDir.clone();
            aFilePath.split("/").forEach(s => prefsFile.append(s));
            if (prefsFile.exists()) {
                this._application.preferences.loadFromFile(prefsFile);
            }
        }.bind(this);
        loadPrefs("safebrowsing.js");
        loadPrefs("locale/" + this._application.locale.language + "/safebrowsing.js");
        loadPrefs("brand/" + branding.brandID + "/safebrowsing.js");
        const sbPrefsPrefix = this._application.preferencesBranch + "safebrowsing.";
        Preferences.reset(sbPrefsPrefix + "installed");
        Preferences.reset(sbPrefsPrefix + "installed2");
        Preferences.reset(sbPrefsPrefix + "installed.version");
    }
};
const tabsHelper = {
    closeByURL: function TabsHelper_closeByURL(url) {
        this._applyFunctionOnTabsByURL(url, function closeTabFn(tabBrowser, tab) {
            return tabBrowser.removeTab(tab);
        });
    },
    selectByURL: function TabsHelper_selectByURL(url) {
        this._applyFunctionOnTabsByURL(url, function selectTabFn(tabBrowser, tab) {
            return tabBrowser.selectedTab = tab;
        });
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
