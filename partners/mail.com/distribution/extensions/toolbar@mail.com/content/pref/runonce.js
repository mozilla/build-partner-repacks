Components.utils.import("resource://gre/modules/Services.jsm");
importJSM("util/brand-var-loader.js", this);

function showFirstRun()
{
  var showFirstrunPage = false;

  // nsICookieManager, same below
  var e = Services.cookies.enumerator;
  while (e.hasMoreElements())
  {
    var cookie = e.getNext();
    if (!cookie  || !(cookie instanceof Ci.nsICookie)) continue;
    if (cookie.name != "toolbar-show-runonce") continue;
    for (var i = 0; i < brand.tracking.identifyMyselfToSites.length; i++)
      if (cookie.host.match(brand.tracking.identifyMyselfToSites[i]))
        showFirstrunPage = true;
    // We remove the cookie no matter what
    Services.cookies.remove(cookie.host, cookie.name, cookie.path, false);
  }
  if (showFirstrunPage)
    // If the show-runonce cookie is set, route to firstrun page
    document.location.replace(brand.toolbar.firstrunURL +
      "/?kid=" + ourPref.get("tracking.campaignid", 0));
  else
    window.close();
}
