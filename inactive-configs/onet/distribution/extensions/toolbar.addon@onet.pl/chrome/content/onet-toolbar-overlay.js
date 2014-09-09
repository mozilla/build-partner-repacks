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
    homepage_onet: "http://www.onet.pl/?utm_source=onetbrotab&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* TODO: use value from prefs: homepage option B */
    homepage_szujak: "http://szukaj.onet.pl/?utm_source=szukajbrotab&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* TODO: use value from prefs? - forward to konto */
    forward_register: "https://konto.onet.pl/register-email.html?utm_source=newmailbrotab&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* TODO: use value from prefs? - forward login email */
    forward_login: "http://konto.onet.pl/?utm_source=pocztabrobook&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* TODO: get from install.rdf */
    forward_addon_page: "http://witaj.onet.pl/toolbar",
    forward_bundle_page: "http://witaj.onet.pl/?utm_source=onetbrotab&utm_medium=onetbrowser&utm_campaign=onetsg_browser",
    /* cookie set when logged into onet email */
    authCookieName: 'onet_token',
    /* onet authorization host */
    authHostName: 'authorisation.grupaonet.pl',
    /* using prefs as helpers */
    prefPrefix: "extensions.pl.onet.addon.toolbar.",
    tracking: "666", // onet tracking id for google analytics
    version: "0.0", // addon version see onLoad()
    requester: null,
    /* observers */
    cookieObserver: null,
    httpReqObserver: null,
    appObserver: null,
    prefsObserver: null,
    /* service utils */
    search: Services.search,
    console: Services.console,
    prefService: Services.prefs,
    propService: document.getElementById("onet-toolbar-strings"),
    /* DEBUGGING */
    log: function(lvl, msg) {
        if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
                .getBoolPref("debug")) {
            // TODO: optimize further in later versions ...
            OnetToolbar.console.logStringMessage(lvl + ": " + msg);
        }
    },
    info: function(msg) {
        OnetToolbar.log("INFO", msg);
    },
    error: function(msg) {
        OnetToolbar.log("ERROR", msg);
    },
    debug: function(msg) {
        OnetToolbar.log("DEBUG", msg);
    },
    inspect: function(ojb) {
        var out = "";
        for (var prop in ojb) {
            out += prop + " :: " + ojb[prop] + "\n";
        }
        OnetToolbar.debug(out);
    },
    bookmarks: function() {
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
    bookmarksCleanup: function() {
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
        var bsmvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
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
    debugAddon: function(m) {
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
    manageAddon: function() {

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
            onDisabling: function(addon, needsRestart) {
                if (addon.id == "toolbar.addon@onet.pl") {
                    OnetToolbar.debugAddon("onDisabling");
                    // take action:
                    OnetToolbar.disable();
                }
            },
            onUninstalling: function(addon, needsRestart) {
                if (addon.id == "toolbar.addon@onet.pl") {
                    OnetToolbar.debugAddon("onUninstalling");
                    // take action:
                    OnetToolbar.disable();
                    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
                            .setBoolPref("uninstall", true);
                }
            },
            onOperationCancelled: function(addon) {
                if (addon.id == "toolbar.addon@onet.pl") {
                    OnetToolbar.debugAddon("onOperationCancelled");
                    // take action:
                    OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
                            .setBoolPref("uninstall", false);
                    OnetToolbar.init();
                }
            },
            onPropertyChanged: function(addon, properties) {
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
    newTabSetup: function() {

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
            OnetToolbar.prefService.setBoolPref("browser.newtabpage.enabled", true);
        } else {
            this.newTabShutdown();
        }
    },
    /**
     * Re-set new tab feature to previous user setting.
     */
    newTabShutdown: function() {

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
    homepageSetup: function() {

        var optin = OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getIntPref("optin.homepage");
        if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getCharPref("optin.homepage.reset") == "") {
            OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setCharPref("optin.homepage.reset", OnetToolbar.prefService.getCharPref("browser.startup.homepage"));
        }
        if (optin == 3) {
            // opt-out
            OnetToolbar.homepageShutdown();
        } else {
            // on first encounter, save the current user setting:
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
    homepageShutdown: function() {

        // reset home page:
        if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
                .getCharPref("optin.homepage.reset") != "") {

            OnetToolbar.prefService.setCharPref("browser.startup.homepage", OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getCharPref("optin.homepage.reset"));

            // reset prefs:
            OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setCharPref("optin.homepage.reset", "");
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
    searchSetup: function() {

        if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getBoolPref("optin.search")) {

            if (!OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getBoolPref("search.install")) {
                return;
            }
            OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref("search.install", false);

            try {
                var name = "OnetSzukaj";
                var szukaj = this.search.getEngineByName(name);
                OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setCharPref("optin.search.reset", this.search.currentEngine.name);
                if (!szukaj) {
                    this.search.addEngine('chrome://pl.onet.toolbar/content/OnetSzukaj.xml', Components.interfaces.nsISearchEngine.DATA_XML, null, false)
                }
                var self = this
                window.setTimeout(function() {
                    try {
                        var szukaj = self.search.getEngineByName(name);
                        if (szukaj.hidden) {
                            szukaj.hidden = false;
                        }
                        self.search.moveEngine(szukaj, 0);
                        self.search.currentEngine = szukaj;
                    } catch (ex) {

                    }

                }, 1100)

                // flag installed
            } catch (ex) {
                //OnetToolbar.error(ex);
            }
        } else {
            OnetToolbar.searchShutdown();
        }
    },
    /**
     * remove Onet search engine and reinstall previous selected search.
     */
    searchShutdown: function() {

        OnetToolbar.debug("searchShutdown - unsinstall 'szukaj'");

        try {
            /* params see: onet open search plugin */
            var szukaj = this.search.getEngineByName("OnetSzukaj");

            if (this.search.currentEngine == szukaj) {
                // reinstall last saved search engine
                OnetToolbar.debug("Reinstall: " + OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getCharPref("optin.search.reset"));

                var userEngine = this.search.getEngineByName(OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getCharPref("optin.search.reset"));
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
            OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref("search.install", true);

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
    init: function() {
        this.searchSetup();
        this.bookmarks();
        this.newTabSetup();
        this.homepageSetup();
        OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref("uninstall", false);
    },
    /**
     * util to reset any configuration changes made by installing this addon.
     * 
     * NOTE: must be re-entrant & idempotent!
     */
    disable: function() {
        this.newTabShutdown();
        this.searchShutdown();
        this.bookmarksCleanup();
        OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref("bookmarks.install", true);
        this.homepageShutdown();
        // TODO: bookmarks revert
    },
    /**
     * cleanup any footprints left by this addon.
     */
    destroy: function() {
        // check if you really, really want to destory this addon
        if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getBoolPref("uninstall")) {
            this.disable();
            OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).deleteBranch("");
        }
    },
    /**
     * onLoad: hook for page load event. (see below).
     */
    onUnLoad: function() {
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
    checkEmailAlertState: function() {
        // check APE channel state:
        if (OnetToolbar.getMailCount() > 0) {
            document.getElementById('pl-onet-addon-toolbar-cmd-email-disconnect').removeAttribute("disabled");
        } else {
            document.getElementById('pl-onet-addon-toolbar-cmd-email-disconnect').setAttribute("disabled", "true");
        }

        // check if logged into email (cookie)
        if (OnetToolbar.hasAuthCookie()) {
            document.getElementById('pl-onet-addon-toolbar-cmd-email-logout').removeAttribute("disabled");
        } else {
            document.getElementById('pl-onet-addon-toolbar-cmd-email-logout').setAttribute("disabled", "true");
        }
    },
    /**
     * Email Tooltip: offer the user to log into onet email.
     */
    emailAlert: function(visible) {
        var emailtooltip = document
                .getElementById('pl-onet-addon-toolbar-emailtooltip');
        var logout = document.getElementById('pl-onet-addon-toolbar-menu-item-logout');
        var login = document.getElementById('pl-onet-addon-toolbar-menu-item-login');
        if (logout.style.display == 'none') {
            logout.style.visibility = 'visible'
        }
        // override visibility if user set pref to "emailalert=false"
        if (!OnetToolbar.isEmailalertShownever()
                && !OnetToolbar.hasAuthCookie()
                && OnetToolbar.isEmailalertShow() && visible) {
            var anchor = document.getElementById('pl-onet-addon-toolbar-button-6');
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
    setEmailalertShownever: function(value) {
        OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref(
                'emailalert.shownever', value);
    },
    /**
     * get emailalert.shownever preferences.
     * 
     * @param value
     */
    isEmailalertShownever: function() {
        return OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
                .getBoolPref('emailalert.shownever');
    },
    /**
     * set emailalert.show preferences.
     * 
     * @param value
     */
    setEmailalertShow: function(value) {
        OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref(
                'emailalert.show', value);
    },
    /**
     * get emailalert.show preferences.
     */
    isEmailalertShow: function() {
        return OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
                .getBoolPref('emailalert.show');
    },
    /**
     * onLoad: hook for page load event. (see below).
     */
    onLoad: function() {
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
                    disconnect: function() {
                        // TODO fix after APE back online ->
                        // https://as-jira.axelspringer.de/browse/BO-53
                        OnetToolbar.updateMailCounter(0);
                    },
                    /**
                     * remember mailcount (local service)
                     */
                    setMailCount: function(aMailCount) {
                        OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setCharPref(
                                "mailCounter", aMailCount);
                    },
                    /**
                     * retrieve last mail count (local service)
                     */
                    getMailCount: function() {
                        return OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix)
                                .getCharPref("mailCounter");
                    },
                    /**
                     * update view (see: onet-toolbar-overlay.xul)
                     */
                    updateMailCounter: function(mailCounter) {
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
                    onToolbarButtonCommand: function(e) {
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
                    openTab: function(url, name, reload) {

                        if (name == undefined && reload == undefined) {
                            openUILinkIn(url, "tab");
                            return;
                        }

                        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                .getService(Components.interfaces.nsIWindowMediator);

                        for (var found = false, index = 0, tabbrowser = wm.getEnumerator(
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
                        } else {
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
                    installToolbarButton: function(toolbarId, id, afterId) {

                        if (!document.getElementById(id)) {
                            var toolbar = document.getElementById(toolbarId);

                            // If no afterId is given, then append the item to the toolbar
                            var before = null;
                            if (afterId) {
                                elem = document.getElementById(afterId);
                                if (elem && elem.parentNode == toolbar) {
                                    before = elem.nextElementSibling;
                                }
                            }

                            toolbar.insertItem(id, before);
                            toolbar.setAttribute("currentset", toolbar.currentSet);
                            document.persist(toolbar.id, "currentset");

                            if (toolbarId == "addon-bar") {
                                toolbar.collapsed = false;
                            }
                        }
                    },
                    /**
                     * getAuthCookie: onet email sets cookie if user has logged into onet email.
                     * 
                     * Returns value of authCookie or null if cookie not found.
                     */
                    getAuthCookie: function(aHostName, aCookieName) {
                        if (aHostName == null || aHostName == '')
                            aHostName = OnetToolbar.authHostName;
                        if (aCookieName == null || aCookieName == '')
                            aCookieName = OnetToolbar.authCookieName;

                        var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"]
                                .getService(Components.interfaces.nsICookieManager);

                        for (var e = cookieMgr.enumerator; e.hasMoreElements(); ) {
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
                    hasAuthCookie: function() {
                        return (OnetToolbar.getAuthCookie(OnetToolbar.authHostName,
                                OnetToolbar.authCookieName) != null);
                    },
                    /**
                     * Opt-In: show optin/preference panel and continue with selected forward
                     * option.
                     */
                    optinShow: function() {
                        var isOnetBrowser = false;
                        isOnetBrowser = OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getBoolPref("brandedbrowser");
                        if (OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).getBoolPref('optin.show')) {
                            if (!isOnetBrowser) {
                                var params = {inn: {name: "foo", description: "bar", enabled: true}, out: null};

                                setTimeout(function() {
                                    window.openDialog("chrome://pl.onet.toolbar/content/onet-toolbar-optin.xul", "", "chrome,centerscreen,dialog,resizable=no,close=yes,toolbar=no,scrollbars=no,titlebar=yes,status=no, alwaysRaised", params).focus();
                                }, 1500)
                                OnetToolbar.openTab(OnetToolbar.forward_addon_page);
                                OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref('optin.show', false);
                            } else {
                                OnetToolbar.openTab(OnetToolbar.forward_bundle_page);
                                OnetToolbar.prefService.getBranch(OnetToolbar.prefPrefix).setBoolPref('optin.show', false);
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
            constructor: OnetToolbar.PeriodicalRequester,
            url: '',
            condition: null,
            callback: null,
            fallback: null,
            intervalHandle: null,
            rqsInterval: 0
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
            observe: function(subject, topic, data) {
                this.action(subject, topic, data);
            },
            register: function() {
                this.service.addObserver(this, this.topic, false);
            },
            unregister: function() {
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
            observe: function(subject, topic, data) {
                this.action(subject, topic, data);
            },
            register: function() {
                this.service.addObserver(this.branch, this, false);
            },
            unregister: function() {
                this.service.removeObserver(this.branch, this);
            }
        };

        OnetToolbar.APE = function(options) {
            //constructor
            this.freq = options.freq || 0;
            this.protocol = options.protocol || 'http';
            this.host = options.host;
            this.domain = options.domain;
            this.updateCallback = options.update;
            this.identifier = options.identifier || 'ape';
            this.sessid = '';
            this.transport = 'longPolling'; //right now only this is implemented explict and implict
            this.interval = options.interval || 25000;
            this.intervalHandle = null;
            this.cookieName = options.cookieName || 'ape';
            this.cookieManager = options.cookieManager || new APE.CookieManager.normal();

            var cookie = this.cookieManager.read(this.cookieName);
            var tmp = JSON.parse(cookie);
            if (tmp) {
                this.freq = tmp.frequency + 1;
            } else {
                cookie = '{"frequency":0}';
            }
            var reg = new RegExp('"frequency":([ 0-9]+)', "g");
            cookie = cookie.replace(reg, '"frequency":' + this.freq);
            this.cookieManager.write(this.cookieName, cookie);
            //this.cookie.read(this.cookieName);
        };
        OnetToolbar.APE.prototype.buildRequestUrl = function() {
            return APE.Transport[this.transport].getProtocol() + '://' + this.freq + '.' + this.host + '/' + APE.Transport[this.transport].id + '/?';
        };
        OnetToolbar.APE.prototype.error = function(message) {
            if (arguments.length > 1) {

                for (var i = 1; i < arguments.length; i++) {
                    //console.error(arguments[i]);
                }
            }
            // console.debug(this);
        };
        OnetToolbar.APE.prototype.send = function send(data, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', this.buildRequestUrl(), true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            callback(null, JSON.parse(xhr.responseText));
                        } catch (e) {
                            callback(e, null);
                        }
                    } else {
                        callback(new Error(xhr.status), null);
                    }
                }
            };
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            xhr.send(JSON.stringify(data));
            return xhr;
        };
        OnetToolbar.APE.prototype.join = function() {
            var self = this;
            this.send([{"cmd": "JOIN", "chl": 3, "params": {"channels": "*" + this.channel}, "sessid": this.sessid}], function(err, data) {
                if (err === null) {
                    self.check();
                    self.intervalHandle = setInterval(function() {
                        self.check();
                    }, self.interval);
                } else {
                    self.error('join error', err, data);
                }

            });
        };
        OnetToolbar.APE.prototype.check = function() {
            var self = this;
            this.send([{"cmd": "CHECK", "chl": 4, "sessid": this.sessid}], function(err, data) {
                if (err === null) {
                    if (data && data[0].raw === 'notifyuser') {
                        self.updateCallback(data[0].data.counter);
                    }
                } else {
                    self.error('check error', err, data);
                }
            });
        };
        OnetToolbar.APE.prototype.setSession = function(sessid) {
            var self = this;
            this.sessid = sessid;
            this.send([{"cmd": "SESSION", "chl": 2, "params": {"action": "set", "values": {"sessid": this.channel}}, "sessid": this.sessid}], function(err, data) {
                if (err === null) {
                    self.join();
                } else {
                    self.error('session error', err, data);
                }
            });
        };
        OnetToolbar.APE.prototype.connect = function() {
            var self = this;
            this.send([{"cmd": "CONNECT", "chl": 1, "params": {"name": this.channel + (+new Date()).toString()}}], function(err, data) {
                if (err === null) {
                    self.setSession(data[0].data.sessid);
                } else {
                    self.error('connect error', err, data);
                }
            });
        };
        OnetToolbar.APE.prototype.disconnect = function() {
            //this..send('QUIT');
            this.sessid = null;
            clearInterval(this.intervalHandle);
        };
        OnetToolbar.encodeForSearch = function(part) {
            return encodeURIComponent(part)
            var b = ['{', '}', '|', '\\', '^', '[', ']', '`', ';', '/', '?', ':', '@', '&', '=', '+', '$', ' ', '#']
            for (var i in b) {
                part = part.replace(b[i], encodeURIComponent(b[i]))
            }
            return part
        }

        /**
         * Register listeners:
         */
        window.addEventListener("load", function() {
            OnetToolbar.onLoad();
        }, false);
        window.addEventListener("unload", function() {
            OnetToolbar.onUnLoad();
        }, false);
