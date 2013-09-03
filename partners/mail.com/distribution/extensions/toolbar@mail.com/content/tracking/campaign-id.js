/**
 * We allow the campaignid to be set via a cookie.
 * We look through all the domains specified via identifyMyselfToSites
 * and if there is a cookie called "toolbar-campaign-id", set the
 * preference and then delete the cookie.
 * If there's no cookie, we use the "campaignid.install" pref.
 */

/**
 * Messages reacted to by this module:
 * "first-run"
 * "upgrade"
 * "reinstall"
 *    Effect: set pref "tracking.campaignid"
 */

const EXPORTED_SYMBOLS = [ "setCampaignID" ];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/util/common-jsm.js");

/**
 * Allows a website to set a cookie for the campaign ID
 * The toolbar then uses this campaign ID when it is installed
 * The cookie must have an expires date set in the future (not a session
 * cookie), otherwise it will be removed when the browser closes.
 *
 * @returns {Integer} campaignID or (if not found) 0
 */
function checkForCampaignIDCookie()
{
  var campaignID = 0;

  // nsICookieManager, same below
  var e = Services.cookies.enumerator;
  while (e.hasMoreElements())
  {
    var cookie = e.getNext();
    if (cookie && cookie instanceof Ci.nsICookie)
    {
      if (cookie.name != "toolbar-campaign-ID")
        continue;
      for (var i = 0; i < brand.tracking.identifyMyselfToSites.length; i++)
      {
        if (cookie.host.match(brand.tracking.identifyMyselfToSites[i]))
        {
          campaignID = parseInt(cookie.value);
          break;
        }
      }
      // We remove the cookie no matter what
      Services.cookies.remove(cookie.host, cookie.name, cookie.path, false);
      break;
    }
  }
  return campaignID;
}

/**
 * Runs on every install: new installs, version upgrades and same version over-installs.
 * Also called by AIB, because the very first AIB runs before we get the "install" message.
 */
function setCampaignID()
{
  var campaignID = checkForCampaignIDCookie();
  // kid of latest install
  if (campaignID) {
    ourPref.set("tracking.campaignid.latest", campaignID);

    checkEnableCoupon(campaignID);
  }

  // Make sure we have some kid
  if (!ourPref.isSet("tracking.campaignid.latest")) {
    ourPref.set("tracking.campaignid.latest", ourPref.get("tracking.campaignid.install"));
  }

  // kid of very first install - i.e. which kid won this user originally
  if (!ourPref.isSet("tracking.campaignid.first")) {
    if (!campaignID) {
      campaignID = ourPref.get("tracking.campaignid.install"); // the kid in the XPI build
    }
    ourPref.set("tracking.campaignid.first", campaignID);
  }

  // choose the first kid as the one to submit
  ourPref.set("tracking.campaignid", ourPref.get("tracking.campaignid.first"));
}

/**
 * Enable coupon functionality based on the kid set during latest install.
 * TODO move to coupon/ . Mind timing.
 *
 * Run this only when the cookie was set.
 * We don't want to re-enable when the user disabled it in pref and
 * make a normal update.
 *
 * @param campaignID {Integer}
 */
function checkEnableCoupon(campaignID)
{
  if ( !brand.coupon || !brand.coupon.enableViaKidStartValues)
    return;
  var campaignIDStr = campaignID + "";
  for each (let startValue in brand.coupon.enableViaKidStartValues) {
    if (campaignIDStr.substr(0, startValue.length) == startValue) {
      ourPref.set("coupon.enabled", true);
    }
  }
}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "upgrade" || msg == "first-run" || msg == "reinstall")
      setCampaignID();
  }
}
registerGlobalObserver(globalObserver);
