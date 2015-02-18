Y.UI.Throbber = function (throbberEl) {
    var _this = this;
    var updater = Y.DOM.getElementsByClassName(throbberEl, "update-sprite")[0];
    var style = updater.style;
    this.running = false;
    this.timeline = new Y.anim.CycleTimeline(0.5, function (x) {
        style.top = -28 * parseInt(x * 60) + "px";
    });
    var OS = Y.ObserverService.getInstance();
    OS.attachObserver("updating", function (topic, data) {
        if (data == "true") {
            _this.start();
        }
        if (data == "false") {
            _this.stop();
        }
    });
    Y.DOM.attachEvent(throbberEl, "onclick", function (event) {
        Twitter.platform.fireEvent("update-me");
    });
};
Y.UI.Throbber.prototype = {
    constructor: Y.UI.Throbber,
    start: function () {
        if (!this.running) {
            this.running = true;
            this.timeline.start();
        }
    },
    stop: function () {
        if (this.running) {
            this.timeline.stop();
            this.running = false;
        }
    }
};
