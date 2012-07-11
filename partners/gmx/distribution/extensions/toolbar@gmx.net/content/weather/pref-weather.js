function onLoad()
{
  try {
    new PostalCode(document.getElementById("postalcode"));
  } catch (e) { united.debug(e); }
  if (isValidPostalCode(document.getElementById("postalcode").value))
    document.getElementById("no-nag").hidden = true;
  gOldRegionalURL = united.brand.weather.regionalURL;
  united.autoregisterGlobalObserver("region-changed", regionChanged);
}
window.addEventListener("load", onLoad, false);

var gOldRegionalURL = null;

/**
 * If the country changes, reset the postal code.
 */
function regionChanged()
{
  // only reset, if the weather module changed
  if (gOldRegionalURL == united.brand.weather.regionalURL)
    return;
  gOldRegionalURL = united.brand.weather.regionalURL;

  united.ourPref.reset("weather.postalcode");
}

function PostalCode(el)
{
  AutoPrefElement.call(this, el, "weather.postalcode", united.ourPref);
}
PostalCode.prototype =
{
  reset: function()
  {},
}
united.extend(PostalCode, AutoPrefElement);
