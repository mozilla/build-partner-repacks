const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

try {

    var MRSputnikDataDir = "MRSputnikData";
	var MRSputnikPrefBase = "odnoklassniki.ru.toolbar.";
	var MRChromeBase = "chrome://odnoklassniki.ru";
	var MRContractID = "@odnoklassniki.ru/toolbar/application;1";
	var SPUTNIK_USER_AGENT = " SputnikMailRu";

    Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

//   //Mozila drag and drop helpers
//   Cc["@mozilla.org/moz/jssubscript-loader;1"]
//     .getService(Ci.mozIJSSubScriptLoader)
//     .loadSubScript("chrome://global/content/nsDragAndDrop.js");
// 
//   Cc["@mozilla.org/moz/jssubscript-loader;1"]
//     .getService(Ci.mozIJSSubScriptLoader)
//     .loadSubScript("chrome://global/content/nsTransferable.js");
// 
  // Load our component JS file.
  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/version.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/gglib.js");

 Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/ggdebug.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/searchControl.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/chevron.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/xmlObjects.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/addonListener.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/ajaxService.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/vote.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/observers.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/webMetrics.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/highlighter.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/installation.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/installationOverride.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/toolbar.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://odnoklassniki.ru.lib/content/xcom.services.ok.js");
}
catch (err) 
{
  dump("[sputnik-bootstrap] exception: " + err + ", stack: " + err.stack + "\n");
  throw err;
}

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory(aComponents);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule(aComponents);
