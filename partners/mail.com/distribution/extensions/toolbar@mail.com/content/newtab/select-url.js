/**
 * Firefox does not highlight the URL in the URL bar when a new tab
 * is opened (bug 757455). This code works around that.
 * This allows a user to begin typing a URL as soon as the new tab page
 * is opened.
 */

function onLoad()
{
  try {
    hookupSelectURLinURLbar();
  } catch (e) { errorNonCritical(e); }
}
window.addEventListener("load", onLoad, false);

var FFBrowserOpenTab;
var FFURLBarSetURI;
var newTab;

function ourBrowserOpenTab()
{
  FFBrowserOpenTab();
  newTab = true;
}

function ourURLBarSetURI(aURI)
{
  FFURLBarSetURI(aURI);
  if (newTab)
  {
    gURLBar.select();
    newTab = false;
  }
}

function hookupSelectURLinURLbar() {
  FFBrowserOpenTab = BrowserOpenTab;
  BrowserOpenTab = ourBrowserOpenTab;

  FFURLBarSetURI = URLBarSetURI;
  URLBarSetURI = ourURLBarSetURI;
}
