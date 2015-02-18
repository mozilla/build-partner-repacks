"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    results: Cr
} = Components;
const resources = { browser: { styles: ["/native/fx/town/styles/browser.css"] } };
const WIDGET_NAME = "http://bar.yandex.ru/packages/yandexbar#town";
const core = {
    init: function TownWidget_init(api) {
        this._api = api;
        this._pkgRootURL = this.API.Package.resolvePath("/");
    },
    finalize: function TownWidget_finalize() {
        this._slicesAndData = Object.create(null);
        this._api = null;
        this._pkgRootURL = null;
    },
    buildWidget: function TownWidget_buildWidget(WIID, toolbarItem) {
        toolbarItem.setAttribute("yb-native-widget-name", WIDGET_NAME);
        toolbarItem.setAttribute("yb-native-widget-wiid", WIID);
        toolbarItem.module = this;
        this._createInstSlices(WIID);
    },
    destroyWidget: function TownWidget_destroyWidget(WIID, toolbarItem) {
        if ("wdgtxDestructor" in toolbarItem) {
            toolbarItem.wdgtxDestructor();
        }
        delete toolbarItem.module;
    },
    onNoMoreInstProjections: function TownWidget_onNoMoreInstProjections(WIID) {
        this._destroyInstSlices(WIID);
    },
    get API() {
        return this._api;
    },
    get defaultTownIconPath() {
        return this._pkgRootURL + "native/fx/town/town.svg";
    },
    get defaultWeatherIconPath() {
        return this._pkgRootURL + "native/fx/town/images/weather/offline.svg";
    },
    getTitle: function TownWidget_getTitle(WIID) {
        let data = this.getWeatherData(WIID);
        return data && data.title || null;
    },
    getWeatherData: function TownWidget_getWeatherData(WIID) {
        let data = this._slicesAndData[WIID] && this._slicesAndData[WIID].data;
        return data && data.weather || null;
    },
    getWeatherSlice: function TownWidget_getWeatherSlice(WIID) {
        return this._slicesAndData[WIID] && this._slicesAndData[WIID].weatherSlice || null;
    },
    getTrafficData: function TownWidget_getTrafficData(WIID) {
        let data = this._slicesAndData[WIID] && this._slicesAndData[WIID].data;
        return data && data.traffic || null;
    },
    getTrafficSlice: function TownWidget_getTrafficSlice(WIID) {
        return this._slicesAndData[WIID] && this._slicesAndData[WIID].trafficSlice || null;
    },
    manualUpdate: function TownWidget_manualUpdate(WIID) {
        let weatherSlice = this.getWeatherSlice(WIID);
        if (weatherSlice) {
            weatherSlice.notify({ message: "update" });
        }
        let trafficSlice = this.getTrafficSlice(WIID);
        if (trafficSlice) {
            trafficSlice.notify({ message: "update" });
        }
    },
    navigateToService: function TownWidget_navigateToService(WIID, serviceName, event) {
        let slice;
        switch (serviceName) {
        case "weather":
            slice = this.getWeatherSlice(WIID);
            break;
        case "traffic":
            slice = this.getTrafficSlice(WIID);
            break;
        default:
            throw new Error("Unknown service name");
        }
        if (!slice) {
            return;
        }
        let target = event.shiftKey ? "new window" : "new tab";
        slice.notify({
            message: "navigate",
            data: target
        });
    },
    _slicesAndData: Object.create(null),
    get _weatherSliceURL() {
        return this._pkgRootURL + "native/fx/town/slice-w/index.html";
    },
    get _trafficSliceURL() {
        return this._pkgRootURL + "native/fx/town/slice-t/index.html";
    },
    _createInstSlice: function TownWidget__createInstSlice(aType, WIID) {
        if (!(WIID in this._slicesAndData)) {
            this._slicesAndData[WIID] = Object.create(null);
            this._slicesAndData[WIID].data = Object.create(null);
        }
        switch (aType) {
        case "weather":
            if (!this._slicesAndData[WIID].weatherSlice) {
                this._slicesAndData[WIID].weatherSlice = this.API.Controls.createSlice({
                    url: this._weatherSliceURL,
                    messageHandler: this._messageHandler.bind(this, WIID)
                }, WIID);
            }
            break;
        case "traffic":
            if (!this._slicesAndData[WIID].trafficSlice) {
                this._slicesAndData[WIID].trafficSlice = this.API.Controls.createSlice({
                    url: this._trafficSliceURL,
                    messageHandler: this._messageHandler.bind(this, WIID)
                }, WIID);
            }
            break;
        }
    },
    _destroyInstSlice: function TownWidget__destroyInstSlice(aType, WIID) {
        this._api.logger.debug("Destroying '" + aType + "' slice for WIID " + WIID);
        let slicesAndData = this._slicesAndData[WIID];
        if (!slicesAndData) {
            return;
        }
        switch (aType) {
        case "weather":
            let weatherSlice = slicesAndData.weatherSlice;
            if (weatherSlice) {
                weatherSlice.destroy();
                delete slicesAndData.weatherSlice;
            }
            break;
        case "traffic":
            let trafficSlice = slicesAndData.trafficSlice;
            if (trafficSlice) {
                trafficSlice.destroy();
                delete slicesAndData.trafficSlice;
            }
            break;
        }
    },
    _createInstSlices: function TownWidget__createInstSlices(WIID) {
        this._createInstSlice("weather", WIID);
        this._createInstSlice("traffic", WIID);
    },
    _destroyInstSlices: function TownWidget__destroyInstSlices(WIID) {
        this._destroyInstSlice("weather", WIID);
        this._destroyInstSlice("traffic", WIID);
        delete this._slicesAndData[WIID];
    },
    _messageHandler: function TownWidget__messageHandler(WIID, aMessage) {
        if (!(WIID in this._slicesAndData)) {
            this._slicesAndData[WIID] = Object.create(null);
            this._slicesAndData[WIID].data = Object.create(null);
        }
        let data = this._slicesAndData[WIID].data;
        let messageData = aMessage.data || {};
        switch (aMessage.message) {
        case "weather:data": {
                let weatherIcon = messageData.image;
                if (weatherIcon) {
                    let iconFilePath = "native/fx/town/slice-w/images/svg16/" + weatherIcon + ".svg";
                    if (this.API.Package.fileExists(iconFilePath)) {
                        weatherIcon = this._pkgRootURL + iconFilePath;
                    }
                }
                data.weather = {
                    title: messageData.title || "",
                    temperature: messageData.temperature || "",
                    image: weatherIcon || this.defaultWeatherIconPath
                };
                break;
            }
        case "weather:error":
            data.weather = null;
            break;
        case "weather:loading":
            if (messageData.sender === "options") {
                data.weather = null;
            }
            break;
        case "traffic:data": {
                let iconFilePath = "native/fx/town/images/traffic/" + messageData.ball + ".svg";
                if (!this.API.Package.fileExists(iconFilePath)) {
                    iconFilePath = "native/fx/town/images/traffic/gray.svg";
                }
                let trafficIcon = this._pkgRootURL + iconFilePath;
                data.traffic = {
                    level: messageData.ball,
                    image: trafficIcon
                };
                break;
            }
        case "traffic:error":
            data.traffic = null;
            break;
        case "traffic:loading":
            if (messageData.sender === "options") {
                data.traffic = null;
            }
            break;
        }
        this.API.Controls.getAllWidgetItemsOfInstance(WIID).forEach(function (item) {
            if ("updateTitle" in item) {
                item.updateTitle();
            }
            if ("updateWeatherData" in item) {
                item.updateWeatherData();
            }
            if ("updateTrafficData" in item) {
                item.updateTrafficData();
            }
        });
    }
};
