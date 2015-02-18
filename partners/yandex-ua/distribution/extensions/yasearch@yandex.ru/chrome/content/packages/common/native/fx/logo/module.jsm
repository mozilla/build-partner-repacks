"use strict";
const EXPORTED_SYMBOLS = [
    "core",
    "resources"
];
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
const resources = { browser: { styles: ["/native/fx/bindings.css"] } };
const PARTNER_PACK_COMPID = "ru.yandex.custombar.branding";
const PARTNER_PACK_SVCNAME = "package";
const PARTNER_PACK_LOGO_XML = "/logobutton/logoconf.xml";
const WIDGET_ID = "http://bar.yandex.ru/packages/yandexbar#logo";
const core = {
    init: function LogoWidget_init(api) {
        this._api = api;
        this._logger = api.logger;
        this._partnerPackSvc = api.Services.obtainService(PARTNER_PACK_COMPID, PARTNER_PACK_SVCNAME, this);
        this._loadPartnerPack();
    },
    finalize: function LogoWidget_finalize() {
        this._saveHistory();
        this._api.Services.releaseService(PARTNER_PACK_COMPID, PARTNER_PACK_SVCNAME, this);
        delete this._api;
        delete this._linkTags;
        delete this._partnerXml;
        delete this._templater;
        delete this._partnerPackSvc;
        delete this._logger;
    },
    buildWidget: function LogoWidget_buildWidget(WIID, toolbarItem) {
        toolbarItem.module = this;
        toolbarItem.setAttribute("yb-native-widget-name", WIDGET_ID);
        toolbarItem.setAttribute("yb-native-widget-wiid", WIID);
    },
    destroyWidget: function LogoWidget_destroyWidget(WIID, toolbarItem, context) {
        if ("wdgtxDestructor" in toolbarItem) {
            toolbarItem.wdgtxDestructor();
        }
        delete toolbarItem.module;
    },
    onAfterReset: function LogoWidget_onAfterReset() {
        this._getInitialHistory();
    },
    observeServiceEvent: function LogoWidget_observeServiceEvent(providerID, serviceName, topic, data) {
        if (providerID != PARTNER_PACK_COMPID || serviceName != PARTNER_PACK_SVCNAME) {
            return;
        }
        switch (topic) {
        case "registered":
            this._logger.info("logo button registered");
            this._partnerPackSvc = data;
            this._loadPartnerPack();
            break;
        case "package updated":
            this._logger.info("logo button updated");
            delete this._linkTags;
            delete this.navigateMainPage.params;
            this._historyLength = null;
            this._loadPartnerPack();
            this._forEachToolbarItem(function (toolbarItem) {
                if ("reload" in toolbarItem) {
                    toolbarItem.reload();
                }
            });
            break;
        default:
            break;
        }
    },
    _loadPartnerPack: function LogoWidget__loadPartnerPack() {
        try {
            let partnerPackageService = this._partnerPackSvc;
            this._templater = function (str) {
                return partnerPackageService.expandBrandTemplatesEscape(str);
            };
            this._partnerXml = this._partnerPackSvc.getXMLDocument(PARTNER_PACK_LOGO_XML);
        } catch (e) {
            this._logger.error("Could not load branding content. " + e);
        }
    },
    _api: null,
    get API() {
        return this._api;
    },
    get logoImagePath() {
        return this._partnerPackSvc.resolvePath("fx/logobutton/logo.svg");
    },
    get aboutImagePath() {
        return this._partnerPackSvc.resolvePath("about/logo-fx-tiny.png");
    },
    get vendorName() {
        return this._partnerPackSvc.expandBrandTemplates("{vendor.nom}");
    },
    get logoTooltip() {
        let tooltip = this._partnerXml.querySelector("Tooltip");
        return tooltip && tooltip.textContent || "";
    },
    get _historyStorage() {
        if (!this.__historyStorage || !this.__historyStorage.exists()) {
            try {
                let storage = this._api.Files.getWidgetStorage(true);
                storage.append("history.json");
                this.__historyStorage = storage;
            } catch (e) {
                this._logger.error("Cannot obtain storage for history: " + e);
                this.__historyStorage = null;
            }
        }
        return this.__historyStorage;
    },
    handleEvent: function LogoWidget_handleEvent(aEvent) {
        let target = aEvent.originalTarget;
        switch (aEvent.type) {
        case "command":
            let id = target.getAttribute("rel");
            let url = this._templater(target.getAttribute("url"));
            let action = target.getAttribute("action");
            if (url) {
                this._api.Controls.navigateBrowser({
                    url: url,
                    eventInfo: aEvent
                });
            }
            if (id) {
                this._addToHistory(id);
            }
            if (action) {
                this.logAction(action);
            }
            break;
        default:
            break;
        }
    },
    navigateMainPage: function LogoWidget_navigateMainPage(aEvent) {
        if (!this.navigateMainPage.params) {
            this.navigateMainPage.params = Object.create(null);
            try {
                let link = this._partnerXml.querySelector("LogoButton > Link");
                if (link) {
                    let url = link.getAttribute("url");
                    if (url) {
                        this.navigateMainPage.params.url = this._templater(url);
                    } else {
                        throw new Error("Attribute 'url' not found");
                    }
                    let actionValue = link.getAttribute("action");
                    if (actionValue) {
                        this.navigateMainPage.params.actionValue = actionValue;
                    }
                }
                this.navigateMainPage.params.openPopup = !link;
            } catch (e) {
                this._logger.error("Cannot open new window with data from " + PARTNER_PACK_LOGO_XML + "  " + e);
            }
        }
        if (!this.navigateMainPage.params.openPopup) {
            this._api.Controls.navigateBrowser({
                url: this.navigateMainPage.params.url,
                eventInfo: aEvent
            });
            this.logAction(this.navigateMainPage.params.actionValue);
        }
    },
    logAction: function LogoWidget_logAction(aActionValue) {
        if (this._partnerPackSvc.getBrandID() == "yandex") {
            this._api.Statistics.logShortAction(aActionValue);
        } else {
            this._api.Statistics.logCustomAction(aActionValue);
        }
    },
    getHistory: function LogoWidget_getHistory(aDocument) {
        if (!this._history) {
            this._loadHistory();
        }
        let linklist = aDocument.createDocumentFragment();
        this._history.forEach(function (id) {
            let tag = this._queryLinkTag(id);
            if (tag) {
                linklist.appendChild(tag);
            }
        }, this);
        return this._transformMenuXSLT(linklist, aDocument);
    },
    getCategories: function LogoWidget_getCategories(aDocument) {
        return this._transformMenuXSLT(this._partnerXml, aDocument);
    },
    _transformMenuXSLT: function LogoWidget__transformMenuXSLT(xmlDoc, aDocument) {
        let xsltProcessor = Cc["@mozilla.org/document-transformer;1?type=xslt"].createInstance(Ci.nsIXSLTProcessor);
        xsltProcessor.setParameter(null, "packagePath", this._partnerPackSvc.resolvePath(""));
        const IOService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        let uri = IOService.newURI(this.API.Package.resolvePath("/native/fx/logo/services-menu.xsl"), null, null);
        let channel = IOService.newChannelFromURI(uri);
        let stream = channel.open();
        let xml = this.API.XMLUtils.xmlDocFromStream(stream, uri, uri, true);
        xsltProcessor.importStylesheet(xml);
        return xsltProcessor.transformToFragment(xmlDoc, aDocument);
    },
    _queryLinkTag: function LogoWidget__queryLinkTag(id) {
        if (!this._linkTags) {
            this._linkTags = Object.create(null);
        }
        if (!(id in this._linkTags)) {
            this._linkTags[id] = this._partnerXml.querySelector("Link[id='" + id + "']");
        }
        if (this._linkTags[id]) {
            return this._linkTags[id].cloneNode(true);
        }
        return null;
    },
    _historyLength: null,
    get historyLength() {
        if (this._historyLength === null) {
            this._historyLength = 0;
            let historyTag = this._partnerXml.querySelector("History");
            if (historyTag) {
                this._historyLength = Math.max(parseInt(historyTag.getAttribute("length"), 10) || 0, 0);
            }
        }
        return this._historyLength;
    },
    _addToHistory: function LogoWidget__addToHistory(aId) {
        this._history = this._history.filter(id => aId != id);
        this._history.unshift(aId);
        this._history = this._history.slice(0, this.historyLength);
    },
    _saveHistory: function LogoWidget__saveHistory() {
        if (!this._history) {
            return;
        }
        try {
            this._api.Files.writeTextFile(this._historyStorage, JSON.stringify(this._history));
        } catch (e) {
            this._logger.debug("Cannot save history: " + e);
        }
    },
    _loadHistory: function LogoWidget__loadhistory() {
        try {
            this._history = JSON.parse(this._api.Files.readTextFile(this._historyStorage));
            this._history = this._history.slice(0, this.historyLength);
        } catch (e) {
            this._getInitialHistory();
        }
        return this._history;
    },
    _getInitialHistory: function LogoWidget__getInitialHistory() {
        this._history = [];
        if (!this.historyLength) {
            return;
        }
        let historyTag = this._partnerXml.querySelector("History");
        if (!historyTag) {
            return;
        }
        let historyElements = historyTag.children;
        let len = Math.min(historyElements.length, this.historyLength);
        for (let i = 0; i < len; i++) {
            this._history.push(historyElements[i].getAttribute("for-id"));
        }
    },
    _forEachToolbarItem: function LogoWidget__forEachToolbarItem(aFunction, aContext, aArguments) {
        this.API.Controls.getAllWidgetItems().forEach(function (toolbaritem) {
            let args = aArguments || [];
            args.unshift(toolbaritem);
            aFunction.apply(aContext || null, args);
        });
    }
};
