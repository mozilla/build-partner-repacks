"use strict";
let EXPORTED_SYMBOLS = ["API"];
let {Utils} = require("utils");
let {Auth} = require("auth");
let CONFIG = {
    HOST: NativeAPI.Settings.getValue("debugServer") ? "https://sync-tst.disk.yandex.net" : "https://sync.disk.yandex.net",
    TIMEOUT: 45000
};
let API = {
    init: function API_init() {
        onShutdown.add(this.finalize.bind(this));
        this._pendingXHRs = [];
    },
    finalize: function API_finalize() {
        this.stopAllRequests();
        this._pendingXHRs = null;
    },
    ping: function API_ping(onSuccess, onError) {
        let path = "/ping";
        let url = CONFIG.HOST + path;
        this.sendRequest({
            url: url,
            timeout: 2500,
            onSuccess: onSuccess,
            onError: onError
        });
    },
    serverTime: function API_serverTime(onSuccess, onError) {
        let path = "/sync/time";
        let url = CONFIG.HOST + path;
        this.sendRequest({
            url: url,
            onSuccess: onSuccess,
            onError: onError
        });
    },
    command: function API_command(arraybuffer, onSuccess, onError) {
        let params = {
            client_id: require("auth").Auth.token.guid,
            ui: encodeURIComponent(NativeAPI.Environment.addon.userID),
            yasoft: "barff"
        };
        let paramsStr = [];
        for (let [
                    key,
                    value
                ] in Iterator(params)) {
            paramsStr.push(key + "=" + value);
        }
        paramsStr = paramsStr.join("&");
        let path = "/sync/command?" + paramsStr;
        let url = CONFIG.HOST + path;
        this.sendRequest({
            url: url,
            data: arraybuffer,
            method: "POST",
            responseType: "arraybuffer",
            onSuccess: onSuccess,
            onError: onError
        });
    },
    drop: function API_drop(onSuccess, onError) {
        let params = {
            client_id: require("auth").Auth.token.guid,
            ui: encodeURIComponent(NativeAPI.Environment.addon.userID),
            yasoft: "barff"
        };
        let paramsStr = [];
        for (let [
                    key,
                    value
                ] in Iterator(params)) {
            paramsStr.push(key + "=" + value);
        }
        paramsStr = paramsStr.join("&");
        let path = "/sync/drop?" + paramsStr;
        let url = CONFIG.HOST + path;
        this.sendRequest({
            url: url,
            method: "GET",
            responseType: "text",
            onSuccess: onSuccess,
            onError: onError
        });
    },
    sendRequest: function API_sendRequest(params) {
        NativeAPI.logger.debug("[sendRequest] " + params.url);
        let that = this;
        let xhr = Utils.sendRequest(params.url, {
            method: params.method || "GET",
            responseType: params.responseType || "",
            data: params.data,
            timeout: params.timeout || CONFIG.TIMEOUT,
            background: true,
            headers: { Authorization: "Bearer " + Auth.token.value },
            callback: function API_sendRequest_callback(e) {
                let xhr = e.target;
                let type = e.type;
                NativeAPI.logger.debug("[sendRequest] " + params.url + " response type: " + type + ", xhr.status: " + xhr.status);
                let index = that._pendingXHRs.indexOf(xhr);
                if (index !== -1) {
                    that._pendingXHRs.splice(index, 1);
                }
                switch (type) {
                case "load":
                    if (xhr.status === 200) {
                        if (typeof params.onSuccess === "function") {
                            params.onSuccess(xhr);
                        }
                        break;
                    }
                default:
                    if (typeof params.onError === "function") {
                        params.onError("error", xhr);
                    }
                    break;
                }
            }
        });
        this._pendingXHRs.push(xhr);
    },
    stopAllRequests: function API_stopAllRequests() {
        if (this._pendingXHRs) {
            this._pendingXHRs.forEach(function (xhr) {
                xhr.abort();
            });
        }
    },
    _pendingXHRs: null
};
API.init();
