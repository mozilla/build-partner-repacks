Components.utils.import('resource://gre/modules/Services.jsm');

var onetToolbarOptin = {
    onAccept: function() {
        if (document.getElementById('searchCheckbox').checked) {
            Services.prefs.setBoolPref('extensions.pl.onet.addon.toolbar.optin.search', true);
        }
        if (document.getElementById('newtabCheckbox').checked) {
            Services.prefs.setBoolPref('extensions.pl.onet.addon.toolbar.optin.newtab', true);
        }
        if (document.getElementById('homepageGroup').value == 1) {
            Services.prefs.setIntPref('extensions.pl.onet.addon.toolbar.optin.homepage', 1);
        } else if (document.getElementById('homepageGroup').value == 2) {
            Services.prefs.setIntPref('extensions.pl.onet.addon.toolbar.optin.homepage', 2);
        }
    }
};