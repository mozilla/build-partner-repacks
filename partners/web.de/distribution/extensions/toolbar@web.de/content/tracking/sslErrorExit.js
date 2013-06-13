function onLoad()
{
  if (brand.toolbar.sslErrorExitURL) {
    // This is replacing the getMeOutOfHere function in browser.js
    top.getMeOutOfHere = ourGetMeOutOfHere;
  }
}
window.addEventListener("load", onLoad, false);

function ourGetMeOutOfHere()
{
  content.location = brand.toolbar.sslErrorExitURL;
}
