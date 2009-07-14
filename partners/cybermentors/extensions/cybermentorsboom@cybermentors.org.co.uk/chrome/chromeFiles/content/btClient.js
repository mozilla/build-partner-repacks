/* This file contains all client information */
/* It HAS to be included first. */

if (typeof(BrandThunder) == "undefined") {
  BrandThunder = {};
  BrandThunder.clients = {};
}

BrandThunder.clients.cybermentors = {
  "shortName": "cybermentors",
  "clientName": "CyberMentors",
  "clientCode": "000XXX",
  "askOriginCode": "101XXX",
  "clientVersion": "001",
  "clientCountry": "US",
  "rebrandID": "",
  "extensionID": "cybermentorsboom@cybermentors.org.co.uk",
  /* Used for uninstalling theme */
//  "themeID": "cybermentorstheme@cybermentors.org.co.uk",
  /* This is the short name used in chrome.manifest (toolbar) */
  "packageName": "cybermentorsboom",
//  "welcomePage": "http://brandthunder.com/entertainment/cybermentors/firstrun.php",
  "homePage": "http://cybermentors.org.co.uk",
//  "toolbarUpdateURL": "http://brandthunder.com/entertainment/cybermentors/toolbar.json",
  "booms": {
    "cybermentors": "CyberMentors"
  }
}


/* I hate this, but I don't see any way around it. Firefox toggleSidebar doesn't
   allow for custom parameters and we need them. */
/*
if (typeof(toggleSidebar) != "undefined") {
  if (!toggleSidebar.btReplaced) {
	var origToggleSidebar = toggleSidebar;
	
	function btToggleSidebar(commandID, forceOpen) {
	  if (commandID) {
		if (commandID.substring(0,3) == "bt-") {
		  var sidebarBox = document.getElementById("sidebar-box");
		  var commands = commandID.split('?');
		  if (commands.length > 1) {
			sidebarBox.setAttribute("btSidebarParams", commands[1]);
            if (!document.getElementById("sidebar-box").hidden) {
              var sidebarid = window.top.document.getElementById("sidebar-box").getAttribute("sidebarcommand");
			  var sidebarurl = window.top.document.getElementById('sidebar').getAttribute("src");
			  if (sidebarid == commands[0]) {
				if (!(sidebarurl.match(commands[1]))) {
  			      origToggleSidebar();
				}
			  }
			}
		  }
		  commandID = commands[0];
		}
	  }
	  origToggleSidebar(commandID, forceOpen);
	}
	
	toggleSidebar = btToggleSidebar;
	toggleSidebar.btReplaced = true;    
	toggleSidebar.origToggleSidebar = origToggleSidebar;
  }
}
*/
