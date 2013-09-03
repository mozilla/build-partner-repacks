/**
 * User clicked on Horoscope button
 */
function onButton(event)
{
  try {
    loadPage(brand.horoscope.horoscopeURL, "united-horoscope");
  } catch (e) { errorCritical(e); }
};
