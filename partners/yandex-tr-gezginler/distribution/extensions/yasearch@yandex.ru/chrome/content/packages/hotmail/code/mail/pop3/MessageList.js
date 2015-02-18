"use strict";
var EXPORTED_SYMBOLS = ["module"];
function module(proxy) {
    var POP3Message = proxy.module("mail.pop3.Message");
    var CMD_END = "\r\n";
    var RESPONSE_HEADER = "+";
    var POP3MessageListWrapper = function (aMessages) {
        var messages;
        var idCache;
        var fillCache = function (aMessages) {
            messages = aMessages || [];
            idCache = {};
            for (var message, i = 0, l = messages.length; i < l; ++i) {
                message = messages[i];
                idCache[message.id] = message;
            }
        };
        var POP3MessageList = function (aMessages) {
            fillCache(aMessages);
        };
        POP3MessageList.prototype = {
            constructor: POP3MessageListWrapper,
            stringify: function () {
                return JSON.stringify(messages);
            },
            id: function (aId) {
                return idCache[aId];
            },
            setAllRead: function () {
                messages.forEach(function (message) {
                    message.read = true;
                });
            },
            getMessagesArray: function () {
                return messages;
            },
            getUnreadCount: function () {
                var count = 0;
                try {
                    messages.forEach(function (message) {
                        !message.read ? ++count : 0;
                    });
                } catch (e) {
                    proxy.logger.warn("Error counting unread messages");
                    proxy.logger.error(e);
                } finally {
                    return count;
                }
            },
            update: function (aMessageList) {
                var newMessages = aMessageList.getMessagesArray();
                var newMessagesLength = newMessages.length;
                var updatedMessages = new Array(newMessagesLength);
                var updatedMessagesMessage;
                for (var i = 0, newMessage, cachedMessage; i < newMessagesLength; ++i) {
                    newMessage = newMessages[i];
                    cachedMessage = this.id(newMessage.id);
                    updatedMessages[i] = cachedMessage || newMessage;
                }
                fillCache(updatedMessages);
            }
        };
        return new POP3MessageList(aMessages);
    };
    POP3MessageListWrapper.createFromUIDLResponse = function (str) {
        proxy.logger.trace("createFromUIDLResponse");
        var messages = str.split(CMD_END);
        var tmpMsgList = [];
        for (var message, messageText, i = 1, l = messages.length; i < l; ++i) {
            messageText = messages[i];
            message = POP3Message.createFromUIDLString(messageText);
            if (message) {
                tmpMsgList.push(message);
            }
        }
        return new POP3MessageListWrapper(tmpMsgList);
    };
    POP3MessageListWrapper.cast = function (arr) {
        var t = [];
        for (var arri, i = 0, l = arr.length; i < l; ++i) {
            arri = arr[i];
            t[i] = POP3Message.cast(arri);
        }
        return new POP3MessageListWrapper(t);
    };
    POP3MessageListWrapper.parse = function (str) {
        var t = JSON.parse(str);
        return POP3MessageListWrapper.cast(t);
    };
    return POP3MessageListWrapper;
}
