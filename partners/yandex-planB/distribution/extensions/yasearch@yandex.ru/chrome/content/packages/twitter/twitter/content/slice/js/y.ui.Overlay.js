Y.UI.Overlay = function (overlay) {
    this.overlay = overlay;
    this._init();
};
Y.UI.Overlay.prototype = {
    constructor: Y.UI.Overlay,
    _init: function () {
        var _this = this;
        var OS = Y.ObserverService.getInstance();
        OS.attachObserver("overlay:show", function (topic, data) {
            _this.showOverlay(topic, data);
        });
        OS.attachObserver("overlay:hide", function () {
            _this.hideOverlay();
        });
        OS.attachObserver("overlay:follow", function (topic, data) {
            _this.following(data);
        });
        OS.attachObserver("overlay:showDMsg", function (topic, data) {
            if (data.id_str == _this._userId) {
                var btn = document.getElementById("id_overlay_dmsg_btn");
                if (btn) {
                    btn.style.display = data.__canDM ? "block" : "none";
                }
            }
        });
    },
    showOverlay: function (topic, data) {
        Y.log("showOverlay");
        Y.XTools.destroyChilds(this.overlay);
        this._userId = data.id_str;
        this._following = data.following;
        this._followCount = data.followers_count;
        this.overlay.innerHTML = Y.XTools.transformJSON(data, "overlay");
        Y.UI.buildUI(this.overlay, true);
        this.overlay.style.display = "block";
    },
    hideOverlay: function () {
        this.overlay.style.display = "none";
    },
    following: function (d) {
        if (d.userId == this._userId && this._userId != Y.xParams.my_id && this._following != d.following) {
            this._following = !this._following;
            this._followCount = this._followCount + (d.following ? 1 : -1);
            document.getElementById("id_overlayFollowersCounter").innerHTML = this._followCount;
            var uinfo = document.getElementById("id_overlayUserInfo");
            Y.DOM[d.following ? "addClass" : "removeClass"](uinfo, "user-following");
        }
    }
};
