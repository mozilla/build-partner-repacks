Components.utils.import("resource://unitedtb/webapps/mailto-setting.js");

function onLoad() {
  new MailToCheckbox(document.getElementById("webapps-mailto-checkbox"));
}
window.addEventListener("load", onLoad, false);

function MailToCheckbox(el) {
  SettingElement.call(this, el);
}
MailToCheckbox.prototype = {
  get storeValue() {
    return isOurMailtoHandlerDefault();
  },
  set storeValue(val) {
    enableOurMailtoHandler(val);
  },
  get defaultValue() {
    return true;
  },
}
extend(MailToCheckbox, SettingElement);
