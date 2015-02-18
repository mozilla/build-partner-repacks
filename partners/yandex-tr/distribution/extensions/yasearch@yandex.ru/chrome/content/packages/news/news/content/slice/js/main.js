var sliceLifeTime = {
    LIFETIME: 20 * 60 * 1000,
    UPDATE_INTERVAL: 4 * 60 * 1000,
    _lastUpdate: 0,
    _timer: null,
    _api: null,
    init: function (api) {
        this._api = api;
        this._lastUpdate = Date.now();
        api.observer.addListener("before-popup", function () {
            this._destroyTimer();
            var delta = Date.now() - this._lastUpdate;
            api.log("before-popup: delta=" + delta);
            if (delta > this.UPDATE_INTERVAL || delta < 0) {
                api.log("update");
                api.observer.notify(":update");
            }
        }, this);
        api.observer.addListener("before-hide", function () {
            this._setTimer();
        }, this);
        api.observer.addListener("unload", this._destroyTimer, this);
        this._setTimer();
    },
    _setTimer: function () {
        this._destroyTimer();
        var api = this._api;
        this._timer = setTimeout(function () {
            api.sendMessage("timeout");
        }, this.LIFETIME);
    },
    _destroyTimer: function () {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    },
    updated: function () {
        this._lastUpdate = Date.now();
        this._api.log("updated");
    }
};
window.onload = function () {
    barApi.init(function () {
        sliceLifeTime.init(barApi);
        barApi.observer.addListener(":update", function () {
            barApi.log("loadItems({auto:true});");
            loadItems({ auto: true });
        });
        barApi.observer.addListener("unload", function () {
            barApi.setOption("feed", $.trim($(".b-news-menu__item_current").text() || ""));
        });
        barApi.resize(780, 540);
        barApi.sendMessage("load");
        function formatItems(itemsData) {
            var DESCRIPTION_MAX_LEN = 300;
            for (var i = itemsData.length - 1; i >= 0; i--) {
                var el = itemsData[i];
                if (el.description.length > DESCRIPTION_MAX_LEN) {
                    el.description = el.description.substr(0, DESCRIPTION_MAX_LEN) + "...";
                }
            }
            ;
            return itemsData;
        }
        ;
        function sortItems(itemsData) {
            return itemsData.sort(function (a, b) {
                return new Date(b.pubDate) - new Date(a.pubDate);
            });
        }
        ;
        function makeReadableDate(itemsData) {
            for (var i = itemsData.length - 1; i >= 0; i--) {
                var el = itemsData[i];
                el.agoDate = $.timeago(new Date(el.pubDate));
            }
            ;
            return itemsData;
        }
        ;
        var emptyMessage = null;
        function getFillItemsFunction(section, params) {
            function fillItems(itemsData) {
                sliceLifeTime.updated();
                if (section != awaitingSection)
                    return;
                dataUpdated(params);
                if (itemsData.length == 0) {
                    if (!emptyMessage) {
                        emptyMessage = barApi.getString("absent_message");
                    }
                    showError(emptyMessage);
                } else {
                    var data = formatItems(itemsData);
                    data = makeReadableDate(data);
                    data = sortItems(data);
                    $("#itemTemplate").tmpl(data).appendTo("#items-list");
                }
            }
            ;
            return fillItems;
        }
        var awaitingSection = null;
        var waitForUpdate = null;
        var awaitingWithTrobber = null;
        var $items = $("#items-list");
        var $error = $("#error");
        var $throb = $("#throbber");
        function loadItems(params) {
            var section = $.trim($(".b-news-menu__item_current").text());
            awaitingSection = section;
            if (!params || !params.auto) {
                waitForUpdate = setTimeout(function () {
                    clearTimeout(waitForUpdate);
                    clearTimeout(awaitingWithTrobber);
                    $items.hide();
                    $throb.show();
                    $error.hide();
                    awaitingWithTrobber = setTimeout(function () {
                        getErrorDataFunction(section)();
                    }, 9500);
                }, 500);
            }
            barApi.log("barApi.updateData " + section);
            barApi.updateData(section, getFillItemsFunction(section, params), getErrorDataFunction(section));
        }
        ;
        function dataUpdated(params) {
            clearTimeout(waitForUpdate);
            clearTimeout(awaitingWithTrobber);
            $("#items-list li").remove();
            $items.show();
            $throb.hide();
            $error.hide();
            if (!params || !params.auto) {
                $items.scrollTop(0);
            }
        }
        ;
        var error_message = null;
        function getErrorDataFunction(section) {
            function onErrorData() {
                if (section != awaitingSection)
                    return;
                clearTimeout(waitForUpdate);
                clearTimeout(awaitingWithTrobber);
                awaitingSection = null;
                if (!error_message) {
                    error_message = barApi.getString("error_message");
                }
                showError(error_message);
            }
            return onErrorData;
        }
        function showError(message) {
            $error.html(message);
            $items.hide();
            $throb.hide();
            $error.show();
        }
        var $slice = $(".b-news-slice");
        var menuStatEnable = false;
        $(".sector").live("click", function (event) {
            loadItems();
            if (menuStatEnable) {
                barApi.statLog("slice.newsmenu");
            }
            menuStatEnable = true;
        });
        function gotoLink() {
            if (/b-news-list__link/.test(this.className)) {
                barApi.statLog("slice.newslink");
            }
            barApi.navigateLink(this.href);
            return false;
        }
        $("a").live("click", gotoLink).live("mousedown", function (e) {
            e = e || window.event;
            if (e.which == 2 || e.button == 4) {
                return gotoLink.call(this, e);
            }
        });
        $slice.bind("resize", function (event, ui) {
            barApi.onResize($slice.width(), $slice.height());
        });
        $(window).bind("unload", function () {
            awaitingSection = null;
        });
        var sections_names = [];
        for (var title in barApi.getData("feeds")) {
            sections_names.push({ "title": title });
        }
        ;
        $("#sectionTemplate").tmpl(sections_names).appendTo("#sections-list");
        $(".b-news-title__link").html(barApi.getString("title"));
        var savedSection = barApi.getOption("feed");
        if (savedSection) {
            $(".sector").each(function () {
                if ($.trim($(this).text()) == savedSection)
                    $(this).click();
            });
        } else {
            $(".sector").first().click();
        }
        menuStatEnable = true;
    });
};
