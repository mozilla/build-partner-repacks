"use strict";
const EXPORTED_SYMBOLS = ["pwdmng"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const USER_CACHE_FILE_NAME = "user.logins";
const pwdmng = {
    get savedAccounts() {
        return this._savedAccounts || (this._savedAccounts = this._getSavedAccounts());
    },
    get hasSavedAccounts() {
        return Boolean(this.savedAccounts.length);
    },
    init: function pwdmng_init(api) {
        if (this._initalized) {
            return;
        }
        this._api = api;
        this._initalized = true;
    },
    saveAccounts: function pwdmng_saveUsers(aAccounts, onlyNew) {
        let accountsChanged = false;
        aAccounts.forEach(function (aAccount) {
            if (!aAccount.login) {
                return;
            }
            let savedAccount = this.savedAccounts[aAccount.uid];
            if (savedAccount) {
                if (onlyNew) {
                    return;
                }
                Object.keys(aAccount).forEach(function (key) {
                    if (key == "authStateTimestamp") {
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
    getAccountsById: function pwdmng_getAccountsById(aAccountsIds) {
        if (!aAccountsIds) {
            return;
        }
        let result = [];
        aAccountsIds.forEach(function (aAccountId) {
            if (this.savedAccounts[aAccountId]) {
                result.push(this.savedAccounts[aAccountId]);
            }
        }, this);
        return result;
    },
    parseAccountsFromServer: function pwdmng_parseAccountsFromServer(aAccounts) {
        if (!aAccounts) {
            return;
        }
        return aAccounts.map(function (aAccount) {
            let obj = {};
            obj.uid = aAccount.uid;
            obj.login = (aAccount.login || "").toLowerCase();
            let displayNameObj = aAccount.displayName || {};
            let socialObj = displayNameObj.social || {};
            obj.displayName = displayNameObj.name || obj.login || obj.uid;
            obj.social = {};
            obj.social.profileId = socialObj.profileId;
            obj.social.provider = socialObj.provider;
            return obj;
        });
    },
    removeAccounts: function pwdmng_removeAccounts(aAccounts) {
        let accountsToRemove = [];
        accountsToRemove = this.savedAccounts.filter(function (aSavedAccount) {
            if (aAccounts.some(function (aAccount) {
                    return aAccount.login == aSavedAccount.login && aAccount.uid == aSavedAccount.uid;
                })) {
                return true;
            }
        });
        accountsToRemove.forEach(function (aAccountToRemove) {
            this._savedAccounts.splice(this._savedAccounts.indexOf(aAccountToRemove), 1);
        }, this);
        if (accountsToRemove.length) {
            this._saveAccountsToFile();
        }
    },
    clearAccounts: function pwdmng_clearAccounts() {
        this._savedAccounts = this._getEmptyAccountsContainer();
        this._saveAccountsToFile();
        this._resetSavedAccounts();
    },
    _savedAccounts: null,
    get _cacheFile() {
        if (!this.__cacheFile) {
            let cacheFile = this._api.Files.getPackageStorage(true);
            cacheFile.append(USER_CACHE_FILE_NAME);
            this.__cacheFile = cacheFile;
        }
        return this.__cacheFile;
    },
    _getSavedAccounts: function pwdmng__getSavedAccounts() {
        let accounts = this._getEmptyAccountsContainer();
        let accountsFromFile;
        try {
            accountsFromFile = this._api.Files.jsonFromFile(this._cacheFile);
        } catch (e) {
        }
        if (accountsFromFile && typeof accountsFromFile === "object" && !Array.isArray(accountsFromFile)) {
            accounts = accountsFromFile;
        }
        return accounts;
    },
    _getEmptyAccountsContainer: function pwdmng__getEmptyAccountsContainer() {
        return {};
    },
    _resetSavedAccounts: function pwdmng__resetSavedAccounts() {
        this._savedAccounts = null;
    },
    _saveAccountsToFile: function pwdmng__storeAccountsInFile() {
        try {
            this._api.Files.jsonToFile(this.savedAccounts, this._cacheFile);
        } catch (e) {
        }
    }
};
