var newtabhomepage = {
    init: function () {
        gBrowser.removeEventListener("NewTab", window.BrowserOpenTab, false);
        if(read_reg_bool('mail.ru.toolbar.visualbookmarks', true)) {
            window.BrowserOpenTab = newtabhomepage.opentab;
        } else {
            window.BrowserOpenTab = newtabhomepage.opentabDefault;
        }
        gInitialPages.push("chrome://mail.ru.toolbar/content/newtab.xul?referer="+read_reg_string('mail.ru.toolbar.referer', ''));
        gBrowser.addEventListener("NewTab", window.BrowserOpenTab, false);
        
    //setTimeout(newtabhomepage.checkNewBrowser,10);
    },
  
    opentab: function (aEvent) { 
        if(!read_reg_bool('mail.ru.toolbar.ec8bf516fafa51927e71233e18e82503', false)) {
            if(/yasearch@yandex.ru/.test(read_reg_string('extensions.enabledAddons', ''))){
                if(read_reg_bool('yasearch.general.ftab.enabled', true)) {
                    newtabhomepage.opentabDefault();
                    return;
                }
            }
        } else {
            if(!/yasearch@yandex.ru/.test(read_reg_string('extensions.enabledAddons', ''))) {
                write_reg_bool('mail.ru.toolbar.ec8bf516fafa51927e71233e18e82503', false);
            }
        }
        var newTab = getBrowser().addTab("chrome://mail.ru.toolbar/content/newtab.xul?referer="+read_reg_string('mail.ru.toolbar.referer', ''));
        newTab.linkedBrowser.userTypedValue = "";
        getBrowser().selectedTab = newTab;
        if (gURLBar)
            setTimeout(function() {
                getBrowser().selectedTab.label = 'Mail.Ru: Визуальные закладки';
                gURLBar.select();
            }, 200);
 
    },
    
    opentabDefault: function (aEvent)
    {
        //var homepage = gHomeButton.getHomePage().split("|")[0];
        var homepage = 'about:blank';
        if(/yasearch@yandex.ru/.test(read_reg_string('extensions.enabledAddons', '')) 
            && read_reg_bool('yasearch.general.ftab.enabled', true)){
            homepage = 'bar:tabs';
        }
        var newtab = gBrowser.addTab(homepage);
        gBrowser.selectedTab = newtab;
        if (gURLBar)
            setTimeout(function() {
                gURLBar.select();
            }, 0);
            
        if (aEvent)
            aEvent.stopPropagation();

        return newtab;
    },
    
    checkNewBrowser : function () {
        var domWindow = getBrowser().mCurrentBrowser.docShell
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIDOMWindow);
        var webNav = domWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation);
        
        var b = window.getBrowser().webNavigation.currentURI.spec;
        if(b == "about:blank"){
            webNav.loadURI("chrome://mail.ru.toolbar/content/newtab.xul", Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
        }
    //getBrowser().mCurrentBrowser.userTypedValue = "";
    }
}