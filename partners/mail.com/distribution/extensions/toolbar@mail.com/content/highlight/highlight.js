/**
 * Messages observed:
 * "search-keypress", "search-started"
 *    Effect: Store the search term. When the user clicks on the button, use the term
 *       to search it in the page and highlight results and scroll to the first one.
 * Messages sent by this module:
 * "do-search-suggestions"
 *    Effect: disable search suggestions dropdown in highlight mode
 */

var gTurnedOn = false;

var gHighlightImage = new Image();
// Takes a bit to load,
// but must be finished before updateUI() is called with an unread count > 0.
// Obviously, do not modify it, but copy it.
// This avoids repeated loading, async onload(), setTimeout for bug 574330,
// and the resulting out-of-order problems when several accounts get logged out
gHighlightImage.src = "chrome://unitedtb/skin/highlight/highlight-small.png";

/**
 * Get the toolbar button that acts as checkbox
 */
function getMyButton()
{
  var outerButton = E("united-highlight-button")
  if ( !outerButton)
    return null;
  return document.getAnonymousElementByAttribute(outerButton, "anonid", "button");
}

function onLoad()
{
  try {
    ourPref.observeAuto(window, "highlight.color", function(newValue)
    {
      try {
        updateColor(newValue);
        turnOnOff();
      } catch (e) { errorNonCritical(e); }
    });
    gBrowser.tabContainer.addEventListener("TabSelect", onTabChanged, false);

    updateColor();
    var button = getMyButton();
    if (!button)
      return;
    button.checked = ourPref.get("highlight.enableOnNewWindow");
    turnOnOff();
  } catch(e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function updateColor(newValue)
{
  if (!newValue) {
    newValue = ourPref.get("highlight.color");
  }
  var canvas = E("united-highlight-canvas");
  if (!canvas)
  {
    canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    canvas.setAttribute("id", "united-highlight-canvas");
    canvas.setAttribute("width", 16);
    canvas.setAttribute("height", 16);
  }
  var ctx = canvas.getContext("2d");
  ctx.drawImage(gHighlightImage, 0, 0);
  ctx.fillStyle = newValue;
  ctx.fillRect(0,10,16,6);
  var url = canvas.toDataURL();

  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].href == "chrome://unitedtb/skin/highlight/highlight-color.css") {
      while (document.styleSheets[i].cssRules.length > 0) {
        document.styleSheets[i].deleteRule(0);
      }
      document.styleSheets[i].insertRule("#united-highlight-button { list-style-image: url('" + url + "')}", 0);
      break;
    }
  }
}

/**
 * User clicked on Highlight button
 */
function onButton(event)
{
  try {
    var button = getMyButton()
    button.checked = !button.checked;

    notifyWindowObservers("do-search-suggestions",
        { enable: !button.checked });

    turnOnOff();
  } catch (e) { errorCritical(e); }
};

/**
 * User clicked on Highlight button or
 * entered text in search field (while highlight is enabled)
 */
function onTextChanged()
{
  try {
    turnOnOff();
  } catch (e) { errorNonCritical(e); }
}

/**
 * User clicked on a color
 */
function onColorChanged(event)
{
  window.setTimeout(function(cp) {
    try {
      ourPref.set('highlight.color', cp.color);
      cp.parentNode.hidePopup();
  } catch (e) { errorNonCritical(e); }
  }, 0, event.target)
}

function onTabChanged()
{
  try {
    turnOnOff();
  } catch (e) { errorNonCritical(e); }
}

function turnOnOff()
{
  var button = getMyButton();
  if (!button)
    return;

  var wasTurnedOn = gTurnedOn;
  gTurnedOn = !!currentSearchTerm && button.checked;
  //debug("highlight turned on: " + gTurnedOn + ", was turned on: " + wasTurnedOn);

  if (gTurnedOn && !wasTurnedOn)
    gBrowser.addEventListener("DOMContentLoaded", onPageLoad, true);  
  else if (!gTurnedOn && wasTurnedOn)
    gBrowser.removeEventListener("DOMContentLoaded", onPageLoad, true);  

  var currentDoc = gBrowser.contentDocument;
  unhighlightPerDOMPoking(currentDoc);
  if (gTurnedOn)
    highlightPerDOMPoking(currentSearchTerm, currentDoc);
  //debug("page modified");
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

autoregisterWindowObserver("search-started", saveSearchTerm);
autoregisterWindowObserver("search-keypress", saveSearchTerm);
// </copied>



//const kHighlightCSS = "span.united-highlight-term { background-color: #DDBB00; color: black; border: none !important; margin: 0px !important; padding: 0px !important; }";
const kHighlightCSS = "united-highlight-term { display: inline; background-color: %backgroundColor%; color: %foregroundColor%; } united-highlight-textrun { display: inline; }";

/**
 * Replaces all instances of |term| with <span> with a yellow background
 * @param term {String} the text to search for and highlight
 * @param doc {DOMDocument} the page to modify, as DOM document element
 */
function highlightPerDOMPoking(term, doc)
{
  //debug("before replacement:\n" + doc.body.innerHTML);
  //debug("highlight " + term);
  var style = doc.createElement("style");
  style.id = "united-highlight-style";
  var backgroundColor = ourPref.get("highlight.color");
  var r = parseInt(backgroundColor.substring(1,3), 16);
  var g = parseInt(backgroundColor.substring(3,5), 16);
  var b = parseInt(backgroundColor.substring(5,7), 16);
  let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  var foregroundColor = "black";
  if (luminance <= 110) {
    foregroundColor = "white";
  }
  style.appendChild(doc.createTextNode(kHighlightCSS.replace("%backgroundColor%", backgroundColor).replace("%foregroundColor%", foregroundColor)));
  var head = doc.documentElement.getElementsByTagName("head").item(0);
  if (head)
    head.appendChild(style);
  else
    doc.documentElement.appendChild(style);
  var textNodes = findTextNodes(doc.body);
  //debug("OK tags: " + okTags.join(", ") + "\nSkipped tags: " + skippedTags.join(", "));
  //debug("found " + textNodes.length + " text nodes");
  for each (let textNode in textNodes)
  {
    let text = textNode.data;
    let startIndex = 0;
    let newNode = null; // lazy for speed
    text.replace(term, function(termFound, index)
    {
      if ( !newNode)
        newNode = doc.createElement("united-highlight-textrun");
      if (index)
        newNode.appendChild(doc.createTextNode(text.substring(startIndex, index)));
      let highlightNode = doc.createElement("united-highlight-term");
      highlightNode.appendChild(doc.createTextNode(termFound));
      newNode.appendChild(highlightNode);
      startIndex = index + termFound.length;
    }, "gi");
    if ( !startIndex)
      continue;
    newNode.appendChild(doc.createTextNode(text.substring(startIndex))); // rest
    newNode.oldText = text; // allow revert, i.e. unhighlight
    textNode.parentNode.replaceChild(newNode, textNode);
  }
  //alert("after replacement:\n" + doc.body.innerHTML);
}

const kSkipTags = [ "script", "style", "noscript", "embed", "option" ];
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
      let tag = node.tagName.toLowerCase();
      if (kSkipTags.indexOf(tag) == -1)
      {
        result = result.concat(findTextNodes(node));
      }
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
  if ( !style)
    return;
  style.parentNode.removeChild(style);
  for each (let span in nodeListToArray(doc.getElementsByTagName("united-highlight-textrun")))
  {
    if (!span.oldText)
      continue;
    let textNode = doc.createTextNode(span.oldText);
    span.parentNode.replaceChild(textNode, span);
  }
  //debug("after unhighlight:\n" + doc.body.innerHTML);
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

/**
 * Called on every new browser page load, so be efficient!
 * <https://developer.mozilla.org/en/Code_snippets/On_page_load>
 */
function onPageLoad(event)
{
  try {
    var doc = event.target; // document that was loaded
    var win = doc.defaultView; // the |window| for the doc
    if ( !doc instanceof HTMLDocument)
      return;
    if (win != win.top) // only top window
      return;
    if (!gTurnedOn)
      return;
    highlightPerDOMPoking(currentSearchTerm, doc);
  } catch (e) { errorNonCritical(e); }
}
