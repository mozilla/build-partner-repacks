EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[Notify]: " + str);
    }
    function logObj(obj, str) {
        app.logObj(obj, "[Notify]: " + (str || ""));
    }
    return {
        _inited: false,
        init: function () {
            if (this._inited || !common.ui.canShowNotifications()) {
                return this;
            }
            this._icon = common.resolvePath("content/img/facebook.svg");
            this._helper = common.ui.notifications(this, app.config.statName);
            this._inited = true;
            return this;
        },
        get enabled() {
            return this.urlEnabled && Object.keys(this._notifTypeFunc).some(function (type) {
                return this.typeEnabled(type);
            }, this);
        },
        get urlEnabled() {
            return !app.config.rxServiceUrl.test(common.ui.getCurrentURL());
        },
        typeEnabled: function (type, testUrl) {
            return this._inited && app.api.Settings.getValue("show-notif-" + type) && (!testUrl || this.urlEnabled);
        },
        finalize: function () {
            if (this._helper) {
                this._helper.finalize();
            }
            this._inited = false;
        },
        createData: function (count, type, item) {
            if (!this.typeEnabled(type)) {
                return null;
            }
            var group = count > 1;
            var ret = {
                icon: group ? this._icon : item._profile ? item._profile.pic_square : null,
                template: group ? app.api.Notifications.TEMPLATE_GROUP : app.api.Notifications.TEMPLATE_MESSAGE
            };
            if (group) {
                ret.title = common.strUtils.plural(count, app.entities.text("notify." + type)).replace("{N}", count);
                ret.context = type;
            } else {
                ret.serviceIcon = this._icon;
            }
            return ret;
        },
        notificationClicked: function (id, data, target) {
            logObj(data, "click " + target);
            if (target == app.api.Notifications.CLICK_TARGET_OPTIONS) {
                app.api.Controls.openSettingsDialog(null, app.WIID);
            } else {
                if (target != app.api.Notifications.CLICK_TARGET_CLOSE) {
                    app.navigateBrowser({
                        url: data.context,
                        target: "new tab"
                    });
                }
            }
        },
        popup: function (data) {
            if (this.urlEnabled && data) {
                logObj(data.notifyData, "data.notifyData:");
                this._helper.popupAll(data.notifyData, this._notifTypeFunc);
            }
        },
        _notifTypeFunc: {
            friends: function (item, conf) {
                var user = item._profile;
                conf.context = app.getAppUrl("friends");
                conf.title = user.name;
                conf.text = app.entities.text("notify.friend_request" + (user.sex == "female" ? "_f" : ""));
            },
            notifications: function (item, conf) {
                conf.context = "notifications";
                conf.title = item._profile.name;
                conf.text = item.title_text || "";
            },
            messages: function (item, conf) {
                var user = item._profile;
                conf.context = app.getAppUrl("message_thread", user.uid);
                conf.title = user.name;
                conf.text = item.body;
                if (!item.body && item.attachment && item.attachment.media) {
                    conf.text = app.entities.text("notify.messages.foto" + (user.sex == "female" ? "_f" : ""));
                }
            }
        }
    };
};
