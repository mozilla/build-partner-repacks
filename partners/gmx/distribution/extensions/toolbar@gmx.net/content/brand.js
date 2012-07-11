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
      { locale: "de-DE", label: "$TR region.de" },
      { locale: "de-AT", label: "$TR region.at" },
      { locale: "de-CH", label: "$TR region.ch" },
//      { locale: "en-UK", label: "$TR region.uk" },
    ],
  }
},

// app placeholders available: VERSION and LOCALE

// values that other modules depend on
global : {
  defaultlocale : {
    placeholder_BRAND : "GMX", // Label to be shown to users
    placeholder_BRANDID : "gmx", // Internal ID
    placeholder_GOMAIN : "http://go.gmx.net/", // used by overlay-browser.js
    placeholder_GOPREFIX : "http://go.gmx.net/tb/",
    placeholder_GOTB : "http://go.gmx.net/tb/mff_",
  },
  "de-AT" : {
    placeholder_GOMAIN : "http://go.gmx.at/",
    placeholder_GOPREFIX : "http://go.gmx.at/tb/",
    placeholder_GOTB : "http://go.gmx.at/tb/mff_",
  },
   "de-CH" : {
    placeholder_GOMAIN : "http://go.gmx.ch/",
    placeholder_GOPREFIX : "http://go.gmx.ch/tb/",
    placeholder_GOTB : "http://go.gmx.ch/tb/mff_",
  },
  "en-UK" : {
    // TODO: add proper values here
    placeholder_GOMAIN : "http://go.gmx.co.uk/",
    placeholder_GOPREFIX : "http://go.gmx.co.uk/tb/",
    placeholder_GOTB : "http://go.gmx.co.uk/tb/mff_",
  },
},
// basic functions of the toolbar
toolbar : {
  defaultlocale : {
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
      { label : "$TR help.center", url : "%GOTB%help_center" }, 
      { label : "$TR help.email", url : "%GOTB%faq" }, 
      { label : "$TR help.toolbar", url : "%GOTB%help" },
      { label : "$TR help.about", aboutExtDialog : true },
    ],
  },
},
homebutton : {
  defaultlocale : {
    homepageURL : "%GOTB%home",
    dropdownURLEntries : [
      // normal button press is homepageURL above
      { label : "$TR homebutton.topics", icon: "brand", url : "%GOTB%portal" },
      { label : "$TR homebutton.cars", icon: "car.png", url : "%GOTB%auto" },
      { label : "$TR homebutton.games", icon: "games.png", url : "%GOTB%games" },
      { label : "$TR homebutton.entertainment", icon: "entertainment.png", url : "%GOTB%unterhaltung" },
      { label : "$TR homebutton.sports", icon: "sports.png", url : "%GOTB%sport" },
      { label : "$TR more", icon: null, url :  "%GOTB%home_more" },
    ],
  },
},
search : {
  defaultlocale : {
    toolbarURL : "%GOTB%web_search/?su=", // see also dropdownURLEntries below
    keywordURL : "%GOTB%keyurl_search/?su=",
    newTabURL : "%GOTB%web_search_newtab/?su=",
    historyNewTabURL : "%GOTB%web_search_history/?su=",
    netErrorURL : "%GOTB%search_404/?su=",
    historyNetErrorURL : "%GOTB%search_hsty_404/?su=",
    suggestURL : "http://suggestplugin.ui-portal.de/suggest_json/?origin=tb_sbox_ff&brand=gmx&su=",
    suggestName : "%BRAND%",
    engineName : "GMX Suche", // main -- do not translate, must match OSD
    searchPlugins : [ // name in OSD file, filename in our searchplugins/ ext dir
      { name: "WEB.DE Suche", filename: "webde-suche.xml" },
      { name: "GMX Suche", filename: "gmx-suche.xml" },
      { name: "1&1 Suche", filename: "1und1-suche.xml" },
      { name: "lastminute", filename: "lastminute.xml" },
      { name: "Englische Ergebnisse", filename: "mailcom-search.xml" },
    ],
    allSearchPlugins : [ // superset: all |searchPlugins| of all locales
      { name: "GMX Suche \u00D6sterreich", filename: "gmx-at.xml" },
      { name: "GMX Suche Schweiz", filename: "gmx-ch.xml" },
      { name: "WEB.DE Suche", filename: "webde-suche.xml" },
      { name: "GMX Suche", filename: "gmx-suche.xml" },
      { name: "1&1 Suche", filename: "1und1-suche.xml" },
      { name: "lastminute", filename: "lastminute.xml" },
      { name: "Englische Ergebnisse", filename: "mailcom-search.xml" },
    ],
    termRedirect :
    {
      "amazon.de" : "%GOTB%amazon?keywords=",
      "ebay.de" : "%GOTB%ebay_hp",
      "web.de" : "http://go.web.de/tb/mff_home",
      "gmx.net" : "http://go.gmx.net/tb/mff_home",
      "gmx.de" : "http://go.gmx.net/tb/mff_home",
      "gmx.at" : "http://go.gmx.at/tb/mff_home",
      "gmx.ch" : "http://go.gmx.ch/tb/mff_home",
      "1und1.de" : "http://go.1und1.de/tb/mff_home",
      "mail.com" : "http://go.mail.com/tb/en-us/mff_home",
    },
  },
  "de-AT" : {
    engineName : "GMX Suche \u00D6sterreich", // main
    searchPlugins : [ // name in OSD file, filename in our searchplugins/ ext dir
      { name: "GMX Suche \u00D6sterreich", filename: "gmx-at.xml" },
    ],
  },
  "de-CH" : {
    engineName : "GMX Suche Schweiz", // main
    searchPlugins : [ // name in OSD file, filename in our searchplugins/ ext dir
      { name: "GMX Suche Schweiz", filename: "gmx-ch.xml" },
    ],
  },
},
shopping : {
  defaultlocale : {
    // icons in skin/shopping/
    dropdownURLEntries :
    [
      {
        id : "amazon",
        label : "$TR trademark.amazon",
        icon : "amazon.png",
        url : "%GOTB%amazon?keywords=",
        searchURL : "%GOTB%amazon?keywords=",
        removable : false,
      },
    ],
  },
},
ebay : {
  defaultlocale : {
    suggestURL : "http://anywhere.ebay.com/services/suggest/?s=77&r=707-52222-19487-4&q=",
    portalURL : "%GOTB%ebay_hp",
    searchURL : "%GOTB%ebay?su=",
    lastminutePortalURL : "%GOTB%lastminute_hp",
    lastminuteSearchURL : "%GOTB%lastminute_search/?searchText=",
  },
},
amazon : {
  defaultlocale : {
    APIProxyURL : "%GOTB%amazon_listbox/s",
  },
},
ticker : {
  defaultlocale : {
    portalURL : "%GOTB%portalnews",
    maxItems : 16,
    feedsListURL : "%GOTB%feedslist",
    feedsListFallback : [
      { id : 1, label : "$TR ticker.main", url : "%GOTB%news_listbox" },
      { id : 2, label : "$TR ticker.tabloit", url : "%GOTB%themen_listbox" },
    ],
    dropdownURLEntries : [
      { label : "$TR more", url : "%GOTB%news_more" },
    ],
  },
  "de-AT" : {
    feedsListFallback : [
      { id : 1, label : "$TR ticker.at", url : "%GOTB%news_listbox" },
      { id : 2, label : "$TR ticker.tabloit", url : "%GOTB%themen_listbox" },
    ],
  },
  "de-CH" : {
    feedsListFallback : [
      { id : 1, label : "$TR ticker.ch", url : "%GOTB%news_listbox" },
      { id : 2, label : "$TR ticker.tabloit", url : "%GOTB%themen_listbox" },
    ],
  },
  "en-UK" : {
    feedsListFallback : [
      { id : 1, label : "$TR ticker.main", url : "%GOTB%news_listbox" },
      { id : 2, label : "$TR ticker.tabloit", url : "%GOTB%themen_listbox" },
    ],
  },
},
weather : {
  defaultlocale : {
    disabled : true,
    disabledIDs : [
      { win : "main-window", el: "united-weather-button" },
      { win : "united-pref-window", el: "weather-postcode" },
      { win : "united-pref-window", el: "weather-location-services" },
      { win : "united-pref-window", el: "weather-no-nag" },
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
    partnertestURL : "http://www.gmx.net/themen/lifestyle/horoskop/partnertest/stier/",
    moreURL : "%GOTB%horoskop/more"
  },
},
newtab : {
  defaultlocale : {
    recommendedSitesXMLURL : "%GOTB%quicklaunch_xml",
    // TODO use placeholder for newtab prefix? 
    // fill up the "most visited" list of the new tab page, *only* in a fresh profile
    initialEntries : [
      { label : "$TR newtab.initial.portal", preview: "portal.jpg", url : "%GOPREFIX%newtab/mff_portal" },
      { label : "$TR newtab.initial.search", preview: "suche.jpg", url : "%GOPREFIX%newtab/mff_suche" },
      { label : "$TR newtab.initial.ebay", preview: "ebay.jpg", url : "%GOPREFIX%newtab/mff_ebay" },
      { label : "$TR newtab.initial.amazon", preview: "amazon.jpg", url : "%GOPREFIX%newtab/mff_amazon" },
      { label : "$TR newtab.initial.lastminute", preview: "lastminute.jpg", url : "%GOPREFIX%newtab/mff_lastminute" },
      { label : "$TR newtab.initial.news", preview: "nachrichten.jpg", url : "%GOPREFIX%newtab/mff_nachrichten" },
      { label : "$TR newtab.initial.unicef", preview: "unicef.jpg", url : "%GOPREFIX%newtab/mff_unicef" },
      { label : "$TR newtab.initial.topde", preview: "topde.jpg", url : "%GOPREFIX%newtab/mff_topde" },
    ],
  },
},
tracking : {
  defaultlocale : {
    AIBDailyURL : "https://dl.gmx.net/toolbar/firefox/aib.xml?vers=%VERSION%&local=%LOCALE%",
    AIBMonthlyURL : "https://dl.gmx.net/toolbar30days/firefox/aib.xml?vers=%VERSION%&local=%LOCALE%",
    count404URL : "%GOMAIN%count404", // + &count=123
    countNewTabURL : "%GOPREFIX%events/", // + &ntd=lastSubmit + &ntc=count
    brand : "%BRANDID%",
    sendCampaignID : true,
    identifyMyselfToSites : [
      "web.de",
      "gmx.net", "gmx.de", "gmx.ch", "gmx.at", "gmx.com",
      "mail.com",
      "1und1.de", "1and1.com",
      "uimserv.net", "cinetic.de",
    ],
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
    providerID : "%BRANDID%", // which of the below configs belongs to this brand
    providerName : "%BRAND%",
    createAccountURLWeb : "%GOTB%signup",
    afterLogoutWebURL : "%GOTB%logout",
    // webpage shown when the user logs in for the very first time. null = deactivated.
    runonceNewUsersWebURL : null,
    enableXXLTooltip : false,
    trackXXLTooltipClickedURL : null,
    configs : [
      {
        providerID : "webde",
        domains : [ "web.de" ],
        type : "unitedinternet",
        loginTokenServerURL : "https://lts.web.de/logintokenserver-1.0",
        uasURL : "https://uas2.uilogin.de/tokenlogin",
        serviceID : "pacs.toolbar.webde",
      },
      {
        providerID : "gmx",
        domains : [ "gmx.net", "gmx.de", "gmx.at", "gmx.ch",
            "gmx.co.uk", "gmx.fr", "gmx.it",
            "gmx.com",
            "gmx.eu", "gmx.info", "gmx.biz", "gmx.tm", "gmx.org",
            "imail.de", ],
        type : "unitedinternet",
        loginTokenServerURL : "https://lts.gmx.net/logintokenserver-1.0",
        uasURL : "https://uas2.uilogin.de/tokenlogin",
        serviceID : "pacs.toolbar.gmx",
      },
      {
        providerID : "1und1",
        domains : [ "online.de", "onlinehome.de", "sofortstart.de", "sofort-start.de", "go4more.de", "sofortsurf.de", "sofort-surf.de", ],
        type : "imap",
        hostname : "imap.1und1.de",
        port : 993,
        socketType : 2,
      },
      {
        providerID : "mailcom",
        domains : [ "mail.com",
          "email.com", "usa.com", "consultant.com", "myself.com",
          "london.com", "europe.com", "post.com", "dr.com", "doctor.com",
          "lawyer.com", "engineer.com", "techie.com", "linuxmail.org",
          "iname.com", "cheerful.com", "contractor.net", "accountant.com",
          "asia.com", "writeme.com", "uymail.com", "munich.com", ],
        type : "unitedinternet",
        loginTokenServerURL : "https://lts.mail.com/logintokenserver-1.1",
        uasURL : "https://uas-us.gmx.com/tokenlogin",
        serviceID : "mailcom.toolbar.live",
      },
    ],
  },
},
email : {
  defaultlocale : {
    dropdownURLEntries : [],
  },
},
phish: {
  defaultlocale : {
    blacklist : "http://dl.web.de/backend/phish.txt",
    updateFrequency : 15 * 60, // in seconds
  },
},
}
