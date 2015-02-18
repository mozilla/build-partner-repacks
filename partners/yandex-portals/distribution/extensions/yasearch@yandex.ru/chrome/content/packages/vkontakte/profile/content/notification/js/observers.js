if (!base) {
    throw new Error("Required script <base.js> is missing");
}
base.observers = {
    _observers: {},
    _externalEventsHandler: function (subject, string) {
        var subjectObservers = this._observers[subject];
        if ("undefined" == subjectObservers) {
            return;
        }
        $.each(subjectObservers, function (index, observer) {
            var data = string;
            try {
                data = $.parseJSON(string);
            } catch (e) {
            }
            observer.call(null, subject, data);
        });
    },
    add: function (subject, observer) {
        if ("string" != typeof subject || "function" != typeof observer) {
            return;
        }
        var subjectObservers = this._observers[subject];
        if ("undefined" == typeof subjectObservers) {
            subjectObservers = this._observers[subject] = [];
        }
        subjectObservers.push(observer);
    },
    init: function () {
        var self = this;
        base.api.setExternalHandler(function (subject, data) {
            self._externalEventsHandler(subject, data);
        });
    }
};
$(function () {
    base.observers.init();
});
