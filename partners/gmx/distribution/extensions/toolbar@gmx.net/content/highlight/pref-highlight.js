function onLoad()
{
  try {
    new HighlightColor(E("highlight-color"));
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function HighlightColor(el)
{
  this.elementValueProperty = "color";
  AutoPrefElement.call(this, el, "highlight.color", ourPref);
}
extend(HighlightColor, AutoPrefElement);
