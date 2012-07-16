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
  if ( !united.ourPref.get("search.webpageDoubleclick"))
    return;
  var sel = event.view.getSelection();
  var selText = sel.toString()
  united.debug("selection " + selText);
  if (!sel.containsNode(event.target, true))
    return;
  // MS Windows selects "foo ", so strip trailing and leading whitespace
  selText = selText.replace(/[ ]+$/, "").replace(/^[ ]+/, "");
  if (selText.indexOf(" ") != -1) // only single words
    return;
  var searchTerm = selText;
  united.notifyWindowObservers("search-term",
      { searchTerm : searchTerm, source : 7 });
}

function onLoad()
{
  var tabbrowser = document.getElementById("content");
  tabbrowser.addEventListener("dblclick", onHandleContentDoubleClick, false);
}
window.addEventListener("load", onLoad, false);
