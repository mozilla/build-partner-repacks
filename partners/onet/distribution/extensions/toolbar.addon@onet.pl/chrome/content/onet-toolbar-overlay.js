/**
 * OnetToolbar: the toobar 'controler'.
 */
"use strict";
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import("resource://gre/modules/BookmarkJSONUtils.jsm");

var OnetToolbar = {

    /**
     * OnetToolbar Properties
     */

    /* TODO: use value from prefs: homepage option A */
    homepage_onet : "http://www.onet.pl/?utm_source=onetbrotab&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* TODO: use value from prefs: homepage option B */
    homepage_szujak : "http://szukaj.onet.pl/?utm_source=szukajbrotab&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* TODO: use value from prefs? - forward to konto */
    forward_register : "https://konto.onet.pl/register-email.html?utm_source=newmailbrotab&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* TODO: use value from prefs? - forward login email */
    forward_login : "http://konto.onet.pl/?utm_source=pocztabrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* TODO: get from install.rdf */
    forward_addon_page : "http://witaj.onet.pl/toolbar",
    forward_bundle_page : "http://witaj.onet.pl/?utm_source=onetbrotab&utm_medium=onetbrowser&utm_campaign=onetsg_browser",

    /* cookie set when logged into onet email */
    authCookieName : 'onet_token',
    /* onet authorization host */
    authHostName : 'authorisation.grupaonet.pl',
    /* using prefs as helpers */
    prefPrefix : "extensions.pl.onet.addon.toolbar.",
    tracking : "666", // onet tracking id for google analytics
    version : "0.0", // addon version see onLoad()
    requester : null,
    /* observers */
    cookieObserver : null,
    httpReqObserver : null,
    appObserver : null,
    prefsObserver : null,

    /* service utils */
    search : Services.search,
    console : Services.console,
    prefService : Services.prefs,
    propService : document.getElementById("onet-toolbar-strings"),

    /* DEBUGGING */
    log : function(lvl, msg) {
	if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getBoolPref("debug")) {
	    // TODO: optimize further in later versions ...
	    OnetToolbar.console.logStringMessage(lvl + ": " + msg);
	}
    },
    info : function(msg) {
	OnetToolbar.log("INFO", msg);
    },
    error : function(msg) {
	OnetToolbar.log("ERROR", msg);
    },
    debug : function(msg) {
	OnetToolbar.log("DEBUG", msg);
    },
    inspect : function(ojb) {
	var out = "";
	for ( var prop in ojb) {
	    out += prop + " :: " + ojb[prop] + "\n";
	}
	OnetToolbar.debug(out);
    },

    bookmarks : function() {
	try {
	    if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .getBoolPref("bookmarks.install")) {
		BookmarkJSONUtils.importFromURL(
			"chrome://pl.onet.toolbar/content/bookmarks.json",
			false);
		OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			.setBoolPref("bookmarks.install", false);
	    }
	} catch (ex) {
	    OnetToolbar.debug("BookmarkJSONUtils: " + ex);
	}
    },
    bookmarksCleanup : function (){
       var bookmarks = [
            'http://sport.onet.pl/?utm_source=sportbrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://waluty.onet.pl/?utm_source=walutybrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://repertuar.onet.pl/?utm_source=repertuarbrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://www.plejada.pl/aktualnosci.html/?utm_source=plejadabrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://gry.onet.pl/online/?utm_source=grybrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://technowinki.onet.pl/komputery/artykuly.html/?utm_source=techbrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://moto.onet.pl/?utm_source=motobrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://magia.onet.pl/sennik/?utm_source=magiabrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://wiadomosci.onet.pl/kiosk/kiosk.html/?utm_source=wiadomoscibrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://podroze.onet.pl/?utm_source=podrozebrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser'
        ]
        var iOService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
        var bsmvc =  Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                          .getService(Components.interfaces.nsINavBookmarksService);
        for (var t = 0; t < bookmarks.length; t++) {
            try { /* insane */
                var uu = iOService.newURI(bookmarks[t], null, null);
                var lists = bsmvc.getBookmarkIdsForURI(uu)
                for (var i = 0; i < lists.length; i++) {
                    bsmvc.removeItem(
                            bsmvc.getFolderIdForItem(lists[i])
                            );
                }

            } catch (e) {
            }
        }
        var bookmarks = [
            'http://konto.onet.pl/?utm_source=pocztabrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser',
            'http://pogoda.onet.pl/?utm_source=onetbrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser'
        ]
        for (var t = 0; t < bookmarks.length; t++) {
            try { /* insane */
                var uu = iOService.newURI(bookmarks[t], null, null);
                var lists = bsmvc.getBookmarkIdsForURI(uu)
                for (var i = 0; i < lists.length; i++) {
                    bsmvc.removeItem(
               lists[i] //             bsmvc.getFolderIdForItem(lists[i])
                            );
                }

            } catch (e) {
            }
        }
    },
    debugAddon : function(m) {
	if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getBoolPref("debug")) {
	    var state = OnetToolbar.prefService.getBranch(
		    OnetToolbar.prefPrefix).getCharPref("debug.state");
	    state += " | " + m;
	    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .setCharPref("debug.state", state);
	    OnetToolbar.debug("new state: " + state);
	}
    },

    manageAddon : function() {

	// AddonManager.getAddonByID("toolbar.addon@onet.pl", function(addon) {
	// OnetToolbar.debug("Addon :: toolbar.addon@onet.pl");
	// OnetToolbar.inspect(addon);
	// });

	var addonListener = {
	    /*
	     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Add-on_Manager/AddonListener
	     * 
	     * these events must be handled by "onload" function: onEnabling,
	     * onEnabled, onInstalling, onInstalled
	     * 
	     * these events must be handled by "onunload" "function: onDisabled,
	     * onUninstalled
	     */
	    onDisabling : function(addon, needsRestart) {
		if (addon.id == "toolbar.addon@onet.pl") {
		    OnetToolbar.debugAddon("onDisabling");
		    // take action:
		    OnetToolbar.disable();
		}
	    },
	    onUninstalling : function(addon, needsRestart) {
		if (addon.id == "toolbar.addon@onet.pl") {
		    OnetToolbar.debugAddon("onUninstalling");
		    // take action:
		    OnetToolbar.disable();
		    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			    .setBoolPref("uninstall", true);
		}
	    },
	    onOperationCancelled : function(addon) {
		if (addon.id == "toolbar.addon@onet.pl") {
		    OnetToolbar.debugAddon("onOperationCancelled");
		    // take action:
		    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			    .setBoolPref("uninstall", false);
		    OnetToolbar.init();
		}
	    },
	    onPropertyChanged : function(addon, properties) {
		// unused
	    },
	};

	try {
	    AddonManager.addAddonListener(addonListener);
	} catch (ex) {
	    OnetToolbar.error("AddonManager: " + ex);
	}
    },

    /**
     * Set new tab feature to chrome://pl.onet.toolbar/content/onet-newTab.xul
     */
    newTabSetup : function() {

	if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getBoolPref("optin.newtab")) {
	    // on first encounter - save the original value of
	    // browser.newtab.url
	    if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .getCharPref("optin.newtab.reset") == "") {
		OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			.setCharPref(
				"optin.newtab.reset",
				OnetToolbar.prefService
					.getCharPref("browser.newtab.url"));
	    }
	    // about:newtab is overloaded by onet newTab.xul (chrome.manifest)
	    OnetToolbar.prefService.setCharPref("browser.newtab.url",
		    "about:newtab");
	    OnetToolbar.prefService.setIntPref("browser.newtabpage.rows", 2);
	    OnetToolbar.prefService.setBoolPref("browser.newtabpage.enabled",
		    true);

	} else {
	    this.newTabShutdown();
	}
    },

    /**
     * Re-set new tab feature to previous user setting.
     */
    newTabShutdown : function() {

	if (Services.prefs.getIntPref("browser.newtabpage.rows") == 2) {
	    Services.prefs.setIntPref("browser.newtabpage.rows", 3);
	}
	if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getCharPref("optin.newtab.reset") != "") {
	    OnetToolbar.prefService.setCharPref("browser.newtab.url",
		    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			    .getCharPref("optin.newtab.reset"));
	    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .setCharPref("optin.newtab.reset", "");
	}
    },

    /**
     * optin.homepage: setup browser homepage.
     * 
     * TODO: cleanup up later ...
     */
    homepageSetup : function() {

	var optin = OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getIntPref("optin.homepage");

	if (optin == 3) {
	    // opt-out
	    OnetToolbar.homepageShutdown();
	} else {
	    // on first encounter, save the current user setting:
	    if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .getCharPref("optin.homepage.reset") == "") {
		OnetToolbar.prefService
			.getBranch(OnetToolbar.prefPrefix)
			.setCharPref(
				"optin.homepage.reset",
				OnetToolbar.prefService
					.getCharPref("browser.startup.homepage"));
	    }
	    switch (optin) { // TODO array could help here ...
	    case 1:
		OnetToolbar.prefService.setCharPref("browser.startup.homepage",
			OnetToolbar.homepage_onet);
		break;
	    case 2: // Opt-in
		OnetToolbar.prefService.setCharPref("browser.startup.homepage",
			OnetToolbar.homepage_szujak);
		break;
	    }
	}
    },

    /**
     * shutdown re-install homepage
     * 
     */
    homepageShutdown : function() {

	// reset home page:
	if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getCharPref("optin.homepage.reset") != "") {

	    OnetToolbar.prefService.setCharPref("browser.startup.homepage",
		    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			    .getCharPref("optin.homepage.reset"));

	    // reset prefs:
	    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .setCharPref("optin.homepage.reset", "");
	}
    },

    /**
     * Check if custom onet search is installed and default.
     * 
     * Note: "OnetSzukaj" is the search engine name of the onet-browser
     * distribution.
     * 
     * TODO: we need to provide a pref setting for user to be able to turn off
     * re-installing of 'szukaj'
     */
    searchSetup : function() {

	if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getBoolPref("optin.search")) {

	    if (!OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .getBoolPref("search.install")) {
		return;
	    }

	    try {
		/* params see: onet open search plugin */
		var name = "OnetSzukaj";
		var szukaj = this.search.getEngineByName(name);

		// save userengine selection
		OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			.setCharPref("optin.search.reset",
				this.search.currentEngine.name);
		if (!szukaj) {
		    // install OnetSzukaj
		    var icon = 'data:image/x-icon;base64,AAABAAMAEBAAAAAAIABoBAAANgAAACAgAAAAACAAqBAAAJ4EAAAwMAAAAAAgAKglAABGFQAAKAAAABAAAAAgAAAAAQAgAAAAAABABAAAAAAAAAAAAAAAAAAAAAAAAP///wH///8B////Af///wEAk+wpAI/ujQCL6tUAi+v5AIrp+wCM6tsAjumTAJXrM////wH///8B////Af///wH///8B////AQCh8gkAmfCTAI7q+wCK6/8AiOz/AIjs/wCJ7f8Aiu3/AIzs/wCP6/0AmOuhAKDsDf///wH///8B////AQCl7gkApPa7AJn1/wCS9P8AjvX/AIz1/wCM9f8AjPb/AI32/wCQ9v8AlPT/AJz1/wCj8MsAo+sP////Af///wEApvOTAKf8/wCf/f8AmP3/AJL9/wCQ/f8AkPz/AJD9/wCQ/f8Ak/3/AJr9/wCj/f8Ap/r/AKn1qf///wEAqe8tAKjy/QCo/P8Ao///AJv//wCV//8Akv//AJH//wCR//8Akv//AJf//wCe//8Apf//AKr+/wCs+f8AquxBAK70kwCs+P8Aq///AKb//wCg//8Amv//AJb//wCU//8AlP//AJf//wCc//8Aov//AKj//wCt//8AsPz/ALD2qQCx9tUAsf3/AK7//wCp//8Apf//AKH//wCd//8Am///AJv//wCe//8Aov//AKf//wCr//8Ar///ALL9/wCx9OsAs/X5ALT9/wCx//8Arf//AKr//wCn//8Apf//AKT//wCk//8Apf//AKj//wCr//8Arv//ALL//wC2//8Atff/ALb3+w68/v8OvP//ALP//wCu//8ArP//AKr//wCq//8Aqv//AKv//wCt//8Ar///ALL//wC1//8AuP7/Abb1/wK49tlg2f7/Wtj//xjC//8Btv//ALH//wCv//8Ar///AK///wCw//8Asf//ALP//wC2//8Auf//ALv+/wO59u8LuPGbS9P7/7H0//9x4P//L8v//wa7//8Atf//ALP//wC0//8Atf//ALb//wC4//8Auv//AL3//wG8+/8TwPevLMb1NRXE+/+q8f//x/r//47p//9G0///D8L//wC6//8Auf//ALn//wC7//8AvP//AL7//wPB/v8iyfv/RM/5Rf///wFT1PuhPtT+/8X3///U/f//o/H//1vb//8dyf//BMH//wC+//8Av///AcH//xDI//871P7/aNz8s////wH///8BiOT/DXvf/Mln4v//vfX//+D+//+19v//eOb//z/W//8czP//JM///0LZ//9q4v//iOT915Lg+xH///8B////Af///wGZ5/8Pluj+p47p/v+q9P//1vv//9v+//+8+f//g+v//4Xn//+T6v7/mOj8s5np/hX///8B////Af///wH///8B////Af///wGX5Pw7mOX8p5np/eub7P7/nO3//5rq/u+Z6f2vl+P7Rf///wH///8B////Af///wEAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//KAAAACAAAABAAAAAAQAgAAAAAACAEAAAAAAAAAAAAAAAAAAAAAAAAP///wH///8B////Af///wH///8B////Af///wH///8B////AQCV6wUAkuwnAJP0SwCQ7pUAjurFAI7w6QCO7f8Aje3/AI3s7wCO6s0AkO6fAJHsVQCV7C0AmOwH////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wEAlesbAJPshQCR8M8AjOvzAIrs/wCI5/8AiOr/AIfo/wCH5v8Ah+b/AIjm/wCK6v8AjOf3AI/q1wCT6ZcAme8p////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wEAnvQdAJjtdwCR6+8AjOf/AIrn/wCK6f8AiOn/AIjp/wCI6/8AiOv/AIjq/wCI7P8AiOn/AIrr/wCL6v8Ai+n/AI3o/wCR7PkAme6LAJ/wKf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BAKHyHwCe9L0AlO35AI7r/wCM6v8AjO7/AIvu/wCJ7v8Aie7/AInu/wCK7v8Aiu//AIrw/wCK7/8Aiu7/AIvt/wCN7v8Aj+z/AJDs/wCT6fsAnOzPAKDsM////wH///8B////Af///wH///8B////Af///wH///8B////AQCh7kMAo/bXAJz1/wCU8v8AkfD/AJDz/wCO8v8AjPL/AIzz/wCL8/8AjPP/AIzz/wCL9P8AjPT/AIz0/wCM9P8AjfT/AJD0/wCS8v8AlPL/AJbw/wCd8v8AovDlAKPuXf///wH///8B////Af///wH///8B////Af///wEApe4fAKT11wCl+P8Anvj/AJf0/wCV9/8Ak/f/AJD4/wCO+P8Ajfj/AI34/wCN+P8Ajfj/AI34/wCN+P8Ajfj/AI34/wCQ+P8Akvj/AJT3/wCX9/8Am/j/AKH7/wCj9P8ApO7nAKPrN////wH///8B////Af///wH///8BAKXwHQCm9b0Ap/v/AKb7/wCh/P8AnPv/AJj7/wCV/P8Akvz/AJD8/wCQ+/8AkPv/AJD7/wCQ+/8AkPv/AJD8/wCQ/P8AkPz/AJH8/wCU/P8AmPz/AJv8/wCg/f8ApP3/AKf9/wCn9/8AqPXVAKjxMf///wH///8B////Af///wEAp/J9AKbz+QCo/v8Apvz/AKL9/wCf/v8Am/7/AJf+/wCT/v8Akf7/AJD+/wCQ/f8AkP3/AJD+/wCQ/f8AkP7/AJD+/wCR/v8Ak/7/AJb+/wCa/v8Anf7/AKL//wCl+/8Ap/v/AKn5/wCp9f0AqvSj////Af///wH///8BAKjsJQCm7fcAp/T/AKj7/wCm+/8ApP//AKH//wCc//8Amf//AJb//wCT//8Akf//AJH//wCR//8Akf//AJH//wCR//8Akf//AJL//wCV//8AmP//AJv//wCf//8Ao///AKb//wCp/P8Aq/7/AK38/wCs9/8AqutH////AQCr7AMAqvCLAKfv/wCq+f8Aqv3/AKj//wCm//8Aov//AJ3//wCa//8Al///AJX//wCT//8Akv//AJH//wCR//8Akf//AJH//wCS//8AlP//AJf//wCZ//8Anf//AKD//wCl//8Ap///AKr//wCs/v8Aq/j/AK34/wCq7KsArO0PAKvvLQCr8dUArfj/AKr2/wCs//8Aqv//AKf//wCl//8AoP//AJ7//wCa//8AmP//AJX//wCU//8Ak///AJL//wCS//8Ak///AJX//wCX//8Amf//AJz//wCg//8Ao///AKb//wCp//8Aq///AK3//wCv/f8AsPr/AK/36QCu8UMArvVXAK/49wCu+v8ArPn/AKz//wCr//8AqP//AKb//wCj//8AoP//AJ3//wCa//8AmP//AJf//wCW//8Alv//AJb//wCW//8AmP//AJn//wCc//8Anv//AKL//wCl//8AqP//AKr//wCs//8Arv//ALH+/wCw+f8Asfj/ALH0eQCu8JcAsfn/ALH8/wCw//8Arv//AKz//wCq//8Ap///AKb//wCj//8AoP//AJ7//wCb//8Am///AJn//wCZ//8Amf//AJr//wCb//8Anf//AKD//wCi//8Apf//AKf//wCp//8Aq///AK3//wCv//8Asv7/ALH6/wCw9f8Ar+7DALDxwwCz+/8Asvz/ALL//wCw//8Arf//AKv//wCp//8Ap///AKb//wCj//8Aof//AJ///wCe//8Anf//AJ3//wCd//8Anv//AJ///wCg//8Ao///AKX//wCn//8AqP//AKv//wCs//8Ar///ALH//wCy/v8AtP3/ALL4/wCy8+8AsfLpALT6/wCy+/8As///ALH//wCv//8Arf//AKv//wCp//8AqP//AKf//wCl//8ApP//AKL//wCi//8Aov//AKL//wCi//8Ao///AKX//wCm//8AqP//AKn//wCr//8ArP//AK7//wCw//8Asv//ALT//wC2//8AtPj/ALPz/wGy8fsAtfn/ALb+/wC0/v8Asv//ALH//wCu//8Arf//AKz//wCr//8Aqf//AKj//wCn//8Apv//AKb//wCm//8Apv//AKb//wCm//8Ap///AKn//wCq//8Aq///AKz//wCu//8AsP//ALL//wCz//8Atv//ALj//wC3/P8Atvb/ALX0/QC2+f8Atv3/Abf+/wW3//8AtP//ALH//wCw//8Arv//AKz//wCs//8Aqv//AKr//wCp//8AqP//AKj//wCo//8AqP//AKr//wCq//8Aq///AKz//wCt//8Ar///ALD//wCy//8As///ALX//wC3//8AuP3/ALb3/wG18v8AtvXvALf6/wa6/f8vyv//Jcb//w2+//8At///ALP//wCw//8Ar///AK3//wCs//8ArP//AKv//wCr//8Aq///AKv//wCr//8Aq///AKz//wCt//8Arv//AK///wCx//8Asv//ALP//wC1//8At///ALn//wC6//8At/j/A7by/wS28skAufn/Ksb8/3/j//9Z1///M8z//xHA//8Duv//ALX//wCy//8AsP//AK///wCu//8Arv//AK7//wCu//8Arv//AK7//wCu//8Arv//ALD//wCx//8Asv//ALP//wC0//8Atv//ALf//wC5//8Auv7/ALz+/wC7+/8EuPTzB7XvoQG7+v80zP//ou7//4Hl//9d2v//M8z//xjD//8Eu///ALf//wCz//8Asv//ALH//wCw//8AsP//ALD//wCw//8AsP//ALH//wCx//8Asv//ALP//wC0//8Atf//ALb//wC4//8Auf//ALr//wC8/v8Au/z/A7n1/wa69s0IufJfB7fy+x3E+v+f7///sPT//5Tr//9s3v//S9T//ybI//8PwP//Arn//wC2//8AtP//ALP//wCz//8Asv//ALL//wCz//8As///ALT//wC0//8Atf//ALf//wC4//8AuP//ALr//wC8//8Avf//AL39/wC8+/8Gvvn/E7/1hRa77zMNufHdBbz4/2ve/f/M/P//t/X//5fs//954v//Utf//zPM//8Twv//A7z//wC4//8Atv//ALT//wC0//8AtP//ALX//wC2//8Atv//ALf//wC4//8AuP//ALn//wC7//8AvP//AL7//wC+//8Au/r/BL35/xrB9u8nyPlNM8j3BybD9ZkNwfr/B8D9/7v2///Y/v//xfr//6/z//+L6P//ad7//0HR//8jyP//CcD//wG7//8Auf//ALj//wC4//8AuP//ALj//wC5//8Auf//ALr//wC7//8Au///AL3//wC+//8Av///AMD//wjC/f8fxPj/PMz4s0zM9BP///8BQM33NS3I9v8Rx/7/Rtb//875///b/v//y/z//7H0//+V6///bN///0rU//8lyv//DsP//wK9//8Au///ALr//wC6//8Auv//ALr//wC8//8AvP//AL3//wC+//8Av///AMD//wHA/f8Kw/3/Is3+/0DP+v9X1fxN////Af///wH///8BU9X7k0HO+fsiyvz/Vtz//979///j////0/7//8H6//+i8f//g+f//1bZ//830P//F8b//wfC//8Bv///AL3//wC9//8Avv//AL7//wC///8Av///AMD//wHC//8Gxf//Gc3//zPP/f9V2Pz/ad3+s////wH///8B////Af///wFt2fkpZdv+zUrX/f800v//duX//938///l////2P7//8H6//+n8v//f+b//1/d//850v//H8n//wvE//8Ewv//AL///wC///8AwP//AMD//wDC//8Fxf//FMr//yfP//9D2f//Xdr9/3fe+9uA3/w9////Af///wH///8B////Af///wGI5P8xed365Wnf/v9P3P//aeP//9X6///r////3f7//8z8//+w9f//le3//27i//9O2f//Ls///xzL//8Kxv//BcT//wrH//8Tyv//ItD//zLU//9K2///X93//3jl/v+I4/7vkuD7Qf///wH///8B////Af///wH///8B////Af///wGO4PtbiuH853vl//9r5f//eef//7v2///x////5////9P+//+++v//oPL//4Tq//9j4f//T9v//zjW//8p0v//NNX//0DX//9S3v//Y+L//3fo//+G5///kuX88ZXj+3f///8B////Af///wH///8B////Af///wH///8B////Af///wGZ5/83l+b+05Tr/v2L6v//gOj//6Pz///U+///7P///+f////W/v//xvz//7D3//+h8///f+v//2fl//9x5P//e+b//4nt//+Q6v//mOv+/5jm/N+Z6f5RmOX+A////wH///8B////Af///wH///8B////Af///wH///8B////Af///wGZ6f4vmOX9m5np//+W6P7/l/H//5vz//+29v//0Pv//+j////o////2/7//8T9//+V7///kO///5Tq//+W6f//mer//5jo/f+Y5/yxl+P7Qf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BmOb9N5fk/KOX4/vpmOf9/Zrr//+Z6v7/nPD//57v//+f7f//nPD//53x//+Z6f//muv+/5nr/u+W4/qxl+P7Tf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BmOT9DZfj/EGZ5/53mej8v5jm/e2a6v//mOX9/5rs//+a6f//mun+9Zjm/smX4/uDl+T8S5fj+xP///8B////Af///wH///8B////Af///wH///8B////Af///wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAwAAAAYAAAAAEAIAAAAAAAgCUAAAAAAAAAAAAAAAAAAAAAAAD///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQCU8gMAkuxJAJHsjQCQ7LUAkfLNAJH0/wCQ7v8AkO7/AJL2/wCQ7NkAkezBAJLsmQCU8lsAl/MT////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQCV7A8AlOxVAJLsqwCU9/EAkfP/AIzr/wCL6P8AjO7/AIjm/wCK6/8Ah+X/AIrs/wCI5v8Ai+r/AIzo/wCQ8f8AkOv9AJTstwCX7W0AmOwb////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wEAmOwHAJXsbQCT7e0Ak/P/AI7w/wCI5P8AiOr/AIjq/wCH5f8AiOv/AIfm/wCH6P8Ah+f/AIfm/wCH5v8Ah+b/AIfl/wCK6/8Aiuf/AIrl/wCQ7P8Akuj7AJnwlQCb7BP///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQCb7lsAlevdAJHu/wCK5P8AiuX/AIro/wCK6P8AiOj/AIrs/wCH6P8AiOz/AIjs/wCH6v8Ah+j/AIjs/wCI7P8AiOf/AIjq/wCL7f8Ai+3/AIvn/wCL5/8AjOX/AI7s/wCX8fMAnvN9AJ/tCf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wEAofYbAJ70wwCV6/8Ajur/AI3q/wCL5/8Ai+v/AIvs/wCK7P8AiOv/AIjq/wCI6/8AiOv/AIjq/wCK7f8Aiu3/AIru/wCK7v8Aiu3/AIru/wCK6v8Aiuj/AI3u/wCO8P8Aju7/AI3o/wCO5v8Akuf/AKDz4wCf7D3///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQCh8kMAoPTrAJv3/wCQ6P8AkO3/AI7r/wCN7f8AjfD/AIzx/wCL8P8AivD/AIrw/wCL8f8AivD/AIrw/wCL8P8AivD/AIvx/wCL8f8Ai/H/AIvx/wCL8P8AjPH/AIzs/wCO8P8AkO3/AJHu/wCT8f8Akef/AJXr/wCf7P0AoOxz////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BAKHwVQCk+PkAoPb/AJXy/wCU8f8AkO3/AJHz/wCQ8/8AjvP/AIzt/wCM8/8AjPP/AIvy/wCL8v8AjPP/AIvy/wCM8/8Ai/P/AIzz/wCM8/8AjPP/AIz0/wCM8/8AjfP/AI70/wCQ8/8AkfL/AJP0/wCU8f8AlO3/AJXr/wCg8/8AoOz/AKHsjf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wEAou5VAKHu/QCl+v8An/j/AJj2/wCV8v8Ak/L/AJP2/wCR8/8AkPb/AI73/wCN9v8Ajfb/AI32/wCM9v8Ajfb/AI32/wCN9v8Ajfb/AI32/wCN9/8Ajff/AI33/wCN9/8Ajvf/AJD3/wCS9/8AkvL/AJTz/wCV8v8Amvj/AJv3/wCg9v8Apvr/AKX0/wCk7Jf///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQCl7kMApfb5AKf7/wCl+v8Aov3/AJjx/wCZ+P8Al/n/AJX5/wCT+f8Akfn/AJD5/wCO+f8Ajvn/AI75/wCO+f8Ajvn/AI75/wCO+f8Ajvn/AI75/wCO+f8Ajvn/AI75/wCO+v8AkPn/AJL5/wCT+v8Alfn/AJj6/wCZ+f8Am/j/AJ76/wCm//8AovL/AKTy/wCk7P8ApOx5////Af///wH///8B////Af///wH///8B////Af///wH///8BAKXtGwCn9usAqP3/AKTz/wCm/v8Aofn/AJ/+/wCZ+f8Amfv/AJf7/wCU+/8Ak/v/AJH7/wCQ+/8AkPv/AJD7/wCQ+/8AkPv/AJD7/wCQ+/8AkPv/AJD7/wCQ+/8AkPv/AJD7/wCQ+/8Akfv/AJP7/wCV/f8Al/v/AJn7/wCb+/8Anv3/AKL+/wCl+/8AqP//AKj9/wCn9v8AqPb/AKbsSf///wH///8B////Af///wH///8B////Af///wEApuwDAKbxwwCn9/8AqP7/AKj//wCn//8Apf//AKH//wCe/v8Amv3/AJj+/wCV/v8Ak/7/AJL+/wCQ/v8AkP7/AJD9/wCQ/v8AkP3/AJD9/wCQ/v8AkP3/AJD+/wCQ/v8AkP7/AJD+/wCQ/v8Akv7/AJP+/wCV/v8AmP7/AJr+/wCe/v8AoP//AKX//wCn//8Apvv/AKr//wCl8f8Aqvf/AKv26wCo7hv///8B////Af///wH///8B////Af///wEAp+1pAKj3/wCl8P8Aqv7/AKj//wCl+v8Aovv/AKH//wCf//8Anf//AJr//wCY//8Alf7/AJP//wCS/v8Akf//AJH+/wCR/v8Akf7/AJH+/wCR//8Akf7/AJH+/wCR//8Akf7/AJH//wCS//8Ak/7/AJX//wCY/v8Amv//AJ3//wCf//8Aof//AKX//wCk+P8Apvn/AKv//wCq+v8Ap/P/AKz5/wCq8aX///8B////Af///wH///8B////AQCo7BMApuztAKbu/wCn9v8Aqv7/AKb3/wCl+v8Apv//AKL//wCg//8Anf//AJr//wCY//8Al///AJT//wCT//8Akv//AJH//wCR//8Akf//AJH//wCR//8Akf//AJH//wCR//8Akf//AJL//wCT//8AlP//AJf//wCY//8Amv//AJ3//wCg//8Aov//AKb//wCn//8Ap/r/AKv//wCs//8Arv//AK36/wCt9v8Aquw/////Af///wH///8B////AQCo7IEApuz/AKj0/wCr+v8Ap/j/AKr//wCo//8Apv//AKT//wCh//8Anv//AJv//wCZ//8AmP//AJX//wCU//8Akv//AJL//wCR//8Akf//AJH//wCR//8Akf//AJH//wCR//8Akv//AJL//wCU//8Alf//AJj//wCZ//8Am///AJ7//wCh//8ApP//AKb//wCo//8Aqv//AKv//wCs/f8Arv//AKjx/wCu+f8AquzD////Af///wH///8BAKvsDQCr8vEAqO7/AKjy/wCt//8ArP//AKr//wCo//8Ap///AKX//wCi//8An///AJ3//wCa//8Amf//AJf//wCV//8AlP//AJP//wCS//8Akf//AJH//wCR//8Akf//AJH//wCS//8Ak///AJT//wCV//8Al///AJn//wCa//8Anf//AJ///wCi//8Apf//AKf//wCo//8Aqv//AKz//wCt//8ArPv/AKry/wCx/f8Aq+z/AKztP////wH///8BAKvtYwCr8P8Arfn/AKv2/wCq9v8ArP//AKv//wCq//8Ap///AKb//wCk//8Aof//AJ///wCd//8Amv//AJj//wCX//8Alf//AJT//wCT//8Ak///AJL//wCS//8Akv//AJP//wCT//8AlP//AJX//wCX//8AmP//AJr//wCd//8An///AKH//wCk//8Apv//AKf//wCq//8Aq///AKz//wCu//8AsP//AK76/wCw+P8AsPj/AKzwo////wH///8BAK3zwQCu9/8AsPv/AKz5/wCq9/8Arf//AKz//wCq//8AqP//AKf//wCl//8Aov//AKD//wCe//8Anf//AJr//wCZ//8AmP//AJf//wCV//8AlP//AJT//wCU//8AlP//AJT//wCV//8Al///AJj//wCZ//8Amv//AJ3//wCe//8AoP//AKL//wCl//8Ap///AKj//wCq//8ArP//AK3//wCu//8AsP//ALH9/wCz//8Asfv/ALH09wCt7Q0ArfATALD3/QCx+v8Arvn/ALD+/wCs+f8Arf//AKz//wCr//8Aqv//AKj//wCn//8Apf//AKL//wCg//8Anv//AJ3//wCa//8Amf//AJj//wCY//8Al///AJf//wCX//8Al///AJf//wCY//8AmP//AJn//wCa//8Anf//AJ7//wCg//8Aov//AKX//wCn//8AqP//AKr//wCr//8ArP//AK3//wCw//8Asf//ALL//wCu9P8AsPf/ALP6/wCu7UsAsfRPAKzt/wC0//8As///ALL//wCw//8Arv//AK3//wCs//8Aq///AKj//wCn//8Apv//AKX//wCi//8AoP//AJ///wCd//8Am///AJr//wCa//8Amf//AJn//wCZ//8Amf//AJn//wCa//8Amv//AJv//wCd//8An///AKD//wCi//8Apf//AKb//wCn//8AqP//AKv//wCs//8Arf//AK7//wCw//8Asv//ALP//wCx+f8Asfb/AK3t/wCx8ZEAsfOLALDz/wC0//8ArvT/ALL//wCx//8AsP//AK7//wCt//8Aq///AKr//wCo//8Ap///AKb//wCl//8Aov//AKH//wCf//8Anv//AJ3//wCd//8Am///AJv//wCb//8Am///AJv//wCd//8Anf//AJ7//wCf//8Aof//AKL//wCl//8Apv//AKf//wCo//8Aqv//AKv//wCt//8Arv//ALD//wCx//8Asv//ALD4/wCz+/8Atf//AK7w/wGw7c0Aru2xALP3/wC1//8AtP//ALP//wCy//8Asf//ALD//wCt//8ArP//AKv//wCq//8AqP//AKf//wCn//8Apf//AKT//wCi//8Aof//AKD//wCf//8An///AJ7//wCe//8Anv//AJ///wCf//8AoP//AKH//wCi//8ApP//AKX//wCn//8Ap///AKj//wCq//8Aq///AKz//wCt//8AsP//ALH//wCy//8As///ALP//wC3//8AsfT/ALf9/wCz8/MBsO3VALDx/wC3//8Asfj/ALT//wCz//8Asv//ALD//wCu//8Arf//AKz//wCr//8Aqv//AKj//wCo//8Ap///AKb//wCl//8ApP//AKL//wCh//8Aof//AKH//wCh//8Aof//AKH//wCh//8Aov//AKT//wCl//8Apv//AKf//wCo//8AqP//AKr//wCr//8ArP//AK3//wCu//8AsP//ALL//wCz//8AtP//ALX//wC3//8As/j/ALX4/wC09P8AtfjtALf9/wCz+P8AtP3/ALT//wC0//8Asv//ALH//wCw//8Arv//AK3//wCs//8Aq///AKv//wCq//8AqP//AKf//wCn//8Apv//AKb//wCl//8Apf//AKT//wCk//8ApP//AKX//wCl//8Apv//AKb//wCn//8Ap///AKj//wCq//8Aq///AKv//wCs//8Arf//AK7//wCw//8Asf//ALL//wC0//8Atf//ALf//wC3//8Atfv/ALT2/wKy7v8Ese3/ALHu/wC5//8AuP//ALX+/wC0//8As///ALL//wCx//8AsP//AK7//wCt//8Arf//AKz//wCr//8Aqv//AKr//wCo//8AqP//AKf//wCn//8Ap///AKf//wCn//8Ap///AKf//wCn//8Ap///AKj//wCo//8Aqv//AKr//wCr//8ArP//AK3//wCt//8Arv//ALD//wCx//8Asv//ALP//wC0//8At///ALj//wC5//8Auv//ALj7/wC4+P8At/b/ALX2/wC3+v8Auf//ALX+/wC1//8AtP//ALP//wCy//8Asf//ALD//wCw//8Arv//AK3//wCs//8ArP//AKv//wCq//8Aqv//AKr//wCo//8AqP//AKj//wCo//8AqP//AKj//wCo//8Aqv//AKr//wCq//8Aq///AKz//wCs//8Arf//AK7//wCw//8AsP//ALH//wCy//8As///ALT//wC1//8At///ALn//wC3+/8At/j/ALTy/wG18v8CtfLzALPx/wC5//8AtPj/ALj//wa+//8Twf//B73//wC4//8AtP//ALL//wCx//8AsP//AK7//wCt//8Arf//AKz//wCs//8Aq///AKv//wCr//8Aqv//AKr//wCq//8Aqv//AKr//wCr//8Aq///AKv//wCs//8ArP//AK3//wCt//8Arv//ALD//wCx//8Asv//ALL//wCz//8AtP//ALX//wC3//8AuP//ALn//wC6//8Auv7/ArXy/wK39P8AuPbfALn7/wC4+v8Auv//H8X//1nY//85zf//IMX//w2///8Auv//ALf//wC0//8Asf//ALD//wCw//8Arv//AK7//wCt//8Arf//AKz//wCs//8ArP//AKz//wCs//8ArP//AKz//wCs//8ArP//AK3//wCt//8Arv//AK7//wCw//8AsP//ALH//wCy//8As///ALT//wC0//8Atf//ALf//wC4//8Auf//ALr//wC7//8Aufv/ArXy/wW38/8HtO67ALn4/wC4+P8At/n/c+D//3Xh//9Y2P//O87//yDG//8PwP//ALr//wC3//8AtP//ALP//wCx//8AsP//ALD//wCu//8Arv//AK7//wCt//8Arf//AK3//wCt//8Arf//AK3//wCt//8Arv//AK7//wCu//8AsP//ALD//wCx//8Asv//ALL//wCz//8AtP//ALX//wC3//8At///ALj//wC5//8Auv//ALn+/wC9//8Avf//ALn5/wa38vkItO6TAbn3/wC7/v8Au///muv//5Lq//954f//Wdn//z/R//8oyP//EcD//wW9//8Auf//ALX//wCz//8Asv//ALH//wCx//8AsP//ALD//wCw//8AsP//ALD//wCw//8AsP//ALD//wCw//8AsP//ALD//wCx//8Asf//ALL//wCy//8As///ALT//wC0//8Atf//ALf//wC4//8Auf//ALn//wC6//8Au///ALr9/wC+//8Ct/T/AL///wu17tULte5hCLTu/wC///8Avf//nez//7Dy//+U6///euP//2Db//9F0///L8v//xnE//8Jvv//ALr//wC4//8Atf//ALT//wCy//8Asv//ALL//wCx//8Asf//ALH//wCx//8Asf//ALH//wCx//8Asv//ALL//wCy//8As///ALP//wC0//8AtP//ALX//wC3//8At///ALj//wC5//8Auv//ALr//wC7//8Avf//AL7//wC6+v8FuPT/Bbr2/wi++KMNuO4fBrr2/wa38v8Au/v/ceH//8H5//+w9P//mu3//4Tm//9q3v//T9X//zjO//8ixv//D8H//wS9//8AuP//ALf//wC1//8As///ALP//wCz//8As///ALL//wCy//8Asv//ALP//wCz//8As///ALP//wC0//8AtP//ALT//wC1//8At///ALf//wC4//8AuP//ALn//wC6//8Au///AL3//wC9//8Avv//AL///wK6+P8Awf//B774/x6+8V3///8BDbju1Qm38P8EuPT/H8f//8z9///E+v//tPb//6Du//+M6P//c+H//1nZ//9G0///K8r//xrE//8Lv///ALr//wC4//8At///ALT//wC0//8AtP//ALT//wC0//8AtP//ALT//wC0//8AtP//ALX//wC1//8Atf//ALf//wC3//8AuP//ALj//wC5//8Auv//ALr//wC7//8Avf//AL7//wC+//8Auvr/AL37/wDA//8LuvL/GcP4/TPG8hv///8BHr7xewy68/8Bvvv/BLn2/4Ln///X////yvv//7r3//+o8v//kuv//37k//9m3v//S9T//zfO//8fx///DcH//wK9//8Auf//ALn//wC3//8Atf//ALX//wC1//8Atf//ALX//wC3//8At///ALf//wC3//8AuP//ALj//wC5//8Auf//ALr//wC6//8Au///AL3//wC9//8Avv//AL///wC///8Au/r/Ar36/wi99/8bwfb/L8z7u////wH///8BM8j3GyDB9P0Hw///AL79/w3D///X////3f///9D9///E+v//tPb//6Du//+K6P//b+D//1XY//8+0P//J8r//xPE//8Hv///ALv//wC6//8Auf//ALj//wC4//8AuP//ALj//wC4//8AuP//ALj//wC5//8Auf//ALn//wC6//8Auv//ALv//wC7//8Avf//AL7//wC+//8Av///AMD//wDA//8Awf//CcH9/x/B9P8zy/n/TMz0Vf///wH///8B////ATfM+Z8lwfH/EcD4/wDA//9O2f//5v///9/////X////yvv//734//+q8v//kev//3jj//9e2///R9P//y7M//8ax///CcH//wC+//8Au///ALr//wC5//8Auf//ALn//wC5//8Auv//ALr//wC6//8Auv//ALv//wC7//8Avf//AL3//wC+//8Avv//AL///wC///8AwP//AMH//wDD//8Mxf//IsX3/zXQ//9M0vvPZdT3A////wH///8B////AVPQ9Cc+y/T9Jc7//xHK//8CxP//euX//+r////j////2f///839///A+f//q/P//5rt//+A5v//Zd7//0zV//810P//H8j//w7E//8FwP//AL3//wC9//8Au///ALv//wC7//8Au///ALv//wC7//8Avf//AL3//wC9//8Avv//AL7//wC///8Av///AMD//wDB//8Awf//CL75/xPH//8i0f//OtP//1LR9/9o2v9F////Af///wH///8B////Af///wFZ2f+LRdH6/zPI9v8fx/v/C8j//6fx///t////5v///97////S////xvv//7T3//+h8f//i+r//2/h//9U2P//O9H//ybM//8Txf//CMP//wDA//8Av///AL7//wC9//8Avf//AL3//wC+//8Avv//AL7//wC///8Av///AMD//wDA//8Awf//AMH//wDD//8LyP//Gs3//zHN/f9F0Pr/Wdv//27e/7v///8B////Af///wH///8B////Af///wF12vkNZNT34U7Y//8+zvr/JtL//xvM//+y9///8P///+f////h////1////8v9//+7+P//p/L//5Lr//904///Xd3//0LU//8tzf//G8j//w3E//8Fw///AMD//wC+//8Av///AL///wC///8Av///AMD//wDA//8AwP//AMH//wDB//8Aw///Ccf//xfM//8m0v//Odj//0/S+v9i4f//deH/+YXd+TH///8B////Af///wH///8B////Af///wH///8Bf+P/PW7e//lb3f//Stn//znS//8n0f//nvL///P////s////5f///9r////O/v//vfj//6jz//+Q6///euX//2He//9L2P//MtD//yDK//8Tx///CcX//wXD//8AwP//AMD//wDA//8AwP//AMH//wDB//8Aw///AsX//wzI//8Yzf//J9D//zjT//9K2f//W+H//27d/v9+3fr/jN/6Y////wH///8B////Af///wH///8B////Af///wH///8B////AYjk/2952/n/a+H//1ne//9K2v//Odj//5Ls///y////8P///+b////b////0P7//8D6//+t9P//me7//4To//9q4f//Utr//zvT//8ozv//G8r//w/H//8FxP//AMH//wDB//8Aw///BcX//wvI//8UzP//HtD//yvT//861///Stn//1rY//9r5v//euD//4jl//+S4PuR////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wGO4PqHhd35/3rk//9s4///XeP//07e//976v//5/////P////s////5P///9j////K/v//t/j//6Ly//+N7P//eOb//1/f//9I2P//ONP//yvS//8gzv//Dsr//xPL//8azf//IdH//yvT//811///RNT//0/a//9d4///bOb//3vq//+H7P//kOP9/5fj+7uX4/sD////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BmOX+k5Hh+/+I5f//f+z//3Pn//9n5f//Zd7//8H9///4////8f///+v////f////0////8T9//+0+P//n/P//4zt//956P//aOP//1vf//9S3v//MtT//zfX//8+2f//Rtv//1HZ//9b4f//Z+X//3Po//9/7P//iur//5Lm//+X4/v/l+P7w5fj+w////8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AZnn/3mZ5v//k+T+/5Hx//+H7P//feH//3Xo//+X8f//4/////f////w////6P///97////T////xf7//7f5//+n9v//mfL//5Du//+E7P//WeD//13j//9k5P//bOT//3Xo//9+6///hur//47n//+U5///nfL//5fj+/+a6v+vmOX+Cf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wGZ6v9Fmur/65nn//+d8v//lOf//5Pw//+M7v//hu3//6j3///l////9/////D////q////4f///9j////Q////xf3//7r7//+h9P//e+v//4Dr//+F5v//iub//5Dm//+Z8///nvT//5rs//+d8f//l+P7+Zfj+3X///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8Bmef/FZfj+5eZ5//9mej//5jl/v+e9P//nvT//5rz//+X8P//pvf//8z6///l////8f///+7////n////3f///779//+V7f//mPH//5rz//+a6///nfH//5no//+Y5v//mej//5fj+/+X4/u3l+P7Mf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wGX4/slmej/q5fj+/+X4/v/l+P7/5no//+a6v//mur//5rs//+d8v//nvT//6Lz//+m7v//mej//57z//+e9P//nvT//5jm//+d8P//m+7//5vu//+X4/v/l+P7z5fj+0P///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AZjk/TeY5P2fl+P785rr//+b7v//nfH//5fj+/+b7v//mur//5nn//+b8P//nvP//53x//+d8P//mef//5nm//+X4/v/mOb//5fj+7WX4/tR////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BmOX+CZnm/0uX4/uLl+P7yZnm//Oa6v//mej//5fj+/+b7f//meb//5nm//+a6v//mOT9z5nn/5+X4/tbl+P7Gf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wEAAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8AAAAAAAD//wAAAAAAAP//AAAAAAAA//8=';
		    var alias = "onet.pl";
		    var description = "Wyszukiwarka Onet.pl";
		    var method = "get";
		    var url = "http://szukaj.onet.pl/wyniki.html?qt={searchTerms}";
		    this.search.addEngineWithDetails(name, icon, alias,
			    description, method, url);
		    szukaj = this.search.getEngineByName(name);
		}
		if (szukaj.hidden) {
		    szukaj.hidden = false;
		}
		this.search.moveEngine(szukaj, 0);
		this.search.currentEngine = szukaj;
		// flag installed
		OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			.setBoolPref("search.install", false);
	    } catch (ex) {
		OnetToolbar.error(ex);
	    }
	} else {
	    OnetToolbar.searchShutdown();
	}

	// // DEBUG / TODO: cleanup
	// var s = "";
	// var engs = this.search.getEngines();
	// for ( var i = 0; i < engs.length; i++) {
	// var e = engs[i];
	// e.QueryInterface(Components.interfaces.nsISearchEngine);
	// s += "\n"
	// + e.alias
	// + " | "
	// + e.description
	// + " | "
	// + e.hidden
	// + " | "
	// + (e.iconURI.QueryInterface(Components.interfaces.nsIURI)).prePath
	// + " | " + e.name + " | " + e.searchForm + " | " + e.type
	// + "\n";
	// }
	// OnetToolbar.debug(s);
    },

    /**
     * remove Onet search engine and reinstall previous selected search.
     */
    searchShutdown : function() {

	OnetToolbar.debug("searchShutdown - unsinstall 'szukaj'");

	try {
	    /* params see: onet open search plugin */
	    var szukaj = this.search.getEngineByName("OnetSzukaj");

	    if (this.search.currentEngine == szukaj) {
		// reinstall last saved search engine
		OnetToolbar.debug("Reinstall: "
			+ OnetToolbar.prefService.getBranch(
				OnetToolbar.prefPrefix).getCharPref(
				"optin.search.reset"));

		var userEngine = this.search
			.getEngineByName(OnetToolbar.prefService.getBranch(
				OnetToolbar.prefPrefix).getCharPref(
				"optin.search.reset"));
		if (userEngine != null) {
		    this.search.moveEngine(userEngine, 0);
		    this.search.currentEngine = userEngine;
		} else {
		    // TODO: unspecified behaviour ...
		    // let mozilla choose an engine?!
		}
	    }
	    if (szukaj != null) {
		this.search.removeEngine(szukaj);
	    }
	    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .setBoolPref("search.install", true);

	} catch (ex) {
	    OnetToolbar.error(ex);
	}
    },

    /**
     * Initialization: all that has to be done to make toolbar working!
     * 
     * IMPORTANT DEVELOPER NOTE: this function must be idempotent! Reetrant
     * calls might happen anytime!
     */
    init : function() {
	this.searchSetup();
	this.bookmarks();
	this.newTabSetup();
	this.homepageSetup();
	OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref(
		"uninstall", false);
    },

    /**
     * util to reset any configuration changes made by installing this addon.
     * 
     * NOTE: must be re-entrant & idempotent!
     */
    disable : function() {
	this.newTabShutdown();
	this.searchShutdown();
    this.bookmarksCleanup();
    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			.setBoolPref("bookmarks.install", true);
	this.homepageShutdown();
	// TODO: bookmarks revert
    },

    /**
     * cleanup any footprints left by this addon.
     */
    destroy : function() {
	// check if you really, really want to destory this addon
	if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getBoolPref("uninstall")) {
	    this.disable();
	    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .deleteBranch("");
	}
    },

    /**
     * onLoad: hook for page load event. (see below).
     */
    onUnLoad : function() {
	OnetToolbar.debugAddon("onUnLoad");
	this.requester.stop();
	this.cookieObserver.unregister();
	this.httpReqObserver.unregister();
	this.appObserver.unregister();
	this.prefsObserver.unregister();
	this.disable();
	this.destroy();
    },

    /**
     * Util: checks and sets state of menuitems (email).
     * 
     * @param id
     */
    checkEmailAlertState : function() {
	// check APE channel state:
	if (OnetToolbar.getMailCount() > 0) {
	    document.getElementById(
		    'pl-onet-addon-toolbar-cmd-email-disconnect')
		    .removeAttribute("disabled");
	} else {
	    document.getElementById(
		    'pl-onet-addon-toolbar-cmd-email-disconnect').setAttribute(
		    "disabled", "true");
	}

	// check if logged into email (cookie)
	if (OnetToolbar.hasAuthCookie()) {
	    document.getElementById('pl-onet-addon-toolbar-cmd-email-logout')
		    .removeAttribute("disabled");
	} else {
	    document.getElementById('pl-onet-addon-toolbar-cmd-email-logout')
		    .setAttribute("disabled", "true");
	}
    },

    /**
     * Email Tooltip: offer the user to log into onet email.
     */
    emailAlert : function(visible) {
	var emailtooltip = document
		.getElementById('pl-onet-addon-toolbar-emailtooltip');

	// override visibility if user set pref to "emailalert=false"
	if (!OnetToolbar.isEmailalertShownever()
		&& !OnetToolbar.hasAuthCookie()
		&& OnetToolbar.isEmailalertShow() && visible) {
	    var anchor = document
		    .getElementById('pl-onet-addon-toolbar-button-6');
	    // TODO code cleanup
	    var x = OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .getIntPref("emailalert.x");
	    var y = OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		    .getIntPref("emailalert.y");
	    var attributesOverride = OnetToolbar.prefService.getBranch(
		    OnetToolbar.prefPrefix).getBoolPref("emailalert.override");
	    var position = OnetToolbar.prefService.getBranch(
		    OnetToolbar.prefPrefix).getCharPref("emailalert.position");
	    emailtooltip.openPopup(anchor, position, x, y, false,
		    attributesOverride);
	} else {
	    emailtooltip.hidePopup();
	}
    },

    /**
     * set emailalert.shownever preferences.
     * 
     * @param value
     */
    setEmailalertShownever : function(value) {
	OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref(
		'emailalert.shownever', value);
    },

    /**
     * get emailalert.shownever preferences.
     * 
     * @param value
     */
    isEmailalertShownever : function() {
	return OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getBoolPref('emailalert.shownever');
    },

    /**
     * set emailalert.show preferences.
     * 
     * @param value
     */
    setEmailalertShow : function(value) {
	OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref(
		'emailalert.show', value);
    },

    /**
     * get emailalert.show preferences.
     */
    isEmailalertShow : function() {
	return OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getBoolPref('emailalert.show');
    },

    /**
     * onLoad: hook for page load event. (see below).
     */
    onLoad : function() {
	OnetToolbar.debugAddon("onLoad");

	this.init();

	AddonManager.getAddonByID("toolbar.addon@onet.pl", function(addon) {
	    // NOTE: this is an _asynchronous_ call!
	    OnetToolbar.debug("Addon Version :: toolbar.addon@onet.pl "
		    + addon.version);
	    OnetToolbar.version = addon.version;
	});

	this.manageAddon();

	this.tracking = OnetToolbar.prefService.getBranch(
		OnetToolbar.prefPrefix).getCharPref("tracking");

	/*
	 * Re-Install polling option ... I hate these groundhog days!
	 */
	this.requester = new OnetToolbar.PeriodicalRequester(
		'https://authorisation.grupaonet.pl/loginbar.js?app_id=firefoxtool.widget.onet.pl.front&url=http%3A%2F%2Ffirefoxtool.widget.onet.pl%2F&body[params][fields]=login%2Cchannel%2Ccounter&callback=JSONPLoader.callbacks.success1',
		/*
		 * condition:
		 */
		function() {
		    OnetToolbar.debug("Requester Handle: "
			    + this.intervalHandle + "\nAuthCookie: "
			    + OnetToolbar.hasAuthCookie());
		    return (OnetToolbar.hasAuthCookie());
		},
		/*
		 * callback
		 * 
		 * Precondition: - auth cookie is present.
		 */
		function(data) {
		    // get mail counter:
		    var res = data.match(/(["\'])counter\1:([0-9]+)/);
		    var mailCounter = res != null ? res.pop() : '';
		    OnetToolbar.updateMailCounter(mailCounter);
		},
		/*
		 * fallback - if condition is false.
		 * 
		 * Precondtion: no auth cookie present.
		 */
		function() {
		    // TODO: if APE module back in place, this needs to be
		    // changed!
		    // see: https://as-jira.axelspringer.de/browse/BO-53
		    OnetToolbar.disconnect();
		}, OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
			.getIntPref('interval'));

	this.requester.start(); // start polling ... *sigh*

	this.cookieObserver = new OnetToolbar.Observer(
		"cookie-changed",
		function(subject, topic, data) {
		    if (OnetToolbar.authCookieName == subject
			    .QueryInterface(Components.interfaces.nsICookie).name) {
			// found cookie change ... check email:
			OnetToolbar.requester.request();

			if (data == "deleted") {
			    // TODO fix after APE back online ...
			    // https://as-jira.axelspringer.de/browse/BO-53
			    OnetToolbar.disconnect();
			}

			// TODO: is this the right thing?
			OnetToolbar.checkEmailAlertState();
		    }
		});

	this.httpReqObserver = new OnetToolbar.Observer(
		"http-on-modify-request",
		function(subject, topic, data) {
		    subject
			    .QueryInterface(Components.interfaces.nsIHttpChannel);

		    subject.setRequestHeader("user-agent", subject
			    .getRequestHeader("user-agent")
			    + (OnetToolbar.tracking + OnetToolbar.version),
			    false);
		});

	this.appObserver = new OnetToolbar.Observer(
		"sessionstore-windows-restored",
		function(subject, topic, data) {
		    OnetToolbar.optinShow();

		    // on each browser start show user email login tooltip:
		    window.setTimeout(function() {
			OnetToolbar.setEmailalertShow(true);
			OnetToolbar.emailAlert(true);
			OnetToolbar.setEmailalertShow(false);
		    }, OnetToolbar.prefService
			    .getBranch(OnetToolbar.prefPrefix).getIntPref(
				    'emailalert.interval'));
		});

	this.prefsObserver = new OnetToolbar.PrefsObserver(
		OnetToolbar.prefPrefix,
		function(subject, topic, data) {
		    OnetToolbar.debug("PrefsObserver:" + "\nsubject :: "
			    + subject + "\ntopic :: " + topic + "\ndata :: "
			    + data);

		    // listen only on "mailCounter" changes:
		    if (data.toString().contains("toolbar.interval")) {
			OnetToolbar.requester
				.setInterval(OnetToolbar.prefService.getBranch(
					OnetToolbar.prefPrefix).getIntPref(
					"interval"));
			OnetToolbar.requester.stop();
			OnetToolbar.requester.start();
		    }

		    // new tab changes:
		    if (data.toString().contains("optin.newtab")) {
			OnetToolbar.newTabSetup();
		    }

		    // new tab changes:
		    if (data.toString().contains("optin.search")) {
			OnetToolbar.searchSetup();
		    }

		    // new tab changes:
		    if (data.toString().contains("optin.homepage")) {
			OnetToolbar.homepageSetup();
		    }

		    // listen only on "mailCounter" changes:
		    if (data.toString().contains(".mailCounter")) {

			if (this.counter == undefined) {
			    this.counter = OnetToolbar.getMailCount();
			}

			OnetToolbar.debug("PrefsObserver - MailCount/Counter: "
				+ OnetToolbar.getMailCount() + " / "
				+ this.counter);

			try {
			    if (this.counter < OnetToolbar.getMailCount()) {
				var soundUrl = "chrome://pl.onet.toolbar/content/sound/"
					+ OnetToolbar.prefService.getBranch(
						OnetToolbar.prefPrefix)
						.getCharPref(
							"emailalert.soundFile");

				OnetToolbar
					.debug("PrefsObserver - play sound: "
						+ soundUrl);

				(new Audio(soundUrl)).play();
			    }
			    this.counter = OnetToolbar.getMailCount();
			} catch (e) {
			    OnetToolbar.debug(e);
			}
		    }
		    OnetToolbar.checkEmailAlertState();
		    OnetToolbar.updateMailCounter();
		});

	// DISABLED: install toolbar button to navigation toolbar: should not be
	// shown on startup (Meeting 2013-05-15)
	// this.installToolbarButton("nav-bar",
	// "pl-onet-addon-toolbar-toolbarButton");#

    },

    /**
     * Disconnect from email polling.
     */
    disconnect : function() {
	// TODO fix after APE back online ->
	// https://as-jira.axelspringer.de/browse/BO-53
	OnetToolbar.updateMailCounter(0);
    },

    /**
     * remember mailcount (local service)
     */
    setMailCount : function(aMailCount) {
	OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setCharPref(
		"mailCounter", aMailCount);
    },

    /**
     * retrieve last mail count (local service)
     */
    getMailCount : function() {
	return OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
		.getCharPref("mailCounter");
    },

    /**
     * update view (see: onet-toolbar-overlay.xul)
     */
    updateMailCounter : function(mailCounter) {
	mailCounter = mailCounter == undefined ? OnetToolbar.getMailCount()
		: mailCounter;

	var e = document
		.getElementById('pl-onet-addon-toolbar-email-mailObserver');

	if (!mailCounter || mailCounter == "0") {
	    e.setAttribute('style', 'display:none;');
	} else {
	    e.setAttribute('style', 'display:block;');
	    e.textContent = mailCounter;
	}
	// IMPORTANT NOTE: see OnetToolbar.prefsObserver ... !
	if (mailCounter != OnetToolbar.getMailCount()) {
	    OnetToolbar.setMailCount(mailCounter);
	}
    },

    /**
     * toggle onet toolbar visibiliy.
     * 
     * @param e
     */
    onToolbarButtonCommand : function(e) {
	var tb = document.getElementById("pl-onet-addon-toolbar-toolbar");

	if (tb.getAttribute('collapsed')) {
	    tb.removeAttribute('collapsed');
	} else if (!tb.getAttribute('collapsed')) {
	    tb.setAttribute('collapsed', true);
	}
    },

    /**
     * Open a url in a named tab. Reuse tab if tab already open.
     * 
     * @param url -
     *                url to show in tab. required.
     * @param name -
     *                name of tab to use. can be null.
     * @param reload -
     *                for named tabs: reload after focus.
     */
    openTab : function(url, name, reload) {

	if (name == undefined && reload == undefined) {
	    openUILinkIn(url, "tab");
	    return;
	}

	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
		.getService(Components.interfaces.nsIWindowMediator);

	for ( var found = false, index = 0, tabbrowser = wm.getEnumerator(
		'navigator:browser').getNext().gBrowser; index < tabbrowser.tabContainer.childNodes.length
		&& !found; index++) {

	    // Get the next tab
	    var currentTab = tabbrowser.tabContainer.childNodes[index];

	    // Does this tab contain our custom attribute?
	    if (currentTab.hasAttribute(name)) {

		// Yes--select and focus it.
		tabbrowser.selectedTab = currentTab;

		if (reload
			|| !tabbrowser.currentURI.host.contains((Services.io
				.newURI(url, null, null).host))) {
		    // reload url
		    tabbrowser.loadURI(url);
		}

		// Focus *this* browser window in case another one is
		// currently focused
		tabbrowser.ownerDocument.defaultView.focus();
		found = true;
	    }
	}

	if (!found) {
	    // Our tab isn't open. Open it now.
	    var browserEnumerator = wm.getEnumerator("navigator:browser");
	    var tabbrowser = browserEnumerator.getNext().gBrowser;

	    // Create tab
	    var newTab = tabbrowser.addTab(url);
	    newTab.setAttribute(name, "onet-tabbed-browser-" + name);

	    // Focus tab
	    tabbrowser.selectedTab = newTab;

	    // Focus *this* browser window in case another one is currently
	    // focused
	    tabbrowser.ownerDocument.defaultView.focus();
	}   else {
     //disconect from OnetPoczta
	      if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getIntPref('StatusBarState') != 1) {
		        windowClose();
	      }
      }
    },

    /**
     * Installs the toolbar button with the given ID into the given toolbar, if
     * it is not already present in the document.
     * 
     * @param {string}
     *                toolbarId The ID of the toolbar to install to.
     * @param {string}
     *                id The ID of the button to install.
     * @param {string}
     *                afterId The ID of the element to insert after.
     * @optional
     */
    installToolbarButton : function(toolbarId, id, afterId) {

	if (!document.getElementById(id)) {
	    var toolbar = document.getElementById(toolbarId);

	    // If no afterId is given, then append the item to the toolbar
	    var before = null;
	    if (afterId) {
		elem = document.getElementById(afterId);
		if (elem && elem.parentNode == toolbar)
		    before = elem.nextElementSibling;
	    }

	    toolbar.insertItem(id, before);
	    toolbar.setAttribute("currentset", toolbar.currentSet);
	    document.persist(toolbar.id, "currentset");

	    if (toolbarId == "addon-bar")
		toolbar.collapsed = false;
	}
    },

    /**
     * getAuthCookie: onet email sets cookie if user has logged into onet email.
     * 
     * Returns value of authCookie or null if cookie not found.
     */
    getAuthCookie : function(aHostName, aCookieName) {
	if (aHostName == null || aHostName == '')
	    aHostName = OnetToolbar.authHostName;
	if (aCookieName == null || aCookieName == '')
	    aCookieName = OnetToolbar.authCookieName;

	var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"]
		.getService(Components.interfaces.nsICookieManager);

	for ( var e = cookieMgr.enumerator; e.hasMoreElements();) {
	    var cookie = e.getNext().QueryInterface(
		    Components.interfaces.nsICookie);
	    if (aCookieName == cookie.name && aHostName == cookie.host) {
		return cookie.value;
	    }
	}
	return null;
    },

    /**
     * Check if user is logged in to onet.pl email (cookie present?)
     */
    hasAuthCookie : function() {
	return (OnetToolbar.getAuthCookie(OnetToolbar.authHostName,
		OnetToolbar.authCookieName) != null);
    },

    /**
     * Opt-In: show optin/preference panel and continue with selected forward
     * option.
     */
    optinShow : function() {
        var isOnetBrowser = false;        
		isOnetBrowser = OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getBoolPref("brandedbrowser");
        if (!isOnetBrowser) {
            if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getBoolPref('optin.show')) {
                var params = {
                    inn : {
                        name : "foo",
                        description : "bar",
                        enabled : true
                    },
                    out : null
                    };
                window.openDialog("chrome://pl.onet.toolbar/content/onet-toolbar-optin.xul","", "chrome,centerscreen,dialog,resizable=no,close=no,toolbar=no,scrollbars=no,titlebar=no,status=no,alwaysRaised", params).focus();
                OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref('optin.show', false);
            }
            OnetToolbar.openTab(OnetToolbar.forward_addon_page);
		} else {        
            if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getBoolPref('optin.show')) {
                OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref('optin.show', false);
                OnetToolbar.openTab(OnetToolbar.forward_bundle_page);		
            }
        }
    },
};

/**
 * PeriodicalRequester: repeatedly (async.) request URL if 'condition()' is met
 * every 'interval' ms and calls 'callback(data)' function on response using
 * response 'data'. If condition is not met, 'fallback()' will be called.
 * 
 * @param url
 * @param callback
 * @param condition
 * @param fallback
 * @returns {OnetToolbar.PeriodicalRequester}
 */
OnetToolbar.PeriodicalRequester = function(url, condition, callback, fallback,
	interval) {
    this.url = url;
    this.condition = typeof condition == 'function' ? condition : function() {
	return false;
    };
    this.callback = typeof callback == 'function' ? callback : function() {
    };
    this.fallback = typeof fallback == 'function' ? fallback : function() {
    };
    this.rqsInterval = interval ? interval : OnetToolbar.prefService.getBranch(
	    OnetToolbar.prefPrefix).getIntPref('interval');
};
OnetToolbar.PeriodicalRequester.prototype = {
    constructor : OnetToolbar.PeriodicalRequester,
    url : '',
    condition : null,
    callback : null,
    fallback : null,
    intervalHandle : null,
    rqsInterval : 0
};
OnetToolbar.PeriodicalRequester.prototype.request = function() {
    if (this.condition()) {
	var scope = this;
	var request = new XMLHttpRequest();
	request.open("GET", this.url);
	request.setRequestHeader("Content-Type", "application/json");
	request.overrideMimeType("text/plain");
	request.onload = function() {
	    scope.callback(request.responseText);
	};
	request.send();
    } else {
	this.fallback();
    }
};
OnetToolbar.PeriodicalRequester.prototype.stop = function() {
    if (this.intervalHandle != null) {
	window.clearInterval(this.intervalHandle);
	this.intervalHandle = null;
    }
};
OnetToolbar.PeriodicalRequester.prototype.start = function() {
    if (this.intervalHandle == null) {
	var scope = this;
	this.intervalHandle = window.setInterval(function() {
	    return scope.request.bind(scope)();
	}, this.rqsInterval);
    }
    this.request();
};
OnetToolbar.PeriodicalRequester.prototype.setInterval = function(ms) {
    OnetToolbar.debug("Requester got: " + ms);
    this.rqsInterval = ms;
    OnetToolbar.debug("Requester set: " + this.rqsInterval);
};

/**
 * Observe and behave!
 */
OnetToolbar.Observer = function(topic, action) {
    this.topic = topic;
    this.action = typeof action == 'function' ? action : function() {
	return false;
    };
    this.service = Services.obs;
    this.register();
};
OnetToolbar.Observer.prototype = {
    observe : function(subject, topic, data) {
	this.action(subject, topic, data);
    },
    register : function() {
	this.service.addObserver(this, this.topic, false);
    },
    unregister : function() {
	this.service.removeObserver(this, this.topic);
    }
};

/**
 * Observe preferences and behave!
 */
OnetToolbar.PrefsObserver = function(branch, action) {
    this.branch = branch;
    this.action = typeof action == 'function' ? action : function() {
	return false;
    };
    this.service = Services.prefs;
    this.register();
};
OnetToolbar.PrefsObserver.prototype = {
    observe : function(subject, topic, data) {
	this.action(subject, topic, data);
    },
    register : function() {
	this.service.addObserver(this.branch, this, false);
    },
    unregister : function() {
	this.service.removeObserver(this.branch, this);
    }
};

/**
 * Register listeners:
 */
window.addEventListener("load", function() {
    OnetToolbar.onLoad();
}, false);
window.addEventListener("unload", function() {
    OnetToolbar.onUnLoad();
}, false);