/**
 * Messages observed:
 * "search-started"
 *    Effect: Store the search term on disk, in a database in the profile.
 *    These can be later retrieved to show "last personal searches".
 */

Components.utils.import("resource://unitedtb/search/search-store.js", this);

function onLoad()
{
  autoregisterWindowObserver("search-started", save);
}
window.addEventListener("load", onLoad, false);

function save(obj)
{
  // per Google rules, must not "hijack" searches.
  // Avoids that we show the Google searches on newtab
  // and run them via our search engine.
  if (obj.engineThirdparty)
    return;
  if (privateBrowsing.isEnabled(window))
    return;

  saveSearchTerm(obj.searchTerm); // search-store.js
}
