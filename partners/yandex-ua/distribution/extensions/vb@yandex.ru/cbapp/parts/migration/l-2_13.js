"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        aMigrationModule.app.core.Lib.sysutils.copyProperties(aMigrationModule.app.core.Lib, GLOBAL);
        this._migrationArray = [{
                id: "removeClckUrls_migration",
                action: this._removeClckUrls.bind(this)
            }];
    },
    migrate: function migrator_migrate() {
        this._migrationArray.forEach(function (item) {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "': " + strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    _removeClckUrls: function migrator__removeClckUrls() {
        let app = this._migrationModule.app;
        let dbFile = app.core.rootDir;
        dbFile.append("fastdial.sqlite");
        let database = new Database(dbFile);
        let sql = "SELECT thumbs.url, thumbs.rowid, shown.fixed " + "FROM thumbs_shown AS shown LEFT JOIN thumbs ON thumbs.rowid = shown.thumb_id";
        let rowsData = database.execQuery(sql);
        let xmlDoc;
        try {
            xmlDoc = app.branding.brandPackage.getXMLDocument("fastdial/clckr.xml");
        } catch (err) {
        }
        if (!xmlDoc) {
            return;
        }
        let clckToNormalURL = {};
        Array.forEach(xmlDoc.querySelectorAll("item"), function (item) {
            clckToNormalURL[item.getAttribute("url")] = item.getAttribute("domain");
        });
        function changeURL(rowid, newURL) {
            database.execQuery("UPDATE thumbs SET url = :url WHERE rowid = :rowid", {
                rowid: rowid,
                url: newURL
            });
        }
        rowsData.forEach(function (row) {
            let isDefaultThumb = false;
            if (clckToNormalURL[row.url]) {
                isDefaultThumb = true;
                changeURL(row.rowid, "http://" + clckToNormalURL[row.url]);
            } else {
                let host;
                try {
                    host = Services.io.newURI(row.url, null, null).host;
                } catch (e) {
                }
                if (host === "clck.yandex.ru") {
                    let matched = /\*(.*)$/.exec(row.url);
                    if (matched && matched[1]) {
                        isDefaultThumb = true;
                        changeURL(row.rowid, matched[1]);
                    }
                }
            }
            let statParam = "autothumb";
            if (isDefaultThumb) {
                statParam = "defthumb";
            } else if (row.fixed) {
                statParam = "userthumb";
            }
            database.execQuery("UPDATE thumbs SET statParam = :statParam WHERE rowid = :rowid", {
                rowid: row.rowid,
                statParam: statParam
            });
        });
        database.close();
    }
};
