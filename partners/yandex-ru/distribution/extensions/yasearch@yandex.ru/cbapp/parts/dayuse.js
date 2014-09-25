"use strict";
const EXPORTED_SYMBOLS = ["dayuse"];
const GLOBAL = this;
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
Cu.import("resource://gre/modules/Services.jsm");
function isErrorRequest(aReq) {
    return !!(!aReq || aReq.type == "error" || !aReq.target || aReq.target.status != 200);
}
const dayuse = {
        init: function dayuse_init(aApplication) {
            this._application = aApplication;
            aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
            this._logger = aApplication.getLogger("Dayuse");
            this._database = new this._application.core.Lib.Database(this._logsFile, [this._consts.INIT_QUERIES_TABLE_QUERY]);
            this._startTimers();
        },
        finalize: function dayuse_finalize(aDoCleanup, callback) {
            if (this._collectTimer) {
                this._collectTimer.cancel();
                this._collectTimer = null;
            }
            if (this._requestTimer) {
                this._requestTimer.cancel();
                this._requestTimer = null;
            }
            if (this._database) {
                let logsFile = this._logsFile;
                this._database.close(function dayuse__onDBClosed() {
                    if (aDoCleanup) {
                        fileutils.removeFileSafe(logsFile);
                    }
                    callback();
                });
                return true;
            }
            this._database = null;
            return false;
        },
        updateScrollInfo: function dayuse_updateScrollInfo(pageHasVerticalScroll) {
            if (typeof pageHasVerticalScroll !== "boolean")
                throw new TypeError("updateScrollInfo: argument must be boolean.");
            if (this._application.preferences.get(this._consts.VB_SCROLL_INFO_PREF_NAME, null) === false)
                return;
            this._application.preferences.set(this._consts.VB_SCROLL_INFO_PREF_NAME, pageHasVerticalScroll);
        },
        _startTimers: function dayuse__startTimers() {
            this._collectTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
            var nextCollectInterval = this._consts.CHECK_INTERVAL - Math.abs(this._lastCollectTime * 1000 - Date.now());
            nextCollectInterval = Math.max(nextCollectInterval, 1 * 60 * 1000);
            this._collectTimer.initWithCallback(this, nextCollectInterval, this._collectTimer.TYPE_ONE_SHOT);
            this._setRequestTimer(2 * 60 * 1000);
        },
        notify: function dayuse_notify(aTimer) {
            if (!aTimer)
                return;
            switch (aTimer) {
            case this._requestTimer:
                let [
                        id,
                        query
                    ] = this._getDataForSend();
                this._sendingLogId = id;
                if (query)
                    this._sendRequest(query);
                break;
            case this._collectTimer:
                this._logData();
                this._collectTimer.initWithCallback(this, this._consts.CHECK_INTERVAL * 1000, this._collectTimer.TYPE_ONE_SHOT);
                break;
            default:
                break;
            }
        },
        testSendStat: function dayuse_testSendStat() {
            this.notify(this._requestTimer);
        },
        testCollectStat: function dayuse_testCollectStat() {
            this.notify(this._collectTimer);
        },
        _collectTimer: null,
        _requestTimer: null,
        _sendingLogId: null,
        _database: null,
        _consts: {
            LAST_COLLECT_TIME_PREF_NAME: "dayuse.collect",
            LAST_SEND_TIME_PREF_NAME: "dayuse.send",
            VB_SCROLL_INFO_PREF_NAME: "dayuse.vb.scroll",
            CHECK_INTERVAL: 24 * 60 * 60 * 1000,
            get STAT_URL() {
                return "http://clck.yandex.ru/click/dtype=elduse/product=" + (dayuse._application.core.CONFIG.APP.TYPE === "vbff" ? "vb" : "elmnt") + "/path=batch/*";
            },
            INIT_QUERIES_TABLE_QUERY: "            CREATE TABLE IF NOT EXISTS queries (                id INTEGER PRIMARY KEY,                         query BLOB,                                     timeCreated INTEGER,                            sendAttempts INTEGER                        )"
        },
        get _logsFile() {
            var logsFile = this._application.directories.appRootDir;
            logsFile.append("dayuse.sqlite");
            return logsFile;
        },
        _logData: function dayuse__logData() {
            this._lastCollectTime = Date.now();
            this._collectData(function (collectedData) {
                if (!collectedData)
                    return;
                var onDataInserted = function onDataInserted() {
                        this._cleanupLoggedData();
                        this._setRequestTimer();
                    }.bind(this);
                this._database.execQueryAsync("INSERT INTO queries (query, timeCreated, sendAttempts)                                            VALUES (:query, :timeCreated, :sendAttempts)", {
                    query: collectedData,
                    timeCreated: Date.now(),
                    sendAttempts: 0
                }, onDataInserted);
            }.bind(this));
        },
        _cleanupLoggedData: function addonsStatus__cleanupLoggedData() {
            this._database.execQueryAsync("DELETE FROM queries                                        WHERE (timeCreated < :timeCreated OR sendAttempts > :sendAttempts)", {
                timeCreated: Date.now() - 2 * 24 * 60 * 60 * 1000,
                sendAttempts: 5
            });
        },
        _collectData: function dayuse__collectData(callback) {
            this._dayuseDataCollector.collect(function (collectedData) {
                callback(collectedData && JSON.stringify(collectedData) || null);
            });
        },
        _getDataForSend: function dayuse__getDataForSend() {
            var id = null;
            var query = null;
            var queryData = this._database.execQuery("SELECT id, query FROM queries LIMIT 1")[0];
            if (queryData) {
                id = queryData.id;
                query = queryData.query;
            }
            return [
                id,
                query
            ];
        },
        _setRequestTimer: function dayuse__setRequestTimer(aTimeout) {
            if (this._requestTimer)
                this._requestTimer.cancel();
            else
                this._requestTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
            this._requestTimer.initWithCallback(this, aTimeout || 1000, this._requestTimer.TYPE_ONE_SHOT);
        },
        _sendRequest: function dayuse__sendRequest(aJSONString) {
            var request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
            request.mozBackgroundRequest = true;
            request.open("POST", this._consts.STAT_URL, true);
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            request.setRequestHeader("Connection", "close");
            var callbackFunc = function callbackFunc(aResponse) this._onResponse(aResponse);
            callbackFunc = callbackFunc.bind(this);
            var target = request.QueryInterface(Ci.nsIDOMEventTarget);
            target.addEventListener("load", callbackFunc, false);
            target.addEventListener("error", callbackFunc, false);
            var countersString = "[{\"parent-path\": \"firefox\", \"children\": [" + aJSONString + "]}]";
            request.send("counters=" + encodeURIComponent(countersString));
            this._logger.debug("Send data: " + aJSONString);
        },
        _onResponse: function dayuse__onResponse(aRequest) {
            if (!this._sendingLogId)
                throw new Error("Unexpected ID of sended log data.");
            if (isErrorRequest(aRequest)) {
                this._database.execQueryAsync("UPDATE queries SET sendAttempts = sendAttempts + 1 WHERE id = :id", { id: this._sendingLogId });
            } else {
                this._database.execQueryAsync("DELETE FROM queries WHERE id = :id", { id: this._sendingLogId });
                this._lastSendTime = Date.now();
            }
            this._sendingLogId = null;
            this._setRequestTimer(5 * 60 * 1000);
            this._cleanupLoggedData();
        },
        get _lastCollectTime() {
            var collectTimePrefValue = this._application.preferences.get(this._consts.LAST_COLLECT_TIME_PREF_NAME, 0);
            return parseInt(collectTimePrefValue, 10) || 0;
        },
        set _lastCollectTime(aTimestamp) {
            var secondsSinceUnixEpoch = Math.floor((aTimestamp || Date.now()) / 1000);
            this._application.preferences.set(this._consts.LAST_COLLECT_TIME_PREF_NAME, secondsSinceUnixEpoch);
        },
        get _lastSendTime() {
            var sendTimePrefValue = this._application.preferences.get(this._consts.LAST_SEND_TIME_PREF_NAME, 0);
            return parseInt(sendTimePrefValue, 10) || 0;
        },
        set _lastSendTime(aTimestamp) {
            var secondsSinceUnixEpoch = Math.floor((aTimestamp || Date.now()) / 1000);
            this._application.preferences.set(this._consts.LAST_SEND_TIME_PREF_NAME, secondsSinceUnixEpoch);
        },
        get _dayuseDataCollector() {
            switch (this._application.core.CONFIG.APP.TYPE) {
            case "barff":
                return elmntDayuseDataCollector;
            case "vbff":
                return vbDayuseDataCollector;
            }
            throw new Error("Unknow application type");
        }
    };
function CTag(name) {
    this._object = Object.create(null);
    this._object.ctag = name;
}
CTag.prototype = {
    addChildren: function CTag_addChildren(children) {
        if (!this._object.children) {
            this._object.children = [];
        }
        this._object.children.push(children);
    },
    get childrenLength() {
        var children = this._object.children || [];
        return children.length;
    },
    addVars: function CTag_addVars(vars) {
        if (!this._object.vars) {
            this._object.vars = Object.create(null);
        }
        for (let [
                    key,
                    value
                ] in Iterator(vars)) {
            this._object.vars[key] = String(value);
        }
    },
    toJSON: function CTag_toJSON() {
        return this._object;
    }
};
const dayuseDataCollector = {
        _productTagName: null,
        get _logger() dayuse._logger,
        get _application() dayuse._application,
        get _statUsageSend() this._application.preferences.get("stat.usage.send", false),
        _calcCommonData: function dayuseDataCollector__calcCommonData(productCTag, topBrowserWindow) {
            this._calcDayuse(productCTag);
            this._calcHomepage(productCTag);
            this._calcQS(productCTag);
            this._calcStatUsageSend(productCTag);
            this._calcBookmarksPanel(productCTag, topBrowserWindow);
            this._calcBookmarksSidebar(productCTag, topBrowserWindow);
            this._calcBookmarksCount(productCTag);
            this._calcYaDisk(productCTag);
        },
        _calcDayuse: function dayuseDataCollector__calcDayuse(productCTag) {
            var installTimeInSec = this._application.preferences.get("general.install.time");
            if (!installTimeInSec)
                return;
            var ageInDays = parseInt((Date.now() / 1000 - installTimeInSec) / 86400, 10) || 0;
            ageInDays = Math.max(ageInDays, 0);
            var dayuseTag = new CTag("dayuse" + this._productTagName);
            dayuseTag.addVars({ count: ageInDays });
            productCTag.addChildren(dayuseTag);
        },
        _calcHomepage: function dayuseDataCollector__calcHomepage(productCTag) {
            if (!this._statUsageSend)
                return;
            var browserHomePage = this._application.installer.getBrowserHomePage();
            var hpTag = new CTag("hp");
            var hpTagVar = "diff";
            if (browserHomePage === "yafd:tabs") {
                hpTagVar = "yavb";
            } else if (this._application.installer.isYandexURL(browserHomePage)) {
                hpTagVar = "ya";
            }
            hpTag.addVars({ name: hpTagVar });
            productCTag.addChildren(hpTag);
        },
        _calcQS: function dayuseDataCollector__calcQS(productCTag) {
            if (!this._statUsageSend)
                return;
            var qsTag = new CTag("qs");
            qsTag.addVars({ name: this._application.installer.isCurrentQSOverridable() ? "diff" : "ya" });
            productCTag.addChildren(qsTag);
        },
        _calcStatUsageSend: function dayuseDataCollector__calcStatUsageSend(productCTag) {
            var statTag = new CTag(this._statUsageSend ? "stsendon" : "stsendoff");
            productCTag.addChildren(statTag);
        },
        _calcBookmarksPanel: function dayuseDataCollector__calcBookmarksPanel(productCTag, topBrowserWindow) {
            var personalToolbar = topBrowserWindow.document.getElementById("PersonalToolbar");
            var bmTag = new CTag(personalToolbar && personalToolbar.collapsed === false ? "bmbaron" : "bmbaroff");
            productCTag.addChildren(bmTag);
        },
        _calcBookmarksSidebar: function dayuseDataCollector__calcBookmarksSidebar(productCTag, topBrowserWindow) {
            var sidebar = topBrowserWindow.document.getElementById("sidebar-box");
            var isBookmarksSidebar = sidebar && sidebar.getAttribute("hidden") !== "true" && sidebar.getAttribute("src").indexOf("chrome://browser/content/bookmarks/") === 0;
            var sidebarTag = new CTag(isBookmarksSidebar ? "sidebaron" : "sidebaroff");
            productCTag.addChildren(sidebarTag);
        },
        _calcBookmarksCount: function dayuseDataCollector__calcBookmarksCount(productCTag) {
            if (!this._statUsageSend)
                return;
            var bmcountTag = new CTag("bmcount");
            var {PlacesUtils: PlacesUtils} = Cu.import("resource://gre/modules/PlacesUtils.jsm", {});
            var dbConnection = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
            var databaseWrapper = new Database();
            databaseWrapper.connection = dbConnection.clone(true);
            var bmcountVar = databaseWrapper.execSimpleQuery("SELECT COUNT(id) FROM moz_bookmarks WHERE type = 1") || 0;
            databaseWrapper.close();
            databaseWrapper = null;
            var ceil = function ceil(number, step) {
                return Math.ceil(number / step) * step;
            };
            if (bmcountVar > 500)
                bmcountVar = 501;
            else if (bmcountVar > 200)
                bmcountVar = ceil(bmcountVar, 50);
            else if (bmcountVar > 100)
                bmcountVar = ceil(bmcountVar, 20);
            else
                bmcountVar = ceil(bmcountVar, 5);
            bmcountTag.addVars({ count: bmcountVar });
            productCTag.addChildren(bmcountTag);
        },
        _calcYaDisk: function dayuseDataCollector__calcYaDisk(productCTag) {
            var diskVersion = this._application.integration.yandexDisk.version;
            var discTag = new CTag(diskVersion ? "discon" : "discoff");
            productCTag.addChildren(discTag);
        }
    };
const vbDayuseDataCollector = Object.create(dayuseDataCollector, {
        _productTagName: { value: "vb" },
        collect: {
            value: function vbDayuseDataCollector_collect(callback) {
                var topBrowserWindow = misc.getTopBrowserWindow();
                if (!topBrowserWindow) {
                    callback(null);
                    return;
                }
                this._application.fastdial.requestSettings(function (settings) {
                    var productCTag = new CTag("vb");
                    var [
                            layoutX,
                            layoutY
                        ] = this._application.layout.getThumbsNumXY();
                    var gridTag = new CTag("grid_" + layoutX + "_" + layoutY);
                    productCTag.addChildren(gridTag);
                    var gridIsAuto = this._application.layout.getXYLayoutOfScreen().join(":") === [
                            layoutX,
                            layoutY
                        ].join(":");
                    var gridAutoTag = new CTag(gridIsAuto ? "grauto" : "gruser");
                    gridTag.addChildren(gridAutoTag);
                    this._application.internalStructure.iterate({ visible: true }, function (data, index) {
                        var positionTag = new CTag(index);
                        var thumbType;
                        switch (data.thumb.statParam) {
                        case "autothumb":
                            thumbType = "thumbauto";
                            break;
                        case "userthumb":
                            thumbType = "thumbuser";
                            break;
                        case "defthumb":
                            thumbType = "thumbdef";
                            break;
                        }
                        if (thumbType) {
                            let thumbTypeTag = new CTag(thumbType);
                            positionTag.addChildren(thumbTypeTag);
                        }
                        if (data.source) {
                            let fillTag = new CTag("thumbfill");
                            positionTag.addChildren(fillTag);
                        } else {
                            let emptyTag = new CTag("thumbempty");
                            positionTag.addChildren(emptyTag);
                        }
                        var pinTag = new CTag(data.pinned ? "thumbpin" : "thumbpinoff");
                        positionTag.addChildren(pinTag);
                        gridTag.addChildren(positionTag);
                    });
                    var scrollPrefName = dayuse._consts.VB_SCROLL_INFO_PREF_NAME;
                    var gridScroll = this._application.preferences.get(scrollPrefName, null) === true ? "grscrollon" : "grscrolloff";
                    this._application.preferences.reset(scrollPrefName);
                    var gridScrollTag = new CTag(gridScroll);
                    gridTag.addChildren(gridScrollTag);
                    var backgroundType = "user";
                    var backgroundName = settings.selectedBgImage;
                    if (this._application.backgroundImages.userImageURL === backgroundName) {
                        backgroundName = "user";
                        backgroundType = "userown";
                    } else if (this._application.backgroundImages.defaultBackground.file === backgroundName) {
                        backgroundType = "def";
                    }
                    var backgroundTag = new CTag("background");
                    backgroundTag.addVars({
                        name: backgroundName,
                        set: backgroundType
                    });
                    productCTag.addChildren(backgroundTag);
                    var searchTag = new CTag(settings.showSearchForm ? "searchon" : "searchoff");
                    productCTag.addChildren(searchTag);
                    var viewType = "thumbviewlogo";
                    switch (settings.thumbStyle) {
                    case 2:
                        viewType = "thumbviewboth";
                        break;
                    case 3:
                        viewType = "thumbviewscreen";
                        break;
                    }
                    var viewTypeTag = new CTag(viewType);
                    productCTag.addChildren(viewTypeTag);
                    var showbookmarksTag = new CTag(settings.showBookmarks ? "bookpanelon" : "bookpaneloff");
                    productCTag.addChildren(showbookmarksTag);
                    this._calcCommonData(productCTag, topBrowserWindow);
                    callback(productCTag);
                }.bind(this));
            }
        }
    });
const elmntDayuseDataCollector = Object.create(dayuseDataCollector, {
        _productTagName: { value: "elmnt" },
        collect: {
            value: function elmntDayuseDataCollector_collect(callback) {
                var application = dayuse._application;
                var topBrowserWindow = misc.getTopBrowserWindow();
                var overlayControllerName = application.name + "OverlayController";
                var overlayController = topBrowserWindow && topBrowserWindow[overlayControllerName];
                if (!overlayController) {
                    callback(null);
                    return;
                }
                var statUsageSend = application.preferences.get("stat.usage.send", false);
                var productCTag = new CTag("elmnt");
                var widgetsTag = new CTag("widgets");
                productCTag.addChildren(widgetsTag);
                var overlayProvider = application.overlayProvider;
                var allWidgetItems = overlayController.getWidgetItems();
                var getWidgetPosition = function getWidgetPosition(aToolbarItem) {
                    var parent = aToolbarItem;
                    while (parent) {
                        if (parent.localName === "toolbar") {
                            switch (parent) {
                            case overlayController.navToolbar:
                                return "wposnav";
                            case overlayController.appToolbar:
                                return "wposbar";
                            default:
                                return "wposno";
                            }
                        }
                        parent = parent.parentNode;
                    }
                    return "wposno";
                };
                var getDayuseStatProviderData = function getDayuseStatProviderData(module, parentCTag) {
                    var dayuseStatProvider = module && module.core && module.core.dayuseStatProvider;
                    if (!dayuseStatProvider)
                        return;
                    if ("isAuthorized" in dayuseStatProvider) {
                        let authorizedState = dayuseStatProvider.isAuthorized() ? "wauthon" : "wauthoff";
                        let widgetAuthorizedTag = new CTag(authorizedState);
                        parentCTag.addChildren(widgetAuthorizedTag);
                    }
                    if (statUsageSend && "hasSavedLogins" in dayuseStatProvider) {
                        let hasSavedLogins = dayuseStatProvider.hasSavedLogins() ? "wauth" : "wauthno";
                        let widgetSavedLoginsTag = new CTag(hasSavedLogins);
                        parentCTag.addChildren(widgetSavedLoginsTag);
                    }
                    if ("isNotificationsEnabled" in dayuseStatProvider) {
                        let notificationsState = dayuseStatProvider.isNotificationsEnabled() ? "wnotifon" : "wnotifoff";
                        let widgetNotificationsTag = new CTag(notificationsState);
                        parentCTag.addChildren(widgetNotificationsTag);
                    }
                };
                allWidgetItems.forEach(function (aToolbarItem) {
                    var widgetInfo = overlayProvider.parseWidgetItemId(aToolbarItem.id);
                    var widget = overlayController.widgetHost.getWidget(widgetInfo.instanceID);
                    var widgetProtoId = widgetInfo.prototypeID;
                    var widgetName = this.WIDGETS_MAP[widgetProtoId] || widgetProtoId.split("#")[1];
                    if (!widgetName)
                        return;
                    var widgetTag = new CTag(widgetName);
                    var widgetPositionTag = new CTag(getWidgetPosition(aToolbarItem));
                    widgetTag.addChildren(widgetPositionTag);
                    var widgetNativeModule = widget.prototype.nativeModule || null;
                    try {
                        getDayuseStatProviderData(widgetNativeModule, widgetTag);
                    } catch (e) {
                        this._logger.error("Can not get info from 'dayuseStatProvider' for widget '" + widgetProtoId + "'");
                        this._logger.debug(e);
                    }
                    widgetsTag.addChildren(widgetTag);
                }, this);
                var extentionsTag = new CTag("extentions");
                application.widgetLibrary.getPlugins(null, true).forEach(function (plugin) {
                    var pluginId = plugin._unit.componentInfo.id;
                    var pluginName = this.PLUGINS_MAP[pluginId] || pluginId.split("#")[1];
                    if (!pluginName)
                        return;
                    var pluginTag = new CTag(pluginName);
                    extentionsTag.addChildren(pluginTag);
                    var pluginModule = plugin._module || null;
                    try {
                        getDayuseStatProviderData(pluginModule, pluginTag);
                    } catch (e) {
                        this._logger.error("Can not get info from 'dayuseStatProvider' for plugin '" + pluginId + "'");
                        this._logger.debug(e);
                    }
                }, this);
                if (extentionsTag.childrenLength)
                    productCTag.addChildren(extentionsTag);
                var themeTag = new CTag("theme");
                var themeSelected = Preferences.get("lightweightThemes.isThemeSelected") === true || Preferences.get("general.skins.selectedSkin") !== "classic/1.0";
                themeTag.addVars({ name: themeSelected ? "user" : "def" });
                productCTag.addChildren(themeTag);
                var newtabTag = new CTag("newtabext");
                var newtabVar;
                switch (Preferences.get("browser.newtab.url", "about:newtab")) {
                case "yafd:tabs":
                    newtabVar = "yavb";
                    break;
                case "about:blank":
                case "about:newtab":
                    newtabVar = "no";
                    break;
                default:
                    newtabVar = "user";
                    break;
                }
                newtabTag.addVars({ name: newtabVar });
                productCTag.addChildren(newtabTag);
                var diffbarTag = new CTag("diffbar");
                var builtinToolbars = {
                        "toolbar-menubar": true,
                        "TabsToolbar": true,
                        "nav-bar": true,
                        "yasearch-bar": true,
                        "PersonalToolbar": true,
                        "addon-bar": true
                    };
                var diffToolbars = Array.slice(topBrowserWindow.document.querySelectorAll("#navigator-toolbox > toolbar")).filter(function (toolbar) {
                        return !(toolbar.id in builtinToolbars);
                    });
                diffbarTag.addVars({ count: diffToolbars.length });
                productCTag.addChildren(diffbarTag);
                if (statUsageSend) {
                    let isYandexHost = function isYandexHost(url) {
                        url = (url || "").replace(/^https?:\/\//, "").replace(/((:\d+)?\/)?$/, "");
                        return application.isYandexHost(url);
                    };
                    let yaloginTag = new CTag("yalogin");
                    const LOGIN_MANAGER = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
                    let yaloginVar = LOGIN_MANAGER.getAllLogins().filter(function (login) {
                            return isYandexHost(login.hostname);
                        }).length;
                    yaloginTag.addVars({ count: yaloginVar });
                    productCTag.addChildren(yaloginTag);
                }
                this._calcCommonData(productCTag, topBrowserWindow);
                callback(productCTag);
            }
        },
        WIDGETS_MAP: {
            value: {
                "http://bar-widgets.yandex.ru/packages/approved/91/manifest.xml#profile": "vk",
                "http://bar-widgets.yandex.ru/packages/approved/115/manifest.xml#facebook": "facebook",
                "http://bar-widgets.yandex.ru/packages/approved/140/manifest.xml#odnoklassniki": "odnoklassniki",
                "http://bar-widgets.yandex.ru/packages/approved/172/manifest.xml#twitter": "twitter",
                "http://bar-widgets.yandex.ru/packages/approved/97/manifest.xml#gmail": "gmail",
                "http://bar-widgets.yandex.ru/packages/approved/82/manifest.xml#mailru": "mailru",
                "http://bar-widgets.yandex.ru/packages/approved/75/manifest.xml#rambler": "mailrambler",
                "http://bar-widgets.yandex.ru/packages/approved/134/manifest.xml#hotmail": "hotmail",
                "http://bar-widgets.yandex.ru/packages/approved/126/manifest.xml#yahoomail": "mailyahoo",
                "http://bar-widgets.yandex.ru/packages/approved/127/manifest.xml#news": "newstr",
                "http://bar-widgets.yandex.ru/packages/approved/130/manifest.xml#games": "gamestr",
                "http://bar-widgets.yandex.ru/packages/approved/184/manifest.xml#sport": "sport",
                "http://bar.yandex.ru/packages/yandexbar#logo": "yalogo",
                "http://bar.yandex.ru/packages/yandexbar#login": "yalogin",
                "http://bar.yandex.ru/packages/yandexbar#money": "yamoney",
                "http://bar.yandex.ru/packages/yandexbar#yaru": "yaru",
                "http://bar.yandex.ru/packages/yandexbar#fotki": "fotki",
                "http://bar-widgets.yandex.ru/packages/approved/118/manifest.xml#radio": "radio",
                "http://bar.yandex.ru/packages/yandexbar#quote": "quotation",
                "http://bar.yandex.ru/packages/yandexbar#opinions": "reviews",
                "http://bar.yandex.ru/packages/yandexbar#zakladki": "yabookmarks",
                "http://bar.yandex.ru/packages/yandexbar#lenta": "yasubscription",
                "http://bar.yandex.ru/packages/yandexbar#cy": "yatic",
                "http://bar.yandex.ru/packages/yandexbar#mail": "yamail",
                "http://bar.yandex.ru/packages/yandexbar#town": "yacity",
                "http://bar.yandex.ru/packages/yandexbar#music": "yamusic"
            }
        },
        PLUGINS_MAP: { value: { "http://bar.yandex.ru/packages/yandexbar#textonly": "readability" } }
    });
