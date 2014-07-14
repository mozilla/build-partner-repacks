"use strict";
const EXPORTED_SYMBOLS = ["databaseMigration"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
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
            var installInfo = this._application.addonManager.info;
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
                let maxSchemaVersion = Object.keys(schema[name]).sort(function (a, b) parseInt(a, 10) - parseInt(b, 10)).pop();
                let migrateSchemaVersion;
                if (installInfo.addonLastVersion === "2.4" && name === "fastdial")
                    currentSchemaVersion = 4;
                this._logger.config("Database migration started (" + name + "). " + "Current schema version: " + currentSchemaVersion + "; " + "Max schema version: " + maxSchemaVersion + ".");
                try {
                    for (migrateSchemaVersion = currentSchemaVersion + 1; migrateSchemaVersion <= maxSchemaVersion; migrateSchemaVersion++) {
                        schema[name][migrateSchemaVersion](database);
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
            var path;
            switch (dbName) {
            case "fastdial":
            case "usageHistory":
                path = dbName.toLowerCase() + ".sqlite";
                break;
            default:
                throw new Error("Bad name for DB file ('" + dbName + "')");
            }
            var dbFile = this._application.core.rootDir;
            path.split("/").forEach(function (p) {
                if (p)
                    dbFile.append(p);
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
                database.execQuery("CREATE TABLE IF NOT EXISTS thumbs (url TEXT UNIQUE, title TEXT, backgroundImage TEXT, backgroundColor TEXT, favicon TEXT, insertTimestamp INTEGER)");
                database.execQuery("CREATE TABLE IF NOT EXISTS thumbs_shown (thumb_id INTEGER, position INTEGER UNIQUE, fixed INTEGER)");
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
                database.execQuery("UPDATE thumbs SET backgroundColor = NULL, favicon = NULL WHERE favicon LIKE 'http://favicon.yandex.net/favicon/%'");
            },
            7: function schema_fastdial_7(database) {
                database.execQuery("ALTER TABLE thumbs ADD COLUMN screenshotColor TEXT");
            },
            8: function schema_fastdial_8(database) {
                database.execQuery("ALTER TABLE thumbs ADD COLUMN statParam TEXT");
            }
        },
        usageHistory: {
            1: function schema_usageHistory_1(database) {
                database.execQuery("CREATE TABLE IF NOT EXISTS usagehistory (date INTEGER, action TEXT, info TEXT)");
            }
        }
    };
