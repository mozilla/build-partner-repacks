"use strict";
const EXPORTED_SYMBOLS = ["thumbsLogos"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const GLOBAL = this;
const API_DATA_RECEIVED_EVENT = "ftabs-api-data-received";
const SELF_DATA_RECEIVED_EVENT = "ftabs-self-data-received";
const CLOUD_API_URL = "https://api.browser.yandex.ru/dashboard3/get/?nodes=";
const MAX_LOGO_WIDTH = 150;
const MAX_LOGO_HEIGHT = 60;
const REFRESH_INTERVAL = 86400 * 7 * 1000;
const REFRESH_INTERVAL_ON_ERROR = 1 * 60 * 60 * 1000;
const LOGOS_BASEPATH = "resource://vb-profile-data/logos/";
const SCALE_RATIO = 0.43;
let cachedCloudData = Object.create(null);
const thumbsLogos = {
    init: function thumbsLogos_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        patterns.NotificationSource.objectMixIn(this);
        this.addListener(API_DATA_RECEIVED_EVENT, this);
        this.addListener(SELF_DATA_RECEIVED_EVENT, this);
        this._application = application;
        this._logger = application.getLogger("ThumbsLogos");
        this._dataProvider = application.dataproviders.getProvider("logos");
        this._dataProvider.addListener("request", (name, target, data) => {
            this.fetch(target, data);
        });
        this.loadData();
    },
    finalize: function thumbsLogos_finalize(doCleanup, callback) {
        this.removeAllListeners();
        this.saveData({ force: true });
        this._pendingRequests.forEach(function (request) {
            request.abort();
        });
        this._pagesLoadQueue = null;
        this._manifestLoadQueue = null;
    },
    loadData: function thumbsLogos_loadData(data, provideData) {
        cachedCloudData = data || Object.create(null);
    },
    saveData: function thumbsLogos_saveData(save, options, host, logo) {
        if (host && logo) {
            host = host.replace(/^www\./, "");
            cachedCloudData[host] = logo;
        }
        save(cachedCloudData, options || {});
    },
    observe: function thumbsLogos_observe(aSubject, aTopic, aData) {
        aData = aData || {};
        let {
            color,
            domain: host,
            logoMain,
            logoSub
        } = aData;
        switch (aTopic) {
        case API_DATA_RECEIVED_EVENT: {
                this._provide({ host: host }, {
                    color: color,
                    logoMain: logoMain,
                    logoSub: logoSub
                });
                this.saveData({}, host, {
                    logoMain: logoMain,
                    logoSub: logoSub,
                    color: color || null,
                    fromWebsite: false,
                    lastApiRequest: Date.now()
                });
                break;
            }
        case SELF_DATA_RECEIVED_EVENT: {
                this.saveData({}, host, {
                    logoMain: logoMain,
                    logoSub: null,
                    color: color,
                    fromWebsite: true,
                    lastApiRequest: Date.now()
                });
                this._provide({ host: host }, {
                    color: color,
                    logoMain: logoMain
                });
                break;
            }
        }
    },
    getLogoForHost: function thumbsLogos_getLogoForHost(host) {
        host = host.replace(/^www\./, "");
        if (cachedCloudData[host]) {
            return cachedCloudData[host];
        }
        return null;
    },
    fetch: function thumbsLogos_fetchThumbLogo(uri, options = {}) {
        let host = this._application.fastdial.getDecodedUrlHost(uri.spec);
        if (!host) {
            return;
        }
        if (cachedCloudData[host]) {
            this._provide(uri, cachedCloudData[host]);
            if (options.force) {
                this._fetchTileFromWeb(uri, options.requestSource);
            }
            return;
        }
        this._fetchTileFromWeb(uri, options.requestSource);
    },
    _getFilename: function thumbsLogos__getFilename(host, isIndexPage = true) {
        if (!isIndexPage) {
            host += ".sub";
        }
        return misc.crypto.createHash("sha1").update(host.replace(/^www\./, "")).digest("hex") + ".png";
    },
    get _logoDir() {
        let dir = this._application.core.rootDir;
        dir.append("logos");
        fileutils.forceDirectories(dir);
        return dir;
    },
    get _logoFile() {
        let thumbLogosFile = this._application.core.rootDir;
        thumbLogosFile.append("logos.json");
        return thumbLogosFile;
    },
    _fetchTileFromWeb: function thumbsLogos__fetchTileFromWeb(uri, requestSource = false) {
        let host;
        try {
            uri.QueryInterface(Ci.nsIURL);
            host = uri.asciiHost.replace(/^www\./, "");
        } catch (ex) {
        }
        if (!host) {
            return;
        }
        host = host.replace(/^www\./, "");
        uri.host = host;
        let lastRequest = this._getLastRequestForURI(uri);
        let expired = Math.abs(Date.now() - lastRequest) > REFRESH_INTERVAL;
        if (!expired) {
            return;
        }
        let logo = cachedCloudData[host];
        if (!logo || !logo.fromWebsite) {
            this._requestAPI(uri);
            if (requestSource) {
                this._requestPageManifest(uri);
            }
        }
    },
    _getLastRequests: function Cloudsource__getLastRequests() {
        let lastApiRequestsFile = this._lastApiRequestFile;
        let requestsJSON = {};
        if (lastApiRequestsFile.exists() && lastApiRequestsFile.isFile() && lastApiRequestsFile.isReadable()) {
            try {
                requestsJSON = fileutils.jsonFromFile(lastApiRequestsFile) || {};
            } catch (err) {
            }
        }
        return requestsJSON;
    },
    _getLastRequestForURI: function Cloudsource__getLastRequestForURI(uri) {
        let requestsJSON = this._getLastRequests();
        return requestsJSON[uri.spec] || 0;
    },
    _setLastRequestForURI: function Cloudsource__setLastRequestForURI(uri, lastRequest) {
        let requestsJSON = this._getLastRequests();
        requestsJSON[uri.spec] = lastRequest;
        try {
            fileutils.jsonToFile(requestsJSON, this._lastApiRequestFile);
        } catch (err) {
        }
    },
    get _lastApiRequestFile() {
        let lastApiRequestsFile = this._application.core.rootDir;
        lastApiRequestsFile.append("api-requests.json");
        return lastApiRequestsFile;
    },
    _requestPageManifest: function thumbsLogos__requestPageManifest(uri) {
        if (!uri.spec || this._pagesLoadQueue[uri.spec]) {
            return;
        }
        this._pagesLoadQueue[uri.spec] = 1;
        let self = this;
        let xhr = this._createXHR();
        uri = uri.clone();
        uri.QueryInterface(Ci.nsIURL);
        if (this._application.isYandexHost(uri.host)) {
            let parsedQuery = netutils.querystring.parse(uri.query);
            parsedQuery.nugt = "vbff-" + this._application.addonManager.addonVersion;
            uri.query = netutils.querystring.stringify(parsedQuery);
        }
        xhr.open("GET", uri.spec, true);
        let timer = new sysutils.Timer(function () {
            xhr.abort();
        }, 25000);
        xhr.addEventListener("load", function () {
            timer.cancel();
            delete self._pagesLoadQueue[uri.spec];
            let responseText = (xhr.responseText || "").replace(/<\/head>[\s\S]*/i, "</head><body/></html>").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
            let domParser = xmlutils.getDOMParser();
            let xmlDocument;
            try {
                xmlDocument = domParser.parseFromString(responseText, "text/html");
            } catch (e) {
            }
            if (!xmlDocument) {
                return;
            }
            self.getManifestFromDocument(xmlDocument, uri);
            self._application.screenshots.getTitleFromDocument(xmlDocument, uri.spec);
        });
        let errorHandler = function errorHandler(e) {
            timer.cancel();
            delete self._pagesLoadQueue[uri.spec];
        };
        xhr.addEventListener("error", errorHandler, false);
        xhr.addEventListener("abort", errorHandler, false);
        xhr.send();
    },
    getManifestFromDocument: function thumbsLogos_getManifestFromDocument(document, uri) {
        if (typeof uri === "string") {
            try {
                uri = Services.io.newURI(uri, null, null);
            } catch (e) {
                return;
            }
        }
        let asciiHost;
        try {
            asciiHost = uri.asciiHost;
        } catch (e) {
        }
        if (!asciiHost) {
            return;
        }
        let link = document.querySelector("link[rel='yandex-tableau-widget']");
        if (!link) {
            return;
        }
        let manifestUrl = netutils.resolveRelativeURL(link.getAttribute("href"), uri);
        this._validatePageManifest(manifestUrl, asciiHost);
    },
    _validatePageManifest: function thumbsLogos__validatePageManifest(url, domain) {
        if (this._manifestLoadQueue[url]) {
            return;
        }
        this._manifestLoadQueue[url] = 1;
        let xhr = this._createXHR();
        xhr.open("GET", url, true);
        xhr.responseType = "json";
        let timer = new sysutils.Timer(function () {
            xhr.abort();
        }, 25000);
        xhr.addEventListener("load", () => {
            timer.cancel();
            delete this._manifestLoadQueue[url];
            let response = xhr.response;
            if (!response) {
                this._logger.warn("Server response is not a valid JSON");
                return;
            }
            if (!response.api_version || !response.layout || !response.layout.logo || !response.layout.color) {
                return;
            }
            let color = typeof response.layout.color === "object" ? response.layout.color[this._application.locale.language] || response.layout.color.default : response.layout.color;
            let logo = typeof response.layout.logo === "object" ? response.layout.logo[this._application.locale.language] || response.layout.logo.default : response.layout.logo;
            if (!logo || !color || !/^#/.test(color) || [
                    4,
                    7
                ].indexOf(color.length) === -1) {
                return;
            }
            color = color.substr(1);
            if (color.length === 3) {
                color = color.split("").map(symbol => symbol + symbol).join("");
            }
            let logoSource = netutils.resolveRelativeURL(logo, netutils.newURI(url));
            this._validateImageAgainstSize(logoSource, valid => {
                if (!valid) {
                    return;
                }
                this._notifyListeners(SELF_DATA_RECEIVED_EVENT, {
                    domain: domain,
                    color: color,
                    logoMain: logoSource
                });
                this._saveImages(domain, logoSource);
            });
        });
        let errorHandler = error => delete this._manifestLoadQueue[url];
        xhr.addEventListener("error", errorHandler, false);
        xhr.addEventListener("abort", errorHandler, false);
        xhr.send();
    },
    _validateImageAgainstSize: function thumbsLogos__validateImageAgainstSize(imgSource, callback) {
        let hiddenWindow = misc.hiddenWindows.appWindow;
        let hiddenWindowDoc = hiddenWindow.document;
        let image = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml", "img");
        image.onload = () => {
            this._logger.trace("Image proportions: " + image.width + "x" + image.height);
            callback(image.width <= MAX_LOGO_WIDTH && image.height <= MAX_LOGO_HEIGHT);
        };
        image.onerror = () => callback(false);
        image.src = imgSource;
    },
    _requestAPI: function thumbsLogos__requestAPI(uri) {
        let setLastRequestTime = status => {
            let timestamp = Date.now();
            if (status === "error") {
                timestamp -= REFRESH_INTERVAL - REFRESH_INTERVAL_ON_ERROR;
            }
            this._setLastRequestForURI(uri, timestamp);
        };
        let host;
        try {
            uri.QueryInterface(Ci.nsIURL);
            host = uri.asciiHost.replace(/^www\./, "");
        } catch (ex) {
        }
        if (!host) {
            setLastRequestTime();
            return;
        }
        if (this._cloudDataDomainsQueue[host]) {
            return;
        }
        this._logger.trace("Request API for " + host);
        this._cloudDataDomainsQueue[host] = 1;
        let cloudURL = CLOUD_API_URL + encodeURIComponent(host) + "&brandID=" + this._application.branding.productInfo.BrandID + "&lang=" + this._application.locale.language + "&scale=" + SCALE_RATIO;
        let xhr = this._createXHR();
        xhr.open("GET", cloudURL, true);
        xhr.responseType = "json";
        let timer = new sysutils.Timer(function () {
            xhr.abort();
        }, 25000);
        xhr.addEventListener("load", () => {
            timer.cancel();
            delete this._cloudDataDomainsQueue[host];
            if (!xhr.response || xhr.response.error) {
                setLastRequestTime("error");
            } else {
                setLastRequestTime();
            }
            if (!xhr.response) {
                this._logger.error("Server response is not a valid JSON: " + xhr.responseText.slice(0, 100));
                return;
            }
            if (xhr.response.error || !xhr.response[0] || !xhr.response[0].bgcolor || !xhr.response[0].resources || !xhr.response[0].resources.logo_main) {
                this._notifyListeners(API_DATA_RECEIVED_EVENT, {
                    domain: host,
                    color: null,
                    logoMain: null
                });
                return;
            }
            let {
                logo_main: logoMain,
                logo_sub: logoSub
            } = xhr.response[0].resources;
            this._notifyListeners(API_DATA_RECEIVED_EVENT, {
                domain: host,
                color: xhr.response[0].bgcolor.replace(/^#/, ""),
                logoMain: logoMain,
                logoSub: logoSub
            });
            this._saveImages(host, logoMain, logoSub);
        });
        let errorHandler = e => {
            timer.cancel();
            setLastRequestTime("error");
            delete this._cloudDataDomainsQueue[host];
        };
        xhr.addEventListener("error", errorHandler, false);
        xhr.addEventListener("abort", errorHandler, false);
        xhr.send();
    },
    _saveImages: function thumbsLogos__saveImages(host, logoMain, logoSub) {
        let jsonFile = this._logoFile;
        let cacheFromFile = {};
        try {
            cacheFromFile = fileutils.jsonFromFile(jsonFile);
        } catch (err) {
        }
        cacheFromFile[host] = cacheFromFile[host] || {};
        cacheFromFile[host].logoMain = logoMain;
        if (logoSub) {
            cacheFromFile[host].logoSub = logoSub;
        }
        try {
            fileutils.jsonToFile(cacheFromFile, jsonFile);
        } catch (err) {
        }
        let hiddenWindowDoc = misc.hiddenWindows.appWindow.document;
        let urls = logoSub ? [
            logoMain,
            logoSub
        ] : [logoMain];
        let promises = urls.map((url, index) => {
            let deferred = promise.defer();
            let image = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml", "img");
            let canvas = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
            image.onload = () => {
                canvas.height = image.height;
                canvas.width = image.width;
                let ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0);
                canvas.mozFetchAsStream({
                    onInputStreamReady: stream => {
                        let file = this._logoDir;
                        let filename = this._getFilename(host, !Boolean(index));
                        file.append(filename);
                        fileutils.writeStreamToFile(stream, file);
                        deferred.resolve(LOGOS_BASEPATH + filename);
                        this._logger.trace("Image from %url for %host saved to %filename".replace("%host", host).replace("%url", url).replace("%filename", filename));
                    }
                }, "image/png");
            };
            image.onerror = err => {
                this._logger.trace("Failed to load image for %host from %url. Message: %message".replace("%message", err.message).replace("%host", host).replace("%url", url));
            };
            image.src = url;
            return deferred.promise;
        });
        promise.all(promises).then(urls => {
            let [
                logoMain,
                logoSub
            ] = urls;
            let knownData = cachedCloudData[host];
            let data = {
                logoMain: logoMain,
                logoSub: logoSub || null,
                color: knownData.color,
                fromWebsite: knownData.fromWebsite,
                lastApiRequest: knownData.lastApiRequest || Date.now()
            };
            this.saveData({}, host, data);
        });
    },
    _createXHR: function thumbsLogos__createXHR() {
        let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        xhr.mozBackgroundRequest = true;
        xhr.QueryInterface(Ci.nsIDOMEventTarget);
        let dropFromQueue = () => {
            let pos = this._pendingRequests.indexOf(xhr);
            this._pendingRequests.splice(pos, 1);
        };
        xhr.addEventListener("load", dropFromQueue, false);
        xhr.addEventListener("error", dropFromQueue, false);
        xhr.addEventListener("abort", dropFromQueue, false);
        this._pendingRequests.push(xhr);
        return xhr;
    },
    _provide: function thumbsLogos__provide(targetLike, {color, logoMain, logoSub}) {
        this._dataProvider.provideData("logo", targetLike, {
            color: color,
            logoMain: logoMain,
            logoSub: logoSub || logoMain
        });
    },
    _database: null,
    _application: null,
    _logger: null,
    _pendingRequests: [],
    _cloudDataDomainsQueue: {},
    _pagesLoadQueue: {},
    _manifestLoadQueue: {}
};
