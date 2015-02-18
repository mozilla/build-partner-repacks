EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    app.config = {
        useClickStatistics: true,
        observeBranding: false,
        uniqueWidget: true,
        statName: "newstr",
        navigateUrl: { home: "http://haber.yandex.com.tr/" }
    };
    var SLICE_URL = "content/slice/news.html";
    var slice = null;
    var sliceStartupData = null;
    var sliceOpen = false;
    var msgPopup = { message: "before-popup" };
    var msgHide = { message: "before-hide" };
    app.init = function () {
        this.log("*** init");
    };
    app.finalize = function () {
        this.destroySlice();
    };
    app.uiCommands = {
        "show": function (command, eventData) {
            if (!slice) {
                sliceStartupData = eventData;
                slice = common.ui.createSlice({ url: SLICE_URL }, this);
            } else {
                if (!sliceStartupData) {
                    this.showSlice(eventData.widget);
                }
            }
        }
    };
    app.sliceCommands = {
        "load": function (topic, data) {
            if (sliceStartupData) {
                this.showSlice(sliceStartupData.widget);
            }
            sliceStartupData = null;
        },
        "timeout": function () {
            this.log("destroySlice by timer");
            this.destroySlice();
        }
    };
    app.destroySlice = function () {
        if (slice) {
            slice.destroy();
            slice = null;
            sliceOpen = false;
        }
    };
    app.showSlice = function (widget) {
        this.log("showSlice");
        if (slice && !sliceOpen) {
            sliceOpen = true;
            slice.notify(msgPopup);
            slice.show(widget, function onHide() {
                sliceOpen = false;
                slice.notify(msgHide);
            });
        }
    };
};
