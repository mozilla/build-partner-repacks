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
 * "do-login" (observed by login.js, see there for docs)
 *    Meaning: Request to login.js to start the login process.
 *    When: User clicks on mail button while we're offline.
 */

Components.utils.import("resource://unitedtb/email/account-list.js", this);
Components.utils.import("resource://unitedtb/email/webapp-start.js", this);
//Components.utils.import("resource://unitedtb/email/taskbar.js", this);
Components.utils.import("resource://gre/modules/PluralForm.jsm", this);
Components.utils.import("resource://unitedtb/util/globalobject.js", this);
var gStringBundle = new united.StringBundle(
    "chrome://unitedtb/locale/email/email.properties");

var gEmailButton = null;
var gEmailButtonDropdown = null;
var gEmailMenuitems = [];
// All accounts
// {Array of Account}
var gMailAccs = [];
// Number of unread mail (of all accounts) in last poll intervall
// Used to calculate new mail notifications
var gLastUnreadMailCount = -1;
// Time when the newmail notification was played/shows the last time. As |Date|
var gLastNotificationTime = 0;

var gMailImage = new Image();
// Takes a bit to load,
// but must be finished before updateUI() is called with an unread count > 0.
// Obviously, do not modify it, but copy it.
// This avoids repeated loading, async onload(), setTimeout for bug 574330,
// and the resulting out-of-order problems when several accounts get logged out
gMailImage.src = "chrome://unitedtb/skin/email/email-nonew-small.png";

function onLoad()
{
  try {
    gEmailButton = document.getElementById("united-email-button");
    gEmailButtonDropdown = document.getElementById("united-email-button-dropdown");
    new united.appendBrandedMenuitems("email", "email", null, function(entry)
    {
      united.loadPage(entry.url, "tab");
    });

    readAccounts();
    updateUI();

    // Display XXL Tooltip asking to log in
    if (united.brand.login.enableXXLTooltip && !gMailAccs.length)
    {
      if (!united.ourPref.get("email.shownOffer", false))
      {
        united.ourPref.set("email.shownOffer", true);
        var popup = document.getElementById("united-email-popup");
        popup.openPopup(gEmailButton, "after_start", 0, 0, false, true);
      }
    }
  } catch (e) { united.errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function accountListChange()
{
  // logout will be done by login.js prefChangeObserver -> logic-logic.js logout()
  // -> "logged-out" -> email-logic.js _logout()
  readAccounts();
  updateUI();
}
united.autoregisterGlobalObserver("account-added", accountListChange);
united.autoregisterGlobalObserver("account-removed", accountListChange);

function readAccounts()
{
  //gMailAccs = getAllExistingAccounts().filter(function(acc) { return acc.kType == "unitedinternet"; });
  gMailAccs = getAllExistingAccounts();
}

/**
 * Returns a fake |Account| object with a summary of all accounts.
 * @returns {
 *   isLoggedIn {Boolean}   any of the accounts is logged in
 *   newMailCount {Integer}   total of new mails in all accounts
 *   accountCount {Integer}   number of accounts
 * }
 */
function accountsSummary()
{
  var result = {
    isLoggedIn : false,
    newMailCount : 0,
    accountCount : 0,
  };
  for each (let acc in gMailAccs)
  {
    result.accountCount += 1;
    if (acc.newMailCount > 0)
      result.newMailCount += acc.newMailCount;
    if (acc.isLoggedIn)
      result.isLoggedIn = true;
  }
  return result;
}

function updateUI()
{
  // delete
  for each (let menuitem in gEmailMenuitems)
    gEmailButtonDropdown.removeChild(menuitem);
  var insertBefore = document.getElementById("united-email-separator-after-accounts");
  var tooltiptext = gEmailButton.getAttribute("tooltiptext-for-item");
  gEmailMenuitems = [];

  for each (let acc in gMailAccs)
  {
    let menuitem = document.createElement("menuitem");
    menuitem.classList.add("united-email-unread-menuitem");
    menuitem.classList.add("menuitem-iconic");
    menuitem.setAttribute("tooltiptext", tooltiptext);
    menuitem.addEventListener("command", onCommandAccountMenuitem, false);
    updateMenuitem(menuitem, acc);
    gEmailMenuitems.push(menuitem);
    gEmailButtonDropdown.insertBefore(menuitem, insertBefore);
  }
  insertBefore.hidden = !gMailAccs.length;

  var summary = accountsSummary();
  var summaryFakeAcc = summary.accountCount ? summary : null;
  gEmailButton.setAttribute("status", statusAttr(summaryFakeAcc));
  gEmailButton.setAttribute("tooltiptext", unreadText(summaryFakeAcc));
  drawUnreadCount(summary.newMailCount);

  // show new mail alerts
  // |newMailCount| is actually unread mail, so check whether this increased
  // to see whether we have really new mail.
  // We need to know this only momentarily to show the alert.
  const kMinIntervall = 3000; // Minimum time between 2 notifications. in ms
  //united.debug("last notification was on " + gLastNotificationTime.toLocaleString() + " = " + gLastNotificationTime.valueOf() + ", that is " + (new Date() - gLastNotificationTime) + " ago");
  if (gLastUnreadMailCount != -1 && // not at new window, but at browser start / login
      summary.newMailCount > gLastUnreadMailCount &&
      new Date() - gLastNotificationTime > kMinIntervall)
  {
    gLastNotificationTime = new Date();
    let count = summary.newMailCount - gLastUnreadMailCount;
    playSound();
    showDesktopNotification(count);
  }
  gLastUnreadMailCount = summary.newMailCount;
}
united.autoregisterGlobalObserver("mail-check", updateUI);

function updateMenuitem(menuitem, acc)
{
  menuitem.account = acc;
  menuitem.setAttribute("status", statusAttr(acc));
  menuitem.setAttribute("label",
      gStringBundle.get("button.emailAddressPlacement")
        .replace("%1", acc.emailAddress)
        .replace("%2", unreadText(acc)));
}

function unreadText(acc)
{
  return acc
      ? (acc.isLoggedIn
        ? (acc.newMailCount > 0
           ? PluralForm.get(acc.newMailCount,
               gStringBundle.get("button.new.tooltip"))
               .replace("%S", acc.newMailCount)
           : gStringBundle.get("button.nonew.tooltip"))
        : gStringBundle.get("button.disconnected.tooltip"))
      : document.getElementById("united-email-configure-menuitem")
          .getAttribute("tooltiptext");
}

function statusAttr(acc)
{
  return acc && acc.isLoggedIn
      ? (acc.newMailCount > 0 ? "new" : "no-new")
      : "disconnected";
}

function playSound()
{
  try {
    if ( !united.ourPref.get("email.notification.sound.enabled"))
      return;
    var sound = Cc["@mozilla.org/sound;1"]
        .createInstance(Ci.nsISound);
    if (united.getOS() == "mac")
      sound.beep();
    else
      sound.playEventSound(Ci.nsISound.EVENT_NEW_MAIL_RECEIVED);
    //sound.play(united.makeNSIURI("chrome://unitedtb/skin/email/kongas.wav"));
    united.debug("beep");
  } catch (e) { united.errorNonCritical(e); } // unexpected, but non-critical
}

function showDesktopNotification(newMailCount)
{
  try {
    if ( !united.ourPref.get("email.notification.desktop.enabled"))
      return;
    var message = PluralForm.get(newMailCount,
        gStringBundle.get("alert.message.pluralform"))
        .replace("%S", newMailCount);
    var alerts = Cc["@mozilla.org/alerts-service;1"]
        .getService(Ci.nsIAlertsService);
    alerts.showAlertNotification(
        "chrome://unitedtb/skin/email/email-new-small.png", // image
        gStringBundle.get("alert.title"), // title
        message, // message text
        true, // clickable
        null, // callback ID
        desktopNotificationClickObserver, // listener
        gStringBundle.get("alert.name") // name for Growl config
        );
    united.debug(message);
  } catch (e) { // expected, e.g. if Growl is not installed
    united.errorNonCritical("Could not show desktop notificaton");
    united.errorNonCritical(e);
  }
}

var desktopNotificationClickObserver =  
{
  observe : function(subject, topic, data)
  {  
    if (topic != "alertclickcallback")
      return;
    desktopNotificationClicked(null, data);
  }
};

function desktopNotificationClicked(dummy, cookie)
{
  // HACK: updateUI() doesn't know which account is new,
  // so just open the first account with new mail
  for each (let acc in gMailAccs)
  {
    if (acc.isLoggedIn && acc.newMailCount > 0)
    {
      goToWebmail(acc);
      break;
    }
  }
}

const minUnreadCountWidth = 16;
const unreadCountPadding = 1;
const separatorWidth = 2;
const iconWidth = 16;
const iconHeight = 16;

function drawUnreadCount(unreadcount)
{
  if (unreadcount == 0)
  {
    gEmailButton.style.listStyleImage = "";
    //updateTaskbarIcon(window, null);
    return;
  }

  var canvas = document.getElementById("united-email-canvas");
  if (!canvas)
  {
    canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    canvas.setAttribute("id", "united-email-canvas");
    canvas.setAttribute("height", iconHeight);
  }
  var ctx = canvas.getContext("2d");
  /* Measure text and adjust canvas accordingly */
  ctx.strokeStyle = "#C31718";
  var textMetrics = ctx.measureText(unreadcount);
  /* If the width of the text plus 2 for padding is over 16, grow the canvas */
  var unreadCountWidth;
  if (textMetrics.width + unreadCountPadding > minUnreadCountWidth) {
    canvas.setAttribute("width", iconWidth + separatorWidth + textMetrics.width + unreadCountPadding*2);
    unreadCountWidth = textMetrics.width + unreadCountPadding*2;
  } else {
    canvas.setAttribute("width", iconWidth + separatorWidth + minUnreadCountWidth);
    unreadCountWidth = minUnreadCountWidth;
  }
  ctx.drawImage(gMailImage, 0, 0);
  ctx.fillStyle = "#C40A0A"; // dark red
  ctx.strokeStyle = "#C31718";
  ctx.fillRect(iconWidth + separatorWidth, 0, unreadCountWidth, iconHeight);
  ctx.font = "bold 10px Helvetica, sans-serif";
  ctx.fillStyle = "white";
  var xPos = iconWidth + separatorWidth + unreadCountPadding;
  /* If we did not grow the canvas, we need to center the text */
  if (unreadCountWidth == minUnreadCountWidth) {
    xPos = xPos + (unreadCountWidth - textMetrics.width)/2;
  }
  // Math can't be used to compute this value.
  // It's the position where the 10 pixels font looks best
  // centered vertocally
  ctx.fillText(unreadcount, xPos, 12);
  var url = canvas.toDataURL();
  gEmailButton.style.listStyleImage = "url('" + url + "')";
  //updateTaskbarIcon(window, gMailImage.src);
}

/**
 * Mail button clicked.
 * Effect:
 * - If no accounts, go to configure
 * - If exactly 1 account, (login and) go to its webmail.
 * - If > 1 account, open dropdown.
 */
function onCommandMailButton()
{
  if (gMailAccs.length == 0) // nothing configured
  {
    united.notifyWindowObservers("do-login", {
      withUI : true,
      account : null,
      needAccountType : 1,
      successCallback : goToWebmail,
      // errorCallback default: show errors
      // abortCallback default: do nothing
    });
  }
  else if (gMailAccs.length == 1)
  {
    ensureLoginAndDo(gMailAccs[0], goToWebmail);
  }
  else
  {
    gEmailButton.open = true
    //gEmailButtonDropdown.openPopup(gEmailButton, "after_start");
  }
}

/**
 * Dropdown menu item for a specific account was clicked.
 * Effect:
 * - If logged out, show login dialog.
 * - Otherwise, go its webmail.
 */
function onCommandAccountMenuitem(event)
{
  event.stopPropagation(); // prevent it from bubbling to main <button>
  var acc = event.target.account;
  united.assert(acc && acc.emailAddress);
  ensureLoginAndDo(acc, goToWebmail);
}

function goToWebmail(acc)
{
  if (acc.type == "unitedinternet" && acc.providerID == "webde")
    startUsecase(acc, "openmail", [], window);
  else
    goToWebmailOld(acc, window);
}

/**
 * User wants to trigger a mail poll right now.
 */
function onCommandCheckMailsNow(event)
{
  event.stopPropagation(); // prevent it from bubbling to main <button>

  united.notifyWindowObservers("do-login", {
    withUI : true,
    needAccountType : 10, // all accounts
    successCallback : function(a)
    {
      for each (let acc in gMailAccs)
      {
        if (acc.isLoggedIn)
          acc.mailCheck(false, false, function() {}, united.errorCritical);
      }
    },
    // errorCallback default: show errors
    // abortCallback default: do nothing
  });
}

/**
 * Dropdown menu item "Configure..." was clicked
 * Effect:
 * - Show dialog to configure an account
 */
function onCommandConfigureMenuitem(event)
{
  event.stopPropagation(); // prevent it from bubbling to main <button>
  united.openPrefWindow("email");
}

/**
 * @param acc {Account}
 * @param successCallback {Function(acc)}
 */
function ensureLoginAndDo(acc, successCallback)
{
  if (acc.isLoggedIn)
  {
    successCallback(acc);
  }
  else
  {
    united.notifyWindowObservers("do-login", {
      withUI : true,
      account: acc,
      needAccountType : 9, // specific account
      successCallback : function(a)
      {
        successCallback(acc);
      },
      // errorCallback default: show errors
      // abortCallback default: do nothing
    });
  }
}


function onXXLTooltipClicked()
{
  // make server ping to measure clicks
  if (united.brand.login.trackXXLTooltipClickedURL)
  {
    new united.FetchHTTP({
        url : united.brand.login.trackXXLTooltipClickedURL,
        method : "GET",
    }, function() {}, united.errorNonCritical).start();
  }

  onCommandMailButton();
}
