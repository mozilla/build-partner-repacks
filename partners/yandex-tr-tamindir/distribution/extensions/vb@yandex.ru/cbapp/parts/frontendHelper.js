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
    get mute() {
        return this._muteMessages;
    },
    set mute(value) {
        this._muteMessages = value;
    },
    getDataForThumb: function InternalStructure_getFrontendDataForThumb(thumbData) {
        if (this._muteMessages) {
            return {};
        }
        let output = { pinned: thumbData.pinned || false };
        if (!thumbData.location) {
            return output;
        }
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
        if (thumbData.favicon) {
            let favicon = thumbData.favicon;
            output.favicon = favicon.url;
            if (favicon.color) {
                output.backgroundColor = favicon.color;
                output.fontColor = this._application.colors.getFontColorByBackgroundColor(favicon.color);
            }
        }
        if (thumbData.background && thumbData.background.url) {
            output.fontColor = this._application.colors.getFontColorByBackgroundColor(thumbData.background.color);
            output.backgroundColor = thumbData.background.color;
            output.backgroundImage = thumbData.background.url;
        }
        if (thumbData.screenshot && this._application.screenshots.useScreenshot(thumbData)) {
            output.screenshot = this._application.screenshots.createScreenshotInstance(thumbData.source).getDataForThumb();
        }
        output.statParam = thumbData.thumb.statParam;
        return output;
    },
    getDataForIndex: function FrontendHelper_getFrontendDataForIndex(index) {
        let currentThumbsNum = this._application.layout.getThumbsNum();
        let emptyLastThumb = this._application.preferences.get("ftabs.emptyLastThumb", false);
        if (this._muteMessages) {
            return {};
        }
        if (emptyLastThumb && index == currentThumbsNum - 1) {
            return { pinned: true };
        }
        let thumbData = this._application.internalStructure.getItem(index);
        if (!thumbData) {
            return {};
        }
        return this.getDataForThumb(thumbData);
    },
    get fullStructure() {
        let currentThumbsNum = this._application.layout.getThumbsNum();
        let output = {};
        for (let i = 0; i < currentThumbsNum; i++) {
            output[i] = this.getDataForIndex(i);
        }
        return output;
    },
    _application: null,
    _logger: null,
    _muteMessages: true
};
