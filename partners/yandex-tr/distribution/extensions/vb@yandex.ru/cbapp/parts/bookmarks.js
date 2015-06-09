"use strict";
const EXPORTED_SYMBOLS = ["bookmarks"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils", "resource://gre/modules/PlacesUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "LIVEMARKS_SVC", "@mozilla.org/browser/livemark-service;2", "mozIAsyncLivemarks");
const bookmarks = {
    init: function Bookmarks_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Bookmarks");
        this._delayInitTimer = new sysutils.Timer(() => {
            PlacesUtils.bookmarks.addObserver(this._changesObserver, false);
        }, 5000);
    },
    finalize: function Bookmarks_finalize(doCleanup, callback) {
        if (this._delayInitTimer.isRunning) {
            this._delayInitTimer.cancel();
        } else {
            PlacesUtils.bookmarks.removeObserver(this._changesObserver);
        }
        if (this._bookmarksStateTimer) {
            this._bookmarksStateTimer.cancel();
        }
        this._application = null;
        this._logger = null;
    },
    requestBranch: function Bookmarks_requestBranch(id, callback) {
        let self = this;
        let options = PlacesUtils.history.getNewQueryOptions();
        options.queryType = options.QUERY_TYPE_BOOKMARKS;
        options.excludeQueries = true;
        options.excludeItems = false;
        options.asyncEnabled = true;
        id = id || PlacesUtils.bookmarks.toolbarFolder;
        let query = PlacesUtils.history.getNewQuery();
        query.setFolders([id], 1);
        let result = PlacesUtils.history.executeQuery(query, options);
        let historyResultObserver = {
            batching: function Bookmarks_requestBookmarksBranch_batching() {
            },
            containerClosed: function Bookmarks_requestBookmarksBranch_containerClosed() {
            },
            containerOpened: function Bookmarks_requestBookmarksBranch_containerOpened() {
            },
            invalidateContainer: function Bookmarks_requestBookmarksBranch_invalidateContainer() {
            },
            nodeAnnotationChanged: function Bookmarks_requestBookmarksBranch_nodeAnnotationChanged() {
            },
            nodeDateAddedChanged: function Bookmarks_requestBookmarksBranch_nodeDateAddedChanged() {
            },
            nodeHistoryDetailsChanged: function Bookmarks_requestBookmarksBranch_nodeHistoryDetailsChanged() {
            },
            nodeIconChanged: function Bookmarks_requestBookmarksBranch_nodeIconChanged() {
            },
            nodeInserted: function Bookmarks_requestBookmarksBranch_nodeInserted() {
            },
            nodeKeywordChanged: function Bookmarks_requestBookmarksBranch_nodeKeywordChanged() {
            },
            nodeLastModifiedChanged: function Bookmarks_requestBookmarksBranch_nodeLastModifiedChanged() {
            },
            nodeMoved: function Bookmarks_requestBookmarksBranch_nodeMoved() {
            },
            nodeRemoved: function Bookmarks_requestBookmarksBranch_nodeRemoved() {
            },
            nodeReplaced: function Bookmarks_requestBookmarksBranch_nodeReplaced() {
            },
            nodeTagsChanged: function Bookmarks_requestBookmarksBranch_nodeTagsChanged() {
            },
            nodeTitleChanged: function Bookmarks_requestBookmarksBranch_nodeTitleChanged() {
            },
            nodeURIChanged: function Bookmarks_requestBookmarksBranch_nodeURIChanged() {
            },
            sortingChanged: function Bookmarks_requestBookmarksBranch_sortingChanged() {
            },
            containerStateChanged: function Bookmarks_requestBookmarksBranch_historyContainerStateChanged(node, oldState, newState) {
                if (newState !== Ci.nsINavHistoryContainerResultNode.STATE_OPENED) {
                    return;
                }
                result.removeObserver(historyResultObserver);
                if (result.root.childCount) {
                    let tasks = [];
                    for (let i = 0; i < result.root.childCount; i++) {
                        (function (i) {
                            tasks.push(function (callback) {
                                let node = result.root.getChild(i);
                                let isFolder = node.type === node.RESULT_TYPE_FOLDER;
                                if (!isFolder && node.type !== node.RESULT_TYPE_URI) {
                                    return callback();
                                }
                                let id = isFolder ? String(node.itemId) : "";
                                let bookmark = {
                                    url: isFolder ? "" : node.uri,
                                    title: node.title || "",
                                    id: id,
                                    isFolder: isFolder
                                };
                                if (isFolder) {
                                    bookmark.favicon = "";
                                    return callback(null, bookmark);
                                }
                                if (node.icon) {
                                    bookmark.favicon = node.icon;
                                    return callback(null, bookmark);
                                }
                                let locationObj = self._application.fastdial.getDecodedLocation(node.uri);
                                if (locationObj.location) {
                                    self._application.favicons.requestFaviconForURL(locationObj.location, function (faviconData) {
                                        bookmark.favicon = faviconData || self._application.favicons.EMPTY_ICON;
                                        return callback(null, bookmark);
                                    });
                                } else {
                                    bookmark.favicon = "";
                                    callback(null, bookmark);
                                }
                            });
                        }(i));
                    }
                    async.parallel(tasks, function (err, results) {
                        let bookmarks = results.filter(Boolean);
                        callback(bookmarks);
                    });
                    result.root.containerOpen = false;
                    return;
                }
                result.root.containerOpen = false;
                self._getLivemark({ id: id }, function (aStatus, aLivemark) {
                    if (aStatus !== Cr.NS_OK) {
                        callback([]);
                        return;
                    }
                    self._fetchLivemarkChildren(aLivemark, node, callback);
                });
            },
            QueryInterface: XPCOMUtils.generateQI([Ci.nsINavHistoryResultObserver])
        };
        result.addObserver(historyResultObserver, false);
        result.root.containerOpen = true;
    },
    _requestListForFolder: function Bookmarks__requestListForFolder(limit, id, callback) {
        let options = PlacesUtils.history.getNewQueryOptions();
        options.queryType = options.QUERY_TYPE_BOOKMARKS;
        options.excludeQueries = true;
        options.excludeItems = false;
        options.asyncEnabled = true;
        options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
        options.maxResults = limit;
        id = id || PlacesUtils.bookmarks.toolbarFolder;
        let query = PlacesUtils.history.getNewQuery();
        query.setFolders([id], 1);
        let db = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase);
        let bookmarks = [];
        db.asyncExecuteLegacyQueries([query], 1, options, {
            handleResult: resultSet => {
                let row;
                while (row = resultSet.getNextRow()) {
                    let url = row.getResultByIndex(1);
                    let title = row.getResultByIndex(2);
                    bookmarks.push({
                        url: url,
                        title: title
                    });
                }
            },
            handleError: error => {
                throw error;
            },
            handleCompletion: reason => {
                callback(bookmarks);
            }
        });
    },
    findBookmarks: function Bookmarks_findBookmarks(searchText) {
        let deferred = promise.defer();
        let options = PlacesUtils.history.getNewQueryOptions();
        options.queryType = options.QUERY_TYPE_BOOKMARKS;
        options.excludeQueries = true;
        options.excludeItems = false;
        options.asyncEnabled = true;
        options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
        let query = PlacesUtils.history.getNewQuery();
        query.searchTerms = searchText;
        let db = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase);
        let bookmarks = [];
        db.asyncExecuteLegacyQueries([query], 1, options, {
            handleResult: resultSet => {
                let row;
                while (row = resultSet.getNextRow()) {
                    let url = row.getResultByIndex(1);
                    let title = row.getResultByIndex(2);
                    bookmarks.push({
                        url: url,
                        title: title
                    });
                }
            },
            handleError: error => {
                deferred.reject(error);
            },
            handleCompletion: reason => {
                deferred.resolve(bookmarks);
            }
        });
        return deferred.promise;
    },
    requestList: function Bookmarks_requestList(limit, callback) {
        let tasks = [];
        [
            "bookmarksMenuFolder",
            "toolbarFolder",
            "unfiledBookmarksFolder"
        ].map(place => PlacesUtils.bookmarks[place]).forEach(placeId => {
            tasks.push(callback => {
                this._requestListForFolder(limit, placeId, bookmarks => {
                    callback(bookmarks);
                });
            });
        });
        let queue = tasks.length;
        let allBookmarks = [];
        let onLoad = () => {
            allBookmarks = allBookmarks.reduce((res, val) => {
                return res.concat(val.map(bookmark => {
                    return {
                        url: bookmark.url,
                        title: bookmark.title,
                        favicon: bookmark.favicon
                    };
                }));
            }, []);
            callback(allBookmarks);
        };
        tasks.forEach(function (task) {
            task(data => {
                allBookmarks.push(data);
                queue--;
                if (!queue) {
                    onLoad();
                }
            });
        });
    },
    _getLivemark: function Bookmarks__getLivemark(aLivemarkInfo, aCallback) {
        try {
            LIVEMARKS_SVC.getLivemark(aLivemarkInfo).then(livemark => aCallback(Cr.NS_OK, livemark), () => aCallback(Cr.NS_ERROR_UNEXPECTED));
        } catch (err) {
            LIVEMARKS_SVC.getLivemark(aLivemarkInfo, livemark => {
                aCallback(Cr.NS_OK, livemark);
            });
        }
    },
    _fetchLivemarkChildren: function Bookmarks__fetchLivemarkChildren(aLivemark, aContainerNode, callback, onContainerRelease) {
        let self = this;
        let livemarks = [];
        let livemarksParsedNum = 0;
        let totalLivemarksNum = 0;
        let asyncFetch = false;
        let onIconReady = function _fetchLivemarkChildren__onIconReady(livemark, url) {
            livemark.favicon = url || self._application.favicons.EMPTY_ICON;
            livemarks.push(livemark);
            livemarksParsedNum += 1;
            if (livemarksParsedNum === totalLivemarksNum) {
                if (asyncFetch) {
                    aLivemark.unregisterForUpdates(aContainerNode);
                }
                callback(livemarks);
            }
        };
        let onLivemarkReady = function Bookmarks__fetchLivemarkChildren_onLivemarkReady(node) {
            let isFolder = node.type === node.RESULT_TYPE_FOLDER;
            let livemark = {
                url: isFolder ? "" : node.uri,
                title: node.title || "",
                id: node.itemId,
                isFolder: isFolder
            };
            if (!isFolder) {
                if (node.icon) {
                    onIconReady(livemark, node.icon);
                } else {
                    let locationObj = self._application.fastdial.getDecodedLocation(node.uri);
                    if (locationObj.location) {
                        self._application.favicons.requestFaviconForURL(locationObj.location, function (faviconData) {
                            onIconReady(livemark, faviconData);
                        });
                    } else {
                        onIconReady(livemark);
                    }
                }
            } else {
                onIconReady(livemark);
            }
        };
        let cachedChildren = aLivemark.getNodesForContainer(aContainerNode);
        if (cachedChildren.length) {
            totalLivemarksNum = cachedChildren.length;
            cachedChildren.forEach(onLivemarkReady);
            return;
        }
        let livemarkResultObserver = {
            batching: function () {
            },
            containerClosed: function () {
            },
            containerOpened: function () {
            },
            invalidateContainer: function (aContainerNode) {
                let children = aLivemark.getNodesForContainer(aContainerNode);
                totalLivemarksNum = children.length;
            },
            nodeAnnotationChanged: function () {
            },
            nodeDateAddedChanged: function () {
            },
            nodeHistoryDetailsChanged: onLivemarkReady,
            nodeIconChanged: function () {
            },
            nodeInserted: function () {
            },
            nodeKeywordChanged: function () {
            },
            nodeLastModifiedChanged: function () {
            },
            nodeMoved: function () {
            },
            nodeRemoved: function () {
            },
            nodeReplaced: function () {
            },
            nodeTagsChanged: function () {
            },
            nodeTitleChanged: function () {
            },
            nodeURIChanged: function () {
            },
            sortingChanged: function () {
            },
            containerStateChanged: function () {
            },
            QueryInterface: XPCOMUtils.generateQI([Ci.nsINavHistoryResultObserver])
        };
        asyncFetch = true;
        aLivemark.registerForUpdates(aContainerNode, livemarkResultObserver);
        aLivemark.reload(true);
        let livemarkLoadChecker = new sysutils.Timer(function () {
            if (aLivemark.status == Ci.mozILivemark.STATUS_FAILED) {
                callback(livemarks);
            }
        }, 1000);
    },
    _sendStateChanged: function Bookmarks__sendStateChanged() {
        if (this._bookmarksStateTimer) {
            this._bookmarksStateTimer.cancel();
        }
        let showBookmarks = this._application.preferences.get("ftabs.showBookmarks");
        if (!showBookmarks) {
            return;
        }
        this._bookmarksStateTimer = new sysutils.Timer(() => {
            this.requestBranch("", bookmarks => {
                this._application.fastdial.sendRequest("bookmarksStateChanged", bookmarks);
            });
        }, 50);
    },
    _changesObserver: {
        onBeforeItemRemoved: function Bookmarks__changesObserver_onBeforeItemRemoved() {
        },
        onBeginUpdateBatch: function Bookmarks__changesObserver_onBeginUpdateBatch() {
        },
        onEndUpdateBatch: function Bookmarks__changesObserver_onEndUpdateBatch() {
        },
        onSeparatorAdded: function Bookmarks__changesObserver_onSeparatorAdded() {
        },
        onSeparatorRemoved: function Bookmarks__changesObserver_onSeparatorRemoved() {
        },
        onFolderAdded: function Bookmarks__changesObserver_onFolderAdded() {
        },
        onFolderRemoved: function Bookmarks__changesObserver_onFolderRemoved() {
        },
        onFolderMoved: function Bookmarks__changesObserver_onFolderMoved() {
        },
        onFolderChanged: function Bookmarks__changesObserver_onFolderChanged() {
        },
        onItemVisited: function Bookmarks__changesObserver_onItemVisited() {
        },
        onItemReplaced: function Bookmarks__changesObserver_onItemReplaced() {
        },
        onItemAdded: function Bookmarks__changesObserver_onItemAdded(aItemId, aParentId, aIndex) {
            bookmarks._logger.trace("onItemAdded [id=" + aItemId + "] [parentId=" + aParentId + "] [index=" + aIndex + "]");
            if ([
                    PlacesUtils.bookmarks.toolbarFolder,
                    PlacesUtils.bookmarks.bookmarksMenuFolder,
                    PlacesUtils.bookmarks.unfiledBookmarksFolder
                ].indexOf(aParentId) === -1) {
                bookmarks._sendStateChanged();
            }
        },
        onItemRemoved: function Bookmarks__changesObserver_onItemRemoved(aItemId, aParentId, aIndex) {
            bookmarks._logger.trace("onItemRemoved [id=" + aItemId + "] [parentId=" + aParentId + "] [index=" + aIndex + "]");
            if ([
                    PlacesUtils.bookmarks.toolbarFolder,
                    PlacesUtils.bookmarks.bookmarksMenuFolder,
                    PlacesUtils.bookmarks.unfiledBookmarksFolder
                ].indexOf(aParentId) === -1) {
                bookmarks._sendStateChanged();
            }
        },
        onItemChanged: function Bookmarks__changesObserver_onItemChanged(aItemId, aProperty, aIsAnnotationProperty, aNewValue) {
            bookmarks._logger.trace("onItemChanged [id=" + aItemId + "] [property=" + aProperty + "] [isAnnotationProperty=" + aIsAnnotationProperty + "] [newValue=" + aNewValue + "]");
            let parentId = PlacesUtils.bookmarks.getFolderIdForItem(aItemId);
            if ([
                    PlacesUtils.bookmarks.toolbarFolder,
                    PlacesUtils.bookmarks.bookmarksMenuFolder,
                    PlacesUtils.bookmarks.unfiledBookmarksFolder
                ].indexOf(parentId) === -1) {
                bookmarks._sendStateChanged();
            }
        },
        onItemMoved: function Bookmarks__changesObserver_onItemMoved(aItemId, aOldParentId, aOldIndex, aNewParentId, aNewIndex) {
            bookmarks._logger.trace("onItemMoved [id=" + aItemId + "] [oldParentId=" + aOldParentId + "] [oldIndex=" + aOldIndex + "] [newParentId=" + aNewParentId + "] [newIndex=" + aNewIndex + "]");
            if ([
                    PlacesUtils.bookmarks.toolbarFolder,
                    PlacesUtils.bookmarks.bookmarksMenuFolder,
                    PlacesUtils.bookmarks.unfiledBookmarksFolder
                ].indexOf(aOldParentId) === -1 || [
                    PlacesUtils.bookmarks.toolbarFolder,
                    PlacesUtils.bookmarks.bookmarksMenuFolder,
                    PlacesUtils.bookmarks.unfiledBookmarksFolder
                ].indexOf(aNewParentId) === -1) {
                bookmarks._sendStateChanged();
            }
        },
        QueryInterface: XPCOMUtils.generateQI([
            Ci.nsISupports,
            Ci.nsINavBookmarksObserver
        ])
    },
    _application: null,
    _logger: null,
    _bookmarksStateTimer: null,
    _delayInitTimer: null
};
