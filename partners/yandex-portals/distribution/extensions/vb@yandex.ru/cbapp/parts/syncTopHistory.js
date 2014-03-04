'use strict';
const EXPORTED_SYMBOLS = ['syncTopHistory'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
const GLOBAL = this;
const PREFIX = 'entries.top-history-';
const syncTopHistory = {
        init: function SyncTopHistory_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger('SyncTopHistory');
        },
        finalize: function SyncTopHistory_finalize(doCleanup, callback) {
            this._logger = null;
            this._application = null;
        },
        requestData: function SyncTopHistory_requestData() {
            var topHistoryEntries = [];
            if (!this._application.sync.svc || !this.engine.enabled)
                return topHistoryEntries;
            var records = this.engine.get(null);
            var regex = new RegExp('^' + PREFIX + '(.+)$');
            for (let key in records) {
                let matches = key.match(regex);
                if (!matches) {
                    this._logger.error('Wrong key name: ' + key);
                    continue;
                }
                records[key] = JSON.parse(records[key]);
                records[key].url = this._application.sync.prepareUrlForSave(records[key].url);
                records[key].id = matches[1];
                topHistoryEntries.push(records[key]);
            }
            topHistoryEntries.sort(function (a, b) b.visits - a.visits);
            this._logger.trace('Current top history entries: ' + JSON.stringify(topHistoryEntries));
            return topHistoryEntries;
        },
        saveCurrentState: function SyncTopHistory_saveCurrentState(topHistory) {
            if (!this._application.sync.svc || !this.engine.enabled || !this._engineInitFinished)
                return;
            var records = {};
            topHistory.forEach(function (historyElem) {
                var key = historyElem.id || this._application.sync.generateId();
                records[PREFIX + key] = JSON.stringify({
                    url: this._application.sync.prepareUrlForServer(historyElem.url),
                    title: historyElem.title || '',
                    visits: historyElem.visits,
                    instance: historyElem.instance || this._application.name
                });
            }, this);
            this._logger.trace('Full snapshot: ' + JSON.stringify(records));
            this.engine.set(records);
        },
        saveLocalClidState: function SyncTopHistory_saveLocalClidState(url, localHistory) {
            var uri = netutils.newURI(url);
            if (!this._application.isYandexHost(uri.host))
                return url;
            try {
                uri.QueryInterface(Ci.nsIURL);
            } catch (ex) {
                return url;
            }
            var parsedQuery = netutils.querystring.parse(uri.query);
            if (!parsedQuery.clid)
                return url;
            delete parsedQuery.clid;
            uri.query = netutils.querystring.stringify(parsedQuery);
            return localHistory.indexOf(uri.spec) !== -1 ? uri.spec : url;
        },
        get engine() {
            if (!this._application.sync.svc)
                return null;
            return this._application.sync.svc.getEngine('TopHistory');
        },
        set initFinished(val) {
            this._engineInitFinished = val;
        },
        _application: null,
        _logger: null,
        _engineInitFinished: false
    };
