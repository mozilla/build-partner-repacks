'use strict';
const EXPORTED_SYMBOLS = ['XB'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
const GLOBAL = this;
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
var BarPlatform;
const XB = {
        init: function XB_init(barApplication) {
            this._application = barApplication;
            BarPlatform = barApplication.BarPlatform;
            barApplication.core.Lib.sysutils.copyProperties(barApplication.core.Lib, GLOBAL);
            this._logger = barApplication.getLogger('XB');
            this._loadModules();
            XB._base.init(barApplication);
            XB._Parser.init();
            barApplication.core.xbProtocol.setDataProvider('toolkit', this._base.toolkitDataProvider);
        },
        finalize: function XB_finalize(doCleanup, callback) {
            this._application.core.xbProtocol.setDataProvider('toolkit', null);
            XB._base.finalize();
        },
        _application: null,
        _modules: [
            'xbbase.js',
            'xbtypes.js',
            'xbcalcnodes.js',
            'xbparser.js',
            'xbwidget.js',
            'xbfuncs.js',
            'xbui.js',
            'ui/event-listener.js',
            'ui/behaviour.js',
            'ui/behaviour/widget.js',
            'ui/behaviour/text.js',
            'ui/behaviour/computed.js',
            'ui/behaviour/action.js',
            'ui/behaviour/url.js',
            'ui/behaviour/attribute.js',
            'ui/behaviour/extra-text.js',
            'ui/behaviour/menu.js',
            'ui/behaviour/tooltip.js',
            'ui/behaviour/style.js',
            'ui/behaviour/button.js',
            'ui/behaviour/checkbox.js',
            'ui/behaviour/enabled.js',
            'ui/behaviour/checked.js',
            'ui/behaviour/image.js',
            'ui/behaviour/grid.js',
            'ui/behaviour/xml.js',
            'ui/elements.js'
        ],
        _loadModules: function XB__loadModules() {
            const xbDirPath = this._application.partsURL + 'xb/';
            const SCRIPT_LOADER = Cc['@mozilla.org/moz/jssubscript-loader;1'].getService(Ci.mozIJSSubScriptLoader);
            this._modules.forEach(function xb_loadModule(moduleFileName) {
                this._logger.debug('  Loading module ' + moduleFileName);
                SCRIPT_LOADER.loadSubScript(xbDirPath + moduleFileName);
            }, this);
        }
    };
