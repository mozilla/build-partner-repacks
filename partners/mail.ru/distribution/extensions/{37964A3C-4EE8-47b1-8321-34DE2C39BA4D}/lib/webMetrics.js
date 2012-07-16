function MRTabPage(tab, tabid, tabloc) {
    this.tab = tab;
    this.tabid = tabid;
    this.tabloc = tabloc;
    this.result = 0;
    this.timeLoadStart = 0;
    this.timeLoadTime = 0;
    this.url = "";
    this.done = false;
    this.xmlRating = null;
    this.highlightText = null;
}


function MRWebMetricsCollector(toolbarObject, pageInfoFunctor) {
    this.debugZone = "MRWebMetricsCollector";
    this.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    this.toolbarObject = toolbarObject;
    this.win = toolbarObject.win;
    this.doc = toolbarObject.win.document;
    this.pageInfoFunctor = pageInfoFunctor
};

MRWebMetricsCollector.prototype.register = function() {
    this.observerService.addObserver(this, "http-on-modify-request", false);
    this.observerService.addObserver(this, "http-on-examine-response", false);
    this.win.gBrowser.addEventListener("DOMContentLoaded", BindToObject(this.contentLoaded, this), true);
};

MRWebMetricsCollector.prototype.unregister = function() {
    this.observerService.removeObserver(this, "http-on-modify-request");
    this.observerService.removeObserver(this, "http-on-examine-response");
};

MRWebMetricsCollector.prototype.observe = function(aSubject, aTopic, aData) {
    var httpChannel = null
    try {
        httpChannel = aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
    }
    catch (err) {
        return;
    }
//    G_Debug(this, "httpChannel.loadFlags :" + httpChannel.loadFlags);
//    G_Debug(this, "httpChannel.LOAD_INITIAL_DOCUMENT_URI :" + httpChannel.LOAD_INITIAL_DOCUMENT_URI);
//    G_Debug(this, "result :" + !(httpChannel.loadFlags & httpChannel.LOAD_INITIAL_DOCUMENT_URI));
    //
    var browser = this.getBrowserFromChannel(aSubject);
    if (!httpChannel || !(httpChannel.loadFlags & httpChannel.LOAD_INITIAL_DOCUMENT_URI)) {
        return;
    }

    if (!browser) {
        return;
    }

    if (
        aTopic == "http-on-examine-response"
        || aTopic == "http-on-examine-cached-response"
    ) { 
        this.onResponse(httpChannel, browser);
    }
    else if (aTopic == "http-on-modify-request") {
        this.onRequest(httpChannel, browser);
    }
};

MRWebMetricsCollector.prototype.getBrowserFromChannel = function(aChannel) {
    try {
        var notificationCallbacks = aChannel.notificationCallbacks;
        if(!notificationCallbacks)
        {
            notificationCallbacks = aChannel.loadGroup.notificationCallbacks;
        }
        if (!notificationCallbacks)
        {
            return null;
        }
        var domWin = notificationCallbacks.getInterface(Components.interfaces.nsIDOMWindow);
        return this.win.gBrowser.getBrowserForDocument(domWin.top.document);
    }
    catch (e) {
        return null;
    }
};

MRWebMetricsCollector.prototype.getBrowserPage = function(browser) {
    if (!this.enable()) {
        return null;
    }
    if (!browser) {
        return null;
    }
    if (!this.pageInfoFunctor(browser)) {
        this.pageInfoFunctor(
            browser,
            new MRTabPage(
                browser,
                Math.round(Math.random() * 1000000),
                String(browser.contentDocument.location)
            )
        );
    }
    return this.pageInfoFunctor(browser);
}

MRWebMetricsCollector.prototype.getCurPage = function() {
    return this.getBrowserPage(this.win.gBrowser.selectedBrowser);
}

MRWebMetricsCollector.prototype.getPageByDocument = function(doc) {
    return this.getBrowserPage(this.win.gBrowser.getBrowserForDocument(doc));
}

MRWebMetricsCollector.prototype.contentLoaded = function(event) {
    var doc = event.originalTarget;
    if (!doc) {
        return;
    }
    var url = doc.documentURI;
    var ref = doc.referrer;
    var netError = null;
    var errorCode = 0;
    var errParse = url.match(/about:neterror\?e=(.*?)&u=([^&]*)/);
    if (errParse) {
        netError = errParse[1];
        if (netError == "dnsNotFound") {
            errorCode = 2148270085;
        }
        else if (netError == "connectionFailure") {
            errorCode = 408;
        }

        url = errParse[2];
    }
    var page = this.getPageByDocument(doc);
    if (page) {
        page.timeLoadTime = (new Date).getTime() - page.timeLoadStart;
        if (errorCode) {
            page.result = errorCode;
        }
    }
    if (netError) {
        this.toolbarObject.make_form(doc, (netError != null), errorCode, url);
    }
    else if(this.needErrorForm(doc, page)) {
        this.toolbarObject.make_form(doc, false, page.result, url);
    }
}

MRWebMetricsCollector.prototype.needErrorForm = function(doc, page) {
    if (!page) {
        return false;
    }
//    var urlbox = this.doc.getElementById("urlbar");
//    alert('urlbox.value = '+urlbox.value)
//    alert('doc.documentURI = '+doc.documentURI)
//    if (doc.documentURI != urlbox.value) {
//        return false;
//    }
    if (doc.contentType != 'text/html') {
        return false;
    }
    if ((page.result < 400 || page.result > 505) && page.result != 'undefined') {
        return false;
    }
    if (doc.documentElement.innerHTML.search(/<input .*? type=\".*?\"/i) != -1) {
        return false;
    }
    return true;
}

MRWebMetricsCollector.prototype.onRequest = function(httpChannel, browser) {
    if (!this.enable()) {
        return;
    }
    G_Debug(this, "request");
    var browserPage = this.getBrowserPage(browser);
    if (!browserPage) {
        return;
    }
    browserPage.timeLoadStart = (new Date).getTime();
    browserPage.url = httpChannel.URI.spec;
    browserPage.done = false;
    browserPage.xmlRating = null;
}

MRWebMetricsCollector.prototype.onResponse = function(httpChannel, browser) {
    if (!this.enable()) {
        return;
    }
    var browserPage = this.getBrowserPage(browser);
    if (!browserPage) {
        return;
    }
    browserPage.result = httpChannel.responseStatus;
    browserPage.url = httpChannel.URI.spec;
    browserPage.timeLoadTime = (new Date).getTime() - browserPage.timeLoadStart;
}

MRWebMetricsCollector.prototype.enable = function() {
    return (!this.toolbarObject.win.gMRRefToolbar || this.toolbarObject == this.toolbarObject.win.gMRRefToolbar.mMRObject); 
}