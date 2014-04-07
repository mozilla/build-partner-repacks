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

importJSM("email/account-list.js", this);
importJSM("email/webapp-start.js", this);
//importJSM("email/taskbar.js", this);
importJSM("util/globalobject.js", this);
importJSM("email/badge.js", this);
var gStringBundle = new StringBundle("email/email");
var gBrandBundle = new StringBundle("email/email-brand");

var gEmailButton = null;
var gEmailStatusBarImage = null;
var gEmailStatusBarLabel = null;
var gEmailButtonDropdown = null;
var gEmailMenuitems = [];
// All accounts
// {Array of Account}
var gMailAccs = [];

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
    gEmailStatusBarImage = E("united-email-statusbar-image");
    gEmailStatusBarLabel = E("united-email-statusbar-label");
    gEmailButton = E("united-email-button");
    gEmailButtonDropdown = E("united-email-button-dropdown");
    new appendBrandedMenuitems("email", "email", null, function(entry)
    {
      loadPage(entry.url, "tab");
    });

    readAccounts();
    updateUI();

    // Display XXL Tooltip asking to log in
    if (brand.login.enableXXLTooltip && !gMailAccs.length)
    {
      if (!ourPref.get("email.shownOffer", false))
      {
        ourPref.set("email.shownOffer", true);
        var popup = E("united-email-popup");
        popup.openPopup(gEmailButton, "after_start", 0, 0, false, true);
      }
    }
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

function accountListChange()
{
  // logout will be done by login.js prefChangeObserver -> logic-logic.js logout()
  // -> "logged-out" -> email-logic.js _logout()
  readAccounts();
  updateUI();
}
autoregisterGlobalObserver("account-added", accountListChange);
autoregisterGlobalObserver("account-removed", accountListChange);

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
  for (let [,menuitem] in Iterator(gEmailMenuitems))
    gEmailButtonDropdown.removeChild(menuitem);
  var insertBeforeE = E("united-email-separator-after-accounts");
  var tooltiptext = gEmailButton.getAttribute("tooltiptext-for-item");
  gEmailMenuitems = [];

  for each (let acc in gMailAccs)
  {
    let menuseparator = document.createElement("menuseparator");
    gEmailMenuitems.push(menuseparator);
    gEmailButtonDropdown.insertBefore(menuseparator, insertBeforeE);
    let menuitem = document.createElement("menuitem");
    menuitem.classList.add("united-email-unread-menuitem");
    menuitem.classList.add("menuitem-iconic");
    menuitem.setAttribute("tooltiptext", tooltiptext);
    menuitem.addEventListener("command", onCommandAccountMenuitem, false);
    updateMenuitem(menuitem, acc,
        typeof(acc.friendsNewMailCount) == "number" ? 2 : 1);
    gEmailMenuitems.push(menuitem);
    gEmailButtonDropdown.insertBefore(menuitem, insertBeforeE);
    if (acc.unknownNewMailCount > 0) {
      let menuitem = document.createElement("menuitem");
      menuitem.classList.add("united-email-unread-menuitem");
      menuitem.classList.add("menuitem-iconic");
      menuitem.setAttribute("tooltiptext", tooltiptext);
      menuitem.addEventListener("command", onCommandAccountMenuitem, false);
      updateMenuitem(menuitem, acc, 3);
      menuitem.account = acc;
      gEmailMenuitems.push(menuitem);
      gEmailButtonDropdown.insertBefore(menuitem, insertBeforeE);
    }
    if (acc.isLoggedIn) {
      if (acc.newMailCount > 0 &&
          (!("ui_previousNewMailCount" in acc) ||
          acc.newMailCount != acc.ui_previousNewMailCount)) {
        playSound();
        showDesktopNotification(acc);
        acc.ui_previousNewMailCount = acc.newMailCount;
      }
    }
  }

  var summary = accountsSummary();
  var summaryFakeAcc = summary.accountCount ? summary : null;
  gEmailButton.setAttribute("status", statusAttr(summaryFakeAcc));
  gEmailButton.setAttribute("tooltiptext", unreadText(summaryFakeAcc));
  gEmailStatusBarImage.setAttribute("status", statusAttr(summaryFakeAcc));
  gEmailStatusBarImage.setAttribute("tooltiptext", unreadText(summaryFakeAcc));
  gEmailStatusBarLabel.setAttribute("tooltiptext", unreadText(summaryFakeAcc));
  if (summary.isLoggedIn)
    gEmailStatusBarLabel.setAttribute("value", summary.newMailCount);
  else
    gEmailStatusBarLabel.setAttribute("value", gEmailStatusBarLabel.getAttribute("origvalue"));
  drawCount(summary.newMailCount, gEmailButton, gMailImage);
  unitedinternet.toolbar.onButtonSizeChangedByCode();
  // Disabled because of Mozilla bug 744992
  //updateTaskbarIcon(window, summary.newMailCount > 0 ? gMailImage.src : null);
}
autoregisterGlobalObserver("mail-check", updateUI);

/**
 * @param type {integer} @see unreadText()
 */
function updateMenuitem(menuitem, acc, type)
{
  menuitem.account = acc;

  if (//acc.kType == "unitedinternet" &&
      (type == 2 && acc.friendsNewMailCount > 0 ||
       type == 3 && acc.unknownNewMailCount > 0)) {
    menuitem.setAttribute("status", "new");
  } else {
    menuitem.setAttribute("status", statusAttr(acc));
  }

  menuitem.setAttribute("label",
      gStringBundle.get("button.emailAddressPlacement")
        .replace("%1", acc.emailAddress)
        .replace("%2", unreadText(acc, type)));
}

/**
 * Function that generates the text of the menubutton or tooltip
 * based on the number of emails, the status, and the type
 * @param acc {object} The account object
 * @param type {integer} The type of item for which text is being generated
 *   1 = New mail (all minus cruft, as defined by server)
 *   2 = Friends only
 *   3 = Unknown senders only
 * @returns {String} the formatted string
 */
function unreadText(acc, type)
{
  var count;
  var bundleSuffix;
  if (acc) {
    if (type == 2) { // Friends only
      count = acc.friendsNewMailCount;
      bundleSuffix = ".inbox";
    } else if (type == 3) { // Unknown senders
      count = acc.unknownNewMailCount;
      bundleSuffix = ".unknown";
    } else {
      count = acc.newMailCount;
      bundleSuffix = "";
    }
  }

  return acc
      ? (acc.isLoggedIn
        ? pluralform(count, gBrandBundle.get("button.new" + bundleSuffix))
        : gStringBundle.get("button.disconnected"))
      : E("united-email-configure-menuitem")
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
    if ( !ourPref.get("email.notification.sound.enabled"))
      return;
    var sound = Cc["@mozilla.org/sound;1"]
        .createInstance(Ci.nsISound);
    if (getOS() == "mac")
      sound.beep();
    else
      sound.playEventSound(Ci.nsISound.EVENT_NEW_MAIL_RECEIVED);
    //sound.play(makeNSIURI("chrome://unitedtb/skin/email/kongas.wav"));
    debug("beep");
  } catch (e) { errorNonCritical(e); } // unexpected, but non-critical
}

function showDesktopNotification(acc)
{
  try {
    if ( !ourPref.get("email.notification.desktop.enabled"))
      return;
    if ( !("Notification" in window)) {
      return;
    }
    var notification = new Notification(brand.toolbar.name, {
      body: pluralform(acc.newMailCount,
                           gStringBundle.get("alert.message.pluralform"))
                      .replace("%ACCOUNT%", acc.emailAddress),
      icon: "chrome://unitedtb/skin/email/email-new-32.png",
      tag: acc.emailAddress, // replaces existing notifications for that acc
    });
    notification.onclick = function() {
      goToWebmail(acc);
    }
  } catch (e) {
    errorNonCritical(e);
  }
}

/**
 * Mail button clicked.
 * Effect:
 * - If no accounts, go to configure
 * - If exactly 1 account, (login and) go to its webmail.
 * - If > 1 account, open dropdown.
 * - If openPrimary, finds the primary account and opens it
 *
 * @param openPrimary {boolean} (optional, default false)
 *    Avoid a dropdown
 */
function onCommandMailButton(openPrimary)
{
  try {
    if (gMailAccs.length == 0) // nothing configured
    {
      notifyWindowObservers("do-login", {
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
    else if (openPrimary)
    {
      // Use primary account (it might not be the first one)
      ensureLoginAndDo(getPrimaryAccount(), goToWebmail);
    }
    else
    {
      gEmailButton.open = true
      //gEmailButtonDropdown.openPopup(gEmailButton, "after_start");
    }
  } catch (e) { errorCritical(e); }
}

/**
 * Dropdown menu item for a specific account was clicked.
 * Effect:
 * - If logged out, show login dialog.
 * - Otherwise, go its webmail.
 */
function onCommandAccountMenuitem(event)
{
  try {
    event.stopPropagation(); // prevent it from bubbling to main <button>
    var acc = event.target.account;
    assert(acc && acc.emailAddress);
    ensureLoginAndDo(acc, goToWebmail);
  } catch (e) { errorCritical(e); }
}

function goToWebmail(acc)
{
  if (acc.type == "unitedinternet" &&
      "iacUsecase" in acc.loginContext.weblogin) {
    startUsecase(acc, "homepage-logged-in", [], window);
  } else if (acc.type == "unitedinternet") {
    goToWebmailOld(acc, window);
  } else {
    // do nothing
  }
}

// Set the checking attribute on the icon so we get animation
function animateMailCheckIcon() {
  gEmailButton.setAttribute("checking", "true");
}

// Stop the animation for checking mail by removing the attribute
// We do this on a 1 second timeout so we get at least a second of animation
function stopMailCheckIcon() {
  window.setTimeout(function() {
    gEmailButton.removeAttribute("checking");
  }, 1000);
}

/**
 * User wants to trigger a mail poll right now.
 */
function onCommandCheckMailsNow(event)
{
  try {
    event.stopPropagation(); // prevent it from bubbling to main <button>

    animateMailCheckIcon();
    notifyWindowObservers("do-login", {
      withUI : true,
      needAccountType : 1, // primary account
      successCallback : function(a)
      {
        // Need to track if mail was actually checked so we can turn off
        // the icon if it wasn't
        var checkedMail = false;
        for each (let acc in gMailAccs)
        {
          if (acc.isLoggedIn)
          {
            checkedMail = true;
            acc.mailCheck(0, false, stopMailCheckIcon,
                          function(e) { stopMailCheckIcon(); errorCritical(e); });
          }
        }
        if (!checkedMail)
          stopMailCheckIcon();
      },
      errorCallback: function(e)
      {
        stopMailCheckIcon();
        errorCritical(e);
      },
      abortCallback: stopMailCheckIcon
    });
  } catch (e) { errorCritical(e); }
}

/**
 * Dropdown menu item "Configure..." was clicked
 * Effect:
 * - Show dialog to configure an account
 */
function onCommandConfigureMenuitem(event)
{
  try {
    event.stopPropagation(); // prevent it from bubbling to main <button>
    unitedinternet.openPrefWindow("email");
  } catch (e) { errorCritical(e); }
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
    notifyWindowObservers("do-login", {
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
  if (brand.login.trackXXLTooltipClickedURL)
  {
    new FetchHTTP({
        url : brand.login.trackXXLTooltipClickedURL,
        method : "GET",
    }, function() {}, errorNonCritical).start();
  }

  onCommandMailButton();
}
