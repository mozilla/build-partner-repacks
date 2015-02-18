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
            this._icon = common.resolvePath("content/img/gmail.svg");
            this._helper = common.ui.notifications(this, app.config.statName);
            this._inited = true;
            return this;
        },
        get enabled() {
            return this._inited && app.api.Settings.getValue("show-notifications") && app.config.enableNotifications && !app.config.rxServiceUrl.test(common.ui.getCurrentURL());
        },
        finalize: function () {
            if (this._helper) {
                this._helper.finalize();
            }
            this._inited = false;
        },
        createData: function (count, type, msg) {
            var group = count > 1;
            var ret = {
                icon: this._icon,
                template: group ? app.api.Notifications.TEMPLATE_GROUP : app.api.Notifications.TEMPLATE_MAIL
            };
            if (group) {
                ret.title = common.strUtils.plural(count, app.entities.text("notify.letters")).replace("{N}", count);
                ret.context = "inbox";
            } else {
                ret.title = msg.author.name || msg.author.email;
                ret.text = [
                    msg.title,
                    msg.summary
                ].join("\n");
                ret.context = msg.link;
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
                this._helper.popupAll(data.notifyData);
            }
        }
    };
};
