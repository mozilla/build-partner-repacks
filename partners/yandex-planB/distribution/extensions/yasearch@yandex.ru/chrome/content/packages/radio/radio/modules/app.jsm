EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    app.config = {
        useClickStatistics: true,
        observeBranding: false,
        uniqueWidget: true,
        navigateUrl: { gfp: "http://www.adobe.com/go/getflashplayer" },
        stations: "def.json",
        branding: { tb: { stations: "tb.json" } }
    };
    function stationStr(st) {
        return JSON.stringify(st);
    }
    app.init = function () {
        this.log("*** init");
        this.player = this.importModule("player");
        this.stations = this.importModule("stations");
        this.dialog = this.importModule("dialog");
        this.stations.init(common.utils.bind(this, stationsObserver));
        this.player.init(common.utils.bind(this, playerObserver));
        this.player.setCurrentUrl(this.stations.getCurrentUrl());
        this.dialog.init();
    };
    app.finalize = function () {
        this.log("*** finalize");
    };
    var stationsObserver = {
        onAdd: function (st, play) {
            common.observerService.notify("add", stationStr(st));
            this.dialog.command("add", st);
            if (play) {
                this.stations.setCurrentStation(st.id, true);
            }
        },
        onEdit: function (st, changeCU, play) {
            common.observerService.notify("edit", stationStr(st));
            this.dialog.command("edit", st);
            if (changeCU) {
                this.player.setCurrentUrl(st.url);
            }
            if (play) {
                this.stations.setCurrentStation(st.id, true);
            }
        },
        onRemove: function (st) {
            common.observerService.notify("remove", st.id);
            this.dialog.command("remove", st.id);
        },
        onPlayCurrent: function () {
            this.player.play();
        },
        onChangeCurrent: function (st, oldId, start) {
            common.observerService.notify("current", JSON.stringify([
                oldId || "",
                st ? st.id : ""
            ]));
            this.player.setCurrentUrl(st && st.url, start);
            this.dialog.command("current", {
                id: st && st.id,
                old: oldId
            });
        },
        onUpdate: function (changeCurrent) {
            if (changeCurrent) {
                var st = this.stations.getCurrentStation();
                this.player.setCurrentUrl(st && st.url);
            }
            common.observerService.notify("list");
            this.dialog.command("list");
        }
    };
    var playerObserver = {
        onState: function (changePlay) {
            common.observerService.notify("state");
            if (changePlay) {
                this.dialog.command("play", this.player.isPlay);
            }
        }
    };
    app.uiCommands = {
        "toggle": function (command, eventData) {
            this.player.toggle();
        },
        "add": function (command) {
            this.dialog.show("add");
        },
        "list": function (command) {
            this.dialog.show();
        },
        "stationClick": function (command, eventData) {
            this.stations.setCurrentStation(eventData.param, true);
        },
        "gfp": function (command, eventData) {
            if (!common.utils.flashDetect()) {
                return true;
            }
            common.observerService.notify("flash");
        }
    };
};
