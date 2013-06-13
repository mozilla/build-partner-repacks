// mail.com
var brand = {
//{
// Countries supported by this version of the toolbar.
// The label should be in the language of the country.
// All the other values (URLs, dropdown labels) may
// vary based on these regions.
regions : {
  defaultlocale : {
    list : [
      { locale: "en-US", label: "$TR region.us" },
    ],
  },
},

// app placeholders available: VERSION and LOCALE

// values that other modules depend on
global : {
  defaultlocale : {
    placeholder_BRAND : "mail.com", // Label to be shown to user
    placeholder_BRANDID : "mailcom", // Internal ID
    placeholder_GOMAIN : "http://go.mail.com/",
    placeholder_GOPREFIX : "http://go.mail.com/tb/en-us/",
    placeholder_GOTB : "http://go.mail.com/tb/en-us/mff_",
  },
},
// basic functions of the toolbar
toolbar : {
  defaultlocale : {
    name: "%BRAND% MailCheck",
    // homepage = e.g. http://www.web.de
    // startpage = shown when firefox starts ("homepage" in Firefox terminology)
    // toolbar.js
    homepageURL : "%GOTB%home", // used for e.g. logo links, goes to portal
    startpageURL : "%GOTB%startpage", // Firefox start goes to search page
    startpageHomepageURL : "%GOTB%startpage_homepage", // Firefox start goes to portal
    // extension.js
    firstrunURL : "%GOTB%runonce",
    upgradeURL : "%GOTB%addon",
    uninstallURL : "%GOTB%uninstall_runonce",
    sslErrorExitURL: "%GOTB%ssl_error",
    browserInstallURL: "%GOTB%browser_install",

    // Appears in toolbar "Settings" button dropdown,
    // *and* in Firefox Help submenu
    helpMenuURLEntries : [
      { separator: true },
      { label : "$TR help.faq", url : "%GOTB%helpfaq" },
      { separator: true },
      { label : "$TR help.checkforupdates", checkForUpdates : true },
      { label : "$TR help.uninstall", uninstall : true },
      { separator: true },
      { label : "$TR help.about", aboutExtDialog : true },
    ],
    // This specifies ALL items on the toolbar
    // If you want an item hidden by default, set it to false
    items: {
      "homebutton-button": true,
      "search-box": true,
      "email-button": true,
      "separator": true,
      "highlight-button": false,
      "amazon-button": true,
      "ebay-button": true,
      "lastminute-button": false,
      "ticker-button": true,
      "spring": true,
      "login-box": true,
      "pref-button": true,
    }
  },
},
homebutton : {
  defaultlocale : {
    homepageURL : "%GOTB%portal",
    dropdownURLEntries : [
      // normal button press is homepageURL above
      { label : "$TR help.faq", icon: "brand", url : "%GOTB%helpfaq" },
      { label : "$TR homebutton.video", icon: "video.png", url : "%GOTB%video" },
      { label : "$TR homebutton.realestate", icon: "realestate.png", url : "%GOTB%realestate" },
      { label : "$TR homebutton.dating", icon: "dating.png", url : "%GOTB%dating" },
      { label : "$TR homebutton.news.us", icon: "news.png", url : "%GOTB%usnews" },
    ],
  },
},
search : {
  defaultlocale : {
    toolbarURL : "%GOTB%web_search/?su=", // see also dropdownURLEntries below
    pshURL : "%GOTB%psh/?su=",
    keywordURL : "%GOTB%keyurl_search/?su=",
    newTabURL : "%GOTB%web_search_newtab/?su=",
    historyNewTabURL : "%GOTB%web_search_history/?su=",
    netErrorURL : "%GOTB%search_404/?su=",
    historyNetErrorURL : "%GOTB%search_hsty_404/?su=",
    injectPSHURL : "%GOTB%psh/?su=",
    urlbarURL: "%GOTB%searchicon/?su=",
    suggestURL : "http://search.mail.com/SuggestSearch/suggest_json/?origin=tb_sbox_ff&mc=tb_sbox_ff@suche@ffox.suche@web&brand=mailcom&su=",
    suggestName : "%BRAND%",
    engineName : "mail.com search", // main -- do not translate, must match OSD
    searchPlugins : [ // name in OSD file, filename in our searchplugins/ ext dir
      { name: "mail.com search", filename: "mailcom-search.xml" },
    ],
    allSearchPlugins : [ // superset: all |searchPlugins| of all locales
      { name: "mail.com search", filename: "mailcom-search.xml" },
    ],
    termRedirect :
    {
      "amazon.com" : "%GOTB%amazon",
      "web.de" : "http://go.web.de/tb/mff_home",
      "gmx.net" : "http://go.gmx.net/tb/mff_home",
      "gmx.de" : "http://go.gmx.net/tb/mff_home",
      "gmx.at" : "http://go.gmx.at/tb/mff_home",
      "gmx.ch" : "http://go.gmx.ch/tb/mff_home",
      "1und1.de" : "http://go.1und1.de/tb/mff_home",
      "mail.com" : "http://go.mail.com/tb/en-us/mff_home",
    },
  },
},
ebay : {
  defaultlocale : {
    disabled : true,
    disabledIDs : [
      { win : "main-window", el: "united-ebay-button" },
      { win : "united-pref-window", el: "united-ebay-button" },
      { win : "main-window", el: "united-lastminute-button" },
      { win : "united-pref-window", el: "united-lastminute-button" },
    ],
    portalURL : "%GOTB%ebay_hp",
    lastminutePortalURL : "%GOTB%lastminute_hp",
  },
},
amazon : {
  defaultlocale : {
    portalURL : "%GOTB%amazon",
  },
},
ticker : {
  defaultlocale : {
    placeholder_RSS : "http://www.mail.com/rss/",
    portalURL : "%GOTB%portalnews",
    maxItems : 16,
    feedsListURL : "%GOTB%feedslist",
    //feedsListURL : "", // use fallback below
    feedsListFallback : [
      { id : 1, label : "$TR ticker.news", url : "%RSS%news/", portalURL : "%GOTB%portalnews", showByDefault: true },
      { id : 2, label : "$TR ticker.entertainment", url : "%RSS%entertainment/", portalURL : "%GOTB%entertainment", showByDefault: true },
      { id : 3, label : "$TR ticker.business", url : "%RSS%business/", portalURL : "%GOTB%business", showByDefault: true },
      { id : 4, label : "$TR ticker.sports", url : "%RSS%sports/", portalURL : "%GOTB%sport", showByDefault: false },
      { id : 5, label : "$TR ticker.science", url : "%RSS%scitech/", portalURL : "%GOTB%science", showByDefault: false },
    ],
  },
},
newtab : {
  defaultlocale : {
    lasttabURL: "%GOTB%lasttab",
    // fill up the "most visited" list of the new tab page, *only* in a fresh profile
  },
},
tracking : {
  defaultlocale : {
    trackingURL: "http://event.ui-portal.de/metric/ca.gif?portal=mailcom&browser=ff&type=%TYPE%&event=%EVENT%&version=%VERSION%&installdate=%INSTALLDATE%&locale=%LOCALE%&kid=%KID%&mod=%MOD%",
    countNewTabURL : "%GOPREFIX%events/", // + &ntd=lastSubmit + &ntc=count
    brand : "%BRANDID%",
    identifyMyselfToSites : [
      "web.de",
      "gmx.net", "gmx.de", "gmx.ch", "gmx.at", "gmx.com",
      "mail.com",
      "1und1.de", "1and1.com",
      "uimserv.net", "cinetic.de",
    ],
  },
},
hotnews : { // this are tabs that are opened without request on browser start, to alert users, about toolbar and similar info, by UnitedInternet
  defaultlocale : {
    rssVersionURL : "http://dl.mail.com/backend/firefox/hotnews-%LOCALE%-%VERSION%.xml",
    rssFallbackURL : "http://dl.mail.com/backend/firefox/hotnews-%LOCALE%.xml",
  },
},
login : {
  defaultlocale : {
    providerID : "%BRANDID%", // which of the below configs belongs to this brand
    providerName : "%BRAND%",
    createAccountURLWeb : "%GOTB%signup",
    afterLogoutWebURL : "%GOTB%logout",
    // webpage shown when the user logs in for the very first time. null = deactivated.
    runonceNewUsersWebURL : "%GOTB%firstlogin",
    forgotPasswordURL : "%GOTB%help_password",
  },
},
email : {
  defaultlocale : {
    dropdownURLEntries : [],
  },
},
phish: {
  defaultlocale : {
    blacklist : "http://dl.web.de/backend/phish.txt", // web.de is correct
    updateFrequency : 15 * 60, // in seconds
  },
},
}
