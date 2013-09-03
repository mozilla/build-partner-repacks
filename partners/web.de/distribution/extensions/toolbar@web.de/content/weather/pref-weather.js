function onLoad()
{
  try {
    new PostalCode(E("postalcode"));
  } catch (e) { debug(e); }
  if (isValidPostalCode(E("postalcode").value))
    E("no-nag").hidden = true;
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
