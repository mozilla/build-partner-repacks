var moon_shortcuts = {
	init: false,
	
	loadPopup: function(aPopup) {
		if (this.init) {
			return;
		}
		
		var menuMap = new Object();
		var menuItems = document.getElementsByTagName("menuitem");
		for (var i = 0; i < menuItems.length; ++i) {
			var menuItem = menuItems[i];
			var keyId = menuItem.getAttribute("key");
			if (keyId) {
				menuMap[keyId] = menuItem;
//				this.log("found " + keyId + ":" + menuItem.getAttribute("id"));
			}
		}
		
		var keyIds = new Array(
				"key_newNavigatorTab", 
				"key_close", 
				"key_reload", 
				"key_search", 
				"key_quitApplication",
				"separator",
				"key_gotoHistory", 
				"viewBookmarksSidebarKb", 
				"addBookmarkAsKb", 
				"manBookmarkKb", 
				"separator",
				"key_openDownloads", 
				"menu_openAddons", 
				"key_sanitize", 
				"key_viewSource"
		);
		
		for (var i = 0; i < keyIds.length; ++i) {
			if (keyIds[i] == "separator") {
				var newMenuItem = document.createElement("menuseparator");
				aPopup.appendChild(newMenuItem);
				continue;
			}
			
			var menuItem = menuMap[keyIds[i]];
			if (!menuItem) {
				menuItem = document.getElementById(keyIds[i]);
//				if (menuItem) this.log("found " + keyIds[i] + ":" + menuItem.getAttribute("id"));
			}
			if (menuItem) {
				var label = menuItem.getAttribute("label");
				var commandId = menuItem.getAttribute("command");
				var keyId = menuItem.getAttribute("key");
				var observes = menuItem.getAttribute("observes");
				
//				this.log(label + ":" + commandId + ":" + keyId + ":" + observes);
				
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
						newMenuItem.setAttribute("label", label + this.getCommandKey(commandKey, modifiers));
						newMenuItem.setAttribute("command", commandId);
						aPopup.appendChild(newMenuItem);
					} else if (observes){
						if (key != null) {
							commandKey = key.getAttribute("key");
							modifiers = key.getAttribute("modifiers");
						} else {
							commandKey = null;
						}
						var newMenuItem = document.createElement("menuitem");
						newMenuItem.setAttribute("observes", observes);
						newMenuItem.setAttribute("label", label + this.getCommandKey(commandKey, modifiers));
						aPopup.appendChild(newMenuItem);					
					}
				}
			}
		}
		this.init = true;
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
	
	openPopup: function() {
		var popup = document.getElementById("shortcuts-moon-menupopup");
		var aNode = document.getElementById("shortcuts-moon-statusbar-text");
		popup.openPopup(aNode, "before_end", 0, -3);
	},
	
	log: function(msg) {
		if (!this.console) {
			this.console = Components.classes["@mozilla.org/consoleservice;1"]
						.getService(Components.interfaces.nsIConsoleService);
		}
		this.console.logStringMessage("shortcuts: " + msg);
	},
};

