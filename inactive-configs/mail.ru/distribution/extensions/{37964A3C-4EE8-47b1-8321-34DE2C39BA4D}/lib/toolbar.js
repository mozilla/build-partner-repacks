function MRToolbar(elToolbar) {
};

MRToolbar.prototype.init = function()
{
}

MRToolbar.prototype.apply_toolbar_settings = function(a)
{
};

MRToolbar.prototype.setSputnikCookie = function(name, domain)
{
    var dateCur = new Date();
    dateCur.setTime(dateCur.getTime() + 24 * 60 * 60 * 1000);
    var url = "http://" + domain; 
    var cookieString = name + "=" 
        + this.toolbar_version 
        + ";domain=" + domain + ";expires=" + dateCur.toUTCString();
    G_Debug("cookie", cookieString); 
    var cookieUri = Components.classes["@mozilla.org/network/io-service;1"] 
        .getService(Components.interfaces.nsIIOService) 
        .newURI(url, null, null); 
    Components.classes["@mozilla.org/cookieService;1"] 
        .getService(Components.interfaces.nsICookieService) 
        .setCookieString(cookieUri, null, cookieString, null);
    this.win.setTimeout(this.appContext.BindToObject(this.setSputnikCookie, this), 24 * 60 * 60 * 1000);	
};
MRToolbar.prototype.locationBarSearch = function(bSet)
{
    this.mPrefs.setBoolPref("location_search", bSet);
    var pref =Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	if(bSet)
	{
            if(this.mPrefs.getPref("referer","") == 'mrff'){
                pref.setCharPref("keyword.URL", "http://go.mail.ru/search?utf8in=1&fr=mrfftbUFix&q="); 
            } else {
                pref.setCharPref("keyword.URL", "http://go.mail.ru/search?utf8in=1&fr=fftbUFix&q="); 
            }
            pref.setBoolPref("keyword.enabled", true);
	}
	else{
		pref.setBoolPref("keyword.enabled", false); 
	}
};
MRToolbar.prototype.mail_show_music = function(evt){
	this.musicController.open();
    var count = this.mPrefs.getPref("counter.music", 0);
    this.mPrefs.setPref("counter.music", count+1)
};

MRToolbar.prototype.mouse_down = function(event){
    G_Debug(this, "mouse_down");
    if(event.originalTarget==this.chromeURL + "open_settings"){
        if(event.target.id != 'mailru_search_bar'){
            this.win.openDialog(this.chromeURL + 'content/settings.xul','','centerscreen,chrome,modal');
        }
    }
};

MRToolbar.prototype.mouse_up = function(event){
    if(event.target.id != 'mailru_search_bar'){
        this.selectionToSearch(this.win._content.getSelection().toString());
    }
};

MRToolbar.prototype.key_up = function(event){
    if(event.target.id != 'mailru_search_bar'){
        this.selectionToSearch(this.win._content.getSelection().toString());
    }
};

MRToolbar.prototype.selectionToSearch = function(selection){
    G_Debug(this, "selectionToSearch:" + selection);
    if(selection.length >64 || !selection.length)
    {
        return false;
    }
    if(selection.indexOf("\r\n")!=-1 || selection.indexOf("\n")!=-1)
    {
        return false;
    }
    var start=-1;
    for(var i=0; i<10; ++i)
    {
        start = selection.indexOf(" ", start+1);
        if(start==-1)
        {
            break;
        }
    }
    if(i>=10)
    {
        return false;
    }
    this.mSearchCtrl.mSearchBox.setText(selection);
    return true;
};

MRToolbar.prototype.getFlashPluginVersion = function() 
{ 

    var version = { 
        major: -1, 
        minor: -1, 
        installed: false,
        scriptable: false,
    };
    return version;
    //dump("navigator="+navigator+"\n");

    var plugin = this.win.navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin; 
   // dump("plugin="+plugin+"\n");
    if (!plugin) 
    { 
        //dump("no plugin\n");
        return version;
    }

    //dump("installed\n");
    version.installed = true;

    var description = plugin.description; 

    // use RegExp to obtain the relevant version strings 
    // obtain an array of size 2 with version information

    var versionArray = description.match(/[\d.]+/g); 

    if (!versionArray)
    {
        return version;
    }

    if (versionArray.length >= 1 && !isNaN(versionArray[0]))
    {
        version.major = parseFloat(versionArray[0]);
    }

    if (versionArray.length >= 2 && !isNaN(versionArray[1]))
    {
        version.minor = parseFloat(versionArray[1]);
    }

    if (version.major < 6 || this.win.navigator.product != 'Gecko')
    {
        return version;
    }

    if (version.major > 6 || version.minor >= 47)
    {
        version.scriptable = true;
    }

    return version;
};

MRToolbar.prototype.get_query = function(url){
    //var reg=/go\.mail\.ru.*\?|&q=(.*)&|$/gi
    var reg=/go\.mail\.ru.*[\?&]q=(.*)/gi;
    if(reg.test(url)){
        var query=RegExp.$1;
        var reg2=/(.*)&/gi
        if(reg2.test(query)){
            query=RegExp.$1;
        }
        return query;
    }
    reg=/gogo\.ru.*[\?&]q=(.*)/gi;
    if(reg.test(url)){
        var query=RegExp.$1;
        var reg2=/(.*)&/gi
        if(reg2.test(query)){
            query=RegExp.$1;
        }
        return query;
    }
    
    reg=/google.*\/search.*[\?&]q=(.*)/gi;
    if(reg.test(url)){
        var query=RegExp.$1;
        var reg2=/(.*)&/gi
        if(reg2.test(query)){
            query=RegExp.$1;
        }
        return query;
    }


    reg=/yandex\.ru.*[\?&]text=(.*)/gi;
    if(reg.test(url)){
        var query=RegExp.$1;
        var reg2=/(.*)&/gi
        if(reg2.test(query)){
            query=RegExp.$1;
        }
        return query;
    }

    reg=/rambler\.ru.*[\?&]query=(.*)/gi;
    if(reg.test(url)){
        var query=RegExp.$1;
        var reg2=/(.*)&/gi
        if(reg2.test(query)){
            query=RegExp.$1;
        }
        return query;
    }

    reg=/search\.qip\.ru.*[\?&]query=(.*)/gi;
    if(reg.test(url)){
        var query=RegExp.$1;
        var reg2=/(.*)&/gi
        if(reg2.test(query)){
            query=RegExp.$1;
        }
        return query;
    }

    reg=/aport\.ru.*[\?&]r=(.*)/gi;
    if(reg.test(url)){
        var query=RegExp.$1;
        var reg2=/(.*)&/gi
        if(reg2.test(query)){
            query=RegExp.$1;
        }
        return query;
    }
    return "";
};



MRToolbar.prototype.make_form = function(doc, edit, err_code, url){
    G_Debug("ERROR", "make_form:" + url);
    var need_form=this.mPrefs.getBoolPrefOrDefault('error_url_form', true);
    if(need_form==false){
        return;
    }
    //var reason=form_strings.getStringFromName("reason_unload");
    var reason;//=document.getElementById("http_form_strings").getString("reason");
    var query=this.get_query(url);
    var site=this.getSite(url);
    //dump("site="+site+"\n");
    var ref_data="ffsptE404";
    if(query!=""){
        ref_data="ffsptE404r";
    }
    var g=this.win.document.getElementById('mailru_bundle');
		
    reason=g.getString('reason_unload');
    
    var gid=this.toolbar_id;
    
    var ajaxForm = G_NewXMLHttpRequest();
//    if(edit)
//    {
//        ajaxForm.open('GET',this.chromeURL + 'locale/sputnik_form_edit.html',false);
//    }
//    else
//    {
//        ajaxForm.open('GET',this.chromeURL + 'locale/sputnik_form.html',false);
//    }
    ajaxForm.open('GET',this.chromeURL + 'locale/sputnik_form_edit.html',false);
    ajaxForm.send(null);
    var h = ajaxForm.responseText;
    
  
   
    h=h.replace(/__CURRENT_URL__/gi, url);
    h=h.replace(/__USER_GUID__/gi, gid);
    h=h.replace(/__STATE_ID__/gi, "0");
    h=h.replace(/__EVENT_ID__/gi, err_code);
    h=h.replace(/__REFERER_URL__/gi, doc.referrer);
    h=h.replace(/__SEARCH_VALUE__/gi, query);
    h=h.replace(/__REF_DATA__/gi, ref_data);
    h=h.replace(/__URL__/gi, site);
    h=h.replace(/__DESCR__/gi, site);
   
    var domain=this.getDomain(url);
    var has_domain=false;
    if(url!="http://"+domain){
        has_domain=true;
    }
    
    var suggest1=g.getString("suggest_reload");
    suggest1=suggest1.replace(/__URL__/gi, url);
    var suggest2=g.getString("suggest_mailru");
    if(err_code==403){ //forbidden
        if(has_domain){
            suggest1=g.getString('suggest_main_page');
            suggest1=suggest1.replace(/__DOM__/gi, domain);
            reason=g.getString('reason_forbidden');
        }
    }
    if(
        err_code==404
        || err_code==408
        || err_code==2148270085
    )
    {//not found
        if(has_domain){
            suggest1=g.getString('suggest_main_page');
            suggest1=suggest1.replace(/__DOM__/gi, domain);
            reason=g.getString('reason_not_found');
        }
    }
    if(err_code==500){//server error
        if(has_domain){
            suggest1=g.getString('suggest_main_page');
            suggest1=suggest1.replace(/__DOM__/gi, domain);
            reason=g.getString('reason_server_error');
        }
    }
    if(err_code==502){ //bad gateway
        reason=g.getString('reason_server_error');
    }
    if(err_code==408){ //request timeout
        reason=g.getString('reason_timeout');
    }
    if(err_code==503){//unavaliable
        reason=g.getString("reason_denied");
    
    }
    
    h=h.replace(/__REASON__/g, reason);
    h=h.replace(/__SUGGEST1__/g, g.getString('suggest_info1'));
    h=h.replace(/__SUGGEST2__/g, g.getString('suggest_info2'));
    h=h.replace(/__SUGGEST3__/g, suggest1);
    h=h.replace(/__SUGGEST4__/g, g.getString('suggest_info3'));
    //h=h.replace(/__SUGGEST2__/g, suggest2);
  
    if(edit)
    {
        doc.documentElement.innerHTML = h;
    }
    else
    {
        doc.documentElement.innerHTML += h;
        //doc.getElementById('spblock').style.position = 'static';
        doc.getElementById('spblock').style.marginTop = 0;
        doc.getElementById('spblock').style.top = 0;
    }
    error404.init(doc,this.win);
    doc.getElementById('formQuery').onkeyup = function (event){
        search_key_press(event);
    }
    doc.getElementById('submit_button').onclick = function () {
        openSearchPage(doc.getElementById('formQuery').value);
    }
};

MRToolbar.prototype.getDomain = function(url){
    G_Debug(this, "get domain:" + url);
    var expIP4 = /(http:\/\/|http%3A\/\/)(\d+\.\d+\.\d+\.\d+)/i;
    var expDomain = /(http:\/\/|http%3A\/\/)([^\/]+\.)?([^\.]+\.[^\.]+)\/.*/i;
    var aIPResult = url.match(expIP4);
    if (aIPResult) 
    {
        return aIPResult[2];
    }
    var aDomainResult = url.match(expDomain);
    if(aDomainResult)
    {
        return aDomainResult[3];
    }
    return "";
}

MRToolbar.prototype.getSite = function(url){
    var string=new String(url);
	var index=string.search("http://");
	if(index==0){
            string=string.substring(7, string.length);
    }
    else{
        var index1=string.search("http%3A//");
        if(index1==0){
            string=string.substring(9, string.length);
        }

    }
	if(string.search("/")!=-1){
		string=string.substring(0, string.indexOf("/"));
	}
    return string;
}

MRToolbar.prototype.search_key_press = function(){
    G_Debug('search', this.search_first_press);
    if(this.search_first_press==false){
        this.search_first_press=true;
    }
};
MRToolbar.prototype.uninit = function()
{
    this.elToolbar.setAttribute("currentset", "");
    this.win.document.persist('mailru_main_toolbar', "currentset");

	this.observer.removeObserver(this.apply_toolbar_observer,'MAIL-apply-settings');
    this.observer.removeObserver(this.apply_toolbar_observer,'MAIL-apply-music');
	this.win.gBrowser.removeProgressListener(this.progressListener);
	this.win.removeEventListener('resize',this.appContext.BindToObject(this.window_resize, this),false)
	this.musicController.CloseLast();
	this.checkExitMode();
    this.cookieListener.unregister();
    this.personasListener.unregister();
};
MRToolbar.prototype.firstRun = function()
{
    var installation = new MRInstallation(this);
    
    if(!installation.isInstallation())
    {
        return;
    }
    installation.install();    
};
MRToolbar.prototype.uninstall = function()
{
	this.mPrefs.setPref('version','uninstalled');
	this.mPrefs.setPref('tid','');
    var prefs = new G_Preferences("", false, false);    
	prefs.setPref('general.useragent.extra.sputnik','');
	prefs.setPref('general.useragent.extra.odnoklassniki','');
    prefs.setPref('sputnik.install.finished', '');
};
MRToolbar.prototype.upgrade = function()
{
	this.mPrefs.setPref('version','upgrade');
};
MRToolbar.prototype.checkExitMode = function()
{
	var fAutoreg = this.appContext.G_File.getProfileFile(".autoreg");
	if(fAutoreg.exists())
	{
		var fExtensions = this.appContext.G_File.getProfileFile("extensions.cache");
		var sExtensions = this.appContext.G_FileReader.readAll(fExtensions);
		var aSputnikLine = sExtensions.match(/^.*\{37964A3C-4EE8-47b1-8321-34DE2C39BA4D\}.*(\t\d*\t)(\S*).*$/m);
		var sFlag = "";
		if(aSputnikLine && aSputnikLine.length>=3)
		{
			sFlag = aSputnikLine[2];
		}
		//needs-install, needs-upgrade, needs-uninstall, needs-enable, needs-disable, needs-install
		if(sFlag == "needs-uninstall")  //user uninstall
		{
			this.uninstall();
		}
		else if( sFlag == "needs-upgrade")  //user install and web update
		{
			this.upgrade();
		}
	    var dir = this.appContext.G_File.getProfileFile("extensions");
	    dir.appendRelativePath("staged");
        G_Debug(this,"dir:" + dir.exists + " " + dir.isDirectory());
	    if(dir.exists() && dir.isDirectory())
	    {
            G_Debug(this,"dir.exists()");
	        var fileXML = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	        fileXML.initWithPath(dir.path);
	        fileXML.appendRelativePath(this.appID + ".json");
	        if(fileXML.exists())
	        {
    			this.upgrade();
	        }
	    }
	}

};
MRToolbar.prototype.setHomepage = function()
{
// 	var psvc = Cc["@mozilla.org/preferences;1"].getService(Ci.nsIPrefBranch);
// 	psvc.setCharPref("browser.startup.homepage", "http://www.mail.ru/");
};

MRToolbar.prototype.getSearchText = function() 
{
	return this.mSearchCtrl.value;
};
MRToolbar.prototype._fillSearchBox = function(doc) 
{
	var xpcomUrl = this.getUrl(doc.location.href);
	if (xpcomUrl == null || !(xpcomUrl instanceof Components.interfaces.nsIURL))
	{
		return null;
	}
	if (!xpcomUrl.path || xpcomUrl.path.length == 0)
	{
	//TODO: mark meaning of this params
            if(this.mSearchCtrl.mSearchBox.searchService_.sParam == "fr=ffspt2") {
                    this.mSearchCtrl.mSearchBox.searchService_.sParam = "fr=ffspt3";			
            }
            return null;
	}
        
	xpcomUrl.path += doc.location.hash;
	G_Debug(this, "_fillSearchBox path:" + xpcomUrl.path);
	var srchQuery = new this.appContext.MRSearchProvider(xpcomUrl);
	if (srchQuery.sQuery.length > 0) 
	{
		this.mSearchCtrl.mSearchBox.setText(srchQuery.sQuery);
		this.mSearchCtrl.mSearchBox.searchService_.sParam = "fr=ffspt2";
		return srchQuery.sQuery;
	}
	else if(this.mSearchCtrl.mSearchBox.searchService_.sParam == "fr=ffspt2")
	{
		this.mSearchCtrl.mSearchBox.searchService_.sParam = "fr=ffspt3";			
	}
	return null;
};
MRToolbar.prototype.getUrl = function(inputUrl) 
{
	if (typeof inputUrl != "string")
		return inputUrl;
	else 
	{
		var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
			outputUrl = null;
		try 
		{
			outputUrl = ios.newURI(inputUrl, null, null)
		}
		catch (exception) 
		{
		}
		return outputUrl
	}
}

MRToolbar.prototype.is_russian_letter = function(x)
{
	if((x.charCodeAt(0) >= 1040) && (x.charCodeAt(0) <= 1103))
		return true;
	  
	return false;
};
MRToolbar.prototype._getTabBrowser = function() 
{
	return this.win.gBrowser;
};
MRToolbar.prototype._getCurrentBrowser = function() 
{
	var currentBrowser = this._getTabBrowser().selectedBrowser;
	return currentBrowser
};
MRToolbar.prototype.smart_trim = function(str) {
	var newstr = '';

	for(var i = 0; i < str.length; i++)
	{
		var x = str[i];
		
		if((x.match(/[0-9a-zA-Z--\-_]/)) || (this.is_russian_letter(x)))
			break;
	}
	
	str = str.substring(i, str.length);
	
	for(var j = 1; j < str.length; j++)
	{
		var x = str[str.length-j];

		if((x.match(/[0-9a-zA-Z--\-_]/)) || (this.is_russian_letter(x)))
			break;			
	}
	
	str = str.substring(0, str.length - j + 1);
	
	return str;

	var results = str.match(/^([^0-9a-z--\-_]+)(.+)/);

	if(results == null)
		return str;

	str = results[2];

	results = str.match(/([0-9a-z--\-_]+)([^0-9a-z--\-_]+)$/);

	if(results == null)
		return str;

	return results[1];
};
MRToolbar.prototype.short_string = function(str)
{
	if(str.length > 15)
		return this.smart_trim(str.substring(0, 15)) + '...';
	
	return this.smart_trim(str);
};
MRToolbar.prototype.cntx_hide = function()
{
	var cm = this.win.gContextMenu;
	var doc = this.win.document;
	doc.getElementById("mailru-search-menu").hidden = ( !cm.isTextSelected );
	doc.getElementById("mailru-search-menu-dict").hidden = ( !cm.isTextSelected );
	
	var selectedText = doc.commandDispatcher.focusedWindow.getSelection().toString();
	doc.getElementById("mailru-search-menu").label = this.menu_search_inet + ' "' + this.short_string(selectedText) + '"';
	doc.getElementById("mailru-search-menu-dict").label = this.menu_search_dict + ' "' + this.short_string(selectedText) + '"';
};
MRToolbar.prototype.link_click = function(aEvent) 
{
	var linkStr = null;
	var host = null;

	this._composeIt = null;

	try 
	{
		host = this.win.getBrowser().currentURI.host;
	}
	catch (e) 
	{
		return this.win.contentAreaClick(aEvent, false);
	}

	try 
	{
		var tag = aEvent.target;
		while (tag.tagName && tag.tagName.toUpperCase() != "HTML"
				&& linkStr == null) {
			if (tag.tagName.toUpperCase() == "A")
				linkStr = tag.getAttribute("HREF");
			tag = tag.parentNode;
		}
	}
	catch (e) 
	{
		linkStr = null;
	}

	if (linkStr && linkStr.indexOf("mailto:") == 0) 
	{
		this._composeIt = new Object;

		/*
		 * var link = linkStr.replace("mailto:", "").replace("subject=",
		 * "").replace(/ /ig, "%20"); var split = link.split("?");
		 * this._composeIt.to = split[0];
		 * 
		 * this._composeIt.subj = ""; if (split[1] != null)
		 * this._composeIt.subj = split[1];
		 */

		this._composeIt.orig = linkStr;
		var link = linkStr.replace("mailto:", "");
		link = link.split('?');
		this._composeIt.to = link[0];

		if ( link.length > 1 )
		{
			var params = link[1].split('&');
			for (var i = 0; i < params.length; i++) 
			{
				var data = params[i].split('=');
				if (data[0].toLowerCase() == 'subject') 
				{
					this._composeIt.subject = this.escape_ex(data[1]);
				}
				else if (data[0].toLowerCase() == 'cc')
					this._composeIt.cc = data[1];
				else if (data[0].toLowerCase() == 'bcc')
					this._composeIt.bcc = data[1];
				else if (data[0].toLowerCase() == 'body')
					this._composeIt.body = data[1];
			}
		}

	}
	else 
	{
		return this.win.contentAreaClick(aEvent, false);
	}
	
	if (
		aEvent 
		&& (aEvent.button == 0 || aEvent.button == 1)
		&& (this._composeIt != null)
		&& this.mPrefs.getBoolPrefOrDefault('hook_mailto', true)
	)
	{
		var resultUrl = "http://win.sputnik.mail.ru/cgi-bin/sentmsg?To="
				+ this._composeIt.to;
		if (this._composeIt.subject)
			resultUrl += "&Subject=" + this._composeIt.subject;
		if (this._composeIt.cc)
			resultUrl += "&CC=" + this._composeIt.cc;
		if (this._composeIt.bcc)
			resultUrl += "&BCC=" + this._composeIt.bcc;
		if (this._composeIt.body)
			resultUrl += "&Body=" + this._composeIt.body;

		this.win.gBrowser.selectedTab = this.win.gBrowser.addTab(resultUrl);
		return false;
	}
	else
	{
	}

	return this.win.contentAreaClick(aEvent, false);
};

MRToolbar.prototype.getToolbarID = function()
{
	this.toolbar_id=this.mPrefs.getPref("tid","");
	if(this.toolbar_id=="")
	{
		var sID=md5((Math.random()*100000000+(new Date).getTime()).toString(10));
		this.mPrefs.setPref('tid',sID);
		this.toolbar_id = sID;
		return false;
	}
	return true;
};

MRToolbar.prototype.built_main_menu_recursive = function(xmlMenu,elMenuRoot)
{
	for(var i=0;
		i<xmlMenu.childNodes.length;
		i++)
	{
		var xmlMenuNode=xmlMenu.childNodes.item(i);
		if(xmlMenuNode.nodeType==1)
		{
			if(xmlMenuNode.nodeName=='services')
			{
				var elMenuItem=this.win.document.createElement('menu');
				elMenuItem.setAttribute(
				    'label',
				    (xmlMenuNode.hasAttribute('title'))?xmlMenuNode.getAttribute('title'):''
				);
				if(xmlMenuNode.hasAttribute('hint'))
				{
				    elMenuItem.setAttribute('tooltiptext',xmlMenuNode.getAttribute('hint'));
				}
				if(xmlMenuNode.hasAttribute('img'))
				{
					elMenuItem.setAttribute('class','menu-iconic');
					elMenuItem.setAttribute('image',xmlMenuNode.getAttribute('img'))
				}
				var e=this.win.document.createElement('menupopup');
				elMenuItem.appendChild(e);
				this.built_main_menu_recursive(xmlMenuNode,e);
				elMenuRoot.appendChild(elMenuItem)
			}
			else if(xmlMenuNode.nodeName=='service')
			{
				var elMenuItem=this.win.document.createElement('menuitem');
				elMenuItem.setAttribute('label',xmlMenuNode.textContent);
				if(xmlMenuNode.hasAttribute('hint'))
				{
				    elMenuItem.setAttribute('tooltiptext',xmlMenuNode.getAttribute('hint'));
				}
				if(xmlMenuNode.hasAttribute('img'))
				{
					elMenuItem.setAttribute('class','menuitem-iconic');
					elMenuItem.setAttribute('image',xmlMenuNode.getAttribute('img'))
				}
				if(xmlMenuNode.hasAttribute('url'))
				{
				    elMenuItem.setAttribute('oncommand',"gMRRefToolbar.mMRObject.navigate_site('"+xmlMenuNode.getAttribute('url')+"', event)");
				}
				elMenuRoot.appendChild(elMenuItem);
			}
			else if(xmlMenuNode.nodeName=='separator')
			{
				var elSeparator=this.win.document.createElement('menuseparator');
				elMenuRoot.appendChild(elSeparator)
			}

		}

	}

};
MRToolbar.prototype.fill_main_menu = function()
{
	var a=this.win.document.getElementById('mailru_main_menu_menu');
	if(a && a.childNodes.length==0)
	{
		var b= G_NewXMLHttpRequest();
		b.open('GET',this.chromeURL + 'locale/sputnik/mail.ru.services.xml',false);
		b.send(null);
		if(b.responseXML.childNodes.length>0)
		{
		    this.built_main_menu_recursive(b.responseXML.childNodes.item(0),a)
		}
	}

};

MRToolbar.prototype.navigate_service_site = function(sURL,event)
{
	sURL=sURL+(sURL.match(/\?/)?'&':'?') + this.get_url_postfix();
	var c=this.win.getBrowser();
	var d=event.shiftKey;
	var e=event.ctrlKey;
	if(e)
	{
		var f=c.addTab(sURL);
		c.selectedTab=f
	}
	else if(d)
	{
		openDialog('chrome://browser/content/browser.xul','_blank','chrome,all,dialog=no',sURL)
	}
	else c.loadURI(sURL);
	event.stopPropagation()
};
MRToolbar.prototype.navigate_site = function(sURL,event)
{
    sURL=this.append_sputnik_url(sURL);
	var browser=this.win.getBrowser();
    browser.loadURI(sURL);
	event.stopPropagation()
};

MRToolbar.prototype.hilight_btn_press = function(a)
{
//		this.mSearchCtrl.mSearchBox.translit();
//		return;

    this.highlighter.toggle();
    var count = this.mPrefs.getPref("counter.highlight", 0);
    this.mPrefs.setPref("counter.highlight", count+1);
};
MRToolbar.prototype.zoom_btn_press = function(a)
{
    var count = this.mPrefs.getPref("counter.zoom", 0);
    this.mPrefs.setPref("counter.zoom", count+1);
    
};
MRToolbar.prototype.zoomPage = function(zoom)
{
    var docViewer = this.win.gBrowser.selectedBrowser.markupDocumentViewer;
    docViewer.fullZoom = zoom;
    
};
MRToolbar.prototype.find_window_text = function(a,e)
{
	var b=false;
	//var c=document.commandDispatcher.focusedWindow;
        var c = this.win.document.commandDispatcher.focusedWindow;
	//if(!c||c==window)c=window._content;
        if(!c || c == this.win)c = this.win._content;
	//var d=getBrowser().webBrowserFind;
        var d = this.win.gBrowser.webBrowserFind;
	var f=d.QueryInterface(Components.interfaces.nsIWebBrowserFindInFrames);
	//f.rootSearchFrame=window._content;
        f.rootSearchFrame = this.win._content;
	f.currentSearchFrame=c;
	d.searchString=a;
	if(e)
	{
		d.searchFrames = true;
		d.wrapFind = true;
		d.entireWord = e.altKey;
		d.findBackwards = e.shiftKey;
		d.matchCase = e.ctrlKey;
		if(d.entireWord) d.searchString = ' ' + a + ' ';
	}
	b=d.findNext();
        //false когда нечего не найдено или конец поиска
	if(!b) {
            //TODO: Придумать новый способ оповещение о завершении поиска
		//var g=document.getElementById('mailru_bundle');
                var g = this.win.document.getElementById('mailru_bundle');
		var h=Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
		h.beep();
		//window._content.status=g.getString('overlay.toolbar.search.notfound')
                this.win._content.status = g.getString('overlay.toolbar.search.notfound')
	}

};
MRToolbar.prototype.entry_btn_press = function(a)
{
    if(this.win.document.getElementById('mailru_search_bar') == null) return;
    var b = this.win.document.getElementById('mailru_search_bar').value.replace(/'/g, "\\'");
    this.find_window_text(b,a)
    var count = this.mPrefs.getPref("counter.pagesearch", 0);
    this.mPrefs.setPref("counter.pagesearch", count+1);
};

MRToolbar.prototype.currency_navigate_site = function(a, tt)
{
    var c=tt.getAttribute('currency').toLowerCase();
	var b='http://news.mail.ru/economics/';
    if(c!=null){
        b=this.mPrefs.getPref('currency.'+c+'.url','http://news.mail.ru/economics/' );
    }
    
	this.navigate_site(b,a);
};

MRToolbar.prototype.informer_navigate_site = function(event)
{
    this.navigate_site(event.target.mInfo.url, event);
};


MRToolbar.prototype.build_services_list = function(a)
{
	var services_array=new Array();
	for(var i=a.firstChild; i!=null; i=i.nextSibling)
	{
			if(i.nodeType!=i.ELEMENT_NODE)continue;
			if(i.nodeName.toLowerCase()=='services')
			{
				if(i.hasChildNodes)this.build_services_list(i)
			}
			else if(i.nodeName.toLowerCase()=='service')
			{
			    var sURL = i.getAttribute('url');
			    if(i.getAttribute('id') == "games" && this.brand.brand == "alwr")
			    {
			        sURL = "http://games.mail.ru/shareware";
			    }
				services_array.push(
				    {
                        service_id:i.getAttribute('id'),
                        label:i.textContent,
                        url:sURL,
                        hint:i.getAttribute('hint'),
                        img:i.getAttribute('img')
				    }
				)
			}
	}
	return services_array;
};
MRToolbar.prototype.search_buttons_restructor = function(idBox, idSeparator)
{
	var tbSearchToolsBox=this.win.document.getElementById(idBox);
	if(!tbSearchToolsBox)
	{
	    return;
	}
	var sVisButtons=this.mPrefs.getPref('buttons.display','');
	var aVisButtons=sVisButtons.split(',');
	var bNeedSeparator = false;
	var elSeparator = this.win.document.getElementById(idSeparator);
	for(var i=0; i<tbSearchToolsBox.childNodes.length; ++i)
	{
	    var item = tbSearchToolsBox.childNodes[i];
	    if( item == elSeparator)
	    {
	        break;
	    }
		var bShow = false;
		for( var nDisplayIndex = 0; nDisplayIndex < aVisButtons.length; ++nDisplayIndex )
		{
			if ( aVisButtons[nDisplayIndex] == item.id)
			{
				bShow = true;
				break;
			}
		}
		item.collapsed = !bShow;
		item.hidden = !bShow;
		if(bShow)
		{
		    bNeedSeparator = true;
		}
	}
	if(elSeparator)
	{
	    elSeparator.collapsed = !bNeedSeparator;
		elSeparator.hidden = !bNeedSeparator;
	}
};
MRToolbar.prototype.services_buttons_restructor = function()
{
	var tbFastLinkBox=this.win.document.getElementById('mailru_fastlink_box');
	while( tbFastLinkBox.childNodes.length > 0 )
	{
		tbFastLinkBox.removeChild(tbFastLinkBox.firstChild);			
	}
	var bLabels=this.mPrefs.getPref('services.display.labels',true);
	var c=((bLabels) ? 'icontext_button' : 'mailru_no_label_button');
	var d=G_NewXMLHttpRequest();
	d.open('GET',this.chromeURL + 'locale/sputnik/mail.ru.fast-services.xml',false);
	d.send(null);
	if(!d.responseXML.childNodes.length)
	{
	    return; 
	}
	var services_array = this.build_services_list(d.responseXML.childNodes.item(0));
	var sVisButtons=this.mPrefs.getPref('services.display','');
	var aVisButtons=sVisButtons.split(',');
	for(var i=0; i<services_array.length; i++)
	{
	    for(var j=0; j<aVisButtons.length; j++)
	    {
		    if(services_array[i].service_id==aVisButtons[j].trim())
		    {
				var elNewButton=this.win.document.createElement('toolbarbutton');
				elNewButton.setAttribute('image',services_array[i].img);
				elNewButton.setAttribute('align','center');
				elNewButton.setAttribute('label',services_array[i].label);
				elNewButton.setAttribute('tooltiptext',services_array[i].hint);
				elNewButton.setAttribute('oncommand','gMRRefToolbar.mMRObject.navigate_service_site(\''+services_array[i].url+'\', event)');
				elNewButton.setAttribute('id','mailru_service_' + services_array[i].service_id + '_btn');
				elNewButton.setAttribute('class',c);
				tbFastLinkBox.appendChild(elNewButton);
				break;
		    }
		}
	}
};


MRToolbar.prototype.currency_buttons_restructor = function()
{
	var tbCurrencyBox=this.win.document.getElementById('mailru_currency_box');
	while( tbCurrencyBox.childNodes.length > 0 )
	{
		tbCurrencyBox.removeChild(tbCurrencyBox.firstChild);			
	}
	var bNeedSeparator = false;
    var sVisCurrencies=this.mPrefs.getPref('currency.display','');
    var aVisCurrencies=sVisCurrencies.split(',');
    var ajax=G_NewXMLHttpRequest();
    ajax.open('GET',this.chromeURL + 'locale/sputnik/mail.ru.cyrrencies.xml',false);
    ajax.send(null);
    var elCurrenciesInfo=ajax.responseXML.getElementsByTagName('currency');
    for(var i=0; i<elCurrenciesInfo.length; i++)
    {
	    var j;
	    for(j=0; j<aVisCurrencies.length; j++)
	    {
	        var currency = aVisCurrencies[j].trim();
	    	if(currency==elCurrenciesInfo[i].getAttribute('name'))
			{
				var sCurrencyID='mailru_currency_'+currency+'_btn';
			    var elNewButton=this.win.document.createElement('toolbaritem');
                elNewButton.setAttribute('class','informer_button');
                elNewButton.setAttribute('module','mail.ru');
			    elNewButton.setAttribute('align','center');
			    elNewButton.setAttribute('currency',currency);
			    elNewButton.setAttribute('sign',((elCurrenciesInfo[i].hasAttribute('sign'))?elCurrenciesInfo[i].getAttribute('sign'):currency.toUpperCase()));
			    elNewButton.setAttribute('image', '');
                elNewButton.setAttribute('label',currency.toUpperCase());
			    elNewButton.setAttribute('oncommand','gMRRefToolbar.mMRObject.currency_navigate_site(event, this)');
			    elNewButton.setAttribute('id',sCurrencyID);
                
			    elNewButton = tbCurrencyBox.appendChild(elNewButton);
			    if(!elNewButton.hidden)
			    {
    			    elNewButton.initParent(this);
			    }
			    bNeedSeparator = true;
			    break;
		    }
	    }
    }

};
MRToolbar.prototype.initBackground = function()
{
	var mainWnd = this.win.document.getElementById('main-window');
    if(mainWnd.getAttribute("lwtheme") == "true")
    {
        if(mainWnd.getAttribute("lwthemetextcolor") == "bright")
        {
    		this.elToolbar.className = "toolbar_highlighted_dark";   
        }
        else
        {
    		this.elToolbar.className = "toolbar_highlighted_bright";   
        }
    }	
    else
    {
		this.elToolbar.className = "toolbar_standart";   
    }
};
MRToolbar.prototype.settings_dialog = function()
{
	this.win.returnValue=false;
	this.win.openDialog(this.chromeURL + 'content/settings.xul','','centerscreen,chrome,modal');
	if(this.win.returnValue==true)
	{
            this.newtabhomepage.update();
	    this.apply_toolbar_settings();
	}
};
MRToolbar.prototype.append_sputnik_url = function(sURL)
{
	var sUrlWithFlags = sURL 
		+ (sURL.match(/\?/) ? '&' : '?' )
		+ this.get_url_postfix();
	return sUrlWithFlags;
};
MRToolbar.prototype.get_url_postfix = function()
{
	var sPostfix = 'ffsputnik=1';
	return sPostfix;
};
MRToolbar.prototype.window_resize = function(event)
{
    this.chevron.update();
};
MRToolbar.prototype.search_internet = function(aEvent) 
{
	var query='';
//     if(this.search_first_press==true){
        query=this.smart_trim(this.win.document.commandDispatcher.focusedWindow.getSelection().toString());
//     }
    this.win.gBrowser.selectedTab = this.win.gBrowser.addTab("http://go.mail.ru/search?utf8in=1&fr=ffcntx&ffsputnik=1&q=" + query);
};

MRToolbar.prototype.search_dict = function(aEvent) {
	this.win.gBrowser.selectedTab = this.win.gBrowser.addTab("http://multilex.mail.ru/view_dict?word=" 
	        + this.smart_trim(this.win.document.commandDispatcher.focusedWindow.getSelection().toString()));
}

MRToolbar.prototype.initChevron = function(idButton)
{
    this.chevron = this.win.document.getElementById(idButton);
    if(!this.chevron)
    {
        return;
    }
    this.chevron.init(this);
    this.chevron = this.chevron.mMRObject;
}

MRToolbar.prototype.initVersion = function()
{

	var appInfo=Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
	try
	{
		this.firefox_version=appInfo.version
	}
	catch(e)
	{
		this.firefox_version='unknown'
	}
    this.toolbar_version = MRVersion;
    this.addonListener.init();
}

MRToolbar.prototype.initContextMenu = function()
{
	this.menu_search_inet = this.win.document.getElementById("mailru-search-menu").label;
	this.menu_search_dict = this.win.document.getElementById("mailru-search-menu-dict").label;
	var localObject = this;
    var eventPopup = function handlerFunc(evt){localObject.cntx_hide(evt);}
	
	this.win.document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", eventPopup, false);
}

MRToolbar.prototype.initMusicButton = function(idButton)
{
    var elMusicButton = this.win.document.getElementById("mailru_music_btn");
    if(!elMusicButton)
    {
        return;
    }
    var bundle = this.win.document.getElementById('mailru_bundle');
    var musicBrick = new MRInformerParser();
    musicBrick.id = "music";
    musicBrick.imageURL = this.chromeURL + "skin/stop.gif";
    musicBrick.text = bundle.getString("overlay.toolbar.music.btn");
    musicBrick.tooltip = bundle.getString("overlay.toolbar.music.btn");
    musicBrick.textAfter.push({textFull: musicBrick.text, textShort: null, color: null});
    elMusicButton.brickInfo = musicBrick;
}

MRToolbar.prototype.initSearchBox = function(idBox, idPopup, idEnginePopup, openerOverlay)
{
 	this.eventRegistrar = new this.appContext.EventRegistrar(["searchbox-textchange"]);
	this.mSearchCtrl = this.win.document.getElementById(idBox);
	this.mSearchCtrl.initParent(this, idEnginePopup);
	this.mSearchPopup = this.win.document.getElementById(idPopup);
	this.mSearchPopup.initParent(this);
	this.mSearchCtrl.mSearchBox.searchService_.sPostfix = this.get_url_postfix();
	if (openerOverlay != null) 
	{
		this.mSearchCtrl.mSearchBox.setText(openerOverlay.getSearchText());
		this.mSearchCtrl.mSearchBox.searchService_.sParam = "fr=ffspt3";
	}
	this.mSearchCtrl.mSearchBox.setCue();
}

MRToolbar.prototype.onPageLoad = function(event) 
{
	var doc = event.target;
	if (this.win.gBrowser.selectedBrowser == this.win.gBrowser.getBrowserForDocument(doc)) 
	{
		this._fillSearchBox(doc);
	}
	this.musicController.detect();
	if (this.showInstallPage)
	{
	    this.openInstallPage();
	}
    this.win._content.addEventListener("hashchange", this.appContext.BindToObject(this.onHashChange, this), false);
    var elFrame = this.win._content.document.getElementById("id_odkl_toolbar_notifier");
    if(elFrame)
    {
        G_Debug(this, "listen hashchange");
        elFrame.wrappedJSObject.contentWindow.addEventListener("hashchange", this.appContext.BindToObject(this.onHashChange, this), false);
    }
}

MRToolbar.prototype.onTabSwitch = function(event) 
{
	this._fillSearchBox(this.win.gBrowser.selectedBrowser.contentDocument);
	this.highlighter.updateState();
}

MRToolbar.prototype.onPageShow = function(event) 
{
	if (!event.persisted)
		return;
	var doc = event.target;
	if (this.win.gBrowser.selectedBrowser == this.win.gBrowser.getBrowserForDocument(doc)) 
	{
		this._fillSearchBox(doc);
	}
}

MRToolbar.prototype.onPageHide = function(event) 
{
	this.highlighter.toggle(false);
	this.musicController.detect();
}

MRToolbar.prototype.onPageUnload = function(event) 
{
	this.highlighter.toggle(false);
	this.musicController.detect();
}

MRToolbar.prototype.onHashChange = function(event) 
{
	this._fillSearchBox(this.win.gBrowser.selectedBrowser.contentDocument);
}

MRToolbar.prototype.openInstallPage = function() 
{
	    this.showInstallPage = false;
        this.win.gBrowser.selectedTab = this.win.gBrowser.addTab("http://sputnik.mail.ru/firefox?newuser=1");
}

MRToolbar.prototype.initNavigationEvents = function(event) 
{
    var localObject = this;
    var eventTabSwitch = function handlerFunc(evt){localObject.onTabSwitch(evt);}
    var eventPageLoad = function handlerFunc(evt){localObject.onPageLoad(evt);}
    var eventPageUnload = function handlerFunc(evt){localObject.onPageUnload(evt);}
    var eventPageShow = function handlerFunc(evt){localObject.onPageShow(evt);}
    var eventPageHide = function handlerFunc(evt){localObject.onPageHide(evt);}
    this.win.gBrowser.tabContainer.addEventListener("TabSelect", eventTabSwitch, true);
    this.win.gBrowser.addEventListener("load", eventPageLoad, true);
    this.win.gBrowser.addEventListener("unload", eventPageUnload, true);
    this.win.gBrowser.addEventListener("pageshow", eventPageShow, true);
    this.win.gBrowser.addEventListener("pagehide", eventPageHide, true);

}

function toHexString(a)
{
	return("0" + a.toString(16)).slice( -2 )
}
function md5(a)
{
	var Converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
	Converter.charset = "UTF-8";
	var c = {};
	var d = Converter.convertToByteArray(a,c);
	var e = Components.classes["@mozilla.org/security/hash;1"].createInstance(Components.interfaces.nsICryptoHash);
	e.init(e.MD5);
	e.update(d,d.length);
	var f = e.finish(false);
	var s = [toHexString(f.charCodeAt(i))for(i in f)].join("");
	return s
}