"use strict";
var EXPORTED_SYMBOLS = ["module"];
var Commands = {};
String.prototype.endsWith = function (x) {
    return this.substr(-x.length) === x;
};
function module(proxy) {
    var CMD_END = "\r\n";
    var SINGLE_LINE_RESPONSE_END = "\r\n";
    var MULTIPLE_LINES_RESPONSE_END = "\r\n.\r\n";
    var POP3Command = function () {
    };
    var POP3CommandPrototype = {
        onresponse: function () {
        },
        request: "",
        response: "",
        pushResponsePart: function (part) {
            this.response += part;
            var dataReady = this.isDataReady();
            if (dataReady) {
                this.onresponse(this.response);
            }
            return dataReady;
        },
        isDataReady: function () {
            throw "You shall not inherit isDataReady";
        },
        isSingleLineResponseCompleted: function () {
            return this.response.endsWith(SINGLE_LINE_RESPONSE_END);
        },
        isMultipleLineResponseCompleted: function () {
            return this.response.endsWith(MULTIPLE_LINES_RESPONSE_END);
        },
        isStatusOk: function () {
            return this.response[0] == "+";
        }
    };
    var POP3InitCommand = function () {
        this.isDataReady = this.isSingleLineResponseCompleted;
    };
    POP3InitCommand.prototype = POP3CommandPrototype;
    var POP3UserCommand = function (login) {
        this.request = "USER " + login + CMD_END;
        this.isDataReady = this.isSingleLineResponseCompleted;
    };
    POP3UserCommand.prototype = POP3CommandPrototype;
    var POP3PassCommand = function (password) {
        this.request = "PASS " + password + CMD_END;
        this.isDataReady = this.isSingleLineResponseCompleted;
    };
    POP3PassCommand.prototype = POP3CommandPrototype;
    var POP3QuitCommand = function () {
        this.request = "QUIT" + CMD_END;
        this.isDataReady = this.isSingleLineResponseCompleted;
    };
    POP3QuitCommand.prototype = POP3CommandPrototype;
    var POP3UidlCommand = function () {
        this.request = "UIDL " + CMD_END;
        this.isDataReady = function () {
            if (this.isStatusOk()) {
                return this.isMultipleLineResponseCompleted();
            } else {
                return this.isSingleLineResponseCompleted();
            }
        };
    };
    POP3UidlCommand.prototype = POP3CommandPrototype;
    return Commands = {
        Init: POP3InitCommand,
        User: POP3UserCommand,
        Pass: POP3PassCommand,
        Uidl: POP3UidlCommand,
        Quit: POP3QuitCommand
    };
}
