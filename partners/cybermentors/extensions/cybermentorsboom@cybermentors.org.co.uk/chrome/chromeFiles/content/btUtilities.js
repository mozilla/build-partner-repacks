/* This filech contains helper functions */
/* It has to be included AFTER btClient.js */

BrandThunder.initialize = function(brandObject) {
  var prefbranch=Components.classes["@mozilla.org/preferences-service;1"]
                           .getService(Components.interfaces.nsIPrefBranch);

  if (!brandObject.utilities) {
    brandObject.utilities = {};
  }
  function log(string) {
    var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);   
    aConsoleService.logStringMessage(string);
  }
  /* This function uses the presence of a rebranding extension to indicate */
  /* That this is a full build, not just the extension/theme */
  function isFullBuild(brandObject) {
    var em = Components.classes["@mozilla.org/extensions/manager;1"]
                       .getService(Components.interfaces.nsIExtensionManager);
    if (em.getInstallLocation(brandObject.rebrandID)) {
      return true;
    }
    return false;    
  }
  function openLink(brandObject, event, url) {
    if (typeof(url) == "undefined") {
      url = brandObject.urls[event.target.id];
    }
    if (brandObject.redirect && !url.match("redirect.php") && !url.match("faq.php") && !url.match("firstrun.php")  && !url.match("getsatisfaction.com")) {
      url = brandObject.redirect + "?url=" + url;
    }
    if (url.match("redirect.php")) {
      url += "&client=" + brandObject.releaseIdentifier;
      //var curLang = "en";
      //try {
      //  curLang = Components.classes["@mozilla.org/preferences-service;1"]
      //                        .getService(Components.interfaces.nsIPrefService)
      //                        .getBranch(null)
      //                        .getCharPref("general.useragent.locale")
      //                        .substr(0,2);
      //}
      //catch (e) {}
      //if (curLang != "en") {
      //  url += "&lang=" + curLang;
      //}
    }
    
    
    
  //  openUILink(url, event);
    var tab = getBrowser().addTab(url);
    getBrowser().selectedTab = tab;
    return;
  }
  function restartApp() {
    // Notify all windows that an application quit has been requested.
    var os = Components.classes["@mozilla.org/observer-service;1"]
                       .getService(Components.interfaces.nsIObserverService);
    var cancelQuit = Components.classes["@mozilla.org/supports-PRBool;1"]
                               .createInstance(Components.interfaces.nsISupportsPRBool);
    os.notifyObservers(cancelQuit, "quit-application-requested", "restart");
  
    // Something aborted the quit process.
    if (cancelQuit.data)
      return;
    var nsIAppStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                                        .getService(Components.interfaces.nsIAppStartup);
    nsIAppStartup.quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);    
  }
  /* This function generates a release identifier of the form: */
  /* 001-Brand# (to be assigned per brand as they come in) */
  /* X = Type of release (x = xpi, e = exe, d = dmg, file extension) */
  /* 001- Release Version (just incremented by 1 for each release for the brand) */
  /* US - country (US, CA, etc) */
  function getReleaseIdentifier(brandObject) {
    var releaseIdentifier = brandObject.clientCode;
    if (brandObject.utilities.isFullBuild(brandObject)) {
      var OS = Components.classes["@mozilla.org/xre/app-info;1"]
                         .getService(Components.interfaces.nsIXULRuntime)
                         .OS;
      if (OS == "Darwin") {
        releaseIdentifier += "D";
      } else {
        releaseIdentifier += "E";
      }
    } else {
	  var rdfs = Components.classes["@mozilla.org/rdf/rdf-service;1"]
						   .getService(Components.interfaces.nsIRDFService);
	  var extensionDS= Components.classes["@mozilla.org/extensions/manager;1"]
								 .getService(Components.interfaces.nsIExtensionManager).datasource;
	  var extension = rdfs.GetResource("urn:mozilla:item:" + brandObject.extensionID);
  
	  var arc = rdfs.GetResource("http://www.mozilla.org/2004/em-rdf#updateURL");
	  var updateURL = extensionDS.GetTarget(extension, arc, true);
	  if (updateURL) {
        releaseIdentifier += "X";
	  } else {
        releaseIdentifier += "A";
	  }
    }
    releaseIdentifier += brandObject.clientVersion;
    releaseIdentifier += brandObject.clientCountry;
  
    return releaseIdentifier;
  }
  function addToPermissionManager(domain) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                              .getService(Components.interfaces.nsIIOService);
    var pm = Components.classes["@mozilla.org/permissionmanager;1"]
                       .getService(Components.interfaces.nsIPermissionManager);

    var uri = ioService.newURI("http://" + domain, null, null);
    pm.add(uri, "popup", 1);
    pm.add(uri, "install", 1);
  }

  function updateSearchEngine(brandObject) {
    var searchSvc = Components.classes["@mozilla.org/browser/search-service;1"]
                              .getService(Components.interfaces.nsIBrowserSearchService);

    var currentEngine = searchSvc.currentEngine;
    var visibleEngines = searchSvc.getVisibleEngines({});
    var askPosition;
    var yahooPosition;
    if (brandObject.askOriginCode) {
      var askEngine = searchSvc.getEngineByName("Ask");
      /* If there is a BT Ask, replace it */
      if (askEngine && askEngine.description == "Ask - BT") {
        var submission = askEngine.getSubmission("test", null);
        if (!submission.uri.path.match(brandObject.askOriginCode)) {
          for (let i=0; i < visibleEngines.length; i++) {
            if (visibleEngines[i].description == "Ask - BT") {
              askPosition = i;
            }
          }
          searchSvc.removeEngine(askEngine);
          searchSvc.addEngineWithDetails("Ask", "data:image/x-icon;base64,AAABAAEAEBAAAAEACABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAQAEAAAAAAAAAAAAAAAEAAAAAAACbm5sAAADJAAAA1gAAANMAAADYAAAAyACcnJ0AAADLAAEBywDCwsAAjIy2AH9/gwBdXa4AAAC5AAAAygAwMOEAMjLgADMzvQAEBHwAaGipAAAAzwCtsLEAhYWgAAsLygDq6toAQkK3AGZnigA5O84ACAiuANjY3wAICIsAAADAAGVljgAEBIQAAADfAGNiegAREZAAwsLzAAcHkwAEBZ0Ag4jOAC0twAALC7QAqK7dAKSq1wBycqQABATQAPT04ACYm74ARkaOALO09wAmJnQAJSXJADw9fwAzNc4ALzDCAHp6pACdnZkApKevAL29sQD5+foAkpKcAOzs4AAMDMoAPj7iAKGinACvr6oAT0/wAAwNyQAAANIAlJTaAN/f0QCcnZ0AAADRAF5erQAAAJ8AAADDAAAAzAA1NrwAMTGfAAkJ1QAAAMQAWlqvAHJ31wDMzMAAFhbHAAAAiQBERNIA8fHmAAgI1gCys6oAu7v4AD09ngDDwfoABgbOAM7N9wCYmPUAKyuOABkZmgAyMsEAiYq8AHp68gDDw5sAAgLPALW2rwCdnZgAAAC9AAMD1wCenpgA9fX1AAAArQCCgrIA0dLYAK+vnwB3e9kA5ubSAOfn+AClp6cA3NzDAMHHygBQU9MABATCAG5z2gAcHMQAio/aAAAA2QD19fwAnaHIAIaGogDm5uoAk5N0AK+ytAAMDNUAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////////////////////////////+DBgAAAAAASBX///////8GEzQ/Ll5VEUo9aXX///86e08hAg1qUUUiaymAOXf/NxQlglZvIzgzHksFeQxs/xcBEG1aWC1lc2YgCmEEUkE2BwFdaHAkQ3RGRxgqAmcWKwgFD1Q7Yn4xYzx2En0DGf9TBwFbLyZgCVwdQgtuBE7//3xEQD4nA1BZgTVXHwIw/////3pkHEkOTV8aTIR//////////yxyeBsycSj/////////////////////////////////////////////////AAD//wAA//8AAMAfAACABwAAAAEAAAABAAAAAAAAAAAAAAAAAACAAAAAwAAAAPABAAD8BwAA//8AAP//AAA=",
                                         "", "Ask - BT", "GET",
                                         "http://www.ask.com/web?q={searchTerms}&o=" + brandObject.askOriginCode + "&l=dis");
          var newAskEngine = searchSvc.getEngineByName("Ask");
          if (currentEngine == askEngine) {
            searchSvc.currentEngine = newAskEngine;
          }
          searchSvc.moveEngine(newAskEngine, askPosition);
        }
      }
    }
    var yahooEngine = searchSvc.getEngineByName("Yahoo!");
    /* If there is a BT Ask, replace it */
    if (yahooEngine && yahooEngine.description == "Yahoo! - BT") {
      var submission = yahooEngine.getSubmission("test", null);
      if (!submission.uri.path.match(brandObject.releaseIdentifier)) {
        for (let i=0; i < visibleEngines.length; i++) {
          if (visibleEngines[i].description == "Yahoo! - BT") {
            yahooPosition = i;
          }
        }
        searchSvc.removeEngine(yahooEngine);
        searchSvc.addEngineWithDetails("Yahoo!", "data:image/x-icon;base64,R0lGODlhEAAQAJECAP8AAAAAAP///wAAACH5BAEAAAIALAAAAAAQABAAAAIplI+py+0NogQuyBDEnEd2kHkfFWUamEzmpZSfmaIHPHrRguUm/fT+UwAAOw==",
                                       "", "Yahoo! - BT", "GET",
                                       "http://search.yahoo.com/search?ei=utf-8&fr=chrff-brandt_off&p={searchTerms}&type=" + brandObject.releaseIdentifier);
        var newYahooEngine = searchSvc.getEngineByName("Yahoo!");
        if (currentEngine == yahooEngine) {
          searchSvc.currentEngine = newYahooEngine;
        }
        searchSvc.moveEngine(newYahooEngine, yahooPosition);
      }
    }    
  }

  function addSearchEngine(brandObject, replace) {
    var searchSvc = Components.classes["@mozilla.org/browser/search-service;1"]
                              .getService(Components.interfaces.nsIBrowserSearchService);
  
    if (brandObject.askOriginCode) {
      /* If they don't have an Ask, add it */
      var askEngine1 = searchSvc.getEngineByName("Ask");
      /* If there is a BT Ask, remove it - we're going to readd */
      if (askEngine1 && askEngine1.description == "Ask - BT") {
        searchSvc.removeEngine(askEngine1);
        askEngine1 = undefined;
      }
      var askEngine2 = searchSvc.getEngineByName("Ask.com");
      if (!askEngine1 && !askEngine2) {
        searchSvc.addEngineWithDetails("Ask", "data:image/x-icon;base64,AAABAAEAEBAAAAEACABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAQAEAAAAAAAAAAAAAAAEAAAAAAACbm5sAAADJAAAA1gAAANMAAADYAAAAyACcnJ0AAADLAAEBywDCwsAAjIy2AH9/gwBdXa4AAAC5AAAAygAwMOEAMjLgADMzvQAEBHwAaGipAAAAzwCtsLEAhYWgAAsLygDq6toAQkK3AGZnigA5O84ACAiuANjY3wAICIsAAADAAGVljgAEBIQAAADfAGNiegAREZAAwsLzAAcHkwAEBZ0Ag4jOAC0twAALC7QAqK7dAKSq1wBycqQABATQAPT04ACYm74ARkaOALO09wAmJnQAJSXJADw9fwAzNc4ALzDCAHp6pACdnZkApKevAL29sQD5+foAkpKcAOzs4AAMDMoAPj7iAKGinACvr6oAT0/wAAwNyQAAANIAlJTaAN/f0QCcnZ0AAADRAF5erQAAAJ8AAADDAAAAzAA1NrwAMTGfAAkJ1QAAAMQAWlqvAHJ31wDMzMAAFhbHAAAAiQBERNIA8fHmAAgI1gCys6oAu7v4AD09ngDDwfoABgbOAM7N9wCYmPUAKyuOABkZmgAyMsEAiYq8AHp68gDDw5sAAgLPALW2rwCdnZgAAAC9AAMD1wCenpgA9fX1AAAArQCCgrIA0dLYAK+vnwB3e9kA5ubSAOfn+AClp6cA3NzDAMHHygBQU9MABATCAG5z2gAcHMQAio/aAAAA2QD19fwAnaHIAIaGogDm5uoAk5N0AK+ytAAMDNUAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////////////////////////////+DBgAAAAAASBX///////8GEzQ/Ll5VEUo9aXX///86e08hAg1qUUUiaymAOXf/NxQlglZvIzgzHksFeQxs/xcBEG1aWC1lc2YgCmEEUkE2BwFdaHAkQ3RGRxgqAmcWKwgFD1Q7Yn4xYzx2En0DGf9TBwFbLyZgCVwdQgtuBE7//3xEQD4nA1BZgTVXHwIw/////3pkHEkOTV8aTIR//////////yxyeBsycSj/////////////////////////////////////////////////AAD//wAA//8AAMAfAACABwAAAAEAAAABAAAAAAAAAAAAAAAAAACAAAAAwAAAAPABAAD8BwAA//8AAP//AAA=",
                                       "", "Ask - BT", "GET",
                                       "http://www.ask.com/web?q={searchTerms}&o=" + brandObject.askOriginCode + "&l=dis");
      }
    }
  
    /* If we're not replacing, bail if the selected engine is Yahoo */
    /* We don't bail for Yahoo! because that's ours, and we're going to replace it */
    if (!replace) {
      try {
        var selectedEngine = prefbranch.getCharPref("browser.search.selectedEngine");
      } catch (ex) {
        var selectedEngine = searchSvc.currentEngine.name;
      }
      if (selectedEngine == "Yahoo") {
        return;
      }
    }

    var oldYahooEngine = searchSvc.getEngineByName("Yahoo");
    if (oldYahooEngine) {
      searchSvc.removeEngine(oldYahooEngine);
    }
    var btEngine = searchSvc.getEngineByName("Yahoo!");
    if (btEngine) {
      searchSvc.removeEngine(btEngine);
    }  try {
      searchSvc.addEngineWithDetails("Yahoo!", "data:image/x-icon;base64,R0lGODlhEAAQAJECAP8AAAAAAP///wAAACH5BAEAAAIALAAAAAAQABAAAAIplI+py+0NogQuyBDEnEd2kHkfFWUamEzmpZSfmaIHPHrRguUm/fT+UwAAOw==",
                                     "", "Yahoo! - BT", "GET",
                                     "http://search.yahoo.com/search?ei=utf-8&fr=chrff-brandt_off&p={searchTerms}&type=" + brandObject.releaseIdentifier);
    } catch (ex) {
  
    }
    if (brandObject.askOriginCode) {
      var askEngine = searchSvc.getEngineByName("Ask");
      if (askEngine && askEngine.description == "Ask - BT") {
        searchSvc.moveEngine(askEngine, 0);
      }
    }
    var newYahooEngine = searchSvc.getEngineByName("Yahoo!");
    if (newYahooEngine) {
      searchSvc.moveEngine(newYahooEngine, 0);
      searchSvc.currentEngine = newYahooEngine;
    }  
  }

  function addBookmark(title, url, container) {
	if (!container) {
	  container = bookmarks.bookmarksMenuFolder;
	}
    var bookmarks = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                              .getService(Components.interfaces.nsINavBookmarksService);
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                .getService(Components.interfaces.nsIIOService);
    var uri = ioService.newURI(url, null, null);
    bookmarks.insertBookmark(container, uri, -1, title);
  }

  function getButtonsFromFile(clientShortName) {
    const MODE_RDONLY   = 0x01;
    const PERMS_FILE    = 0644;
    
    var buttons = [];

    var btxml = Components.classes["@mozilla.org/file/directory_service;1"]
                          .getService(Components.interfaces.nsIProperties)
                          .get("ProfD", Components.interfaces.nsILocalFile);
    btxml.append("brandthunder");
    btxml.append(clientShortName + ".xml");
    if (btxml.exists()) {
      var fileInStream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                                   .createInstance(Components.interfaces.nsIFileInputStream);
      var cis = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
                          .createInstance(Components.interfaces.nsIConverterInputStream);

      fileInStream.init(btxml, MODE_RDONLY, PERMS_FILE, false);
      cis.init(fileInStream,  null, btxml.fileSize, Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
      var xmlFile = {value:null};
      cis.readString(btxml.fileSize, xmlFile);
      cis.close();


      var domParser = new DOMParser();
      var doc = domParser.parseFromString(xmlFile.value, "text/xml");
      buttons = doc.getElementsByTagName("button");
    }
    return buttons;
  }
  function toggleTheme(brandObject) {
    var btPrefBranch = Components.classes["@mozilla.org/preferences-service;1"]
                                 .getService(Components.interfaces.nsIPrefService)
                                 .getBranch("extensions.brandthunder.");
    
    var dynamicBoom = false;
    try {
      dynamicBoom = btPrefBranch.getBoolPref("dynamicBoom");
    } catch (ex) {}


    if (!dynamicBoom && (prefbranch.getCharPref("general.skins.selectedSkin") != "classic/1.0")) {
      return;      
    }


    var currentBoom = btPrefBranch.getCharPref("currentBoom");
    var bigBoom = true;
    try {
      bigBoom = btPrefBranch.getBoolPref("bigBoom");
    } catch (ex) {
    }    
    if (bigBoom) {
      var boomClient;
      for (let i in BrandThunder.clients) {
        for (let j in BrandThunder.clients[i].booms) {
          if (j == currentBoom) {
            boomClient = i;
            break;
          }
        }
      }
      if (brandObject && (boomClient != brandObject.shortName)) {
        return;
      }
      document.getElementById("main-window").setAttribute("btBoom", currentBoom);
      document.getElementById("main-window").setAttribute("bt-theme", currentBoom);
      document.getElementById("main-window").setAttribute("btClient", boomClient);
    } else {
      document.getElementById("main-window").removeAttribute("btBoom");
      document.getElementById("main-window").removeAttribute("bt-theme");
      document.getElementById("main-window").removeAttribute("btClient");
    }
  }
  function switchBoom(brandObject, boomSwitch) {
    var btPrefBranch = Components.classes["@mozilla.org/preferences-service;1"]
                                 .getService(Components.interfaces.nsIPrefService)
                                 .getBranch("extensions.brandthunder.");

    /* Get the current boom */
    var currentBoom = btPrefBranch.getCharPref("currentBoom");

    /* Find the client that corresponds to the current boom */
    var boomClient;
    for (let i in BrandThunder.clients) {
      for (let j in BrandThunder.clients[i].booms) {
        if (j == currentBoom) {
          boomClient = i;
          break;
        }
      }
    }
    /* If we didn't find a boomClient, must be invalid currentBoom */
    /* Set currentBoom and return. We'll come back through this code again */
    if (!boomClient) {
      for (let i in brandObject.booms) {
        btPrefBranch.setCharPref("currentBoom", i);
        return; 
      }
    } else {
      if (boomClient != brandObject.shortName) {
        return;
      }
    }
    /* If boomSwitch is set, this came as the result of the pref change */
    /* Set the pref and let the big boom come through toggleTheme as a */
    /* result of the pref change. Otherwise, call toggleTheme directly */
    var bigBoom= true;
    try {
      bigBoom = btPrefBranch.getBoolPref("bigBoom");
    } catch (ex) {
    }
    if (!bigBoom && boomSwitch) {
      btPrefBranch.setBoolPref("bigBoom", true);
    } else {
      toggleTheme(brandObject);
    }

    /* Figure out which toolbar applies to the current boom */
    /* Note this can be either a boom specific toolbar or a client specific toolbar */
    var toolbarRDF;
    var boomToolbar;
    var toolbar = document.getElementById("bt-" + currentBoom + "-toolbar");
    if (toolbar) {
      boomToolbar = currentBoom;
      toolbarRDF = "chrome://browser/content/browser.xul#bt-" + currentBoom + "-toolbar";
    } else {
      /* Might be a client toolbar */
      toolbar = document.getElementById("bt-" + boomClient + "-toolbar");
      if (toolbar) {
        boomToolbar = boomClient;
        toolbarRDF = "chrome://browser/content/browser.xul#bt-" + boomClient + "-toolbar";
      }
    }
    /* If we have a toolbar, show it */
    if (toolbar) {
      /* Honor user's collapsed settings */
      try {
        var rdf = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
        var dataSource = rdf.GetDataSource("rdf:local-store");
        var collapsedResource = rdf.GetResource("collapsed");
        toolbarRDF = rdf.GetResource(toolbarRDF);
        var target = dataSource.GetTarget(toolbarRDF, collapsedResource, true);
        if (target instanceof Components.interfaces.nsIRDFLiteral) {
          toolbar.collapsed = target.Value;
        } else {
          toolbar.collapsed = false;
        }
      } catch(ex) {
        toolbar.collapsed = false;
      }
      toolbar.setAttribute("toolbarname", toolbar.getAttribute("bt-toolbarname"));
      var navbar = document.getElementById("nav-bar");
//      if (navbar.nextSibling.id != "bt-" + currToolbar + "-toolbar") {
      if (navbar.nextSibling != toolbar) {
        navbar.parentNode.insertBefore(toolbar, navbar.nextSibling)
      }
    }

    /* Disable everything that doesn't correspond to the current toolbar */
    for (let i in BrandThunder.clients) {
      for (let j in BrandThunder.clients[i].booms) {
        if (j != boomToolbar) {
          try{
            document.getElementById("bt-" + j + "-toolbar").collapsed = true;
            document.getElementById("bt-" + j + "-toolbar").removeAttribute("toolbarname");
          } catch (ex) {}
        }
      }
      if (i != boomClient) {
          try{
            document.getElementById("bt-" + i + "-toolbar").collapsed = true;
            document.getElementById("bt-" + i + "-toolbar").removeAttribute("toolbarname");
          } catch (ex) {}        
      }
    }


    /* Figure out which sidebar applies to the current boom */
    /* Note this can be either a boom specific sidebar or a client specific sidebar */
    var boomSidebar;
    var sidebarmenu = document.getElementById("bt-" + currentBoom + "-sidebar-menu");
    if (sidebarmenu) {
      boomSidebar = currentBoom;
    } else {
      /* Might be a client toolbar */
      sidebarmenu = document.getElementById("bt-" + boomClient + "-sidebar-menu");
      if (sidebarmenu) {
        boomSidebar = boomClient;
      }
    }
    
    /* Disable everything that doesn't correspond to the current toolbar */
    for (let i in BrandThunder.clients) {
      for (let j in BrandThunder.clients[i].booms) {
        if (j != boomSidebar) {
          try{
            document.getElementById("bt-" + j + "-sidebar-menu").hidden = true;
          } catch (ex) {}
        }
      }
      if (i != boomClient) {
          try{
            document.getElementById("bt-" + i + "-sidebar-menu").hidden = true;
          } catch (ex) {}        
      }
    }

    if (sidebarmenu) {
      sidebarmenu.hidden = false;
    }
    if (!document.getElementById("sidebar-box").hidden) {
      if (document.getElementById("sidebar-box").getAttribute("src").match("btSidebar.xul")) {
        if (boomSidebar) {
          toggleSidebar("bt-" + boomSidebar + "-sidebar", true);
        } else {
          toggleSidebar();
        }
      }
    } 
  }

  function uninstall (brandObject, btClientBundle) {
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    
    var button = promptService.confirmEx(window, btClientBundle.getString("clientName"), btClientBundle.getString("uninstall.confirm"),
                                         (promptService.BUTTON_TITLE_YES * promptService.BUTTON_POS_0) +
                                         (promptService.BUTTON_TITLE_NO * promptService.BUTTON_POS_1),
                                         null, null, null, null, {});
    if (button == 0) {
      var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                      .getService(Components.interfaces.nsIObserverService);
      var em = Components.classes["@mozilla.org/extensions/manager;1"]
                         .getService(Components.interfaces.nsIExtensionManager);
      try {
        em.uninstallItem(brandObject.extensionID);
        observerService.notifyObservers(em.getItemForID(brandObject.extensionID),
                                        "em-action-requested", "item-uninstalled");
      } catch(ex) {
      }
      
      brandObject.utilities.openLink(brandObject, null, "http://brandthunder.com/uninstall.php?&type=" + brandObject.releaseIdentifier);
      
      var button = promptService.confirmEx(window, btClientBundle.getString("clientName"), btClientBundle.getString("restart.confirm"),
                                           (promptService.BUTTON_TITLE_YES * promptService.BUTTON_POS_0) +
                                           (promptService.BUTTON_TITLE_NO * promptService.BUTTON_POS_1),
                                           null, null, null, null, {});
      if (button == 0) {
        brandObject.utilities.restartApp();
      }
    }
  }

  function firstRun(brandObject, btClientBundle) {
    var firstrun = true;
    
    var btClientPrefBranch = Components.classes["@mozilla.org/preferences-service;1"]
                                 .getService(Components.interfaces.nsIPrefService)
                                 .getBranch("extensions.brandthunder." + brandObject.clientCode + ".");
    var btPrefBranch = Components.classes["@mozilla.org/preferences-service;1"]
                                 .getService(Components.interfaces.nsIPrefService)
                                 .getBranch("extensions.brandthunder.");

    var validBoom = false;
    try {
      var currentBoom = btPrefBranch.getCharPref("currentBoom");
      for (let i in BrandThunder.clients) {
        for (let j in BrandThunder.clients[i].booms) {
          if (j == currentBoom) {
            validBoom = true;
          }
        }
      }
    } catch (ex) {}

    if (!validBoom) {
      /* currentBoom is not valid */
      for (let i in brandObject.booms) {
        btPrefBranch.setCharPref("currentBoom", i);
        break;
      }
    }

    try {
      firstrun = btClientPrefBranch.getBoolPref("firstrun");
      if (firstrun == false) {
        return;
      }
    } catch(e) {
      //nothing
    }
  
    btClientPrefBranch.setBoolPref("firstrun",false);
    window.setTimeout(function(){
      function askAboutHomepage(event) {
        if (brandObject.welcomePage) {
          if (!content.document.location.href.match(brandObject.welcomePage)) {
            return;
          }
        } else if (brandObject.startPage) {
          if (!content.document.location.href.match(brandObject.startPage)) {
            return;
          }
        } else {
          event.target.removeEventListener("load", askAboutHomepage, false);
          return; 
        }
        event.target.removeEventListener("load", askAboutHomepage, false);
        function yes() {
          var prefbranch=Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefBranch);
          
          prefbranch.setCharPref("browser.startup.homepage", brandObject.homePage);  
        }
        var nbox_buttons = [
          {
            label: "Yes",
            accessKey: "Y",
            callback: yes,
            popup: null
          },
          {
            label: "No",
            accessKey: "N",
            callback: function() {},
            popup: null 
          }
        ]
        if (!btClientBundle) {
          btClientBundle = document.getElementById("btClientBundle_" + brandObject.shortName);
        }
        var nbox = gBrowser.getNotificationBox();
        try {
          var homepageQuestion = btClientBundle.getString("homepageQuestion");
          nbox.appendNotification(homepageQuestion, "brandthunder",
                                  "chrome://" + brandObject.packageName + "/skin/favicon.png",
                                  nbox.PRIORITY_INFO_HIGH, nbox_buttons);
        } catch (ex) {}
      }
      if (brandObject.startPage) {
        gBrowser.selectedTab = gBrowser.addTab(brandObject.startPage);
      }
      if (brandObject.welcomePage) {
        gBrowser.selectedTab = gBrowser.addTab("http://brandthunder.com/install.php?&type=" + brandObject.releaseIdentifier + "&url=" + brandObject.welcomePage);
      }
      if (!brandObject.utilities.isFullBuild(brandObject)) {
        gBrowser.selectedTab.addEventListener("load", askAboutHomepage, false);
      }
    }, 1500); //Firefox 2 fix - or else tab will get closed
    /* Add domains to permission manager for installing and popups */
    if (brandObject.domains) {
      for (let i=0; i < brandObject.domains.length; i++) {
        brandObject.utilities.addToPermissionManager(brandObject.domains[i]);
      }
    }
    if (brandObject.bookmarks) {
      for (let i in brandObject.bookmarks) {
		if (typeof(brandObject.bookmarks[i] == "object")) {
		  var bookmarks = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                                    .getService(Components.interfaces.nsINavBookmarksService);

		  var folder =  bookmarks.createFolder(bookmarks.bookmarksMenuFolder, i, -1);

          for (let j in brandObject.bookmarks[i]) {
            brandObject.utilities.addBookmark(j, brandObject.bookmarks[i][j], folder);
		  }
 		} else {
		  brandObject.utilities.addBookmark(i, brandObject.bookmarks[i]);
	    }
      }
    }
    var upgrade = false;
    try {
      upgrade = btClientPrefBranch.getBoolPref("upgrade");
      btClientPrefBranch.clearUserPref("upgrade");
    } catch (ex) {
    }
    /* If we are an upgrade, search engine add will be done in the opt in dialog */
    if (!upgrade) {
//      brandObject.utilities.addSearchEngine(brandObject, brandObject.utilities.isFullBuild(brandObject));
      
    }
    if (!brandObject.utilities.isFullBuild(brandObject)) {
//      function displayOptinDialog() {
//        if (window.screenX > 0) {
//          window.openDialog('chrome://' + brandObject.packageName + '/content/btOptin.xul','btOptin','chrome,centerscreen,modal', brandObject, upgrade);
//        } else {
//         window.setTimeout(displayOptinDialog, 500);
//        }
//      }
//      window.setTimeout(displayOptinDialog, 1500);
    }
  }

  brandObject.utilities.isFullBuild = isFullBuild;
  brandObject.utilities.openLink = openLink;
  brandObject.utilities.restartApp = restartApp;
  brandObject.utilities.addToPermissionManager = addToPermissionManager;
  brandObject.utilities.addSearchEngine = addSearchEngine;
  brandObject.utilities.addBookmark = addBookmark;
  brandObject.utilities.uninstall = uninstall;
  brandObject.utilities.firstRun = firstRun;
  brandObject.utilities.switchBoom = switchBoom;
  brandObject.utilities.toggleTheme = toggleTheme;
  try {
    Components.utils.import("resource://gre/modules/JSON.jsm", brandObject.utilities);
	brandObject.utilities.JSON.stringify = brandObject.utilities.JSON.toString;
	brandObject.utilities.JSON.parse = brandObject.utilities.JSON.fromString;
  } catch (ex) {
    /* Firefox 3.1 has native JSON support */
    brandObject.utilities.JSON = JSON;
  }

  brandObject.releaseIdentifier = getReleaseIdentifier(brandObject);
  /* Needed for compatibility with old booms */
  brandObject.utilities.getReleaseIdentifier = getReleaseIdentifier;

  /* So other clients won't call our BrandThunder.initialize */
  delete BrandThunder.initialize;
}
