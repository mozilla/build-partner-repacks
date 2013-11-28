"use strict";
const UI = XB.UI = {
get application() {
return XB._base.application;
}
,
getLogger: function UI_getLogger(name) {
return XB._base.application.getLogger(this._loggersRoot + "." + name);
}
,
_logger: XB._base.getLogger(this._loggersRoot),
_loggersRoot: "UI",
_consts: {
STR_XUL_NS: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
STR_HTML_NS: "http://www.w3.org/1999/xhtml",
STR_VAL_REF_ELEM_NAME: "__value__",
STR_VAL_REF_ID_KEY_NAME: "uid"},
_newXBID: 0,
_genBuilderID: function UI__genBuilderID() {
return this._newXBID++;
}
};
UI.ElementsCollection = function UIElementsCollection() {
this._widgets = Object.create(null);
}
;
UI.ElementsCollection.prototype = {
put: function UIElementsCollection_put(widgetInstanceId, elementId, behaviour) {
var widget = this._widgets[widgetInstanceId] || (this._widgets[widgetInstanceId] = Object.create(null));
widget[elementId] = behaviour;
}
,
get: function UIElementsCollection_get(widgetInstanceId, elementId) {
return this._widgets[widgetInstanceId][elementId];
}
,
remove: function UIElementsCollection_remove(widgetInstanceId, elementId) {
delete this._widgets[widgetInstanceId][elementId];
}
,
finalize: function UIElementsCollection_finalize() {
for(let instance in this._widgets) {
let widget = this._widgets[instance];
for(let element in widget) delete widget[element];
delete this._widgets[instance];
}

}
,
_widgets: null};
UI.Builder = function UIBuilder(widgetHost) {
this._xid = UI._genBuilderID();
this._logger = UI.getLogger("B" + this._xid);
this._widgetHost = widgetHost;
this._collection = new UI.ElementsCollection();
this._fullWidgetItemIDPattern = new RegExp(XB._base.application.name + "\\.xb\\-(.+)\\-inst\\-(.+)");
this._behaviours = {
};
this._logger.debug("Constructing");
}
;
UI.Builder.prototype = {
get collection() {
return this._collection;
}
,
makeWidget: function UIBuilder_makeWidget(widgetInstance, toolbarElement) {
if (! (widgetInstance instanceof XB.WidgetInstance))
throw new CustomErrors.EArgType("widgetInstance", "XB.WidgetInstance", widgetInstance);
var startTime = Date.now();
var behaviour = new UI.Behaviour.Widget(widgetInstance, toolbarElement, this);
this._behaviours[widgetInstance.id] = behaviour;
this._logger.debug("Widget constructed in " + (Date.now() - startTime) + "ms");
}
,
destroyWidget: function UIBuilder_destroyWidget(WIID) {
if (WIID in this._behaviours)
{
this._behaviours[WIID].destroy();
delete this._behaviours[WIID];
}

}
,
finalize: function UIBuilder_finalize() {
for(let WIID in this._behaviours) this.destroyWidget(WIID);
this._collection.finalize();
}
,
dispatchCommands: function UIBuilder_dispatchCommands(WIID, commandsArray, eventInfo) {
for each(let command in commandsArray) {
try {
let procResult = this._perform(WIID,command,eventInfo);
if (XB.types.isException(procResult))
throw procResult;
}
catch (e) {
this._logger.error("Error running action " + [WIID, command].join(":") + ". " + strutils.formatError(e));
this._logger.debug(e.stack);
}

}

}
,
cleanNode: function UIBuilder_cleanNode(node) {
if (! node)
return;
var child = node.firstChild;
while (child) {
let next = child.nextSibling;
this.cleanNode(child);
this.removeNode(child);
child = next;
}

}
,
removeNode: function UIBuilder_removeNode(node) {
if (node && node.parentNode)
node.parentNode.removeChild(node);
}
,
get widgetHost() {
return this._widgetHost;
}
,
get id() {
return this._xid;
}
,
get effectiveID() {
return this._xid;
}
,
getXBValue: function UIBuilder_getXBValue(widgetIID, valUID) {
return this._getCalcNode(widgetIID,valUID).getValue(this);
}
,
getNodeDescription: function UIBuilder_getNodeDescription(widgetIID, valUID) {
try {
let calcNode = this._getCalcNode(widgetIID,valUID);
return calcNode.description;
}
catch (e) {
return "no value description for " + [widgetIID, valUID];
}

}
,
valueNotNeeded: function UIBuilder_valueNotNeeded(widgetIID, valUID) {
this._getCalcNode(widgetIID,valUID).unsubscribe(this);
}
,
freeze: function UIBuilder_freeze() {

}
,
melt: function UIBuilder_melt(changedNode) {
if (! changedNode)
return;
try {
let behaviour = this._collection.get(changedNode.owner.id,changedNode.baseID,changedNode.getValue(this));
behaviour.update();
}
catch (e) {
this._logger.error("Failed updating UI object. " + strutils.formatError(e));
if (e.stack)
this._logger.debug(e.stack);
}

}
,
_xid: undefined,
_logger: null,
_widgetHost: null,
_collection: null,
_fullWidgetItemIDPattern: null,
_behaviours: null,
_getCalcNode: function UIBuilder__getCalcNode(widgetIID, valUID) {
var calcNode = this._widgetHost.getWidget(widgetIID).findReference(valUID);
if (! calcNode)
throw new Error("Requested value not found (" + [widgetIID, valUID] + ")");
return calcNode;
}
,
_perform: function UIBuilder__perform(widgetIID, valUID, eventInfo) {
var procNode;
try {
procNode = this._getCalcNode(widgetIID,valUID);
}
catch (e) {
throw new UI.Builder.ENoActionHandler(e.message);
}

return procNode instanceof XB._calcNodes.ProcNode ? procNode.perform(eventInfo) : procNode.getValue();
}
,
_getHumanReadableID: function UIBuilder__getHumanReadableID() {
return "XB.UI.Builder" + this._xid;
}
};
UI.Builder.ENoActionHandler = function ENoActionHandler(msg) {
this.name = "No action handler error";
this.message = msg;
}
;
UI.Builder.ENoActionHandler.prototype = new Error();
