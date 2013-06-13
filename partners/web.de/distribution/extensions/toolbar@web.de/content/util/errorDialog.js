Components.utils.import("resource://unitedtb/util/util.js");

function onLoad()
{
  var args = window.arguments[0];

  E("info.body").value = args.text;
  document.title = args.title;
  E("info.title").value = args.title;
  if (args.checkLabel)
  {
    E("checkboxContainer").hidden = false;
    E("checkbox").label = args.checkLabel;
    E("checkbox").checked = args.checked;
  }
  if (getOS() == "mac")
  {
    E("info.title").hidden = false;
    E("info.title").style.marginBottom = "1em";
  }
  if (args.moreInfo) {
    E("moreinfo").hidden = false;
    E("moreInfoTitle").setAttribute("value", args.moreInfo.title);
    E("moreInfoContent").appendChild(document.createTextNode(args.moreInfo.content));
  }
}

function onCancel()
{
  var args = window.arguments[0];
  args.cancel = true;
}

function onOK()
{
  var args = window.arguments[0];
  if (args.checkLabel)
    args.checked = E("checkbox").checked;
}

function showMoreInfo(event)
{
  var panel = document.getElementById("moreInfoPanel");
  panel.openPopup(event.target, "after_start", 0, 0, false, false, event);
}
