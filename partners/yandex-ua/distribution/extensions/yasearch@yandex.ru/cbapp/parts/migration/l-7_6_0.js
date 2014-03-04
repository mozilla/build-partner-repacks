'use strict';
const {
        classes: Cc,
        interfaces: Ci
    } = Components;
const GLOBAL = this;
Cu.import('resource://gre/modules/Services.jsm');
const migrator = {
        init: function migrator_init(aMigrationModule) {
        },
        migrate: function migrator_migrate() {
            var cacheFile = Services.dirsvc.get('ProfD', Ci.nsIFile);
            cacheFile.append('yandex');
            cacheFile.append('users.sqlite');
            if (!cacheFile.exists()) {
                return;
            }
            var database = new Database(cacheFile, 'update bookmarks set name = url where name is null or trim(name) = \'\'');
        }
    };
