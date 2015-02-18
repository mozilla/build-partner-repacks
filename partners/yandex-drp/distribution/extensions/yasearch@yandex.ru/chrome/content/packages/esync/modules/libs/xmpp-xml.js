let EXPORTED_SYMBOLS = [
    "Stanza",
    "XMPPParser"
];
let NS = {
    xml: "http://www.w3.org/XML/1998/namespace",
    xhtml: "http://www.w3.org/1999/xhtml",
    xhtml_im: "http://jabber.org/protocol/xhtml-im",
    client: "jabber:client",
    streams: "http://etherx.jabber.org/streams",
    stream: "urn:ietf:params:xml:ns:xmpp-streams",
    sasl: "urn:ietf:params:xml:ns:xmpp-sasl",
    tls: "urn:ietf:params:xml:ns:xmpp-tls",
    bind: "urn:ietf:params:xml:ns:xmpp-bind",
    session: "urn:ietf:params:xml:ns:xmpp-session",
    auth: "jabber:iq:auth",
    auth_feature: "http://jabber.org/features/iq-auth",
    http_bind: "http://jabber.org/protocol/httpbind",
    http_auth: "http://jabber.org/protocol/http-auth",
    xbosh: "urn:xmpp:xbosh",
    "private": "jabber:iq:private",
    xdata: "jabber:x:data",
    roster: "jabber:iq:roster",
    roster_versioning: "urn:xmpp:features:rosterver",
    roster_delimiter: "roster:delimiter",
    privacy: "jabber:iq:privacy",
    disco_info: "http://jabber.org/protocol/disco#info",
    disco_items: "http://jabber.org/protocol/disco#items",
    caps: "http://jabber.org/protocol/caps",
    address: "http://jabber.org/protocol/address",
    muc_user: "http://jabber.org/protocol/muc#user",
    muc: "http://jabber.org/protocol/muc",
    register: "jabber:iq:register",
    delay: "urn:xmpp:delay",
    delay_legacy: "jabber:x:delay",
    bookmarks: "storage:bookmarks",
    chatstates: "http://jabber.org/protocol/chatstates",
    event: "jabber:x:event",
    stanzas: "urn:ietf:params:xml:ns:xmpp-stanzas",
    vcard: "vcard-temp",
    vcard_update: "vcard-temp:x:update",
    ping: "urn:xmpp:ping",
    geoloc: "http://jabber.org/protocol/geoloc",
    geoloc_notify: "http://jabber.org/protocol/geoloc+notify",
    mood: "http://jabber.org/protocol/mood",
    tune: "http://jabber.org/protocol/tune",
    nick: "http://jabber.org/protocol/nick",
    nick_notify: "http://jabber.org/protocol/nick+notify",
    activity: "http://jabber.org/protocol/activity",
    last: "jabber:iq:last",
    avatar_data: "urn:xmpp:avatar:data",
    avatar_data_notify: "urn:xmpp:avatar:data+notify",
    avatar_metadata: "urn:xmpp:avatar:metadata",
    avatar_metadata_notify: "urn:xmpp:avatar:metadata+notify",
    pubsub: "http://jabber.org/protocol/pubsub",
    pubsub_event: "http://jabber.org/protocol/pubsub#event",
    yasync: "ya:push:sync"
};
let TOP_LEVEL_ELEMENTS = {
    "message": "jabber:client",
    "presence": "jabber:client",
    "iq": "jabber:client",
    "stream:features": "http://etherx.jabber.org/streams",
    "proceed": "urn:ietf:params:xml:ns:xmpp-tls",
    "failure": [
        "urn:ietf:params:xml:ns:xmpp-tls",
        "urn:ietf:params:xml:ns:xmpp-sasl"
    ],
    "success": "urn:ietf:params:xml:ns:xmpp-sasl",
    "challenge": "urn:ietf:params:xml:ns:xmpp-sasl",
    "error": "urn:ietf:params:xml:ns:xmpp-streams"
};
let Stanza = {
    NS: NS,
    presence: function (aAttr, aData) {
        return Stanza.node("presence", null, aAttr, aData);
    },
    message: function (aTo, aMsg, aState, aAttr, aData) {
        if (!aAttr) {
            aAttr = {};
        }
        aAttr.to = aTo;
        if (!("type" in aAttr)) {
            aAttr.type = "chat";
        }
        if (!aData) {
            aData = [];
        }
        if (aMsg) {
            aData.push(Stanza.node("body", null, null, aMsg));
        }
        if (aState) {
            aData.push(Stanza.node(aState, Stanza.NS.chatstates));
        }
        return Stanza.node("message", null, aAttr, aData);
    },
    iq: function (aType, aId, aTo, aData) {
        let attrs = { type: aType };
        if (aId) {
            attrs.id = aId;
        }
        if (aTo) {
            attrs.to = aTo;
        }
        return this.node("iq", null, attrs, aData);
    },
    node: function (aName, aNs, aAttr, aData) {
        let n = new XMLNode(null, aNs, aName, aName, null);
        if (aAttr) {
            for (let at in aAttr)
                n.attributes[at] = aAttr[at];
        }
        if (aData) {
            if (!Array.isArray(aData)) {
                aData = [aData];
            }
            for (let i = 0, len = aData.length; i < len; i++) {
                let child = aData[i];
                n[typeof child == "string" ? "addText" : "addChild"](child);
            }
        }
        return n;
    }
};
function TextNode(aText) {
    this.text = aText;
}
TextNode.prototype = {
    get type() "text",
    append: function (aText) {
        this.text += aText;
    },
    convertToString: function (aIndent) {
        return aIndent + this.text + "\n";
    },
    getXML: function () {
        return Components.classes["@mozilla.org/txttohtmlconv;1"].getService(Ci.mozITXTToHTMLConv).scanTXT(this.text, Ci.mozITXTToHTMLConv.kEntities);
    },
    get innerText() {
        return this.text;
    }
};
function XMLNode(aParentNode, aUri, aLocalName, aQName, aAttr) {
    this._parentNode = aParentNode;
    this.uri = aUri;
    this.localName = aLocalName;
    this.qName = aQName;
    this.attributes = {};
    this.children = [];
    if (aAttr) {
        for (let i = 0; i < aAttr.length; ++i)
            this.attributes[aAttr.getQName(i)] = aAttr.getValue(i);
    }
}
XMLNode.prototype = {
    get type() "node",
    addChild: function (aNode) {
        this.children.push(aNode);
    },
    addText: function (aText) {
        let lastIndex = this.children.length - 1;
        if (lastIndex >= 0 && this.children[lastIndex] instanceof TextNode) {
            this.children[lastIndex].append(aText);
        } else
            this.children.push(new TextNode(aText));
    },
    getChildrenByNS: function (aNS) {
        return this.children.filter(function (c) {
            return c.uri == aNS;
        });
    },
    getElement: function (aQuery) {
        if (aQuery.length === 0) {
            return this;
        }
        let nq = aQuery.slice(1);
        for (let [
                    ,
                    child
                ] in Iterator(this.children)) {
            if (child.qName != aQuery[0]) {
                continue;
            }
            let n = child.getElement(nq);
            if (n) {
                return n;
            }
        }
        return null;
    },
    getElements: function (aQuery) {
        if (aQuery.length === 0) {
            return [this];
        }
        let nq = aQuery.slice(1);
        let res = [];
        this.getChildren(aQuery[0]).forEach(function (child) {
            res = res.concat(child.getElements(nq));
        });
        return res;
    },
    getChildren: function (aName) {
        return this.children.filter(function (c) {
            return c.qName == aName;
        });
    },
    isXmppStanza: function () {
        if (!TOP_LEVEL_ELEMENTS.hasOwnProperty(this.qName)) {
            return false;
        }
        let ns = TOP_LEVEL_ELEMENTS[this.qName];
        return ns == this.uri || Array.isArray(ns) && ns.indexOf(this.uri) != -1;
    },
    convertToString: function (aIndent) {
        if (!aIndent) {
            aIndent = "";
        }
        let s = aIndent + "<" + this.qName + this._getXmlns() + this._getAttributeText();
        let content = "";
        this.children.forEach(function (child) {
            content += child.convertToString(aIndent + " ");
        });
        return s + (content ? ">\n" + content + aIndent + "</" + this.qName : "/") + ">\n";
    },
    getXML: function () {
        let s = "<" + this.qName + this._getXmlns() + this._getAttributeText();
        let innerXML = this.innerXML;
        return s + (innerXML ? ">" + innerXML + "</" + this.qName : "/") + ">";
    },
    get innerXML() this.children.map(function (c) {
        return c.getXML();
    }).join(""),
    get innerText() this.children.map(function (c) {
        return c.innerText;
    }).join(""),
    _getXmlns: function () {
        return this.uri ? " xmlns=\"" + this.uri + "\"" : "";
    },
    _getAttributeText: function () {
        let s = "";
        for (let name in this.attributes)
            s += " " + name + "=\"" + this.attributes[name] + "\"";
        return s;
    }
};
function XMPPParser(aListener) {
    this._logger = NativeAPI.logger.getLogger("XMPPParser");
    this._parser = Cc["@mozilla.org/saxparser/xmlreader;1"].createInstance(Ci.nsISAXXMLReader);
    this._parser.contentHandler = this;
    this._parser.errorHandler = this;
    this._parser.parseAsync(null);
    this._listener = aListener;
    this._parser.onStartRequest(this._dummyRequest, null);
}
;
XMPPParser.prototype = {
    _destroyPending: false,
    destroy: function () {
        this._parser.contentHandler = null;
        delete this._listener;
        if (this._inOnDataAvailable) {
            this._destroyPending = true;
            return;
        }
        this._parser.onStopRequest(this._dummyRequest, null, Cr.NS_OK);
        this._parser.errorHandler = null;
        delete this._parser;
    },
    _dummyRequest: {
        cancel: function () {
        },
        isPending: function () {
        },
        resume: function () {
        },
        suspend: function () {
        }
    },
    _logReceivedData: function (aData) {
        this._logger.trace("INPUT:\n" + aData);
    },
    _inOnDataAvailable: false,
    onDataAvailable: function (aInputStream, aOffset, aCount) {
        this._inOnDataAvailable = true;
        this._parser.onDataAvailable(this._dummyRequest, null, aInputStream, aOffset, aCount);
        delete this._inOnDataAvailable;
        if (this._destroyPending) {
            this.destroy();
        }
    },
    startDocument: function () {
    },
    endDocument: function () {
    },
    startElement: function (aUri, aLocalName, aQName, aAttributes) {
        if (aQName == "stream:stream") {
            let node = new XMLNode(null, aUri, aLocalName, aQName, aAttributes);
            this._logReceivedData(node.convertToString().slice(0, -3) + ">\n");
            if ("_node" in this) {
                this._listener.onXMLError("unexpected-stream-start", "stream:stream inside an already started stream");
                return;
            }
            this._listener._streamId = node.attributes["id"];
            if (!("version" in node.attributes)) {
                this._listener.startLegacyAuth();
            }
            this._node = null;
            return;
        }
        let node = new XMLNode(this._node, aUri, aLocalName, aQName, aAttributes);
        if (this._node) {
            this._node.addChild(node);
        }
        this._node = node;
    },
    characters: function (aCharacters) {
        if (!this._node) {
            if (aCharacters.trim()) {
                this._listener.onXMLError("parsing-characters", "No parent for characters: " + aCharacters);
            }
            return;
        }
        this._node.addText(aCharacters);
    },
    endElement: function (aUri, aLocalName, aQName) {
        if (aQName == "stream:stream") {
            this._logReceivedData("</stream:stream>");
            delete this._node;
            return;
        }
        if (!this._node) {
            this._listener.onXMLError("parsing-node", "No parent for node : " + aLocalName);
            return;
        }
        if (this._node.isXmppStanza()) {
            this._logReceivedData(this._node.convertToString());
            try {
                this._listener.onXmppStanza(this._node);
            } catch (e) {
                this._logger.error(e);
            }
        }
        this._node = this._node._parentNode;
    },
    processingInstruction: function (aTarget, aData) {
    },
    ignorableWhitespace: function (aWhitespace) {
    },
    startPrefixMapping: function (aPrefix, aUri) {
    },
    endPrefixMapping: function (aPrefix) {
    },
    error: function (aLocator, aError) {
        if (this._listener) {
            this._listener.onXMLError("parse-error", aError);
        }
    },
    fatalError: function (aLocator, aError) {
        this._logger.debug("aLocator " + JSON.stringify(aLocator));
        if (this._listener) {
            this._listener.onXMLError("parse-fatal-error", aError);
        }
    },
    ignorableWarning: function (aLocator, aError) {
        if (this._listener) {
            this._listener.onXMLError("parse-warning", aError);
        }
    },
    QueryInterface: function (aInterfaceId) {
        if (!aInterfaceId.equals(Ci.nsISupports) && !aInterfaceId.equals(Ci.nsISAXContentHandler) && !aInterfaceId.equals(Ci.nsISAXErrorHandler))
            throw Cr.NS_ERROR_NO_INTERFACE;
        return this;
    }
};
