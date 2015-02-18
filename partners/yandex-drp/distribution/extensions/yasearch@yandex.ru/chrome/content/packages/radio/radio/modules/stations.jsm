EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        common.log("[stations]: " + str);
    }
    function logObj(ob, str) {
        common.logObj(ob, "[stations]: " + (str || ""));
    }
    function logr(str) {
        common.logr("[stations]: " + str);
    }
    var UPDATE_INTERVAL = 24 * 60 * 60 * 1000;
    var storage, bridStor, storageUpdating = false;
    function initStorage() {
        var brID = common.branding.getBrandId();
        var oldSt = storage.settings;
        if (!storage.branding) {
            storage.branding = {};
        }
        lblInit:
            if (!storage.branding[brID]) {
                log("!storage.branding[brID]");
                if (oldSt) {
                    log("copy from storage.settings");
                    var firstStationId = "";
                    storage.branding[brID] = oldSt;
                    for (var i = oldSt.stations.length - 1; i >= 0; --i) {
                        if (!oldSt.stations[i].isDeleted) {
                            if (oldSt.stations[i].name == oldSt.selected) {
                                storage.branding[brID].selected = oldSt.stations[i].id;
                                break lblInit;
                            }
                            firstStationId = oldSt.stations[i].id;
                        }
                    }
                    storage.branding[brID].selected = firstStationId;
                } else {
                    log("copy from app.config.settings");
                    storage.branding[brID] = common.utils.readFile("stations/" + app.config.stations, "json");
                }
            }
        delete storage.settings;
        bridStor = storage.branding[brID];
        logObj(storage);
    }
    function findStationIndex(stor, id, withDel) {
        if (!id) {
            return -1;
        }
        for (var j = 0; j < stor.stations.length; ++j) {
            var station = stor.stations[j];
            if (id == station.id && (withDel || !station.isDeleted)) {
                return j;
            }
        }
        return -1;
    }
    function findStationIndexByName(stor, name, ignoreId) {
        if (!name) {
            return -1;
        }
        for (var j = 0; j < stor.stations.length; ++j) {
            var station = stor.stations[j];
            if (station.name === name && station.id !== ignoreId && !station.isDeleted) {
                return j;
            }
        }
        return -1;
    }
    function updateStorage() {
        if (storageUpdating) {
            return;
        }
        var stor = bridStor;
        if (Date.now() - (stor.updated || 0) < UPDATE_INTERVAL) {
            return;
        }
        common.http.GET({
            url: "http://export." + common.branding.getDomain() + "/bar/radio.xml?brid=" + common.branding.getBrandId(),
            responseType: "json",
            end: function () {
                storageUpdating = false;
            },
            callback: function (obj) {
                if (obj) {
                    logObj(obj, "stations data from server:");
                    logObj(stor, "current storage:");
                    stor.updated = Date.now();
                    if (obj.ver == stor.ver) {
                        log("obj.ver == stor.ver");
                        storage.save();
                        return;
                    }
                    var i, fi, changed = false, oldCurrentId = stor.selected || "";
                    if (obj.deadStations) {
                        for (i = 0; i < obj.deadStations.length; ++i) {
                            fi = findStationIndex(stor, obj.deadStations[i], true);
                            log("delete id " + obj.deadStations[i] + ", index = " + fi);
                            if (fi >= 0) {
                                if (stor.selected == obj.deadStations[i]) {
                                    stor.selected = "";
                                }
                                log("stor.stations.splice(fi, 1);");
                                stor.stations.splice(fi, 1);
                                changed = true;
                            }
                        }
                    }
                    for (i = 0; i < obj.stations.length; ++i) {
                        var st = obj.stations[i];
                        var saved = mod.findStation(st.id);
                        if (saved) {
                            if (!saved.stUserUrl && saved.url != st.url) {
                                saved.url = st.url;
                                changed = true;
                            }
                            if (!saved.stUserName && saved.name != st.name) {
                                saved.name = st.name;
                                changed = true;
                            }
                        } else {
                            stor.stations.push(st);
                            changed = true;
                        }
                    }
                    stor.ver = obj.ver;
                    var changeCurrent = false;
                    if (changed) {
                        changeCurrent = stor.selected != oldCurrentId;
                        if (changeCurrent) {
                            stor.selected = stor.stations[0].id;
                        }
                    }
                    storage.save();
                    logObj(storage, "storage after update: changed=" + changed);
                    if (changed) {
                        mod._observer.onUpdate(changeCurrent);
                    }
                }
            }
        });
        storageUpdating = true;
    }
    var mod = {
        init: function (observer) {
            storage = common.storage("barplayer.settings.json");
            storageUpdating = false;
            initStorage();
            updateStorage();
            this._observer = observer;
        },
        finalize: function () {
            this._observer = null;
        },
        autocount: function () {
            return bridStor.autocount;
        },
        findStation: function (id) {
            var fi = findStationIndex(bridStor, id);
            return fi < 0 ? null : bridStor.stations[fi];
        },
        findStationByName: function (name, ignoreId) {
            var fi = findStationIndexByName(bridStor, name, ignoreId);
            return fi < 0 ? null : bridStor.stations[fi];
        },
        getStations: function () {
            return bridStor.stations;
        },
        forEach: function (callback, scope, withDeleted) {
            for (var i = 0, n = bridStor.stations.length; i < n; ++i) {
                if (!bridStor.stations[i].isDeleted || withDeleted) {
                    callback.call(scope, bridStor.stations[i], bridStor.selected === bridStor.stations[i].id);
                }
            }
        },
        _testUrl: function (url) {
            return /^https?:\/\/(([a-z0-9_-]+\.)+[a-z][a-z0-9]+|\d+\.\d+\.\d+\.\d+)(:\d+)?(\/\S*)?$/.test(url);
        },
        addStation: function (name, url, play) {
            if (!this._testUrl(url)) {
                return "url";
            }
            if (this.findStationByName(name)) {
                return "exists";
            }
            var st = {
                id: "userStation" + bridStor.autocount++,
                name: name,
                url: url,
                isUserAdded: true
            };
            bridStor.stations.push(st);
            this._observer.onAdd(st, play);
            storage.save();
        },
        editStation: function (id, name, url, play) {
            if (!this._testUrl(url)) {
                return "url";
            }
            if (this.findStationByName(name, id)) {
                return "exists";
            }
            var ed = false, st = this.findStation(id), chcu = false;
            if (!st) {
                log("editStation: not found");
                return;
            }
            if (name && name != st.name) {
                st.name = name;
                st.stUserName = true;
                ed = true;
            }
            if (url && url != st.url) {
                st.url = url;
                st.stUserUrl = true;
                ed = true;
                chcu = st.id == bridStor.selected;
            }
            if (ed || chcu) {
                log("this._observer.onEdit(st, chcu, play);");
                this._observer.onEdit(st, chcu, play);
                storage.save();
            }
        },
        removeStation: function (id) {
            var fi = findStationIndex(bridStor, id);
            if (fi < 0) {
                return;
            }
            if (id == bridStor.selected) {
                var newSel = null;
                if (fi < bridStor.stations.length - 1) {
                    newSel = bridStor.stations[fi + 1];
                } else {
                    newSel = fi > 0 ? bridStor.stations[fi - 1] : null;
                }
                bridStor.selected = newSel ? newSel.id : "";
                this._observer.onChangeCurrent(newSel, id);
            }
            var st = bridStor.stations[fi];
            if (st.isUserAdded) {
                bridStor.stations.splice(fi, 1);
            } else {
                st.isDeleted = true;
            }
            this._observer.onRemove(st);
            storage.save();
        },
        getCurrentStationId: function () {
            return bridStor.selected;
        },
        getCurrentStation: function () {
            return this.findStation(this.getCurrentStationId());
        },
        getCurrentUrl: function () {
            var st = this.getCurrentStation();
            return st ? st.url : null;
        },
        getCurrentName: function () {
            var st = this.getCurrentStation();
            return st ? st.name : "";
        },
        setCurrentStation: function (id, start) {
            if (id == bridStor.selected) {
                log("id == bridStor.selected");
                this._observer.onPlayCurrent();
                return;
            }
            var st = this.findStation(id);
            if (st) {
                var oldId = bridStor.selected;
                bridStor.selected = id;
                this._observer.onChangeCurrent(st, oldId, start);
                storage.save();
                return st;
            }
        }
    };
    return mod;
};
