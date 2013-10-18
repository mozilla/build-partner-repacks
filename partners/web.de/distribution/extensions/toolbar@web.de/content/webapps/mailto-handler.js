Components.utils.import("resource://unitedtb/util/common-jsm.js");
var logic = {}
Components.utils.import("resource://unitedtb/email/webapp-start.js", logic);

function handleMailTo() {
  var firefoxWindow = getTopLevelWindowContext(window);
  var unitedFromAbove = firefoxWindow.unitedinternet;

  // See: http://tools.ietf.org/html/rfc2368 for the format
  // e.g. mailto:foo@e,bar@e?to=baz@e,bar@e
  // &cc=c@e,d@e&cc=e@e&bcc=b@e&subject=hello&body=how+are+you%40
  // We receive a URL of the format
  // chrome://unitedtb/content/webapps/mailto-handler.xul?mailto%3Afoo%40bar.com%3Fsubject%3Dfoo
  // We grab the search part to get the actual mailto URL
  var url = document.location.search.substr(1);
  url = decodeURIComponent(url);
  assert(url.substr(0, 7) == "mailto:", "This handler only supports mailto: URLs");
  // Get rid of mailto
  url = url.replace("mailto:", "");

  // Get params are after the question mark, email address is before
  var mailtoSplit = url.split("?");
  var toFront = mailtoSplit[0].split(",");
  var params = {};
  if (mailtoSplit.length > 1) { // params are optional
    // split "?cc=c,d&cc=e&bcc=b" into { cc : "c,d,e", bcc : "b" }
    // also does decodeURIComponent()
    params = parseURLQueryString(mailtoSplit[1], function(p) {
      // in mailto:, params can appear several times, e.g. "?cc=a@a&cc=b@b"
      if (p.allParams[p.name]) {
        p.value = p.allParams[p.name] + "," + p.value; // append to existing one
      }
      // p.allParams[p.name] = p.value; -- done by parseURLQueryString()
    });
  }
  params.to = toFront + (params.to ? "," + params.to : "");

  // webapp requires arrays, so we convert them
  // other params are passed on form URL to webapp as-is
  ["to", "cc", "bcc"].forEach(function(paramName) {
    if (typeof(params[paramName]) == "string") {
      params[paramName] = params[paramName].split(",");
    }
  });

  // pass to webapp
  try {
    runAsync(function() {
      // ensure that we have a primary account, and it's logged in
      unitedFromAbove.common.notifyWindowObservers("do-login", {
        withUI : true,
        needAccountType : 1, // primary account
        successCallback : function(primaryAccount) {
          // do real stuff
          logic.startUsecase(primaryAccount, "mail_compose", [params], firefoxWindow);
        },
        // errorCallback default: show errors
        // abortCallback default: do nothing
      });
    });

    // We're on chrome://.../mailto-handler.xul. Go back to webpage,
    // in all cases, and immediately, before the login dialog is done
    // TODO: This will only work until FF26. See #1259
    try {
      document.location.replace(document.defaultView.history.previous);
    } catch (e) {} // This can fail on a new tab with no previous
  } catch (e) { errorCritical(e); }
}

handleMailTo();
