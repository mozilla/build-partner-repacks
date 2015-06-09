"use strict";
const EXPORTED_SYMBOLS = ["frontendHelper"];
const GLOBAL = this;
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const frontendHelper = {
    init: function FrontendHelper_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        this._application = application;
        this._logger = application.getLogger("Frontend");
    },
    finalize: function FrontendHelper_finalize(doCleanup, callback) {
        this._application = null;
        this._logger = null;
    },
    logMessage: function FrontendHelper_logMessage(level, msg, url, line, trace) {
        if ([
                "info",
                "error",
                "warn"
            ].indexOf(level) === -1) {
            throw new Error("Unknown debug level: " + level);
        }
        msg = strutils.formatString("%1 on line %2 in %3 (%4)", [
            msg,
            line || 0,
            url || "<unknown>",
            trace || "no trace"
        ]);
        this._logger[level](msg);
    },
    getDataForThumb: function InternalStructure_getFrontendDataForThumb(thumbData) {
        return thumbData.frontendState;
    },
    _getDatForIndex: function FrontendHelper__getFrontendDataForIndex(index) {
        let thumbData = this._application.internalStructure.getItem(index);
        if (!thumbData) {
            return null;
        }
        return this.getDataForThumb(thumbData);
    },
    get fullStructure() {
        let currentThumbsNum = this._application.internalStructure.length;
        let output = {};
        for (let i = 0; i < currentThumbsNum; i++) {
            output[i] = this._getDatForIndex(i);
        }
        return output;
    },
    _application: null,
    _logger: null
};
