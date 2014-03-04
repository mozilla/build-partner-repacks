'use strict';
const EXPORTED_SYMBOLS = ['vendorCookie'];
const {
        classes: Cc,
        interfaces: Ci,
        utils: Cu
    } = Components;
const vendorCookie = {
        init: function VendorCookie_init(application) {
            this._application = application;
            this._logger = application.getLogger('VendorCookie');
            this._setCookies();
        },
        finalize: function VendorCookie_finalize(aDoCleanup) {
            this._application = null;
        },
        _setCookies: function VendorCookie__setCookies() {
            if (!this._vendorCookiesFile)
                return;
            var cookiesXML = this._getVendorCookiesXML();
            this._application.core.Lib.fileutils.removeFileSafe(this._vendorCookiesFile);
            if (this._vendorCookiesFile)
                return;
            if (!cookiesXML)
                return;
            var cookieNodes = this._application.core.Lib.xmlutils.queryXMLDoc('/cookies/domain/set/cookie', cookiesXML);
            if (!(cookieNodes && cookieNodes.length))
                return;
            var timeNow = Date.now();
            var timeNowSec = parseInt(timeNow / 1000, 10);
            const cookieService = Cc['@mozilla.org/cookieService;1'].getService().QueryInterface(Ci.nsICookieService);
            cookieNodes.forEach(function (cookie) {
                var domain = cookie.parentNode.parentNode.getAttribute('id');
                if (!domain)
                    return;
                var cookieName = cookie.getAttribute('id');
                if (!cookieName)
                    return;
                var maxAge = parseInt(cookie.getAttribute('max-age'), 10) || 0;
                if (maxAge < 0)
                    return;
                if (cookie.getAttribute('override') !== 'yes') {
                    for (let existCookie in this._application.core.Lib.netutils.getCookiesFromHost(domain)) {
                        if (existCookie.name !== cookieName)
                            continue;
                        if (!existCookie.expires && !maxAge || existCookie.expires && maxAge && timeNowSec < existCookie.expires)
                            return;
                    }
                }
                var uri = Cc['@mozilla.org/network/standard-url;1'].createInstance(Ci.nsIURI);
                uri.spec = 'http://' + domain.replace(/^\./, '');
                var cookieStrArray = ['' + cookieName + '=' + cookie.textContent];
                if (domain.charAt(0) == '.')
                    cookieStrArray.push('domain=' + domain);
                cookieStrArray.push('path=' + (cookie.getAttribute('path') || '/'));
                if (maxAge)
                    cookieStrArray.push('expires=' + new Date(timeNow + maxAge * 1000).toGMTString());
                if (cookie.getAttribute('http-only') === 'yes')
                    cookieStrArray.push('HttpOnly');
                cookieService.setCookieStringFromHttp(uri, uri, null, cookieStrArray.join(';'), maxAge ? new Date(timeNow).toGMTString() : '', null);
                this._logger.debug('Set cookie \'' + cookieStrArray.join(';') + '\'');
            }, this);
        },
        get _vendorCookiesFile() {
            var file = this._application.core.extensionPathFile;
            'defaults/vendor/cookies.xml'.split('/').forEach(function (p) file.append(p));
            return file && file.exists() ? file : null;
        },
        _getVendorCookiesXML: function VendorCookie__getVendorCookiesXML() {
            try {
                return this._application.core.Lib.fileutils.xmlDocFromFile(this._vendorCookiesFile);
            } catch (e) {
            }
            return null;
        }
    };
