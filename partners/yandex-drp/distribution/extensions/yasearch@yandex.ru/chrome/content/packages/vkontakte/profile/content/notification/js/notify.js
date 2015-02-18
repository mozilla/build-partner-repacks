(function ($) {
    var $list, p = { imageURL: "i/" };
    function getTempl() {
        return "<li class=\"notify\">" + "<b class=\"notify-close\" style=\"display:none\"><img src=\"" + p.imageURL + "close.png\" alt=\"\" /></b>" + "<b class=\"notify-options\" style=\"display:none\"><img src=\"" + p.imageURL + "options.png\" alt=\"\" /></b>" + "<div class=\"b-notify-avatar\"><img src=\"\" alt=\"\" /></div>" + "<div class=\"b-notify-data\"></div>" + "</li>";
    }
    function addNotify(params) {
        params = $.extend({
            type: 0,
            uid: "",
            url: "http://vk.com/",
            name: "<Имя не указано>",
            icon: p.imageURL + "camera.gif",
            status: false,
            group: "<Неизвестная группа>",
            text: "",
            total: 0,
            totalFriends: 0,
            friends: [],
            locals: {
                settings: "",
                close: "",
                friend_request: ""
            }
        }, params);
        var $li = $(getTempl()).prependTo($list), $data = $li.children("div.b-notify-data"), friend, i, str = "", len = params.friends.length;
        $(".notify-options>img", $li).attr("alt", params.locals.settings);
        $(".notify-close>img", $li).attr("alt", params.locals.close);
        $(".b-notify-avatar>img", $li).attr("src", params.icon);
        if (params.type === 0 || params.type === 1) {
            $data.append("<h1>" + params.name + "<i class=\"notify-status" + (params.status ? " notify-online" : "") + "\"></i></h1>");
            if (params.type == 1) {
                $data.append("<span>" + params.locals.friend_request + "</span>");
            }
            var txt = params.text;
            if (txt.length > 350) {
                txt = txt.slice(0, 300);
                while (txt.slice(-1) == " " || txt.slice(-1) == ".") {
                    txt = txt.slice(0, -1);
                }
                txt += "...";
            }
            $data.append("<p>" + txt + "</p>");
        } else if (params.type == 2) {
            params.total = params.total.toString().replace(/(\d{1,3})(?=(?:\d{3})+$)/g, "$1 ");
            $data.append("<h1>Группа " + params.group + "</h1>" + "<p>Вас приглашает <a href=\"#\">" + params.name + "</a></p>" + "<p>В группе: " + params.total + " участников, " + "<a href=\"#\">" + params.totalFriends + " ваших друзей</a></p>");
            len = len > 8 ? 8 : len;
            for (i = 0; i < len; i++) {
                friend = params.friends[i];
                friend = $.extend({
                    icon: p.imageURL + "camera2.png",
                    name: ""
                }, friend);
                str += "<img src=\"" + friend.icon + "\" alt=\"" + friend.name + "\" />";
            }
            $data.append("<div class=\"b-notify-friends\">" + str + "</div>");
        }
        initNotify($li, params.url, params.uid);
        return $li;
    }
    function initNotify($notify, url, uid) {
        var $data = $notify.children("div.b-notify-data");
        $notify.on("mouseover", function () {
            $("b.notify-close, b.notify-options", this).show();
        }).on("mouseout", function () {
            $("b.notify-close, b.notify-options", this).hide();
        });
        $("div.b-notify-avatar>img", $notify).add("a, img, h1, p, span", $data).css({ "cursor": "pointer" }).click(function () {
            base.api.sendMessage("open_page", url);
            base.api.sendMessage("mark_read", uid);
        });
        $("b.notify-close", $notify).on("mouseover", function () {
            $("img", this).attr("src", p.imageURL + "close_hover.png");
        }).on("mouseout", function () {
            $("img", this).attr("src", p.imageURL + "close.png");
        });
        $("b.notify-options", $notify).on("mouseover", function () {
            $("img", this).attr("src", p.imageURL + "options_hover.png");
        }).on("mouseout", function () {
            $("img", this).attr("src", p.imageURL + "options.png");
        });
    }
    $(function () {
        var $notify;
        $list = $("ul.notifies");
        base.observers.add("data", function (subject, data) {
            if (data && typeof data === "object") {
                $notify = addNotify(data);
                base.api.sendMessage("resize_request", $notify.outerHeight(true).toString());
            } else {
            }
        });
        base.api.sendMessage("data_request");
        $(".notify-close").live("click", function () {
            base.api.sendMessage("close");
        });
        $(".notify-options").live("click", function () {
            base.api.sendMessage("open_widget_settings");
        });
        if ($.browser.mozilla) {
            var $container = $(".notifies li");
            $container.mouseenter(function () {
                base.api.sendMessage("mouse", "in");
            }).mouseleave(function () {
                base.api.sendMessage("mouse", "out");
            });
        }
    });
}(jQuery));
