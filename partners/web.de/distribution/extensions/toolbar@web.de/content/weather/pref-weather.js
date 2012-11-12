function onLoad()
{
  try {
    new PostalCode(document.getElementById("postalcode"));
  } catch (e) { debug(e); }
  if (isValidPostalCode(document.getElementById("postalcode").value))
    document.getElementById("no-nag").hidden = true;
  gOldRegionalURL = brand.weather.regionalURL;
  autoregisterGlobalObserver("region-changed", regionChanged);
}
window.addEventListener("load", onLoad, false);

var gOldRegionalURL = null;

/**
 * If the country changes, reset the postal code.
 */
function regionChanged()
{
  // only reset, if the weather module changed
  if (gOldRegionalURL == brand.weather.regionalURL)
    return;
  gOldRegionalURL = brand.weather.regionalURL;

  ourPref.reset("weather.postalcode");
}

function PostalCode(el)
{
  AutoPrefElement.call(this, el, "weather.postalcode", ourPref);
}
PostalCode.prototype =
{
  reset: function()
  {},
}
extend(PostalCode, AutoPrefElement);
