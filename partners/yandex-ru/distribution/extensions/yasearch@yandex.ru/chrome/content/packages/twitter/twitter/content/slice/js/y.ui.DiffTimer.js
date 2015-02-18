Y.UI.DiffTimer = function () {
    var running = false;
    var initialTick = null;
    function tick() {
        Y.ObserverService.getInstance().notifyObservers("tick");
    }
    function add0(x) {
        return ("0" + x).slice(-2);
    }
    var DTConverter = {
        settings: {
            allowFuture: false,
            strings: Y.l8n.datetimeEntities
        },
        inWords: function (distanceMillis) {
            var $l = this.settings.strings;
            var prefix = $l.prefixAgo;
            var suffix = $l.suffixAgo;
            var isFuture = distanceMillis < 0;
            if (this.settings.allowFuture) {
                if (distanceMillis < 0) {
                    prefix = $l.prefixFromNow;
                    suffix = $l.suffixFromNow;
                }
                distanceMillis = Math.abs(distanceMillis);
            } else {
                distanceMillis = Math.max(distanceMillis, 0);
                isFuture = false;
            }
            var seconds = distanceMillis / 1000;
            var minutes = seconds / 60;
            var hours = minutes / 60;
            var days = hours / 24;
            var years = days / 365;
            function substitute(stringOrFunction, number) {
                var string = typeof stringOrFunction === "function" ? stringOrFunction(number, distanceMillis, isFuture) : stringOrFunction;
                var value = $l.numbers && $l.numbers[number] || number;
                return string.replace(/%d/i, value);
            }
            var words = seconds < 45 && substitute($l.seconds, Math.floor(seconds)) || seconds < 90 && substitute($l.minute, 1) || minutes < 56 && substitute($l.minutes, Math.floor(minutes)) || minutes < 90 && substitute($l.hour, 1) || hours < 24 && substitute($l.hours, Math.floor(hours)) || hours < 48 && substitute($l.day, 1) || days < 30 && substitute($l.days, Math.floor(days)) || days < 60 && substitute($l.month, 1) || days < 365 && substitute($l.months, Math.floor(days / 30)) || years < 2 && substitute($l.year, 1) || substitute($l.years, Math.floor(years));
            return [
                prefix,
                words,
                suffix
            ].join(" ").replace(/^\s+|\s+$/g, "");
        },
        parse: function (iso8601) {
            var s = this.trim(iso8601);
            s = s.replace(/\.\d\d\d+/, "");
            s = s.replace(/\-/, "/").replace(/\-/, "/");
            s = s.replace(/T/, " ").replace(/Z/, " UTC");
            s = s.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2");
            return new Date(s);
        },
        datetime: function (time) {
            var iso8601 = time;
            return this.parse(iso8601);
        },
        distance: function (date) {
            return new Date().getTime() - date.getTime();
        },
        getTimeInWords: function (date) {
            return this.inWords(this.distance(date));
        }
    };
    function Constructor(timerEl) {
        var _this = this;
        this.timerEl = timerEl;
        var dateAttr = timerEl.getAttribute("twitter:status-created_at") || timerEl.getAttribute("status-created_at");
        this.date = Date.parseTwitterFormat(dateAttr);
        var branch = [];
        var node = this.timerEl;
        while (node) {
            branch.push(node);
            node = node.parentNode;
        }
        if (!running) {
            running = true;
            window.setInterval(tick, 60 * 1000);
        }
        clearTimeout(initialTick);
        initialTick = setTimeout(tick, 10);
        var observer = function (t, d) {
            var distance = DTConverter.distance(_this.date);
            var text = "";
            if (distance < 1000 * 60 * 60 * 24) {
                text = DTConverter.getTimeInWords(_this.date);
            } else {
                var m = Y.l8n.dayMonthTemplate;
                if (m) {
                    var day = _this.date.getDate();
                    var monthTemplate = m[_this.date.getMonth()];
                    text = monthTemplate.replace("%d", String(day)).toLowerCase();
                    var year = _this.date.getFullYear();
                    if (new Date().getFullYear() != year) {
                        text += " " + year;
                    }
                }
            }
            _this.timerEl.innerHTML = text;
        };
        observer();
        var destroyObserver = function (t, d) {
            if (branch.contains(d)) {
                destructor.call(_this);
            }
        };
        Y.ObserverService.getInstance().attachObserver("tick", observer);
        Y.ObserverService.getInstance().attachObserver("destroy", destroyObserver);
        function destructor() {
            Y.ObserverService.getInstance().removeObserver("destroy", destroyObserver);
            Y.ObserverService.getInstance().removeObserver("tick", observer);
            for (var i = 0, l = branch.length; i < l; ++i) {
                delete branch[i];
            }
            this.timerEl = null;
        }
    }
    ;
    Constructor.prototype = { constructor: Y.UI.DiffTimer };
    return Constructor;
}();
