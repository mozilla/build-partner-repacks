"use strict";
const SCRIPT_URL_PREFIX = "//translate.yandex.net/v1.87/js/";
const EVENT_MESSAGE_NAME = "yasearch@yandex.ru:pagetranslator:event";
const GET_PROP_MESSAGE_NAME = "yasearch@yandex.ru:pagetranslator:getprop";
const TIMEOUT_LOAD = 5000;
const translator = {
    translate: function translator_translate(lang) {
        let existsScript = content.document.getElementById("yandexBarDocumentTranslatorScript");
        if (existsScript) {
            let pair = this.getLangPair(lang, this.language);
            this._runDocumentTranslatorCommand("yandexBarTranslator.translate('" + pair + "')");
        } else {
            this._injectScripts(lang);
        }
    },
    revert: function translator_revert() {
        this._runDocumentTranslatorCommand("yandexBarTranslator.undo()");
    },
    _runDocumentTranslatorCommand: function translator__runDocumentTranslatorCommand(command) {
        this._createScriptNode({ scriptText: "if (yandexBarTranslator) { " + command + " }" });
    },
    _injectScripts: function translator__injectScripts(lang) {
        const urls = [
            SCRIPT_URL_PREFIX + "lib.js",
            SCRIPT_URL_PREFIX + "tr-url.js"
        ];
        let scriptList = [];
        let contentDocument = content.document;
        let timeoutLoad = contentDocument.defaultView.setTimeout(function () {
            sendAsyncMessage(EVENT_MESSAGE_NAME, { type: "error" });
        }, TIMEOUT_LOAD);
        let onload = function onload(url) {
            let index = scriptList.indexOf(url);
            if (index !== -1) {
                scriptList.splice(index, 1);
            }
            if (!scriptList.length) {
                contentDocument.defaultView.clearTimeout(timeoutLoad);
                this._translateStart(lang);
            }
        }.bind(this);
        urls.forEach(function (url) {
            scriptList.push(url);
            this._createScriptNode({ url: url }).addEventListener("load", function translator__injectScriptsOnLOad() {
                onload(url);
            }, false);
        }, this);
    },
    _createScriptNode: function translator__createScriptNode({id, url, scriptText}) {
        let script = content.document.createElement("script");
        script.setAttribute("type", "application/javascript;version=1.8");
        script.setAttribute("charset", "utf-8");
        script.async = false;
        if (id) {
            script.setAttribute("id", id);
        }
        if (url) {
            script.setAttribute("src", url);
        }
        if (scriptText) {
            script.innerHTML = scriptText;
        }
        content.document.head.appendChild(script);
        return script;
    },
    _translateStart: function translator__translateStart(slang) {
        if (!slang) {
            return;
        }
        let randomString = [
            Date.now(),
            Math.random() * 10000
        ].join(":");
        let pair = this.getLangPair(slang, this.language);
        this._createScriptNode({
            id: "yandexBarDocumentTranslatorScript",
            scriptText: "(" + yandexBarDocumentTranslator.toSource() + ")" + "(\"" + randomString + "\", \"" + pair + "\", Doc);"
        });
        content.document.addEventListener("yandexBarTranslatorEvent", handleEventFromContent, false);
    },
    getLangPair: function translator_getLangPair(slang, tlang) {
        let results = sendSyncMessage(GET_PROP_MESSAGE_NAME, {
            type: "getLangPair",
            slang: slang,
            tlang: tlang
        });
        return results.filter(Boolean)[0];
    },
    get language() {
        let results = sendSyncMessage(GET_PROP_MESSAGE_NAME, { type: "getLanguage" });
        return results.filter(Boolean)[0];
    }
};
function yandexBarDocumentTranslator(uid, langPair, winDocObject) {
    function fireTranslatorEvent(type) {
        let event = new CustomEvent("yandexBarTranslatorEvent", { detail: { type: type } });
        document.dispatchEvent(event);
    }
    let yandexBarTranslator = typeof winDocObject === "function" && new winDocObject(uid, String(location));
    if (!(yandexBarTranslator && typeof yandexBarTranslator.translate === "function")) {
        fireTranslatorEvent("error");
        return;
    }
    window.yandexBarTranslator = yandexBarTranslator;
    yandexBarTranslator.trUrl = window.location.protocol + "//translate.yandex.net/tr.json";
    yandexBarTranslator.setListener({
        onProgressChanged: function yandexBarTranslatorListener_onProgressChanged() {
        },
        onStateChanged: function yandexBarTranslatorListener_onStateChanged() {
            let state = yandexBarTranslator.getState();
            if (state == winDocObject.STATE_TR_END) {
                fireTranslatorEvent("finish");
            }
        },
        onError: function yandexBarTranslatorListener_onError(err) {
            fireTranslatorEvent("error");
        }
    });
    yandexBarTranslator.translate(langPair);
}
function handleMessageFromChrome({data}) {
    switch (data.type) {
    case "translate":
        translator.translate(data.language);
        break;
    case "revert":
        translator.revert();
        break;
    case "reset":
        sendAsyncMessage(EVENT_MESSAGE_NAME, { type: "reset" });
        break;
    default:
        break;
    }
}
addMessageListener(EVENT_MESSAGE_NAME, handleMessageFromChrome);
function handleEventFromContent(event) {
    sendAsyncMessage(EVENT_MESSAGE_NAME, { type: event.detail.type });
}
