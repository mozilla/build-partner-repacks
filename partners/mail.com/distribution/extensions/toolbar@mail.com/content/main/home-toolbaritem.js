/**
 * The "home" button, on the very left, with the logo of the company,
 * linking to portal properties.
 */

/**
 * Click on Home button, directly or on a dropdown menu item
 * Go to corresponding homepage URL
 */
function home(event)
{
  try {
    var url = event.target.getAttribute("url"); // dropdown entries
    if (!url) // no dropdown
      url = brand.homebutton.homepageURL;
    loadPage(url);
  } catch (e) { errorCritical(e); }
};

function onLoad()
{
  try {
    new appendBrandedMenuitems("homebutton", "homebutton", null,
    function(entry)
    {
      try {
        loadPage(entry.url, "tab");
      } catch (e) { errorCritical(e); }
    });
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);
