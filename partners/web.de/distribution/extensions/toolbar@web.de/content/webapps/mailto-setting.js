/**
 *
 * Messages reacted to by this module:
 * "uninstall", "disable"
 *    Effect: Uninstall our mailto handler
 * "first-run", "upgrade", "reinstall"
 *    Effect: Set our mailto handler as the default
 */

const EXPORTED_SYMBOLS = [ "enableOurMailtoHandler", "isOurMailtoHandlerDefault"];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/util/common-jsm.js");

XPCOMUtils.defineLazyServiceGetter(this, "gExternalProtocolServ",
    "@mozilla.org/uriloader/external-protocol-service;1",
    "nsIExternalProtocolService");
XPCOMUtils.defineLazyServiceGetter(this, "gHandlerServ",
    "@mozilla.org/uriloader/handler-service;1",
    "nsIHandlerService");

const mailtoURI = "chrome://unitedtb/content/webapps/mailto-handler.xul?%s";

/**
 * Entry point for prefs to enable or disable mailto
 *
 * @param enable {Boolean} if mailto should be enabled or disabled
 */
function enableOurMailtoHandler(enable) {
  if (enable) {
    setOurMailtoHandler();
  } else {
    resetMailtoHandler();
  }
}

/**
 * Sets the mailto handler to be us.
 * If our handler does not exist, it is created.
 */
function setOurMailtoHandler() {
  if (isOurMailtoHandlerDefault()) {
    return;
  }
  installOurMailtoHandler();
  try {
    var handler = getOurMailtoHandler();
    var handlerInfo = gExternalProtocolServ.getProtocolHandlerInfo("mailto");
    /* Store old values no matter what */
    if (handlerInfo.preferredApplicationHandler)
      ourPref.set("mailto.original.preferredApplicationHandler",
                  handlerInfo.preferredApplicationHandler.name);
    ourPref.set("mailto.original.preferredAction", handlerInfo.preferredAction);
    ourPref.set("mailto.original.alwaysAskBeforeHandling",
                handlerInfo.alwaysAskBeforeHandling);

    handlerInfo.preferredAction = Ci.nsIHandlerInfo.useHelperApp;
    handlerInfo.preferredApplicationHandler = handler;
    handlerInfo.alwaysAskBeforeHandling = false;
    gHandlerServ.store(handlerInfo);
  } catch (e) {
    errorInBackend(e);
  }
}

/**
 * Checks to see if we are the default mailto handler
 * @returns {boolean} true if we are the mailto handler, false otherwise
 */
function isOurMailtoHandlerDefault() {
  try {
    var handlerInfo;
    handlerInfo = gExternalProtocolServ.getProtocolHandlerInfo("mailto");
    if (handlerInfo && handlerInfo.preferredApplicationHandler
        && handlerInfo.preferredAction == 2) { // useHelperApp - workaround for bug 961233
      var handler = handlerInfo.preferredApplicationHandler
                               .QueryInterface(Ci.nsIWebHandlerApp);
      if (handler.uriTemplate == mailtoURI) {
        return true;
      }
    }
  } catch (e) {
    errorInBackend(e);
  }
  return false;
}

/**
 * Returns our mailto handler object
 * @returns {nsIWebHandlerApp} If our handler exists in the list of handlers,
 *                             return it, otherwise return null
 */
function getOurMailtoHandler() {
  try {
    var handlerInfo = gExternalProtocolServ.getProtocolHandlerInfo("mailto");
    var handlers = handlerInfo.possibleApplicationHandlers;
    for (var i = 0; i < handlers.length; ++i) {
      var handler = handlers.queryElementAt(i, Ci.nsIWebHandlerApp);
      if (handler.uriTemplate == mailtoURI) {
        return handler;
      }
    }
  } catch (e) {
    errorInBackend(e);
  }
  return null;
}

/**
 * Completely removes our mailto handler
 * This is only used for uninstall.
 */
function uninstallOurMailtoHandler() {
  try {
    resetMailtoHandler();
    var handlerInfo = gExternalProtocolServ.getProtocolHandlerInfo("mailto");
    var handlers = handlerInfo.possibleApplicationHandlers;
    for (var i = 0; i < handlers.length; ++i) {
      var handler = handlers.queryElementAt(i, Ci.nsIWebHandlerApp);
      if (handler.uriTemplate == mailtoURI) {
        handlerInfo.possibleApplicationHandlers.removeElementAt(i);
        gHandlerServ.store(handlerInfo);
        break;
      }
    }
  } catch (e) {
    errorInBackend(e);
  }
}

/**
 * Installs our mailto handler.
 * Does NOT set it as the default.
 */
function installOurMailtoHandler() {
  try {
    if (getOurMailtoHandler()) {
      return;
    }
    var handlerInfo = gExternalProtocolServ.getProtocolHandlerInfo("mailto");
    var handler = Cc["@mozilla.org/uriloader/web-handler-app;1"].
                  createInstance(Ci.nsIWebHandlerApp);
    handler.name = brand.toolbar.name;
    handler.uriTemplate = mailtoURI;
    handlerInfo.possibleApplicationHandlers.appendElement(handler, false);
    gHandlerServ.store(handlerInfo);
  } catch (e) {
    errorInBackend(e);
  }
}

/**
 * Change mailto back to what is was before we were installed.
 * Does not remove our handler.
 */
function resetMailtoHandler() {
  if ( !isOurMailtoHandlerDefault()) {
    return;
  }
  try {
    var handlerInfo = gExternalProtocolServ.getProtocolHandlerInfo("mailto");
    if (ourPref.isSet("mailto.original.preferredApplicationHandler")) {
      var handlers = handlerInfo.possibleApplicationHandlers;
      var originalHandler = ourPref.get("mailto.original.preferredApplicationHandler");
      for (var i = 0; i < handlers.length; ++i) {
        var handler = handlers.queryElementAt(i, Ci.nsIWebHandlerApp);
        if (handler.name == originalHandler) {
          handlerInfo.preferredApplicationHandler = handler;
          break;
        }
      }
    } else {
      handlerInfo.preferredApplicationHandler = null;
    }
    handlerInfo.preferredAction = ourPref.get("mailto.original.preferredAction",
                                              Ci.nsIHandlerInfo.useHelperApp);
    handlerInfo.alwaysAskBeforeHandling = ourPref.get("mailto.original.alwaysAskBeforeHandling",
                                                      true);
    gHandlerServ.store(handlerInfo);
    ourPref.reset("mailto.original.preferredApplicationHandler");
    ourPref.reset("mailto.original.preferredAction");
    ourPref.reset("mailto.original.alwaysAskBeforeHandling");
  } catch (e) {
    errorInBackend(e);
  }
}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "uninstall" ||
        msg == "disable") {
      uninstallOurMailtoHandler();
    } else if (msg == "first-run" ||
               msg == "upgrade" ||
               msg == "reenable") {
      setOurMailtoHandler();
    }
  }
}
registerGlobalObserver(globalObserver);
