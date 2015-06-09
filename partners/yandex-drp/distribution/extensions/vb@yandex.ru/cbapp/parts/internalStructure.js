"use strict";
const EXPORTED_SYMBOLS = ["internalStructure"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
let thumbs = Object.create(null);
const internalStructure = {
    init: function InternalStructure_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("InternalStructure");
        this.loadData();
    },
    finalize: function InternalStructure_finalize(doCleanup, callback) {
        this.saveData({ force: true });
        this._application = null;
        this._logger = null;
    },
    loadData: function InternalStructure_load(rawStructure) {
        this.overwriteWithRawStructure(rawStructure);
    },
    saveData: function InternalStructure_save(save, options = {}) {
        save(this.fullStructure, options, data => {
            this._application.cookieBackup.save();
        });
    },
    overwriteWithRawStructure: function InternalStructure_overwriteWithRawStructure(rawStructure) {
        if (!rawStructure) {
            return;
        }
        let structure = {};
        for (let [
                    index,
                    rawThumb
                ] in Iterator(rawStructure)) {
            structure[index] = this._application.thumbs.createThumbFromDBRow(rawThumb);
        }
        Object.keys(thumbs => index => {
            if (thumbs[index]) {
                thumbs[index].destruct();
            }
        });
        thumbs = Object.create(null);
        this.overwriteItems(structure);
    },
    _onUpdated: function InternalStructure__onUpdated(index) {
        let thumb = this.getItem(index);
        if (thumb) {
            thumb.update();
        } else if (index === -1) {
            this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
        } else {
            let eventThumbStructure = {};
            eventThumbStructure[index] = null;
            this._application.fastdial.sendRequest("thumbChanged", eventThumbStructure);
        }
        this.saveData();
    },
    setItem: function InternalStructure_setItem(index, value) {
        this._setItem(index, value);
        this._onUpdated(index);
    },
    overwriteItems: function InternalStructure_overwriteItems(items) {
        let removed = [];
        for (let [
                    index,
                    thumb
                ] in Iterator(thumbs)) {
            if (!(index in items)) {
                removed.push(index);
            }
        }
        for (let [
                    index,
                    thumb
                ] in Iterator(items)) {
            this._setItem(index, thumb);
        }
        let eventData = {};
        if (removed.length !== 0) {
            removed.forEach(index => {
                if (index in thumbs) {
                    return;
                }
                this._setItem(index, null);
                eventData[index] = null;
            });
            this._application.fastdial.sendRequest("thumbChanged", eventData);
        }
        this._onUpdated(-1);
        this.saveData({ timeout: 5000 });
    },
    _setItem: function InternalStructure__setItem(index, thumb) {
        if (thumbs[index]) {
            thumbs[index].destruct();
        }
        if (thumb === null || thumb === undefined) {
            this._checkEmptySpaces();
            delete thumbs[index];
        } else {
            thumbs[index] = thumb;
            this._checkEmptySpaces();
            thumb.update();
        }
    },
    getItem: function InternalStructure_getItem(index) {
        return thumbs[index] || null;
    },
    getThumbIndex: function InternalStructure_getThumbIndex(searchingThumb) {
        for (let [
                    index,
                    thumb
                ] in Iterator(thumbs)) {
            if (thumb === searchingThumb) {
                return index;
            }
        }
        return -1;
    },
    removeItem: function InternalStructure_removeItem(index, withShift) {
        let thumb = thumbs[index];
        if (thumb) {
            thumb.destruct();
        }
        if (index === this.length - 1) {
            withShift = false;
        }
        if (withShift === false) {
            this.setItem(index, null);
            this._checkEmptySpaces();
            this._onUpdated(index);
            return;
        }
        if (withShift === true) {
            this._compactThumbs(index, this.length, true);
            this._checkEmptySpaces();
            this._onUpdated(this.length);
            return;
        }
        try {
            throw new Error("removeItem needs second argument");
        } catch (err) {
            this._logger.error(err.message);
            this._logger.error(err.stack);
        }
    },
    _checkEmptySpaces: function InternalStructure__checkEmptySpaces() {
        let lastIndex = Math.max.apply(Math, Object.keys(thumbs).map(index => parseInt(index, 10)));
        let findNextAvailableValue = index => {
            let thumb;
            let next = index;
            let i = 0;
            do {
                next++;
                i++;
            } while (!(thumb = thumbs[next]) && i <= lastIndex);
            if (!thumb) {
                return -1;
            }
            return next;
        };
        for (let index = 0; index < lastIndex; index++) {
            if (thumbs[index]) {
                continue;
            }
            let nextAvailableValueIndex = findNextAvailableValue(index);
            if (nextAvailableValueIndex === -1) {
                delete thumbs[index];
                continue;
            }
            thumbs[index] = thumbs[nextAvailableValueIndex];
            delete thumbs[nextAvailableValueIndex];
        }
    },
    _compactThumbs: function InternalStructure__compactThumbs(startIndex, finishIndex, fromRemove) {
        let i = startIndex;
        let fromLeftToRight = startIndex < finishIndex;
        let indexesToUpdate = [];
        while (i !== finishIndex) {
            indexesToUpdate.push(i);
            let nextThumb = thumbs[i + (fromLeftToRight ? 1 : -1)];
            thumbs[i] = nextThumb;
            if (fromLeftToRight) {
                i++;
            } else {
                i--;
            }
        }
        if (fromRemove) {
            delete thumbs[i - 1];
        } else {
            delete thumbs[i];
        }
        indexesToUpdate.forEach(index => this._onUpdated(index));
    },
    swap: function InternalStructure_swap(startIndex, endIndex) {
        let draggingThumb = this.getItem(startIndex);
        this._compactThumbs(startIndex, endIndex);
        this.setItem(endIndex, draggingThumb);
    },
    iterate: function InternalStructure_iterate(options, callback, ctx) {
        if (typeof options === "function") {
            let args = [].slice.call(arguments);
            args.unshift(null);
            this.iterate.apply(this, args);
            return;
        }
        options = options || {};
        for (let [
                    index,
                    thumb
                ] in Iterator(thumbs)) {
            if ("pinned" in options && thumb.pinned !== options.pinned) {
                continue;
            }
            if (options.url && thumb.url !== options.url) {
                continue;
            }
            callback.call(ctx, thumb, index);
        }
    },
    get fullStructure() {
        let res = Object.create(null);
        for (let [
                    index,
                    thumb
                ] in Iterator(thumbs)) {
            res[index] = thumb.internalState;
        }
        return res;
    },
    get fullDebugStructure() {
        return {
            internalState: this.thumbs,
            pickupState: this.fullStructure,
            frontendState: this._application.frontendHelper.fullStructure
        };
    },
    hasURL: function (url) {
        let urlForCompare = url => {
            return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/(\/?[?&]clid=[^&]+)/, "").replace(/\/$/, "");
        };
        url = urlForCompare(url);
        return Object.keys(thumbs).some(key => {
            return urlForCompare(thumbs[key].url) === url;
        });
    },
    get thumbs() {
        return thumbs;
    },
    get length() {
        return Object.keys(thumbs).length;
    },
    _application: null,
    _logger: null
};
