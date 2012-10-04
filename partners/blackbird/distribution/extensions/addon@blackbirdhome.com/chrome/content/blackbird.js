(function() {
  var BlackbirdServices;
  var TickerFeed;
  var lwtm;

  var blackbirdConfig;

  var ticker;
  var tickTimer;

  var tickSpeed = 12;
  var currentFirstItemMargin = 0;
  var ticksPerItem = 200;

  var paused = true;

  var limitItemsPerFeed = false;
  var itemsPerFeed = 5;

  var adInterval = 7;
  var numItems = 0;

  var hideVisited = true;
  var boldUnvisited = false;
  var updateFrequency = 30;
  
  var placesDB;

  var adfeed;

  function populateTooltip(event) {
    var tooltip = event.target;
    var target = document.tooltipNode;
    document.getElementById("blackbird-item-tooltip-image").setAttribute("src", target.getAttribute("image"));
    document.getElementById("blackbird-item-tooltip-feed").setAttribute("value", target.feed);
    document.getElementById("blackbird-item-tooltip-label").setAttribute("value", target.getAttribute("label"));
    var summary = document.getElementById("blackbird-item-tooltip-summary");
    while(summary.hasChildNodes()) {
      summary.removeChild(summary.firstChild);
    }
    summary.appendChild(document.createTextNode(target.description));
  }

  function markItemAsRead(event) {
    var target = event.target.parentNode.triggerNode;
    markItemRead(target, makeURI(target.getAttribute("href")));
  }

  function markAllRead(event) {
    var items = ticker.getElementsByAttribute("class", "blackbird-ticker-item");
    while (items.length > 0) {
      markItemRead(items[0], makeURI(items[0].getAttribute("href")));
    }
  }

  function markFeedRead(event) {
    var target = event.target.parentNode.triggerNode;
    var items = ticker.getElementsByAttribute("image", target.getAttribute("image"));
    while (items.length > 0) {
      markItemRead(items[0], makeURI(items[0].getAttribute("href")));
    }
  }

  function markItemRead(target, uri) {
    var visit = {};
    visit.transitionType = Components.interfaces.nsINavHistoryService.TRANSITION_FRAMED_LINK;
//  visit.transitionType = Components.interfaces.nsINavHistoryService.TRANSITION_LINK;
    visit.visitDate = Date.now() * 1000;
    var place = {
      uri: uri,
      title: target.getAttribute("label"),
      visits: [visit]
    }
    BlackbirdServices.asynchistory.updatePlaces(place);

    /* If it is not an ad, remove it */
    if (target.getAttribute("class") != "blackbird-ticker-ad") {
      if (hideVisited) {
        /* Don't allow two ads to be next to each other */
        if ((target.previousSibling && target.previousSibling.getAttribute("class") == "blackbird-ticker-ad") &&
            (target.nextSibling && target.nextSibling.getAttribute("class") == "blackbird-ticker-ad")) {
          target.parentNode.removeChild(target.nextSibling);
        }
        target.parentNode.removeChild(target);
        adjustSpacerWidth();
      } else {
        target.style.fontWeight = "";
      }
    }
  }

  function openItemNewTab(event) {
    openItem(event, true);
  }

  function openItem(event, newTab) {
    var target = event.target;
    if (event.target.nodeName == "menuitem") {
      target = event.target.parentNode.triggerNode;
    }
    var uri = makeURI(target.getAttribute("href"));
    markItemRead(target, uri);
    if (newTab) {
      openUILinkIn(uri.spec, "tab");
    } else {
      openUILink(uri.spec, event);
    }
  }

  function dbListener() {
    this.handleResult =  function(aResultSet) {
      if (hideVisited) {
        this.button.parentNode.removeChild(this.button);
        this.button = null;
      } else {
        this.visited = true;
      }
    };
    this.handleError = function(aError) {
    };
    this.handleCompletion =  function(aReason) {
      if (this.button) {
        this.button.hidden = false;
        initButton(this.button);
        if (!this.visited && boldUnvisited) {
          this.button.style.fontWeight = "bold";
        }
      }
      numButtonsLeft--;
      if (numButtonsLeft == 0 && numFeedsLeft == 0) {
        if (adfeed) {
          var items = ticker.getElementsByAttribute("class", "blackbird-ticker-item");
          if (items.length > adInterval) {
            for (var i=0; i < items.length; i += adInterval) {
              var button = document.createElement("toolbarbutton");
              button.setAttribute("class", "blackbird-ticker-ad");
              button.setAttribute("label", adfeed.getItem(0).title);
              button.setAttribute("href", adfeed.getItem(0).link);
              button.setAttribute("tooltiptext", adfeed.getItem(0).description);
              if (adfeed.getItem(0).image) {
                button.setAttribute("image", adfeed.getItem(0).image);
              }
              initButton(button);
              ticker.insertBefore(button, items[i+1]);
            }
          }
          var items = ticker.getElementsByAttribute("class", "blackbird-ticker-ad");
          if (items.length == 0) {
              var button = document.createElement("toolbarbutton");
              button.setAttribute("class", "blackbird-ticker-ad");
              button.setAttribute("label", "AD");
              // button.setAttribute("href", href);
              ticker.appendChild(button);
          }
        }
        adjustSpacerWidth();
      }
    }
  }

  /* Asynchronously check to see if a given link has been visited */
  function isVisited(button, href) {
    if (placesDB.createAsyncStatement) {
      let stmt = placesDB.createAsyncStatement("SELECT h.id FROM moz_places h WHERE url = :page_url AND last_visit_date NOTNULL");
      stmt.params.page_url = href;
      var dblistener = new dbListener();
      dblistener.button = button;
      stmt.executeAsync(dblistener);
      stmt.finalize();
    } else {
      let stmt = placesDB.createStatement("SELECT h.id FROM moz_places h WHERE url = :page_url AND last_visit_date NOTNULL");
      stmt.params.page_url = href;
      var dblistener = new dbListener();
      dblistener.button = button;
      stmt.executeAsync(dblistener);
      stmt.finalize();
    }
  }

  /* We delay some of the more complex initialization in case the button isn't going to be there */
  function initButton(button) {
    button.addEventListener("mouseover", function() {
        paused = true;
      },
      false);
    button.addEventListener("mouseout", function() {
        paused = false;
      },
      false);
    button.addEventListener("command", openItem, false);
    button.addEventListener("click", function(event) {
        /* only handle middle mouse click */
        if (event.button == 1) {
          /* If it is not an ad, remove it */
          if (event.target.getAttribute("class") != "blackbird-ticker-ad") {
            /* Don't allow two ads to be next to each other */
            if ((event.target.previousSibling && event.target.previousSibling.getAttribute("class") == "blackbird-ticker-ad") &&
               (event.target.nextSibling && event.target.nextSibling.getAttribute("class") == "blackbird-ticker-ad")) {
              event.target.parentNode.removeChild(event.target.nextSibling);
            }
            event.target.parentNode.removeChild(event.target);
          }
          openUILink(event.target.getAttribute("href"), event)
        }
      },
      false);
  }

  function createButton(label, href, ad) {
    var button = document.createElement("toolbarbutton");
    if (ad) {
      button.setAttribute("class", "blackbird-ticker-ad");
    } else {
      button.setAttribute("class", "blackbird-ticker-item");
      button.setAttribute("tooltip", "blackbird-item-tooltip");
      /* Might want to do a custom context menu for ads */
      button.setAttribute("context", "blackbird-item-contextmenu");
    }
    button.setAttribute("label", label);
    button.setAttribute("href", href);
    button.hidden = true;
    ticker.appendChild(button);
    if (!ad) {
      isVisited(button, href);
    }
    return button;
  }

  function addFeedToTicker(feedXML, feedURL) {
    var hasAd = false;
    var feed = new TickerFeed(feedXML, feedURL);
    var feedURI = makeURI(feedURL);
    var itemCount = feed.getItemCount();
    if (limitItemsPerFeed && (itemCount > itemsPerFeed)) {
      itemCount = itemsPerFeed;
    }
    numButtonsLeft += itemCount;
    numFeedsLeft--;
    for (var i=0; i < itemCount; i++) {
      var feedItem = feed.getItem(i);
      var button = createButton(feedItem.title, feedItem.link);
      button.setAttribute("image", "http://" + feedURI.host + "/favicon.ico")
      button.feed = feed.getTitle();
      if (feedItem.content.length > 200) {
        button.description = feedItem.content.substring(0, feedItem.content.indexOf(" ",200)) + "..."; 
      } else {
        button.description = feedItem.content;
      }
    }
    paused = false;
  }

  function getTickerFeed(feedURL, callback) {
    var req = new XMLHttpRequest();
    var url = feedURL;
    req.open("GET", url,true);
    req.overrideMimeType("application/xml");
    req.onload = function() {
      addFeedToTicker(req.responseXML, feedURL);
    }
    req.send(null); 
  }

  var spacer;

  var addedResizeListener = false;

  function adjustSpacerWidth() {
    if (!addedResizeListener) {
        window.addEventListener("resize", adjustSpacerWidth, false);
    }

    if (spacer) {
      var tickerWidth = parseInt(ticker.boxObject.width);
      var tickerItemsWidth = 0;
      for (var i=0; i < ticker.childNodes.length; i++) {
        if (ticker.nodeName != "spacer") {
          tickerItemsWidth += ticker.childNodes[i].boxObject.width;
          if (tickerItemsWidth > tickerWidth) {
            break;
          }
        }
      }
      if (tickerItemsWidth < tickerWidth) {
        spacer.style.width = tickerWidth - tickerItemsWidth + "px";
      }
    }
  }

  var numButtonsLeft;
  var numFeedsLeft;

  function updateTicker() {
    tickTimer.cancel();
    tickTimer.initWithCallback(tick, tickSpeed * (500 / ticksPerItem), Components.interfaces.nsITimer.TYPE_REPEATING_SLACK)

    numButtonsLeft = 0;
    paused = true;
    if (!ticker) {
      ticker = document.getElementById("blackbird-ticker");
    }
    while(ticker.hasChildNodes()) {
      ticker.removeChild(ticker.firstChild);
    }
    spacer = document.createElement("spacer");
    ticker.appendChild(spacer);

    numItems = 0;
    var feedURLS = [];
    try {
      feedURLS = JSON.parse(BlackbirdServices.bbprefs.getCharPref("rssticker.feeds"));
    } catch (ex) {}
    if (feedURLS.length > 0) {
      numFeedsLeft = feedURLS.length;
      for (var i=0; i < feedURLS.length; i++) {
        getTickerFeed(feedURLS[i]);
      }
    }
  }

  function tick() {
    if (paused) {
      return;
    }
    var node, nodeWidth, marginLeft;
    if (ticker.childNodes.length > 1){
      if (currentFirstItemMargin <= (ticker.firstChild.boxObject.width * -1)){
        node = ticker.firstChild;
        ticker.removeChild(node);
        currentFirstItemMargin = 0;
        node.style.marginLeft = '0px';
        ticker.appendChild(node);
      } else if (this.currentFirstItemMargin > 0){
        // Move the last child back to the front.
        node = ticker.lastChild;
        ticker.removeChild(node);
        // Set the correct margins
        nodeWidth = node.boxObject.width;
        marginLeft = parseInt((0 - nodeWidth) + this.currentFirstItemMargin);

         node.style.marginLeft = marginLeft + "px";
        currentFirstItemMargin = marginLeft;
        ticker.firstChild.style.marginLeft = 0;
        ticker.insertBefore(node, ticker.firstChild);
      } else {
        currentFirstItemMargin -= (200 / ticksPerItem);
        ticker.firstChild.style.marginLeft = currentFirstItemMargin + "px";
      }
    }
  }

  function insertTBButton(buttonID, beforeID) {
    var navBar = document.getElementById("nav-bar");
    var before;
    if (beforeID) {
      before = document.getElementById(beforeID);
    }
    var newSet;
    if (navBar) {
      var newButton;
      if (before) {
        newButton = navBar.insertItem(buttonID, before);
      } else {
        newButton = navBar.insertItem(buttonID, before, null, false);
      }
      if (navBar.hasAttribute("currentset") && 
          (navBar.getAttribute("currentset").indexOf(buttonID) == -1)) {
        newSet = navBar.getAttribute("currentset");
      } else {
        newSet = navBar.getAttribute('defaultset');
      }
      if (before) {
        newSet = newSet.replace("," + beforeID, "," + buttonID + "," + beforeID);
      } else {
        newSet += "," + buttonID;
      }
      navBar.setAttribute('currentset', newSet);
      document.persist('nav-bar', 'currentset');
    }
    if (!newButton || !navBar) {
      window.setTimeout(function() {insertTBButton();}, 500, buttonID, beforeID);
    }
  }

  function addFeed(event) {
    if (event.target.hasAttribute("feed")) {
      var feeds = JSON.parse(BlackbirdServices.bbprefs.getCharPref("rssticker.feeds"));
      feeds.push(event.target.getAttribute("feed"));
      BlackbirdServices.bbprefs.setCharPref("rssticker.feeds", JSON.stringify(feeds));
    }
  }

  /* I'd rather have a menu but it is just not working. I must be losing my mind */
  function onPageLoad(event) {
    if (event.target instanceof HTMLDocument) {
      if (!gBrowser.getBrowserForDocument(event.target)) {
        return;
      }
      var feeds = gBrowser.getBrowserForDocument(event.target).feeds;
      var itemAddMenu = document.getElementById("blackbird-item-contextmenu-add");
      var itemAddSeparator = document.getElementById("blackbird-item-contextmenu-addseparator");
      var tickerAddMenu = document.getElementById("blackbird-ticker-contextmenu-add");
      var tickerAddSeparator = document.getElementById("blackbird-ticker-contextmenu-addseparator");
      if (feeds) {
        itemAddMenu.hidden = false;
        itemAddSeparator.hidden = false;
        tickerAddMenu.hidden = false;
        tickerAddSeparator.hidden = false;
        itemAddMenu.setAttribute("label", itemAddMenu.getAttribute("origlabel") + " " + feeds[0].title);
        tickerAddMenu.setAttribute("label", tickerAddMenu.getAttribute("origlabel") + " " + feeds[0].title);
        itemAddMenu.setAttribute("feed", feeds[0].href);
        tickerAddMenu.setAttribute("feed", feeds[0].href);
      } else {
        itemAddMenu.hidden = true;
        itemAddSeparator.hidden = true;
        tickerAddMenu.hidden = true;
        tickerAddSeparator.hidden = true;
      }
    }
  }

  var prefObserver = {
    observe: function observe(subject, topic, data) {
      switch (data) {
        case "rssticker.boldUnvisited":
          boldUnvisited = BlackbirdServices.bbprefs.getBoolPref("rssticker.boldUnvisited");
          updateTicker();
          break;
        case "rssticker.hideVisited":
          hideVisited = BlackbirdServices.bbprefs.getBoolPref("rssticker.hideVisited");
          updateTicker();
          break;
        case "rssticker.feeds":
          updateTicker();
          break;
        case "rssticker.itemsPerFeed":
          itemsPerFeed = BlackbirdServices.bbprefs.getIntPref("rssticker.itemsPerFeed");
          updateTicker();
          break;
        case "rssticker.limitItemsPerFeed":
          limitItemsPerFeed = BlackbirdServices.bbprefs.getBoolPref("rssticker.limitItemsPerFeed");
          updateTicker();
          break;
        case "rssticker.ticksPerItem":
          ticksPerItem = BlackbirdServices.bbprefs.getIntPref("rssticker.ticksPerItem");
          updateTicker();
          break;
        case "rssticker.tickSpeed":
          tickSpeed = BlackbirdServices.bbprefs.getIntPref("rssticker.tickSpeed");
          updateTicker();
          break;
      }
    }
  }

  function initializePreferences() {
    boldUnvisited = BlackbirdServices.bbprefs.getBoolPref("rssticker.boldUnvisited");
    hideVisited = BlackbirdServices.bbprefs.getBoolPref("rssticker.hideVisited");
    limitItemsPerFeed = BlackbirdServices.bbprefs.getBoolPref("rssticker.limitItemsPerFeed");
    itemsPerFeed = BlackbirdServices.bbprefs.getIntPref("rssticker.itemsPerFeed");
    ticksPerItem = BlackbirdServices.bbprefs.getIntPref("rssticker.ticksPerItem");
    tickSpeed = BlackbirdServices.bbprefs.getIntPref("rssticker.tickSpeed");
  }

  function initWithConfig(config) {
    if ("feeds" in config) {
      if (!BlackbirdServices.bbprefs.prefHasUserValue("rssticker.feeds")) {
        BlackbirdServices.bbprefs.setCharPref("rssticker.feeds", JSON.stringify(config.feeds));
      }
    }
    if ("magnify" in config) {
      if (config.magnify) {
        document.getElementById("blackbird-magnify-controls").hidden = false;
      }
    }
    if ("adfeed" in config) {
      var req = new XMLHttpRequest();
      
      req.open("GET", config.adfeed);
      req.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
      req.onload = function() {
        adfeed = new TickerFeed(req.responseXML, config.adfeed);
      }
      req.send();
    }
    if ("links" in config) {
      var links = document.getElementById("blackbird-links");
      if ("label" in config.links) {
        links.setAttribute("label", config.links.label);
      }
      links.removeAttribute("hidden");
      var linksmenu = document.getElementById("blackbird-links-menu");
      for (var i=0; i < config.links.menu.length; i++) {
        if ("menu" in config.links.menu[i]) {
          var menu = document.createElement("menu");
          menu.setAttribute("label", config.links.menu[i].label);
          var menupopup = document.createElement("menupopup");
          menu.appendChild(menupopup);
          for (var j=0; j < config.links.menu[i].menu.length; j++) {
            var menuitem = document.createElement("menuitem");
            menuitem.setAttribute("label", config.links.menu[i].menu[j].label);
            menuitem.setAttribute("href", config.links.menu[i].menu[j].href);
            menupopup.appendChild(menuitem);
          }
          linksmenu.appendChild(menu);
        } else {
          var menuitem = document.createElement("menuitem");
          menuitem.setAttribute("label", config.links.menu[i].label);
          menuitem.setAttribute("href", config.links.menu[i].href);
          linksmenu.appendChild(menuitem);
        }
      }
      links.addEventListener("command", function(event) {
          openUILink(event.target.getAttribute("href"), event);
        },
        false);
    }
    updateTicker();
  }

  /* This function handles the window startup piece, initializing the UI and preferences */
  function startup()
  {
    window.removeEventListener("load", startup, false);

    var tempFeedClass = {};
    Components.utils.import("resource://blackbird/feed.class.jsm", tempFeedClass);
    TickerFeed = tempFeedClass.TickerFeed;
    var tempBlackbirdServices = {};
    Components.utils.import("resource://blackbird/BlackbirdServices.jsm", tempBlackbirdServices);
    BlackbirdServices = tempBlackbirdServices.BlackbirdServices;
    var temp = {};
    Components.utils.import("resource://gre/modules/LightweightThemeManager.jsm", temp);
    lwtm = temp.LightweightThemeManager;

    firstrun = BlackbirdServices.bbprefs.getBoolPref("firstrun");

    var curVersion = "1.0";

    insertTBButton("blackbird-toolbar-button");

    BlackbirdServices.prefs.setCharPref("browser.startup.homepage", "http://blackbirdhome.com/start/|http://blackbirdhome.com/offers/");
    if (firstrun) {
      window.setTimeout(function(){
        gBrowser.selectedTab = gBrowser.addTab("http://blackbirdhome.com/start/firstrun");
      }, 1000); //Firefox 2 fix - or else tab will get closed
      BlackbirdServices.bbprefs.setBoolPref("firstrun", false);
      BlackbirdServices.bbprefs.setCharPref("installedVersion", curVersion);
    } else {
      var installedVersion = BlackbirdServices.bbprefs.getCharPref("installedVersion");
      if (curVersion > installedVersion) {
        window.setTimeout(function(){
//          gBrowser.selectedTab = gBrowser.addTab("http://blackbirdhome.com/start/upgrade");
        }, 1000); //Firefox 2 fix - or else tab will get closed
        BlackbirdServices.bbprefs.setCharPref("installedVersion", curVersion);
      }
    }

    initializePreferences();

    tickTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);

    var req = new XMLHttpRequest();
    
    configURL = BlackbirdServices.bbprefs.getCharPref("configURL");
    
    req.open("GET", configURL);
    req.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
    req.overrideMimeType("application/json");
    req.onload = function() {
      try {
        blackbirdConfig = JSON.parse(req.responseText);
        BlackbirdServices.bbprefs.setCharPref("config", JSON.stringify(blackbirdConfig));
        /* These things are only done if something comes over the wire and it parses */
        if ("persona" in blackbirdConfig) {
          var lastPersona = "";
          if (BlackbirdServices.bbprefs.prefHasUserValue("lastPersona")) {
            lastPersona = BlackbirdServices.bbprefs.getCharPref("lastPersona");
          }
          if (blackbirdConfig.persona.id != lastPersona) {
            BlackbirdServices.bbprefs.setCharPref("lastPersona", blackbirdConfig.persona.id);
            lwtm.currentTheme = blackbirdConfig.persona;
          }
        }
        if ("offer" in blackbirdConfig) {
          var lastOffer = "";
          if (BlackbirdServices.bbprefs.prefHasUserValue("lastOffer")) {
            lastOffer = BlackbirdServices.bbprefs.getCharPref("lastOffer");
          }
          if (blackbirdConfig.offer != lastOffer) {
            BlackbirdServices.bbprefs.setCharPref("lastOffer", blackbirdConfig.offer);
            gBrowser.selectedTab = gBrowser.addTab(blackbirdConfig.offer);
          }
        }
        if ("homepage" in blackbirdConfig && firstrun) {
          BlackbirdServices.prefs.setCharPref("browser.startup.homepage", blackbirdConfig.homepage)
        }
      } catch (ex) {
        try {
          blackbirdConfig = JSON.parse(BlackbirdServices.bbprefs.getCharPref("config"));
        } catch (ex) {
          alert("Unable to get initial configuration");
        }
      }
      initWithConfig(blackbirdConfig);
    }
    req.onerror = function() {
      try {
        blackbirdConfig = JSON.parse(BlackbirdServices.bbprefs.getCharPref("config"));
        initWithConfig(blackbirdConfig);
      } catch (ex) {
        alert("Unable to get initial configuration");
      }
    }
    req.send(null);

    document.getElementById("blackbird-item-contextmenu-open").addEventListener("command", openItem, false);
    document.getElementById("blackbird-item-contextmenu-opennewtab").addEventListener("command", openItemNewTab, false);
    document.getElementById("blackbird-item-contextmenu-markasread").addEventListener("command", markItemAsRead, false);
    document.getElementById("blackbird-item-contextmenu-markallread").addEventListener("command", markAllRead, false);
    document.getElementById("blackbird-item-contextmenu-markfeedread").addEventListener("command", markFeedRead, false);
    document.getElementById("blackbird-item-contextmenu-add").addEventListener("command", addFeed, false);
    document.getElementById("blackbird-ticker-contextmenu-add").addEventListener("command", addFeed, false);
    document.getElementById("blackbird-item-tooltip").addEventListener("popupshowing", populateTooltip, false);

    document.getElementById("blackbird-item-contextmenu").addEventListener("mouseover", function() {
        paused = true;
      },
      false);
    document.getElementById("blackbird-item-contextmenu").addEventListener("popuphiding", function() {
        paused = false;
      },
      false);



    BlackbirdServices.bbprefs.addObserver("", prefObserver, false);

    var appcontent = document.getElementById("appcontent");
    if(appcontent) {
      appcontent.addEventListener("DOMContentLoaded", onPageLoad, false);
    }
    
    placesDB = Components.classes['@mozilla.org/browser/nav-history-service;1'].getService(Components.interfaces.nsPIPlacesDatabase).DBConnection;  
  }

  function shutdown()
  {
    window.removeEventListener("unload", shutdown, false);

    window.removeEventListener("resize", adjustSpacerWidth, false);
    document.getElementById("blackbird-item-contextmenu-open").removeEventListener("command", openItem, false);
    document.getElementById("blackbird-item-contextmenu-opennewtab").removeEventListener("command", openItemNewTab, false);
    document.getElementById("blackbird-item-contextmenu-markasread").removeEventListener("command", markItemAsRead, false);
    document.getElementById("blackbird-item-contextmenu-markfeedread").removeEventListener("command", markFeedRead, false);
    document.getElementById("blackbird-item-contextmenu-markallread").removeEventListener("command", markAllRead, false);
    document.getElementById("blackbird-item-contextmenu-add").removeEventListener("command", addFeed, false);
    document.getElementById("blackbird-toolbar-contextmenu-add").removeEventListener("command", addFeed, false);
    document.getElementById("blackbird-item-tooltip").removeEventListener("popupshowing", populateTooltip, false);




    BlackbirdServices.bbprefs.removeObserver("", prefObserver);
    var appcontent = document.getElementById("appcontent");
    if(appcontent) {
      appcontent.removeEventListener("DOMContentLoaded", onPageLoad, false);
    }
  }

  window.addEventListener("load", startup, false);
  window.addEventListener("unload", shutdown, false);
})();

