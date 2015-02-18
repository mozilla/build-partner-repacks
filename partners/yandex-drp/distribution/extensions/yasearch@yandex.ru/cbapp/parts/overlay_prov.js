"use strict";
const EXPORTED_SYMBOLS = ["overlayProvider"];
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const GLOBAL = this;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyGetter(this, "browserCustomizableUI", function () {
    try {
        return Cu.import("resource:///modules/CustomizableUI.jsm", {}).CustomizableUI;
    } catch (e) {
    }
    return null;
});
const overlayProvider = {
    init: function Overlay_init(barApplication) {
        this._application = barApplication;
        barApplication.core.Lib.sysutils.copyProperties(barApplication.core.Lib, GLOBAL);
        this._barCore = barApplication.core;
        this._logger = barApplication.getLogger("XULOverlay");
        this._commonItemPattern = new RegExp("^" + this._application.name + "\\.cb\\-(\\S+)\\-inst\\-(.+)$");
        this._application.core.protocols[this._application.name].addDataProvider(this);
        customizer.init(barApplication);
    },
    finalize: function Overlay_finalize() {
        customizer.finalize();
        this._application.core.protocols[this._application.name].removeDataProvider(this);
    },
    getContent: function Overlay_getContent(aURI) {
        try {
            if (aURI.path.toLowerCase() == "browser-overlay") {
                let contentStr = strutils.utf8Converter.ConvertFromUnicode(xmlutils.xmlSerializer.serializeToString(this._createBrowserOverlay()));
                return contentStr + strutils.utf8Converter.Finish();
            }
        } catch (e) {
            this._logger.error("Could not make browser overlay. " + strutils.formatError(e));
            this._logger.debug(e.stack);
        }
        return null;
    },
    get currentSetIds() {
        return this._readCurrentSetIds();
    },
    parseWidgetItemId: function Overlay_parseWidgetItemId(itemID, fullMode) {
        let match = itemID.match(this._commonItemPattern);
        if (match) {
            return {
                prototypeID: match[1],
                instanceID: match[2],
                isFromDefaultSet: false
            };
        }
        return null;
    },
    compileWidgetItemId: function Overlay_compileWidgetItemId(protoID, instanceID) {
        return this._application.name + ".cb-" + protoID + "-inst-" + instanceID;
    },
    widgetItemRemoved: function Overlay_widgetItemRemoved(removedInstID) {
    },
    makePaletteItem: function Overlay_makePaletteItem(doc, widgetInfo, instanceID) {
        let toolbarItem = doc.createElementNS(this._consts.STR_XUL_NS, "toolbaritem");
        toolbarItem.setAttribute("id", this.compileWidgetItemId(widgetInfo.id, instanceID));
        toolbarItem.setAttribute("cb-proto-id", widgetInfo.id);
        toolbarItem.setAttribute("cb-inst-id", instanceID);
        toolbarItem.setAttribute("cb-theme-color", "bright");
        toolbarItem.setAttribute("cb-app", this._application.name);
        toolbarItem.setAttribute("title", widgetInfo.name);
        toolbarItem.setAttribute("image", widgetInfo.iconPath ? widgetInfo.package_.resolvePath(widgetInfo.iconPath) : "");
        return toolbarItem;
    },
    genWidgetHostID: function Overlay_genWidgetHostID() {
        return this._newWEID++;
    },
    removeWidgetsFromToolbars: function Overlay_removeWidgetsFromToolbars() {
        let filterAppIds = function _filterAppIds(id) {
            return Boolean(id && this._commonItemPattern.test(id));
        }.bind(this);
        if (browserCustomizableUI) {
            browserCustomizableUI.areas.map(area => browserCustomizableUI.getWidgetIdsInArea(area)).reduce((a, b) => a.concat(b)).filter(filterAppIds).forEach(id => browserCustomizableUI.removeWidgetFromArea(id));
        }
        if ("nsIXULStore" in Ci) {
            const browserDocURI = "chrome://browser/content/browser.xul";
            const xulStore = Cc["@mozilla.org/xul/xulstore;1"].getService(Ci.nsIXULStore);
            let idsEnumerator = xulStore.getIDsEnumerator(browserDocURI);
            while (idsEnumerator.hasMore()) {
                let id = idsEnumerator.getNext();
                if (!xulStore.hasValue(browserDocURI, id, "currentset")) {
                    continue;
                }
                let currentset = xulStore.getValue(browserDocURI, id, "currentset");
                let newCurrentset = currentset.split(",").filter(id => !filterAppIds(id)).join(",");
                if (newCurrentset === currentset) {
                    continue;
                }
                xulStore.setValue(browserDocURI, id, "currentset", newCurrentset);
            }
            xulStore.removeValue(browserDocURI, this._application.name + "-bar", "currentset");
            xulStore.removeValue(browserDocURI, this._application.name + "-bar", "collapsed");
            xulStore.removeValue(browserDocURI, "navigator-toolbox", "cb-barless");
        }
        if (!LocalStoreData.localStoreFileExists) {
            return;
        }
        let allResources = LocalStoreData.getAllResources();
        while (allResources.hasMoreElements()) {
            let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
            let toolbar = res.Value;
            if (!toolbar) {
                continue;
            }
            let currentSet = LocalStoreData.getAttribute(toolbar, "currentset");
            if (!currentSet || currentSet == "__empty") {
                continue;
            }
            let newCurrentset = currentSet.split(",").filter(id => !filterAppIds(id)).join(",") || "__empty";
            if (newCurrentset === currentSet) {
                continue;
            }
            LocalStoreData.setAttribute(toolbar, "currentset", newCurrentset);
        }
        let appToolbarURIString = "chrome://browser/content/browser.xul#" + this._application.name + "-bar";
        LocalStoreData.removeAttribute(appToolbarURIString, "currentset");
        LocalStoreData.removeAttribute(appToolbarURIString, "collapsed");
        LocalStoreData.removeAttribute("chrome://browser/content/browser.xul#navigator-toolbox", "cb-barless");
    },
    returnNativeElements: function Overlay_returnNativeElements() {
        let omniboxId = "http://bar-widgets.yandex.ru/packages/approved/176/manifest.xml#smartbox";
        let omniboxQSPref = this._application.NativeComponents.makeWidgetPrefPath(omniboxId, "nativeqs.removed");
        Preferences.reset(omniboxQSPref);
        if (!browserCustomizableUI) {
            this._returnNativeElements28();
            return;
        }
        let allIds = browserCustomizableUI.areas.filter(area => area !== "PanelUI-contents").map(area => browserCustomizableUI.getWidgetIdsInArea(area)).reduce((a, b) => a.concat(b));
        let idsToInsert = [
            "home-button",
            "search-container"
        ].filter(id => allIds.indexOf(id) === -1);
        if (!idsToInsert.length) {
            return;
        }
        let insertIndex;
        [
            "bookmarks-menu-button-container",
            "bookmarks-menu-button",
            "window-controls"
        ].some(function (id) {
            let placement = browserCustomizableUI.getPlacementOfWidget(id);
            if (placement && placement.area == browserCustomizableUI.AREA_NAVBAR) {
                insertIndex = placement.position;
                return true;
            }
            return false;
        });
        idsToInsert.forEach(function (id) {
            browserCustomizableUI.addWidgetToArea(id, browserCustomizableUI.AREA_NAVBAR, insertIndex);
        });
    },
    _returnNativeElements28: function Overlay__returnNativeElements28() {
        let navToolbarURIString = "chrome://browser/content/browser.xul#nav-bar";
        let navbarCurrentset = LocalStoreData.getAttribute(navToolbarURIString, "currentset");
        if (navbarCurrentset && navbarCurrentset === "__empty") {
            return;
        }
        let ids = navbarCurrentset.split(",");
        let insertIndex = ids.indexOf("bookmarks-menu-button-container");
        if (insertIndex == -1) {
            insertIndex = ids.indexOf("window-controls");
        }
        if (insertIndex == -1) {
            insertIndex = ids.length - 1;
        }
        let currentSetsIds = this._getAllIdsFromCurrentSets();
        [
            "home-button",
            "search-container"
        ].forEach(function (id) {
            if (currentSetsIds.indexOf(id) == -1) {
                ids.splice(insertIndex, 0, id);
            }
        });
        LocalStoreData.setAttribute(navToolbarURIString, "currentset", ids.join(","));
    },
    removeToolbarsCollapsedState: function Overlay_removeToolbarsCollapsedState() {
        let allResources = LocalStoreData.getAllResources();
        while (allResources.hasMoreElements()) {
            let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
            let toolbar = res.Value;
            if (!toolbar) {
                continue;
            }
            let collapsed = LocalStoreData.getAttribute(toolbar, "collapsed");
            if (collapsed != "true") {
                continue;
            }
            LocalStoreData.removeAttribute(toolbar, "collapsed");
        }
    },
    _commonItemPattern: null,
    _DOMSerializer: null,
    _logger: null,
    _newWEID: 0,
    _consts: {
        STR_DYNBASE_PATH: "$content/overlay/dynbase.xul",
        STR_XUL_NS: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
        ERR_CREATE_ITEM: "Could not add widget palette item"
    },
    _createBrowserOverlay: function Overlay__createBrowserOverlay() {
        let start = Date.now();
        let overlayDoc = this._getOverlayBase();
        let widgetLibrary = this._application.widgetLibrary;
        let defaultPaletteItems = [];
        let widgetEntries = this._application.defaultPreset.visibleWidgetEntries;
        let defaultSetIDs = Object.create(null);
        for (let i = 0, length = widgetEntries.length; i < length; i++) {
            let widgetEntry = widgetEntries[i];
            let widgetInfo = null;
            let protoID = widgetEntry.componentID;
            try {
                widgetInfo = widgetLibrary.getWidgetInfo(protoID);
                if (widgetInfo.isUnique && protoID in defaultSetIDs) {
                    continue;
                }
            } catch (e) {
                this._logger.error(strutils.formatError(e));
                continue;
            }
            let instID = this._application.BarPlatform.getNewWidgetInstanceID();
            let item = this.makePaletteItem(overlayDoc, widgetInfo, instID);
            defaultSetIDs[protoID] = item.getAttribute("id");
        }
        let toolbarPalette = overlayDoc.getElementById("BrowserToolbarPalette");
        for (let [
                    ,
                    normalPaletteItem
                ] in Iterator(this._makePaletteItems(overlayDoc))) {
            toolbarPalette.appendChild(normalPaletteItem);
            let id = normalPaletteItem.getAttribute("id");
            let protoID = this.parseWidgetItemId(id).prototypeID;
            if (protoID in defaultSetIDs) {
                defaultSetIDs[protoID] = normalPaletteItem.getAttribute("id");
            }
        }
        let ids = [];
        for (let [
                    protoID,
                    id
                ] in Iterator(defaultSetIDs)) {
            ids.push(id);
        }
        let appToolbar = overlayDoc.getElementById(this._application.name + "-bar");
        appToolbar.setAttribute("defaultset", ids.join(","));
        appToolbar.setAttribute("cb-australis", Boolean(browserCustomizableUI));
        appToolbar.parentNode.setAttribute("cb-default-theme", this._defaultThemeActive);
        let toolbox = overlayDoc.getElementById("navigator-toolbox");
        toolbox.setAttribute("cb-os", sysutils.platformInfo.os.name);
        this._logger.debug("Overlay created in " + (Date.now() - start) + "ms");
        return overlayDoc;
    },
    _getOverlayBase: function Overlay__getOverlayBase() {
        let overlayDocChannel = this._application.addonFS.getChannel(this._consts.STR_DYNBASE_PATH);
        let originalURI = overlayDocChannel.originalURI;
        let overlayDoc = fileutils.xmlDocFromStream(overlayDocChannel.open(), originalURI, originalURI, true);
        return overlayDoc;
    },
    _makePaletteItems: function Overlay__makePaletteItems(overlayDoc) {
        let currentSetIDsData = this._readCurrentSetIds();
        let widgetLibrary = this._application.widgetLibrary;
        let paletteItems = [];
        let avaibleWidgetIDs = widgetLibrary.getAvaibleWidgetIDs();
        for (let i = 0, len = avaibleWidgetIDs.length; i < len; i++) {
            let widgetInfo = widgetLibrary.getWidgetInfo(avaibleWidgetIDs[i]);
            let isUsed = false;
            let protoInstHash = currentSetIDsData[widgetInfo.id] || null;
            if (protoInstHash) {
                isUsed = true;
                for (let [
                            ,
                            instID
                        ] in Iterator(protoInstHash)) {
                    paletteItems.push(this.makePaletteItem(overlayDoc, widgetInfo, instID));
                    this._application.BarPlatform.getNewWidgetInstanceID();
                    if (widgetInfo.isUnique) {
                        break;
                    }
                }
            }
            if (!isUsed) {
                let instID = this._application.BarPlatform.getNewWidgetInstanceID();
                paletteItems.push(this.makePaletteItem(overlayDoc, widgetInfo, instID));
            }
        }
        return paletteItems;
    },
    _readCurrentSetIds: function Overlay__readCurrentSetIds() {
        let result = {};
        let commonItemPattern = this._commonItemPattern;
        let currentSetIds = this._getAllIdsFromCurrentSets();
        for (let i = 0, len = currentSetIds.length; i < len; i++) {
            let barWidgetIDMatch = currentSetIds[i].match(commonItemPattern);
            if (barWidgetIDMatch) {
                let widgetProtoID = barWidgetIDMatch[1];
                let widgetInstance = barWidgetIDMatch[2];
                let instArray = result[widgetProtoID];
                if (!instArray) {
                    instArray = [];
                    result[widgetProtoID] = instArray;
                }
                instArray.push(widgetInstance);
            }
        }
        return result;
    },
    _getAllIdsFromCurrentSets: function Overlay__getAllIdsFromCurrentSets() {
        let result = [];
        let state;
        if (browserCustomizableUI) {
            let migratedAustralis = this._application.preferences.get("migrated.australis", false);
            try {
                state = JSON.parse(Preferences.get("browser.uiCustomization.state", "{}"));
            } catch (e) {
            }
            if (state && "placements" in state) {
                for (let [
                            ,
                            elementIds
                        ] in Iterator(state.placements)) {
                    if (Array.isArray(elementIds)) {
                        result = result.concat(elementIds);
                    }
                }
                this._application.preferences.set("migrated.australis", true);
                return result;
            }
            if (migratedAustralis) {
                return result;
            }
        }
        function _getIdsFromCurrentset(aCurrenSetString) {
            if (!aCurrenSetString || aCurrenSetString == "__empty") {
                return;
            }
            result = result.concat(aCurrenSetString.split(","));
        }
        let rdfService = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
        let localStoreDataSource;
        try {
            localStoreDataSource = rdfService.GetDataSource("rdf:local-store");
        } catch (e) {
        }
        if (localStoreDataSource) {
            let allResources = localStoreDataSource.GetAllResources();
            let currentSetResource = rdfService.GetResource("currentset");
            while (allResources.hasMoreElements()) {
                let res = allResources.getNext().QueryInterface(Ci.nsIRDFResource);
                let tool = res.Value;
                if (tool) {
                    if (tool == "chrome://browser/content/browser.xul#customToolbars") {
                        let customToolbarsResource = rdfService.GetResource(tool);
                        let index = 0;
                        let currentSetTarget;
                        do {
                            let toolbarResource = rdfService.GetResource("toolbar" + ++index);
                            currentSetTarget = localStoreDataSource.GetTarget(customToolbarsResource, toolbarResource, true);
                            if (currentSetTarget instanceof Ci.nsIRDFLiteral) {
                                let ids = currentSetTarget.Value.split(":");
                                ids.shift();
                                _getIdsFromCurrentset(ids.join(":"));
                            }
                        } while (currentSetTarget);
                    } else {
                        let toolbarResource = rdfService.GetResource(tool);
                        let currentSetTarget = localStoreDataSource.GetTarget(toolbarResource, currentSetResource, true);
                        if (currentSetTarget instanceof Ci.nsIRDFLiteral) {
                            _getIdsFromCurrentset(currentSetTarget.Value);
                        }
                    }
                }
            }
        }
        return result;
    },
    get _defaultThemeActive() {
        return Preferences.get("general.skins.selectedSkin") == "classic/1.0";
    }
};
const LocalStoreData = {
    get localStoreFileExists() {
        let localstoreFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
        localstoreFile.append("localstore.rdf");
        return localstoreFile.exists();
    },
    get _RDFService() {
        delete this._RDFService;
        return this._RDFService = Cc["@mozilla.org/rdf/rdf-service;1"].getService(Ci.nsIRDFService);
    },
    get _dataSource() {
        delete this._dataSource;
        return this._dataSource = this._RDFService.GetDataSource("rdf:local-store");
    },
    getAllResources: function LocalStoreData_getAllResources() {
        return this._dataSource.GetAllResources();
    },
    getRDFResource: function LocalStoreData_getRDFResource(aURIString) {
        return this._RDFService.GetResource(aURIString);
    },
    getRDFLiteralValue: function LocalStoreData_getRDFLiteralValue(aSource, aProperty) {
        let target = this._dataSource.GetTarget(aSource, aProperty, true);
        if (target instanceof Ci.nsIRDFLiteral) {
            return target.Value;
        }
        return null;
    },
    setRDFLiteralValue: function LocalStoreData_setRDFLiteralValue(aSource, aProperty, aTarget) {
        let oldTarget = this._dataSource.GetTarget(aSource, aProperty, true);
        try {
            if (oldTarget) {
                if (aTarget) {
                    this._dataSource.Change(aSource, aProperty, oldTarget, this._RDFService.GetLiteral(aTarget));
                } else {
                    this._dataSource.Unassert(aSource, aProperty, oldTarget);
                }
            } else {
                this._dataSource.Assert(aSource, aProperty, this._RDFService.GetLiteral(aTarget), true);
            }
        } catch (e) {
        }
    },
    getAttribute: function LocalStoreData_getAttribute(aURIString, aAttribute) {
        let value;
        let elementResource = this.getRDFResource(aURIString);
        let attributeResource = this.getRDFResource(aAttribute);
        try {
            value = this.getRDFLiteralValue(elementResource, attributeResource);
        } catch (e) {
            Cu.reportError(e);
        }
        return value;
    },
    setAttribute: function LocalStoreData_setAttribute(aURIString, aAttribute, aValue) {
        let value = aValue;
        if (value !== null) {
            value = value.toString();
        }
        let elementResource = this.getRDFResource(aURIString);
        let attributeResource = this.getRDFResource(aAttribute);
        try {
            let currentValue = this.getRDFLiteralValue(elementResource, attributeResource);
            if (currentValue === null) {
                if (value === null) {
                    return;
                }
            } else {
                if (currentValue.toString() === value) {
                    return;
                }
            }
            this.setRDFLiteralValue(elementResource, attributeResource, value);
            this.flush();
        } catch (e) {
            Cu.reportError(e);
        }
    },
    removeAttribute: function LocalStoreData_removeAttribute(aURIString, aAttribute) {
        this.setAttribute(aURIString, aAttribute, null);
    },
    flush: function LocalStoreData_flush() {
        this._dataSource.QueryInterface(Ci.nsIRDFRemoteDataSource).Flush();
    }
};
const customizer = {
    init: function customizer_init(barApplication) {
        this._application = barApplication;
        this._logger = this._application.getLogger("Customizer");
        if (browserCustomizableUI) {
            browserCustomizableUI.addListener(this);
            this.AREA_NAVBAR = browserCustomizableUI.AREA_NAVBAR;
        }
    },
    finalize: function customizer_finalize() {
        if (browserCustomizableUI) {
            browserCustomizableUI.removeListener(this);
        }
        this._logger = null;
        this._application = null;
    },
    AREA_NAVBAR: "nav-bar",
    onWidgetRemoved: function customizer_onWidgetRemoved(aWidgetId, aArea) {
        let info = overlayProvider.parseWidgetItemId(aWidgetId, true);
        if (!info) {
            return;
        }
        new this._application.core.Lib.sysutils.Timer(function () {
            if (!this._application) {
                return;
            }
            if (browserCustomizableUI.getPlacementOfWidget(aWidgetId)) {
                return;
            }
            let instanceID = info.instanceID;
            let controllerName = this._application.name + "OverlayController";
            this._application.core.Lib.misc.getBrowserWindows().forEach(function (window) {
                let windowController = window[controllerName];
                if (windowController) {
                    windowController.callToolbarElementDestructor(instanceID);
                }
            });
        }.bind(this), 0);
    },
    onAreaReset: function customizer_onAreaReset(aArea, aContainer) {
        if (aArea !== this.AREA_NAVBAR) {
            return;
        }
        try {
            let window = aContainer.ownerDocument.defaultView;
            let toolbox = window.document.getElementById("navigator-toolbox");
            if (toolbox) {
                toolbox.removeAttribute("cb-barless");
            }
            let windowController = window[this._application.name + "OverlayController"];
            windowController.checkNeedSetBarlessMode();
        } catch (e) {
            this._logger.error(e);
        }
    },
    onCustomizeStart: function customizer_onCustomizeStart(aWindow) {
        let prefsWindow = this._application.core.Lib.misc.getTopWindowOfType(this._application.name + ":Preferences");
        if (prefsWindow) {
            prefsWindow.document.documentElement.cancelDialog();
        }
    }
};
