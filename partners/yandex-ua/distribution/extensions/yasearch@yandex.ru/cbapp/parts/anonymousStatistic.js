'use strict';
const EXPORTED_SYMBOLS = ['anonymousStatistic'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const anonymousStatistic = {
        init: function AnonymousStatistic_init(application) {
            this._application = application;
            this._logger = application.getLogger('AnonymousStatistic');
            this._setAskUserTimer();
        },
        finalize: function AnonymousStatistic_finalize(doCleanup) {
            if (this._aksUserTimer) {
                this._aksUserTimer.cancel();
                this._aksUserTimer = null;
            }
        },
        setState: function AnonymousStatistic_setState(aEnable) {
            this._application.barnavig.forceRequest({ statsend: aEnable ? 1 : 0 });
            this._application.preferences.set('stat.usage.send', aEnable);
            this._application.preferences.set('distr.statChosen', true);
            if (this._application.installer.setupData.UsageStat.multipack && this._application.core.CONFIG.APP.TYPE == 'barff') {
                this._application.core.Lib.Preferences.set('extensions.vb@yandex.ru.stat.usage.send', aEnable);
            }
        },
        _askUser: function AnonymousStatistic__askUser() {
            var args = [
                    this._application,
                    this,
                    this._application.core.Lib.sysutils.platformInfo.os.name
                ];
            args.wrappedJSObject = args;
            this._application.core.Lib.misc.openWindow({
                url: 'chrome://' + this._application.name + '/content/dialogs/anonymous-statistic/dialog.xul',
                features: 'modal,centerscreen',
                parent: this._application.core.Lib.misc.getTopBrowserWindow(),
                arguments: args,
                name: this._application.name + ':AnonymousStatisticDialog'
            });
        },
        get _needAskUser() {
            if (this._application.preferences.get('distr.statChosen', false))
                return false;
            var sendStatPrefSet = this._application.preferences.get('stat.usage.send', false);
            if (sendStatPrefSet) {
                this._application.preferences.set('distr.statChosen', true);
                return false;
            }
            if (!this._application.installer.isYandexFirefoxDistribution) {
                this._application.preferences.set('distr.statChosen', true);
                return false;
            }
            return true;
        },
        _setAskUserTimer: function AnonymousStatistic__setAskUserTimer() {
            if (this._aksUserTimer)
                return;
            if (!this._needAskUser)
                return;
            var installTime = this._application.preferences.get('general.install.time') * 1000;
            var threeDaysMs = 3 * 60 * 60 * 24 * 1000;
            var oneMinuteMs = 1 * 60 * 1000;
            var timeout = installTime + threeDaysMs - Date.now();
            if (timeout < oneMinuteMs || timeout > threeDaysMs)
                timeout = oneMinuteMs;
            this._aksUserTimer = new this._application.core.Lib.sysutils.Timer(function () {
                if (this._needAskUser)
                    this._askUser();
            }.bind(this), timeout);
        },
        _aksUserTimer: null,
        get confidentialURL() {
            var domain = 'legal.yandex.ru';
            var postfix = '';
            switch (this._application.branding.productInfo.BrandID.toString()) {
            case 'ua':
                domain = 'legal.yandex.ua';
                break;
            case 'tb':
                domain = 'legal.yandex.com.tr';
                break;
            }
            switch (this._application.locale.language) {
            case 'en':
            case 'tr':
                postfix = '?lang=en';
                break;
            case 'uk':
                postfix = '?lang=uk';
                break;
            }
            return 'http://' + domain + '/confidential/' + postfix;
        }
    };
