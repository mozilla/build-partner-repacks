Components.utils.import("resource://unitedtb/util/util.js", this);
Components.utils.import("resource://gre/modules/Services.jsm");

function redirectToSearch()
{
  var queryParams = parseURLQueryString(window.document.location.search);
  var searchTerm = queryParams["q"];

  var engine = Services.search.currentEngine;
  if ( !engine) {
    // as fallback, get default engine
    engineName =
        Services.prefs.getComplexValue("browser.search.defaultenginename",
        Components.interfaces.nsIPrefLocalizedString).data;
    engine = Services.search.getEngineByName(engineName);
  }
  assert(engine, "Couldn't find a search engine");
  var submission = engine.getSubmission(searchTerm,
      "application/x-moz-keywordsearch");
  if ( !submission)
    submission = engine.getSubmission(searchTerm, null);
  assert(submission, "Couldn't find a search URL");
  window.document.location = submission.uri.spec;
}

//window.addEventListener("load", redirectToSearch, false);
redirectToSearch();
