EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    function log(str) {
        app.log("[Notify]: " + str);
    }
    function logObj(obj, str) {
        app.logObj(obj, "[Notify]: " + (str || ""));
    }
    var settingNames = [
        "message",
        "friend",
        "comment",
        "mention"
    ];
    var notifTypeSetting = {
        message: "message",
        follow: "friend",
        mention: "mention",
        "default": "comment"
    };
    return {
        _inited: false,
        init: function () {
            if (this._inited || !common.ui.canShowNotifications()) {
                return this;
            }
            this._icon = common.resolvePath("content/img/profile/normal.svg");
            this._helper = common.ui.notifications(this, app.config.statName);
            this._inited = true;
            return this;
        },
        get enabled() {
            return this.urlEnabled && settingNames.some(function (type) {
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
        _entityTypes: {
            "mention_comments": "mention_comment",
            "mention_comment_photo": "mention_comment",
            "mention_comment_video": "mention_comment",
            "reply_comment_photo": "reply_comment",
            "reply_comment_video": "reply_comment"
        },
        _getEntity: function (type, user) {
            var _f = user && user.sex == 1 ? "_f" : "";
            var g = user ? "" : "g.";
            type = this._entityTypes[type] || type;
            return app.entities.text("vk.notify." + g + type + _f);
        },
        _groupLink: {
            wall: function (data) {
                return app.getAppUrl("wall", data[0].my_id);
            },
            mention: "notifications",
            follow: "friends_new",
            message: "messages",
            comment: "comments",
            reply_topic: "notifications"
        },
        createData: function (count, type, item) {
            if (!this.typeEnabled(notifTypeSetting[type] || notifTypeSetting["default"])) {
                return null;
            }
            var group = count > 1;
            if (!group && (!item._profile && !item.message)) {
                return null;
            }
            var ret = {
                icon: group ? this._icon : item._profile ? item._profile.photo50 : null,
                template: group ? app.api.Notifications.TEMPLATE_GROUP : app.api.Notifications.TEMPLATE_MESSAGE
            };
            if (group) {
                ret.title = common.strUtils.plural(count, this._getEntity(type)).replace("{N}", count);
                ret.context = this._groupLink[type] || type;
                if (typeof ret.context == "function") {
                    ret.context = ret.context.call(this, item);
                }
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
                logObj(data.notifyData, "data.notifyData:");
                this._helper.popupAll(data.notifyData, this._notifTypeFunc);
            }
        },
        _notifTypeFunc: {
            message: function (item, conf) {
                conf.context = app.getAppUrl("thread", item._tid);
                conf.title = item.message._profile.name;
                conf.text = app.getMsgText(item.message);
                conf.icon = item.message._profile.photo50;
            },
            follow: function (item, conf) {
                conf.context = "friends_new";
                conf.title = item._profile.name;
                conf.text = this._getEntity("follow", item._profile);
            },
            wall: function (item, conf) {
                conf.context = app.getAppUrl(item.type == "wall" ? "wall" : this._groupLink.mention, item.my_id);
                conf.title = item._profile.name;
                logObj(item, "wall:");
                conf.text = this._getEntity(item.type, item._profile);
            },
            mention: "wall",
            comment: function (item, conf) {
                conf.context = "comments";
                conf.title = item._profile.name;
                conf.text = this._getEntity(item.type, item._profile);
            },
            comment_post: "comment",
            comment_photo: "comment",
            comment_video: "comment",
            reply_comment: "comment",
            reply_topic: function (item, conf) {
                conf.context = app.getAppUrl("topic", item.parent.owner_id + "_" + item.parent.id);
                conf.title = item._profile.name;
                conf.text = this._getEntity("reply_topic", item._profile);
            }
        }
    };
};
