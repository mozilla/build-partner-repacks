"use strict";
UI.Behaviour.Action = UI.Behaviour.extend({
$name: "XB_UI_Action",
name: "action",
append: function XBUI_Action_append() {

}
,
build: function XBUI_Action_build() {
this.commands = [];
var command = this.attribute.command || "";
if (command)
this.commands.push(command);
var element = this.element.firstChild;
while (element) {
if (element.nodeType === this.element.ELEMENT_NODE && element.localName === UI._consts.STR_VAL_REF_ELEM_NAME)
this.commands.push(element.getAttribute(UI._consts.STR_VAL_REF_ID_KEY_NAME));
element = element.nextSibling;
}

this._built = true;
}
,
activate: function XBUI_Action_activate(eventInfo) {
if (this.commands)
this.builder.dispatchCommands(this.root.widgetInstance.id,this.commands,eventInfo);
}
});
UI.Behaviour.WithAction = UI.Behaviour.extend({
runActions: function XBUI_WithAction_runActions(event) {
var eventInfo = {
type: event.type,
keys: {
shift: event.shiftKey,
meta: event.metaKey,
ctrl: event.ctrlKey},
mouse: {
button: event.button}};
var order = ["url", "action"];
var listeners = Object.create(null);
for each(let listener in this.childrenEx(/^(action|url)$/)) for each(let type in order) if (! (type in listeners) && listener.name == type)
listeners[type] = listener;
for(let type in listeners) {
try {
listeners[type].activate(eventInfo);
}
catch (e) {
this.builder._logger.error(e);
this.builder._logger.debug(e.stack);
}

}

}
});
