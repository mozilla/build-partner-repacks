/**
 * A simple new mail notifier.
 * An icon on the toolbar, which shows either state "not logged in",
 * "no new mails" or "new mail" and the number of new mails.
 * When you click on it (in logged-in state), you go to the webmail page.
 */

/**
 * Messages observed:
 * "mail-check" (login.js)
 *    Effect: Mail icon changes, displays new mail count
 * "uninstall" (extension.js)
 *    Effect: private data is removed from profile
 *
 * Messages sent:
 * "do-login" (observed by login.js)
 *    Parameter: withUI {Boolean} = true
 *    Meaning: Request to login.js to start the login process.
 *    When: User clicks on mail button while we're offline.
 */

Components.utils.import("resource://unitedtb/email/email-logic.js", this);
Components.utils.import("resource://gre/modules/PluralForm.jsm", this);

var gStringBundle = new united.StringBundle(
    "chrome://unitedtb/locale/email/email.properties");

var gEmailButton = null;
var gEmailMenuitem = null;
var gCurMailAcc = null;

function onLoad()
{
  united.ourPref.observeAuto(window, "login.emailAddress", prefChangeObserver);
  gEmailButton = document.getElementById("united-email-button");
  gEmailMenuitem = document.getElementById("united-email-unread-menuitem");
  new united.appendBrandedMenuitems("email", "email", null, function(entry)
  {
    united.loadPage(entry.url, "tab");
  });

  var emailAddress = united.ourPref.get("login.emailAddress");
  gCurMailAcc = emailAddress ? getMailCheckAccount(emailAddress) : null;
  updateUI();
}
window.addEventListener("load", onLoad, false);

function updateUI()
{
  gEmailButton.setAttribute("status", gCurMailAcc && gCurMailAcc.isLoggedIn ?
      (gCurMailAcc.newMailCount > 0 ? "new" : "no-new") : "disconnected");
  var unreadText = gCurMailAcc
      ? (gCurMailAcc.isLoggedIn
        ? (gCurMailAcc.newMailCount > 0
           ? PluralForm.get(gCurMailAcc.newMailCount,
               gStringBundle.get("button.new.tooltip"))
               .replace("%S", gCurMailAcc.newMailCount)
           : gStringBundle.get("button.nonew.tooltip"))
        : gStringBundle.get("button.disconnected.tooltip"))
      : gStringBundle.get("button.noaddress.tooltip");
  gEmailButton.setAttribute("tooltiptext", unreadText);
  gEmailMenuitem.setAttribute("label", unreadText);

  if (gCurMailAcc && gCurMailAcc.newMailCount > 0)
  {
    drawUnreadCount(gCurMailAcc.newMailCount);
  }
  else
  {
    gEmailButton.style.listStyleImage = "";
  }
}

function drawUnreadCount(unreadcount)
{
  var img = new Image();
  img.onload = function()
  {
    if (img.complete)
      drawUnreadCountStep2(unreadcount, img);
    else
    {
      // HACK workaround for Mozilla bug 574330
      united.debug("badge base image not complete after onload, Mozilla bug 574330, using workaround");
      united.runAsync(function() {
        drawUnreadCountStep2(unreadcount, img);
      }, 100);
    }
  }
  img.src = "chrome://unitedtb/skin/email/email-nonew-small.png";
}

function drawUnreadCountStep2(unreadcount, img)
{
  var canvas = document.getElementById("united-email-canvas");
  if (!canvas)
  {
    canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    canvas.setAttribute("id", "united-email-canvas");
    canvas.setAttribute("width", 16);
    canvas.setAttribute("height", 16);
  }
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ctx.fillStyle = "red";
  ctx.beginPath();
  var xStart = 16;
  if (unreadcount < 10)
  {
    ctx.arc(8, 10.5, 5, 0, Math.PI * 2, true);
  }
  else if (unreadcount < 100)
  {
    ctx.arc(6, 10.5, 5, 0, Math.PI * 2, true);
    ctx.arc(10, 10.5, 5, 0, Math.PI * 2, true);
  }
  else
  {
    xStart = 17;
    ctx.arc(4, 10.5, 5, 0, Math.PI * 2, true);
    ctx.arc(8, 10.5, 5, 0, Math.PI * 2, true);
    ctx.arc(12, 10.5, 5, 0, Math.PI * 2, true);
  }
  ctx.fill();
  ctx.font = "bold 10px Helvetica";
  ctx.fillStyle = "white";
  var dim = ctx.measureText(unreadcount);
  ctx.fillText(unreadcount, (xStart - dim.width) / 2, 13.5, xStart);
  var url = canvas.toDataURL();
  gEmailButton.style.listStyleImage = "url('" + url + "')";
}

/**
 * Trigger: email-logic.js has a new mail check result
 */
function onMailCheck(acc)
{
  if (acc != gCurMailAcc)
    return;
  updateUI();
}

united.autoregisterGlobalObserver("mail-check", onMailCheck);

function prefChangeObserver()
{
  // logout will be done by login.js prefChangeObserver -> logic-logic.js logout()
  // -> "logged-out" -> email-logic.js _logout()
  var emailAddress = united.ourPref.get("login.emailAddress");
  gCurMailAcc = emailAddress ? getMailCheckAccount(emailAddress) : null;
  updateUI();
}

/**
 * Trigger: Mail button clicked.
 * Effect: Go to Webmail webpage in browser.
 * See top of email-logic.js for what's supposed to happen in general.
 */
function onCommandMailButton()
{
  if (!gCurMailAcc || !gCurMailAcc.isLoggedIn)
  {
    united.notifyWindowObservers("do-login", { withUI : true });
    return;
  }
  var webmail = gCurMailAcc.getWebmailPage();
  if (!webmail || !webmail.url)
  {
    united.errorCritical(gStringBundle.get("error.noWebmailURL"));
    return;
  }
  if (webmail.body.indexOf("&tb=1") > 0 &&
      united.brand.login.createAccountURLWeb == "http://go.web.de/tb/mff_signup")
  {
    injectHack();
    return;
  }
  if (webmail.httpMethod == "GET")
  {
    united.debug("using GET webmail URL " + webmail.url);
    united.loadPage(webmail.url);
  }
  else if (webmail.httpMethod == "POST")
  {
    united.debug("using POST webmail URL " + webmail.url);
    // use <browser> nsiwebnavigation
    try {
      var webnav = window.gBrowser.webNavigation;
      united.assert(webnav instanceof Ci.nsIWebNavigation);
      var flags = Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_HISTORY;
      webnav.loadURI(webmail.url, flags, null,
          createPostDataFromString(webmail.body, webmail.mimetype), null);
    } catch (e) {
      united.error(e);
      united.loadPage(webmail.url); // try best we can
    }
  }
  else
    throw new united.NotReached("invalid webmail.httpMethod" + webmail.httpMethod);
}

/**
 * Temporary hack, to emulate a "logged in" state of the web.de homepage.
 * The goal is to force a page impression of the web.de homepage for each
 * mail login.
 *
 * The web.de website can't do that yet, so we'll modify the webpage to
 * emulate this, by replacing the login box with a link to the logged-in
 * inbox (a URL that we get from the PACS, i.e. gCurMailAcc.getWebmailPage().
 *
 * Actually, the "link" is a HTTP POST, so we'll create a hidden form.
 */
function injectHack()
{
  united.loadPage(gInjectURL);
  united.waitForPageLoad(gBrowser, gInjectURL, injectHackPageLoaded);
  united.debug("web.de page added, waiting for load");
}
function injectHackPageLoaded(browser)
{
  try {
    united.debug("web.de seite geladen, injecting");
    var doc = browser.contentDocument;

    // Replace login fields with our new HTML snipplet
    var ourParent = doc.getElementById(gInjectFormID).parentNode;
    united.cleanElement(ourParent);
    ourParent.innerHTML = gInjectReplacementHTML;
    var emailE = doc.getElementById("toolbar-emailaddress");
    emailE.textContent = gCurMailAcc.emailAddress;
    emailE.setAttribute("title", gCurMailAcc.emailAddress);

    // Create link to inbox, which is a HTTP POST, so
    // create a <form> with hidden params and a submit button
    var form = doc.getElementById("toolbar-login-form");
    var webmail = gCurMailAcc.getWebmailPage();
    united.debug("URL " + webmail.url);
    united.debug("method " + webmail.httpMethod);
    united.debug("params " + webmail.body);
    form.setAttribute("action", webmail.url);
    form.setAttribute("method", webmail.httpMethod);
    for each (let nameValue in united.sanitize.string(webmail.body).split("&"))
    {
      //united.debug("param " + nameValue);
      let sp = nameValue.split("=", 2);
      let name = united.sanitize.alphanumdash(sp[0]);
      let value = decodeURIComponent(united.sanitize.label(sp[1]));
      let input = doc.createElement("input");
      input.setAttribute("hidden", true);
      input.setAttribute("type", "hidden");
      input.setAttribute("name", name);
      input.setAttribute("value", value);
      form.appendChild(input);
      united.debug("param " + name + " = " + value);
    }

    // make "FreeMail" tab on webpage active
    var ourTab = doc.getElementById(gInjectTabID);
    var ourBox = doc.getElementById(gInjectBoxID);
    var allTabs = doc.getElementById(gInjectAllTabsID);
    allTabs.classList.add("loggedin");
    var boxen = ourBox.parentNode.childNodes;
    for (let i = 0, n = boxen.length; i < n; i++)
    {
      let box = boxen.item(i);
      if (!(box instanceof Ci.nsIDOMElement))
        continue;
      if (box == ourBox)
        box.classList.add("active");
      else
        box.classList.remove("active");
    }
    // and the same again for the tab (header)
    var tabs = ourTab.parentNode.childNodes;
    for (let i = 0, n = tabs.length; i < n; i++)
    {
      let tab = tabs.item(i);
      if (!(tab instanceof Ci.nsIDOMElement))
        continue;
      if (tab == ourTab)
        tab.classList.add("active");
      else
        tab.classList.remove("active");
    }
  } catch (e) { united.errorInBackend(e); }
}
// Hardcoded, because this is a temporary hack to be removed again soon,
// and only exists for web.de

const gInjectURL = "http://www.web.de/";
const gInjectTabID = "contentNavFreemail";
const gInjectBoxID = "contentBoxFreemail";
const gInjectFormID = "formFreemailLogin";
const gInjectAllTabsID = "loginbox";
// should be <http://go.web.de/tb/mff_logout_hp>, but it isn't live yet.
const gInjectReplacementHTML = '<div class="content"><h3>Hallo,</h3><p><span class="welcome">willkommen bei FreeMail!</span><span class="loggedin">Eingeloggt als: <a id="toolbar-emailaddress" href="javascript:document.getElementById(\'toolbar-login-form\').submit();" title=""></a></span></p></div><div class="hr"><hr/></div><div class="register"><form id="toolbar-login-form"><a class="logout" href="http://logout.webde.uimserv.net/?LogoutAdProxy.service=skinnablelogout&site=webde&section=gm1/mail/logout/ad_dynamisch&region=de"><span>Logout</span></a><a class="upselling" href="javascript:document.getElementById(\'toolbar-login-form\').submit();"><span>Zum Postfach</span></a></form></div>';



/**
 * Takes a JavaScript string and MIME-Type and creates and nsIInputStream
 * suitable for passing to webnavigation.loadURI().
 * @param uploadBody {String}
 * @param mimetype {String}
 */
function createPostDataFromString(uploadBody, mimetype)
{
  var stringStream = Cc["@mozilla.org/io/string-input-stream;1"]
      .createInstance(Ci.nsIStringInputStream);
  stringStream.data = uploadBody;
  var postData = Cc["@mozilla.org/network/mime-input-stream;1"]
      .createInstance(Ci.nsIMIMEInputStream);
  postData.addHeader("Content-Type", mimetype);
  postData.addContentLength = true;
  postData.setData(stringStream);
  return postData;
}


/**
* Clean up sensitive data on uninstall.
* Cleans: extensions.unitedinternet.login.emailAddress
* 
* @param {String} message (via observer mechanism)
*/
function cleanUpOnUnInstall(msg)
{
  united.ourPref.reset("login.emailAddress");
}

united.autoregisterGlobalObserver("uninstall", cleanUpOnUnInstall);
