"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const resources = { browser: { styles: ["/native/fx/games/browser.css"] } };
const WIDGET_ID = "http://bar.yandex.ru/packages/games#games";
const core = {
    init: function GamesWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        try {
            let storage = this._api.Files.getWidgetStorage(true);
            storage.append("options.json");
            this._storage = storage;
        } catch (e) {
            this._logger.error("Cannot obtain storage for games button: " + e);
        }
    },
    finalize: function GamesWidget_finalize() {
        delete this._api;
        delete this._logger;
        if (this.popupWindow)
            this.popupWindow.close();
    },
    buildWidget: function GamesWidget_buildWidget(WIID, item) {
        item.setAttribute("xb-native-widget-name", WIDGET_ID);
        item.setAttribute("xb-native-widget-wiid", WIID);
        item.module = this;
    },
    destroyWidget: function GamesWidget_destroyWidget(WIID, item, context) {
    },
    statLog: function (type) {
        if (this._api.Statistics.logClickStatistics) {
            this._api.Statistics.logClickStatistics({
                cid: 72359,
                path: "fx.gamestr." + type
            });
        } else {
            var url = "http://clck.yandex.ru/click" + "/dtype=stred" + "/pid=12" + "/cid=72359" + "/path=fx.gamestr." + type + "/*";
            var HTTPRequest = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"];
            var req = HTTPRequest.createInstance();
            req.open("GET", url, true);
            req.send();
        }
    },
    get popupURL() {
        return this._api.Package.resolvePath("native/fx/games/ui/games.html");
    },
    get errorURL() {
        return this._api.Package.resolvePath("native/fx/games/ui/error.html");
    },
    get errorMessage() {
        return this.getString("errorMessage");
    },
    get iconURL() {
        return this._api.Package.resolvePath("icons/games.svg");
    },
    get iconCheckedURL() {
        return this.iconURL;
    },
    get iconDisabledURL() {
        return this._api.Package.resolvePath("icons/games_disabled.svg");
    },
    get frameURL() {
        return this._api.Package.resolvePath("native/fx/games/frame.xul");
    },
    GET_FLASH_URL: "http://get.adobe.com/flashplayer/",
    getString: function GamesWidget_getString(key) {
        if (!this._stringBundle)
            this._stringBundle = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService).createBundle(this._api.Package.resolvePath("/games.properties"));
        return this._stringBundle.GetStringFromName(key);
    },
    getOption: function GamesWidget_getOption(option) {
        try {
            let options = JSON.parse(this._api.Files.readTextFile(this._storage));
            return options[option];
        } catch (e) {
            this._logger.debug("Game button: failed to load option." + e);
            return null;
        }
    },
    setOption: function GamesWidget_setOption(option, value) {
        try {
            let options = {};
            try {
                options = JSON.parse(this._api.Files.readTextFile(this._storage));
            } catch (e) {
            }
            options[option] = value;
            this._api.Files.writeTextFile(this._storage, JSON.stringify(options));
        } catch (e) {
            this._logger.error("Game button: failed to save option." + e);
        }
    },
    get barApi() {
        if (!this._barApi) {
            let module = this;
            this._barApi = {
                onGamesPopupUnload: function (popup) {
                    module.setOption("position", {
                        x: Math.max(popup.mozInnerScreenX, 1),
                        y: Math.max(popup.mozInnerScreenY, 1)
                    });
                    module.checkOnClose();
                },
                setOption: function (option, value) {
                    module.setOption(option, value);
                },
                getOption: function (option) {
                    return module.getOption(option);
                },
                getString: function (string) {
                    return module.getString(string);
                },
                get fx3url() {
                    return module.frameURL;
                },
                get errorURL() {
                    return module.errorURL;
                },
                clickStat: function (action) {
                    module._api.Statistics.logCustomAction(action);
                },
                statLog: function (type) {
                    module.statLog(type);
                },
                log: function (str) {
                    module._logger.debug(str);
                },
                openPage: function (url) {
                    module._api.Controls.navigateBrowser({
                        url: url,
                        target: "new tab"
                    });
                }
            };
        }
        return this._barApi;
    },
    checkOnClose: function GamesWidget_checkOnClose() {
        this._forEachToolbarItem(function (item) {
            if ("setButtonStatus" in item)
                item.setButtonStatus();
        });
    },
    _forEachToolbarItem: function GamesWidget__forEachToolbarItem(aFunction, aContext, aArguments) {
        let browserWindows = [];
        let wndEnum = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getEnumerator("navigator:browser");
        while (wndEnum.hasMoreElements())
            browserWindows.push(wndEnum.getNext());
        for (let i = browserWindows.length; i--;) {
            try {
                let toolbaritem = browserWindows[i].document.querySelector("[xb-native-widget-name='" + WIDGET_ID + "']");
                if (toolbaritem) {
                    let args = aArguments || [];
                    args.unshift(toolbaritem);
                    aFunction.apply(aContext || null, args);
                }
            } catch (e) {
                this._logger.error(e);
                this._logger.debug(e.stack);
            }
        }
        return browserWindows.length;
    },
    checkFlashInstalled: function GamesWidget_checkFlashInstalled() {
        if (this._pluginFound === undefined) {
            let ph = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
            this._pluginFound = ph.getPluginTags({}).some(function (p) {
                return p.name === "Shockwave Flash" && !p.disabled;
            });
        }
        return this._pluginFound;
    }
};
