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
        this._firstRunFilePath = "Application/First Run";
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
    _writePreferences: function ChromeDataManager__writePreferences(aData) {
        var fileutils = this._application.core.Lib.fileutils;
        var installer = this._application.installer;
        var prefsFile = this._chromeDefaultDir;
        prefsFile.append("Preferences");
        var chromePrefs = prefsFile.exists() && fileutils.readTextFile(prefsFile) || "{}";
        chromePrefs = JSON.parse(chromePrefs);
        this._logger.debug("canWriteHP: " + this.canWriteHP + "\n" + "HP: '" + (aData.HP && aData.HP.url || "") + "'\n" + "chrome prefs homepage: '" + chromePrefs.homepage + "'");
        if (this.canWriteHP && aData.HP) {
            if (installer.isOverridableURL(chromePrefs.homepage || "")) {
                chromePrefs.homepage = aData.HP.url;
                this._logger.debug("New homepage: '" + aData.HP.url + "'");
                chromePrefs.homepage_is_newtabpage = false;
                this._logger.debug("Set 'homepage_is_newtabpage' value to false.");
            }
            let distributedHPPart = aData.HP.url.replace(/^https?(:\/\/[^\/]+).*/, "$1").replace(/\.(com\.)?[^\.]+$/, ".");
            chromePrefs.session = chromePrefs.session || {};
            let startupURLs = chromePrefs.session.urls_to_restore_on_startup || [];
            if (startupURLs.join(" ").indexOf(distributedHPPart) == -1) {
                startupURLs.unshift(aData.HP.url);
                chromePrefs.session.urls_to_restore_on_startup = startupURLs;
                this._logger.debug("Add '" + aData.HP.url + "' to 'urls_to_restore_on_startup' array.");
            }
            chromePrefs.session.restore_on_startup = 4;
            this._logger.debug("Set 'restore_on_startup' value to 4.");
            chromePrefs.browser = chromePrefs.browser || {};
            chromePrefs.browser.show_home_button = true;
        }
        fileutils.writeTextFile(prefsFile, JSON.stringify(chromePrefs));
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
            let dbVersion = parseInt(webDataDB.execSimpleQuery("SELECT value FROM meta WHERE key='version';"), 10) || 0;
            if (dbVersion && dbVersion <= this._WEB_DATA_SQL.LAST_KNOWN_VERSION) {
                webDataDB.execQuery("BEGIN TRANSACTION");
                if (dbVersion >= 45) {
                    webDataDB.execQuery("ALTER TABLE keywords ADD autogenerate_keyword INTEGER DEFAULT 0;");
                    webDataDB.execQuery("ALTER TABLE keywords ADD logo_id INTEGER DEFAULT 0;");
                }
                let keywordsChangesWereMade = false;
                aData.QS.forEach(function (qs) {
                    keywordsChangesWereMade = this._writeWebDataDB(webDataDB, qs) || keywordsChangesWereMade;
                }, this);
                if (keywordsChangesWereMade) {
                    let currentBKV = webDataDB.execSimpleQuery("SELECT value FROM meta WHERE key='Builtin Keyword Version'");
                    if (!currentBKV) {
                        webDataDB.execQuery("INSERT OR REPLACE INTO meta (key, value) VALUES ('Builtin Keyword Version', :builtinVersion)", { builtinVersion: this._WEB_DATA_SQL.LAST_BUILTIN_VERSION });
                    }
                }
                if (dbVersion <= 44) {
                    webDataDB.execQuery("UPDATE meta SET value='39' WHERE key='version' OR key='last_compatible_version';");
                    webDataDB.execQuery("DELETE FROM meta WHERE key LIKE '%Backup%'");
                }
                webDataDB.execQuery("COMMIT TRANSACTION");
            }
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
        aWebDataDB.execQuery(this._WEB_DATA_SQL.INS_QS_QUERY, {
            "keyword": aQSData.keyword,
            "short_name": aQSData.shortName || aQSData.keyword,
            "favicon_url": aQSData.image || "",
            "url": aQSData.searchURL,
            "suggest_url": aQSData.suggestURL,
            "input_encodings": aQSData.inputEncoding || "UTF-8",
            "show_in_default_list": aQSData.isDefault ? 1 : 0,
            "safe_for_autoreplace": 1,
            "prepopulate_id": aQSData.isDefault ? this._keywordPrepopulateId : 0,
            "last_modified": Date.now()
        });
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
                webDataDB.execQuery(this._WEB_DATA_SQL.META_TABLE_DEF);
                this._WEB_DATA_SQL.INS_META_VALUES_QUERIES.forEach(function (query) webDataDB.execQuery(query));
                webDataDB.execQuery(this._WEB_DATA_SQL.KW_TABLE_DEF);
                this._WEB_DATA_SQL.INS_KEYWORDS_VALUES_QUERIES.forEach(function (query) webDataDB.execQuery(query));
                webDataDB.execQuery("COMMIT TRANSACTION");
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
        LAST_BUILTIN_VERSION: 69,
        LAST_KNOWN_VERSION: 54,
        META_TABLE_DEF: "CREATE TABLE IF NOT EXISTS meta(                                                               key LONGVARCHAR NOT NULL UNIQUE PRIMARY KEY,                                            value LONGVARCHAR                                                               )",
        KW_TABLE_DEF: "CREATE TABLE IF NOT EXISTS keywords (                                                          id INTEGER PRIMARY KEY,                                                                 short_name VARCHAR NOT NULL,                                                            keyword VARCHAR NOT NULL,                                                               favicon_url VARCHAR NOT NULL,                                                           url VARCHAR NOT NULL,                                                                   show_in_default_list INTEGER,                                                           safe_for_autoreplace INTEGER,                                                           originating_url VARCHAR,                                                                date_created INTEGER DEFAULT 0,                                                         usage_count INTEGER DEFAULT 0,                                                          input_encodings VARCHAR,                                                                suggest_url VARCHAR,                                                                    prepopulate_id INTEGER DEFAULT 0,                                                       autogenerate_keyword INTEGER DEFAULT 0,                                                 logo_id INTEGER DEFAULT 0,                                                              created_by_policy INTEGER DEFAULT 0,                                                    instant_url VARCHAR,                                                                    last_modified INTEGER DEFAULT 0,                                                        sync_guid LONGVARCHAR                                                           )",
        INS_QS_QUERY: "INSERT INTO keywords (                                                                         short_name,                                                                             keyword,                                                                                favicon_url,                                                                            url,                                                                                    show_in_default_list,                                                                   safe_for_autoreplace,                                                                   input_encodings,                                                                        suggest_url,                                                                            prepopulate_id,                                                                         last_modified                                                                   )                                                                                       VALUES (                                                                                        :short_name,                                                                            :keyword,                                                                               :favicon_url,                                                                           :url,                                                                                   :show_in_default_list,                                                                  :safe_for_autoreplace,                                                                  :input_encodings,                                                                       :suggest_url,                                                                           :prepopulate_id,                                                                        :last_modified                                                                  )",
        get INS_KEYWORDS_VALUES_QUERIES() {
            var kwId = 1;
            var keywordsQueries = [
                    "INSERT INTO keywords VALUES(                     " + kwId++ + ",'Google','google.com','http://www.google.com/favicon.ico','{google:baseURL}search?{google:RLZ}                    {google:acceptedSuggestion}{google:originalQueryForSuggestion}{google:searchFieldtrialParameter}                    {google:instantFieldTrialGroupParameter}sourceid=chrome&ie={inputEncoding}&q={searchTerms}',1,1,                    '',0,0,'UTF-8','{google:baseSuggestURL}search?{google:searchFieldtrialParameter}                    {google:instantFieldTrialGroupParameter}client=chrome&hl={language}&q={searchTerms}',1,1,6211,0,                    '{google:baseURL}webhp?{google:RLZ}sourceid=chrome-instant&{google:instantFieldTrialGroupParameter}                    ie={inputEncoding}&ion=1{searchTerms}&nord=1',0,'6FB4CB28-9DED-41A8-B3AB-9B1A45D31DBF'                );",
                    "INSERT INTO keywords VALUES(                     " + kwId++ + ",'Bing','bing.com','http://www.bing.com/s/wlflag.ico',                    'http://www.bing.com/search?setmkt=en-US&q={searchTerms}',                    1,1,'',0,0,'UTF-8','http://api.bing.com/osjson.aspx?query={searchTerms}&language={language}',                    3,0,6205,0,'',0,'0236030E-AEF0-4897-9B82-1A74BDC5BD58'                );"
                ];
            if (distribution._application.branding.productInfo.BrandID.toString() == "yandex") {
                keywordsQueries = keywordsQueries.concat([
                    "INSERT INTO keywords VALUES(                         " + kwId++ + ",'@MAIL.RU','mail.ru','http://img.go.mail.ru/favicon.ico','http://go.mail.ru/search?q={searchTerms}',                        1,1,'',0,0,'windows-1251','http://suggests.go.mail.ru/chrome?q={searchTerms}',83,0,6213,0,'',0,                        '9A09DA05-2BCD-4A70-A88F-3D1B722B3E09'                    );",
                    "INSERT INTO keywords VALUES(                         " + kwId++ + ",'TUT.BY','tut.by','http://www.tut.by/favicon.ico','http://search.tut.by/?query={searchTerms}',1,1,'',                        0,0,'windows-1251','',17,0,6225,0,'',0,'A68A1E5F-C663-4DDC-A96C-8856FAEDE4F5'                    );",
                    "INSERT INTO keywords VALUES(                         " + kwId++ + ",'Rambler','rambler.ru','http://www.rambler.ru/favicon.ico','http://www.rambler.ru/srch?words={searchTerms}',                        1,1,'',0,0,'windows-1251','',16,0,6221,0,'',0,'E58BA67D-EEFE-481F-9620-9736E155D5D1'                    );"
                ]);
            }
            return keywordsQueries;
        },
        get INS_META_VALUES_QUERIES() {
            return [
                "INSERT INTO meta VALUES('version', 39);",
                "INSERT INTO meta VALUES('last_compatible_version', 39);",
                "INSERT INTO meta VALUES('Builtin Keyword Version', " + this.LAST_BUILTIN_VERSION + ");",
                "INSERT INTO meta VALUES('Default Search Provider ID', 2);"
            ];
        }
    }
};
