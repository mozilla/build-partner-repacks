login.defaultlocale.configs =
[
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
    domains : [ "mail.com", "gmx.com",
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
]
login.defaultlocale.mozillaISPDBURL = "https://autoconfig.thunderbird.net/v1.1/";
login.defaultlocale.mozillaMXURL = "https://mx.thunderbird.net/dns/mx/";

search.defaultlocale.competitorlist =
{
  "www.google.com": { "query": "q" },
  "www.google.de": { "query": "q" },
  "www.google.at": { "query": "q" },
  "www.google.ch": { "query": "q" },
  "www.bing.com": { "query": "q" },
  "suche.t-online.de": { "query": "q" },
  "de.ask.com": { "query": "q" },
  "ask.com": { "query": "q" },
  "de.search.yahoo.com": { "query": "p" },
  "search.yahoo.com": { "query": "p" },
  "suche.gmx.net": [ { "query": "q" }, { "query": "su" } ],
  "suche.web.de": [ { "query": "q" }, { "query": "su" } ],
  "search.1und1.de": [ { "query": "q" }, { "query": "su" } ],
  "search.mail.com": [ { "query": "q" }, { "query": "su" } ],

  "www.ebay.de": { "query": "_nkw" },
  "www.amazon.de": { "query": "field-keywords" },
  "www.facebook.com": { "query": "q" },
  "www.youtube.com": { "query": "search_query" },
}

// If you add a domain here, it must be in the competitorlist as well
search.defaultlocale.googlelist =
{
  "www.google.com": true,
  "www.google.de": true,
  "www.google.at": true,
  "www.google.ch": true,
}
