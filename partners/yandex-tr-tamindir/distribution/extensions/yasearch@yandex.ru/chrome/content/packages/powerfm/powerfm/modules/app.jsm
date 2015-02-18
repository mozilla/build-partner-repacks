EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    app.config = {
        statName: "ipower",
        useClickStatistics: false,
        navigateUrl: { home: "http://www.powerfm.com.tr/" }
    };
    var SLICE_URL = "content/slice/index.html";
    app.init = function () {
        this.log("*** init");
        this._slice = common.ui.createSlice({ url: SLICE_URL }, this);
    };
    app.finalize = function () {
        this.log("*** finalize");
        this._slice.destroy();
    };
    app.uiCommands = {
        show: function (command, eventData) {
            this._slice.show(eventData.widget);
        }
    };
    app.sliceCommands = {
        state: function (topic, data) {
        },
        getWidgetData: function (topic, data, callback) {
            this.log("app: getWidgetData");
            callback("widget data");
        }
    };
};
