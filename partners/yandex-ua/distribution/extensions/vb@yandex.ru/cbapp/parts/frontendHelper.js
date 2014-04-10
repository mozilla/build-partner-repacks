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
                ].indexOf(level) === -1)
                throw new Error("Unknown debug level: " + level);
            var msg = strutils.formatString("%1 on line %2 in %3 (%4)", [
                    msg,
                    line || 0,
                    url || "<unknown>",
                    trace || "no trace"
                ]);
            this._logger[level](msg);
        },
        set mute(value) {
            this._muteMessages = value;
            return value;
        },
        getDataForThumb: function InternalStructure_getFrontendDataForThumb(thumbData) {
            if (this._muteMessages)
                return {};
            var output = { pinned: thumbData.pinned || false };
            if (!thumbData.location)
                return output;
            output.url = thumbData.source;
            output.title = thumbData.thumb && thumbData.thumb.title || "";
            output.isIndexPage = true;
            try {
                if (this._application.isYandexHost(thumbData.location.asciiHost)) {
                    thumbData.location.QueryInterface(Ci.nsIURL);
                    output.isIndexPage = thumbData.location.filePath === "/";
                } else {
                    output.isIndexPage = thumbData.location.path === "/";
                }
            } catch (ex) {
            }
            if (thumbData.thumb && thumbData.thumb.favicon) {
                output.favicon = thumbData.thumb.favicon;
                output.backgroundColor = thumbData.thumb.backgroundColor;
                output.fontColor = this._application.colors.getFontColorByBackgroundColor(thumbData.thumb.backgroundColor);
            }
            if (thumbData.cloud && thumbData.cloud.backgroundImage) {
                output.backgroundImage = thumbData.cloud.backgroundImage;
                output.backgroundColor = thumbData.cloud.backgroundColor;
                output.fontColor = this._application.colors.getFontColorByBackgroundColor(thumbData.cloud.backgroundColor);
            }
            return output;
        },
        getDataForIndex: function InternalStructure_getFrontendDataForIndex(index) {
            var currentThumbsNum = this._application.layout.getThumbsNum();
            var emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
            if (this._muteMessages)
                return {};
            if (emptyLastThumb && index == currentThumbsNum - 1)
                return { pinned: true };
            var thumbData = this._application.internalStructure.getItem(index);
            if (!thumbData)
                return {};
            return this.getDataForThumb(thumbData);
        },
        get fullStructure() {
            var currentThumbsNum = this._application.layout.getThumbsNum();
            var output = {};
            let (i = 0) {
                for (; i < currentThumbsNum; i++)
                    output[i] = this.getDataForIndex(i);
            }
            return output;
        },
        _application: null,
        _logger: null,
        _muteMessages: true
    };
