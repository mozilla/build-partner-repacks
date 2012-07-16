function MRAttention(toolbarObject, url) {
    this.debugZone = "MRAttention";
    this.ajax = new G_NewXMLHttpRequest();
    this.method = "GET";
    this.mimeType = "";
    this.url = "http://mrb.mail.ru/sputnik_settings/tooltips.xml";
    this.showError = false;
    this.updateTimer = null;
    this.key = "attention";
    this.mPrefs = new G_Preferences(MRSputnikPrefBase, false, false);    
    this.refetchTimeout = this.mPrefs.getPref(this.key + ".refetch", '86400') * 1000;
    this.delay = 30000;
    this.bEnable = true;
    this.infos = [];
    this.timeParams = this.initParams();
    
    this.toolbarObject = toolbarObject;
    this.urlChrome = this.toolbarObject.chromeURL;
    this.win = this.toolbarObject.win;
    this.doc = this.toolbarObject.win.document;
    
};

MRAttention.prototype = new MRInformerService;

MRAttention.prototype.init = function() {
    this.win.gBrowser.addEventListener("DOMContentLoaded", BindToObject(this.loadTab, this), true);
    this.defaultXML();
}

MRAttention.prototype.loadTab = function(event) {
    if (!this.bEnable) {
        return;
    }
    var location = this.win.getBrowser().contentDocument.location;
    var doc = event.originalTarget;
    var win = this.win.getBrowser().selectedBrowser.contentDocument;
    G_Debug(this, "loadTab:" + this.info.url + " loc:" + location);
    if (doc == win && location != 'about:blank') {
        this.defaultXML();
        this.postDelayed();
    }
}

MRAttention.prototype.defaultXML = function() {
    var curPage = this.toolbarObject.httpMetrics.getCurPage();
    if (curPage && curPage.xmlRating) {
        G_Debug(this, "defaultXML curPage:" + curPage.xmlRating.url);
        this.info = curPage.xmlRating;
    }
    else {
        this.info.loadFromCrome(this.toolbarObject.informersURL + "informer." + this.key + ".xml");
        var converter = Components.classes['@mozilla.org/intl/texttosuburi;1'].createInstance(Components.interfaces.nsITextToSubURI);
        var curURL = converter.ConvertAndEscape("utf-8", this.win.getBrowser().contentDocument.location.toString());
        this.info.url = this.info.url.replace("$$URL$$", curURL);
        G_Debug(this, "defXML cur URL:" + this.info.url);
    }
    this.apply();
}

MRAttention.prototype.apply = function() {

}

MRAttention.prototype.parse = function(responceXML) {
    if (responceXML == null) {
        if (this.showError) {
            this.error();
            this.apply(true);
        }
        return;
    }
    var root = responceXML.childNodes.item(0);
    if (root.nodeName != 'spudata') {
        return;
    }
    this.readParams(root);
    for (var i = 0; i < root.childNodes.length; i++) {
        var brick = root.childNodes.item(i);
        var info = new MRInformerParser();
        if (info.parse(brick)) {
            //            info.saveBrick(info.id, brick);
            this.infos[info.id.slice(9)] = info;
        };
    }
    this.apply(true);
}

MRAttention.prototype.readParams = function(xml) {
    return this.initParams(
        xml.attributes.getNamedItem('refetch'),
        xml.attributes.getNamedItem('min_delay'),
        xml.attributes.getNamedItem('show_time')    
    );
}

MRAttention.prototype.initParams = function(refetch, min_delay, show_time) {
    if (refetch == null) {
        refetch = 86400;
    }
    if (min_delay == null) {
        min_delay = 30;
    }
    if (show_time == null) {
        show_time = 15;
    }
    return { refetch: parseInt(refetch), delay: parseInt(min_delay), show: parseInt(show_time) };
}
