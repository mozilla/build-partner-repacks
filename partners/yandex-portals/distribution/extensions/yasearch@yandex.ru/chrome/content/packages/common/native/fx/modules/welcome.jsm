"use strict";
const EXPORTED_SYMBOLS = ["welcome"];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
var utils;
const DAY_MSECS = 86400000;
const welcome = {
    _PREF_NAME: "services.response",
    get _SOC_PROVS() {
        return this._api.Environment.branding.brandID + ".xml";
    },
    init: function Welcome_init(api, expiredDays) {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        this._api = api;
        this._tempDoc = this._api.XMLUtils.getDOMParser(null, null, true).parseFromString("<emptyDoc/>", "text/xml");
        Cu.import(this._api.Package.resolvePath("/native/fx/modules/utils.jsm"));
        utils.NotificationSource.objectMixIn(this);
        this._responseExpiredTime = DAY_MSECS * (expiredDays || 14);
    },
    _initialized: false,
    _api: null,
    get socialAuthProvidersDoc() {
        return this._tryGetNewAuthProvidersDoc() || this._getDefaultAuthProvidersDoc();
    },
    _tryGetNewAuthProvidersDoc: function Welcome__tryGetNewAuthProvidersDoc() {
        let updateNeeded = false;
        try {
            let provsFile = this._api.Files.getPackageStorage(true);
            provsFile.append(this._SOC_PROVS);
            if (!provsFile.exists()) {
                updateNeeded = true;
                return null;
            }
            if (Math.abs(Date.now() - provsFile.lastModifiedTime) > 3 * DAY_MSECS) {
                updateNeeded = true;
            }
            this._api.logger.debug("Downloaded version of auth providers list found");
            return this._api.XMLUtils.xmlDocFromFile(provsFile);
        } catch (e) {
            this._api.logger.error("Could not parse social providers file. " + e);
            return null;
        } finally {
            if (updateNeeded) {
                this._startAuthProvsUpdate();
            }
        }
    },
    _socAuthProvsRequest: null,
    _startAuthProvsUpdate: function Welcome__startAuthProvsUpdate() {
        if (this._socAuthProvsRequest) {
            return;
        }
        this._api.logger.debug("Requesting new social auth providers list...");
        let onProvidersResponse = function onProvidersResponse(req) {
            this._socAuthProvsRequest = null;
            if (utils.isReqError(req)) {
                return;
            }
            let provsFile = this._api.Files.getPackageStorage(true);
            provsFile.append(this._SOC_PROVS);
            this._api.XMLUtils.xmlDocToFile(req.target.responseXML, provsFile);
        };
        let providersURL = this._api.Localization.createStringBundle("/urls/common.properties").get("socialProvidersList");
        this._socAuthProvsRequest = utils.sendRequest(providersURL, {
            bypassCache: true,
            callbackFunc: onProvidersResponse.bind(this)
        });
    },
    _getDefaultAuthProvidersDoc: function Welcome__getDefaultAuthProvidersDoc() {
        let filePath = this._api.Package.resolvePath("/templates/soc-providers.xml");
        let fileStream = this._api.Package.getFileInputChannel(filePath).contentStream;
        return this._api.XMLUtils.xmlDocFromStream(fileStream, null, null, true);
    },
    ignoreYaRuService: function Welcome_ignoreYaRuService(listener) {
        this.removeListener("yaru", listener);
    }
};
