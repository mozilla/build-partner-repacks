var stemmer;
var searchDictionary = {
        getWordPosition: function searchDictionary_getWordPosition(word) {
            var position = this._dictionaryHash[word];
            return position >= 0 ? position : null;
        },
        get version() this._version,
        get dictionaryHash() this._dictionaryHash,
        set dictionaryHash(val) {
            var dictionaryHash = Object.create(null);
            var version = 0;
            if (val) {
                var lines = val.split(/[\r\n]+/);
                version = lines.shift();
                lines.forEach(function (line, index) dictionaryHash[line] = index);
            }
            this._dictionaryHash = dictionaryHash;
            this._version = version;
        },
        _dictionaryHash: Object.create(null),
        _version: 0
    };
function ContentHandler() {
    this.result = "";
    this._statHash = Object.create(null);
    this._positionsCounter = 0;
    this._ignoreText = true;
    this._startTime = Date.now();
}
ContentHandler.prototype = {
    startElement: function ContentHandler_startElement(tagName, attrs) {
        if (this._checkTimeLimit())
            return;
        switch (tagName.toLowerCase()) {
        case "script":
        case "style":
            this._ignoreText = true;
            break;
        case "body":
            this._ignoreText = false;
            break;
        }
    },
    endElement: function ContentHandler_endElement(tagName) {
        if (this._checkTimeLimit())
            return;
        switch (tagName.toLowerCase()) {
        case "script":
        case "style":
            if (this._ignoreText)
                this._ignoreText = false;
            break;
        case "body":
            this._htmlParser.cancel();
            break;
        }
    },
    characters: function ContentHandler_characters(text) {
        if (this._checkTimeLimit())
            return;
        if (this._ignoreText)
            return;
        text.toLowerCase().replace(/[\u0430-\u044f\u0451\-]{3,}/gm, function (word) {
            if (this._checkTimeLimit())
                return;
            var stemmedWord = stemmer.stem(word);
            if (!stemmedWord)
                return;
            if (!(stemmedWord in this._statHash)) {
                var indexInDictionary = searchDictionary.getWordPosition(stemmedWord);
                if (indexInDictionary === null)
                    return;
                this._statHash[stemmedWord] = {
                    indexInDictionary: indexInDictionary,
                    positions: []
                };
            }
            this._statHash[stemmedWord].positions.push(this._positionsCounter++);
        }.bind(this));
    },
    end: function ContentHandler_end() {
        if (this._htmlParser.canceled)
            return;
        var stat = [];
        for (var [
                    k,
                    v
                ] in Iterator(this._statHash))
            stat.push(v);
        stat = stat.sort(function (a, b) b.positions.length - a.positions.length).map(function (v) {
            return [
                v.indexInDictionary,
                v.positions.join(this.POSITION_DELIMITER)
            ].join(this.WORD_DELIMITER);
        }.bind(this)).join(this.STATISTIC_DELIMITER);
        if (!stat.length)
            return;
        stat = searchDictionary.version + this.VERSION_DELIMITER + stat;
        if (stat.length > this.MAX_RESULT_STRING_LENGTH) {
            stat = stat.substring(0, this.MAX_RESULT_STRING_LENGTH);
            var lastDelimiterIndex = stat.lastIndexOf(this.STATISTIC_DELIMITER);
            if (lastDelimiterIndex === -1)
                lastDelimiterIndex = stat.lastIndexOf(this.POSITION_DELIMITER);
            if (lastDelimiterIndex !== -1)
                stat = stat.substring(0, lastDelimiterIndex);
        }
        this.result = stat;
    },
    get htmlParser() this._htmlParser,
    set htmlParser(val) this._htmlParser = val,
    _checkTimeLimit: function ContentHandler__checkTimeLimit() {
        if (Date.now() - this._startTime < this.MAX_PARSE_TIME)
            return false;
        this._htmlParser.cancel();
        return true;
    },
    VERSION_DELIMITER: "/",
    STATISTIC_DELIMITER: ";",
    WORD_DELIMITER: ":",
    POSITION_DELIMITER: ",",
    MAX_RESULT_STRING_LENGTH: 3000,
    MAX_PARSE_TIME: 10000
};
var checkSum = {
        MAX_DOCUMENT_SIZE: 512 * 1024 - 1,
        calculate: function checkSum_calculate(htmlSource) {
            if (!htmlSource)
                return null;
            return htmlSource.substr(0, this.MAX_DOCUMENT_SIZE).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "").replace(/<(?:a|meta)([^>]*)>/gi, this._parseAttributes).replace(/<\/?[^>]*>/gi, "").replace(/\s|\d/g, "");
        },
        _parseAttributes: function checkSum__parseAttributes(match, p1, offset, string) {
            var result = "";
            var buf = "";
            var i = -1;
            var dict = Object.create(null);
            var startSym = null;
            var lastKey = null;
            while (p1[++i]) {
                if (p1[i].search(/\s/) > -1) {
                    if (!startSym) {
                        if (buf.length > 0) {
                            dict[buf] = "";
                            buf = "";
                        }
                        if (lastKey) {
                            dict[lastKey] = "";
                            lastKey = null;
                        }
                        continue;
                    }
                }
                if (p1[i] == "=") {
                    if (!startSym) {
                        if (buf.length > 0) {
                            lastKey = buf;
                            buf = "";
                            continue;
                        }
                    }
                }
                if (p1[i] == "\\") {
                    var ch = p1[i];
                    if (p1[i + 1] && (p1[i + 1] == "\"" || p1[i] == "'")) {
                        ch = p1[++i];
                    }
                    buf += ch;
                    continue;
                }
                if ((p1[i] == "\"" || p1[i] == "'") && !startSym) {
                    startSym = p1[i];
                    continue;
                }
                if (startSym && p1[i] == startSym) {
                    if (lastKey) {
                        dict[lastKey] = buf;
                        lastKey = null;
                    }
                    buf = "";
                    startSym = null;
                    continue;
                }
                buf += p1[i];
            }
            if (lastKey) {
                dict[lastKey] = buf;
                lastKey = null;
            }
            return Object.keys(dict).sort().map(function (key) key + dict[key]).join("");
        }
    };
onmessage = function onmessage(event) {
    var type = event.data.type;
    var data = event.data.data;
    var taskId = event.data.taskId;
    switch (type) {
    case "calculateCheckSum":
        postMessage({
            type: type,
            data: checkSum.calculate(data),
            taskId: taskId
        });
        break;
    case "calculateSearchPersonalization": {
            var htmlParser = new SimpleHTMLParser();
            var contentHandler = new ContentHandler();
            contentHandler.htmlParser = htmlParser;
            htmlParser.contentHandler = contentHandler;
            htmlParser.tryParseFromString(data);
            contentHandler.htmlParser = null;
            htmlParser.contentHandler = null;
            postMessage({
                type: type,
                data: contentHandler.result,
                taskId: taskId
            });
            break;
        }
    case "setModulesPath": {
            importScripts(data + "SimpleHTMLParser.jsm");
            importScripts(data + "Stemmer.jsm");
            stemmer = new Stemmer("russian");
            break;
        }
    case "setSearchDictionary":
        searchDictionary.dictionaryHash = data;
        break;
    default:
        throw new Error("Wrong message type ('" + type + "')");
        break;
    }
};
