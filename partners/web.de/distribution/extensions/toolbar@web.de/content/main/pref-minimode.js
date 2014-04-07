var gButtonList;

function onLoad()
{
  new MiniModeCheckbox(E("enable-minimode"));
  /* Even when the button list is disabled, you can still check
     the checkboxes
  gButtonList = E("buttons-list-list");
  document.getElementById("enable-minimode").addEventListener("click", function(event) {
    gButtonList.disabled = event.target.checked;
  }, false);
  gButtonList.disabled = E("enable-minimode").checked; */
}
window.addEventListener("load", onLoad, false);

function MiniModeCheckbox(el)
{
  SettingElement.call(this, el);
}
MiniModeCheckbox.prototype =
{
  get storeValue()
  {
    var firefoxWindow = findSomeBrowserWindow();
    var unitedToolbar = firefoxWindow.document.getElementById("united-toolbar");
    var miniMode = unitedToolbar.hasAttribute("minimode") &&
                   unitedToolbar.getAttribute("minimode") == "true";
    return miniMode;
  },
  set storeValue(val)
  {
    notifyGlobalObservers('minimode', {enable:val});
  },

  get defaultValue()
  {
    return build.kVariant == "minimode";
  },
}
extend(MiniModeCheckbox, SettingElement);
