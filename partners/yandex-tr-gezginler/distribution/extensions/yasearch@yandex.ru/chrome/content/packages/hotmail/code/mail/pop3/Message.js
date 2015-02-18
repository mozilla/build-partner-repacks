"use strict";
var EXPORTED_SYMBOLS = ["module"];
function module(proxy) {
    var T = proxy.module("sklib.Template");
    var CMD_END = "\r\n";
    var CMD_SPACE = " ";
    var CMD_SPACE_LENGTH = CMD_SPACE.length;
    var RESPONSE_HEADER = "+";
    var POP3Message = function (id, read) {
        this.id = id || undefined;
        this.read = read || false;
    };
    POP3Message.cast = function (obj) {
        return new POP3Message(obj.id, obj.read);
    };
    POP3Message.createFromUIDLString = function (aStr) {
        var str = aStr;
        var message = null;
        if (str.indexOf(RESPONSE_HEADER) == 0) {
            str = str.substr(str.indexOf(CMD_SPACE) + CMD_SPACE_LENGTH);
        }
        var response = str.split(CMD_SPACE);
        if (response.length == 2) {
            if (Number(response[0]) > 0) {
                var id = response[1];
                var endIndex = id.indexOf(CMD_END);
                if (endIndex !== -1) {
                    id = id.substr(endIndex);
                }
                message = new POP3Message();
                message.id = id;
            }
        }
        return message;
    };
    POP3Message.prototype = {
        constructor: POP3Message,
        toString: function () {
            var info = {
                id: this.id,
                read: this.read ? "read" : "unread"
            };
            return T("[object POP3Message $read $id]", info);
        }
    };
    return POP3Message;
}
