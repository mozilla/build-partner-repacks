function LOG (msg) {
	try{
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage(msg);
	} catch(e){}
}

function fontsetter_appendFile(file,data) {
	// file is nsIFile, data is a string
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
	                         .createInstance(Components.interfaces.nsIFileOutputStream);

	// use 0x02 | 0x10 to open file for appending.
	foStream.init(file, 0x02 | 0x08 | 0x10, 0666, 0); 
	// write, create, truncate
	// In a c file operation, we have no need to set file mode with or operation,
	// directly using "r" or "w" usually.
	foStream.write(data, data.length);
	foStream.close();
}

function fontsetter_readFile(file) {
	if (!file.exists()) return;
	var data = "";
	var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
	                        .createInstance(Components.interfaces.nsIFileInputStream);
	var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
	                        .createInstance(Components.interfaces.nsIScriptableInputStream);
	fstream.init(file, -1, 0, 0);
	sstream.init(fstream); 

	var str = sstream.read(4096);
	while (str.length > 0) {
	  data += str;
	  str = sstream.read(4096);
	}

	sstream.close();
	fstream.close();
	return data;
}

function fontsetter_getFile(fileName){
	try {
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	} catch (e) {
		LOG("Font Setter: Permission save to file was denied.");
		return;
	}

	// get the path to the user's home (profile) directory
	try { 
		var file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
		file.append("chrome");
		file.append(fileName);
		return file;
	} catch (e) {
		// alert("error");
		return null;
	}
}

function fontsetter_setFont(fontName) {
	//设为默认字体，所有3种
	fontsetter_setFontForWebpage(fontName);
	var prefs = Application.extensions.get("fontsetter@mozillaonline.com").prefs;
	if (!prefs.getValue("use_default_menu_font",false)){
		//设置菜单字体
		fontsetter_setFontForBrowser(fontName);
		//设置字体文件
		fontsetter_setFontForUserChrome(fontName);
	}
	//prompt for restart
/* 	var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService);
	if(promptService.confirm(window,"您已经应用了新的字体","您已经应用了新的字体，需要重启以应用全部设置。是否现在重启？")){
		var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"].getService(Components.interfaces.nsIAppStartup);
		appStartup.quit(appStartup.eAttemptQuit | appStartup.eRestart);
	}
 */	//rebuild menu
	fontsetter_rebuildMenu();
	
}


function fontsetter_writeFile(file,data) {
	// file is nsIFile, data is a string
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
	                         .createInstance(Components.interfaces.nsIFileOutputStream);

	// use 0x02 | 0x10 to open file for appending.
	foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
	// write, create, truncate
	// In a c file operation, we have no need to set file mode with or operation,
	// directly using "r" or "w" usually.
	foStream.write(data, data.length);
	foStream.close();
}

function fontsetter_setFontForWebpage(fontName) {
	//设为默认字体，所有3种，修改userChrome.css
	LOG ("fontsetter: start setting font for webpage");
	if (fontName == null || fontName == "") return;
	
	LOG ("fontsetter: setFontForWebpage: setting font for monospace");
	Application.prefs.setValue("font.name.monospace.zh-CN",fontName);
	Application.prefs.setValue("font.name.monospace.zh-HK",fontName);
	Application.prefs.setValue("font.name.monospace.zh-TW",fontName);
	Application.prefs.setValue("font.name.monospace.x-western",fontName);

	LOG ("fontsetter: setFontForWebpage: setting font for sans-serif");	
	Application.prefs.setValue("font.name.sans-serif.zh-CN",fontName);
	Application.prefs.setValue("font.name.sans-serif.zh-HK",fontName);
	Application.prefs.setValue("font.name.sans-serif.zh-TW",fontName);
	Application.prefs.setValue("font.name.sans-serif.x-western",fontName);
	
	LOG ("fontsetter: setFontForWebpage: setting font for serif");
	Application.prefs.setValue("font.name.serif.zh-CN",fontName);
	Application.prefs.setValue("font.name.serif.zh-HK",fontName);
	Application.prefs.setValue("font.name.serif.zh-TW",fontName);
	Application.prefs.setValue("font.name.serif.x-western",fontName);
	
	LOG ("fontsetter: setFontForWebpage: setting default font");
	Application.prefs.setValue("browser.display.use_document_fonts",0);
	
	Application.prefs.setValue("extensions.fontsetter@mozillaonline.com.currentfont",fontName);
	LOG ("fontsetter: end setting font for webpage");
	
}

function fontsetter_resetPref(name){
	if (name == null) return;
	try {
		LOG ("fontsetter: resetPref:" + name);
		var pref = Application.prefs.get(name);
		pref.reset();
	} catch (e){
		LOG ("fontsetter : resetPref: " + name + ": exception: may be is already default: " + e.toString());
		Components.utils.reportError(e);
	}
}

function fontsetter_unsetFontForWebpage(){
	try {
		LOG ("fontsetter: start restoring font for webpage");
		LOG ("fontsetter: unsetFontForWebpage: restoring font for monospace");
		var prefs = Application.extensions.get("fontsetter@mozillaonline.com").prefs;
		
		fontsetter_resetPref("font.name.monospace.zh-CN");
		fontsetter_resetPref("font.name.monospace.zh-HK");
		fontsetter_resetPref("font.name.monospace.zh-TW");
		fontsetter_resetPref("font.name.monospace.x-western");


		LOG ("fontsetter: unsetFontForWebpage: restoring font for sans-serif");	
		fontsetter_resetPref("font.name.sans-serif.zh-CN");
		fontsetter_resetPref("font.name.sans-serif.zh-HK");
		fontsetter_resetPref("font.name.sans-serif.zh-TW");
		fontsetter_resetPref("font.name.sans-serif.x-western");
		
		LOG ("fontsetter: unsetFontForWebpage: restoring font for serif");
		fontsetter_resetPref("font.name.serif.zh-CN");
		fontsetter_resetPref("font.name.serif.zh-HK");
		fontsetter_resetPref("font.name.serif.zh-TW");
		fontsetter_resetPref("font.name.serif.x-western");
		
		LOG ("fontsetter: unsetFontForWebpage: restoring default font");
		fontsetter_resetPref("browser.display.use_document_fonts");
	} catch (e){
		LOG ("fontsetter : unsetFontForWebpage: exception" + e.toString());
		Components.utils.reportError(e);
	}
}

function fontsetter_setFontForUserChrome(fontName){
	//方法1:如果不存在fontsetter.css则在userChrome.css中加入import语句,否则直接替换fontsetter.css //此方法不成功
	//方法2:在userChrome内加入fontsetter section,并每次修改fontsetter section
	if (fontName == null || fontName == "") return;
	var chromeFile = fontsetter_getFile("userChrome.css");
	if (!chromeFile.exists()){
		fontsetter_writeFile(chromeFile,"@namespace url(\"http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul\");\n/*fontsetter section*/\n*{\n\tfont-family: " + fontName +";\n}\n/*end of fontsetter section*/");
	}
	else {
		//其中是否有fontsetter的信息，有则replace，没有则添加
		var data = fontsetter_readFile(chromeFile);
		if (/\/\*fontsetter section\*\//.test(data)){
			data = data.replace(/\/\*fontsetter section\*\/[^\\]*\/\*end of fontsetter section\*\//,"/*fontsetter section*/\n*{\n\tfont-family: " + fontName +";\n}\n/*end of fontsetter section*/");
			fontsetter_writeFile(chromeFile,data);
		}
		else {
			//检测是否有@namespace,没有加上
			if (!/@namespace.*there\.is\.only\.xul/.test(data)){
				fontsetter_appendFile(chromeFile,"\n@namespace url(\"http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul\");\n/*fontsetter section*/\n*{\n\tfont-family: " + fontName +";\n}\n/*end of fontsetter section*/");
			} else {
				fontsetter_appendFile(chromeFile,"\n/*fontsetter section*/\n*{\n\tfont-family: " + fontName +";\n}\n/*end of fontsetter section*/");
			}
		}
	}
}

function fontsetter_unsetFontForUserChrome(){
	var chromeFile = fontsetter_getFile("userChrome.css");
	if (!chromeFile.exists()){
		return;
	} else {
		//其中是否有fontsetter的信息，有则remove
		var data = fontsetter_readFile(chromeFile);
		if (/\/\*fontsetter section\*\//.test(data)){
			data = data.replace(/\/\*fontsetter section\*\/[^\\]*\/\*end of fontsetter section\*\//,"");
			fontsetter_writeFile(chromeFile,data);
		}
	}
}


function fontsetter_getFontStyleSheet(){
	var styleSheet = null;
	for (var i=0; i < window.document.styleSheets.length; i++){
		//alert(window.document.styleSheets[i].href);
		if (window.document.styleSheets[i].href == "chrome://fontsetter/content/fontsetter-font.css"){
			styleSheet = window.document.styleSheets[i];
		}
	}
	return styleSheet;
}

function fontsetter_setFontForBrowser(fontName) {
	if (fontName == null || fontName == "") return;
	try {
	//替换当前窗口的style
		var styleSheet = fontsetter_getFontStyleSheet();
		if (styleSheet == null){
			LOG ("fontsetter : setFontForBrowser: exception: styleSheet not found");
			return;
		}
		while (styleSheet.cssRules.length != 0){
			styleSheet.deleteRule(0);
		}
		styleSheet.insertRule("* {font-family: " + fontName +";}",styleSheet.cssRules.length);
	//copyed from personas
	// FIXME: Incredibly gross hack in order to force a window redraw event
	// that ensures that the titlebar color change is applied.  Note that
	// this will unmaximize a maximized window on Windows and Linux, so we
	// only do this on Mac (which is the only place the "titlebarcolor"
	// attribute has any effect anyway at the moment).
	//	window.resizeTo(parseInt(window.outerWidth)+1, window.outerHeight);
	//	window.resizeTo(parseInt(window.outerWidth)-1, window.outerHeight);

	} catch (e) {
		LOG ("fontsetter : setFontForBrowser: exception");
		Components.utils.reportError(e);
	}
}

function fontsetter_unsetFontForBrowser() {
	//方法1:如果不存在fontsetter.css则在userChrome.css中加入import语句,否则直接替换fontsetter.css //此方法不成功
	//方法2:在userChrome内加入fontsetter section,并每次修改fontsetter section
	try {
	//替换当前窗口的style
		var styleSheet = fontsetter_getFontStyleSheet();
		if (styleSheet == null){
			LOG ("fontsetter : unsetFontForBrowser: exception: styleSheet not found");
			return;
		}
		while (styleSheet.cssRules.length != 0){
			styleSheet.deleteRule(0);
		}
	//copyed from personas
	// FIXME: Incredibly gross hack in order to force a window redraw event
	// that ensures that the titlebar color change is applied.  Note that
	// this will unmaximize a maximized window on Windows and Linux, so we
	// only do this on Mac (which is the only place the "titlebarcolor"
	// attribute has any effect anyway at the moment).
	//	window.resizeTo(parseInt(window.outerWidth)+1, window.outerHeight);
	//	window.resizeTo(parseInt(window.outerWidth)-1, window.outerHeight);

	} catch (e) {
		LOG ("fontsetter : setFontForBrowser: exception");
		Components.utils.reportError(e);
	}
}

function fontsetter_createMenuItem(fontName,index){
    var item = document.createElement("menuitem");
    item.setAttribute("class", "menuitem-iconic");
	item.setAttribute("id", "fontsetter-menuitem-"+index);
    item.setAttribute("label", fontName);
    item.setAttribute("type", "checkbox");
    item.setAttribute("checked", (fontName == Application.prefs.getValue("extensions.fontsetter@mozillaonline.com.currentfont","")));
    item.setAttribute("autocheck", "false");
    item.setAttribute("oncommand", "fontsetter_setFont(\""+ fontName+"\")");
//	item.setAttribute("style","font-family: " + fontName +" !important;");
//    item.addEventListener("DOMMenuItemActive", function(evt) { PersonaController.onPreviewPersona(evt) }, false);
//    item.addEventListener("DOMMenuItemInactive", function(evt) { PersonaController.onResetPersona(evt) }, false);
    
    return item;
}

function fontsetter_switchFontForMenu(){
	LOG("fontsetter: switchFontForMenu");
	var prefs = Application.extensions.get("fontsetter@mozillaonline.com").prefs;
	prefs.setValue("use_default_menu_font",!prefs.getValue("use_default_menu_font",false));
	if (prefs.getValue("use_default_menu_font",false)){
		fontsetter_unsetFontForBrowser();
		fontsetter_unsetFontForUserChrome();
	} else {
		var currentFont = Application.prefs.getValue("extensions.fontsetter@mozillaonline.com.currentfont","");
		if (currentFont != ""){
			fontsetter_setFontForBrowser(currentFont);
			fontsetter_setFontForUserChrome(currentFont);
		}
	}
	fontsetter_rebuildMenu();
}

function fontsetter_switchShowAllFonts(){
	LOG("fontsetter: switchFontForMenu");
	var prefs = Application.extensions.get("fontsetter@mozillaonline.com").prefs;
	prefs.setValue("show_all_fonts",!prefs.getValue("show_all_fonts",false));
	fontsetter_rebuildMenu();
}

function fontsetter_switchClearType(){
	LOG("fontsetter: start switch clear type");
	try {
	    var clearTypeTuner = Components.classes["@mozillaonline.com/cleartypetuner;1"].createInstance();
		clearTypeTuner = clearTypeTuner.QueryInterface(Components.interfaces.IClearTypeTuner);
		if (clearTypeTuner.isClearTypeOn()){
			clearTypeTuner.setClearTypeOff();
		} else {
			clearTypeTuner.setClearTypeOn();
		}
	//copyed from personas
	// FIXME: Incredibly gross hack in order to force a window redraw event
	// that ensures that the titlebar color change is applied.  Note that
	// this will unmaximize a maximized window on Windows and Linux, so we
	// only do this on Mac (which is the only place the "titlebarcolor"
	// attribute has any effect anyway at the moment).
	//	window.resizeTo(parseInt(window.outerWidth)+1, window.outerHeight);
	//	window.resizeTo(parseInt(window.outerWidth)-1, window.outerHeight);
		fontsetter_rebuildMenu();
	} catch (e) {
		LOG("fontsetter: switch clear type exception: " + e.toString());
		return;
	}
}

function fontsetter_rebuildMenu(){
	var menupopup = document.getElementById("fontsetter-selector-menu");
	if (menupopup == null){
		LOG ("fontsetter: menu is not loaded yet");
		return;
	}
	//remove all children
	while (menupopup.firstChild) {
		menupopup.removeChild(menupopup.firstChild);
	}
	
	var strbundle = document.getElementById("fontsetterStrings");
	//add two button, 1. RestoreDefault 2.SetMenuFont 3.UseClearType
	var restore = document.createElement("menuitem");
	restore.setAttribute("class", "menuitem-iconic");
    restore.setAttribute("label", strbundle.getString("fontsetter.restoreDefault"));
    restore.setAttribute("oncommand", "fontsetter_restoreDefault()");
	menupopup.appendChild(restore);
	
	var setMenu = document.createElement("menuitem");
    setMenu.setAttribute("class", "menuitem-iconic");
    setMenu.setAttribute("label", strbundle.getString("fontsetter.applyToMenu"));
    setMenu.setAttribute("type", "checkbox");
    setMenu.setAttribute("checked", !Application.extensions.get("fontsetter@mozillaonline.com").prefs.getValue("use_default_menu_font",false));
    setMenu.setAttribute("autocheck", "false");
    setMenu.setAttribute("oncommand", "fontsetter_switchFontForMenu()");
	menupopup.appendChild(setMenu);
	
	try {
		//alert("lala1");
		if (navigator.appVersion.indexOf("Win")!=-1) {
			var clearTypeTuner = Components.classes["@mozillaonline.com/cleartypetuner;1"].createInstance();
			//alert("lala2");
			clearTypeTuner = clearTypeTuner.QueryInterface(Components.interfaces.IClearTypeTuner);
			//alert("lala3");
			var useClearType = document.createElement("menuitem");
		    useClearType.setAttribute("class", "menuitem-iconic");
		    useClearType.setAttribute("label", strbundle.getString("fontsetter.useClearType"));
		    useClearType.setAttribute("type", "checkbox");
		    useClearType.setAttribute("checked", clearTypeTuner.isClearTypeOn());
		    useClearType.setAttribute("autocheck", "false");
		    useClearType.setAttribute("oncommand", "fontsetter_switchClearType()");
			menupopup.appendChild(useClearType);
		}
	} catch (e) {
		LOG("fontsetter: get clear type exception: " + e.toString());
	}
	menupopup.appendChild(document.createElement("menuseparator"));
	
	//modify style sheet to make menuItem label apply the font
	var styleSheet = fontsetter_getFontStyleSheet();
	//add Fonts for Chinese first
	var enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
						 .getService(Components.interfaces.nsIFontEnumerator);
	var mainFonts = enumerator.EnumerateFonts("zh-CN", "", { });
	//alert(mainFonts.length);
	var index = 0;
	if (mainFonts.length > 0){
		for (var i = 0; i < mainFonts.length; ++i) {
			// the following line is added for Lenovo font links... which sucks
			if (mainFonts[i].substr(mainFonts[i].length - 5) == "_boot") {continue;}
			var menuItem = fontsetter_createMenuItem(mainFonts[i],index);
			menupopup.appendChild(menuItem);
			try {
				if (styleSheet != null) 
					styleSheet.insertRule("#fontsetter-menuitem-" + index +" > label {font-family: " + mainFonts[i] +" !important;}",styleSheet.cssRules.length);
					index++;
			} catch (e){
				LOG("style for menuitem exception:" + e.toString());
			}
		}
		menupopup.appendChild(document.createElement("menuseparator"));
	}
	//显示所有字体选项
	if (mainFonts.length >0){
		var showAllFonts = document.createElement("menuitem");
	    showAllFonts.setAttribute("class", "menuitem-iconic");
	    showAllFonts.setAttribute("label", strbundle.getString("fontsetter.displayAllFonts"));
	    showAllFonts.setAttribute("type", "checkbox");
	    showAllFonts.setAttribute("checked", Application.extensions.get("fontsetter@mozillaonline.com").prefs.getValue("show_all_fonts",false));
	    showAllFonts.setAttribute("autocheck", "false");
	    showAllFonts.setAttribute("oncommand", "fontsetter_switchShowAllFonts()");
		menupopup.appendChild(showAllFonts);
	}
	//add all Fonts
	if (Application.prefs.getValue("extensions.fontsetter@mozillaonline.com.show_all_fonts",false) || mainFonts.length == 0){
		if (mainFonts.length >0){
			menupopup.appendChild(document.createElement("menuseparator"));
		}
		var localFontCount = { value: 0 }
		var localFonts = enumerator.EnumerateAllFonts(localFontCount);
		for (var i = 0; i < localFonts.length; ++i) {
			var menuItem = fontsetter_createMenuItem(localFonts[i],index);
			menupopup.appendChild(menuItem);
			try {
				if (styleSheet != null) 
					styleSheet.insertRule("#fontsetter-menuitem-" + index +" > label {font-family: " + localFonts[i] +" !important;}",styleSheet.cssRules.length);
					index++;
			} catch (e){
				LOG("style for menuitem exception:" + e.toString());
			}
		}
	}
}

function fontsetter_checkFirstRun(){
	if (!Application.extensions.get("fontsetter@mozillaonline.com").firstRun){
		return;
	}
	var prefs = Application.extensions.get("fontsetter@mozillaonline.com").prefs;
	LOG ("fontsetter: start recording font.");
	
	//recording default settings
	//prefs.setValue("useDefault",false);
	prefs.setValue("use_default_menu_font",false);
	
	// LOG ("fontsetter: firstRun: recording font for monospace");
	// prefs.setValue("font.default.monospace.zh-CN",	Application.prefs.getValue("font.name.monospace.zh-CN",""));
	// prefs.setValue("font.default.monospace.zh-HK", Application.prefs.getValue("font.name.monospace.zh-HK",""));
	// prefs.setValue("font.default.monospace.zh-TW", Application.prefs.getValue("font.name.monospace.zh-TW",""));

	// LOG ("fontsetter: firstRun: recording font for sans-serif");	
	// prefs.setValue("font.default.sans-serif.zh-CN", Application.prefs.getValue("font.name.sans-serif.zh-CN",""));
	// prefs.setValue("font.default.sans-serif.zh-HK", Application.prefs.getValue("font.name.sans-serif.zh-HK",""));
	// prefs.setValue("font.default.sans-serif.zh-TW", Application.prefs.getValue("font.name.sans-serif.zh-TW",""));
	
	// LOG ("fontsetter: firstRun: recording font for serif");
	// prefs.setValue("font.default.serif.zh-CN", Application.prefs.getValue("font.name.serif.zh-CN",""));
	// prefs.setValue("font.default.serif.zh-HK", Application.prefs.getValue("font.name.serif.zh-HK",""));
	// prefs.setValue("font.default.serif.zh-TW", Application.prefs.getValue("font.name.serif.zh-TW",""));
	
	// LOG ("fontsetter: firstRun: setting default font");
	// prefs.setValue("use_document_fonts",Application.prefs.getValue("browser.display.use_document_fonts",1));
	// LOG ("fontsetter: end of recording font.");
	
	//set default font to Microsoft YaHei if possible
	var enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
						 .getService(Components.interfaces.nsIFontEnumerator);
	var localFontCount = { value: 0 }
	var localFonts = enumerator.EnumerateAllFonts(localFontCount);
	if (navigator.appVersion.indexOf("Win")!=-1) {
		try {

	//copyed from personas
	// FIXME: Incredibly gross hack in order to force a window redraw event
	// that ensures that the titlebar color change is applied.  Note that
	// this will unmaximize a maximized window on Windows and Linux, so we
	// only do this on Mac (which is the only place the "titlebarcolor"
	// attribute has any effect anyway at the moment).
	//		window.resizeTo(parseInt(window.outerWidth)+1, window.outerHeight);
	//		window.resizeTo(parseInt(window.outerWidth)-1, window.outerHeight);

	//			The line below is removed, because I can't remember why it's here
	//			if (clearTypeTuner.isClearTypeOn()){
				for (var i = 0; i < localFonts.length; ++i) {
					if (localFonts[i] == "微软雅黑"){
						fontsetter_setFont("微软雅黑");
						var clearTypeTuner = Components.classes["@mozillaonline.com/cleartypetuner;1"].createInstance();
						clearTypeTuner = clearTypeTuner.QueryInterface(Components.interfaces.IClearTypeTuner);
						clearTypeTuner.setClearTypeOn();
					}
				}
//			}
		} catch (e) {
			LOG("fontsetter: check first run: set clear type exception: " + e.toString());
			return;
		}

	}
}


function fontsetter_restoreDefault(){
	Application.prefs.setValue("extensions.fontsetter@mozillaonline.com.currentfont","");
	fontsetter_unsetFontForWebpage();
	fontsetter_unsetFontForBrowser();
	fontsetter_unsetFontForUserChrome();
	fontsetter_rebuildMenu();
	LOG ("fontsetter: end restoring font for webpage");
}

function fontsetter_popupMenu(){
	var popup = document.getElementById("fontsetter-selector-menu");
	var panel = document.getElementById("fontsetter-statusbar");
	popup.openPopup(panel, "after_start", 0, -3);
}

window.addEventListener("load",function (e){
		window.setTimeout(function(){
				fontsetter_checkFirstRun();
				// if (!Application.prefs.getValue("extensions.fontsetter@mozillaonline.com.use_default_menu_font",false) && Application.prefs.getValue("extensions.fontsetter@mozillaonline.com.currentfont","") != "" ){
					// fontsetter_setFontForBrowser(Application.prefs.getValue("font.name.sans-serif.zh-CN","微软雅黑"));
				// }
				fontsetter_rebuildMenu();
	},0)},false);


/* var enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
						 .getService(Components.interfaces.nsIFontEnumerator);
var localFontCount = { value: 0 }
var localFonts = enumerator.EnumerateAllFonts(localFontCount);
for (var i = 0; i < localFonts.length; ++i) {
	if (localFonts[i] == "微软雅黑"){
		//设为默认字体，所有3种，修改userChrome.css
		fontsetter_setFont("微软雅黑");
	}
}
 */

