/**
 * This code overrides the close button when the last tab is closed so that instead
 * it shows a search page. To accomplish that, it overrides removeTab in
 * tabbrowser.xml. removeTab does all the work to clean up and remove the tab
 * but because we set _closeWindowWithLastTab to false, it doesn't actually
 * remove the tab. It puts the new tab page in it. We take advantage of this
 * and replace the new tab page with our page.
 * Normally the close button would not be there at all, but we force it via CSS
 */

var theirRemoveTab;

function onLoad(event)
{
  theirRemoveTab = gBrowser.removeTab;
  gBrowser.removeTab = ourRemoveTab;
};
window.addEventListener("load", onLoad, false);

// We override removeTab for three reasons. First we want to know when the
// close button is clicked. We can tell this from the byMouse argument.
// Second, we need to set _closeWindowWithLast to false, otherwise the default
// action for clicking the close button is to close the browser window.
// Third, after the Firefox remove tab is finished, we navigate to the URL
// we want to show.
function ourRemoveTab(aTab, aParams)
{
  // We must avoid referencing the file scope directly/implicitly,
  // because that breaks Tab Mix Plus, so start from Firefox window scope
  const us = unitedinternet.closelasttab;
  var overrideLastTab;

  // Only do our procesing if it is the last tab
  if (gBrowser.tabs.length - gBrowser._removingTabs.length == 1 &&
      arguments[1] && arguments[1].byMouse) {
      overrideLastTab = true;
    // Don't close the window in this case
    gBrowser.tabContainer._closeWindowWithLastTab = false;
  }
  us.theirRemoveTab.call(gBrowser, aTab, aParams);
  if (overrideLastTab)
  {
    overrideLastTab = false;
    gBrowser.tabContainer._closeWindowWithLastTab = us.generalPref.get("browser.tabs.closeWindowWithLastTab");
    loadPage(us.brand.newtab.lasttabURL);
  }
}
