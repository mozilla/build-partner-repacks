var Hash;
(function () {
    Hash = function () {
    };
    function _encodeURIComponent(str) {
        return encodeURIComponent(str).replace(/[!'\(\)\*]/g, function (x) {
            return "%" + ("0" + x.charCodeAt(0).toString(16)).slice(-2).toUpperCase();
        });
    }
    ;
    function _decodeURIComponent(str) {
        return decodeURIComponent(str.replace(/\+/g, "%20"));
    }
    ;
    Hash.prototype = {
        asJSON: function () {
            return JSON.stringify(this);
        },
        asHTTPHeader: function () {
        },
        asURLEncoded: function () {
            var value = "", res = [], keys = [], keyText, hash = this;
            for (var key in hash) {
                if (hash.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys.sort().map(function (key) {
                return [
                    key,
                    hash[key]
                ].map(_encodeURIComponent).join("=");
            }).join("&");
        }
    };
}.call({}));
