"use strict";
const EXPORTED_SYMBOLS = ["pwdmng"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const USER_ACCOUNTS_CACHE_FILE_NAME = "user.logins";
const pwdmng = {
    get savedAccounts() {
        return this._savedAccounts || (this._savedAccounts = this._getSavedAccounts());
    },
    get hasSavedAccounts() {
        return Boolean(this.savedAccounts.length);
    },
    init: function (aApplication) {
        if (this._initalized) {
            return;
        }
        this._application = aApplication;
        this._initalized = true;
    },
    saveAccounts: function (aAccounts, aOnlyNew) {
        let accountsChanged = false;
        aAccounts.forEach(function (aAccount) {
            if (!aAccount.login) {
                return;
            }
            let savedAccount = this.savedAccounts[aAccount.uid];
            if (savedAccount) {
                if (aOnlyNew) {
                    return;
                }
                Object.keys(aAccount).forEach(function (key) {
                    if (key === "authStateTimestamp") {
                        return;
                    }
                    savedAccount[key] = aAccount[key];
                });
                if (aAccount.authStateTimestamp) {
                    savedAccount.authStateTimestamp = aAccount.authStateTimestamp;
                }
                accountsChanged = true;
            } else {
                this._savedAccounts[aAccount.uid] = aAccount;
                accountsChanged = true;
            }
        }, this);
        if (accountsChanged) {
            this._saveAccountsToFile();
        }
    },
    getAccountsById: function (aAccountsIds) {
        if (!aAccountsIds) {
            throw new Error("No accounts ids array.");
        }
        let result = [];
        aAccountsIds.forEach(function (aAccountId) {
            if (this.savedAccounts[aAccountId]) {
                result.push(this.savedAccounts[aAccountId]);
            }
        }, this);
        return result;
    },
    parseAccountsFromServer: function (aAccounts) {
        if (!aAccounts) {
            throw new Error("No accounts.");
        }
        return aAccounts.map(function (aAccount) {
            let obj = Object.create(null);
            obj.uid = aAccount.uid;
            obj.login = (aAccount.login || "").toLowerCase();
            let displayNameObj = aAccount.displayName || Object.create(null);
            let socialObj = displayNameObj.social || Object.create(null);
            obj.displayName = displayNameObj.name || obj.login || obj.uid;
            obj.social = Object.create(null);
            obj.social.profileId = socialObj.profileId;
            obj.social.provider = socialObj.provider;
            return obj;
        });
    },
    removeAccounts: function (aAccounts) {
        if (!aAccounts) {
            throw new Error("No accounts.");
        }
        let accountsRemoved = false;
        aAccounts.forEach(function (aAccountToRemove) {
            let savedAccount = this.savedAccounts[aAccountToRemove.uid];
            if (!savedAccount) {
                return;
            }
            delete this.savedAccounts[aAccountToRemove.uid];
            accountsRemoved = true;
        });
        if (accountsRemoved) {
            this._saveAccountsToFile();
        }
    },
    clearAccounts: function () {
        this._savedAccounts = this._getEmptyAccountsContainer();
        this._saveAccountsToFile();
        this._resetSavedAccounts();
    },
    _savedAccounts: null,
    get _cacheFile() {
        if (!this.__cacheFile) {
            let cacheFile = this._application.directories.appRootDir;
            cacheFile.append(USER_ACCOUNTS_CACHE_FILE_NAME);
            this.__cacheFile = cacheFile;
        }
        return this.__cacheFile;
    },
    _getSavedAccounts: function () {
        let accounts = this._getEmptyAccountsContainer();
        let accountsFromFile;
        try {
            accountsFromFile = this._application.core.Lib.fileutils.jsonFromFile(this._cacheFile);
        } catch (e) {
        }
        if (accountsFromFile && typeof accountsFromFile === "object" && !Array.isArray(accountsFromFile)) {
            accounts = accountsFromFile;
        }
        return accounts;
    },
    _getEmptyAccountsContainer: function () {
        return Object.create(null);
    },
    _resetSavedAccounts: function () {
        this._savedAccounts = null;
    },
    _saveAccountsToFile: function () {
        try {
            this._application.core.Lib.fileutils.jsonToFile(this.savedAccounts, this._cacheFile);
        } catch (e) {
        }
    }
};
