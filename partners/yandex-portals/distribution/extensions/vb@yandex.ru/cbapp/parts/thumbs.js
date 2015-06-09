"use strict";
const EXPORTED_SYMBOLS = ["thumbs"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const GLOBAL = this;
const OLDEST_THUMB_TIME_SECONDS = 86400 * 30;
const WEEK_UPDATE = 60 * 24 * 7;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(GLOBAL, "UUID_SVC", "@mozilla.org/uuid-generator;1", "nsIUUIDGenerator");
Cu.import("resource://gre/modules/Services.jsm");
const urlToThumbs = Object.create(null);
const hostToThumbs = Object.create(null);
const thumbs = {
    init: function (app) {
        app.core.Lib.sysutils.copyProperties(app.core.Lib, GLOBAL);
        this._application = app;
        this._logger = app.getLogger("Thumbs");
        let dataproviders = this._application.dataproviders;
        this.screenshotsProvider = dataproviders.getProvider("screenshots");
        this.faviconsProvider = dataproviders.getProvider("favicons");
        this.logosProvider = dataproviders.getProvider("logos");
        this.titlesProvider = dataproviders.getProvider("titles");
        this.screenshotsProvider.addListener("change", this._updateThumbs);
        this.faviconsProvider.addListener("change", this._updateThumbs);
        this.logosProvider.addListener("change", this._updateThumbs);
        this.titlesProvider.addListener("change", this._updateThumbsTitles);
        this._application.alarms.restoreOrCreate("updateAllThumbsData", {
            timeout: WEEK_UPDATE,
            isInterval: true,
            triggerIfCreated: false,
            handler: () => {
                this.updateThumbsData();
            }
        });
    },
    finalize: function (doCleanup, callback) {
        this.screenshotsProvider.removeListener("change", this._updateThumbs);
        this.faviconsProvider.removeListener("change", this._updateThumbs);
        this.logosProvider.removeListener("change", this._updateThumbs);
        this.titlesProvider.removeListener("change", this._updateThumbsTitles);
        this.screenshotsProvider = null;
        this.faviconsProvider = null;
        this.logosProvider = null;
        this.titlesProvider = null;
        this._application = null;
        this._logger = null;
    },
    updateThumbsData: function () {
        new sysutils.Timer(() => {
            this._logger.info("Updating all thumbs data");
            this._application.internalStructure.iterate(thumb => {
                thumb.requestData(true);
            });
        }, 3000);
    },
    _updateThumbs: function (eventName, target, data) {
        let thumbs = hostToThumbs[target.host];
        if (thumbs) {
            thumbs.forEach(thumb => thumb.update());
        }
    },
    _updateThumbsTitles: function (eventName, target, newTitle) {
        if (!newTitle) {
            return;
        }
        let thumbs = hostToThumbs[target.host];
        if (thumbs) {
            thumbs.forEach(thumb => {
                if (thumb.title) {
                    return;
                }
                thumb.title = newTitle;
            });
        }
    },
    onContextmenu: function (thumbIndex, state) {
        this._hoveredThumbIndex = thumbIndex;
        this.uiState = state;
    },
    get hoveredThumbIndex() {
        let index = this._hoveredThumbIndex;
        if (typeof this._hoveredThumbIndex === "undefined") {
            this._hoveredThumbIndex = -1;
        }
        return this._hoveredThumbIndex;
    },
    changePinState: function (index, value) {
        let thumb = this._application.internalStructure.getItem(index);
        thumb.pinned = value;
        thumb.statParam = "userthumb";
        this._logger.info("Thumb #" + index + " " + (value ? "pinned" : "unpinned"));
    },
    saveThumb: function (index, data) {
        if (index < 0 || sysutils.isEmptyObject(data)) {
            return;
        }
        this._application.advertisement.conditions.thumbWasAdded = true;
        let currentThumb = this._application.internalStructure.getItem(index);
        if (currentThumb && currentThumb.url === data.url && currentThumb.title !== data.title) {
            currentThumb.title = data.title;
            currentThumb.statParam = "userthumb";
            currentThumb.pinned = true;
            this._logger.info("User changed title in" + currentThumb);
            return;
        }
        let thumb = this.createThumbFromFrontendData(data);
        if (!thumb) {
            this._sendThumbChangedEvent({ index: index });
            return;
        }
        if ("pinned" in data) {
            thumb.pinned = data.pinned;
        }
        if ("statParam" in data) {
            thumb.statParam = data.statParam;
        }
        this._application.blacklist.deleteDomain(thumb.host);
        this._logger.info(thumb + " created at " + index);
        this._application.internalStructure.setItem(index, thumb);
        this._sendThumbChangedEvent({ index: index });
        this._application.fastdial.sendRequest("action", { type: "closePopups" });
        this._application.syncPinned.save();
    },
    remove: function Thumbs_remove(index, {addToBlacklist}) {
        if (index < 0) {
            return;
        }
        let thumb = this._application.internalStructure.getItem(index);
        if (!thumb) {
            return;
        }
        this._logger.info("Removing thumb #" + index + " (" + thumb.host + ")");
        this._application.internalStructure.removeItem(index, true);
        let isStandardURL = false;
        try {
            thumb.uri.QueryInterface(Ci.nsIURL);
            isStandardURL = true;
        } catch (ex) {
        }
        if (isStandardURL && addToBlacklist) {
            let hasSameDomain = false;
            let thumbHost = thumb.asciiHost.replace(/^www\./, "");
            this._application.internalStructure.iterate(function (thumb, thumbIndex) {
                if (index === thumbIndex) {
                    return;
                }
                if (thumbHost === thumb.asciiHost) {
                    hasSameDomain = true;
                }
            });
            if (!hasSameDomain) {
                this._application.blacklist.upsertDomain(thumbHost);
            }
        }
        this._application.fastdial.sendRequest("action", { type: "closePopups" });
        this._application.syncPinned.save();
    },
    swap: function (oldIndex, newIndex) {
        if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0) {
            return;
        }
        let thumb = this._application.internalStructure.getItem(oldIndex);
        let internalStructure = this._application.internalStructure;
        internalStructure.swap(oldIndex, newIndex);
        internalStructure.getItem(newIndex).statParam = "userthumb";
        internalStructure.getItem(newIndex).pinned = true;
        if (oldIndex > newIndex) {
            [
                oldIndex,
                newIndex
            ] = [
                newIndex,
                oldIndex
            ];
        }
        this._application.fastdial.sendRequest("action", { type: "closePopups" });
        for (let i = oldIndex; i <= newIndex; i++) {
            let thumb = internalStructure.getItem(oldIndex);
            thumb.sync = thumb.sync || {};
            thumb.sync.id = this._application.sync.generateId();
            thumb.sync.instance = this._application.name;
            thumb.sync.timestamp = Math.round(Date.now() / 1000);
        }
        this._application.syncPinned.save();
    },
    get pinnedPositions() {
        let output = [];
        this._application.internalStructure.iterate({ pinned: true }, function (thumbData, index) {
            output.push(index);
        });
        return output;
    },
    _compactUnpinned: function (gapIndex) {
        let index = gapIndex;
        let compactedNum = 0;
        this._application.internalStructure.iterate({ pinned: false }, function (thumb, thumbIndex) {
            if (thumbIndex <= gapIndex) {
                return;
            }
            this._application.internalStructure.setItem(index, thumb);
            this._application.internalStructure.removeItem(thumbIndex);
            index = thumbIndex;
            compactedNum += 1;
        }, this);
        return compactedNum;
    },
    updateCurrentSet: function (removePositions, saveData) {
        this._logger.trace("Update current set with data: " + JSON.stringify([
            removePositions,
            saveData
        ]));
        let currentThumbsNum = this._application.internalStructure.length;
        let requestData = Object.create(null);
        removePositions.forEach(function (pos) {
            this._application.internalStructure.removeItem(pos);
            requestData[pos] = null;
        }, this);
        Object.keys(saveData).forEach(function (index) {
            let dbRecord = {
                url: saveData[index].url,
                title: saveData[index].title.trim() || null,
                syncId: saveData[index].id,
                syncInternalId: saveData[index].internalId,
                syncInstance: saveData[index].instance,
                syncTimestamp: saveData[index].timestamp,
                statParam: "userthumb",
                pinned: true
            };
            let thumb = this.createThumbFromDBRow(dbRecord);
            this._application.internalStructure.setItem(index, thumb);
            requestData[index] = thumb.frontendState;
            this.getMissingData(thumb, {
                force: true,
                syncOnly: true
            });
        }, this);
        this._application.fastdial.sendRequest("thumbChanged", requestData);
    },
    fastPickup: function Thumbs_fastPickup(unpinned) {
        let blockedDomains = [];
        this._application.internalStructure.iterate({ pinned: true }, function (thumbData, index) {
            try {
                let host = thumbData.host;
                blockedDomains.push(host);
                this._application.getHostAliases(host).forEach(function (alias) {
                    blockedDomains.push(alias);
                });
            } catch (ex) {
            }
        }, this);
        this._logger.trace("Blocked domains during fast pickup: " + JSON.stringify(blockedDomains));
        let emptyPositionIndex = 0;
        let setRecords = {};
        let structureNeedsChanges = false;
        let dropPositions = [];
        let unpinnedList = [];
        for (let [
                    index,
                    thumbData
                ] in Iterator(unpinned)) {
            try {
                let domain = thumbData.asciiHost;
                if (blockedDomains.indexOf(domain) !== -1) {
                    structureNeedsChanges = true;
                    dropPositions.push(index);
                    continue;
                }
            } catch (ex) {
            }
            unpinnedList.push({
                index: index,
                thumbData: thumbData
            });
        }
        unpinnedList.sort(function (a, b) {
            let aVisits = a.thumbData.visits;
            let bVisits = b.thumbData.visits;
            return bVisits - aVisits;
        });
        this._logger.trace("Unpinned list: " + JSON.stringify(unpinnedList));
        unpinnedList.forEach(function (unpinnedItem) {
            while (true) {
                let positionThumb = this._application.internalStructure.getItem(emptyPositionIndex);
                if (!positionThumb || !positionThumb.pinned) {
                    break;
                }
                emptyPositionIndex += 1;
            }
            setRecords[emptyPositionIndex] = unpinnedItem.thumbData;
            if (emptyPositionIndex != unpinnedItem.index) {
                dropPositions.push(unpinnedItem.index);
                structureNeedsChanges = true;
            }
            emptyPositionIndex += 1;
        }, this);
        this._logger.trace("Need to drop records from structure: " + structureNeedsChanges);
        if (!structureNeedsChanges) {
            return;
        }
        this._application.internalStructure.iterate({ pinned: false }, function (thumbData, index) {
            if (dropPositions.indexOf(index) !== -1) {
                this._application.internalStructure.removeItem(index);
            }
        }, this);
        this._logger.trace("Set records: " + JSON.stringify(setRecords));
        this._application.internalStructure.overwriteItems(setRecords);
    },
    createThumbFromDBRow: function (thumbData) {
        if (!thumbData.url) {
            return null;
        }
        return new Thumb(thumbData);
    },
    isIndexPage: function (uri) {
        let isIndexPage = true;
        if (thumbs._application.isYandexHost(uri.asciiHost)) {
            try {
                uri.QueryInterface(Ci.nsIURL);
            } catch (err) {
            }
            isIndexPage = !uri.filePath || uri.filePath === "/";
        } else {
            isIndexPage = uri.path === "/";
        }
        return isIndexPage;
    },
    createThumbFromFrontendData: function ({url, title}) {
        let uri = this._getURIFromRawURL(url);
        if (!uri) {
            return null;
        }
        if (this._application.isYandexURL(uri.spec)) {
            let parsedQuery = netutils.querystring.parse(uri.query || "");
            delete parsedQuery.nugt;
            uri.query = netutils.querystring.stringify(parsedQuery);
        }
        let dbRecord = {
            url: uri.spec,
            pinned: true,
            title: title || null,
            syncId: this._application.sync.generateId(),
            syncInternalId: this._application.sync.generateId(),
            syncInstance: this._application.name,
            syncTimestamp: Math.round(Date.now() / 1000),
            statParam: "userthumb"
        };
        this.logosProvider.requestData(uri.spec, { requestSource: true });
        return this.createThumbFromDBRow(dbRecord);
    },
    _sendThumbChangedEvent: function Thumbs__sendThumbChangedEvent({index, url}) {
        let eventThumbStructure = {};
        if (typeof index !== "undefined") {
            let thumb = this._application.internalStructure.getItem(index);
            eventThumbStructure[index] = thumb && thumb.frontendState || null;
        }
        if (typeof url !== "undefined") {
            this._application.internalStructure.iterate({ url: url }, (thumb, index) => {
                eventThumbStructure[index] = thumb.frontendState;
            });
        }
        if (Object.keys(eventThumbStructure).length) {
            this._application.fastdial.sendRequest("thumbChanged", eventThumbStructure);
        }
    },
    _getURIFromRawURL: function (url) {
        let originalURL = url;
        let uri;
        try {
            uri = netutils.newURI(url);
        } catch (ex) {
            if (!/^(ht|f)tps?:\/\//.test(url)) {
                url = "http://" + url;
            }
            try {
                uri = netutils.newURI(url);
            } catch (ex2) {
                this._logger.warn("Saved URL is not valid: " + originalURL);
            }
        }
        if (!uri) {
            return null;
        }
        try {
            uri = uri.QueryInterface(Ci.nsIURL);
            let host = uri.host;
        } catch (err) {
            if (/^\w+:\w+$/.test(uri.spec)) {
                uri = this._fixURI(uri);
            } else {
                uri = null;
            }
        }
        return uri;
    },
    _fixURI: function (uri) {
        let fixedURI = Object.create(uri);
        fixedURI.__defineGetter__("isInternalURL", () => true);
        fixedURI.__defineGetter__("sourceURI", () => uri);
        fixedURI.__defineGetter__("host", () => fixedURI.spec);
        fixedURI.__defineGetter__("asciiHost", () => fixedURI.host);
        fixedURI.__defineGetter__("clone", () => () => this._fixURI(uri.clone()));
        return fixedURI;
    },
    _application: null,
    _logger: null
};
let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
function registerThumb(thumb) {
    let uri = thumb.uri;
    let registeredThumbs = urlToThumbs[uri.spec] = urlToThumbs[uri.spec] || [];
    registeredThumbs.push(thumb);
    registeredThumbs = hostToThumbs[uri.host] = hostToThumbs[uri.host] || [];
    registeredThumbs.push(thumb);
}
function unregisterThumb(thumb) {
    let thumbs = urlToThumbs[thumb.url];
    let index = -1;
    if (thumbs) {
        index = thumbs.indexOf(thumb);
    }
    if (index !== -1) {
        thumbs.splice(index, 1);
    }
    thumbs = hostToThumbs[thumb.host];
    if (!thumbs) {
        index = -1;
    } else {
        index = thumbs.indexOf(thumb);
    }
    if (index !== -1) {
        thumbs.splice(index, 1);
    }
}
function Thumb(thumbData) {
    this._url = thumbData.url;
    this.pinned = Boolean(thumbData.pinned);
    this._title = thumbData.title;
    this._pickupInfo = { visits: thumbData.visits || thumbData.pickupInfo && thumbData.pickupInfo.visits || 0 };
    this._statParam = thumbData.statParam;
    this._sync = thumbData.sync || Object.create(null);
    this._statParam = thumbData.statParam;
    this._updateTimer = null;
    registerThumb(this);
    this._getMissingData();
}
Thumb.prototype = {
    constructor: Thumb,
    get isEmpty() {
        thumbs._logger.error(".isEmpty is deprecated");
        try {
            throw new Error();
        } catch (err) {
            thumbs._logger.error(err.stack);
        }
        return false;
    },
    get host() {
        if (this._host) {
            return this._host;
        }
        this._host = this._uri.host.replace(/^www\./, "") || this.url.replace(/^(ht|f)tps?:\/\//, "");
        return this._host;
    },
    get asciiHost() {
        return this._uri.asciiHost.replace(/^www\./, "");
    },
    get visible() {
        let index = this.index;
        if (index === -1) {
            return false;
        }
        let currentThumbsNum = thumbs._application.internalStructure.length;
        if (!currentThumbsNum) {
            return false;
        }
        if (index < currentThumbsNum) {
            return true;
        }
        return false;
    },
    _url: null,
    get url() {
        return this._uri.spec;
    },
    get visits() {
        return this._pickupInfo.visits;
    },
    get uri() {
        if (!this._uri) {
            this._uri = thumbs._getURIFromRawURL(this._url);
        }
        return this._uri.clone();
    },
    get thumb() {
        throw new Error(".thumb property is deprecated");
    },
    get index() {
        return thumbs._application.internalStructure.getThumbIndex(this);
    },
    get title() {
        return this._title;
    },
    set title(val) {
        if (typeof val !== "string" && val !== null) {
            throw new TypeError("Title of thumb should be string or null. Got " + val);
        }
        this._title = val;
        this.update();
    },
    get pinned() {
        return this._pinned;
    },
    set pinned(val) {
        if (typeof val !== "boolean") {
            throw new TypeError("Pinned prop of thumb should be typeof boolean. Got " + val);
        }
        this._pinned = val;
        this.update();
        thumbs._application.syncPinned.save();
    },
    get statParam() {
        return this._statParam || "userthumb";
    },
    set statParam(param) {
        this._statParam = param;
        this.update();
    },
    get internalState() {
        return {
            pinned: this.pinned,
            sync: this.sync,
            url: this.url,
            title: this.title,
            pickupInfo: this._pickupInfo,
            statParam: this.statParam
        };
    },
    get sync() {
        return this._sync;
    },
    set sync(val) {
        this._sync = val;
    },
    get screenshot() {
        return thumbs.screenshotsProvider.get("screenshot", { url: this.url }) || null;
    },
    get favicon() {
        return thumbs.faviconsProvider.get("favicon", { host: this.host }) || null;
    },
    get background() {
        let background = thumbs.logosProvider.get("logo", { host: this.host });
        if (background && background.logoMain && background.color) {
            return background;
        }
        return null;
    },
    get frontendState() {
        let app = thumbs._application;
        let currentThumbsNum = app.internalStructure.length;
        let output = Object.create(null);
        let uri = this.uri;
        output.url = uri.spec;
        output.pinned = false;
        output.isIndexPage = thumbs.isIndexPage(uri);
        let host = this.host;
        output.title = this.title || thumbs.titlesProvider.get("title", { url: uri.spec });
        let favicon = this.favicon;
        if (favicon) {
            output.favicon = favicon.url;
            if (favicon.color) {
                output.backgroundColor = favicon.color;
                output.fontColor = thumbs._application.colors.getFontColorByBackgroundColor(favicon.color);
            }
        }
        let background = this.background;
        if (background) {
            output.fontColor = thumbs._application.colors.getFontColorByBackgroundColor(background.color);
            output.backgroundColor = background.color;
            output.backgroundImage = output.isIndexPage ? background.logoMain : background.logoSub;
        }
        let screenshot = this.screenshot;
        if (screenshot && screenshot.canBeUsedWithThumb(output)) {
            output.screenshot = screenshot.getDataForThumb();
        }
        let ownTitle = this.title;
        if (ownTitle) {
            output.title = ownTitle;
        }
        output.pinned = this.pinned;
        output.statParam = this.statParam;
        return output;
    },
    _dataRequested: false,
    requestData: function (force = false) {
        if (this._dataRequested && !force) {
            return;
        }
        if (this.visible) {
            this._dataRequested = true;
            thumbs.screenshotsProvider.requestData(this.uri);
            thumbs.faviconsProvider.requestData({ host: this.host }, { force: force });
            thumbs.logosProvider.requestData({ host: this.host }, { force: force });
        }
    },
    update: function () {
        if (this._updateTimer) {
            this._updateTimer.cancel();
        }
        this._updateTimer = new sysutils.Timer(() => {
            if (!thumbs._application) {
                return;
            }
            if (!this.visible) {
                return;
            }
            this.requestData();
            thumbs._sendThumbChangedEvent({ url: this.url });
        }, 100);
    },
    toString: function () {
        return "[Thumb " + this.url + "]";
    },
    toJSON: function () {
        return this.toString();
    },
    destruct: function () {
        unregisterThumb(this);
    },
    _getMissingData: function () {
        if (this._title === null) {
            thumbs._application.fastdial.requestTitleForURL(this._url, (err, title) => {
                this.title = title || "";
            });
        }
    }
};
