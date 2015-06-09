"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const migrator = {
    init: function (migrationModule) {
        this._migrationModule = migrationModule;
        migrationModule.app.core.Lib.sysutils.copyProperties(migrationModule.app.core.Lib, GLOBAL);
    },
    migrate: function () {
        [
            "migrateLogos",
            "removeInvisibleThumbs",
            "compactThumbs",
            "tabloisation",
            "removeUsageHistory",
            "migrateDayuse",
            "closeDatabase"
        ].forEach(stepName => {
            try {
                this[stepName]();
            } catch (err) {
                this._migrationModule.logger.error("Failed to perform migration action '" + stepName + "': " + this._migrationModule.app.core.Lib.strutils.formatError(err));
                this._migrationModule.logger.debug(err.stack);
            }
        });
    },
    migrateLogos: function () {
        let thumbLogosFile = this._migrationModule.app.core.rootDir;
        thumbLogosFile.append("logos.json");
        let cache = fileutils.jsonFromFile(thumbLogosFile);
        let migratedCache = {};
        Object.keys(cache).forEach(host => {
            let url = cache[host];
            if (!url) {
                return;
            }
            migratedCache[host] = { logoMain: url };
        });
        fileutils.jsonToFile(migratedCache, thumbLogosFile);
    },
    removeInvisibleThumbs: function () {
        let database = this.database;
        let x = this._migrationModule.app.preferences.get("ftabs.layoutX");
        let y = this._migrationModule.app.preferences.get("ftabs.layoutY");
        let lastVisiblePosition = x * y - 1;
        let visibleThumbs = database.execQuery([
            "SELECT thumbs.url FROM thumbs_shown",
            "AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id",
            "WHERE shown.position <= :lastVisiblePosition"
        ].join(" "), { lastVisiblePosition: lastVisiblePosition });
        let visibleURLs = visibleThumbs.reduce((visibles, {url}) => {
            if (url) {
                visibles[url] = true;
            }
            return visibles;
        }, Object.create(null));
        let invisibleThumbs = database.execQuery([
            "SELECT thumbs.url FROM thumbs_shown",
            "AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id",
            "WHERE shown.position > :lastVisiblePosition AND shown.fixed = 0"
        ].join(" "), { lastVisiblePosition: lastVisiblePosition });
        let pickupResult = invisibleThumbs.map(thumb => ({
            url: thumb.url,
            visits: 0
        }));
        invisibleThumbs.forEach(invisibleThumb => {
            let {url} = invisibleThumb;
            if (url in visibleURLs) {
                return;
            }
            let screenshotFile = this._migrationModule.app.core.rootDir;
            screenshotFile.append("shots");
            screenshotFile.append(misc.crypto.createHash("sha1").update(url).digest("hex") + ".png");
            fileutils.removeFileSafe(screenshotFile);
        });
        let pickupCacheFile = this._migrationModule.app.core.rootDir;
        pickupCacheFile.append("pickup_cache.json");
        let pickupCache = {};
        try {
            pickupCache = fileutils.jsonFromFile(pickupCacheFile);
        } catch (err) {
        }
        pickupCache.cache = pickupResult;
        fileutils.jsonToFile(pickupCache, pickupCacheFile);
        database.execQuery("DELETE FROM thumbs_shown WHERE position > :lastVisiblePosition", { lastVisiblePosition: x * y - 1 });
    },
    compactThumbs: function () {
        let database = this.database;
        database.execQuery("DELETE FROM thumbs_shown WHERE thumb_id IS NULL OR thumb_id = 0");
        let thumbs = database.execQuery("SELECT thumb_id, rowid, position FROM thumbs_shown ORDER BY position");
        thumbs.forEach((thumb, index) => {
            database.execQuery("UPDATE thumbs_shown SET position = :index WHERE rowid = :rowid", {
                index: index,
                rowid: parseInt(thumb.rowid, 10)
            });
        });
    },
    tabloisation: function () {
        let preferences = this._migrationModule.app.preferences;
        preferences.reset("ftabs.emptyLastThumb");
        preferences.reset("ftabs.lastRefreshThumbsTime");
        preferences.reset("ftabs.layoutX");
        preferences.reset("ftabs.layoutY");
        preferences.reset("ftabs.pickupInterval");
    },
    removeUsageHistory: function () {
        let dbFile = this._migrationModule.app.directories.appRootDir;
        dbFile.append("usagehistory.sqlite");
        fileutils.removeFileSafe(dbFile);
    },
    migrateDayuse: function () {
        let database = this.database;
        let count = this.database.execSimpleQuery("SELECT COUNT(*) FROM thumbs_shown");
        this._migrationModule.app.preferences.set("ftabs.initialThumbsCount", parseInt(count, 10));
    },
    closeDatabase: function () {
        this.database.close();
    },
    get database() {
        let dbFile = this._migrationModule.app.core.rootDir;
        dbFile.append("fastdial.sqlite");
        delete this.database;
        return this.database = new Database(dbFile);
    }
};
