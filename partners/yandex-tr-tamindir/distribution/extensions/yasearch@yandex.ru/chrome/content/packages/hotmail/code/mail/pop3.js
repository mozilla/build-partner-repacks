"use strict";
var EXPORTED_SYMBOLS = ["module"];
function module(proxy) {
    var T = proxy.module("sklib.Template");
    var POP3 = {};
    POP3.Error = function (message) {
        this.message = message;
    };
    POP3.Error.prototype = new Error();
    POP3.MessageList = proxy.module("mail.pop3.MessageList");
    POP3.Commands = proxy.module("mail.pop3.commands");
    POP3.Client = function (sockTypes, host, port) {
        this._transportConfig = {
            sockTypes: sockTypes || [],
            host: host,
            port: port,
            proxy: this.getProxyInfo()
        };
        this._currentScenario = [];
    };
    POP3.Client.prototype = {
        executeCommands: function (commands) {
            var _this = this;
            this._currentScenario = commands;
            var cmd = this._currentScenario[0];
            if (!cmd) {
                proxy.logger.warn("No commands");
                return;
            }
            var streamFlags = 0;
            var socketService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
            var tc = this._transportConfig;
            var socket = socketService.createTransport(tc.sockTypes, tc.sockTypes.length, tc.host, tc.port, tc.proxy);
            var inputStream = socket.openInputStream(0, 0, 0).QueryInterface(Components.interfaces.nsIAsyncInputStream);
            var binaryInputStream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
            binaryInputStream.setInputStream(inputStream);
            var outputStream = socket.openOutputStream(0, 0, 0).QueryInterface(Components.interfaces.nsIAsyncOutputStream);
            var binaryOutputStream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
            binaryOutputStream.setOutputStream(outputStream);
            var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
            var request;
            var isRequestSent;
            function nextCommand() {
                cmd = _this._currentScenario.shift();
                if (cmd) {
                    request = cmd.request;
                    isRequestSent = false;
                    sendRequest();
                } else {
                    proxy.logger.trace("End scenario");
                    socket.close(0);
                }
            }
            function sendRequest(callback) {
                if (request.length > 0) {
                    isRequestSent = false;
                    var thread = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager).currentThread;
                    outputStream.asyncWait({
                        onOutputStreamReady: function () {
                            var reqLength = request.length;
                            var count = outputStream.write(request, reqLength);
                            if (count < reqLength) {
                                request = request.substr(count);
                                sendRequest(callback);
                            } else {
                                isRequestSent = true;
                                callback ? callback() : 0;
                            }
                        }
                    }, 0, 0, thread);
                } else {
                    isRequestSent = true;
                    callback ? callback() : 0;
                }
            }
            var reader = {
                onStartRequest: function (request, context) {
                    proxy.logger.trace("onStartRequest");
                },
                onStopRequest: function (request, context, status) {
                    proxy.logger.trace(T("onStopRequest, status = $2", arguments));
                    binaryInputStream.close();
                    inputStream.close();
                    outputStream.close();
                },
                onDataAvailable: function (request, context, inputStream, offset, count) {
                    var responsePart = binaryInputStream.readBytes(count);
                    if (isRequestSent) {
                        if (cmd) {
                            var complete = cmd.pushResponsePart(responsePart);
                            if (complete) {
                                nextCommand();
                            }
                        }
                    } else {
                    }
                }
            };
            pump.init(inputStream, -1, -1, 0, 0, true);
            pump.asyncRead(reader, null);
            nextCommand();
        },
        getProxyInfo: function () {
            var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
            var proxySettings = prefs.getBranch("network.proxy.");
            var info = null;
            if (proxySettings.getIntPref("type") == 1) {
                var host = proxySettings.getCharPref("socks");
                var port = proxySettings.getIntPref("socks_port");
                var proxyService = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].getService(Components.interfaces.nsIProtocolProxyService);
                info = proxyService.newProxyInfo("socks", host, port, 0, 20, null);
            }
            return info;
        },
        abort: function () {
            this._currentScenario = [];
        }
    };
    return POP3;
}
