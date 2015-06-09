"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const migrator = {
    init: function (aMigrationModule) {
        this._migrationModule = aMigrationModule;
        aMigrationModule.app.core.Lib.sysutils.copyProperties(aMigrationModule.app.core.Lib, GLOBAL);
        this._migrationArray = [
            {
                id: "forceDataDirectory",
                action: this.forceDataDirectory.bind(this)
            },
            {
                id: "migrateThumbs",
                action: this.migrateThumbs.bind(this)
            },
            {
                id: "migrateBlacklist",
                action: this.migrateBlacklist.bind(this)
            },
            {
                id: "migrateUnsafe",
                action: this.migrateUnsafe.bind(this)
            },
            {
                id: "removeAPIRequestsFile",
                action: this.removeAPIRequestsFile.bind(this)
            },
            {
                id: "migrateCloudsource",
                action: this.migrateCloudsource.bind(this)
            },
            {
                id: "migrateScreenshots",
                action: this.migrateScreenshots.bind(this)
            },
            {
                id: "removeDB",
                action: this.removeDB.bind(this)
            },
            {
                id: "removeScreenshotsDir",
                action: this.removeScreenshotsDir.bind(this)
            }
        ];
    },
    migrate: function () {
        this._migrationArray.forEach(item => {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "': " + strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    forceDataDirectory: function () {
        fileutils.forceDirectories(this.getFile("data"));
    },
    migrateThumbs: function () {
        let sql = [
            "SELECT thumbs.url, thumbs.title, thumbs.statParam,",
            "shown.fixed, shown.position, shown.syncId, shown.syncInstance, shown.syncTimestamp",
            "FROM thumbs_shown AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id"
        ].join(" ");
        let rows = this.database.execQuery(sql);
        let thumbs = Object.create(null);
        rows.forEach(row => {
            let thumb = Object.create(null);
            thumbs[row.position] = thumb;
            thumb.sync = null;
            if (row.syncTimestamp && row.syncId && row.syncInstance) {
                thumb.sync = {
                    timestamp: row.syncTimestamp,
                    id: row.syncId,
                    instance: row.syncInstance
                };
            }
            thumb.pinned = Boolean(row.fixed);
            [
                "url",
                "title",
                "statParam"
            ].forEach(field => thumb[field] = row[field]);
        });
        fileutils.jsonToFile(thumbs, this.getFile("data/internalStructure.json"));
    },
    migrateBlacklist: function () {
        let sql = "SELECT domain FROM blacklist";
        let rows = this.database.execQuery(sql);
        let blacklistFile = this.getFile("data/blacklist.json");
        fileutils.jsonToFile(rows.map(row => row.domain), blacklistFile);
    },
    migrateUnsafe: function () {
        let sql = "SELECT domain, insertTimestamp FROM unsafe_domains";
        let rows = this.database.execQuery(sql);
        rows = rows.map(row => ({
            host: row.domain,
            insertTimestamp: row.insertTimestamp
        }));
        fileutils.jsonToFile(rows, this.getFile("data/safebrowsing.json"));
    },
    migrateCloudsource: function () {
        let sql = "SELECT domain, backgroundColor, user_supplied, last_api_request FROM cloud_data";
        let rows = this.database.execQuery(sql);
        let cloudSourceFile = this.getFile("logos.json");
        let hostToLogo = Object.create(null);
        let hostToRow = Object.create(null);
        rows.forEach(row => hostToRow[row.domain] = row);
        for (let [
                    host,
                    {logoMain, logoSub}
                ] in Iterator(fileutils.jsonFromFile(cloudSourceFile))) {
            let row = hostToRow[host];
            hostToLogo[host] = {
                logoMain: logoMain,
                logoSub: logoSub,
                color: row.backgroundColor,
                fromWebsite: false,
                lastApiRequest: 0
            };
        }
        fileutils.removeFileSafe(cloudSourceFile);
        fileutils.jsonToFile(hostToLogo, this.getFile("data/thumbsLogos.json"));
        new sysutils.Timer(() => {
            let app = this._migrationModule.app;
            for (let host of Object.keys(hostToLogo)) {
                let uri = Services.io.newURI("http://" + host, null, null);
                app.thumbsLogos.fetch(uri, {
                    force: true,
                    requestSource: true
                });
            }
        }, 5000);
    },
    migrateScreenshots: function () {
        let sql = "SELECT url, screenshotColor from thumbs";
        let rows = this.database.execQuery(sql);
        let urlToScreenshot = Object.create(null);
        rows.forEach(row => {
            urlToScreenshot[row.url] = { color: row.screenshotColor };
        });
        fileutils.jsonToFile(urlToScreenshot, this.getFile("data/screenshots.json"));
    },
    removeAPIRequestsFile: function () {
        fileutils.removeFileSafe(this.getFile("api-requests.json"));
    },
    removeDB: function () {
        this.database.close(() => {
            new sysutils.Timer(() => fileutils.removeFileSafe(this.getFile("fastdial.sqlite")), 3000);
        });
    },
    removeScreenshotsDir: function () {
        fileutils.removeFileSafe(this.getFile("shots"));
    },
    get database() {
        delete this.database;
        return this.database = new Database(this.getFile("fastdial.sqlite"));
    },
    getFile: function (filepath) {
        let file = this._migrationModule.app.core.rootDir;
        filepath.split("/").forEach(part => file.append(part));
        return file;
    }
};
