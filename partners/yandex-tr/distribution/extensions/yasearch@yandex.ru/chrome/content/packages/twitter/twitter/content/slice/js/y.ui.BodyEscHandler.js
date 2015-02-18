Y.UI.BodyEscHandler = function (container) {
    var _this = this;
    this.overlay = document.getElementById("overlay");
    this.body = document.getElementById("body");
    function keyListener(event) {
        var keyCode = event.keyCode;
        var target = event.target;
        if (keyCode == 27) {
            if (_this._isOverlayOpened()) {
                _this.closeOverlay();
            } else {
                _this.sendCloseMessage();
            }
        }
    }
    Y.DOM.attachEvent(container, "onkeydown", keyListener);
    container.focus();
};
Y.UI.BodyEscHandler.prototype = {
    sendCloseMessage: function () {
        Y.sendMessage("slice:close");
    },
    closeOverlay: function () {
        Y.ObserverService.getInstance().notifyObservers("overlay:hide");
        if (Y.browser.ff) {
            this.body.focus();
        }
    },
    _isOverlayOpened: function () {
        return this.overlay && this.overlay.offsetHeight;
    }
};
