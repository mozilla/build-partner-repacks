'use strict';
!function () {
    var FValue = function FValue_class(value) {
        var fValue = function FValue_instance() {
            return value;
        };
        fValue.toString = function () {
            return 'FValue: ' + value;
        };
        return fValue;
    };
    var FCached = function FCached_class(func) {
        var cache = {};
        var fCached = function FCached_instance(simpleKey) {
            var key = 'cache:' + simpleKey;
            if (key in cache)
                return cache[key];
            return cache[key] = func.apply(this, arguments);
        };
        fCached.toString = FValue('FCached: ' + func);
        return fCached;
    };
    var FAlias = FCached(function FAlias_class(methodName) {
            var fAlias = function FAlias_instance() {
                return this[methodName].apply(this, arguments);
            };
            fAlias.toString = FValue('FAlias: ' + methodName);
            return fAlias;
        });
    BarPlatform.Permissions = new function () {
        var logger = BarPlatform._getLogger('security-manifest');
        var StandardURL = Components.classes['@mozilla.org/network/standard-url;1'];
        (this.fromNull = function Permissions_fromNull() {
            this.request = this.request || [];
            this.navigate = this.navigate || [];
            this.pageInfo = this.pageInfo || [];
            this.clipboard = Boolean(this.clipboard);
        }).prototype = this;
        (this.fromJSON = function Permissions_fromJSON({
            request: request,
            navigate: navigate,
            pageInfo: pageInfo,
            clipboard: clipboard
        }) {
            this.fromNull();
            var lastPrivacyAccess = this.canAccessToPrivacy();
            var lastSending = this.canSendData();
            if (request) {
                for (let [
                            ,
                            rule
                        ] in Iterator(request)) {
                    let domain = this.aDomainMaskForRequest(rule.domain);
                    let level = this.anAccessLevel(rule.level);
                    adding:
                        do {
                            for (let [
                                        ,
                                        rule2
                                    ] in Iterator(this.request)) {
                                if (rule2.domain !== domain)
                                    continue;
                                if (level === 'private')
                                    rule2.level = level;
                                break adding;
                            }
                            this.request.push({
                                domain: domain,
                                level: level
                            });
                        } while (false);
                }
                this.request.sort(function (rule1, rule2) {
                    if (rule1.domain > rule2.domain)
                        return 1;
                    if (rule1.domain < rule2.domain)
                        return -1;
                    return 0;
                });
            }
            if (navigate) {
                for (let [
                            ,
                            domain
                        ] in Iterator(navigate)) {
                    domain = this.aDomainMaskForNavigate(domain);
                    if (this.navigate.indexOf(domain) >= 0)
                        continue;
                    this.navigate.push(domain);
                }
                this.navigate.sort();
            }
            if (pageInfo) {
                for (let [
                            ,
                            domain
                        ] in Iterator(pageInfo)) {
                    domain = this.aDomainMaskForPageInfo(domain);
                    if (this.pageInfo.indexOf(domain) >= 0)
                        continue;
                    this.pageInfo.push(domain);
                }
                this.pageInfo.sort();
            }
            this.clipboard = this.clipboard || Boolean(clipboard);
            var newPrivacyAccess = this.canAccessToPrivacy();
            if (newPrivacyAccess !== lastPrivacyAccess) {
                this.aDomainMaskForNavigate = FAlias(newPrivacyAccess ? 'aLimitedDomainMask' : 'aDomainMask');
                this.fromJSON({ navigate: this.navigate });
            }
            var newSanding = this.canSendData();
            if (newSanding !== lastSending) {
                this.aDomainMaskForPageInfo = FAlias(newSanding ? 'aLimitedDomainMask' : 'aDomainMask');
                this.fromJSON({ pageInfo: this.pageInfo });
            }
            this.checkLimits();
            return this;
        }).prototype = this;
        (this.fromJSONString = function Permissions_fromJSONString(aJSONString) {
            this.fromJSON(JSON.parse(aJSONString));
        }).prototype = this;
        (this.fromDiff = function Permissions_fromDiff(minuend, subtrahend) {
            var privateDomains = this.subtractDomains(minuend.getPrivateDomains(), subtrahend.getPrivateDomains());
            var privateRules = privateDomains.map(function (domain) {
                    return {
                        domain: domain,
                        level: 'private'
                    };
                });
            var publicDomains = this.subtractDomains(minuend.getOnlyPublicDomains(), subtrahend.getRequestDomains());
            var publicRules = publicDomains.map(function (domain) {
                    return {
                        domain: domain,
                        level: 'public'
                    };
                });
            var request = privateRules.concat(publicRules);
            var navigate = this.subtractDomains(minuend.getDomainsForNavigate(), subtrahend.getDomainsForNavigate());
            var pageInfo = this.subtractDomains(minuend.getDomainsWithPageInfo(), subtrahend.getDomainsWithPageInfo());
            var clipboard = false;
            if (minuend.allowClipboardAccess() && !subtrahend.allowClipboardAccess()) {
                clipboard = true;
            }
            this.fromJSON({
                request: request,
                navigate: navigate,
                pageInfo: pageInfo,
                clipboard: clipboard
            });
        }).prototype = this;
        this.fromPermissions = this.fromJSON;
        (this.fromDoc = function Permissions_fromDoc(aDoc) {
            this.fromElement(aDoc.documentElement);
        }).prototype = this;
        (this.fromElement = function Permissions_fromElement(anElement) {
            this.fromNull();
            var childNode = anElement.firstChild;
            while (childNode) {
                let childName = childNode.localName;
                try {
                    switch (childName) {
                    case null:
                        break;
                    case 'request':
                        this.fromJSON({
                            request: [{
                                    level: childNode.getAttribute('level'),
                                    domain: childNode.getAttribute('domain')
                                }]
                        });
                        break;
                    case 'navigate':
                        let (domain = childNode.getAttribute('domain')) {
                            this.fromJSON({ navigate: [domain] });
                        }
                        break;
                    case 'page-info':
                        let (domain = childNode.getAttribute('domain')) {
                            this.fromJSON({ pageInfo: [domain] });
                        }
                        break;
                    case 'clipboard':
                        this.fromJSON({ clipboard: true });
                        break;
                    default:
                        logger.warn('Unknown element (' + childName + ') in permissions');
                        break;
                    }
                } catch (e) {
                    logger.error(e);
                    let coord = xmlutils.getSimpleXPathForElement(childNode);
                    throw new Error('Manifest syntax error in ' + coord + ': ' + e.message);
                }
                childNode = childNode.nextSibling;
            }
            return this;
        }).prototype = this;
        this.allowClipboardAccess = function Permissions_allowClipboardAccess() {
            return this.clipboard;
        };
        this.canAccessToPrivacy = function Permissions_canAccessToPrivacy(url) {
            if (this.getPrivateDomains().length)
                return true;
            if (this.getDomainsWithPageInfo().length)
                return true;
            if (this.allowClipboardAccess())
                return true;
            return false;
        };
        this.canSendData = function Permissions_canSendData(url) {
            if (this.getRequestDomains().length)
                return true;
            if (this.getDomainsForNavigate().length)
                return true;
            return false;
        };
        this.isSuspect = function Permissions_isSuspect() {
            if (this.canAccessToPrivacy())
                return true;
            return false;
        };
        this.isEmpty = function Permissions_isEmpty() {
            if (this.request.length)
                return false;
            if (this.navigate.length)
                return false;
            if (this.pageInfo.length)
                return false;
            if (this.clipboard)
                return false;
            return true;
        };
        this.allowRequestToURL = function Permissions_allowRequestToURL(url) {
            return /^(?:public|private)$/.test(this.accessLevelForURL(url));
        };
        this.allowPrivateRequestToURL = function Permissions_allowRequestToURL(url) {
            return 'private' === this.accessLevelForURL(url);
        };
        this.allowNavigateToURL = function Permissions_allowNavigateToURL(url) {
            try {
                url = this.anURL(url);
                if (!this.isSupportedScheme(url.scheme)) {
                    return false;
                }
                let domain = this.aDomain(url.host);
                let result = this.navigate.some(function (mask) {
                        return this.aDomainMaskRE(mask).test(domain);
                    }, this);
                return result;
            } catch (e) {
                logger.error(e);
                return false;
            }
        };
        this.allowGetInfoOfPage = function Permissions_allowGetInfoOfPage(url) {
            try {
                url = this.anURL(url);
                if (!this.isSupportedScheme(url.scheme)) {
                    return false;
                }
                let domain = this.aDomain(url.host);
                let result = this.pageInfo.some(function (mask) {
                        return this.aDomainMaskRE(mask).test(domain);
                    }, this);
                return result;
            } catch (e) {
                logger.error(e);
                return false;
            }
        };
        this.getRequestDomains = function Permissions_getRequestDomains() {
            var domains = [];
            for (let [
                        ,
                        rule
                    ] in Iterator(this.request)) {
                if (rule.level === 'none')
                    continue;
                domains.push(rule.domain);
            }
            return domains;
        };
        this.getPrivateDomains = function Permissions_getPrivateDomains() {
            var domains = [];
            for (let [
                        ,
                        rule
                    ] in Iterator(this.request)) {
                if (rule.level !== 'private')
                    continue;
                domains.push(rule.domain);
            }
            return domains;
        };
        this.getOnlyPublicDomains = function Permissions_getOnlyPublicDomains() {
            var domains = [];
            for (let [
                        ,
                        rule
                    ] in Iterator(this.request)) {
                if (rule.level !== 'public')
                    continue;
                domains.push(rule.domain);
            }
            return domains;
        };
        this.getDomainsForNavigate = function Permissions_getDomainsForNavigate() {
            return this.navigate.slice(0);
        };
        this.getDomainsWithPageInfo = function Permissions_getDomainsWithPageInfo() {
            return this.pageInfo.slice(0);
        };
        this.accessLevelForURL = function Permissions_accessLevelForURL(url) {
            try {
                url = this.anURL(url);
                if (!this.isSupportedScheme(url.scheme)) {
                    return 'none';
                }
                let domain = this.aDomain(url.host);
                let level = 'none';
                this.request.forEach(function (rule) {
                    if (this.aDomainMaskRE(rule.domain).test(domain))
                        level = rule.level;
                }, this);
                return this.anAccessLevel(level);
            } catch (e) {
                logger.error(e);
                return 'none';
            }
        };
        this.toJSON = function Permissions_toJSON() {
            return this;
        };
        this.toJSONString = function Permissions_toJSONString() {
            return JSON.stringify(this);
        };
        this.checkLimits = function Permissions_checkLimits() {
            if (this.getDomainsForNavigate().length > 32)
                throw new Error('Too many domains for navigate');
            if (this.getDomainsWithPageInfo().length > 32)
                throw new Error('Too many domains with page-info');
            if (this.getRequestDomains().length > 32)
                throw new Error('Too many domains for request');
        };
        this.toString = function Permissions_toString() {
            return 'BarPlatform.Permissions' + JSON.stringify(this);
        };
        this.isSupportedScheme = function Permissions_isSupportedScheme(schemeString) {
            return /^(?:http|https|ftp)$/.test(schemeString);
        };
        this.subtractDomains = function Permissions_subtractDomains(minuendDomains, subtrahendDomains) {
            var diffDomains = [];
            minuendDomains.forEach(function (minDomain) {
                for (let [
                            ,
                            subDomain
                        ] in Iterator(subtrahendDomains)) {
                    if (this.aDomainMaskRE(subDomain).test(minDomain))
                        return;
                }
                diffDomains.push(minDomain);
            }, this);
            return diffDomains;
        };
        this.anURL = function Permissions_anURL(anURL) {
            if (typeof anURL === 'string') {
                let url = StandardURL.createInstance(Components.interfaces.nsIStandardURL);
                url.init(url.URLTYPE_STANDARD, 80, anURL, null, null);
                url = url.QueryInterface(Components.interfaces.nsIURI);
                return url;
            }
            return anURL;
        };
        this.anAccessLevel = function Permissions_anAccessLevel(level) {
            if (!level)
                level = '';
            if (!/^(?:private|public|none)$/.test(level))
                throw new Error('Wrong access level [' + level + ']');
            return level;
        };
        this.aDomain = function Permissions_aDomain(domain) {
            if (!domain && typeof domain !== 'string') {
                throw new Error('Domain is not defined');
            }
            var normalized = String(domain).replace(/^[*.]*/, '');
            if (normalized)
                normalized = '.' + normalized;
            return normalized;
        };
        this.aDomainMask = function Permissions_aDomainMask(domainMask) {
            var normalized = this.aDomain(domainMask);
            if (!/^(?:|(?:\.[^.]+)+\.[^\d.]{2,})$/.test(normalized)) {
                throw new Error('Wrong domain mask [' + domainMask + ']');
            }
            return normalized;
        };
        this.aLimitedDomainMask = function Permissions_aLimitedDomainMask(domainMask) {
            var normalized = this.aDomainMask(domainMask);
            if (normalized === '')
                throw new Error('Restricted domain mask [' + domainMask + ']');
            return normalized;
        };
        this.aDomainMaskForRequest = FAlias('aLimitedDomainMask');
        this.aDomainMaskForNavigate = FAlias('aDomainMask');
        this.aDomainMaskForPageInfo = FAlias('aDomainMask');
        var escapeREChars = RegExp('[' + '^({[\\.?+*]})$'.replace(/./g, '\\$&') + ']', 'g');
        this.aDomainMaskRE = FCached(function Permissions_aDomainMaskRE(domainMask) {
            if (typeof domainMask === 'string') {
                domainMask = this.aDomainMask(domainMask);
                domainMask = domainMask.replace(escapeREChars, '\\$&') + '$';
            }
            return RegExp(domainMask, 'i');
        });
    }();
    BarPlatform.TrustedPackagePermissions = new function () {
        BarPlatform.Permissions.constructor.apply(this);
        this.aLimitedDomainMask = FAlias('aDomainMask');
    }();
    BarPlatform.FullPermissions = new function () {
        BarPlatform.Permissions.constructor.apply(this);
        this.fromNull = function FullPermissions_fromNull() {
            this.request = [{
                    domain: '',
                    level: 'private'
                }];
            this.navigate = [''];
            this.pageInfo = [''];
            this.clipboard = true;
        };
        this.fromNull.prototype = this;
        this.aLimitedDomainMask = FAlias('aDomainMask');
    }();
    BarPlatform.CumulativePermissions = new function () {
        BarPlatform.Permissions.constructor.apply(this);
        this.checkLimits = function () {
        };
    }();
}();
