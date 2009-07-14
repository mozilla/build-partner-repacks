/* If you are upgrading from toolbar to boom, use a new CLSID and change 1 to 2 */
const BT_SHORTNAME = "cybermentors";
const BT_CLSID      = Components.ID('{eb121792-4029-4df1-90a5-3c0eb896662a}');

const BT_CONTRACTID = "@mozilla.org/bt-service-" + BT_SHORTNAME + ";1";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

const gPrefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
const gPrefBranch = gPrefService.getBranch(null).QueryInterface(Ci.nsIPrefBranch2);
const gObserver = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
const gScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
const gConsoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);   

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function BTHandler() {
}

BTHandler.prototype = {
  brandObject: null,
  observe: function(aSubject, aTopic, aData) {
    switch(aTopic) {
      case "app-startup":
        gObserver.addObserver(this,"xpcom-shutdown",false);
        gObserver.addObserver(this,"profile-after-change",false);
        gObserver.addObserver(this,"profile-before-change",false);
        gObserver.addObserver(this,"final-ui-startup",false);
        gScriptLoader.loadSubScript("chrome://" + BT_SHORTNAME + "boom/content/btServiceUtilities.js", this);
        gScriptLoader.loadSubScript("chrome://" + BT_SHORTNAME + "boom/content/btClient.js");
        /* Use the first client in the Brandthunder.clients array */
        for (client in BrandThunder.clients) {
          this.brandObject = BrandThunder.clients[client];
          break;
        }
        break;
      case "xpcom-shutdown":
        gObserver.removeObserver(this,"xpcom-shutdown");
        gObserver.removeObserver(this,"profile-after-change");
        gObserver.removeObserver(this,"profile-before-change");
        gObserver.removeObserver(this,"final-ui-startup");
        break;
      case "profile-after-change":
        this.profileAfterChange(this.brandObject);
        this.firstRun(this.brandObject);
        break;
      case "profile-before-change":
        this.profileBeforeChange(this.brandObject);
        break;
      case "final-ui-startup":
        this.finalUIStartup(this.brandObject);
        break;
    }
  },
  log: function(string) {
    gConsoleService.logStringMessage(string);
  },

  classDescription: "BT Service " + BT_SHORTNAME,
  contractID: BT_CONTRACTID,
  classID: BT_CLSID,
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
  _xpcom_categories: [{
    category: "app-startup",
    service: true
  }]
}

function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule([BTHandler]);
}
