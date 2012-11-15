function MRCookieListener(toolbarObject) {
    this.debugZone = "MRCookieListener";
    this.eventType = "cookie-changed";
    this.toolbarObject = toolbarObject;
};
MRCookieListener.prototype = new gMRRefService.MRNotificationListener;

MRCookieListener.prototype.observe = function(aSubject, aTopic, aData) {
    try {
        if (!aSubject) {
            return;
        }
        var cookie = aSubject.QueryInterface(Components.interfaces.nsICookie);
        if (cookie.name == "Mpop" || cookie.host == ".mail.ru") {
            this.toolbarObject.ajaxCurrency.update();
            this.toolbarObject.ajaxWeather.update();
            this.toolbarObject.ajaxMapsTraffic.update();
            this.toolbarObject.ajaxMailbox.update();
            this.toolbarObject.ajaxMy.update();
        }
    } catch (err) { G_Debug(this, "exception: " + err + ", stack: " + err.stack + "\n"); }
};
