"use strict";
var EXPORTED_SYMBOLS = ["module"];
function module(proxy) {
    var T = proxy.module("sklib.Template");
    var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    var ApplicationUI = function (application) {
        this.application = application;
        this.notifyTopic = application.notifyTopic + "-ui";
    };
    ApplicationUI.prototype = {
        getWidgetBindingUrl: function () {
            var xblPackagePath = "/code/hotmail/ui/hotmail-toolbaritem.xbl";
            var xbPath = proxy.api.Package.resolvePath(xblPackagePath);
            return xbPath;
        },
        getWidgetBindingStyle: function () {
            var template = "url(\"$0\")";
            return T(template, [this.getWidgetBindingUrl()]);
        },
        executeUICommand: function (aCmdText) {
            proxy.logger.debug(T("executeUICommand $0", [aCmdText]));
            var params = aCmdText.split("-");
            var method = this.application.api["cmd_" + params[0]];
            if (method) {
                params.shift();
                method.apply(this.application.api, params);
            } else {
                proxy.logger.warn(T("No such method $0", [method]));
            }
        },
        buildWidget: function (wiid, toolbaritem) {
            toolbaritem.uiManager = this;
            toolbaritem.proxy = proxy;
            toolbaritem.wiid = wiid;
            toolbaritem.displayData = this.application.displayData;
            toolbaritem.style.MozBinding = this.getWidgetBindingStyle();
        },
        destroyWidget: function (wiid, toolbaritem) {
        },
        getSettingsAttribute: function () {
            var keys = [];
            var retVal = "";
            var properties = [];
            for (var i = 0, l = keys.length; i < l; ++i) {
                if (this.application.settings.getValue(keys[i])) {
                    properties.push(keys[i]);
                }
            }
            retVal = properties.join(" ");
            return retVal;
        },
        updateView: function () {
            observerService.notifyObservers(null, this.notifyTopic, "update-view");
        }
    };
    return ApplicationUI;
}
