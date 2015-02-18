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
                id: "migrateAccounts",
                action: this._migrateAccounts.bind(this)
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
    _migrateAccounts: function migrator__removeUnusedPrefs() {
        let accountsFile = this._migrationModule.app.directories.appRootDir;
        accountsFile.append("user.logins");
        if (!accountsFile.exists()) {
            return;
        }
        let savedAccounts = [];
        try {
            savedAccounts = this._migrationModule.app.core.Lib.fileutils.jsonFromFile(accountsFile);
        } catch (e) {
            this._migrationModule.app.core.Lib.fileutils.removeFileSafe(accountsFile);
            return;
        }
        let newAccounts = savedAccounts.reduce(function (retObj, aAccount) {
            let obj = {};
            obj.uid = aAccount.uid;
            obj.login = (aAccount.login || "").toLowerCase();
            let displayNameObj = aAccount.displayName || {};
            let socialObj = displayNameObj.social || {};
            obj.displayName = displayNameObj.name || obj.login || obj.uid;
            obj.social = {};
            obj.social.profileId = socialObj.profileId;
            obj.social.provider = socialObj.provider;
            retObj[obj.uid] = obj;
            return retObj;
        }, {});
        try {
            this._migrationModule.app.core.Lib.fileutils.jsonToFile(newAccounts, accountsFile);
        } catch (e) {
            this._migrationModule.app.core.Lib.fileutils.removeFileSafe(accountsFile);
        }
    }
};
