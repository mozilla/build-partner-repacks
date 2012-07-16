function MRNotificationListener() {
    this.debugZone = "MRNotificationListener";
    this.eventType = "";
    this.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
};

MRNotificationListener.prototype.register = function() {
    this.observerService.addObserver(this, this.eventType, false);
};

MRNotificationListener.prototype.unregister = function() {
    this.observerService.removeObserver(this, this.eventType);
};

MRNotificationListener.prototype.observe = function(aSubject, aTopic, aData) {
};

function MRPersonasListener(toolbarObject) {
    this.debugZone = "MRPersonasListener";
    this.eventType = "lightweight-theme-changed";
    this.toolbarObject = toolbarObject;
};

MRPersonasListener.prototype = new MRNotificationListener;

MRPersonasListener.prototype.observe = function(aSubject, aTopic, aData) {
    this.toolbarObject.initBackground();
};
