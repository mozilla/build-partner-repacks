'use strict';
const EXPORTED_SYMBOLS = ['internalStructure'];
const GLOBAL = this;
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
Cu.import('resource://gre/modules/PlacesUtils.jsm');
Cu.import('resource://gre/modules/Services.jsm');
var thumbs = Object.create(null);
const internalStructure = {
        init: function InternalStructure_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger('InternalStructure');
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
                        if (thumbData.location.asciiHost !== aData.domain)
                            return;
                        let cloudData = sysutils.copyObj(aData);
                        delete cloudData.domain;
                        this.setItem(index, { cloud: cloudData });
                        let requestData = {};
                        requestData[index] = this._application.frontendHelper.getDataForIndex(index);
                        this._application.fastdial.sendRequest('thumbChanged', requestData);
                    } catch (ex) {
                    }
                }, this);
                break;
            }
        },
        setItem: function InternalStructure_setItem(index, value) {
            if (arguments.length === 1) {
                for (let [
                            index,
                            value
                        ] in Iterator(arguments[0])) {
                    this.overwriteItem(index, value);
                }
            } else {
                if (!value)
                    return;
                thumbs[index] = thumbs[index] || {};
                sysutils.copyProperties(value, thumbs[index]);
                this._application.backup.syncThumbs();
            }
        },
        overwriteItem: function InternalStructure_overwriteItem(index, value) {
            if (arguments.length === 1) {
                for (let [
                            index,
                            value
                        ] in Iterator(arguments[0])) {
                    this.overwriteItem(index, value);
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
            delete thumbs[index];
            this._application.backup.syncThumbs();
        },
        clear: function InternalStructure_clear() {
            thumbs = Object.create(null);
            this._application.backup.syncThumbs();
        },
        iterate: function InternalStructure_iterate(options, callback, ctx) {
            options = options || {};
            var currentThumbsNum = this._application.layout.getThumbsNum();
            for (let [
                        index,
                        thumbData
                    ] in Iterator(thumbs)) {
                if (options.visible && index >= currentThumbsNum)
                    continue;
                if (options.nonempty && (!thumbData || !thumbData.source))
                    continue;
                if (options.pinned && (!thumbData || !thumbData.pinned))
                    continue;
                callback.call(ctx, thumbData, index);
            }
        },
        convertDbRow: function InternalStructure_convertDbRow(thumbData, pinned) {
            var output = { pinned: Boolean(pinned) };
            if (thumbData) {
                let locationObj = this._application.fastdial.getDecodedLocation(thumbData.url);
                sysutils.copyProperties(locationObj, output);
                output.thumb = {};
                output.sync = {};
                [
                    'title',
                    'backgroundColor',
                    'favicon',
                    'visits'
                ].forEach(function (fieldName) {
                    if (thumbData[fieldName]) {
                        output.thumb[fieldName] = thumbData[fieldName];
                    }
                });
                let host = locationObj.location ? locationObj.location.asciiHost : null;
                output.cloud = host ? this._application.cloudSource.getCachedExistingData(host) : {};
                [
                    'Id',
                    'Instance',
                    'Timestamp',
                    'InternalId'
                ].forEach(function (fieldName) {
                    var dbField = 'sync' + fieldName;
                    var syncKey = fieldName[0].toLowerCase() + fieldName.substr(1);
                    if (thumbData[dbField]) {
                        output.sync[syncKey] = thumbData[dbField];
                    }
                });
            }
            return output;
        },
        get length() {
            return Object.keys(thumbs).length;
        },
        _application: null,
        _logger: null
    };
