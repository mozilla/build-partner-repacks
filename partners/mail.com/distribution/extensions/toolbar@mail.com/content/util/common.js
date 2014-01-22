/**
 * This loads all our most common library files.
 * It should be loaded in every file, so that we always have them available.
 *
 * This file is specifically for XUL overlays that are loaded into
 * the Firefox UI.
 * Compare common-html.js for HTML UI files.
 *
 * It is loading the libraries into the |unitedinternet.common| context.
 * Then you load your UI code using initModule() (also defined here),
 * which will merge the |common| context with your module.
 */

var unitedinternet;
if (!unitedinternet)
{
  unitedinternet = {};
  unitedinternet.common = {};
  Components.utils.import("resource://unitedtb/util/util.js", unitedinternet.common);
  Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js", unitedinternet.common);
  Components.utils.import("resource://unitedtb/util/fetchhttp.js", unitedinternet.common);
  Components.utils.import("resource://unitedtb/util/observer.js", unitedinternet.common);
  Components.utils.import("resource://unitedtb/util/brand-var-loader.js", unitedinternet.common);
  unitedinternet.common.build = {};
  Components.utils.import("resource://unitedtb/build.js", unitedinternet.common.build);
  Components.utils.import("resource://gre/modules/Services.jsm", unitedinternet.common);
  unitedinternet.common.loadJS("chrome://unitedtb/content/util/observerOnWindow.js", unitedinternet.common);
  unitedinternet.common.loadJS("chrome://unitedtb/content/util/uiutil.js", unitedinternet.common);

  /**
 * Initializes a module scope with all of the common code.
 * For example, calling with (unitedinternet, "foo") creates the foo
 * scope on unitedinternet (unitedinternet.foo) and gives that scope
 * all of the common functions.
 * If the scope has already been initialized, nothing is done
 *
 * @param outerscope {Object} object on which to attach the new scope
 * @param scopename {String} name of new scope to be created
 */
  unitedinternet.initModule = function initModule(outerscope, scopename) {
    if (!outerscope[scopename])
      outerscope[scopename] = {};
    if (!outerscope[scopename].loadJS)
      unitedinternet.common.mixInto(unitedinternet.common, outerscope[scopename]);
  }
  unitedinternet.loadJS = unitedinternet.common.loadJS;
}
