EXPORTED_SYMBOLS = [
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
        },
        get Settings() coreHelper.Settings,
        get dayuseStatProvider() coreHelper.dayuseStatProvider
    };
}();
var resources = { browser: { styles: [] } };
