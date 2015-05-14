"use strict";
const EXPORTED_SYMBOLS = ["internalStructure"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
let thumbs = Object.create(null);
const internalStructure = {
    init: function InternalStructure_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("InternalStructure");
        Services.obs.addObserver(this, this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT, false);
    },
    finalize: function InternalStructure_finalize(doCleanup, callback) {
        Services.obs.removeObserver(this, this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT);
        this._application = null;
        this._logger = null;
    },
    observe: function InternalStructure_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT:
            aData = JSON.parse(aData);
            this.iterate({ nonempty: true }, function (thumbData, index) {
                try {
                    if (thumbData.location.asciiHost !== aData.domain) {
                        return;
                    }
                    let cloudData = sysutils.copyObj(aData);
                    delete cloudData.domain;
                    this.setItem(index, { background: cloudData });
                    let requestData = {};
                    requestData[index] = this._application.frontendHelper.getDataForIndex(index);
                    this._application.fastdial.sendRequest("thumbChanged", requestData);
                } catch (ex) {
                }
            }, this);
            break;
        }
    },
    setItem: function InternalStructure_setItem(index, value) {
        if (arguments.length === 1) {
            for (let [
                        _index,
                        _value
                    ] in Iterator(arguments[0])) {
                this.overwriteItem(_index, _value);
            }
        } else {
            if (!value) {
                return;
            }
            thumbs[index] = thumbs[index] || {};
            sysutils.copyProperties(value, thumbs[index]);
            this._application.backup.syncThumbs();
        }
    },
    overwriteItem: function InternalStructure_overwriteItem(index, value) {
        if (arguments.length === 1) {
            for (let [
                        _index,
                        _value
                    ] in Iterator(arguments[0])) {
                this.overwriteItem(_index, _value);
            }
        } else {
            thumbs[index] = value;
            this._application.backup.syncThumbs();
        }
    },
    getItem: function InternalStructure_getItem(index) {
        return thumbs[index];
    },
    removeItem: function InternalStructure_removeItem(index) {
        this.overwriteItem(index, { pinned: true });
        this._application.backup.syncThumbs();
    },
    clear: function InternalStructure_clear() {
        thumbs = Object.create(null);
        this._application.backup.syncThumbs();
    },
    iterate: function InternalStructure_iterate(options, callback, ctx) {
        options = options || {};
        let currentThumbsNum = this._application.layout.getThumbsNum();
        for (let [
                    index,
                    thumbData
                ] in Iterator(thumbs)) {
            if (options.visible && index >= currentThumbsNum) {
                continue;
            }
            if (options.nonempty && (!thumbData || !thumbData.source)) {
                continue;
            }
            if (options.pinned && (!thumbData || !thumbData.pinned)) {
                continue;
            }
            callback.call(ctx, thumbData, index);
        }
    },
    convertDbRow: function InternalStructure_convertDbRow(thumbData, pinned) {
        let output = { pinned: Boolean(pinned) };
        if (thumbData) {
            let locationObj = this._application.fastdial.getDecodedLocation(thumbData.url);
            sysutils.copyProperties(locationObj, output);
            output.thumb = {};
            output.sync = {};
            [
                "title",
                "visits",
                "statParam"
            ].forEach(function (fieldName) {
                if (fieldName in thumbData) {
                    output.thumb[fieldName] = thumbData[fieldName];
                }
            });
            if (thumbData.favicon) {
                output.favicon = {
                    url: thumbData.favicon,
                    color: thumbData.backgroundColor
                };
            } else {
                output.favicon = null;
            }
            let screenshot = this._application.screenshots.createScreenshotInstance(thumbData.url);
            if (screenshot.nonZeroFileAvailable) {
                screenshot.color = thumbData.screenshotColor;
                output.screenshot = screenshot.getDataForThumb();
            }
            let host = locationObj.location ? locationObj.location.asciiHost : null;
            if (host) {
                host = host.replace(/^www\./, "");
                output.background = this._application.cloudSource.getLogoForHost(host);
            }
            [
                "Id",
                "Instance",
                "Timestamp",
                "InternalId"
            ].forEach(function (fieldName) {
                let dbField = "sync" + fieldName;
                let syncKey = fieldName[0].toLowerCase() + fieldName.substr(1);
                if (thumbData[dbField]) {
                    output.sync[syncKey] = thumbData[dbField];
                }
            });
        }
        return output;
    },
    get fullStructure() {
        return thumbs;
    },
    get length() {
        return Object.keys(thumbs).length;
    },
    _application: null,
    _logger: null
};