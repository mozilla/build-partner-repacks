'use strict';
const EXPORTED_SYMBOLS = ['defender'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
Cu.import('resource://gre/modules/Services.jsm');
const DAY_SECS = 86400000;
const GLOBAL = this;
const defender = {
        init: function Defender_init(aApplication) {
            aApplication.core.Lib.sysutils.copyProperties(aApplication.core.Lib, GLOBAL);
            this._application = aApplication;
            this._logger = this._application.getLogger('Defender');
            this._defenderPrefs = new Preferences(this._application.preferencesBranch + 'defender.');
            var bmFile;
            try {
                bmFile = Services.dirsvc.getFile('LocalAppData', {});
            } catch (e) {
            }
            if (bmFile && bmFile.exists()) {
                'Yandex/Updater/BrowserManager.exe'.split('/').forEach(function (p) bmFile.append(p));
                if (bmFile.exists())
                    return;
            }
            Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer).initWithCallback({
                notify: function Defender_startupTimerNotify() {
                    this._startup();
                }.bind(this)
            }, 0, Ci.nsITimer.TYPE_ONE_SHOT);
        },
        finalize: function Defender_finalize(aDoCleanup) {
            this._shutdown();
            this._defenderPrefs = null;
            this._logger = null;
            this._application = null;
        },
        get protectedHomepage() {
            return this._getPref(this.PROTECTED_PREF_NAME, null);
        },
        set protectedHomepage(aValue) {
            this._setPref(this.PROTECTED_PREF_NAME, aValue);
        },
        get homepageDefenceEnabled() {
            var enabled = this._getPref(this.ENABLED_PREF_NAME, null);
            if (enabled === null) {
                enabled = this._application.branding.getYandexFeatureState('homepage-protection');
                this.homepageDefenceEnabled = enabled;
            }
            return enabled;
        },
        set homepageDefenceEnabled(aValue) {
            this._setPref(this.ENABLED_PREF_NAME, !!aValue);
        },
        get changesTime() {
            var res = {};
            this._changesTimeWasCalculated = 0;
            var currentTimeValues = this._changesTimeValues;
            if (currentTimeValues.start == 0 && currentTimeValues.total > 0) {
                if (!this._isYandexHomepage('current') && (!this.homepageDefenceEnabled || !this._isYandexHomepage('protected'))) {
                    let time = Math.max(0, Math.ceil(currentTimeValues.total / DAY_SECS));
                    if (time) {
                        res.yahpchange = time;
                        this._changesTimeWasCalculated += this.TIME_CALCULATED_FLAG_TOTAL;
                    }
                }
            }
            if (currentTimeValues.prtwrk == 1) {
                res.prtwrk = 1;
                this._changesTimeWasCalculated += this.TIME_CALCULATED_FLAG_PRTWRK;
            }
            this.changesTime = null;
            return res;
        },
        set changesTime(val) {
            if (!(val === null && this._changesTimeWasCalculated))
                return;
            var newTimesData = {};
            if (this._changesTimeWasCalculated & this.TIME_CALCULATED_FLAG_TOTAL)
                newTimesData.total = 0;
            if (this._changesTimeWasCalculated & this.TIME_CALCULATED_FLAG_PRTWRK)
                newTimesData.prtwrk = 0;
            this._changesTimeValues = newTimesData;
        },
        ENABLED_PREF_NAME: 'homepage.enabled',
        PROTECTED_PREF_NAME: 'homepage.protected',
        CHANGES_PREF_NAME: 'homepage.changes',
        OVERRIDE_TIME_MONITORING: 5000,
        _startup: function Defender__startup() {
            if (this.homepageDefenceEnabled && this.protectedHomepage === null && this._currentHomepage !== null) {
                this.protectedHomepage = this._currentHomepage;
            } else if (/\.start\d\.mozilla\.com/.test(this._currentHomepage) && /firefox\.yandex\./.test(this.protectedHomepage)) {
                this._setBrowserHomePage(this.protectedHomepage);
            } else if (/\.start\d\.mozilla\.com/.test(this.protectedHomepage) && /firefox\.yandex\./.test(this._currentHomepage)) {
                this.protectedHomepage = this._currentHomepage;
            }
            this._checkTimesChanged();
            Preferences.observe('browser.startup.homepage', this);
            this._defenderPrefs.observe(this.ENABLED_PREF_NAME, this);
            this._checkIsHomepageChanged();
        },
        _shutdown: function Defender__shutdown() {
            Preferences.ignore('browser.startup.homepage', this);
            this._defenderPrefs.ignore(this.ENABLED_PREF_NAME, this);
            this._cancelHomepageAlertTimer();
        },
        _getPref: function Defender__getPref(strPrefName, defaultValue) {
            return this._defenderPrefs.get(strPrefName, defaultValue);
        },
        _setPref: function Defender__setPref(strPrefName, strPrefValue) {
            this._defenderPrefs.set(strPrefName, strPrefValue);
        },
        observe: function Defender_observe(aSubject, aTopic, aData) {
            switch (aTopic) {
            case 'nsPref:changed':
                switch (aData) {
                case 'browser.startup.homepage':
                    if (this.OVERRIDE_TIME_MONITORING > Date.now() - this._lastChangedTimestamp && this._checkIsHomepageChanged(true)) {
                        this.homepageDefenceEnabled = false;
                    } else {
                        this._lastChangedTimestamp = 0;
                        this._checkTimesChanged();
                    }
                    break;
                case this._application.preferencesBranch + 'defender.' + this.ENABLED_PREF_NAME:
                    if (this.homepageDefenceEnabled)
                        this.protectedHomepage = this._currentHomepage;
                    break;
                default:
                    break;
                }
                break;
            default:
                break;
            }
        },
        get _currentHomepage() {
            return this._application.installer.getBrowserHomePage() || null;
        },
        _setBrowserHomePage: function Defender__setBrowserHomePage(aValue) {
            this._application.installer.setBrowserHomePage(aValue);
        },
        _isYandexHomepage: function Defender__isYandexHomepage(aHomePageType) {
            switch (aHomePageType) {
            case 'current':
            case 'protected':
                return this.__isYandexHomepage(this._getHostOrURLFromString(this[aHomePageType + 'Homepage']));
            }
            return null;
        },
        __isYandexHomepage: function Defender___isYandexHomepage(aHost) {
            return /(^|www\.)(yandex\.(ru|ua|kz|by|net|com(\.tr)?)|ya\.ru|yafd:tabs)$/i.test(aHost);
        },
        _isYandexHost: function Defender__isYandexHost(aHost) {
            return /(^|\.)(yandex\.(ru|ua|by|kz|net|com(\.tr)?)|(ya|narod|moikrug)\.ru)$/i.test(aHost) || this.__isYandexHomepage(aHost);
        },
        _getHostOrURLFromString: function Defender__getHostOrURLFromString(aString) {
            var url = (aString || '').toString().split('|')[0].trim();
            var domain = url;
            try {
                let uri = Services.io.newURI(url, null, null);
                if (/^(https?|file)$/.test(uri.scheme))
                    domain = uri.host;
            } catch (e) {
            }
            return domain;
        },
        _checkIsHomepageChanged: function Defender__checkIsHomepageChanged(aIsChangedAgain) {
            if (!this.homepageDefenceEnabled)
                return null;
            var res = this._getProtectedDiff();
            if (res && this._isYandexHost(res.protectedHost) && this._isYandexHost(res.currentHost)) {
                this.protectedHomepage = this._currentHomepage;
                res = false;
            }
            if (res)
                this._showHomepageAlert(aIsChangedAgain);
            return res;
        },
        _getProtectedDiff: function Defender__getProtectedDiff() {
            var protectedHp = this.protectedHomepage;
            if (protectedHp === null)
                return null;
            var currentHp = this._currentHomepage;
            var protectedHost = this._getHostOrURLFromString(protectedHp);
            var currentHost = this._getHostOrURLFromString(currentHp);
            if (protectedHost === currentHost)
                return false;
            this._logger.debug('Diff: protected = \'' + protectedHost + '\', current=\'' + currentHost + '\'');
            return {
                protectedHost: protectedHost,
                currentHost: currentHost
            };
        },
        __notifyTimer: null,
        _cancelHomepageAlertTimer: function Defender__cancelHomepageAlertTimer() {
            if (this.__notifyTimer) {
                this.__notifyTimer.cancel();
                this.__notifyTimer = null;
            }
        },
        _showHomepageAlert: function Defender__showHomepageAlert(aIsChangedAgain) {
            this._cancelHomepageAlertTimer();
            this.__notifyTimer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
            this.__notifyTimer.initWithCallback({
                notify: function Defender__showHomepageAlertNotify() {
                    this.__showHomepageAlert(aIsChangedAgain);
                }.bind(this)
            }, 2000, Ci.nsITimer.TYPE_ONE_SHOT);
        },
        __showHomepageAlert: function Defender___showHomepageAlert(aIsChangedAgain) {
            var protectedDiff = this._getProtectedDiff();
            if (!protectedDiff)
                return;
            misc.openWindow({
                url: 'chrome://' + this._application.name + '/content/dialogs/defender/hp-defence.xul',
                features: '__popup__',
                name: 'notification-update',
                application: this._application,
                isChangedAgain: !!aIsChangedAgain,
                protectedHost: protectedDiff.protectedHost,
                currentHost: protectedDiff.currentHost,
                then: this._homepageAlertCallback.bind(this)
            });
        },
        _homepageAlertCallback: function Defender__homepageAlertCallback(aAcceptCurrent, aProtectEnabled) {
            if (aAcceptCurrent === null)
                return;
            if (!aProtectEnabled)
                this.homepageDefenceEnabled = aProtectEnabled;
            if (aAcceptCurrent) {
                this.protectedHomepage = this._currentHomepage;
            } else {
                if (this._isYandexHomepage('protected'))
                    this._changesTimeValues = { prtwrk: 1 };
                this._setBrowserHomePage(this.protectedHomepage);
                let protectedURL = (this.protectedHomepage || '').toString().split('|')[0].trim();
                const URI_FIXUP = Cc['@mozilla.org/docshell/urifixup;1'].getService(Ci.nsIURIFixup);
                try {
                    protectedURL = URI_FIXUP.createFixupURI(protectedURL, URI_FIXUP.FIXUP_FLAG_NONE);
                    if (protectedURL && protectedURL.spec)
                        misc.navigateBrowser({
                            url: protectedURL.spec,
                            target: 'new tab'
                        });
                } catch (e) {
                }
                this._lastChangedTimestamp = Date.now();
            }
        },
        get _changesTimeValues() {
            var res = {
                    start: 0,
                    total: 0,
                    prtwrk: 0
                };
            function parseIntFromStr(aStr) {
                var res = aStr ? parseInt(aStr.toString().replace(/\D/g, ''), 10) : 0;
                return isNaN(res) ? 0 : res;
            }
            var pref = String(this._getPref(this.CHANGES_PREF_NAME, '')).split('|');
            if (pref.length == 3) {
                res.start = parseIntFromStr(pref[0]);
                res.total = parseIntFromStr(pref[1]);
                res.prtwrk = Math.min(1, parseIntFromStr(pref[2]));
            }
            if (res.total > 350 * DAY_SECS)
                res.total = 0;
            return res;
        },
        set _changesTimeValues(aTimeObject) {
            var currentTime = this._changesTimeValues;
            var timePrefArray = [];
            [
                'start',
                'total',
                'prtwrk'
            ].forEach(function (aType) {
                if (aType in aTimeObject)
                    currentTime[aType] = aTimeObject[aType];
                timePrefArray.push(currentTime[aType]);
            });
            this._setPref(this.CHANGES_PREF_NAME, timePrefArray.join('|'));
        },
        _changesTimeWasCalculated: 0,
        TIME_CALCULATED_FLAG_TOTAL: 1,
        TIME_CALCULATED_FLAG_PRTWRK: 2,
        _checkTimesChanged: function Defender__checkTimesChanged() {
            var currentTimeValues = this._changesTimeValues;
            if (currentTimeValues.start == 0) {
                if (this._isYandexHomepage('current')) {
                    currentTimeValues.start = Date.now();
                }
            } else {
                if (!this._isYandexHomepage('current')) {
                    if (currentTimeValues.start > 0) {
                        let currentTime = Date.now();
                        if (currentTime > currentTimeValues.start)
                            currentTimeValues.total += currentTime - currentTimeValues.start;
                    }
                    currentTimeValues.start = 0;
                }
            }
            this._changesTimeValues = currentTimeValues;
        },
        _lastChangedTimestamp: 0
    };
