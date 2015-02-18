(function () {
    if (Y.UI.Message) {
        return;
    }
    var OS = Y.ObserverService.getInstance();
    Y.UI.Message = function (container) {
        this._container = container;
        this._msgId = container.getAttribute("message-id") || container.getAttribute("twitter:message-id");
        var _this = this;
        this.destructor = function () {
            OS.removeObserver("destroy", destroyObserver);
            OS.removeObserver("data:hidden-message", hideObserver);
            OS.removeObserver("data:favorite-message", favoritesObserver);
            delete this._container;
            delete this.destructor;
        };
        var destroyObserver = function (t, d) {
            var el = _this._container.parentNode;
            while (el) {
                if (el === d) {
                    return _this.destructor();
                }
                el = el.parentNode;
            }
        };
        var hideObserver = function (t, d) {
            if (d == _this._msgId) {
                _this.hide();
            }
        };
        var favoritesObserver = function (t, d) {
            if (d.id == _this._msgId) {
                _this[d.type]();
            }
        };
        OS.attachObserver("data:hidden-message", hideObserver);
        OS.attachObserver("data:favorite-message", favoritesObserver);
        OS.attachObserver("destroy", destroyObserver);
    };
    Y.UI.Message.prototype = {
        hide: function () {
            this._container.parentNode.removeChild(this._container);
            this.destructor();
        },
        favorite: function () {
            Y.DOM.addClass(this._container, "message-favorited");
        },
        unfavorite: function () {
            Y.DOM.removeClass(this._container, "message-favorited");
        }
    };
}());
