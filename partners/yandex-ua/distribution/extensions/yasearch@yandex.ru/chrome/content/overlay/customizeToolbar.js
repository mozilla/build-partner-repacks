(function () {
    "use strict";
    const XBCustomizeHelper = {
        _appName: CB_APP_NAME,
        get _barCore() {
            delete this._barCore;
            this._barCore = Components.classes["@yandex.ru/custombarcore;" + this._appName].getService().wrappedJSObject;
            return this._barCore;
        },
        get _application() {
            delete this._application;
            return this._application = this._barCore.application;
        },
        get _logger() {
            delete this._logger;
            return this._logger = this._application.getLogger("XBCustomizeHelper");
        },
        _init: function XBCHelper__init() {
            let me = this;
            let origRestoreDefaultSet = window.restoreDefaultSet;
            window.restoreDefaultSet = function XBCHelper_restoreDefaultSet() {
                try {
                    me._onRestoreDefaultSet();
                } catch (e) {
                    me._logger.error("XBCHelper_restoreDefaultSet error: " + e);
                }
                return origRestoreDefaultSet.apply(window, arguments);
            };
            let prefsWindow = this._barCore.Lib.misc.getTopWindowOfType(this._appName + ":Preferences");
            if (prefsWindow) {
                prefsWindow.document.documentElement.cancelDialog();
            }
        },
        _onRestoreDefaultSet: function XBCHelper__onRestoreDefaultSet() {
            let toolbox = gToolboxDocument.getElementById("navigator-toolbox");
            if (toolbox) {
                toolbox.removeAttribute("cb-barless");
            }
            this._barCore.application.widgetLibrary.setDefaultPluginsState();
        }
    };
    window.addEventListener("load", function onLoadListener(aLoadEvent) {
        aLoadEvent.currentTarget.removeEventListener("load", onLoadListener, false);
        XBCustomizeHelper._init();
    }, false);
}());
