"use strict";
var gYaOverlay = {
    get _rdf() {
        delete this._rdf;
        return this._rdf = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
    },
    get _dataSource() {
        delete this._dataSource;
        return this._dataSource = this._rdf.GetDataSource("rdf:local-store");
    },
    getRDFLiteralValue: function Overlay_getRDFLiteralValue(aSource, aProperty) {
        let target = this._dataSource.GetTarget(aSource, aProperty, true);
        if (target instanceof Ci.nsIRDFLiteral) {
            return target.Value;
        }
        return null;
    },
    setRDFLiteralValue: function Overlay_setRDFLiteralValue(aSource, aProperty, aTarget) {
        try {
            var oldTarget = this._dataSource.GetTarget(aSource, aProperty, true);
            if (oldTarget) {
                if (aTarget) {
                    this._dataSource.Change(aSource, aProperty, oldTarget, this._rdf.GetLiteral(aTarget));
                } else {
                    this._dataSource.Unassert(aSource, aProperty, oldTarget);
                }
            } else {
                this._dataSource.Assert(aSource, aProperty, this._rdf.GetLiteral(aTarget), true);
            }
        } catch (e) {
        }
    },
    _migrateDefaultQuotes: function () {
        let allResources = this._dataSource.GetAllResources();
        let currentsetResource = this._rdf.GetResource("currentset");
        while (allResources.hasMoreElements()) {
            let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
            let tool = res.Value;
            if (!tool) {
                continue;
            }
            let toolbar = this._rdf.GetResource(tool);
            let currentSet = this.getRDFLiteralValue(toolbar, currentsetResource);
            if (!currentSet || currentSet == "__empty") {
                continue;
            }
            let quoteIds = currentSet.match(/yasearch\.cb\-http:\/\/bar\.yandex\.ru\/packages\/yandexbar#quote\-inst\-\d+/g);
            if (!quoteIds) {
                continue;
            }
            for (let i = quoteIds.length; i-- > 0;) {
                let quoteId = quoteIds[i].match(/\d+/);
                if (!quoteId) {
                    continue;
                }
                let prefName = "yasearch.xbwidgets.http://bar.yandex.ru/packages/yandexbar#quote." + quoteId + ".settings.quote-id";
                if (gYaSearchService.getIntPref(prefName) || gYaSearchService.getCharPref(prefName)) {
                    continue;
                }
                gYaSearchService.setCharPref(prefName, "1");
                gYaSearchService.log("Migrate old auto-quote '" + prefName + "' to '1'");
            }
        }
    },
    migrateWidgets: function (aLastVersion) {
        if (aLastVersion < "5.1.1") {
            this._removeBadDefaultCurrentset();
        }
        if (aLastVersion < "5.2.0") {
            this._migrateDefaultQuotes();
        }
        if (aLastVersion >= "5.2.5") {
            return;
        }
        let dirty = false;
        let allResources = this._dataSource.GetAllResources();
        let currentsetResource = this._rdf.GetResource("currentset");
        while (allResources.hasMoreElements()) {
            let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
            let tool = res.Value;
            if (tool) {
                let toolbar = this._rdf.GetResource(tool);
                let currentSet = this.getRDFLiteralValue(toolbar, currentsetResource);
                if (currentSet && currentSet != "__empty") {
                    let _dirty = false;
                    let currentsetIds = currentSet.split(",");
                    if (aLastVersion < "5.2.5") {
                        for (let i = 0, len = currentsetIds.length; i < len; i++) {
                            if (currentsetIds[i]) {
                                switch (currentsetIds[i]) {
                                case "yasearch-search":
                                    currentsetIds[i] = "yasearch.cb-http://bar.yandex.ru/packages/yandexbar#logo-inst-0";
                                    _dirty = true;
                                    break;
                                case "yasearch-container":
                                    currentsetIds[i] = "yasearch.cb-http://bar.yandex.ru/packages/yandexbar#search-inst-0";
                                    _dirty = true;
                                    break;
                                default:
                                    break;
                                }
                            }
                        }
                    }
                    if (_dirty) {
                        this.setRDFLiteralValue(toolbar, currentsetResource, currentsetIds.join(","));
                        dirty = true;
                    }
                }
            }
        }
        if (dirty) {
            this._dataSource.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
        }
    },
    _removeBadDefaultCurrentset: function Overlay__removeBadDefaultCurrentset() {
        try {
            let currentsetResource = this._rdf.GetResource("currentset");
            let toolbarResource = this._rdf.GetResource("chrome://browser/content/browser.xul#yasearch-bar");
            let currentSet = this.getRDFLiteralValue(toolbarResource, currentsetResource);
            if (currentSet && currentSet.indexOf("yasearch.cb-default-0") != -1) {
                this.setRDFLiteralValue(toolbarResource, currentsetResource, null);
                this._dataSource.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
            }
        } catch (e) {
        }
    },
    setToolbarCollapsedState: function Overlay_setCollapsedState(aCollapsedState) {
        if (typeof aCollapsedState !== "boolean") {
            return;
        }
        let newCollapsedState = aCollapsedState.toString();
        try {
            let collapsedResource = this._rdf.GetResource("collapsed");
            let toolbarResource = this._rdf.GetResource("chrome://browser/content/browser.xul#yasearch-bar");
            let currentCollapsedState = this.getRDFLiteralValue(toolbarResource, collapsedResource);
            if ((currentCollapsedState || "false").toString() != newCollapsedState) {
                this.setRDFLiteralValue(toolbarResource, collapsedResource, newCollapsedState);
                this._dataSource.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
            }
        } catch (e) {
        }
    },
    setNavBarIconSizeToSmall: function Overlay_setNavBarIconSizeToSmall() {
        try {
            let iconSizeResource = this._rdf.GetResource("iconsize");
            let toolboxResource = this._rdf.GetResource("chrome://browser/content/browser.xul#navigator-toolbox");
            let currentIconSize = (this.getRDFLiteralValue(toolboxResource, iconSizeResource) || "").toString();
            if (currentIconSize === "" || currentIconSize === "large") {
                this.setRDFLiteralValue(toolboxResource, iconSizeResource, "small");
                this._dataSource.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
                let docURL = toolboxResource.ValueUTF8.split("#")[0];
                let docResource = this._rdf.GetResource(docURL);
                let persistResource = this._rdf.GetResource("http://home.netscape.com/NC-rdf#persist");
                if (!this._dataSource.HasAssertion(docResource, persistResource, toolboxResource, true)) {
                    this._dataSource.Assert(docResource, persistResource, toolboxResource, true);
                }
            }
        } catch (e) {
            Cu.reportError(e);
        }
    }
};
