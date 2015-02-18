EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        common.log("[dialog]: " + str);
    }
    function logObj(ob, str) {
        common.logObj(ob, "[dialog]: " + (str || ""));
    }
    function logr(str) {
        common.logr("[dialog]: " + str);
    }
    function getErrorText(error, data, id) {
        switch (error) {
        case "url":
            return app.entities.text("dialog.addstation.error-url");
        case "exists":
            return app.entities.text("dialog.addstation.prefix") + data.name + app.entities.text("dialog.addstation.error2") + "<br />" + app.entities.text("dialog.addstation.error3");
        }
    }
    function createAdapter() {
        var handlers = null;
        var stor = common.storage("dlg.json");
        return {
            startCommand: "",
            on: function (cb) {
                handlers = cb;
            },
            getLocalizedString: function (key) {
                return app.entities.text(key);
            },
            getPlayState: function () {
                return app.player.isPlay;
            },
            getAll: function () {
                var ret = [];
                app.stations.forEach(function (s, current) {
                    ret.push({
                        id: s.id,
                        name: s.name,
                        url: s.url,
                        current: current
                    });
                });
                return ret;
            },
            newName: function () {
                return app.entities.text("dialog.addstation.prefix") + app.stations.autocount();
            },
            play: function (id, state) {
                log("play " + id + " " + state);
                if (state) {
                    app.stations.setCurrentStation(id, true);
                } else {
                    app.player.pause();
                }
            },
            add: function (data) {
                return getErrorText(app.stations.addStation(data.name, data.url, data.play), data, "");
            },
            edit: function (id, data) {
                return getErrorText(app.stations.editStation(id, data.name, data.url, data.play), data, id);
            },
            remove: function (id) {
                app.stations.removeStation(id);
            },
            getChBoxPlay: function () {
                return stor.chbPlay == null ? true : stor.chbPlay;
            },
            saveChBoxPlay: function (value) {
                stor.save("chbPlay", value);
            },
            __cmdToSlice: function (t, d) {
                handlers[t](d, t);
            }
        };
    }
    var microbrowserWindow = null;
    var mbModule = null;
    var mod = {
        init: function () {
            mbModule = app.commonModule("microbrowser");
            this.adapter = createAdapter();
        },
        show: function (add) {
            if (!microbrowserWindow) {
                this.adapter.startCommand = add ? "add" : "";
                microbrowserWindow = mbModule.open({
                    features: "chrome,centerscreen,width=660,height=400",
                    url: "content/slice/index.html",
                    title: app.entities.get("dialog.settings.title"),
                    adapter: this.adapter,
                    onclose: function () {
                        log("[dialog]: close");
                        microbrowserWindow = null;
                    }
                });
            } else {
                microbrowserWindow.focus();
                if (add) {
                    this.command("addDialog");
                }
            }
        },
        command: function (t, d) {
            logObj(d, "command: " + t);
            if (microbrowserWindow) {
                this.adapter.__cmdToSlice(t, d);
            }
        }
    };
    return mod;
};
