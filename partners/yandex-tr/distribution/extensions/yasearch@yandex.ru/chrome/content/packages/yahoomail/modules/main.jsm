var EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const DEBUG = true;
function Application() {
    var $ = this;
    $.xbCore = {
        init: function (api) {
            $.init(api);
        },
        finalize: function () {
            $.finalize();
        },
        buildWidget: function (WIID, toolbarItem) {
            $.WIID = WIID;
            $.toolbarItem = toolbarItem;
            toolbarItem.application = $;
            toolbarItem.setAttribute("xb-native-widget-name", $.widget_name);
            $.notify("widget-instance-created");
        },
        destroyWidget: function (WIID, toolbarItem) {
            toolbarItem.removeAttribute("xb-native-widget-name");
            toolbarItem.removeAttribute("status");
            toolbarItem.application = undefined;
        },
        dayuseStatProvider: {
            isAuthorized: function dayuseStatProvider_isAuthorized() {
                return $.widget && $.widget.isAuth() || false;
            },
            hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
                var propertyBag = Components.classes["@mozilla.org/hash-property-bag;1"].createInstance(Components.interfaces.nsIWritablePropertyBag);
                propertyBag.setProperty("formSubmitURL", "https://login.yahoo.com");
                propertyBag.QueryInterface(Components.interfaces.nsIPropertyBag).QueryInterface(Components.interfaces.nsIPropertyBag2).QueryInterface(Components.interfaces.nsIWritablePropertyBag2);
                var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
                return loginManager.searchLogins({}, propertyBag).filter(function (login) {
                    return !!login.formSubmitURL;
                }).length;
            }
        }
    };
    $.init = function (api) {
        $.api = api;
        $.log("init");
        var StorableObject = $.importModule("StorableObject.jsm");
        $.settings = new StorableObject($.settings_file);
        $.importModule("application.utils.jsm");
        $.importModule("application.notify.jsm");
        $.XMLHttpRequest = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"];
        $.loadLibrary("jsOAuth-1.1.js");
        $.isYa = true;
        var service = $.api.Services.obtainService("ru.yandex.custombar.branding", "package", function () {
        });
        if (service) {
            let brandID = service.getBrandID();
            if (brandID != "yandex") {
                $.isYa = false;
            }
        }
        $.start();
    };
    $.finalize = function () {
        $.widget.destroy();
        application.notify("finalize");
    };
    $.start = function () {
        var MailAPI = $.importModule("yahoomail.api.jsm");
        var Widget = $.importModule("yahoomail.jsm");
        $.widget = new Widget();
        $.widget.init(new MailAPI());
    };
    $.SaveStorage = function () {
        $.log("SaveStorage [" + $.settings_file + "] " + JSON.stringify($.settings));
        $.settings.__save__($.settings_file);
    };
    $.ClearStorage = function () {
        $.log("ClearStorage [" + $.settings_file + "]");
        $.settings.__clear__($.settings_file);
    };
    $.loadAccountData = function () {
        var accountData = null;
        if ("undefined" !== typeof $.settings.accountData) {
            accountData = $.settings.accountData;
        }
        return accountData;
    };
    $.loadLibrary = function (library) {
        var libraryPath = $.api.Package.resolvePath("lib/" + library);
        $.log("Load library \"" + library + "\".");
        var scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
        scriptLoader.loadSubScript(libraryPath, $);
    };
}
Application.prototype = {
    widget_name: "ru.yandex.bar.yahoomail",
    settings_file: "yahoomail.settings.json",
    importModule: function (module) {
        var $ = this;
        var path = $.api.Package.resolvePath("modules/" + module);
        var scope = {};
        $.log("Application.importModule " + module);
        Components.utils.import(path, scope);
        $.log(module + " loaded");
        return scope.module($);
    },
    log: function (message) {
        this.api.logger.debug(message);
    },
    toString: function () {
        return "[Application " + this.widget_name + "]";
    }
};
var application = new Application();
var core = application.xbCore;
var resources = {
    browser: {
        styles: [
            "/content/bindings.css",
            "/xb-skin/default/style.css"
        ]
    }
};
