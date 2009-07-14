//Integrated from Tabs Open Relative, close@doubleclick and Tab Buttons. 
window.addEventListener("load", function(event){
// this part is integrated from close tab by double click
	getBrowser().mTabContainer.addEventListener("dblclick", function(event) {
		var node = event.originalTarget;
		while (node.localName != "tabbrowser"){
			if (node.localName == "tab"){
				gBrowser.removeCurrentTab();
				return;
			}
			node = node.parentNode;
		}
	}, false)

// below is integrated from tabs open relative
	tabimprovelite_tabsopenrelative_nextTab = 1;
	tabimprovelite_tabsopenrelative_ignoreNext = false;
	getBrowser().mTabContainer.addEventListener("select", function() { tabimprovelite_tabsopenrelative_nextTab = 1; }, false);
	gBrowser.mTabContainer.addEventListener("DOMNodeRemoved", function(event) {
	    try {
	        var index = event.target._tPos;
	        if (index && gBrowser.mTabContainer.selectedIndex < index && gBrowser.mTabContainer.selectedIndex + tabimprovelite_tabsopenrelative_nextTab > index) {
	            tabimprovelite_tabsopenrelative_nextTab--;
	        }
	    }
	    catch (ex) {}
	}, false);

	eval("gBrowser.addTab = " + gBrowser.addTab.toString().replace(
	    'if (t.previousSibling.selected)',
	    'if (tabimprovelite_tabsopenrelative_ignoreNext) { \
			tabimprovelite_tabsopenrelative_ignoreNext = false; \
	    } \
	    else if (!arguments.callee.caller || !arguments.callee.caller.caller || arguments.callee.caller.caller.name != "BrowserOpenTab" || getBoolPref("extensions.tabimprovelite.includeNewTabs", false)) { \
	        this.moveTabTo(t, this.mCurrentTab._tPos + tabimprovelite_tabsopenrelative_nextTab); \
	        tabimprovelite_tabsopenrelative_nextTab++; \
	    } \
	    if (t.previousSibling.selected)'
	));
//	alert(gBrowser.addTab.toString());
	
	/* Don't open links from external applications relatively */
//	alert(nsBrowserAccess.prototype.openURI.toString());
	eval("nsBrowserAccess.prototype.openURI = " + nsBrowserAccess.prototype.openURI.toString().replace(
	    'var newTab',
	    'tabimprovelite_tabsopenrelative_ignoreNext = isExternal; \
	    var newTab'
	));
	
	/* following codes are modified from internet. http://www.firefox.net.cn/forum/viewtopic.php?printertopic=1&t=24895&postdays=0&postorder=asc&start=0&finish_rel=-10000*/
    /*open url in new tab, open in current tab with alt key */
    try { // firefox 3.0.*
		//alert(BrowserLoadURL.toString());
        eval("BrowserLoadURL = " + BrowserLoadURL.toString().replace(
            'aTriggeringEvent && aTriggeringEvent.altKey', '(getBoolPref("extensions.tabimprovelite.openUrlInTab", true) ^ (aTriggeringEvent && aTriggeringEvent.altKey)) && (gBrowser.currentURI.spec!="about:blank" ||gBrowser.webProgress.isLoadingDocument)'));
    }
    catch(e) { // firefox 3.1 and up
		var urlbar = document.getElementById("urlbar");
//		alert(urlbar.handleCommand.toString());
        eval("urlbar.handleCommand = " + urlbar.handleCommand.toString().replace('aTriggeringEvent && aTriggeringEvent.altKey', '(getBoolPref("extensions.tabimprovelite.openUrlInTab", true) ^ (aTriggeringEvent && aTriggeringEvent.altKey)) && (gBrowser.currentURI.spec!="about:blank" ||gBrowser.webProgress.isLoadingDocument)')); 
    }
	
	/* open search in tabs*/
   try {
        var cName = "@mozilla.org/preferences-service;1";
        var fPref = Components.classes[cName].getService(Components
            .interfaces.nsIPrefService);
 		eval("document.getElementById(\"searchbar\").handleBaseCommand = " + document.getElementById("searchbar").handleBaseCommand.toString().replace(
				'if ((aEvent && aEvent.altKey) ^ newTabPref)','if (((aEvent && aEvent.altKey) ^ newTabPref) && (gBrowser.currentURI.spec!="about:blank" ||gBrowser.webProgress.isLoadingDocument))'));
//			alert(document.getElementById("searchbar").handleBaseCommand);
//			alert(whereToOpenLink);
        eval("whereToOpenLink = " + whereToOpenLink.toString().replace(
            'if (!e) {', 'if (e&&e.currentTarget.getAttribute("anonid")\
            =="search-go-button" && e.button == 0 && !e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && getBoolPref("browser.search.openintab", true) && (gBrowser.currentURI.spec!="about:blank" ||gBrowser.webProgress.isLoadingDocument)) return "tab"; $&'));
    }catch(e){} 
}, false);