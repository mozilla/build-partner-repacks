var onetNewTab = {

	prefs : Services.prefs.getBranch('extensions.pl.onet.addon.toolbar.'),

	init : function() {
		window.removeEventListener('load', onetNewTab.init, false);

        if (onetNewTab.prefs.getBoolPref("optin.newtab")) {
			document.getElementById('o-newtab-horizontal-margin').style.visibility="visible";
		} else {
			document.getElementById('o-newtab-horizontal-margin').style.visibility="collapse";
		}
	},
}

Components.utils.import('resource://gre/modules/Services.jsm');
window.addEventListener('load', onetNewTab.init, false);
document.getElementById('newtab-toggle').addEventListener('click', function(e){
    if (('page-disabled' in this.attributes) && (this.getAttribute('page-disabled') == 'true')) {
        document.getElementById('o-newtab-horizontal-margin').style.visibility = 'hidden';
    } else {
        document.getElementById('o-newtab-horizontal-margin').style.visibility = 'visible';
    }
}, true);
