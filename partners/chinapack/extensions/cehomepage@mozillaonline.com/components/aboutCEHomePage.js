const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

var console = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);

function AboutCEHomePage() {}
AboutCEHomePage.prototype = {
	classDescription: 'China Edition Home Page about:cehoempage',
	contractID: '@mozilla.org/network/protocol/about;1?what=cehomepage',
	classID: Components.ID('0A36D8DA-76A9-412C-9F05-2E757C3C1E52'),
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),

	getURIFlags: function(aURI) {
		return (Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT |
				Ci.nsIAboutModule.ALLOW_SCRIPT);
	},
	newChannel: function(aURI) {
		var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		var secMan = Cc['@mozilla.org/scriptsecuritymanager;1'].getService(Ci.nsIScriptSecurityManager);
		var principal = secMan.getCodebasePrincipal(aURI);
//		var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch2);
//		var home = prefs.getValue('extensions.cehomepage.homepage', 'http://i.g-fox.cn');
//		console.logStringMessage(['read pref', prefs, home]);
		var home = 'http://i.g-fox.cn/';
		var channel = ios.newChannel(home, null, null);
		channel.originalURI = aURI;
//		channel.owner = principal;
		return channel;
	}
};

function NSGetModule(aCompMgr, aFileSpec) {
	return XPCOMUtils.generateModule([AboutCEHomePage]);
}

