"use strict";
var EXPORTED_SYMBOLS = ["core"];
var APP_MODULE = "";
var ENVIRONMENT = "${config.environment}";
var MODULES_PATH = "/code";
var MODULE_NAME_SUFFIX = ".js";
var MODULE_ENCODING = "UTF-8";
var MODULES_CAN_UNLOAD = typeof Components.utils.unload !== "undefined";
var modules = {};
function createModuleImporter(api) {
    var logger = api.logger;
    var module;
    function callUnloadHandler(name) {
        var moduleWrapper = modules[name];
        try {
            logger.trace("Execute unload handler in module " + name);
            moduleWrapper.proxy.onmoduleunload();
        } catch (e) {
            var messageTemplate = "Error executing unload handler in module \"%s\". See next message for details:";
            logger.trace(messageTemplate.replace("%s", name));
            logger.error(e);
        }
    }
    function unloadModule(name) {
        logger.trace("Unloading module " + name);
        if (MODULES_CAN_UNLOAD) {
            Components.utils.unload(modules[name].path);
        }
        delete modules[name];
    }
    function unloadAllModules() {
        for (var moduleInstance in modules) {
            if (modules.hasOwnProperty(moduleInstance)) {
                callUnloadHandler(moduleInstance);
            }
        }
    }
    function getModuleWrapper(name) {
        var pathDelimiter = "/";
        var classDelimiter = /\./g;
        var packagePath = [
            MODULES_PATH,
            name.replace(classDelimiter, pathDelimiter) + MODULE_NAME_SUFFIX
        ].join(pathDelimiter);
        var xbPath = api.Package.resolvePath(packagePath);
        var scope = {};
        try {
            var scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
            scriptLoader.loadSubScript(xbPath, scope, MODULE_ENCODING);
        } catch (e) {
            var messageTemplate = "Error loading module \"%s\". See next message for details:";
            api.logger.trace(messageTemplate.replace("%s", name));
            api.logger.error(e);
        }
        return {
            path: xbPath,
            module: scope.module
        };
    }
    var ModuleProxy = function (name) {
        this._moduleName = name;
    };
    ModuleProxy.prototype = {
        constructor: ModuleProxy,
        onmoduleunload: function () {
        },
        logger: logger,
        api: api
    };
    module = function (name) {
        if (!modules.hasOwnProperty(name)) {
            logger.trace("Loading module " + name);
            var wrapper = getModuleWrapper(name);
            var proxy = new ModuleProxy(name);
            try {
                var moduleBody = wrapper.module.call({}, proxy);
                modules[name] = {
                    path: wrapper.path,
                    module: moduleBody,
                    proxy: proxy
                };
            } catch (e) {
                var logMsg = "Error loading module \"%name\". See next message for details:".replace("%name", name);
                logger.trace(logMsg);
                logger.error(e);
            }
        } else {
        }
        return modules[name].module;
    };
    ModuleProxy.prototype.module = module;
    module.unloadAll = unloadAllModules;
    return module;
}
var application;
var module;
var api;
var core = {
    init: function (barApi) {
        api = barApi;
        try {
            APP_MODULE = api.Settings.getValue("sklib.StartupClass");
            module = createModuleImporter(api);
            var Application = module(APP_MODULE);
            application = new Application(ENVIRONMENT);
        } catch (e) {
            var message = "Error creating application \"%s\". See next message for details:";
            api.logger.trace(message.replace("%s", APP_MODULE));
            api.logger.error(e);
        }
    },
    buildWidget: function (WIID, toolbaritem) {
        try {
            application.ui.buildWidget(WIID, toolbaritem);
        } catch (e) {
            var message = "Error build widget in \"%s\". See next message for details:";
            api.logger.warn(message.replace("%s", APP_MODULE));
            api.logger.error(e);
        }
    },
    destroyWidget: function (WIID, toolbaritem) {
        try {
            application.ui.destroyWidget(WIID, toolbaritem);
        } catch (e) {
            var message = "Error destroy widget in \"%s\". See next message for details:";
            api.logger.warn(message.replace("%s", APP_MODULE));
            api.logger.error(e);
        }
    },
    finalize: function () {
        module.unloadAll();
    },
    dayuseStatProvider: {
        isAuthorized: function dayuseStatProvider_isAuthorized() {
            return application.isAuth();
        },
        hasSavedLogins: function dayuseStatProvider_hasSavedLogins() {
            var propertyBag = Components.classes["@mozilla.org/hash-property-bag;1"].createInstance(Components.interfaces.nsIWritablePropertyBag);
            propertyBag.setProperty("formSubmitURL", "https://login.live.com");
            propertyBag.QueryInterface(Components.interfaces.nsIPropertyBag).QueryInterface(Components.interfaces.nsIPropertyBag2).QueryInterface(Components.interfaces.nsIWritablePropertyBag2);
            var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            return loginManager.searchLogins({}, propertyBag).filter(function (login) {
                return !!login.formSubmitURL;
            }).length;
        }
    }
};
