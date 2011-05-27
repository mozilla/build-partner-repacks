const EXPORTED_SYMBOLS = [
  "mSearch", "mResult", "mURLResult", "mSearchTermResult",
  "mPSHSearch", "mPlacesSearch", "mWebSuggest", "mLocalUnitedSearch",
];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
// mozIJSSubScriptLoader.loadSubScript(url) doesn't work right here
// when passing null as scope (should be same as |this|)!
loadJS("chrome://unitedtb/content/search/mcollect/mSearch.js", this);
loadJS("chrome://unitedtb/content/search/mcollect/mResult.js", this);
loadJS("chrome://unitedtb/content/search/mcollect/mURLResult.js", this);
loadJS("chrome://unitedtb/content/search/mcollect/mSearchTermResult.js", this);
loadJS("chrome://unitedtb/content/search/mcollect/mPSHSearch.js", this);
loadJS("chrome://unitedtb/content/search/mcollect/mPlacesSearch.js", this);
loadJS("chrome://unitedtb/content/search/mcollect/mWebSuggest.js", this);
loadJS("chrome://unitedtb/content/search/mcollect/mLocalUnitedSearch.js", this);
