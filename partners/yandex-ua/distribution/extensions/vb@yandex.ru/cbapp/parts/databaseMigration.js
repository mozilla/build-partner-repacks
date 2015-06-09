"use strict";
const EXPORTED_SYMBOLS = ["databaseMigration"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const GLOBAL = this;
const databaseMigration = {
    init: function migration_init(aApplication) {
        aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
        this._application = aApplication;
        this._logger = aApplication.getLogger("DatabaseMigration");
        try {
            this._migrate();
        } catch (ex) {
            this._logger.error("Failed while running database migration process. " + strutils.formatError(ex));
            this._logger.debug(ex.stack);
        }
    },
    finalize: function databaseMigration_finalize(doCleanup, callback) {
        this._application = null;
        this._logger = null;
    },
    _migrate: function migration__migrate() {
        let installInfo = this._application.addonManager.info;
        if (installInfo.isFreshAddonInstall || !installInfo.addonVersionChanged) {
            return;
        }
        if (Services.vc.compare(installInfo.addonLastVersion, "2.19.0") !== -1) {
            return;
        }
        for (let name in schema) {
            let dbFile;
            try {
                dbFile = this._getDatabaseFile(name);
            } catch (ex) {
                this._logger.error(ex.message);
                this._logger.debug(ex.stack);
                continue;
            }
            if (installInfo.isFreshAddonInstall) {
                fileutils.removeFileSafe(dbFile);
            } else {
                if (!installInfo.addonVersionChanged) {
                    let isDbFileOk = dbFile.exists() && dbFile.isFile() && dbFile.isReadable();
                    if (isDbFileOk) {
                        continue;
                    }
                    this._application.preferences.set("ftabs.dataDirCrash", true);
                    this._logger.debug("Data directory crash: " + name + " database missing");
                }
            }
            let database = new Database(dbFile);
            let currentSchemaVersion = database.schemaVersion;
            let maxSchemaVersion = Object.keys(schema[name]).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).pop();
            let migrateSchemaVersion;
            if (installInfo.addonLastVersion === "2.4" && name === "fastdial") {
                currentSchemaVersion = 4;
            }
            this._logger.config("Database migration started (" + name + "). " + "Current schema version: " + currentSchemaVersion + "; " + "Max schema version: " + maxSchemaVersion + ".");
            try {
                for (migrateSchemaVersion = currentSchemaVersion + 1; migrateSchemaVersion <= maxSchemaVersion; migrateSchemaVersion++) {
                    schema[name][migrateSchemaVersion](database, this._application);
                    database.schemaVersion = migrateSchemaVersion;
                }
            } catch (ex) {
                this._logger.error("Failed database migrating " + name + " to schema version " + migrateSchemaVersion + " another version. " + strutils.formatError(ex));
                this._logger.debug(ex.stack);
            }
            database.close();
            this._logger.config("Database migration finished");
        }
    },
    _getDatabaseFile: function Migration__getDatabaseFile(dbName) {
        let path;
        switch (dbName) {
        case "fastdial":
            path = dbName.toLowerCase() + ".sqlite";
            break;
        default:
            throw new Error("Bad name for DB file ('" + dbName + "')");
        }
        let dbFile = this._application.core.rootDir;
        path.split("/").forEach(function (p) {
            if (p) {
                dbFile.append(p);
            }
        });
        return dbFile;
    },
    _application: null,
    _logger: null
};
const schema = {
    fastdial: {
        1: function schema_fastdial_1(database) {
            database.execQuery("CREATE TABLE IF NOT EXISTS blacklist (domain TEXT UNIQUE)");
            database.execQuery("CREATE TABLE IF NOT EXISTS thumbs (url TEXT UNIQUE, title TEXT, " + "backgroundImage TEXT, backgroundColor TEXT, favicon TEXT, insertTimestamp INTEGER)");
            database.execQuery("CREATE TABLE IF NOT EXISTS thumbs_shown " + "(thumb_id INTEGER, position INTEGER UNIQUE, fixed INTEGER)");
        },
        2: function schema_fastdial_2(database) {
            database.execQuery("UPDATE thumbs SET backgroundColor = NULL, favicon = NULL, backgroundImage = NULL");
        },
        3: function schema_fastdial_3(database) {
            database.execQuery("UPDATE thumbs SET backgroundColor = NULL WHERE backgroundColor = ''");
            database.execQuery("UPDATE thumbs SET title = NULL WHERE title = ''");
            database.execQuery("UPDATE thumbs SET backgroundImage = NULL");
        },
        4: function schema_fastdial_4(database) {
            database.execQuery("CREATE TABLE IF NOT EXISTS cloud_data (domain TEXT UNIQUE, logo TEXT, backgroundColor TEXT)");
            database.execQuery("CREATE TABLE IF NOT EXISTS unsafe_domains (domain TEXT UNIQUE, insertTimestamp INTEGER)");
        },
        5: function schema_fastdial_5(database) {
            database.execQuery("ALTER TABLE cloud_data ADD COLUMN user_supplied INTEGER");
        },
        6: function schema_fastdial_6(database) {
            database.execQuery("ALTER TABLE thumbs_shown ADD COLUMN syncInstance TEXT");
            database.execQuery("ALTER TABLE thumbs_shown ADD COLUMN syncId TEXT");
            database.execQuery("ALTER TABLE thumbs_shown ADD COLUMN syncTimestamp INTEGER");
            database.execQuery("UPDATE thumbs SET backgroundColor = NULL WHERE backgroundColor = ''");
            database.execQuery("UPDATE thumbs SET backgroundColor = NULL, favicon = NULL " + "WHERE favicon LIKE 'http://favicon.yandex.net/favicon/%'");
        },
        7: function schema_fastdial_7(database) {
            database.execQuery("ALTER TABLE thumbs ADD COLUMN screenshotColor TEXT");
        },
        8: function schema_fastdial_8(database) {
            database.execQuery("ALTER TABLE thumbs ADD COLUMN statParam TEXT");
        },
        9: function schema_fastdial_9(database) {
            database.execQuery("ALTER TABLE cloud_data ADD COLUMN last_api_request TEXT");
        },
        10: function schema_fastdial_10(database, application) {
            let rows = database.execQuery("SELECT logo, domain FROM cloud_data");
            let domainToURL = rows.reduce(function (obj, row) {
                obj[row.domain] = row.logo;
                return obj;
            }, {});
            let thumbLogosFile = application.core.rootDir;
            thumbLogosFile.append("logos.json");
            try {
                fileutils.jsonToFile(domainToURL, thumbLogosFile);
            } catch (err) {
            }
        }
    }
};
