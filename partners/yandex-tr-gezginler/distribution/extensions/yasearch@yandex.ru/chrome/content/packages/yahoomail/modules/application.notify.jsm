var EXPORTED_SYMBOLS = ["module"];
var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
var module = function (application) {
    application.notify = function (topic, data) {
        application.log("[Notification]\nTopic: " + topic + "\nData:\n" + JSON.stringify(data));
        observerService.notifyObservers(application, topic, data);
    };
    var topics = ["yandexbar-xbutton-widget"];
    var defaultObserver = {
        QueryInterface: function () {
            return this;
        },
        observe: function (subject, topic, data) {
            application.log("observe: " + topic + ", " + data);
            if (data == "finalize") {
                detachDefaultObserver();
            }
        }
    };
    function attachDefaultObserver() {
        topics.forEach(function (topic) {
            observerService.addObserver(defaultObserver, topic, false);
        });
    }
    function detachDefaultObserver() {
        topics.forEach(function (topic) {
            observerService.removeObserver(defaultObserver, topic);
        });
    }
    attachDefaultObserver();
};
