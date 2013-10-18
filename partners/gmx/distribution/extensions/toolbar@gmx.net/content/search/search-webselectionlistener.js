/**
 * This listens to doubleclicks on the webpage, and if that resulted in
 * the selection of a single word, put that word in our search field.
 */

/**
 * Messages sent:
 * "search-term"
 *    Means: we have some text that we want to put in the search field
 *    When: User double-clicked on a word in a page.
 *    Parameter: @see "search-started"
 */

function onHandleContentDoubleClick(event)
{
  try {
    if ( !ourPref.get("search.webpageDoubleclick"))
      return;
    var sel = event.view.getSelection();
    var selText = sel.toString()
    debug("selection " + selText);
    if (!sel.containsNode(event.target, true))
      return;
    // MS Windows selects "foo ", so strip trailing and leading whitespace
    selText = selText.replace(/[ ]+$/, "").replace(/^[ ]+/, "");
    if (selText.indexOf(" ") != -1) // only single words
      return;
    var searchTerm = selText;
    notifyWindowObservers("search-term",
        { searchTerm : searchTerm, source : 7 });
  } catch (e) { errorNonCritical(e); }
}

function onLoad()
{
  try {
    var tabbrowser = E("content");
    tabbrowser.addEventListener("dblclick", onHandleContentDoubleClick, false);
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);
