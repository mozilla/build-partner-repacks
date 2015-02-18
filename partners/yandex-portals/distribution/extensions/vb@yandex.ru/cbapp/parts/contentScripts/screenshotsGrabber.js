"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    utils: Cu
} = Components;
const MESSAGE_NAME_PREFIX = "vb@yandex.ru:screenshotsGrabber:";
const HTML_NS = "http://www.w3.org/1999/xhtml";
const screenshotsGrabberContent = {
    init: function screenshotsGrabberContent_init() {
        addMessageListener(MESSAGE_NAME_PREFIX + "capture", this._onCapture.bind(this));
    },
    _onCapture: function screenshotsGrabber__onCapture(message) {
        let messageData = message.data;
        let canvas = content.document.createElementNS(HTML_NS, "canvas");
        let contentWindow = content.window;
        let sbWidth = {};
        let sbHeight = {};
        try {
            contentWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils).getScrollbarSize(false, sbWidth, sbHeight);
        } catch (e) {
            sbWidth.value = sbHeight.value = 0;
        }
        let winWidth = contentWindow.innerWidth - sbWidth.value;
        let winHeight = contentWindow.innerHeight - sbHeight.value;
        canvas.mozImageSmoothingEnabled = true;
        canvas.width = messageData.canvasSize.width;
        canvas.height = messageData.canvasSize.height;
        let scale = Math.min(Math.max(canvas.width / winWidth, canvas.height / winHeight), 1);
        let scaledWidth = winWidth * scale;
        let scaledHeight = winHeight * scale;
        if (scaledHeight > canvas.height) {
            winHeight -= Math.floor(Math.abs(scaledHeight - canvas.height) * scale);
        }
        if (scaledWidth > canvas.width) {
            winWidth -= Math.floor(Math.abs(scaledWidth - canvas.width) * scale);
        }
        let ctx = canvas.getContext("2d");
        ctx.save();
        ctx.scale(scale, scale);
        ctx.drawWindow(contentWindow, 0, 0, winWidth, winHeight, "rgb(255,255,255)", ctx.DRAWWINDOW_DO_NOT_FLUSH);
        ctx.restore();
        if (messageData.smoothEnabled) {
            this._smoothCanvas(canvas);
        }
        let imgPixels = ctx.getImageData(0, 0, messageData.canvasSize.width, messageData.canvasSize.height);
        sendAsyncMessage(MESSAGE_NAME_PREFIX + "didCapture", {
            screenId: messageData.screenId,
            imgPixels: imgPixels,
            imgDataURL: canvas.toDataURL()
        });
    },
    _smoothCanvas: function screenshotsGrabber__smoothCanvas(canvas) {
        let w = canvas.width;
        let h = canvas.height;
        let tmpCanvas = canvas.ownerDocument.createElementNS(HTML_NS, "canvas");
        let ctx = canvas.getContext("2d");
        let tmpCtx = tmpCanvas.getContext("2d");
        for (let i = 0; i < 1; i++) {
            let _w = Math.round(w - i);
            let _h = Math.round(h - i);
            tmpCanvas.width = _w;
            tmpCanvas.height = _h;
            tmpCtx.drawImage(canvas, 0, 0, _w, _h);
            ctx.drawImage(tmpCanvas, 0, 0, w, h);
        }
    }
};
screenshotsGrabberContent.init();
