var logic = {}
Components.utils.import("resource://unitedtb/email/webapp-start.js", logic);
var gStringBundle = new StringBundle(
    "chrome://unitedtb/locale/webapps/webapps.properties");

function webappsInitNewTab() {
  try {
    makeWebAppsButton("webapps-inbox", "openmail", "inbox-128.png",
        gStringBundle.get("inbox"));
    makeWebAppsButton("webapps-compose", "new_mail", "compose-128.png",
        gStringBundle.get("compose"));
    makeWebAppsButton("webapps-smartdrive", "open_smartdrive", "smartdrive-128.png",
        gStringBundle.get("smartdrive"));
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", webappsInitNewTab, false);

function makeWebAppsButton(id, usecase, image, caption) {
  var containerE = E("webapps");
  var buttonE = cE("label", "webapp-button", { id : id });
  buttonE.addEventListener("click", function() {
    startUsecase(usecase);
  }, false);
  var figureE = cE("figure");
  buttonE.appendChild(figureE);
  figureE.appendChild(cE("img", "",{src :"/skin/webapps/" + image}));
  var captionE = cE("figcaption");
  captionE.appendChild(cTN(caption));
  figureE.appendChild(captionE);
  containerE.appendChild(buttonE);
}

function startUsecase(usecase, params) {
  try {
    params = params || [];

    debug("want to start usecase " + usecase + ", doing login");
    // ensure that we have a primary account, and it's logged in
    gUnitedFromAbove.common.notifyWindowObservers("do-login", {
      withUI : true,
      needAccountType : 1, // primary account
      successCallback : function(primaryAccount)
      {
        debug("got login, starting usecase " + usecase);
        // do real stuff
        logic.startUsecase(primaryAccount, usecase, params, gFirefoxWindow);
      },
      // errorCallback default: show errors
      // abortCallback default: do nothing
    });
  } catch (e) { errorCritical(e); }
}
