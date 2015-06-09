"use strict";
function parseURL(url) {
    var pattern = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
    var matches = url.match(pattern);
    if (!matches || !matches[4]) {
        throw new TypeError("Not an url: " + url.slice(0, 100));
    }
    return {
        scheme: matches[2],
        host: matches[4],
        path: matches[5],
        query: matches[7],
        fragment: matches[9]
    };
}
function cutFromParam(url) {
    var parsed = parseURL(url);
    var query = parseQuery(parsed.query || "");
    if (query.from && query.from === fromParam) {
        delete query.from;
        parsed.query = formatQuery(query);
        return formatURL(parsed);
    }
    return url;
}
function getHost(url) {
    var host = null;
    try {
        host = parseURL(url).host;
    } catch (err) {
    }
    if (host) {
        host = host.replace(/www\./, "");
    }
    return host;
}
function formatURL({scheme, host, path, query}) {
    return (scheme || "http") + "://" + host + (path || "/") + (query ? "?" + query : "");
}
function parseQuery(queryString) {
    if (!queryString || typeof queryString !== "string") {
        return {};
    }
    return queryString.replace(/^\?/, "").split("&").map(couple => couple.split("=")).reduce((res, queryArr) => {
        res[queryArr[0]] = queryArr[1];
        return res;
    }, {});
}
function formatQuery(queryObj) {
    var res = [];
    for (var [
                key,
                value
            ] in Iterator(queryObj)) {
        res.push(key + (value ? "=" + value : ""));
    }
    return res.join("&");
}
function isYandexHost(host) {
    return /(^|\.)(yandex\.(ru|ua|by|kz|net|com(\.tr)?)|(ya|kinopoisk|moikrug)\.ru)$/i.test(host);
}
function isYandexURL(url) {
    return isYandexHost(getHost(url));
}
function saveLocalClidState(url, localHistory) {
    var host = getHost(url);
    if (!host) {
        return url;
    }
    if (!isYandexHost(host)) {
        return url;
    }
    var parsed = parseURL(url);
    var query = parseQuery(parsed.query || "");
    if (!query.clid) {
        return url;
    }
    delete query.clid;
    parsed.query = formatQuery(query);
    var withoutClid = formatURL(parsed);
    return localHistory.indexOf(withoutClid) !== -1 ? withoutClid : url;
}
function prepareURLForServer(url) {
    var host = getHost(url);
    if (!host) {
        return url;
    }
    if (host !== "clck.yandex.ru") {
        if (isYandexHost(host)) {
            return cutFromParam(url);
        } else {
            return url;
        }
    }
    var parsed = parseURL(url);
    var clickrMatches = parsed.path.match(/.+?\*(.+)/);
    if (clickrMatches) {
        return cutFromParam(clickrMatches[1]);
    }
    return clckrUrlToHost[url] ? "http://" + clckrUrlToHost[url] : url;
}
