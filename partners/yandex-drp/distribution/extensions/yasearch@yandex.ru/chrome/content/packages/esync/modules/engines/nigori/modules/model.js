let EXPORTED_SYMBOLS = ["NigoriModel"];
function NigoriModel() {
    this._name = "NigoriModel";
    this._logger = NativeAPI.logger.getLogger("Engine." + this._name);
}
NigoriModel.prototype = {
    get: function NigoriModel_get(data) {
        this._logger.debug("get: ", JSON.stringify(data));
        if (!data) {
            return null;
        }
        let entry = {
            id_string: data.id_string,
            parent_id_string: data.parent_id_string,
            originator_cache_guid: data.originator_cache_guid || null,
            version: data.version,
            ctime: data.ctime || 0,
            key_name: data.key_name || "",
            blob: data.blob,
            folder: data.folder,
            deleted: data.deleted
        };
        return entry;
    },
    getKeyBag: function NigoriModel_getKeyBag(proto) {
        this._logger.debug(proto);
        let keyBag = [];
        if (!proto || !proto.key) {
            return keyBag;
        }
        for (let i = 0, length = proto.key.length; i < length; i++) {
            let data = proto.key[i];
            keyBag.push({
                key_name: data.name,
                user_key: data.user_key,
                encryption_key: data.encryption_key,
                mac_key: data.mac_key
            });
        }
        this._logger.debug("getKeyBag " + JSON.stringify(keyBag));
        return keyBag;
    },
    merge: function NigoriModel(entry, keys) {
        this._logger.debug("merge: " + JSON.stringify(entry) + " and " + JSON.stringify(keys));
        let userKey = [String.fromCharCode(keys.user_key[i]) for (i in keys.user_key)].join("");
        let encKey = [String.fromCharCode(keys.encryption_key[i]) for (i in keys.encryption_key)].join("");
        let macKey = [String.fromCharCode(keys.mac_key[i]) for (i in keys.mac_key)].join("");
        return {
            id_string: entry.id_string,
            parent_id_string: entry.parent_id_string,
            originator_cache_guid: entry.originator_cache_guid || null,
            version: entry.version,
            ctime: entry.ctime || 0,
            deleted: entry.deleted,
            folder: entry.folder,
            key_name: keys.key_name || "",
            user_key: userKey,
            encryption_key: encKey,
            mac_key: macKey
        };
    }
};
