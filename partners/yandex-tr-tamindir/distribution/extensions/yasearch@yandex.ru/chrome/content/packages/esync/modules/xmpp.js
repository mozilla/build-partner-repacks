"use strict";
let EXPORTED_SYMBOLS = ["XMPP"];
let {API} = require("api");
let {Utils} = require("utils");
let CONFIG = {
    HOST: NativeAPI.Settings.getValue("debugServer") ? "xmpp-tst.disk.yandex.net" : "xmpp.disk.yandex.net",
    PORT: 5222,
    DOMAIN: "yandex.ru",
    PING_TIMEOUT: 1000 * 60,
    RECONNECT_TIMEOUT: 1000 * 30
};
let XMPP = {
    init: function XMPP_init() {
        this._logger = NativeAPI.logger.getLogger("XMPP");
        this._logger.debug("init");
        this._token = require("auth").Auth.token;
        if (!this._token) {
            throw new Error("Can not get auth token");
        }
        let TCPSocket = require("libs/TCPSocket").TCPSocket;
        this._TCPSocket = new TCPSocket();
        this._Stanza = require("libs/xmpp-xml").Stanza;
        this._XMPPParser = require("libs/xmpp-xml").XMPPParser;
        this._createSocket();
    },
    finalize: function XMPP_finalize() {
        this._logger.debug("finalize");
        if (!this._token) {
            return;
        }
        this._token = null;
        this._stopPinging();
        if (this._socket) {
            this._socket.close();
            this._socket = null;
        }
        if (this._TCPSocket) {
            this._TCPSocket.close();
            this._TCPSocket = null;
        }
        if (this._parser) {
            this._parser.destroy();
            this._parser = null;
        }
        this._XMPPParser = null;
        this._Stanza = null;
    },
    getXmppEngineName: function XMPP_getXmppEngineName(engineName) {
        if (!engineName) {
            return null;
        }
        let map = {
            Autofill: "AUTOFILL",
            Bookmarks: "BOOKMARK",
            Nigori: "NIGORI",
            Passwords: "PASSWORD",
            Pinned: "YANDEX_GLOBAL_SETTING",
            Tophistory: "YANDEX_ELEMENTS",
            Typedurls: "TYPED_URL"
        };
        return map[engineName] || null;
    },
    getEngineByXmppName: function XMPP_getEngineByXmppName(name) {
        if (!name) {
            return null;
        }
        let map = {
            AUTOFILL: "Autofill",
            BOOKMARK: "Bookmarks",
            NIGORI: "Nigori",
            PASSWORD: "Passwords",
            YANDEX_GLOBAL_SETTING: "Pinned",
            YANDEX_ELEMENTS: "Tophistory",
            TYPED_URL: "Typedurls"
        };
        let engineName = map[name];
        if (!engineName) {
            return null;
        }
        let {Service} = require("service");
        return Service.engineManager.get(engineName);
    },
    _startStream: function XMPP__startStream() {
        if (this._parser) {
            this._parser.destroy();
        }
        this._parser = new this._XMPPParser(this);
        this._socket.send("<?xml version='1.0'?><stream:stream to='" + CONFIG.DOMAIN + "' xml:lang='en' version='1.0' xmlns:stream='http://etherx.jabber.org/streams' xmlns='jabber:client'>");
    },
    _createSocket: function XMPP__createSocket(reconnect) {
        this._socket = this._TCPSocket.open(CONFIG.HOST, CONFIG.PORT, { useSSL: true });
        this._socket.onopen = function (e) {
            this._logger.debug("[SOCKET] open");
            this.onXmppStanza = this._XMPPListener.onStream;
            this._startStream();
            if (reconnect) {
                require("sync").Sync.triggerUpdateAndResync();
            }
        }.bind(this);
        this._socket.ondata = function (e) {
            this._logger.trace("[SOCKET]\nINPUT:\n" + e.data);
            let istream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
            let length = e.data.length;
            istream.setData(e.data, length);
            this._parser.onDataAvailable(istream, 0, length);
        }.bind(this);
        this._socket.onerror = function (e) {
            this._logger.debug("[SOCKET] error", e);
            this._stopPinging();
            if (this._socket.readyState === "connecting") {
                this._socket.close();
                new NativeAPI.SysUtils.Timer(function () {
                    this._createSocket(true);
                }.bind(this), CONFIG.RECONNECT_TIMEOUT);
                return;
            }
            this._socket.reconnect = true;
        }.bind(this);
        this._socket.onclose = function (e, x) {
            this._logger.debug("[SOCKET] close " + x);
            this._stopPinging();
            if (this._socket && this._socket.reconnect) {
                this._createSocket(true);
                return;
            }
        }.bind(this);
        return this._socket;
    },
    _handshake: function XMPP__handshake() {
        this._socket._transport.securityInfo.QueryInterface(Ci.nsISSLSocketControl).StartTLS();
    },
    _subscribe: function XMPP__subscribe() {
        let data = require("protobuf").Protobuf.getGatewayMessage(this.token, true);
        this.onXmppStanza = this._XMPPListener.onSubscribe;
        this._socket.send(this._message(data));
    },
    get token() {
        let tokenObj = JSON.parse(NativeAPI.Settings.getValue("xmpp.token") || "{}");
        let username = require("auth").Auth.token.username;
        if (!username) {
            this._logger.debug("Trying to get xmpp token without username");
            return null;
        }
        let token = tokenObj[username] || null;
        return token;
    },
    set token(val) {
        let tokenObj = JSON.parse(NativeAPI.Settings.getValue("xmpp.token") || "{}");
        let username = require("auth").Auth.token.username;
        if (!username) {
            this._logger.debug("Trying to set xmpp token without username");
            return;
        }
        tokenObj[username] = val;
        NativeAPI.Settings.setValue("xmpp.token", JSON.stringify(tokenObj));
    },
    onXmppStanza: function XMPP_onXmppStanza() {
        throw new Error("Should be overriden");
    },
    onXMLError: function XMPP_onXMLError(err) {
        this._logger.debug("[SOCKET] onXMLError " + err);
    },
    _message: function XMPP__message(data) {
        let recipientNode = this._Stanza.node("recipient", this._Stanza.yasync, { to: "sync@bot.ya.ru" });
        let dataNode = this._Stanza.node("data", this._Stanza.yasync, null, data);
        let messageBody = this._Stanza.node("push", this._Stanza.yasync, null, [
            recipientNode,
            dataNode
        ]);
        let message = this._Stanza.message(this._jid, null, null, { type: "headline" }, messageBody).getXML();
        return message;
    },
    _startPinging: function XMPP_startPinging() {
        let pingNode = this._Stanza.node("ping", this._Stanza.NS.ping);
        let stanza = this._Stanza.iq("get", "pingc2s1", null, pingNode).getXML();
        this._pingTimer = new NativeAPI.SysUtils.Timer(function pingXMPP() {
            this._socket.send(stanza);
        }.bind(this), CONFIG.PING_TIMEOUT, true);
    },
    _stopPinging: function XMPP_stopPinging() {
        if (!this._pingTimer) {
            return;
        }
        this._pingTimer.cancel();
        this._pingTimer = null;
    },
    _XMPPListener: {
        _logger: NativeAPI.logger.getLogger("XMPPListener"),
        onXmppStanza: function XMPPListener_onXmppStanza(node) {
            let data = node.getElement([
                "push:push",
                "push:data"
            ]);
            if (!data) {
                if (node.localName === "iq" && node.attributes.type == "result" && node.attributes.id === "pingc2s1") {
                    this._XMPPListener.onPong.call(this, node);
                    return;
                }
                this._logger.error("Wrong node on xmpp stanza " + node.getXML());
                return;
            }
            let protobuf = require("protobuf").Protobuf;
            let message = protobuf.parseClientGatewayMessage(data.innerText);
            let networkMessage = protobuf.parseServerToClientMessage(message.network_message);
            let inv = networkMessage.invalidation_message && networkMessage.invalidation_message.invalidation;
            this._logger.debug("inv", inv);
            this._logger.debug(networkMessage);
            if (!inv) {
                return;
            }
            Array.forEach(inv, function (invP) {
                let name = invP.object_id.name;
                name = [String.fromCharCode(name[k]) for (k in name)].join("");
                this._logger.debug("name", name);
                let engine = this.getEngineByXmppName(name);
                if (engine) {
                    engine.update();
                }
            }, this);
        },
        onPong: function XMPPListener_onPong(node) {
        },
        onStream: function XMPPListener_onStream(node) {
            if (node.localName !== "features") {
                this._logger.error("Wrong node " + node.getXML());
                this._socket.close();
                return;
            }
            if (node.getElement(["starttls"])) {
                this.onXmppStanza = this._XMPPListener.onTLS;
                let stanza = this._Stanza.node("starttls", this._Stanza.NS.tls).getXML();
                this._socket.send(stanza);
                return;
            }
            let mech = node.getElement(["mechanisms"]);
            if (mech) {
                mech = mech.getChildren("mechanism")[0].innerText;
                if (mech !== "X-YANDEX-OAUTH") {
                    this.onXmppStanza = this._XMPPListener.onAuth;
                    this.onXmppStanza(node);
                    return;
                }
            }
            if (!node.getElement(["bind"])) {
                this._logger.error("Wrong node on binding " + node.getXML());
                this._socket.close();
                return;
            }
            this.onXmppStanza = this._XMPPListener.onBind;
            let bindNode = this._Stanza.node("bind", this._Stanza.NS.bind);
            let stanza = this._Stanza.iq("set", null, null, bindNode).getXML();
            this._socket.send(stanza);
        },
        onBind: function XMPPListener_onBind(node) {
            let bindNode = node.getElement(["bind"]);
            if (!bindNode) {
                this._logger.error("Wrong node on binding " + node.getXML());
                this._socket.close();
                return;
            }
            this._jid = bindNode.getElement(["jid"]).innerText;
            this.onXmppStanza = this._XMPPListener.onSession;
            let sessionNode = this._Stanza.node("session", this._Stanza.NS.session);
            let stanza = this._Stanza.iq("set", null, null, sessionNode).getXML();
            this._socket.send(stanza);
        },
        onSession: function XMPPListener_onSession(node) {
            if (!node.getElement(["session"])) {
                this._logger.error("Wrong session " + node.getXML());
                this._socket.close();
                return;
            }
            this._socket.send("<iq type='set' to='" + this._jid + "'><subscribe xmlns='ya:push:sync'><item channel='ya_sync' from=''/></subscribe></iq>");
            let protoData = require("protobuf").Protobuf.getGatewayMessage();
            let message = this._message(protoData);
            this.onXmppStanza = this._XMPPListener.onGetToken;
            this._socket.send(message);
        },
        onGetToken: function XMPPListener_onGetToken(node) {
            let data = node.getElement([
                "push:push",
                "push:data"
            ]);
            if (!data) {
                return;
            }
            let protobuf = require("protobuf").Protobuf;
            let message = protobuf.parseClientGatewayMessage(data.innerText);
            let networkMessage = protobuf.parseServerToClientMessage(message.network_message);
            this.token = networkMessage.token_control_message.new_token;
            this._subscribe();
        },
        onSubscribe: function XMPPListener_onSubscribe(node) {
            let data = node.getElement([
                "push:push",
                "push:data"
            ]);
            if (!data) {
                return;
            }
            let protobuf = require("protobuf").Protobuf;
            let message = protobuf.parseClientGatewayMessage(data.innerText);
            let networkMessage = protobuf.parseServerToClientMessage(message.network_message);
            this.onXmppStanza = this._XMPPListener.onXmppStanza;
            this._startPinging();
        },
        onAuth: function XMPPListener_onAuth(node) {
            if (node.localName !== "features") {
                this._logger.error("Wrong node " + node.getXML());
                this._socket.close();
            }
            let mech = node.getElement(["mechanisms"]);
            mech = mech.getChildren("mechanism")[0].innerText;
            if (mech !== "X-YANDEX-OAUTH") {
                this._logger.error("Mechanism should be X-YANDEX-OAUTH, but it is " + mech);
                this._socket.close();
            }
            let {
                username,
                value: tokenValue
            } = this._token;
            let stanza = this._Stanza.node("auth", this._Stanza.NS.sasl, { mechanism: mech }, btoa(username + " " + tokenValue)).getXML();
            this.onXmppStanza = function (node) {
                this.onXmppStanza = this._XMPPListener.onStream;
                this._startStream();
            }.bind(this);
            this._socket.send(stanza);
        },
        onTLS: function XMPPListener_onTLS(node) {
            if (node.localName != "proceed") {
                this._logger.error("Wrong node " + JSON.stringify(node));
                this._socket.close();
            }
            this.onXmppStanza = this._XMPPListener.onAuth;
            this._handshake();
            this._startStream();
        }
    },
    _TCPSocket: null,
    _Stanza: null,
    _XMPPParser: null,
    _pingTimeout: null,
    _jid: null,
    _token: null,
    _socket: null,
    _parser: null
};
