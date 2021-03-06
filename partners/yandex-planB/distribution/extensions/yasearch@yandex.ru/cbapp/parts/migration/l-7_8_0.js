"use strict";
const {
    classes: Cc,
    interfaces: Ci
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/Services.jsm");
const migrator = {
    init: function migrator_init(aMigrationModule) {
        this.USER_TYPES = {
            USER_MFD: "pdd",
            USER_YANDEX: "yandex",
            USER_FOREIGN: "foreign"
        };
        this.AUTH_PASSPORT_URL = "https://passport.yandex.ru";
    },
    migrate: function migrator_migrate() {
        let TABLE_NAME = "userslist";
        let cacheFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
        cacheFile.append("yandex");
        cacheFile.append("users.sqlite");
        if (!cacheFile.exists()) {
            return;
        }
        let database = new Database(cacheFile, "CREATE TABLE IF NOT EXISTS " + TABLE_NAME + "(name VARCHAR(255) UNIQUE, url VARCHAR(255))");
        let strSql = "INSERT INTO " + TABLE_NAME + "(name, url) ";
        let sqlData = {};
        let sqlStrings = [];
        let userIndex = 0;
        [
            this.USER_TYPES.USER_MFD,
            this.USER_TYPES.USER_YANDEX
        ].forEach(function (strType) {
            let passportURL = this._getLoginURL(strType);
            let logins = [].concat(Services.logins.findLogins({}, passportURL, passportURL, null));
            logins.forEach(function (login, index) {
                sqlData["name" + userIndex] = login.username;
                sqlData["url" + userIndex] = passportURL;
                sqlStrings.push("SELECT :name" + userIndex + ", :url" + userIndex);
                userIndex++;
            });
        }, this);
        if (!sqlStrings.length) {
            return;
        }
        strSql += sqlStrings.join(" UNION ") + ";";
        database.execQuery(strSql, sqlData);
    },
    _getLoginURL: function pwdmng__getLoginURL(strType) {
        if (strType == this.USER_TYPES.USER_MFD) {
            return this.AUTH_PASSPORT_URL + "/" + strType;
        }
        return this.AUTH_PASSPORT_URL;
    }
};
