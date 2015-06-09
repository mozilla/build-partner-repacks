EXPORTED_SYMBOLS = ["core_helper"];
var core_helper = function (barapi, appObj, widgetPath, commonPath) {
    var idhashfi = barapi.componentID.lastIndexOf("#");
    var idhash = idhashfi > 0 ? barapi.componentID.substring(idhashfi + 1) : "";
    widgetPath = widgetPath || idhash + "/";
    if (widgetPath && widgetPath.charAt(widgetPath.length - 1) != "/") {
        widgetPath = widgetPath + "/";
    }
    commonPath = commonPath || "/-common/";
    if (commonPath && commonPath.charAt(commonPath.length - 1) != "/") {
        commonPath = commonPath + "/";
    }
    var COMMON_MODULE_PATH = commonPath + "modules/";
    var app = null;
    var appConfigSrc = null;
    var common = null;
    var loadedModules = null;
    var loadedModulesArr = null;
    var rxFinModType = /object|function/;
    var instMap = {};
    function importModule(moduleName) {
        var m = loadedModules[moduleName];
        if (m) {
            return m.loadRet;
        }
        try {
            var modulePath = common.api.Package.resolvePath(moduleName + (/\.jsm?$/i.test(moduleName) ? "" : ".jsm")), scopeObj = {};
            var lastSplitter = moduleName.lastIndexOf("/");
            common.log("importModule: modulePath = " + modulePath);
            Components.utils.import(modulePath, scopeObj);
            m = { loadRet: scopeObj.module ? scopeObj.module.call(scopeObj, app, common, moduleName.substring(0, lastSplitter + 1)) : null };
            loadedModules[moduleName] = m;
            if (m.loadRet && rxFinModType.test(typeof m.loadRet)) {
                loadedModulesArr.push(m.loadRet);
            }
            return m.loadRet;
        } catch (exc) {
            common.reportError("[importModule] " + moduleName, exc);
            return null;
        }
    }
    function Application() {
    }
    Application.prototype = {
        constructor: Application,
        importModule: function (module) {
            return importModule(widgetPath + "modules/" + module);
        },
        commonModule: function (module) {
            return importModule(widgetPath + "modules/common/" + module + "/module");
        },
        logr: function (text, method) {
            if (this.api && this.api.logger) {
                this.api.logger[method || "debug"](text);
            } else {
                var cs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
                cs.logStringMessage((this.config ? this.config.name : "barwidget") + ": " + text);
            }
        },
        log: function (text, method) {
            if (this.DEBUG) {
                this.logr(text, method);
            }
        },
        logObj: function (obj, prefix, method) {
            if (this.DEBUG) {
                this.logr((prefix || "") + (obj && typeof obj == "object" ? "\n" + JSON.stringify(obj, "", 3) : obj), method);
            }
        },
        get entities() {
            return this._wgtEntities || (this._wgtEntities = common.utils.readFile("entities.dtd", "dtd"));
        },
        getAppUrl: function (inpUrl, param) {
            if (inpUrl && this.config && this.config.navigateUrl) {
                var url = this.config.navigateUrl[inpUrl];
                if (typeof url == "function") {
                    url = url.call(this, param);
                }
                inpUrl = url ? url.replace(/\{PARAM\}/g, param) || inpUrl : inpUrl;
            }
            return inpUrl;
        },
        navigateBrowser: function (obj, param) {
            if (typeof obj == "string") {
                obj = { url: obj };
            }
            if (obj && obj.url) {
                obj.url = this.getAppUrl(obj.url, param);
                this.api.Controls.navigateBrowser(obj);
            }
        },
        getInstance: function (wiid) {
            return instMap[wiid] || null;
        }
    };
    function loadConfig(first) {
        if (first) {
            appConfigSrc = app.config && typeof app.config == "object" ? app.config : null;
        }
        var conf = appConfigSrc;
        if (!conf) {
            common.log("load app.config");
            var text = common.utils.readFile("app.config", "text", true);
            if (text) {
                try {
                    conf = eval("(" + text + ")");
                } catch (exc) {
                    app.logr("app.config parse error");
                }
            }
        }
        app.config = common.branding.brandingObject(conf);
        app.config.name = app.config.name || idhash;
        app.config.statName = app.config.statName || app.config.name;
    }
    function changeBrid(brid, old) {
        loadConfig(false);
        common.observerService.notify("branding", {
            brid: brid,
            oldBrid: old
        });
    }
    function createApp(api, src) {
        src = src || "app";
        var type = typeof src;
        if (type == "string") {
            app = new Application();
            app.api = api;
            app.importModule(src);
        } else {
            if (type == "function") {
                src = new src(common);
            }
            app = src;
            var ob = Application.prototype;
            for (var i in ob) {
                if (i != "constructor" && ob.hasOwnProperty(i)) {
                    app[i] = ob[i];
                }
            }
            app.api = api;
        }
        app.componentName = idhash;
    }
    return {
        _idhash: idhash,
        init: function (api, coreObj, resources) {
            common = {
                api: api,
                _commonUrl: api.Package.resolvePath(commonPath),
                _appUrl: api.Package.resolvePath(widgetPath),
                log: Application.prototype.log,
                logObj: Application.prototype.logObj,
                logr: Application.prototype.logr,
                reportError: function (pfx, exc) {
                    if (arguments.length == 1) {
                        exc = pfx;
                        pfx = "";
                    }
                    this.logr((pfx ? pfx + ": \n" : "") + exc + "\nfile: " + exc.fileName + "\nline: " + exc.lineNumber, "error");
                },
                resolvePath: function (path) {
                    if (/^(https?|xb|chrome|resource):\/\//.test(path)) {
                        return path;
                    }
                    if (path && path[0] == "/") {
                        path = path.substr(1);
                    }
                    return this._appUrl + (path || "");
                }
            };
            loadedModules = {};
            loadedModulesArr = [];
            importModule(COMMON_MODULE_PATH + "utils");
            common.timers = importModule(COMMON_MODULE_PATH + "timers");
            common.http = importModule(COMMON_MODULE_PATH + "http");
            common.observerService = importModule(COMMON_MODULE_PATH + "observerService");
            common.storage = importModule(COMMON_MODULE_PATH + "storage");
            common.branding = importModule(COMMON_MODULE_PATH + "branding");
            common.ui = importModule(COMMON_MODULE_PATH + "ui");
            common.statistics = importModule(COMMON_MODULE_PATH + "statistics");
            common.branding.init(changeBrid);
            try {
                createApp(api, appObj);
                if (app.DEBUG !== true) {
                    app.DEBUG = /ybar_packages_debug/.test(api.componentID);
                }
                common.DEBUG = app.DEBUG;
                common._app = app;
                coreObj._app = app;
                loadConfig(true);
                if (!app.config.observeBranding) {
                    common.branding.stop();
                }
                if (app.init) {
                    app.init(common, resources);
                }
                if (typeof app.onSettingChange == "function") {
                    api.Settings.observeChanges(app);
                }
            } catch (exc) {
                common.reportError("[init app]", exc);
            }
            return this;
        },
        finalize: function () {
            app.log("*** finalize");
            if (typeof app.onSettingChange == "function") {
                app.api.Settings.ignoreChanges(app);
            }
            if (typeof app.finalize == "function") {
                app.finalize();
            }
            for (var i = loadedModulesArr.length - 1; i >= 0; --i) {
                if (typeof loadedModulesArr[i].finalize == "function") {
                    loadedModulesArr[i].finalize();
                }
            }
            app.config = appConfigSrc;
            loadedModules = null;
            loadedModulesArr = null;
            app = null;
            common._app = null;
            common = null;
            appConfigSrc = null;
            instMap = {};
        },
        buildWidget: function (WIID, toolbarItem) {
            toolbarItem.application = app;
            toolbarItem.common = common;
            if (app.config.uniqueWidget !== false) {
                app.WIID = WIID;
            } else {
                toolbarItem.WIID = WIID;
            }
            if (!instMap[WIID] && app.instancePrototype) {
                if (!app.instancePrototype.notifyObservers) {
                    app.instancePrototype.notifyObservers = function (topic, data) {
                        common.observerService.notify(this.WIID + "#" + topic, data);
                    };
                }
                var inst = Object.create(app.instancePrototype);
                inst.WIID = WIID;
                inst.app = app;
                if (typeof inst.init == "function") {
                    inst.init();
                }
                if (typeof inst.onSettingChange == "function") {
                    app.api.Settings.observeChanges(inst, WIID);
                }
                instMap[WIID] = inst;
            }
            if (instMap[WIID]) {
                toolbarItem.appinst = instMap[WIID];
            }
            toolbarItem.style.MozBinding = "url(\"" + common.resolvePath("content/widget.xbl#toolbarbutton") + "\")";
            toolbarItem.setAttribute("ybar-native-widget-name", app.config.name);
        },
        destroyWidget: function (WIID, toolbarItem) {
            if (toolbarItem.__removeObservers) {
                toolbarItem.__removeObservers();
            }
            if (typeof toolbarItem.ybwFinalize == "function") {
                toolbarItem.ybwFinalize();
            }
            toolbarItem.WIID = null;
            toolbarItem.style.MozBinding = "";
            toolbarItem.removeAttribute("ybar-native-widget-name");
            toolbarItem.application = null;
            toolbarItem.common = null;
            toolbarItem.appinst = null;
            toolbarItem.__XBID__ = null;
        },
        initURLBarItem: function CoreHelper_initURLBarItem(itemElement, itemClass) {
            itemElement.application = app;
            itemElement.common = common;
            itemElement.style.MozBinding = "url('" + common.resolvePath("content/plugin.xbl#toolbarbutton") + "')";
            itemElement.setAttribute("yb-native-plugin-name", app.config.name);
            return {
                finalize: function () {
                    if (typeof itemElement.__removeObservers === "function") {
                        itemElement.__removeObservers();
                    }
                    if (typeof itemElement.ybwFinalize === "function") {
                        itemElement.ybwFinalize();
                    }
                    itemElement.application = null;
                    itemElement.common = null;
                    itemElement.__YAXBID__ = null;
                    itemElement.style.mozBinding = "none";
                }
            };
        },
        onNoMoreInstProjections: function (WIID) {
            if (instMap[WIID]) {
                var inst = instMap[WIID];
                if (typeof inst.onSettingChange == "function") {
                    app.api.Settings.ignoreChanges(inst, WIID);
                }
                if (typeof inst.finalize == "function") {
                    inst.finalize();
                }
                delete instMap[WIID];
            }
        },
        get Settings() app.Settings || null,
        get dayuseStatProvider() app.dayuseStatProvider || null
    };
};
