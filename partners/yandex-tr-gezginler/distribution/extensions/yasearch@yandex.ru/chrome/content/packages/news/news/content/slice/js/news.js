$(function () {
    var $menuItems = $(".b-news-menu__item");
    $(".sector").live("click", function () {
        $(".b-news-menu__item").removeClass("b-news-menu__item_current");
        $(this).closest(".b-news-menu__item").addClass("b-news-menu__item_current");
    });
    var $menu = $(".b-news-menu"), menuHeight, $menuList = $(".b-news-menu__list");
    var $topArrow = $(".b-news-menu__arrow-top"), $bottomArrow = $(".b-news-menu__arrow-bottom"), listTop = $menuList.css("top").substring(0, -2), moveInterval;
    function setMenuOverflow() {
        menuHeight = $menu.height();
        listHeight = $menuList.innerHeight();
        if (menuHeight < listHeight) {
            $menu.addClass("b-news-menu_overflow");
            if (listTop + listHeight < menuHeight - 66) {
                listTop = menuHeight - 66 - listHeight;
                $menuList.css({ top: listTop + "px" });
                $bottomArrow.addClass("b-news-menu__arrow-bottom_disabled");
            }
            if (listTop == 0) {
                $topArrow.addClass("b-news-menu__arrow-top_disabled");
            }
        } else {
            $menu.removeClass("b-news-menu_overflow");
        }
    }
    $bottomArrow.mousedown(function () {
        if (!$bottomArrow.hasClass("b-news-menu__arrow-bottom_disabled")) {
            $topArrow.removeClass("b-news-menu__arrow-top_disabled");
            moveInterval = setInterval(function () {
                if (listTop + listHeight <= menuHeight - 66) {
                    clearInterval(moveInterval);
                    $bottomArrow.addClass("b-news-menu__arrow-bottom_disabled");
                } else {
                    listTop--;
                    $menuList.css({ top: listTop + "px" });
                }
            }, 16);
        }
    }).mouseup(function () {
        clearInterval(moveInterval);
    });
    $topArrow.mousedown(function () {
        if (!$topArrow.hasClass("b-news-menu__arrow-top_disabled")) {
            $bottomArrow.removeClass("b-news-menu__arrow-bottom_disabled");
            moveInterval = setInterval(function () {
                if (listTop >= 0) {
                    clearInterval(moveInterval);
                    $topArrow.addClass("b-news-menu__arrow-top_disabled");
                } else {
                    listTop++;
                    $menuList.css({ top: listTop + "px" });
                }
            }, 16);
        }
    }).mouseup(function () {
        clearInterval(moveInterval);
    });
});
