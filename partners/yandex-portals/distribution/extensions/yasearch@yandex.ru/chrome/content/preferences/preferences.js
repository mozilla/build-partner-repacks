"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu,
    Constructor: CC
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
var SettingsDocumentHelper = {
    GUI_NS: "http://bar.yandex.ru/dev/native/gui",
    HTML_NS: "http://www.w3.org/1999/xhtml",
    createPreferencesNodes: function Helpers_createPreferencesNodes(aDocument, aSettingsDocument) {
        let preferenceIDs = [];
        let docFrag = aDocument.createDocumentFragment();
        let prefNodes = aSettingsDocument.getElementsByTagName("preference");
        for (let i = prefNodes.length; i--;) {
            let id = prefNodes[i].id;
            if (id) {
                preferenceIDs.push(id);
                if (!aDocument.getElementById(id)) {
                    docFrag.appendChild(prefNodes[i]);
                }
            }
        }
        let prefNode = aSettingsDocument.getElementsByTagName("preferences")[0];
        if (prefNode) {
            prefNode.parentNode.removeChild(prefNode);
        }
        if (docFrag.childNodes.length) {
            aDocument.documentElement.currentPane.getElementsByTagName("preferences")[0].appendChild(docFrag);
        }
        return preferenceIDs;
    },
    importNodes: function Helpers_importNodes(aDocument, aSettingsDocument, aNodeName, aNodeNameSpace, aReqAttributes) {
        Array.slice(aSettingsDocument.getElementsByTagNameNS(aNodeNameSpace, aNodeName)).forEach(function (aNode) {
            if (aNodeName == "style" && aNode.hasAttribute("src")) {
                let stylesElement = aDocument.getElementById("YaSubPrefController-styles");
                if (!stylesElement) {
                    Preferences._logger.error("element.@src (" + aNode.getAttribute("src") + ") " + "is not supported in the main document.");
                    return;
                }
                let stylesheet = stylesElement.sheet;
                stylesheet.insertRule("@import url('" + aNode.getAttribute("src") + "');", stylesheet.cssRules.length);
                return;
            }
            let clone = aDocument.createElementNS(aNodeNameSpace, aNodeName);
            Array.slice(aNode.attributes).forEach(function (attr) {
                if (attr.name == "src") {
                    if (aDocument === document) {
                        Preferences._logger.error("element.@src (" + aNode.getAttribute("src") + ") " + "is not supported in the main document.");
                        return;
                    }
                    clone.setAttribute(attr.name, aNode.src || attr.value);
                } else {
                    clone.setAttribute(attr.name, attr.value);
                }
            });
            for (let [
                        attrName,
                        attrValue
                    ] in Iterator(aReqAttributes)) {
                if (!clone.hasAttribute(attrName)) {
                    clone.setAttribute(attrName, attrValue);
                }
            }
            clone.textContent = aNode.textContent;
            aDocument.documentElement.appendChild(clone);
        });
    },
    createNativeNodes: function Helpers_createNativeNodes(aDocument, aSettingsDocument, aContainer) {
        if (!aContainer.hasAttribute("xb-custom-prefs-inited")) {
            aContainer.setAttribute("xb-custom-prefs-inited", "true");
            if (aSettingsDocument) {
                this.importNodes(aDocument, aSettingsDocument, "script", this.HTML_NS, { type: "application/x-javascript" });
                this.importNodes(aDocument, aSettingsDocument, "style", this.HTML_NS, { type: "text/css" });
            }
        }
        let nativeNodesData = {
            __proto__: null,
            _nodesWithName: { __proto__: null },
            _nodesWithoutName: [],
            hasNamedNode: function nativeNodesData_hasNamedNode(aName) {
                return aName in this._nodesWithName;
            },
            appendNamedNodes: function nativeNodesData_appendNamedNodes(aContainer, aName, aPrefPath, aDefaultValue) {
                if (!this.hasNamedNode(aName)) {
                    return false;
                }
                this._nodesWithName[aName].forEach(function (element) {
                    aContainer.appendChild(element);
                    if (aPrefPath && element.nodeType == Node.ELEMENT_NODE) {
                        [element].concat(Array.slice(element.getElementsByAttribute("preference", "%pref%"))).forEach(function _makePrefNode(el) {
                            this._makePrefNode(el, aName, aPrefPath, aDefaultValue);
                        }, this);
                    }
                }, this);
                delete this._nodesWithName[aName];
                return true;
            },
            appendNodes: function nativeNodesData_appendNodes(aContainer) {
                for (let [
                            ,
                            nodes
                        ] in Iterator(this._nodesWithName)) {
                    nodes.forEach(element => aContainer.appendChild(element));
                }
                delete this._nodesWithName;
                this._nodesWithoutName.forEach(element => aContainer.appendChild(element));
                delete this._nodesWithoutName;
            },
            _makePrefNode: function nativeNodesData__makePrefNode(aElement, aName, aPrefPath, aDefaultValue) {
                if (aElement.getAttribute("preference") != "%pref%") {
                    return;
                }
                if (aDefaultValue !== null) {
                    aElement.setAttributeNS(SettingsDocumentHelper.GUI_NS, "xbDefaultValue", aDefaultValue);
                }
                let doc = aElement.ownerDocument;
                let prefNode = doc.getElementById(aPrefPath);
                if (!prefNode) {
                    prefNode = doc.createElement("preference");
                    prefNode.setAttributeNS(SettingsDocumentHelper.GUI_NS, "preftype", "custom");
                    prefNode.setAttribute("id", aPrefPath);
                    prefNode.setAttribute("name", aPrefPath);
                    doc.documentElement.currentPane.getElementsByTagName("preferences")[0].appendChild(prefNode);
                }
                aElement.setAttribute("preference", aPrefPath);
                setTimeout(function () {
                    prefNode.updateElements();
                }, 0);
            }
        };
        if (aSettingsDocument) {
            let guiNode = aSettingsDocument.getElementsByTagNameNS(this.GUI_NS, "gui")[0];
            if (guiNode) {
                let guiBlockNodes = guiNode.getElementsByTagNameNS(this.GUI_NS, "nodes");
                Array.slice(guiBlockNodes).forEach(function (aNodesBlock) {
                    let name = aNodesBlock.getAttribute("name");
                    let nodesData = name ? nativeNodesData._nodesWithName[name] = [] : nativeNodesData._nodesWithoutName;
                    Array.slice(aNodesBlock.childNodes).forEach(function (aNode) {
                        let node = aDocument.importNode(aNode, true);
                        nodesData.push(node);
                    });
                });
                let handlers = {
                    onshown: "onSettingsShown",
                    onhidden: "onSettingsHidden",
                    onapply: "onSettingsApply",
                    oncancel: "onSettingsCancel",
                    onreset: "onSettingsReset"
                };
                for (let [
                            key,
                            val
                        ] in Iterator(handlers)) {
                    if (guiNode.hasAttribute(key)) {
                        aContainer.setAttribute(val, guiNode.getAttribute(key));
                    }
                }
            }
        }
        return nativeNodesData;
    }
};
let WidgetsJS = {};
function WidgetProxy(aProtoId) {
    this.disabled = false;
    this._id = aProtoId;
    this._init();
}
WidgetProxy.prototype = {
    _init: function WidgetProxy__init() {
        let widgetInfo = this.widgetInfo;
        this.iconURL = widgetInfo.iconPath ? widgetInfo.package_.resolvePath(widgetInfo.iconPath) : "";
        this.isUnique = widgetInfo.isUnique;
        this.isRemovable = !Preferences.barCore.application.widgetLibrary.isPreinstalledWidget(this._id);
        this.protoId = this._id;
        this.name = widgetInfo.name;
    },
    get widgetInfo() {
        return Preferences.barCore.application.widgetLibrary.getWidgetInfo(this._id);
    },
    type: "widget",
    get id() {
        return this._id;
    }
};
function WidgetInstProxy(aInstanceID) {
    this.disabled = false;
    this._id = aInstanceID;
    this._preferenceIDs = [];
    this._init();
}
WidgetInstProxy.prototype = {
    _init: function WidgetInstProxy__init() {
        let xbWidget = this.xbWidget;
        let proto = xbWidget.prototype;
        this.iconURL = proto.iconURI;
        this.isUnique = proto.isUnique;
        this.isRemovable = false;
        this.protoId = proto.id;
        this.instanceID = this.widgetInfo.instanceID;
        this.name = proto.name;
    },
    _settingsXULDocument: undefined,
    get settingsXULDocument() {
        if (typeof this._settingsXULDocument == "undefined") {
            this._settingsXULDocument = this._createSettingsXULDocument("main", document);
        }
        return this._settingsXULDocument;
    },
    getSubSettingsXULDocument: function WidgetInstProxy_getSubSettingsXULDocument(aDocument) {
        return this._createSettingsXULDocument("sub", aDocument);
    },
    onSettingsRestore: function WidgetInstProxy_onSettingsRestore() {
        this._settingsXULDocument = undefined;
    },
    makeURL: function WidgetInstProxy_makeURL(aSpec) {
        let spec = /^https?:\/\//.test(aSpec) ? aSpec : this.unitPackage.resolvePath(aSpec);
        let uri = spec ? Preferences.barCore.Lib.misc.tryCreateFixupURI(spec) : null;
        if (!(uri && /^(https?|xb)$/.test(uri.scheme) && uri.spec)) {
            return "";
        }
        return uri.spec;
    },
    type: "widget",
    get id() {
        return this._id;
    },
    get packageId() {
        return this.unitPackage.id;
    },
    get widgetInfo() {
        return Preferences.overlayProvider.parseWidgetItemId(this._id);
    },
    get xbWidget() {
        return Preferences._widgetHost.getWidget(this.widgetInfo.instanceID);
    },
    get unitPackage() {
        return this.xbWidget.prototype.unit.unitPackage;
    },
    get protoSettings() {
        return this.xbWidget.prototype.widgetSettings;
    },
    get instanceSettings() {
        return this.xbWidget.instanceSettings;
    },
    get packageSettings() {
        return this.xbWidget.prototype.packageSettings;
    },
    get nativeModule() {
        return this.xbWidget.prototype.nativeModule || null;
    },
    updatePreferenceNodes: function WidgetInstProxy_updatePreferenceNodes(aDocument) {
        this._preferenceIDs.forEach(function (aID) {
            let prefNode = aDocument.getElementById(aID);
            if (prefNode) {
                prefNode.updateElements();
            }
        });
    },
    _createSettingsXULDocument: function WidgetInstProxy__createSettingsXULDocument(aType, aDocument) {
        Preferences._logger.debug("WidgetInstProxy__createSettingsXULDocument: " + [
            aType,
            aDocument
        ]);
        let nativeModule = this.nativeModule;
        let getTemplateFunctionName = aType == "sub" ? "getSubTemplate" : "getMainTemplate";
        let moduleSettings = nativeModule && nativeModule.core.Settings;
        if (!(moduleSettings && getTemplateFunctionName in moduleSettings)) {
            return null;
        }
        let settingsTemplate;
        try {
            settingsTemplate = moduleSettings[getTemplateFunctionName](this.name, this.instanceID);
        } catch (ex) {
            Preferences._logger.error(ex);
        }
        if (settingsTemplate instanceof Ci.nsIInputStream) {
            settingsTemplate = Preferences.barCore.Lib.fileutils.readStringFromStream(settingsTemplate);
        }
        if (aType == "main" && settingsTemplate && typeof settingsTemplate == "object") {
            let label = "";
            if ("subwindowControl" in settingsTemplate) {
                let subwindowControl = settingsTemplate.subwindowControl;
                if ("label" in subwindowControl) {
                    label = " label value='" + subwindowControl.label + "'";
                }
            }
            settingsTemplate = "<?xml version='1.0'?>" + " <gui:component xmlns='http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'" + "         xmlns:gui='" + SettingsDocumentHelper.GUI_NS + "'>" + "     <gui:gui>" + "         <gui:nodes>" + "             <vbox class='subwindow-opener'" + label + "/>" + "         </gui:nodes>" + "     </gui:gui>" + "</gui:component>";
        }
        if (!(typeof settingsTemplate == "string" && settingsTemplate)) {
            return null;
        }
        let crypto = Preferences.barCore.Lib.misc.crypto;
        let packageIdHash = crypto.createHash("md5").update(this.packageId).digest("hex");
        let protoIdHash = crypto.createHash("md5").update(this.protoId).digest("hex");
        let instanceIdHash = crypto.createHash("md5").update(this.instanceID).digest("hex");
        let jsNativeModuleObjectPrefix = "_wgtNativeModule_" + protoIdHash;
        let jsNativeModuleDefinedObjectPrefix = "_defined_" + jsNativeModuleObjectPrefix;
        if (!(jsNativeModuleObjectPrefix in WidgetsJS)) {
            let me = this;
            WidgetsJS.__defineGetter__(jsNativeModuleObjectPrefix, function __WJS_nativeModuleGetter() {
                if (!(jsNativeModuleDefinedObjectPrefix in this)) {
                    this[jsNativeModuleDefinedObjectPrefix] = me.nativeModule;
                }
                return this[jsNativeModuleDefinedObjectPrefix];
            });
        }
        let jsPackageObjectPrefix = "_wgtPackage_" + packageIdHash;
        let jsPackageDefinedObjectPrefix = "_defined_" + jsPackageObjectPrefix;
        if (!(jsPackageObjectPrefix in WidgetsJS)) {
            WidgetsJS.__defineGetter__(jsPackageObjectPrefix, function __WJS_packageObjectGetter() {
                return this[jsPackageDefinedObjectPrefix];
            });
            WidgetsJS.__defineSetter__(jsPackageObjectPrefix, function __WJS_packageObjectSetter(aObject) {
                if (!(jsPackageDefinedObjectPrefix in this)) {
                    this[jsPackageDefinedObjectPrefix] = aObject;
                }
            });
        }
        let jsProtoObjectPrefix = "_wgtProto_" + protoIdHash;
        let jsProtoDefinedObjectPrefix = "_defined_" + jsProtoObjectPrefix;
        if (!(jsProtoObjectPrefix in WidgetsJS)) {
            WidgetsJS.__defineGetter__(jsProtoObjectPrefix, function __WJS_protoObjectGetter() {
                return this[jsProtoDefinedObjectPrefix];
            });
            WidgetsJS.__defineSetter__(jsProtoObjectPrefix, function __WJS_protoObjectSetter(aObject) {
                if (!(jsProtoDefinedObjectPrefix in this)) {
                    this[jsProtoDefinedObjectPrefix] = aObject;
                }
            });
        }
        let globalObjectPrefix = (aType == "sub" ? "window.opener." : "") + "WidgetsJS.";
        let xbPackageURL = this.unitPackage.resolvePath("");
        let nativeComponents = Preferences.barCore.application.NativeComponents;
        let packagePrefBranch = nativeComponents.makePackagePrefPath(this.unitPackage.id);
        let protoPrefBranch = nativeComponents.makeWidgetPrefPath(this.protoId);
        settingsTemplate = settingsTemplate.replace(/((var|let)\s*)?JSNativeModule/gm, globalObjectPrefix + jsNativeModuleObjectPrefix).replace(/((var|let)\s*)?JSPackageObject/gm, globalObjectPrefix + jsPackageObjectPrefix).replace(/((var|let)\s*)?JSProtoObject/gm, globalObjectPrefix + jsProtoObjectPrefix).replace(/\{\{UNIC_STR\}\}/gm, "uniq" + instanceIdHash).replace(/\{\{PROTO_ID\}\}/gm, this.protoId).replace(/\{\{PACKAGE_PREF_BRANCH\}\}/gm, packagePrefBranch).replace(/\{\{PROTO_PREF_BRANCH\}\}/gm, protoPrefBranch).replace(/\{\{PACKAGE_URL\}\}/gm, xbPackageURL);
        if (this.type == "widget") {
            let jsInstObjectPrefix = "_wgtInst_" + instanceIdHash;
            let jsInstDefinedObjectPrefix = "_defined_" + jsInstObjectPrefix;
            if (!(jsInstObjectPrefix in WidgetsJS)) {
                WidgetsJS.__defineGetter__(jsInstObjectPrefix, function __WJS_instObjectGetter() {
                    return this[jsInstDefinedObjectPrefix];
                });
                WidgetsJS.__defineSetter__(jsInstObjectPrefix, function __WJS_instObjectSetter(aObject) {
                    if (!(jsInstDefinedObjectPrefix in this)) {
                        this[jsInstDefinedObjectPrefix] = aObject;
                    }
                });
            }
            let instancePrefBranch = nativeComponents.makeInstancePrefPath(this.protoId, this.instanceID);
            settingsTemplate = settingsTemplate.replace(/\{\{INST_PREF_BRANCH\}\}/gm, instancePrefBranch).replace(/\{\{INST_ID\}\}/gm, this.instanceID).replace(/((var|let)\s*)?JSInstObject/gm, globalObjectPrefix + jsInstObjectPrefix);
        }
        let uri = Services.io.newURI(xbPackageURL, null, null);
        let domParser = Preferences.barCore.Lib.xmlutils.getDOMParser(uri, uri, true);
        let xulDocument;
        try {
            settingsTemplate = settingsTemplate.replace(/>\s*</gim, "><");
            xulDocument = domParser.parseFromString(settingsTemplate, "text/xml");
            let docElement = xulDocument.documentElement;
            if (docElement.localName == "parsererror") {
                throw new Error("An error occured while parsing widget settings UI.");
            }
            if (docElement.localName != "component" || docElement.namespaceURI != SettingsDocumentHelper.GUI_NS) {
                throw new Error("Wrong settings UI structure.");
            }
        } catch (ex) {
            Preferences._logger.error(ex);
            Preferences._logger.debug("Settings template:\n" + settingsTemplate);
            return null;
        }
        SettingsDocumentHelper.createPreferencesNodes(aDocument, xulDocument).forEach(function (id) {
            if (this.indexOf(id) === -1) {
                this.push(id);
            }
        }, this._preferenceIDs);
        return xulDocument;
    }
};
function PluginInstProxy(aPlugin) {
    this._id = aPlugin._id;
    this._preferenceIDs = [];
    this._plugin = aPlugin;
    this._init();
}
PluginInstProxy.prototype = {
    _init: function PluginInstProxy__init() {
        let widgetInfo = this.widgetInfo;
        this.iconURL = widgetInfo.iconPath ? widgetInfo.package_.resolvePath(widgetInfo.iconPath) : "";
        this.isUnique = widgetInfo.isUnique;
        this.isRemovable = !Preferences.barCore.application.widgetLibrary.isPreinstalledPlugin(this._id);
        this.protoId = widgetInfo.id;
        this.instanceID = widgetInfo.id;
        this.name = widgetInfo.name;
    },
    get disabled() {
        return !this._plugin.enabled;
    },
    set disabled(val) {
        this._plugin.enabledManually = !val;
    },
    type: "plugin",
    get id() {
        return this._id;
    },
    get widgetInfo() {
        return this._plugin._unit.componentInfo;
    },
    get xbWidget() {
        return this._plugin;
    },
    get unitPackage() {
        return this.widgetInfo.package_;
    },
    get protoSettings() {
        return this._plugin.pluginSettings;
    },
    get instanceSettings() {
        return {};
    },
    get packageSettings() {
        return this._plugin.packageSettings;
    },
    get nativeModule() {
        return this._plugin._module;
    },
    _settingsXULDocument: undefined,
    get settingsXULDocument() {
        if (typeof this._settingsXULDocument == "undefined") {
            this._settingsXULDocument = this._createSettingsXULDocument("main", document);
        }
        return this._settingsXULDocument;
    },
    getSubSettingsXULDocument: WidgetInstProxy.prototype.getSubSettingsXULDocument,
    makeURL: WidgetInstProxy.prototype.makeURL,
    updatePreferenceNodes: WidgetInstProxy.prototype.updatePreferenceNodes,
    onSettingsRestore: WidgetInstProxy.prototype.onSettingsRestore,
    _createSettingsXULDocument: WidgetInstProxy.prototype._createSettingsXULDocument
};
var WidgetsBase = {
    remove: function WidgetsBase_remove(aWidgetID) {
        let widgets = this._widgets;
        for (let i = 0, len = widgets.length; i < len; i++) {
            if (widgets[i].id == aWidgetID) {
                return widgets.splice(i, 1)[0];
            }
        }
        return null;
    },
    onSettingsRestore: function WidgetsBase_onSettingsRestore() {
        this._widgets.forEach(widget => widget.onSettingsRestore());
    }
};
var RegisteredWidgets = {
    __proto__: WidgetsBase,
    _widgets: [],
    push: function RegisteredWidgets_push(aProtoID, aBeforeID) {
        let widget;
        try {
            widget = new WidgetProxy(aProtoID);
        } catch (e) {
            Preferences._logger.error("Could not create widget proxy (protoID = " + aProtoID + "). " + Preferences.barCore.Lib.strutils.formatError(e));
            return null;
        }
        this._widgets.push(widget);
        return RegisteredWidgetsController.insertItem(widget, aBeforeID);
    },
    get: function RegisteredWidgets_get(aProtoID) {
        return this._widgets.filter(wp => wp.id == aProtoID)[0];
    }
};
var ActiveWidgets = {
    __proto__: WidgetsBase,
    _widgets: [],
    push: function ActiveWidgets_push(aInstanceID, aBeforeID) {
        let widget;
        try {
            widget = new WidgetInstProxy(aInstanceID);
        } catch (e) {
            Preferences._logger.error("Could not create widget proxy (instanceID = " + aInstanceID + "). " + Preferences.barCore.Lib.strutils.formatError(e));
            return null;
        }
        this._widgets.push(widget);
        return ActiveWidgetsController.insertItem(widget, aBeforeID);
    },
    get: function ActiveWidgets_get(aInstanceID) {
        return this._widgets.filter(wp => wp.id == aInstanceID || wp.instanceID == aInstanceID)[0];
    }
};
var RegisteredPlugins = {
    __proto__: WidgetsBase,
    _widgets: [],
    push: function RegisteredPlugins_push(aPlugin, aBeforeID) {
        let widget;
        try {
            widget = new PluginInstProxy(aPlugin);
        } catch (e) {
            Preferences._logger.error("Could not create plugin proxy. " + Preferences.barCore.Lib.strutils.formatError(e));
            return null;
        }
        this._widgets.push(widget);
        return RegisteredPluginsController.insertItem(widget, aBeforeID);
    },
    get: function RegisteredPlugins_get(aInstanceID) {
        return this._widgets.filter(wp => wp.id == aInstanceID)[0];
    }
};
var ProductBranding = {
    get softwareLink() {
        let linkElement = this._productData.productXML.querySelector("SoftURL");
        let softwareLink = linkElement && this._replaceURLTemplates(linkElement.textContent) || null;
        delete this.softwareLink;
        return this.softwareLink = softwareLink;
    },
    get homepageName() {
        let homepageName = "";
        let hpElement;
        try {
            hpElement = this._productData.browserXML.querySelector("Browser > HomePage");
        } catch (e) {
        }
        if (hpElement) {
            homepageName = hpElement.getAttribute("title");
            if (!homepageName) {
                let urlString = this._replaceURLTemplates(hpElement.textContent);
                if (urlString) {
                    let uri;
                    try {
                        uri = Services.io.newURI(urlString, null, null);
                        homepageName = uri.host;
                    } catch (ex1) {
                        try {
                            homepageName = uri.spec;
                        } catch (ex2) {
                            Preferences._logger.error("Can't get homepage address from '" + hpElement.textContent + "'");
                        }
                    }
                }
            }
        }
        delete this.homepageName;
        return this.homepageName = homepageName;
    },
    setBrowserHomePage: function ProductBranding_setBrowserHomePage() {
        Preferences.barCore.application.installer.setBrowserHomePage();
    },
    getYandexFeatureState: function ProductBranding_getYandexFeatureState(aFeatureName) {
        return Preferences.barCore.application.branding.getYandexFeatureState(aFeatureName);
    },
    get _productData() {
        let branding = Preferences.barCore.application.branding;
        let productXML = branding.brandPackage.getXMLDocument("/about/product.xml");
        let browserXML = branding.brandPackage.getXMLDocument("/browser/browserconf.xml");
        delete this._productData;
        this._productData = {
            productXML: productXML,
            browserXML: browserXML
        };
        return this._productData;
    },
    _replaceURLTemplates: function ProductBranding__replaceURLTemplates(aURL) {
        return Preferences.barCore.application.branding.expandBrandTemplatesEscape(aURL);
    }
};
var Preferences = {
    barCore: Cc["@yandex.ru/custombarcore;" + XB_APP_NAME].getService().wrappedJSObject,
    _domParserConstructor: new CC("@mozilla.org/xmlextras/domparser;1", "nsIDOMParser", "init"),
    _widgetHost: null,
    get _logger() {
        delete this._logger;
        return this._logger = this.barCore.application.getLogger("Preferences");
    },
    get _addonVersion() {
        return this.barCore.application.addonManager.addonVersion;
    },
    _restoreInfo: { collapsed: null },
    _panesInfo: {
        _data: {
            __proto__: null,
            _started: false,
            _selectComponentOnLoad: null
        },
        get started() {
            return this._data._started;
        },
        set started(aValue) {
            this._data._started = Boolean(aValue);
        },
        isPaneStarted: function PanesInfo_isPaneStarted(aPaneType) {
            return aPaneType in this._data;
        },
        setPaneStarted: function PanesInfo_setPaneStarted(aPaneType, aIsStarted) {
            if (aIsStarted) {
                this._data[aPaneType] = true;
            } else {
                delete this._data[aPaneType];
            }
        },
        getComponentForSelect: function PanesInfo_getComponentForSelect(aPaneType) {
            let selectionData = this._selectComponentOnLoad;
            if (selectionData) {
                if (selectionData.type == aPaneType) {
                    this._selectComponentOnLoad = null;
                } else {
                    selectionData = null;
                }
            }
            return selectionData;
        },
        setComponentForSelect: function PanesInfo_setComponentForSelect(aPaneType, aComponentId) {
            this._selectComponentOnLoad = {
                type: aPaneType,
                componentId: aComponentId
            };
        }
    },
    _initPane: function Preferences__initPane(aPaneID) {
        let paneElement = document.getElementById(aPaneID);
        if (!paneElement) {
            return;
        }
        if (document.documentElement.currentPane != paneElement) {
            document.documentElement.showPane(paneElement);
        }
        if (!paneElement.loaded) {
            return;
        }
        if (paneElement.getAttribute("xb-pane-ready") == "true") {
            return;
        }
        this._logger.trace("Init pane: " + aPaneID);
        switch (aPaneID) {
        case "prefpane-widgets":
        case "prefpane-plugins":
            setTimeout(function Preferences__initPaneTimed() {
                Preferences._startPane(aPaneID);
            }, 0);
            break;
        case "prefpane-about":
            aboutDlg.onDialogLoad();
            break;
        case "prefpane-misc":
            YaSearchPrefs.onPaneLoad();
            break;
        case "prefpane-software":
            setTimeout(function Preferences__timedOpenSoftwareLink() {
                document.documentElement.showPane(document.getElementById("prefpane-widgets"));
                this.barCore.Lib.misc.navigateBrowser({
                    url: ProductBranding.softwareLink,
                    target: "new tab"
                });
                document.documentElement.acceptDialog();
                window.close();
            }.bind(this), 0);
            break;
        }
        paneElement.setAttribute("xb-pane-ready", "true");
    },
    _startPane: function Preferences__startPane(aPaneID) {
        let paneType = aPaneID.replace(/^prefpane\-/, "");
        if (this._panesInfo.isPaneStarted(paneType)) {
            return;
        }
        this._panesInfo.setPaneStarted(paneType, true);
        if (!this._panesInfo.started) {
            this._panesInfo.started = true;
            this._widgetHost = this.setupWndCtrl.widgetHost;
            this.overlayProvider = this.barCore.application.overlayProvider;
            let toolbar = this.setupWndCtrl.appToolbar;
            this._restoreInfo.collapsed = toolbar.collapsed;
            toolbar.setForceHideAttribute();
            toolbar.collapsed = false;
            let doc = toolbar.ownerDocument;
            let evt = doc.createEvent("Event");
            evt.initEvent(XB_APP_NAME + "-beforecustomization", true, true);
            this.setupWndCtrl._toolbox.dispatchEvent(evt);
        }
        switch (paneType) {
        case "widgets":
            this._initWidgetsPane();
            break;
        case "plugins":
            this._initPluginsPane();
            break;
        }
        let componentForSelect = this._panesInfo.getComponentForSelect(paneType);
        if (componentForSelect) {
            this._selectComponent(componentForSelect.type, componentForSelect.componentId);
        }
        document.documentElement.setAttribute("buttondisabledextra2", "false");
    },
    openSubDialog: function Preferences_openSubDialog(aObject) {
        let widgetInstanceId = null;
        if (aObject instanceof Ci.nsIDOMElement) {
            let parentListItem = aObject;
            while (parentListItem && !widgetInstanceId) {
                if (parentListItem.localName == "richlistitem") {
                    widgetInstanceId = parentListItem.id;
                } else {
                    parentListItem = parentListItem.parentNode;
                }
            }
        } else if (typeof aObject == "string") {
            widgetInstanceId = aObject;
        }
        let widget = widgetInstanceId && (ActiveWidgets.get(widgetInstanceId) || RegisteredPlugins.get(widgetInstanceId));
        if (!widget) {
            this._logger.error("Open sub dialog: can't find widget.");
            return;
        }
        let subDialogArgs = {
            Preferences: Preferences,
            SettingsDocumentHelper: SettingsDocumentHelper,
            widget: widget
        };
        document.documentElement.openSubDialog(this.prefDirChromePath + "/preferences-subwin.xul", "", subDialogArgs);
    },
    _initPluginsPane: function Preferences__initPluginsPane() {
        this._fillPluginsLists();
    },
    _fillPluginsLists: function Preferences__fillPluginsLists() {
        RegisteredPluginsController.init();
        this.barCore.application.widgetLibrary.getPlugins().forEach(aPlugin => RegisteredPlugins.push(aPlugin));
    },
    deletePlugins: function Preferences_deletePlugins() {
        let selectedItems = Array.slice(RegisteredPluginsController.list.selectedItems);
        if (!selectedItems.length) {
            return;
        }
        let removableItems = selectedItems.filter(aItem => aItem.isRemovable);
        if (!removableItems.length) {
            return;
        }
        if (!this._confirmComponentsDeletion(removableItems, "plugins")) {
            return;
        }
        let barApp = this.barCore.application;
        let pluginIDsToRemove = [];
        let checkPackages = Object.create(null);
        removableItems.forEach(function (aItem) {
            let protoId = aItem.getAttribute("id");
            RegisteredPluginsController.removeItem(protoId);
            let plugin = RegisteredPlugins.remove(protoId);
            try {
                plugin.disabled = true;
            } catch (e) {
                let strutils = this.barCore.Lib.strutils;
                this._logger.error(strutils.formatString("Could not turn plugin (%1) on. %2", [
                    protoId,
                    strutils.formatError(e)
                ]));
            }
            let [
                packageID,
                compName
            ] = barApp.BarPlatform.parseComponentID(protoId);
            checkPackages[packageID] = true;
            pluginIDsToRemove.push(protoId);
        }, this);
        barApp.widgetLibrary.forgetPlugins(pluginIDsToRemove);
        barApp.widgetLibrary.persist(false, true);
        for (let packageID in checkPackages) {
            this._logger.debug("Checking package " + packageID);
            if (!barApp.widgetLibrary.getComponentsInfo(packageID).length) {
                barApp.packageManager.uninstallPackage(packageID, true);
            }
        }
    },
    _initWidgetsPane: function Preferences__initWidgetsPane() {
        this._fillWidgetsLists();
        let navToolbox = this.gDocument.getElementById("navigator-toolbox");
        if (navToolbox) {
            this._toolboxMutationObserver = new MutationObserver(WidgetNodesMutationListener.handleToolboxMutations.bind(WidgetNodesMutationListener));
            this._toolboxMutationObserver.observe(navToolbox, {
                childList: true,
                subtree: true
            });
        }
        this._toolboxPaletteMutationObserver = new MutationObserver(WidgetNodesMutationListener.handlePaletteMutations.bind(WidgetNodesMutationListener));
        this._toolboxPaletteMutationObserver.observe(this.setupWndCtrl._toolbox.palette, {
            childList: true,
            subtree: true
        });
    },
    selectComponent: function Preferences_selectComponent(aInstanceID, aPaneType) {
        if (typeof aPaneType == "string") {
            let prefpanes = document.documentElement.preferencePanes;
            for (let i = 0, len = prefpanes.length; i < len; i++) {
                if (prefpanes[i].id == "prefpane-" + aPaneType) {
                    this._initPane("prefpane-" + aPaneType);
                    return;
                }
            }
            this._logger.error("No such pane ('" + aPaneType + "').");
            return;
        }
        let paneType = this.barCore.application.widgetLibrary.isKnownPlugin(aInstanceID) ? "plugins" : "widgets";
        if (!this._panesInfo.isPaneStarted(paneType)) {
            this._panesInfo.setComponentForSelect(paneType, aInstanceID);
            this._initPane("prefpane-" + paneType);
        } else {
            this._selectComponent(paneType, aInstanceID);
        }
    },
    _selectComponent: function Preferences__selectComponent(aPaneType, aInstanceID) {
        if (!aInstanceID) {
            return;
        }
        if (!this._panesInfo.isPaneStarted(aPaneType)) {
            this._logger.error("Prefpane '" + aPaneType + "' is not started.");
            return;
        }
        switch (aPaneType) {
        case "widgets":
            let widget = ActiveWidgets.get(aInstanceID);
            if (widget) {
                ActiveWidgetsController.selectItem(widget);
                ActiveWidgetsController.list.focus();
            } else {
                this._logger.error("Select widget: can't find widget for " + aInstanceID);
            }
            break;
        case "plugins":
            let plugin = RegisteredPlugins.get(aInstanceID);
            if (plugin) {
                RegisteredPluginsController.selectItem(plugin);
                RegisteredPluginsController.list.focus();
            } else {
                this._logger.error("Select widget: can't find plugin for " + aInstanceID);
            }
            break;
        default:
            break;
        }
        this.checkControls();
    },
    _fillWidgetsLists: function Preferences__fillWidgetsLists() {
        RegisteredWidgetsController.init();
        ActiveWidgetsController.init();
        function addToRegisteredWidgets(aProtoID) {
            try {
                RegisteredWidgets.push(aProtoID);
            } catch (e) {
                this._logger.error("Failed in Preferences__fillWidgetsLists. " + this.barCore.Lib.strutils.formatError(e));
                this._logger.debug(e.stack);
            }
        }
        let knownXBIDs = this.barCore.application.widgetLibrary.getAvaibleWidgetIDs();
        let defaultWidgets = this.barCore.application.defaultPreset.widgetEntries;
        for (let i = 0, len = defaultWidgets.length; i < len; i++) {
            let protoID = defaultWidgets[i].componentID;
            let index = -1;
            if ((index = knownXBIDs.indexOf(protoID)) != -1) {
                knownXBIDs.splice(index, 1);
                addToRegisteredWidgets(protoID);
            }
        }
        knownXBIDs.forEach(protoID => addToRegisteredWidgets(protoID));
        this.getAllWidgetItems().forEach(aToolbarItem => ActiveWidgets.push(aToolbarItem.id));
    },
    _finalize: function Preferences__finalize() {
        let doc = this.setupWndCtrl._toolbox.ownerDocument;
        let evt = doc.createEvent("Event");
        evt.initEvent(XB_APP_NAME + "-aftercustomization", true, true);
        this.setupWndCtrl._toolbox.dispatchEvent(evt);
        this._logger.trace("Finalize");
        RegisteredWidgetsController.finalize();
        ActiveWidgetsController.finalize();
        RegisteredPluginsController.finalize();
        WidgetsJS = null;
        this.overlayProvider = null;
        this._widgetHost = null;
        this._setupWndCtrl = null;
        this._logger = null;
    },
    onUnload: function Preferences_onUnload() {
        try {
            if (this._gBrowser) {
                this._gBrowser.removeEventListener("unload", this, false);
            }
        } catch (ex) {
        }
        if (this._panesInfo.isPaneStarted("widgets")) {
            if (this._toolboxMutationObserver) {
                this._toolboxMutationObserver.disconnect();
            }
            if (this._toolboxPaletteMutationObserver) {
                this._toolboxPaletteMutationObserver.disconnect();
            }
        }
        if (!this._panesInfo.isPaneStarted("widgets") && !this._panesInfo.isPaneStarted("plugins")) {
            return;
        }
        try {
            this._apply();
        } catch (e) {
            this._logger.error("Could not apply changes. " + this.barCore.Lib.strutils.formatError(e));
            this._logger.debug(e.stack);
        }
        try {
            this._finalize();
        } catch (e) {
            this._logger.error("Failed in Preferences__finalize. " + this.barCore.Lib.strutils.formatError(e));
            this._logger.debug(e.stack);
        }
    },
    _apply: function Preferences__apply() {
        YaSearchPrefs.onDialogAccept();
        ActiveWidgetsController.onDialogApply();
        RegisteredPluginsController.onDialogApply();
        this._logger.debug("Applying");
        if (this._pluginsStateChanged) {
            this.barCore.application.widgetLibrary.persist(false, true);
        }
        if (this._panesInfo.isPaneStarted("widgets")) {
            this.getAllWidgetItems().forEach(function (aToolbarItem) {
                try {
                    let customizeState = aToolbarItem.getAttribute("xb-customize");
                    if (customizeState) {
                        aToolbarItem.removeAttribute("xb-customize");
                        if (customizeState == "removed") {
                            this.barCore.application.forEachWindow(function (controller) {
                                try {
                                    controller.removeItemById(aToolbarItem.id, true);
                                } catch (e) {
                                    this._logger.error(this.barCore.Lib.strutils.formatError(e));
                                    this._logger.debug(e.stack);
                                }
                            }, this);
                        }
                    }
                } catch (ex) {
                    this._logger.error(ex);
                }
            }, this);
            let toolbar = this.setupWndCtrl.appToolbar;
            toolbar.collapsed = this._restoreInfo.collapsed;
            toolbar.ownerDocument.persist(toolbar.id, "collapsed");
            this._persistToolbarsSet();
        }
    },
    _cancel: function Preferences__cancel() {
        this._logger.debug("Reverting");
        ActiveWidgetsController.onDialogCancel();
        RegisteredPluginsController.onDialogCancel();
    },
    restoreDefault: function Preferences_restoreDefault() {
        if (!this._getUserConfirm(this.getString("PreferencesTitle"), this.getString("RestoreDefaultSet"))) {
            return;
        }
        ActiveWidgetsController.onDialogReset();
        RegisteredPluginsController.onDialogReset();
        Services.obs.notifyObservers(null, this.barCore.eventTopics.EVT_BEFORE_GLOBAL_RESET, null);
        Array.slice(document.getElementsByTagName("preferences")).forEach(function (aPrefsElement) {
            if (/#childprefs$/.test(aPrefsElement.id)) {
                aPrefsElement.parentNode.removeChild(aPrefsElement);
            }
        });
        let prefNodes = document.getElementsByTagName("preference");
        for (let i = prefNodes.length; i--;) {
            if (prefNodes[i].getAttributeNS(SettingsDocumentHelper.GUI_NS, "resetOnRestore") == "true") {
                try {
                    prefNodes[i].valueFromPreferences = undefined;
                } catch (ex) {
                }
            }
        }
        let items = this.getAllWidgetItems();
        for (let i = items.length; i-- > 0;) {
            let item = items[i];
            if (item.hasAttribute("xb-customize")) {
                item.removeAttribute("xb-customize");
            }
            try {
                this.setupWndCtrl.removeItem(item, true);
            } catch (e) {
                this._logger.error(e);
            }
        }
        let toolbox = this.gDocument.getElementById("navigator-toolbox");
        if (toolbox) {
            toolbox.removeAttribute("cb-barless");
        }
        this.barCore.application.BarPlatform.eraseSettings();
        this.barCore.application.widgetLibrary.setDefaultPluginsState();
        let toolbar = this.setupWndCtrl.appToolbar;
        if ("multiline" in toolbar) {
            toolbar.multiline = false;
        }
        toolbar.onToolbarCustomize(true);
        this.setupWndCtrl.applyPreset(this.barCore.application.defaultPreset, "hard", undefined, true);
        this.setupWndCtrl.checkNeedSetBarlessMode();
        this.barCore.application.autoinstaller.activatedComponentIds = this.getAllWidgetItems().map(aToolbarItem => aToolbarItem.wdgtPrototypeID).filter(Boolean);
        toolbar.collapsed = false;
        this._restoreInfo.collapsed = true;
        this._persistToolbarsSet();
        for (let prop in WidgetsJS) {
            delete WidgetsJS[prop];
        }
        ActiveWidgets.onSettingsRestore();
        RegisteredPlugins.onSettingsRestore();
        if (this._panesInfo.isPaneStarted("widgets")) {
            this._fillWidgetsLists();
        }
        if (this._panesInfo.isPaneStarted("plugins")) {
            this._fillPluginsLists();
        }
        Services.obs.notifyObservers(null, this.barCore.eventTopics.EVT_AFTER_GLOBAL_RESET, null);
    },
    _checkModifiedToolbaritemsOnRestore: function Preferences__checkModifiedToolbaritemsOnRestore() {
        let selectors = "[xb-customize='removed'], [xb-customize='added']";
        let items = this.gDocument.querySelectorAll(selectors);
        let setupWndCtrl = this.setupWndCtrl;
        for (let i = items.length; i-- > 0;) {
            let item = items.item(i);
            try {
                if (item.getAttribute("xb-customize") == "added") {
                    setupWndCtrl.removeItem(item, true);
                }
                item.removeAttribute("xb-customize");
            } catch (e) {
                this._logger.error(e);
            }
        }
    },
    _getSiblingNode: function Preferences__getSiblingNode(aNode, aDirection, aIncludeForeignToolbars) {
        let toolbar = aIncludeForeignToolbars && aNode && aNode.parentNode;
        let node = this.__getSiblingNode(aNode, aDirection);
        while (!node && toolbar) {
            toolbar = this._getSiblingToolbar(toolbar, aDirection);
            node = toolbar && this._getChildNode(toolbar, aDirection == "next" ? "first" : "last");
        }
        return node;
    },
    __getSiblingNode: function Preferences___getSiblingNode(aNode, aDirection) {
        let directionProp = aDirection + "Sibling";
        let node = aNode && aNode[directionProp];
        while (node && (node.getAttribute("xb-customize") == "removed" || node.hidden)) {
            node = node[directionProp];
        }
        return node;
    },
    _getChildNode: function Preferences__getChildNode(aParent, aType) {
        let node = aType == "first" ? aParent.firstChild : aParent.lastChild;
        if (node && (node.getAttribute("xb-customize") == "removed" || node.hidden)) {
            node = this._getSiblingNode(node, aType == "first" ? "next" : "previous");
        }
        return node;
    },
    _getFirstChild: function Preferences__getFirstChild(aParent) {
        return this._getChildNode(aParent, "first");
    },
    _getLastChild: function Preferences__getLastChild(aParent) {
        return this._getChildNode(aParent, "last");
    },
    _getSiblingToolbar: function Preferences__getSiblingToolbar(aToolbar, aDirection) {
        let navToolbox = this.gDocument.getElementById("navigator-toolbox");
        if (!navToolbox) {
            return null;
        }
        let toolbarNodes = Array.slice(navToolbox.childNodes);
        toolbarNodes.push(this.gDocument.getElementById("addon-bar"));
        toolbarNodes = toolbarNodes.filter(function (t) {
            if (!t) {
                return false;
            }
            if (!t.getAttribute("toolbarname")) {
                return false;
            }
            if (t.collapsed || t.hidden || t.getAttribute("id") == "toolbar-menubar") {
                return false;
            }
            return true;
        });
        let curIndex = toolbarNodes.indexOf(aToolbar);
        curIndex += aDirection == "next" ? 1 : -1;
        return curIndex >= 0 && toolbarNodes[curIndex] || null;
    },
    _checkControlsTimeout: null,
    checkControls: function Preferences_checkControls() {
        if (this._checkControlsTimeout) {
            window.clearTimeout(this._checkControlsTimeout);
        }
        this._checkControlsTimeout = setTimeout(function (me) {
            if (me && "_checkControls" in me) {
                me._checkControls();
            }
        }, 0, this);
    },
    _checkControls: function Preferences__checkControls() {
        switch (document.documentElement.currentPane.id) {
        case "prefpane-widgets":
            this.checkWidgetsControls();
            break;
        case "prefpane-plugins":
            this.checkPluginsControls();
            break;
        }
    },
    _checkWidgetsControlsTimeout: null,
    checkWidgetsControls: function Preferences_checkWidgetsControls() {
        if (this._checkWidgetsControlsTimeout) {
            window.clearTimeout(this._checkWidgetsControlsTimeout);
        }
        this._checkWidgetsControlsTimeout = setTimeout(function (me) {
            if (me && "_checkWidgetsControls" in me) {
                me._checkWidgetsControls();
            }
        }, 0, this);
    },
    _checkWidgetsControls: function Preferences__checkWidgetsControls() {
        let canAddWidgets = Boolean(RegisteredWidgetsController.list.selectedCount);
        document.getElementById("canAddWidgetsBroadcaster").setAttribute("disabled", !canAddWidgets);
        let canDeleteWidgets = false;
        let focusedElement = document.commandDispatcher.focusedElement;
        if (!focusedElement || focusedElement != ActiveWidgetsController.list) {
            let selectedItems = Array.slice(RegisteredWidgetsController.list.selectedItems);
            canDeleteWidgets = selectedItems.some(aItem => aItem.isRemovable);
        }
        document.getElementById("canDeleteWidgetsBroadcaster").setAttribute("disabled", !canDeleteWidgets);
        let activeList = ActiveWidgetsController.list;
        let canRemoveWidgets = Boolean(activeList.selectedCount);
        document.getElementById("canRemoveWidgetsBroadcaster").setAttribute("disabled", !canRemoveWidgets);
        let canMoveUp = canRemoveWidgets;
        let canMoveDown = canRemoveWidgets;
        document.getElementById("canMoveWidgetsUpBroadcaster").setAttribute("disabled", !canMoveUp);
        document.getElementById("canMoveWidgetsDownBroadcaster").setAttribute("disabled", !canMoveDown);
    },
    _checkPluginsControlsTimeout: null,
    checkPluginsControls: function Preferences_checkPluginsControls() {
        if (this._checkPluginsControlsTimeout) {
            window.clearTimeout(this._checkPluginsControlsTimeout);
        }
        this._checkPluginsControlsTimeout = setTimeout(function (me) {
            if (me && "_checkPluginsControls" in me) {
                me._checkPluginsControls();
            }
        }, 0, this);
    },
    _checkPluginsControls: function Preferences__checkPluginsControls() {
        let selectedItems = Array.slice(RegisteredPluginsController.list.selectedItems);
        let canDeletePlugins = selectedItems.some(aItem => aItem.isRemovable);
        document.getElementById("canDeletePluginsBroadcaster").setAttribute("disabled", !canDeletePlugins);
    },
    selectAll: function Preferences_selectAll() {
        let focusedElement = document.commandDispatcher.focusedElement;
        if (focusedElement && focusedElement.localName == "richlistbox") {
            if ("expandItem" in focusedElement && focusedElement.currentItem) {
                focusedElement.expandItem(null);
            }
            focusedElement.selectAll();
        }
    },
    addWidgets: function Preferences_addWidgets(aNodeBefore) {
        let selectedItems = Array.slice(RegisteredWidgetsController.list.selectedItems);
        let beforeId = aNodeBefore ? aNodeBefore.id : null;
        let addedItems = [];
        for (let i = 0, len = selectedItems.length; i < len; i++) {
            if (selectedItems[i].hidden) {
                continue;
            }
            let addedItem = this._addWidget(selectedItems[i], beforeId);
            if (addedItem) {
                addedItems.push(addedItem);
            }
        }
        let addedLength = addedItems.length;
        if (addedLength) {
            let firstSelectedItem = addedItems[0];
            let lastSelectedItem = addedItems[addedLength - 1];
            let activeList = ActiveWidgetsController.list;
            activeList.selectItemRange(firstSelectedItem, lastSelectedItem);
            if (addedLength == 1) {
                firstSelectedItem.click();
            } else {
                activeList.ensureElementIsVisible(lastSelectedItem);
                activeList.ensureElementIsVisible(firstSelectedItem);
            }
        }
    },
    _addWidget: function Preferences__addWidget(aListItem, aRelativeElementId) {
        let insertToolbarItem = function insertToolbarItem(aToolbar, aExistsElement, aRelativeElement) {
            return aExistsElement ? this.setupWndCtrl.putElement(aExistsElement, aToolbar, aRelativeElement) : null;
        }.bind(this);
        let relativeElement = aRelativeElementId ? this.gDocument.getElementById(aRelativeElementId) : null;
        let destToolbar = relativeElement ? relativeElement.parentNode : this.setupWndCtrl.appToolbar;
        let toolbaritem;
        let widget = RegisteredWidgets.get(aListItem.id);
        if (widget.isUnique) {
            let existsToolbaritem = this.gDocument.querySelector("toolbaritem[cb-app='" + XB_APP_NAME + "'][cb-proto-id='" + widget.protoId + "']");
            toolbaritem = insertToolbarItem(destToolbar, existsToolbaritem, relativeElement);
        }
        if (!toolbaritem) {
            [
                ,
                toolbaritem
            ] = this.setupWndCtrl.placeWidget(widget.protoId, relativeElement, false, "no");
        }
        if (!toolbaritem) {
            return null;
        }
        toolbaritem.setAttribute("xb-customize", "added");
        let relativeElementIdForList = aRelativeElementId;
        if (!relativeElementIdForList) {
            let allItems = this.getAllWidgetItems();
            for (let i = 0, len = allItems.length; i < len; i++) {
                if (allItems[i] !== toolbaritem) {
                    continue;
                }
                let nextItem = allItems[i + 1];
                if (nextItem && nextItem.id) {
                    relativeElementIdForList = nextItem.id;
                }
                break;
            }
        }
        this.sendStatistic("add." + widget.protoId.split("#")[1].replace(/\./g, "-"));
        return ActiveWidgets.push(toolbaritem.id, relativeElementIdForList);
    },
    removeWidgets: function Preferences_removeWidgets(aListItems, aRemovePermanently) {
        let itemsToRemove = typeof aListItems == "undefined" ? Array.slice(ActiveWidgetsController.list.selectedItems) : aListItems;
        if (!itemsToRemove) {
            return;
        }
        for (let i = itemsToRemove.length; i-- > 0;) {
            this._removeWidget(itemsToRemove[i], aRemovePermanently);
        }
    },
    _removeWidget: function Preferences__removeWidget(aListItem, aRemovePermanently) {
        let toolbaritemId = aListItem.id;
        let toolbaritem = this.gDocument.getElementById(toolbaritemId);
        if (toolbaritem) {
            if (aRemovePermanently) {
                try {
                    this.setupWndCtrl.removeItem(toolbaritem, true);
                } catch (e) {
                    this._logger.error(e);
                }
            } else {
                toolbaritem.setAttribute("xb-customize", "removed");
            }
        }
        ActiveWidgetsController.removeItem(aListItem);
        let widget = ActiveWidgets.remove(toolbaritemId);
        this.sendStatistic("del." + widget.protoId.split("#")[1].replace(/\./g, "-"));
        RegisteredWidgetsController.setWidgetVisibility(widget.protoId, "visible");
    },
    moveWidgets: function Preferences_moveWidgets(aDirection, aRelativeElement) {
        let selectedItems = ActiveWidgetsController.list.selectedItemsSorted;
        if (!selectedItems) {
            return;
        }
        let placeAfter = aDirection === "down";
        let len = selectedItems.length;
        let selectedItem = placeAfter ? selectedItems[len - 1] : selectedItems[0];
        let toolbaritem = this.gDocument.getElementById(selectedItem.id);
        if (!toolbaritem || toolbaritem.id == (aRelativeElement && aRelativeElement.id)) {
            return;
        }
        let parentToolbar = toolbaritem.parentNode;
        let relativeElement;
        let relativeAppElement;
        function _getRelatedAppElement(elem, direction) {
            let allKnownItems = Preferences.getAllWidgetItems();
            let r = elem;
            while (r && (allKnownItems.indexOf(r) === -1 || selectedItems.some(s => s.id == r.id))) {
                r = Preferences._getSiblingNode(r, direction == "up" ? "previous" : "next", true);
            }
            return r;
        }
        if (aDirection) {
            relativeElement = this._getSiblingNode(toolbaritem, aDirection == "up" ? "previous" : "next", true);
            if (placeAfter) {
                relativeElement = this._getSiblingNode(relativeElement, "next", true);
            } else if (!relativeElement) {
                return;
            }
            relativeAppElement = _getRelatedAppElement(relativeElement, "next");
        } else if (aRelativeElement) {
            relativeElement = this.gDocument.getElementById(aRelativeElement.id);
            relativeAppElement = relativeElement;
        }
        ActiveWidgetsController.moveSelectedItems(aDirection, relativeAppElement && relativeAppElement.id);
        let toolbar = relativeElement && relativeElement.parentNode || this.setupWndCtrl.appToolbar;
        let doc = toolbar.ownerDocument;
        let next = toolbaritem.nextSibling;
        let elementsToInsert = selectedItems.map(function (aListItem) {
            let toolbaritem = doc.getElementById(aListItem.id);
            if (!toolbaritem) {
                return;
            }
            if (placeAfter && toolbaritem.nextSibling) {
                next = toolbaritem.nextSibling;
            }
            return toolbaritem;
        }).filter(Boolean);
        if (next && !(next.parentNode && next.parentNode.localName)) {
            next = null;
        }
        if (placeAfter) {
            if (next) {
                if (next === next.parentNode.lastChild) {
                    relativeElement = null;
                    toolbar = next.parentNode;
                }
            } else {
                let nextToolbar = this._getSiblingToolbar(parentToolbar, "next");
                if (nextToolbar && toolbar !== nextToolbar) {
                    relativeElement = nextToolbar.firstChild || null;
                    toolbar = nextToolbar;
                }
            }
        } else {
            if (!next || next === next.parentNode.firstChild) {
                let previousToolbar = this._getSiblingToolbar(parentToolbar, "previous");
                if (previousToolbar) {
                    toolbar = previousToolbar;
                    relativeElement = toolbar.lastChild || null;
                }
            }
        }
        if (relativeElement === toolbaritem && next) {
            relativeElement = next;
        }
        elementsToInsert.forEach(function (element) {
            toolbar.appendChild(element);
            this.setupWndCtrl.putElement(element, toolbar, relativeElement);
        }, this);
        this.checkWidgetsControls();
        let selectedLen = selectedItems.length;
        let activeList = ActiveWidgetsController.list;
        if (selectedLen > 1) {
            activeList.ensureElementIsVisible(selectedItems[selectedItems.length - 1]);
        }
        activeList.ensureElementIsVisible(selectedItems[0]);
    },
    deleteWidgets: function Preferences_deleteWidgets() {
        let selectedItems = Array.slice(RegisteredWidgetsController.list.selectedItems);
        if (!selectedItems.length) {
            return;
        }
        let removableItems = selectedItems.filter(aItem => aItem.isRemovable);
        if (!removableItems.length) {
            return;
        }
        if (!this._confirmComponentsDeletion(removableItems, "widgets")) {
            return;
        }
        let barApp = this.barCore.application;
        let widgetsProtoToRemove = [];
        let checkPackages = Object.create(null);
        removableItems.forEach(function (aItem) {
            let protoId = aItem.getAttribute("id");
            let activeItems = ActiveWidgetsController.getItemsForProto(protoId);
            this.removeWidgets(activeItems, true);
            RegisteredWidgetsController.removeItem(protoId);
            RegisteredWidgets.remove(protoId);
            barApp.forEachWindow(function (controller) {
                controller.removeWidgetsOfProto(protoId);
            });
            let [
                packageID,
                compName
            ] = barApp.BarPlatform.parseComponentID(protoId);
            checkPackages[packageID] = true;
            widgetsProtoToRemove.push(protoId);
        }, this);
        barApp.widgetLibrary.forgetWidgets(widgetsProtoToRemove, true);
        barApp.widgetLibrary.persist(true, false);
        let changedPackages = Object.keys(checkPackages);
        barApp.forEachWindow(function (controller) {
            controller.updatePalette(changedPackages);
        });
        for (let packageID in checkPackages) {
            this._logger.debug("Checking package " + packageID);
            if (!barApp.widgetLibrary.getComponentsInfo(packageID).length) {
                barApp.packageManager.uninstallPackage(packageID, true);
            }
        }
    },
    switchPluginState: function Preferences_switchPluginState(aPluginId) {
        RegisteredPluginsController.switchItemState(aPluginId);
        this._pluginsStateChanged = true;
    },
    _pluginsStateChanged: false,
    _persistToolbarsSet: function Preferences__persistToolbarsSet(aToolbox) {
        if (this.setupWndCtrl._toolbox.customizing) {
            return;
        }
        if (!window.persistCurrentSets) {
            return;
        }
        let toolbox = aToolbox || this.gDocument.getElementById("navigator-toolbox");
        let n = {
            gToolboxChanged: true,
            gToolbox: toolbox,
            gToolboxDocument: toolbox.ownerDocument
        };
        let o = Object.create(null);
        for (let p in n) {
            o[p] = window[p];
            window[p] = n[p];
        }
        window.persistCurrentSets();
        for (let p in o) {
            window[p] = o[p];
        }
    },
    getAllWidgetItems: function Preferences_getAllWidgetItems() {
        let selectors = ["toolbaritem[cb-app='" + XB_APP_NAME + "']"];
        return Array.slice(this.gDocument.querySelectorAll(selectors.join(", ")));
    },
    getItemFromDocumentOrPalette: function Preferences_getItemFromDocumentOrPalette(aWidgetID) {
        return this.gDocument.getElementById(aWidgetID) || this.setupWndCtrl._toolbox.palette.getElementsByAttribute("id", aWidgetID).item(0);
    },
    _setupWndCtrl: null,
    get setupWndCtrl() {
        return this._setupWndCtrl || (this._setupWndCtrl = this.gBrowser[XB_APP_NAME + "OverlayController"]);
    },
    _gBrowser: null,
    get gBrowser() {
        if (!this._gBrowser) {
            let misc = this.barCore.Lib.misc;
            let browser = misc.getTopBrowserWindow();
            if (!browser) {
                window.open("about:blank", "_blank");
                browser = misc.getTopBrowserWindow();
                window.focus();
            }
            if (!browser) {
                throw new Error("Can't create browser for preferences window.");
            }
            browser.addEventListener("unload", this, false);
            this._gBrowser = browser;
        }
        return this._gBrowser;
    },
    get gDocument() {
        return this.gBrowser.document;
    },
    _prefDirChromePath: null,
    get prefDirChromePath() {
        if (!this._prefDirChromePath) {
            this._prefDirChromePath = document.documentURI.split("/preferences.xul")[0];
        }
        return this._prefDirChromePath;
    },
    _transformXML: function Preferences__transformXML(aXML, aStylesheet) {
        if (!(aXML && aStylesheet)) {
            return null;
        }
        let xsltProcessor = Cc["@mozilla.org/document-transformer;1?type=xslt"].createInstance(Ci.nsIXSLTProcessor);
        let result = null;
        try {
            xsltProcessor.importStylesheet(aStylesheet);
            let ownerDocument = document.implementation.createDocument("", "xb-prefs", null);
            result = xsltProcessor.transformToFragment(aXML, ownerDocument);
        } catch (ex) {
            this._logger.error("Can't transform XML. " + ex);
        }
        if (!result || result.documentElement && result.documentElement.localName == "parsererror") {
            this._logger.trace("Can't transform XML.");
            result = null;
        }
        return result;
    },
    get _controlsStylesheet() {
        let fileutils = this.barCore.Lib.fileutils;
        let addonFS = this.barCore.application.addonFS;
        let stylesheetStream = addonFS.getStream("$content/preferences/templates/controls.xsl");
        let styleSheet = fileutils.xmlDocFromStream(stylesheetStream, null, null, true);
        delete this._controlsStylesheet;
        return this._controlsStylesheet = styleSheet;
    },
    transformControlXML: function Preferences_transformControlXML(aControlXML) {
        let result = this._transformXML(aControlXML, this._controlsStylesheet);
        return result ? result.firstChild : null;
    },
    _parseSourceXMLData: function Preferences__parseSourceXMLData(aWidget, aData) {
        if (!(aData && aData.data)) {
            return null;
        }
        try {
            let path = aData.url && /^xb:\/\//.test(aData.url) ? aData.url : aWidget.unitPackage.resolvePath("");
            let uri = Services.io.newURI(path, null, null);
            let domParser = new this._domParserConstructor(null, uri, uri);
            return domParser.parseFromString(aData.data, "text/xml");
        } catch (ex) {
            this._logger.error(ex);
        }
        return null;
    },
    transformSourceXMLData: function Preferences_transformSourceXMLData(aInstanceID, aType, aXMLData, aXSLData) {
        let widget = ActiveWidgets.get(aInstanceID) || RegisteredPlugins.get(aInstanceID);
        if (!widget) {
            return null;
        }
        let xmlData = this._parseSourceXMLData(widget, aXMLData);
        if (!xmlData) {
            return null;
        }
        if (aXSLData) {
            try {
                let stylesheet = this._parseSourceXMLData(widget, aXSLData);
                xmlData = this._transformXML(xmlData, stylesheet);
            } catch (ex) {
                xmlData = null;
            }
            if (!xmlData) {
                return null;
            }
        }
        let result;
        try {
            let type = aType.indexOf("shortcuts") === -1 ? "source" : "shortcuts";
            let fileutils = this.barCore.Lib.fileutils;
            let addonFS = this.barCore.application.addonFS;
            let styleSheet = fileutils.xmlDocFromStream(addonFS.getStream("$content/preferences/templates/controls-" + type + ".xsl"), null, null, true);
            result = this._transformXML(xmlData, styleSheet);
        } catch (ex) {
            this._logger.error(ex);
        }
        if (!result) {
            this._logger.trace("Can't transform XML data for control.");
            return null;
        }
        this._logger.trace("Preferences.transformControlXMLData\n");
        return result;
    },
    onPrefChange: function Preferences_onPrefChange(aItem, aPrefName, aPrefValue) {
        let widget = ActiveWidgets.get(aItem.id) || RegisteredPlugins.get(aItem.id);
        if (!widget) {
            return;
        }
        widget.xbWidget.applySetting(aPrefName, aPrefValue);
    },
    doCommand: function Preferences_doCommand(aCommand, aArguments) {
        try {
            switch (aCommand) {
            case "cmd_addWidgets":
                this.addWidgets(aArguments);
                break;
            case "cmd_remove":
                switch (document.documentElement.currentPane.id) {
                case "prefpane-widgets":
                    this.removeWidgets();
                    break;
                case "prefpane-plugins":
                    this.deletePlugins();
                    break;
                }
                break;
            case "cmd_moveWidgetsUp":
                this.moveWidgets("up");
                break;
            case "cmd_moveWidgetsDown":
                this.moveWidgets("down");
                break;
            case "cmd_moveWidgets":
                this.moveWidgets(null, aArguments);
                break;
            case "cmd_restoreDefault":
                this.restoreDefault();
                break;
            case "cmd_selectAll":
                this.selectAll();
                break;
            case "cmd_deleteWidgets":
                this.deleteWidgets();
                break;
            case "cmd_deletePlugins":
                this.deletePlugins();
                break;
            case "cmd_switchPluginState":
                this.switchPluginState(aArguments);
                break;
            default:
                break;
            }
        } catch (e) {
            this._logger.error("Could not complete command " + aCommand + ". " + this.barCore.Lib.strutils.formatError(e));
            this._logger.debug(e.stack);
        }
    },
    handleEvent: function Preferences_handleEvent(aEvent) {
        try {
            this._handleEvent.apply(this, arguments);
        } catch (e) {
            this._logger.error(this.barCore.Lib.strutils.formatError(e));
            this._logger.debug(e.stack);
        }
    },
    _handleEvent: function Preferences__handleEvent(aEvent) {
        switch (aEvent.type) {
        case "load":
            aEvent.currentTarget.removeEventListener("load", this, false);
            this.sendStatistic("openset");
            if (!ProductBranding.softwareLink) {
                document.documentElement.setAttribute("prefpane-software-hidden", "true");
            }
            [
                "width",
                "height"
            ].forEach(function (aAttrName) {
                if (this.hasAttribute("min" + aAttrName) && this.hasAttribute(aAttrName)) {
                    let minval = parseInt(this.getAttribute("min" + aAttrName), 10);
                    let realval = parseInt(this.getAttribute(aAttrName), 10);
                    if (realval && minval) {
                        let val = Math.max(minval, realval);
                        if (minval > realval) {
                            this.setAttribute(aAttrName, val);
                        }
                        if (aAttrName == "height") {
                            window.outerHeight = val;
                        } else if (aAttrName == "width") {
                            window.outerWidth = val;
                        }
                    }
                }
            }, document.documentElement);
            let locAnchor = window.location.toString().split("#")[1];
            let [
                instanceID,
                paneType
            ] = window.arguments || [];
            if (instanceID !== undefined || paneType !== undefined || Boolean(locAnchor)) {
                this.selectComponent(instanceID, paneType || locAnchor);
            }
            break;
        case "paneload":
            document.documentElement.__defineGetter__("_shouldAnimate", function () {
                return false;
            });
            this._initPane(aEvent.target.id);
            break;
        case "unload":
            document.documentElement.cancelDialog();
            break;
        default:
            break;
        }
    },
    _confirmComponentsDeletion: function Preferences__confirmComponentsDeletion(aItems, aItemsType) {
        const maxComponentsInTitle = 6;
        const maxComponentLabelLength = parseInt(180 / Math.min(aItems.length, maxComponentsInTitle), 10);
        function getShortItemLabel(aItem) {
            let label = aItem.getAttribute("label");
            if (label.length > maxComponentLabelLength) {
                label = label.substr(0, maxComponentLabelLength).replace(/(\s+\S{0,5})$/, "") + "...";
            }
            return label;
        }
        let componentsLabel = (aItems.length > maxComponentsInTitle ? aItems.slice(0, maxComponentsInTitle - 1) : aItems).map(aItem => getShortItemLabel(aItem));
        let moreText = componentsLabel.length == aItems.length ? "" : " " + this.getString("DeleteComponentsAndOthers");
        componentsLabel = "«" + componentsLabel.join("», «") + "»" + moreText;
        let stringPrefix = "Delete" + this.barCore.Lib.strutils.camelize("-" + aItemsType);
        let confirmTitle = this.getStringPlural(stringPrefix + "Title", [aItems.length]);
        let confirmText = this.getStringPlural(stringPrefix + "Text", [aItems.length], [componentsLabel]);
        return this._getUserConfirm(confirmTitle, confirmText);
    },
    _getUserConfirm: function Preferences__getUserConfirm(aTitle, aText) {
        return Services.prompt.confirm(window, aTitle, aText);
    },
    get _stringBundle() {
        delete this._stringBundle;
        return this._stringBundle = new Preferences.barCore.application.appStrings.StringBundle("preferences/preferences.properties");
    },
    getString: function Preferences_getString(aName, aArgs) {
        return this._stringBundle.get(aName, aArgs);
    },
    getStringPlural: function Preferences_getStringPlural(aName, aArgs, aPluralData) {
        return this._stringBundle.getPlural(aName, aArgs, aPluralData);
    },
    onConfidentialBlockClick: function Preferences_onConfidentialBlockClick(aEvent) {
        if (aEvent.target.localName == "a") {
            let domain = "legal.yandex.ru";
            switch (this.barCore.application.branding.brandID) {
            case "ua":
                domain = "legal.yandex.ua";
                break;
            case "tb":
                domain = "legal.yandex.com.tr";
                break;
            }
            let url = aEvent.target.href.replace(/\/legal\.yandex\.[^\/]+\//, "/" + domain + "/");
            this.barCore.Lib.misc.navigateBrowser({
                url: url,
                target: "new tab"
            });
            document.documentElement.acceptDialog();
            window.close();
            return false;
        }
        document.getElementById("send-usage-stat-checkbox").click();
        return false;
    },
    onStatisticsCheckboxCommand: function Preferences_onStatisticsCheckboxCommand(aEvent) {
        this.barCore.application.statistics.sendUsageStat = aEvent.target.checked;
    },
    sendStatistic: function Preferences_sendStatistic(aAction) {
        if (!aAction) {
            return;
        }
        let version = this._addonVersion.replace(/\./g, "-");
        this.barCore.application.statistics.logClickStatistics({
            cid: 72359,
            path: "fx.elmtset." + version + "." + aAction
        });
    }
};
var WidgetsControllerBase = {
    _inited: false,
    _listId: "Empty WidgetController._listId",
    _list: null,
    get list() {
        return this._list || (this._list = document.getElementById(this._listId));
    },
    init: function WidgetsControllerBase_init() {
        this.finalize();
        this.list.PreferencesController = Preferences;
        this._inited = true;
    },
    finalize: function WidgetsControllerBase_finalize() {
        if (this._list) {
            this.list.clear();
            this.list.PreferencesController = null;
            this._list = null;
        }
        this._inited = false;
    },
    insertItem: function WidgetsControllerBase_insertItem(aWidgetProxy, aBeforeID) {
        return this.list.insertItem(aWidgetProxy.isUnique, aWidgetProxy.isRemovable, aWidgetProxy.disabled, aWidgetProxy.protoId, aWidgetProxy.name, aWidgetProxy.iconURL, aBeforeID);
    },
    removeItem: function WidgetsControllerBase_removeItem(aProtoIdOrListItem) {
        let listItem = aProtoIdOrListItem;
        if (typeof listItem == "string") {
            listItem = document.getElementById(aProtoIdOrListItem);
        }
        if (listItem && listItem.parentNode == this.list) {
            this.list.removeItemFromSelection(listItem);
            let indx = this.list.getIndexOfItem(listItem);
            this.list.removeItemAt(indx);
        }
    }
};
var RegisteredWidgetsController = {
    __proto__: WidgetsControllerBase,
    _listId: "registered-widgets-list",
    _list: null,
    setWidgetVisibility: function RWL_setWidgetVisibility(aProtoID, aState) {
        if ([
                "hidden",
                "visible"
            ].indexOf(aState) === -1) {
            throw new Error("Unknown visibility state ('" + aState + "').");
        }
        let listitem = document.getElementById(aProtoID);
        if (listitem) {
            let hidden = aState == "hidden";
            listitem.hidden = hidden;
            if (hidden) {
                this.list.removeItemFromSelection(listitem);
            }
        }
    }
};
var RegisteredPluginsController = {
    __proto__: WidgetsControllerBase,
    _listId: "registered-plugins-list",
    _list: null,
    selectItem: function RPC_selectItem(aWidgetProxy) {
        this.list.selectedItem = document.getElementById(aWidgetProxy.id);
    },
    switchItemState: function RPC_switchItemState(aPluginId) {
        let plugin = RegisteredPlugins.get(aPluginId);
        if (!plugin) {
            return;
        }
        let pluginListItem = document.getElementById(plugin.id);
        if (!pluginListItem) {
            return;
        }
        pluginListItem.processing = true;
        let enabled = plugin.disabled;
        plugin.disabled = !plugin.disabled;
        Preferences.sendStatistic((enabled ? "on" : "off") + "." + aPluginId.split("#")[1].replace(/\./g, "-"));
        pluginListItem.enabled = enabled;
        pluginListItem.processing = false;
    },
    initItemSettings: function RPC_initItemSettings(aItem) {
        let plugin = RegisteredPlugins.get(aItem.id);
        if (plugin) {
            this._initItemSettings(aItem, plugin);
        }
    },
    _initItemSettings: function RPC__initItemSettings(aItem, aWidget) {
        let settingsXULDocument = aWidget.settingsXULDocument;
        let nativeNodesData = SettingsDocumentHelper.createNativeNodes(document, settingsXULDocument, aItem);
        function forEachSetting(settings, eachFunction) {
            if (!settings || typeof settings !== "object") {
                return;
            }
            for (let [
                        name,
                        controlInfo
                    ] in Iterator(settings)) {
                eachFunction(name, controlInfo);
            }
        }
        forEachSetting(aWidget.instanceSettings, function (name, controlInfo) {
            if (this._appendNamedNodes(nativeNodesData, aItem, name, "instance", aWidget, controlInfo)) {
                return;
            }
            let element = this._createSettingUI(aWidget, name, controlInfo);
            if (!element) {
                return;
            }
            aItem.appendChild(element);
        }.bind(this));
        let uniqueWidget = aWidget.isUnique;
        forEachSetting(aWidget.protoSettings, function (name, controlInfo) {
            if (this._appendNamedNodes(nativeNodesData, aItem, name, "proto", aWidget, controlInfo)) {
                return;
            }
            let element = this._createSettingUI(aWidget, name, controlInfo);
            if (!element) {
                return;
            }
            if (!uniqueWidget) {
                element.setAttribute("xb-global-setting-warning", "auto");
                element.setAttribute("xb-global-setting-names", aWidget.name);
            }
            aItem.appendChild(element);
        }.bind(this));
        forEachSetting(aWidget.packageSettings, function (name, controlInfo) {
            if (this._appendNamedNodes(nativeNodesData, aItem, name, "package", aWidget, controlInfo)) {
                return;
            }
            let element = this._createSettingUI(aWidget, name, controlInfo);
            if (!element) {
                return;
            }
            let affectedWidgetIDs = aWidget.unitPackage.getSettingUsers(name);
            let affectedWidgetNames = [];
            try {
                affectedWidgetNames = affectedWidgetIDs.map(function getName(widgetProtoID) {
                    return this.getComponentInfo(widgetProtoID).name;
                }, Preferences.barCore.application.widgetLibrary);
            } catch (e) {
                Preferences._logger.error(e);
            }
            element.setAttribute("xb-global-setting-warning", "auto");
            element.setAttribute("xb-global-setting-names", affectedWidgetNames.join());
            aItem.appendChild(element);
        }.bind(this));
        nativeNodesData.appendNodes(aItem);
        aWidget.updatePreferenceNodes(document);
    },
    _appendNamedNodes: function RPC__appendNamedNodes(aNativeNodesData, aItem, aSettingName, aSettingType, aWidget, aControlInfo) {
        if (!aNativeNodesData.hasNamedNode(aSettingName)) {
            return false;
        }
        let prefPath;
        let defaultValue = aControlInfo && aControlInfo.defaultValue;
        try {
            let nativeComponents = Preferences.barCore.application.NativeComponents;
            switch (aSettingType) {
            case "instance":
                prefPath = nativeComponents.makeInstancePrefPath(aWidget.protoId, aWidget.instanceID, aSettingName);
                break;
            case "proto":
                prefPath = nativeComponents.makeWidgetPrefPath(aWidget.protoId, aSettingName);
                break;
            case "package":
                prefPath = nativeComponents.makePackagePrefPath(aWidget.unitPackage.id, aSettingName);
                break;
            default:
                throw new Error("Wrong setting type.");
            }
        } catch (e) {
            Preferences._logger.error(e);
        }
        return aNativeNodesData.appendNamedNodes(aItem, aSettingName, prefPath, defaultValue);
    },
    _createSettingUI: function RPC__createSettingUI(aWidget, aSettingName, aControlInfo) {
        let control = Preferences.transformControlXML(aControlInfo.controlElement);
        if (!control) {
            return null;
        }
        control.setAttribute("prefName", aSettingName);
        [
            "source",
            "alt-source",
            "template",
            "alt-template",
            "shortcuts-source",
            "shortcuts-alt-source",
            "shortcuts-template",
            "shortcuts-alt-template"
        ].forEach(function (aAttrName) {
            if (control.hasAttribute(aAttrName)) {
                let url = aWidget.makeURL(control.getAttribute(aAttrName));
                if (url) {
                    control.setAttribute(aAttrName, url);
                } else {
                    control.removeAttribute(aAttrName);
                }
            }
        }, this);
        let settingValue = aWidget.xbWidget.getSettingValue(aSettingName);
        if (typeof settingValue !== "undefined") {
            control.setAttribute("value", settingValue);
        }
        return control;
    },
    _executeOnDialogAction: function RWL__executeOnDialogAction(aActionName) {
        if (!this._list) {
            return;
        }
        Array.slice(this._list.querySelectorAll("richlistitem[" + aActionName + "]")).forEach(function (aActionNode) {
            try {
                new Function(aActionNode.getAttribute(aActionName))();
            } catch (ex) {
                Preferences._logger.error(ex);
            }
        });
    },
    onDialogApply: function RWL_onDialogApply() {
        this._executeOnDialogAction("onSettingsApply");
    },
    onDialogCancel: function RWL_onDialogCancel() {
        this._executeOnDialogAction("onSettingsCancel");
    },
    onDialogReset: function RWL_onDialogReset() {
        this._executeOnDialogAction("onSettingsReset");
    }
};
var ActiveWidgetsController = {
    __proto__: RegisteredPluginsController,
    _listId: "active-widgets-list",
    _list: null,
    insertItem: function AWL_insertItem(aWidgetProxy, aBeforeID) {
        if (aWidgetProxy.isUnique) {
            RegisteredWidgetsController.setWidgetVisibility(aWidgetProxy.protoId, "hidden");
        }
        return this.list.insertItem(aWidgetProxy.isUnique, aWidgetProxy.isRemovable, aWidgetProxy.disabled, aWidgetProxy.id, aWidgetProxy.name, aWidgetProxy.iconURL, aBeforeID);
    },
    moveSelectedItems: function AWL_moveSelectedItems(aDirection, aBeforeElementId) {
        return this.list.moveSelectedItems(aDirection, aBeforeElementId);
    },
    getItemsForProto: function AWL_getItemsForProto(aWidgetProtoID) {
        return Array.slice(this.list.childNodes).filter(function (aItem) {
            let widget = ActiveWidgets.get(aItem.id);
            return Boolean(widget && widget.protoId == aWidgetProtoID);
        });
    },
    initItemSettings: function AWL_initItemSettings(aItem) {
        let widget = ActiveWidgets.get(aItem.id);
        if (widget) {
            this._initItemSettings(aItem, widget);
        }
    }
};
var WidgetNodesMutationListener = {
    handlePaletteMutations: function WNML_handlePaletteMutations(mutations) {
        setTimeout(() => {
            this._onPaletteMutations(mutations);
        }, 0);
    },
    handleToolboxMutations: function WNML_handleToolboxMutations(mutations) {
        setTimeout(() => {
            this._onDocumentMutations(mutations);
        }, 0);
    },
    _onPaletteMutations: function WNML_onPaletteMutation(mutations) {
        let paletteItemExists = protoID => {
            let palette = Preferences.setupWndCtrl._toolbox.palette;
            let paletteItemID = Preferences.barCore.application.overlayProvider.compileWidgetItemId(protoID, 0);
            return Boolean(palette.getElementsByAttribute("id", paletteItemID).length);
        };
        let {addedNodes, removedNodes} = this._getMuttationsNodes(mutations);
        for (let addedNode of addedNodes) {
            let protoID = addedNode.getAttribute("cb-proto-id");
            if (!protoID) {
                continue;
            }
            try {
                if (paletteItemExists(protoID) && !RegisteredWidgets.get(protoID)) {
                    RegisteredWidgets.push(protoID);
                }
            } catch (e) {
                Preferences._logger.error("Can't add widget to registered widgets. " + Preferences.barCore.Lib.strutils.formatError(e));
                Preferences._logger.debug(e.stack);
            }
        }
        for (let removedNode of removedNodes) {
            let protoID = removedNode.getAttribute("cb-proto-id");
            if (protoID && !paletteItemExists(protoID)) {
                RegisteredWidgetsController.setWidgetVisibility(protoID, "hidden");
            }
        }
    },
    _onDocumentMutations: function WNML_onDocumentMutations(mutations) {
        let {addedNodes, removedNodes} = this._getMuttationsNodes(mutations);
        for (let addedNode of addedNodes) {
            let toolbaritemId = addedNode.id;
            let activeWidget = ActiveWidgets.get(toolbaritemId);
            if (activeWidget) {
                RegisteredWidgetsController.setWidgetVisibility(activeWidget.protoId, "hidden");
            }
        }
        for (let removedNode of removedNodes) {
            let toolbaritemId = removedNode.id;
            let activeWidget = ActiveWidgets.get(toolbaritemId);
            if (activeWidget && !removedNode.parentNode) {
                ActiveWidgetsController.removeItem(toolbaritemId);
                let widget = ActiveWidgets.remove(toolbaritemId);
                RegisteredWidgetsController.setWidgetVisibility(widget.protoId, "visible");
            }
        }
    },
    _getMuttationsNodes: function (mutations) {
        let addedNodes = [];
        let removedNodes = [];
        for (let mutation of mutations) {
            for (let node of Array.slice(mutation.addedNodes)) {
                if (node.localName === "toolbaritem" && node.getAttribute("cb-app") === XB_APP_NAME) {
                    addedNodes.push(node);
                }
            }
            for (let node of Array.slice(mutation.removedNodes)) {
                if (node.localName === "toolbaritem" && node.getAttribute("cb-app") === XB_APP_NAME) {
                    removedNodes.push(node);
                }
            }
        }
        return {
            addedNodes: addedNodes,
            removedNodes: removedNodes
        };
    }
};
window.__defineSetter__("JSInstObject", function () {
    Preferences._logger.error("Can't use JSInstObject for plugins.");
});
window.addEventListener("load", Preferences, false);
window.addEventListener("paneload", Preferences, false);
