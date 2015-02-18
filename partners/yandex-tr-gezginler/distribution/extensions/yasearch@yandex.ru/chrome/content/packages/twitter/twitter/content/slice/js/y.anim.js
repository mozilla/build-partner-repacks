Y.anim = {};
Y.anim.Timeline = function (duration, callback) {
    var FPS = 60;
    this._step = 1 / (duration * 1000);
    this._callback = function () {
        callback.apply({}, arguments);
    };
    this._endCallback = null;
    this._timer = null;
    this._delay = 1000 / FPS;
    this.next = function (me) {
        var next = function () {
            me._frame = (new Date() - me._startTimestamp) * me._step;
            if (me._frame >= 1) {
                me.stop();
            } else {
                me._callback(me._frame);
                window.setTimeout(next, me._delay);
            }
        };
        return next;
    }(this);
    this._init();
};
Y.anim.Timeline.prototype._init = function (endCallback) {
    this._startTimestamp = +new Date();
    this._frame = 0;
    this._endCallback = endCallback || function () {
    };
};
Y.anim.Timeline.prototype.start = function (endCallback) {
    this._init(endCallback);
    this.next();
};
Y.anim.Timeline.prototype.stop = function () {
    window.clearTimeout(this._timer);
    this._callback(1);
    this._endCallback.call({});
};
Y.anim.CycleTimeline = function (duration, callback) {
    var FPS = 60;
    this._step = 1 / (duration * 1000);
    this._callback = function () {
        callback.apply({}, arguments);
    };
    this._timer = null;
    this._delay = 1000 / FPS;
    this._stopFlag = false;
    this.next = function (me) {
        var next = function () {
            var step = me._step;
            me._frame = (+new Date() - me._startTimestamp) * step;
            if (me._frame >= 1) {
                if (me._stopFlag) {
                    me._stop();
                    return;
                } else {
                    me._init();
                }
            }
            me._callback(me._frame);
            window.setTimeout(next, me._delay);
        };
        return next;
    }(this);
    this._init();
};
Y.anim.CycleTimeline.prototype._init = function () {
    this._startTimestamp = +new Date();
    this._frame = 0;
};
Y.anim.CycleTimeline.prototype.start = function () {
    if (!this._stopFlag) {
        this._start();
    } else {
        if (this._running) {
            this._stopFlag = false;
        } else {
            this._start();
        }
    }
};
Y.anim.CycleTimeline.prototype._start = function () {
    this._running = true;
    this._init();
    this.next();
};
Y.anim.CycleTimeline.prototype._stop = function () {
    this._running = false;
    this._stopFlag = false;
    this._callback(0);
};
Y.anim.CycleTimeline.prototype.stop = function () {
    this._stopFlag = true;
};
