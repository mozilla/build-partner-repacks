Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const Ci = Components.interfaces;
const Cc = Components.classes;

function AboutHandler()
{
}
AboutHandler.prototype =
{
  /* nsIAboutModule */
  newChannel : function (aURI)
  {
    var enabled = ourPref.get("neterror.enabled");
    var queryString = aURI.spec.substr(aURI.spec.indexOf('?')+1);
    var url = /^e=dnsNotFound/.test(queryString) && enabled
        ? "chrome://unitedtb/content/neterror/neterror.xhtml?"
        : "chrome://global/content/netError.xhtml?";
    return Services.io.newChannel(url + queryString, null, null);
  },

  getURIFlags : function getURIFlags(aURI)
  {
    return 0;
  },

  classDescription: "about: neterror hookup for United Internet, overriding Mozilla page",
  contractID: "@mozilla.org/network/protocol/about;1?what=neterror",
  classID: Components.ID("{49c4f409-eaf5-4c4d-a96a-280a60c7c6b7}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([AboutHandler]);
