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
  var url = event.target.getAttribute("url"); // dropdown entries
  if (!url) // no dropdown
    url = brand.homebutton.homepageURL;
  loadPage(url);
};

function onLoad()
{
  new appendBrandedMenuitems("homebutton", "homebutton", null,
  function(entry)
  {
    loadPage(entry.url, "tab");
  });
}
window.addEventListener("load", onLoad, false);
