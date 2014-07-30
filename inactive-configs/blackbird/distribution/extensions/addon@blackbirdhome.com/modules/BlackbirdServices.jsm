var EXPORTED_SYMBOLS = ["BlackbirdServices"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

 function defineLazyGetter(aObject, aName, aLambda)
  {
    aObject.__defineGetter__(aName, function() {
      delete aObject[aName];
      return aObject[aName] = aLambda.apply(aObject);
    });
  }

  function defineLazyServiceGetter(aObject, aName, aContract, aInterfaceName)
  {
    defineLazyGetter(aObject, aName, function XPCU_serviceLambda() {
      return Cc[aContract].getService(Ci[aInterfaceName]);
    });
  }


let BlackbirdServices = {};

defineLazyServiceGetter(BlackbirdServices, "obs",
                                    "@mozilla.org/observer-service;1",
                                    "nsIObserverService");
defineLazyServiceGetter(BlackbirdServices, "console",
                                   "@mozilla.org/consoleservice;1",
                                   "nsIConsoleService");
defineLazyServiceGetter(BlackbirdServices, "search",
                                   "@mozilla.org/browser/search-service;1",
                                   "nsIBrowserSearchService");
defineLazyServiceGetter(BlackbirdServices, "storage",
                                   "@mozilla.org/storage/service;1",
                                   "mozIStorageService");
defineLazyServiceGetter(BlackbirdServices, "rdf",
                                   "@mozilla.org/rdf/rdf-service;1",
                                   "nsIRDFService");
defineLazyServiceGetter(BlackbirdServices, "io",
                                   "@mozilla.org/network/io-service;1",
                                   "nsIIOService");
defineLazyServiceGetter(BlackbirdServices, "dirsvc",
                                   "@mozilla.org/file/directory_service;1",
                                   "nsIProperties");
defineLazyServiceGetter(BlackbirdServices, "perms",
                                   "@mozilla.org/permissionmanager;1",
                                   "nsIPermissionManager");
defineLazyServiceGetter(BlackbirdServices, "rdf",
                                   "@mozilla.org/rdf/rdf-service;1",
                                   "nsIRDFService");
defineLazyServiceGetter(BlackbirdServices, "etld",
                                   "@mozilla.org/network/effective-tld-service;1",
                                                                   "nsIEffectiveTLDService");
defineLazyServiceGetter(BlackbirdServices, "stringbundle",
                                   "@mozilla.org/intl/stringbundle;1",
                                                                   "nsIStringBundleService");
defineLazyServiceGetter(BlackbirdServices, "cookiemgr",
                                   "@mozilla.org/cookiemanager;1",
                                                                   "nsICookieManager2");
defineLazyServiceGetter(BlackbirdServices, "prompt",
                                   "@mozilla.org/embedcomp/prompt-service;1",
                                                                   "nsIPromptService");
defineLazyServiceGetter(BlackbirdServices, "browserhistory",
                                   "@mozilla.org/browser/nav-history-service;1",
                                                                   "nsIBrowserHistory");
defineLazyServiceGetter(BlackbirdServices, "navhistory",
                                   "@mozilla.org/browser/nav-history-service;1",
                                                                   "nsINavHistoryService");
defineLazyServiceGetter(BlackbirdServices, "asynchistory",
                                   "@mozilla.org/browser/history;1",
                                                                   "mozIAsyncHistory");

defineLazyGetter(BlackbirdServices, "prefs", function () {
  return Cc["@mozilla.org/preferences-service;1"]
           .getService(Ci.nsIPrefService)
           .QueryInterface(Ci.nsIPrefBranch2);
});
defineLazyGetter(BlackbirdServices, "bbprefs", function () {
  return Cc["@mozilla.org/preferences-service;1"]
           .getService(Ci.nsIPrefService)
                   .getBranch("extensions.blackbird.")
           .QueryInterface(Ci.nsIPrefBranch2);
});