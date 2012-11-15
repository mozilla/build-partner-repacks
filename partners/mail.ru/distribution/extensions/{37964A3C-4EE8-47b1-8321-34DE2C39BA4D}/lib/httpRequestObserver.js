var httpRequestObserver =  
{
    observe: function(subject, topic, data) {  
        if (topic == "http-on-modify-request") {  
            var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel); 
            if (/.?mail.ru|.?odnoklassniki.ru/.test(httpChannel.originalURI.host)) {
                var prefs_ = new G_Preferences(MRSputnikPrefBase);
                var headerValue = 'generic';
                if(prefs_.getPref("referer","") == 'mrff'){
                    headerValue = 'customff';
                }
                httpChannel.setRequestHeader("X-MailRuSputnik", headerValue, false);  
            }
        }  
    }  
};
var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                .getService(Components.interfaces.nsIObserverService);
observerService.addObserver(httpRequestObserver, "http-on-modify-request", false);