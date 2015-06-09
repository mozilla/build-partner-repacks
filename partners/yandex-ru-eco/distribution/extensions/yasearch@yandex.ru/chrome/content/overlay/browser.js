(function () {
    "use strict";
    const APP_NAME = CB_APP_NAME;
    const KNOWN_BROWSER_TOOLBAR_IDS = {
        "toolbar-menubar": 1,
        "nav-bar": 1,
        PersonalToolbar: 1,
        TabsToolbar: 1,
        "addon-bar": 1,
        "devtools-sidebar-toolbar": 1,
        "inspector-toolbar": 1
    };
    Object.freeze(KNOWN_BROWSER_TOOLBAR_IDS);
    let {
        classes: Cc,
        interfaces: Ci
    } = Components;
    Cu.import("resource://gre/modules/Services.jsm");
    const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    function OverlayController() {
        this._barCore = Cc["@yandex.ru/custombarcore;" + this._appName].getService().wrappedJSObject;
        this._application = this._barCore.application;
        this._logger = this._application.getLogger("OverlayController");
        this._urlBarItems = Object.create(null);
        this._loadedStylesheets = Object.create(null);
        this._windowDataIsland = Object.create(null);
        window.addEventListener("DOMContentLoaded", this, false);
    }
    OverlayController.prototype = {
        get window() {
            return window;
        },
        get appToolbar() {
            return this._appToolbar;
        },
        get navToolbar() {
            return document.getElementById("nav-bar");
        },
        get chevronButton() {
            return document.getElementById(this._appName + "-toggle-barless-button");
        },
        get windowListener() {
            return this._windowListener;
        },
        get application() {
            return this._application;
        },
        get widgetHost() {
            return this._widgetHost;
        },
        get windowDataIsland() {
            return this._windowDataIsland;
        },
        get browserThemeConsumer() {
            return this._browserThemeConsumer;
        },
        get browserCustomizableUI() {
            let browserCustomizableUI = null;
            try {
                browserCustomizableUI = Cu.import("resource:///modules/CustomizableUI.jsm", {}).CustomizableUI;
            } catch (e) {
            }
            this.__defineGetter__("browserCustomizableUI", () => browserCustomizableUI);
            return this.browserCustomizableUI;
        },
        get australisUI() {
            let australisUI = Boolean(this.browserCustomizableUI);
            this.__defineGetter__("australisUI", () => australisUI);
            return this.australisUI;
        },
        applyPreset: function WndCtrl_applyPreset(preset, applyMode, forceSettings, ignoreWidgetErrors) {
            if (this.australisUI) {
                this.browserCustomizableUI.beginBatchUpdate();
            }
            try {
                this._applyPreset(preset, applyMode, forceSettings, ignoreWidgetErrors);
            } finally {
                if (this.australisUI) {
                    this.browserCustomizableUI.endBatchUpdate();
                }
            }
        },
        _applyPreset: function WndCtrl__applyPreset(preset, applyMode, forceSettings, ignoreWidgetErrors) {
            const validModes = {
                __proto__: null,
                hard: 1,
                soft: 1,
                order: 1,
                addleft: 1,
                addright: 1
            };
            const sysutils = this._barCore.Lib.sysutils;
            const strutils = this._barCore.Lib.strutils;
            if (!(preset instanceof this._application.BarPlatform.Preset)) {
                throw new this._barCore.Lib.CustomErrors.EArgType("preset", "Preset", preset);
            }
            if (!(applyMode in validModes)) {
                throw new this._barCore.Lib.CustomErrors.EArgRange("applyMode", "'hard', 'soft', 'order', 'addleft', 'addright'", applyMode);
            }
            let isAddMode = applyMode == "addleft" || applyMode == "addright";
            this._logger.debug(strutils.formatString("Applying preset '%1' in '%2' mode. Force: %3", [
                preset.address,
                applyMode,
                forceSettings
            ]));
            const widgetLibrary = this._application.widgetLibrary;
            const thisToolbar = this._appToolbar;
            let sourceToolbars = Object.create(null);
            sourceToolbars[thisToolbar.id] = thisToolbar;
            let lastPlacedElement;
            let pivotElement = isAddMode ? null : thisToolbar.firstChild;
            const controller = this;
            let reuseLists = Object.create(null);
            function findReusableItems(widgetID) {
                return reuseLists[widgetID] || (reuseLists[widgetID] = controller.getWidgetItems(widgetID));
            }
            for (let [
                        ,
                        widgetEntry
                    ] in Iterator(preset.visibleWidgetEntries)) {
                try {
                    let widgetID = widgetEntry.componentID;
                    let widget;
                    let widgetItem;
                    let sourceToolbar;
                    this._logger.debug("Processing widget entry " + widgetID);
                    if (isAddMode) {
                        [
                            widgetItem,
                            widget,
                            sourceToolbar
                        ] = this._placeAnyWidget(widgetID, thisToolbar, pivotElement, false);
                    } else {
                        let widgetInfo = widgetLibrary.isKnownWidget(widgetID) && widgetLibrary.getWidgetInfo(widgetID);
                        let reusedItems;
                        if (widgetInfo && !widgetInfo.isUnique) {
                            reusedItems = findReusableItems(widgetID);
                        }
                        [
                            widgetItem,
                            widget,
                            sourceToolbar
                        ] = this._placeAnyWidget(widgetID, thisToolbar, pivotElement, false, reusedItems);
                        lastPlacedElement = widgetItem;
                    }
                    if (sourceToolbar) {
                        sourceToolbars[sourceToolbar.id] = sourceToolbar;
                    }
                    if (widgetItem) {
                        pivotElement = widgetItem.nextSibling;
                    }
                    let justCreated = Boolean(widgetItem && !sourceToolbar);
                    if (applyMode == "hard" || justCreated) {
                        let entrySettings = widgetEntry.settings;
                        if (widget && entrySettings) {
                            widget.applySettings(entrySettings, true);
                        }
                    } else if (forceSettings) {
                        let forcedSettings = widgetEntry.forcedSettings;
                        if (sysutils.isEmptyObject(forcedSettings)) {
                            continue;
                        }
                        if (!widget) {
                            let widgetItems = findReusableItems(widgetID);
                            widgetItem = widgetItems.shift();
                            if (!widgetItem) {
                                this._logger.warn("Can't force settings. Widget not found: " + widgetID);
                                continue;
                            }
                            widget = this._widgetHost.getWidget(widgetItem.wdgtInstanceID);
                        }
                        widget.applySettings(forcedSettings, true);
                    }
                } catch (e) {
                    if (!ignoreWidgetErrors) {
                        throw e;
                    }
                    this._logger.error("Could not put preset widget to the toolbar. " + strutils.formatError(e));
                    this._logger.debug(e.stack);
                }
            }
            if (applyMode == "hard" || applyMode == "soft") {
                let next;
                while (next = lastPlacedElement && lastPlacedElement.nextSibling) {
                    this.removeItem(next, true);
                }
            }
            for (let [
                        ,
                        toolbar
                    ] in Iterator(sourceToolbars)) {
                this._persistToolbarSet(toolbar);
            }
        },
        placeWidgets: function WndCtrl_placeWidgets(widgetEnties) {
            if (!Array.isArray(widgetEnties)) {
                throw new this._barCore.Lib.CustomErrors.EArgType("widgetEnties", "Array", widgetEnties);
            }
            if (!widgetEnties.length) {
                return;
            }
            let relativeElement = this.getWidgetItems(null, this.navToolbar.id).pop();
            if (!relativeElement) {
                let urlBarContainer = document.getElementById("urlbar-container");
                if (urlBarContainer) {
                    relativeElement = urlBarContainer;
                    [
                        "reload-button",
                        "stop-button"
                    ].forEach(function (mergedBtnID) {
                        let next = relativeElement.nextSibling;
                        if (next && next.getAttribute("id") == mergedBtnID) {
                            relativeElement = next;
                        }
                    });
                } else {
                    relativeElement = this.navToolbar.lastChild;
                }
            }
            widgetEnties.reverse();
            let modifiedToolbars = Object.create(null);
            for (let i = 0, len = widgetEnties.length; i < len; i++) {
                let widgetEntry = widgetEnties[i];
                if (widgetEntry.enabled != widgetEntry.ENABLED_YES) {
                    continue;
                }
                try {
                    let [
                        widget,
                        toolbarItem,
                        sourceToolbar
                    ] = this.placeWidget(widgetEntry.componentID, relativeElement, true, "sourceToolbar");
                    if (widget && widgetEntry.settings) {
                        widget.applySettings(widgetEntry.settings, true);
                    }
                    if (sourceToolbar) {
                        modifiedToolbars[sourceToolbar.id] = sourceToolbar;
                    }
                } catch (e) {
                    this._logger.error("Could not place WidgetEntry '" + widgetEntry.componentID + "'. " + e);
                }
            }
            modifiedToolbars[this.navToolbar.id] = this.navToolbar;
            for (let [
                        ,
                        toolbar
                    ] in Iterator(modifiedToolbars)) {
                this._persistToolbarSet(toolbar);
            }
        },
        placeWidget: function WndCtrl_placeWidget(widgetID, relativeTo, placeAfter, autoPersist, failUniqueExists, reuseItems) {
            const possibleAutoPersistValues = {
                __proto__: null,
                no: 1,
                sourceToolbar: 1,
                all: 1
            };
            autoPersist = autoPersist || "all";
            if (!(autoPersist in possibleAutoPersistValues)) {
                throw new this._barCore.Lib.CustomErrors.EArgRange("autoPersist", "'no', 'sourceToolbar', 'all'", autoPersist);
            }
            let [
                pivotElement,
                destToolbar
            ] = this._determineItemDestination(relativeTo, placeAfter);
            let [
                toolbarItem,
                widget,
                sourceToolbar
            ] = this._placeAnyWidget(widgetID, destToolbar, pivotElement, failUniqueExists, reuseItems);
            if (sourceToolbar && autoPersist !== "no" && sourceToolbar !== destToolbar) {
                this._persistToolbarSet(sourceToolbar);
            }
            if (autoPersist == "all") {
                this._persistToolbarSet(destToolbar);
            }
            return [
                widget,
                toolbarItem,
                sourceToolbar
            ];
        },
        removeItem: function WndCtrl_removeItem(DOMElementOrWidgetInstanceID, dontPersist) {
            let widgetElement;
            if (DOMElementOrWidgetInstanceID instanceof Ci.nsIDOMElement) {
                widgetElement = DOMElementOrWidgetInstanceID;
            } else if (typeof DOMElementOrWidgetInstanceID == "string") {
                widgetElement = this._widgetHost.getToolbarElement(DOMElementOrWidgetInstanceID);
            } else {
                throw new TypeError("Widget DOM element or instance ID string required");
            }
            let toolbar = widgetElement.parentNode;
            if (this.australisUI) {
                this.browserCustomizableUI.removeWidgetFromArea(widgetElement.id);
                return toolbar;
            }
            let palette = this._toolbox.palette;
            let widgetLibrary = this._application.widgetLibrary;
            if (widgetElement.wdgtIsPlatformWidget) {
                if (widgetLibrary.isKnownWidget(widgetElement.wdgtPrototypeID) && widgetElement.wdgtIsUnique) {
                    let widgetInfo = widgetLibrary.getWidgetInfo(widgetElement.wdgtPrototypeID);
                    let paletteItem = this._application.overlayProvider.makePaletteItem(document, widgetInfo, 0);
                    if (!palette.getElementsByAttribute("id", paletteItem.id).length) {
                        palette.appendChild(paletteItem);
                    }
                }
                widgetElement.wdgtKill();
                toolbar.removeChild(widgetElement);
            } else {
                widgetElement = toolbar.removeChild(widgetElement);
                if ([
                        "toolbarseparator",
                        "toolbarspacer",
                        "toolbarspring"
                    ].indexOf(widgetElement.localName) === -1) {
                    if (!palette.getElementsByAttribute("id", widgetElement.id).length) {
                        palette.appendChild(widgetElement);
                    }
                }
            }
            if (!dontPersist) {
                this._persistToolbarSet(toolbar);
            }
            return toolbar;
        },
        removeWidgetsOfProto: function WndCtrl_removeWidgetsOfProto(protoID, fromToolbarID) {
            let toolbarItems = this.getWidgetItems(protoID, fromToolbarID);
            for (let i = toolbarItems.length; i--;) {
                this.removeItem(toolbarItems[i]);
            }
        },
        removeItemById: function WndCtrl_removeItemById(aDOMElementId, aDontPersist) {
            this.removeItem(document.getElementById(aDOMElementId), aDontPersist);
        },
        putElement: function WndCtrl_putElement(DOMElement, destToolbar, putBeforeElement) {
            return this._putElement(DOMElement, destToolbar, putBeforeElement);
        },
        checkNeedSetBarlessMode: function WndCtrl_checkNeedSetBarlessMode() {
            if (this._toolbox.hasAttribute("cb-barless")) {
                return;
            }
            let checker = () => {
                if (checker.timeout < 3 * 60 * 1000) {
                    for (let widgetItem of this.getAllWidgetItems()) {
                        if (!Boolean(widgetItem.wdgtConstructed)) {
                            checker.timeout += checker.timeout;
                            setTimeout(checker, checker.timeout);
                            return;
                        }
                    }
                }
                this._toolbox.setAttribute("cb-barless", "true");
                this._logger.debug("Activating barless mode...");
                try {
                    this._moveToNavBar();
                    this._moveLogoWidget();
                    this._removeObsoleteElements();
                    this._persistToolbarSet(this.navToolbar);
                    if (!this._appToolbar.collapsed && !this._appToolbar.hasChildNodes()) {
                        this._appToolbar.collapsed = true;
                        document.persist(this._appToolbar.id, "collapsed");
                    }
                } catch (e) {
                    this._logger.error("Could not activate barless mode. " + e);
                    this._logger.debug(e.stack);
                }
            };
            checker.timeout = 500;
            checker();
        },
        callToolbarElementDestructor: function WndCtrl_callToolbarElementDestructor(widgetIID) {
            let element = this._widgetHost.hasWidget(widgetIID) && this._widgetHost.getToolbarElement(widgetIID);
            if (element && "wdgtWidgetRemoved" in element) {
                element.wdgtWidgetRemoved(this, true);
            }
        },
        _moveToNavBar: function WndCtrl__moveToNavBar() {
            this._logger.config("Moving items to nav-bar");
            this._logger.debug("My toolbar contents: " + this.getAllWidgetItems().map(item => item.getAttribute("id")));
            let urlBarContainer = document.getElementById("urlbar-container");
            let relativeElement = urlBarContainer;
            if (urlBarContainer) {
                [
                    "reload-button",
                    "stop-button"
                ].forEach(function (mergedBtnID) {
                    let next = relativeElement.nextSibling;
                    if (next && next.getAttribute("id") == mergedBtnID) {
                        relativeElement = next;
                    }
                });
            }
            let findReusableItems = function findReusableItems(reuseLists, widgetID) {
                return reuseLists[widgetID] || (reuseLists[widgetID] = this.getWidgetItems(widgetID));
            }.bind(this, {});
            let tryPlaceWidget = function tryPlaceWidget(widgetEntry) {
                try {
                    let reusableItems = findReusableItems(widgetEntry.componentID);
                    let numFoundWidgets = reusableItems.length;
                    let widget;
                    [
                        widget,
                        relativeElement
                    ] = this.placeWidget(widgetEntry.componentID, relativeElement, true, "sourceToolbar", false, reusableItems);
                    let widgetWasReused = numFoundWidgets > reusableItems.length;
                    let settingsToApply = widgetWasReused ? widgetEntry.forcedSettings : widgetEntry.settings;
                    if (widget && settingsToApply) {
                        widget.applySettings(settingsToApply, true);
                    }
                    return true;
                } catch (e) {
                    this._logger.warn("Could not place widget " + widgetEntry.componentID + ". " + e);
                    this._logger.debug(e.stack);
                }
                return false;
            }.bind(this);
            this._logger.debug("Moving all important visible widgets first...");
            this.application.defaultPreset.visibleWidgetEntries.forEach(function (widgetEntry) {
                if (widgetEntry.isImportant) {
                    tryPlaceWidget(widgetEntry);
                }
            });
        },
        _moveLogoWidget: function WndCtrl__moveLogoWidget() {
            let insertArea = this.navToolbar;
            if (!insertArea) {
                return;
            }
            let logoItem = this.getWidgetItems("http://bar.yandex.ru/packages/yandexbar#logo")[0];
            if (!logoItem) {
                return;
            }
            if (this.australisUI && insertArea.firstChild) {
                insertArea = insertArea.firstChild;
            }
            this._putElement(logoItem, insertArea, insertArea.firstChild || null);
        },
        _removeObsoleteElements: function WndCtrl__removeObsoleteElements() {
            const omniboxId = "http://bar-widgets.yandex.ru/packages/approved/176/manifest.xml#smartbox";
            let omniboxQSPref = this._application.NativeComponents.makeWidgetPrefPath(omniboxId, "nativeqs.removed");
            this._application.core.Lib.Preferences.reset(omniboxQSPref);
            try {
                let omniboxPlugin = this._application.widgetLibrary.getPlugin(omniboxId);
                if (omniboxPlugin && omniboxPlugin.enabled) {
                    omniboxPlugin.nativeModule.core._removeBrowserSearchContainer();
                }
            } catch (e) {
                this._logger.error(e);
            }
            let disabledBarlessElements = ["http://bar.yandex.ru/packages/yandexbar#search"];
            disabledBarlessElements.forEach(protoId => this.removeWidgetsOfProto(protoId), this);
            let navbar = this.navToolbar;
            if (!navbar) {
                return;
            }
            let elementIdsToRemove = ["home-button"];
            elementIdsToRemove.forEach(function (elementId) {
                let existElement = document.getElementById(elementId);
                if (!existElement) {
                    return;
                }
                let parent = existElement.parentNode;
                while (parent && parent !== navbar) {
                    parent = parent.parentNode;
                }
                if (!parent) {
                    return;
                }
                if (this.australisUI && elementId === "home-button") {
                    let area = "PanelUI-contents";
                    let position;
                    let placement = this.browserCustomizableUI.getPlacementOfWidget("new-window-button");
                    if (placement && placement.area === area) {
                        position = placement.position;
                    }
                    this.browserCustomizableUI.addWidgetToArea(elementId, area, position);
                } else {
                    this.removeItem(existElement);
                }
            }, this);
        },
        clearToolbar: function WndCtrl_clearToolbar() {
            Array.slice(this._appToolbar.childNodes).forEach(function (item) {
                if (!this._isPermanetToolbarItem(item)) {
                    this.removeItem(item, true);
                }
            }, this);
            this._persistToolbarSet(this._appToolbar);
        },
        updatePalette: function WndCtrl_updatePalette(packageIDs) {
            if (!Array.isArray(packageIDs)) {
                throw new this._barCore.Lib.CustomErrors.EArgType("packageIDs", "Array", packageIDs);
            }
            let palette = this._toolbox.palette;
            let items = palette.querySelectorAll("toolbaritem[cb-app=\"" + this._appName + "\"]");
            for (let i = items.length; i--;) {
                let item = items.item(i);
                let protoID = item.getAttribute("cb-proto-id");
                let [
                    packageID,
                    compName
                ] = this._application.BarPlatform.parseComponentID(protoID);
                let itemInfo = this._application.overlayProvider.parseWidgetItemId(item.id);
                let isNewPackage = packageIDs.indexOf(packageID) >= 0;
                if (!isNewPackage) {
                    continue;
                }
                if (itemInfo.isFromDefaultSet) {
                    continue;
                }
                if (this._application.widgetLibrary.isKnownWidget(protoID)) {
                    continue;
                }
                item.parentNode.removeChild(item);
            }
            for (let idIndex = 0, idsLength = packageIDs.length; idIndex < idsLength; idIndex++) {
                let packageID = packageIDs[idIndex];
                let widgetsInfo = this._application.widgetLibrary.getWidgetsInfo(packageID);
                for (let i = 0, len = widgetsInfo.length; i < len; i++) {
                    let widgetInfo = widgetsInfo[i];
                    if (document.querySelector("[cb-proto-id=\"" + widgetInfo.id + "\"]")) {
                        continue;
                    }
                    let widgetItem = this._application.overlayProvider.makePaletteItem(document, widgetInfo, 0);
                    palette.appendChild(widgetItem);
                }
            }
        },
        appendToPalette: function WndCtrl_appendToPalette(newWidgetIDs) {
            let palette = this._toolbox.palette;
            newWidgetIDs.forEach(function (widgetID) {
                let widgetInfo = this._application.widgetLibrary.getWidgetInfo(widgetID);
                let widgetItem = this._application.overlayProvider.makePaletteItem(document, widgetInfo, 0);
                palette.appendChild(widgetItem);
            }, this);
        },
        switchWidgets: function WndCtrl_switchWidgets(packageID, on) {
            let widgetItems = this.getWidgetItemsByPackage(packageID);
            for (let i = widgetItems.length; i--;) {
                try {
                    widgetItems[i].wdgtSwitchOn(on);
                } catch (e) {
                    this._logger.error("Could not switch widget. " + this._barCore.Lib.strutils.formatError(e));
                }
            }
        },
        getWidgetItems: function WndCtrl_getWidgetItems(protoID, fromToolbarID) {
            let selector = (fromToolbarID ? "#" + fromToolbarID + " " : "*:not(toolbarpalette) ") + "toolbaritem[cb-app=\"" + this._appName + "\"]" + (protoID ? "[cb-proto-id=\"" + protoID + "\"]" : "");
            return Array.slice(document.querySelectorAll(selector));
        },
        getAllWidgetItems: function WndCtrl_getAllWidgetItems() {
            return Array.slice(document.querySelectorAll("toolbaritem[cb-app='" + this._appName + "']"));
        },
        getWidgetItemsByPackage: function WndCtrl_getWidgetItemsByPackage(packageID) {
            let windowItems = this.getWidgetItems();
            if (!packageID) {
                return windowItems;
            }
            return windowItems.filter(function filterByPkgID(item) {
                return item.wdgtIsPlatformWidget && item.wdgtPrototypeID.indexOf(packageID) === 0;
            });
        },
        get knownBrowserToolbarIDs() {
            return KNOWN_BROWSER_TOOLBAR_IDS;
        },
        getAlienToolbars: function WndCtrl_getAlienToolbars(includeOwnToolbar) {
            let allToolbars = Array.slice(document.querySelectorAll("#navigator-toolbox toolbar"));
            return allToolbars.filter(function alienToolbarFilter(toolbar) {
                let tbID = toolbar.getAttribute("id");
                let bTbHidden = toolbar.getAttribute("hidden") == "true";
                return !(tbID in KNOWN_BROWSER_TOOLBAR_IDS) && (includeOwnToolbar || tbID != this._toolbarID) && !bTbHidden;
            }.bind(this));
        },
        widgetIsAlwaysVisible: function WndCtrl_widgetIsAlwaysVisible(widgetItem) {
            let widgetParent = widgetItem.parentNode;
            let parentToolbar = widgetParent && widgetParent.localName == "toolbar" && widgetParent;
            return !parentToolbar || parentToolbar.getAttribute("id") in KNOWN_BROWSER_TOOLBAR_IDS;
        },
        requireStylesheet: function WndCtrl_requireStylesheet(stylesheetURL) {
            let ssUseInfo = this._loadedStylesheets[stylesheetURL];
            if (!ssUseInfo) {
                let stylesheet = this._nativeStylesElement.sheet;
                let i = stylesheet.insertRule("@import url('" + stylesheetURL + "');", stylesheet.cssRules.length);
                this._loadedStylesheets[stylesheetURL] = ssUseInfo = {
                    cssRule: stylesheet.cssRules.item(i),
                    users: 0
                };
            }
            ssUseInfo.users++;
        },
        stylesheetNotNeeded: function WndCtrl_stylesheetNotNeeded(stylesheetURL) {
            let ssUseInfo = this._loadedStylesheets[stylesheetURL];
            if (!ssUseInfo) {
                return;
            }
            ssUseInfo.users--;
            if (ssUseInfo.users < 1) {
                let cssRule = ssUseInfo.cssRule;
                let parentStyleSheet = cssRule.parentStyleSheet;
                let parentRules = parentStyleSheet.cssRules;
                cssRule.styleSheet.disabled = true;
                for (let i = 0, len = parentRules.length; i < len; i++) {
                    if (cssRule === parentRules.item(i)) {
                        parentStyleSheet.deleteRule(i);
                        break;
                    }
                }
                delete this._loadedStylesheets[stylesheetURL];
            }
        },
        handleEvent: function WndCtrl_handleEvent(event) {
            switch (event.type) {
            case "DOMContentLoaded":
                this._onContentReady(event);
                break;
            case "load":
                this._onOverlayLoaded();
                break;
            case "unload":
                this._onOverlayUnload();
                break;
            }
        },
        observe: function WndCtrl_observe(subject, topic, data) {
            switch (topic) {
            case this._barCore.eventTopics.EVT_PLUGIN_ENABLED:
                this._tryApplyPluginResources(subject.wrappedJSObject);
                break;
            case this._barCore.eventTopics.EVT_PLUGIN_BEFORE_DISABLED:
                this._tryRevertPluginResources(subject.wrappedJSObject);
                break;
            default:
                this._logger.warn("Unexpected notification: " + [
                    subject,
                    topic,
                    data
                ]);
            }
        },
        _appName: APP_NAME,
        _barCore: null,
        _application: null,
        _logger: null,
        _widgetHost: null,
        _urlBarItems: null,
        _urlBarContainer: null,
        _nativeStylesElement: null,
        get _toolbarID() {
            return this._application.name + "-bar";
        },
        _isPermanetToolbarItem: function WndCtrl__isPermanetToolbarItem(node) {
            let importantComponentIDs = this._application.defaultPreset.importantComponentIDs;
            if (node.getAttribute("cb-app") == this._application.name) {
                let importantEntry = importantComponentIDs[node.getAttribute("cb-proto-id")];
                if (importantEntry && importantEntry.enabled == importantEntry.ENABLED_YES) {
                    return true;
                }
            }
            return false;
        },
        _boundDelayedStartup: null,
        _cancelDelayedStartup: function WndCtrl__cancelDelayedStartup() {
            window.removeEventListener("MozAfterPaint", this._boundDelayedStartup);
            this._boundDelayedStartup = null;
        },
        _delayedStartup: function WndCtrl__delayedStartup() {
            this._cancelDelayedStartup();
            this._nativeStylesElement = document.createElementNS("http://www.w3.org/1999/xhtml", "style");
            this._nativeStylesElement.setAttribute("id", this._appName + "-native-stylesheets");
            document.documentElement.appendChild(this._nativeStylesElement);
            this._browserThemeConsumer = this._application.browserTheme.createConsumer(window);
            let urlBarIcons = document.getElementById("urlbar-icons");
            if (urlBarIcons) {
                this._urlBarContainer = document.createElementNS(urlBarIcons.namespaceURI, "hbox");
                this._urlBarContainer.setAttribute("id", this._appName + "-urlbar-icons");
                urlBarIcons.appendChild(this._urlBarContainer);
            } else {
                this._logger.warn("Can't find 'urlbar-icons' container.");
            }
            let activePlugins = this._application.widgetLibrary.getPlugins(undefined, true);
            for (let i = activePlugins.length; i--;) {
                this._logger.debug("Try apply plugin resources: " + activePlugins[i].id);
                this._tryApplyPluginResources(activePlugins[i]);
            }
            Services.obs.addObserver(this, this._barCore.eventTopics.EVT_PLUGIN_ENABLED, false);
            Services.obs.addObserver(this, this._barCore.eventTopics.EVT_PLUGIN_BEFORE_DISABLED, false);
            setTimeout(() => {
                document.documentElement.setAttribute("cb-window-initialized", "true");
                this._application.onNewBrowserReady(this);
                this.checkNeedSetBarlessMode();
            }, 100);
        },
        _onContentReady: function WndCtrl__onContentReady() {
            window.removeEventListener("DOMContentLoaded", this, false);
            let chromehiddenAttrVal = document.documentElement.getAttribute("chromehidden");
            if (chromehiddenAttrVal.match(/\btoolbar\b/i)) {
                return;
            }
            this._windowListener = new this._barCore.Lib.WindowListener(window, this._appName, this._application.getLogger("WindowListener"));
            this._widgetHost = new WidgetHost(this);
            window.addEventListener("load", this, false);
        },
        _onOverlayLoaded: function WndCtrl__onOverlayLoaded(loadEvent) {
            this._logger.config("Overlay loaded");
            window.removeEventListener("load", this, false);
            window.addEventListener("unload", this, false);
            this._boundDelayedStartup = this._delayedStartup.bind(this);
            window.addEventListener("MozAfterPaint", this._boundDelayedStartup);
        },
        _onOverlayUnload: function WndCtrl__onOverlayUnload() {
            this._logger.info("Overlay unloads");
            window.removeEventListener("unload", this, false);
            this._widgetHost.clear();
            if (this._boundDelayedStartup) {
                this._cancelDelayedStartup();
                return;
            }
            Services.obs.removeObserver(this, this._barCore.eventTopics.EVT_PLUGIN_ENABLED);
            Services.obs.removeObserver(this, this._barCore.eventTopics.EVT_PLUGIN_BEFORE_DISABLED);
            let activePlugins = this._application.widgetLibrary.getPlugins(undefined, true);
            for (let i = activePlugins.length; i--;) {
                this._logger.trace("Try revert plugin resources: " + activePlugins[i].id);
                this._tryRevertPluginResources(activePlugins[i]);
            }
            window.document.documentElement.removeChild(this._nativeStylesElement);
            this._loadedStylesheets = Object.create(null);
            this._windowDataIsland = Object.create(null);
            this._browserThemeConsumer.destroy();
            this._browserThemeConsumer = null;
        },
        _persistToolbarSet: function WndCtrl__persistToolbarSet(toolbar) {
            toolbar.setAttribute("currentset", toolbar.currentSet);
            document.persist(toolbar.id, "currentset");
        },
        _tryApplyPluginResources: function WndCtrl__tryApplyPluginResources(plugin) {
            try {
                plugin.browserStyles.forEach(function (styleURL) {
                    this.requireStylesheet(styleURL);
                }, this);
                plugin.urlBarItems.forEach(function (itemInfo) {
                    this._putURLBarItem(plugin, itemInfo.name, itemInfo.priority);
                }, this);
            } catch (e) {
                let strutils = this._barCore.Lib.strutils;
                this._logger.error(strutils.formatString("Could not apply plugin resources (%1). %2", [
                    plugin.id,
                    strutils.formatError(e)
                ]));
                this._logger.debug(e.stack);
            }
        },
        _tryRevertPluginResources: function WndCtrl__tryRevertPluginResources(plugin) {
            try {
                plugin.browserStyles.forEach(function (styleURL) {
                    this.stylesheetNotNeeded(styleURL);
                }, this);
                this._removePluginURLBarItems(plugin);
            } catch (e) {
                let strutils = this._barCore.Lib.strutils;
                this._logger.error(strutils.formatString("Could not revert plugin resources (%1). %2", [
                    plugin.id,
                    strutils.formatError(e)
                ]));
            }
        },
        _putURLBarItem: function WndCtrl__putURLBarItem(plugin, itemName, priority) {
            if (!this._urlBarContainer) {
                this._logger.warn("Can't find 'urlbar-icons' container.");
                return;
            }
            let itemID = plugin.id + "-" + itemName;
            let item = document.getElementById(itemID);
            if (item) {
                return;
            }
            item = document.createElementNS(XULNS, "hbox");
            item.setAttribute("id", itemID);
            item.setAttribute("cb-proto-id", plugin.id);
            item.setAttribute("cb-app", this._appName);
            let insertBefore = null;
            let urlBarElements = this._urlBarContainer.childNodes;
            for (let i = 0, len = urlBarElements.length; i < len; i++) {
                let urlBarElement = urlBarElements.item(i);
                let itemInfo = this._urlBarItems[urlBarElement.getAttribute("id")];
                if (!itemInfo) {
                    continue;
                }
                if (priority <= itemInfo.priority) {
                    insertBefore = urlBarElement;
                    break;
                }
            }
            this._urlBarContainer.insertBefore(item, insertBefore);
            try {
                let itemHandler = plugin.initURLBarItem(item, itemName);
                this._urlBarItems[itemID] = {
                    name: itemName,
                    ownerID: plugin.id,
                    priority: priority,
                    domElement: item,
                    handler: itemHandler
                };
            } catch (e) {
                this._logger.error("Could not init URL bar element handler. " + this._barCore.Lib.strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        },
        _removePluginURLBarItems: function WndCtrl__removePluginURLBarItems(plugin) {
            for (let itemID in this._urlBarItems) {
                let itemInfo = this._urlBarItems[itemID];
                if (!itemInfo || itemInfo.ownerID != plugin.id) {
                    continue;
                }
                try {
                    itemInfo.handler.finalize();
                } catch (e) {
                    this._logger.error("URLBar item handler finalize method failed. " + this._barCore.Lib.strutils.formatError(e));
                } finally {
                    this._urlBarItems[itemID] = undefined;
                    let item = itemInfo.domElement;
                    item.parentNode.removeChild(item);
                }
            }
        },
        get _toolbox() {
            return document.getElementById("navigator-toolbox");
        },
        get _appToolbar() {
            return document.getElementById(this._toolbarID);
        },
        _determineItemDestination: function WndCtrl__determineItemDestination(relativeTo, placeAfter) {
            let pivotElement;
            let destToolbar;
            if (relativeTo) {
                let relativeToElement;
                if (relativeTo instanceof Ci.nsIDOMNode) {
                    let relParent = relativeTo.parentNode;
                    if (!relParent || typeof relParent.insertItem != "function") {
                        throw new Error("Invalid relative element or its parent: " + relativeTo.nodeName);
                    }
                    relativeToElement = relativeTo;
                } else {
                    relativeToElement = this._widgetHost.getToolbarElement(relativeTo.id);
                }
                pivotElement = placeAfter ? relativeToElement.nextSibling : relativeToElement;
                destToolbar = relativeToElement.parentNode;
            } else {
                destToolbar = this._appToolbar;
            }
            return [
                pivotElement,
                destToolbar
            ];
        },
        _placeAnyWidget: function WndCtrl__placeAnyWidget(widgetID, destToolbar, pivotElement, failUniqueExists, reuseItems) {
            if (failUniqueExists && (!reuseItems || !reuseItems.length) && this._application.widgetLibrary.getWidgetInfo(widgetID).isUnique && this.getWidgetItems(widgetID).length > 0) {
                throw new Error("Unique widget already exists: " + widgetID);
            }
            let [
                widget,
                toolbarItem,
                sourceToolbar
            ] = this._placeLibraryWidget(widgetID, destToolbar, pivotElement, reuseItems);
            return [
                toolbarItem,
                widget,
                sourceToolbar
            ];
        },
        _placeLibraryWidget: function WndCtrl__placeLibraryWidget(protoID, destToolbar, insertBeforeElement, reuseItems) {
            let toolbarItem;
            let widget;
            let sourceToolbar;
            toolbarItem = reuseItems ? reuseItems.shift() : undefined;
            if (toolbarItem) {
                let info = this._application.overlayProvider.parseWidgetItemId(toolbarItem.id, true);
                widget = this._widgetHost.getWidget(info.instanceID);
            } else {
                let widgetProto = this._application.widgetLibrary.getWidgetProto(protoID);
                if (widgetProto.isUnique) {
                    let spawnedIDs = widgetProto.spawnedIDs;
                    if (spawnedIDs.length && this._widgetHost.hasWidget(spawnedIDs[0])) {
                        [
                            widget,
                            toolbarItem
                        ] = this._widgetHost.getWidgetAndElement(spawnedIDs[0]);
                    }
                }
            }
            let alreadyHaveWidget = Boolean(toolbarItem);
            if (alreadyHaveWidget) {
                sourceToolbar = toolbarItem.parentNode;
                this._putElement(toolbarItem, destToolbar, insertBeforeElement);
            } else {
                let widgetInfo = this._application.widgetLibrary.getWidgetInfo(protoID);
                toolbarItem = this._addNewFromPalette(widgetInfo, destToolbar, insertBeforeElement);
                let info = this._application.overlayProvider.parseWidgetItemId(toolbarItem.id, true);
                widget = this._widgetHost.getWidget(info.instanceID);
            }
            if (!widget || !toolbarItem) {
                throw new Error("_placeLibraryWidget finishes with bad return values " + [
                    widget,
                    toolbarItem,
                    sourceToolbar
                ]);
            }
            return [
                widget,
                toolbarItem,
                sourceToolbar
            ];
        },
        _addNewFromPalette: function WndCtrl__addNewFromPalette(widgetInfo, destToolbar, insertBeforeElement) {
            let palette = this._toolbox.palette;
            let instID = this._application.BarPlatform.getNewWidgetInstanceID();
            let widgetItemID = this._application.overlayProvider.compileWidgetItemId(widgetInfo.id, instID);
            let paletteItem = this._application.overlayProvider.makePaletteItem(document, widgetInfo, instID);
            palette.appendChild(paletteItem);
            let hadChildren = destToolbar.hasChildNodes();
            let insertedItem = destToolbar.insertItem(widgetItemID, insertBeforeElement);
            if (destToolbar.id !== this._toolbarID) {
                return insertedItem;
            }
            if (!hadChildren) {
                destToolbar.collapsed = false;
                document.persist(destToolbar.id, "collapsed");
            }
            return insertedItem;
        },
        _putElement: function WndCtrl__putElement(DOMElement, destToolbar, putBeforeElement) {
            if (DOMElement === putBeforeElement) {
                return DOMElement;
            }
            if (this.australisUI) {
                let destToolbarParent = destToolbar.parentNode;
                if (destToolbarParent && destToolbarParent.localName === "toolbar") {
                    destToolbar = destToolbarParent;
                }
                let area = destToolbar.id;
                let position;
                if (putBeforeElement) {
                    let placement = this.browserCustomizableUI.getPlacementOfWidget(putBeforeElement.id || "");
                    if (placement && placement.area === area) {
                        position = placement.position;
                    }
                }
                this.browserCustomizableUI.addWidgetToArea(DOMElement.id, area, position);
            } else {
                if (putBeforeElement) {
                    destToolbar.insertBefore(DOMElement, putBeforeElement);
                } else {
                    destToolbar.appendChild(DOMElement);
                }
            }
            return DOMElement;
        }
    };
    function WidgetHost(overlayController) {
        this._overlayController = overlayController;
        this._app = this._overlayController.application;
        this._hostID = "WHost" + this._app.overlayProvider.genWidgetHostID();
        this._logger = this._app.getLogger(this._hostID);
        this._widgetsMap = Object.create(null);
    }
    WidgetHost.prototype = {
        constructor: WidgetHost,
        get id() {
            return this._hostID;
        },
        get overlayController() {
            return this._overlayController;
        },
        get logger() {
            return this._logger;
        },
        navigate: function WidgetHost_navigate(navigateData, widgetInstance) {
            navigateData.sourceWindow = this._overlayController.window;
            this._app.BarPlatform.navigateBrowser(navigateData);
        },
        setupWidget: function WidgetHost_setupWidget(widgetInstanceOrToolbarItemOrId) {
            let id = typeof widgetInstanceOrToolbarItemOrId == "string" ? widgetInstanceOrToolbarItemOrId : widgetInstanceOrToolbarItemOrId.id;
            this._app.openSettingsDialog(this._overlayController.window, id);
        },
        addWidget: function WidgetHost_addWidget(widgetID, relativeTo, placeAfter) {
            return this._overlayController.placeWidget(widgetID, relativeTo, placeAfter, "all", true);
        },
        removeWidget: function WidgetHost_removeWidget(WIID) {
            this._overlayController.removeItem(WIID);
        },
        clear: function WidgetHost_clear() {
            for (let WIID in this._widgetsMap) {
                try {
                    this.destroyWidget(WIID);
                } catch (e) {
                    this._logger.error(this._app.core.Lib.strutils.formatError(e));
                }
            }
            this._widgetsMap = Object.create(null);
            this._overlayController = null;
        },
        hasWidget: function WidgetHost_hasWidget(widgetIID) {
            return widgetIID in this._widgetsMap;
        },
        createWidget: function WidgetHost_createWidget(protoID, instID, settings, boundToolbarElement) {
            if (!instID) {
                throw new this._app.core.Lib.CustomErrors.EArgRange("instID", "/.+/", instID);
            }
            let widget;
            if (!this.hasWidget(instID)) {
                let widgetPrototype = this._app.widgetLibrary.getWidgetProto(protoID);
                widget = widgetPrototype.createInstance(instID, this, settings);
                this._widgetsMap[instID] = {
                    widget: widget,
                    toolbarElement: boundToolbarElement
                };
                widget.buildUI(boundToolbarElement);
            } else {
                this._logger.warn("Widget with this ID (" + instID + ") already exists. Will use the old one.");
                widget = this.getWidget(instID);
                widget.applySettings(settings, true);
            }
            return widget;
        },
        destroyWidget: function WidgetHost_destroyWidget(instID, eraseSettingsIfNeeded) {
            let widget = this.getWidget(instID);
            try {
                if (eraseSettingsIfNeeded) {
                    try {
                        widget.eraseSettings();
                    } catch (e) {
                        this._logger.error("Could not erase widget setting. " + this._app.core.Lib.strutils.formatError(e));
                    }
                }
                widget.finalize();
            } finally {
                delete this._widgetsMap[instID];
            }
        },
        getWidget: function WidgetHost_getWidget(widgetIID) {
            return this._getWidgetPair(widgetIID).widget;
        },
        getToolbarElement: function WidgetHost_getToolbarElement(widgetIID) {
            return this._getWidgetPair(widgetIID).toolbarElement;
        },
        getWidgetAndElement: function WidgetHost_getWidgetAndElement(widgetIID) {
            let widgetPair = this._getWidgetPair(widgetIID);
            return [
                widgetPair.widget,
                widgetPair.toolbarElement
            ];
        },
        _consts: {
            ERR_WIDGET_NOT_FOUND: "Couldn't find widget with this ID (%1)",
            ERR_CANT_CONSTRUCT_WIDGET: "Failed creating widget"
        },
        _app: null,
        _logger: null,
        _hostID: undefined,
        _overlayController: null,
        _widgetsMap: null,
        _getWidgetPair: function WidgetHost__getWidgetPair(widgetIID) {
            let widgetPair = this._widgetsMap[widgetIID];
            if (!widgetPair) {
                let errmsg = this._app.core.Lib.strutils.formatString(this._consts.ERR_WIDGET_NOT_FOUND, [widgetIID]);
                try {
                    throw new Error(errmsg);
                } catch (e) {
                    this._logger.error(errmsg);
                    this._logger.debug(e.stack);
                    throw e;
                }
            }
            return widgetPair;
        }
    };
    window[APP_NAME + "OverlayController"] = new OverlayController();
}());
