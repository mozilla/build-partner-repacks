"use strict";
let EXPORTED_SYMBOLS = ["Observers"];
let Observers = {
    add: function Observers_add(topic, callback, thisObject) {
        let observer = new Observer(topic, callback, thisObject);
        this._cache.push(observer);
        Services.obs.addObserver(observer, topic, true);
        return observer;
    },
    remove: function Observers_remove(topic, callback, thisObject) {
        let [observer] = this._cache.filter(function (v) {
            return v.topic === topic && v.callback === callback && v.thisObject === thisObject;
        });
        if (observer) {
            Services.obs.removeObserver(observer, topic);
            this._cache.splice(this._cache.indexOf(observer), 1);
        }
    },
    notify: function Observers_notify(topic, subject, data) {
        subject = typeof subject == "undefined" ? null : new Subject(subject);
        data = typeof data == "undefined" ? null : data;
        Services.obs.notifyObservers(subject, topic, data);
    },
    _cache: []
};
function Observer(topic, callback, thisObject) {
    this.topic = topic;
    this.callback = callback;
    this.thisObject = thisObject;
}
Observer.prototype = {
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIObserver,
        Ci.nsISupportsWeakReference
    ]),
    observe: function Observer_observe(subject, topic, data) {
        if (subject && typeof subject == "object" && "wrappedJSObject" in subject && "observersModuleSubjectWrapper" in subject.wrappedJSObject) {
            subject = subject.wrappedJSObject.object;
        }
        if (typeof this.callback == "function") {
            if (this.thisObject) {
                this.callback.call(this.thisObject, subject, data);
            } else {
                this.callback(subject, data);
            }
        } else {
            this.callback.observe(subject, topic, data);
        }
    }
};
function Subject(object) {
    this.wrappedJSObject = {
        observersModuleSubjectWrapper: true,
        object: object
    };
}
Subject.prototype = {
    QueryInterface: XPCOMUtils.generateQI([]),
    getHelperForLanguage: function Subject_getHelperForLanguage() {
    },
    getInterfaces: function Subject_getInterfaces() {
    }
};
