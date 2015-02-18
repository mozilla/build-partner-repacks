"use strict";
let EXPORTED_SYMBOLS = ["BookmarksEngine"];
Cu.import("resource://gre/modules/PlacesUtils.jsm");
XPCOMUtils.defineLazyGetter(this, "placesDBConnection", function () {
    return PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
});
[[
        "URI_FIXUP",
        "@mozilla.org/docshell/urifixup;1",
        "nsIURIFixup"
    ]].forEach(function ([
    name,
    contract,
    iface
]) {
    XPCOMUtils.defineLazyServiceGetter(this, name, contract, iface);
}, this);
let {Engine} = require("engines");
let {Utils} = require("utils");
let {Observers} = require("observers");
let {BookmarksModel} = require("./modules/model");
let {QUERIES, STORAGE_QUERIES, TRIGGER_FUNCTION_NAME} = require("./modules/sql");
let IS_YANDEX_HOST_REG = /(^|\.)(yandex\.(ru|ua|by|kz|net|com(\.tr)?)|(ya|kinopoisk|moikrug)\.ru)$/i;
let STRING_BUNDLE = NativeAPI.Localization.createStringBundle("/esync.properties");
let DEFAULT_BOOKMARKS_IDS = [
    3,
    4,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14
];
let MOZILLA_FIREFOX_FOLDER = 7;
let MOBILE_FOLDER_NAME = STRING_BUNDLE.get("esync.engine.bookmarks.mobile_bookmark");
let TABLET_FOLDER_NAME = STRING_BUNDLE.get("esync.engine.bookmarks.tablet_bookmark");
function BookmarksEngine() {
    Engine.call(this, "Bookmarks", STORAGE_QUERIES);
}
BookmarksEngine.prototype = {
    __proto__: Engine.prototype,
    init: function BookmarksEngine_init() {
        this._logger.debug("init");
        this._model = new BookmarksModel();
        this._queue.key = "browser_id";
        try {
            this.placesDBWrapper.execQuerySpinningly(QUERIES.ATTACH_STORAGE_DB, { path: this.database.storageFile.path });
        } catch (e) {
        }
        this.database.connection.createFunction(TRIGGER_FUNCTION_NAME, 2, this._hasSameIdSQLFunc.bind(this));
        this.database.execQuery(QUERIES.CREATE_TRIGGER);
        this._itemTypes = Object.create(null);
        this.update(function () {
            this._firstSync();
            this._afterFirstSyncHook();
        }.bind(this));
    },
    finalize: function BookmarksEngine_finalize() {
        this._logger.debug("finalize");
        this.database.execQuery(QUERIES.DROP_TRIGGER);
        try {
            this.database.connection.removeFunction(TRIGGER_FUNCTION_NAME);
        } catch (e) {
        }
        try {
            this.placesDBWrapper.execQueryAsync(QUERIES.DETACH_STORAGE_DB);
        } catch (e) {
        }
        try {
            PlacesUtils.bookmarks.removeObserver(this);
        } catch (e) {
        }
        Observers.remove("bookmarks-restore-begin", this);
        Observers.remove("bookmarks-restore-success", this);
        Observers.remove("bookmarks-restore-failed", this);
        this._itemTypes = null;
        this._model = null;
    },
    update: function Engine_update(callback, opts) {
        this._findUniqueDefinedFolders();
        this._excludeDuplicate = true;
        Engine.prototype.update.call(this, function () {
            this._excludeDuplicate = false;
            callback.call(this);
        }.bind(this), opts);
    },
    setListData: function Engine_setListData(list, token) {
        this._sortList(list);
        Engine.prototype.setListData.call(this, list, token);
        this._syncQueue();
    },
    setData: function BookmarksEngine_setData(data) {
        if (!this.enabled) {
            throw new Error("Trying setData on disabled engine");
        }
        let entry = this._model.get(data);
        if (!entry) {
            return;
        }
        if (entry.browser_id) {
            this._storage.updateEntry(entry);
            return;
        }
        let storageEntry = this._storage.findEntry({ id_string: entry.id_string });
        this._logger.debug("storageEntry: ", Boolean(storageEntry));
        if (storageEntry && storageEntry.version === entry.version) {
            return;
        }
        let clientTag = data.yandex_client_tag || data.client_defined_unique_tag;
        if (clientTag) {
            this._logger.debug("clientTag: ", clientTag);
            switch (clientTag) {
            case "firefox_menu_folder":
                if (!storageEntry) {
                    this._addMenuFolder(entry);
                } else {
                    this._modifyMenuFolder(entry);
                }
                return;
            case "mozilla_firefox_folder":
                if (!storageEntry) {
                    this._addMozillaFirefoxFolder(entry);
                } else {
                    this._modifyMozillaFirefoxFolder(storageEntry, entry);
                }
                return;
            default:
                break;
            }
        }
        if (!storageEntry) {
            this._onSetDataAddItem(entry);
        } else {
            this._onSetDataModifyItem(storageEntry, entry);
        }
    },
    recalculateAndSync: function BookmarksEngine_recalculateAndSync() {
        this._logger.debug("Run recalculation");
        let result = this.placesDBWrapper.execQuerySpinningly(QUERIES.SELECT_ALL_BOOKMARKS);
        let needSync = false;
        result.forEach(function (item) {
            if (item.storageId && !item.itemId) {
                needSync = this.removeEntry({ browser_id: item.storageId }) || needSync;
                return;
            }
            if (this._ignore(item.itemId, item.parentId)) {
                return;
            }
            let entry = this._model.getFromSQL(item);
            if (item.storageId) {
                if (item.title !== item.storageTitle || item.url !== item.storageUrl) {
                    needSync = this.changeEntry(entry) || needSync;
                }
                if (item.parentId !== item.storageParentId) {
                    needSync = this.moveEntry(entry) || needSync;
                } else if (item.browser_position !== item.position) {
                    needSync = this.moveEntry(entry) || needSync;
                }
                return;
            } else {
                if (item.parentId === PlacesUtils.bookmarks.toolbarFolder && item.title == TABLET_FOLDER_NAME && this._syncedTabletFolderId == null) {
                    this.update(null, { createTabletFolder: true });
                    this._syncedTabletFolderId = item.itemId;
                    return;
                }
                if (item.parentId === PlacesUtils.bookmarks.toolbarFolder && item.title == MOBILE_FOLDER_NAME && this._syncedMobileFolderId == null) {
                    this.update(null, { createMobileFolder: true });
                    this._syncedMobileFolderId = item.itemId;
                    return;
                }
            }
            needSync = this.addEntry(entry) || needSync;
        }, this);
        if (needSync) {
            this.sync();
        }
    },
    _firstSync: function BookmarksEngine__firstSync() {
        this._logger.debug("_firstSync");
        this.recalculateAndSync();
        Engine.prototype.firstSync.call(this);
        PlacesUtils.bookmarks.addObserver(this, true);
        Observers.add("bookmarks-restore-begin", this);
        Observers.add("bookmarks-restore-success", this);
        Observers.add("bookmarks-restore-failed", this);
    },
    _onSetDataAddItem: function BookmarksEngine_onSetDataAddItem(entry) {
        this._logger.debug("Adding new item...");
        if (entry.deleted) {
            return;
        }
        if (entry.server_defined_unique_tag) {
            this._logger.debug("server_defined_unique_tag: ", entry.server_defined_unique_tag);
            switch (entry.server_defined_unique_tag) {
            case "google_chrome_bookmarks":
                entry.browser_id = parseInt(PlacesUtils.bookmarks.placesRoot, 10);
                break;
            case "bookmark_bar":
                entry.browser_id = parseInt(PlacesUtils.bookmarks.toolbarFolder, 10);
                break;
            case "other_bookmarks":
                entry.browser_id = parseInt(PlacesUtils.bookmarks.unfiledBookmarksFolder, 10);
                break;
            case "mobile_bookmarks":
                this._addMobileBookmark(entry);
                return;
            case "tablet_bookmarks":
                this._addTabletBookmark(entry);
                return;
            default:
                this._logger.debug("Unknown 'server_defined_unique_tag': " + data.server_defined_unique_tag);
                return;
            }
            entry.parent_browser_id = "0";
            this._storage.updateEntry(entry);
            return;
        }
        let parentEntry = this._storage.findEntry({ id_string: entry.parent_id_string });
        if (!parentEntry || !parentEntry.browser_id) {
            this._logger.debug("setData: can not find parent folder id for storage entry.");
            return;
        }
        entry.parent_browser_id = parentEntry.browser_id;
        if (this._excludeDuplicate) {
            let duplicateEntry = this._findDuplicate(entry);
            if (duplicateEntry) {
                this._logger.debug("foundedDuplicate " + JSON.stringify(duplicateEntry));
                this._storage.updateEntry(entry);
                return;
            }
        }
        entry.browser_position = this._getBrowserPosition(entry);
        if (entry.folder) {
            entry.browser_id = PlacesUtils.bookmarks.createFolder(entry.parent_browser_id, entry.title, entry.browser_position);
            this.ignoreKey(entry.browser_id);
        } else {
            try {
                let bookmarkURI = this._createURI(entry.url);
                entry.browser_id = PlacesUtils.bookmarks.insertBookmark(entry.parent_browser_id, bookmarkURI, entry.browser_position, entry.title);
                this.ignoreKey(entry.browser_id);
            } catch (e) {
                this._logger.error("setData: can not create bookmark URI or insertBookmark", e);
                return;
            }
        }
        this._storage.updateEntry(entry);
        NativeAPI.Async.nextTick(this.unignoreKey.bind(this, entry.browser_id));
    },
    _onSetDataModifyItem: function BookmarksEngine_onSetDataModifyItem(storageEntry, entry) {
        this._logger.debug("Modifying existing entry: ", JSON.stringify(storageEntry), JSON.stringify(entry));
        if (entry.server_defined_unique_tag) {
            this._logger.error("Trying modify entry with server_defined_unique_tag");
            return;
        }
        this.ignoreKey(storageEntry.browser_id);
        entry.browser_id = storageEntry.browser_id;
        entry.parent_browser_id = storageEntry.parent_browser_id;
        if (entry.deleted) {
            try {
                PlacesUtils.bookmarks.removeItem(storageEntry.browser_id);
            } catch (ex) {
                this._logger.debug("setData: can not remove bookmark. " + ex);
            }
            NativeAPI.Async.nextTick(this.unignoreKey.bind(this, entry.browser_id));
            this._storage.removeEntries({ id_string: entry.id_string });
            return;
        }
        let localEntry = this._getLocalEntryById(storageEntry.browser_id);
        if (!localEntry) {
            NativeAPI.Async.nextTick(this.unignoreKey.bind(this, entry.browser_id));
            return;
        }
        if (!entry.folder) {
            try {
                if (localEntry.url === storageEntry.url) {
                    let bookmarkURI = this._createURI(entry.url);
                    if (bookmarkURI) {
                        PlacesUtils.bookmarks.changeBookmarkURI(storageEntry.browser_id, bookmarkURI);
                    }
                }
            } catch (e) {
                this._logger.error("setData: can not create bookmark URI or change BookmarkURI", e);
            }
        }
        if (entry.title && localEntry.title === storageEntry.title) {
            PlacesUtils.bookmarks.setItemTitle(storageEntry.browser_id, entry.title);
        }
        let parentEntry = this._storage.findEntry({ id_string: entry.parent_id_string });
        if (!parentEntry) {
            this._logger.error("setData: can not find parent folder for storage entry.");
            this._logger.debug("id_string: " + entry.id_string + ", parent_id_string: " + entry.parent_id_string);
            this.unignoreKey(entry.browser_id);
            return;
        }
        if (storageEntry.parent_browser_id === localEntry.parentId) {
            if (parentEntry.browser_id !== storageEntry.parent_browser_id) {
                entry.browser_position = this._getBrowserPosition(entry);
                PlacesUtils.bookmarks.moveItem(storageEntry.browser_id, parentEntry.browser_id, entry.browser_position);
                entry.parent_browser_id = parentEntry.browser_id;
            } else {
                entry.browser_position = this._getBrowserPosition(entry);
                this._logger.debug("new position: " + entry.browser_position + ", old position: " + storageEntry.browser_position);
                if (entry.browser_position !== storageEntry.browser_position) {
                    PlacesUtils.bookmarks.moveItem(storageEntry.browser_id, storageEntry.parent_browser_id, entry.browser_position);
                }
            }
        }
        NativeAPI.Async.nextTick(this.unignoreKey.bind(this, entry.browser_id));
        this._storage.updateEntry(entry);
    },
    _addMobileBookmark: function BookmarksEngine__addMobileBookmark(entry) {
        this._logger.debug("Adding mobile folder...");
        if (this._syncedMobileFolderId != null) {
            entry.browser_id = this._syncedMobileFolderId;
            this._storage.updateEntry(entry);
            return;
        }
        entry.parent_browser_id = PlacesUtils.bookmarks.toolbarFolder;
        if (this._excludeDuplicate) {
            let duplicateEntry = this._findDuplicate(entry);
            if (duplicateEntry) {
                this._logger.debug("foundedDuplicate " + JSON.stringify(duplicateEntry));
                this._storage.updateEntry(entry);
                return;
            }
        }
        entry.browser_position = 0;
        entry.browser_id = PlacesUtils.bookmarks.createFolder(entry.parent_browser_id, MOBILE_FOLDER_NAME, entry.browser_position);
        this.ignoreKey(entry.browser_id);
        this._storage.updateEntry(entry);
        this._syncedMobileFolderId = entry.browser_id;
        NativeAPI.Async.nextTick(this.unignoreKey.bind(this, entry.browser_id));
    },
    _addTabletBookmark: function BookmarksEngine__addTabletBookmark(entry) {
        this._logger.debug("Adding tablet folder...");
        if (this._syncedTabletFolderId != null) {
            entry.browser_id = this._syncedTabletFolderId;
            this._storage.updateEntry(entry);
            return;
        }
        entry.parent_browser_id = PlacesUtils.bookmarks.toolbarFolder;
        if (this._excludeDuplicate) {
            let duplicateEntry = this._findDuplicate(entry);
            if (duplicateEntry) {
                this._logger.debug("foundedDuplicate " + JSON.stringify(duplicateEntry));
                this._storage.updateEntry(entry);
                return;
            }
        }
        entry.browser_position = 0;
        entry.browser_id = PlacesUtils.bookmarks.createFolder(entry.parent_browser_id, TABLET_FOLDER_NAME, entry.browser_position);
        this.ignoreKey(entry.browser_id);
        this._storage.updateEntry(entry);
        this._syncedTabletFolderId = entry.browser_id;
        NativeAPI.Async.nextTick(this.unignoreKey.bind(this, entry.browser_id));
    },
    observe: function BookmarksEngine_observe(subject, topic, data) {
        switch (topic) {
        case "bookmarks-restore-begin":
            this._logger.debug("Ignoring changes from importing bookmarks.");
            this.ignoreAll = true;
            break;
        case "bookmarks-restore-success":
            this._logger.debug("Continue tracking changes after restore.");
            this.ignoreAll = false;
            break;
        case "bookmarks-restore-failed":
            this._logger.debug("Continue tracking changes after failed restore.");
            this.ignoreAll = false;
            break;
        }
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsINavBookmarkObserver,
        Ci.nsISupportsWeakReference
    ]),
    _knownTypes: [
        PlacesUtils.bookmarks.TYPE_BOOKMARK,
        PlacesUtils.bookmarks.TYPE_FOLDER
    ],
    _knownRootFolders: [
        parseInt(PlacesUtils.bookmarks.unfiledBookmarksFolder, 10),
        parseInt(PlacesUtils.bookmarks.toolbarFolder, 10),
        parseInt(PlacesUtils.bookmarks.bookmarksMenuFolder, 10)
    ],
    _findUniqueDefinedFolders: function BookmarksEngine__findServerDefinedFolders() {
        this._logger.debug("Finding unique defined folders");
        this._syncedMobileFolderId = null;
        this._syncedTabletFolderId = null;
        this._syncedMenuFolder = false;
        this._syncedMozillaFirefoxFolder = false;
        this._storage.findEntries().forEach(function (entry) {
            if (entry.server_defined_unique_tag === "mobile_bookmarks") {
                this._syncedMobileFolderId = entry.browser_id;
            } else if (entry.server_defined_unique_tag === "tablet_bookmarks") {
                this._syncedTabletFolderId = entry.browser_id;
            } else if (entry.browser_id === PlacesUtils.bookmarks.bookmarksMenuFolder) {
                this._syncedMenuFolder = true;
            } else if (entry.browser_id === MOZILLA_FIREFOX_FOLDER) {
                this._syncedMozillaFirefoxFolder = true;
            }
        }, this);
    },
    _findDuplicate: function BookmarksEngine__findDuplicate(entry) {
        let localEntries = this.placesDBWrapper.execQuerySpinningly(QUERIES.SELECT_BOOKMARKS_BY_PARENT, { browser_id: entry.parent_browser_id });
        let localEntry = this._getLocalEntryById(MOZILLA_FIREFOX_FOLDER);
        let matchedEntry = null;
        for (let i = 0, length = localEntries.length; i < length; i++) {
            let localEntry = localEntries[i];
            if (this._storage.findEntry({ browser_id: localEntry.itemId })) {
                continue;
            }
            let isFolder = localEntry.type === PlacesUtils.bookmarks.TYPE_FOLDER;
            if (localEntry.title === entry.title && isFolder === entry.folder) {
                if (isFolder) {
                    matchedEntry = entry;
                    matchedEntry.browser_id = localEntry.itemId;
                    break;
                } else {
                    if (this._isSameURLs(entry.url, localEntry.url)) {
                        matchedEntry = entry;
                        matchedEntry.browser_id = localEntry.itemId;
                        matchedEntry.url = entry.url;
                    }
                }
            } else if (entry.server_defined_unique_tag === "mobile_bookmarks" && isFolder && localEntry.title === MOBILE_FOLDER_NAME) {
                matchedEntry = entry;
                matchedEntry.browser_id = localEntry.itemId;
                break;
            } else if (entry.server_defined_unique_tag === "tablet_bookmarks" && isFolder && localEntry.title === TABLET_FOLDER_NAME) {
                matchedEntry = entry;
                matchedEntry.browser_id = localEntry.itemId;
                break;
            }
        }
        return matchedEntry;
    },
    _isMatched: function BookmarksEngine__isMatched(entry, localEntry) {
        let isFolder = localEntry.type === PlacesUtils.bookmarks.TYPE_FOLDER;
        if (locaEntry.title === entry.title && isFolder === entry.folder) {
            if (isFolder) {
                return true;
            }
            if (localEntry.url === entry.url) {
                return true;
            }
        }
        return false;
    },
    _isSameURLs: function BoomarksEngine__isSameURLs(url1, url2) {
        let uri1 = this._createURI(url1);
        let uri2 = this._createURI(url2);
        let isYandexHosts = false;
        try {
            isYandexHosts = uri1 && IS_YANDEX_HOST_REG.test(uri1.host) && uri2 && IS_YANDEX_HOST_REG.test(uri2.host);
        } catch (e) {
        }
        if (!isYandexHosts) {
            return url1 === url2;
        }
        url1 = url1.replace(/clid=\w+/, "");
        url2 = url2.replace(/clid=\w+/, "");
        uri1 = this._createURI(url1);
        uri2 = this._createURI(url2);
        return uri1.spec === uri2.spec;
    },
    _ignore: function BookmarksEngine__ignore(itemId, folder, guid) {
        if (this.ignoreAll) {
            return true;
        }
        if (this.isIgnoredKey(itemId)) {
            this._logger.debug("isIgnoredKey ", itemId);
            return true;
        }
        try {
            let itemType = PlacesUtils.bookmarks.getItemType(itemId);
            if (this._knownTypes.indexOf(itemType) === -1) {
                return true;
            }
        } catch (e) {
            this._logger.debug("Couldn't get item type for item: ", itemId);
            let itemType = this._itemTypes[itemId];
            if (itemType && this._knownTypes.indexOf(itemType) === -1) {
                return true;
            }
        }
        try {
            let bookmarkURI = PlacesUtils.bookmarks.getBookmarkURI(itemId);
            if (bookmarkURI && /^place:/.test(bookmarkURI.spec)) {
                return true;
            }
        } catch (e) {
        }
        if (!folder) {
            folder = PlacesUtils.bookmarks.getFolderIdForItem(itemId);
        }
        let topTrackingFolder = this._getTopTrackingFolder(folder);
        if (!topTrackingFolder) {
            this._logger.trace("Can not get root folder for item: " + itemId);
            return true;
        }
        if (DEFAULT_BOOKMARKS_IDS.indexOf(itemId) !== -1) {
            return true;
        }
        return false;
    },
    _getTopTrackingFolder: function BookmarksEngine__getTopTrackingFolder(folder) {
        let topTrackingFolder = folder;
        while (topTrackingFolder) {
            if (this._knownRootFolders.indexOf(topTrackingFolder) !== -1) {
                break;
            }
            topTrackingFolder = PlacesUtils.bookmarks.getFolderIdForItem(topTrackingFolder);
        }
        return topTrackingFolder;
    },
    _createMenuFolder: function BookmarsEngine__createMenuFolder() {
        if (this._syncedMenuFolder) {
            return;
        }
        let parentEntry = this._storage.findEntry({ browser_id: PlacesUtils.bookmarks.unfiledBookmarksFolder });
        let localEntrySQL = this._getLocalEntryById(PlacesUtils.bookmarks.bookmarksMenuFolder);
        if (!parentEntry || !localEntrySQL) {
            return;
        }
        let entry = {
            id_string: Utils.generateUUIDString(),
            parent_id_string: null,
            version: 0,
            ctime: Date.now(),
            mtime: Date.now(),
            folder: true,
            url: null,
            title: "firefox menu",
            browser_id: PlacesUtils.bookmarks.bookmarksMenuFolder,
            parent_browser_id: parentEntry.browser_id,
            yandex_client_tag: "firefox_menu_folder",
            browser_position: localEntrySQL.position
        };
        if (this.addEntry(entry)) {
            this.sync();
        }
        this._syncedMenuFolder = true;
    },
    _addMenuFolder: function BookmarksEngine__addMenuFolder(entry) {
        entry.browser_id = parseInt(PlacesUtils.bookmarks.bookmarksMenuFolder, 10);
        entry.parent_browser_id = 0;
        this._storage.updateEntry(entry);
    },
    _modifyMenuFolder: function BookmarksEngine__modifyMenuFolder(entry) {
        if (entry.deleted) {
            this._syncedMenuFolder = false;
            this._storage.updateEntry(entry);
        }
    },
    _createMozillaFirefoxFolder: function BookmarksEngine__createMozillaFirefoxFolder() {
        if (this._syncedMozillaFirefoxFolder) {
            return;
        }
        let localEntry = this._getLocalEntryById(MOZILLA_FIREFOX_FOLDER);
        if (!localEntry) {
            return;
        }
        let entry = {
            id_string: Utils.generateUUIDString(),
            parent_id_string: null,
            version: 0,
            ctime: localEntry.dateAdded,
            mtime: Date.now(),
            folder: true,
            url: null,
            title: localEntry.title,
            browser_id: MOZILLA_FIREFOX_FOLDER,
            parent_browser_id: localEntry.parentId,
            yandex_client_tag: "mozilla_firefox_folder",
            browser_position: localEntry.position
        };
        if (this.addEntry(entry)) {
            this.sync();
        }
        this._syncedMozillaFirefoxFolder = true;
    },
    _addMozillaFirefoxFolder: function Bookmarks__addMozillaFirefoxFolder(entry) {
        let localEntry = this._getLocalEntryById(MOZILLA_FIREFOX_FOLDER);
        let parentEntry = this._storage.findEntry({ id_string: entry.parent_id_string });
        if (!parentEntry) {
            return;
        }
        entry.parent_browser_id = parentEntry.browser_id;
        entry.parent_id_string = parentEntry.id_string;
        if (localEntry) {
            entry.browser_id = MOZILLA_FIREFOX_FOLDER;
            parentEntry = this._storage.findEntry({ browser_id: localEntry.parentId });
            if (!parentEntry || entry.parent_browser_id !== parentEntry.browser_id) {
                return;
            }
            this._storage.updateEntry(entry);
        } else {
            entry.browser_id = PlacesUtils.bookmarks.createFolder(entry.parent_browser_id, entry.title, PlacesUtils.bookmarks.DEFAULT_INDEX);
            this.ignoreKey(entry.browser_id);
            this._storage.updateEntry(entry);
            NativeAPI.Async.nextTick(this.unignoreKey.bind(this, entry.browser_id));
        }
    },
    _modifyMozillaFirefoxFolder: function BookmarksEngine__modifyMozillaFirefoxFolder(storageEntry, entry) {
        this._onSetDataModifyItem(storageEntry, entry);
        if (entry.deleted) {
            this._syncedMozillaFirefoxFolder = false;
        }
    },
    _createURI: function BookmarksEngine__createURI(url) {
        try {
            let bookmarkURI = URI_FIXUP.createFixupURI(url, URI_FIXUP.FIXUP_FLAG_NONE);
            if (IS_YANDEX_HOST_REG.test(bookmarkURI.asciiHost) && bookmarkURI.path.indexOf("clid") !== -1) {
                let record = NativeAPI.DistrData.getRecord("clid15");
                if (record) {
                    let url = bookmarkURI.spec.replace(/([?&])clid=[^&]+/g, function (match, match1) {
                        return match1 + "clid=" + (record.clidAndVid || "");
                    });
                    bookmarkURI = URI_FIXUP.createFixupURI(url, URI_FIXUP.FIXUP_FLAG_NONE);
                }
            }
            return bookmarkURI;
        } catch (e) {
            this._logger.debug("Error create URI " + e);
        }
        return null;
    },
    _getBrowserPosition: function BookmarksEngine__getBrowserPosition(entry) {
        this._logger.debug("Geting browser position by position_in_parent = " + entry.position_in_parent);
        let position = 0;
        let entries = this._storage.findEntries({ parent_id_string: entry.parent_id_string });
        if (!entries.length) {
            return position;
        }
        entries.sort(function (a, b) {
            if (a.position_in_parent > b.position_in_parent) {
                return 1;
            }
            return -1;
        });
        let prevEntry;
        let nextEntry;
        for (let i = 0, length = entries.length; i < length; i++) {
            let currentEntry = entries[i];
            if (currentEntry.id_string === entry.id_string) {
                continue;
            }
            if (currentEntry.position_in_parent >= entry.position_in_parent) {
                nextEntry = currentEntry;
                break;
            }
            prevEntry = currentEntry;
        }
        if (prevEntry) {
            position = prevEntry.browser_position + 1;
        } else if (nextEntry) {
            position = nextEntry.browser_position ? nextEntry.browser_position - 1 : 0;
        }
        this._logger.debug("position: " + position);
        return position;
    },
    onItemAdded: function BookmarksEngine_onItemAdded(itemId, parentId, index, itemType, uri, title, dateAdded, guid, parentGuid) {
        NativeAPI.Async.nextTick(function () {
            this._logger.debug("onItemAdded: " + itemId + " " + parentId);
            try {
                this._itemTypes[itemId] = PlacesUtils.bookmarks.getItemType(itemId);
            } catch (e) {
                this._logger.debug("Couldn't get item type");
            }
            let ignore = this._ignore(itemId, parentId, guid);
            this._logger.debug("ignore: ", ignore);
            if (ignore) {
                return;
            }
            let timeAdded = new Date(dateAdded / 1000).getTime();
            let newEntry = {
                id_string: Utils.generateUUIDString(),
                parent_id_string: null,
                version: 0,
                ctime: timeAdded,
                mtime: timeAdded,
                folder: itemType === PlacesUtils.bookmarks.TYPE_FOLDER,
                url: uri && uri.spec || "",
                favicon: "",
                title: title || "",
                icon_url: null,
                browser_id: itemId,
                parent_browser_id: parentId,
                browser_position: index
            };
            if (this.addEntry(newEntry)) {
                this.sync();
            }
        }.bind(this));
    },
    onItemRemoved: function BookmarksEngine_onItemRemoved(itemId, parentId, index, itemType, uri, guid, parentGuid) {
        this._logger.debug("onItemRemoved: " + itemId);
        let ignore = this._ignore(itemId, parentId, guid);
        this._logger.debug("ignore: ", ignore);
        if (ignore) {
            if (itemId !== MOZILLA_FIREFOX_FOLDER) {
                return;
            }
            let storageEntry = this._storage.findEntry({ browser_id: MOZILLA_FIREFOX_FOLDER });
            if (!storageEntry) {
                return;
            }
        }
        let entry = {
            id_string: null,
            parent_id_string: null,
            browser_id: itemId,
            parent_browser_id: parentId,
            folder: itemType === PlacesUtils.bookmarks.TYPE_FOLDER
        };
        if (this.removeEntry(entry)) {
            this.sync();
        }
    },
    onItemChanged: function BookmarksEngine_onItemChanged(itemId, property, isAnno, value, lastModified, itemType, parentId, guid, parentGuid) {
        if (isAnno) {
            return;
        }
        if ([
                "favicon",
                "dateAdded",
                "lastModified"
            ].indexOf(property) !== -1) {
            return;
        }
        this._logger.debug("onItemChanged: " + itemId + (", " + property) + (value ? " = \"" + value + "\"" : ""));
        let ignore = this._ignore(itemId, parentId, guid);
        this._logger.debug("ignore: ", ignore);
        if (ignore) {
            return;
        }
        let entry = {
            id_string: null,
            parent_id_string: null,
            browser_id: itemId,
            parent_browser_id: parentId,
            folder: itemType === PlacesUtils.bookmarks.TYPE_FOLDER
        };
        if (lastModified) {
            entry.mtime = new Date(lastModified / 1000).getTime();
        }
        if (this.changeEntry(entry)) {
            this.sync();
        }
    },
    onItemMoved: function BookmarksEngine_onItemMoved(itemId, oldParentId, oldIndex, newParentId, newIndex, itemType, guid, oldParentGuid, newParentGuid) {
        this._logger.debug("onItemMoved: ", itemId);
        let ignore = this._ignore(itemId, newParentId, guid);
        this._logger.debug("ignore: ", ignore);
        if (ignore) {
            return;
        }
        let entry = {
            id_string: null,
            parent_id_string: null,
            position_in_parent: newIndex,
            browser_id: itemId,
            parent_browser_id: newParentId,
            browser_position: newIndex,
            folder: itemType === PlacesUtils.bookmarks.TYPE_FOLDER
        };
        if (this.moveEntry(entry)) {
            this.sync();
        }
    },
    onBeginUpdateBatch: function BookmarksEngine_onBeginUpdateBatch() {
    },
    onEndUpdateBatch: function BookmarksEngine_onEndUpdateBatch() {
    },
    onItemVisited: function BookmarksEngine_onItemVisited() {
    },
    onBeforeItemRemoved: function BookmarksEngine_onBeforeItemRemoved() {
    },
    addEntry: function BookmarksEngine_addEntry(entry) {
        this._logger.debug("addEntry", JSON.stringify(entry));
        if (!entry) {
            return false;
        }
        let parentEntry = this._storage.findEntry({ browser_id: entry.parent_browser_id });
        if (!parentEntry) {
            this._logger.debug("Can not find parent entry for '" + entry.browser_id + "'");
            if (entry.parent_browser_id === PlacesUtils.bookmarks.bookmarksMenuFolder) {
                this._createMenuFolder();
            }
            if (entry.parent_browser_id === MOZILLA_FIREFOX_FOLDER) {
                this._createMozillaFirefoxFolder();
            }
            this._queue.write("add", [entry]);
            return false;
        }
        this._logger.debug("parentEntry: ", JSON.stringify(parentEntry));
        entry.parent_id_string = parentEntry.id_string;
        entry.position_in_parent = entry.browser_position;
        this._shiftEntriesByParent(entry.parent_browser_id);
        this.record.insert({ add: [entry] }, true);
        return true;
    },
    removeEntry: function BookmarksEngine_removeEntry(entry) {
        this._logger.debug("removeEntry", JSON.stringify(entry));
        if (!entry) {
            return false;
        }
        let deletedEntry = this._storage.findEntry({ browser_id: entry.browser_id });
        if (!deletedEntry) {
            this._queue.write("remove", [entry]);
            return false;
        }
        if (deletedEntry.server_defined_unique_tag) {
            this._logger.debug("Trying delete entry with server_defined_unique_tag");
            switch (deletedEntry.server_defined_unique_tag) {
            case "tablet_bookmarks":
                this._storage.removeEntries({ server_defined_unique_tag: "tablet_bookmarks" });
                this._syncedTabletFolderId = null;
                break;
            case "mobile_bookmarks":
                this._storage.removeEntries({ server_defined_unique_tag: "mobile_bookmarks" });
                this._syncedMobileFolderId = null;
                break;
            default:
                break;
            }
            return;
        }
        if (entry.folder) {
            let someChild = this._storage.findEntry({ parent_browser_id: entry.browser_id });
            if (someChild) {
                this._queue.write("remove", [entry]);
                return false;
            }
            this._queue.remove([entry.browser_id]);
        }
        this.record.insert({ remove: [deletedEntry] }, true);
        return true;
    },
    changeEntry: function BookmarksEngine_changeEntry(entry) {
        this._logger.debug("changeEntry", JSON.stringify(entry));
        if (!entry) {
            return false;
        }
        let changedEntry = this._storage.findEntry({ browser_id: entry.browser_id });
        if (!changedEntry) {
            this._logger.debug("Can not find entry for '" + entry.browser_id + "'");
            this._queue.write("modify", [entry]);
            return false;
        }
        if (changedEntry.server_defined_unique_tag) {
            this._logger.debug("Trying change entry with server_defined_unique_tag");
            return;
        }
        let localEntry = this._getLocalEntryById(entry.browser_id);
        if (!localEntry) {
            this._logger.debug("Can not find local entry for '" + entry.browser_id + "'");
            return false;
        }
        this._logger.debug("localEntry: ", JSON.stringify(localEntry));
        if (localEntry.parentId !== entry.parent_browser_id && entry.browser_id !== PlacesUtils.bookmarks.bookmarksMenuFolder) {
            this._logger.debug("Changed parent folder");
            this._queue.write("modify", [entry]);
            return false;
        }
        this._updateEntryByLocal(changedEntry, localEntry);
        for (let [
                    key,
                    value
                ] in Iterator(entry)) {
            if (value != null) {
                changedEntry[key] = value;
            }
        }
        this._logger.debug("changedEntry: ", JSON.stringify(changedEntry));
        this.record.insert({ add: [changedEntry] }, true);
        return true;
    },
    moveEntry: function BookmarksEngine_moveEntry(entry, dontShift) {
        this._logger.debug("moveEntry", JSON.stringify(entry));
        let movedEntry = this._storage.findEntry({ browser_id: entry.browser_id });
        if (!movedEntry) {
            this._logger.debug("Can not find entry for '" + entry.browser_id + "'");
            this._queue.write("move", [entry]);
            return false;
        }
        if (movedEntry.server_defined_unique_tag) {
            this._logger.debug("Trying move entry with server_defined_unique_tag");
            return;
        }
        let parentEntry = this._storage.findEntry({ browser_id: entry.parent_browser_id });
        if (!parentEntry) {
            this._logger.debug("Can not find parent entry for '" + entry.browser_id + "' with parent '" + entry.parent_browser_id + "'");
            if (entry.parent_browser_id === PlacesUtils.bookmarks.bookmarksMenuFolder) {
                this._createMenuFolder();
            }
            if (entry.parent_browser_id === MOZILLA_FIREFOX_FOLDER) {
                this._createMozillaFirefoxFolder();
            }
            this._queue.write("move", [entry]);
            return false;
        }
        let localEntry = this._getLocalEntryById(entry.browser_id);
        if (!localEntry) {
            this._logger.debug("Can not find local entry for '" + entry.browser_id + "'");
            return false;
        }
        this._logger.debug("localEntry: ", JSON.stringify(localEntry));
        if (localEntry.parentId !== entry.parent_browser_id) {
            this._logger.debug("Conflict with parent folders local: ", localEntry.parent_browser_id, ", entry: ", entry.parent_browser_id);
        }
        this._updateEntryByLocal(movedEntry, localEntry);
        movedEntry.parent_id_string = parentEntry.id_string;
        movedEntry.parent_browser_id = entry.parent_browser_id;
        movedEntry.position_in_parent = entry.browser_position;
        if (!dontShift) {
            this._shiftEntriesByParent(movedEntry.parent_browser_id);
        }
        this.record.insert({ add: [movedEntry] }, true);
        return true;
    },
    _shiftEntriesByParent: function BookmarksEngine__shiftEntriesByParent(parentId) {
        let listParentIds = [];
        let that = this;
        let trigger = Utils.throttle(triggerShift, 1000, true);
        this._shiftEntriesByParent = function BookmarksEngine__shiftEntriesByParentInternal(parentId) {
            NativeAPI.Async.nextTick(function () {
                if (listParentIds.indexOf(parentId) === -1) {
                    listParentIds.push(parentId);
                }
                trigger.call(that);
            });
        };
        this._shiftEntriesByParent(parentId);
        function triggerShift() {
            while (listParentIds.length) {
                let id = listParentIds.shift();
                shiftEntriesByParent.call(that, id);
            }
        }
        function shiftEntriesByParent(parentId) {
            this._logger.debug("[start] _shiftEntriesByParent " + parentId);
            let siblingSQLEntries = this.placesDBWrapper.execQuerySpinningly(QUERIES.SELECT_ALL_BOOKMARKS).filter(function (entrySQL) {
                if (entrySQL.parentId !== parentId) {
                    return false;
                }
                return true;
            });
            if (!siblingSQLEntries.length) {
                this._logger.debug("[end] _shiftEntriesByParent " + parentId);
                return;
            }
            siblingSQLEntries.sort(function (a, b) {
                if (a.position > b.position) {
                    return 1;
                }
                return -1;
            });
            let movedEntries = {};
            let prevEntry;
            for (let i = 0, length = siblingSQLEntries.length; i < length; i++) {
                let entrySQL = siblingSQLEntries[i];
                if (entrySQL.id_string == null) {
                    continue;
                }
                let entry = this._model.getFromSQL(entrySQL);
                if (entry.position_in_parent !== entry.browser_position) {
                    this.moveEntry(entry, true);
                }
            }
            this._logger.debug("[end] _shiftEntries " + parentId);
        }
    },
    _hasSameIdSQLFunc: function BookmarksEngine__hasSameIdSQLFunc(args) {
        let id = JSON.parse(args.getString(0)).browser_id;
        let newId = JSON.parse(args.getString(1)).browser_id;
        return id === newId ? 1 : 0;
    },
    _syncQueue: function BookmarksEngine__syncQueue() {
        this._logger.debug("syncQueue");
        let needSync = false;
        let data = this._queue.read();
        for (let [
                    action,
                    actionData
                ] in Iterator(data)) {
            for (let [
                        key,
                        value
                    ] in Iterator(actionData)) {
                switch (action) {
                case "add":
                    needSync = this.addEntry(value) || needSync;
                    break;
                case "remove":
                    needSync = this.removeEntry(value) || needSync;
                    break;
                case "modify":
                    needSync = this.changeEntry(value) || needSync;
                    break;
                case "move":
                    needSync = this.moveEntry(value) || needSync;
                    break;
                    break;
                default:
                    break;
                }
            }
        }
        if (needSync) {
            this.sync();
        }
    },
    _sortList: function BookmarksEngine__sortList(list) {
        list = list.sort(function (a, b) {
            if (a.position_in_parent < b.position_in_parent) {
                return -1;
            }
            return 1;
        });
        let length = list.length;
        for (let i = 0; i < length; i++) {
            let item = list[i];
            if (item.server_defined_unique_tag === "tablet_bookmarks" || item.server_defined_unique_tag === "mobile_bookmarks") {
                list.splice(i, 1);
                list.push(item);
                i--;
                length--;
            }
        }
        let iters = 0;
        let MAX_ITERS = Math.pow(length, 2);
        length = list.length;
        for (let i = 0; i < length; i++) {
            let iitem = list[i];
            let needCheckSameIndex = false;
            for (let j = i + 1; j < length; j++) {
                let jitem = list[j];
                if (iitem.parent_id_string === jitem.id_string) {
                    list.splice(i, 1);
                    list.splice(j, 0, iitem);
                    needCheckSameIndex = true;
                }
            }
            if (needCheckSameIndex) {
                i--;
            }
            iters++;
            if (iters > MAX_ITERS) {
                break;
            }
        }
    },
    _getLocalEntryById: function BookmarksEngine__getLocalEntry(id) {
        return this.placesDBWrapper.execQuerySpinningly(QUERIES.SELECT_SPECIFIC_BOOKMARK, { browser_id: id })[0];
    },
    _updateEntryByLocal: function BookmarksEngine__updateEntryByLocal(entry, localEntry) {
        entry.title = localEntry.title;
        entry.url = localEntry.url;
        entry.mtime = localEntry.lastModified;
        entry.browser_position = localEntry.position;
    },
    _migrate: function BookmarksEngine__migrate() {
        if (this.version < 1.1) {
            this._logger.debug("Migrating at 1.1 version");
            this._afterFirstSyncHook = function BookmarksEngine__afterFirstSyncHook() {
                this._logger.debug("_afterFirstSyncHook version 1.1");
                let localEntry = this._storage.findEntry({ browser_id: PlacesUtils.bookmarks.bookmarksMenuFolder });
                this._logger.debug("Founded client_defined_unique_tag 'firefox_menu_folder': " + Boolean(localEntry));
                let needSync = false;
                if (localEntry) {
                    localEntry.client_defined_unique_tag = "";
                    localEntry.yandex_client_tag = "firefox_menu_folder";
                    needSync = this.changeEntry(localEntry);
                }
                localEntry = this._storage.findEntry({ browser_id: MOZILLA_FIREFOX_FOLDER });
                this._logger.debug("Founded client_defined_unique_tag 'mozilla_firefox_folder': " + Boolean(localEntry));
                if (localEntry) {
                    localEntry.client_defined_unique_tag = "";
                    localEntry.yandex_client_tag = "mozilla_firefox_folder";
                    needSync = this.changeEntry(localEntry) || needSync;
                }
                if (needSync) {
                    this.sync();
                }
            };
        }
        if (this.version < 1.2) {
            this._logger.debug("Migrating at 1.2 version");
            this.database.execQuerySpinningly(STORAGE_QUERIES.DROP_ENGINE_TABLE);
            this.database.execQuerySpinningly(STORAGE_QUERIES.INIT_ENGINE_TABLE);
            this.token = "";
        }
    },
    _afterFirstSyncHook: function BookmarksEngine__afterFirstSyncHook() {
    },
    get placesDBWrapper() {
        delete this.placesDBWrapper;
        let placesDBWrapper = Utils.databaseWrapper(placesDBConnection);
        this.__defineGetter__("placesDBWrapper", function () {
            return placesDBWrapper;
        });
        return placesDBWrapper;
    },
    _syncedMenuFolder: false,
    _syncedMozillaFirefoxFolder: false,
    _syncedTabletFolderId: null,
    _syncedMobileFolderId: null,
    _excludeDuplicate: false,
    _itemTypes: null,
    _PROTO_ID: 32904
};
