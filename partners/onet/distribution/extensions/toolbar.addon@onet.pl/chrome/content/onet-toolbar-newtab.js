var onetNewTab = {

	prefs : Services.prefs.getBranch('extensions.pl.onet.addon.toolbar.'),

	init : function() {
		window.removeEventListener('load', onetNewTab.init, false);

		if (onetNewTab.prefs.getBoolPref("optin.newtab"))
		{
			document.getElementById('onet-toolbar-newtab-row').style.visibility="visible";
			document.getElementById('newtab-toggle').style.visibility="hidden";
		}
		else 
		{
			document.getElementById('onet-toolbar-newtab-row').style.visibility="collapse";
			document.getElementById('newtab-toggle').style.visibility="visible";
		}
	},
}

Components.utils.import('resource://gre/modules/Services.jsm');
window.addEventListener('load', onetNewTab.init, false);
