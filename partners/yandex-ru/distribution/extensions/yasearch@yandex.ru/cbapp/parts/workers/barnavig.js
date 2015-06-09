"use strict";
var checkSum = {
    MAX_DOCUMENT_SIZE: 512 * 1024 - 1,
    calculate: function checkSum_calculate(htmlSource) {
        if (!htmlSource) {
            return null;
        }
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
                if (p1[i + 1] && (p1[i + 1] == "'" || p1[i] == "\"")) {
                    ch = p1[++i];
                }
                buf += ch;
                continue;
            }
            if ((p1[i] == "'" || p1[i] == "\"") && !startSym) {
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
        return Object.keys(dict).sort().map(key => key + dict[key]).join("");
    }
};
this.onmessage = function onmessage(event) {
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
    default:
        throw new Error("Wrong message type ('" + type + "')");
    }
};
