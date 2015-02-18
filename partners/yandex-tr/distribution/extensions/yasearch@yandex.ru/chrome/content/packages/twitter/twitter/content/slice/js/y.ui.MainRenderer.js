Y.UI.MainRenderer = function (container) {
    var me = this;
    this.container = container;
    this.screenName = Y.DOM.getElementsByClassName(container, "login")[0];
    this.avatar = Y.DOM.getElementsByClassName(container, "avatar-mini-picture")[0];
    Y.ObserverService.getInstance().attachObserver("render:main", function (topic, data) {
        var screen_name = data.screen_name;
        var profile_image_url = data.profile_image_url;
        if (screen_name) {
            me.renderScreenName(screen_name);
        }
        if (profile_image_url) {
            me.renderAvatar(profile_image_url);
        }
    });
};
Y.UI.MainRenderer.prototype = {
    renderScreenName: function (name) {
        this.screenName.innerHTML = "@" + name;
    },
    renderAvatar: function (url) {
        this.avatar.setAttribute("src", url);
    }
};
