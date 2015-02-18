"use strict";
let EXPORTED_SYMBOLS = ["TCPSocket"];
let CC = Components.Constructor;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
let InputStreamPump = CC("@mozilla.org/network/input-stream-pump;1", "nsIInputStreamPump", "init");
let AsyncStreamCopier = CC("@mozilla.org/network/async-stream-copier;1", "nsIAsyncStreamCopier", "init");
let ScriptableInputStream = CC("@mozilla.org/scriptableinputstream;1", "nsIScriptableInputStream", "init");
let BinaryInputStream = CC("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream", "setInputStream");
let StringInputStream = CC("@mozilla.org/io/string-input-stream;1", "nsIStringInputStream");
let MultiplexInputStream = CC("@mozilla.org/io/multiplex-input-stream;1", "nsIMultiplexInputStream");
let kCONNECTING = "connecting";
let kOPEN = "open";
let kCLOSING = "closing";
let kCLOSED = "closed";
let BUFFER_SIZE = 65536;
function TCPSocketEvent(type, sock, data) {
    this._type = type;
    this._target = sock;
    this._data = data;
}
TCPSocketEvent.prototype = {
    __exposedProps__: {
        type: "r",
        target: "r",
        data: "r"
    },
    get type() {
        return this._type;
    },
    get target() {
        return this._target;
    },
    get data() {
        return this._data;
    }
};
function TCPSocket() {
    this._logger = NativeAPI.logger.getLogger("TCPSocket");
    this._readyState = kCLOSED;
    this._onopen = null;
    this._ondrain = null;
    this._ondata = null;
    this._onerror = null;
    this._onclose = null;
    this._binaryType = "string";
    this._host = "";
    this._port = 0;
    this._ssl = false;
    this.useWin = null;
}
TCPSocket.prototype = {
    _binaryType: null,
    _hasPrivileges: null,
    _transport: null,
    _socketInputStream: null,
    _socketOutputStream: null,
    _inputStreamPump: null,
    _inputStreamScriptable: null,
    _inputStreamBinary: null,
    _multiplexStream: null,
    _multiplexStreamCopier: null,
    _asyncCopierActive: false,
    _waitingForDrain: false,
    _suspendCount: 0,
    _bufferedAmount: 0,
    _socketBridge: null,
    _reconnect: false,
    get readyState() {
        return this._readyState;
    },
    get binaryType() {
        return this._binaryType;
    },
    get host() {
        return this._host;
    },
    get port() {
        return this._port;
    },
    get ssl() {
        return this._ssl;
    },
    get bufferedAmount() {
        if (this._inChild) {
            return this._bufferedAmount;
        }
        return this._multiplexStream.available();
    },
    get onopen() {
        return this._onopen;
    },
    set onopen(f) {
        this._onopen = f;
    },
    get ondrain() {
        return this._ondrain;
    },
    set ondrain(f) {
        this._ondrain = f;
    },
    get ondata() {
        return this._ondata;
    },
    set ondata(f) {
        this._ondata = f;
    },
    get onerror() {
        return this._onerror;
    },
    set onerror(f) {
        this._onerror = f;
    },
    get onclose() {
        return this._onclose;
    },
    set onclose(f) {
        this._onclose = f;
    },
    get reconnect() {
        return this._reconnect;
    },
    set reconnect(f) {
        this._reconnect = f;
    },
    _createTransport: function ts_createTransport(host, port, sslMode) {
        let options, optlen;
        if (sslMode) {
            options = [sslMode];
            optlen = 1;
        } else {
            options = null;
            optlen = 0;
        }
        return Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService).createTransport(options, optlen, host, port, null);
    },
    _ensureCopying: function ts_ensureCopying() {
        let self = this;
        if (this._asyncCopierActive) {
            return;
        }
        this._asyncCopierActive = true;
        this._multiplexStreamCopier.asyncCopy({
            onStartRequest: function ts_output_onStartRequest() {
            },
            onStopRequest: function ts_output_onStopRequest(request, context, status) {
                self._asyncCopierActive = false;
                self._multiplexStream.removeStream(0);
                if (status) {
                    self._readyState = kCLOSED;
                    let err = new Error("Connection closed while writing: " + status);
                    err.status = status;
                    self.callListener("error", err);
                    self.callListener("close");
                    return;
                }
                if (self._multiplexStream.count) {
                    self._ensureCopying();
                } else {
                    if (self._waitingForDrain) {
                        self._waitingForDrain = false;
                        self.callListener("drain");
                    }
                    if (self._readyState === kCLOSING) {
                        self._socketOutputStream.close();
                        self._readyState = kCLOSED;
                        self.callListener("close");
                    }
                }
            }
        }, null);
    },
    callListener: function ts_callListener(type, data) {
        if (!this["on" + type]) {
            return;
        }
        if (!TCPSocketEvent) {
            return;
        }
        this["on" + type].call(null, new TCPSocketEvent(type, this, data || ""));
    },
    callListenerError: function ts_callListenerError(type, message, filename, lineNumber, columnNumber) {
        this.callListener(type, new Error(message, filename, lineNumber, columnNumber));
    },
    callListenerData: function ts_callListenerString(type, data) {
        this.callListener(type, data);
    },
    callListenerArrayBuffer: function ts_callListenerArrayBuffer(type, data) {
        this.callListener(type, data);
    },
    callListenerVoid: function ts_callListenerVoid(type) {
        this.callListener(type);
    },
    updateReadyStateAndBuffered: function ts_setReadyState(readyState, bufferedAmount) {
        this._readyState = readyState;
        this._bufferedAmount = bufferedAmount;
    },
    open: function ts_open(host, port, options) {
        this._inChild = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).processType != Ci.nsIXULRuntime.PROCESS_TYPE_DEFAULT;
        this._logger.debug("content process: " + (this._inChild ? "true" : "false"));
        if (this._hasPrivileges !== true && this._hasPrivileges !== null) {
            throw new Error("TCPSocket does not have permission in this context.");
        }
        let socket = new TCPSocket();
        socket.useWin = this.useWin;
        socket.innerWindowID = this.innerWindowID;
        socket._inChild = this._inChild;
        this._logger.debug("window init: " + socket.innerWindowID);
        this._logger.debug("startup called");
        this._logger.debug("Host info: " + host + ":" + port);
        socket._readyState = kCONNECTING;
        socket._host = host;
        socket._port = port;
        if (options !== undefined) {
            if (options.useSSL) {
                socket._ssl = "starttls";
            } else {
                socket._ssl = false;
            }
            socket._binaryType = options.binaryType || socket._binaryType;
        }
        this._logger.debug("SSL: " + socket.ssl);
        if (this._inChild) {
            socket._socketBridge = Cc["@mozilla.org/tcp-socket-child;1"].createInstance(Ci.nsITCPSocketChild);
            socket._socketBridge.open(socket, host, port, Boolean(socket._ssl), socket._binaryType, this.useWin, this);
            return socket;
        }
        let transport = socket._transport = this._createTransport(host, port, socket._ssl);
        transport.setEventSink(socket, Services.tm.currentThread);
        transport.securityCallbacks = new SecurityCallbacks(socket);
        socket._socketInputStream = transport.openInputStream(0, 0, 0);
        socket._socketOutputStream = transport.openOutputStream(Ci.nsITransport.OPEN_UNBUFFERED, 0, 0);
        socket._socketInputStream.asyncWait(socket, socket._socketInputStream.WAIT_CLOSURE_ONLY, 0, Services.tm.currentThread);
        if (socket._binaryType === "arraybuffer") {
            socket._inputStreamBinary = new BinaryInputStream(socket._socketInputStream);
        } else {
            socket._inputStreamScriptable = new ScriptableInputStream(socket._socketInputStream);
        }
        socket._multiplexStream = new MultiplexInputStream();
        socket._multiplexStreamCopier = new AsyncStreamCopier(socket._multiplexStream, socket._socketOutputStream, Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsIEventTarget), true, false, BUFFER_SIZE, false, false);
        return socket;
    },
    close: function ts_close() {
        if (this._readyState === kCLOSED || this._readyState === kCLOSING) {
            return;
        }
        this._logger.debug("close called");
        this._readyState = kCLOSING;
        if (this._inChild) {
            this._socketBridge.close();
            return;
        }
        if (!this._multiplexStream.count) {
            this._socketOutputStream.close();
        }
        this._socketInputStream.close();
    },
    send: function ts_send(data) {
        this._logger.trace("OUTPUT:\n" + data);
        if (this._readyState !== kOPEN) {
            throw new Error("Socket not open.");
        }
        if (this._inChild) {
            this._socketBridge.send(data);
        }
        let new_stream = new StringInputStream();
        if (this._binaryType === "arraybuffer") {
            let dataLen = data.length;
            let offset = 0;
            let result = "";
            while (dataLen) {
                let fragmentLen = dataLen;
                if (fragmentLen > 32768) {
                    fragmentLen = 32768;
                }
                dataLen -= fragmentLen;
                let fragment = data.subarray(offset, offset + fragmentLen);
                offset += fragmentLen;
                result += String.fromCharCode.apply(null, fragment);
            }
            data = result;
        }
        let newBufferedAmount = this.bufferedAmount + data.length;
        let bufferNotFull = newBufferedAmount < BUFFER_SIZE;
        if (this._inChild) {
            return bufferNotFull;
        }
        new_stream.setData(data, data.length);
        this._multiplexStream.appendStream(new_stream);
        if (newBufferedAmount >= BUFFER_SIZE) {
            this._waitingForDrain = true;
        }
        this._ensureCopying();
        return bufferNotFull;
    },
    suspend: function ts_suspend() {
        if (this._inChild) {
            this._socketBridge.suspend();
            return;
        }
        if (this._inputStreamPump) {
            this._inputStreamPump.suspend();
        } else {
            ++this._suspendCount;
        }
    },
    resume: function ts_resume() {
        if (this._inChild) {
            this._socketBridge.resume();
            return;
        }
        if (this._inputStreamPump) {
            this._inputStreamPump.resume();
        } else {
            --this._suspendCount;
        }
    },
    onTransportStatus: function ts_onTransportStatus(transport, status, progress, max) {
        if (status === Ci.nsISocketTransport.STATUS_CONNECTED_TO) {
            this._readyState = kOPEN;
            this.callListener("open");
            this._inputStreamPump = new InputStreamPump(this._socketInputStream, -1, -1, 0, 0, false);
            while (this._suspendCount--) {
                this._inputStreamPump.suspend();
            }
            this._inputStreamPump.asyncRead(this, null);
        }
    },
    onInputStreamReady: function ts_onInputStreamReady(input) {
        try {
            input.available();
        } catch (e) {
            this.callListener("error", new Error("Connection refused"));
        }
    },
    onStartRequest: function ts_onStartRequest(request, context) {
    },
    onStopRequest: function ts_onStopRequest(request, context, status) {
        let buffered_output = this._multiplexStream.count !== 0;
        this._inputStreamPump = null;
        if (buffered_output && !status) {
            return;
        }
        this._readyState = kCLOSED;
        this._logger.debug("onStopRequest " + status);
        if (status) {
            let err = new Error("Connection closed: " + status);
            err.status = status;
            this.callListener("error", err);
        }
        this.callListener("close");
    },
    onDataAvailable: function ts_onDataAvailable(request, context, inputStream, offset, count) {
        if (this._binaryType === "arraybuffer") {
            let ua = this.useWin ? new this.useWin.Uint8Array(count) : new Uint8Array(count);
            ua.set(this._inputStreamBinary.readByteArray(count));
            this.callListener("data", ua);
        } else {
            this.callListener("data", this._inputStreamScriptable.read(count));
        }
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIObserver,
        Ci.nsISupportsWeakReference
    ])
};
function SecurityCallbacks(socket) {
    this._socket = socket;
}
SecurityCallbacks.prototype = {
    notifyCertProblem: function sc_notifyCertProblem(socketInfo, sslStatus, targetHost) {
        socketInfo.QueryInterface(Ci.nsITransportSecurityInfo);
        sslStatus.QueryInterface(Ci.nsISSLStatus);
        NativeAPI.logger.debug("!CertProblem! " + targetHost);
        NativeAPI.logger.debug("!CertProblem! " + socketInfo.errorMessage);
        NativeAPI.logger.debug("!CertProblem! " + socketInfo.securityState);
        NativeAPI.logger.debug("!CertProblem! " + socketInfo.shortSecurityDescription);
        NativeAPI.logger.debug("!CertProblem! " + [
            sslStatus.isUntrusted,
            sslStatus.isDomainMismatch,
            sslStatus.isNotValidAtThisTime
        ]);
        let config = {
            HOST: NativeAPI.Settings.getValue("debugServer") ? "xmpp-tst.disk.yandex.net" : "xmpp.disk.yandex.net",
            PORT: 5222
        };
        if (socketInfo.securityState === Ci.nsIWebProgressListener.STATE_IS_INSECURE) {
            let certOverride = Cc["@mozilla.org/security/certoverride;1"].getService(Ci.nsICertOverrideService);
            let flags = 0;
            if (sslStatus.isUntrusted)
                flags |= certOverride.ERROR_UNTRUSTED;
            if (sslStatus.isDomainMismatch)
                flags |= certOverride.ERROR_MISMATCH;
            if (sslStatus.isNotValidAtThisTime)
                flags |= certOverride.ERROR_TIME;
            certOverride.rememberValidityOverride(config.HOST, config.PORT, sslStatus.serverCert, flags, true);
            this._socket.reconnect = true;
            NativeAPI.logger.debug("rememberValidityOverride(" + [
                config.HOST,
                config.PORT,
                sslStatus.serverCert,
                flags,
                true
            ] + ")");
        }
        this._socket.callListener("error", sslStatus);
        this._socket.close();
        return true;
    },
    getInterface: function sc_getInterface(iid) {
        return this.QueryInterface(iid);
    },
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIBadCertListener2,
        Ci.nsIInterfaceRequestor,
        Ci.nsISupports
    ])
};
