function LOG (msg) {
	try{
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage(msg);
	} catch(e){}
}


function quicklaunch_getObserverService()
{
  return Components.classes["@mozilla.org/observer-service;1"].
    getService(Components.interfaces.nsIObserverService);
}

function quicklaunch_getPrefs()
{
  return Components.classes["@mozilla.org/preferences-service;1"].
    getService(Components.interfaces.nsIPrefBranch);
}

function quicklaunch_getCategoryManager()
{
  return Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
}

function quicklaunch_upgrade(){
 /*        //setup prompt service
        var title = "Windows快捷方式安装设置";
        var message = "欢迎您使用火狐插件\"Windows快捷方式\"，请您从定制工具栏中选择windows快捷方式按钮，并将它放在工具栏中您喜欢的地方.";
        var checkbox = null;
        var showAgain = {value: false};
       
        //prompt for customize 
        const IPS = Components.interfaces.nsIPromptService;
        var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(IPS);
        var rv = ps.confirmEx(window, title, message,
                           (IPS.BUTTON_TITLE_YES * IPS.BUTTON_POS_0) +
                           (IPS.BUTTON_TITLE_NO * IPS.BUTTON_POS_1),
                           null, null, null, checkbox, showAgain);
       
        // customize if yes                   
        if (rv == 0)
          BrowserCustomizeToolbar();
 */

	try {
		var firefoxnav = document.getElementById("nav-bar"); // use "nav-bar" in Firefox 2 and earlier
		var curSet = firefoxnav.currentSet;
		if (curSet.indexOf("quicklaunch-button") == -1)
		{
			var set;
			// Place the button before the urlbar
			if (curSet.indexOf("urlbar-container") != -1)
				set = curSet.replace(/urlbar-container/, "quicklaunch-button,urlbar-container");
			else  // at the end
				set = firefoxnav.currentSet + ",quicklaunch-button";
			firefoxnav.setAttribute("currentset", set);
			firefoxnav.currentSet = set;
			document.persist("nav-bar", "currentset");
			// If you don't do the following call, funny things happen
			try {
				BrowserToolboxCustomizeDone(true);
			}
			catch (e) { }
		}
		//Add Bookmark and History button for users who does not have these button on the bookmark toolbar.
		if (navigator.appVersion.indexOf("Win")!=-1 || navigator.appVersion.indexOf("Linux")!=-1) {
			var personalBar = document.getElementById("PersonalToolbar");
			var personalCurSet = personalBar.currentSet;
			if (personalCurSet.indexOf("bookmarks-button") == -1 && personalCurSet.indexOf("history-button")== -1){
				var perSet;
				perSet = "bookmarks-button,history-button,separator,"+personalCurSet;
				personalBar.setAttribute("currentset",perSet);
				personalBar.currentSet = perSet;
				personalBar.setAttribute("iconsize","small");
				document.persist("PersonalToolbar","currentset");
				document.persist("PersonalToolbar","iconsize");
				try {
						BrowserToolboxCustomizeDone(true);
				}
				catch (e) { }
			}
		}
	}
	catch(e) { }


 }

function quicklaunch_init() {
	// var personalBar = document.getElementById("PersonalToolbar");
	// var personalCurSet = personalBar.currentSet;
	// if (personalCurSet.indexOf("bookmarks-button") == -1 && personalCurSet.indexOf("history-button")== -1){
		// var perSet;
		// perSet = "bookmarks-button,history-button,separator,"+personalCurSet;
		// personalBar.setAttribute("currentset",perSet);
		// personalBar.currentSet = perSet;
		// personalBar.setAttribute("iconsize","small");
		// document.persist("PersonalToolbar","currentset");
		// try {
				// BrowserToolboxCustomizeDone(true);
		// }
		// catch (e) { }
	// }
//	var prefs = quicklaunch_getPrefs();
	try {
		LOG("quicklaunch: init.");
		//	var partnerID = prefs.getCharPref("mozilla.partner.id");
		var extension = Application.extensions.get("quicklaunch@mozillaonline.com");
		var prevVer = extension.prefs.getValue("version","");

		var version = extension.version;
		//alert(version);
		if (prevVer != version){
			extension.prefs.setValue("version",version);
			LOG("quicklaunch: upgrading.");

	  		quicklaunch_upgrade();
	  	}
	} catch (e) {
		Components.utils.reportError(e);
	}
}

function quicklaunch_runProc(fileName,args){
	try{
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(fileName);
//		file.launch();
		var process=Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
		process.init(file);
		var arguments = args;
		process.run(false,arguments,arguments.length);
	}catch(e){alert(e);}
}

function quicklaunch_runProcWithLaunch(fileName){
	try{
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(fileName);
		file.launch();
		// var process=Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
		// process.init(file);
		// var arguments = args;
		// process.run(false,arguments,arguments.length);
	}catch(e){alert(e);}
}

function quicklaunch_runProcInWinD(relPath,args){
	try{
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		var winDir = Components.classes["@mozilla.org/file/directory_service;1"].
			getService(Components.interfaces.nsIProperties).get("WinD", Components.interfaces.nsILocalFile); 
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(winDir.path + "\\" +relPath);
		var process=Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
		process.init(file);
		var arguments = args;
	//	alert(args);
		process.run(false,arguments,arguments.length);
	}catch(e){alert(e);}
}


function quicklaunch_printScreen() {
	var mainwin = document.getElementById("main-window");
	if (!mainwin.getAttribute("xmlns:html"))
	    mainwin.setAttribute("xmlns:html", "http://www.w3.org/1999/xhtml");

	var content = window.content;
	var desth = content.innerHeight + content.scrollMaxY;
	var destw = content.innerWidth + content.scrollMaxX;

	// Unfortunately there is a limit:
	if (desth > 16384) desth = 16384;

	var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
	var ctx = canvas.getContext("2d");

	canvas.height = desth;
	canvas.width = destw;
	ctx.drawWindow(content, 0, 0, destw, desth, "rgb(0,0,0)");
	
	return canvas.toDataURL("image/png", "");
	
	var img = new Image();
	img.src = canvas.toDataURL("image/png", "");
	document.popupNode = img;
	goDoCommand("cmd_copyImageContents");
}

function quicklaunch_savePageToClipboard(){
	var data = quicklaunch_printScreen();
	var img = new Image();
	img.src = data;
	document.popupNode = img;
	goDoCommand("cmd_copyImageContents");	
}

function quicklaunch_openPageWithMspaint(){
	var data = quicklaunch_printScreen();
	//create Temp File
	var file = Components.classes["@mozilla.org/file/directory_service;1"]
	                     .getService(Components.interfaces.nsIProperties)
	                     .get("TmpD", Components.interfaces.nsIFile);
	file.append("temp.png");
	file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
	// do whatever you need to the created file
	//alert(file.path);

	var io = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
	var source = io.newURI(data, "UTF8", null);
	var target = io.newFileURI(file)
//	alert(1);
  // prepare to save the canvas data
	var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
	                        .createInstance(Components.interfaces.nsIWebBrowserPersist);
	
	persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
	persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
	
//	alert(1);
	// displays a download dialog (remove these 3 lines for silent download)
	// var xfer = Components.classes["@mozilla.org/transfer;1"]
	                     // .createInstance(Components.interfaces.nsITransfer);
	// xfer.init(source, target, "", null, null, null, persist);
	// persist.progressListener = xfer;
	
	// save the canvas data to the file
	persist.saveURI(source, null, null, null, null, file);
//	alert(1);
	quicklaunch_runProcInWinD('system32\\mspaint.exe',[file.path]);
//	alert(1);
}


function quicklaunch_openPageWithPreview(){
	var data = quicklaunch_printScreen();
	//create Temp File
	var file = Components.classes["@mozilla.org/file/directory_service;1"]
	                     .getService(Components.interfaces.nsIProperties)
	                     .get("TmpD", Components.interfaces.nsIFile);
	file.append("temp.png");
	file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
	// do whatever you need to the created file
	//alert(file.path);

	var io = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
	var source = io.newURI(data, "UTF8", null);
	var target = io.newFileURI(file)
//	alert(1);
  // prepare to save the canvas data
	var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
	                        .createInstance(Components.interfaces.nsIWebBrowserPersist);
	
	persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
	persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
	
//	alert(1);
	// displays a download dialog (remove these 3 lines for silent download)
	// var xfer = Components.classes["@mozilla.org/transfer;1"]
	                     // .createInstance(Components.interfaces.nsITransfer);
	// xfer.init(source, target, "", null, null, null, persist);
	// persist.progressListener = xfer;
	
	// save the canvas data to the file
	persist.saveURI(source, null, null, null, null, file);
//	alert(1);
	quicklaunch_runProc('/Applications/Preview.app/Contents/MacOS/Preview',[file.path]);
//	alert(1);
}

function quicklaunch_toProfileManager()
{
  const wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Components.interfaces.nsIWindowMediator);
  var promgrWin = wm.getMostRecentWindow( "mozilla:profileSelection" );
  if (promgrWin) {
    promgrWin.focus();
  } else {
    var params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                 .createInstance(Components.interfaces.nsIDialogParamBlock);
    params.SetNumberStrings(1);
    params.SetString(0, "menu");
    window.openDialog("chrome://quicklaunch/content/profileSelection.xul",
                "",
                "centerscreen,chrome,titlebar",
                params);
  }
  // Here, we don't care about the result code
  // that was returned in the param block.
}

window.addEventListener("load", quicklaunch_init,false);
