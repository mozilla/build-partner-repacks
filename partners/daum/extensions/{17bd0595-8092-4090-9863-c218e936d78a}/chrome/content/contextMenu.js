window.addEventListener("load", initOverlay, false);

function initOverlay()
{
	var menu = document.getElementById("contentAreaContextMenu");
	menu.addEventListener("popupshowing", contextPopupShowing, false);
}

function contextPopupShowing()
{
//	var contextItemDaum = document.getElementById("context-item-daum");
	var contextItemDaumdic = document.getElementById("context-item-daumdic");
	
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);

//	contextItemDaum.label = "Daum 검색: " + "\"" + getBrowserSelection() + "\"";
	contextItemDaumdic.label = "Daum사전 검색: " + "\"" + getBrowserSelection() + "\"";

//	gContextMenu.showItem("context-item-daum", gContextMenu.isTextSelected);
	gContextMenu.showItem("context-item-daumdic", gContextMenu.isTextSelected);
	gContextMenu.showItem("context-sep-search", gContextMenu.isTextSelected);
}