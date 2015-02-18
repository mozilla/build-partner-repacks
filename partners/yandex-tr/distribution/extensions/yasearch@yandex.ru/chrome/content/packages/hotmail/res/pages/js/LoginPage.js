var LoginPage = function () {
    var _this = this;
    this.locked = false;
    this.wrapper = document.getElementById("content-wrapper");
    this.fitWindowSize();
    var loginElement = this.loginElement = document.getElementById("login-input");
    var passwdElement = this.passwdElement = document.getElementById("password-input");
    var storeElement = document.getElementById("store-passwd");
    var submitButton = document.getElementById("submit-button");
    var cancelButton = this.cancelButton = document.getElementById("cancel-button");
    this.errorMessageElement = document.getElementById("error-message");
    var tinput = document.createElement("input");
    if (!("placeholder" in tinput)) {
        new Placeholder(loginElement);
    }
    loginElement.focus();
    function submit() {
        _this.lock();
        var data = {
            login: loginElement.value,
            password: passwdElement.value,
            store: storeElement.checked
        };
        _this.sendAuthEvent(data);
    }
    new SmartInput(loginElement, function (input) {
        if (input.value.length > 0 && input.value.indexOf("@") == -1) {
            input.value = input.value + "@hotmail.com";
        }
        var looksFine = /\S+@\S+\.\S{2,}/i;
        var valid = looksFine.test(input.value);
        return valid;
    }, passwdElement);
    new SmartInput(passwdElement, function (input) {
        return input.value.length > 3;
    }, submit);
    listen(submitButton, "click", function (event) {
        submit();
    });
    listen(cancelButton, "click", function (event) {
        _this.cancel();
    });
    listen(window, "keydown", function (event) {
        if (event.keyCode === 27) {
            _this.cancel();
        }
    }, false);
    window.showDTDErrorMessage = function (key) {
        _this.showDTDErrorMessage(key);
    };
    window.fillLoginField = function (login) {
        _this.fillLoginField(login);
    };
};
LoginPage.prototype = {
    fitWindowSize: function () {
        if (!MSIE) {
            var dx = window.outerWidth - window.innerWidth, dy = window.outerHeight - window.innerHeight;
            window.resizeTo(this.wrapper.offsetWidth + dx, this.wrapper.offsetHeight + dy);
        } else {
        }
    },
    sendUplink: function (topic, data) {
        if ("createEvent" in document) {
            var event = document.createEvent("Events");
            event.initEvent(topic, true, false);
            window.eventData = data;
            window.dispatchEvent(event);
        }
    },
    fillLoginField: function (login) {
        this.loginElement.value = login;
        this.passwdElement.focus();
    },
    sendAuthEvent: function (data) {
        this.sendUplink("-x-hotmail-auth", data);
    },
    sendCancelAuthEvent: function () {
        this.sendUplink("-x-hotmail-cancel");
    },
    getLockableElements: function () {
        var inputs = document.getElementsByTagName("input");
        var retVal = [];
        for (var input, i = 0, l = inputs.length; i < l; ++i) {
            input = inputs[i];
            if (input.getAttribute("do-not-lock") == null) {
                retVal.push(input);
            }
        }
        return retVal;
    },
    lock: function () {
        this.locked = true;
        this.cancelButton.focus();
        this.hideErrorMessage();
        var els = this.getLockableElements();
        for (var i = 0, l = els.length; i < l; ++i) {
            els[i].setAttribute("disabled", "disabled");
        }
    },
    unlock: function () {
        var els = this.getLockableElements();
        for (var i = 0, l = els.length; i < l; ++i) {
            els[i].removeAttribute("disabled");
        }
        this.locked = false;
    },
    showDTDErrorMessage: function (key) {
        this.unlock();
        var text = window._locale.getEntity(key);
        if (text) {
            this.errorMessageElement.innerHTML = text;
            this.errorMessageElement.style.display = "block";
            this.fitWindowSize();
        } else {
            this.hideErrorMessage();
        }
    },
    hideErrorMessage: function () {
        this.errorMessageElement.style.display = "none";
        this.fitWindowSize();
    },
    cancel: function () {
        if (this.locked) {
            this.unlock();
            this.hideErrorMessage();
            this.sendCancelAuthEvent();
        } else {
            window.close();
        }
    }
};
