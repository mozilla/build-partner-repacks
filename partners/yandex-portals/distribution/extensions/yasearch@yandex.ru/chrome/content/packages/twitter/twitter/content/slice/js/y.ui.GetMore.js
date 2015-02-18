Y.UI.GetMore = function () {
    var OS = Y.ObserverService.getInstance();
    function Constructor(container, mode) {
        var _this = this;
        this._container = container;
        this._active = false;
        this._cmdTopic = ":get-more:" + mode;
        this._observeGMBState = ":get-more:state:" + mode;
        this._container.innerHTML = Y.XTools.transformJSON({}, "more_button");
        this._getMoreButton = Y.DOM.getElementsByClassName(this._container, this.GET_MORE_BUTTON_CLASSNAME)[0];
        Y.UI.buildUI(this._getMoreButton);
        this._setState("hide");
        Y.DOM.attachEvent(this._getMoreButton, "onclick", function () {
            if (_this._active) {
                OS.notifyObservers(_this._cmdTopic);
            }
        });
        OS.attachObserver(this._observeGMBState, function (t, d) {
            _this._setState(d);
        });
    }
    ;
    Constructor.prototype = {
        GET_MORE_BUTTON_CLASSNAME: "get-more-button",
        LOADING_CLASSNAME: "get-more-button-loading",
        INACTIVE_CLASSNAME: "get-more-button-inactive",
        NO_MORE_CLASSNAME: "get-more-button-no-more",
        constructor: Constructor,
        _setState: function (state) {
            this._active = state == "show";
            this._container.style.display = state == "hide" ? "none" : "";
            Y.DOM[state == "loading" ? "addClass" : "removeClass"](this._getMoreButton, this.LOADING_CLASSNAME);
            Y.DOM[!this._active ? "addClass" : "removeClass"](this._getMoreButton, this.INACTIVE_CLASSNAME);
            Y.DOM[state == "no-more" ? "addClass" : "removeClass"](this._getMoreButton, this.NO_MORE_CLASSNAME);
        }
    };
    return Constructor;
}();
Y.UI.GetMoreHome = function (container) {
    return new Y.UI.GetMore(container, "home");
};
Y.UI.GetMoreMentions = function (container) {
    return new Y.UI.GetMore(container, "mentions");
};
Y.UI.GetMoreDMS = function (container) {
    return new Y.UI.GetMore(container, "dms");
};
