$(function () {
    setTimeout(function () {
        loadFrame();
    }, 0);
    $(".b-widget__title").click(function () {
        showMenu();
        barApi.statLog("slice.allgame");
    });
    $("#sourceLink").click(function (event) {
        event.preventDefault();
        var url = $(this).attr("href");
        barApi.openPage(url);
    });
});
var barApiImpl = null;
if ($.browser.msie) {
    barApiImpl = window.external;
    var barApi = {
        setOption: function (key, value) {
            if (barApiImpl)
                barApiImpl.SetOption(key, value);
        },
        getOption: function (key) {
            return barApiImpl ? barApiImpl.GetOption(key) : "";
        },
        clickStat: function (action) {
            if (barApiImpl)
                barApiImpl.clickStat(action);
        },
        statLog: function (type) {
            if (barApiImpl)
                barApiImpl.statLog(type);
        },
        openPage: function (url) {
            if (barApiImpl)
                barApiImpl.openPage(url);
        }
    };
}
var buildMenu = function () {
    $("#thumbTemplate").tmpl([menuItemList]).appendTo("#menuContainer");
};
var getMenuItem = function (gameId) {
    for (i = 0; i < menuItemList.length; i++) {
        if (menuItemList[i].id == gameId)
            return menuItemList[i];
    }
    return null;
};
var setTitles = function () {
    $("#menuTitle").text(barApi.getString("menuTitle"));
    window.document.title = barApi.getString("windowTitle");
};
var showMenu = function () {
    barApi.setOption("sourceId", "");
    $(".b-widget__subtitle").hide();
    $("#frameWrapper").hide();
    $("#menuWrapper").show();
    $(".b-widget__title").removeClass("b-widget__title_link");
    $("#sourceLink").hide();
    $("#sourceLink").empty();
    resizeWindow(720, 500);
};
var fixGameTitle = function (str) {
    var limit = 30;
    if (str.substr(0, limit) == str)
        return str;
    else
        return str.substr(0, limit) + "...";
};
var showMenuItem = function (gameId, fromMenu) {
    barApi.setOption("sourceId", gameId);
    var menuItem = getMenuItem(gameId);
    if (fromMenu) {
        barApi.clickStat(menuItem.action);
        barApi.statLog("slice.game");
    }
    $("#menuWrapper").hide();
    $("#title").text(fixGameTitle(menuItem.title));
    $(".b-widget__subtitle").show();
    $(".b-widget__title").addClass("b-widget__title_link");
    if (barApi.fx3url) {
        window._selectedGameUrl = menuItem.url;
        menuItem.fx3url = barApi.fx3url || "";
    }
    $("#itemFrame").remove();
    $("#frameTemplate").tmpl(menuItem).appendTo("#frameContainer");
    $("#frameWrapper").show();
    var sourceSite = menuItem.sourceSite;
    if (!sourceSite) {
        sourceSite = menuItem.url.replace(/^http:\/\/([^\/]+)\/.*/, "$1");
        sourceSite = sourceSite.replace("www8", "www");
    }
    $("#sourceLink").attr("href", "http://" + sourceSite);
    var sourceString = barApi.getString("source");
    $("#sourceLink").html(sourceString + ": " + sourceSite);
    $("#sourceLink").show();
    resizeWindow(menuItem.cx, menuItem.cy);
};
var loadFrame = function () {
    setTitles();
    buildMenu();
    var gameId = barApi.getOption("sourceId");
    if (getMenuItem(gameId))
        showMenuItem(gameId, false);
    else
        showMenu();
};
var resizeWindow = function (width, height) {
    window.innerWidth = width;
    window.innerHeight = height + $(".b-widget__header").height();
};
$(window).unload(function () {
    if (!barApi.onGamesPopupUnload)
        return;
    barApi.onGamesPopupUnload(window);
});
