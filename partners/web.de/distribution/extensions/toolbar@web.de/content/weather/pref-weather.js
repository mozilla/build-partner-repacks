function onLoad()
{
  try {
    new PostalCode(E("postalcode"));
    if (isValidPostalCode(E("postalcode").value))
      E("weather-no-nag").hidden = true;
    gOldRegionalURL = brand.weather.regionalURL;
    autoregisterGlobalObserver("region-changed", regionChanged);
  } catch (e) { errorCritical(e); }
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
