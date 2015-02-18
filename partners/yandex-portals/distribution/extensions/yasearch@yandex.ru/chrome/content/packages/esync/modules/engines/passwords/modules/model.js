let EXPORTED_SYMBOLS = ["PasswordsModel"];
function PasswordsModel() {
    this._name = "PasswordsModel";
    this._logger = NativeAPI.logger.getLogger("Engine." + this._name);
}
PasswordsModel.prototype = {
    get: function PasswordsModel_get(data) {
        this._logger.debug("get: ", safeJSONStringify(data));
        if (!data) {
            return null;
        }
        let entry = {
            id_string: data.id_string,
            parent_id_string: data.parent_id_string,
            originator_cache_guid: data.originator_cache_guid || null,
            version: data.version,
            ctime: data.ctime || 0,
            folder: data.folder,
            key_name: data.key_name,
            blob: data.blob,
            browser_id: data.browser_id || null,
            deleted: Boolean(data.deleted)
        };
        return entry;
    }
};
function safeJSONStringify(obj, handler, separator) {
    return JSON.stringify(obj, handler, separator).replace(/("(?:username|password)_value":\s*")[^"]+(",?)/g, "$1*****$2");
}
