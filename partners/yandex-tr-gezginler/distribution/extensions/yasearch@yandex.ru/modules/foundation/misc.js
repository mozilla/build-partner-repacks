"use strict";
EXPORTED_SYMBOLS.push("misc");
Cu.import("resource://gre/modules/Services.jsm");
const misc = {
    getBrowserWindows: function misc_getBrowserWindows() {
        let windows = [];
        let wndEnum = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getEnumerator("navigator:browser");
        while (wndEnum.hasMoreElements()) {
            windows.push(wndEnum.getNext());
        }
        return windows;
    },
    getTopBrowserWindow: function misc_getTopBrowserWindow() {
        return this.getTopWindowOfType("navigator:browser");
    },
    getTopWindowOfType: function misc_getTopWindowOfType(windowType) {
        let mediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        return mediator.getMostRecentWindow(windowType);
    },
    hiddenWindows: {
        get appWindow() {
            let hiddenWindow;
            try {
                hiddenWindow = Cc["@mozilla.org/appshell/appShellService;1"].getService(Ci.nsIAppShellService).hiddenDOMWindow;
            } catch (e) {
                Cu.reportError(e);
            }
            if (!hiddenWindow) {
                return null;
            }
            delete this.appWindow;
            return this.appWindow = hiddenWindow;
        },
        getFramePromise: function misc_getFramePromise(aFrameId, aFrameURL) {
            let deferred = promise.defer();
            if (!aFrameURL || typeof aFrameURL != "string") {
                deferred.reject(new TypeError("aFrameURL must be a string."));
                return deferred.promise;
            }
            let hiddenWindow = this.appWindow;
            if (!hiddenWindow) {
                deferred.reject();
                return deferred.promise;
            }
            let hiddenDoc = hiddenWindow.document;
            if (!hiddenDoc) {
                deferred.reject();
                return deferred.promise;
            }
            let id = aFrameId || btoa(aFrameURL);
            let frameLoader = hiddenDoc.getElementById(id);
            if (!frameLoader) {
                frameLoader = hiddenDoc.createElement("iframe");
                frameLoader.setAttribute("id", id);
                frameLoader.setAttribute("src", aFrameURL);
                hiddenDoc.documentElement.appendChild(frameLoader);
            }
            let contentWindow = frameLoader.contentWindow;
            sysutils.promiseSleep(10000, () => String(contentWindow.location) === aFrameURL).then(() => {
                sysutils.promiseSleep(100, () => contentWindow.document.readyState === "complete").then(() => deferred.resolve(frameLoader), () => deferred.reject(new Error("Can't get hidden window for \"" + aFrameURL + "\"")));
            });
            return deferred.promise;
        },
        removeFrame: function misc_removeFrame(aFrameId, aFrameURL) {
            if (!aFrameId && !aFrameURL) {
                throw new TypeError("Need frame id or frame url.");
            }
            let hiddenWindow = this.appWindow;
            if (!hiddenWindow) {
                return;
            }
            let hiddenDoc = hiddenWindow.document;
            if (!hiddenDoc) {
                return;
            }
            let id = aFrameId || btoa(aFrameURL);
            let frameLoader = hiddenDoc.getElementById(id);
            if (frameLoader) {
                frameLoader.parentNode.removeChild(frameLoader);
            }
        },
        getWindow: function misc_getWindow(aFrameURL) {
            let frameLoader = this.getFrame(null, aFrameURL);
            return frameLoader && frameLoader.contentWindow || null;
        }
    },
    openWindow: function misc_openWindow(parameters) {
        let window;
        if ("name" in parameters && parameters.name) {
            const WM = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            if (window = WM.getMostRecentWindow(parameters.name)) {
                window.focus();
                return window;
            }
        }
        let parent;
        let features = parameters.features || "";
        if (features.indexOf("__popup__") != -1) {
            let featuresHash = Object.create(null);
            let addFeature = function (aFeatureString) {
                let [
                    name,
                    value
                ] = aFeatureString.split("=");
                if (name && !(name in featuresHash)) {
                    featuresHash[name] = value;
                }
            };
            features.replace(/(^|,)__popup__($|,)/, "").split(",").forEach(addFeature);
            addFeature("chrome");
            addFeature("dependent=yes");
            if (sysutils.platformInfo.os.name != "windows") {
                addFeature("popup=yes");
            }
            let featuresMod = [];
            for (let [
                        name,
                        value
                    ] in Iterator(featuresHash)) {
                featuresMod.push(name + (value ? "=" + value : ""));
            }
            features = featuresMod.join(",");
            if (!("parent" in parameters)) {
                parent = this.getTopBrowserWindow();
            }
        }
        parent = parent || parameters.parent || null;
        const WW = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
        window = WW.openWindow(parent, parameters.url, parameters.name || "_blank", features, parameters.arguments || undefined);
        window.parameters = parameters;
        return window;
    },
    navigateBrowser: function misc_navigateBrowser(aNavigateData) {
        if (typeof aNavigateData != "object") {
            throw new Error("Navigation data object required.");
        }
        let url = aNavigateData.url;
        let uri = misc.tryCreateFixupURI(url);
        if (!uri) {
            throw new CustomErrors.EArgRange("url", "URL", url);
        }
        url = uri.spec;
        let postData = "postData" in aNavigateData && aNavigateData.postData || null;
        let referrer = "referrer" in aNavigateData && aNavigateData.referrer || null;
        if (typeof referrer === "string") {
            try {
                referrer = Services.io.newURI(referrer, null, null);
            } catch (e) {
                referrer = null;
            }
        }
        let loadInBackground = "loadInBackground" in aNavigateData ? aNavigateData.loadInBackground : false;
        if (typeof loadInBackground !== "boolean") {
            throw new CustomErrors.EArgRange("loadInBackground", "Boolean", loadInBackground);
        }
        let sourceWindow = aNavigateData.sourceWindow || misc.getTopBrowserWindow();
        if (!sourceWindow) {
            return {
                tab: null,
                window: this.openNewBrowser(url, referrer, null)
            };
        }
        if (postData instanceof Ci.nsIMIMEInputStream) {
            let postDataString = "";
            try {
                let size = postData.available();
                let cvstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
                cvstream.init(postData, "UTF-8", size, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
                let data = {};
                cvstream.readString(size, data);
                postDataString = data.value;
                cvstream.close();
            } catch (ex) {
                Cu.reportError(ex);
            }
            postData = postDataString.split("\r\n").pop();
        }
        let tab = null;
        let window = sourceWindow;
        if (postData) {
            switch (aNavigateData.target) {
            case "new tab":
            case "new window":
                tab = sourceWindow.gBrowser.loadOneTab(null, null, null, null, loadInBackground);
                break;
            default:
                tab = sourceWindow.gBrowser.selectedTab;
                break;
            }
            let frameScript = function (url, referrer, postData) {
                referrer = referrer || null;
                if (referrer) {
                    try {
                        referrer = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(referrer, null, null);
                    } catch (e) {
                        referrer = null;
                    }
                }
                let stringStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
                stringStream.data = postData;
                let postStream = Components.classes["@mozilla.org/network/mime-input-stream;1"].createInstance(Components.interfaces.nsIMIMEInputStream);
                postStream.addHeader("Content-Type", "application/x-www-form-urlencoded");
                postStream.addContentLength = true;
                postStream.setData(stringStream);
                let webNavigation = docShell.QueryInterface(Components.interfaces.nsIWebNavigation);
                webNavigation.loadURI(url, null, referrer, postStream, null);
            };
            let escapeSingleQuotes = str => {
                return ("'" + (str || "").replace(/'/g, "\\'") + "'").replace(/''/g, "") || "''";
            };
            let frameScriptURL = "data:application/javascript;charset=utf-8," + encodeURIComponent("(" + frameScript.toSource() + ")(" + [
                url,
                referrer && referrer.spec,
                postData
            ].map(escapeSingleQuotes) + ")");
            tab.linkedBrowser.messageManager.loadFrameScript(frameScriptURL, false);
        } else {
            switch (aNavigateData.target) {
            case "new tab":
                tab = sourceWindow.gBrowser.loadOneTab(url, referrer, null, null, loadInBackground);
                break;
            case "new window":
                window = sourceWindow.openNewWindowWith(url, null, null, false, referrer);
                break;
            default:
                sourceWindow.gBrowser.loadURI(url, referrer, null, false);
                tab = sourceWindow.gBrowser.selectedTab;
                break;
            }
        }
        return {
            tab: tab,
            window: window
        };
    },
    openNewBrowser: function misc_openNewBrowser(url, referrer, postData) {
        let sa = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
        let wuri = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
        wuri.data = url;
        sa.AppendElement(wuri);
        sa.AppendElement(null);
        sa.AppendElement(referrer);
        sa.AppendElement(postData);
        let allowThirdPartyFixupSupports = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
        allowThirdPartyFixupSupports.data = false;
        sa.AppendElement(allowThirdPartyFixupSupports);
        let windowWatcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
        return windowWatcher.openWindow(null, "chrome://browser/content/browser.xul", null, "chrome,dialog=no,all", sa);
    },
    tryCreateFixupURI: function misc_tryCreateFixupURI(aString) {
        let URIFixup = Cc["@mozilla.org/docshell/urifixup;1"].getService(Ci.nsIURIFixup);
        try {
            return URIFixup.createFixupURI(aString, URIFixup.FIXUP_FLAG_NONE);
        } catch (e) {
            return null;
        }
    },
    get mostRecentBrowserWindow() {
        return Services.wm.getMostRecentWindow("navigator:browser");
    },
    mapKeysToArray: function misc_mapKeysToArray(map, filter) {
        let arr = Object.keys(map);
        if (filter) {
            arr = arr.filter(function (val) {
                return filter(val);
            });
        }
        return arr;
    },
    mapValsToArray: function misc_mapValsToArray(map, filter) {
        let arr = [];
        for (let [
                    key,
                    val
                ] in Iterator(map)) {
            if (!filter || filter(key)) {
                arr.push(val);
            }
        }
        return arr;
    },
    invertMap: function misc_invertMap(map) {
        let result = {};
        for (let [
                    key,
                    value
                ] in Iterator(map)) {
            result[value] = key;
        }
        return result;
    },
    separateItems: function misc_separateItems(input, check) {
        if (typeof check != "function") {
            throw new CustomErrors.EArgType("check", "Function", check);
        }
        let trueList = [];
        let falseList = [];
        (input || []).forEach(function (item) {
            (check(item) ? trueList : falseList).push(item);
        });
        return [
            trueList,
            falseList
        ];
    },
    crypto: function () {
        const UTF8_CONV = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        UTF8_CONV.charset = "UTF-8";
        const DIGEST_TYPE_MAP = {
            hex: function (hash) {
                return Hash.binaryToHex(this.binary(hash));
            },
            binary: function (hash) {
                return hash.finish(false);
            },
            base64: function (hash) {
                return hash.finish(true);
            }
        };
        function Hash(algorithm) {
            this._hash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
            this._hash.initWithString(algorithm.toUpperCase());
        }
        Hash.prototype.updateFromBuffer = function (data, size) {
            size = size || data.byteLength;
            if (size) {
                this._hash.update(data, size);
            }
            return this;
        };
        Hash.prototype.updateFromStream = function (stream, size) {
            size = size || stream.available();
            if (size) {
                this._hash.updateFromStream(stream, size);
            }
            return this;
        };
        Hash.prototype.update = function (data, encoding) {
            if (encoding === "binary") {
                let buf = Hash.binaryToBuffer(data);
                return this.updateFromBuffer(buf);
            }
            let stream = UTF8_CONV.convertToInputStream(data);
            return this.updateFromStream(stream);
        };
        Hash.prototype.digest = function (type) {
            return DIGEST_TYPE_MAP[type.toLowerCase()](this._hash);
        };
        Hash.binaryToBuffer = function (binStr) {
            let i = binStr.length;
            let uint = new Uint8Array(i);
            while (i--) {
                uint[i] = binStr.charCodeAt(i);
            }
            return uint.buffer;
        };
        Hash.binaryToHex = function (binStr) {
            let hexStr = "";
            let code;
            for (var i = 0, ln = binStr.length; i < ln; i++) {
                code = binStr.charCodeAt(i);
                if (code < 16) {
                    hexStr += "0";
                }
                hexStr += code.toString(16);
            }
            return hexStr;
        };
        return {
            createHash: function (algorithm) {
                return new Hash(algorithm);
            }
        };
    }(),
    parseLocale: function misc_parseLocale(localeString) {
        let components = localeString.match(this._localePattern);
        if (components) {
            return {
                language: components[1],
                country: components[3],
                region: components[5]
            };
        }
        return null;
    },
    findBestLocalizedValue: function misc_findBestLocalizedValue(map, forLocale) {
        const lpWeights = {
            language: 32,
            empty: 16,
            en: 8,
            ru: 4,
            country: 2,
            region: 1
        };
        let results = Object.keys(map).map(function (key) {
            let weight = 0;
            if (key) {
                let locale = misc.parseLocale(key);
                for (let partName in lpWeights) {
                    if (partName in locale) {
                        let localePart = locale[partName];
                        if (partName == "language") {
                            if (localePart in lpWeights) {
                                weight += lpWeights[localePart];
                            }
                        }
                        if (localePart === forLocale[partName]) {
                            weight += lpWeights[partName];
                        }
                    }
                }
            } else {
                weight = lpWeights.empty;
            }
            return {
                key: key,
                weight: weight
            };
        });
        results.sort(function rule(a, b) {
            return b.weight - a.weight;
        });
        return results[0] && map[results[0].key];
    },
    _localePattern: /^([a-z]{2})(-([A-Z]{2})(-(\w{2,5}))?)?$/
};
