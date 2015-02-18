EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var WM = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    var WW = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
    var log = function (str, method) {
        common.log("_common.ui: " + str, method);
    };
    var logr = function (str, method) {
        common.logr("_common.ui: " + str, method);
    };
    function logObj(obj, str) {
        common.logObj(obj, "_common.ui: " + (str || ""));
    }
    var UI = {
        getCurrentWindows: function () {
            var w = WM.getMostRecentWindow("navigator:browser");
            var gbr = w && w.gBrowser;
            return {
                mrw: w,
                browser: gbr,
                selBrowser: gbr && gbr.selectedBrowser,
                selTab: gbr && gbr.selectedTab
            };
        },
        getCurrentWindow: function () {
            var w = WM.getMostRecentWindow("navigator:browser");
            var gbr = w && w.gBrowser;
            return gbr && gbr.selectedTab;
        },
        gBrowser: function () {
            var w = WM.getMostRecentWindow("navigator:browser");
            return w && w.gBrowser;
        },
        getTopBrowserWindow: function () {
            return UI.getTopWindowOfType("navigator:browser");
        },
        getTopWindowOfType: function (windowType) {
            return WM.getMostRecentWindow(windowType);
        },
        getCurrentURL: function () {
            var currentWindow = UI.getTopBrowserWindow();
            var gBrowser = currentWindow && currentWindow.gBrowser;
            return gBrowser ? gBrowser.currentURI.spec : "";
        },
        notifications: function (ctx, widget) {
            return new NotifyHelper(ctx, widget, {
                api: common.api.Notifications,
                ungroupSize: this.notifUngroupSize(),
                browser: "fx",
                stat: common.statistics.logNotif.bind(common.statistics)
            });
        },
        notifUngroupSize: function () {
            return 3;
        },
        canShowNotifications: function () {
            return !!common.api.Notifications && common.api.Environment.os.name != "linux";
        },
        createSlice: function (props, appOrInst, msgPrefix) {
            if (typeof props === "string") {
                props = { url: props };
            }
            msgPrefix = msgPrefix ? msgPrefix + ":" : "";
            props.url = common.resolvePath(props.url);
            props.messageHandler = function (aMessage, callback) {
                if (appOrInst.sliceCommands) {
                    var cmd = msgPrefix + (aMessage.message || aMessage);
                    var handler = appOrInst.sliceCommands[cmd];
                    if (typeof handler == "function") {
                        handler.call(appOrInst, aMessage.message || aMessage, aMessage.data, callback);
                    } else {
                        log("!!! Undefined slice command " + cmd);
                    }
                }
            };
            var slice = common.api.Controls.createSlice(props, appOrInst.WIID);
            var oldShow = slice.show;
            slice.show = function (anchorElement, onHide) {
                oldShow.call(this, anchorElement, function () {
                    slice.notify("slice-event-hide");
                    if (typeof onHide === "function") {
                        onHide();
                    }
                });
                slice.notify("slice-event-show");
            };
            return slice;
        }
    };
    function NotifyHelper(ctx, widget, helper) {
        this._ctx = ctx;
        this._widget = widget;
        this.api = helper.api;
        this._helper = helper;
        this._observer = this._createObserver();
        this.api.addListener(this._observer);
    }
    NotifyHelper.prototype = {
        constructor: NotifyHelper,
        finalize: function () {
            if (this._observer) {
                this.api.removeListener(this._observer);
            }
            this._observer = null;
            this._ctx = null;
        },
        popup: function (items, groupType, func) {
            if (!items || !items.length) {
                return;
            }
            var conf;
            if (items.length > this._helper.ungroupSize) {
                conf = this._ctx.createData(items.length, groupType, items);
                if (conf) {
                    conf.type = conf.type || groupType;
                    conf.groupSize = conf.groupSize || items.length;
                    this.api.create(conf);
                }
            } else {
                for (var i = 0; i < items.length; ++i) {
                    conf = this._ctx.createData(1, groupType, items[i]);
                    if (conf) {
                        conf.type = conf.type || groupType;
                        conf.groupSize = conf.groupSize || 1;
                        if (func) {
                            func.call(this._ctx, items[i], conf);
                        }
                        this.api.create(conf);
                    }
                }
            }
        },
        popupAll: function (data, funcs) {
            if (!data) {
                return;
            }
            var i, arr = [];
            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    arr.push(i);
                    var func = funcs && funcs[i];
                    if (func && typeof func == "string") {
                        func = funcs[func];
                    }
                    this.popup(data[i], i, func);
                }
            }
            for (i = 0; i < arr.length; ++i) {
                delete data[arr[i]];
            }
        },
        group: function (queryId, notifications) {
            var count = 0;
            for (var i = 0; i < notifications.length; ++i) {
                var data = notifications[i];
                count += data.groupSize;
            }
            var conf = this._ctx.createData(count, notifications[0].type, notifications);
            if (conf) {
                this.api.group(queryId, conf);
            }
        },
        stat: function (type, data) {
            var grp = !data ? "" : data.groupSize > 1 ? "group." : "one.";
            this._helper.stat(this._helper.browser + "." + this._widget + "." + grp + type);
        },
        _createObserver: function () {
            var self = this;
            var paths = {};
            paths[this.api.CLICK_TARGET_OPTIONS] = "sett";
            paths[this.api.CLICK_TARGET_CLOSE] = "close";
            return {
                notificationClicked: function (id, data, target) {
                    self.stat(paths[target] || "click", data);
                    self._ctx.notificationClicked && self._ctx.notificationClicked(id, data, target);
                },
                notificationClosed: function (id, data, reason) {
                    if (reason == self.api.CLOSE_REASON_TIMEOUT) {
                        self.stat("time", data);
                    }
                    self._ctx.notificationClosed && self._ctx.notificationClosed(id, data, reason);
                },
                notificationsGroup: function (queryId, notifications) {
                    if (self._ctx.notificationsGroup && self._ctx.notificationsGroup(queryId, notifications)) {
                        return;
                    }
                    self.group(queryId, notifications);
                }
            };
        }
    };
    return UI;
};
