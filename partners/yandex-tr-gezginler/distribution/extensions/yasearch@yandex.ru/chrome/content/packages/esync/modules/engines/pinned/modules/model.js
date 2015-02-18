let EXPORTED_SYMBOLS = ["PinnedModel"];
function PinnedModel() {
    this._name = "PinnedModel";
    this._logger = NativeAPI.logger.getLogger("Engine." + this._name);
}
PinnedModel.prototype = {
    get: function PinnedModel_get(data) {
        this._logger.debug("get: ", JSON.stringify(data));
        if (!data) {
            return null;
        }
        let entry = {
            id_string: data.id_string,
            parent_id_string: data.parent_id_string,
            originator_cache_guid: data.originator_cache_guid || null,
            version: data.version,
            key: null,
            value: null,
            deleted: data.deleted,
            folder: 1
        };
        if (!data.folder) {
            entry.key = data.key;
            entry.value = data.value;
            entry.folder = 0;
        }
        return entry;
    }
};
