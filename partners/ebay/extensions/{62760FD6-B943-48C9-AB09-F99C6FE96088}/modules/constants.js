/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Constants"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

var Constants = {
  // Lookup table providing data for site Ids
  _siteData : {
    "Australia":      {num:  15, iso: "AU", cur: "AUD", symb: "$*",   dom: "ebay.com.au",  rid:  "705-51927-19398-0"},
    "Austria":        {num:  16, iso: "AT", cur: "EUR", symb: "€*",   dom: "ebay.at",      rid: "5221-51945-19398-0"},
    "Belgium_Dutch":  {num: 123, iso: "BE", cur: "EUR", symb: "€*",   dom: "benl.ebay.be", rid: "1553-51946-19398-0"},
    "Belgium_French": {num:  23, iso: "BE", cur: "EUR", symb: "€*",   dom: "befr.ebay.be", rid: "1553-51946-19398-0"},
    "Canada":         {num:   2, iso: "CA", cur: "CAD", symb: "$*",   dom: "ebay.ca",      rid:  "706-51947-19398-0"},
    "CanadaFrench":   {num: 210, iso: "CA", cur: "CAD", symb: "$*",   dom: "cafr.ebay.ca", rid:  "706-51947-19398-0"},
    "China":          {num: 223, iso: "CN", cur: "TWD", symb: "$*",   dom: "ebay.com.hk",  rid: "4080-71112-19398-2"},
    "France":         {num:  71, iso: "FR", cur: "EUR", symb: "€*",   dom: "ebay.fr",      rid:  "709-47295-17703-1"},
    "Germany":        {num:  77, iso: "DE", cur: "EUR", symb: "€*",   dom: "ebay.de",      rid:  "707-37276-17702-1"},
    "HongKong":       {num: 201, iso: "HK", cur: "HKD", symb: "$*",   dom: "ebay.com.hk",  rid: "3422-51948-19398-0"},
    "India":          {num: 203, iso: "IN", cur: "INR", symb: "Rs *", dom: "ebay.in",      rid: "4686-51949-19398-0"},
    "Ireland":        {num: 205, iso: "IE", cur: "EUR", symb: "€*",   dom: "ebay.ie",      rid: "5282-51950-19398-0"},
    "Italy":          {num: 101, iso: "IT", cur: "EUR", symb: "€*",   dom: "ebay.it",      rid:  "724-51951-19398-0"},
    "Malaysia":       {num: 207, iso: "MY", cur: "MYR", symb: "RM *", dom: "ebay.com.my",  rid: "4825-71113-19398-0"},
    "Netherlands":    {num: 146, iso: "NL", cur: "EUR", symb: "€*",   dom: "ebay.nl",      rid: "1346-51952-19398-0"},
    "Philippines":    {num: 211, iso: "PH", cur: "PHP", symb: "₱*",   dom: "ebay.ph",      rid: "4824-71114-19398-0"},
    "Poland":         {num: 212, iso: "PL", cur: "PLN", symb: "* zł", dom: "ebay.pl",      rid: "4908-51953-19398-0"},
    "Singapore":      {num: 216, iso: "SG", cur: "SNG", symb: "S$*",  dom: "ebay.com.sg",  rid: "3423-51954-19398-0"},
    "Spain":          {num: 186, iso: "ES", cur: "EUR", symb: "€*",   dom: "ebay.es",      rid: "1185-51955-19398-0"},
    "Switzerland":    {num: 193, iso: "CH", cur: "CHF", symb: "* Fr", dom: "ebay.ch",      rid: "5222-51956-19398-0"},
    "UK":             {num:   3, iso: "GB", cur: "GBP", symb: "£*",   dom: "ebay.co.uk",   rid:  "710-47297-17704-0"},
    "US":             {num:   0, iso: "US", cur: "USD", symb: "$*",   dom: "ebay.com",     rid:  "711-47294-18009-0"}
  },

  /* array to map locales and site data */
  _localeSiteDataSelector : {
    "EN-AU" : "Australia",
    "DE-AT" : "Austria",
    "NL-BE" : "Belgium_Dutch",
    "FR-BE" : "Belgium_French",
    "EN-CA" : "Canada",
    "FR-CA" : "CanadaFrench",
    "ZH-CN" : "China",
    "FR"    : "France",
    "DE"    : "Germany",
    "HI-IN" : "India",
    "EN-IE" : "Ireland",
    "IT"    : "Italy",
    "NL"    : "Netherlands",
    "PL"    : "Poland",
    "EN-SG" : "Singapore",
    "ES-ES" : "Spain",
    "DE-CH" : "Switzerland",
    "EN-GB" : "UK",
    "EN-US" : "US"
  },

  // Tags to be used to load installation tracking image
  _installTrackTags : {
    "en-us" : "711-47294-18009-1",
    "en-gb" : "710-47297-17704-1",
    "fr"    : "709-47295-17703-2",
    "de"    : "707-37276-17702-0",
    "ga-ie" : "5282-51950-19398-3",
    "zh-tw" : "3422-51948-19398-3",
    "zh-cn" : "5222-51956-19398-3",
    "es-es" : "1185-51955-19398-2",
    "nl"    : "1346-51952-20245-1",
    "hi-in" : "4686-51949-19398-2",
    "pl"    : "4908-51953-19398-2"
  },

  // URL templates
  _urls : {
    "roverTrack":      "http://rover.ebay.com/rover/1/#{ROVID}/4?mfe=#{AREA}&mpre=#{URL}",
    "autosuggest":     "http://web.ebay.co.uk/autosuggest/output.php?q=#{QUERY}",
    "authAuth" :       "https://signin.#{DOMAIN}/ws/eBayISAPI.dll?SignIn&runame=#{RUNAME}&sid=#{SID}&ruparams=#{RUPARAMS}",
    "authAuthSandbox": "https://signin.sandbox.#{DOMAIN}/ws/eBayISAPI.dll?SignIn&runame=#{RUNAME}&sid=#{SID}&ruparams=#{RUPARAMS}",
    "homePage":        "http://www.#{DOMAIN}",
    "buy":             "http://hub.#{DOMAIN}/buy",
    "sell":            "http://sell.#{DOMAIN}/sell",
    "myEbay":          "http://my.#{DOMAIN}/ws/eBayISAPI.dll?MyeBay",
    "myWorld":         "http://myworld.#{DOMAIN}/#{USERID}",
    "community":       "http://hub.#{DOMAIN}/community",
    "paypal":          "http://www.paypal.com",
    "appFeedback":     "http://forums.ebay.com/db1/topic/Ebay-Toolbar/Ebay-Sidebar-For/520122397",
    "myMessages":      "http://my.#{DOMAIN}/ws/eBayISAPI.dll?MyeBay&CurrentPage=MyeBayMyMessages",
    "search":          "http://search.#{DOMAIN}/search/search.dll?query=#{QUERY}",
    "listing":         "http://cgi.#{DOMAIN}/ws/eBayISAPI.dll?ViewItem&item=#{ITEMID}",
    "installTrack":    "http://rover.#{DOMAIN}/ar/1/#{TRACKTAG}/4?adtype=0&mpt=#{UNIQUEID}",
    "bid":             "http://offer.#{DOMAIN}/ws/eBayISAPI.dll?MakeBid&item=#{ITEMID}",
    "bin":             "http://offer.#{DOMAIN}/ws/eBayISAPI.dll?BinConfirm&item=#{ITEMID}",
    "pay":             "http://payments.#{DOMAIN}/ws/eBayISAPI.dll?UnifiedCheckoutShippingDispatcher&item=#{ITEMID}",
    "paid":            "http://payments.#{DOMAIN}/ws/eBayISAPI.dll?OrderAction&action=2&itemid=#{ITEMID}&pagetype=1883&ru=#{RU}",
    "sent":            "http://payments.#{DOMAIN}/ws/eBayISAPI.dll?OrderAction&action=4&itemid=#{ITEMID}&pagetype=1883&ru=#{RU}",
    "feedback":        "http://feedback.#{DOMAIN}/ws/eBayISAPI.dll?LeaveFeedback2&item=#{ITEMID}&useridto=#{USERIDTO}&useridfrom=#{USERIDFROM}",
    "relist":          "http://cgi.#{DOMAIN}/ws/eBayISAPI.dll?RelistItem&Item=#{ITEMID}",
    "find":            "http://search.#{DOMAIN}/search/search.dll?GetResult&sim=y&itemid=#{ITEMID}&query=#{QUERY}",
    "similar":         "http://cgi.#{DOMAIN}/ws/eBayISAPI.dll?SellYourItem&item=#{ITEMID}",
    "userFeedback":    "http://feedback.#{DOMAIN}/ws/eBayISAPI.dll?ViewFeedback2&userid=#{USERID}",
    "revise":          "http://cgi.#{DOMAIN}/ws/eBayISAPI.dll?UserItemVerification&item=#{ITEMID}",
    "promote":         "http://cgi.#{DOMAIN}/ws/eBayISAPI.dll?PromoteItem&item=#{ITEMID}",
    "viewOther":       "http://cgi.#{DOMAIN}/ws/eBayISAPI.dll?ViewSellersOtherItems&userid=#{USERID}",
    "askQuestion":     "http://contact.#{DOMAIN}/ws/eBayISAPI.dll?ShowCoreAskSellerQuestion&redirect=0&SSPageName=PageAskSellerQuestion_VI&requested=#{REQUESTED}&iid=#{IID}",
    "contactBuyer":    "http://contact.#{DOMAIN}/ws/eBayISAPI.dll?ReturnUserEmail&redirect=0&SSPageName=PageContactBuyer_VI&iid=#{IID}&requested=#{REQUESTED}",
    "orderDetails":    "http://payments.#{DOMAIN}/ws/eBayISAPI.dll?ViewPaymentStatus&ssPageName=STRK:MESOX:VPS&itemid=#{ITEMID}",
    "savedSellers":    "http://my.#{DOMAIN}/ws/eBayISAPI.dll?MyEbayBeta&Column=Sellers&SavedSellers.Filter=&CurrentPage=MyeBaySavedSellers",
    "merchant":        "http://shop.#{DOMAIN}/merchant/#{USERID}",
    "TERMINATOR":      ""
  },

  // Maps internal area names to rover area names expected by eBay
  // Names that map to "NOTWRAPPED" will not be rover-wrapped
  _roverNames : {
    "autosuggest":     "NOTWRAPPED",
    "connectButton":   "sidebarInfo",
    "itemButton":      "sidebarpri",
    "itemClick":       "sidebar",
    "itemContext":     "sidebarContext",
    "postLogin":       "NOTWRAPPED",
    "searchBox":       "search",
    "sidebarButton":   "sidebarInfo",
    "statusbarButton": "menu",
    "toolbarButton":   "browserbutton",
    "installTracker":  "NOTWRAPPED",
    "desktopShortcut": "desktop",
    "emptyListText":   "sidebarnull",
    "alertContents":   "alert",
    "alertButton":     "alertpri",
    "sidebarNotification": "message",
    "unwrappedLink":   "NOTWRAPPED",
    "TERMINATOR":      ""
  },

  _shortcutParameterRead : false,

  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/preferences.js");
      Cu.import("resource://ebaycompanion/helpers/stringBundle.js");
      Cu.import("resource://ebaycompanion/datasource.js");

      this._prefBranch = new Preferences("extensions.ebaycomp.");
      this._stringBundle =
        new StringBundle("chrome://ebaycompanion/locale/strings.properties");
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * shortcutParameterRead getter
   * @return whether the desktop shortcut parameter has been read and used or
   * not
   */
  get shortcutParameterRead() {
    return this._shortcutParameterRead;
  },

  /**
   * shortcutParameterRead setter
   * @param aValue the value to be set
   */
  set shortcutParameterRead(aValue) {
    this._shortcutParameterRead = aValue;
  },

  /**
   * Getter
   */
  get extensionId() {
    return "{62760FD6-B943-48C9-AB09-F99C6FE96088}";
  },

  /**
   * Getter
   */
  get prefBranch() {
    return this._prefBranch;
  },

  /**
   * Getter
   */
  get stringBundle() {
    return this._stringBundle;
  },

  /**
   * Getter
   */
  get installTrackTags() {
    return this._installTrackTags;
  },

  /**
   * Getter
   */
  get localeSiteDataSelector() {
    return this._localeSiteDataSelector;
  },

  /**
   * Returns a url from our url template array
   * @param sourceAreaName used for rover tracking
   * @param templateName name of template
   * @param arguments for template placeholders
   */
  getUrl : function(sourceAreaName, templateName, args) {
    let templateString = this._urls[templateName];
    if (!templateString) {
      Logger.error("Bad URL Template name: '" + templateName + "'",
                     Logger.DUMP_STACK);
      return null;
    }

    // Get the URL
    let homeSite = Datasource.homeSite();
    if (!homeSite) {
      homeSite = "US";
    }

    let template = new UrlTemplate(templateString);
    let domain = this._siteData[homeSite].dom;
    let activeAccount = Datasource.activeAccount();
    if (activeAccount && activeAccount.get("isSandboxAccount")) {
      domain = "sandbox." + domain;
    }
    template.setArg("DOMAIN", domain);
    if (args) {
      for each (let [arg, value] in Iterator(args)) {
        template.setArg(arg, value);
      }
    }

    // Perform Rover Wrapping if necessary
    let roverAreaName = this._roverNames[sourceAreaName];
    if (!roverAreaName) {
      Logger.error("Bad area name: '" + sourceAreaName + "'",
                   Logger.DUMP_STACK);
      return null;
    }

    let retUrl;
    if (roverAreaName == "NOTWRAPPED") {
      retUrl = template.url();
    } else {
      let encodedUrl = encodeURIComponent(template.url());
      let roverTemplate = new UrlTemplate(this._urls["roverTrack"]);
      let roverId = this._siteData[homeSite].rid;
      roverTemplate.setArg("ROVID", roverId).
                    setArg("AREA", roverAreaName).
                    setArg("URL", encodedUrl);
      retUrl = roverTemplate.url();
    }

    return retUrl;
  },

  /**
   * Returns an array of SiteId strings corresponding to supported eBay sites
   */
  supportedSites : function() {
    let sites = [];
    for each (let [site, data] in Iterator(this._siteData)) {
      sites.push(site);
    }
    return sites;
  },

  /**
   * Provides a numeric SiteId from a site name
   */
  siteIdForSite : function(siteString) {
    let siteData = this._siteData[siteString];
    if (!siteData) {
      // fall back to the US site
      siteData = this._siteData["US"];
    }
    return siteData.num;
  },

  /**
   * Provides a currency ID for the given string SiteId
   */
  currencyIdForSite : function(siteString) {
    let siteData = this._siteData[siteString];
    if (!siteData) {
      // fall back to the US siteId
      siteData = this._siteData["US"];
    }
    return siteData.cur;
  },

  /**
   * Provides an ISO-3166 country code for the given string SiteId
   */
  countryIso3166ForSite : function(siteString) {
    let siteData = this._siteData[siteString];
    if (!siteData) {
      // fall back to the US siteId
      siteData = this._siteData["US"];
    }
    return siteData.iso;
  },

  /**
   * Given a monetary value and its associated currency ID, return a string
   * that will make sense to the user.  For instance, a UK user might see "£10",
   * whereas a US user would see "GBP 10".
   */
  addCurrencySymbol : function(value, currency) {
    let homeSite = Datasource.homeSite();
    if (!homeSite) {
      homeSite = "US";
    }
    let siteData = this._siteData[homeSite];
    let nativeCurrency = this.currencyIdForSite(homeSite);

    let ret;
    if (currency == nativeCurrency) {
      // replace the placeholder with the given value
      ret = siteData.symb.replace("*", value);
    } else {
      ret = currency + " " + value;
    }

    return ret;
  },

  /**
   * Formats the number to add the thousand separators.
   * @param aValue the numerical value to be formatted.
   * @param aDecimals the fixed decimals value.
   * @return the formatted number.
   */
  formatNumber : function(aValue, aDecimals) {
    let decimalSeparator =
      this._stringBundle.getString("ecGlobal.num.format.decimal").
        replace(/"/g, "");
    let thousandSeparator =
      this._stringBundle.getString("ecGlobal.num.format.thousandSep").
        replace(/"/g, "");
    let value = aValue.toFixed(aDecimals);
    let valueString = String(value);
    let valueInteger = parseInt(value);
    let valueIntegerString = String(valueInteger);
    let valueIntegerStringSize = valueIntegerString.length;
    let valueDecimalIndex = valueString.indexOf(".") + 1;
    let valueDecimalString = "";
    let valueLabel = "";

    if (-1 != valueDecimalIndex) {
      valueDecimalString =
        valueString.substring(valueDecimalIndex, valueString.length);
    }
    for (let i = valueIntegerStringSize - 1; i >= 0; i--) {
      valueLabel = valueIntegerString[i] + valueLabel;
      if ((0 == (valueIntegerStringSize - i) % 3) && i > 0) {
        valueLabel = thousandSeparator + valueLabel;
      }
    }
    if (0 < aDecimals) {
      valueLabel += decimalSeparator + valueDecimalString;
    }

    return valueLabel;
  },

  /**
   * Converts a timestamp (in milliseconds) to a date string with the given
   * format.
   * @param aTimestamp a timestamp, in milliseconds.
   * @param aDateFormat a string that determines how the date will be formatted.
   * This is a RegExp replacement string with backreferences.
   * @return the date string in the given format.
   */
  formatDate : function(aTimestamp, aDateFormat) {
    let dateObject = new Date(aTimestamp);
    let month = dateObject.getMonth() + 1;
    let dateString = "";

    dateString =
      aDateFormat.replace("$DD", this.formatTwoDigits(dateObject.getDate()));
    dateString = dateString.replace("$D", dateObject.getDate());

    if (0 <= dateString.indexOf("$ddd")) {
      let dayString =
        this._stringBundle.getString(
          "ecFlyout.day." + (dateObject.getDay() + 1));

      dateString = dateString.replace("$ddd", dayString);
    }

    if (0 <= dateString.indexOf("$MMM")) {
      let monthString =
        this._stringBundle.getString("ecFlyout.month." + month);

      dateString = dateString.replace("$MMM", monthString);
    }

    dateString = dateString.replace("$MM", this.formatTwoDigits(month));
    dateString =
      dateString.replace(
        "$YY", String(dateObject.getFullYear()).substring(2));
    dateString =
      dateString.replace("$hh", this.formatTwoDigits(dateObject.getHours()));
    dateString =
      dateString.replace(
        "$mm", this.formatTwoDigits(dateObject.getMinutes()));
    dateString =
      dateString.replace(
        "$ss", this.formatTwoDigits(dateObject.getSeconds()));

    return dateString;
  },

  /**
   * Represent a non-negative number as a string of 2 digits. This is usually
   * needed to show hours, minutes and seconds on time displays.
   * @param aNumber the number to format to two digits. 0 <= aNumber < 100.
   * @return the formatted number. It's a string of 2 digits.
   */
  formatTwoDigits : function(aNumber) {
    let formattedNumber = "";

    if (aNumber >= 0 && aNumber < 100) {
      if (aNumber < 10) {
        formattedNumber += "0";
      }

      formattedNumber += aNumber;
    }

    return formattedNumber;
  },

  /**
   * Returns the correct Runame that should be used depending on whether we are
   * using the sandbox and which eBay site we are accessing.
   * @returns Runame string
   */
  getRuname : function(useSandbox, siteString) {
    let runame;
    if (!useSandbox) {
      // Production
      switch (siteString) {
        case "US":
          runame = "eBay_EU_MicroPr-eBayEUMi-98ba-4-dllhxv";
          break;
        default:
          runame = "eBay_EU_MicroPr-EBAYEUMICRI236G-hutwe";
          break;
      }
    } else {
      // Sandbox
      switch (siteString) {
        case "US":
          runame = "Glaxstar-GLAXSTARQ7HD16H-rtvtle";
          break;
        default:
          runame = "Glaxstar-GLAXSTARR2F4A7D-hgiiki";
          break;
      }
    }
    return runame;
  },

  /**
   * Obtains an identifier for the operating system this extension is running
   * on.
   * @return any of the OS constants defined in this interface.
   */
  getOperatingSystem : function() {
    // Operating system regular expressions.
    const RE_OS_WINDOWS = /^Win/i;
    const RE_OS_MAC = /^Mac/i;
    const RE_OS_LINUX = /^Linux/i;
    const RE_OS_WINDOWS_VISTA = /Windows NT 6.0/i;

    let operatingSystem = "OTHER";

    if (null == this._os) {
      let appShellService =
        Cc["@mozilla.org/appshell/appShellService;1"].
          getService(Ci.nsIAppShellService);
      let platform = appShellService.hiddenDOMWindow.navigator.platform;

      if (platform.match(RE_OS_MAC)) {
        operatingSystem = "MAC";
      } else if (platform.match(RE_OS_WINDOWS)) {
        let userAgent = appShellService.hiddenDOMWindow.navigator.userAgent;

        if (userAgent.match(RE_OS_WINDOWS_VISTA)) {
          operatingSystem = "VISTA";
        } else {
          operatingSystem = "WINDOWS";
        }
      } else if (platform.match(RE_OS_LINUX)) {
        operatingSystem = "LINUX";
      } else {
        operatingSystem = "OTHER";
      }
      this._os = operatingSystem;
    } else {
      operatingSystem = this._os;
    }

    return operatingSystem;
  },

  /**
   * Builds a string with anchor elements to be used as notification content,
   * based on the string sent as parameter.
   * The source string is in the form "plain text [1 link] plain text...".
   * The number at the start of the link construct is set
   * as the order attribute to be used later to set link callbacks.
   * We can't set link callbacks here because that would require us to use a
   * string containing the callback code and that's hard to debug and looks
   * very bad. Instead, we leave that task to the notification binding.
   * This makes it possible to reorder the text during localisation without
   * changing the order of elements in the "callbacks" array.
   * The link labels are assigned the class "notificationLinkText" for styling.
   * @param aString the source string to be converted into notification contents
   */
  parseMarkupString : function(aString) {
    let content = "";

    try {
      let text = aString;
      let element;

      while (text.length > 0) {
        if (text.charAt(0) == "[") {
          // link
          element = "<a class='notificationLinkText' order='%1'>%2</a>";

          let endIndex = text.indexOf("]");
          let left = text.slice(0, endIndex + 1);
          let linkRe = /\[(\d+) (.*?)\]/g;
          linkRe.lastIndex = 0;
          let results = linkRe.exec(left);
          let index = results[1];

          element = element.replace("%1", results[1]).
                            replace("%2", results[2]);

          text = text.slice(endIndex + 1);
        } else {
          // text
          let endIndex = text.indexOf("[");
          if (endIndex == -1) {
            endIndex = text.length;
          }
          element = text.slice(0, endIndex);
          text = text.slice(endIndex);
        }
        content = content + element;
      }
    } catch(e) {
      Logger.exception(e);
    }

    return content;
  },

  /**
   * Returns the time left for an item as a string
   * @param aTimeLeft the time left to be converted
   */
  timeLeftAsString : function (aTimeLeft) {
    let acc = aTimeLeft / (1000 * 60 * 60 * 24);
    let days = Math.floor(acc);
    let leftover = acc - days;

    acc = leftover * 24;
    let hours = Math.floor(acc);
    leftover = acc - hours;

    acc = leftover * 60;
    let minutes = Math.floor(acc);
    leftover = acc - minutes;

    acc = leftover * 60;
    let seconds = Math.floor(acc);

    let vals = [days, hours, minutes, seconds];
    let units = ["day", "hour", "min", "sec"];

    // Determine which is the most significant non-zero unit
    let skip = 0;
    while (vals[skip] == 0) {
      skip++;
    }

    // Make sure we use at least one unit!
    skip = Math.min(vals.length-1, skip);

    // The following value determines how many units to display at a time
    let numValsToUse = 2;

    let params = [];
    let end = Math.min(skip + numValsToUse, vals.length);
    for (let i = skip; i < end; i++) {
      let propName = "ecItem.timeleft." + units[i] + ".abbv";
      let text = this._stringBundle.getString(propName, [vals[i]]);
      params.push(text);
    }

    let separator = this._stringBundle.getString("ecItem.timeleft.separator").
                      replace(/"/g, "");

    let timeLeftString = params.join(separator);

    return timeLeftString;
  },

  /**
   * Gets the UTF8 of the string, onnly necessary when not using string
   * bundles.
   * @param aString the string to convert.
   * @return the string converted.
   */
  getUTF8 : function(aString) {
    let utf8;
    try {
      utf8 = decodeURIComponent(escape(aString));
    } catch (e) {
      utf8 = decodeURIComponent(encodeURIComponent(aString));
    }
    return utf8;
  },

  /**
   * Given an ISO-8601 formatted time stamp, return a Date object
   * @param time
   * @returns Date object
   */
  dateFromIso8601 : function(time) {
    const dateRe =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;

    let results = dateRe.exec(time);
    if (!results) {
      Logger.error("Incompatible date format: " + time, Logger.DUMP_STACK);
      return Date();
    }

    // NOTE: The Date object deals with months from 0-11, not from 1-12
    let date = new Date();
    date.setUTCFullYear(results[1], results[2]-1, results[3]);
    date.setUTCHours(results[4], results[5], results[6], results[7]);

    return date;
  },

  /**
   * Compares two date objects.
   * @param aTimestampOne the unix timestamp to be compared.
   * @param aTimestampTwo the unix timestamp to be compared.
   * @return the object contains the time difference.
   */
  timeDifference : function(aTimestampOne, aTimestampTwo) {

    var startTime, endTime;
    if (aTimestampOne > aTimestampTwo) {
      startTime = aTimestampTwo;
      endTime = aTimestampOne;
    }
    else {
      startTime = aTimestampOne;
      endTime = aTimestampTwo;
    }

    var timeInSeconds = (endTime - startTime) / 1000;
    var difference = { };
    difference.seconds = parseInt((timeInSeconds) % 60);
    difference.minutes = parseInt((timeInSeconds / 60) % 60);
    difference.hours = parseInt((timeInSeconds / 3600) % 24);
    difference.days = parseInt((timeInSeconds / 86400));

    return difference;
  }

};

/**
 * This object is used to manage URLs
 */
function UrlTemplate(url) {
  this._url = url;
}

UrlTemplate.prototype = {
  /**
   * Getter
   */
  url : function() {
    if (this.requiredArgs().length > 0) {
      Logger.warning("Returning UrlTemplate with unresolved placeholders:")
      Logger.warning(this._url, Logger.DUMP_STACK);
    }
    return this._url;
  },

  /**
   * Returns an array containing the names of the arguments that still need to
   * be passed
   */
  requiredArgs : function() {
    let argsRE = /#{(.*?)}/g;
    let result;
    let args = [];
    while (result = argsRE.exec(this._url)) {
      args.push(result[1]);
    }

    return args;
  },

  /**
   * Resolves a placeholder with an argument
   */
  setArg : function(arg, value) {
    if (!value) {
      Logger.warning("Undefined value passed for placeholder '" + arg + "'.",
                     Logger.DUMP_STACK);
      value = "";
    }
    let argRE = new RegExp("#{" + arg + "}", "gi");
    this._url = this._url.replace(argRE, value);
    return this;
  }
};

Constants._init();
