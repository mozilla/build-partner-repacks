/**
 * User clicked on Weather button
 */
function onButton(event)
{
  getPostalCode(
  function(postalcode)
  {
    united.loadPage(united.brand.weather.regionalURL + postalcode, "united-weather");
  },
  function() // got no postal code
  {
    united.loadPage(united.brand.weather.normalURL, "united-weather");
  });
};

/**
 * User clicked on dropdown next to weather button
 *
function onDropdown(event)
{
  var panel = document.getElementById("united-weather-panel");
  var browser = document.getElementById("united-weather-panel-iframe");
  new united.BlockContentListener(function(url) {
        return url == united.brand.weather.popupNormalURL || // iframe
          url == united.brand.weather.popupRegionalURL ||
          url.substr(0, 7) == "file://" || // resource -> file:
          url == "about:blank";
      },
      united.loadBlockedInBrowser(panel)).hookUpIFrame(browser);
  //new united.BlockContentListener(united.allowURLPrefix("file://"), // resource: -> file:
  //   united.loadBlockedInBrowser(panel)).hookUpIFrame(browser);

  getPostalCode(
  function(postalcode)
  {
    browser.setAttribute("src", united.brand.weather.popupRegionalURL + postalcode);
  },
  function() // got no postal code
  {
    browser.setAttribute("src", united.brand.weather.popupNormalURL);
  });
}

  //browser.reload();
  new united.BlockContentListener(function(url) {
        return url == united.brand.weather.normalURL ||
            url == united.brand.weather.regionalURL;
      },
      united.loadBlockedInBrowser(panel)).hookUpIFrame(browser);
  browser.contentWindow.addEventListener("load", onPageLoad, false);
};

function old_onPageLoad()
{
  united.debug("on page load");
  var browser = document.getElementById("united-weather-panel-iframe");
  var doc = browser.contentDocument;
  var nodes = doc.getElementsByClassName("image center");
  if (nodes.length != 1)
    throw "expected one class='image center' on weather page";
  var map = nodes.item(0);
  united.debug("have div");
  browser.contentDocument.innerHTML = "<html><body>In Kooperation mit wetter.net<p><div id='insert'></div></body></html>";
  united.debug("created new doc");
  var insertpoint = doc.getElementById("insert");
  united.debug("got insertpoint");
  insertpoint.appendChild(map);
  united.debug("done");
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
  var postalcode = united.ourPref.get("weather.postalcode");
  if (isValidPostalCode(postalcode))
    return successCallback(postalcode);

  if (united.ourPref.get("weather.do-not-ask"))
    return noValueCallback();

  united.openPrefWindow("features");

  var postalcode = united.ourPref.get("weather.postalcode");
  if (isValidPostalCode(postalcode))
    return successCallback(postalcode);

  return noValueCallback();
}
