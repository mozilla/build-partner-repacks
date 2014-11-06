"use strict";
const EXPORTED_SYMBOLS = ["installer"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const PKG_UPD_TOPIC = "package updated";
const BROWSER_NTP_PREFNAME = "browser.newtab.url";
var branding = null;
var barApp = null;
const TEMP_QS_PREF = "qs.temp";
const installer = {
    init: function Installer_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = barApp = application;
        this._logger = application.getLogger("Installer");
        this._preferences = application.preferences;
        this._brandPrefs = new Preferences(application.preferencesBranch + "branding.");
        branding = application.branding;
        this._cachedBrandTplMap = branding.brandTemplateMap, this._cachedBrowserConf = branding.browserConf;
        if (!this.checkLicenseAccepted())
            throw new Error("License agreement rejected");
        this._loadDefaultBrowserPreferences();
        Preferences.observe(BROWSER_NTP_PREFNAME, this);
        const ObserverService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
        ObserverService.addObserver(this, "sessionstore-windows-restored", false);
        let addonManagerInfo = barApp.addonManager.info;
        if (!this._application.preferences.get("general.install.time"))
            this._application.preferences.set("general.install.time", Math.round(Date.now() / 1000));
        if (addonManagerInfo.isFreshAddonInstall) {
            this._migrateYandexBarData();
        }
        if (addonManagerInfo.addonVersionChanged && addonManagerInfo.addonUpgraded) {
            if (this.isYandexURL(Preferences.get("keyword.URL", "")))
                Preferences.reset("keyword.URL");
            if (!addonManagerInfo.isFreshAddonInstall)
                this._onAddonUpdated();
        }
        this._application.branding.addListener(PKG_UPD_TOPIC, this);
        AddonManager.addAddonListener(this);
        if (this._application.addonManager.info.isFreshAddonInstall || this._application.preferences.get("disabled") === true) {
            if (!this.isDefaultNewTabUrl) {
                this._setAlienNewTabUrls();
            }
            this.setBrowserNewTabUrl();
            this._application.preferences.reset("disabled");
        }
        if (addonManagerInfo.isFreshAddonInstall || addonManagerInfo.addonUpgraded && sysutils.versionComparator.compare(addonManagerInfo.addonLastVersion, "2") < 0) {
            if (!this.isDefaultNewTabUrl) {
                this._setAlienNewTabUrls();
            }
        }
    },
    finalize: function Installer_finalize(doCleanup) {
        this._application.branding.removeListener(PKG_UPD_TOPIC, this);
        this._removeTempQuickSearches();
        Preferences.ignore(BROWSER_NTP_PREFNAME, this);
    },
    _removeTempQuickSearches: function Installer__removeTempQuickSearches() {
        let tempQSList;
        try {
            tempQSList = JSON.parse(this._preferences.get(TEMP_QS_PREF, null));
        } catch (e) {
        }
        if (!Array.isArray(tempQSList))
            return;
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
        const ADDON_INSTALL_EVENTS = {
            onInstalling: 1,
            onInstalled: 1
        };
        if (aAddon.id == this._application.addonManager.addonId && aEventType in ADDON_DISABLE_EVENTS)
            this._onAddonDisabling();
        if (aAddon.id == this._application.addonManager.addonId && aEventType === "onUninstalling")
            this._onAddonUninstalling();
        if (aAddon.id == this._application.addonManager.addonId && aEventType === "onOperationCancelled")
            this._onAddonDisablingCancelled();
        if (aAddon.id == "yasearch@yandex.ru" && aEventType in ADDON_INSTALL_EVENTS) {
            this._logger.config("Yandex.Bar installed. Disabling its visual bookmarks...");
            Preferences.set("yasearch.general.ftab.enabled", false);
        }
    },
    observe: function Installer_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case "sessionstore-windows-restored":
            let addonManagerInfo = this._application.addonManager.info;
            if (addonManagerInfo.isFreshAddonInstall) {
                this.closeTabs("bar:tabs");
                new sysutils.Timer(this.closeTabs.bind(this, "bar:tabs"), 1000);
            }
            this._showWelcomePageOnStartup();
            Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService).removeObserver(this, aTopic, false);
            break;
        case "nsPref:changed":
            switch (aData) {
            case BROWSER_NTP_PREFNAME:
                if (!Preferences.isSet(BROWSER_NTP_PREFNAME)) {
                    Preferences.set(BROWSER_NTP_PREFNAME, this._application.core.CONFIG.APP.PROTOCOL + ":tabs");
                }
                break;
            }
            break;
        case PKG_UPD_TOPIC:
            this._onBrandPkgUpdated();
            break;
        }
    },
    closeTabs: function Installer_closeTabs(url) {
        tabsHelper.closeByURL(url);
    },
    get anonymousStatistic() {
        let isAMOPack = this._application.preferences.get("amo", false);
        let isAMOStatPrefSet = this._application.preferences.get("amo.statChosen", false);
        if (!isAMOPack || isAMOStatPrefSet)
            return false;
        let sendStatPrefSet = this._application.preferences.get("stat.usage.send");
        if (sendStatPrefSet) {
            this._application.preferences.set("amo.statChosen", true);
            return false;
        }
        let installTime = this._application.preferences.get("general.install.time") * 1000;
        let threeDays = 3 * 60 * 60 * 24 * 1000;
        if (Date.now() < installTime + threeDays)
            return false;
        return true;
    },
    set anonymousStatistic(aEnable) {
        this._application.barnavig.sendRequest({ statsend: aEnable ? 1 : 0 });
        this._application.preferences.set("stat.usage.send", aEnable);
        this._application.preferences.set("amo.statChosen", true);
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
    _prefBranch2: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).QueryInterface(Ci.nsIPrefBranch2),
    _getLocalizedPref: function Installer__getLocalizedPref(aPrefName, aDefault) {
        try {
            return this._prefBranch2.getComplexValue(aPrefName, Ci.nsIPrefLocalizedString).data;
        } catch (ex) {
        }
        return aDefault;
    },
    _brandPrefs: null,
    checkLicenseAccepted: function Installer_checkLicenseAccepted() {
        if (barApp.addonManager.isAddonUninstalling)
            return false;
        const acceptedPrefName = barApp.preferencesBranch + "license.accepted";
        if (!Preferences.get(acceptedPrefName, false)) {
            if (!this.setupData.hiddenWizard) {
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
                let prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
                prefService.savePrefFile(null);
            } catch (e) {
                this._logger.error("Could not write prefs file. " + e);
            }
            this._onAddonInstall();
        }
        new sysutils.Timer(function () {
            let selectedEngineName = this._getLocalizedPref("browser.search.selectedEngine", null);
            let defaultEngineName = this._getLocalizedPref("browser.search.defaultenginename", null);
            if ((!selectedEngineName || /^chrome:/.test(selectedEngineName)) && defaultEngineName)
                Preferences.set("browser.search.selectedEngine", defaultEngineName);
        }.bind(this), 2 * 60 * 1000);
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
                            if (!el.hasAttribute(prop))
                                continue;
                            let attrValue = el.getAttribute(prop);
                            if (typeof val == "boolean")
                                attrValue = attrValue == "true";
                            data[aElementName][prop] = attrValue;
                        }
                    }
                    if (data.hiddenWizard && data[aElementName].display)
                        data.hiddenWizard = false;
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
                if (ui)
                    extraParams.push("ui=" + encodeURIComponent(ui));
                extraParams.push("version=" + encodeURIComponent(this._application.addonManager.addonVersion));
                let clidData = this._application.clids.vendorData.clid1;
                if (clidData && clidData.clid)
                    extraParams.push("clid=" + encodeURIComponent(clidData.clid));
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
                if (branding.getYandexFeatureState("homepage-protection"))
                    data.HomePage.text += " " + stringBundle.get("homepageProtect.label");
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
    get isDefaultNewTabUrl() {
        let ftabUrl = this._application.core.CONFIG.APP.PROTOCOL + ":tabs";
        let values = [
            ftabUrl,
            "about:blank",
            "about:newtab"
        ];
        let pref = Preferences.get(BROWSER_NTP_PREFNAME, "about:blank");
        if (~values.indexOf(pref))
            return true;
        return false;
    },
    getBrowserHomePage: function Installer_getBrowserHomePage() {
        const browserHPPrefName = "browser.startup.homepage";
        let currentHP = this._getLocalizedPref(browserHPPrefName, null);
        if (!currentHP) {
            const SBS = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
            let configBundle = SBS.createBundle("chrome://branding/locale/browserconfig.properties");
            currentHP = configBundle.GetStringFromName(browserHPPrefName);
        }
        return currentHP;
    },
    setBrowserHomePage: function Installer_setBrowserHomePage(aHomePageURL) {
        let url = arguments.length ? aHomePageURL : this.setupData.HomePage.url;
        this._setBrowserHomePage(url, true);
    },
    isYandexURL: function Installer_isYandexURL(aURL) {
        return !!(aURL && (/^(https?:\/\/)?(www\.)?yandex\.(ru|ua|kz|by|com|com\.tr)(\/|$)/i.test(aURL) || /^(https?:\/\/)?ya\.ru(\/|$)/i.test(aURL)));
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
    _setAlienNewTabUrls: function Installer__setAlienNewTabUrls() {
        let pref = Preferences.get(BROWSER_NTP_PREFNAME);
        this._application.preferences.set("browser.alien.newtab.url", pref);
    },
    _showWelcomePageOnStartup: function Installer__showWelcomePageOnStartup() {
        let needShow = true;
        let showPageUrl = "";
        let focusUrlBar = false;
        let wpPrefs = new Preferences("extensions." + barApp.addonManager.addonId + ".welcomepage.");
        let wpVersionIntroduced = wpPrefs.get("version.introduced", "0");
        if (wpVersionIntroduced != "0")
            return;
        new sysutils.Timer(function Installer_showWelcomePageOnStartup_timed() {
            barApp.navigate({
                url: barApp.protocolSupport.url,
                target: "new tab"
            });
            wpPrefs.set("version.introduced", barApp.addonManager.addonVersion);
            misc.getTopBrowserWindow().focusAndSelectUrlBar();
        }, 500);
    },
    _onAddonInstall: function Installer__onAddonInstall() {
        let setupData = this.setupData;
        if (setupData.HomePage.checked)
            this._setBrowserHomePage(setupData.HomePage.url, false, true);
        if (setupData.DefaultSearch.checked)
            Preferences.reset("keyword.URL");
        this._writeQuickSearches(setupData.DefaultSearch.checked);
        if (!this._application.preferences.has("stat.usage.send")) {
            let usageStatChecked = setupData.UsageStat.checked;
            if (!usageStatChecked && setupData.hiddenWizard && this._application.core.CONFIG.APP.TYPE == "vbff") {
                usageStatChecked = Preferences.get("extensions.yasearch@yandex.ru.stat.usage.send", false);
            }
            this._application.preferences.set("stat.usage.send", usageStatChecked);
        }
        if (setupData.UsageStat.multipack && this._application.core.CONFIG.APP.TYPE == "barff") {
            let vbPrefName = "extensions.vb@yandex.ru.stat.usage.send";
            if (!Preferences.has(vbPrefName))
                Preferences.set(vbPrefName, setupData.UsageStat.checked);
        }
    },
    _onAddonUpdated: function Installer__onAddonUpdated() {
    },
    _onAddonDisabling: function Installer__onAddonDisabling() {
        const ftabAddress = this._application.protocolSupport.url;
        const BROWSER_HOMEPAGE_PREFNAME = "browser.startup.homepage";
        this.closeTabs(ftabAddress);
        let ftabUrl = this._application.core.CONFIG.APP.PROTOCOL + ":tabs";
        if (Preferences.get(BROWSER_NTP_PREFNAME) === ftabUrl) {
            Preferences.ignore(BROWSER_NTP_PREFNAME, this);
            Preferences.reset(BROWSER_NTP_PREFNAME);
        }
        this._application.preferences.set("disabled", true);
        if (Preferences.get(BROWSER_HOMEPAGE_PREFNAME) === ftabAddress)
            Preferences.reset(BROWSER_HOMEPAGE_PREFNAME);
    },
    _onAddonDisablingCancelled: function Installer__onAddonDisablingCancelled() {
        Preferences.observe(BROWSER_NTP_PREFNAME, this);
        this.setBrowserNewTabUrl();
        this._application.preferences.reset("disabled");
        let goodbyeURL = this.setupData.GoodbyePage.url;
        if (goodbyeURL)
            this.closeTabs(goodbyeURL);
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
            if (osDescription)
                prevDefaultQSName = branding.expandBrandTemplates(osDescription.ShortName, prevBrandMap);
        } catch (e) {
            this._logger.error("Could not get previous QS name. " + e);
        }
        this._writeQuickSearches(null, prevDefaultQSName);
    },
    _setBrowserHomePage: function Installer__setBrowserHomePage(aHomePageURL, aForce, aBrandForce, aPrevBrandHP) {
        if (!aHomePageURL)
            return;
        let currentHP = this.getBrowserHomePage();
        if (!(aForce || aBrandForce) && (!aPrevBrandHP || aPrevBrandHP !== currentHP))
            return;
        let setCurrentHP = !aForce && !this.isOverridableURL(currentHP);
        let homePageURL = setCurrentHP ? currentHP : aHomePageURL;
        Preferences.set("browser.startup.homepage", homePageURL);
        if (Preferences.get("browser.startup.page", 1) === 0)
            Preferences.set("browser.startup.page", 1);
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
        let quickSearchEqualDefault = !!(defaultEngineName && (defaultEngineName == firstQSShortName || !this.isQSOverridable(defaultEngineName) && !this.isQSOverridable(firstQSShortName)));
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
        if (!quickSearches || !quickSearches.length)
            return qsList;
        const DataURI = Cu.import("resource://" + barApp.name + "-mod/DataURI.jsm", {}).DataURI;
        const YB_NS = "http://bar.yandex.ru/";
        for (let i = 0, len = quickSearches.length; i < len; i++) {
            let qs = quickSearches[i];
            let uniqName = qs.getAttributeNS(YB_NS, "uniqName");
            if (!uniqName)
                continue;
            let shortName = qs.querySelector("ShortName");
            shortName = shortName && shortName.textContent || "";
            if (!shortName)
                continue;
            let osUrls = qs.querySelectorAll("Url");
            for (let j = 0, len = osUrls.length; j < len; j++) {
                let url = osUrls[j];
                let templateAttr = url.getAttribute("template");
                if (templateAttr)
                    url.setAttribute("template", branding.expandBrandTemplatesEscape(templateAttr));
            }
            let searchURL = "";
            let searchURLElement = qs.querySelector("Url:not([rel])[type='text/html']");
            if (searchURLElement && searchURLElement.hasAttribute("template"))
                searchURL = searchURLElement.getAttribute("template");
            let suggestURL = "";
            let suggestURLElement = qs.querySelector("Url[rel='suggestions'][type='application/json']");
            if (suggestURLElement && suggestURLElement.hasAttribute("template"))
                suggestURL = suggestURLElement.getAttribute("template");
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
                if (!qsFile.isFile())
                    continue;
                let name = qsFile.leafName;
                if (name.indexOf(QS_FILENAME_PREFIX) == 0 || name.indexOf("ybqs-") == 0 && this._application.core.CONFIG.APP.TYPE == "barff") {
                    fileutils.removeFileSafe(qsFile);
                    continue;
                }
                let uniqName = /^(?:yqs\-[^\-]+|ybqs)\-(.+)\.xml$/.exec(name);
                if (uniqName && uniqName[1])
                    installedQSNames[uniqName[1]] = true;
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
        if (!quickSearches || !quickSearches.length)
            return;
        fileutils.forceDirectories(searchPluginsDir);
        const DataURI = Cu.import("resource://" + barApp.name + "-mod/DataURI.jsm", {}).DataURI;
        const YB_NS = "http://bar.yandex.ru/";
        let searchService = Cc["@mozilla.org/browser/search-service;1"].getService(Ci.nsIBrowserSearchService);
        let selectedEngineName = null;
        for (let i = 0, len = quickSearches.length; i < len; i++) {
            let qs = quickSearches[i];
            let uniqName = qs.getAttributeNS(YB_NS, "uniqName");
            if (!uniqName)
                continue;
            if (i == 0 && forceSetDefault !== false && this.isCurrentQSOverridable()) {
                let shortName = qs.querySelector("ShortName");
                shortName = shortName && shortName.textContent || "";
                let browserDefaultEngineName = this._getLocalizedPref("browser.search.defaultenginename", "");
                if (forceSetDefault || shortName != prevDefaultQSName && prevDefaultQSName === browserDefaultEngineName) {
                    selectedEngineName = shortName;
                }
            }
            if (uniqName in installedQSNames)
                continue;
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
                if (templateAttr)
                    url.setAttribute("template", branding.expandBrandTemplatesEscape(templateAttr));
                let typeAttr = url.getAttribute("type");
                if (typeAttr == "application/json")
                    url.setAttribute("type", "application/x-suggestions+json");
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
            if (!qsFile.isFile())
                continue;
            if (filesBeforeChanges.indexOf(qsFile.leafName) === -1 && !/^(?:yqs\-[^\-]+|ybqs)\-(.+)\.xml$/.test(qsFile.leafName)) {
                tempQSList.push(qsFile.leafName);
            }
        }
        this._preferences.set(TEMP_QS_PREF, JSON.stringify(tempQSList));
    },
    _copyYandexQSFromApplication: function Installer__copyYandexQSFromApplication(aFile) {
        let curProcDir;
        try {
            curProcDir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("CurProcD", Ci.nsIFile);
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
            if (yandexQSFile.exists() && yandexQSFile.isFile())
                return true;
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
    _migrateYandexBarData: function Installer__migrateYandexBarData() {
        this._logger.debug("Migrating Yandex.Bar data...");
        let barDataDirectory = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        barDataDirectory.append("yandex");
        if (!barDataDirectory.exists() || !barDataDirectory.isDirectory()) {
            this._logger.debug("Yandex.Bar extension was not found. Nothing to do");
            this._application.preferences.set("yabar.migrated", false);
            return;
        }
        let ftabsDataDirectory = barDataDirectory.clone(), ftabsDataDirectoryName = "ftab-data", ftabsXmlDataFile = barDataDirectory.clone(), ftabsXmlDataFileName = "ftab.data.xml", storageSqliteFile = barDataDirectory.clone(), storageSqliteFileName = "yasearch-storage.sqlite";
        ftabsDataDirectory.append(ftabsDataDirectoryName);
        ftabsXmlDataFile.append(ftabsXmlDataFileName);
        storageSqliteFile.append(storageSqliteFileName);
        if (ftabsXmlDataFile.exists() && ftabsXmlDataFile.isFile()) {
            ftabsXmlDataFile.copyTo(this._application.core.rootDir, ftabsXmlDataFileName);
            this._application.preferences.set("yabar.migrated", true);
            Preferences.set("yasearch.general.ftab.enabled", false);
        }
        if (ftabsDataDirectory.exists() && ftabsDataDirectory.isDirectory()) {
            try {
                let targetDir = this._application.core.rootDir;
                targetDir.append(ftabsDataDirectoryName);
                if (targetDir.exists() && targetDir.isDirectory()) {
                    targetDir.remove(true);
                }
                ftabsDataDirectory.copyTo(this._application.core.rootDir, ftabsDataDirectoryName);
            } catch (e) {
                this._logger.error(e);
            }
        }
        if (storageSqliteFile.exists() && storageSqliteFile.isFile()) {
            storageSqliteFile.copyTo(this._application.core.rootDir, barApp.name + "-storage.sqlite");
        }
        const extensionId = this._application.addonManager.addonId;
        const migratedPrefNames = [
            "backgroundImage",
            "hideInfoBlock",
            "showBookmarks",
            "backgroundAdjustment",
            "backgroundForceResize",
            "backgroundAlignVertical",
            "backgroundAlignHorizontal",
            "refreshTimeGlobal",
            "gridLayout"
        ];
        migratedPrefNames.forEach(function Installer__migrateYandexBarData_migrateSettings(prefName) {
            let prefValue = Preferences.get("yasearch.general.ftab." + prefName);
            let newPrefName = "ftabs." + prefName;
            if (prefValue === undefined) {
                return;
            }
            if (typeof prefValue === "string" && prefValue.indexOf("yandex-profile-data") !== -1) {
                prefValue = prefValue.replace(/yandex\-profile\-data/, "vb-profile-data");
            }
            if (prefName === "hideInfoBlock") {
                prefValue = !prefValue;
                newPrefName = newPrefName.replace(/hide/, "show");
            }
            this._logger.trace("Migrating preference yasearch.general.ftab." + prefName + "...");
            this._application.preferences.set(newPrefName, prefValue);
        }, this);
        ["stat.firstSearch"].forEach(function Installer__migrateYandexBarData_migrateSettings(prefName) {
            let prefValue = Preferences.get("extensions.yasearch@yandex.ru." + prefName);
            if (prefValue === undefined) {
                return;
            }
            this._application.preferences.set(prefName, prefValue);
        }, this);
        this._logger.debug("Yandex.Bar extension data was successfully migrated!");
    },
    _showLicenseWindow: function Installer__showLicenseWindow() {
        let args = [
            sysutils.platformInfo.os.name,
            this.setupData
        ];
        args.wrappedJSObject = args;
        let windowURL = "chrome://" + barApp.name + "/content/dialogs/license/wizard.xul";
        try {
            let setupWin = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher).openWindow(null, windowURL, null, "centerscreen,modal,popup=yes", args);
            let accepted = this.setupData.License.checked;
            if (accepted)
                this._logLicenseWindowStatistics();
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
            if (!(checkboxName in this.setupData) || !this.setupData[checkboxName].display)
                delete flags[flagName];
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
    setBrowserNewTabUrl: function Installer_setBrowserNewTabUrl() {
        let ftabUrl = this._application.core.CONFIG.APP.PROTOCOL + ":tabs";
        Preferences.set(BROWSER_NTP_PREFNAME, ftabUrl);
    },
    _loadDefaultBrowserPreferences: function Installer__loadDefaultBrowserPreferences() {
        if (branding.getYandexFeatureState("safe-browsing")) {
            let sbPrefName = this._application.preferencesBranch + "safebrowsing.installed";
            if (!Preferences.get(sbPrefName, false)) {
                Preferences.set(sbPrefName, true);
                let safeBrowsingFile = this._application.core.extensionPathFile;
                "defaults/dynamic-preferences/safebrowsing.js".split("/").forEach(s => safeBrowsingFile.append(s));
                this._application.preferences.loadFromFile(safeBrowsingFile);
            }
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
        if (!url)
            return;
        let cropURL = function cropURL(str) {
            return str.split(/[?&#]/)[0].replace(/\/$/, "");
        };
        url = cropURL(url);
        misc.getBrowserWindows().forEach(function (chromeWin) {
            let tabBrowser = chromeWin.gBrowser;
            let tabs = tabBrowser && tabBrowser.tabContainer && Array.slice(tabBrowser.tabContainer.childNodes);
            if (!Array.isArray(tabs))
                return;
            tabs.forEach(function (tab) {
                try {
                    if (cropURL(tab.linkedBrowser.currentURI.spec) === url)
                        functionToApply(tabBrowser, tab);
                } catch (e) {
                }
            });
        });
    }
};
