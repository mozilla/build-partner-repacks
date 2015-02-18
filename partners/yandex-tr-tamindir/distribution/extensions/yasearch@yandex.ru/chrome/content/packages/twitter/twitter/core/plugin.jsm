"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
var core = function () {
    var coreHelper = null;
    function loadHelper(api, appObj, widgetPath, commonPath) {
        var modulePath = api.Package.resolvePath("-common/modules/corehelper.jsm"), scopeObj = {};
        Components.utils.import(modulePath, scopeObj);
        coreHelper = scopeObj.core_helper(api, appObj, widgetPath, commonPath);
    }
    return {
        get Settings() coreHelper.Settings,
        get dayuseStatProvider() coreHelper.dayuseStatProvider,
        init: function (api) {
            loadHelper(api);
            coreHelper.init(api, this, resources);
        },
        finalize: function () {
            coreHelper.finalize();
            coreHelper = null;
        },
        initURLBarItem: function Plugin_initURLBarItem(itemElement, itemClass) {
            return coreHelper.initURLBarItem(itemElement, itemClass);
        }
    };
}();
let resources = { browser: { styles: [] } };
