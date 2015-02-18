"use strict";
let EXPORTED_SYMBOLS = ["PasswordsEngine"];
let {
    Auth: Auth,
    CONFIG: AUTH_CONFIG
} = require("auth");
let {Engine} = require("engines");
let {Observers} = require("observers");
let {Nigori} = require("libs/nigori");
let {Protobuf} = require("protobuf");
let {Utils} = require("utils");
let {Service} = require("service");
let {STORAGE_QUERIES} = require("./modules/sql");
let {PasswordsModel} = require("./modules/model");
XPCOMUtils.defineLazyGetter(this, "LoginInfo", function () {
    return new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Ci.nsILoginInfo, "init");
});
XPCOMUtils.defineLazyGetter(this, "CryptoHash", function () {
    return new Components.Constructor("@mozilla.org/security/hash;1", Ci.nsICryptoHash, "initWithString");
});
function safeJSONStringify(obj, handler, separator) {
    return JSON.stringify(obj, handler, separator).replace(/("(?:username|password)_value":\s*")[^"]+(",?)/g, "$1*****$2");
}
function PasswordsEngine() {
    Engine.call(this, "Passwords", STORAGE_QUERIES);
}
PasswordsEngine.prototype = {
    __proto__: Engine.prototype,
    init: function PasswordsEngine_init() {
        this._logger.debug("init");
        this._forms = [];
        this._model = new PasswordsModel();
        Observers.add("ybar:esync:engine:Nigori:ready", this);
    },
    finalize: function PasswordsEngine_finalize() {
        this._logger.debug("finalize");
        Observers.remove("passwordmgr-storage-changed", this);
        Observers.remove("ybar:esync:engine:Nigori:ready", this);
        try {
            Services.obs.removeObserver(this, "earlyformsubmit", true);
        } catch (e) {
        }
        this._forms = null;
        if (this._memoryStorage) {
            this._memoryStorage.finalize();
            this._memoryStorage = null;
        }
        this._nigoriEngine = null;
        this._model = null;
        this._queue.finalize();
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIObserver,
        Ci.nsIFormSubmitObserver,
        Ci.nsISupportsWeakReference
    ]),
    notify: function PasswordEngine_notify(form, win, uri) {
        let href = win.location.href;
        let hostnameAction = this._getURLOrigin(uri.spec);
        let entry = {
            hostname: addTrailingSlash(this._getURLOrigin(href)),
            origin: href && href.split("?")[0]
        };
        this._logger.debug("notify", JSON.stringify(entry, null, " "));
        this._forms.push(entry);
        return true;
    },
    observe: function PasswordEngine_observe(subject, topic, data) {
        if (topic === "ybar:esync:engine:Nigori:ready") {
            this._logger.debug(topic);
            Observers.remove("ybar:esync:engine:Nigori:ready", this);
            this._nigoriEngine = Service.engineManager.get("Nigori");
            this._memoryStorage = new MemoryStorage(this);
            this.update(function () {
                this._firstSync();
            }.bind(this));
            return;
        }
        NativeAPI.Async.nextTick(function () {
            if (topic !== "passwordmgr-storage-changed") {
                return;
            }
            this._logger.debug("'passwordmgr-storage-changed' with data = '" + data + "'");
            switch (data) {
            case "removeAllLogins":
                this._delayedRecalculateAndSync();
                break;
            case "removeLogin":
                subject.QueryInterface(Ci.nsILoginMetaInfo).QueryInterface(Ci.nsILoginInfo);
                this._removeLogin(subject);
                break;
            case "addLogin":
                subject.QueryInterface(Ci.nsILoginMetaInfo).QueryInterface(Ci.nsILoginInfo);
                this._addLogin(subject);
                break;
            case "modifyLogin":
                subject.QueryInterface(Ci.nsIArray);
                let oldLoginInfo = subject.queryElementAt(0, Ci.nsILoginMetaInfo);
                let newLoginInfo = subject.queryElementAt(1, Ci.nsILoginMetaInfo);
                newLoginInfo.QueryInterface(Ci.nsILoginMetaInfo).QueryInterface(Ci.nsILoginInfo);
                this._modifyLogin(newLoginInfo);
                break;
            default:
                break;
            }
        }.bind(this));
    },
    get nigori() this._nigoriEngine.nigori,
    get storage() this._storage,
    encrypt: function PasswordEngine_encrypt(passwordDataArray) {
        let str = passwordDataArray.map(function (ch) {
            return String.fromCharCode(ch);
        }).join("");
        return this.nigori.encrypt(str);
    },
    decrypt: function PasswordEngine_decrypt(cipher, key) {
        let bin;
        let nigori = this.nigori;
        if (key && key !== nigori.name) {
            this._logger.debug("Entry was encrypted by other password");
            nigori = this._nigoriEngine.getNigoriByKey(key);
            this._logger.debug("Nigori with key " + key + " was " + (nigori ? "" : " not ") + "founded");
        }
        if (!nigori) {
            this._logger.debug("There is no nigori");
            return null;
        }
        try {
            bin = nigori.decrypt(cipher);
        } catch (e) {
            this._logger.error("Couldn't decrypt cipher: " + e);
            return null;
        }
        let arr = [bin.charCodeAt(i) for (i in bin)];
        let stream = new Protobuf.PROTO.ByteArrayStream(arr);
        let message = new Protobuf.sync_pb.PasswordSpecificsData();
        try {
            message.ParseFromStream(stream);
        } catch (e) {
            this._logger.error("Couldn't parse binary data: " + e);
            return null;
        }
        return message;
    },
    setListData: function PasswordEngine_setListData(list, token) {
        Engine.prototype.setListData.call(this, list, token);
        let data = this._queue.read();
        for (let [
                    key,
                    value
                ] in Iterator(data.modify || {})) {
            this._modifyLogin(value);
        }
        for (let [
                    key,
                    value
                ] in Iterator(data.remove || {})) {
            this._removeLogin(value);
        }
    },
    setData: function PasswordsEngine_setData(data) {
        if (!this.enabled) {
            throw new Error("Trying setData on disabled engine");
        }
        let entry = this._model.get(data);
        if (!entry) {
            return;
        }
        let storageEntry = this._storage.findEntry({ id_string: entry.id_string });
        if (storageEntry && storageEntry.version === entry.version) {
            return;
        }
        if (entry.folder) {
            entry.browser_id = data.server_defined_unique_tag;
            this._storage.updateEntry(entry);
            let mergedEntry = this.mergeEntryAndPasswordData(entry, null);
            this._memoryStorage.addEntry(mergedEntry);
            return;
        }
        let decryptedData = this.getDecryptedData(data.blob, data.key_name);
        if (!decryptedData) {
            this._logger.debug("Empty decryptedData");
            return;
        }
        this._logger.debug("entry: " + JSON.stringify(entry));
        this._logger.debug("decryptedData: " + safeJSONStringify(decryptedData));
        if (entry.browser_id) {
            this._logger.debug("entry.browser_id " + entry.browser_id);
            this._storage.updateEntry(entry);
            let mergedEntry = this.mergeEntryAndPasswordData(entry, decryptedData);
            this._memoryStorage.addEntry(mergedEntry);
            return;
        }
        let key = this._generateIgnoreKey(decryptedData);
        this.ignoreKey(key);
        let browserEntry = this._tryFindBrowserLogin(decryptedData);
        this._logger.debug("Exists browser entry? " + Boolean(browserEntry));
        if (entry.deleted) {
            if (browserEntry && storageEntry && storageEntry.browser_id === browserEntry.QueryInterface(Ci.nsILoginMetaInfo).guid) {
                Services.logins.removeLogin(browserEntry);
            }
            if (storageEntry) {
                this._storage.updateEntry(entry);
            }
            this._memoryStorage.removeEntry(entry);
            this._logger.debug("Deleted");
        } else {
            let loginInfo = new LoginInfo(removeTrailingSlash(decryptedData.origin), removeTrailingSlash(decryptedData.action), null, decryptedData.username_value, decryptedData.password_value, decryptedData.username_element, decryptedData.password_element);
            if (browserEntry) {
                if (storageEntry) {
                    let storageDecryptedData = this.getDecryptedData(storageEntry.blob, storageEntry.key_name);
                    if (storageDecryptedData.password_value !== browserEntry.password) {
                        NativeAPI.Async.nextTick(this.unignoreKey.bind(this, key));
                        return;
                    }
                }
                entry.browser_id = browserEntry.QueryInterface(Ci.nsILoginMetaInfo).guid;
                Services.logins.modifyLogin(browserEntry, loginInfo);
            } else {
                let error;
                try {
                    Services.logins.addLogin(loginInfo);
                } catch (e) {
                    if (e.message.indexOf("This login already exists") === -1) {
                        this._logger.error("Error while adding login");
                        this._logger.debug(e);
                        error = e;
                    }
                }
                let newEntry = !error && this._tryFindBrowserLogin(decryptedData);
                if (newEntry) {
                    entry.browser_id = newEntry.QueryInterface(Ci.nsILoginMetaInfo).guid;
                    this._logger.debug("Added with browser_id = '" + entry.browser_id + "'");
                }
            }
            if (entry.browser_id) {
                this._storage.updateEntry(entry);
                let mergedEntry = this.mergeEntryAndPasswordData(entry, decryptedData);
                this._memoryStorage.addEntry(mergedEntry);
            }
        }
        NativeAPI.Async.nextTick(this.unignoreKey.bind(this, key));
    },
    _addLogin: function PasswordsEngine__addLogin(loginInfo) {
        let rootId = this._storage.rootId;
        if (!rootId) {
            this._logger.debug("Observed addLogin, but no rootId");
            return;
        }
        let [
            entry,
            passwordData
        ] = this._makeEntryForLoginInfo(loginInfo, true);
        if (!entry || !passwordData) {
            this._logger.debug("Can not generate 'entry' or 'passwordData' for 'loginInfo'");
            return;
        }
        let key = this._generateIgnoreKey(passwordData);
        this._logger.debug("unique key is " + key);
        if (this.isIgnoredKey(key)) {
            return;
        }
        entry.id_string = Utils.generateUUIDString();
        entry.parent_id_string = rootId;
        entry.browser_id = loginInfo.guid;
        let mergedEntry = this.mergeEntryAndPasswordData(entry, passwordData);
        this._memoryStorage.addEntry(mergedEntry);
        this.record.insert({ add: [mergedEntry] });
        this.sync();
    },
    _modifyLogin: function PasswordsEngine__modifyLogin(loginInfo) {
        this._logger.debug("_modifyLogin");
        let rootId = this._storage.rootId;
        if (!rootId) {
            this._logger.debug("Observed modifyLogin, but no rootId");
            return;
        }
        let [
            entry,
            passwordData
        ] = this._makeEntryForLoginInfo(loginInfo, true);
        if (!entry || !passwordData) {
            this._logger.debug("Can not generate 'entry' or 'passwordData' for 'loginInfo'");
            return;
        }
        let key = this._generateIgnoreKey(passwordData);
        this._logger.debug("unique key is " + key);
        if (this.isIgnoredKey(key)) {
            return;
        }
        entry.parent_id_string = rootId;
        entry.browser_id = loginInfo.guid;
        let storageEntry = this._memoryStorage.findEntryByBrowserId(loginInfo.guid);
        if (storageEntry) {
            entry.id_string = storageEntry.id_string;
            entry.parent_id_string = storageEntry.parent_id_string;
            entry.ctime = storageEntry.ctime;
            entry.version = storageEntry.version;
        } else {
            let data = {};
            data[loginInfo.guid] = loginInfo;
            this._queue.write("modify", data);
            return;
        }
        let mergedEntry = this.mergeEntryAndPasswordData(entry, passwordData);
        this._memoryStorage.addEntry(mergedEntry);
        this.record.insert({ add: [mergedEntry] });
        this.sync();
    },
    _removeLogin: function PasswordsEngine__removeLogin(loginInfo) {
        let [
            entry,
            passwordData
        ] = this._makeEntryForLoginInfo(loginInfo);
        if (!entry || !passwordData) {
            this._logger.debug("Can not generate 'entry' or 'passwordData' for 'loginInfo'");
            return;
        }
        let key = this._generateIgnoreKey(passwordData);
        this._logger.debug("unique key is " + key);
        if (this.isIgnoredKey(key)) {
            return;
        }
        let storageEntry = this._memoryStorage.findEntryByBrowserId(loginInfo.guid);
        if (storageEntry) {
            this.record.insert({ remove: [storageEntry] });
            this.sync();
        } else {
            let [
                entry,
                passwordData
            ] = this._makeEntryForLoginInfo(loginInfo);
            entry.deleted = true;
            let data = {};
            data[loginInfo.guid] = loginInfo;
            this._queue.write("remove", data);
            this._logger.debug("Can not find exists entry for guid = '" + loginInfo.guid + "' while login remove");
        }
    },
    getDecryptedData: function PasswordsEngine__getDecryptedData(blob, key) {
        if (!blob) {
            return null;
        }
        let loginInfoData = this.decrypt(blob, key);
        if (!loginInfoData) {
            this._logger.error("Can not decrypt data");
            return null;
        }
        let decryptedData = {
            scheme: loginInfoData.scheme || 0,
            signon_realm: this._getURLOrigin(loginInfoData.signon_realm) || "",
            origin: this._getURLOrigin(loginInfoData.origin) || "",
            action: this._getURLOrigin(loginInfoData.action) || "",
            username_element: loginInfoData.username_element || "",
            username_value: loginInfoData.username_value || "",
            password_element: loginInfoData.password_element || "",
            password_value: loginInfoData.password_value || "",
            ssl_valid: typeof loginInfoData.ssl_valid === "boolean" ? loginInfoData.ssl_valid : false,
            preferred: typeof loginInfoData.preferred === "boolean" ? loginInfoData.preferred : true,
            date_created: loginInfoData.date_created || 0,
            blacklisted: typeof loginInfoData.blacklisted === "boolean" ? loginInfoData.blacklisted : false
        };
        if ([0].indexOf(decryptedData.scheme) === -1) {
            this._logger.debug("Unsupported scheme ('" + decryptedData.scheme + "')");
            return null;
        }
        if (decryptedData.blacklisted) {
            this._logger.debug("Blacklisted");
            return null;
        }
        if (!decryptedData.signon_realm) {
            this._logger.debug("Empty signon_realm");
            return null;
        }
        if (!decryptedData.origin) {
            this._logger.debug("Empty origin");
            return null;
        }
        if (!decryptedData.username_value) {
            this._logger.debug("Empty username");
            return null;
        }
        if (!decryptedData.password_value) {
            this._logger.debug("Empty password");
            return null;
        }
        decryptedData.origin = addTrailingSlash(decryptedData.origin);
        decryptedData.signon_realm = addTrailingSlash(decryptedData.signon_realm);
        return decryptedData;
    },
    recalculateAndSync: function PasswordsEngine_recalculateAndSync() {
        this._logger.debug("Run recalculation");
        if (this._delayedRecalculateAndSyncTimer) {
            this._delayedRecalculateAndSyncTimer.cancel();
            this._delayedRecalculateAndSyncTimer = null;
        }
        let rootId = this._storage.rootId;
        if (!rootId) {
            this._logger.debug("Root is null");
            return;
        }
        let needSync = false;
        let memoryEntries = Object.create(null);
        this._memoryStorage.getAllEntries().forEach(function (entry) {
            this._logger.debug("entry", safeJSONStringify(entry));
            if (entry.folder) {
                return;
            }
            memoryEntries[entry.browser_id] = entry;
        }.bind(this));
        this._logger.debug("getAllLogins");
        Services.logins.getAllLogins().forEach(function (loginInfo) {
            let [
                entry,
                passwordData
            ] = this._makeEntryForLoginInfo(loginInfo, false);
            if (!entry || !passwordData) {
                return;
            }
            this._logger.debug("getAllLogins entry:\n" + JSON.stringify(entry));
            this._logger.debug("getAllLogins decryptedData:\n" + safeJSONStringify(passwordData));
            entry.parent_id_string = rootId;
            entry.browser_id = loginInfo.guid;
            let memoryEntry = memoryEntries[loginInfo.guid];
            if (memoryEntry) {
                if (memoryEntry.origin !== passwordData.origin || memoryEntry.username_value !== passwordData.username_value || memoryEntry.password_value !== passwordData.password_value || memoryEntry.reencrypt) {
                    entry.id_string = memoryEntry.id_string;
                    entry.version = memoryEntry.version;
                    entry.ctime = memoryEntry.ctime;
                    let mergedData = this.mergeEntryAndPasswordData(entry, passwordData);
                    this.record.insert({ add: [mergedData] });
                    needSync = true;
                }
                delete memoryEntries[loginInfo.guid];
            } else {
                entry.id_string = Utils.generateUUIDString();
                let mergedData = this.mergeEntryAndPasswordData(entry, passwordData);
                this.record.insert({ add: [mergedData] });
                needSync = true;
            }
        }, this);
        for (let [
                    ,
                    memoryEntry
                ] in Iterator(memoryEntries)) {
            this._logger.debug("toRemove " + JSON.stringify(memoryEntry));
            this.record.insert({ remove: [memoryEntry] });
            needSync = true;
        }
        if (needSync) {
            this.sync();
        }
    },
    _delayedRecalculateAndSync: function PasswordsEngine__delayedRecalculateAndSync() {
        if (this._delayedRecalculateAndSyncTimer) {
            this._delayedRecalculateAndSyncTimer.cancel();
        }
        const RECALCULATE_TIMEOUT = 3000;
        this._delayedRecalculateAndSyncTimer = new NativeAPI.SysUtils.Timer(this.recalculateAndSync.bind(this), RECALCULATE_TIMEOUT);
    },
    _firstSync: function PasswordsEngine__firstSync() {
        this._logger.debug("_firstSync");
        try {
            this.recalculateAndSync();
        } catch (e) {
            this._logger.error(e);
            throw e;
        }
        Engine.prototype.firstSync.call(this);
        Services.obs.addObserver(this, "earlyformsubmit", true);
        Observers.add("passwordmgr-storage-changed", this);
    },
    mergeEntryAndPasswordData: function PasswordsEngine__mergeEntryAndPasswordData(entry, data) {
        return {
            id_string: entry.id_string,
            parent_id_string: entry.parent_id_string,
            version: entry.version || 0,
            ctime: entry.ctime || 0,
            originator_cache_guid: entry.originator_cache_guid || null,
            folder: Boolean(entry.folder),
            key_name: entry.key_name || null,
            blob: entry.blob || null,
            browser_id: entry.browser_id,
            scheme: data && data.scheme || 0,
            signon_realm: data && data.signon_realm || "",
            origin: data && data.origin || "",
            action: data && data.action || "",
            username_element: data && data.username_element || "",
            username_value: data && data.username_value || "",
            password_element: data && data.password_element || "",
            password_value: data && data.password_value || "",
            ssl_valid: data && typeof data.ssl_valid === "boolean" ? data.ssl_valid : false,
            preferred: data && typeof data.preferred === "boolean" ? data.preferred : true,
            date_created: data && data.date_created || 0,
            blacklisted: data && typeof data.blacklisted === "boolean" ? data.blacklisted : false
        };
    },
    _createPasswordSpecificsData: function PasswordEnding__createPasswordSpecificsData(data) {
        let message = new Protobuf.sync_pb.PasswordSpecificsData();
        for (let [
                    key,
                    value
                ] in Iterator(data)) {
            if (typeof value === "number") {
                message[key] = Protobuf.PROTO.I64.fromNumber(value);
            } else {
                message[key] = value;
            }
        }
        let stream = new Protobuf.PROTO.ByteArrayStream();
        message.SerializeToStream(stream);
        return stream.getArray();
    },
    _generateIgnoreKey: function PasswordEngine__generateIgnoreKey(browserEntry) {
        let password = browserEntry.password_value.split("").map(function (ch) {
            return ch.charCodeAt(0);
        });
        let hash = new CryptoHash("MD5");
        hash.update(password, password.length);
        let cryptedPassword = hash.finish(true);
        return [
            browserEntry.signon_realm,
            browserEntry.origin,
            browserEntry.action,
            browserEntry.username_value,
            cryptedPassword,
            browserEntry.username_element,
            browserEntry.password_element
        ].join("	");
    },
    _delayedRecalculateAndSyncTimer: null,
    __crypto: null,
    get _crypto() {
        if (!this.__crypto) {
            this.__crypto = Cc["@mozilla.org/login-manager/crypto/SDR;1"].getService(Ci.nsILoginManagerCrypto);
        }
        return this.__crypto;
    },
    _tryFindBrowserLogin: function PasswordEngine__tryFindBrowserLogin(browserEntry) {
        let props = Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag2);
        props.setPropertyAsAUTF8String("hostname", removeTrailingSlash(browserEntry.origin));
        try {
            let logins = Services.logins.searchLogins({}, props);
            if (logins.length) {
                for (let i = 0, length = logins.length; i < length; i++) {
                    let login = logins[i];
                    if (login.username === browserEntry.username_value) {
                        return login;
                    }
                }
            }
        } catch (e) {
            this._logger.error("Can not find login");
            this._logger.debug(e);
        }
        return null;
    },
    _getURLOrigin: function PasswordsEngine__getURLOrigin(url) {
        let realm = "";
        try {
            let uri = Services.io.newURI(url, null, null);
            realm = uri.scheme + "://" + uri.host;
            let port = uri.port;
            if (port !== -1) {
                let handler = Services.io.getProtocolHandler(uri.scheme);
                if (port != handler.defaultPort) {
                    realm += ":" + port;
                }
            }
        } catch (e) {
            this._logger.trace("Couldn't parse origin for url = '" + url + "'.");
            realm = null;
        }
        return realm;
    },
    _makeEntryForLoginInfo: function PasswordsEngine__makeEntryForLoginInfo(loginInfo, searchFormForLoginInfo) {
        let emptyResult = [
            null,
            null
        ];
        if (!loginInfo) {
            return emptyResult;
        }
        loginInfo.QueryInterface(Ci.nsILoginMetaInfo);
        if (loginInfo.httpRealm === AUTH_CONFIG.HTTP_REALM) {
            return emptyResult;
        }
        let passwordData = {
            signon_realm: loginInfo.httpRealm || addTrailingSlash(loginInfo.hostname),
            origin: addTrailingSlash(loginInfo.hostname),
            action: loginInfo.formSubmitURL,
            username_element: loginInfo.usernameField,
            username_value: loginInfo.username,
            password_element: loginInfo.passwordField,
            password_value: loginInfo.password,
            ssl_valid: false,
            preferred: true,
            date_created: loginInfo.timeCreated || new Date().getTime(),
            blacklisted: false
        };
        if (!passwordData.origin) {
            this._logger.debug("Empty origin");
            return emptyResult;
        }
        if (!passwordData.username_value) {
            this._logger.debug("Empty username");
            return emptyResult;
        }
        if (!passwordData.password_value) {
            this._logger.debug("Empty password");
            return emptyResult;
        }
        if (searchFormForLoginInfo && !this._extendEntryByForm(passwordData)) {
            return emptyResult;
        }
        let passwordDataArray = this._createPasswordSpecificsData(passwordData);
        let crypt = this.encrypt(passwordDataArray);
        if (!crypt) {
            this._logger.debug("Can not make entry blob");
            return emptyResult;
        }
        let entry = {
            id_string: null,
            parent_id_string: null,
            version: 0,
            ctime: 0,
            folder: false,
            key_name: this.nigori.name,
            blob: crypt,
            browser_id: null,
            deleted: false
        };
        return [
            entry,
            passwordData
        ];
    },
    _extendEntryByForm: function PasswordEngine__extendEntryByForm(entry) {
        let form = this._findForm(entry.origin, entry.action);
        if (!form) {
            return false;
        }
        entry.origin = form.origin;
        entry.action = form.action;
        this._removeForm(form);
        return true;
    },
    _findForm: function PasswordEngine__findForm(hostname, action) {
        for (let i = 0, length = this._forms.length; i < length; i++) {
            let form = this._forms[i];
            if (form.hostname === hostname) {
                return form;
            }
        }
        return null;
    },
    _removeForm: function PasswordEngine__removeForm(form) {
        let index = this._forms.indexOf(form);
        if (index !== -1) {
            this._forms.splice(index, 1);
        }
    },
    _forms: [],
    _PROTO_ID: 45873
};
function MemoryStorage(engine) {
    this._logger = engine._logger.getLogger("MemoryStorage");
    this._engine = engine;
    this._init();
}
MemoryStorage.prototype = {
    _init: function MemoryStorage__init() {
        this._cache = Object.create(null);
        this.engineStorage.getAllEntries().forEach(function (entry) {
            let password = this._engine.getDecryptedData(entry.blob, entry.key_name);
            if (!password) {
                return;
            }
            let mergedData = this._engine.mergeEntryAndPasswordData(entry, password);
            if (entry.key_name !== this._engine.nigori.name) {
                mergedData.reencrypt = true;
            }
            this.addEntry(mergedData);
        }, this);
    },
    finalize: function MemoryStorage_finalize() {
        this._cache = null;
        this._engine = null;
    },
    findEntry: function MemoryStorage_findEntry(key) {
        return this._cache[key] || null;
    },
    findEntryByBrowserId: function MemoryStorage_findEntryByBrowserId(browserId) {
        for (let [
                    ,
                    entry
                ] in Iterator(this._cache)) {
            if (entry.browser_id === browserId) {
                return entry;
            }
        }
        return null;
    },
    getAllEntries: function MemoryStorage_getAllEntries() {
        let entries = [];
        for (let [
                    ,
                    entry
                ] in Iterator(this._cache)) {
            entries.push(entry);
        }
        return entries;
    },
    addEntry: function MemoryStorage_addEntry(data) {
        this._cache[data.browser_id] = data;
    },
    removeEntry: function MemoryStorage_removeEntry(entry, removeFromStorage, removeFromRecords) {
        delete this._cache[entry.browser_id];
    },
    get engineStorage() this._engine._storage,
    _cache: null
};
function addTrailingSlash(str) {
    if (!/\/$/.test(str)) {
        return str + "/";
    }
    return str;
}
function removeTrailingSlash(str) {
    return str.replace(/\/$/, "");
}
