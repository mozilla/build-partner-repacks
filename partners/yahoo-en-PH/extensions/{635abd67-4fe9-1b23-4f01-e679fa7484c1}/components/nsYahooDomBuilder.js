/*
 * Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
 */
/*
   Copyright 2005 - 2006 Yahoo! Inc. All rights reserved.
*/
/*jslint evil: true */
var CI = Components.interfaces;
var CC = Components.classes;
var yahooCC = CC;
var yahooCI = CI;
var loader = CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);             
loader.loadSubScript("chrome://ytoolbar/content/utils.js");   
/**
* @class Used to build the DOM elements for the toolbar.
* An XPCOM object is used for the task in order to 
* keep the chrome from having to manually build it for each
* new window.
*/
function YahooDomBuilder(){
    try{
        this.gPrefs = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);
        // Create documents
        var doc = CC["@mozilla.org/xul/xul-document;1"].createInstance(CI.nsIDOMDocument);
        this.document = doc.implementation.createDocument(this.ns, "overlay", null);
        this.toolbarDoc = doc.implementation.createDocument(this.ns, "overlay", null);
        this.toolbarDoc.firstChild.setAttribute("id", "toolbar");
        var str = CC["@mozilla.org/intl/stringbundle;1"].getService(CI.nsIStringBundleService);
        this.strings = str.createBundle("chrome://ytoolbar/locale/ytoolbar.properties");
        this.bm2Usage = [];
        // Start fresh
        this.clear();
        this.mFileIO = CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIOPre);
        this.iconsOnly = this.gPrefs.getBoolPref("yahoo.options.iconsonly");
    } catch(e){
    }
}
YahooDomBuilder.prototype = {
    /** @private */
    document : null,
    /** @private */
    toolbarDoc : null,
    /** @private */
    ns : "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
    /**
    * The toolbar nodes
    * @type {nsIDOMDocument}
    */
    toolbar : null,
    /**
    * Flag to check if Bookmarks are there under a particular folder
    * to show "Open in Tabs" option
    */
    /**
    * The Yahoo! menubar nodes
    * @type {nsIDOMDocument}
    */
    menubar : null,
    /**
    * The nodes for the toolbar context menu
    * @type {nsIDOMDocument}
    */
    toolar_context : null,
    /**
    * The nodes for the browser document context menu
    * @type {nsIDOMDocument}
    */
    page_context : null,
    /**
    * List of elements that can be removed (have REMOVONCLICK style)
    * @type {nsIDOMNode[]}
    */
    removables : [],
    /**
    * Bookmakrs 2.0 list node
    * @type {nsIDOMDocument}
    */
    bookmarks : null,
    /**
    * Bookmarks 2.0 feed URL
    * @type {String}
    * @private
    */
    bm2Feed : null,
    /**
    * Bookmarks 2.0 usage count
    * @type {Hashtable array}
    */
    bm2Usage : {},
    /**
    * Bookmarks 2.0 preferences
    * @type {String[]}
    * @private
    */
    bm2Prefs : [],
    /**
    * The URL to use when saving a bookmark to a folder
    * @type {String}
    * @parive
    */
    bm2FolderSave : null,
    /**
    * The URL to use when saving a bookmark to a folder
    * @type {String}
    */
    bm2FFBMImportCrumb : null,
    /**
    * The URL to use when importing bookmarks
    * @type {String}
    */
    bm2FFBMImportUrl : null,
    /**
    * Localized string bundle
    * @type {Object}
    * @private
    */
    strings : null,
    /**
    * these attributes should be skipped while making menuitem from a toolbar element
    * @type {associative array}
    * @private
    */
    skipAttrs : { 'id' : 1, 'contextmenu' : 1, 'image' : 1, 'class' : 1, 'tooltiptext' : 1, 'type' : 1 },
    /**
    * Icons only option
    * @type {bool}
    */
    iconsOnly : false,
    // for saving favicons
    /**
    * Build a DOM node from the feed node and add it to a parent node or document.
    * For root nodes set the parent to one of the document properties of this
    * object.  NOTE: When you pass the {@link #toolbar} document property as the parent
    * the node will be duplicated and  added to {@link #menubar}.
    * @param {nsIYahooFeedNode} node The feed node to add
    * @param {nsIDOMElement} parent The parent DOM node to add the node to
    * @return {nsIDOMElement} The DOM node created
    */
    addNode : function(node, parent){
        var dom, popup;
        try{
            // Set Parent
            var toolbar = false;
            if(parent === null){
                parent = this.toolbar;
                toolbar = true;
                // Toolbar Context menu
                if(node.id == "yahoo-toolbar-cm"){
                    parent = this.toolar_context;
                    toolbar = false;
                }
                // Page context menu
                else if(node.id == "yahoo-toolbar-rmc_m"){
                    parent = this.page_context;
                    toolbar = false;
                }
                // Extra menubar items (root node is not displayed, return menuExtra node)
                else if(node.id == "yahoo-toolbar-acs"){
                    this.menubarExtra.appendChild(this.document.createElementNS(this.ns, "menuseparator"));
                    return this.menubarExtra;
                }
                // Toolbar
                else{
                    // Get box to load buttons into
                    if(this.toolbar.lastChild.childNodes.length > 0){
                        parent = this.toolbar.lastChild;
                    } else if (node.type == node.SEPARATOR_TYPE ||
                                (this.toolbar.firstChild.lastChild && this.toolbar.firstChild.lastChild.nodeName == "toolbarseparator")){
                        parent = this.toolbar.lastChild;
                    }
                    else {
                        parent = this.toolbar.firstChild;
                    }
                }
            }
            // Alerts
            else if(parent == this.alerts){
                toolbar = true;
            }
            // Create DOM node
            if(toolbar){
                dom = parent.ownerDocument.createElementNS(this.ns, "toolbarbutton");
                switch(node.type){
                    case node.BUTTON_TYPE:
                    break;
                    case node.BUTTONMENU_TYPE:
                        dom.setAttribute("type", "menu-button");
                        popup = dom.appendChild(parent.ownerDocument.createElementNS(this.ns, "menupopup"));
                    break;
                    case node.MENU_TYPE:
                        dom.setAttribute("type", "menu");
                        popup = dom.appendChild(parent.ownerDocument.createElementNS(this.ns, "menupopup"));
                    break;
                    case node.MENUITEM_TYPE:
                    break;
                    case node.EDITBOX_TYPE:
                        dom = this.buildSearchBox(node);
                    break;
                    case node.SEPARATOR_TYPE:
                        dom = parent.ownerDocument.createElementNS(this.ns, "toolbarseparator");
                    break;
                    default:
                        return null;
                }
            }
            else{
                dom = parent.ownerDocument.createElementNS(this.ns, "menuitem");
                switch(node.type){
                    case node.MENUITEM_TYPE:
                    case node.BUTTON_TYPE:
                    break;
                    case node.BUTTONMENU_TYPE:
                    case node.MENU_TYPE:
                        dom = parent.ownerDocument.createElementNS(this.ns, "menu");
                        popup = dom.appendChild(parent.ownerDocument.createElementNS(this.ns, "menupopup"));
                    break;
                    case node.SEPARATOR_TYPE:
                        dom = parent.ownerDocument.createElementNS(this.ns, "menuseparator");
                    break;
                    case node.EDITBOX_TYPE:
                        // edit box ONLY on toolbar
                        return null;
                    default:
                        return null;
                }
            }
            // Set attributes
            var id = node.id;  // fix reference errors (REVIEW NOTE: why?)
            dom.setAttribute("id",  id);
            dom.setAttribute("label", node.name);
            dom.setAttribute("yhash", node.hash);
            var hash;
            eval("hash = {"+ node.hash +"}");
            // Bookmarks 2.0 -- Queue feed request
            if(id == "yahoo-toolbar-boo2_m" && hash.bmfeed){        
                this.bm2Feed = unescape(hash.bmfeed);
                if(hash.bmfoldersave){
                    this.bm2FolderSave = unescape(hash.bmfoldersave);
                }
                else{
                }
                if (hash.bmimporturl) {
                    this.bm2FFBMImportUrl = unescape(hash.bmimporturl);
                }
            }           
            if("yahoo-toolbar-boo_m/boo_m_6/boo_m_6_1" == id && hash.bmimport) {
                if(hash.bmimport) {
                    this.bm2FFBMImportCrumb = unescape(hash.bmimport);
                }
            }
            if(id == "yahoo-toolbar-yma_m") {                
                var img = "alert1.gif";
                if(hash.ovimg) {
                    img = hash.ovimg;
                }        
                // the nodes icon will have the path of the image url
                // we are using the image url of the mail icon to get the path to image server
                var path = node.icon;                
                var pos = path.lastIndexOf("/");                 
                if(pos > 10) { 
                    path = path.substr(0,pos + 1);  
                } else {                    
                    path = "http:\/\/us.i1.yimg.com/us.yimg.com/i/tb/iconsgif/";
                }
                dom.setAttribute("ovimg",path + img);
            }
            // Event (don't add event to menu)
            if(node.type == node.BUTTON_TYPE || node.type == node.MENUITEM_TYPE || node.type == node.BUTTONMENU_TYPE){
                if(!dom.hasAttribute("oncommand")){
                    dom.setAttribute("oncommand", "yahooButtonHandler(event);");
                    dom.setAttribute("onclick", "if(event.button == 1) yahooButtonHandler(event);");
                }
                dom.setAttribute("yevent", node.func);
                dom.setAttribute("ytrack", node.funcTracking);
                dom.setAttribute("yfunc",  node.funcNum);
                if(node.funcUrl !== null && node.funcUrl !== ""){
                    dom.setAttribute('yurl', node.funcUrl);
                }
            }
            // Context menu
            if(dom.ownerDocument.firstChild && dom.ownerDocument.firstChild.id == "toolbar"){
                dom.setAttribute("contextmenu", "yahoo-toolbar-context");
            }
            // Bookmarks menu
            if(dom.ownerDocument.firstChild && dom.ownerDocument.firstChild.id == "toolbar" && node.funcNum == "1" && parent.parentNod && parent.parentNode.id != "yahoo-toolbar-boo2_m" ){
                // FYI: the tracking number is the folder ID
                parent.parentNode.setAttribute("id", "yahoo-toolbar-bookmarks-"+ (node.funcTracking || 1));
            }
            // Hide RSS
            if(node.id == "yahoo-toolbar-rss" || node.id == "yahoo-toolbar-rss_m" || node.id == "yahoo-toolbar-RSS" ||
                node.id == "menu_yahoo-toolbar-rss" || node.id == "menu_yahoo-toolbar-rss_m" || node.id == "menu_yahoo-toolbar-RSS"){
                dom.style.display = "none";
            }
            // Show icons only checkbox
            if(node.id == "yahoo-toolbar-cm-sio"){
                dom.setAttribute("type", "checkbox");
            }
            // Add icon
            dom.setAttribute("class", "yahoo-button-showlabel");
            if (this.iconsOnly === true) {
                dom.setAttribute("class", "yahoo-button-hidelabels");
            }
            if(node.icon !== null && node.icon !== ""){
                dom.setAttribute("yicon", node.icon);
                this.mFileIO.fetchNCacheImage(node.icon,dom);
                // XUL Classes for menuitem and menu
                if(dom.tagName == "menuitem"){
                    dom.setAttribute("class", "menuitem-iconic");
                }
                else if(dom.tagName == "menu"){
                    dom.setAttribute("class", "menu-iconic");
                }
            }
            else if(node.icon === null || node.icon === ""){
                dom.setAttribute("class", "yahoo-button-noimg");
            }
            // Apply styles
            if(node.styles.indexOf("NOTEXT") > -1){
                dom.className = "yahoo-button-notext";
            }
            if(node.styles.indexOf("ALWAYSHIDE") > -1){
                dom.setAttribute("hidden", true);
            }
            if(node.id !== null && node.styles.indexOf("REMOVEONCLICK") > -1){
                this.removables[this.removables.length] = dom;
            }
            dom.setAttribute("ystyles", node.styles);
            // Tooltip
            if(dom.ownerDocument.firstChild && dom.ownerDocument.firstChild.id == "toolbar" && node.type != node.EDITBOX_TYPE && node.styles.indexOf("NOTOOLTIP") == -1){
                dom.setAttribute("tooltiptext", node.name);
                if(hash.at){
                    var tt = "";
                    var tooltip = hash.at;
                    if(tooltip){
                        // Remove % and $ and ,
                        tooltip = tooltip.replace(/%25/g, "");
                        tooltip = tooltip.replace(/%|\$|,/g, "");
                        dom.setAttribute("tooltiptext", tooltip);
                    }
                }
            }
            // Add to parent
            parent.appendChild(dom);
            // Duplicate for menubar
            if(dom.ownerDocument.firstChild && dom.ownerDocument.firstChild.id == "toolbar"){
                var mdom, mpopup;
                // Create node
                if(dom.nodeName.indexOf("toolbar") === 0){
                    switch(dom.nodeName){
                        case "toolbarbutton":
                            switch(dom.getAttribute("type")){
                                // BUTTONMENU_TYPE
                                case "menu-button":
                                    mdom = this.document.createElementNS(this.ns, "menu");
                                    mpopup = mdom.appendChild(this.document.createElementNS(this.ns, "menupopup"));
                                    mdom.setAttribute("label", node.name);
                                    if(node.id){
                                        mdom.setAttribute("id", "menu_"+ node.id);
                                    }
                                    mdom = mpopup.appendChild(this.document.createElementNS(this.ns, "menuitem"));
                                    mpopup.appendChild(this.document.createElementNS(this.ns, "menuseparator"));
                                break;
                                // MENU
                                case "menu":
                                    mdom = this.document.createElementNS(this.ns, "menu");
                                    mpopup = mdom.appendChild(this.document.createElementNS(this.ns, "menupopup"));
                                break;
                                // BUTTON
                                default:
                                    mdom = this.document.createElementNS(this.ns, "menuitem");
                            }
                        break;
                        case "toolbarseparator":
                            mdom = this.document.createElementNS(this.ns, "menuseparator");
                            break;
                    }
                    // Set attributes
                    if(mdom){
                        var attr;
                        for(var i = 0; i < dom.attributes.length; i++){
                            attr = dom.attributes[i];
                            if (this.skipAttrs[attr.name] != 1) {
                                mdom.setAttribute(attr.name, attr.value);
                            }
                        }
                    }
                }
                else{   
                    mdom = this.document.createElementNS(this.ns,dom.nodeName);
                    if(dom.nodeName === "menu") {
                       mpopup = mdom.appendChild(this.document.createElementNS(this.ns, "menupopup"));
                    }
                    for(var idx = 0; idx < dom.attributes.length; idx++){
                        attr = dom.attributes[idx];
                        mdom.setAttribute(attr.name, attr.value);
                    }
                    if(popup){
                        mpopup = mdom.firstChild;
                    }
                }
                // Add attributes
                if(mdom){
                    // Add id
                    if(node.id){
                        if(node.type == node.BUTTONMENU_TYPE){
                            mdom.setAttribute("id", "menu_"+ node.id +"_btn");
                        }
                        else{
                            mdom.setAttribute("id", "menu_"+ node.id);
                        }
                    }
                    mdom.removeAttribute("class");
                    mdom.removeAttribute("contextmenu");
                    mdom.removeAttribute("tooltiptext");
                    mdom.setAttribute("class", "menuitem-iconic");
                    mdom.style.display = dom.style.display;
                    // Buttonmenu fix
                    if(node.type == node.BUTTONMENU_TYPE){
                        mdom = mpopup.parentNode;
                    }
                    // Removeable button
                    if(node.id && node.styles.indexOf("REMOVEONCLICK") > -1){
                        this.removables[this.removables.length] = dom;
                    }
                    // Add to menubar
                    if(node.parentNode && node.parentNode.domMenubar){
                    node.parentNode.domMenubar.appendChild(mdom);
                    }
                    else{
                        this.menubar.appendChild(mdom);
                    }
                    // Attach to toolbar node
                    node.domMenubar = mpopup || mdom;
                }
            }
        } catch(e){ 
        }
        // Return the popup instead of the menu node
        if(popup){
            dom = popup;
        }
        mdom = null;
        mpopup = null;
        popup = null;
        node = null;
        return dom;
    },
    /**
    * Build the search box node.
    * @param {nsIYahooFeedNode} node The feed node that defines the search box
    * @return {nsIDOMElement} The DOM node created for the search box
    */
    buildSearchBox : function(node){
        var dom = null;
        try{
            dom = this.toolbarDoc.createElementNS(this.ns, "toolbaritem");
            // Editable menulist
            var search = this.toolbarDoc.createElementNS(this.ns, "textbox");
            search.setAttribute("id", "yahooToolbarEditBox");
            search.setAttribute("flex", "1");
            search.setAttribute("size", "4");
            search.setAttribute("minwidth", "55");
            search.setAttribute("sizetopopup", "false");
            search.setAttribute("yevent", node.func);
            search.setAttribute("ytrack", node.funcTracking);
            search.setAttribute("yfunc",  node.funcNum);
            search.setAttribute('onkeyup', "if(event.keyCode == event.DOM_VK_ENTER || event.keyCode == event.DOM_VK_RETURN){ this.blurred(event, true); yahooButtonHandler(event); }");
            search.setAttribute("newlines", "replacewithspaces");
            search.setAttribute("width", ytbUtils.getPreference("yahoo.toolbar.searchbox.width"));
            // If we're using FF 1.5 or greater
            if(CI.nsIXULAppInfo){
                var app = CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULAppInfo);
                if(app && parseFloat(app.version) >= 1.5){
                    search.setAttribute("class", "yahoo-toolbar-search-live");
                    search.setAttribute("enablehistory", "true");                     
                    // Live search url
                    var searchHash;
                    eval("searchHash = { "+ node.hash +"}");
                    if(searchHash.live){
                        this.gPrefs.setBoolPref("yahoo.supports.livesearch", true);
                        search.setAttribute("ylive",  unescape(searchHash.live));
                    }
                    else{
                        this.gPrefs.setBoolPref("yahoo.supports.livesearch", false);
                        search.setAttribute("ylive",  "");
                    }
                }
            }
            // Search box selection control (bug 419015)
            search.yselect = true;
            search.setAttribute("onmousedown", "this.yselect = !this.hasAttribute('focused')");
            search.setAttribute("onclick", "if(this.yselect){ this.select(); }");
            // Splitter
            var splitter = this.toolbarDoc.createElementNS(this.ns, "splitter");
            splitter.id = "yahoo-toolbar-splitter";
            splitter.setAttribute("resizebefore", "grow");
            splitter.setAttribute("resizeafter", "grow");
            splitter.setAttribute("onmouseup", "YahooToolbarBuilder.splitterResize()");
            splitter.setAttribute("onclick", "YahooToolbarBuilder.setSearchboxSize()");
            // Somthing flexible for splitter
            var hbox = this.toolbarDoc.createElementNS(this.ns, "toolbaritem");
            hbox.setAttribute("flex", "1");
            dom.appendChild(search);
            dom.appendChild(splitter);
            dom.appendChild(hbox);
        } catch(e){ 
        }
        return dom;
    },
    /**
    * Clear all the DOM nodes and initialize clean ones
    */
    clear : function(){
        try{
            this.removables = [];
            this.toolbar = null;
            this.menubar = null;
            this.menubarExtra = null;
            this.toolar_context = null;
            this.page_context = null;
            this.alerts = null;
            // Init document fragments
            this.toolbar = this.toolbarDoc.createDocumentFragment();
            this.menubar = this.document.createDocumentFragment();
            this.menubarExtra = this.document.createDocumentFragment();
            this.toolar_context = this.document.createDocumentFragment();
            this.page_context = this.document.createDocumentFragment();
            this.alerts = this.document.createDocumentFragment();
            // Prepare toolbar
            this.toolbar.appendChild(this.toolbarDoc.createElementNS(this.ns, "toolbaritem"));
            this.toolbar.appendChild(this.toolbarDoc.createElementNS(this.ns, "toolbaritem"));
            this.toolbar.firstChild.id = "yahoo-toolbar-reqbtns";
            this.toolbar.lastChild.id = "yahoo-toolbar-btns";
        } catch(e){
        }
    },
    /**
    * Remove node
    * @param {String} id The ID of the node to remove
    */
    remove : function(id){
        try{
            var nId;
            for(var i = 0; i < this.removables.length; i++){
                if(this.removables[i] && this.removables[i].parentNode &&
                        (this.removables[i].id == id || this.removables[i].id == "menu_"+ id || this.removables[i].id == "menu_"+ id +"_btn")){
                    this.removables[i].parentNode.removeChild(this.removables[i]);
                    this.removables[i] = null;
                }
            }
        } catch(e){
        }
    },
    /**
    * Clear the bookmarks list node
    */
    clearBM2 : function(){
        try{
            this.bookmarks = null;
            this.bookmarks = this.document.createDocumentFragment();
        } catch(e){
        }
    },
    /**
    * Build the bookmarks list - one node at a time (recursively)
    * @param {DomNode} dom The XML dom node to build
    * @param {DomNode} parent The XUL parent node
    */
    buildBM2 : function(dom, parent){
        var recursionBase = (parent === null);
        try{
            if(!parent){
                parent = this.bookmarks;
            }
            var uni = CC["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(CI.nsIScriptableUnicodeConverter);
            uni.charset = "utf-8";
            var node, name, type, url, menu, menupopup, menuitem, str;
            for(var i = 0; i < dom.childNodes.length; i++){
                node = dom.childNodes[i];
                // Skip
                if(node.nodeName != "outline"){
                    continue;
                }
                type = node.getAttribute("type");
                url = node.getAttribute("u");
                name = uni.ConvertToUnicode(node.getAttribute("text"));
                // Build by type
                switch(type){
                    // Folder
                    case "F":
                        // Dig into root
                        if(node.getAttribute("text") == "root" && node.parentNode && node.parentNode.getAttribute("type") == "ResultSet"){
                            this.buildBM2(node, parent);
                        }
                        // Dig into 'tags' folder
                        else if(node.getAttribute("text") == "tags" && this.bm2Prefs.DisplayFoldersAs == "TagView" && node.getAttribute("fid") == "-1"){
                            this.buildBM2(node, parent);
                        }
                        else{
                            // Menu
                            menu = this.document.createElementNS(this.ns, "menu");
                            menu.setAttribute("crop", "end");
                            menu.setAttribute("label", name);
                            menu.setAttribute("tooltiptext", name);
                            menu.setAttribute("onclick", "if(event.button == 1) {yahooBookmarksOpenAll(this.firstChild); yahooButtonHandler(event);}");
                            menu.setAttribute("maxwidth", "300px");
                            if (this.bm2Prefs.DisplayFoldersAs == "TagView"){                                
                                menu.setAttribute("class","menu-iconic");
                                menu.setAttribute("image","chrome://ytoolbar/skin/tag.gif");
                            } else {
                                menu.setAttribute("class","menu-iconic folder-item");
                            }
                            menupopup = this.document.createElementNS(this.ns, "menupopup");
                            // "Add to 'xyz'" menuitem
                            if(this.bm2FolderSave){
                                var nameStr = name.replace(/\$/g, "$$$$"); // tweak to handle '$' in the name (bug 1042831)
                                str = this.getStr("yahoo.bookmarks.folder.add", "Add page to '__TITLE__'").replace("__TITLE__", nameStr);
                                menuitem = this.document.createElementNS(this.ns, "menuitem");
                                menuitem.setAttribute("crop", "end");
                                menuitem.setAttribute("label", str);
                                menuitem.setAttribute("tooltiptext", str);
                                menupopup.appendChild(menuitem);
                                menupopup.appendChild(this.document.createElementNS(this.ns, "menuseparator"));
                                // Function
                                //,47,Save this page,550,350,,4,%http://us.beta.bookmarks.yahoo.com/toolbar/savebm,%?u=,$GETURL,%&t=,$GETTITLE,%&d=,$BRWSEL,%&fid=__FOLDERID__
                                var func = this.bm2FolderSave;
                                menuitem.setAttribute("yevent", this.bm2FolderSave.replace("__FOLDERID__", node.getAttribute("fid")) );
                                menuitem.setAttribute("yhash", "'id':'boo2_m/fold_add'");
                                menuitem.setAttribute("oncommand", "yahooButtonHandler(event);");
                                menuitem.setAttribute("onclick", "if(event.button == 1) yahooButtonHandler(event);");
                            }
                            // Children
                            this.buildBM2(node, menupopup);
                            var nodeB = menupopup.firstChild;
                            var urlYes = 0;
                                    while(nodeB){
                                        if(nodeB.getAttribute("yurl") && nodeB.getAttribute("yurl")){
                                            urlYes++;
                                        }
                                        nodeB = nodeB.nextSibling;
                                    }
                            if(urlYes >= 1)
                            {
                                var nameStr = name.replace(/\$/g, "$$$$"); // tweak to handle '$' in the name (bug 1042831)
                                str = this.getStr("yahoo.bookmarks.folder.open", "Open in Tabs").replace("__TITLE__", nameStr);
                                menupopup.appendChild(this.document.createElementNS(this.ns, "menuseparator"));
                                menuitem = this.document.createElementNS(this.ns, "menuitem");
                                menuitem.setAttribute("crop", "end");
                                menuitem.setAttribute("label", str);
                                menuitem.setAttribute("tooltiptext", str);
                                menuitem.setAttribute("yhash", "'id':'boo2_m/fold_tabs'");
                                menuitem.setAttribute("oncommand", "yahooBookmarksOpenAll(this.parentNode); yahooButtonHandler(event);");
                                menuitem.setAttribute("onclick", "if(event.button == 1) {yahooBookmarksOpenAll(this.parentNode); yahooButtonHandler(event);}");
                                        menuitem.setAttribute("maxwidth", "300px");
                                menupopup.appendChild(menuitem);
                             }
                            if(menupopup.childNodes.length <= 2)
                            {
                                // remove the separator if there are no bookmarks in the folder.
                                menupopup.removeChild(menupopup.childNodes[1]);
                            }
                            menu.appendChild(menupopup);
                            parent.appendChild(menu);
                        }
                    break;
                    // Bookmark
                    case "B":
                            // Quick access limit (lenth +1 for top level and length for folder)
                        if((node.parentNode.getAttribute("type") == "RecentSave" || node.parentNode.getAttribute("type") == "FrequentUse") &&
                            ((node.parentNode.getAttribute("type") == this.bm2Prefs.OrderBy && parent.childNodes.length - 1 == this.bm2Prefs.ToolbarDisplay) || // Adjust for section title
                                parent.childNodes.length == this.bm2Prefs.ToolbarDisplay)){
                            break;
                        }
                        menuitem = this.document.createElementNS(this.ns, "menuitem");
                        menuitem.setAttribute("crop", "end");
                        menuitem.setAttribute("label", name);
                        menuitem.setAttribute("value", node.getAttribute("u"));
                        menuitem.setAttribute("contextmenu", "yahoo-toolbar-context");
                        menuitem.setAttribute("tooltiptext", name);
                        // Actions
                        url = url.replace(/,/g, "%2C"); // escape comma
                        menuitem.setAttribute("yevent", ",4,boo_m,%"+ url);
                        menuitem.setAttribute("ytrack", "boo_m");
                        menuitem.setAttribute("yfunc",  "4");
                        menuitem.setAttribute('yurl', url);
                        menuitem.setAttribute('ybid', node.getAttribute("bid"));
                        menuitem.setAttribute("oncommand", "yahooButtonHandler(event);");
                        menuitem.setAttribute("onclick", "if(event.button == 1) yahooButtonHandler(event);");
                        //get favicon
                        menuitem.setAttribute("class", "menuitem-iconic bookmark-item");                            
                        if( (this.bm2Prefs.OrderBy == "RecentlySaved" && node.parentNode.getAttribute("type") == "RecentSave")||
                            (this.bm2Prefs.OrderBy == "FrequentlyAccessed" && node.parentNode.getAttribute("type") == "FrequentUse") ) {
                            this.mFileIO.fetchNCacheFavicon(url,menuitem);
                        } else {
                            var bImage = this.mFileIO.getFaviconFromCache(url,true);
                            menuitem.setAttribute("image", bImage);                        
                        }                       
                        parent.appendChild(menuitem);
                    break;
                    // Toolbar prefs section
                    case "Toolbar":
                        var d;
                        for(var n = 0; n < node.childNodes.length; n++){
                            d = node.childNodes[n];
                            if(d.nodeName == "outline" && d.getAttribute("type") == "Pref"){
                                this.bm2Prefs[d.getAttribute("text")] = d.getAttribute("a");
                            }
                        }
                    break;
                    // Recently Saved
                    case "RecentSave":
                        // None to show
                        if((this.bm2Prefs.ToolbarDisplay - 1) === 0 || node.getAttribute("total") == "0"){
                            break;
                        }
                        // Add to list
                        if(this.bm2Prefs.OrderBy == "RecentlySaved"){
                            // Initialize fragment
                            var frag = this.document.createDocumentFragment();
                            frag.appendChild(this.document.createElementNS(this.ns, "menuitem"));
                            frag.lastChild.setAttribute("label", this.getStr("yahoo.bookmarks.quick.recent", "Recently Saved"));            
                            frag.lastChild.setAttribute("tooltiptext", this.getStr("yahoo.bookmarks.quick.recent", "Recently Saved"));
                            frag.lastChild.style.fontWeight = "bold";
                            frag.lastChild.setAttribute("disabled","true");
                            frag.lastChild.style.color = "black";
                            // Add children
                            this.buildBM2(node, frag);
                            // Add fragment before quick access folder
                            var sep = this.document.createElementNS(this.ns, "menuseparator");
                            sep.setAttribute("id", "yahoo-bookmarks-quickaccess-separator");
                            if(parent.qaFolder){
                                parent.insertBefore(frag, parent.qaFolder);
                                parent.insertBefore(sep, parent.qaFolder);
                                parent.qaFolder = null;
                            }
                            else{
                                parent.appendChild(frag);
                                parent.appendChild(sep);
                            }
                        }
                        // Create folder
                        else{
                            menu = this.document.createElementNS(this.ns, "menu");
                            menu.setAttribute("id", "yahoo-bookmarks-quickaccess-folder");
                            menu.setAttribute("label", this.getStr("yahoo.bookmarks.quick.recent", "Recently Saved"));
                            menu.setAttribute("tooltiptext", this.getStr("yahoo.bookmarks.quick.recent", "Recently Saved"));
                            if(this.bm2Prefs.DisplayFoldersAs == "TagView"){                                
                                menu.setAttribute("class","menu-iconic");
                                menu.setAttribute("image","chrome://ytoolbar/skin/tag.gif");
                            } else {
                                menu.setAttribute("class","menu-iconic folder-item");
                            }
                            menupopup = this.document.createElementNS(this.ns, "menupopup");
                            this.buildBM2(node, menupopup);
                            menu.appendChild(menupopup);
                            parent.appendChild(menu);   
                            parent.qaFolder = menu;                     
                        }
                    break;
                    // Frequently Used
                    case "FrequentUse":
                        // None to show
                        if((this.bm2Prefs.ToolbarDisplay - 1) == 0 || node.getAttribute("total") === "0"){
                            break;
                        }
                        // Check user pref
                        if(this.bm2Prefs.OrderBy === "FrequentlyAccessed"){
                            // Initialize fragment
                            var frag = this.document.createDocumentFragment();
                            frag.appendChild(this.document.createElementNS(this.ns, "menuitem"));
                            frag.lastChild.setAttribute("label", this.getStr("yahoo.bookmarks.quick.frequent", "Quick List"));
                            frag.lastChild.setAttribute("tooltiptext", this.getStr("yahoo.bookmarks.quick.frequent", "Quick List"));
                            frag.lastChild.style.fontWeight = "bold";
                            frag.lastChild.setAttribute("disabled","true");
                            frag.lastChild.style.color = "black";                                                                                
                            // Add children
                            this.buildBM2(node, frag);
                            // Add fragment before quick access folder
                            var sep = this.document.createElementNS(this.ns, "menuseparator");
                            sep.setAttribute("id", "yahoo-bookmarks-quickaccess-separator");
                            if(parent.qaFolder){
                                parent.insertBefore(frag, parent.qaFolder);
                                parent.insertBefore(sep, parent.qaFolder);
                                parent.qaFolder = null;
                            }
                            else{
                                parent.appendChild(frag);
                                parent.appendChild(sep);
                            }
                        }
                        // Create folder
                        else{
                            menu = this.document.createElementNS(this.ns, "menu");
                            menu.setAttribute("id", "yahoo-bookmarks-quickaccess-folder");
                            menu.setAttribute("label", this.getStr("yahoo.bookmarks.quick.frequent", "Quick List"));
                            menu.setAttribute("tooltiptext", this.getStr("yahoo.bookmarks.quick.frequent", "Quick List"));
                            if(this.bm2Prefs.DisplayFoldersAs == "TagView"){                                
                                menu.setAttribute("class","menu-iconic");
                                menu.setAttribute("image","chrome://ytoolbar/skin/tag.gif");
                            } else {
                                menu.setAttribute("class","menu-iconic folder-item");
                            }
                            menupopup = this.document.createElementNS(this.ns, "menupopup");
                            this.buildBM2(node, menupopup);
                            menu.appendChild(menupopup);
                            parent.appendChild(menu);
                            parent.qaFolder = menu;
                        }
                    break;
                }
            }           
            uni = null;
        } catch(e){           
        }
        if(recursionBase && this.mFileIO.isDownloading()) {
            this.mFileIO.registerNotifier("yahoo-feed-bookmarks-updated");                        
        }
    },
    /** 
    * Bump up bookmark click counts
    * @param {String} bid The bookmark page id
    */
    bumpUpBM2Usage : function(bid) {
        if(!bid) {
            return;
        }
        var cnt = 1;
        if(this.bm2Usage[bid])
        {
            cnt = parseInt(this.bm2Usage[bid], 10);
            cnt = (cnt < 1 ? 0 : cnt) + 1;
        }
        this.bm2Usage[bid] = "" + cnt;
    },
    /** 
    * Return BM2 usage data as docid:cnt,docid2:cnt,... 
    */
    getBM2UsageString : function() {
        var str = "";
        for(key in this.bm2Usage) {
            if(key) {
                str += (str.length < 1 ? "" : ",") +
                     key + "|" + this.bm2Usage[key];
            }
        }
        return str;
    },
    /** 
    * Clear BM2 usage data
    */
    clearBM2Usage : function() {
        for (key in this.bm2Usage) {
            this.bm2Usage[key] = null;
        }
        this.bm2Usage = [];
    },
    /** 
    * Get string from localization bundle
    * @param {String} name The localization name of the string
    * @param {String} def The default text, if cannot retrieve string
    * @private 
    */
    getStr : function(name, def){
        var str = null;
        if(this.strings) {
            str = this.strings.GetStringFromName(name);
        }
        if(!str && def){
            return def;
        }
        return str;
    },
    /* DO NOT CHANGE */
    QueryInterface: function (iid) {
        if(!iid.equals(CI.nsIYahooDomBuilder) && !iid.equals(CI.nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
    }
};
/* DO NOT CHANGE ANYTHING BELOW */
function NSGetModule(compMgr, fileSpec) {
    return {
        myCID       : Components.ID("{15e84d13-9bda-4810-ad02-437d2580c87d}"),
        myProgID    : "@yahoo.com/dombuilder;1",
        firstTime   : true,
        registerSelf : function (compMgr, fileSpec, location, type) {
            if (this.firstTime) {
                this.firstTime = false;
                throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
            }
            compMgr = compMgr.QueryInterface(CI.nsIComponentRegistrar);
            compMgr.registerFactoryLocation(this.myCID, "Yahoo! Dom Builder", this.myProgID, fileSpec, location, type);
        },
        getClassObject : function (compMgr, cid, iid) {
            if (!cid.equals(this.myCID)) {
                throw Components.results.NS_ERROR_NO_INTERFACE;
            }
            if (!iid.equals(CI.nsIFactory)) {
                throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
            }
            return this.myFactory;
        },
        myFactory : {
            createInstance : function (outer, iid) {
                if (outer !== null) { 
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                }
                return new YahooDomBuilder().QueryInterface(iid);
            }
        },
        canUnload : function(compMgr) { return true; }
    };
}
