"use strict";
UI.EventListener = function (element, type, listener, capture, context) {
this.element = element;
this.type = type;
this.capture = capture;
this.status = false;
if (context)
this.handler = function (e) {
listener.call(context,e);
}
; else
this.handler = listener;
this.enable();
}
;
UI.EventListener.prototype = {
enable: function XBUI_EventListener_enable() {
this.assign(1);
}
,
disable: function XBUI_EventListener_disable() {
this.assign(0);
}
,
assign: function XBUI_EventListener_assign(b) {
if (b == this.status)
return;
this.status = b;
this.element[b ? "addEventListener" : "removeEventListener"](this.type,this.handler,this.capture);
}
};
