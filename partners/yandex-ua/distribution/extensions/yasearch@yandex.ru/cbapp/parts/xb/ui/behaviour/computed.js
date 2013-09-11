"use strict";
UI.Behaviour.Computed = UI.Behaviour.extend({
$name: "XB_UI_Computed",
name: "computed",
constructor: function XBUI_Computed() {
this.base.apply(this,arguments);
this.elementId = this.element.getAttribute(UI._consts.STR_VAL_REF_ID_KEY_NAME);
this.builder.collection.put(this.root.widgetInstance.id,this.elementId,this);
}
,
readValue: function XBUI_Computed_readValue() {
try {
this.value = this.builder.getXBValue(this.root.widgetInstance.id,this.elementId);
}
catch (e) {
this.logger.error("Error reading dynamic value. " + strutils.formatError(e));
this.logger.debug(xmlutils.xmlSerializer.serializeToString(this.element));
this.logger.debug("Erroneous value: " + this.builder.getNodeDescription(this.root.widgetInstance.id,this.elementId));
}

}
,
outerNode: function XBUI_Computed_outerNode() {
var children = this.childrenEx();
var container = this.parent.innerNode();
for (let i = 0, length = children.length;i < length;i++) {
let child = children[i];
let node = child.outerNode();
if (node && node.parentNode == container)
return node;
}

return null;
}
,
attach: function XBUI_Computed_attach(child) {
this.parent.attach(child,this);
}
,
detach: function XBUI_Computed_detach(child) {
this.parent.detach(child,this);
}
,
update: function XBUI_Computed_update() {
this.readValue();
for each(let child in this.children()) child.destroy();
this._animateChildren(this._processValue());
this.change();
}
,
append: function XBUI_Computed_append() {

}
,
build: function XBUI_Computed_build() {
this.update();
this._built = true;
}
,
destroy: function XBUI_Computed_destroy() {
var WIID = this.root.widgetInstance.id;
this.builder.valueNotNeeded(WIID,this.elementId);
this.builder.collection.remove(WIID,this.elementId);
this.base();
}
,
_processValue: function XBUI_Computed__processValue() {
var value = this.value;
if (typeof value == "undefined")
return [];
if (XB.types.isException(value))
{
this.logger.warn("Got exception value: " + value.toString());
return [];
}

var elements = null;
if (XB.types.isXML(value))
{
elements = Array.prototype.slice.apply(value.childNodes);
elements = elements.concat(Array.prototype.slice.apply(value.attributes));
}
 else
{
let text = "";
try {
text = XB.types.xToString(value);
}
catch (e) {
this.logger.error("Failed converting XValue into a string. " + strutils.formatError(e));
}

elements = [this.document.createTextNode(text)];
}

return this._translateElements(elements);
}
});
