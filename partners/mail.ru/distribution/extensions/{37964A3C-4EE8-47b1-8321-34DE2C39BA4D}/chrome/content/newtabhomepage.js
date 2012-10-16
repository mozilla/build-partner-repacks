function newtabhomepage(toolbar) {
    this.toolbarObject = toolbar;
    this.newTab = null;
    this.psvc = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);
}
newtabhomepage.prototype.init = function() {
    var url = this.createUrl();
    
    gInitialPages.push(url);
    
//    if(this.psvc.getCharPref("browser.newtab.url", '') != url) {
//        this.toolbarObject.mPrefs.setPref('visualbookmarks', false)
//    }
    
    this.wrapperOpenTab();
    //alert(window.BrowserOpenTab.indexOf('openUILinkIn'));
    
}

newtabhomepage.prototype.wrapperOpenTab = function() {
    var funDef = ''+window.BrowserOpenTab;
    var url = this.createUrl();
    if(this.toolbarObject.mPrefs.getPref('visualbookmarks', true)) {
//        if(!!~funDef.indexOf('openUILinkIn(BROWSER_NEW_TAB_URL')) {
            setTimeout(function() {
                window.BrowserOpenTab = function () {
                    openUILinkIn(url, "tab");
                    setTimeout(function() {
                        getBrowser().selectedTab.label = 'Mail.Ru: Визуальные закладки';
                        gURLBar.select();
                    }, 200);
                }}, 500);
//        }
    }
}

newtabhomepage.prototype.removeWrapper = function() {
    window.BrowserOpenTab = function() {
        openUILinkIn(BROWSER_NEW_TAB_URL, "tab");
    }
}

newtabhomepage.prototype.createUrl = function (){
    var ref = this.psvc.getCharPref('mail.ru.toolbar.referer', '');
    var pref = '';
    
    if(ref != '') {
        pref = '?referer=' + ref;
    }
    
    this.newTab = "chrome://mail.ru.toolbar/content/newtab.xul" + pref;
    
    return this.newTab;
}


newtabhomepage.prototype.show = function() {
    var url = this.createUrl();
    
    if(this.toolbarObject.mPrefs.getPref('visualbookmarks', true)) {
        this.psvc.setCharPref("browser.newtab.url", url);
    }
}

newtabhomepage.prototype.hide = function() {
    this.psvc.setCharPref("browser.newtab.url", 'about:newtab');
}


newtabhomepage.prototype.update = function() {
    if(this.toolbarObject.mPrefs.getPref('visualbookmarks', true)) {
        this.show();
        this.wrapperOpenTab();
    } else {
        this.hide();
        this.removeWrapper();
    }
    
}