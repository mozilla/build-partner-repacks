function onLoad()
{
  if (isValidPostalCode(document.getElementById("postalcode").value))
    document.getElementById("no-nag").hidden = true;
  gOldRegionalURL = united.brand.weather.regionalURL;
  united.autoregisterGlobalObserver("region-changed", regionChanged);
}
window.addEventListener("load", onLoad, false);

gOldRegionalURL = null;

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
