var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.SpeedDial.Bookmarks = FoxcubService.JAK.ClassMaker.makeClass({
			NAME : "FoxcubService.SpeedDial.Bookmarks",
			IMPLEMENT : [FoxcubService.LogInterface],
			VERSION : "0.1"
		});
		

FoxcubService.SpeedDial.Bookmarks.prototype.$constructor = function() {
	this.log("constructor start", "info");
	this.bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Components.interfaces.nsINavBookmarksService);
	this.historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"]
			.getService(Components.interfaces.nsINavHistoryService);
	this.idnService = Components.classes["@mozilla.org/network/idn-service;1"]
			.getService(Components.interfaces.nsIIDNService);
	this.ios = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
	this.nativeJSON = Components.classes["@mozilla.org/dom/json;1"]
			.createInstance(Components.interfaces.nsIJSON);
	this.FOLDER_NAME = this.toUTF16("Rychlá volba Lištičky", "UTF-8");
	this.GUID = this.toUTF16("{3910b0c7-7541-4c51-a984-062228ddf8fd}", "UTF-8");
	this.rootId = -1;
	this.log("constructor end", "info");
}



FoxcubService.SpeedDial.Bookmarks.prototype.init = function(options) {
	try{
		this._setRootId();
	}catch(e){
		this.log(e,"error")
	}
	
	
	this._createFolder();
}
FoxcubService.SpeedDial.Bookmarks.prototype._setRootId = function() {
	
	this.rootId = this.bookmarksService.getItemIdForGUID(this.GUID);
	if(this.rootId<0){
		var tree = this._getTree(this.bookmarksService.placesRoot);
		this._setRootIdRecursive(tree);
	}	
	//this.log(tree.toSource(),"warn");
}
FoxcubService.SpeedDial.Bookmarks.prototype._setRootIdRecursive = function(tree) {
	for(var i=0;i<tree.length;i++){
		if(tree[i].title == this.FOLDER_NAME){
			this.rootId = tree[i].bookmarkId;
			this.bookmarksService.setItemGUID(this.rootId, this.GUID);
			return true;
		}else if(tree[i].childs && tree[i].childs.length){
			var a = this._setRootIdRecursive(tree[i].childs);
			if(a)return true;
		}
	}
	return false;
}
FoxcubService.SpeedDial.Bookmarks.prototype.synchronize = function(savedItems,changedId,data) {
	try{
		this._updateItem(changedId,data);
	}catch(e){
		this.log(e.toString(),"error")
	}
	var bookmarkItems = this._getTree(this.rootId);
	
	return this._synchronize(savedItems);
}

FoxcubService.SpeedDial.Bookmarks.prototype._synchronize = function(savedItems) {
	var synch = []; 
	var tmp = this._getTree(this.rootId);
	var index = 0;
	//pridanie novych update existujucich
	for(var i in savedItems){
		//this.log(" :: " + i,"warn");
		var pair = this._getPairId(savedItems[i],tmp);
		
		if(pair == -3 || pair == -2){
			synch[i] = null;
		}else if(pair == -1){
			synch[i] = this._createItem(savedItems[i],this.rootId,index++);
		}else{
			synch[i] = this._clone(tmp[pair]);
			tmp[pair] = null;
			delete(tmp[pair]);
		}
		//this.log(pair+" :: " + i +this.nativeJSON.encode(synch),"warn");
	}
	//this.log(this.nativeJSON.encode(synch),"warn");
	var j = -1;
	for(var i in tmp){
		//this.log("others :::"+this.nativeJSON.encode(tmp[i]),"warn");
		while(synch[++j]);
		 synch[j] = this._clone(tmp[i]);
	
	}
	return synch;
}

FoxcubService.SpeedDial.Bookmarks.prototype._createItem = function(item, folderId, index) {
	var id = null;
	if (item.type == "simple") {
		var uri = this.ios.newURI(item.url, null, null);
		id = this.bookmarksService.insertBookmark(folderId, uri, index,
				item.title);
		return {
			url : item.url,
			title : item.title,
			bookmarkId : id,
			bookmarkIndex : index,
			type : "simple"
		}
	} else {
		id = this.bookmarksService.createFolder(folderId, item.title, index);
		var childs = [];
		var childIndex = 0;
		for (i in item.childs) {
			childs.push(this._createItem(item.childs[i], id, childIndex++));
		}
		return {
			title : item.title,
			bookmarkId : id,
			bookmarkIndex : index,
			type : "multi",
			childs : childs
		}
	}

}	



FoxcubService.SpeedDial.Bookmarks.prototype._getPairId = function(savedItem,bookmarkItems) {
	if(savedItem === null) return -3; 
	if(savedItem.bookmarkId == -1) return -1; 
	for(var i in bookmarkItems){
		if(bookmarkItems[i].bookmarkId == savedItem.bookmarkId) 
			return i;
	}
	return -2;
}


FoxcubService.SpeedDial.Bookmarks.prototype._updateItem = function(changedId,data) {
	if(!changedId)return;
	if(!data){
		this.bookmarksService.removeItem(changedId);
		return;
	}
	if(data.type=='simple'){
		var uri = this.ios.newURI(data.url, null, null);
		this.bookmarksService.changeBookmarkURI(changedId, uri);			
	}
	this.bookmarksService.setItemTitle(changedId, data.title);
}
FoxcubService.SpeedDial.Bookmarks.prototype.removeBookmarks = function() {
	this.bookmarksService.removeItem(this.rootId);
}


FoxcubService.SpeedDial.Bookmarks.prototype._clone  = function(obj){
	return (this.nativeJSON.decode(this.nativeJSON.encode(obj)));
};

FoxcubService.SpeedDial.Bookmarks.prototype._createFolder = function() {
	if(this.rootId<0){
		this.rootId = this.bookmarksService.createFolder(
						this.bookmarksService.bookmarksMenuFolder, this.FOLDER_NAME, -1);	
		this.bookmarksService.setItemGUID (this.rootId , this.GUID);
	}
}

FoxcubService.SpeedDial.Bookmarks.prototype._getTree = function(folderId) {
	var rootNode = this._getFolderItems(folderId);
	rootNode.containerOpen = true;
	var out = [];
	for (var i = 0; i < rootNode.childCount; i++) {
		var node = rootNode.getChild(i);
		if (node.RESULT_TYPE_URI == node.type) {
			out.push({
				url:node.uri,
				title:node.title,
				bookmarkId:node.itemId,
				bookmarkIndex:node.bookmarkIndex,
				type:"simple"
			});

		} else if (node.RESULT_TYPE_FOLDER == node.type) {
			var tmp = {
				title:node.title,
				bookmarkId:node.itemId,
				bookmarkIndex:node.bookmarkIndex,
				type:"multi",
				childs:this._getTree(node.itemId)				
			}
			if(tmp.childs.length){
				out.push(tmp);
			}
			
		}

	}
	rootNode.containerOpen = false;	
	return out;
}

FoxcubService.SpeedDial.Bookmarks.prototype._getFolderItems = function(folderId) {
	var options = this.historyService.getNewQueryOptions();
	var query = this.historyService.getNewQuery();
	query.setFolders([folderId], 1);
	var result = this.historyService.executeQuery(query, options);
	return result.root;
}

FoxcubService.SpeedDial.Bookmarks.prototype.toUTF16 = function(aString, aCharCode) {
		var UConv = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService(Components.interfaces.nsIScriptableUnicodeConverter);
		var tmpString = "";
		try {
			UConv.charset = aCharCode;
			tmpString = UConv.ConvertToUnicode(aString);
		} catch(e) {
			tmpString = aString;
			this.log("String conversion faild!","error");
		}
		return tmpString;
}
FoxcubService.SpeedDial.Bookmarks.prototype.fromUTF16 = function(aString, aCharCode) {
		var UConv = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService(Components.interfaces.nsIScriptableUnicodeConverter);
		var tmpString = "";
		try {
			UConv.charset = aCharCode;
			tmpString = UConv.ConvertFromUnicode(aString);
		} catch(e) {
			tmpString = aString;
			this.log("String conversion faild!","error");
		}
		return tmpString;
}