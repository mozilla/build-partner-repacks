Y.UI.Search = function () {
    var enterDownStart = 0;
    var enterTimeout = 6000;
    function Constructor(container) {
        var _this = this;
        var OS = Y.ObserverService.getInstance();
        this.container = container;
        this.input = Y.DOM.getElementsByClassName(container, "searchbox-input")[0];
        this.mag = Y.DOM.getElementsByClassName(container, "search-icon")[0];
        OS.attachObserver("twitter:last-search", function (t, d) {
            _this.input.value = d;
        });
        OS.attachObserver("twitlink:search", function (t, d) {
            OS.notifyObservers("tab:set-active-tab", "search");
            _this.input.value = d;
            _this.search();
        });
        Y.DOM.attachEvent(this.input, "onkeydown", function (event) {
            var keyCode = event.keyCode;
            if (keyCode == 13) {
                var cdate = new Date().valueOf();
                if (cdate < enterDownStart) {
                    enterDownStart = 0;
                }
                if (cdate > enterDownStart + enterTimeout) {
                    enterDownStart = cdate;
                    _this.search();
                }
            }
            if (keyCode == 27) {
                _this.input.value = "";
                event.cancelBubble = true;
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                return false;
            }
        });
        Y.DOM.attachEvent(this.input, "onkeyup", function (event) {
            var keyCode = event.keyCode;
            if (keyCode == 13) {
                enterDownStart = 0;
            }
        });
        Y.DOM.attachEvent(this.mag, "onclick", function (event) {
            _this.search();
        });
    }
    ;
    Constructor.prototype = {
        constructor: Constructor,
        search: function () {
            var _this = this;
            var text = this.input.value.trim();
            if (text.length > 0) {
                Y.sendMessage("twitter:search", text);
            }
            var errorElement = document.getElementById("message-list-error-message");
            if (errorElement) {
                errorElement.style.display = "none";
            }
            setTimeout(function () {
                _this.input.focus();
            }, 100);
        }
    };
    return Constructor;
}();
