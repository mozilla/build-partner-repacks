"use strict";
var filtersJSON = {
    white: [],
    black: []
};
var cachedResults = Object.create(null);
function clearCachedResults() {
    cachedResults = Object.create(null);
}
function checkURL(url) {
    if (url in cachedResults)
        return cachedResults[url];
    var result = [
        null,
        null
    ];
    var blackList = filtersJSON.black;
    for (var i = 0, length = blackList.length; i < length; i++) {
        var el = blackList[i];
        if (el.r.test(url)) {
            result = [
                true,
                el.uri
            ];
            break;
        }
    }
    if (result[0] !== true) {
        return cachedResults[url] = result;
    }
    var whiteList = filtersJSON.white;
    for (var i = 0, length = whiteList.length; i < length; i++) {
        var el = whiteList[i];
        if (el.r.test(url)) {
            result = [
                false,
                null
            ];
            break;
        }
    }
    return cachedResults[url] = result;
}
function setFilters(json) {
    filtersJSON = json;
    [
        "white",
        "black"
    ].forEach(function (key) {
        var filteredRegexpList = filtersJSON[key].filter(function (regexpItem, index) {
            try {
                regexpItem.r = new RegExp(regexpItem.re, "i");
            } catch (e) {
                if (typeof VALIDATION != "undefined" && VALIDATION === true && incorrectRegexpList) {
                    incorrectRegexpList.push({
                        line: index,
                        regexp: regexpItem.re,
                        cause: e.message
                    });
                }
                return false;
            }
            return true;
        });
        filtersJSON[key] = filteredRegexpList;
    });
}
if (typeof VALIDATION == "undefined" || VALIDATION !== true) {
    setInterval(function () {
        clearCachedResults();
    }, 60 * 60 * 1000);
    onmessage = function onmessage(event) {
        var name = event.data.name;
        var data = event.data.data;
        switch (name) {
        case "setFilters":
            setFilters(data);
            clearCachedResults();
            break;
        case "checkURL": {
                var [
                    block,
                    redirectURL
                ] = checkURL(data);
                postMessage({
                    name: name,
                    data: {
                        url: data,
                        block: block,
                        redirectURL: redirectURL
                    }
                });
                break;
            }
        default:
            throw new Error("Unexpected name ('" + name + "')");
        }
    };
}
