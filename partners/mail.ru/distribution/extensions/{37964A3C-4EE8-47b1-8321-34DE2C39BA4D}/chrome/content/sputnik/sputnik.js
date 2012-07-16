(function() 
    {
        var appContext = Components.classes["@mail.ru/toolbar/application;1"].getService().wrappedJSObject;
        window.G_Assert = appContext.G_Assert;
        window.G_Debug = appContext.G_Debug;
        window.gMRRefToolbar = null;
        window.gMRRefService = appContext;
        window.addEventListener(
            'load', function(){
                gMRRefToolbar = document.getElementById('mailru_main_toolbar');
                (new SputnikToolbar(gMRRefToolbar)).init();
            },
            false
            );
        window.addEventListener('unload', function(){
            gMRRefToolbar.mMRObject.uninit();
        }, false);
    })();


function SputnikToolbar(elToolbar) {
    this.debugZone = "SputnikToolbar";
    this.toolbar_version = '';
    this.firefox_version = '';
    this.toolbar_id = 'sputnik';
    this.observer = null;
    this.ping_flash = null;
    this.services_array = null;
    this.menu_search_inet =  '';
    this.menu_search_dict =  '';
    this.eventRegistrar =  null;
    this.mSearchCtrl  =  null;
    this.popup_timer = 0;
    this.search_first_press = false;
    this.flash_version = null;
    this.no_ping_to_flash = false;
    this.showInstallPage = false;
    this.prevSearchEngine = null;
	
    this.appContext = Components.classes["@mail.ru/toolbar/application;1"].getService().wrappedJSObject;
    this.chromeURL = "chrome://mail.ru.toolbar/";
    this.informersURL = this.chromeURL + "locale/sputnik/";
    this.appID = "{37964A3C-4EE8-47b1-8321-34DE2C39BA4D}";
    this.mPrefs = new this.appContext.G_Preferences(this.appContext.MRSputnikPrefBase, false, false);    
    this.win = window;

    this.highlighter =  new this.appContext.MRHighlighter(this, "mailru_hilight_btn", "MAIL.RU-Hilighted");
    this.musicController =  new MRMusicContoller(this.appContext, this.chromeURL);
    this.personasListener =  new this.appContext.MRPersonasListener(this);
    this.cookieListener =  new MRCookieListener(this);
    var pageInfo = function pageInfoFunc(browser, info){
        if(!browser.mMRPageInfo && info)
        {
            browser.mMRPageInfo=info;
        }
        return browser.mMRPageInfo
    }
    this.httpMetrics =  new this.appContext.MRWebMetricsCollector(this, pageInfo);
    this.addonListener = new this.appContext.MRAddOnListener(this.appID);

    this.ajaxVote =  new this.appContext.MRVote(
        this,
        "http://s.sputnik.mail.ru/sid.818?xml=2",
        "url-rank",
        "mailru_vote_btn"
        );
    this.ajax2Gis =  new MR2GisInformer(this);
    this.ajaxMailbox =  new MRMailbox(this);
    this.ajaxMy =  new MRMy(this);
    this.ajaxOk =  new MROk(this);
    this.ajaxMapsTraffic =  new MRMapsTraffic(this);
    this.ajaxWeather =  new MRWeather(this);
    this.ajaxCurrency =  new MRCurrency(this);
    this.ajaxCity =  new MRCityDetect(this);
    this.ajaxPing =  new MRPing(this);
    this.ajaxButtons =  new MRButtons(this);
	
    this.chevron =  null;
    this.brand =  new this.appContext.MRBrand();
  	
    this.elToolbar = elToolbar;
    this.elToolbar.mMRObject = this;

    this.progressListener = {
        toolbarObject : this,
        QueryInterface:function(a)
        {
            if(a.equals(Components.interfaces.nsIWebProgressListener)||a.equals(Components.interfaces.nsISupportsWeakReference)||a.equals(Components.interfaces.nsIXULBrowserWindow)||a.equals(Components.interfaces.nsISupports))return this;
            throw Components.results.NS_NOINTERFACE;
        },
        onStateChange:function(aWebProgress, aRequest, aFlag, aStatus)
        {
            const nsIWebProgressListener=Components.interfaces.nsIWebProgressListener;
            if(aFlag&nsIWebProgressListener.STATE_STOP)
            {
                var e=document.getElementById('mailru_hilight_btn');
                if(e && e.checked==true)
                {
            //            	    this.toolbarObject.hilight_window_text_add(null);
            }
            }
        },
        onLocationChange:function(a,b,c)
        {
        // TODO: restore	   	
        //		   document.getElementById('mailru_search_bar').apply_browser_load(c.spec)
        },
        onProgressChange:function(a,b,c,d,e,f)
        {

        },
        onStatusChange:function(a,b,c,d)
        {
        },
        onSecurityChange:function(a,b,c)
        {
        }
    };
    this.apply_toolbar_observer = {
        toolbarObject : this,
        observe:function(subject,topic,data)
        {
            switch(topic)
            {
                case'MAIL-apply-settings':
                {
                    if(subject != this)
                    {
                        this.toolbarObject.apply_toolbar_settings(subject);
                    }
                    break
                }
                case'MAIL-apply-music':
                {
                    this.toolbarObject.musicController.mail_playstatus();
                    break
                }
                case'MAIL-apply-informer':
                {
                    if(subject != this)
                    {
                        this.ajax2Gis.applyCurrentState();
                        this.ajaxMailbox.applyCurrentState();
                        this.ajaxMy.applyCurrentState();
                        this.ajaxOk.applyCurrentState();
                        this.ajaxMapsTraffic.applyCurrentState();
                        this.ajaxWeather.applyCurrentState();
                        this.ajaxCurrency.applyCurrentState();
                    }
                    break
                }
            }

        }

    };

};

SputnikToolbar.prototype = new gMRRefService.MRToolbar;

SputnikToolbar.prototype.init = function()
{
    G_Debug(this,"init:" + this);
    try {
        this.initVersion();
        this.getToolbarID();
        this.firstRun();

        write_reg_string('general.useragent.extra.sputnik','sputnik ' + this.toolbar_version);
        this.setSputnikCookie("sputnikff", "mail.ru");
        this.initContextMenu();
        this.initBackground();

        this.fill_main_menu();
        this.initChevron("chevron_box");
        var openerOverlay = null;
        if(window.opener && window.opener.gMRRefToolbar)
        {
            openerOverlay = window.opener.gMRRefToolbar.mMRObject;
        }
        this.initSearchBox("mailru_search_bar", "SputnikSuggestPopup", "SputnikSearchEnginePopup", openerOverlay);
        document.getElementById('mailru_resizesplitter').initialize(this);
        this.initMusicButton();  
        this.musicController.detect();
        document.getElementById('mailru_vote_btn').initParent(this);
        document.getElementById('mailru_mail_btn').initParent(this);
        document.getElementById('mailru_odkl_btn').initParent(this);
        document.getElementById('mailru_my_btn').initParent(this);
        document.getElementById('mailru_maps_btn').initParent(this);
        document.getElementById('mailru_2gis_btn').initParent(this);
        document.getElementById('mailru_weather_btn').initParent(this);
        document.getElementById('mailru_money_btn').initParent(this);
        document.getElementById('mailru_music_btn').initParent(this);
      
        this.initNavigationEvents();
        
        this.win.gBrowser.addProgressListener(this.progressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
        window.addEventListener('resize',this.appContext.BindToObject(this.window_resize, this),false);
        window.addEventListener('mousedown', this.appContext.BindToObject(this.mouse_down, this), false);
        window.addEventListener('mouseup', this.appContext.BindToObject(this.mouse_up, this), false);
        window.addEventListener('keyup', this.appContext.BindToObject(this.key_up, this), false);

        this.observer=Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        this.observer.addObserver(this.apply_toolbar_observer,'MAIL-apply-settings',false);
        this.observer.addObserver(this.apply_toolbar_observer,'MAIL-apply-informer',false);
        this.observer.addObserver(this.apply_toolbar_observer,'MAIL-apply-music',false);
        this.cookieListener.register();
        this.personasListener.register();
        this.httpMetrics.register();
    

        this.ajaxVote.init();
        this.ajaxPing.start();
        this.ajaxButtons.start();
        
        this.apply_toolbar_settings();
        G_Debug(this,"apply_toolbar_settings");
   
        this.ping_flash = new XMLHttpRequest();
        this.brand.load();
        //identify flash plugin version
        this.flash_version=this.getFlashPluginVersion();
        G_Debug(this, "init done");
    }catch (err) {
        G_Debug(this, "exception: " + err + ", stack: " + err.stack + "\n");
    }
    
 
}
SputnikToolbar.prototype.apply_toolbar_settings = function(subject)
{
    G_Debug("apply", "save setings");
    //this.locationBarSearch(this.mPrefs.getBoolPrefOrDefault("location_search", true));
    var b=document.getElementById('mailru_search_item');
    if(b)
    {
        var c=document.defaultView.getComputedStyle(b,'');
        var d=parseInt(c["width"].replace('px',''));
        b.setAttribute('width',d)
    }
    this.mSearchCtrl.disablepopular=!read_reg_bool('mail.ru.toolbar.search.engine.popular_queries',false);
    document.getElementById('mailru_vote_btn').hidden=!read_reg_bool('mailru_settings_vote_show', true );
    document.getElementById('mailru_mail_btn').hidden=!read_reg_bool('mailru_settings_mail_show', true );
    document.getElementById('mailru_maps_btn').hidden=!read_reg_bool('mailru_settings_maps_show', true);
    document.getElementById('mailru_2gis_btn').hidden=!(this.mPrefs.getPref("referer", "") == "2gis");
    document.getElementById('mailru_weather_btn').hidden=!read_reg_bool('mailru_settings_weather_show', true);
    document.getElementById('mailru_money_btn').hidden=!read_reg_bool('mailru_settings_money_show', true);
    document.getElementById('mailru_music_btn').hidden=!read_reg_bool('mailru_settings_music_show', true);
    document.getElementById('mailru_odkl_btn').hidden = !read_reg_bool('mailru_settings_odkl_show', true);
    document.getElementById('mailru_my_btn').hidden = !read_reg_bool('mailru_settings_my_show', true);
    G_Debug(this, "VOTE state:" + document.getElementById('mailru_mail_btn').hidden + " " + read_reg_bool('mailru_settings_vote_show', true ));

    this.search_buttons_restructor("mailru_search_tools_box", "mailru_search_tools_sep");
    this.services_buttons_restructor();
    this.currency_buttons_restructor();
    this.ajaxCurrency.reset();
    this.ajaxCurrency.update(true);
    //this.ajaxWeather.update();
    this.ajaxWeather.begin()
    //this.ajaxMapsTraffic.update();
    this.ajaxMapsTraffic.begin();
    this.ajaxMailbox.update();
    this.ajaxMy.update();
    this.ajaxOk.update();
    this.ajax2Gis.update();

    if(document.getElementById('mailru_music_btn').hidden)
    {
        this.musicController.close();
    }
    document.getElementById('sep3').hidden=!read_reg_bool('mailru_settings_weather_show', true);
    G_Debug("apply", "Chevron update");
    this.chevron.rebuild_chevron();
    this.chevron.update(true);
    this.chevron.updateDelayed();
    var infoPanel = document.getElementById("infopanel");
    if(infoPanel)
    {
        infoPanel.init(this, this.chevron.informers);
    }
    if(!subject && this.observer)
    {
        this.observer.notifyObservers(this,'MAIL-apply-settings',0);
    }
    
    this.win.setTimeout(newtabhomepage.init, 0);
};
function onViewToolbarsPopupShowing(aEvent, aInsertPoint) {
    var popup = aEvent.target;
    if (popup != aEvent.currentTarget)
        return;

    // Empty the menu
    for (var i = popup.childNodes.length-1; i >= 0; --i) {
        var deadItem = popup.childNodes[i];
        if (deadItem.hasAttribute("toolbarId"))
            popup.removeChild(deadItem);
    }

    var firstMenuItem = aInsertPoint || popup.firstChild;

    var toolbarNodes = Array.slice(gNavToolbox.childNodes);
    toolbarNodes.push(document.getElementById("addon-bar"));

    toolbarNodes.forEach(function(toolbar) {
        var toolbarName = toolbar.getAttribute("toolbarname");
        if (toolbarName) {
            if(toolbar.id != 'mailru_main_toolbar'){
                var menuItem = document.createElement("menuitem");
                var hidingAttribute = toolbar.getAttribute("type") == "menubar" ?
                "autohide" : "collapsed";
                menuItem.setAttribute("id", "toggle_" + toolbar.id);
                menuItem.setAttribute("toolbarId", toolbar.id);
                menuItem.setAttribute("type", "checkbox");
                menuItem.setAttribute("label", toolbarName);
                menuItem.setAttribute("checked", toolbar.getAttribute(hidingAttribute) != "true");
                if (popup.id != "appmenu_customizeMenu")
                    menuItem.setAttribute("accesskey", toolbar.getAttribute("accesskey"));
                if (popup.id != "toolbar-context-menu")
                    menuItem.setAttribute("key", toolbar.getAttribute("key"));

                popup.insertBefore(menuItem, firstMenuItem);

                menuItem.addEventListener("command", onViewToolbarCommand, false);
            }
        }
    }, this);
}