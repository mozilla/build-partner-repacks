Components.utils.import('resource://gre/modules/Services.jsm');

var onetNewTab = {
    prefs: Services.prefs.getBranch('extensions.pl.onet.addon.toolbar.'),
    observe: function(subject, type) {
        if (type == 'nsPref:changed') {
			if (onetNewTab.prefs.getBoolPref('optin.newtab') !=  onetNewTab.state) {
				window.location.reload();
			}
        }
    },
	state: '',
    init: function() {
        window.removeEventListener('load', onetNewTab.init, false);
		onetNewTab.state = onetNewTab.prefs.getBoolPref('optin.newtab'); 
        onetNewTab.prefs.addObserver('', onetNewTab, false);
        if (onetNewTab.prefs.getBoolPref("optin.newtab")) {
            document.getElementById('o-newtab-horizontal-margin').style.visibility = "visible";
        } else {
            document.getElementById('o-newtab-horizontal-margin').style.visibility = "collapse";
        }
    }
};

window.addEventListener('load', onetNewTab.init, false);
window.addEventListener('unload', function() {
    onetNewTab.prefs.removeObserver('', onetNewTab);
}, false);


document.getElementById('newtab-toggle').addEventListener('click', function(e) {
    if (('page-disabled' in this.attributes) && (this.getAttribute('page-disabled') == 'true')) {
        document.getElementById('o-newtab-horizontal-margin').style.visibility = 'hidden';
    } else {
        document.getElementById('o-newtab-horizontal-margin').style.visibility = 'visible';
    }
}, true);
