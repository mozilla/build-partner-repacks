"use strict";
const EXPORTED_SYMBOLS = ["distribution"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
Cu.import("resource://gre/modules/Services.jsm");
function appendFilePath(aFile, aPath) {
    (aPath || "").split("/").forEach(function (p) {
        if (p)
            aFile.append(p);
    });
    return aFile;
}
const distribution = {
        init: function Distribution_init(aApplication) {
            this._application = aApplication;
            this._logger = this._application.getLogger("Distribution");
        },
        PREF_FLAGS: {
            FORCE: 1,
            USER_CONFIRM: 2,
            NOT_INSTALLED: 4,
            DEFAULT_PREF: 8
        },
        get _browsersInfo() {
            var browsers;
            try {
                let distributionXML = this._application.branding.brandPackage.getXMLDocument("/distribution/distribution.xml");
                browsers = distributionXML.querySelector("Distribution > Browsers");
            } catch (e) {
                this._logger.warn("Distribution data is not available. " + this._application.core.Lib.strutils.formatError(e));
            }
            return {
                get: function getBrowserInfo(aBrowserName) {
                    var browser = browsers && (browsers.querySelector("Browser[name='" + aBrowserName + "']") || browsers.querySelector("Browser[name='All']"));
                    return {
                        specified: !!browser,
                        onInstall: browser && parseInt(browser.getAttribute("onInstall"), 10) || 0,
                        onUpdate: browser && parseInt(browser.getAttribute("onUpdate"), 10) || 0
                    };
                }
            };
        },
        onInstall: function Distribution_onInstall(aData) {
            this._writeData(aData, "onInstall");
        },
        onUpdate: function Distribution_onUpdate(aData) {
            this._writeData(aData, "onUpdate");
        },
        _prepeareDataForWriting: function Distribution__prepeareDataForWriting(aData) {
            if (!Array.isArray(aData.QS))
                return;
            aData.QS.forEach(function (qs) {
                var searchURI = Services.io.newURI(qs.searchURL, null, null);
                if (!("keyword" in qs))
                    qs.keyword = searchURI.host;
                if (!("searchURLRegexp" in qs)) {
                    let hostPrefix = searchURI.host.slice(0, -Services.eTLD.getPublicSuffix(searchURI).length).replace(/^www\./, "");
                    qs.searchURLRegexp = new RegExp("^https?:\\/\\/(www\\.)?" + this._application.core.Lib.strutils.escapeRE(hostPrefix) + "[a-z.]+\\/", "i");
                }
            }, this);
        },
        _writeData: function Distribution__writeData(aData, aReasone) {
            this._logger.debug("Write data. Reasone - " + aReasone);
            this._prepeareDataForWriting(aData);
            ChromeBrowsersManager.writeData(aData, aReasone, this._browsersInfo);
        }
    };
const ChromeBrowsersManager = {
        get _application() {
            return distribution._application;
        },
        get _logger() {
            return distribution._logger;
        },
        writeData: function ChromeBrowsersManager_writeData(aData, aReasone, aBrowsersInfo) {
            var sysDirName;
            var pathPrefix = "";
            var osName = this._application.core.Lib.sysutils.platformInfo.os.name;
            switch (osName) {
            case "windows":
                sysDirName = "LocalAppData";
                break;
            case "mac":
                sysDirName = "ULibDir";
                pathPrefix = "Application Support/";
                break;
            case "linux":
                sysDirName = "Home";
                pathPrefix = ".config/";
                break;
            default:
                return;
            }
            var appDataDir;
            try {
                appDataDir = Services.dirsvc.get(sysDirName, Ci.nsIFile);
            } catch (e) {
            }
            if (!appDataDir || !appDataDir.exists()) {
                this._logger.debug("Can't get LocalAppData directory.");
                return;
            }
            var browsers = osName == "linux" ? {
                    "Chrome": { path: pathPrefix + "google-chrome" },
                    "Chromium": { path: pathPrefix + "chromium" },
                    "Bromium": { path: pathPrefix + "bromium" },
                    "Xpom": { path: pathPrefix + "xpom" }
                } : {
                    "Chrome": { path: pathPrefix + "Google/Chrome" },
                    "Chromium": { path: pathPrefix + "Chromium" },
                    "Bromium": { path: pathPrefix + "Bromium" },
                    "Xpom": { path: pathPrefix + "Xpom" }
                };
            for (let [
                        browserName,
                        browserData
                    ] in Iterator(browsers)) {
                let action = aBrowsersInfo.get(browserName)[aReasone];
                if (!action)
                    continue;
                let dir = appendFilePath(appDataDir.clone(), browserData.path);
                let dataManager = new ChromeDataManager(dir, browserName);
                let canWriteHP = null;
                let canWriteQS = null;
                const PREF_FLAGS = distribution.PREF_FLAGS;
                if (action & PREF_FLAGS.FORCE) {
                    canWriteHP = true;
                    canWriteQS = true;
                } else {
                    if (action & PREF_FLAGS.USER_CONFIRM) {
                        canWriteHP = !!aData.isHomepageChecked;
                        canWriteQS = !!aData.isSearchChecked;
                    }
                    if (action & PREF_FLAGS.DEFAULT_PREF) {
                        canWriteHP = canWriteHP !== false && aData.isDefaultHomepage;
                        canWriteQS = canWriteQS !== false && aData.isDefaultQS;
                    }
                    if (action & PREF_FLAGS.NOT_INSTALLED && dataManager.isInstalled) {
                        canWriteHP = false;
                        canWriteQS = false;
                    }
                }
                dataManager.canWriteHP = !!canWriteHP;
                dataManager.canWriteQS = !!canWriteQS;
                try {
                    dataManager.write(aData);
                    dataManager.fixPrepopulateId(aData);
                } catch (e) {
                    this._logger.warn("Can't write data inside '" + dir.path + "'.");
                    this._logger.debug(e);
                }
            }
        }
    };
function ChromeDataManager(aDirectory, aBrowserName) {
    this._browserDirectory = aDirectory;
    this._browserName = aBrowserName;
    this._canWriteHP = false;
    this._canWriteQS = false;
    switch (this._application.core.Lib.sysutils.platformInfo.os.name) {
    case "windows":
        this._chromeDefaultDirPath = "User Data/Default";
        this._localStateFilePath = "User Data/Local State";
        this._firstRunFilePath = "User Data/First Run";
        break;
    case "mac":
    case "linux":
        this._chromeDefaultDirPath = "Default";
        this._localStateFilePath = "Local State";
        this._firstRunFilePath = "First Run";
        break;
    default:
        throw new Error("Unkown platform.");
        break;
    }
}
ChromeDataManager.prototype = {
    get canWriteHP() {
        return this._canWriteHP;
    },
    set canWriteHP(aValue) {
        this._canWriteHP = aValue;
    },
    get canWriteQS() {
        return this._canWriteQS;
    },
    set canWriteQS(aValue) {
        this._canWriteQS = aValue;
    },
    get isInstalled() {
        if (!this._firstRunFile.exists())
            return false;
        var prefsFile = this._chromeDefaultDir;
        prefsFile.append("Preferences");
        if (!prefsFile.exists())
            return false;
        return true;
    },
    write: function ChromeDataManager_write(aData) {
        if (!(this.canWriteHP || this.canWriteQS))
            return;
        this._application.core.Lib.fileutils.forceDirectories(this._chromeDefaultDir);
        this._writeWebData(aData);
        this._writePreferences(aData);
        this._writeLocalStateFile();
        this._writeFirstRunFile();
        this._logger.debug("Write preferences to '" + this._browserDirectory.path + "'.");
    },
    fixPrepopulateId: function ChromeDataManager_fixPrepopulateId(aData) {
        if (!this._keywordPrepopulateId)
            return;
        var webDataFile = this._chromeDefaultDir;
        webDataFile.append("Web Data");
        var webDataDB = this._getWebDataDB(webDataFile, false);
        if (!webDataDB)
            return;
        var defaultQS;
        (aData.QS || []).some(function (qs) !!(qs.isDefault && (defaultQS = qs)));
        if (!defaultQS)
            return;
        try {
            let defaultProvider = this._providers.getDefault(webDataDB);
            this._logger.debug("Default provider: " + JSON.stringify(defaultProvider, null, "	"));
            if (defaultQS.searchURLRegexp.test(defaultProvider.url)) {
                this._logger.debug("Call 'prepopulate_id' fix");
                this._providers.ensureProviderIsUniquePrepopulated(webDataDB, defaultProvider, this._keywordPrepopulateId);
            }
        } finally {
            webDataDB.close();
        }
    },
    get _application() {
        return distribution._application;
    },
    get _logger() {
        return distribution._logger;
    },
    get _keywordPrepopulateId() {
        return this._browserName === "Chrome" ? 15 : 0;
    },
    get _chromeDefaultDir() {
        return appendFilePath(this._browserDirectory.clone(), this._chromeDefaultDirPath);
    },
    get _firstRunFile() {
        return appendFilePath(this._browserDirectory.clone(), this._firstRunFilePath);
    },
    get _localStateFile() {
        return appendFilePath(this._browserDirectory.clone(), this._localStateFilePath);
    },
    _writeFirstRunFile: function ChromeDataManager__writeFirstRunFile() {
        var firstRunFile = this._firstRunFile;
        if (firstRunFile.exists())
            return;
        var fileutils = this._application.core.Lib.fileutils;
        fileutils.forceDirectories(firstRunFile.parent);
        fileutils.writeTextFile(firstRunFile, "");
    },
    _writeLocalStateFile: function ChromeDataManager__writeLocalStateFile() {
        var localStateFile = this._localStateFile;
        if (localStateFile.exists())
            return;
        var fileContent = "{\"intl\":{\"app_locale\":\"ru\"}," + "\"show-first-run-bubble\":false," + "\"show-minimal-first-run-bubble\":false}";
        var fileutils = this._application.core.Lib.fileutils;
        fileutils.forceDirectories(localStateFile.parent);
        fileutils.writeTextFile(localStateFile, fileContent);
    },
    get _preferencesFile() {
        var prefsFile = this._chromeDefaultDir;
        prefsFile.append("Preferences");
        return prefsFile;
    },
    _writePreferences: function ChromeDataManager__writePreferences(aData) {
        var chromePrefs = this._preferencesObject;
        this._logger.debug("canWriteHP: " + this.canWriteHP + "\n" + "HP: '" + (aData.HP && aData.HP.url || "") + "'\n" + "chrome prefs homepage: '" + chromePrefs.homepage + "'");
        if (this.canWriteHP && aData.HP) {
            if (this._application.installer.isOverridableURL(chromePrefs.homepage || "")) {
                chromePrefs.homepage = aData.HP.url;
                this._logger.debug("New homepage: '" + aData.HP.url + "'");
                chromePrefs.homepage_is_newtabpage = false;
                this._logger.debug("Set 'homepage_is_newtabpage' value to false.");
            }
            let distributedHPPart = aData.HP.url.replace(/^https?(:\/\/[^\/]+).*/, "$1").replace(/\.(com\.)?[^\.]+$/, ".");
            chromePrefs.session = chromePrefs.session || {};
            let startupURLs = chromePrefs.session.startup_urls || [];
            if (startupURLs.join(" ").indexOf(distributedHPPart) == -1) {
                startupURLs.unshift(aData.HP.url);
                chromePrefs.session.startup_urls = startupURLs;
                this._logger.debug("Add '" + aData.HP.url + "' to 'startup_urls' array.");
            }
            chromePrefs.session.restore_on_startup = 4;
            this._logger.debug("Set 'restore_on_startup' value to 4.");
            chromePrefs.browser = chromePrefs.browser || {};
            chromePrefs.browser.show_home_button = true;
        }
        this._application.core.Lib.fileutils.writeTextFile(this._preferencesFile, JSON.stringify(chromePrefs));
    },
    get _preferencesObject() {
        var prefsFile = this._preferencesFile;
        var chromePrefs = prefsFile.exists() && this._application.core.Lib.fileutils.readTextFile(prefsFile) || "{}";
        return JSON.parse(chromePrefs);
    },
    _writeWebData: function ChromeDataManager__writeWebData(aData) {
        if (!(this.canWriteQS && aData.QS))
            return;
        var webDataFile = this._chromeDefaultDir;
        webDataFile.append("Web Data");
        var webDataDB = this._getWebDataDB(webDataFile, true);
        if (!webDataDB)
            return;
        try {
            webDataDB.execQuery("BEGIN TRANSACTION");
            aData.QS.forEach(function (qs) {
                this._writeWebDataDB(webDataDB, qs);
            }, this);
            webDataDB.execQuery("COMMIT TRANSACTION");
        } finally {
            webDataDB.close();
        }
    },
    _providers: {
        getDefault: function ChromeDataManagerProviders_getDefault(aWebDataDB) {
            var defaultProvider = {
                    id: 0,
                    name: "Google",
                    url: "http://google.com/"
                };
            var defaultKeywordId = aWebDataDB.execSimpleQuery("SELECT value FROM meta WHERE key='Default Search Provider ID'");
            if (defaultKeywordId) {
                let defaultProviderFromDB = aWebDataDB.execQuery("SELECT url, short_name FROM keywords WHERE id = :defaultKeywordId", { defaultKeywordId: defaultKeywordId })[0];
                if (defaultProviderFromDB) {
                    defaultProvider.id = defaultKeywordId;
                    defaultProvider.url = defaultProviderFromDB.url;
                    defaultProvider.name = defaultProviderFromDB.short_name;
                }
            }
            return defaultProvider;
        },
        ensureProviderIsUniquePrepopulated: function ChromeDataManagerProviders_ensureProviderIsUniquePrepopulated(aWebDataDB, aProvider, aPrepopulateId) {
            if (!aPrepopulateId)
                return;
            aWebDataDB.execSimpleQuery("UPDATE keywords SET prepopulate_id = :prepopulate_id WHERE id = :provider_id", {
                prepopulate_id: aPrepopulateId,
                provider_id: aProvider.id
            });
            aWebDataDB.execSimpleQuery("DELETE FROM keywords WHERE prepopulate_id = :prepopulate_id AND id != :provider_id", {
                prepopulate_id: aPrepopulateId,
                provider_id: aProvider.id
            });
        },
        isExistingProvider: function ChromeDataManagerProviders_isExistingProvider(aWebDataDB, aQSData) {
            return aWebDataDB.execQuery("SELECT url FROM keywords").some(function (provider) aQSData.searchURLRegexp.test(provider.url));
        },
        deleteExistingProviders: function ChromeDataManagerProviders_deleteExistingProviders(aWebDataDB, aQSData) {
            aWebDataDB.execQuery("SELECT id, url FROM keywords").forEach(function (provider) {
                if (aQSData.searchURLRegexp.test(provider.url))
                    aWebDataDB.execSimpleQuery("DELETE FROM keywords WHERE id=:id", { id: provider.id });
            });
        }
    },
    _writeWebDataDB: function ChromeDataManager__writeWebDataDB(aWebDataDB, aQSData) {
        this._logger.debug("Write webDataDB: {" + "\n	keyword: '" + aQSData.keyword + "'," + "\n	url: '" + aQSData.searchURL + "'\n}");
        var addProvider = false;
        if (aQSData.isDefault) {
            let defaultProvider = this._providers.getDefault(aWebDataDB);
            if (aQSData.searchURLRegexp.test(defaultProvider.url)) {
                this._logger.debug("Ensure provider is unique prepopulated");
                this._providers.ensureProviderIsUniquePrepopulated(aWebDataDB, defaultProvider, this._keywordPrepopulateId);
                return true;
            }
            this._logger.debug("Delete existing providers");
            this._providers.deleteExistingProviders(aWebDataDB, aQSData);
            addProvider = true;
        } else {
            addProvider = !this._providers.isExistingProvider(aWebDataDB, aQSData);
        }
        if (!addProvider)
            return false;
        aWebDataDB.execQuery(this._WEB_DATA_SQL.INS_QS_QUERY, this._WEB_DATA_SQL.makeInsertEngineParams({
            "short_name": aQSData.shortName || aQSData.keyword,
            "keyword": aQSData.keyword,
            "favicon_url": aQSData.image || "",
            "url": aQSData.searchURL,
            "input_encodings": aQSData.inputEncoding || "UTF-8",
            "suggest_url": aQSData.suggestURL,
            "instant_url": "",
            "image_url": "",
            "new_tab_url": "",
            "search_url_post_params": "",
            "suggest_url_post_params": "",
            "instant_url_post_params": "",
            "image_url_post_params": "",
            "alternate_urls": "[]",
            "search_terms_replacement_key": "",
            "show_in_default_list": aQSData.isDefault ? 1 : 0,
            "safe_for_autoreplace": 1,
            "prepopulate_id": aQSData.isDefault ? this._keywordPrepopulateId : 0
        }));
        this._logger.debug("Added (id: " + aWebDataDB.lastInsertRowID + ")");
        if (aQSData.isDefault) {
            aWebDataDB.execQuery("INSERT OR REPLACE INTO meta (key, value) VALUES('Default Search Provider ID', :keywordId)", { keywordId: aWebDataDB.lastInsertRowID });
            this._logger.debug("Setted as default");
        }
        return true;
    },
    _getWebDataDB: function ChromeDataManager__getWebDataDB(aWebDataDBFile, aCreate) {
        var webDataDB = null;
        var webDataFileExists = aWebDataDBFile && aWebDataDBFile.exists();
        if (!webDataFileExists && !aCreate)
            return webDataDB;
        try {
            webDataDB = new this._application.core.Lib.Database(aWebDataDBFile);
            if (!webDataFileExists && aCreate) {
                webDataDB.execQuery("BEGIN TRANSACTION");
                webDataDB.execQuery("PRAGMA encoding = 'UTF-8'");
                this._WEB_DATA_SQL.CREATE_TABLES_QUERIES.forEach(function (query) webDataDB.execQuery(query));
                webDataDB.execQuery("COMMIT TRANSACTION");
            }
            let isAnyKeywords = false;
            let keywordsVersion = 0;
            try {
                isAnyKeywords = !!webDataDB.execSimpleQuery("SELECT id FROM keywords");
                keywordsVersion = parseInt(webDataDB.execSimpleQuery("SELECT value FROM meta WHERE key = 'version'"), 10) || 0;
            } catch (e) {
            }
            if (aCreate && !isAnyKeywords) {
                if (keywordsVersion === this._WEB_DATA_SQL.KEYWORDS_VERSION) {
                    webDataDB.execQuery("BEGIN TRANSACTION");
                    let countryId = this._preferencesObject.countryid_at_install;
                    if (!countryId || typeof countryId !== "number")
                        countryId = 21077;
                    let country = [
                            countryId >> 8 & 255,
                            countryId & 255
                        ].map(function (ch) String.fromCharCode(ch)).join("").toLowerCase();
                    this._logger.debug("Keyword table is empty, let's fill it (country='" + country + "')");
                    this._WEB_DATA_SQL.getPrepopulatedEnginesForCountry(country).forEach(function (engine) {
                        webDataDB.execQuery(this._WEB_DATA_SQL.INS_QS_QUERY, this._WEB_DATA_SQL.makeInsertEngineParams(engine));
                    }, this);
                    webDataDB.execQuery(this._WEB_DATA_SQL.INS_BUILTIN_VERSION_QUERY);
                    webDataDB.execQuery("COMMIT TRANSACTION");
                } else {
                    this._logger.debug("Uncompatible versions: " + keywordsVersion + " : " + this._WEB_DATA_SQL.KEYWORDS_VERSION);
                }
            }
        } catch (e) {
            try {
                if (webDataDB)
                    webDataDB.close();
            } catch (ex) {
            }
            webDataDB = null;
            this._logger.warn("Can't get '" + aWebDataDBFile.path + "' DB.");
            this._logger.debug(e);
        }
        return webDataDB;
    },
    _WEB_DATA_SQL: {
        BUILTIN_VERSION: 68,
        KEYWORDS_VERSION: 54,
        get CREATE_TABLES_QUERIES() {
            return [
                "CREATE TABLE autofill (" + "name VARCHAR," + "value VARCHAR," + "value_lower VARCHAR," + "pair_id INTEGER PRIMARY KEY," + "count INTEGER DEFAULT 1" + ");",
                "CREATE TABLE autofill_dates (" + "pair_id INTEGER DEFAULT 0," + "date_created INTEGER DEFAULT 0" + ");",
                "CREATE TABLE autofill_profile_emails (" + "guid VARCHAR," + "email VARCHAR" + ");",
                "CREATE TABLE autofill_profile_names (" + "guid VARCHAR," + "first_name VARCHAR," + "middle_name VARCHAR," + "last_name VARCHAR" + ");",
                "CREATE TABLE autofill_profile_phones (" + "guid VARCHAR," + "number VARCHAR" + ");",
                "CREATE TABLE autofill_profiles (" + "guid VARCHAR PRIMARY KEY," + "company_name VARCHAR," + "street_address VARCHAR," + "dependent_locality VARCHAR," + "city VARCHAR, state VARCHAR," + "zipcode VARCHAR," + "sorting_code VARCHAR," + "country_code VARCHAR," + "date_modified INTEGER NOT NULL DEFAULT 0," + "origin VARCHAR DEFAULT ''" + ");",
                "CREATE TABLE autofill_profiles_trash (" + "guid VARCHAR" + ");",
                "CREATE TABLE credit_cards (" + "guid VARCHAR PRIMARY KEY," + "name_on_card VARCHAR," + "expiration_month INTEGER," + "expiration_year INTEGER," + "card_number_encrypted BLOB," + "date_modified INTEGER NOT NULL DEFAULT 0," + "origin VARCHAR DEFAULT ''" + ");",
                "CREATE TABLE ie7_logins (" + "url_hash VARCHAR NOT NULL," + "password_value BLOB," + "date_created INTEGER NOT NULL," + "UNIQUE (url_hash)" + ");",
                "CREATE TABLE keywords (" + "id INTEGER PRIMARY KEY," + "short_name VARCHAR NOT NULL," + "keyword VARCHAR NOT NULL," + "favicon_url VARCHAR NOT NULL," + "url VARCHAR NOT NULL," + "safe_for_autoreplace INTEGER," + "originating_url VARCHAR," + "date_created INTEGER DEFAULT 0," + "usage_count INTEGER DEFAULT 0," + "input_encodings VARCHAR," + "show_in_default_list INTEGER," + "suggest_url VARCHAR," + "prepopulate_id INTEGER DEFAULT 0," + "created_by_policy INTEGER DEFAULT 0," + "instant_url VARCHAR," + "last_modified INTEGER DEFAULT 0," + "sync_guid VARCHAR," + "alternate_urls VARCHAR," + "search_terms_replacement_key VARCHAR," + "image_url VARCHAR," + "search_url_post_params VARCHAR," + "suggest_url_post_params VARCHAR," + "instant_url_post_params VARCHAR," + "image_url_post_params VARCHAR," + "new_tab_url VARCHAR" + ");",
                "CREATE TABLE meta(" + "key LONGVARCHAR NOT NULL UNIQUE PRIMARY KEY," + "value LONGVARCHAR" + ");",
                "CREATE TABLE token_service (" + "service VARCHAR PRIMARY KEY NOT NULL," + "encrypted_token BLOB" + ");",
                "CREATE TABLE web_app_icons (" + "url LONGVARCHAR," + "width int," + "height int," + "image BLOB," + "UNIQUE (url, width, height)" + ");",
                "CREATE TABLE web_apps (" + "url LONGVARCHAR UNIQUE," + "has_all_images INTEGER NOT NULL" + ");",
                "CREATE TABLE web_intents (" + "service_url LONGVARCHAR," + "action VARCHAR," + "type VARCHAR," + "title LONGVARCHAR," + "disposition VARCHAR," + "scheme VARCHAR," + "UNIQUE (service_url, action, scheme, type)" + ");",
                "CREATE TABLE web_intents_defaults (" + "action VARCHAR," + "type VARCHAR," + "url_pattern LONGVARCHAR," + "user_date INTEGER," + "suppression INTEGER," + "service_url LONGVARCHAR," + "scheme VARCHAR," + "UNIQUE (action, scheme, type, url_pattern)" + ");",
                "CREATE INDEX autofill_dates_pair_id ON autofill_dates (" + "pair_id" + ");",
                "CREATE INDEX autofill_name ON autofill (" + "name" + ");",
                "CREATE INDEX autofill_name_value_lower ON autofill (" + "name," + "value_lower" + ");",
                "CREATE INDEX ie7_logins_hash ON ie7_logins (" + "url_hash" + ");",
                "CREATE INDEX web_apps_url_index ON web_apps (" + "url" + ");",
                "CREATE INDEX web_intents_default_index ON web_intents_defaults (" + "action" + ");",
                "CREATE INDEX web_intents_index ON web_intents (" + "action" + ");",
                "INSERT INTO meta (key, value) VALUES('version', " + this.KEYWORDS_VERSION + ");",
                "INSERT INTO meta (key, value) VALUES('last_compatible_version', " + this.KEYWORDS_VERSION + ");"
            ];
        },
        makeInsertEngineParams: function _WEB_DATA_SQL_makeInsertEngineParams(engine) {
            var params = Object.create(null);
            for (let [
                        name,
                        value
                    ] in Iterator(engine))
                params[name] = value;
            params.safe_for_autoreplace = "safe_for_autoreplace" in engine ? engine.safe_for_autoreplace : 1;
            params.originating_url = "originating_url" in engine ? engine.originating_url : "";
            params.date_created = "date_created" in engine ? engine.date_created : "";
            params.usage_count = "usage_count" in engine ? engine.usage_count : 0;
            params.show_in_default_list = "show_in_default_list" in engine ? engine.show_in_default_list : 1;
            params.created_by_policy = "created_by_policy" in engine ? engine.created_by_policy : 0;
            params.sync_guid = "sync_guid" in engine ? engine.sync_guid : "";
            params.last_modified = "last_modified" in engine ? engine.last_modified : Date.now();
            return params;
        },
        INS_QS_QUERY: "INSERT INTO keywords (" + "short_name," + "keyword," + "favicon_url," + "url," + "safe_for_autoreplace," + "originating_url," + "date_created," + "usage_count," + "input_encodings," + "show_in_default_list," + "suggest_url," + "prepopulate_id," + "created_by_policy," + "instant_url," + "last_modified," + "sync_guid," + "alternate_urls," + "search_terms_replacement_key," + "image_url," + "search_url_post_params," + "suggest_url_post_params," + "instant_url_post_params," + "image_url_post_params," + "new_tab_url" + ") VALUES (" + ":short_name," + ":keyword," + ":favicon_url," + ":url," + ":safe_for_autoreplace," + ":originating_url," + ":date_created," + ":usage_count," + ":input_encodings," + ":show_in_default_list," + ":suggest_url," + ":prepopulate_id," + ":created_by_policy," + ":instant_url," + ":last_modified," + ":sync_guid," + ":alternate_urls," + ":search_terms_replacement_key," + ":image_url," + ":search_url_post_params," + ":suggest_url_post_params," + ":instant_url_post_params," + ":image_url_post_params," + ":new_tab_url" + ")",
        getPrepopulatedEnginesForCountry: function _WEB_DATA_SQL_getPrepopulatedEnginesForCountry(country) {
            return this._ENGINES[country] || this._ENGINES.default;
        },
        get _ENGINES() {
            const google = {
                    short_name: "Google",
                    keyword: "google.com",
                    favicon_url: "http://www.google.com/favicon.ico",
                    url: "{google:baseURL}search?q={searchTerms}&{google:RLZ}{google:originalQueryForSuggestion}{google:assistedQueryStats}{google:searchFieldtrialParameter}{google:bookmarkBarPinned}{google:searchClient}{google:sourceId}{google:instantExtendedEnabledParameter}{google:omniboxStartMarginParameter}ie={inputEncoding}",
                    input_encodings: "UTF-8",
                    suggest_url: "{google:baseSuggestURL}search?{google:searchFieldtrialParameter}client={google:suggestClient}&gs_ri={google:suggestRid}&xssi=t&q={searchTerms}&{google:cursorPosition}{google:currentPageUrl}{google:pageClassification}sugkey={google:suggestAPIKeyParameter}",
                    instant_url: "{google:baseURL}webhp?sourceid=chrome-instant&{google:RLZ}{google:forceInstantResults}{google:instantExtendedEnabledParameter}{google:ntpIsThemedParameter}{google:omniboxStartMarginParameter}ie={inputEncoding}",
                    image_url: "{google:baseURL}searchbyimage/upload",
                    new_tab_url: "{google:baseURL}_/chrome/newtab?{google:RLZ}{google:instantExtendedEnabledParameter}{google:ntpIsThemedParameter}ie={inputEncoding}",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "encoded_image={google:imageThumbnail},image_url={google:imageURL},sbisrc={google:imageSearchSource},original_width={google:imageOriginalWidth},original_height={google:imageOriginalHeight}",
                    alternate_urls: "[\"{google:baseURL}#q={searchTerms}\",\"{google:baseURL}search#q={searchTerms}\",\"{google:baseURL}webhp#q={searchTerms}\"]",
                    search_terms_replacement_key: "{google:instantExtendedEnabledKey}",
                    prepopulate_id: 1
                };
            const yandex_ru = {
                    short_name: "Яндекс",
                    keyword: "yandex.ru",
                    favicon_url: "http://yandex.ru/favicon.ico",
                    url: "http://yandex.ru/yandsearch?text={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "http://suggest.yandex.net/suggest-ff.cgi?part={searchTerms}",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 15
                };
            const mail_ru = {
                    short_name: "@MAIL.RU",
                    keyword: "mail.ru",
                    favicon_url: "http://img.go.mail.ru/favicon.ico",
                    url: "http://go.mail.ru/search?q={searchTerms}",
                    input_encodings: "windows-1251",
                    suggest_url: "http://suggests.go.mail.ru/chrome?q={searchTerms}",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 83
                };
            const bing_tr = {
                    short_name: "Bing",
                    keyword: "bing.com",
                    favicon_url: "http://www.bing.com/s/wlflag.ico",
                    url: "http://www.bing.com/search?setmkt=tr-TR&q={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "http://api.bing.com/osjson.aspx?query={searchTerms}&language={language}",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 3
                };
            const yahoo_tr = {
                    short_name: "Yahoo! Türkiye",
                    keyword: "tr.yahoo.com",
                    favicon_url: "http://tr.search.yahoo.com/favicon.ico",
                    url: "http://tr.search.yahoo.com/search?ei={inputEncoding}&fr=crmas&p={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 2
                };
            const yandex_ua = {
                    short_name: "Яндекс",
                    keyword: "yandex.ua",
                    favicon_url: "http://yandex.ua/favicon.ico",
                    url: "http://yandex.ua/yandsearch?text={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "http://suggest.yandex.net/suggest-ff.cgi?part={searchTerms}",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 15
                };
            const bing_ru = {
                    short_name: "Bing",
                    keyword: "bing.com",
                    favicon_url: "http://www.bing.com/s/wlflag.ico",
                    url: "http://www.bing.com/search?setmkt=ru-RU&q={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "http://api.bing.com/osjson.aspx?query={searchTerms}&language={language}",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 3
                };
            const bing = {
                    short_name: "Bing",
                    keyword: "bing.com",
                    favicon_url: "http://www.bing.com/s/wlflag.ico",
                    url: "http://www.bing.com/search?q={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "http://api.bing.com/osjson.aspx?query={searchTerms}&language={language}",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 3
                };
            const yahoo = {
                    short_name: "Yahoo!",
                    keyword: "yahoo.com",
                    favicon_url: "http://search.yahoo.com/favicon.ico",
                    url: "http://search.yahoo.com/search?ei={inputEncoding}&fr=crmas&p={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "http://ff.search.yahoo.com/gossip?output=fxjson&command={searchTerms}",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 2
                };
            const yahoo_ru = {
                    short_name: "Yahoo! по-русски",
                    keyword: "ru.yahoo.com",
                    favicon_url: "http://ru.search.yahoo.com/favicon.ico",
                    url: "http://ru.search.yahoo.com/search?ei={inputEncoding}&fr=crmas&p={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 2
                };
            const yandex_tr = {
                    short_name: "Yandex",
                    keyword: "yandex.com.tr",
                    favicon_url: "http://yastatic.net/islands-icons/_/6jyHGXR8-HAc8oJ1bU8qMUQQz_g.ico",
                    url: "http://www.yandex.com.tr/yandsearch?text={searchTerms}",
                    input_encodings: "UTF-8",
                    suggest_url: "http://suggest.yandex.com.tr/suggest-ff.cgi?part={searchTerms}",
                    instant_url: "",
                    image_url: "",
                    new_tab_url: "",
                    search_url_post_params: "",
                    suggest_url_post_params: "",
                    instant_url_post_params: "",
                    image_url_post_params: "",
                    alternate_urls: "[]",
                    search_terms_replacement_key: "",
                    prepopulate_id: 15
                };
            delete this._ENGINES;
            return this._ENGINES = {
                "ru": [
                    google,
                    yandex_ru,
                    mail_ru
                ],
                "tr": [
                    google,
                    bing_tr,
                    yahoo_tr,
                    yandex_tr
                ],
                "ua": [
                    google,
                    yandex_ua,
                    bing_ru
                ],
                "kz": [
                    google,
                    bing,
                    yahoo
                ],
                "by": [
                    google,
                    yahoo_ru,
                    bing_ru
                ],
                "default": [
                    google,
                    bing,
                    yahoo
                ]
            };
        },
        get INS_BUILTIN_VERSION_QUERY() {
            return "INSERT OR REPLACE INTO meta VALUES('Builtin Keyword Version', " + this.BUILTIN_VERSION + ");";
        }
    }
};
