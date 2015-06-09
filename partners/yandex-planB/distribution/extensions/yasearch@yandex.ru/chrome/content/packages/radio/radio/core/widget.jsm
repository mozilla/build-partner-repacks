"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
var core = function () {
    var coreHelper = null;
    function loadHelper(api, appObj, widgetPath, commonPath) {
        var scopeObj = {};
        var modulePath = api.Package.resolvePath("-common/modules/corehelper.jsm");
        Components.utils.import(modulePath, scopeObj);
        coreHelper = scopeObj.core_helper(api, appObj, widgetPath, commonPath);
    }
    return {
        get Settings() coreHelper.Settings,
        get dayuseStatProvider() coreHelper.dayuseStatProvider,
        init: function (api) {
            loadHelper(api);
            coreHelper.init(api, this);
        },
        finalize: function () {
            coreHelper.finalize();
            coreHelper = null;
        },
        buildWidget: function (WIID, toolbarItem) {
            coreHelper.buildWidget(WIID, toolbarItem);
        },
        destroyWidget: function (WIID, toolbarItem) {
            coreHelper.destroyWidget(WIID, toolbarItem);
        },
        onNoMoreInstProjections: function (WIID) {
            coreHelper.onNoMoreInstProjections(WIID);
        }
    };
}();
var resources = { browser: { styles: [] } };
