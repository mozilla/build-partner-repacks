/**
 * Work around an overcrowded (too full) toolbar, i.e. too many buttons
 * for the given window size.
 * 1. We'll first remove labels from the buttons (in "Icons + Text" mode),
 * one button after the other until it fits.
 * 2. Then we'll reduce the size of the search bar.
 * 3. As a last resort, we could later (currently not implemented) add a "V"
 * dropdown, but that's really bad, because most users will not discover
 * the buttons in there, and the "login" button is important.
 *
 * This is implemented by an overflow event
 * (which only fires when the element has a CSS overflow: visible
 * (which is the default), but e.g. overflow: hidden.
 * Before we do anything, we store the natural, full size we have normally.
 * Then we shrink, by setting attributes plus CSS.
 * On window resize, we check whether we now have enough size for
 * the original, saved size. If so, we revert stuff.
 */

// var tb; -- from toolbar.js
var gWantWidth;

function onLoadResize()
{
  window.addEventListener("resize", onWindowResize, false);
  window.setTimeout(onWindowResize, 0);
}
window.addEventListener("load", onLoadResize, false);

function onWindowResize()
{
  var buttons = getButtonsToShrink();
  for each (let button in buttons)
    button.removeAttribute("crowded");
  // scroll width is the natural size it wants to have
  if (!gWantWidth)
    gWantWidth = tb.scrollWidth;
  //debug("on overflow: want width " + gWantWidth + ", now natural (scroll) width " + tb.scrollWidth + ", have (client) width " + tb.clientWidth);
  for each (let button in buttons)
  {
    if (tb.scrollWidth <= tb.clientWidth)
      return;
    button.setAttribute("crowded", "true");
    window.getComputedStyle(tb, null); // force reflow/update
    //debug("after button " + button.id + ": natural width " + tb.scrollWidth + ", have width " + tb.clientWidth);
  }
}

/**
 * Returns the buttons,
 * in the order in which they should be shrinked.
 * @param {Array of DOMElement}
 */
function getButtonsToShrink()
{
  var result = [];
  var buttons = tb.getElementsByTagName("toolbarbutton");
  for (let i = 0, l = buttons.length; i < l; i++)
    result.push(buttons.item(i));
  buttons = tb.getElementsByTagName("toolbaritem");
  for (let i = 0, l = buttons.length; i < l; i++)
    result.push(buttons.item(i));

  result.reverse(); // remove right to left
  result.sort(function(a, b)
  {
    try {
    var aPrio = parseInt(a.getAttribute("remove-priority"));
    var bPrio = parseInt(b.getAttribute("remove-priority"));
    if (isNaN(aPrio))
      aPrio = 100;
    if (isNaN(bPrio))
      bPrio = 100;
    //debug(a.id + "<>" + b.id + ", a prio=" + aPrio + ", b prio=" + bPrio);
    return aPrio - bPrio;
    } catch (e) { error(e); return 0; }
  });
  return result;
}
