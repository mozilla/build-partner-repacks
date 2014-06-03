"use strict";
const EXPORTED_SYMBOLS = ["bookmarksStat"];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const GLOBAL = this;
Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource:///modules/PlacesUIUtils.jsm");
const TYPE_BOOKMARK = PlacesUtils.bookmarks.TYPE_BOOKMARK;
const TYPE_FOLDER = PlacesUtils.bookmarks.TYPE_FOLDER;
const bookmarksStat = {
        init: function bookmarksStat_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger("BookmarksStat");
            PlacesUtils.bookmarks.addObserver(this, true);
            var handleBookmarkCommand = function handleBookmarkCommand() {
                try {
                    if (bookmarksStat && "_handleBookmarkCommand" in bookmarksStat)
                        bookmarksStat._handleBookmarkCommand.apply(bookmarksStat, arguments);
                } catch (e) {
                    Cu.reportError(e);
                }
            };
            [
                "openURINodesInTabs",
                "openContainerNodeInTabs",
                "openNodeWithEvent",
                "openNodeIn"
            ].forEach(function (methodName) {
                var originalMethod = PlacesUIUtils[methodName];
                PlacesUIUtils[methodName] = function PlacesUIUtils_overwrited() {
                    handleBookmarkCommand.apply(handleBookmarkCommand, arguments);
                    return originalMethod.apply(PlacesUIUtils, arguments);
                };
            });
        },
        finalize: function bookmarksStat_finalize() {
            try {
                PlacesUtils.bookmarks.removeObserver(this);
            } catch (e) {
            }
            for (let [
                        timerName,
                        timer
                    ] in Iterator(this._timers)) {
                timer.cancel();
                delete this._timers[timerName];
            }
            this._application = null;
            this._logger = null;
        },
        SEND_WAIT_TIMEOUT: 5000,
        onItemAdded: function bookmarksStat_onItemAdded(itemId, parentId, index, itemType, uri, title, dateAdded, guid, parentGuid) {
            this._lastCreatedItemInfo = {
                id: itemId,
                time: Date.now()
            };
            this._onBookmarksModified("create", itemType);
        },
        onItemRemoved: function bookmarksStat_onItemRemoved(itemId, parentId, index, itemType, uri, guid, parentGuid) {
            this._onBookmarksModified("delete", itemType);
        },
        onItemChanged: function bookmarksStat_onItemChanged(itemId, property, isAnno, value, lastModified, itemType, parentId, guid, parentGuid) {
            if (this._lastCreatedItemInfo.id === itemId) {
                if (Math.abs(Date.now() - this._lastCreatedItemInfo.time) < 1000)
                    return;
            }
            const OBSERVING_PROPERTIES = [
                    "title",
                    "uri",
                    "tags",
                    "keyword",
                    "bookmarkProperties/description"
                ];
            if (OBSERVING_PROPERTIES.indexOf(property) === -1)
                return;
            this._onBookmarksModified("edit", itemType);
        },
        onItemMoved: function bookmarksStat_onItemMoved(itemId, oldParentId, oldIndex, newParentId, newIndex, itemType, guid, oldParentGuid, newParentGuid) {
            this._onBookmarksModified("edit", itemType);
        },
        onBeginUpdateBatch: function bookmarksStat_onBeginUpdateBatch() {
        },
        onEndUpdateBatch: function bookmarksStat_onEndUpdateBatch() {
        },
        onItemVisited: function bookmarksStat_onItemVisited() {
        },
        onBeforeItemRemoved: function bookmarksStat_onBeforeItemRemoved() {
        },
        QueryInterface: XPCOMUtils.generateQI([
            Ci.nsINavBookmarkObserver,
            Ci.nsISupportsWeakReference
        ]),
        _onBookmarksModified: function bookmarksStat__onBookmarksModified(action, itemType) {
            var type;
            switch (itemType) {
            case TYPE_BOOKMARK:
                type = "bm";
                break;
            case TYPE_FOLDER:
                type = "bmfolder";
                break;
            default:
                return;
            }
            this._logAction(type + "." + action);
        },
        _handleBookmarkCommand: function bookmarksStat__handleBookmarkCommand(nodes, event, view) {
            const COMMAND_PLACES = {
                    "PersonalToolbar": "bmtoolbar",
                    "PlacesToolbar": "bmtoolbar",
                    "bookmarks-view": "bmsidebar",
                    "placeContent": "bmbrowse",
                    "bookmarks-menu-button": "bmbutton",
                    "panelMenu_bookmarksMenu": "bmpopup",
                    "bookmarksMenu": "bmmenu"
                };
            var place = COMMAND_PLACES[view.id || view.viewElt && view.viewElt.id] || "click";
            this._sendRequest("bmclick." + place);
        },
        _logAction: function bookmarksStat__logAction(param) {
            var group = false;
            if (param in this._timers) {
                this._timers[param].cancel();
                group = true;
            }
            var logAction = function logAction() {
                    delete this._timers[param];
                    this._sendRequest(param + (group ? ".group" : ""));
                }.bind(this);
            this._timers[param] = new sysutils.Timer(logAction, this.SEND_WAIT_TIMEOUT);
        },
        _sendRequest: function bookmarksStat__sendRequest(param) {
            var url = "http://clck.yandex.ru/click/dtype=stred/pid=12/cid=72508/path=fx." + param + "/*";
            var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
            request.open("GET", url, true);
            request.send(null);
        },
        _lastCreatedItemInfo: {
            id: null,
            time: 0
        },
        _timers: Object.create(null),
        _application: null,
        _logger: null
    };
