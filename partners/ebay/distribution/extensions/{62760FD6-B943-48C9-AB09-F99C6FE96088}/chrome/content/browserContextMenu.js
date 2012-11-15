/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */EbayCompanion.BrowserContextMenu={init:function(){try{this._contextMenu=document.getElementById("contentAreaContextMenu");EbayCompanion.addManagedEventListener(this._contextMenu,"popupshowing",let(that=this)function(event)that._onPopupShowing(event),false);}catch(e){EbayCompanion.Logger.exception(e);}},uninit:function(){},_onPopupShowing:function(event){try{if(gContextMenu){if(gContextMenu.isTextSelected){let stringBundle=EbayCompanion.Constants.stringBundle;let formattedString=stringBundle.getString("ecBrowser.canvas.menu.search",[this._getTrimmedSelection()]);gContextMenu.setItemAttr("ebayCompanionContextSearch","label",formattedString);}
gContextMenu.showItem("ebayCompanionContextSearch",gContextMenu.isTextSelected);}}catch(e){EbayCompanion.Logger.exception(e);}},_getTrimmedSelection:function(){let selectedText="";try{selectedText=getBrowserSelection(16);if(!selectedText){selectedText="";}else if(selectedText.length>15){selectedText=selectedText.substr(0,15)+"...";}}catch(e){EbayCompanion.Logger.exception(e);}
return selectedText;}}