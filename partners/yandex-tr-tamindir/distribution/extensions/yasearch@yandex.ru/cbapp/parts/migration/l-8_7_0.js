"use strict";
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this._migrationModule = aMigrationModule;
        this._migrationArray = [
            {
                id: "migrateSavedAccounts",
                action: this._migrateSavedAccounts.bind(this)
            },
            {
                id: "resetPagetranslatorSetting",
                action: this._resetPagetranslatorPref.bind(this)
            }
        ];
    },
    migrate: function migrator_migrate() {
        this._migrationArray.forEach(function (item) {
            try {
                item.action();
            } catch (ex) {
                this._migrationModule.logger.error("Failed to perform migration action '" + item.id + "': " + this._migrationModule.app.core.Lib.strutils.formatError(ex));
                this._migrationModule.logger.debug(ex.stack);
            }
        }, this);
    },
    _migrateSavedAccounts: function migrator__migrateSavedAccounts() {
        let commonPackageId = "http://bar.yandex.ru/packages/yandexbar";
        let accountsFile = this._migrationModule.app.directories.nativeStorageDir;
        accountsFile.append(encodeURIComponent(commonPackageId));
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
    },
    _resetPagetranslatorPref: function migrator__resetPassportConfigPref() {
        Preferences.reset("yasearch.native_comps.http://bar.yandex.ru/packages/yandexbar#pagetranslator.all.settings.show-tooltip");
    }
};
