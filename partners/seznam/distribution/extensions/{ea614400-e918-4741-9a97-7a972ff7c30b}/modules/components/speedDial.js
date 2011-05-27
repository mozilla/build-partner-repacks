var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.SpeedDial = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.SpeedDial",
			IMPLEMENT : [FoxcubService.LogInterface],
			VERSION : "0.1"
		});
		
Components.utils.import("resource://foxcub/components/subclasses/bookmarks.js");
		
		
FoxcubService.SpeedDial.prototype.$constructor = function() {
	this.log("constructor start", "info");
	this.historyService =  Components.classes["@mozilla.org/browser/nav-history-service;1"].getService(Components.interfaces.nsINavHistoryService);
	this.nativeJSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
	this.bookmarks = new FoxcubService.SpeedDial.Bookmarks();
	this.log("constructor end", "info");
}
			
FoxcubService.SpeedDial.prototype.DEFAULT_STATE = "small";
FoxcubService.SpeedDial.prototype.MAX_HISTORY_ITEMS = 30;
/**
 * inicializuje sa v speedDial.html
 */
FoxcubService.SpeedDial.prototype.init = function(){
	/*
	var m = this.isDatabaseOK();
	this.log("inited and OK")
	*/
	try {
		this.bookmarks.init();
		//stranky z historie
		this.pages = this.getPagesFromHistory();
		this.sourceId = FoxcubService.SOURCE;
		this.folder = this._getFolder();
		this.state = this.getState();
		//sinchrinizacia s bookmarkmi
		this._synchronize();
	} catch(e){
		this.log("ERROR = " + e,"err");
	}
};

/**
 * 
 */
FoxcubService.SpeedDial.prototype._synchronize = function(changedId,data){
	try{
	this.folder = this.bookmarks.synchronize(this.folder,changedId,data);
	this._saveFolder();
	}catch(e){
		this.log(e.toString(),"error")
	}
	
};
/**
 * Ziskanie nastavenych stranok
 * @return {array} - pole obsahujuce nastavene stranky
 */
FoxcubService.SpeedDial.prototype._getFolder = function(){
	var pref = FoxcubService.pref.get().getPref("speedDial.items");
	if(pref.success){
		var out = this.nativeJSON.decode(pref.value);
		return out;
	}
	return [];
};
/**
 * Ulozenie nastavenych stranok
 */
FoxcubService.SpeedDial.prototype._saveFolder = function(){
	var out = this.nativeJSON.encode(this.folder);
	FoxcubService.pref.get().setPref("speedDial.items",out);
};
/**
 * Zobrazenie stranok
 * @return {string} (small|big)
 */
FoxcubService.SpeedDial.prototype._getState = function(){
	var pref = FoxcubService.pref.get().getPref("speedDial.pageType");
	if(pref.success){
		return pref.value;
	}
	return this.DEFAULT_STATE;	
};
/**
 * nastavenie statu
 */
FoxcubService.SpeedDial.prototype._saveState = function(){
	FoxcubService.pref.get().setPref("speedDial.pageType",this.state);
};

FoxcubService.SpeedDial.prototype.getEnabled = function(){
	return true;
};
FoxcubService.SpeedDial.prototype.getSSID = function(){
	var info = FoxcubService.install.extensionInfo();
	if(info==null) return "";
	return info.ssid;
};
FoxcubService.SpeedDial.prototype.getScreenshotUrl = function(){
	return FoxcubService.config.get("speedDial","screenshotUrl");
};

FoxcubService.SpeedDial.prototype.getState = function(){
	return this._getState();
};

FoxcubService.SpeedDial.prototype.setState = function(state){
	this.state = state;
	this._saveState();
};
/**
 * Vrati polozku historie
 * @param {} index
 * @return {}
 */
FoxcubService.SpeedDial.prototype.getHistoryRecord = function(index){
	if(this.pages[index]){
		return this.pages[index];
	}
	return null;
};

FoxcubService.SpeedDial.prototype.getHistorySize = function(){
	return this.pages.length;
};

FoxcubService.SpeedDial.prototype.getSourceId = function(){
	
	return this.sourceId;
};
FoxcubService.SpeedDial.prototype._getActiveWindow = function() {
	var WindowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator);
	return WindowMediator.getMostRecentWindow('navigator:browser');
}
FoxcubService.SpeedDial.prototype._getTabbedBrowser = function() {
	return this._getActiveWindow().gBrowser;
}
FoxcubService.SpeedDial.prototype._getOpenedTabs = function() {
	var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
	var defIcon = faviconService.defaultFavicon.spec;
	var tbrowser = this._getTabbedBrowser();
	var items = [];
	for(var i=0; i<tbrowser.browsers.length; i++){
		var browser = tbrowser.getBrowserAtIndex( i );
		var uri = browser.currentURI;
		var url = uri.prePath + uri.path;
		if(url && url.match(/^http/ig)){
			var item = {}
			var favicon = defIcon;
			try{
				var faviconURI = faviconService.getFaviconForPage(uri);
				favicon = "moz-anno:favicon:" + faviconURI.prePath + faviconURI.path;
			}catch(e){}
			item.type = "tab";
			item.url = url;
			item.title = browser.contentTitle ? browser.contentTitle : url;
			item.faviconUrl = favicon;
			items.push(item);
		}

	}
	return items;
};

FoxcubService.SpeedDial.prototype.switchPositions = function(index1,index2){
	var d1 = this.folder[index1];
	var d2 = this.folder[index2];
	this.folder[index1] = null
	this.folder[index2] = null
	if(d1) this.folder[index2] = d1;
	if(d2) this.folder[index1] = d2;
	this._synchronize();
}
FoxcubService.SpeedDial.prototype.getDomains = function(){
	return  FoxcubService.config.get("speedDial","domains");
}
FoxcubService.SpeedDial.prototype.savePosition = function(index,data){
	//this.log(this.nativeJSON.encode(data),"error")
	var item = this.folder[index];
	var isNew = !item;
	var isSynchronized =  (!isNew && ("bookmarkId" in item) && item.bookmarkId > -1);
	//iba zmazeme
	if(!data){
	   if(isSynchronized){
	   		this._synchronize(item.bookmarkId,null);
	   }
	   return this.loadPosition(index);
	} 
	if(data.type!="multi")
			data.url = this._fixUrl(data.url);
	
	var tmpBookmarkId = null
	var typeChanged = false
	if(isSynchronized){
		tmpBookmarkId = item.bookmarkId;
		typeChanged = (data.type != item.type) || (data.type=="multi" && !data.url.length);
	}
	//vytvor nove polozky
	if(isNew || typeChanged){
		var tmpBookmarkId = isSynchronized && !isNew? item.bookmarkId :  null;
		if(data.type == 'multi'){
			var openedTabs = this._getOpenedTabs();
			//ak niesu ziadne otvorene taby nic sa nedeje
			if(!openedTabs.length){
				return {
					type : 'multi',
					url :[],
					title : data.title
				}			
			}
			var childs = [];
			for(var i in openedTabs){
				var child = {
					bookmarkId:-1,
					type : 'simple',
					url : openedTabs[i].url,
					title : openedTabs[i].title
				};
				childs.push(child)
			}
			this.folder[index] = {
				title:data.title,
				bookmarkId:-1,
				type:"multi",
				childs:childs				
			}
		}else{

			this.folder[index] = {
				bookmarkId:-1,
				title : data.title,
				url : data.url,
				type : data.type
			}							
		}
		//ak sa zmenil typ zmaz polozku
		if(typeChanged) data = null;
	}
	
	this._synchronize( tmpBookmarkId , data);

	return this.loadPosition(index);
};

FoxcubService.SpeedDial.prototype._fixUrl = function(str){
	return (str.match(/^(ftp|http|https):\/\//)) ? str : "http://" + str;
};
FoxcubService.SpeedDial.prototype.findBackgroundImage = function(){
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(this._getActiveWindow(), "Najít obrázek", nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterImages);	
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
		var iOService =Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var uri = iOService.newFileURI(fp.file)
		return uri.prePath + uri.path;
	}
	return "";
};
FoxcubService.SpeedDial.prototype.getSettings = function(key){
	var pref = FoxcubService.pref.get().getPref("speedDial.settings",true);
	if(pref.success){
		return key ? pref.value[key] : pref.value;
	}
	return {};
};
FoxcubService.SpeedDial.prototype.setSettings = function(key,obj){
	var settings = this.getSettings();
	settings[key] = obj;
	FoxcubService.pref.get().setPref("speedDial.settings",settings);
};
FoxcubService.SpeedDial.prototype.loadPosition = function(index){

	var data = this.folder[index];
	if(data){
		var out = {};
		out.title = data.title;
		out.type = data.type;
		if(data.type=="multi"){
			var urls = [];
			for(var i in data.childs){
				if(data.childs[i].url){
					urls.push(data.childs[i].url);
				}			
			}
			out.url = urls;
		}else{
			out.url = data.url
		}
		return out;
	}
	return {url:"",title:""};
};
FoxcubService.SpeedDial.prototype.ff_openAction = function(index) {
	var data = this.folder[index];
	if (data) {
		var tbrowser = this._getTabbedBrowser();
		if (data.type == "simple") {
			tbrowser.getBrowserForTab(tbrowser.selectedTab).loadURI(data.url);

		} else {
			var first = true;
			for (var i =0;data.childs.length; i++) {
				
				if (i == 0) {
					tbrowser.getBrowserForTab(tbrowser.selectedTab)
							.loadURI(data.childs[i].url);
				} else {
					tbrowser.addTab(data.childs[i].url);
				}
					
			}
		}

	}

};


FoxcubService.SpeedDial.prototype.getPagesFromHistory = function(){
		var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
		var defIcon = faviconService.defaultFavicon.spec;
		
		var options = this.historyService.getNewQueryOptions();
		options.maxResults = this.MAX_HISTORY_ITEMS;
		options.sortingMode = options.SORT_BY_DATE_DESCENDING;
		var query = this.historyService.getNewQuery();
		var result = this.historyService.executeQuery(query, options);	
		var pages = [];
		result.root.containerOpen = true;
		
		
		var resultCount = result.root.childCount;
		var count = 0;
		var index = 0;
		/*this.log("!!! >> " + result.root.childCount);*/
		while((count <= this.MAX_HISTORY_ITEMS) && (index < resultCount)){
			var res = result.root.getChild(index);
			/*this.log(count + " = " + res.uri)*/
			if((res.uri.indexOf("http") == 0) || (res.uri.indexOf("https") == 0)){
				count++;
				var item = {};
				item.type = "history";
				item.url = res.uri;
				item.title = res.title ? res.title : res.uri;
				if(res.icon){
					item.faviconUrl = res.icon;
				} else {
					item.faviconUrl = defIcon;
				}
				pages.push(item);
			}
			index++
		}
		var tabs = this._getOpenedTabs();
		for(var i in tabs){
			pages.push(tabs[i])
		}
		
		return pages;
};
