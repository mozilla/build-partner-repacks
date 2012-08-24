// WEB.DE
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
    ],
  }
},

// app placeholders available: VERSION and LOCALE

// values that other modules depend on
global : {
  defaultlocale : {
    placeholder_BRAND : "WEB.DE", // Label to be shown to user
    placeholder_BRANDID : "webde", // Internal ID
    placeholder_GOMAIN : "http://go.web.de/", // used by overlay-browser.js
    placeholder_GOPREFIX : "http://go.web.de/tb/",
    placeholder_GOTB : "http://go.web.de/tb/mff_",
  },
},
// basic functions of the toolbar
toolbar : {
  defaultlocale : {
    // homepage = portal, e.g. http://www.web.de
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
      { label : "$TR help.customerservice", url : "%GOTB%help_center" }, 
      { label : "$TR help.freemail", url : "%GOTB%faq" }, 
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
    suggestURL : "http://suggestplugin.ui-portal.de/suggest_json/?origin=tb_sbox_ff&brand=webde&su=",
    suggestName : "%BRAND%",
    engineName : "WEB.DE Suche", // main -- do not translate, must match OSD
    searchPlugins : [ // name in OSD file, filename in our searchplugins/ ext dir
      { name: "WEB.DE Suche", filename: "webde-suche.xml" },
      { name: "GMX Suche", filename: "gmx-suche.xml" },
      { name: "1&1 Suche", filename: "1und1-suche.xml" },
      { name: "lastminute", filename: "lastminute.xml" },
      { name: "Englische Ergebnisse", filename: "mailcom-search.xml" },
    ],
    allSearchPlugins : [ // superset: all |searchPlugins| of all locales
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
    suggestURL : "http://anywhere.ebay.com/services/suggest/?s=77&r=707-52222-19487-5&q=",
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
},
weather : {
  defaultlocale : {
    normalURL : "",
    regionalURL : "",
    disabled : true,
    disabledIDs : [
      { win : "main-window", el: "united-weather-button" },
      { win : "united-pref-window", el: "weather-postcode" },
      { win : "united-pref-window", el: "weather-location-services" },
      { win : "united-pref-window", el: "weather-no-nag" },
    ],
  },
  "de-DE" : {
    disabled : false,
    normalURL : "%GOTB%wetter",
    regionalURL : "%GOTB%wetterplz?NAME=",
  },
},
horoscope : {
  defaultlocale : {
    horoscopeURL : "%GOTB%horoskop/{TYPE}/{SIGN}",
    partnertestURL : "http://web.de/magazine/lifestyle/horoskop/partnertest/stier/index.html",
    moreURL: "%GOTB%horoskop/more"
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
    AIBDailyURL : "https://dl.web.de/toolbar/firefox/aib.xml?vers=%VERSION%&local=%LOCALE%",
    AIBMonthlyURL : "https://dl.web.de/toolbar30days/firefox/aib.xml?vers=%VERSION%&local=%LOCALE%",
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
    rssVersionURL : "http://dl.web.de/backend/firefox/hotnews-%LOCALE%-%VERSION%.xml",
    rssFallbackURL : "http://dl.web.de/backend/firefox/hotnews-%LOCALE%.xml",
  },
},
login : {
  defaultlocale : {
    providerID : "%BRANDID%", // which of the below configs belongs to this brand
    providerName : "%BRAND%",
    createAccountURLWeb : "%GOTB%signup",
    afterLogoutWebURL : null,
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