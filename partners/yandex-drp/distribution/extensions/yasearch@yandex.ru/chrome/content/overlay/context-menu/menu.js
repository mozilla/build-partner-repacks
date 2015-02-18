(function () {
    "use strict";
    const APP_NAME = CB_APP_NAME;
    const BAR_NS = "http://bar.yandex.ru/firefox/";
    let {
        classes: Cc,
        interfaces: Ci
    } = Components;
    Cu.import("resource://gre/modules/Services.jsm");
    const contextMenu = {
        get application() {
            return this._application;
        },
        _startup: function YaContextMenu__startup() {
            this._application = Cc["@yandex.ru/custombarcore;" + APP_NAME].getService().wrappedJSObject.application;
            this._logger = this._application.getLogger("ContextMenu");
            let menu = this._pageContextMenu;
            if (menu) {
                menu.addEventListener("command", this, false);
                menu.addEventListener("popupshowing", this, false);
                menu.addEventListener("popuphidden", this, false);
            }
        },
        _shutdown: function YaContextMenu__shutdown() {
            let menu = this._pageContextMenu;
            if (menu) {
                menu.removeEventListener("command", this, false);
                menu.removeEventListener("popupshowing", this, false);
                menu.removeEventListener("popuphidden", this, false);
            }
            this.__httpCacheSession = null;
            this.__diskCacheStorage = null;
            this.__menuItemsData = null;
            this._application = null;
            this._logger = null;
        },
        MENUITEMS_ID_PREFIX: APP_NAME + "-contextMenuIdPrefix-",
        get _pageContextMenu() {
            return document.getElementById("contentAreaContextMenu");
        },
        get _hiddenItem() {
            let hiddenItemId = this.MENUITEMS_ID_PREFIX + "hidden";
            let hiddenItem = document.getElementById(hiddenItemId);
            if (!hiddenItem) {
                hiddenItem = document.createElement("menuseparator");
                hiddenItem.setAttribute("id", hiddenItemId);
                hiddenItem.setAttribute("hidden", "true");
                let itemTargets = [
                    "context-keywordfield",
                    "context-searchselect",
                    "frame-sep"
                ];
                let itemExists = itemTargets.some(function (id) {
                    let item = this.querySelector("#" + id);
                    if (!item) {
                        return false;
                    }
                    this.insertBefore(hiddenItem, item);
                    return true;
                }, this._pageContextMenu);
                if (!itemExists) {
                    this._pageContextMenu.appendChild(hiddenItem);
                }
            }
            return hiddenItem;
        },
        _lastWord: null,
        MAX_QUERY_LENGTH: 400,
        _cropSelectionText: function YaContextMenu__cropSelectionText(aString) {
            if (aString) {
                if (aString.length > this.MAX_QUERY_LENGTH) {
                    let pattern = new RegExp("^(?:\\s*.){0," + this.MAX_QUERY_LENGTH + "}");
                    pattern.test(aString);
                    aString = RegExp.lastMatch;
                }
                aString = aString.trim().replace(/\s+/g, " ");
                if (aString.length > this.MAX_QUERY_LENGTH) {
                    aString = aString.substr(0, this.MAX_QUERY_LENGTH);
                }
            }
            return aString;
        },
        handleEvent: function YaContextMenu_handleEvent(event) {
            switch (event.type) {
            case "command":
                this._onCommandEvent(event);
                break;
            case "popupshowing":
                if (event.target == this._pageContextMenu) {
                    this._onContextMenuPopupShowing();
                }
                break;
            case "popuphidden":
                if (event.target == this._pageContextMenu) {
                    this._onContextMenuPopupHidden();
                }
                break;
            case "load":
                event.currentTarget.removeEventListener("load", this, false);
                event.currentTarget.addEventListener("unload", this, false);
                this._startup();
                break;
            case "unload":
                event.currentTarget.removeEventListener("unload", this, false);
                this._shutdown();
                break;
            }
        },
        _onContextMenuPopupShowing: function YaContextMenu__onContextMenuPopupShowing() {
            let imageSearchType;
            let imageURL = null;
            if (!gContextMenu.isContentSelected) {
                if (gContextMenu.onImage && gContextMenu.mediaURL) {
                    imageURL = gContextMenu.mediaURL;
                } else if (gContextMenu.bgImageURL) {
                    let shouldShow = !(gContextMenu.onImage || gContextMenu.onCanvas || gContextMenu.onVideo || gContextMenu.onAudio || gContextMenu.onLink || gContextMenu.onTextInput);
                    if (shouldShow) {
                        imageURL = gContextMenu.bgImageURL;
                    }
                }
            }
            if (/^https?:\/\//.test(imageURL)) {
                imageSearchType = "get";
            } else if (this.BASE64_RE.test(imageURL)) {
                imageSearchType = "post";
                imageURL = imageURL.replace(this.BASE64_RE, "");
            } else {
                imageURL = null;
            }
            if (imageURL) {
                cacheHelper.getMIMETypeForURL(imageURL).then(function (imageMIMEType) {
                    if (imageSearchType === "get" && !this.MIME_RE.test(imageMIMEType)) {
                        return;
                    }
                    this._lastImage = {
                        url: imageURL,
                        searchType: imageSearchType
                    };
                    this._menuItemsData.images.forEach(function (linkData) {
                        let extraData = linkData.extraData;
                        let dataForRequest = Boolean(extraData[imageSearchType]);
                        if (dataForRequest) {
                            this._pageContextMenu.insertBefore(linkData.link, this._hiddenItem);
                        }
                    }, this);
                }.bind(this));
            }
            let selectedText = "";
            let cmTarget = gContextMenu.target;
            if (gContextMenu.isContentSelected) {
                let focusedWindow = gContextMenu.focusedWindow;
                let selection = focusedWindow ? focusedWindow.getSelection().toString() : "";
                selectedText = this._cropSelectionText(selection);
            } else if (gContextMenu.onTextInput && !cmTarget.readOnly && cmTarget.type != "password") {
                if (cmTarget.value) {
                    selectedText = cmTarget.value.toString().slice(cmTarget.selectionStart, cmTarget.selectionEnd);
                    selectedText = this._cropSelectionText(selectedText);
                }
            }
            this._lastWord = selectedText;
            if (selectedText) {
                if (selectedText.length > 15) {
                    selectedText = selectedText.substr(0, 15) + "...";
                }
                this._menuItemsData.texts.forEach(function (linkData) {
                    let link = linkData.link;
                    link.setAttribute("label", link.getAttribute("label").replace("{searchTermsCropped}", selectedText));
                    this._pageContextMenu.insertBefore(link, this._hiddenItem);
                }, this);
            }
            document.getElementById("context-searchselect").hidden = true;
        },
        _onContextMenuPopupHidden: function YaContextMenu__onContextMenuPopupHidden() {
            this._lastImage = null;
            this._lastWord = null;
            let elements = this._pageContextMenu.getElementsByAttributeNS(BAR_NS, "contextType", "*");
            let i = elements.length;
            while (i--) {
                let el = elements.item(i);
                el.parentNode.removeChild(el);
            }
            document.getElementById("context-searchselect").hidden = false;
        },
        __menuItemsData: null,
        get _menuItemsData() {
            if (!this.__menuItemsData) {
                this.__menuItemsData = {
                    images: [],
                    texts: []
                };
                let imagesTemplateParams = {
                    packagePath: this._application.name + "://branding/",
                    contextType: "selectedImage",
                    methodSelector: "default"
                };
                let imagesFragment = this._transformToXULMenu("images", this._browserConfXML, imagesTemplateParams);
                Array.slice(imagesFragment.childNodes).forEach(function (linkNode) {
                    let extraData = Object.create(null);
                    this._application.core.Lib.xmlutils.queryXMLDoc("./*[local-name() = 'methods']/*[local-name() = 'method']", linkNode).forEach(function (method) {
                        let extra = extraData[method.getAttributeNS(BAR_NS, "type")] = {};
                        Array.slice(method.childNodes).forEach(function (field) {
                            extra[field.getAttributeNS(BAR_NS, "name")] = field.getAttributeNS(BAR_NS, "value");
                        });
                    });
                    while (linkNode.firstChild) {
                        linkNode.removeChild(linkNode.firstChild);
                    }
                    this.__menuItemsData.images.push({
                        get link() {
                            return linkNode.cloneNode(true);
                        },
                        get extraData() {
                            return extraData;
                        }
                    });
                }, this);
                let textsTemplateParams = {
                    packagePath: this._application.name + "://branding/",
                    contextType: "selectedText"
                };
                let textsFragment = this._transformToXULMenu("texts", this._browserConfXML, textsTemplateParams);
                Array.slice(textsFragment.childNodes).forEach(function (linkNode) {
                    this.__menuItemsData.texts.push({
                        get link() {
                            return linkNode.cloneNode(true);
                        },
                        get extraData() {
                            return {};
                        }
                    });
                }, this);
            }
            return this.__menuItemsData;
        },
        BASE64_RE: /^data:image\/((x\-ms\-)?bmp|gif|jpeg|jpg|png|tiff);base64,/,
        MIME_RE: /^image\/((x\-ms\-)?bmp|gif|jpeg|jpg|png|tiff)$/,
        DEFAULT_QUERY_CHARSET: "ISO-8859-1",
        _textToSubURI: Cc["@mozilla.org/intl/texttosuburi;1"].getService(Ci.nsITextToSubURI),
        _convertQueryForURI: function YaContextMenu__convertQueryForURI(aData, aQueryCharset) {
            try {
                return this._textToSubURI.ConvertAndEscape(aQueryCharset || this.DEFAULT_QUERY_CHARSET, aData);
            } catch (ex) {
            }
            return this._textToSubURI.ConvertAndEscape(this.DEFAULT_QUERY_CHARSET, aData);
        },
        _onCommandEvent: function YaContextMenu__onCommandEvent(event) {
            let target = event.target;
            if (!target) {
                return;
            }
            switch (target.getAttributeNS(BAR_NS, "contextType")) {
            case "selectedText":
                if (!this._searchText(event)) {
                    return;
                }
                break;
            case "selectedImage":
                if (!this._searchImage(event)) {
                    return;
                }
                break;
            default:
                return;
            }
        },
        _searchText: function YaContextMenu__searchText(event) {
            if (!this._lastWord) {
                return false;
            }
            let target = event.target;
            let url = target.getAttributeNS(BAR_NS, "linkURL");
            if (!url) {
                return false;
            }
            let encoding = target.getAttributeNS(BAR_NS, "linkEncoding");
            let templateValues = { searchTerms: this._convertQueryForURI(this._lastWord, encoding) };
            this._application.core.Lib.misc.navigateBrowser({
                url: this._application.branding.expandBrandTemplates(url, templateValues),
                eventInfo: event,
                target: "new tab"
            });
            return true;
        },
        _searchImage: function YaContextMenu__searchImage(event) {
            if (!this._lastImage) {
                return false;
            }
            let target = event.target;
            let url = target.getAttributeNS(BAR_NS, "linkURL");
            if (!url) {
                return false;
            }
            let imageSearchType = this._lastImage.searchType;
            let dataForRequest;
            this._menuItemsData.images.some(function (linkData) {
                return linkData.link.getAttributeNS(BAR_NS, "linkURL") === url && Boolean(dataForRequest = linkData.extraData[imageSearchType]);
            });
            if (!dataForRequest) {
                return;
            }
            url = this._application.branding.expandBrandTemplates(url);
            let postData = null;
            switch (imageSearchType) {
            case "get": {
                    for (let [
                                key,
                                value
                            ] in Iterator(dataForRequest)) {
                        value = value.replace("{image.url}", this._lastImage.url);
                        value = this._application.branding.expandBrandTemplates(value);
                        url += "&" + key + "=" + encodeURIComponent(value);
                    }
                    break;
                }
            case "post": {
                    let postParams = [];
                    for (let [
                                key,
                                value
                            ] in Iterator(dataForRequest)) {
                        value = value.replace("{image.data}", this._lastImage.url);
                        value = this._application.branding.expandBrandTemplates(value);
                        postParams.push(key + "=" + encodeURIComponent(value));
                    }
                    postParams = postParams.join("&");
                    let postStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
                    postStream.setData(postParams, postParams.length);
                    postData = Cc["@mozilla.org/network/mime-input-stream;1"].createInstance(Ci.nsIMIMEInputStream);
                    postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
                    postData.addContentLength = true;
                    postData.setData(postStream);
                    break;
                }
            default:
                return false;
            }
            this._application.core.Lib.misc.navigateBrowser({
                url: url,
                postData: postData,
                eventInfo: event,
                target: "new tab"
            });
            return true;
        },
        _transformToXULMenu: function YaContextMenu__transformToXULMenu(type, xmlDoc, aParams) {
            let Lib = this._application.core.Lib;
            let xslStream = this._application.addonFS.getStream("$content/overlay/context-menu/" + type + ".xsl");
            let xsl = Lib.fileutils.xmlDocFromStream(xslStream, null, null, true);
            return Lib.xmlutils.transformXMLToFragment(xmlDoc, xsl, document, aParams);
        },
        __browserConfXML: null,
        get _browserConfXML() {
            if (!this.__browserConfXML) {
                this.__browserConfXML = this._application.branding.brandPackage.getXMLDocument("/browser/browserconf.xml");
            }
            return this.__browserConfXML;
        },
        _application: null,
        _logger: null
    };
    let cacheHelper = {
        getMIMETypeForURL: function cacheHelper_getMIMETypeForURL(url) {
            let applicationLib = contextMenu.application.core.Lib;
            let defer = applicationLib.promise.defer();
            let cacheKey = url.replace(/#.*$/, "");
            try {
                cacheKey = applicationLib.misc.tryCreateFixupURI(cacheKey).asciiSpec;
            } catch (e) {
            }
            let redirects = 0;
            let listener = {
                onCacheEntryCheck: function cacheHelper_listener_onCacheEntryCheck(entry, appcache) {
                    return Ci.nsICacheEntryOpenCallback.ENTRY_WANTED;
                },
                onCacheEntryAvailable: function cacheHelper_listener_onCacheEntryAvailable(entry, isnew, appcache, status) {
                    let type = null;
                    if (status === Cr.NS_OK && entry) {
                        let response = "";
                        try {
                            response = entry.getMetaDataElement("response-head");
                        } catch (e) {
                        }
                        if (redirects++ < 2) {
                            let location = /^Location:\s*(.+)$/im.exec(response);
                            location = location && location[1] || null;
                            if (location) {
                                asyncOpenCacheEntry(location.replace(/#.*$/, ""));
                                return;
                            }
                        }
                        type = /^Content\-Type:\s*(.*?)\s*(?:\;|$)/im.exec(response);
                        type = type && type[1].toLowerCase() || null;
                    }
                    defer.resolve(type);
                },
                onCacheEntryDoomed: function cacheHelper_listener_onCacheEntryDoomed() {
                }
            };
            let asyncOpenCacheEntry = function asyncOpenCacheEntry(url) {
                if (this._diskCacheStorage) {
                    this._diskCacheStorage.asyncOpenURI(Services.io.newURI(url, null, null), "", Ci.nsICacheStorage.OPEN_READONLY, listener);
                } else {
                    this._httpCacheSession.asyncOpenCacheEntry(url, Ci.nsICache.ACCESS_READ, {
                        onCacheEntryAvailable: function asyncOpenCacheEntry_onCacheEntryAvailable(entry, accessGranted, status) {
                            return listener.onCacheEntryAvailable(entry, false, false, status);
                        },
                        onCacheEntryDoomed: function asyncOpenCacheEntry_onCacheEntryDoomed() {
                        }
                    }, true);
                }
            }.bind(this);
            asyncOpenCacheEntry(cacheKey);
            return defer.promise;
        },
        __httpCacheSession: null,
        get _httpCacheSession() {
            if (!this.__httpCacheSession) {
                this.__httpCacheSession = Services.cache.createSession("HTTP", Ci.nsICache.STORE_ANYWHERE, true);
                this.__httpCacheSession.doomEntriesIfExpired = false;
            }
            return this.__httpCacheSession;
        },
        __diskCacheStorage: null,
        get _diskCacheStorage() {
            if (this.__diskCacheStorage === null) {
                if (Services.cache2 && !contextMenu.application.core.Lib.sysutils.platformInfo.browser.version.isLessThan("30.a1")) {
                    let {LoadContextInfo} = Cu.import("resource://gre/modules/LoadContextInfo.jsm", null);
                    this.__diskCacheStorage = Services.cache2.diskCacheStorage(LoadContextInfo.default, false);
                } else {
                    this.__diskCacheStorage = false;
                }
            }
            return this.__diskCacheStorage;
        }
    };
    window.addEventListener("load", contextMenu, false);
}());
