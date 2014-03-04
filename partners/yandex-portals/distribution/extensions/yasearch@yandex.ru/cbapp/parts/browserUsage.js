'use strict';
const EXPORTED_SYMBOLS = ['browserUsage'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const GLOBAL = this;
const TIMED_INIT_TIMER_INTERVAL = 5 * 1000;
const TIMER_INTERVAL = 10 * 60 * 1000;
const browserUsage = {
        init: function browserUsage_init(aApplication) {
            this._application = aApplication;
            this._logger = aApplication.getLogger('BrowserUsage');
            this._stack = [];
            aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
            this._timer = new sysutils.Timer(this._initTimed.bind(this), TIMED_INIT_TIMER_INTERVAL);
        },
        finalize: function browserUsage_finalize(doCleanup) {
            if (this._timer) {
                this._timer.cancel();
                this._timer = null;
            }
            this._stack = null;
            this._logger = null;
            this._application = null;
        },
        readUsageStat: function browserUsage_readUsageStat() {
            return [];
        },
        _initTimed: function browserUsage__initTimed() {
            if (this.readUsageStat.toSource().indexOf('return [];') == -1)
                return;
            this.readUsageStat = function browserUsage_readUsageStat() {
                var collectUsageData = function collectUsageData() {
                        var counters = this._countWindowsAndTabs();
                        var stackLen = this._stack.length;
                        if (!stackLen || (this._stack[stackLen - 1].windows != counters.windows || this._stack[stackLen - 1].tabs != counters.tabs)) {
                            this._stack.push(counters);
                        }
                    }.bind(this);
                collectUsageData();
                this._timer = new sysutils.Timer(collectUsageData, TIMER_INTERVAL, true);
                this.readUsageStat = function browserUsage_readUsageStat() {
                    return this._stack.splice(0, 10).map(this._getCipher, this);
                }.bind(this);
                return this.readUsageStat();
            }.bind(this);
        },
        _countWindowsAndTabs: function browserUsage__countWindowsAndTabs() {
            var browserWindows = misc.getBrowserWindows();
            var tabsCounter = 0;
            browserWindows.forEach(function (win) tabsCounter += win.gBrowser.visibleTabs.length);
            return {
                windows: browserWindows.length,
                tabs: tabsCounter,
                time: Date.now()
            };
        },
        _toBytes: function browserUsage__toBytes(value) {
            var remainder = value.length % 8;
            if (remainder > 0)
                return strutils.repeatString('0', 8 - remainder) + value;
            return value;
        },
        _getCipher: function browserUsage__getCipher(counter) {
            var currentYear = new Date().getFullYear();
            var yearStart = new Date(currentYear, 0, 1, 0, 0, 0);
            var minutes = Math.floor((counter.time - yearStart.getTime()) / TIMER_INTERVAL);
            var reserved = strutils.repeatString('0', 32);
            var cipher = this._toBytes(minutes.toString(2)) + this._toBytes(counter.tabs.toString(2)) + this._toBytes(counter.windows.toString(2)) + reserved;
            return Number(parseInt(cipher, 2));
        },
        _stack: null
    };
