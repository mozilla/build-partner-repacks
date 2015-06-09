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
            this._icon = common.resolvePath("content/img/main-icon.svg");
            this._helper = common.ui.notifications(this, app.config.statName);
            this._inited = true;
            return this;
        },
        get enabled() {
            return this._inited && app.api.Settings.getValue("notifications") && !app.config.rxServiceUrl.test(common.ui.getCurrentURL());
        },
        finalize: function () {
            if (this._helper) {
                this._helper.finalize();
            }
            this._inited = false;
        },
        createData: function (count, type, item) {
            var group = count > 1;
            var ret = {
                titleColor: "429f1e",
                icon: group ? this._icon : item._profile ? item._profile.pic128x128 : null,
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
            if (this.enabled && data) {
                this._helper.popupAll(data.notifyData, this._notifTypeFunc);
            }
        },
        _notifTypeFunc: {
            comments: function (item, conf) {
                var user = item._profile;
                conf.context = "comments";
                conf.title = user.name;
                conf.text = item.text || "";
            },
            messages: function (item, conf) {
                var user = item._profile;
                conf.context = "messages";
                conf.title = user.name;
                conf.text = item.text || app.entities.text("notify.messages_file" + (user.gender === "female" ? "_f" : ""));
            }
        }
    };
};
