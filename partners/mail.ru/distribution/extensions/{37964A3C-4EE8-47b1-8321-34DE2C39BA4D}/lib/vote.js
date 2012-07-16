function MRVote(toolbarObject, url, key, idButton) {
    this.debugZone = "MRVote";
    this.ajax = new G_NewXMLHttpRequest();
    this.method = "POST";
    this.mimeType = "";
    this.url = "";
    this.showError = false;
    this.updateTimer = null;
    this.url = url;
    this.key = key;
    this.infos = {};
    this.infos[this.key] = new MRInformerParser();
    this.mPrefs = new G_Preferences(MRSputnikPrefBase, false, false);    
    this.refetchTimeout = this.mPrefs.getPref(this.key + ".refetch", '300') * 1000;
    this.delay = 3000;
    this.tabsId = new Array();
    this.tabsIdn = new Array();
    this.bEnable = true;
    this.idButton = idButton;
    this.searchUrl = "";
    
    this.toolbarObject = toolbarObject;
    this.urlChrome = this.toolbarObject.chromeURL;
    this.win = this.toolbarObject.win;
    this.doc = this.toolbarObject.win.document;
    //this.storage = this.win.globalStorage['MailUrl'];
    this.storage = new Storage();      
};

MRVote.prototype = new MRInformerService;

MRVote.prototype.init = function() {
    this.win.addEventListener('TabSelect', BindToObject(this.sTab, this), false);
    this.win.addEventListener("hashchange", BindToObject(this.sTab, this), true);//hashchange//onhashchange
    this.win.gBrowser.addEventListener("DOMContentLoaded", BindToObject(this.loadTab, this), true);
    //    appcontent.addEventListener("load", this.toolbarObject.appContext.BindToObject(this.loadTab, this), true);
    this.win.gBrowser.addEventListener("beforeunload", BindToObject(this.beforeUnload, this), true);
    this.defaultXML();
}

MRVote.prototype.parseExp = function(loc) {
    var scheme = this.win.gBrowser.currentURI.scheme;
    var expConnect = new RegExp('http:\/\/connect.mail.ru/share(.*)', 'g');
    var connectUrl = expConnect.exec(loc);
    var schemeFlag = /https?/.test(scheme);
    if (schemeFlag && connectUrl == null) {
        return true;
    }
    else {
        return false;
    }
    
}

MRVote.prototype.encodeURL = function(url) {
    if (url.length > 2000) {
        url = url.substr(0, 2000);
    }
    var escapeStr = "";
    for (var n = 0; n < url.length; n++) {
        var c = url.charAt(n);

        if (c == '\t' || c == '\n' || c == '\r') {
            escapeStr += " ";
        }
        else {
            escapeStr += url.charAt(n);
        }

    }
    return escapeStr;
}

MRVote.prototype.sTab = function() {
    if (!this.bEnable) {
        return;
    }
    this.defaultXML();
    this.postDelayed();
}

MRVote.prototype.loadTab = function(event) {
    if (!this.bEnable) {
        return;
    }
    var location = this.win.getBrowser().contentDocument.location;
    var doc = event.originalTarget;
    var win = this.win.getBrowser().selectedBrowser.contentDocument;

    G_Debug(this, "loadTab:" + this.infos[this.key].url + " loc:" + location);
    if (doc == win && location != 'about:blank') {
        this.defaultXML();
        this.postDelayed();
    }
}

MRVote.prototype.beforeUnload = function(event) {
    var location = this.win.getBrowser().contentDocument.location;
    var doc = event.originalTarget;
    var win = this.win.getBrowser().selectedBrowser.contentDocument;
    if (doc == win && location != 'about:blank') {
        this.updateTimer.cancel();
    }
}

MRVote.prototype.defaultXML = function() {
    var curPage = this.toolbarObject.httpMetrics.getCurPage();
    if (curPage && curPage.xmlRating) {
        G_Debug(this, "defaultXML curPage:" + curPage.xmlRating.url);
        this.infos[this.key] = curPage.xmlRating;
    }
    else {
        this.infos[this.key].loadFromCrome(this.toolbarObject.informersURL + "informer." + this.key + ".xml");
        var converter = Components.classes['@mozilla.org/intl/texttosuburi;1'].createInstance(Components.interfaces.nsITextToSubURI);
        var curURL = converter.ConvertAndEscape("utf-8", this.win.getBrowser().contentDocument.location.toString());
        this.infos[this.key].url = this.infos[this.key].url.replace("$$URL$$", curURL);
        G_Debug(this, "defXML cur URL:" + this.infos[this.key].url);
    }
    this.apply();
}

MRVote.prototype.postDelayed = function() {
    G_Debug(this, "postDelayed:" + this.delay);
    var localThis = this;
    var callback = { 
        notify: function(timer) { 
            localThis.begin();
        } 
    } 
    if(!this.updateTimer)
    {
        this.updateTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer); 
    }
    this.updateTimer.cancel();
    this.updateTimer.initWithCallback(callback, this.delay, Components.interfaces.nsITimer.TYPE_ONE_SHOT);    
}

MRVote.prototype.begin = function() {
    G_Debug(this, "begin mr:" + this.toolbarObject.win.gMRRefToolbar);
    if (this.toolbarObject.win.gMRRefToolbar && this.toolbarObject != this.toolbarObject.win.gMRRefToolbar.mMRObject) {
        G_Debug(this, "begin ok:" + this.infos[this.key].url);
        return;
    }

    var loc = String(this.win.getBrowser().selectedBrowser.contentDocument.location);
    var e = this.parseExp(loc);
    if (!e) {
        return;
    }
    
    G_Debug(this, "begin page");
    var curPage = this.toolbarObject.httpMetrics.getCurPage();
    if (!curPage) {
        return;
    }
    
    if(!this.isSearchUrlRe(loc)){
        G_Debug(this, "begin apply cur page");
        if (curPage.done && curPage.xmlRating) {
            this.infos[this.key] = curPage.xmlRating;
            this.apply();
            return;
        }
    }
    
    G_Debug(this, "begin url:" + curPage.url);
    if (!curPage.url.length) {
        curPage.url = curPage.tabloc
    }
    if(!this.isSearchUrlRe(loc)){
        if (curPage.url != loc) {
            return;
        }
    }

    var ref = String(this.win.getBrowser().contentDocument.referrer);
    var timestamp = new Date().getTime();
    var U = this.encodeURL(loc);
    var T = Math.round((timestamp - this.delay) / 1000);
    var R = this.encodeURL(ref);
    var TI = this.win.gBrowser.contentTitle ? this.encodeURL(String(this.win.gBrowser.contentTitle)) : '';

    var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var uri = ios.newURI("http://mail.ru/", null, null);
    var cookieSvc = Components.classes["@mozilla.org/cookieService;1"].getService(Components.interfaces.nsICookieService);
    var cookie = cookieSvc.getCookieString(uri, null);
    var matchMRCU = cookie.match(/mrcu=([^;]*)/);
    var mrcu = "";
    if (matchMRCU) {
        mrcu = matchMRCU[1];
    }
    var referer = this.mPrefs.getPref("referer", "");
    var dateInstalled = new Date(this.mPrefs.getPref("install_date", ""));
    
    if(this.isSearchUrlRe(loc) && this.isSearchUrlNew(loc)){
//        if(!this.isSearchUrlNew(loc)){
//            return;
//        }
        G_Debug(this, "worker");
        var worker;
        if (Components.classes["@mozilla.org/threads/workerfactory;1"]) {
            var workerFactory = Components.classes["@mozilla.org/threads/workerfactory;1"]
            .createInstance(Components.interfaces.nsIWorkerFactory);  
            worker = workerFactory.newChromeWorker("chrome://mail.ru.lib/content/send.js");
        } else {
            worker = new ChromeWorker("chrome://mail.ru.lib/content/send.js");
        }
        worker.postMessage({
            'dataHtml': this.win.getBrowser().contentDocument.documentElement.innerHTML,
            'url': this.url,
            'U1': U,
            'T': T,
            'R': R,
            'U': U,
            'TI': TI,
            'UW': curPage.tabid,
            'С': curPage.result,
            'LT':curPage.timeLoadTime,
            'mrcu': mrcu,
            'usr': this.toolbarObject.toolbar_id,
            'ver': this.toolbarObject.toolbar_version,
            'ref': referer,
            'sd': dateInstalled.getTime()
        }); 
    //        worker.onmessage = function(event) {  
    //            G_Debug(this, "base64Doc = "+event.data.base64Doc);
    //            G_Debug(this, "deflateDoc = "+event.data.deflateDoc);
    //            G_Debug(this, "arrayByte = "+event.data.arrayByte);
    //            G_Debug(this, "arrayByte concat = "+event.data.arrayByte_concat);
    //            G_Debug(this, "arrayByte concat type = "+event.data.arrayByte_concat_type);
    //            G_Debug(this, "arrayByte xor = "+event.data.arrayByte_xor);
    //            G_Debug(this, "result = "+event.data.result);
    //        }
    } else {
        var params = U
        + "\nT:" + T
        + "\tR:" + R
        + "\tU:" + U
        + "\tTI:" + TI
        + "\tUW:" + curPage.tabid
        + "\tC:" + curPage.result
        + "\tLT:" + curPage.timeLoadTime;

        //    this.ajax.open('POST', 'http://s.sputnik.mail.ru/sid.818', true);
        this.ajax.open('POST', this.url, true);
        this.ajax.setRequestHeader('User-Agent', 'MailRuSputnik');
        //this.ajax.setRequestHeader('Host', 's.sputnik.mail.ru');
        this.ajax.setRequestHeader('Content-Type', 'application/octet-stream');
        this.ajax.setRequestHeader('Content-Length', params.length);
        this.ajax.setRequestHeader('Expect', '100-continue');
        this.ajax.setRequestHeader('Connection', 'close');
        this.ajax.setRequestHeader(
            "Cookie",
            "mrcu="
            + mrcu
            + "; usr="
            + this.toolbarObject.toolbar_id
            + "; usr2=ver="
            + this.toolbarObject.toolbar_version
            + "&ref="
            + referer
            + "&sd="
            + dateInstalled.getTime()
            );
        this.ajax.onreadystatechange = this.toolbarObject.appContext.BindToObject(this.end, this);
        G_Debug(this, "send");
        this.ajax.send(params);
        curPage.done = true;
    }
}

MRVote.prototype.apply = function() {
    var curPage = this.toolbarObject.httpMetrics.getCurPage();
    if (curPage) {
        curPage.xmlRating = new MRInformerParser();
        curPage.xmlRating.copy(this.infos[this.key]);
    }
    var p = this.doc.getElementById(this.idButton);
    if (p != null) {
        this.applyRefetch(this.infos[this.key].refetch);
        p.brickInfo = this.infos[this.key];
    }
}

MRVote.prototype.pressButtonVote = function(event) {
    G_Debug(this, "press lnk:" + this.infos[this.key].url);
    this.win.open(this.infos[this.key].url, "win", "menubar=no, scrollbars=yes,  width=540, height=360, toolbar=no, modal");
}

MRVote.prototype.enable = function(enable)
{
    this.bEnable = enable;
}

MRVote.prototype.docEncoding = function (url){
    if(this.isSearchUrlRe(url)){
        var doc = this.win.getBrowser().contentDocument.documentElement.innerHTML;
        var docDef = RawDeflate(doc);
        var arrayDocDef = [120, 156];
        arrayDocDef = arrayDocDef.concat(stringToBytes(docDef));
        for (var i = 0; i<arrayDocDef.length; i++){
            arrayDocDef[i] = arrayDocDef[i]^0xAB;
        }
        var docBase64 = Base64.encode(arrayDocDef);
        return docBase64;
    }else {
        return false;
    }
}

MRVote.prototype.isSearchUrlRe = function (url) {
    if(this.searchUrl['send'] == undefined || this.searchUrl['send'].length == 0){
        this.searchUrl = this.getSearchUrl();
    }
    
    for (var i = 0; i < this.searchUrl['reject'].length; i++){
        if(eval('/'+this.searchUrl['reject'][i]+'/').test(url)){
            return false;
        }
    }
    
    for (var i = 0; i < this.searchUrl['send'].length; i++) {
        if(eval('/'+this.searchUrl['send'][i]+'/').test(url)) {
            return true;
        }
    }
    return false;
}
MRVote.prototype.isSearchUrlNew = function (url) {
    var currentDate = new Date();
    var row = this.storage.getRow(url);
    if(row != ""){
        var diffTime = currentDate.getTime() - row['date_insert'];
            if(diffTime >= 24*3600*1000) {
                this.storage.rowDelete(row['id']);
            }else{
                return false;
            }
    }
    this.storage.insert(url, currentDate.getTime());
    return true;
}
//MRVote.prototype.isSearchUrlNew = function (url) {
//    var currentDate = new Date();
//    for(var key in this.storage) {
//        if(this.storage[key] == url) {
//            var diffTime = currentDate.getTime() - key;
//            if(diffTime >= 24*3600*1000) {
//                delete this.storage[key];
//            } else {
//                return false;
//            }
//        }
//    }
//    this.storage[currentDate.getTime()] = url;
//    return true;
//}

MRVote.prototype.getSearchUrl = function (){
    var getUrlTest = "http://binupdate.mail.ru/instant_telem/version2.xml";
    
    var searchUrlTime = this.toolbarObject.mPrefs.getPref('searchUrlTime','');
    var searchUrl = this.toolbarObject.mPrefs.getPref('searchUrl','');
    var currentTime = new Date().getTime();
    if(searchUrlTime == '' || currentTime-searchUrlTime > 24*3600*1000){
        var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Components.interfaces.nsIXMLHttpRequest);
        request.QueryInterface(Components.interfaces.nsIJSXMLHttpRequest);

        request.open('GET', getUrlTest, false);
        request.send(null);
        if(request.status == 200) {
            if(request.responseText != ""){
                searchUrl = request.responseText;
                this.toolbarObject.mPrefs.setPref("searchUrl", searchUrl);
            }
        } 
        currentTime = currentTime+"";
        this.toolbarObject.mPrefs.setPref("searchUrlTime", currentTime);
    }
    //var searchUrl = this.toolbarObject.mPrefs.getPref('searchUrl','');
    
    var arrayDocDecode = stringToBytes(Base64.decode(searchUrl));
    for (var i = 0; i<arrayDocDecode.length; i++){
        arrayDocDecode[i] = (arrayDocDecode[i]^(i%256))^0xBB;
    }
    var helloString = bytesToString(arrayDocDecode);
    //G_Debug(this, "String XML:" + helloString);
    const DOMParser = new Components.Constructor("@mozilla.org/xmlextras/domparser;1", "nsIDOMParser");  
    var parser = new DOMParser();  
    var endXml = helloString.indexOf("</xml>")+6;
    var doc = parser.parseFromString(helloString.slice(0, endXml), "text/xml");
    //var doc = parser.parseFromString(helloString, "text/xml");
    //var elements = doc.documentElement.getElementsByTagName('url');
    
    var result = [];
    result['send'] = [];
    result['reject'] = [];
    
    var sendUrl = [];
    sendUrl['http'] = doc.documentElement.getElementsByTagName('http')[0];
    sendUrl['ajax'] = doc.documentElement.getElementsByTagName('ajax')[0];

    for (var key in sendUrl){
        for (var i = 0; i < sendUrl[key].childNodes.length; i++) {
            if(sendUrl[key].childNodes[i].tagName == 'url'){
                result['send'].push(sendUrl[key].childNodes[i].firstChild.nodeValue.replace(/\//g,"\\/"));
            }
        }
    }
    
    var rejectUrl = [];
    rejectUrl['http'] = doc.documentElement.getElementsByTagName('http-reject')[0];
    rejectUrl['ajax'] = doc.documentElement.getElementsByTagName('ajax-reject')[0];
    for (var key in rejectUrl){   
        for (var i = 0; i < rejectUrl[key].childNodes.length; i++) {
            if(rejectUrl[key].childNodes[i].tagName == 'url'){
                result['reject'].push(rejectUrl[key].childNodes[i].firstChild.nodeValue.replace(/\//g,"\\/"));
            }
        }
    }
    return result;
    
}
//