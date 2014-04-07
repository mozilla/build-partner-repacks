/**
 * This listens to the current page URL that the user visits in the browser,
 * and looks for certain web shops (where we have a coupon) to be visited,
 * determined by the domain of the shop.
 * If relevant page is shown, we display a notification box above the page,
 * to notify the user about an available coupon for this specific shop.
 * When the user clicks on such a coupon alert, we open the
 * webpage for that coupon, in a new tab.
 *
 * Each coupon is shown only once, per spec. If the user ignored it,
 * we will not show the same coupon again, but
 * other coupons for the same shop will still be shown.
 *
 * The notification goes away after 5 seconds.
 *
 * There are various other competing extensions [1] which do pretty much
 * the same thing, but in a way that removeAllNotifications(true), including
 * ours. I assume that's intentional and hostile. We will not retaliate
 * and not engage in similar tactics, but we need to make sure ours is shown
 * and not interfered with.
 * [1] gutscheinrausch.de version 2.5, payback 1.1.6.96
 *
 * TODO
 * * animate slide in and out
 * * bester gutschein kalkulieren
 * * coupon-seite
 * *
 * * The generic term "rewards" is used to refer to things like WebCent
 */

Components.utils.import("resource://unitedtb/coupon/loadCoupons.js", this);
Components.utils.import("resource://unitedtb/util/globalobject.js", this);
Components.utils.import("resource://unitedtb/email/badge.js", this);
var sb = new StringBundle("coupon/coupon");

var gAlertTimer = null;
var gCouponButton = null;

var gCouponImage = new Image();
gCouponImage.src = "chrome://unitedtb/skin/coupon/coupon-small.png";

// Whether or not coupons are enabled at all
var gCouponEnabled = false;

// If the button or alert is displayed, contains the current list of coupons
// for the domain.
var gCoupons = null;

/* If the coupon alert has been hidden for a given domain, that domain
 * is added to this array with a true. When the button is clicked to redisplay
 * the alert, the domain is removed from the array */
var gMinimizedShopDomains;

function initCoupons() {
  downloadCouponsIfNecessary();
  if (!gCouponButton)
  {
    gCouponButton = E("united-coupon-button");
    gBrowser.addEventListener("DOMTitleChanged", onPageShow, true);
    gBrowser.tabContainer.addEventListener("TabSelect", onTabChange, true);
    gMinimizedShopDomains = getGlobalObject("coupon", "minimizedShopDomains");
    if (!gMinimizedShopDomains) {
      gMinimizedShopDomains = [];
      setGlobalObject("coupon", "minimizedShopDomains", gMinimizedShopDomains);
    }
  }
}

function onLoad()
{
  try {
    // Pref to disable module
    ourPref.observeAuto(window, "coupon.enabled", function(newValue)
    {
      try {
        if (newValue)
        {
          gCouponEnabled = true;
          initCoupons();
          checkToAlert();
        } else {
          gCouponEnabled = false;
          closeAllCouponDisplay();
        }
      } catch (e) { errorNonCritical(e); }
    });
    if (ourPref.get("coupon.enabled"))
    {
      gCouponEnabled = true;
      initCoupons();
    }
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);

/**
 * Browser page show hookup
 * Called every time a page is shown (via cache or otherwise), so be efficient!
 */
function onPageShow(event)
{
  try {
    var doc = event.target; // document that was loaded
    var win = doc.defaultView; // the |window| for the doc
    if ( !doc instanceof HTMLDocument)
      return;
    if (win != win.top) // only top window
      return;
    checkToAlert();
  } catch (e) { errorNonCritical(e); }
}

function onTabChange(event)
{
  try {
    checkToAlert();
  } catch (e) { errorNonCritical(e); }
}

/**
 * Checks whether the currently displayed browser tab
 * should get an alert, and
 * displays and hides it as necessary.
 * It takes a callback that is called only when there are
 * coupons to display. This is used for the close button
 *
 * Our alert is unfortunately not tied to a tab, so
 * we check only the URL of the displayed tab,
 * and we need to listen to tab changes in addition
 * to URL changes.
 */
function checkToAlert(resultCallback)
{
  if (!gCouponEnabled) {
    return;
  }
  var browser = gBrowser.selectedBrowser;
  var uri = browser.currentURI;

  haveCouponsForURL(uri, function(coupons)
  {
    if ( !coupons || !coupons.length) {
      gCoupons = null;
      closeAllCouponDisplay();
      return;
    }
    gCoupons = coupons;
    if (shouldShowAlertForURL()) {
      closeButton();
      showAlert(coupons);
    } else {
      showButton(coupons);
      closeAlert();
    }
    if (resultCallback)
      resultCallback();
  },
  function(e)
  {
    gCoupons = null;
    closeAllCouponDisplay();
    errorNonCritical(e);
  });
}

function showButton(coupons)
{
  var rewards = false;
  var regular = false;
  for each (let coupon in coupons) {
    if (coupon.rewards) {
      rewards = true;
    } else {
      regular = true;
    }
  }
  var couponCount = 0;
  if (rewards && !regular) {
    gCouponButton.setAttribute("rewards", "true");
    gCouponButton.setAttribute("label", gCouponButton.getAttribute("label-rewards"));
  } else {
    gCouponButton.removeAttribute("rewards");
    gCouponButton.setAttribute("label", gCouponButton.getAttribute("label-coupons"));
    if (coupons.length > 0) {
      couponCount = coupons.length;
    }
  }
  drawCount(couponCount, gCouponButton, gCouponImage);
  gCouponButton.hidden = false;
}

/**
 * User is on a shop where he can use |coupons|,
 * so show the coupon as notification above the shop page.
 * @param coupons {Array of Coupon}
 */
function showAlert(coupons)
{
  assert(coupons.length);

  var hasRegularCoupon = false;
  var hasRewardsCoupon = false;

  var rewardsAlert = E("united-coupon-alert-rewards");
  var regularAlert = E("united-coupon-alert");

  // We can't rely on coupons.length to get the number of coupons since
  // there are rewards mixed in. Loop through once to get the number of coupons
  // It's a little hacky, but the alternative is rewriting this entire function
  var numCoupons = 0;
  for each (let coupon in coupons)
    if (!coupon.rewards)
      numCoupons++;

  for each (let coupon in coupons) {
    if (coupon.rewards) { // WEB.Cent
      if ( !ourPref.get("coupon.rewards.show") || hasRewardsCoupon) {
        continue;
      }
      var textGeneratedE = E("united-coupon-alert-text-generated-rewards");
      var buttonE = E("united-coupon-alert-button-rewards");
      buttonE.coupon = coupon;
      textGeneratedE.setAttribute("value", sb.get("alert.coupons.rewards")
          .replace("%DOMAIN%", coupon.shopDomain));
      hasRewardsCoupon = true;
    } else { // regular coupon
      if ( !ourPref.get("coupon.coupons.show") || hasRegularCoupon) {
        continue;
      }
      var textGeneratedE = E("united-coupon-alert-text-generated");
      var buttonE = E("united-coupon-alert-button");
      buttonE.coupon = coupon;
      //textDescriptionE.textContent = coupon.description;
      textGeneratedE.setAttribute("value", pluralform(numCoupons,
            sb.get("alert.coupons.pluralform"))
            .replace("%DOMAIN%", coupon.shopDomain));
      hasRegularCoupon = true;
    }
    if (hasRegularCoupon && hasRewardsCoupon) {
      break;
    }
  }

  regularAlert.hidden = !hasRegularCoupon;
  rewardsAlert.hidden = !hasRewardsCoupon;

  var alertContainer = E("united-coupon-notificationbox");
  if (hasRegularCoupon && hasRewardsCoupon)
  {
    alertContainer.setAttribute("both", "true");
  } else {
    alertContainer.removeAttribute("both");
  }

  var closeAfterSec = ourPref.get("coupon.alert.closeAfterSec", 0);
  if (closeAfterSec) // 0 = do not close, on the same page
  {
    gAlertTimer = setTimeout(closeAlert, closeAfterSec * 1000);
  }
}

function applyButtonClicked(target)
{
  try {
    hideAlertForURL();
    useCoupon(target.coupon);
  } catch (e) { errorCritical(e); }
}

function closeButtonClicked() {
  try {
    hideAlertForURL();
    closeAlert();
    checkToAlert(function() {
      /* We only show the tooltip box three times */
      var tooltipBoxShown = ourPref.get("coupon.tooltipbox.shown", 0);
      if (tooltipBoxShown >= 1)
        return;

      var hasRegularCoupon = false;
      var hasRewardsCoupon = false;

      // Loop through the coupons so we can find out if we are rewards/discounts
      for each (let coupon in gCoupons)
      {
        if (coupon.rewards)
          hasRewardsCoupon = true;
        else
          hasRegularCoupon = true;
      }

      var reminderType = "coupon";
      if (hasRewardsCoupon && hasRegularCoupon)
        reminderType = "both";
      else if (hasRewardsCoupon)
        reminderType = "rewards";

      E("united-coupon-tooltipbox-description-1").textContent =
        sb.get("united." + reminderType + ".button.tooltipbox1");
      E("united-coupon-tooltipbox-description-2").textContent =
        sb.get("united." + reminderType + ".button.tooltipbox2");

      ourPref.set("coupon.tooltipbox.shown", tooltipBoxShown + 1);
      var panel = E("united-coupon-button-tooltipbox");
      panel.setAttribute("type", reminderType);
      var buttonRect = gCouponButton.getBoundingClientRect();
      var panelRect = panel.getBoundingClientRect();
      /* On first open, the panel has a width of 0. So we open it offscreen, */
      /* measure it, and then hide and reopen */
      if (panelRect.width == 0) {
        panel.openPopup(gCouponButton, 'after_start', -1000, -1000, false, false);
        panelRect = panel.getBoundingClientRect();
        panel.hidePopup();
      }
      /* The math here centers the popup on the center of the button */
      panel.openPopup(gCouponButton, 'after_start', buttonRect.width / 2 - panelRect.width / 2, 0, false, false);
    });
  } catch (e) { errorCritical(e); }
}

function closeAllCouponDisplay()
{
  closeAlert();
  closeButton();
}

function closeButton()
{
  gCouponButton.hidden = true;
}

function closeAlert()
{
  if (gAlertTimer)
    clearTimeout(gAlertTimer);
  gAlertTimer = null;

  E("united-coupon-alert-rewards").hidden = true;
  E("united-coupon-alert").hidden = true;
  E("united-coupon-notificationbox").removeAttribute("both");
}

/**
 * User clicked on the alert (button)
 * @param coupon {Coupon}
 */
function useCoupon(coupon)
{
  assert(coupon && coupon.shopDomain);
  debug("use coupon for " + coupon.shopDomain + ": " + coupon.description);
  var shopURI = gBrowser.currentURI; // nsIURI of page in the current tab
  assert(shopURI instanceof Ci.nsIURI);
  notifyWindowObservers("do-login", {
    withUI : true,
    needAccountType : 1, // main account
    successCallback : function(account)
    {
      closeAllCouponDisplay();
      loadPage(coupon.applyURL(shopURI, account));
    },
    // errorCallback default: show errors
    // abortCallback default: do nothing
  });
}

function onButton()
{
  try {
    restoreAlertForURL();
    closeButton();
    checkToAlert();
  } catch (e) { errorCritical(e); }
}


/**
 * Mark the domain of the given uri as minimized
 * @param shopURI
 */
function hideAlertForURL() {
  gMinimizedShopDomains[gCoupons[0].shopDomain] = true;
}

/**
 * Mark the domain of the given uri as NOT minimized
 * @param shopURI
 */
function restoreAlertForURL() {
  delete gMinimizedShopDomains[gCoupons[0].shopDomain];
}

/**
 * Convert uri to a domain and then check to see if the reminder is
 * minimized
 * @param shopURI
 */
function shouldShowAlertForURL() {
  return gMinimizedShopDomains[gCoupons[0].shopDomain] != true;
}
