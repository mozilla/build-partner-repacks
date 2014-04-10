"use strict";
const EXPORTED_SYMBOLS = ["bookmarks"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
const GLOBAL = this;
const UI_STARTED_EVENT = "browser-delayed-startup-finished";
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "LIVEMARKS_SVC", "@mozilla.org/browser/livemark-service;2", "mozIAsyncLivemarks" in Ci ? "mozIAsyncLivemarks" : "nsILivemarkService");
const bookmarks = {
        init: function Bookmarks_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            Services.obs.addObserver(this, UI_STARTED_EVENT, false);
            PlacesUtils.bookmarks.addObserver(this._changesObserver, false);
            this._application = application;
            this._logger = application.getLogger("Bookmarks");
        },
        finalize: function Bookmarks_finalize(doCleanup, callback) {
            try {
                Services.obs.removeObserver(this, UI_STARTED_EVENT);
            } catch (e) {
            }
            PlacesUtils.bookmarks.removeObserver(this._changesObserver);
            if (this._bookmarksStateTimer)
                this._bookmarksStateTimer.cancel();
            this._application = null;
            this._logger = null;
        },
        observe: function Bookmarks_observe(aSubject, aTopic, aData) {
            switch (aTopic) {
            case UI_STARTED_EVENT:
                let appInfo = this._application.addonManager.info;
                if (appInfo.isFreshAddonInstall) {
                    const BOOKMARKS_TOOLBAR_ID = "PersonalToolbar";
                    let topWindow = misc.getTopBrowserWindow();
                    let bookmarksBrowserToolbar = topWindow && topWindow.document.querySelector("#" + BOOKMARKS_TOOLBAR_ID);
                    if (bookmarksBrowserToolbar) {
                        let prefOldValue = this._application.preferences.get("ftabs.showBookmarks", false);
                        if (bookmarksBrowserToolbar.collapsed) {
                            this._application.preferences.set("ftabs.showBookmarks", false);
                        } else {
                            this._application.preferences.set("ftabs.showBookmarks", true);
                            bookmarksBrowserToolbar.collapsed = true;
                            topWindow.document.persist(BOOKMARKS_TOOLBAR_ID, "collapsed");
                        }
                        if (prefOldValue !== this._application.preferences.get("ftabs.showBookmarks", false))
                            this._application.fastdial.requestInit();
                    }
                }
                Services.obs.removeObserver(this, UI_STARTED_EVENT);
                break;
            }
        },
        requestBranch: function Bookmarks_requestBranch(id, callback) {
            var self = this;
            var options = PlacesUtils.history.getNewQueryOptions();
            options.queryType = options.QUERY_TYPE_BOOKMARKS;
            options.excludeQueries = true;
            options.excludeItems = false;
            options.asyncEnabled = true;
            id = id || PlacesUtils.bookmarks.toolbarFolder;
            var query = PlacesUtils.history.getNewQuery();
            query.setFolders([id], 1);
            var historyResultObserver = {
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
                        if (newState !== Ci.nsINavHistoryContainerResultNode.STATE_OPENED)
                            return;
                        result.removeObserver(historyResultObserver);
                        if (result.root.childCount) {
                            let tasks = [];
                            let (i = 0) {
                                for (; i < result.root.childCount; i++) {
                                    (function (i) {
                                        tasks.push(function (callback) {
                                            var node = result.root.getChild(i);
                                            var isFolder = node.type === node.RESULT_TYPE_FOLDER;
                                            if (!isFolder && node.type !== node.RESULT_TYPE_URI) {
                                                return callback();
                                            }
                                            var id = isFolder ? node.itemId + "" : "";
                                            var bookmark = {
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
                                            var locationObj = self._application.fastdial.getDecodedLocation(node.uri);
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
                            }
                            async.parallel(tasks, function (err, results) {
                                var bookmarks = results.filter(function (bookmark) !!bookmark);
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
            var result = PlacesUtils.history.executeQuery(query, options);
            result.addObserver(historyResultObserver, false);
            result.root.containerOpen = true;
        },
        _getLivemark: function Bookmarks__getLivemark(aLivemarkInfo, aCallback) {
            if ("getLivemark" in LIVEMARKS_SVC) {
                LIVEMARKS_SVC.getLivemark(aLivemarkInfo, aCallback);
            } else {
                aCallback(LIVEMARKS_SVC.isLivemark(aLivemarkInfo.id) ? Cr.NS_OK : null);
            }
        },
        _fetchLivemarkChildren: function Bookmarks__fetchLivemarkChildren(aLivemark, aContainerNode, callback, onContainerRelease) {
            var self = this;
            var livemarks = [];
            var livemarksParsedNum = 0;
            var totalLivemarksNum = 0;
            var asyncFetch = false;
            var onLivemarkReady = function Bookmarks__fetchLivemarkChildren_onLivemarkReady(node) {
                var isFolder = node.type === node.RESULT_TYPE_FOLDER;
                var livemark = {
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
            var onIconReady = function _fetchLivemarkChildren__onIconReady(livemark, url) {
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
            var cachedChildren = aLivemark.getNodesForContainer(aContainerNode);
            if (cachedChildren.length) {
                totalLivemarksNum = cachedChildren.length;
                cachedChildren.forEach(onLivemarkReady);
                return;
            }
            var livemarkResultObserver = {
                    batching: function () {
                    },
                    containerClosed: function () {
                    },
                    containerOpened: function () {
                    },
                    invalidateContainer: function (aContainerNode) {
                        var children = aLivemark.getNodesForContainer(aContainerNode);
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
            var livemarkLoadChecker = new sysutils.Timer(function () {
                    if (aLivemark.status == Ci.mozILivemark.STATUS_FAILED) {
                        callback(livemarks);
                    }
                }, 1000);
        },
        _sendStateChanged: function Bookmarks__sendStateChanged() {
            if (this._bookmarksStateTimer)
                this._bookmarksStateTimer.cancel();
            var self = this;
            var showBookmarks = this._application.preferences.get("ftabs.showBookmarks");
            this._bookmarksStateTimer = new sysutils.Timer(function () {
                if (showBookmarks) {
                    self.requestBranch("", function (bookmarks) {
                        self._application.fastdial.sendRequest("bookmarksStateChanged", bookmarks);
                    });
                }
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
                if (~[
                        PlacesUtils.bookmarks.toolbarFolder,
                        PlacesUtils.bookmarks.bookmarksMenuFolder,
                        PlacesUtils.bookmarks.unfiledBookmarksFolder
                    ].indexOf(aParentId))
                    bookmarks._sendStateChanged();
            },
            onItemRemoved: function Bookmarks__changesObserver_onItemRemoved(aItemId, aParentId, aIndex) {
                bookmarks._logger.trace("onItemRemoved [id=" + aItemId + "] [parentId=" + aParentId + "] [index=" + aIndex + "]");
                if (~[
                        PlacesUtils.bookmarks.toolbarFolder,
                        PlacesUtils.bookmarks.bookmarksMenuFolder,
                        PlacesUtils.bookmarks.unfiledBookmarksFolder
                    ].indexOf(aParentId))
                    bookmarks._sendStateChanged();
            },
            onItemChanged: function Bookmarks__changesObserver_onItemChanged(aItemId, aProperty, aIsAnnotationProperty, aNewValue) {
                bookmarks._logger.trace("onItemChanged [id=" + aItemId + "] [property=" + aProperty + "] [isAnnotationProperty=" + aIsAnnotationProperty + "] [newValue=" + aNewValue + "]");
                var parentId = PlacesUtils.bookmarks.getFolderIdForItem(aItemId);
                if (~[
                        PlacesUtils.bookmarks.toolbarFolder,
                        PlacesUtils.bookmarks.bookmarksMenuFolder,
                        PlacesUtils.bookmarks.unfiledBookmarksFolder
                    ].indexOf(parentId))
                    bookmarks._sendStateChanged();
            },
            onItemMoved: function Bookmarks__changesObserver_onItemMoved(aItemId, aOldParentId, aOldIndex, aNewParentId, aNewIndex) {
                bookmarks._logger.trace("onItemMoved [id=" + aItemId + "] [oldParentId=" + aOldParentId + "] [oldIndex=" + aOldIndex + "] [newParentId=" + aNewParentId + "] [newIndex=" + aNewIndex + "]");
                if (~[
                        PlacesUtils.bookmarks.toolbarFolder,
                        PlacesUtils.bookmarks.bookmarksMenuFolder,
                        PlacesUtils.bookmarks.unfiledBookmarksFolder
                    ].indexOf(aOldParentId) || ~[
                        PlacesUtils.bookmarks.toolbarFolder,
                        PlacesUtils.bookmarks.bookmarksMenuFolder,
                        PlacesUtils.bookmarks.unfiledBookmarksFolder
                    ].indexOf(aNewParentId))
                    bookmarks._sendStateChanged();
            },
            QueryInterface: XPCOMUtils.generateQI([
                Ci.nsISupports,
                Ci.nsINavBookmarksObserver
            ])
        },
        _application: null,
        _logger: null,
        _bookmarksStateTimer: null
    };
