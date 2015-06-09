"use strict";
const EXPORTED_SYMBOLS = ["core"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
const core = {
    api: null,
    init: function Geolocation_init(api) {
        this.api = api;
        YaGeolocation.startup();
    },
    finalize: function Geolocation_finalize() {
        YaGeolocation.shutdown();
        delete this.api;
    }
};
const YaGeolocation = {
    GEO_API_VERSION: "1.2",
    GEO_URL: "http://wi2geo.mobile.yandex.net/getlocation",
    GEO_KEY: "AQIAAHBWEoNf/VB4O81cL2HOFJvtdNtP",
    TRUSTED_DOMAINS: [
        ".ya.ru",
        ".yandex.ru",
        ".yandex.kz",
        ".yandex.ua",
        ".yandex.by",
        ".yandex.com",
        ".yandex.com.tr",
        ".moikrug.ru"
    ],
    UPDATE_INTERVAL: 10 * 60 * 1000,
    _updated: false,
    wifi: "",
    lastWifi: "",
    lastIP: "",
    position: null,
    _watchingTimer: null,
    get WifiMonitorService() {
        delete this.WifiMonitorService;
        return this.WifiMonitorService = Cc["@mozilla.org/wifi/monitor;1"].getService(Ci.nsIWifiMonitor);
    },
    get DNSService() {
        delete this.DNSService;
        return this.DNSService = Cc["@mozilla.org/network/dns-service;1"].getService(Ci.nsIDNSService);
    },
    get PrefsModule() {
        return core.api.Settings.PrefsModule;
    },
    get prefBranchPath() {
        delete this.prefBranchPath;
        return this.prefBranchPath = core.api.Settings.getComponentBranchPath();
    },
    getPref: function YaGeolocation_getPref(aName, aDefaultValue) {
        let defValue = arguments.length == 1 ? "" : aDefaultValue;
        return this.PrefsModule.get(this.prefBranchPath + aName, defValue);
    },
    setPref: function YaGeolocation_setPref(aName, aValue) {
        return this.PrefsModule.set(this.prefBranchPath + aName, aValue);
    },
    startup: function YaGeolocation_startup() {
        let dataStr = this.getPref("position");
        let savedPosition = null;
        try {
            savedPosition = JSON.parse(dataStr);
        } catch (e) {
        }
        if (savedPosition) {
            this.position = savedPosition;
            this.wifi = this.lastWifi = this.getPref("wifi.data");
        }
        this.lastIP = this.getPref("ip");
        this.startWatching();
        this.log("Startup\nSaved position: " + dataStr + "\nWiFi: " + this.wifi + "\nLast IP: " + this.lastIP);
    },
    shutdown: function YaGeolocation_shutdown() {
        this.stopWatching();
        this.log("Shutdown");
    },
    getLocalIP: function YaGeolocation_getLocalIP() {
        let defer = new core.api.Promise.defer();
        try {
            let dnsListener = {
                onLookupComplete: function DNSListener_onLookupComplete(aRequest, aRecord, aStatus) {
                    let ipAddress = "";
                    if (Components.isSuccessCode(aStatus) && aRecord) {
                        while (!ipAddress && aRecord.hasMore()) {
                            let ip = aRecord.getNextAddrAsString();
                            if (ip.indexOf(":") === -1) {
                                ipAddress = ip;
                            }
                        }
                    }
                    defer.resolve(ipAddress);
                }
            };
            this.DNSService.asyncResolve(this.DNSService.myHostName, 0, dnsListener, Services.tm.currentThread);
        } catch (e) {
            defer.resolve("");
        }
        new core.api.SysUtils.Timer(function () {
            defer.resolve("");
        }, 1000);
        return defer.promise;
    },
    startWatching: function YaGeolocation_startWatching() {
        if (this._watchingTimer) {
            return;
        }
        this._watchingTimer = new core.api.SysUtils.Timer(this.update.bind(this), 500, this.UPDATE_INTERVAL);
        this.WifiMonitorService.startWatching(this);
        this.log("Start watching.");
    },
    stopWatching: function YaGeolocation_stopWatching() {
        if (!this._watchingTimer) {
            return;
        }
        this._watchingTimer.cancel();
        this._watchingTimer = null;
        this.WifiMonitorService.stopWatching(this);
        this.removeCookies();
    },
    updateWiFi: function YaGeolocation_updateWiFi(aWifiString) {
        this.log("Update WiFi: " + aWifiString);
        this.wifi = aWifiString;
        if (!this._updated) {
            this.update();
        }
    },
    update: function YaGeolocation_update() {
        this.getLocalIP().then(function (localIP) {
            let ipChanged = localIP != this.lastIP;
            this.log("Update on timer. Current IP = '" + localIP + "', prev IP = '" + this.lastIP + "'.");
            if (ipChanged) {
                this.lastIP = localIP;
                this.setPref("ip", localIP);
            }
            let lastPositionTimestamp = this.position && this.position.timestamp || 0;
            let isOldPosition = Math.abs(lastPositionTimestamp - Date.now()) > 60 * 30 * 1000;
            if (isOldPosition || !this.wifi || !this.equalWiFi(this.wifi, this.lastWifi)) {
                this.lastWifi = this.wifi;
                if (!this.wifi && !ipChanged && !isOldPosition) {
                    this._updated = false;
                    this.setCookies();
                    return;
                }
                this._updated = true;
                this.getPositionByWiFi();
            } else {
                this._updated = false;
                this.setCookies();
            }
        }.bind(this));
    },
    equalWiFi: function YaGeolocation_equalWiFi(wifi1, wifi2) {
        let arr1 = wifi1.split(",");
        let arr2 = wifi2.split(",");
        if (arr1.length != arr2.length) {
            return false;
        }
        for (let i = 1, len = arr1.length; i < len; i += 3) {
            if (arr1[i] != arr2[i]) {
                return false;
            }
        }
        return true;
    },
    getPositionByWiFi: function YaGeolocation_getPositionByWiFi() {
        let params = [
            "version=" + this.GEO_API_VERSION,
            "apikey=" + encodeURIComponent(this.GEO_KEY)
        ];
        if (this.wifi) {
            params.push("wifinetworks=" + encodeURIComponent(this.wifi));
        }
        params.push("nogeocode");
        let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
        request.open("POST", this.GEO_URL, true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.setRequestHeader("Connection", "close");
        let requestCallback = this.getPositionByWiFiCallback.bind(this);
        let target = request.QueryInterface(Ci.nsIDOMEventTarget);
        target.addEventListener("load", requestCallback, false);
        target.addEventListener("error", requestCallback, false);
        target.addEventListener("abort", requestCallback, false);
        request.send(params.join("&"));
        this.log("Get position by WiFi.\nPost data:\n" + params.join("\n"));
    },
    getPositionByWiFiCallback: function YaGeolocation_getPositionByWiFiCallback(aRequest) {
        try {
            this.log("wi2geo response: " + aRequest.target.responseText);
        } catch (e) {
            this.log("wi2geo response: [error]");
        }
        let dataElement;
        try {
            dataElement = aRequest.target.responseXML.querySelector("iamhere");
        } catch (e) {
        }
        if (!dataElement) {
            return;
        }
        let position = Object.create(null);
        [
            "latitude",
            "longitude",
            "precision"
        ].forEach(function (positionProp) {
            let element = dataElement.querySelector(positionProp);
            let propValue = element && element.textContent;
            if (!propValue) {
                return;
            }
            position[positionProp] = propValue;
        }, this);
        position.timestamp = Date.now();
        this.position = position;
        this.setPref("position", JSON.stringify(position));
        this.log("Get position by WiFi callback\nPosition: " + JSON.stringify(position));
        this.setCookies();
    },
    setCookies: function YaGeolocation_setCookies(aSubCookieValue) {
        let debugInfo = [];
        this.TRUSTED_DOMAINS.forEach(function (aDomain) {
            let exsistCookieValue = core.api.Network.findCookieValue("http://" + aDomain.replace(/^\./, ""), "ys", false, true, true);
            let newCookieValue = this.parseCookie(decodeURIComponent(exsistCookieValue) || "", aSubCookieValue);
            const MAX_EXPIRY = Math.pow(2, 62);
            if (newCookieValue.length) {
                Services.cookies.add(aDomain, "/", "ys", newCookieValue, false, false, true, MAX_EXPIRY);
            } else {
                Services.cookies.remove(aDomain, "ys", "/", false);
            }
            debugInfo.push(aDomain + ": " + newCookieValue);
        }, this);
        this.log("Set cookies:\n" + debugInfo.join("\n"));
    },
    removeCookies: function YaGeolocation_removeCookies() {
        this.log("Remove cookies");
        this.setCookies("");
    },
    parseCookie: function YaGeolocation_parseCookie(aCookieContainerStr, aSubCookieValue) {
        let gpCookieText = typeof aSubCookieValue == "undefined" ? this.getCookieText() : aSubCookieValue;
        let ySubCookies = aCookieContainerStr.split("#");
        let found = false;
        if (gpCookieText !== null) {
            for (let i = ySubCookies.length; i--;) {
                if (ySubCookies[i].indexOf("gpauto.") === 0) {
                    found = true;
                    ySubCookies[i] = gpCookieText;
                    break;
                }
            }
        }
        if (!found && gpCookieText) {
            ySubCookies.push(gpCookieText);
        }
        return ySubCookies.filter(Boolean).join("#");
    },
    getCookieText: function YaGeolocation_getCookieText() {
        let position = this.position;
        if (position) {
            try {
                let value = [
                    position.latitude,
                    position.longitude,
                    position.precision,
                    "1",
                    parseInt(Date.now() / 1000, 10)
                ].join(":").replace(/\./g, "_");
                return "gpauto." + encodeURIComponent(value);
            } catch (e) {
            }
        }
        return null;
    },
    onChange: function YaGeolocation_onChange(aAccessPoints) {
        let wifiData = aAccessPoints.map(function (aPoint, aIndex) {
            return [
                aIndex,
                aPoint.mac.replace(/\-/g, ":"),
                aPoint.signal
            ].join(",");
        }).join(",");
        let lastWifiData = this.getPref("wifi.data");
        if (wifiData == lastWifiData) {
            return;
        }
        this.setPref("wifi.data", wifiData);
        this.updateWiFi(wifiData);
    },
    onError: function YaGeolocation_onError(aValue) {
        this.log("Wifi scan error: " + aValue);
    },
    QueryInterface: function YaGeolocation_QueryInterface(iid) {
        if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIWifiListener)) {
            return this;
        }
        throw Cr.NS_ERROR_NO_INTERFACE;
    },
    log: function YaGeolocation_log(aMessage) {
        if (core.api) {
            core.api.logger.trace(aMessage);
        }
    }
};
