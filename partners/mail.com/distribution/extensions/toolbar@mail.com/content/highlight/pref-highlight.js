function onLoad()
{
  new HighlightColor(document.getElementById("highlight-color"));
}
window.addEventListener("load", onLoad, false);

function HighlightColor(el)
{
  this.elementValueProperty = "color";
  AutoPrefElement.call(this, el, "highlight.color", ourPref);
}
extend(HighlightColor, AutoPrefElement);
