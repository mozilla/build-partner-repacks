'use strict';
const EXPORTED_SYMBOLS = ['barnavig'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu,
        results: Cr
    } = Components;
const GLOBAL = this;
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Services.jsm');
if ('nsIPrivateBrowsingChannel' in Ci) {
    XPCOMUtils.defineLazyModuleGetter(this, 'PrivateBrowsingUtils', 'resource://gre/modules/PrivateBrowsingUtils.jsm');
    this.isWindowPrivate = function _isWindowPrivate(aWindow) {
        if (aWindow)
            return PrivateBrowsingUtils.isWindowPrivate(aWindow);
        return false;
    };
} else {
    this.isWindowPrivate = function _isWindowPrivateEmpty(aWindow) false;
}
XPCOMUtils.defineLazyGetter(this, 'mozWorker', function () {
    var mozWorker = new Worker('resource://' + barnavig._application.name + '-app/parts/workers/barnavig.js');
    mozWorker.postMessage({
        type: 'setModulesPath',
        data: 'resource://' + barnavig._application.name + '-mod/'
    });
    var dictionary = null;
    try {
        dictionary = fileutils.readTextFile(barnavig._application.branding.brandPackage.findFile('/search/dictionary.txt'));
    } catch (e) {
    }
    mozWorker.postMessage({
        type: 'setSearchDictionary',
        data: dictionary
    });
    return mozWorker;
});
function isErrorRequest(aReq) !!(!aReq || aReq.type == 'error' || !aReq.target || aReq.target.status != 200)
function getWindowListenerForWindow(window) {
    var controllerName = barnavig._application.name + 'OverlayController';
    return controllerName in window ? window[controllerName].windowListener : null;
}
function getTabDataForTab(tab, key) {
    var winListener = getWindowListenerForWindow(tab.ownerDocument.defaultView);
    return winListener && winListener.getTabData(tab, key) || null;
}
const ABOUT_BLANK_URI = Services.io.newURI('about:blank', null, null);
const barnavig = {
        init: function BarNavig_init(application) {
            application.core.Lib.sysutils.copyProperties(application.core.Lib, GLOBAL);
            this._application = application;
            this._logger = application.getLogger('BarNavig');
            this._dataProviders = [];
            this.transmissionEnabled = true;
            this.listenStatEventsEnabled = true;
            try {
                this._sendWaitingRequests();
            } catch (e) {
                this._logger.debug(e);
            }
            Services.obs.addObserver(linkClickListener, 'http-on-modify-request', false);
        },
        finalize: function BarNavig_finalize(aDoCleanup) {
            Services.obs.removeObserver(linkClickListener, 'http-on-modify-request');
            this.listenStatEventsEnabled = false;
            this.transmissionEnabled = false;
            if (aDoCleanup)
                this._application.core.Lib.fileutils.removeFileSafe(this._barnavigR1File);
            this._dataProviders = [];
            this._logger = null;
            this._application = null;
        },
        get application() {
            return this._application;
        },
        get transmissionEnabled() {
            return this._transmit;
        },
        set transmissionEnabled(val) {
            this._transmit = !!val;
        },
        get listenStatEventsEnabled() {
            return this._listenStatEvents;
        },
        set listenStatEventsEnabled(val) {
            if (!!val == this._listenStatEvents)
                return;
            this._listenStatEvents = !!val;
            if (this._application.core.CONFIG.APP.TYPE === 'vbff') {
                try {
                    let barAppBarNavig = Cc['@yandex.ru/custombarcore;yasearch'].getService().wrappedJSObject.application.barnavig;
                    if (!this._listenStatEvents)
                        barAppBarNavig.addDataProvider(this._barAppDataProvider);
                    else
                        barAppBarNavig.removeDataProvider(this._barAppDataProvider);
                } catch (e) {
                }
            }
            if (this._listenStatEvents) {
                downloadsStat.init();
                windowMediatorListener.enable();
            } else {
                downloadsStat.finalize();
                windowMediatorListener.disable();
            }
        },
        _barAppDataProvider: {
            onWindowLocationChange: function BarNavig__barAppDataProvider_onWindowLocationChange() {
            },
            onPageLoad: function BarNavig__barAppDataProvider_onPageLoad(barAppParams) {
                if (!barnavig.transmissionEnabled)
                    return;
                if (barnavig.alwaysSendUsageStat === false)
                    return;
                var barNavigParamsLength = Object.keys(barAppParams.barNavigParams).length;
                var [
                        params,
                        callbacks
                    ] = barnavig._callDataProviders('onPageLoad', barAppParams);
                if (barNavigParamsLength < Object.keys(barAppParams.barNavigParams).length) {
                    let emptyParams = barnavig._emptyBarNavigParamsObject;
                    [
                        'ver',
                        'clid',
                        'yasoft',
                        'brandID'
                    ].forEach(function (paramName) barAppParams.barNavigParams['vb' + paramName] = emptyParams[paramName]);
                }
                if (!callbacks.length)
                    return;
                return function BarNavig__barAppDataProvider_onPageLoadCallback(params) {
                    callbacks.filter(function (callback) typeof callback == 'object' || typeof callback == 'function').forEach(function (callback) {
                        try {
                            if (typeof callback == 'function')
                                callback(params);
                            else
                                callback.onBarNavigResponse(params);
                        } catch (e) {
                            barnavig._logger.error('Notify provider error "onBarNavigResponse": ' + e);
                        }
                    });
                };
            }
        },
        addDataProvider: function BarNavig_addDataProvider(aProvider) {
            if (!this._dataProviders.some(function (provider) provider === aProvider))
                this._dataProviders.push(aProvider);
        },
        removeDataProvider: function BarNavig_removeDataProvider(aProvider) {
            this._dataProviders = this._dataProviders.filter(function (provider) provider !== aProvider);
        },
        sendRequest: function BarNavig_sendRequest(aRequestParams, aCallback) {
            if (!this.transmissionEnabled || this.alwaysSendUsageStat === false)
                return;
            this._prepeareAndSendRequest(aRequestParams, aCallback);
        },
        forceRequest: function BarNavig_forceRequest(aRequestParams, aCallback) {
            if (!this.transmissionEnabled)
                return;
            this._prepeareAndSendRequest(aRequestParams, aCallback);
        },
        get barnavigR1String() {
            if (this._barnavigR1String === null) {
                let r1;
                try {
                    r1 = this._application.core.Lib.fileutils.readTextFile(this._barnavigR1File);
                } catch (e) {
                }
                this._barnavigR1String = r1 || '';
            }
            return this._barnavigR1String;
        },
        set barnavigR1String(val) {
            if (val === this.barnavigR1String)
                return;
            try {
                this._application.core.Lib.fileutils.writeTextFile(this._barnavigR1File, val);
            } catch (e) {
            }
            this._barnavigR1String = null;
        },
        get alwaysSendUsageStat() {
            return this._application.preferences.get('stat.usage.send', null);
        },
        _sendWaitingRequests: function BarNavig__sendWaitingRequests() {
            var requests = this._application.preferences.get('stat.usage.requests', null);
            if (!requests)
                return;
            this._application.preferences.reset('stat.usage.requests');
            if (this._application.preferences.get('stat.usage.requests', null))
                return;
            requests = JSON.parse(requests);
            (requests.forced || []).forEach(function (params) {
                this.forceRequest(params);
            }, this);
            (requests.common || []).forEach(function (params) {
                this.sendRequest(params);
            }, this);
        },
        __emptyBarNavigParamsObject: null,
        get _emptyBarNavigParamsObject() {
            if (this.__emptyBarNavigParamsObject === null) {
                this.__emptyBarNavigParamsObject = {
                    ver: this._application.addonManager.addonVersion,
                    clid: '',
                    yasoft: this._application.core.CONFIG.APP.TYPE,
                    brandID: this._application.branding.productInfo.BrandID.toString(),
                    ui: this._guidString,
                    show: 1,
                    post: 0,
                    urlinfo: 0,
                    referer: null,
                    oldurl: null
                };
                let clidData = this._application.clids.vendorData.clid1;
                if (clidData && clidData.clidAndVid)
                    this.__emptyBarNavigParamsObject.clid = clidData.clidAndVid;
            }
            var cloned = this._application.core.Lib.sysutils.copyObj(this.__emptyBarNavigParamsObject);
            var r1 = this.barnavigR1String;
            if (r1)
                cloned.r1 = this.barnavigR1String;
            return cloned;
        },
        _prepeareAndSendRequest: function BarNavig__prepeareAndSendRequest(aRequestParams, aCallback) {
            var params = {
                    uri: null,
                    url: null,
                    browser: null,
                    barNavigParams: this._makeBarNavigParams()
                };
            if (aRequestParams) {
                if (typeof aRequestParams == 'function') {
                    aRequestParams(params);
                } else {
                    for (let [
                                key,
                                value
                            ] in Iterator(aRequestParams))
                        params.barNavigParams[key] = value;
                }
            }
            this._appendOtherStatParams(params, false).then(function () {
                params._callbacks = aCallback ? [].concat(aCallback) : [];
                this._sendRequest(this.BARNAVIG_URL_PATH, params);
            }.bind(this));
        },
        _makeBarNavigParams: function BarNavig__makeBarNavigParams(aWindowListenerData) {
            var params = this._emptyBarNavigParamsObject;
            if (!aWindowListenerData)
                return params;
            var browser = aWindowListenerData.tab;
            var [
                    uri,
                    url
                ] = this._getBrowserURI(browser);
            params.url = url;
            var webNavigation = browser.webNavigation;
            try {
                if (webNavigation instanceof Ci.nsIWebPageDescriptor) {
                    let descriptor = webNavigation.currentDescriptor;
                    if (descriptor instanceof Ci.nsISHEntry && descriptor.postData)
                        params.post = 1;
                }
            } catch (e) {
            }
            var referringURI = webNavigation.referringURI;
            if (referringURI && !referringURI.userPass)
                params.referer = referringURI.spec;
            if (browser.contentTitle)
                params.title = String(browser.contentTitle || '').substr(0, 1000);
            var {
                    originalURL: originalURL,
                    responseStatus: responseStatus
                } = (aWindowListenerData.docShellProps || {}).currentDocumentChannel || {};
            if (originalURL && originalURL !== 'about:blank' && originalURL !== url)
                params.oldurl = originalURL;
            if (responseStatus)
                params.httpstatus = parseInt(responseStatus, 10) || 0;
            return params;
        },
        get BAR_NAVIG_URL() {
            delete this.BAR_NAVIG_URL;
            this.BAR_NAVIG_URL = {
                primary: 'bar-navig.yandex.ru',
                backup: 'backup.bar-navig.com'
            };
            var statisticsDoc;
            try {
                statisticsDoc = this._application.branding.brandPackage.getXMLDocument('/statistics/statistics.xml');
            } catch (e) {
                this._logger.error('Can not get "statistics/statistics.xml" file from branding');
            }
            var domainElement = statisticsDoc && statisticsDoc.querySelector('Statistics > BarNavigDomain');
            if (domainElement) {
                for (let prop in this.BAR_NAVIG_URL) {
                    let value = domainElement.getAttribute(prop);
                    if (value)
                        this.BAR_NAVIG_URL[prop] = value;
                }
            }
            return this.BAR_NAVIG_URL;
        },
        get BARNAVIG_URL_PATH() {
            delete this.BARNAVIG_URL_PATH;
            return this.BARNAVIG_URL_PATH = this.BAR_NAVIG_URL.primary + '/u';
        },
        get BARNAVIG_BACKUP_URL_PATH() {
            delete this.BARNAVIG_BACKUP_URL_PATH;
            return this.BARNAVIG_BACKUP_URL_PATH = this.BAR_NAVIG_URL.backup + '/u';
        },
        _sendRequest: function BarNavig__sendRequest(aURL, aParams) {
            task.spawn(function () {
                var ip = null;
                var callbackFunc = function callbackFunc(aResponse) {
                        this.onBarNavigResponse(aParams, aResponse, ip);
                    }.bind(this);
                if (!this.transmissionEnabled) {
                    callbackFunc(null);
                    return;
                }
                var url = aURL;
                if (url.indexOf(this.BARNAVIG_URL_PATH) == 0) {
                    ip = yield DNSInfo.getIPForURL(url);
                    if (!ip)
                        url = url.replace(this.BARNAVIG_URL_PATH, this.BARNAVIG_BACKUP_URL_PATH);
                }
                url = 'https://' + url;
                var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
                request.mozBackgroundRequest = true;
                request.open('POST', url, true);
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                request.setRequestHeader('Connection', 'close');
                var target = request.QueryInterface(Ci.nsIDOMEventTarget);
                target.addEventListener('load', callbackFunc, false);
                target.addEventListener('error', callbackFunc, false);
                var params = [];
                for (let [
                            key,
                            value
                        ] in Iterator(aParams.barNavigParams)) {
                    if (value !== null)
                        params.push(key + '=' + encodeURIComponent(String(value)));
                }
                request.send(params.join('&'));
            }.bind(this));
        },
        _getBrowserURI: function BarNavig__getBrowserURI(aBrowser) {
            if (!aBrowser)
                return [
                    null,
                    null
                ];
            var uri;
            try {
                uri = aBrowser.currentURI;
            } catch (e) {
                uri = ABOUT_BLANK_URI.clone();
            }
            var url = null;
            try {
                url = uri.spec || '';
                if (url == 'about:blank')
                    url = '';
            } catch (e) {
            }
            return [
                uri,
                url
            ];
        },
        _appendOtherStatParams: function BarNavig__appendOtherStatParams(aParams, onPageLoad) {
            var defer = promise.defer();
            if (this.alwaysSendUsageStat === false) {
                defer.resolve();
                return defer.promise;
            }
            var params = aParams.barNavigParams;
            var app = this._application;
            params.action = app.componentsUsage && app.componentsUsage.readActions() || null;
            var downloadData = downloadsStat.getRecord();
            if (downloadData) {
                params.dlu = downloadData.prePath;
                params.dlr = downloadData.referrer;
                params.dle = downloadData.extension;
                params.dls = downloadData.size;
            }
            pageStat.appendYammData(aParams);
            params.target = 'c';
            var browser = aParams.browser;
            if (browser) {
                let docShellProps = aParams.windowListenerData.docShellProps;
                if (docShellProps && docShellProps.loadType & Ci.nsIDocShell.LOAD_CMD_NORMAL) {
                    try {
                        let sessionHistory = browser.webNavigation.sessionHistory;
                        if (sessionHistory.count == 1) {
                            params.target = 't';
                            if (browser.getTabBrowser().browsers.length == 1)
                                params.target = 'w';
                        }
                    } catch (e) {
                    }
                }
            }
            if (app.browserUsage) {
                let browserUsage = app.browserUsage.readUsageStat();
                let (i = 0, len = browserUsage.length) {
                    for (; i < len; i++)
                        params['k' + (i + 1)] = browserUsage[i];
                }
            }
            linkClickListener.appendLinkData(aParams);
            task.spawn(function () {
                if (onPageLoad) {
                    pageStat.appendTimesData(aParams);
                    yield pageStat.appendCheckSumData(aParams);
                    yield searchPersonalization.appendBarNavigParam(aParams);
                }
                params.hip = (yield DNSInfo.getHIPString(aParams.url)) || null;
                defer.resolve();
            }.bind(this));
            return defer.promise;
        },
        _makeParamsForNotification: function BarNavig__makeParamsForNotification(aWindowListenerData) {
            var [
                    uri,
                    url
                ] = this._getBrowserURI(aWindowListenerData.tab);
            return {
                uri: uri,
                url: url,
                browser: aWindowListenerData.tab,
                windowListenerData: aWindowListenerData,
                get barNavigParams() {
                    delete this.barNavigParams;
                    return this.barNavigParams = barnavig._makeBarNavigParams(aWindowListenerData);
                }
            };
        },
        onWindowLocationChange: function BarNavig_onWindowLocationChange(aWindowListenerData) {
            if (isWindowPrivate(aWindowListenerData.tab.contentWindow))
                return;
            if (!this._dataProviders.length)
                return;
            var [
                    params,
                    callbacks
                ] = this._callDataProviders('onWindowLocationChange', aWindowListenerData);
        },
        onPageLoad: function BarNavig_onPageLoad(aWindowListenerData) {
            if (isWindowPrivate(aWindowListenerData.tab.contentWindow))
                return;
            if (!this._dataProviders.length && this.alwaysSendUsageStat !== true)
                return;
            var [
                    params,
                    callbacks
                ] = this._callDataProviders('onPageLoad', aWindowListenerData);
            if (!callbacks.length) {
                if (this.alwaysSendUsageStat !== true)
                    return;
                let [
                        uri,
                        url
                    ] = this._getBrowserURI(aWindowListenerData.tab);
                if (!/^https?/.test(url))
                    return;
            }
            this._appendOtherStatParams(params, true).then(function () {
                params._callbacks = callbacks.filter(function (c) typeof c == 'object' || typeof c == 'function');
                this._sendRequest(this.BARNAVIG_URL_PATH, params);
            }.bind(this));
        },
        _callDataProviders: function BarNavig__callDataProviders(eventType, windowListenerData) {
            var params = typeof windowListenerData === 'object' && 'windowListenerData' in windowListenerData ? windowListenerData : this._makeParamsForNotification(windowListenerData);
            var callbacks = [];
            this._dataProviders.forEach(function BarNavig__callDataProviders_NotificatorFunc(provider) {
                try {
                    if (this._dataProviders.indexOf(provider) != -1)
                        callbacks.push(provider[eventType](params));
                } catch (e) {
                    this._logger.error('Notify provider error "' + eventType + '": ' + e);
                }
            }, this);
            callbacks = callbacks.filter(function (c) !!c);
            return [
                params,
                callbacks
            ];
        },
        onBarNavigResponse: function BarNavig_onBarNavigResponse(aParams, aRequest, aIP) {
            if (aRequest && isErrorRequest(aRequest)) {
                try {
                    let reqURL = aRequest.target.channel.name;
                    if (reqURL && reqURL.indexOf(this.BARNAVIG_BACKUP_URL_PATH) == -1) {
                        let status = 0;
                        try {
                            status = parseInt(aRequest.target.status, 10) || 0;
                        } catch (ex) {
                        }
                        if (status === 0) {
                            let extraParams = '';
                            if (aIP) {
                                let nipString = '';
                                let parts = aIP && aIP.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
                                if (parts) {
                                    let nip = parts[1] * 16777216 + parts[2] * 65536 + parts[3] * 256 + parts[4] * 1;
                                    nipString = '&nip=' + nip;
                                }
                                extraParams = '?pstatus=-1' + nipString;
                            }
                            this._sendRequest(this.BARNAVIG_BACKUP_URL_PATH + extraParams, aParams);
                            return;
                        }
                    }
                } catch (e) {
                }
            }
            aParams.request = aRequest;
            try {
                aParams.responseXML = aRequest.target.responseXML;
                if (!(aParams.responseXML instanceof Ci.nsIDOMDocument))
                    delete aParams.responseXML;
            } catch (e) {
            }
            if (aParams.responseXML) {
                let r1 = aParams.responseXML.querySelector('urlinfo > r1');
                r1 = r1 && r1.textContent;
                if (r1)
                    this.barnavigR1String = r1;
            }
            aParams._callbacks.filter(function (callback) typeof callback == 'object' || typeof callback == 'function').forEach(function (callback) {
                try {
                    if (typeof callback == 'function')
                        callback(aParams);
                    else
                        callback.onBarNavigResponse(aParams);
                } catch (e) {
                    this._logger.error('Notify provider error "onBarNavigResponse": ' + e);
                }
            }, this);
        },
        get _guidString() {
            return this._application.addonStatus.guidString;
        },
        get _barnavigR1File() {
            var r1File = this._application.directories.userDir;
            r1File.append('r1-' + this._application.core.CONFIG.APP.TYPE);
            return r1File;
        },
        _dataProviders: [],
        _transmit: false,
        _listenStatEvents: false,
        _barnavigR1String: null,
        get _brandId() {
            delete this._brandId;
            return this._brandId = this._application.branding.productInfo.BrandID.toString();
        }
    };
const windowMediatorListener = {
        enable: function WML_enable() {
            Services.ww.registerNotification(this);
        },
        disable: function WML_disable() {
            Services.ww.unregisterNotification(this);
        },
        observe: function WML_observe(aSubject, aTopic, aData) {
            aSubject.addEventListener('load', this, false);
        },
        handleEvent: function WML_handleEvent(aEvent) {
            var win = aEvent.target.defaultView;
            switch (aEvent.type) {
            case 'load':
                win.removeEventListener('load', this, false);
                let winListener = getWindowListenerForWindow(win);
                if (winListener) {
                    win.addEventListener('unload', function WML_win_onUnload() {
                        win.removeEventListener('unload', WML_win_onUnload, false);
                        win.removeEventListener('click', linkClickListener, true);
                        winListener.removeListener('PageStateStart', linkClickListener);
                        winListener.removeListener('WindowLocationChange', windowEventsListener);
                        winListener.removeListener('PageLoad', windowEventsListener);
                    }, false);
                    winListener.addListener('WindowLocationChange', windowEventsListener);
                    winListener.addListener('PageLoad', windowEventsListener);
                    winListener.addListener('PageStateStart', linkClickListener);
                    win.addEventListener('click', linkClickListener, true);
                }
                break;
            }
        }
    };
const linkClickListener = {
        appendLinkData: function linkClickListener_appendLinkData({
            browser: tab,
            uri: uri,
            barNavigParams: barNavigParams
        }) {
            if (!(uri && /^https?/.test(uri.scheme)))
                return;
            var winListener = getWindowListenerForWindow(tab.ownerDocument.defaultView);
            if (!winListener)
                return;
            var tabData = winListener.getTabData(tab, 'linkClick');
            if (!tabData)
                return;
            if (tabData.linkText)
                barNavigParams.lt = tabData.linkText;
            winListener.removeTabData(tab, 'linkClick');
        },
        handleEvent: function linkClickListener_handleEvent(event) {
            if (!barnavig.transmissionEnabled || barnavig.alwaysSendUsageStat === false)
                return;
            switch (event.type) {
            case 'click':
                this._lastActionText = this._getLinkText(event);
                this._lastActionTimestamp = Date.now();
                break;
            }
        },
        observe: function linkClickListener_observe(subject, topic, data) {
            switch (topic) {
            case 'PageStateStart':
                this._onPageStateStart(data);
                break;
            case 'http-on-modify-request':
                this._onModifyRequest(subject);
                break;
            }
        },
        ACTION_LIVE_TIME: 1000,
        PAGE_START_WAIT_TIME: 10000,
        _lastActionTimestamp: null,
        _lastActionText: null,
        _getLinkText: function linkClickListener__getLinkText(event) {
            var protocol = event.view.location.protocol;
            var target = event.originalTarget;
            if (protocol === 'chrome:') {
                return target.localName === 'menuitem' && target.parentNode && target.parentNode.id === 'contentAreaContextMenu' && this._lastActionText || null;
            }
            if (protocol !== 'http:')
                return null;
            while (target && target.localName !== 'a')
                target = target.parentNode;
            return target && target.textContent.trim().substr(0, 500) || null;
        },
        _onPageStateStart: function linkClickListener__onPageStateStart({
            tab: tab,
            request: request
        }) {
            if (Date.now() - this._lastActionTimestamp > this.PAGE_START_WAIT_TIME)
                return;
            if (!barnavig.transmissionEnabled || barnavig.alwaysSendUsageStat === false)
                return;
            var winListener = getWindowListenerForWindow(tab.ownerDocument.defaultView);
            if (!winListener)
                return;
            var tabData = winListener.getTabData(tab, 'linkClick');
            if (!tabData)
                return;
            var requestName;
            try {
                requestName = request.name;
            } catch (e) {
            }
            if (!requestName || tabData.lastURL !== requestName)
                winListener.removeTabData(tab, 'linkClick');
        },
        _onModifyRequest: function linkClickListener__onModifyRequest(channel) {
            if (!this._lastActionText)
                return;
            if (Date.now() - this._lastActionTimestamp > this.ACTION_LIVE_TIME) {
                this._lastActionText = null;
                return;
            }
            try {
                channel.QueryInterface(Ci.nsIHttpChannel);
                if (!(channel.loadFlags & Ci.nsIHttpChannel.LOAD_INITIAL_DOCUMENT_URI))
                    return;
            } catch (e) {
                return;
            }
            var tabData = this._getTabDataForChannel(channel);
            if (!tabData)
                return;
            tabData.linkText = this._lastActionText;
            tabData.lastURL = channel.URI.spec;
            this._lastActionText = null;
        },
        _getTabDataForChannel: function linkClickListener__getTabDataForChannel(channel) {
            var win = this._getDOMWindowForChannel(channel);
            if (!(win && win === win.parent))
                return null;
            return this._getTabDataForDOMWindow(win);
        },
        _getDOMWindowForChannel: function linkClickListener__getDOMWindowForChannel(channel) {
            try {
                return channel.loadGroup.groupObserver.QueryInterface(Ci.nsIWebProgress).DOMWindow;
            } catch (e) {
            }
            return null;
        },
        _getTabDataForDOMWindow: function linkClickListener__getTabDataForDOMWindow(window) {
            var docShellTree = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShellTreeItem);
            if (docShellTree.itemType !== Ci.nsIDocShellTreeItem.typeContent)
                return null;
            try {
                let chromeWindow = docShellTree.rootTreeItem.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow).wrappedJSObject;
                if (!chromeWindow)
                    return null;
                let tab = chromeWindow.getBrowser().getBrowserForDocument(window.document);
                if (!tab)
                    return null;
                return getTabDataForTab(tab, 'linkClick');
            } catch (e) {
            }
            return null;
        }
    };
const windowEventsListener = {
        observe: function WindowEventsListener_observe(aSubject, aTopic, aData) {
            if (!barnavig.listenStatEventsEnabled)
                return;
            switch (aTopic) {
            case 'WindowLocationChange':
                barnavig.onWindowLocationChange(aData);
                break;
            case 'PageLoad':
                barnavig.onPageLoad(aData);
                break;
            }
        }
    };
const DNSInfo = {
        getHIPString: function DNSInfo_getHIPString(strURL) {
            var defer = promise.defer();
            this.getIPsForURL(strURL).then(function (ips) {
                var strHIP = '';
                if (ips) {
                    ips.some(function makeHIP4(ip) {
                        var parts = ip ? ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/) : null;
                        if (!parts)
                            return false;
                        strHIP = parts[1] * 16777216 + parts[2] * 65536 + parts[3] * 256 + parts[4] * 1;
                        return true;
                    });
                    if (!strHIP) {
                        ips.some(function makeHIP6(ip) {
                            if (ip && /:/.test(ip)) {
                                strHIP = ip;
                                return true;
                            }
                            return false;
                        });
                    }
                }
                defer.resolve(strHIP);
            });
            return defer.promise;
        },
        getIPForURL: function DNSInfo_getIPForURL(strURL) {
            var defer = promise.defer();
            this.getIPsForURL(strURL).then(function (ips) {
                defer.resolve(ips && ips[0] || null);
            });
            return defer.promise;
        },
        getIPsForURL: function DNSInfo_getIPsForURL(strURL) {
            var defer = promise.defer();
            var host;
            try {
                let url = strURL;
                if (!/^https?:\/\//.test(strURL))
                    url = 'http://' + url;
                host = Services.io.newURI(url, null, null).host;
            } catch (e) {
            }
            if (!host) {
                defer.resolve(null);
            } else {
                let arrCachedIPs = this._dnsCache.get(host);
                if (!(arrCachedIPs && arrCachedIPs.length)) {
                    try {
                        let cbl = false;
                        let dnsListener = new this.DNSListener(host, function (arrIPs) {
                                this._dnsCache.put(host, arrIPs);
                                cbl = true;
                            }.bind(this));
                        this._dnsService.asyncResolve(host, 0, dnsListener, this._currentThread);
                        sysutils.promiseSleep(2000, function () !!cbl).then(function () {
                            defer.resolve(this._dnsCache.get(host));
                        }.bind(this));
                    } catch (e) {
                        defer.resolve(null);
                    }
                } else {
                    defer.resolve(arrCachedIPs);
                }
            }
            return defer.promise;
        },
        _dnsCache: {
            MAX_CACHED_COUNT: 100,
            _cached: [],
            clear: function dnsCache_clear() {
                this._cached = [];
            },
            put: function dnsCache_put(strHost, arrIPs) {
                var cached = {
                        host: strHost,
                        data: arrIPs
                    };
                if (this._cached.unshift(cached) > this.MAX_CACHED_COUNT)
                    this._cached.splice(-this.MAX_CACHED_COUNT / 2);
            },
            get: function dnsCache_get(strHost) {
                var cached = null;
                this._cached.some(function (item) strHost === item.host && (cached = item.data));
                return cached;
            }
        },
        get _dnsService() {
            delete this._dnsService;
            return this._dnsService = Cc['@mozilla.org/network/dns-service;1'].getService(Ci.nsIDNSService);
        },
        get _currentThread() {
            delete this._currentThread;
            this.__defineGetter__('_currentThread', function _currentThread() Services.tm.currentThread);
            return this._currentThread;
        },
        get DNSListener() {
            function DNSListener(strHost, callback) {
                this.host = strHost;
                this.callback = callback;
            }
            DNSListener.prototype = {
                host: null,
                callback: null,
                onLookupComplete: function DNSListener_onLookupComplete(aRequest, aRecord, aStatus) {
                    var arrIPs = [];
                    if (aStatus === 0 && aRecord) {
                        while (aRecord.hasMore())
                            arrIPs.push(aRecord.getNextAddrAsString());
                    }
                    if (this.callback)
                        this.callback(arrIPs);
                },
                QueryInterface: XPCOMUtils.generateQI([
                    Ci.nsIDNSListener,
                    Ci.nsISupports
                ])
            };
            delete this.DNSListener;
            return this.DNSListener = DNSListener;
        }
    };
const pageStat = {
        appendTimesData: function pageStat_appendTimesData(aParams) {
            if (!aParams.browser)
                return;
            var contentWindow = aParams.browser.contentWindow;
            if (!contentWindow)
                return;
            if (!this._checkConditions(contentWindow.location))
                return;
            var winPerformance = 'performance' in contentWindow && contentWindow.performance;
            var timing = winPerformance && winPerformance.timing;
            if (!timing)
                return;
            if (!timing.loadEventEnd)
                return;
            if (aParams.windowListenerData.hashOnlyChanged)
                return;
            if (aParams.windowListenerData.URIWasModified)
                return;
            var times = [
                    timing.responseStart - timing.navigationStart,
                    timing.domContentLoadedEventEnd - timing.responseStart,
                    timing.loadEventEnd - timing.domContentLoadedEventEnd
                ];
            if (times.some(function (v) !(typeof v == 'number' && v >= 0)))
                return;
            if (times[0] == 0 || times[1] == 0)
                return;
            var params = aParams.barNavigParams;
            params.tv = 5;
            params.t = times.map(function (t) parseInt(t / 10, 10)).join('-');
        },
        appendYammData: function pageStat_appendYammData(aParams) {
            if (!aParams.browser)
                return;
            var contentDocument = aParams.browser.contentDocument;
            if (!contentDocument)
                return;
            if (!this._isYandexHost(contentDocument.location))
                return;
            var metaNodes = contentDocument.getElementsByTagName('meta');
            let (i = 0, len = metaNodes.length) {
                for (; i < len; i++) {
                    let metaName = (metaNodes[i].name || '').toLowerCase();
                    if (metaName == 'yamm' && metaNodes[i].content) {
                        aParams.barNavigParams.yamm = ('' + metaNodes[i].content).substr(0, 10);
                        break;
                    }
                }
            }
        },
        appendCheckSumData: function pageStat_appendCheckSumData(aParams) {
            var defer = promise.defer();
            var workerTaskType = 'calculateCheckSum';
            var workerTaskId = [
                    workerTaskType,
                    Date.now(),
                    Math.random() * 10000
                ].join(':');
            var listener = function listener(event) {
                var {
                        type: type,
                        data: data,
                        taskId: taskId
                    } = event.data;
                if (type !== workerTaskType)
                    return;
                if (taskId !== workerTaskId)
                    return;
                mozWorker.removeEventListener('message', listener, false);
                var apiCrypto = barnavig.application.core.Lib.misc.CryptoHash;
                var hash = data && pageStat._fnv1a_32(apiCrypto.getBinaryFromString(data, 'MD5'));
                if (hash)
                    aParams.barNavigParams.psu = hash;
                defer.resolve();
            };
            mozWorker.addEventListener('message', listener, false);
            var contentDocument = aParams.browser.contentDocument;
            var documentInnerHTML;
            try {
                documentInnerHTML = contentDocument && contentDocument.documentElement.innerHTML;
            } catch (e) {
            }
            mozWorker.postMessage({
                type: workerTaskType,
                data: documentInnerHTML,
                taskId: workerTaskId
            });
            return defer.promise;
        },
        _fnv1a_32: function pageStat__fnv1a_32(aString) {
            var hash = 2166136261;
            let (i = 0) {
                for (; i < aString.length; i++) {
                    hash ^= aString.charCodeAt(i);
                    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
                }
            }
            return hash >>> 0;
        },
        _hostQuickRe: /(^|\.)((yandex|ya|moikrug)\.(com(\.tr)?|ru|ua|by|kz)|(google)\.(com|ru)|(mail|rambler)\.ru)$/i,
        _hostYaRe: new RegExp('(^|\\.)(yandex\\.(?:com(\\.tr)?|ru|ua|by|kz)|(ya|moikrug)\\.ru)$', 'i'),
        _hostOnlyRe: new RegExp('(^|www\\.)(yandex|ya|moikrug|google|mail|rambler)\\.', 'i'),
        _hostReS: new RegExp('(^|(nova|www|go)\\.)(yandex|google|mail|rambler)\\.(?:com(\\.tr)?|ru|ua|by|kz)$', 'i'),
        _pathReS: new RegExp('^((yand)?search|srch)\\?', 'i'),
        _hostReM: new RegExp('^((web)?mail\\.yandex\\.(com(\\.tr)?|ru|ua|by|kz)|(win|e)\\.mail\\.ru|mail\\.rambler\\.ru)$', 'i'),
        _urlReM: new RegExp('^https?://([^/]+/(cgi\\-bin/sendmsg\\?)?compose|webmail\\.yandex\\.(com(\\.tr)?|ru|ua|by|kz)/messages|mail\\.yandex\\.(com(\\.tr)?|ru|ua|by|kz)/((classic|modern|neo)/)?(messages|compose)|(win|e)\\.mail\\.ru/cgi\\-bin/(sentmsg\\?compose|msglist))|mail\\.rambler\\.ru/m/(folder/INBOX|compose)|mail\\.rambler\\.ru/mail/(startpage\\?|mail.cgi\\?(r|mode=(startpage|compose|mailbox;mbox=INBOX)))', 'i'),
        _checkConditions: function pageStat__checkConditions(aURL) {
            var url = String(aURL);
            if (!url || !url.match(/^https?:\/\/([^\/]+)\/?(.*)/))
                return false;
            var host = RegExp.$1;
            var path = RegExp.$2;
            if (!this._hostQuickRe.test(host))
                return false;
            if (!path && this._hostOnlyRe.test(host))
                return true;
            if (this._hostReM.test(host) && url.match(this._urlReM))
                return true;
            if (this._pathReS.test(path) && host.match(this._hostReS)) {
                let q = 'text';
                switch (RegExp.$3) {
                case 'google':
                    q = '(as_)?q';
                    break;
                case 'mail':
                    q = 'q';
                    break;
                case 'rambler':
                    q = '(query|words)';
                    break;
                }
                let re = new RegExp('[?&](?:' + q + ')=([^#&?]*)');
                if (re.test(path))
                    return true;
            }
            if (this._hostYaRe.test(host))
                return true;
            return false;
        },
        _isYandexHost: function pageStat__isYandexHost(aURL) {
            var url = String(aURL);
            if (!url || !url.match(/^https?:\/\/([^\/]+)\/?(.*)/))
                return false;
            return this._hostYaRe.test(RegExp.$1);
        }
    };
const downloadsStat = {
        init: function DlStat_init() {
            Services.obs.addObserver(this, 'final-ui-startup', true);
        },
        finalize: function DlStat_finalize() {
            try {
                let {Downloads: Downloads} = Cu.import('resource://gre/modules/Downloads.jsm');
                if (!('getList' in Downloads))
                    throw new Error('Old \'Downloads\' module');
                let that = this;
                Downloads.getList(Downloads.PUBLIC).then(function (list) list.removeView(that));
            } catch (ex1) {
                try {
                    const DownloadManager = Cc['@mozilla.org/download-manager;1'].getService(Ci.nsIDownloadManager);
                    DownloadManager.removeListener(this);
                } catch (ex2) {
                    barnavig._logger.error(ex1 + '\n' + ex2);
                }
            }
            this._activeDownloads = Object.create(null);
            this._downloadsData = [];
            this.__httpCacheSession = null;
        },
        getRecord: function DlStat_getRecord() {
            return this._downloadsData.shift();
        },
        _activeDownloads: Object.create(null),
        _downloadsData: [],
        EXT_TYPES: {
            __proto__: null,
            1: {
                extensions: ' bat bin com cmd deb dll dmg exe hqx img iso java msi msm msp scr ',
                mimes: ' application/bat                           application/x-bat                           application/x-apple-diskimage                           application/x-msdos-program                           application/x-msdownload                           application/x-msi                           application/mac-binhex40                           application/macbinhex40                           application/mac-binary                           application/macbinary                           application/x-binary                           application/x-macbinary                           application/java                           application/java-byte-code                           application/x-java-class                         '
            },
            2: {
                extensions: ' 7z boz bz bz2 gtar gz lha lhz rar tar tar.bz2 tar.gz tbz tgz x zip ',
                mimes: ' application/gnutar                           application/x-gzip                           application/x-tgz                           application/x-tar                           application/zip                           application/x-bzip                           application/x-bzip2                           application/x-bzip-compressed-tar                           application/x-7z-compressed                           application/x-rar-compressed                           application/rar                           application/x-compress                           application/x-compressed                           application/x-zip-compressed                           application/x-gtar                           multipart/x-zip                         '
            },
            3: {
                extensions: ' 3gp 3gpp afl asf asf asr asx avi avs flv lsf lsx m1v m2v mng mov movie                           mp2 mp4 mpa mpe mpeg mpg mpv2 qt qtc swf viv vivo wmv ',
                mimes: ' application/x-mplayer2                           application/x-shockwave-flash                         '
            },
            4: {
                extensions: ' aif aifc aiff au cda flac kar m2a m3u m4a mid midi mp3 ogg ra ram rmi snd voc wav ',
                mimes: ' application/ogg                           application/x-cda                           application/x-midi                         '
            },
            5: {
                extensions: ' art bm bmp cmx cod gif ico ico ief jfif jng jpe jpeg jpg pbm pct pcx pgm                           pic pict png pnm ppm qif qti qtif ras rgb svg tif tiff wbmp xbm xpm xwd ',
                mimes: ''
            },
            6: {
                extensions: ' ai djv djvu doc docx dot eps epub fb2 latex ltx odt odg odp ods odc odi odf odm                           pdf pps ppt pptx ps rtf rtx txt word xl xla xlb xlc xld xlk xll xlm xls                           xlsx xlt xlv xlw ',
                mimes: ' application/pdf                           application/msword                           application/rtf                           application/postscript                           application/x-rtf                           application/x-latex                           text/richtext                           application/excel                           application/x-excel                           application/x-msexcel                           application/vnd.ms-excel                           application/vnd.ms-powerpoint                           application/vnd.openxmlformats-officedocument.presentationml.presentation                           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet                           application/vnd.openxmlformats-officedocument.wordprocessingml.document                           application/vnd.oasis.opendocument.text                           application/vnd.oasis.opendocument.graphics                           application/vnd.oasis.opendocument.presentation                           application/vnd.oasis.opendocument.spreadsheet                           application/vnd.oasis.opendocument.chart                           application/vnd.oasis.opendocument.image                           application/vnd.oasis.opendocument.formula                           application/vnd.oasis.opendocument.text-master                           image/vnd.djvu                         '
            },
            7: {
                extensions: ' torrent ',
                mimes: ' application/x-bittorrent '
            }
        },
        _getIdForDownload: function DlStat__getIdForDownload(aDownload) {
            return [
                aDownload.source.spec,
                aDownload.target.spec
            ].join('|');
        },
        __httpCacheSession: null,
        get httpCacheSession() {
            if (!this.__httpCacheSession) {
                const CACHE_SERVICE = Cc['@mozilla.org/network/cache-service;1'].getService(Ci.nsICacheService);
                this.__httpCacheSession = CACHE_SERVICE.createSession('HTTP', Ci.nsICache.STORE_ANYWHERE, true);
                this.__httpCacheSession.doomEntriesIfExpired = false;
            }
            return this.__httpCacheSession;
        },
        _getMIMETypeFromRequest: function DlStat__getMIMEFromRequest(aRequest) {
            if (aRequest) {
                try {
                    aRequest.QueryInterface(Ci.nsIChannel);
                    return aRequest.contentType || null;
                } catch (e) {
                }
            }
            return null;
        },
        _getMIMETypeFromCacheEntry: function DlStat__getMIMEFromCacheEntry(aURL) {
            var defer = promise.defer();
            var cacheKey = aURL.replace(/#.*$/, '');
            try {
                cacheKey = barnavig.application.core.Lib.misc.tryCreateFixupURI(cacheKey).asciiSpec;
            } catch (e) {
            }
            var redirects = 0;
            var cacheSession = this.httpCacheSession;
            var listener = {
                    onCacheEntryAvailable: function cacheHelper_listener(descriptor, accessGranted, status) {
                        var type = null;
                        if (status === Cr.NS_OK && descriptor) {
                            let response = '';
                            try {
                                response = descriptor.getMetaDataElement('response-head');
                            } catch (e) {
                            }
                            if (redirects++ < 10) {
                                let location = /^Location:\s*(.+)$/im.exec(response);
                                location = location && location[1] || null;
                                if (location) {
                                    cacheSession.asyncOpenCacheEntry(location.replace(/#.*$/, ''), Ci.nsICache.ACCESS_READ, listener, true);
                                    return;
                                }
                            }
                            type = /^Content\-Type:\s*(.*?)\s*(?:\;|$)/im.exec(response);
                            type = type && type[1].toLowerCase() || null;
                        }
                        defer.resolve(type);
                    },
                    onCacheEntryDoomed: function cacheHelper_onCacheEntryDoomed() {
                    }
                };
            cacheSession.asyncOpenCacheEntry(cacheKey, Ci.nsICache.ACCESS_READ, listener, true);
            return defer.promise;
        },
        _getExtensionTypeForMIME: function DlStat__getExtensionTypeForMIME(aMIMEType) {
            var mime = (' ' + aMIMEType + ' ').toLowerCase();
            for (let [
                        type,
                        data
                    ] in Iterator(this.EXT_TYPES)) {
                if (data.mimes.indexOf(mime) != -1)
                    return type;
            }
            return null;
        },
        _getExtensionTypeForExtension: function DlStat__getExtensionTypeForExtension(aExtension) {
            var extension = (' ' + aExtension + ' ').toLowerCase();
            for (let [
                        type,
                        data
                    ] in Iterator(this.EXT_TYPES)) {
                if (data.extensions.indexOf(extension) != -1)
                    return type;
            }
            return null;
        },
        _collectDownloadData: function DlStat__collectDownloadData(aDownload, aRequest) {
            var downloadId = this._getIdForDownload(aDownload);
            var downloadData = this._activeDownloads[downloadId] || null;
            if (!downloadData)
                return;
            delete this._activeDownloads[downloadId];
            var downloadURI = aDownload.source;
            var url = downloadURI.spec;
            var prePath = downloadURI.prePath;
            var userName = downloadURI.userName;
            if (userName)
                prePath = prePath.split(userName + '@').join('');
            var referrerURL = downloadData.referrerURL;
            var collect = function collect(mimeType) {
                    var extensionType;
                    if (mimeType) {
                        extensionType = this._getExtensionTypeForMIME(mimeType);
                        if (!extensionType) {
                            switch ((/^(audio|image|video)\//.exec(mimeType || '') || '')[1]) {
                            case 'video':
                                extensionType = 3;
                                break;
                            case 'audio':
                                extensionType = 4;
                                break;
                            case 'image':
                                extensionType = 5;
                                break;
                            }
                        }
                    }
                    if (!extensionType) {
                        let extension = (/\.([^.]+)$/.exec(aDownload.target.spec) || '')[1];
                        extensionType = extension ? this._getExtensionTypeForExtension(extension) || 8 : 0;
                    }
                    this._downloadsData.push({
                        prePath: prePath,
                        referrer: referrerURL,
                        size: aDownload.size,
                        extension: extensionType
                    });
                }.bind(this);
            var mimeType = aDownload.MIMEInfo && aDownload.MIMEInfo.type || this._getMIMETypeFromRequest(aRequest) || null;
            if (mimeType) {
                collect(mimeType);
            } else {
                this._getMIMETypeFromCacheEntry(url).then(function (mtype) collect(mtype || null));
            }
        },
        QueryInterface: XPCOMUtils.generateQI([
            Ci.nsIDownloadProgressListener,
            Ci.nsIObserver,
            Ci.nsISupportsWeakReference
        ]),
        observe: function DlStat_observe(aSubject, aTopic, aData) {
            switch (aTopic) {
            case 'final-ui-startup':
                Services.obs.removeObserver(this, 'final-ui-startup', true);
                try {
                    let {Downloads: Downloads} = Cu.import('resource://gre/modules/Downloads.jsm');
                    if (!('getList' in Downloads))
                        throw new Error('Old \'Downloads\' module');
                    let that = this;
                    Downloads.getList(Downloads.PUBLIC).then(function (list) list.addView(that));
                } catch (ex1) {
                    try {
                        const DownloadManager = Cc['@mozilla.org/download-manager;1'].getService(Ci.nsIDownloadManager);
                        DownloadManager.addListener(this);
                    } catch (ex2) {
                        barnavig._logger.error(ex1 + '\n' + ex2);
                    }
                }
                break;
            }
        },
        _wrapDownloadObject: function DlStat__wrapDownloadObject(download) {
            var sourceURI = barnavig.application.core.Lib.misc.tryCreateFixupURI(download.source.url);
            if (!sourceURI)
                return null;
            var targetURI = barnavig.application.core.Lib.misc.tryCreateFixupURI(download.target.path);
            if (!targetURI)
                return null;
            var referrerURI = barnavig.application.core.Lib.misc.tryCreateFixupURI(download.source.referrer);
            return {
                id: download.source.url + '|' + download.target.path,
                source: sourceURI,
                target: targetURI,
                referrer: referrerURI,
                size: download.currentBytes,
                MIMEInfo: { type: download.contentType }
            };
        },
        _setReferrerForDownload: function DlStat__setReferrerForDownload(download) {
            var downloadId = this._getIdForDownload(download);
            if (downloadId in this._activeDownloads)
                return;
            var referrerURL = download.referrer && download.referrer.spec;
            if (!referrerURL) {
                try {
                    let win = Services.wm.getMostRecentWindow('navigator:browser');
                    let ref = win.gBrowser.mCurrentBrowser.currentURI.spec;
                    if (/^(http|ftp)s?:\/\//.test(ref))
                        referrerURL = ref;
                } catch (e) {
                }
            }
            if (referrerURL)
                this._activeDownloads[downloadId] = { referrerURL: referrerURL };
        },
        onDownloadAdded: function DlStat_onDownloadAdded(download) {
            var wrappedDownload = this._wrapDownloadObject(download);
            if (wrappedDownload)
                this._setReferrerForDownload(wrappedDownload);
        },
        onDownloadChanged: function DlStat_onDownloadChanged(download) {
            if (!download.succeeded)
                return;
            var wrappedDownload = this._wrapDownloadObject(download);
            if (wrappedDownload)
                this._collectDownloadData(wrappedDownload);
        },
        onDownloadStateChange: function DlStat_onDownloadStateChange(aState, aDownload) {
            if (!/^(http|ftp)s?:\/\//.test(aDownload.source.spec))
                return;
            const nsIDM = Ci.nsIDownloadManager;
            var state = aDownload.state;
            switch (state) {
            case nsIDM.DOWNLOAD_QUEUED:
                this._setReferrerForDownload(aDownload);
                break;
            case nsIDM.DOWNLOAD_BLOCKED_POLICY:
            case nsIDM.DOWNLOAD_FAILED:
            case nsIDM.DOWNLOAD_CANCELED:
            case nsIDM.DOWNLOAD_BLOCKED_PARENTAL:
            case nsIDM.DOWNLOAD_DIRTY:
            case nsIDM.DOWNLOAD_FINISHED:
                this._collectDownloadData(aDownload);
                break;
            }
        },
        onProgressChange: function DlStat_onProgressChange(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress, aDownload) {
            this._collectDownloadData(aDownload, aRequest);
        },
        onStateChange: function DlStat_onStateChange(aWebProgress, aRequest, aState, aStatus, aDownload) {
        },
        onSecurityChange: function DlStat_onSecurityChange(aWebProgress, aRequest, aState, aDownload) {
        }
    };
const searchPersonalization = {
        appendBarNavigParam: function searchPersonalization_appendBarNavigParam(aParams) {
            var defer = promise.defer();
            function resolvedPromise() {
                defer.resolve();
                return defer.promise;
            }
            if (!aParams.browser)
                return resolvedPromise();
            var contentDocument = aParams.browser.contentDocument;
            if (!contentDocument)
                return resolvedPromise();
            if (!/^http:\/\//.test(contentDocument.location))
                return resolvedPromise();
            var documentInnerHTML;
            try {
                documentInnerHTML = contentDocument.documentElement.innerHTML;
            } catch (e) {
                barnavig._logger.debug('searchPersonalization.appendBarNavigParam, innerHTML error: ' + e);
            }
            if (!documentInnerHTML)
                return resolvedPromise();
            var workerTaskType = 'calculateSearchPersonalization';
            var workerTaskId = [
                    workerTaskType,
                    Date.now(),
                    Math.random() * 10000
                ].join(':');
            var listener = function listener(event) {
                var {
                        type: type,
                        data: data,
                        taskId: taskId
                    } = event.data;
                if (type !== workerTaskType)
                    return;
                if (taskId !== workerTaskId)
                    return;
                mozWorker.removeEventListener('message', listener, false);
                if (data)
                    aParams.barNavigParams.body = data;
                defer.resolve();
            };
            mozWorker.addEventListener('message', listener, false);
            mozWorker.postMessage({
                type: workerTaskType,
                data: documentInnerHTML,
                taskId: workerTaskId
            });
            return defer.promise;
        }
    };
