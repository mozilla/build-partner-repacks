var zoompanel = {
	popupinit: false,
	
	loadPopup: function(aPopup) {
		if (this.popupinit)
			return;
		
		var menuMap = new Object();
		var menuItems = document.getElementsByTagName("menuitem");
		for (var i = 0; i < menuItems.length; ++i) {
			var menuItem = menuItems[i];
			var keyId = menuItem.getAttribute("key");
			if (keyId) {
				menuMap[keyId] = menuItem;
			}
		}
		
		var keyIds = new Array("key_fullZoomEnlarge", "key_fullZoomReduce", "key_fullZoomReset");
		var separator = document.getElementById("zoompanel-menuseparator");
		for (var i = 0; i < keyIds.length; ++i) {
			var menuItem = menuMap[keyIds[i]];
			if (!menuItem) {
				menuItem = document.getElementById(keyIds[i]);
			}
			if (menuItem) {
				var label = menuItem.getAttribute("label");
				var commandId = menuItem.getAttribute("command");
				var keyId = menuItem.getAttribute("key");
				var observes = menuItem.getAttribute("observes");
				
				if (label) {
					var key;
					var commandKey;
					var modifiers;
					if (keyId) {
						key = document.getElementById(keyId);
					} else {
						key = null;
					}
					if (commandId) {
						if (key != null) {
							commandKey = key.getAttribute("key");
							modifiers = key.getAttribute("modifiers");
						} else {
							commandKey = null;
						}
						var newMenuItem = document.createElement("menuitem");
						newMenuItem.setAttribute("label", label);  // + this.getCommandKey(commandKey, modifiers)
						newMenuItem.setAttribute("command", commandId);
						aPopup.insertBefore(newMenuItem, separator);
					} 
				}
			}
		}
		this.popupinit = true;
	},
	
	getCommandKey: function(commandKey, modifiers) {
		if (!commandKey)
			return "";
			
		var mylabel = "    (";
		if(modifiers) {
			var modifyKeys = modifiers.split(",");
			for (var j = 0; j < modifyKeys.length; ++j) {
				var keyvalue = modifyKeys[j];
				if (keyvalue == "accel") {
					if (navigator.userAgent.match(/Mac OS/))
						keyvalue = "⌘"
					else
						keyvalue = "ctrl";
				}
				mylabel += this.upperCapital(keyvalue) + "+";
			}
		}
		
		if (commandKey) {
			mylabel += this.upperCapital(commandKey) + ")";
		}
		return mylabel;
	},
	
	upperCapital: function(value) {
		if (value && value.length == 1)
			return value.toUpperCase();
			
		if (value) {
			return value.substring(0, 1).toUpperCase() + value.substring(1);
		}
	},
	
	applyZoomChange: function(aMenuList) {
		if (aMenuList.selectedItem && aMenuList.selectedItem.value) {
			ZoomManager.zoom = parseInt(aMenuList.selectedItem.value) / 100;
			FullZoom._applySettingToPref();
		} else {
			aMenuList.value = Math.floor(ZoomManager.zoom * 100);
		}
	},
	
	toggleZoomState: function(aMenuItem) {
		ZoomManager.toggleZoom();
		
		var strings = document.getElementById("zoompanel-strings");
		if (ZoomManager.useFullZoom) {
			aMenuItem.setAttribute("label", strings.getString("zoomtextonly"));
		} else {
			aMenuItem.setAttribute("label", strings.getString("fullzoom"));
		}
	},
	
	init: function() {
		window.removeEventListener("load", zoompanel.init, false);
		
		var tb = document.getElementById("content");
		tb.addEventListener("pageshow", zoompanel.fullzoomChange, false);
		tb.addEventListener("TabSelect", zoompanel.fullzoomChange, false);
		
		window.addEventListener("FullZoomChanged", zoompanel.fullzoomChange, false);
	},
	
	shutdown: function() {
		window.removeEventListener("unload", zoompanel.shutdown, false);
		
		var tb = document.getElementById("content");
		tb.removeEventListener("pageshow", zoompanel.fullzoomChange, false);
		tb.removeEventListener("TabSelect", zoompanel.fullzoomChange, false);
		
		window.removeEventListener("FullZoomChanged", zoompanel.fullzoomChange, false);
	},
	
	onKeyUp: function(aEvent) {
		if (aEvent.keyCode != 13) 
			return;
			
		ZoomManager.zoom = parseInt(document.getElementById("zoompanel-menulist").value) / 100;
		FullZoom._applySettingToPref();
	},
  
	fullzoomChange: function(event) {
		var ratio = ZoomManager.zoom;
		document.getElementById("zoompanel-menulist").value = Math.floor(ratio * 100) + "%";
		if (event && event.type != "FullZoomChanged") {
			FullZoom._applySettingToPref();
		}
	},
	
};

FullZoom.onLocationChange = (function FullZoom_onLocationChange(aURI) {
  	if (!aURI)
		return;
	
	var doApplyPrefToSetting = true;
	if (doApplyPrefToSetting)
		this._applyPrefToSetting(this._cps.getPref(aURI, this.name));
});

window.addEventListener("load", zoompanel.init, false);
window.addEventListener("unload", zoompanel.shutdown, false);


// 