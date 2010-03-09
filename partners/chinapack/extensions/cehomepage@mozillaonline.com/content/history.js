(function() {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

if (!window.opener) {
    window.addEventListener('unload', function(evt) {
        if (evt.originalTarget == document) {
            last.save();
        }
        return true;
    }, true);
}

if (String.prototype['trim'] == null) {
    String.prototype['trim'] = function() {
        var str = this;
        var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
        for (var i = 0; i < str.length; i++) {
            if (whitespace.indexOf(str.charAt(i)) === -1) {
                str = str.substring(i);
                break;
            }
        }
        for (i = str.length - 1; i >= 0; i--) {
            if (whitespace.indexOf(str.charAt(i)) === -1) {
                str = str.substring(0, i + 1);
                break;
            }
        }
        return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
    };
}

if (!window['JSON']) {
    var json = Cc['@mozilla.org/dom/json;1'].createInstance(Ci.nsIJSON);
    window['JSON'] = {
        parse: function(str) { return json.decode(str); },
        stringify: function(obj) { return json.encode(obj); }
    };
}

var progListener = {
    QueryInterface: function(aIID) {
        if (aIID.equals(Ci.nsIWebProgressListener) ||
            aIID.equals(Ci.nsISupportsWeakReference) ||
            aIID.equals(Ci.nsISupports))
            return this;
        throw Components.results.NS_NOINTERFACE;
    },
    onLocationChange: function(aWebProgress, aRequest, aURI) {
        log(['inject', aURI.host.toLowerCase()]);
        inject(aURI.host.toLowerCase(), aWebProgress.DOMWindow);
    },
    onStateChange: function() {},
    onProgressChange: function() {},
    onStatusChange: function() {},
    onSecurityChange: function() {}
};

window.addEventListener('load', function(evt) {
    gBrowser.addProgressListener(progListener, Ci.nsIWebProgress.NOTIFY_LOCATION);
}, false);
window.addEventListener('unload', function(evt) {
    gBrowser.removeProgressListener(progListener);
}, false);

function log() {
    Application.console.log.apply(Application.console, arguments);
}

function inject(host, win) {
    var cwin = win.wrappedJSObject;
    if (cwin['cehomepage']) {
        log(['injected']);
        return;
    }
    var hosts = prefs.get('extensions.cehomepage.allowed_domains', '').split(',');
    hosts.push('about:cehomepage');
    var length = host.length;
    while (true) {
        if (hosts.length == 0) {
            log(['cehomepage deny', host]);
            return;
        }
        var ahost = hosts.shift().trim().toLowerCase();
        if (host.lastIndexOf(ahost) == length - ahost.length) {
            break;
        }
    }
    log(['cehomepage inject', host]);
    cwin['cehomepage'] = {};
    homepage.init(cwin.cehomepage);
    frequent.init(cwin.cehomepage);
    last.init(cwin.cehomepage);
    if (cwin['do_history']) {
        cwin.do_history.call(cwin);
    }
}

var prefs = {
    branch: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch2),
    get: function(k, v) {
        return Application.prefs.getValue(k, v);
    },
    getLocale: function(k, v) {
        return this.branch.getComplexValue(k, Ci.nsIPrefLocalizedString).data || v;
    },
    set: function(k, v) {
        Application.prefs.setValue(k, v);
    },
    setLocale: function(k, v) {
        var pls = Cc['@mozilla.org/pref-localizedstring;1'].createInstance(Ci.nsIPrefLocalizedString);
        pls.data = v;
        this.branch.setComplexValue(k, Ci.nsIPrefLocalizedString, pls);
    },
    changed: function(k) {
        return this.branch.prefHasUserValue(k);
    },
    reset: function(k) {
        try {
            this.branch.clearUserPref(k);
        } catch (ex) {
            log(['clearUserPref', k, ex]);
        }
    }
};

var homepage = {
    init: function(cehp) {
        var me = this;
        cehp['startup'] = {
            homepage: function() { return me.homepage(); },
            homepage_changed: function() { return me.homepage_changed(); },
            page: function() { return me.page(); },
            page_changed: function() { return me.page_changed(); },
            cehomepage: function() { return me.cehomepage(); },
            autostart: function(flag) { return me.autostart(flag); },
            setHome: function() { me.reset(); }
        };
    },
    reset: function() {
        prefs.set('browser.startup.homepage', this.cehomepage());
        prefs.set('browser.startup.page', 1);
    },
    homepage: function() {
        var hp = prefs.getLocale('browser.startup.homepage', 'about:blank');
        return hp;
    },
    homepage_changed: function() { return prefs.changed('browser.startup.homepage') && this.homepage() != this.cehomepage(); },
    page: function() { return prefs.get('browser.startup.page', 1); },
    page_changed: function() { return prefs.changed('browser.startup.page') && this.page() == 1; },
    cehomepage: function() { return prefs.get('extensions.cehomepage.homepage', 'http://i.g-fox.cn'); },
    autostart: function(flag) {
        var ori = prefs.get('extensions.cehomepage.autostartup', true);
        if (typeof flag != 'undefined') {
            prefs.set('extensions.cehomepage.autostartup', flag);
        }
        return ori;
    }
};

var frequent = {
    history: null,
    querier: null,
    option: null,
    sql: 'SELECT (SELECT title FROM moz_places WHERE favicon_id = s.favicon_id AND visit_count > 0 AND hidden = 0 ORDER BY frecency DESC LIMIT 1) AS _title, (SELECT url FROM moz_places WHERE favicon_id = s.favicon_id AND visit_count > 0 AND hidden = 0 ORDER BY frecency DESC LIMIT 1) AS _url FROM moz_places s WHERE favicon_id IS NOT NULL AND frecency != 0 AND visit_count > 0 AND hidden = 0 GROUP BY favicon_id ORDER BY MAX(frecency) DESC LIMIT ?',
    init: function(cehp) {
        this.history = Cc['@mozilla.org/browser/nav-history-service;1'].getService(Ci.nsINavHistoryService);
        var qu = this.history.getNewQuery();
        this.querier = qu;
        var qo = this.history.getNewQueryOptions();
        this.option = qo;
        qo.resultType = Ci.nsINavHistoryQueryOptions.RESULTS_AS_URI;
        qo.queryType = Ci.nsINavHistoryQueryOptions.QUERY_TYPE_HISTORY;
        qo.expandQueries = true;
        qo.sortingMode = Ci.nsINavHistoryQueryOptions.SORT_BY_VISITCOUNT_DESCENDING;

        var me = this;
        cehp['frequent'] = {
            query: function(n) { return ('nsPIPlacesDatabase' in Ci) ? me.query(n) : me.query_old(n); },
            remove: function(uri) { return me.remove(uri); }
        };
    },
    query: function(n) {
        var res = [];
        try {
            var conn = Cc['@mozilla.org/browser/nav-history-service;1'].getService(Ci.nsINavHistoryService).QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
            var stmt = conn.createStatement(this.sql);
            stmt.bindInt32Parameter(0, n);
            while (stmt.executeStep()) {
                res.push({title: stmt.getString(0), uri: stmt.getString(1)});
            }
        }
        finally {
            return res;
        }
    },
    query_old: function(n) {
        var res = [];

        this.option.maxResults = n;
        var hr = this.history.executeQuery(this.querier, this.option);
        var root = hr.root.QueryInterface(Ci.nsINavHistoryContainerResultNode);
        root.containerOpen = true;
        for (var i = 0; i < root.childCount; i++) {
            var e = root.getChild(i);
            res.push({uri: e.uri, title: e.title});
        }
        root.containerOpen = false;

        return res;
    },
    remove: function(uri) {
        var bh = this.history.QueryInterface(Ci.nsIBrowserHistory);
        bh.removePage(this.uri(uri));
    },
    uri: function(spec) {
        return Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService).newURI(spec, null, null);
    }
};

var last = {
    session: null,
    restored: {},
    init: function(cehp) {
        var me = this;
        cehp['last'] = {
            query: function() { return me.query(); },
            restore: function(tab, focus) { return me.restore(tab, focus); },
            remove: function(tab) { return me.remove(tab); }
        };
    },
    query: function() {
        if (!this.session) {
            this.session = this.read();
        }
        var res = [];
        for (var i in this.session.windows) {
            var win = this.session.windows[i];
            for (var j in win.tabs) {
                var tab = win.tabs[j];
                var e = tab.entries[tab.index - 1];
                if (!e)
                    continue;
                if (e.url == 'about:blank')
                    continue;
                res.push({
                    title: e.title,
                    url: e.url,
                    length: tab.entries.length,
                    data: JSON.stringify(tab),
                    window_idx: i,
                    tab_idx: j
                });
            }
        }
        return res;
    },
    read: function() {
        var files = this.getSessionFiles();
        var session = null;
        var emptySession = { windows: [] };
        if (files.length == 0)
            return emptySession;
        for (var i in files) {
            var file = files[i];
            try {
                var fileObj = this.getSessionDir();
                fileObj.append(file);
                if (!fileObj.exists())
                    continue;
                var content = '';
                var stream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
                var converter = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
                stream.init(fileObj, -1, 0, 0);
                converter.init(stream, 'UTF-8', 0, 0);
                var str = {};
                while (converter.readString(4096, str)) {
                    content += str.value;
                }
                stream.close();
                session = JSON.parse(content) || emptySession;
                if (!session.windows)
                    session.windows = [];
                fileObj.remove(false);
                break;
            } catch (ex) {
                session = emptySession;
                log(['read session error', ex]);
            }
        }
        return session;
    },
    remove: function(tab) {
        var win = null;
        for (var i in this.session.windows) {
            if (i == tab.window_idx) {
                var win = this.session.windows[i];
                for (var j in win.tabs) {
                    if (j == tab.tab_idx) {
                        var t = win.tabs[j];
                        var e = t.entries[t.index - 1];
                        win.tabs.splice(j, 1);
                        break;
                    }
                }
                if (win.tabs.length == 0)
                    this.session.windows.splice(i, 1);
                break;
            }
        }
    },
    restore: function(data, focus) {
        var oldt = this.restored[data];
        if (oldt) {
            if (focus)
                gBrowser.selectedTab = oldt;
        } else {
            var me = this;
            window.setTimeout(function() {
                var enabled = true;
                if (!prefs.get('browser.sessionstore.enabled', true)) {
                    enabled = false;
                    prefs.set('browser.sessionstore.enabled', true);
                }
                var ss = Components.classes['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore);
                var tab = gBrowser.addTab();
                ss.setTabState(tab, data);
                me.restored[data] = tab;
                if (!enabled) {
                    prefs.set('browser.sessionstore.enabled', false);
                }
            }, 0);
        }
    },
    save: function() {
        var enabled = true;
        if (!prefs.get('browser.sessionstore.enabled', true)) {
            enabled = false;
            prefs.set('browser.sessionstore.enabled', true);
        }
        var ss = Components.classes['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore);
        var state = ss.getBrowserState();
        if (!enabled) {
            prefs.set('browser.sessionstore.enabled', false);
        }

        var keep = prefs.get('extensions.cehomepage.keepsessions', 10);
        if (keep < 1)
            keep = 1;
        var files = this.getSessionFiles();
        while (files.length >=  keep) {
            var sf = this.getSessionDir();
            sf.append(files.pop());
            if (sf.exists()) {
                sf.remove(false);
            }
        }
        var session = this.getSessionDir();
        session.append(Date.now() + '.js');
        if (!session.exists())
            session.create(session.NORMAL_FILE_TYPE, 0644);
        this.write(state, session);
    },
    write: function(state, file) {
        var stream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
        stream.init(file, 0x02 | 0x08 | 0x20, 0644, 0);
        var converter = Cc['@mozilla.org/intl/converter-output-stream;1'].createInstance(Ci.nsIConverterOutputStream);
        converter.init(stream, 'UTF-8', 0, 0);
        converter.writeString(state);
        converter.close();
    },
    getSessionDir: function() {
        var dir = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
        dir.append('cesessions');
        if (!dir.exists()) {
            dir.create(dir.DIRECTORY_TYPE, 0700);
        }
        return dir;
    },
    getSessionFiles: function() {
        var files = [];
        var dir = this.getSessionDir();
        var fit = dir.directoryEntries;
        var file = null;
        while (fit.hasMoreElements()) {
            file = fit.getNext();
            file.QueryInterface(Ci.nsIFile);
            files.push(file.leafName);
        }
        files.sort(function(a,b) { return b > a; });
        return files;
    }
};

}());
