/**
 * This modifies brand.js for the version of the toolbar that ships bundled
 * with our Firefox installer.
 * GMX version
 */

toolbar.defaultlocale.startpageHomepageURL = "http://www.gmx.de/"; // must match distribution.ini
toolbar.defaultlocale.firstrunURL = "%GOTB%runonce_moz";
toolbar.defaultlocale.uninstallURL = "%GOTB%uninstall_runonce_moz";
search.defaultlocale.toolbarURL = "%GOMAIN%br/moz_sbox_search/?su=";
search.defaultlocale.keywordURL = "%GOMAIN%br/moz_keyurl_search/?su="; // must match distribution.ini

tracking.defaultlocale.AIBDailyURL = "https://dl.gmx.net/toolbar/firefox/aib-moz.xml?vers=%VERSION%&local=%LOCALE%";
tracking.defaultlocale.AIBMonthlyURL = "https://dl.gmx.net/toolbar30days/firefox/aib-moz.xml?vers=%VERSION%&local=%LOCALE%";

search.defaultlocale.dropdownURLEntries = [
      { label : "Web-Suche", icon : "brand", url : "%GOMAIN%br/moz_sbox_search/?su=" },
     ];
search["de-AT"] = {};
search["de-CH"] = {};
search["en-UK"] = {};
