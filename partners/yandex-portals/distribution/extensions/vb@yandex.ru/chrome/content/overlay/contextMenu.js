(function contextMenuInitializer() {
    "use strict";
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const Cu = Components.utils;
    const UI_STATES = {
        DEFAULT: 0,
        SETTINGS_OPENED: 1,
        THUMBS_SUGGEST_OPENED: 2
    };
    const contextMenu = {
        init: function contextMenu_init() {
            let core = Cc["@yandex.ru/vb-core;1"].getService().wrappedJSObject;
            this._application = core.application;
            this._logger = this._application.getLogger("ContextMenu");
            let menu = this._pageContextMenu;
            if (menu) {
                menu.addEventListener("command", this, false);
                menu.addEventListener("popupshowing", this, false);
                menu.addEventListener("popuphidden", this, false);
            }
        },
        finalize: function contextMenu_finalize() {
            let menu = this._pageContextMenu;
            if (menu) {
                menu.removeEventListener("command", this, false);
                menu.removeEventListener("popupshowing", this, false);
                menu.removeEventListener("popuphidden", this, false);
            }
            this._menuitems = null;
            this._menuseparators = null;
            this._application = null;
            this._logger = null;
        },
        handleEvent: function contextMenu_handleEvent(event) {
            switch (event.type) {
            case "popupshowing":
                if (event.target === this._pageContextMenu) {
                    this._onContextMenuPopupShowing();
                }
                break;
            case "popuphidden":
                if (event.target === this._pageContextMenu) {
                    this._onContextMenuPopupHidden();
                }
                break;
            case "command":
                this._onCommandEvent(event);
                break;
            }
        },
        _onContextMenuPopupShowing: function contextMenu__onContextMenuPopupShowing() {
            if (gBrowser.currentURI.spec !== this._application.protocolSupport.url) {
                return;
            }
            let thumbIndex = this._application.thumbs.hoveredThumbIndex;
            let uiState = this._application.thumbs.uiState;
            this._sendStat("contextmenu.cmshow");
            if (thumbIndex === -1) {
                this._menuitems.forEach(item => {
                    let attr = item.getAttribute("data-vbCommand");
                    if (attr === "change-background" && uiState !== UI_STATES.SETTINGS_OPENED) {
                        item.hidden = false;
                    }
                    if (attr === "add" && uiState !== UI_STATES.THUMBS_SUGGEST_OPENED && this._application.layout.hasEmptySpace) {
                        item.hidden = false;
                    }
                });
            } else {
                let thumbData = this._application.internalStructure.getItem(thumbIndex);
                this._menuitems.forEach(function (menuitem) {
                    let hidden = true;
                    switch (menuitem.getAttribute("data-vbCommand")) {
                    case "pin":
                        if (thumbData && !thumbData.pinned) {
                            hidden = false;
                        }
                        break;
                    case "unpin":
                        if (thumbData && thumbData.pinned) {
                            hidden = false;
                        }
                        break;
                    case "delete":
                    case "settings":
                        if (thumbData) {
                            hidden = false;
                        }
                        break;
                    case "change-background":
                        if (uiState !== UI_STATES.SETTINGS_OPENED) {
                            hidden = false;
                        }
                        break;
                    }
                    menuitem.hidden = hidden;
                });
            }
            this._menuseparators.refreshHiddenState();
        },
        _onContextMenuPopupHidden: function contextMenu__onContextMenuPopupHidden() {
            this._menuitems.forEach(menuitem => menuitem.hidden = true);
            this._menuseparators.hide();
        },
        _sendAction: function contextMenu__sendAction(data) {
            this._application.fastdial.sendRequestToTab(this._outerWindowId, "action", data);
        },
        get _outerWindowId() {
            let win = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentWindow;
            let utils = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
            return utils.outerWindowID;
        },
        _onCommandEvent: function contextMenu__onCommandEvent(event) {
            let thumbIndex = this._application.thumbs.hoveredThumbIndex;
            switch (event.target.getAttribute("data-vbCommand")) {
            case "add":
                this._sendStat("contextmenu.addthumbclick");
                this._sendAction({
                    type: "editThumb",
                    thumb: this._application.internalStructure.length
                });
                break;
            case "delete":
                this._sendStat("contextmenu.delthumbclick");
                this._sendAction({
                    type: "removeThumb",
                    thumb: thumbIndex
                });
                break;
            case "pin":
                this._sendStat("contextmenu.pinthumbclick");
                this._application.thumbs.changePinState(thumbIndex, true);
                break;
            case "unpin":
                this._sendStat("contextmenu.pinoffthumbclick");
                this._application.thumbs.changePinState(thumbIndex, false);
                break;
            case "settings":
                this._sendStat("contextmenu.setthumb");
                this._sendAction({
                    type: "editThumb",
                    thumb: thumbIndex
                });
                break;
            case "change-background":
                this._sendStat("contextmenu.setbgclick");
                this._sendAction({ type: "openSettings" });
                break;
            default:
                return;
            }
        },
        _sendStat: function contextMenu__sendStat(param) {
            this._application.fastdial.sendClickerRequest(param);
        },
        get _pageContextMenu() {
            return document.getElementById("contentAreaContextMenu");
        },
        __menuitems: null,
        get _menuitems() {
            if (this.__menuitems) {
                return this.__menuitems;
            }
            this.__menuitems = [];
            let insertTarget = this._pageContextMenu.querySelector("#context-sep-open");
            this.__menuitems = [
                {
                    label: "contextmenu.addThumb",
                    command: "add"
                },
                {
                    label: "contextmenu.removeThumb",
                    command: "delete"
                },
                {
                    label: "contextmenu.pinThumb",
                    command: "pin"
                },
                {
                    label: "contextmenu.unpinThumb",
                    command: "unpin"
                },
                {
                    label: "contextmenu.editThumb",
                    command: "settings"
                },
                {
                    label: "contextmenu.openSettings",
                    command: "change-background"
                }
            ].map(function (menuitemProps) {
                let menuitem = document.createElement("menuitem");
                menuitem.setAttribute("label", this._application.fastdial.getLocalizedString(menuitemProps.label));
                menuitem.setAttribute("data-vbCommand", menuitemProps.command);
                menuitem.hidden = true;
                this._pageContextMenu.insertBefore(menuitem, insertTarget);
                return menuitem;
            }, this);
            return this.__menuitems;
        },
        set _menuitems(val) {
            if (this.__menuitems) {
                this.__menuitems.forEach(function (menuitem) {
                    if (menuitem.parentNode) {
                        menuitem.parentNode.removeChild(menuitem);
                    }
                });
            }
            this.__menuitems = [];
        },
        __menuseparators: null,
        get _menuseparators() {
            if (!this.__menuseparators) {
                let firstSeparator = document.createElement("menuseparator");
                let lastSeparator = document.createElement("menuseparator");
                let hasVisibleNeighbour = function hasVisibleNeighbour(fromElement, direction) {
                    let element = fromElement[direction];
                    while (element && element.hidden) {
                        element = element[direction];
                    }
                    return element && element.localName !== "menuseparator";
                };
                let refreshHiddenState = function contextMenu_menuseparators_refreshHiddenState() {
                    let allItemsIsHidden = this._menuitems.every(menuitem => menuitem.hidden);
                    if (allItemsIsHidden) {
                        firstSeparator.hidden = true;
                        lastSeparator.hidden = true;
                    } else {
                        firstSeparator.hidden = !hasVisibleNeighbour(firstSeparator, "previousSibling");
                        lastSeparator.hidden = !hasVisibleNeighbour(lastSeparator, "nextSibling");
                    }
                }.bind(this);
                this.__menuseparators = {
                    first: firstSeparator,
                    last: lastSeparator,
                    refreshHiddenState: refreshHiddenState,
                    hide: function contextMenu_menuseparators_hide() {
                        this.first.hidden = true;
                        this.last.hidden = true;
                    }
                };
                let menuitems = this._menuitems;
                this._pageContextMenu.insertBefore(firstSeparator, menuitems[0]);
                this._pageContextMenu.insertBefore(lastSeparator, menuitems[menuitems.length - 1].nextSibling);
                refreshHiddenState();
            }
            return this.__menuseparators;
        },
        set _menuseparators(val) {
            if (this.__menuseparators) {
                [
                    this.__menuseparators.first,
                    this.__menuseparators.last
                ].forEach(function (separator) {
                    if (separator.parentNode) {
                        separator.parentNode.removeChild(separator);
                    }
                });
            }
            this.__menuseparators = null;
        },
        _application: null,
        _logger: null
    };
    window.addEventListener("load", function onLoadListener() {
        window.removeEventListener("load", onLoadListener, false);
        contextMenu.init();
        window.addEventListener("unload", function unLoadListener() {
            window.removeEventListener("unload", unLoadListener, false);
            contextMenu.finalize();
        }, false);
    }, false);
}());
