"use strict";
var EXPORTED_SYMBOLS = ["module"];
var HTTPRequest = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"];
function module(proxy) {
    var utils = {
        getRandomString: function (length) {
            var code;
            var result = Array(length);
            for (var i = 0; i < length; ++i) {
                code = 48 + Math.floor(Math.random() * 62);
                if (code > 57)
                    code += 7;
                if (code > 90)
                    code += 6;
                result[i] = String.fromCharCode(code);
            }
            return result.join("");
        },
        statLog: function (type) {
            var url = "http://clck.yandex.ru/click" + "/dtype=stred" + "/pid=12" + "/cid=72359" + "/path=fx.hotmail." + type + "/*";
            var req = HTTPRequest.createInstance();
            req.open("GET", url, true);
            req.send();
        }
    };
    return utils;
}
