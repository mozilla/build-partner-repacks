"use strict";
const EXPORTED_SYMBOLS = ["URLEngine"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
const URI_FIXUP = Cc["@mozilla.org/docshell/urifixup;1"].getService(Ci.nsIURIFixup);
const URLEngine = {
    init: function URLEngine_init(api) {
        this.api = api;
    },
    finalize: function URLEngine_finalize() {
        this.api = null;
    },
    _hostsList: null,
    _tldList: null,
    _loadHostList: function URLEngine__loadHostList() {
        this._hostsList = Object.create(null);
        this._hostsList.localhost = true;
        let file = this._getHostsFile();
        if (!file) {
            return;
        }
        let tempList;
        try {
            tempList = this.api.Files.readTextFile(file).split("\n");
        } catch (e) {
        }
        for (let i = 0, len = tempList.length; i < len; i++) {
            let trimmedLine = tempList[i].replace(/#.+/, "").trim();
            let [
                ip,
                name
            ] = trimmedLine.split(/\s+/);
            if (name) {
                this._hostsList[name] = true;
            }
        }
    },
    _loadTLDList: function URLEngine__loadTLDList() {
        let path = this.api.Package.resolvePath("/data/tld.txt");
        let fileChannel = this.api.Package.getFileInputChannel(path);
        try {
            let content = this.api.StrUtils.readStringFromStream(fileChannel.contentStream);
            this._tldList = JSON.parse(content);
        } catch (e) {
            this.api.logger.error("Can't get TLD list from tld.txt");
            this._tldList = {};
        }
    },
    _getHostsFile: function URLEngine__getHostsFile() {
        let osName = this.api.Environment.os.name;
        let hostsFile;
        if (osName == "windows") {
            hostsFile = Services.dirsvc.get("SysD", Ci.nsIFile);
            hostsFile.append("drivers");
        } else {
            hostsFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            hostsFile.initWithPath("/");
            if (osName == "mac") {
                hostsFile.append("private");
            }
        }
        hostsFile.append("etc");
        hostsFile.append("hosts");
        return hostsFile.exists() && hostsFile;
    },
    get hostsList() {
        if (!this._hostsList) {
            this._loadHostList();
        }
        return this._hostsList;
    },
    get tldList() {
        if (!this._tldList) {
            this._loadTLDList();
        }
        return this._tldList;
    },
    matchHost: function URLEngine_matchHost(aHostString) {
        return aHostString in this.hostsList;
    },
    matchTLD: function URLEngine_matchTLD(aDomainString) {
        return aDomainString in this.tldList;
    },
    get IDNService() {
        delete this.IDNService;
        return this.IDNService = Cc["@mozilla.org/network/idn-service;1"].getService(Ci.nsIIDNService);
    },
    _checkonRubbish: /\'|\^|\'|\*|\(|\)|\=|\+|<|>|\@|\$|\\s|,|\!|\||%/i,
    _aroundPillarPointRE: /[\s;,\?\+=\\\-@$%&~\|\*\(\)\{\}\#\'\'“”‘’«»<>\^\:\[\]\!\._\-\/№]+/,
    weakURITest: function URLEngine_weakURITest(aString) {
        let host = this.getURIParam(aString, "host");
        return host && !this._checkonRubbish.test(host) && host.indexOf("#") === -1 && host.indexOf("?") === -1 && host.lastIndexOf(".") !== host.length - 1;
    },
    searchWordsRe: {
        _phrasesRe: Object.create(null),
        hostRe: new RegExp("(?:^|.)(yandex|google|yahoo|msn|bing|seznam|aport|mail|gogo|nigma|rambler|wikipedia)(?:.com)?(?:.[a-z]{2,3})$", "i"),
        getPhraseRe: function URLEngine_SWRe_getPhraseRe(aHost) {
            if (!this._phrasesRe[aHost]) {
                let q = "q";
                switch (aHost) {
                case "yandex":
                    q = "text";
                    break;
                case "wikipedia":
                    q = "search";
                    break;
                case "rambler":
                    q = "(?:query|words)";
                    break;
                case "aport":
                    q = "r";
                    break;
                case "yahoo":
                    q = "p";
                    break;
                case "nigma":
                    q = "s";
                    break;
                }
                this._phrasesRe[aHost] = new RegExp("[?&]" + q + "=([^#&?]*)");
            }
            return this._phrasesRe[aHost];
        }
    },
    extractSearchParam: function URLEngine_extractSearchParam(url) {
        let result = this.getURIParam(url, [
            "host",
            "path"
        ]);
        if (!result) {
            return null;
        }
        let [
            host,
            path
        ] = result;
        if (host && host.match(this.searchWordsRe.hostRe)) {
            path = path.split("#").reverse().join("#");
            if (path.match(this.searchWordsRe.getPhraseRe(RegExp.$1))) {
                return URIHelper.decodeURIComponent(RegExp.$1.replace(/\+/g, " "));
            }
        }
        return null;
    },
    hasInputPart: function URLEngine_hasInputPart(source, input, noShortComparsion) {
        if (!input) {
            return -1;
        }
        source = source.toLowerCase();
        input = input.toLowerCase();
        let inputParts = input.split(" ");
        let indexes = [];
        for (let i = 0, len = inputParts.length; i < len; i++) {
            let part = inputParts[i];
            if (noShortComparsion === true && part.length < 2) {
                continue;
            }
            let index = source.indexOf(part);
            while (index != -1) {
                if (!noShortComparsion) {
                    indexes.push(index);
                    break;
                }
                if (this.aroundPillarPoint(source, index)) {
                    indexes.push(index);
                    break;
                }
                index = source.indexOf(part, index + 1);
            }
        }
        return indexes.length ? indexes[0] : -1;
    },
    validateURL: function URLEngine_validateURL(aSpec, aString) {
        let url = aSpec.indexOf(aString) === 0 ? aSpec : aSpec.replace(/^https?:\/\//, "");
        if (url.indexOf(aString) !== 0) {
            url = url.replace(/^www\./, "");
        }
        if (url.indexOf("moz-action") !== 0) {
            url = url.replace(/\/$/, "");
        }
        return url;
    },
    anyMatches: function URLEngine_anyMatches(url, string, noShortComparsion) {
        if (!string) {
            return false;
        }
        let qindex = url.indexOf("?");
        let qStringIndex = string.indexOf("?");
        if (qindex != -1 && qStringIndex == -1) {
            url = url.substr(0, qindex);
        }
        if (url.indexOf("moz-action") === 0) {
            return true;
        }
        return this.hasInputPart(url, string, noShortComparsion) != -1;
    },
    aroundPillarPoint: function URLEngine_aroundPillarPoint(aString, aIndex) {
        if (aIndex < 0) {
            return false;
        }
        return aIndex === 0 || this._aroundPillarPointRE.test(aString[aIndex - 1]);
    },
    isMatchedWholeURL: function URLEngine_isMatchedWholeURL(aURL, aString) {
        if (!aString) {
            return false;
        }
        let url = aURL.split("?")[0];
        let index = this.hasInputPart(url, aString);
        if (index === -1) {
            return false;
        }
        if (index === 0 || url.indexOf("moz-action:") === 0) {
            return true;
        }
        return false;
    },
    getURIFromString: function URLEngine_getURIFromString(aString) {
        try {
            return URI_FIXUP.createFixupURI(aString, URI_FIXUP.FIXUP_FLAG_USE_UTF8);
        } catch (e) {
        }
        return null;
    },
    getURIParam: function URLEngine_getURIParam(value, paramName) {
        let resultURI = this.getURIFromString(value);
        if (!resultURI) {
            return null;
        }
        try {
            if (typeof paramName == "string") {
                return resultURI[paramName];
            }
            return paramName.map(function (p) {
                return resultURI[p];
            });
        } catch (e) {
        }
        return null;
    },
    isMatchedArrayBy: function URLEngine_isMatchedArrayBy(array, fields, strings, compareWholeDomain) {
        for (let a = 0; a < array.length; a++) {
            for (let i = 0; i < fields.length; i++) {
                let field = fields[i];
                let item = array[a];
                let data = item[field];
                let byURLComparsion = field == "value";
                if (byURLComparsion) {
                    data = this.getURIParam(item[field], "spec");
                }
                if (!data) {
                    continue;
                }
                for (let s = 0; s < strings.length; s++) {
                    let string = strings[s];
                    let matchedFunc = compareWholeDomain && byURLComparsion ? this.isMatchedWholeURL : this.anyMatches;
                    if (matchedFunc.call(this, byURLComparsion ? this.validateURL(data, string) : data, string, false)) {
                        return a;
                    }
                }
            }
        }
        return -1;
    },
    isMatchedArray: function URLEngine_isMatchedArray(historyArray, aString, switchedString, compareWholeDomain) {
        for (let i = 0, len = historyArray.length; i < len; i++) {
            let item = historyArray[i];
            let url = this.getURIParam(item.value, "spec");
            if (!url) {
                continue;
            }
            let matchedFunc = compareWholeDomain ? this.isMatchedWholeURL : this.anyMatches;
            if (matchedFunc.call(this, this.validateURL(url, aString), aString) || matchedFunc.call(this, this.validateURL(url, switchedString), switchedString)) {
                return i;
            }
        }
        return -1;
    },
    extractDomain: function URLEngine_extractDomain(aURL) {
        return this.getURIParam(aURL, "host") || aURL;
    },
    _getExtraInfo: function URLEngine__getExtraInfo(aString) {
        return aString.split("?")[0] || false;
    },
    hasURL: function URLEngine_hasURL(aArray, aValue) {
        let trimmedValue = aValue.replace(/\/$/, "");
        let domain = this.extractDomain(trimmedValue);
        let count = 0;
        let unique = false;
        for (let i = 0, len = aArray.length; i < len; i++) {
            if (!aArray[i]) {
                continue;
            }
            let arrValue = aArray[i].value.replace(/\/$/, "");
            if (trimmedValue == arrValue) {
                unique = true;
            }
            if (domain == this.extractDomain(arrValue)) {
                count++;
            }
        }
        return [
            unique,
            count
        ];
    },
    getInputType: function URLEngine_getInputType(aString, aStrictCheck) {
        function trace(str) {
        }
        let logger = this.api.logger;
        trace(" --- check '" + aString + "'");
        let str = (aString || "").trim();
        if (!str) {
            trace("!str");
            return [
                "search",
                str
            ];
        }
        if (aStrictCheck && /\s/.test(str)) {
            trace("space in url");
            return [
                "search",
                str
            ];
        }
        let uri = this.getURIFromString(aString);
        if (!uri) {
            trace("!uri");
            return [
                "search",
                str
            ];
        }
        let host;
        try {
            host = uri.host;
        } catch (e) {
        }
        trace("host: '" + host + "'");
        if (!host) {
            trace("uri.scheme: '" + uri.scheme + "'");
            if (/^(mailto|file|news|resource|about|data|bar|view-source|javascript)$/.test(uri.scheme)) {
                return [
                    "url",
                    str
                ];
            }
            let protocolHandler = Services.io.getProtocolHandler(uri.scheme);
            try {
                protocolHandler.newChannel(uri);
            } catch (e) {
                if (e.result === Cr.NS_ERROR_UNKNOWN_PROTOCOL) {
                    if (/^[a-z]$/i.test(uri.scheme)) {
                        return [
                            "url",
                            "file:///" + uri.spec
                        ];
                    }
                    trace("unknown protocol '" + uri.scheme + "'");
                    return [
                        "maybeurl",
                        str
                    ];
                }
            }
            trace("no host");
            if (/\/[#$%&*();?]/.test(uri.path)) {
                trace("match [#$%&*();?]");
                return [
                    "search",
                    str
                ];
            }
            return [
                "url",
                uri.spec
            ];
        }
        if (this.matchHost(host)) {
            trace("match host in the hosts file");
            return [
                "url",
                uri.spec
            ];
        }
        if (host.length > 255) {
            trace("host.length > 255");
            return [
                "search",
                str
            ];
        }
        if (aStrictCheck) {
            let hostParts = host.split(".");
            for (let i = hostParts.length; --i >= 0;) {
                let part = hostParts[i];
                if (!part || part.length > 63 || /^\-|\-$/.test(part)) {
                    trace("bad host part");
                    return [
                        "search",
                        str
                    ];
                }
            }
        }
        if (/^(https?|ftp|xb|chrome):\/\//.test(str)) {
            trace("/^(https?|ftp|xb|chrome):\\/\\//.test('" + str + "')");
            return [
                "url",
                uri.spec
            ];
        }
        try {
            if (uri.username && uri.password === "") {
                return [
                    "search",
                    str
                ];
            }
        } catch (e) {
        }
        try {
            if (/^(org\.ua|mil\.ru)$/i.test(uri.host)) {
                return [
                    "url",
                    uri.spec
                ];
            }
            let baseDomain = Services.eTLD.getBaseDomain(uri);
            trace("baseDomain: '" + baseDomain + "'");
            let tld = baseDomain.substr(baseDomain.lastIndexOf(".") + 1);
            let parts = uri.host.split(".");
            let likeTLD = parts.pop();
            let likePart = parts.pop();
            if (likeTLD && likePart) {
                if (/[\u0400-\u052f]/.test(likeTLD) && /[a-z]/i.test(likePart) || (/[\u0400-\u052f]/.test(likePart) || likePart.indexOf("xn--") === 0) && /[a-z]/i.test(likeTLD)) {
                    trace("different langs in part ('" + likePart + "') and tld ('" + likeTLD + "')");
                    return [
                        "maybeurl",
                        uri.spec
                    ];
                }
            }
            if (this.matchTLD(tld)) {
                trace("matchTLD");
                return [
                    "url",
                    uri.spec
                ];
            }
            if (tld.indexOf("xn--") === 0) {
                if (this.api.Settings.PrefsModule.has("network.IDN.whitelist." + tld)) {
                    return [
                        "url",
                        uri.spec
                    ];
                }
                if (aStrictCheck) {
                    return [
                        "search",
                        str
                    ];
                }
            } else if (aStrictCheck) {
                if (!/^[a-z]+$/i.test(tld)) {
                    trace("bad tld");
                    return [
                        "search",
                        str
                    ];
                }
            }
        } catch (e) {
            if (e.result == Cr.NS_ERROR_HOST_IS_IP_ADDRESS) {
                if (str[0] == "[" || /^((\d){1,3}\.){3}\d{1,3}(:\d*)?(\/|$)/.test(host)) {
                    trace("is ip");
                    return [
                        "url",
                        uri.spec
                    ];
                } else {
                    trace("is not full ip");
                    return [
                        "search",
                        str
                    ];
                }
            } else {
                trace("Get base domain error: " + e);
            }
        }
        if (aStrictCheck) {
            let aceHost;
            try {
                aceHost = this.IDNService.convertUTF8toACE(host);
                trace("aceHost: " + aceHost);
            } catch (e) {
                trace("convertUTF8toACE error");
                return [
                    "search",
                    str
                ];
            }
            let hostParts = aceHost.split(".");
            for (let i = hostParts.length; --i >= 0;) {
                let part = hostParts[i];
                if (!part || /^\-|\-$/.test(part) || !/^[a-z0-9\-]+$/i.test(part)) {
                    trace("bad ACE host part");
                    return [
                        "search",
                        str
                    ];
                }
            }
        }
        if (/^\/[;?]$/.test(uri.path)) {
            return [
                "search",
                str
            ];
        }
        if (uri.path == "/") {
            if (str.substr(-1) == "/") {
                return [
                    "url",
                    uri.spec
                ];
            }
        } else {
            if (/^\/?/.test(uri.path) && !/\//.test(str)) {
                return [
                    "search",
                    str
                ];
            }
            if (!/%20/.test(uri.path.split("?")[0])) {
                return [
                    "url",
                    uri.spec
                ];
            }
        }
        return [
            "maybeurl",
            uri.spec
        ];
    }
};
const URIHelper = {
    decodeURIComponent: function URIHelper_decodeURIComponent(aString) {
        try {
            return decodeURIComponent(aString);
        } catch (e) {
        }
        return this._textToSubURIService.unEscapeURIForUI("windows-1251", aString);
    },
    get _textToSubURIService() {
        delete this._textToSubURIService;
        return this._textToSubURIService = Cc["@mozilla.org/intl/texttosuburi;1"].getService(Ci.nsITextToSubURI);
    }
};
