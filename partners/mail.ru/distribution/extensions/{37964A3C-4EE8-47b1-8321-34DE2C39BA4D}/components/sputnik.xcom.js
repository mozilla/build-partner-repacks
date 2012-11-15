const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

try {

    var MRSputnikDataDir = "MRSputnikData";
	var MRSputnikPrefBase = "mail.ru.toolbar.";
	var MRChromeBase = "chrome://mail.ru";
	var MRContractID = "@mail.ru/toolbar/application;1";
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
    .loadSubScript("chrome://mail.ru.lib/content/version.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/gglib.js");

 Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/ggdebug.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/searchControl.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/chevron.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/xmlObjects.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/addonListener.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/ajaxService.js");
  
  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/rawdeflate.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/base64.js");
  
  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/storage.js");
  
  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/vote.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/observers.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/webMetrics.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/highlighter.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/installation.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/installationOverride.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/toolbar.js");
    
  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/search.js");
    
  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/httpRequestObserver.js");

  Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript("chrome://mail.ru.lib/content/xcom.services.js");
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
