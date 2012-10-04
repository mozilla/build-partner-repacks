/**
 * User clicked on Weather button
 */
function onButton(event)
{
  getPostalCode(
  function(postalcode)
  {
    loadPage(brand.weather.regionalURL + postalcode, "united-weather");
  },
  function() // got no postal code
  {
    loadPage(brand.weather.normalURL, "united-weather");
  });
};

/**
 * User clicked on dropdown next to weather button
 *
function onDropdown(event)
{
  var panel = document.getElementById("united-weather-panel");
  var browser = document.getElementById("united-weather-panel-iframe");
  new BlockContentListener(function(url) {
        return url == brand.weather.popupNormalURL || // iframe
          url == brand.weather.popupRegionalURL ||
          url.substr(0, 7) == "file://" || // resource -> file:
          url == "about:blank";
      },
      loadBlockedInBrowser(panel)).hookUpIFrame(browser);
  //new BlockContentListener(allowURLPrefix("file://"), // resource: -> file:
  //   loadBlockedInBrowser(panel)).hookUpIFrame(browser);

  getPostalCode(
  function(postalcode)
  {
    browser.setAttribute("src", brand.weather.popupRegionalURL + postalcode);
  },
  function() // got no postal code
  {
    browser.setAttribute("src", brand.weather.popupNormalURL);
  });
}

  //browser.reload();
  new BlockContentListener(function(url) {
        return url == brand.weather.normalURL ||
            url == brand.weather.regionalURL;
      },
      loadBlockedInBrowser(panel)).hookUpIFrame(browser);
  browser.contentWindow.addEventListener("load", onPageLoad, false);
};

function old_onPageLoad()
{
  debug("on page load");
  var browser = document.getElementById("united-weather-panel-iframe");
  var doc = browser.contentDocument;
  var nodes = doc.getElementsByClassName("image center");
  if (nodes.length != 1)
    throw "expected one class='image center' on weather page";
  var map = nodes.item(0);
  debug("have div");
  browser.contentDocument.innerHTML = "<html><body>In Kooperation mit wetter.net<p><div id='insert'></div></body></html>";
  debug("created new doc");
  var insertpoint = doc.getElementById("insert");
  debug("got insertpoint");
  insertpoint.appendChild(map);
  debug("done");
}
*/

/**
 * Gets postal code from prefs and returns it in successCallback.
 * If the pref is empty or not valid, shows pref dialog, and waits for it.
 * If user entered valid postal code, return it in successCallback.
 * Otherwise (user closed dialog without entering valid postal code,
 * or has the pref set to not ask), calls noValueCallback.
 *
 * Currently sync, just mocking async API for now
 *
 * @param successCallback {Function(postalcode {Integer})}
 * @param  {Function()}
 */
function getPostalCode(successCallback, noValueCallback)
{
  var postalcode = ourPref.get("weather.postalcode");
  if (isValidPostalCode(postalcode))
    return successCallback(postalcode);

  if (ourPref.get("weather.do-not-ask"))
    return noValueCallback();

  unitedinternet.openPrefWindow("features");

  var postalcode = ourPref.get("weather.postalcode");
  if (isValidPostalCode(postalcode))
    return successCallback(postalcode);

  return noValueCallback();
}
