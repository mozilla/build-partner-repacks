/**
 * This modifies brand.js for the version of the toolbar that ships bundled
 * with our Firefox installer.
 * mail.com version
 */

toolbar.defaultlocale.startpageHomepageURL = "http://www.mail.com/"; // must match distribution.ini
toolbar.defaultlocale.firstrunURL = "%GOTB%runonce_moz";
toolbar.defaultlocale.uninstallURL = "%GOTB%uninstall_runonce_moz";
search.defaultlocale.toolbarURL = "%GOMAIN%br/moz_sbox_search/?su=";
search.defaultlocale.keywordURL = "%GOMAIN%br/moz_keyurl_search/?su="; // must match distribution.ini

search.defaultlocale.dropdownURLEntries = [
      { label : "Web-Search", icon : "brand", url : "%GOMAIN%br/moz_sbox_search/?su=" },
     ];
