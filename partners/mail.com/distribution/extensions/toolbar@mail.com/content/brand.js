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
      { label : "$TR help.faq", url : "%GOTB%helpfaq" },
      { label : "$TR help.about", aboutExtDialog : true },
    ],
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
    keywordURL : "%GOTB%keyurl_search/?su=",
    newTabURL : "%GOTB%web_search_newtab/?su=",
    historyNewTabURL : "%GOTB%web_search_history/?su=",
    netErrorURL : "%GOTB%search_404/?su=",
    historyNetErrorURL : "%GOTB%search_hsty_404/?su=",
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
    // fill up the "most visited" list of the new tab page, *only* in a fresh profile
    initialEntries : [
      { label : "$TR newtab.initial.portal", preview: "mailcom.jpg", url : "%GOPREFIX%newtab/mff_nt_homepage" },
      { label : "$TR newtab.initial.search", preview: "search.jpg", url : "%GOPREFIX%newtab/mff_nt_search" },
      { label : "$TR newtab.initial.jobs", preview: "jobs.jpg", url : "%GOPREFIX%newtab/mff_nt_jobs" },
      { label : "$TR newtab.initial.dating", preview: "dating.jpg", url : "%GOPREFIX%newtab/mff_nt_dating" },
      { label : "$TR newtab.initial.news", preview: "news.jpg", url : "%GOPREFIX%newtab/mff_nt_news" },
      { label : "$TR newtab.initial.entertainment", preview: "entertainment.jpg", url : "%GOPREFIX%newtab/mff_nt_entertainment" },
      { label : "$TR newtab.initial.sports", preview: "sports.jpg", url : "%GOPREFIX%newtab/mff_nt_sports" },
      { label : "$TR newtab.initial.science", preview: "science.jpg", url : "%GOPREFIX%newtab/mff_nt_scitec" },
      { label : "$TR newtab.initial.business", preview: ".jpg", url : "%GOPREFIX%newtab/mff_nt_business" },
    ],
  },
},
tracking : {
  defaultlocale : {
    AIBDailyURL : "https://dl.mail.com/toolbar/firefox/aib.xml?vers=%VERSION%&local=%LOCALE%",
    AIBMonthlyURL : "https://dl.mail.com/toolbar30days/firefox/aib.xml?vers=%VERSION%&local=%LOCALE%",
    count404URL : "%GOMAIN%count404", // + &count=123
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
    blacklist : "http://dl.web.de/backend/phish.txt", // web.de is correct
    updateFrequency : 15 * 60, // in seconds
  },
},
}
