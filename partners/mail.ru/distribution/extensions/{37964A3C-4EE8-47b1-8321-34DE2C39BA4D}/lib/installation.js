function MRInstallation(toolbar) {
    this.debugZone = "MRInstallation";
    this.toolbarObject = toolbar;
    
    this.prefs = new G_Preferences("", false, false);
    this.sLastVersion = this.toolbarObject.mPrefs.getPref("version", "");
    this.bWasUninstalled = (this.sLastVersion == "update" || this.sLastVersion == "uninstalled");
    this.bInstalled = (this.sLastVersion.length && this.sLastVersion != "uninstalled");
    this.installOption = new MRInstallOptions;
    this.bUpgrade = this.isUpgrade() && !this.installOption.newOptions;
    this.bUserInstall = (
        !this.sLastVersion
        || this.sLastVersion == "upgrade"
        || this.sLastVersion == "uninstalled"
        )
    && !this.bUpgrade
    && !this.installOption.newOptions;
    this.bExternalInstall = this.installOption.newOptions;
};

MRInstallation.prototype.isInstallation = function() {
    G_Debug(this, "sLastVersion=" + this.sLastVersion + " upgrade = " + this.bUpgrade + " user_install = " + this.bUserInstall);
    return (this.sLastVersion != this.toolbarObject.toolbar_version || this.installOption.newOptions)
};

MRInstallation.prototype.install = function() {
    this.overrideOptions();
    this.initID();
    this.initBookmarks();
    this.initHomepage();
    this.initInstallPage();
    this.initSearchEngines();
    this.initReferer();
    this.initBrand();
    this.initToolbarSettings();
    this.switchGames();
}

MRInstallation.prototype.overrideOptions = function() {
    }

MRInstallation.prototype.initID = function() {
    if (this.installOption.toolbarid.length) {
        this.toolbarObject.toolbar_id = this.installOption.toolbarid;
        this.toolbarObject.toolbar_new_sig = this.installOption.toolbarNewSig;
        this.toolbarObject.mPrefs.setPref("tid", this.toolbarObject.toolbar_id);
        this.toolbarObject.mPrefs.setPref("new_sig", this.toolbarObject.toolbar_new_sig);
    }
    if (!this.bInstalled) {
        this.toolbarObject.mPrefs.setPref("ec8bf516fafa51927e71233e18e82503", /yasearch@yandex.ru/.test(this.prefs.getPref('extensions.enabledAddons', '')));
    }
}

MRInstallation.prototype.initHomepage = function() {
    G_Debug(this, "first run setHomepage:" + this.installOption.setHomepage + " upgrade:" + !this.bUpgrade);
    if (!this.bUpgrade && this.installOption.setHomepage) {
        G_Debug(this, "first run setHomepage");
        this.toolbarObject.setHomepage();
    }
}

MRInstallation.prototype.initInstallPage = function() {
    if (this.bUserInstall) {
        this.toolbarObject.showInstallPage = true;
    }
}

MRInstallation.prototype.initToolbarSettings = function() {
    if (this.installOption.setShortMode) {
        this.toolbarObject.mPrefs.setBoolPref("shortmode", true);
        this.toolbarObject.mPrefs.setPref("currency.display", "");
        this.toolbarObject.mPrefs.setPref("services.display", "");
        var prefs = new G_Preferences("", false, false);
        prefs.setBoolPref("mailru_settings_maps_show", false);
        prefs.setBoolPref("mailru_settings_money_show", false);
        prefs.setBoolPref("mailru_settings_vote_show", false);
    }
    
    this.toolbarObject.elToolbar.hidden = false;
    this.toolbarObject.elToolbar.collapsed = false;
    this.toolbarObject.mPrefs.setBoolPref('location_search', true);
    this.toolbarObject.mPrefs.setPref("buttons.display", "mailru_zoom_btn,mailru_hilight_btn,mailru_entry_btn");
    this.toolbarObject.mPrefs.setPref('version', this.toolbarObject.toolbar_version);
}

MRInstallation.prototype.initBrand = function() {
    if (!this.bUpgrade) {
        this.toolbarObject.brand.init(this.installOption.referer);
    }
}

MRInstallation.prototype.initReferer = function() {
    if (!this.bInstalled) {
        this.toolbarObject.mPrefs.setPref('referer', this.installOption.referer);
        this.toolbarObject.mPrefs.setPref('partner_new_url', this.installOption.partnerNewUrl);
        this.toolbarObject.mPrefs.setPref('partner_online_url', this.installOption.partnerOnlineUrl);
        this.toolbarObject.mPrefs.setBoolPref('first_ping', true);
        this.toolbarObject.mPrefs.setPref('install_date', (new Date()).toGMTString());
        
    }
}

MRInstallation.prototype.switchGames = function (){
    if (!this.bInstalled) {
        if(this.installOption.referer == 'nevosoft'){
            var sVisButtons=this.toolbarObject.mPrefs.getPref('services.display','');
            var aVisButtons = sVisButtons.split(',');
            delete aVisButtons[aVisButtons.indexOf('games')];
            this.toolbarObject.mPrefs.setPref("services.display", aVisButtons.join(','));
        }
    }
}

MRInstallation.prototype.initSearchEngines = function() {
    this.initSearchProvider();
    if (!this.bInstalled && this.installOption.setDefSearch) {
        this.setDefaultSearch();
        this.toolbarObject.locationBarSearch(true);
    }
}

MRInstallation.prototype.isUpgrade = function() {
    var bInstallation = false;
    var reBuildNumber = /(\d+).\s*(\d+).\s*(\d+).\s*(\d+)/;
    var rBuildMatch = this.toolbarObject.toolbar_version.match(reBuildNumber);
    if (rBuildMatch) {
        if (
            (
                (rBuildMatch[1] > 2)
                || (rBuildMatch[1] == 2 && rBuildMatch[2] >= 3)
                )
            && (rBuildMatch[4] % 2) != 0
            ) {
            bInstallation = true;
        }

    }
    return ((this.sLastVersion == "upgrade") && !bInstallation);
};

MRInstallation.prototype.setDefaultSearch = function() {
    G_Debug(this, "setDefaultSearch");
    this.toolbarObject.prevSearchEngine = null;
    var psvc = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);
    psvc.setCharPref("browser.search.defaultenginename", "http://www.mail.ru/");
    psvc.setCharPref("browser.search.defaulturl", "http://go.mail.ru/search?fr=fftb&utf8in&q=");
    psvc.setCharPref("browser.search.selectedEngine", "mail.ru: Поиск в Интернете");
};

MRInstallation.prototype.initSearchProvider = function() {
    G_Debug("initSearchProvider", "");
    var searchService = Cc["@mozilla.org/browser/search-service;1"].getService(Ci.nsIBrowserSearchService);
    var engines = searchService.getEngines({});
    //var bFound = false;
    for (var i in engines) {
        if (engines[i].searchForm == "http://www.mail.ru/") {
        //if (engines[i].searchForm == "http://go.mail.ru") {
            /**Удаляем предыдущий поиск, потому что если пытаться обновить файлы получаем глюг с необновляемым названием*/
            searchService.removeEngine(engines[i]);
        }

    }
    this.addSearchProvider();
};

MRInstallation.prototype.addSearchProvider = function() {

    try {
        G_Debug("addSearchProvider", "");
        var dir = G_File.getProfileFile(MRSputnikDataDir);
        dir.exists() && !dir.isDirectory() && dir.remove(true);
        dir.exists() || dir.create(dir.DIRECTORY_TYPE, 484);
        var fileXML = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        fileXML.initWithPath(dir.path);
        fileXML.appendRelativePath("mailru.xml");
        if (fileXML.exists()) {
            fileXML.remove(false);
        }
        this.writeSearchProviderFile(this.readBildInSearchProviderFile(), fileXML.path);

        var sSearch = G_FileReader.readAll("file://" + fileXML.path);
        var encoder = new G_Base64();
        var as = encoder.arrayifyString(sSearch);
        var enc = encoder.encodeByteArray(as)
        var sXMLBase64 = "data:text/xml;base64,77u/" + enc;

        var searchService = Cc["@mozilla.org/browser/search-service;1"]
        .getService(Ci.nsIBrowserSearchService);
        this.prevSearchEngine = searchService.currentEngine;
        searchService.addEngine(sXMLBase64, Components.interfaces.nsISearchEngine.DATA_XML, null, false);
        
    } catch (err) {
        G_Debug(this, "exception: " + err + ", stack: " + err.stack + "\n");
    }
    if (!this.installOption.setDefSearch) {
        this.toolbarObject.win.setTimeout(BindToObject(this.restoreSearchProvider, this), 20);
    }

};

MRInstallation.prototype.restoreSearchProvider = function() {
    if (this.prevSearchEngine) {
        var searchService = Cc["@mozilla.org/browser/search-service;1"]
        .getService(Ci.nsIBrowserSearchService);
        searchService.currentEngine = this.prevSearchEngine;
    }
};

MRInstallation.prototype.readBildInSearchProviderFile = function() {
    G_Debug(this, "readBildInSearchProviderFile");
    var ajaxSearchService = G_NewXMLHttpRequest();
    ajaxSearchService.open('GET', this.toolbarObject.chromeURL + 'locale/mail.ru.search_provider.xml', false);
    ajaxSearchService.send(null);
    return ajaxSearchService.responseXML;
};

MRInstallation.prototype.writeSearchProviderFile = function(xmlSource, sPath) {
    G_Debug(this, "writeSearchProviderFile:" + sPath);
    var fileXML = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    fileXML.initWithPath(sPath);
    var stream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
    try {
        G_Debug(this, "writeSearchProviderFile:" + fileXML.path);
        stream.init(
            fileXML,
            G_File.PR_WRONLY | G_File.PR_CREATE_FILE | G_File.PR_TRUNCATE,
            -1,
            0
            );
        G_Debug(this, "writeSearchProviderFile serializer");
        var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"]
        .createInstance(Ci.nsIDOMSerializer);
        serializer.serializeToStream(xmlSource.documentElement, stream, "UTF-8");
    }
    catch (e) {
    }
};

MRInstallation.prototype.initBookmarks = function() {
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
    .getService(Components.interfaces.nsIIOService);
    var uri = ios.newURI("http://www.mail.ru/cnt/5088", null, null);
    var historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"]
    .getService(Components.interfaces.nsINavHistoryService);
    var options = historyService.getNewQueryOptions();
    var query = historyService.getNewQuery();

    var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
    .getService(Components.interfaces.nsINavBookmarksService);
    var toolbarFolder = bookmarksService.toolbarFolder;
    query.setFolders([toolbarFolder], 1);

    var result = historyService.executeQuery(query, options);
    var rootNode = result.root;
    rootNode.containerOpen = true;
    var nCount = rootNode.childCount;
    var bHasMRBookmark = false;
    for (var i = 0; i < rootNode.childCount; i++) {
        var node = rootNode.getChild(i);
        try {
            var uriBookmark = ios.newURI(node.uri, null, null);
            if (uriBookmark.host.search(/mail.ru/) != -1) {
                bHasMRBookmark = true;
            }
        }
        catch (e) {

        }
    }
    rootNode.containerOpen = false;
    G_Debug("initBookmarks", "count " + nCount + " " + bHasMRBookmark);
    if (nCount >= 6 || bHasMRBookmark == true) {
        return;
    }
    var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"]
    .getService(Components.interfaces.nsIFaviconService);
    var faviconURI = ios.newURI("http://img.mail.ru/r/favicon.ico", null, null);
    faviconService.setAndLoadFaviconForPage(uri, faviconURI, true);

    var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
    .getService(Components.interfaces.nsINavBookmarksService);
    var newBkmkId = bookmarksService.insertBookmark(
        bookmarksService.toolbarFolder,
        uri,
        bookmarksService.DEFAULT_INDEX,
        "Mail.Ru"
        );
};
