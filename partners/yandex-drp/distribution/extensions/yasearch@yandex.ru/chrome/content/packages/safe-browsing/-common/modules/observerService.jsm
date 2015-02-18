EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    var log = function (str, method) {
        common.log("[-common.observerService]: " + str, method);
    };
    var prefix = "ybwgt_" + Math.random() + "_";
    var service = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    function addObserver(topic, handler, scope, displayTopic) {
        if (typeof handler !== "function") {
            if (!handler.observe) {
                return null;
            }
            scope = handler;
            handler = handler.observe;
        }
        var obj = {
            innerTopic: topic,
            topic: displayTopic,
            observe: function (subj, topic, data) {
                return handler.call(scope, displayTopic, data, subj);
            }
        };
        service.addObserver(obj, topic, false);
        return obj;
    }
    return {
        addObserver: function (topic, handler, scope, displayTopic) {
            return addObserver(topic, handler, scope, displayTopic || topic);
        },
        addAppObserver: function (topic, handler, scope, displayTopic) {
            return addObserver(prefix + topic, handler, scope, displayTopic || topic);
        },
        removeObserver: function (observer) {
            if (observer.observe) {
                service.removeObserver(observer, observer.innerTopic);
                observer.observe = null;
            }
        },
        notify: function (topic, data, global) {
            service.notifyObservers({}, (global ? "" : prefix) + topic, data || null);
        },
        finalize: function () {
            log("finalize");
        }
    };
};
