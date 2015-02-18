(function () {
    var OS = Y.ObserverService.getInstance();
    window.twitlink = {
        logout: function () {
            Y.sendMessage("twitter:logout");
        },
        retweet: function (username, msgId) {
            Y.sendMessage("twitter:retweet", msgId);
        },
        reply: function (username, msg_id) {
            var msg = {
                username: username,
                msg_id: msg_id
            };
            OS.notifyObservers("twitlink:reply", msg);
        },
        directReply: function (username, user_id, hideOverlay) {
            var msg = {
                username: username,
                user_id: user_id
            };
            if (hideOverlay) {
                OS.notifyObservers("overlay:hide");
            }
            OS.notifyObservers("twitlink:direct-reply", msg);
        },
        deleteMsg: function (msgId) {
            Y.sendMessage("twitter:delete", msgId);
        },
        deleteDMsg: function (msgId) {
            Y.sendMessage("twitter:delete-direct", msgId);
        },
        info: function (userId) {
            Y.sendMessage("twitter:info", userId);
        },
        search: function (text) {
            OS.notifyObservers("twitlink:search", text);
        },
        follow: function (userId) {
            Y.sendMessage("twitter:follow", userId);
        },
        unfollow: function (userId) {
            Y.sendMessage("twitter:unfollow", userId);
        },
        overlay_follow: function (userId) {
            Y.sendMessage("twitter:overlay-follow", userId);
        },
        overlay_unfollow: function (userId) {
            Y.sendMessage("twitter:overlay-unfollow", userId);
        },
        show_foto: function (msgId, url) {
            var div = document.getElementById("id_foto_" + msgId);
            if (!div.firstChild) {
                var img = document.createElement("img");
                img.alt = "photo";
                img.src = url;
                div.appendChild(img);
            }
            var span = document.getElementById("id_act_sf_" + msgId);
            if (div.style.display == "none") {
                div.style.display = "";
                span.innerHTML = Y.l8n.localize("&action.hide-message-foto;");
            } else {
                div.style.display = "none";
                span.innerHTML = Y.l8n.localize("&action.show-message-foto;");
            }
        },
        open: function (url) {
            Y.sendMessage("twitter:open", url);
        },
        open_status: function (user_name, twit_id) {
            Y.sendMessage("twitter:open", "https://twitter.com/" + user_name + "/status/" + twit_id);
        },
        close_overlay: function () {
            OS.notifyObservers("overlay:hide");
        },
        favorite: function (twit_id) {
            Y.sendMessage("twitter:favorite", twit_id);
        },
        unfavorite: function (twit_id) {
            Y.sendMessage("twitter:unfavorite", twit_id);
        }
    };
}());
