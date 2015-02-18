let EXPORTED_SYMBOLS = ["BookmarksModel"];
let {Utils} = require("utils");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
function BookmarksModel() {
    this._name = "BookmarksModel";
    this._logger = NativeAPI.logger.getLogger("Engine." + this._name);
}
BookmarksModel.prototype = {
    get: function BookmarksModel_get(data) {
        this._logger.trace("get: ", JSON.stringify(data));
        if (!data) {
            return null;
        }
        let entry = {
            id_string: data.id_string || "",
            parent_id_string: data.parent_id_string || "",
            originator_cache_guid: data.originator_cache_guid || null,
            position_in_parent: data.position_in_parent || 0,
            server_defined_unique_tag: data.server_defined_unique_tag || "",
            version: data.version || 0,
            ctime: data.ctime || 0,
            mtime: data.mtime || 0,
            url: data.url || null,
            favicon: String(data.favicon || ""),
            title: data.title || "",
            creation_time_us: data.creation_time_us || 0,
            icon_url: data.icon_url || null,
            folder: Boolean(data.folder),
            deleted: Boolean(data.deleted),
            browser_id: data.browser_id || null,
            parent_browser_id: data.parent_browser_id || null,
            browser_position: data.browser_position || 0
        };
        return entry;
    },
    getFromSQL: function BookmarksModel_getFromSQL(data) {
        this._logger.trace("getFromSQL: ", JSON.stringify(data));
        if (!data) {
            return null;
        }
        let entry = {
            id_string: data.id_string || Utils.generateUUIDString(),
            position_in_parent: data.position_in_parent,
            parent_id_string: null,
            version: data.version || 0,
            ctime: data.dateAdded,
            mtime: data.lastModified,
            folder: data.type === PlacesUtils.bookmarks.TYPE_FOLDER,
            url: data.url,
            title: data.title,
            browser_id: data.itemId,
            parent_browser_id: data.parentId,
            browser_position: data.position
        };
        return entry;
    }
};
