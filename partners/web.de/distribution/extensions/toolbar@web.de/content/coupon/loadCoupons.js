/**
 * @see alert.js for the purpose.
 *
 * This
 * 1. downloads a long list of coupons for certain shops,
 *     as XML from our server,
 * 2. stores it in sqlite for fast access on every browser page load
 * 3. Allows access to the coupons via a API returning |Coupon| objects.
 */


const EXPORTED_SYMBOLS = [ "downloadCouponsIfNecessary", "haveCouponsForURL", "getDomain" ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/JXON.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");
Components.utils.import("resource://unitedtb/util/Auth.js"); // for encodeEmailAddress()
//var sb = new united.StringBundle("chrome://unitedtb/locale/coupon/coupon.properties");

const eTLDService = Components.classes["@mozilla.org/network/effective-tld-service;1"]
                  .getService(Components.interfaces.nsIEffectiveTLDService);

const kDBFile = "coupon.sqlite";
/**
 * For definition of DB fields, @see corresponding |Coupon| properties.
 * alert   should be displayed via notification during normal browsing.
 * Currently unused and always true.
 */
const kDBSchemaCoupons = "\n\
  id TEXT PRIMARY KEY,\n\
  domain TEXT,\n\
  description TEXT,\n\
  alert BOOLEAN,\n\
  rewards BOOLEAN,\n\
  applyURL TEXT";
// TABLE "hidden" contains those coupons that we've already shown,
// closed or used and don't want to show again.
// This is kind of a user preference.
const kDBSchemaHidden = "couponID TEXT PRIMARY KEY";
const kDBLine1 = "CREATE INDEX domain_idx ON coupons (domain)";
const kDBVersion = 11;
var gDB = null; // for getDatabase() only

/**
 * Fetch from server and store in sqlite database.
 *
 * You must call this once, normally at startup,
 * before you can use haveCouponsForURL() and have it actually work,
 *
 * No-op, if we already downloaded them recently.
 */
function downloadCouponsIfNecessary()
{
  if (!brand.coupon || !brand.coupon.dataXMLURL)
    return;
  if ((sanitize.integer(ourPref.get("coupon.lastUpdate", 0)) >
      new Date() / 1000 - brand.coupon.updateFrequency) &&
      kDBVersion == ourPref.get("coupon.db.version", 0))
  {
    debug("not updating coupon database, because we got a fresh enough one");
    return;
  }
  ourPref.set("coupon.lastUpdate", Math.round(new Date().getTime() / 1000));

  new FetchHTTP({ url : brand.coupon.dataXMLURL },
      xmlToDB, errorInBackend).start();
}

function getDatabase()
{
  if (gDB)
    return gDB;

  var storageService = Cc["@mozilla.org/storage/service;1"]
      .getService(Ci.mozIStorageService);
  var dbFile = getProfileDir();
  dbFile.append(kDBFile);
  var dbFileExisted = dbFile.exists();
  if (kDBVersion != ourPref.get("coupon.db.version", 0) &&
      dbFileExisted)
  {
    dbFile.remove(false);
    dbFileExisted = false;
  }
  gDB = storageService.openDatabase(dbFile);

  if ( !dbFileExisted)
  {
    try {
      // create DB
      gDB.createTable("coupons", kDBSchemaCoupons);
      gDB.createTable("hidden", kDBSchemaHidden);
      gDB.executeSimpleSQL(kDBLine1);
      ourPref.set("coupon.db.version", kDBVersion);
    }
    catch (e)
    {
      // get rid of new broken DB
      gDB.close(); // asyncClose() not necessary, because exec above are sync
      dbFile.remove(false);
      throw e;
    }
  }

  return gDB;
}

/**
 * Parse the XML we get from the server,
 * and insert it into the databse with these values.
 * Security: The XML is untrusted and the values
 * need to be thoroughly checked.
 * <coupon id="abcd"> -- alphanumdash only
 *   <domain>amazon.de</domain>
 *   <description>10 Euro Rabatt auf Uhren diverser Marken</description>
 *   <saving type="euro" amount="10.00"/> or <saving type="%" amount="10.00"/>
 *       -- optional, not reliable
 *   <minimumOrder euro="50.00"/>
 *       -- optional, not reliable
 *   <onlyNewCustomer/> -- if set, only valid when user
 *       -- never purchased there before
 *       -- optional, not reliable
 *   <multipleUse/> -- if not set, coupon can be used only once
 *       -- per customer, otherwise several time
 *   <onlyProducts/> -- if set, coupon is valid only for some products,
 *       -- otherwise for all products in the shop at <domain>
 *       -- This should later be extended with a URL filter at <domain>
 *   <expires date="2012-12-12"/>
 *   <applyURL>http://coupon.web.de/use?id=abcd&amp;new=1</applyURL>
 * </coupon>
 */
function xmlToDB(xml)
{
  assert(xml && xml.firstChild.nodeName == "coupons");

  var coupons = JXON.build(xml).coupons;

  // Do NOT drop table "hidden"
  var clear = getDatabase().createStatement("DELETE FROM coupons");
  clear.executeAsync(new sqlCallback(function()
  {
    var stmts = [];
    for each (let coupon in coupons.$coupon)
    {
      var statement = getDatabase().createStatement(
          "INSERT INTO coupons " + 
          "(id, domain, description, alert, applyURL, rewards) " +
          "VALUES (:id, :domain, :description, 1, :applyURL, :rewards)");
      statement.params.id = sanitize.alphanumdash(coupon["@id"]);
      statement.params.rewards = coupon["@type"] == "webcent" ? true : false;
      statement.params.domain = sanitize.nonemptystring(coupon.domain);
      statement.params.description = sanitize.label(coupon.description);
      statement.params.applyURL = sanitize.url(coupon.applyURL);
      stmts.push(statement);
    }
    getDatabase().executeAsync(stmts, stmts.length, new sqlCallback(function() {}, errorInBackend));
  }, errorInBackend));
}


/**
 * Get just the domain from a URI using yhr TLD service
 * This function is in this file so it can be used from alert and loadCoupons
 * @param uri
 */

function getDomain(uri) {
  return eTLDService.getBaseDomain(uri);
}


/**
 * Looks up in database whether we have a coupon for this shop.
 * If so, return the corresponding coupons.
 *
 * Speed: This function must be very fast, because it's invoked
 * for *every* page the user visits in the browser.
 *
 * @param shopURI {nsIURI}
 * @param resultCallback(coupons {Array of Coupon})
 *     If |coupons| = null, no coupons are available for this URL.
 *     (Most of the time, there are none)
 * @param errorCallback(e)   something went really wrong
 */
function haveCouponsForURL(shopURI, resultCallback, errorCallback)
{
  assert(shopURI instanceof Ci.nsIURI);
  if (shopURI.scheme != "http" && shopURI.scheme != "https")
  {
    resultCallback(null);
    return;
  }
  var domain = getDomain(shopURI);
  if ( !haveCouponsForURL._st) // cache it
    haveCouponsForURL._st = getDatabase().createStatement(
        "SELECT * FROM coupons where domain = :domain");
  var st = haveCouponsForURL._st;
  st.reset();
  st.params.domain = domain;
  st.executeAsync(new sqlCallback(function(rows)
  {
    if ( !rows.length)
      resultCallback(null);
    var result = [];
    for each (let row in rows)
    {
      let c = new Coupon();
      c.readFromDBRow(row);
      result.push(c);
    }
    resultCallback(result);
  }, errorCallback));
}


/**
 * Representing a possibility to get a
 * certain reduction in a certain web shop.
 *
 * Does not represent the actual coupon code.
 * The user gets this via the applyURL() webpage and
 * following the steps there.
 */
function Coupon()
{
}
Coupon.prototype =
{
  _id : null, // {String} as given by server
  _shopDomain : null,
  _description : null,
  _applyURL : null,
  _rewards : null,

  /**
   * The coupon can be used in the web shop
   * which has its web presence on this domain.
   * Normally a second-level domain.
   * E.g. "amazon.com"
   * @return {String} domain
   */
  get shopDomain()
  {
    return this._shopDomain;
  },

  /**
   * Describe the value of the coupon for the user.
   * E.g. "10% off" or "Save 10 Eur" or
   * "Register for VISA and save 25 Eur on your next purchase"
   * @result {String} user-readable, translated label
   *     in the user's language
   */
  get description()
  {
    return this._description;
  },

  /**
   * The coupon can has rewards associated with it (webcent)
   * @return {Bool} rewards
   */
  get rewards()
  {
    return this._rewards;
  },

  /**
   * If the user wants to use the coupon, he needs to
   * go to this webpage. It's a page on our servers,
   * shows details about the coupon, and allows them
   * to use it.
   *
   * @needs login, i.e. user must be logged into |account|
   *
   * @param shopURI {nsIURI} The web shop URL
   *     that the user looks at currently.
   *     May be a product page.
   *     Will be loaded after the user got the coupon.
   * @param account {UnitedInternetAccount}
   *     The user must be logged into the toolbar and
   *     a UnitedInternet account passed to the coupon
   *     website. The website uses this to ensure that the
   *     user has agreed to the terms of service.
   * @return {String-URL}
   */
  applyURL : function(shopURI, account)
  {
    assert(account.isLoggedIn, "User must be logged in");
    assert(this.applicableForShopURL(shopURI), "You cannot use this coupon in this shop");
    debug(encodeEmailAddress(account.emailAddress));
    return this._applyURL +
        (this._applyURL.indexOf("?") >= 0 ? "&" : "?") +
        "userEmailSHA1=" + encodeEmailAddress(account.emailAddress) +
        "&shopPageURL=" + encodeURIComponent(shopURI.spec);
  },

  /**
   * This coupon can be used in the shop at the given URL.
   * @param shopURI {nsIURI} a shop webpage
   * @returns {Boolean}
   */
  applicableForShopURL : function(shopURI)
  {
    assert(shopURI instanceof Ci.nsIURI);
    if (shopURI.scheme != "http" && shopURI.scheme != "https")
      return false;
    var host = getDomain(shopURI);
    return host == this._shopDomain;
  },

  /**
   * Initialize this Coupon object from the sqlite database.
   */
  readFromDB : function(id, successCallback, errorCallback)
  {
    var st = getDatabase().createStatement(
        "SELECT * from coupons where id = :id");
    st.params.id = id;
    var self = this;
    st.executeAsync(new sqlCallback(function(rows)
    {
      assert(rows.length != 0, "Found no coupon with ID " + id);
      assert(rows.length == 1, "Found several coupons for the ID " + id);
      self.readFromDBRow(row[0]);
      successCallback();
    }, errorCallback));
  },

  /**
   * Like readFromDB(), but accepts a result row as param,
   * and is therefore sync.
   * @param row {Ci.mozIStorageRow}
   */
  readFromDBRow : function(row)
  {
    this._id = sanitize.alphanumdash(row.getResultByName("id"));
    this._description = sanitize.label(row.getResultByName("description"));
    this._applyURL = sanitize.url(row.getResultByName("applyURL"));
    this._rewards = row.getResultByName("rewards")
    var domain = row.getResultByName("domain")
    sanitize.url("http://" + domain);
    this._shopDomain = sanitize.nonemptystring(domain);
  },
}

/**
 * Make a user ID based on the email address.
 * Take email address as lowercase, and run it through SHA1
 * @return {String} a user ID, consisting of 40 characters 0-9a-f
 */
function encodeEmailAddress(emailAddress)
{
  return sha1(emailAddress.toLowerCase());
}
