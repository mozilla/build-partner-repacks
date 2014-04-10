"use strict";
var EXPORTED_SYMBOLS = ["SimpleHTMLParser"];
function SimpleHTMLParser() {
}
SimpleHTMLParser.prototype = {
    get contentHandler() this._contentHandler,
    set contentHandler(val) this._contentHandler = val,
    get currentPosition() this._currentPosition,
    parseFromString: function SimpleHTMLParser_parseFromString(htmlString) {
        if (!this._contentHandler)
            throw new Error("No content handler.");
        var treatAsChars = true;
        this._currentPosition = 0;
        this._totalLength = htmlString.length;
        if (!(this._stopped & this._CANCEL_FLAG) && "start" in this._contentHandler)
            this._contentHandler.start();
        while (!this._stopped && htmlString) {
            var specialTag = null;
            if (htmlString.substring(0, 4) === "<!--") {
                var index = htmlString.indexOf("-->");
                if (index !== -1) {
                    if ("comment" in this._contentHandler)
                        this._contentHandler.comment(htmlString.substring(4, index));
                    htmlString = htmlString.substring(index + 3);
                    treatAsChars = false;
                } else {
                    treatAsChars = true;
                }
            } else if (htmlString.substring(0, 2) === "</") {
                if (this._END_TAG_RE.test(htmlString)) {
                    htmlString = RegExp.rightContext;
                    RegExp.lastMatch.replace(this._END_TAG_RE, this._parseEndTag.bind(this));
                    treatAsChars = false;
                } else {
                    treatAsChars = true;
                }
            } else if (htmlString.charAt(0) === "<") {
                if (this._START_TAG_RE.test(htmlString)) {
                    htmlString = RegExp.rightContext;
                    var lm = RegExp.lastMatch;
                    specialTag = /^<(script|style)/i.test(lm) && RegExp.$1;
                    lm.replace(this._START_TAG_RE, this._parseStartTag.bind(this));
                    treatAsChars = false;
                } else {
                    treatAsChars = true;
                }
            }
            if (treatAsChars || specialTag) {
                var index = -1;
                if (specialTag) {
                    if (new RegExp("</" + specialTag + ">", "im").test(htmlString))
                        index = RegExp.leftContext.length;
                } else {
                    index = htmlString.indexOf("<");
                }
                if (index === -1)
                    index = htmlString.length;
                if ("characters" in this._contentHandler)
                    this._contentHandler.characters(htmlString.substring(0, index));
                htmlString = htmlString.substring(index);
            }
            treatAsChars = true;
            var currentPosition = this._totalLength - htmlString.length;
            if (this._currentPosition === currentPosition)
                throw "Parse Error: " + htmlString.substring(0, 100);
            this._currentPosition = currentPosition;
        }
        if (!(this._stopped & this._CANCEL_FLAG) && "end" in this._contentHandler)
            this._contentHandler.end();
    },
    tryParseFromString: function SimpleHTMLParser_tryParseFromString(htmlString) {
        try {
            this.parseFromString(htmlString);
        } catch (e) {
        }
    },
    stop: function SimpleHTMLParser_stop() {
        this._stopped |= this.STOP_FLAG;
    },
    cancel: function SimpleHTMLParser_cancel() {
        this._stopped |= this.CANCEL_FLAG;
    },
    get stopped() this._stopped & this._STOP_FLAG,
    get canceled() this._stopped & this._CANCEL_FLAG,
    _parseStartTag: function SimpleHTMLParser__parseStartTag(tag, tagName, rest) {
        var attrs = this._parseAttributes(tagName, rest);
        this._contentHandler.startElement(tagName, attrs);
    },
    _parseEndTag: function SimpleHTMLParser__parseEndTag(tag, tagName) {
        this._contentHandler.endElement(tagName);
    },
    _parseAttributes: function SimpleHTMLParser__parseAttributes(tagName, rest) {
        var attrs = [];
        rest.replace(this._ATTR_RE, function (match, name) {
            var value = arguments[2] || arguments[3] || arguments[4] || (this._FILL_ATTRS[name] ? name : "");
            attrs.push({
                name: name,
                value: value
            });
        }.bind(this));
        return attrs;
    },
    _START_TAG_RE: /^<([^>\s\/]+)((\s+[^=>\s]+(\s*=\s*((\"[^"]*\")|(\'[^']*\')|[^>\s]+))?)*)\s*\/?\s*>/m,
    _END_TAG_RE: /^<\/([^>\s]+)[^>]*>/m,
    _ATTR_RE: /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/gm,
    _FILL_ATTRS: "checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected".split(","),
    _contentHandler: null,
    _totalLength: 0,
    _currentPosition: 0,
    _stopped: 0,
    _STOP_FLAG: 1,
    _CANCEL_FLAG: 2
};
