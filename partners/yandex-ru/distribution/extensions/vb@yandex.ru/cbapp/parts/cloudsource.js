"use strict";
const EXPORTED_SYMBOLS = ["cloudSource"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const GLOBAL = this;
const DB_FILENAME = "fastdial.sqlite";
const API_DATA_RECEIVED_EVENT = "ftabs-api-data-received";
const SELF_DATA_RECEIVED_EVENT = "ftabs-self-data-received";
const CLOUD_API_URL = "http://api.browser.yandex.ru/dashboard3/get/?nodes=";
const MAX_LOGO_WIDTH = 150;
const MAX_LOGO_HEIGHT = 60;
const REFRESH_INTERVAL = 86400 * 7 * 1000;
const LOGOS_BASEPATH = "resource://vb-profile-data/logos/";
const SCALE_RATIO = 0.43;
let cachedCloudData = Object.create(null);
const cloudSource = {
    init: function CloudSource_init(application) {
        application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
        patterns.NotificationSource.objectMixIn(this);
        this.addListener(API_DATA_RECEIVED_EVENT, this);
        this.addListener(SELF_DATA_RECEIVED_EVENT, this);
        this._application = application;
        this._logger = application.getLogger("CloudSource");
        this._initDatabase();
    },
    finalize: function CloudSource_finalize(doCleanup, callback) {
        this.removeAllListeners();
        this._pendingRequests.forEach(function (request) {
            request.abort();
        });
        this._pagesLoadQueue = null;
        this._manifestLoadQueue = null;
        let dbClosedCallback = function _dbClosedCallback() {
            this._database = null;
            this._application = null;
            this._logger = null;
        }.bind(this);
        if (this._database) {
            this._database.close(function () {
                dbClosedCallback();
                callback();
            });
            return true;
        }
        dbClosedCallback();
    },
    observe: function CloudSource_observe(aSubject, aTopic, aData) {
        switch (aTopic) {
        case API_DATA_RECEIVED_EVENT: {
                if (!aData.color) {
                    this._database.executeQueryAsync({
                        query: "INSERT OR REPLACE INTO cloud_data (domain, backgroundColor, user_supplied, last_api_request) " + "VALUES (:domain, :color, 0, :now)",
                        parameters: {
                            domain: aData.domain,
                            color: null,
                            now: Date.now().toString()
                        }
                    });
                    return;
                }
                let newData = {
                    color: aData.color,
                    domain: aData.domain,
                    url: aData.url
                };
                cachedCloudData[aData.domain] = {
                    color: aData.color,
                    url: aData.url
                };
                this._database.executeQueryAsync({
                    query: "INSERT OR REPLACE INTO cloud_data (domain, backgroundColor, user_supplied, last_api_request) " + "VALUES (:domain, :color, 0, :now)",
                    parameters: {
                        domain: aData.domain,
                        color: aData.color,
                        now: Date.now().toString()
                    }
                });
                Services.obs.notifyObservers(this, this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT, JSON.stringify(newData));
                break;
            }
        case SELF_DATA_RECEIVED_EVENT: {
                let newData = {
                    color: aData.color,
                    domain: aData.domain,
                    url: aData.url
                };
                this._database.executeQueryAsync({
                    query: "INSERT OR REPLACE INTO cloud_data (domain, backgroundColor, user_supplied) " + "VALUES (:domain, :color, 1)",
                    parameters: {
                        domain: aData.domain,
                        color: aData.color
                    }
                });
                cachedCloudData[aData.domain] = {
                    color: aData.color,
                    url: aData.url
                };
                Services.obs.notifyObservers(this, this._application.core.eventTopics.CLOUD_DATA_RECEIVED_EVENT, JSON.stringify(newData));
                break;
            }
        }
    },
    getLogoForHost: function CloudSource_getLogoForHost(host) {
        host = host.replace(/^www\./, "");
        if (cachedCloudData[host]) {
            return cachedCloudData[host];
        }
        try {
            let logoSource = fileutils.jsonFromFile(this._logoFile)[host];
            if (logoSource) {
                this._saveImage(host, logoSource);
            }
            return { url: logoSource };
        } catch (err) {
        }
        return null;
    },
    fetchThumbLogo: function CloudSource_fetchThumbLogo(uri, options = {}) {
        let host = this._application.fastdial.getDecodedUrlHost(uri.spec);
        if (!host) {
            return;
        }
        let updateThumbs = function Thumbs_getMissingData_onTileDataReady(err, cloudData) {
            let dataStructure = {};
            this._application.internalStructure.iterate({ nonempty: true }, function (data, index) {
                if (uri.spec !== data.location.spec) {
                    return;
                }
                data.background = cloudData;
                dataStructure[index] = data;
            });
            this._application.internalStructure.setItem(dataStructure);
            this._application.fastdial.sendRequest("thumbChanged", this._application.frontendHelper.fullStructure);
            let cachedHistoryData = this._application.fastdial.cachedHistoryThumbs[uri.spec];
            if (cachedHistoryData) {
                cachedHistoryData.background = cloudData;
                this._application.fastdial.sendRequest("historyThumbChanged", this._application.frontendHelper.getDataForThumb(cachedHistoryData));
            }
        }.bind(this);
        if (cachedCloudData[host]) {
            updateThumbs(null, cachedCloudData[host]);
            if (options.force) {
                this._application.cloudSource._fetchTileFromWeb(uri);
            }
            return;
        }
        this._database.executeQueryAsync({
            query: "SELECT domain, backgroundColor FROM cloud_data WHERE domain = :domain",
            columns: [
                "domain",
                "backgroundColor"
            ],
            parameters: { domain: host },
            callback: function CloudSource_requestTileFromDatabase_onDataReady(rowsData, storageError) {
                if (storageError) {
                    throw storageError;
                }
                if (!rowsData.length) {
                    this._application.cloudSource._fetchTileFromWeb(uri);
                    updateThumbs(null, null);
                    return;
                }
                if (options.force) {
                    this._application.cloudSource._fetchTileFromWeb(uri);
                }
                let url;
                if (this._isFileExistsForHost(host)) {
                    url = LOGOS_BASEPATH + this._getFilenameByHostname(host);
                } else {
                    url = this.getLogoForHost(host).url;
                }
                if (url) {
                    cachedCloudData[host] = {
                        url: url,
                        color: rowsData[0].backgroundColor
                    };
                }
                updateThumbs(null, cachedCloudData[host]);
            }.bind(this)
        });
    },
    _isFileExistsForHost: function CloudSource__isFileExistsForHost(host) {
        let file = this._logoDir;
        file.append(this._getFilenameByHostname(host));
        return file.exists() && file.isFile() && file.isReadable();
    },
    _getFilenameByHostname: function CloudSource__getFilenameByHost(host) {
        return misc.CryptoHash.getFromString(host.replace(/^www\./, ""), "SHA1") + ".png";
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
    _fetchTileFromWeb: function CloudSource__fetchTileFromWeb(uri, useBothSources) {
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
        let weekPassed = Math.abs(Date.now() - lastRequest) > REFRESH_INTERVAL;
        if (!weekPassed) {
            return;
        }
        this._database.executeQueryAsync({
            query: "SELECT last_api_request, user_supplied FROM cloud_data WHERE domain = :domain",
            columns: [
                "last_api_request",
                "user_supplied"
            ],
            parameters: { domain: host },
            callback: function (rowsData, storageError) {
                if (storageError) {
                    let msg = strutils.formatString("DB error while selecting local cloud data: %1 (code %2)", [
                        storageError.message,
                        storageError.result
                    ]);
                    throw new Error(msg);
                }
                let hasUserImage = rowsData.some(function (row) {
                    return Boolean(row.user_supplied);
                });
                if (!hasUserImage) {
                    this._requestAPI(uri);
                }
            }.bind(this)
        });
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
    _requestPageManifest: function CloudSource__requestPageManifest(uri) {
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
        });
        let errorHandler = function errorHandler(e) {
            timer.cancel();
            delete self._pagesLoadQueue[uri.spec];
        };
        xhr.addEventListener("error", errorHandler, false);
        xhr.addEventListener("abort", errorHandler, false);
        xhr.send();
    },
    getManifestFromDocument: function CloudSource_getManifestFromDocument(document, uri) {
        if (typeof uri === "string") {
            try {
                uri = Services.io.newURI(uri, null, null);
            } catch (e) {
            }
        }
        if (!uri.asciiHost) {
            return;
        }
        let link = document.querySelector("link[rel='yandex-tableau-widget']");
        if (!link) {
            return;
        }
        let manifestUrl = netutils.resolveRelativeURL(link.getAttribute("href"), uri);
        this._validatePageManifest(manifestUrl, uri.asciiHost);
    },
    _validatePageManifest: function CloudSource__validatePageManifest(url, domain) {
        if (this._manifestLoadQueue[url]) {
            return;
        }
        this._manifestLoadQueue[url] = 1;
        let self = this;
        let xhr = this._createXHR();
        xhr.open("GET", url, true);
        xhr.responseType = "json";
        let timer = new sysutils.Timer(function () {
            xhr.abort();
        }, 25000);
        xhr.addEventListener("load", function () {
            timer.cancel();
            delete self._manifestLoadQueue[url];
            let response = xhr.response;
            if (!response) {
                self._logger.warn("Server response is not a valid JSON");
                return;
            }
            if (!response.api_version || !response.layout || !response.layout.logo || !response.layout.color) {
                return;
            }
            let color = typeof response.layout.color === "object" ? response.layout.color[self._application.locale.language] || response.layout.color.default : response.layout.color;
            let logo = typeof response.layout.logo === "object" ? response.layout.logo[self._application.locale.language] || response.layout.logo.default : response.layout.logo;
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
            self._validateImageAgainstSize(logoSource, function (valid) {
                if (!valid) {
                    return;
                }
                self._notifyListeners(SELF_DATA_RECEIVED_EVENT, {
                    domain: domain,
                    color: color,
                    url: logoSource
                });
                self._saveImage(domain, logoSource);
            });
        });
        let errorHandler = function errorHandler(e) {
            delete self._manifestLoadQueue[url];
        };
        xhr.addEventListener("error", errorHandler, false);
        xhr.addEventListener("abort", errorHandler, false);
        xhr.send();
    },
    _validateImageAgainstSize: function CloudSource__validateImageAgainstSize(imgSource, callback) {
        let self = this;
        let hiddenWindow = misc.hiddenWindows.appWindow;
        let hiddenWindowDoc = hiddenWindow.document;
        let image = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml", "img");
        image.onload = function imgOnLoad() {
            self._logger.trace("Image proportions: " + image.width + "x" + image.height);
            callback(image.width <= MAX_LOGO_WIDTH && image.height <= MAX_LOGO_HEIGHT);
        };
        image.onerror = function imgOnError() {
            callback(false);
        };
        image.src = imgSource;
    },
    _requestAPI: function CloudSource__requestAPI(uri) {
        this._setLastRequestForURI(uri, Date.now());
        let host;
        try {
            uri.QueryInterface(Ci.nsIURL);
            host = uri.asciiHost.replace(/^www\./, "");
        } catch (ex) {
        }
        if (!host) {
            return;
        }
        if (this._cloudDataDomainsQueue[host]) {
            return;
        }
        this._cloudDataDomainsQueue[host] = 1;
        let cloudURL = CLOUD_API_URL + encodeURIComponent(host) + "&brandID=" + this._application.branding.productInfo.BrandID + "&lang=" + this._application.locale.language + "&scale=" + SCALE_RATIO;
        let xhr = this._createXHR();
        xhr.open("GET", cloudURL, true);
        xhr.responseType = "json";
        let timer = new sysutils.Timer(function () {
            xhr.abort();
        }, 25000);
        xhr.addEventListener("load", function () {
            timer.cancel();
            delete this._cloudDataDomainsQueue[host];
            if (!xhr.response) {
                this._logger.error("Server response is not a valid JSON: " + xhr.responseText.slice(0, 100));
                return;
            }
            if (xhr.response.error || !xhr.response || !xhr.response[0] || !xhr.response[0].bgcolor || !xhr.response[0].resources || !xhr.response[0].resources.logo_main) {
                this._notifyListeners(API_DATA_RECEIVED_EVENT, {
                    domain: host,
                    color: null,
                    url: null
                });
                return;
            }
            let url = xhr.response[0].resources.logo_main;
            this._notifyListeners(API_DATA_RECEIVED_EVENT, {
                domain: host,
                color: xhr.response[0].bgcolor.replace(/^#/, ""),
                url: url
            });
            this._saveImage(host, url);
        }.bind(this));
        let errorHandler = function errorHandler(e) {
            delete this._cloudDataDomainsQueue[host];
        }.bind(this);
        xhr.addEventListener("error", errorHandler, false);
        xhr.addEventListener("abort", errorHandler, false);
        xhr.send();
    },
    _saveImage: function CloudSource__saveImage(host, url) {
        let jsonFile = this._logoFile;
        let cacheFromFile = {};
        try {
            cacheFromFile = fileutils.jsonFromFile(jsonFile);
        } catch (err) {
        }
        cacheFromFile[host] = url;
        try {
            fileutils.jsonToFile(cacheFromFile, jsonFile);
        } catch (err) {
        }
        let hiddenWindowDoc = misc.hiddenWindows.appWindow.document;
        let image = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml", "img");
        let canvas = hiddenWindowDoc.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
        let self = this;
        image.onload = function imgOnLoad() {
            canvas.height = image.height;
            canvas.width = image.width;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0);
            canvas.mozFetchAsStream({
                onInputStreamReady: function onStreamReady(stream) {
                    let file = self._logoDir;
                    file.append(self._getFilenameByHostname(host));
                    fileutils.writeStreamToFile(stream, file);
                }
            }, "image/png");
        };
        image.onerror = function imgOnError(err) {
            self._logger.trace("Failed to load image for %host from %url. Message: %message".replace("%message", err.message).replace("%host", host).replace("%url", url));
        };
        image.src = url;
    },
    _createXHR: function CloudSource__createXHR() {
        let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        xhr.mozBackgroundRequest = true;
        xhr.QueryInterface(Ci.nsIDOMEventTarget);
        let dropFromQueue = function () {
            let pos = this._pendingRequests.indexOf(xhr);
            this._pendingRequests.splice(pos, 1);
        }.bind(this);
        xhr.addEventListener("load", dropFromQueue, false);
        xhr.addEventListener("error", dropFromQueue, false);
        xhr.addEventListener("abort", dropFromQueue, false);
        this._pendingRequests.push(xhr);
        return xhr;
    },
    _initDatabase: function CloudSource__initDatabase() {
        let dbFile = this._application.core.rootDir;
        dbFile.append(DB_FILENAME);
        this._database = new Database(dbFile);
    },
    _database: null,
    _application: null,
    _logger: null,
    _pendingRequests: [],
    _cloudDataDomainsQueue: {},
    _pagesLoadQueue: {},
    _manifestLoadQueue: {}
};
