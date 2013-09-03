/**
 * This opens opt-in.xhtml page after installation of the extension,
 *
 * ...unless it's the branded browser (where we have these already set as defaults)
 * and the user has not modified the search engine (when using Firefox with
 * the same profile) (If the user has used Firefox, but not changed the default
 * search engine, changing to the branded browser will change the default
 * automatically, so no need to ask.)
 *
 * We open a homepage at the same time. The opt-in page tab should
 * end up on top, and once closed, the tab with the homepage should appear.
 * This is currently achieved by opening both in tabs and the second last
 * opened being the homepage and the last opened being the opt-in page.
 * The code does not enforce that, so take care it stays like that, somehow.
 */

/**
 * Messages reacted to by this module:
 * "first-run"
 */

Cu.import("resource://unitedtb/util/globalobject.js", this);

function loadIfNecessary(object)
{
  var firstrunPage = "chrome://unitedtb/content/pref/opt-in.xhtml";

  // Ensure that it shows only once, even if several windows are open,
  // e.g. due to session restore.
  if (getGlobalObject("united", "optin-shown")) {
    return;
  }
  setGlobalObject("united", "optin-shown", true);

  loadChromePage(firstrunPage, "tab");
};

autoregisterGlobalObserver("first-run-pageload", loadIfNecessary);
