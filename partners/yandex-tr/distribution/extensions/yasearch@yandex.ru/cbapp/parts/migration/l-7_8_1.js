"use strict";
const {
        classes: Cc,
        interfaces: Ci
    } = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const migrator = {
        init: function migrator_init(aMigrationModule) {
        },
        migrate: function migrator_migrate() {
            var TABLE_NAME = "userslist";
            var cacheFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
            cacheFile.append("yandex");
            cacheFile.append("users.sqlite");
            if (!cacheFile.exists()) {
                return;
            }
            var database = new Database(cacheFile, "DROP TABLE IF EXISTS " + TABLE_NAME);
        }
    };
