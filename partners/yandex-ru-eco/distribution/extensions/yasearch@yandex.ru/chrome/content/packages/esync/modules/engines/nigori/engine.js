"use strict";
let EXPORTED_SYMBOLS = ["NigoriEngine"];
let {Engine} = require("engines");
let {Observers} = require("observers");
let {Nigori} = require("libs/nigori");
let {Auth, LOGIN_STATES} = require("auth");
let {Protobuf} = require("protobuf");
let {STORAGE_QUERIES} = require("./modules/sql");
let {NigoriModel} = require("./modules/model");
function NigoriEngine() {
    Engine.call(this, "Nigori", STORAGE_QUERIES);
}
NigoriEngine.prototype = {
    __proto__: Engine.prototype,
    init: function NigoriEngine_init() {
        this._logger.debug("init");
        if (!Auth.getLoginInfo()) {
            Auth.logout();
            return;
        }
        this._nigori = this._createNigori();
        if (!this._nigori) {
            return;
        }
        this._model = new NigoriModel();
        this.update(function () {
            this._firstSync();
            Observers.notify("ybar:esync:engine:Nigori:ready");
        }.bind(this));
    },
    finalize: function NigoriEngine_finalize() {
        this._logger.debug("finalize");
        if (this._nigori) {
            this._nigori.finalize();
            this._nigori = null;
        }
        this._model = null;
    },
    setData: function NigoriEngine_setData(data) {
        if (!this.enabled) {
            throw new Error("Trying setData on disabled engine");
        }
        let entry = this._model.get(data);
        let storageEntry = this._storage.findEntry({ key_name: entry.key_name });
        if (storageEntry && storageEntry.version === entry.version) {
            return;
        }
        if (entry.key_name) {
            let keyBagProto = this.decrypt(entry.blob);
            if (!keyBagProto) {
                this._logger.error("Couldn't decrypt blob with key " + entry.key_name);
                return;
            }
            let keyBag = this._model.getKeyBag(keyBagProto);
            for (let i = 0, length = keyBag.length; i < length; i++) {
                let entryWithKeys = this._model.merge(entry, keyBag[i]);
                this._logger.debug("updateEntry " + JSON.stringify(entryWithKeys));
                this._storage.updateEntry(entryWithKeys);
            }
        } else {
            let entryWithKeys = this._model.merge(entry, {});
            this._logger.debug("updateEntry " + JSON.stringify(entryWithKeys));
            this._storage.updateEntry(entryWithKeys);
        }
    },
    getNigoriByKey: function NigoriEngine_getNigoriByKey(key) {
        if (!key) {
            return null;
        }
        let entry = this._storage.findEntry({ key_name: key });
        if (!entry) {
            return null;
        }
        let nigori = Nigori.initByImport(entry.user_key, entry.encryption_key, entry.mac_key);
        return nigori;
    },
    encrypt: function PasswordEngine_encrypt(keyBagArray) {
        let str = keyBagArray.map(function (charCode) {
            return String.fromCharCode(charCode);
        }).join("");
        return this.nigori.encrypt(str);
    },
    decrypt: function PasswordEngine_decrypt(cipher) {
        let bin;
        try {
            bin = this.nigori.decrypt(cipher);
        } catch (e) {
            this._logger.error("Couldn't decrypt cipher: " + e);
            return null;
        }
        let arr = [bin.charCodeAt(i) for (i in bin)];
        let stream = new Protobuf.PROTO.ByteArrayStream(arr);
        let message = new Protobuf.sync_pb.NigoriKeyBag();
        try {
            message.ParseFromStream(stream);
        } catch (e) {
            this._logger.error("Couldn't parse binary data: " + e);
            return null;
        }
        return message;
    },
    recalculateAndSync: function PasswordEngine_recalculateAndSync() {
        this._logger.debug("Run recalculation");
        let currentEntry = this._storage.findEntry({ key_name: this.nigori.name });
        let needSync = false;
        let storageEntries = this._storage.findEntries();
        if (!storageEntries.length) {
            this._logger.error("There is no one entry in storage");
            return;
        }
        if (currentEntry) {
            for (let i = 0, length = storageEntries.length; i < length; i++) {
                let entry = storageEntries[i];
                if (entry.version !== currentEntry.version) {
                    needSync = true;
                    break;
                }
            }
        } else {
            needSync = true;
        }
        if (!needSync) {
            return;
        }
        let keyBag = new Protobuf.sync_pb.NigoriKeyBag();
        keyBag.key = [];
        let lastVersion = 0;
        storageEntries.forEach(function (entry) {
            if (entry.version > lastVersion) {
                lastVersion = entry.version;
            }
            if (!entry.key_name) {
                return;
            }
            let key = new Protobuf.sync_pb.NigoriKey();
            key.name = entry.key_name;
            key.user_key = [entry.user_key.charCodeAt(i) for (i in entry.user_key)];
            key.encryption_key = [entry.encryption_key.charCodeAt(i) for (i in entry.encryption_key)];
            key.mac_key = [entry.mac_key.charCodeAt(i) for (i in entry.mac_key)];
            keyBag.key.push(key);
        });
        if (!currentEntry) {
            let key = new Protobuf.sync_pb.NigoriKey();
            key.name = this.nigori.name;
            key.user_key = [this.nigori.Kuser.charCodeAt(i) for (i in this.nigori.Kuser)];
            key.encryption_key = [this.nigori.Kenc.charCodeAt(i) for (i in this.nigori.Kenc)];
            key.mac_key = [this.nigori.Kmac.charCodeAt(i) for (i in this.nigori.Kmac)];
            keyBag.key.push(key);
        }
        let stream = new Protobuf.PROTO.ByteArrayStream();
        keyBag.SerializeToStream(stream);
        let blob = this.encrypt(stream.getArray());
        let entry = {
            id_string: storageEntries[0].id_string,
            parent_id_string: storageEntries[0].parent_id_string,
            server_defined_unique_tag: "google_chrome_nigori",
            version: lastVersion,
            folder: true,
            key_name: this.nigori.name,
            blob: blob
        };
        this.record.insert({ add: [entry] });
        this.sync();
    },
    _firstSync: function NigoriEnine__firstSync() {
        this._logger.debug("_firstSync");
        Engine.prototype.firstSync.call(this);
        this.recalculateAndSync();
    },
    _createNigori: function NigoriEngine__createNigori() {
        let loginInfo = Auth.getLoginInfo();
        if (!loginInfo) {
            this._logger.error("Couldn't get login info");
            return null;
        }
        try {
            return new Nigori(loginInfo.password, "dummy", "localhost");
        } catch (e) {
            this._logger.error(e);
        }
        return null;
    },
    _migrate: function NigoriEngine__migrate() {
        if (this.version < 1.1) {
            this._logger.debug("Migrating at 1.1 version");
            this.database.execQuerySpinningly(STORAGE_QUERIES.DROP_ENGINE_TABLE);
            this.database.execQuerySpinningly(STORAGE_QUERIES.INIT_ENGINE_TABLE);
            this.token = "";
        }
    },
    get nigori() {
        return this._nigori;
    },
    _nigori: null,
    _PROTO_ID: 47745
};
