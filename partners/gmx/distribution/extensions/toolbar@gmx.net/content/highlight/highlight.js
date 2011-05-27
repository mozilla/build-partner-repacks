/**
 * Messages observed:
 * "search-keypress", "search-started"
 *    Effect: Store the search term. When the user clicks on the button, use the term
 *       to search it in the page and highlight results and scroll to the first one.
 * Messages sent by this module:
 * "do-search-suggestions"
 *    Effect: disable search suggestions dropdown in highlight mode
 */

var gButton;
var gTurnedOn = false;

function onLoad()
{
  gButton = document.getElementById("united-highlight-button");
}
window.addEventListener("load", onLoad, false);

/**
 * User clicked on Highlight button
 */
function onButton(event)
{
  united.notifyWindowObservers("do-search-suggestions",
      { enable: !gButton.checked });

  onTextChanged(event);
};

/**
 * User clicked on Highlight button or
 * entered text in search field (while highlight is enabled)
 */
function onTextChanged(event)
{
  var wasTurnedOn = gTurnedOn;
  gTurnedOn = gButton.checked && currentSearchTerm;

  var currentDoc = gBrowser.contentDocument;
  unhighlightPerDOMPoking(currentDoc);
  if (gTurnedOn)
    highlightPerDOMPoking(currentSearchTerm, currentDoc);

  if (gTurnedOn && !wasTurnedOn)
    gBrowser.addTabsProgressListener(webProgressListener);
  else if (!gTurnedOn && wasTurnedOn)
    gBrowser.removeTabsProgressListener(webProgressListener);
};

// <copied from="shopping.js">
var currentSearchTerm = null;

function saveSearchTerm(object)
{
  if (object.source != 1) // only use terms from search field on our toolbar
    return;
  currentSearchTerm = object.searchTerm;
  onTextChanged(); // (not copied)
};

united.autoregisterWindowObserver("search-started", saveSearchTerm);
united.autoregisterWindowObserver("search-keypress", saveSearchTerm);
// </copied>

//const kHighlightCSS = "span.united-highlight-term { background-color: #DDBB00; color: black; border: none !important; margin: 0px !important; padding: 0px !important; }";
const kHighlightCSS = "united-highlight-term { display: inline; background-color: #DDBB00; color: black; } united-highlight-textrun { display: inline; }";

/**
 * Replaces all instances of |term| with <span> with a yellow background
 * @param term {String} the text to search for and highlight
 * @param doc {DOMDocument} the page to modify, as DOM document element
 */
function highlightPerDOMPoking(term, doc)
{
  //united.debug("before replacement:\n" + doc.body.innerHTML);
  //united.debug("highlight " + term);
  var style = doc.createElement("style");
  style.id = "united-highlight-style";
  style.appendChild(doc.createTextNode(kHighlightCSS));
  doc.documentElement.appendChild(style);
  var textNodes = findTextNodes(doc.body);
  //united.debug("OK tags: " + okTags.join(", ") + "\nSkipped tags: " + skippedTags.join(", "));
  //united.debug("found " + textNodes.length + " text nodes");
  for each (let textNode in textNodes)
  {
    let text = textNode.data;
    let foundHere = 0;
    var highlighted = text.replace(term, function(found) {
      foundHere++;
      return "<united-highlight-term>" + found + "</united-highlight-term>";
    }, "gi");
    if (!foundHere)
      continue;
    //united.debug(highlighted);
    let newNode = doc.createElement("united-highlight-textrun");
    textNode.parentNode.replaceChild(newNode, textNode);
    newNode.innerHTML = highlighted;
    newNode.oldText = text; // allow revert, i.e. unhighlight
  }
  //alert("after replacement:\n" + doc.body.innerHTML);
}

const kSkipTags = [ "script", "style", "noscript", "embed" ];
  var okTags = [];
  var skippedTags = [];

/**
 * Returns all non-empty text nodes in the DOM document
 * @returns {Array of DOMText}
 */
function findTextNodes(el)
{
  var result = [];
  //for each (let node in nodeListToArray(el.childNodes))
  var childNodes = el.childNodes
  for (let i = 0, l = childNodes.length; i < l; i++)
  {
    let node = childNodes.item(i);
    if (node instanceof Ci.nsIDOMText &&
        node.data) // happens a lot
      result.push(node);
    else if (node instanceof Ci.nsIDOMElement)
    {
      let parent = node.parentNode.tagName;
      //united.debug(parent);
      if (kSkipTags.indexOf(parent) == -1)
      {
        //if (okTags.indexOf(parent) == -1)
        //  okTags.push(parent);
        result = result.concat(findTextNodes(node));
      }
      //else
      //{
      //  united.debug("skipping " + parent);
      //  if (skippedTags.indexOf(parent) == -1)
      //    skippedTags.push(parent);
      //}
    }
  }
  return result;
}

/**
 * Undo highlightPerDOMPoking()
 * @param doc {DOMDocument} the page to modify, as DOM document element
 */
function unhighlightPerDOMPoking(doc)
{
  var style = doc.getElementById("united-highlight-style");
  //style.parentNode.removeChild(style);
  for each (let span in nodeListToArray(doc.getElementsByTagName("united-highlight-textrun")))
  {
    if (!span.oldText)
      continue;
    let textNode = doc.createTextNode(span.oldText);
    span.parentNode.replaceChild(textNode, span);
  }
  //united.debug("after unhighlight:\n" + doc.body.innerHTML);
}

/**
 * Turns a DOM |NodeList| into a JS array that you can |for each| on
 * - convenience
 * - makes a copy, which is needed when you remove the elements
 */
function nodeListToArray(nodeList)
{
  var result = [];
  for (let i = 0, l = nodeList.length; i < l; i++)
    result.push(nodeList.item(i));
  return result;
}

/////////////////////////////////////////////////////
// Browser page load hookup
/////////////////////////////////////////////////////

var webProgressListener =
{
  // |browser| == <browser> (iframe) which fired the event. != gBrowser
  onStateChange : function(browser, webProgress, request, stateFlags, status)
  {
    if (stateFlags & Ci.nsIWebProgressListener.STATE_STOP)
      onPageLoad(browser);
    return 0;
  },
  onLocationChange: function() {},
  onProgressChange: function() {},
  onStatusChange: function() {},
  onSecurityChange: function() {},
  onLinkIconAvailable: function() {},
  // it's not a real Ci.nsIWebProgressListener
  QueryInterface : XPCOMUtils.generateQI([Ci.nsISupportsWeakReference])
}

/**
 * Called on every new browser page load, so be efficient!
 * @param browser {<browser> (<iframe>)}   which fired the event. != gBrowser
 */
function onPageLoad(browser)
{
  if (!gTurnedOn)
    return;
  highlightPerDOMPoking(currentSearchTerm, browser.contentDocument);
}
