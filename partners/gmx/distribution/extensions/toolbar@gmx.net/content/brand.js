// GMX
var brand = {
//{
// Countries supported by this version of the toolbar.
// The label should be in the language of the country.
// All the other values (URLs, dropdown labels) may
// vary based on these regions.
regions : {
  defaultlocale : {
    list : [
      { locale: "de-DE", label: "Deutschland" },
      { locale: "de-AT", label: "\u00D6sterreich" },
      { locale: "de-CH", label: "Schweiz" },
//      { locale: "en-UK", label: "United Kingdom" },
    ],
  }
},

// app placeholders available: VERSION and LOCALE

// values that other modules depend on
global : {
  defaultlocale : {
    placeholder_SEARCH : "http://suche.gmx.net/search/",
    placeholder_GOMAIN : "http://go.gmx.net/",
    placeholder_GOTB : "http://go.gmx.net/tb/mff_",
  },
  "de-AT" : {
    placeholder_SEARCH : "http://suche.gmx.at/search/",
    placeholder_GOMAIN : "http://go.gmx.at/",
    placeholder_GOTB : "http://go.gmx.at/tb/mff_",
  },
   "de-CH" : {
    placeholder_SEARCH : "http://suche.gmx.ch/search/",
    placeholder_GOMAIN : "http://go.gmx.ch/",
    placeholder_GOTB : "http://go.gmx.ch/tb/mff_",
  },
  "en-UK" : {
    // TODO: add proper values here.
    placeholder_SEARCH : "http://search.gmx.co.uk/search/",
    placeholder_GOMAIN : "http://go.gmx.co.uk/",
    placeholder_GOTB : "http://go.gmx.co.uk/tb/mff_",
  },
},
// basic functions of the toolbar
toolbar : {
  defaultlocale : {
    // toolbar.js
    homepageURL : "%GOTB%home",
    startpageURL : "http://www.gmx.de/", // must match distribution.ini
    // extension.js
    firstrunURL : "%GOTB%runonce_moz",
    upgradeURL : "%GOTB%addon",
    uninstallURL : "%GOTB%uninstall_runonce_moz",
    // Appears in toolbar "Settings" button dropdown,
    // *and* in Firefox Help submenu
    helpMenuURLEntries : [
      { label : "GMX Hilfecenter", url : "%GOTB%help_center" }, 
      { label : "E-Mail Hilfe", url : "%GOTB%faq" }, 
      { label : "Toolbar Hilfe",
            url : "%GOTB%toolbarhelp_version_%VERSION%",
            fallbackURL : "%GOTB%help" }, // ditto
      { label : "\u00DCber GMX Toolbar", aboutExtDialog : true },
    ],
  },
  "en-UK" : {
    helpMenuURLEntries : [
      { label : "GMX Help Centre", url : "%GOTB%help_center" },
      { label : "E-Mail help", url : "%GOTB%faq" },
      { label : "Toolbar help",
            url : "%GOTB%toolbarhelp_version_%VERSION%",
            fallbackURL : "%GOTB%help" }, // fallbackURL only works here, not in other lists
      { label : "About GMX Toolbar", aboutExtDialog : true },
    ],
  },
},
homebutton : {
  defaultlocale : {
    homepageURL : "%GOTB%home",
    dropdownURLEntries : [
      // normal button press is homepageURL above
      { label : "Themen", icon: "brand", url : "%GOTB%portal" },
      { label : "Auto", icon: "car.ico", url : "%GOTB%auto" },
      { label : "Finanzen", icon: "finance.ico", url : "%GOTB%finanzen" },
      { label : "Games", icon: "games.ico", url : "%GOTB%games" },
      { label : "Gesundheit", icon: "health.ico", url : "%GOTB%gesundheit" },
      { label : "Lifestyle", icon: "lifestyle.ico", url : "%GOTB%lifestyle" },
      { label : "Reise", icon: "travel.ico", url : "%GOTB%reise" },
      { label : "Sport", icon: "sports.ico", url : "%GOTB%sport" },
      { label : "Unterhaltung", icon: "entertainment.ico", url : "%GOTB%unterhaltung" },
      { label : "Wissen", icon: "knowledge.ico", url : "%GOTB%wissen" },
      { label : "GMX hilft", icon: null, url :  "%GOTB%portal_hilft" },
      { label : "mehr", icon: null, url :  "%GOTB%home_more" },
    ],
  },
  "en-UK" : {
    dropdownURLEntries : [
      // normal button press is homepageURL above
      { label : "Topics", icon: "brand", url : "%GOTB%portal" },
      { label : "Car", icon: "car.ico", url : "%GOTB%auto" },
      { label : "Finances", icon: "finance.ico", url : "%GOTB%finanzen" },
      { label : "Games", icon: "games.ico", url : "%GOTB%games" },
      { label : "Health", icon: "health.ico", url : "%GOTB%gesundheit" },
      { label : "Lifestyle", icon: "lifestyle.ico", url : "%GOTB%lifestyle" },
      { label : "Travel", icon: "travel.ico", url : "%GOTB%reise" },
      { label : "Sports", icon: "sports.ico", url : "%GOTB%sport" },
      { label : "Entertainment", icon: "entertainment.ico", url : "%GOTB%unterhaltung" },
      { label : "Knowledge", icon: "knowledge.ico", url : "%GOTB%wissen" },
      { label : "more", icon: null, url :  "%GOTB%home_more" },
    ],
  }
},
search : {
  defaultlocale : {
    toolbarURL : "%GOMAIN%br/moz4_sbox_search/?su=",
    keywordURL : "%GOMAIN%br/moz4_keyurl_search/?su=", // must match distribution.ini
    newTabURL : "%GOTB%web_search_newtab?su=",
    historyNewTabURL : "%GOTB%web_search_history?su=",
    marketedNewTabURL : "%GOTB%hot_search?su=",
    netErrorURL : "%GOTB%search_404/?su=",
    historyNetErrorURL : "%GOTB%search_hsty_404/?su=",
    engineName : "GMX Suche", // main
    searchPlugins : [ // name in OSD file, filename in our searchplugins/ ext dir
      { name: "GMX Suche", filename: "gmx-suche.xml" },
    ],
    allSearchPlugins : [ // superset: all |searchPlugins| of all locales
      { name: "GMX Suche", filename: "gmx-suche.xml" },
    ],
    dropdownURLEntries : [
      { label : "Web-Suche", icon : "brand", url : "%GOMAIN%br/moz4_sbox_search/?su=" },
      { label : "mehr", icon : "more.png", url : "%GOTB%search_more?su=" },
    ],
  },
},
shopping : {
  defaultlocale : {
    // icons in skin/shopping/
    dropdownURLEntries : [
      { label : "Amazon", icon : "amazon.png", url : "%GOTB%amazon?keywords=", searchURL : "%GOTB%amazon?keywords=" },
      // { label : "eBay", icon : "ebay.png", url : "%GOTB%ebay_hp", searchURL : "%GOTB%ebay?su=" },
      { label : "SmartShopping", icon : "smartshopping.png", url : "%GOTB%smartshopping_hp", searchURL : "%GOTB%smartshopping/?searchText=" },
    ],
  },
},
ebay : {
  defaultlocale : {
    portalURL : "%GOTB%ebay_hp",
    searchURL : "%GOTB%ebay?su=",
  },
},
ticker : {
  defaultlocale : {
    portalURL : "%GOTB%portalnews",
    feedsListURL : "%GOTB%feedslist",
    feedsListFallback : [
      { id : 1, label : "GMX - Deutschland, Ausland und Panorama", url : "%GOTB%news_listbox" },
      { id : 2, label : "GMX - Nachrichten, Sport, Promi-News", url : "%GOTB%themen_listbox" },
    ],
    dropdownURLEntries : [
      { label : "mehr", url : "%GOTB%news_more" },
    ],
  },
  "de-AT" : {
    feedsListFallback : [
      { id : 1, label : "GMX - Nachrichten und spannende Geschichten aus \u00D6sterreich", url : "%GOTB%news_listbox" },
      { id : 2, label : "GMX - Nachrichten, Sport, Promi-News", url : "%GOTB%themen_listbox" },
    ],
  },
  "de-CH" : {
    feedsListFallback : [
      { id : 1, label : "GMX - Schweiz", url : "%GOTB%news_listbox" },
      { id : 2, label : "GMX - Nachrichten, Sport, Promi-News", url : "%GOTB%themen_listbox" },
    ],
  },
  "en-UK" : {
    feedsListFallback : [
      { id : 1, label : "GMX - United Kingdom, Foreign News and Miscellaneous", url : "%GOTB%news_listbox" },
      { id : 2, label : "GMX - News, Sports, Celeb News", url : "%GOTB%themen_listbox" },
    ],
    dropdownURLEntries : [
      { label : "more", url : "%GOTB%news_more" },
    ],
  },
},
weather : {
  defaultlocale : {
    disabled : true,
    disabledIDs : [
      { win : "main-window", el: "united-weather-button" },
      { win : "united-pref-window", el: "weather-settings" },
    ],
    normalURL : "%GOTB%wetter",
    regionalURL : "%GOTB%wetterplz?NAME=",
  },
  "de-DE" : {
    disabled : false,
  },
  "de-AT" : {
    disabled : false,
  },
  "de-CH" : {
    disabled : false,
  },
},
horoscope : {
  defaultlocale : {
    horoscopeURL : "%GOTB%horoskop/{TYPE}/{SIGN}",
    partnertestURL : "http://www.gmx.net/themen/lifestyle/horoskop/partnertest/",
    moreURL : "%GOTB%horoskop/more"
  },
},
newtab : {
  defaultlocale : {
    marketedSearchTermsURL : "%GOTB%hot",
    // TODO use placeholder for newtab prefix? 
    // fill up the "most visited" list of the new tab page, *only* in a fresh profile
    initialEntries : [
      { label : "Portal", preview: "portal.jpg", url : "%GOMAIN%tb/newtab/mff_portal" },
      { label : "Suche", preview: "suche.jpg", url : "%GOMAIN%tb/newtab/mff_suche" },
      { label : "Ebay", preview: "ebay.jpg", url : "%GOMAIN%tb/newtab/mff_ebay" },
      { label : "Amazon", preview: "amazon.jpg", url : "%GOMAIN%tb/newtab/mff_amazon" },
      { label : "Maxdome", preview: "maxdome.jpg", url : "%GOMAIN%tb/newtab/mff_maxdome" },
      { label : "Nachrichten", preview: "nachrichten.jpg", url : "%GOMAIN%tb/newtab/mff_nachrichten" },
      { label : "Unicef Stiftung", preview: "unicef.jpg", url : "%GOMAIN%tb/newtab/mff_unicef" },
      { label : "Topde", preview: "topde.jpg", url : "%GOMAIN%tb/newtab/mff_topde" },
    ],
  },
  "en-UK" : {
    initialEntries : [
      { label : "Portal", preview: "portal.jpg", url : "%GOMAIN%tb/newtab/mff_portal" },
      { label : "Search", preview: "suche.jpg", url : "%GOMAIN%tb/newtab/mff_suche" },
      { label : "Ebay", preview: "ebay.jpg", url : "%GOMAIN%tb/newtab/mff_ebay" },
      { label : "Amazon", preview: "amazon.jpg", url : "%GOMAIN%tb/newtab/mff_amazon" },
      { label : "Video On Demand", preview: "maxdome.jpg", url : "%GOMAIN%tb/newtab/mff_maxdome" },
      { label : "News", preview: "nachrichten.jpg", url : "%GOMAIN%tb/newtab/mff_nachrichten" },
      { label : "Unicef", preview: "unicef.jpg", url : "%GOMAIN%tb/newtab/mff_unicef" },
      { label : "TopUK", preview: "topde.jpg", url : "%GOMAIN%tb/newtab/mff_topde" },
    ],
  }
},
tracking : {
  defaultlocale : {
    AIBDailyURL : "https://dl.gmx.net/toolbar/firefox/%VERSION%-%INTERVAL%-%LOCALE%-moz.xml",
    AIBMonthlyURL : "https://dl.gmx.net/toolbar30days/firefox/%VERSION%-%INTERVAL%-%LOCALE%-moz.xml",
    count404URL : "%GOTB%count404", // + &count=123
  },
},
hotnews : {
  defaultlocale : {
    rssVersionURL : "http://dl.gmx.net/backend/firefox/hotnews-%LOCALE%-%VERSION%.xml",
    rssFallbackURL : "http://dl.gmx.net/backend/firefox/hotnews-%LOCALE%.xml",
  },
},
login : {
  defaultlocale : {
    loginTokenServerURL : "https://lts.gmx.net/logintokenserver-1.0",
    uasURL : "https://uas2.uilogin.de/tokenlogin",
    serviceID : "pacs.toolbar.gmx",
    emailAddressPattern : "@gmx.[a-z]+$",
    createAccountURLWeb : "%GOTB%signup",
    afterLogoutWebURL : "%GOTB%logout",
  },
},
email : {
  defaultlocale : {
    dropdownURLEntries : [],
  },
  "de-DE" : {
    dropdownURLEntries : [
      { label : "Jetzt De-Mail registrieren", icon: "demail-small.png", url : "%GOMAIN%tb/de_mail/mff_signup" },
    ],
  },
},
phish: {
  defaultlocale : {
    blacklist : "http://dl.web.de/backend/phish.txt",
    updateFrequency : 15 * 60, // in seconds
  },
},
}
