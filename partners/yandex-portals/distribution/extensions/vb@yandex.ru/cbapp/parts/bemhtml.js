const EXPORTED_SYMBOLS = ["BEMHTML"];
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;
const GLOBAL = this;
var BEMHTML = (function () {
var cache, xjst = (function (exports) {
exports.apply = apply;
function apply(callback) {
if (typeof callback !== "function")
{
var reqq = apply.reqq, resq = apply.resq, result;
delete apply.reqq;
delete apply.resq;
applySync.call(this,function (err, r) {
if (err)
throw err;
result = r;
}
);
apply.reqq = reqq;
apply.resq = resq;
return result;
}

var reqq = apply.reqq || [], resq = apply.resq || [];
reqq.push({
self: this,
res: null,
callback: callback});
if (apply.reqq && apply.resq)
return;
apply.reqq = reqq;
apply.resq = resq;
while (reqq.length !== 0 || resq.length !== 0) {
if (reqq.length !== 0)
{
var item = reqq.pop();
(function (item) {
applySync.call(item.self,function (err, r) {
if (err)
throw err;
item.res = r;
resq.push(item);
}
);
}
)(item);
}

if (resq.length !== 0)
{
var item = resq.shift();
item.callback.call(item.self,null,item.res);
}

}

delete apply.reqq;
delete apply.resq;
return null;
}

function applySync(__$callback) {
var __t = this.block;
if (__t === "b-tumb-lib")
{
if (this._mode === "tag")
{
var __t = this.elem;
if (__t === "fav")
{
return $5.call(this,__$callback);
}
 else
if (__t === "glow")
{
return $7.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-setting")
{
var __t = this._mode;
if (__t === "attrs")
{
if (! ! this.elem === false)
{
return $28.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
if (! ! this.elem === false)
{
return $33.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-form-checkbox")
{
var __t = this._mode;
if (__t === "attrs")
{
var __t = this.elem;
if (__t === "tick")
{
return $41.call(this,__$callback);
}
 else
if (__t === "checkbox")
{
return $43.call(this,__$callback);
}
 else
if (__t === "label")
{
return $45.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
var __t = this.elem;
if (__t === "tick")
{
return $50.call(this,__$callback);
}
 else
if (__t === "bg")
{
return $52.call(this,__$callback);
}
 else
if (__t === "checkbox")
{
return $54.call(this,__$callback);
}
 else
if (__t === "label")
{
return $56.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $59.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}

}
 else
if (__t === "content")
{
if (this.elem === "bg")
{
return $64.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $67.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}

}
 else
if (__t === "mix")
{
if (! ! this.elem === false)
{
return $72.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $77.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "default")
{
if (! ! this._checkboxAttrs === false)
{
if (! ! this.elem === false)
{
return $83.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-select-theme")
{
if (this._mode === "content")
{
if (! (this.mods && this.mods.slider === "yes") === false)
{
if (! ! this.elem === false)
{
return $94.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-tumbs-lib")
{
var __t = this._mode;
if (__t === "attrs")
{
if (this.elem === "arrow")
{
return $15.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
if (this.elem === "arrow")
{
return $20.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-form-input")
{
if (this._mode === "mix")
{
if (! this._inSlider === false)
{
if (! ! this.elem === false)
{
return $138.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-properties-popup")
{
if (this._mode === "tag")
{
var __t = this.elem;
if (__t === "copyright")
{
return $148.call(this,__$callback);
}
 else
if (__t === "version")
{
return $150.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-vb-foot")
{
var __t = this._mode;
if (__t === "content")
{
if (! ! this.elem === false)
{
return $158.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
if (! ! this.elem === false)
{
return $163.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-tumb")
{
if (this._mode === "tag")
{
var __t = this.elem;
if (__t === "fav")
{
return $171.call(this,__$callback);
}
 else
if (__t === "glow")
{
return $173.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-form-button")
{
var __t = this._mode;
if (__t === "tag")
{
if (this.elem === "simple")
{
if (! (this.mods && this.mods.type === "simple") === false)
{
return $182.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (! (this.mods && this.mods.type === "simple") === false)
{
if (! ! this.elem === false)
{
return $190.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "mix")
{
if (! (this.mods && this.mods.type === "simple") === false)
{
if (! ! this.ctx._mix === false)
{
if (! ! this.elem === false)
{
if (! ! this.ctx.mods.theme === false)
{
return $200.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "b-form-slider")
{
var __t = this._mode;
if (__t === "mix")
{
if (this.elem === "body")
{
if (! this.mods.orientation === false)
{
if (! ! this.ctx._wOrigin === false)
{
return $106.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (! ! this.elem === false)
{
return $115.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
if (__t === "default")
{
if (! ! this.elem === false)
{
if (! ! this.mods.orientation === false)
{
return $121.call(this,__$callback);
}
 else
{
return $124.call(this,__$callback);
}

}
 else
{
return $124.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}

function $5(__$callback) {
return __$callback.call(this,null,"span");
}

function $7(__$callback) {
return __$callback.call(this,null,"span");
}

function $15(__$callback) {
return __$callback.call(this,null,{
href: "#"});
}

function $20(__$callback) {
return __$callback.call(this,null,"a");
}

function $28(__$callback) {
return __$callback.call(this,null,{
action: "",
method: "post"});
}

function $33(__$callback) {
return __$callback.call(this,null,"form");
}

function $41(__$callback) {
var __$i15;
var __$i2;
__$i2 = "chrome://yandex-vb/content/fastdial/layout/_/La6qi18Z8LwgnZdsAr1qy1GwCwo.gif";
if (this.mods.checked)
{
__$i15 = " v";
}
 else
{
__$i15 = "";
}

return __$callback.call(this,null,{
src: __$i2,
alt: __$i15,
title: ""});
}

function $43(__$callback) {
var __$i64;
var __$i54;
var __$i48;
var __$i38;
var __$i19;
var _$6sa;
if (this.ctx.attrs)
{
__$i19 = this.ctx.attrs;
}
 else
{
__$i19 = {
};
}

_$6sa = __$i19;
_$6sa.id = this._checkboxAttrs.id;
_$6sa.type = "checkbox";
__$i38 = this.mods.disabled;
if (__$i38)
{
__$i48 = _$6sa.disabled = "disabled";
}
 else
{
__$i48 = __$i38;
}

__$i54 = this.mods.checked;
if (__$i54)
{
__$i64 = _$6sa.checked = "checked";
}
 else
{
__$i64 = __$i54;
}

return __$callback.call(this,null,_$6sa);
}

function $45(__$callback) {
var __$i19;
var _$6qa;
if (this.ctx.attrs)
{
__$i19 = this.ctx.attrs;
}
 else
{
__$i19 = {
};
}

_$6qa = __$i19;
_$6qa.for = this._checkboxAttrs.id;
return __$callback.call(this,null,_$6qa);
}

function $50(__$callback) {
return __$callback.call(this,null,"img");
}

function $52(__$callback) {
return __$callback.call(this,null,"i");
}

function $54(__$callback) {
return __$callback.call(this,null,"input");
}

function $56(__$callback) {
return __$callback.call(this,null,"label");
}

function $59(__$callback) {
return __$callback.call(this,null,"span");
}

function $64(__$callback) {
return __$callback.call(this,null,{
elem: "tick"});
}

function $67(__$callback) {
var __$i16;
var __$i2;
var __$i3;
var __$i4;
var __$i9;
__$i2 = "inner";
__$i3 = "span";
__$i4 = "checkbox";
__$i9 = this.ctx.checkboxAttrs;
if (__$i9)
{
__$i16 = __$i9;
}
 else
{
__$i16 = {
};
}

return __$callback.call(this,null,[{
elem: __$i2,
tag: __$i3,
content: [{
elem: __$i4,
attrs: __$i16}, {
elem: "bg"}]}, this.ctx.content]);
}

function $72(__$callback) {
var __$i18;
if (! this.mods.size)
{
__$i18 = [{
mods: {
size: "m"}}];
}
 else
{
__$i18 = "";
}

return __$callback.call(this,null,__$i18);
}

function $77(__$callback) {
return __$callback.call(this,null,true);
}

function $83(__$callback) {
var __$i34;
var __$i11;
var __$i12;
var __$i15;
var __$i16;
var __$i22;
var __$i27;
var __$r6;
function __$fn6(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r6 = __$r;
}

__r163 = __$r6;
this._checkboxAttrs = __r162;
"";
return __$callback.call(this,null,__r163);
}

var __r162, __r163;
var __this;
__this = this;
"";
__r162 = this._checkboxAttrs;
__$i11 = this;
__$i12 = "_checkboxAttrs";
__$i15 = this._;
__$i16 = "extend";
__$i22 = {
id: "id" + Math.random()};
__$i27 = this.ctx.checkboxAttrs;
if (__$i27)
{
__$i34 = __$i27;
}
 else
{
__$i34 = {
};
}

__$i11[__$i12] = __$i15[__$i16](__$i22,__$i34);
return apply.call(__this,__$fn6);
}

function $94(__$callback) {
return __$callback.call(this,null,[{
elem: "arrow",
elemMods: {
type: "left"}}, {
elem: "arrow",
elemMods: {
type: "right"}}, {
elem: "slider",
content: {
elem: "box",
content: this.ctx.content}}]);
}

function $106(__$callback) {
var __$i56;
var __$i40;
var __$i41;
var __$i37;
var __$i30;
var __$r10;
function __$fn10(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r10 = __$r;
}

__r161 = __$r10;
__r159._wOrigin = __r160;
"";
__$i30 = __r161;
if (__$i30)
{
__$i37 = __$i30;
}
 else
{
__$i37 = [];
}

_$6im = __$i37;
__$i40 = _$6im;
__$i41 = "push";
if (this.mods.orientation === "vert")
{
__$i56 = "y";
}
 else
{
__$i56 = "x";
}

__$i40[__$i41]({
elemMods: {
origin: __$i56}});
return __$callback.call(this,null,_$6im);
}

var _$6im;
var __r159, __r160, __r161;
var __this;
__this = this;
"";
__r159 = this.ctx;
__r160 = __r159._wOrigin;
__r159._wOrigin = true;
return apply.call(__this,__$fn10);
}

function $115(__$callback) {
return __$callback.call(this,null,[this.ctx.content, {
elem: "body",
content: {
elem: "click"}}]);
}

function $121(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

this._mode = __r156;
__r157.orientation = __r158;
"";
undefined;
return __$callback.call(this,null);
}

var __r157, __r158;
var __r156;
var __this;
__this = this;
"";
__r156 = this._mode;
this._mode = "";
__r157 = this.ctx.mods;
__r158 = __r157.orientation;
__r157.orientation = "horiz";
return apply.call(__this,__$fn2);
}

function $124(__$callback) {
if (! ! this._inSlider === false)
{
if (! ! this.elem === false)
{
return $127.call(this,__$callback);
}
 else
{
return $211.call(this,__$callback);
}

}
 else
{
return $211.call(this,__$callback);
}

}

function $127(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

__r155 = __$r2;
this._inSlider = __r154;
"";
return __$callback.call(this,null,__r155);
}

var __r154, __r155;
var __this;
__this = this;
"";
__r154 = this._inSlider;
this._inSlider = true;
return apply.call(__this,__$fn2);
}

function $138(__$callback) {
return __$callback.call(this,null,[{
block: "b-form-slider",
elem: "input"}]);
}

function $148(__$callback) {
return __$callback.call(this,null,"span");
}

function $150(__$callback) {
return __$callback.call(this,null,"span");
}

function $158(__$callback) {
return __$callback.call(this,null,{
elem: "wrapper",
content: this.ctx.content});
}

function $163(__$callback) {
return __$callback.call(this,null,"div");
}

function $171(__$callback) {
return __$callback.call(this,null,"span");
}

function $173(__$callback) {
return __$callback.call(this,null,"span");
}

function $182(__$callback) {
return __$callback.call(this,null,"span");
}

function $190(__$callback) {
return __$callback.call(this,null,[{
elem: "simple",
content: this.ctx.content}, this._click, this._input]);
}

function $200(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

_$65mix = __$r2;
__r152._mix = __r153;
"";
_$65mix[0].mods.theme = "simple-grey";
return __$callback.call(this,null,_$65mix);
}

var __r152, __r153;
var _$65mix;
"";
__r152 = this.ctx;
__r153 = __r152._mix;
__r152._mix = true;
return this.apply(__$fn2);
}

function $211(__$callback) {
if (! this._ === false)
{
if (! ! this._.cleverSubstring === false)
{
return $214.call(this,__$callback);
}
 else
{
return $217.call(this,__$callback);
}

}
 else
{
return $217.call(this,__$callback);
}

}

function $214(__$callback) {
var __$r7;
function __$fn7(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r7 = __$r;
}

__r150.cleverSubstring = __r151;
"";
return __$callback.call(this,null);
}

var __r150, __r151;
"";
__r150 = this._;
__r151 = __r150.cleverSubstring;
__r150.cleverSubstring = function (str, maxLength, maxLengthRelative) {
var __$i47;
if (str.length > maxLength + maxLengthRelative)
{
__$i47 = str.substring(0,maxLength - 1) + "&";
}
 else
{
__$i47 = str;
}

return __$i47;
}
;
return this.apply(__$fn7);
}

function $217(__$callback) {
var __t = this.block;
if (__t === "i-ua")
{
if (this._mode === "content")
{
if (! (this.__$anflg !== 676189749) === false)
{
if (! ! this.elem === false)
{
return $222.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "b-form-input")
{
var __t = this._mode;
if (__t === "default")
{
var __t = this.elem;
if (__t === "hint")
{
if (! ! this.ctx._wrap === false)
{
return $233.call(this,__$callback);
}
 else
{
return $241.call(this,__$callback);
}

}
 else
if (__t === "input")
{
if (! ! this.ctx._wrap === false)
{
return $238.call(this,__$callback);
}
 else
{
return $241.call(this,__$callback);
}

}
 else
{
return $241.call(this,__$callback);
}

}
 else
if (__t === "attrs")
{
var __t = this.elem;
if (__t === "hint")
{
return $251.call(this,__$callback);
}
 else
if (__t === "input")
{
return $253.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
var __t = this.elem;
if (__t === "hint")
{
return $258.call(this,__$callback);
}
 else
if (__t === "input")
{
return $260.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $263.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $268.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "b-search")
{
var __t = this._mode;
if (__t === "tag")
{
var __t = this.elem;
if (__t === "intro")
{
return $276.call(this,__$callback);
}
 else
if (__t === "button")
{
return $278.call(this,__$callback);
}
 else
if (__t === "input")
{
return $280.call(this,__$callback);
}
 else
if (__t === "under")
{
return $282.call(this,__$callback);
}
 else
if (__t === "col")
{
return $284.call(this,__$callback);
}
 else
if (__t === "row")
{
return $286.call(this,__$callback);
}
 else
if (__t === "table")
{
return $288.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $291.call(this,__$callback);
}
 else
{
var __t = this.elem;
if (__t === "button")
{
return $294.call(this,__$callback);
}
 else
if (__t === "input")
{
return $296.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $299.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}

}

}

}
 else
if (__t === "cls")
{
if (this.elem === "sample")
{
return $304.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (this.elem === "sample")
{
return $309.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (this.elem === "sample")
{
if (! this.ctx.text === false)
{
return $315.call(this,__$callback);
}
 else
{
return $318.call(this,__$callback);
}

}
 else
{
return $318.call(this,__$callback);
}

}
 else
if (__t === "attrs")
{
var __t = this.elem;
if (__t === "button")
{
return $340.call(this,__$callback);
}
 else
if (__t === "input")
{
return $342.call(this,__$callback);
}
 else
if (__t === "under")
{
return $344.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $347.call(this,__$callback);
}
 else
{
var __t = this.elem;
if (__t === "button")
{
return $350.call(this,__$callback);
}
 else
if (__t === "input")
{
return $352.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}

}

}
 else
if (__t === "bem")
{
if (this.elem === "row")
{
return $357.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "lego-input")
{
if (! ! this.elem === false)
{
return $362.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "lego-label")
{
if (! ! this.elem === false)
{
return $367.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "lego-under")
{
if (! ! this.elem === false)
{
return $372.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "b-layout-table")
{
var __t = this._mode;
if (__t === "attrs")
{
if (! (this.elem === "cell" || this.elem === "gap") === false)
{
return $380.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
if (! (this.elem === "cell" || this.elem === "gap") === false)
{
return $385.call(this,__$callback);
}
 else
{
if (this.elem === "row")
{
return $388.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $391.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}

}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "b-head-search")
{
var __t = this._mode;
if (__t === "tag")
{
var __t = this.elem;
if (__t === "arr-i")
{
return $399.call(this,__$callback);
}
 else
if (__t === "arr")
{
return $401.call(this,__$callback);
}
 else
if (__t === "extra")
{
return $403.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (this.elem === "arr")
{
return $408.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $411.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "b-head-logo")
{
var __t = this._mode;
if (__t === "attrs-src")
{
if (this.elem === "img")
{
if (! ~ ["en", "tr"].indexOf(this["i-global"].lang) === false)
{
return $420.call(this,__$callback);
}
 else
{
return $422.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "attrs-alt")
{
if (this.elem === "img")
{
return $427.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "attrs")
{
var __t = this.elem;
if (__t === "img")
{
return $432.call(this,__$callback);
}
 else
if (__t === "link")
{
return $434.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $437.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}

}
 else
if (__t === "tag")
{
var __t = this.elem;
if (__t === "img")
{
return $442.call(this,__$callback);
}
 else
if (__t === "link")
{
return $444.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (! ! this.ctx.content === false)
{
if (! ! this.elem === false)
{
return $450.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
if (__t === "i-services")
{
var __t = this.elem;
if (__t === "url")
{
return $459.call(this,__$callback);
}
 else
if (__t === "name")
{
return $461.call(this,__$callback);
}
 else
{
if (! this.elem === false)
{
return $464.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}

}
 else
{
return $467.call(this,__$callback);
}

}

function $222(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

__r149 = __$r2;
this.__$anflg = __r148;
"";
_$63c = __r149;
_$63c += [";(function(d,e,c,r,n,w,v,f){", "e=d.documentElement;", "c=\"className\";", "r=\"replace\";", "n=\"createElementNS\";", "f=\"firstChild\";", "w=\"http://www.w3.org/2000/svg\";", "e[c]+=!!d[n]&&!!d[n](w,\"svg\").createSVGRect?\" i-ua_svg_yes\":\" i-ua_svg_no\";", "v=d.createElement(\"div\");", "v.innerHTML=\"<svg/>\";", "e[c]+=(v[f]&&v[f].namespaceURI)==w?\" i-ua_inlinesvg_yes\":\" i-ua_inlinesvg_no\";", "})(document);"].join("");
return __$callback.call(this,null,_$63c);
}

var _$63c;
var __r148, __r149;
var __this;
__this = this;
"";
__r148 = this.__$anflg;
this.__$anflg = 676189749;
return apply.call(__this,__$fn2);
}

function $233(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

this._mode = __r144;
__r145._wrap = __r146;
this.ctx = __r147;
"";
return __$callback.call(this,null);
}

var __r147;
var __r145, __r146;
var __r144;
"";
__r144 = this._mode;
this._mode = "";
__r145 = this.ctx;
__r146 = __r145._wrap;
__r145._wrap = true;
__r147 = this.ctx;
this.ctx = {
elem: "hint-wrap",
tag: "span",
content: this.ctx};
return this.apply(__$fn2);
}

function $238(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

this._mode = __r130;
__r131._wrap = __r132;
this.ctx = __r133;
"";
return __$callback.call(this,null);
}

var __r133;
var __r131, __r132;
var __r130;
"";
__r130 = this._mode;
this._mode = "";
__r131 = this.ctx;
__r132 = __r131._wrap;
__r131._wrap = true;
__r133 = this.ctx;
this.ctx = {
elem: "box",
tag: "span",
content: [this.ctx, this.ctx.clear]};
return this.apply(__$fn2);
}

function $241(__$callback) {
if (! ! this._inputId === false)
{
if (! ! this.elem === false)
{
return $244.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}

function $244(__$callback) {
var __$i65;
var __$i52;
var __$i53;
var __$i58;
var __$i44;
var __$i31;
var __$i32;
var __$i37;
var __$i23;
var __$i8;
var __$i9;
var __$i14;
var __$r14;
function __$fn14(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r14 = __$r;
}

this._inputId = __r127;
this._name = __r128;
this._value = __r129;
"";
return __$callback.call(this,null);
}

var __r129;
var __r128;
var __r127;
"";
__r127 = this._inputId;
__$i8 = this;
__$i9 = "_inputId";
__$i14 = this.ctx.id;
if (__$i14)
{
__$i23 = __$i14;
}
 else
{
__$i23 = this.generateId();
}

__$i8[__$i9] = __$i23;
__r128 = this._name;
__$i31 = this;
__$i32 = "_name";
__$i37 = this.ctx.name;
if (__$i37)
{
__$i44 = __$i37;
}
 else
{
__$i44 = "";
}

__$i31[__$i32] = __$i44;
__r129 = this._value;
__$i52 = this;
__$i53 = "_value";
__$i58 = this.ctx.value;
if (__$i58)
{
__$i65 = __$i58;
}
 else
{
__$i65 = "";
}

__$i52[__$i53] = __$i65;
return this.apply(__$fn14);
}

function $251(__$callback) {
return __$callback.call(this,null,{
"for": this._inputId});
}

function $253(__$callback) {
var __$i41;
var __$i31;
var __$i25;
var __$i13;
var _$53a;
_$53a = {
id: this._inputId,
name: this._name};
__$i13 = this._value;
if (__$i13)
{
__$i25 = _$53a.value = this._value;
}
 else
{
__$i25 = __$i13;
}

__$i31 = this.mods.disabled;
if (__$i31)
{
__$i41 = _$53a.disabled = "disabled";
}
 else
{
__$i41 = __$i31;
}

return __$callback.call(this,null,_$53a);
}

function $258(__$callback) {
return __$callback.call(this,null,"label");
}

function $260(__$callback) {
return __$callback.call(this,null,"input");
}

function $263(__$callback) {
return __$callback.call(this,null,"span");
}

function $268(__$callback) {
var __$i18;
if (this.mods.popup == "gradient")
{
__$i18 = {
popupMods: {
gradient: "yes"}};
}
 else
{
__$i18 = true;
}

return __$callback.call(this,null,__$i18);
}

function $276(__$callback) {
return __$callback.call(this,null,"i");
}

function $278(__$callback) {
return __$callback.call(this,null,"td");
}

function $280(__$callback) {
return __$callback.call(this,null,"td");
}

function $282(__$callback) {
return __$callback.call(this,null,"td");
}

function $284(__$callback) {
return __$callback.call(this,null,"td");
}

function $286(__$callback) {
return __$callback.call(this,null,"tr");
}

function $288(__$callback) {
return __$callback.call(this,null,"table");
}

function $291(__$callback) {
return __$callback.call(this,null,"form");
}

function $294(__$callback) {
return __$callback.call(this,null,"input");
}

function $296(__$callback) {
return __$callback.call(this,null,"input");
}

function $299(__$callback) {
return __$callback.call(this,null,"form");
}

function $304(__$callback) {
return __$callback.call(this,null,"i-bem");
}

function $309(__$callback) {
var __$i19;
if (this.ctx.name)
{
__$i19 = {
"for": this.ctx.name};
}
 else
{
__$i19 = true;
}

return __$callback.call(this,null,__$i19);
}

function $315(__$callback) {
return __$callback.call(this,null,[{
elem: "intro",
content: [BEM.I18N("b-search","for-example"), ","]}, "&#160;", {
block: "b-link",
mods: {
pseudo: "yes"},
content: this.ctx.text}]);
}

function $318(__$callback) {
if (! ! this.ctx.content === false)
{
if (! ! this.elem === false)
{
return $321.call(this,__$callback);
}
 else
{
return $324.call(this,__$callback);
}

}
 else
{
return $324.call(this,__$callback);
}

}

function $321(__$callback) {
var __$i238;
var __$i217;
var __$i203;
var __$i161;
var __$i143;
var __$i54;
var __$i55;
var __$i56;
var __$i100;
var __$i31;
var __$r28;
function __$fn28(__$e, __$r) {
var __$r30;
function __$fn30(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r30 = __$r;
}

__r143 = __$r30;
this._mode = __r141;
this.ctx = __r142;
"";
_$5fitem = __r143;
__$i203 = _$5fitem;
if (__$i203)
{
__$i217 = _$5frow.content.push({
elem: "row",
content: _$5fitem});
}
 else
{
__$i217 = __$i203;
}

if (this.ctx.hidden)
{
__$i238 = _$5frow = [_$5frow, this.ctx.hidden];
}
 else
{
__$i238 = "";
}

return __$callback.call(this,null,_$5frow);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r28 = __$r;
}

while (true) {
if (! (_$5fi < _$5flen))
{
break;
}
 else
{
_$5fitem = _$5finput[_$5fi++];
__$i54 = [].push;
__$i55 = "apply";
__$i56 = _$5frow;
"";
__r134 = this._mode;
this._mode = "lego-label";
__r135 = this.ctx;
this.ctx = _$5fitem;
__r136 = this.position;
this.position = _$5fi;
return apply.call(__this,__$fn27);
}

}

__$i143 = this.ctx.button;
if (__$i143)
{
__$i161 = _$5frow.push({
elem: "button",
content: this.ctx.button.content});
}
 else
{
__$i161 = __$i143;
}

_$5frow = {
elem: "table",
content: [{
elem: "row",
content: _$5frow}]};
"";
__r141 = this._mode;
this._mode = "lego-under";
__r142 = this.ctx;
this.ctx = _$5finput;
return apply.call(__this,__$fn30);
}

var __$r27;
function __$fn27(__$e, __$r) {
var __$r29;
function __$fn29(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r29 = __$r;
}

__r140 = __$r29;
this._mode = __r138;
this.ctx = __r139;
"";
__$i54[__$i55](__$i56,[__$i100, __r140]);
return __$fn28.call(this);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r27 = __$r;
}

__r137 = __$r27;
this._mode = __r134;
this.ctx = __r135;
this.position = __r136;
"";
__$i100 = __r137;
"";
__r138 = this._mode;
this._mode = "lego-input";
__r139 = this.ctx;
this.ctx = _$5fitem;
return apply.call(__this,__$fn29);
}

var _$5finput, _$5flen, _$5frow, _$5fi, _$5fitem;
var __r134, __r135, __r136, __r137, __r138, __r139, __r140, __r141, __r142, __r143;
var __this;
__this = this;
_$5finput = this.ctx.input;
if (this._.isArray(_$5finput))
{
__$i31 = _$5finput.length;
}
 else
{
_$5finput = [_$5finput];
__$i31 = 1;
}

_$5flen = __$i31;
_$5frow = [];
_$5fi = 0;
return __$fn28.call(this);
}

function $324(__$callback) {
if (! ! this.elem === false)
{
return $326.call(this,__$callback);
}
 else
{
if (! this.ctx.button === false)
{
if (! this.ctx.input === false)
{
if (! ! this.elem === false)
{
return $331.call(this,__$callback);
}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}
 else
{
return $467.call(this,__$callback);
}

}

}

function $326(__$callback) {
var __$i25;
var __$i8;
__$i8 = {
elem: "table",
content: this.ctx.content};
if (this.ctx.hidden)
{
__$i25 = this.ctx.hidden;
}
 else
{
__$i25 = "";
}

return __$callback.call(this,null,[__$i8, __$i25]);
}

function $331(__$callback) {
var __$i82;
var __$i56;
var _$56c;
this.ctx.input.block = "b-search";
this.ctx.button.block = "b-search";
_$56c = {
block: "b-layout-table",
mix: [{
block: "b-search",
elem: "layout"}],
content: [{
elem: "row",
content: [{
elem: "cell",
mix: [{
block: "b-search",
elem: "layout-input"}],
content: this.ctx.input}, {
elem: "cell",
mix: [{
block: "b-search",
elem: "layout-button"}],
content: this.ctx.button}]}]};
__$i56 = this.ctx.under;
if (__$i56)
{
__$i82 = _$56c.content.push({
elem: "row",
content: [{
elem: "cell",
mix: [{
block: "b-search",
elem: "layout-under"}],
colspan: 2,
content: this.ctx.under}]});
}
 else
{
__$i82 = __$i56;
}

return __$callback.call(this,null,_$56c);
}

function $340(__$callback) {
return __$callback.call(this,null,false);
}

function $342(__$callback) {
return __$callback.call(this,null,false);
}

function $344(__$callback) {
return __$callback.call(this,null,{
colspan: 2});
}

function $347(__$callback) {
var __$i13;
var __$i6;
__$i6 = this.ctx.action;
if (__$i6)
{
__$i13 = __$i6;
}
 else
{
__$i13 = "/";
}

return __$callback.call(this,null,{
action: __$i13});
}

function $350(__$callback) {
return __$callback.call(this,null,{
type: "submit",
value: "Search"});
}

function $352(__$callback) {
return __$callback.call(this,null,{
name: "text"});
}

function $357(__$callback) {
return __$callback.call(this,null,false);
}

function $362(__$callback) {
return __$callback.call(this,null,{
elem: "input",
content: this.ctx.content});
}

function $367(__$callback) {
return __$callback.call(this,null,undefined);
}

function $372(__$callback) {
var __$i93;
var __$i81;
var __$i77;
var __$i65;
var __$i61;
var __$i49;
var __$i45;
var __$i33;
var _$5binputs, _$5blen, _$5bi, _$5bc, _$5binput, _$5bunder;
_$5binputs = this.ctx;
_$5blen = _$5binputs.length;
_$5bi = 0;
_$5bc = [];
while (true) {
if (! (_$5bi < _$5blen))
{
break;
}
 else
{
_$5binput = _$5binputs[_$5bi++];
_$5bunder = [];
__$i33 = _$5binput.advanced;
if (__$i33)
{
__$i45 = _$5bunder.push(_$5binput.advanced);
}
 else
{
__$i45 = __$i33;
}

__$i49 = _$5binput.precise;
if (__$i49)
{
__$i61 = _$5bunder.push(_$5binput.precise);
}
 else
{
__$i61 = __$i49;
}

__$i65 = _$5binput.sample;
if (__$i65)
{
__$i77 = _$5bunder.push(_$5binput.sample);
}
 else
{
__$i77 = __$i65;
}

__$i81 = _$5bunder.length;
if (__$i81)
{
__$i93 = _$5bc.push({
elem: "under",
content: _$5bunder});
}
 else
{
__$i93 = __$i81;
}

}

}

return __$callback.call(this,null,_$5bc);
}

function $380(__$callback) {
var __$i37;
var __$i25;
var _$5vctx, _$5va, _$5vprops, _$5vp;
_$5vctx = this.ctx;
_$5va = {
};
_$5vprops = ["colspan", "rowspan"];
while (true) {
if (! (_$5vp = _$5vprops.shift()))
{
break;
}
 else
{
__$i25 = _$5vctx[_$5vp];
if (__$i25)
{
__$i37 = _$5va[_$5vp] = _$5vctx[_$5vp];
}
 else
{
__$i37 = __$i25;
}

}

}

return __$callback.call(this,null,_$5va);
}

function $385(__$callback) {
return __$callback.call(this,null,"td");
}

function $388(__$callback) {
return __$callback.call(this,null,"tr");
}

function $391(__$callback) {
return __$callback.call(this,null,"table");
}

function $399(__$callback) {
return __$callback.call(this,null,"i");
}

function $401(__$callback) {
return __$callback.call(this,null,"i");
}

function $403(__$callback) {
return __$callback.call(this,null,"i");
}

function $408(__$callback) {
return __$callback.call(this,null,{
elem: "arr-i"});
}

function $411(__$callback) {
return __$callback.call(this,null,{
elem: "wrap",
mix: [{
elem: "arrow"}],
content: [{
elem: "arr"}, this.ctx.content]});
}

function $420(__$callback) {
return __$callback.call(this,null,"//yandex.st/lego/_/w3fZdbIEslxR_9CQRR-ezRNUZ_Q.png");
}

function $422(__$callback) {
return __$callback.call(this,null,"//yandex.st/lego/_/X31pO5JJJKEifJ7sfvuf3mGeD_8.png");
}

function $427(__$callback) {
return __$callback.call(this,null,BEM.I18N("b-head-logo","yandex"));
}

function $432(__$callback) {
var __$i77;
var __$i47;
var __$i48;
var __$i51;
var __$i44;
var __$i14;
var __$i15;
var __$i18;
var __$r11;
function __$fn11(__$e, __$r) {
var __$r13;
function __$fn13(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r13 = __$r;
}

__$i47[__$i48] = __$i77;
return __$callback.call(this,null,_$4qa);
}

var __$r12;
function __$fn12(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r12 = __$r;
}

__r126 = __$r12;
this._mode = __r125;
"";
__$i77 = __r126;
return __$fn13.call(this);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r11 = __$r;
}

__$i14[__$i15] = __$i44;
__$i47 = _$4qa;
__$i48 = "alt";
__$i51 = _$4qctx.alt;
if (__$i51)
{
__$i77 = __$i51;
return __$fn13.call(this);
}
 else
{
"";
__r125 = this._mode;
this._mode = "attrs-alt";
return apply.call(__this,__$fn12);
}

}

var __$r10;
function __$fn10(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r10 = __$r;
}

__r124 = __$r10;
this._mode = __r123;
"";
__$i44 = __r124;
return __$fn11.call(this);
}

var _$4qa, _$4qctx;
var __r123, __r124, __r125, __r126;
var __this;
__this = this;
_$4qa = {
style: "border: 0"};
_$4qctx = this.ctx;
__$i14 = _$4qa;
__$i15 = "src";
__$i18 = _$4qctx.url;
if (__$i18)
{
__$i44 = __$i18;
return __$fn11.call(this);
}
 else
{
"";
__r123 = this._mode;
this._mode = "attrs-src";
return apply.call(__this,__$fn10);
}

}

function $434(__$callback) {
var __$i18;
var __$i6;
__$i6 = this.ctx.url;
if (__$i6)
{
__$i18 = __$i6;
}
 else
{
__$i18 = this["i-services"].serviceUrl("www");
}

return __$callback.call(this,null,{
href: __$i18});
}

function $437(__$callback) {
return __$callback.call(this,null,{
role: "header"});
}

function $442(__$callback) {
return __$callback.call(this,null,"img");
}

function $444(__$callback) {
return __$callback.call(this,null,"a");
}

function $450(__$callback) {
return __$callback.call(this,null,{
elem: "logo",
content: {
elem: "link",
content: {
elem: "img"}}});
}

function $459(__$callback) {
this._buf.push(this["i-services"].serviceUrl(this.ctx.id,this.ctx.region));
return __$callback.call(this,null);
}

function $461(__$callback) {
this._buf.push(this["i-services"].serviceName(this.ctx.id));
return __$callback.call(this,null);
}

function $464(__$callback) {
return __$callback.call(this,null,"");
}

function $467(__$callback) {
if (! this._start === false)
{
if (! this["i-global"] === false)
{
if (! ! this["i-services"] === false)
{
return $471.call(this,__$callback);
}
 else
{
return $476.call(this,__$callback);
}

}
 else
{
return $476.call(this,__$callback);
}

}
 else
{
return $476.call(this,__$callback);
}

}

function $471(__$callback) {
var __$i16;
var __$i17;
var __$r16;
function __$fn16(__$e, __$r) {
var __$r17;
function __$fn17(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r17 = __$r;
}

return __$callback.call(this,null);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r16 = __$r;
}

__r122 = __$r16;
this.block = __r120;
this._mode = __r121;
"";
__$i16[__$i17] = __r122;
_$4h_ctx.serviceName = function (id) {
var __$i75;
var __$i63;
var __$i64;
var __$i65;
var __$i66;
__$i63 = BEM;
__$i64 = "I18N";
__$i65 = "i-services";
__$i66 = id;
if (__$i66)
{
__$i75 = __$i66;
}
 else
{
__$i75 = _$4hparams.id;
}

return __$i63[__$i64](__$i65,__$i75);
}
;
_$4h_ctx.serviceUrl = function (id, region) {
var __$i104;
var __$i93;
var __$i94;
var __$i95;
var __$i89;
var __$i79;
__$i79 = id;
if (__$i79)
{
__$i89 = __$i79;
}
 else
{
__$i89 = id = _$4hparams.id;
}

__$i93 = _$4h_ctx._data;
__$i94 = id;
__$i95 = region;
if (__$i95)
{
__$i104 = __$i95;
}
 else
{
__$i104 = _$4hparams["content-region"];
}

return __$i93[__$i94](__$i104);
}
;
return this.apply(__$fn17);
}

var _$4h_ctx, _$4hparams;
var __r120, __r121, __r122;
var __this;
__this = this;
_$4h_ctx = this["i-services"] = {
};
_$4hparams = this["i-global"];
__$i16 = _$4h_ctx;
__$i17 = "_data";
"";
__r120 = this.block;
this.block = "i-services";
__r121 = this._mode;
this._mode = "service-url";
return apply.call(__this,__$fn16);
}

function $476(__$callback) {
var __t = this.block;
if (__t === "i-services")
{
if (this._mode === "service-url")
{
if (! ! this.elem === false)
{
return $480.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-dropdowna")
{
var __t = this._mode;
if (__t === "tag")
{
var __t = this.elem;
if (__t === "arr")
{
return $603.call(this,__$callback);
}
 else
if (__t === "switcher")
{
return $605.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "default")
{
if (! ! this.ctx._init === false)
{
if (! ! this.elem === false)
{
return $611.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "mix")
{
if (! ! this.elem === false)
{
return $618.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $623.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-link")
{
var __t = this._mode;
if (__t === "content")
{
if (! (this.mods && this.mods.pseudo) === false)
{
if (! ! this.ctx._wrap === false)
{
if (! ! this.elem === false)
{
if (! ! this.mods.inner === false)
{
return $634.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "attrs")
{
if (! (this.mods && this.mods.pseudo) === false)
{
if (! ! this.elem === false)
{
if (! ! this.ctx.url === false)
{
return $647.call(this,__$callback);
}
 else
{
return $652.call(this,__$callback);
}

}
 else
{
return $652.call(this,__$callback);
}

}
 else
{
return $652.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! (this.mods && this.mods.pseudo) === false)
{
if (! ! this.elem === false)
{
return $660.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
if (! (this.mods && this.mods.pseudo) === false)
{
if (! ! this.elem === false)
{
return $668.call(this,__$callback);
}
 else
{
return $671.call(this,__$callback);
}

}
 else
{
return $671.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-menu-horiz")
{
var __t = this._mode;
if (__t === "tag")
{
var __t = this.elem;
if (__t === "layout-unit")
{
if (! (this.mods && this.mods.layout === "normal") === false)
{
return $685.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "layout")
{
if (! (this.mods && this.mods.layout === "normal") === false)
{
return $690.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "title")
{
return $694.call(this,__$callback);
}
 else
if (__t === "item-selector")
{
if (! this.mods === false)
{
return $697.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (! (this.mods && this.mods.layout === "normal") === false)
{
if (! ! this.elem === false)
{
return $705.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "mix")
{
if (this.elem === "layout-unit")
{
if (! this.mods === false)
{
return $713.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "default")
{
if (this.elem === "item")
{
if (! this.mods === false)
{
if (! ! this.ctx._wrap === false)
{
return $722.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! (this.ctx.js === undefined) === false)
{
if (! this.mods === false)
{
if (! ! this.elem === false)
{
return $733.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-icon")
{
var __t = this._mode;
if (__t === "attrs")
{
if (! ! this.elem === false)
{
return $745.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
if (! ! this.elem === false)
{
return $750.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-popupa")
{
var __t = this._mode;
if (__t === "tag")
{
var __t = this.elem;
if (__t === "close")
{
return $550.call(this,__$callback);
}
 else
if (__t === "tail")
{
return $552.call(this,__$callback);
}
 else
if (__t === "wrap-cell")
{
return $554.call(this,__$callback);
}
 else
if (__t === "wrap")
{
return $556.call(this,__$callback);
}
 else
if (__t === "shadow")
{
return $558.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (this.elem === "wrap")
{
return $563.call(this,__$callback);
}
 else
{
if (! (this.mods && this.mods["has-close"] === "yes") === false)
{
if (! ! this.elem === false)
{
return $567.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "attrs")
{
if (this.elem === "wrap")
{
return $574.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "default")
{
if (this.elem === "content")
{
if (! ! this.ctx._wrap === false)
{
return $580.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "mix")
{
if (! ! this.ctx._mix === false)
{
if (! ! this.elem === false)
{
return $588.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $595.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-form-button")
{
var __t = this._mode;
if (__t === "attrs")
{
if (this.elem === "input")
{
return $776.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $779.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "tag")
{
var __t = this.elem;
if (__t === "input")
{
return $784.call(this,__$callback);
}
 else
if (__t === "click")
{
if (! this.ctx.url === false)
{
return $787.call(this,__$callback);
}
 else
{
return $789.call(this,__$callback);
}

}
 else
if (__t === "text")
{
return $791.call(this,__$callback);
}
 else
if (__t === "left")
{
return $793.call(this,__$callback);
}
 else
{
if (! this.ctx === false)
{
if (! this.ctx.url === false)
{
if (! ! this.elem === false)
{
return $798.call(this,__$callback);
}
 else
{
return $803.call(this,__$callback);
}

}
 else
{
return $803.call(this,__$callback);
}

}
 else
{
return $803.call(this,__$callback);
}

}

}
 else
if (__t === "content")
{
if (this.elem === "text")
{
return $810.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $813.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "mix")
{
if (! ! this.elem === false)
{
return $818.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $823.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "default")
{
if (! ! this.ctx._inputClick === false)
{
if (! ! this.elem === false)
{
return $829.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-tumb-lib")
{
var __t = this._mode;
if (__t === "tag")
{
var __t = this.elem;
if (__t === "title")
{
return $839.call(this,__$callback);
}
 else
if (__t === "desc")
{
return $841.call(this,__$callback);
}
 else
if (__t === "content")
{
if (! (this.elemMods && this.elemMods.type) === false)
{
if (! this.elem === false)
{
return $845.call(this,__$callback);
}
 else
{
return $849.call(this,__$callback);
}

}
 else
{
return $849.call(this,__$callback);
}

}
 else
{
if (! ! this.elem === false)
{
return $852.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "content")
{
if (this.elem === "content")
{
if (! (this.elemMods && this.elemMods.type) === false)
{
if (! this.elem === false)
{
return $859.call(this,__$callback);
}
 else
{
return $863.call(this,__$callback);
}

}
 else
{
return $863.call(this,__$callback);
}

}
 else
{
if (! ! this.elem === false)
{
return $866.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "attrs")
{
if (! ! this.elem === false)
{
return $871.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $876.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-vb-droptop")
{
var __t = this._mode;
if (__t === "content")
{
if (! ! this.elem === false)
{
return $884.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $889.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
if (! ! this.elem === false)
{
return $894.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-tumb")
{
var __t = this._mode;
if (__t === "tag")
{
var __t = this.elem;
if (__t === "desc")
{
return $902.call(this,__$callback);
}
 else
if (__t === "title")
{
return $904.call(this,__$callback);
}
 else
if (__t === "content")
{
if (! (this.elemMods && this.elemMods.type) === false)
{
if (! this.elem === false)
{
return $908.call(this,__$callback);
}
 else
{
return $912.call(this,__$callback);
}

}
 else
{
return $912.call(this,__$callback);
}

}
 else
if (__t === "control")
{
return $914.call(this,__$callback);
}
 else
if (__t === "hint")
{
return $916.call(this,__$callback);
}
 else
if (__t === "control-item")
{
return $918.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $921.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "content")
{
if (this.elem === "content")
{
if (! (this.elemMods && this.elemMods.type) === false)
{
if (! this.elem === false)
{
return $928.call(this,__$callback);
}
 else
{
return $932.call(this,__$callback);
}

}
 else
{
return $932.call(this,__$callback);
}

}
 else
{
if (! ! this.elem === false)
{
return $935.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "attrs")
{
if (! ! this.elem === false)
{
return $940.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $945.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-background")
{
if (this._mode === "tag")
{
if (! (this.mods && this.mods.ff === "yes") === false)
{
if (! ! this.elem === false)
{
return $954.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-menu-vert")
{
var __t = this._mode;
if (__t === "tag")
{
var __t = this.elem;
if (__t === "submenu")
{
return $516.call(this,__$callback);
}
 else
if (__t === "item-selector")
{
return $518.call(this,__$callback);
}
 else
if (__t === "layout-unit")
{
return $520.call(this,__$callback);
}
 else
if (__t === "layout")
{
return $522.call(this,__$callback);
}
 else
if (__t === "title")
{
return $524.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "mix")
{
if (this.elem === "layout-unit")
{
return $529.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "default")
{
if (this.elem === "item")
{
if (! ! this.ctx._wrap === false)
{
return $535.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (! ! this.elem === false)
{
return $542.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-page")
{
var __t = this._mode;
if (__t === "attrs")
{
var __t = this.elem;
if (__t === "js")
{
if (! this.ctx.url === false)
{
return $965.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "css")
{
if (! this.ctx.url === false)
{
return $970.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "favicon")
{
return $974.call(this,__$callback);
}
 else
if (__t === "meta")
{
return $976.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
var __t = this.elem;
if (__t === "js")
{
return $981.call(this,__$callback);
}
 else
if (__t === "css")
{
if (! this.ctx.url === false)
{
return $984.call(this,__$callback);
}
 else
{
return $986.call(this,__$callback);
}

}
 else
if (__t === "body")
{
return $988.call(this,__$callback);
}
 else
if (__t === "favicon")
{
return $990.call(this,__$callback);
}
 else
if (__t === "meta")
{
return $992.call(this,__$callback);
}
 else
if (__t === "head")
{
return $994.call(this,__$callback);
}
 else
if (__t === "root")
{
return $996.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $999.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "bem")
{
var __t = this.elem;
if (__t === "js")
{
return $1004.call(this,__$callback);
}
 else
if (__t === "css")
{
return $1006.call(this,__$callback);
}
 else
if (__t === "favicon")
{
return $1008.call(this,__$callback);
}
 else
if (__t === "meta")
{
return $1010.call(this,__$callback);
}
 else
if (__t === "head")
{
return $1012.call(this,__$callback);
}
 else
if (__t === "root")
{
return $1014.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "default")
{
if (this.elem === "css")
{
if (! this.ctx.hasOwnProperty("ie") === false)
{
if (! ! this.ctx._ieCommented === false)
{
return $1021.call(this,__$callback);
}
 else
{
return $1026.call(this,__$callback);
}

}
 else
{
return $1026.call(this,__$callback);
}

}
 else
{
return $1026.call(this,__$callback);
}

}
 else
if (__t === "mix")
{
if (! ! this.ctx._iGlobal === false)
{
if (! ! this.elem === false)
{
return $1037.call(this,__$callback);
}
 else
{
return $1040.call(this,__$callback);
}

}
 else
{
return $1040.call(this,__$callback);
}

}
 else
if (__t === "content")
{
if (! ! this.elem === false)
{
return $1047.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "cls")
{
if (this.elem === "root")
{
return $1052.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "doctype")
{
if (! ! this.elem === false)
{
return $1057.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-vb")
{
var __t = this._mode;
if (__t === "content")
{
var __t = this.elem;
if (__t === "head")
{
return $488.call(this,__$callback);
}
 else
if (__t === "content")
{
return $490.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $493.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "tag")
{
var __t = this.elem;
if (__t === "head")
{
return $498.call(this,__$callback);
}
 else
if (__t === "content")
{
return $500.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $503.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}
 else
if (__t === "attrs")
{
if (! ! this.elem === false)
{
return $508.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "i-bem")
{
if (this._mode === "default")
{
if (this.elem === "i18n")
{
return $1065.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "b-spin")
{
var __t = this._mode;
if (__t === "content")
{
if (! ! this.elem === false)
{
return $758.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "mix")
{
if (! ! this.elem === false)
{
return $763.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
if (__t === "js")
{
if (! ! this.elem === false)
{
return $768.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}

function $480(__$callback) {
return __$callback.call(this,null,{
mail: function (reg) {
if (reg === "ru")
{
return "http://mail.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://mail.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://mail.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://mail.yandex.kz";
}
 else
{
undefined;
if (reg === "com")
{
return "http://mail.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://mail.yandex.com.tr";
}
 else
{
undefined;
return "http://mail.yandex.ru";
}

}

}

}

}

}

}
,
pdd: function (reg) {
if (reg === "ru")
{
return "http://pdd.yandex.ru";
}
 else
{
undefined;
return "http://pdd.yandex.ru";
}

}
,
zakladki: function (reg) {
if (reg === "ru")
{
return "http://zakladki.yandex.ru";
}
 else
{
undefined;
return "http://zakladki.yandex.ru";
}

}
,
narod: function (reg) {
if (reg === "ru")
{
return "http://narod.yandex.ru";
}
 else
{
undefined;
return "http://narod.yandex.ru";
}

}
,
fotki: function (reg) {
if (reg === "ru")
{
return "http://fotki.yandex.ru";
}
 else
{
undefined;
return "http://fotki.yandex.ru";
}

}
,
cards: function (reg) {
if (reg === "ru")
{
return "http://cards.yandex.ru";
}
 else
{
undefined;
return "http://cards.yandex.ru";
}

}
,
moikrug: function (reg) {
if (reg === "ru")
{
return "http://moikrug.ru";
}
 else
{
undefined;
return "http://moikrug.ru";
}

}
,
direct: function (reg) {
if (reg === "ru")
{
return "http://direct.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://direct.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://direct.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://direct.yandex.kz";
}
 else
{
undefined;
if (reg === "com")
{
return "http://direct.yandex.com";
}
 else
{
undefined;
return "http://direct.yandex.ru";
}

}

}

}

}

}
,
money: function (reg) {
if (reg === "ru")
{
return "https://money.yandex.ru";
}
 else
{
undefined;
return "https://money.yandex.ru";
}

}
,
lenta: function (reg) {
if (reg === "ru")
{
return "http://lenta.yandex.ru";
}
 else
{
undefined;
return "http://lenta.yandex.ru";
}

}
,
market: function (reg) {
if (reg === "ru")
{
return "http://market.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://market.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://market.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://market.yandex.kz";
}
 else
{
undefined;
return "http://market.yandex.ru";
}

}

}

}

}
,
"market.advertising": function (reg) {
if (reg === "ru")
{
return "http://welcome.advertising.yandex.ru/market/";
}
 else
{
undefined;
return "http://welcome.advertising.yandex.ru/market/";
}

}
,
wow: function (reg) {
if (reg === "ru")
{
return "http://my.ya.ru";
}
 else
{
undefined;
return "http://my.ya.ru";
}

}
,
tv: function (reg) {
if (reg === "ru")
{
return "http://tv.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://tv.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://tv.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://tv.yandex.kz";
}
 else
{
undefined;
return "http://tv.yandex.ru";
}

}

}

}

}
,
afisha: function (reg) {
if (reg === "ru")
{
return "http://afisha.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://afisha.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://afisha.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://afisha.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://afis.yandex.com.tr";
}
 else
{
undefined;
return "http://afisha.yandex.ru";
}

}

}

}

}

}
,
calendar: function (reg) {
if (reg === "ru")
{
return "http://calendar.yandex.ru";
}
 else
{
undefined;
return "http://calendar.yandex.ru";
}

}
,
nahodki: function (reg) {
if (reg === "ru")
{
return "http://nahodki.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://nahodki.yandex.ua";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://nahodki.yandex.kz";
}
 else
{
undefined;
return "http://nahodki.yandex.ru";
}

}

}

}
,
weather: function (reg) {
if (reg === "ru")
{
return "http://pogoda.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://pogoda.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://pogoda.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://pogoda.yandex.kz";
}
 else
{
undefined;
return "http://pogoda.yandex.ru";
}

}

}

}

}
,
kuda: function (reg) {
if (reg === "ru")
{
return "http://kuda.yandex.ru";
}
 else
{
undefined;
return "http://kuda.yandex.ru";
}

}
,
video: function (reg) {
if (reg === "ru")
{
return "http://video.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://video.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://video.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://video.yandex.kz";
}
 else
{
undefined;
if (reg === "com")
{
return "http://video.yandex.com";
}
 else
{
undefined;
return "http://video.yandex.ru";
}

}

}

}

}

}
,
"video-com": function (reg) {
if (reg === "ru")
{
return "http://video.yandex.com";
}
 else
{
undefined;
return "http://video.yandex.com";
}

}
,
music: function (reg) {
if (reg === "ru")
{
return "http://music.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://music.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://music.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://music.yandex.kz";
}
 else
{
undefined;
return "http://music.yandex.ru";
}

}

}

}

}
,
"music-partner": function (reg) {
if (reg === "ru")
{
return "http://music-partner.yandex.ru";
}
 else
{
undefined;
return "http://music-partner.yandex.ru";
}

}
,
www: function (reg) {
if (reg === "ru")
{
return "http://www.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://www.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://www.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://www.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://www.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://www.yandex.com.tr";
}
 else
{
undefined;
return "http://www.yandex.ru";
}

}

}

}

}

}

}
,
search: function (reg) {
if (reg === "ru")
{
return "http://yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://yandex.com.tr";
}
 else
{
undefined;
return "http://yandex.ru";
}

}

}

}

}

}

}
,
news: function (reg) {
if (reg === "ru")
{
return "http://news.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://news.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://news.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://news.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://haber.yandex.com.tr";
}
 else
{
undefined;
return "http://news.yandex.ru";
}

}

}

}

}

}
,
"news-com": function (reg) {
if (reg === "ru")
{
return "http://news.yandex.com";
}
 else
{
undefined;
return "http://news.yandex.com";
}

}
,
maps: function (reg) {
if (reg === "ru")
{
return "http://maps.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://maps.yandex.ua";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://harita.yandex.com.tr";
}
 else
{
undefined;
return "http://maps.yandex.ru";
}

}

}

}
,
"maps-com": function (reg) {
if (reg === "ru")
{
return "http://maps.yandex.com";
}
 else
{
undefined;
return "http://maps.yandex.com";
}

}
,
probki: function (reg) {
if (reg === "ru")
{
return "http://probki.yandex.ru";
}
 else
{
undefined;
return "http://probki.yandex.ru";
}

}
,
slovari: function (reg) {
if (reg === "ru")
{
return "http://slovari.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://slovari.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://slovari.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://slovari.yandex.kz";
}
 else
{
undefined;
return "http://slovari.yandex.ru";
}

}

}

}

}
,
images: function (reg) {
if (reg === "ru")
{
return "http://images.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://images.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://images.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://images.yandex.kz";
}
 else
{
undefined;
if (reg === "com")
{
return "http://images.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://gorsel.yandex.com.tr";
}
 else
{
undefined;
return "http://images.yandex.ru";
}

}

}

}

}

}

}
,
"images-com": function (reg) {
if (reg === "ru")
{
return "http://images.yandex.com";
}
 else
{
undefined;
return "http://images.yandex.com";
}

}
,
blogs: function (reg) {
if (reg === "ru")
{
return "http://blogs.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://blogs.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://blogs.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://blogs.yandex.kz";
}
 else
{
undefined;
return "http://blogs.yandex.ru";
}

}

}

}

}
,
auto: function (reg) {
if (reg === "ru")
{
return "http://auto.yandex.ru";
}
 else
{
undefined;
return "http://auto.yandex.ru";
}

}
,
adresa: function (reg) {
if (reg === "ru")
{
return "http://adresa.yandex.ru";
}
 else
{
undefined;
return "http://adresa.yandex.ru";
}

}
,
games: function (reg) {
if (reg === "ru")
{
return "http://games.yandex.ru";
}
 else
{
undefined;
return "http://games.yandex.ru";
}

}
,
yaca: function (reg) {
if (reg === "ru")
{
return "http://yaca.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://yaca.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://yaca.yandex.by";
}
 else
{
undefined;
return "http://yaca.yandex.ru";
}

}

}

}
,
rasp: function (reg) {
if (reg === "ru")
{
return "http://rasp.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://rasp.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://rasp.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://rasp.yandex.kz";
}
 else
{
undefined;
return "http://rasp.yandex.ru";
}

}

}

}

}
,
pvo: function (reg) {
if (reg === "ru")
{
return "http://ask.yandex.ru";
}
 else
{
undefined;
return "http://ask.yandex.ru";
}

}
,
online: function (reg) {
if (reg === "ru")
{
return "http://online.yandex.ru";
}
 else
{
undefined;
return "http://online.yandex.ru";
}

}
,
books: function (reg) {
if (reg === "ru")
{
return "http://books.yandex.ru";
}
 else
{
undefined;
return "http://books.yandex.ru";
}

}
,
site: function (reg) {
if (reg === "ru")
{
return "http://site.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://site.yandex.ua";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://ozel.yandex.com.tr";
}
 else
{
undefined;
return "http://site.yandex.ru";
}

}

}

}
,
bar: function (reg) {
if (reg === "ru")
{
return "http://bar.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://bar.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://bar.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://bar.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://bar.yandex.com.tr";
}
 else
{
undefined;
return "http://bar.yandex.ru";
}

}

}

}

}

}
,
widgets: function (reg) {
if (reg === "ru")
{
return "http://widgets.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://widgets.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://widgets.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://widgets.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://widgets.yandex.com.tr";
}
 else
{
undefined;
return "http://widgets.yandex.ru";
}

}

}

}

}

}
,
wdgt: function (reg) {
if (reg === "ru")
{
return "http://wdgt.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://wdgt.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://wdgt.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://wdgt.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://wdgt.yandex.com.tr";
}
 else
{
undefined;
return "http://wdgt.yandex.ru";
}

}

}

}

}

}
,
interests: function (reg) {
if (reg === "ru")
{
return "http://interests.yandex.ru";
}
 else
{
undefined;
return "http://interests.yandex.ru";
}

}
,
kraski: function (reg) {
if (reg === "ru")
{
return "http://kraski.yandex.ru";
}
 else
{
undefined;
return "http://kraski.yandex.ru";
}

}
,
local: function (reg) {
if (reg === "ru")
{
return "http://local.yandex.ru";
}
 else
{
undefined;
return "http://local.yandex.ru";
}

}
,
museums: function (reg) {
if (reg === "ru")
{
return "http://18.yandex.ru";
}
 else
{
undefined;
return "http://18.yandex.ru";
}

}
,
collection: function (reg) {
if (reg === "ru")
{
return "http://collection.yandex.ru";
}
 else
{
undefined;
return "http://collection.yandex.ru";
}

}
,
company: function (reg) {
if (reg === "ru")
{
return "http://company.yandex.ru";
}
 else
{
undefined;
if (reg === "com")
{
return "http://company.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://company.yandex.com.tr";
}
 else
{
undefined;
return "http://company.yandex.ru";
}

}

}

}
,
tests: function (reg) {
if (reg === "ru")
{
return "http://tests.yandex.ru";
}
 else
{
undefined;
return "http://tests.yandex.ru";
}

}
,
referats: function (reg) {
if (reg === "ru")
{
return "http://referats.yandex.ru";
}
 else
{
undefined;
return "http://referats.yandex.ru";
}

}
,
terms: function (reg) {
if (reg === "ru")
{
return "http://terms.yandex.ru";
}
 else
{
undefined;
return "http://terms.yandex.ru";
}

}
,
tune: function (reg) {
if (reg === "ru")
{
return "http://tune.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://tune.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://tune.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://tune.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://tune.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://tune.yandex.com.tr";
}
 else
{
undefined;
return "http://tune.yandex.ru";
}

}

}

}

}

}

}
,
api: function (reg) {
if (reg === "ru")
{
return "http://api.yandex.ru";
}
 else
{
undefined;
if (reg === "com")
{
return "http://api.yandex.com";
}
 else
{
undefined;
return "http://api.yandex.ru";
}

}

}
,
punto: function (reg) {
if (reg === "ru")
{
return "http://punto.yandex.ru";
}
 else
{
undefined;
return "http://punto.yandex.ru";
}

}
,
opinion: function (reg) {
if (reg === "ru")
{
return "http://opinion.yandex.ru";
}
 else
{
undefined;
return "http://opinion.yandex.ru";
}

}
,
perevod: function (reg) {
if (reg === "ru")
{
return "http://perevod.yandex.ru";
}
 else
{
undefined;
return "http://perevod.yandex.ru";
}

}
,
rabota: function (reg) {
if (reg === "ru")
{
return "http://rabota.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://rabota.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://rabota.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://rabota.yandex.kz";
}
 else
{
undefined;
return "http://rabota.yandex.ru";
}

}

}

}

}
,
sprav: function (reg) {
if (reg === "ru")
{
return "http://sprav.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://sprav.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://sprav.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://sprav.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://rehber.yandex.com.tr";
}
 else
{
undefined;
return "http://sprav.yandex.ru";
}

}

}

}

}

}
,
realty: function (reg) {
if (reg === "ru")
{
return "http://realty.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://realty.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://realty.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://realty.yandex.kz";
}
 else
{
undefined;
return "http://realty.yandex.ru";
}

}

}

}

}
,
advertising: function (reg) {
if (reg === "ru")
{
return "http://advertising.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://advertising.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://advertising.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://advertising.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://advertising.yandex.kz";
}
 else
{
undefined;
return "http://advertising.yandex.ru";
}

}

}

}

}

}
,
expert: function (reg) {
if (reg === "ru")
{
return "http://expert.yandex.ru";
}
 else
{
undefined;
return "http://expert.yandex.ru";
}

}
,
"direct.market": function (reg) {
if (reg === "ru")
{
return "http://partner.market.yandex.ru/yandex.market/";
}
 else
{
undefined;
return "http://partner.market.yandex.ru/yandex.market/";
}

}
,
ba: function (reg) {
if (reg === "ru")
{
return "http://ba.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://ba.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://ba.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://ba.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://ba.yandex.kz";
}
 else
{
undefined;
return "http://ba.yandex.ru";
}

}

}

}

}

}
,
bayan: function (reg) {
if (reg === "ru")
{
return "http://bayan.yandex.ru";
}
 else
{
undefined;
return "http://bayan.yandex.ru";
}

}
,
partners: function (reg) {
if (reg === "ru")
{
return "http://partner.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://partner.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://partner.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://partner.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://partner.yandex.kz";
}
 else
{
undefined;
return "http://partner.yandex.ru";
}

}

}

}

}

}
,
metrika: function (reg) {
if (reg === "ru")
{
return "http://metrika.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://metrika.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://metrica.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://metrika.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://metrika.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://metrica.yandex.com.tr";
}
 else
{
undefined;
return "http://metrika.yandex.ru";
}

}

}

}

}

}

}
,
balance: function (reg) {
if (reg === "ru")
{
return "http://balance.yandex.ru";
}
 else
{
undefined;
return "http://balance.yandex.ru";
}

}
,
wordstat: function (reg) {
if (reg === "ru")
{
return "http://wordstat.yandex.ru";
}
 else
{
undefined;
return "http://wordstat.yandex.ru";
}

}
,
webmaster: function (reg) {
if (reg === "ru")
{
return "http://webmaster.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://webmaster.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://webmaster.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://webmaster.yandex.com.tr";
}
 else
{
undefined;
return "http://webmaster.yandex.ru";
}

}

}

}

}
,
server: function (reg) {
if (reg === "ru")
{
return "http://company.yandex.ru/technology/server/";
}
 else
{
undefined;
return "http://company.yandex.ru/technology/server/";
}

}
,
stat: function (reg) {
if (reg === "ru")
{
return "http://stat.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://stat.yandex.ua";
}
 else
{
undefined;
if (reg === "by")
{
return "http://stat.yandex.by";
}
 else
{
undefined;
return "http://stat.yandex.ru";
}

}

}

}
,
mobile: function (reg) {
if (reg === "ru")
{
return "http://mobile.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://mobile.yandex.ua";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://mobil.yandex.com.tr";
}
 else
{
undefined;
return "http://mobile.yandex.ru";
}

}

}

}
,
help: function (reg) {
if (reg === "ru")
{
return "http://help.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://help.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://help.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://yardim.yandex.com.tr";
}
 else
{
undefined;
return "http://help.yandex.ru";
}

}

}

}

}
,
feedback: function (reg) {
if (reg === "ru")
{
return "http://feedback.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://feedback.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://feedback.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://feedback.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://feedback.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://contact.yandex.com.tr";
}
 else
{
undefined;
return "http://feedback.yandex.ru";
}

}

}

}

}

}

}
,
start: function (reg) {
if (reg === "ru")
{
return "http://help.yandex.ru/start/";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://help.yandex.ua/start/";
}
 else
{
undefined;
if (reg === "com")
{
return "http://help.yandex.com/start/";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://yardim.yandex.com.tr/start";
}
 else
{
undefined;
return "http://help.yandex.ru/start/";
}

}

}

}

}
,
cityday: function (reg) {
if (reg === "ru")
{
return "http://cityday.yandex.ru";
}
 else
{
undefined;
return "http://cityday.yandex.ru";
}

}
,
openid: function (reg) {
if (reg === "ru")
{
return "http://openid.yandex.ru";
}
 else
{
undefined;
return "http://openid.yandex.ru";
}

}
,
oauth: function (reg) {
if (reg === "ru")
{
return "http://oauth.yandex.ru";
}
 else
{
undefined;
if (reg === "com")
{
return "http://oauth.yandex.com";
}
 else
{
undefined;
return "http://oauth.yandex.ru";
}

}

}
,
nano: function (reg) {
if (reg === "ru")
{
return "http://nano.yandex.ru";
}
 else
{
undefined;
return "http://nano.yandex.ru";
}

}
,
partnersearch: function (reg) {
if (reg === "ru")
{
return "http://yandex.ru";
}
 else
{
undefined;
return "http://yandex.ru";
}

}
,
city: function (reg) {
if (reg === "ru")
{
return "http://city.yandex.ru";
}
 else
{
undefined;
return "http://city.yandex.ru";
}

}
,
goroda: function (reg) {
if (reg === "ru")
{
return "http://goroda.yandex.ru";
}
 else
{
undefined;
return "http://goroda.yandex.ru";
}

}
,
toster: function (reg) {
if (reg === "ru")
{
return "http://toster.yandex.ru";
}
 else
{
undefined;
return "http://toster.yandex.ru";
}

}
,
love: function (reg) {
if (reg === "ru")
{
return "http://love.yandex.ru";
}
 else
{
undefined;
return "http://love.yandex.ru";
}

}
,
rk: function (reg) {
if (reg === "ru")
{
return "http://rk.yandex.ru";
}
 else
{
undefined;
return "http://rk.yandex.ru";
}

}
,
lost: function (reg) {
if (reg === "ru")
{
return "http://lost.yandex.ru";
}
 else
{
undefined;
return "http://lost.yandex.ru";
}

}
,
soft: function (reg) {
if (reg === "ru")
{
return "http://soft.yandex.ru";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://soft.yandex.com.tr";
}
 else
{
undefined;
return "http://soft.yandex.ru";
}

}

}
,
passport: function (reg) {
if (reg === "ru")
{
return "https://passport.yandex.ru";
}
 else
{
undefined;
if (reg === "com")
{
return "http://passport.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://passport.yandex.com.tr";
}
 else
{
undefined;
return "https://passport.yandex.ru";
}

}

}

}
,
"404": function (reg) {
if (reg === "ru")
{
return "http://404.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://404.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://404.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://404.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://404.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://404.yandex.com.tr";
}
 else
{
undefined;
return "http://404.yandex.ru";
}

}

}

}

}

}

}
,
i: function (reg) {
if (reg === "ru")
{
return "http://i.yandex.ru";
}
 else
{
undefined;
return "http://i.yandex.ru";
}

}
,
desktop: function (reg) {
if (reg === "ru")
{
return "http://desktop.yandex.ru";
}
 else
{
undefined;
return "http://desktop.yandex.ru";
}

}
,
ff: function (reg) {
if (reg === "ru")
{
return "http://ff.yandex.ru";
}
 else
{
undefined;
return "http://ff.yandex.ru";
}

}
,
fx: function (reg) {
if (reg === "ru")
{
return "http://fx.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://fx.yandex.ua";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://fx.yandex.com.tr";
}
 else
{
undefined;
return "http://fx.yandex.ru";
}

}

}

}
,
ie: function (reg) {
if (reg === "ru")
{
return "http://ie.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://ie.yandex.ua";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://ie.yandex.com.tr";
}
 else
{
undefined;
return "http://ie.yandex.ru";
}

}

}

}
,
"bar-ie": function (reg) {
if (reg === "ru")
{
return "http://bar.yandex.ru/ie";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://bar.yandex.ua/ie";
}
 else
{
undefined;
if (reg === "com")
{
return "http://bar.yandex.com/ie";
}
 else
{
undefined;
if (reg === "by")
{
return "http://bar.yandex.by/ie";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://bar.yandex.kz/ie";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://bar.yandex.com.tr/ie";
}
 else
{
undefined;
return "http://bar.yandex.ru/ie";
}

}

}

}

}

}

}
,
"bar-ie9": function (reg) {
if (reg === "ru")
{
return "http://bar.yandex.ru/ie";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://bar.yandex.ua/ie";
}
 else
{
undefined;
if (reg === "com")
{
return "http://bar.yandex.com/ie";
}
 else
{
undefined;
if (reg === "by")
{
return "http://bar.yandex.by/ie";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://bar.yandex.kz/ie";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://bar.yandex.com.tr/ie";
}
 else
{
undefined;
return "http://bar.yandex.ru/ie";
}

}

}

}

}

}

}
,
internet: function (reg) {
if (reg === "ru")
{
return "http://internet.yandex.ru";
}
 else
{
undefined;
if (reg === "com")
{
return "http://internet.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://internet.yandex.com.tr";
}
 else
{
undefined;
return "http://internet.yandex.ru";
}

}

}

}
,
keyboard: function (reg) {
if (reg === "ru")
{
return "http://www.yandex.ru/index_engl_qwerty.html";
}
 else
{
undefined;
return "http://www.yandex.ru/index_engl_qwerty.html";
}

}
,
metro: function (reg) {
if (reg === "ru")
{
return "http://metro.yandex.ru";
}
 else
{
undefined;
return "http://metro.yandex.ru";
}

}
,
pulse: function (reg) {
if (reg === "ru")
{
return "http://blogs.yandex.ru/pulse";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://blogs.yandex.ua/pulse";
}
 else
{
undefined;
if (reg === "by")
{
return "http://blogs.yandex.by/pulse";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://blogs.yandex.kz/pulse";
}
 else
{
undefined;
return "http://blogs.yandex.ru/pulse";
}

}

}

}

}
,
school: function (reg) {
if (reg === "ru")
{
return "http://school.yandex.ru";
}
 else
{
undefined;
return "http://school.yandex.ru";
}

}
,
so: function (reg) {
if (reg === "ru")
{
return "http://so.yandex.ru";
}
 else
{
undefined;
return "http://so.yandex.ru";
}

}
,
time: function (reg) {
if (reg === "ru")
{
return "http://time.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://time.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://time.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://time.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://time.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://time.yandex.com.tr";
}
 else
{
undefined;
return "http://time.yandex.ru";
}

}

}

}

}

}

}
,
xmlsearch: function (reg) {
if (reg === "ru")
{
return "http://xml.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://xml.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://xml.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://xml.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://xml.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://xml.yandex.com.tr";
}
 else
{
undefined;
return "http://xml.yandex.ru";
}

}

}

}

}

}

}
,
catalogwdgt: function (reg) {
if (reg === "ru")
{
return "http://www.yandex.ru/catalog";
}
 else
{
undefined;
return "http://www.yandex.ru/catalog";
}

}
,
opera: function (reg) {
if (reg === "ru")
{
return "http://opera.yandex.ru";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://opera.yandex.com.tr";
}
 else
{
undefined;
return "http://opera.yandex.ru";
}

}

}
,
uslugi: function (reg) {
if (reg === "ru")
{
return "http://uslugi.yandex.ru";
}
 else
{
undefined;
return "http://uslugi.yandex.ru";
}

}
,
backapv: function (reg) {
if (reg === "ru")
{
return "http://backapv.yandex.ru";
}
 else
{
undefined;
return "http://backapv.yandex.ru";
}

}
,
chrome: function (reg) {
if (reg === "ru")
{
return "http://chrome.yandex.ru";
}
 else
{
undefined;
return "http://chrome.yandex.ru";
}

}
,
browser: function (reg) {
if (reg === "ru")
{
return "http://browser.yandex.ru";
}
 else
{
undefined;
return "http://browser.yandex.ru";
}

}
,
aziada: function (reg) {
if (reg === "ru")
{
return "http://aziada2011.yandex.kz";
}
 else
{
undefined;
return "http://aziada2011.yandex.kz";
}

}
,
translate: function (reg) {
if (reg === "ru")
{
return "http://translate.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://translate.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://translate.yandex.com";
}
 else
{
undefined;
if (reg === "by")
{
return "http://translate.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://translate.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://ceviri.yandex.com.tr";
}
 else
{
undefined;
return "http://translate.yandex.ru";
}

}

}

}

}

}

}
,
subs: function (reg) {
if (reg === "ru")
{
return "http://subs.yandex.ru";
}
 else
{
undefined;
return "http://subs.yandex.ru";
}

}
,
all: function (reg) {
if (reg === "ru")
{
return "http://www.yandex.ru/all";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://www.yandex.ua/all";
}
 else
{
undefined;
if (reg === "com")
{
return "http://www.yandex.com/all";
}
 else
{
undefined;
if (reg === "by")
{
return "http://www.yandex.by/all";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://www.yandex.kz/all";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://www.yandex.com.tr/all";
}
 else
{
undefined;
return "http://www.yandex.ru/all";
}

}

}

}

}

}

}
,
large: function (reg) {
if (reg === "ru")
{
return "http://large.yandex.ru";
}
 else
{
undefined;
return "http://large.yandex.ru";
}

}
,
geocontext: function (reg) {
if (reg === "ru")
{
return "http://geocontext.yandex.ru";
}
 else
{
undefined;
return "http://geocontext.yandex.ru";
}

}
,
root: function (reg) {
if (reg === "ru")
{
return "http://root.yandex.ru";
}
 else
{
undefined;
return "http://root.yandex.ru";
}

}
,
yamb: function (reg) {
if (reg === "ru")
{
return "https://yamb.yandex.ru";
}
 else
{
undefined;
return "https://yamb.yandex.ru";
}

}
,
legal: function (reg) {
if (reg === "ru")
{
return "http://legal.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://legal.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "http://legal.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://legal.yandex.com.tr";
}
 else
{
undefined;
return "http://legal.yandex.ru";
}

}

}

}

}
,
taxi: function (reg) {
if (reg === "ru")
{
return "https://taxi.yandex.ru";
}
 else
{
undefined;
return "https://taxi.yandex.ru";
}

}
,
social: function (reg) {
if (reg === "ru")
{
return "https://social.yandex.ru";
}
 else
{
undefined;
if (reg === "ua")
{
return "https://social.yandex.ua";
}
 else
{
undefined;
if (reg === "com")
{
return "https://social.yandex.ru";
}
 else
{
undefined;
if (reg === "by")
{
return "https://social.yandex.by";
}
 else
{
undefined;
if (reg === "kz")
{
return "https://social.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "https://social.yandex.com.tr";
}
 else
{
undefined;
return "https://social.yandex.ru";
}

}

}

}

}

}

}
,
contest: function (reg) {
if (reg === "ru")
{
return "http://contest.yandex.ru";
}
 else
{
undefined;
if (reg === "com")
{
return "http://contest.yandex.com";
}
 else
{
undefined;
return "http://contest.yandex.ru";
}

}

}
,
peoplesearch: function (reg) {
if (reg === "ru")
{
return "http://people.yandex.ru";
}
 else
{
undefined;
return "http://people.yandex.ru";
}

}
,
disk: function (reg) {
if (reg === "ru")
{
return "http://disk.yandex.ru";
}
 else
{
undefined;
if (reg === "com")
{
return "http://disk.yandex.com";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://disk.yandex.com.tr";
}
 else
{
undefined;
return "http://disk.yandex.ru";
}

}

}

}
,
sport: function (reg) {
if (reg === "ru")
{
return "http://sport.yandex.ru";
}
 else
{
undefined;
if (reg === "by")
{
return "http://sport.yandex.by";
}
 else
{
undefined;
if (reg === "ua")
{
return "http://sport.yandex.ua";
}
 else
{
undefined;
if (reg === "kz")
{
return "http://sport.yandex.kz";
}
 else
{
undefined;
if (reg === "tr")
{
return "http://spor.yandex.com.tr";
}
 else
{
undefined;
return "http://sport.yandex.ru";
}

}

}

}

}

}
,
literacy: function (reg) {
if (reg === "ru")
{
return "http://literacy.yandex.ru";
}
 else
{
undefined;
return "http://literacy.yandex.ru";
}

}
,
appsearch: function (reg) {
if (reg === "ru")
{
return "//appsearch.yandex.ru";
}
 else
{
undefined;
return "//appsearch.yandex.ru";
}

}
,
ege: function (reg) {
if (reg === "ru")
{
return "//ege.yandex.ru";
}
 else
{
undefined;
return "//ege.yandex.ru";
}

}
});
}

function $488(__$callback) {
return __$callback.call(this,null,{
elem: "td",
tag: "td",
content: this.ctx.content});
}

function $490(__$callback) {
return __$callback.call(this,null,{
elem: "td",
tag: "td",
content: this.ctx.content});
}

function $493(__$callback) {
return __$callback.call(this,null,this.ctx.content);
}

function $498(__$callback) {
return __$callback.call(this,null,"tr");
}

function $500(__$callback) {
return __$callback.call(this,null,"tr");
}

function $503(__$callback) {
return __$callback.call(this,null,"table");
}

function $508(__$callback) {
return __$callback.call(this,null,{
cellpadding: 0,
cellspacing: 0});
}

function $516(__$callback) {
return __$callback.call(this,null,"ul");
}

function $518(__$callback) {
return __$callback.call(this,null,"span");
}

function $520(__$callback) {
return __$callback.call(this,null,"li");
}

function $522(__$callback) {
return __$callback.call(this,null,"ul");
}

function $524(__$callback) {
return __$callback.call(this,null,"h3");
}

function $529(__$callback) {
var __$i35;
var __$i23;
var __$i19;
var __$i7;
var _$45mix;
_$45mix = [];
__$i7 = this.isFirst();
if (__$i7)
{
__$i19 = _$45mix.push({
elemMods: {
position: "first"}});
}
 else
{
__$i19 = __$i7;
}

__$i23 = this.isLast();
if (__$i23)
{
__$i35 = _$45mix.push({
elemMods: {
position: "last"}});
}
 else
{
__$i35 = __$i23;
}

return __$callback.call(this,null,_$45mix);
}

function $535(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

this._mode = __r115;
__r116._wrap = __r117;
this.position = __r118;
this.ctx = __r119;
"";
return __$callback.call(this,null);
}

var __r119;
var __r118;
var __r116, __r117;
var __r115;
"";
__r115 = this._mode;
this._mode = "";
__r116 = this.ctx;
__r117 = __r116._wrap;
__r116._wrap = true;
__r118 = this.position;
this.position = this.position - 1;
__r119 = this.ctx;
this.ctx = {
elem: "layout-unit",
content: [this.ctx, this.ctx["item-content"]]};
return this.apply(__$fn2);
}

function $542(__$callback) {
return __$callback.call(this,null,[this.ctx.title, {
elem: "layout",
content: this.ctx.content}]);
}

function $550(__$callback) {
return __$callback.call(this,null,"i");
}

function $552(__$callback) {
return __$callback.call(this,null,"i");
}

function $554(__$callback) {
return __$callback.call(this,null,"td");
}

function $556(__$callback) {
return __$callback.call(this,null,"table");
}

function $558(__$callback) {
return __$callback.call(this,null,"i");
}

function $563(__$callback) {
return __$callback.call(this,null,{
tag: "tr",
content: {
elem: "wrap-cell",
content: this.ctx.content}});
}

function $567(__$callback) {
this.ctx.content.push({
elem: "close"});
return __$callback.call(this,null,this.ctx.content);
}

function $574(__$callback) {
return __$callback.call(this,null,{
cellpadding: 0,
cellspacing: 0});
}

function $580(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

this._mode = __r92;
__r93._wrap = __r94;
this.ctx = __r95;
"";
return __$callback.call(this,null);
}

var __r95;
var __r93, __r94;
var __r92;
"";
__r92 = this._mode;
this._mode = "";
__r93 = this.ctx;
__r94 = __r93._wrap;
__r93._wrap = true;
__r95 = this.ctx;
this.ctx = [{
elem: "shadow"}, {
elem: "wrap",
content: this.ctx}];
return this.apply(__$fn2);
}

function $588(__$callback) {
var __$i121;
var __$i71;
var __$i55;
var __$i56;
var __$i57;
var __$i58;
var __$i61;
var __$i45;
var __$i35;
var __$i31;
var __$i21;
var __$i16;
var __$i9;
var __$r26;
function __$fn26(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r26 = __$r;
}

_$1vmix = __$r26;
__r90._mix = __r91;
"";
if (_$1vmix)
{
__$i121 = _$1vmix.concat(_$1vm);
}
 else
{
__$i121 = _$1vm;
}

return __$callback.call(this,null,__$i121);
}

var __r90, __r91;
var _$1vm, _$1vmods, _$1vmix;
_$1vm = {
};
__$i9 = this.ctx.mods;
if (__$i9)
{
__$i16 = __$i9;
}
 else
{
__$i16 = {
};
}

_$1vmods = __$i16;
__$i21 = _$1vmods.theme;
if (__$i21)
{
__$i31 = __$i21;
}
 else
{
__$i31 = _$1vm.theme = "ffffff";
}

__$i35 = _$1vmods.direction;
if (__$i35)
{
__$i45 = __$i35;
}
 else
{
__$i45 = _$1vm.direction = "down";
}

_$1vm = [{
mods: _$1vm}];
if (this._inBDropdowna)
{
__$i55 = _$1vm;
__$i56 = "push";
__$i57 = "b-dropdowna";
__$i58 = "popup";
__$i61 = this._dropdownaColor;
if (__$i61)
{
__$i71 = {
color: this._dropdownaColor};
}
 else
{
__$i71 = __$i61;
}

__$i55[__$i56]({
block: __$i57,
elem: __$i58,
elemMods: __$i71});
this._dropdownaColor = false;
this._inBDropdowna = false;
}
 else
{
undefined;
}

"";
__r90 = this.ctx;
__r91 = __r90._mix;
__r90._mix = true;
return this.apply(__$fn26);
}

function $595(__$callback) {
return __$callback.call(this,null,true);
}

function $603(__$callback) {
return __$callback.call(this,null,"span");
}

function $605(__$callback) {
return __$callback.call(this,null,"span");
}

function $611(__$callback) {
var __$i52;
var __$i39;
var __$i40;
var __$i45;
var __$r6;
function __$fn6(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r6 = __$r;
}

this._mode = __r103;
__r104._init = __r105;
this._inBDropdowna = __r106;
this._dropdownaColor = __r107;
"";
return __$callback.call(this,null);
}

var __r107;
var __r106;
var __r104, __r105;
var __r103;
"";
__r103 = this._mode;
this._mode = "";
__r104 = this.ctx;
__r105 = __r104._init;
__r104._init = true;
__r106 = this._inBDropdowna;
this._inBDropdowna = true;
__r107 = this._dropdownaColor;
__$i39 = this;
__$i40 = "_dropdownaColor";
__$i45 = this.mods.color;
if (__$i45)
{
__$i52 = __$i45;
}
 else
{
__$i52 = false;
}

__$i39[__$i40] = __$i52;
return this.apply(__$fn6);
}

function $618(__$callback) {
return __$callback.call(this,null,[{
mods: {
"is-bem": "yes"}}]);
}

function $623(__$callback) {
return __$callback.call(this,null,true);
}

function $634(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

this._mode = __r113;
this.ctx = __r114;
"";
undefined;
return __$callback.call(this,null);
}

var __r114;
var __r113;
var __this;
__this = this;
"";
__r113 = this._mode;
this._mode = "";
__r114 = this.ctx;
this.ctx = {
elem: "inner",
content: this.ctx.content,
_wrap: true};
return apply.call(__this,__$fn2);
}

function $647(__$callback) {
return __$callback.call(this,null,{
});
}

function $652(__$callback) {
if (! ! this.elem === false)
{
return $654.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

function $654(__$callback) {
var __$i121;
var __$i109;
var __$i93;
var __$i31;
var __$i22;
var __$r24;
function __$fn24(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r24 = __$r;
}

_$2ka = {
href: __$i93};
while (true) {
if (! (_$2kp = _$2kprops.pop()))
{
break;
}
 else
{
__$i109 = _$2kctx[_$2kp];
if (__$i109)
{
__$i121 = _$2ka[_$2kp] = _$2kctx[_$2kp];
}
 else
{
__$i121 = __$i109;
}

}

}

return __$callback.call(this,null,_$2ka);
}

var __$r23;
function __$fn23(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r23 = __$r;
}

__r99 = __$r23;
this._buf = __r96;
this._mode = __r97;
this.ctx = __r98;
"";
__r99;
__$i93 = _$2kp.join("");
return __$fn24.call(this);
}

var _$2kctx, _$2kprops, _$2kp, _$2ka;
var __r96, __r97, __r98, __r99;
var __this;
__this = this;
_$2kctx = this.ctx;
_$2kprops = ["title", "target"];
_$2kp = typeof _$2kctx.url;
__$i22 = _$2kp === "undefined";
if (__$i22)
{
__$i31 = __$i22;
}
 else
{
__$i31 = _$2kp === "string";
}

if (__$i31)
{
__$i93 = _$2kctx.url;
return __$fn24.call(this);
}
 else
{
_$2kp = [];
"";
__r96 = this._buf;
this._buf = _$2kp;
__r97 = this._mode;
this._mode = "";
__r98 = this.ctx;
this.ctx = _$2kctx.url;
return apply.call(__this,__$fn23);
}

}

function $660(__$callback) {
return __$callback.call(this,null,true);
}

function $668(__$callback) {
var __$i14;
if (this.ctx.url)
{
__$i14 = "a";
}
 else
{
__$i14 = "span";
}

return __$callback.call(this,null,__$i14);
}

function $671(__$callback) {
if (this.elem === "inner")
{
return $673.call(this,__$callback);
}
 else
{
if (! ! this.elem === false)
{
return $676.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

}

function $673(__$callback) {
return __$callback.call(this,null,"span");
}

function $676(__$callback) {
return __$callback.call(this,null,"a");
}

function $685(__$callback) {
return __$callback.call(this,null,"li");
}

function $690(__$callback) {
return __$callback.call(this,null,"ul");
}

function $694(__$callback) {
return __$callback.call(this,null,"h3");
}

function $697(__$callback) {
return __$callback.call(this,null,"span");
}

function $705(__$callback) {
return __$callback.call(this,null,[this.ctx.title, {
elem: "layout",
content: this.ctx.content}]);
}

function $713(__$callback) {
var __$i35;
var __$i23;
var __$i19;
var __$i7;
var _$3nmix;
_$3nmix = [];
__$i7 = this.isFirst();
if (__$i7)
{
__$i19 = _$3nmix.push({
elemMods: {
position: "first"}});
}
 else
{
__$i19 = __$i7;
}

__$i23 = this.isLast();
if (__$i23)
{
__$i35 = _$3nmix.push({
elemMods: {
position: "last"}});
}
 else
{
__$i35 = __$i23;
}

return __$callback.call(this,null,_$3nmix);
}

function $722(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

this._mode = __r108;
__r109._wrap = __r110;
this.position = __r111;
this.ctx = __r112;
"";
return __$callback.call(this,null);
}

var __r112;
var __r111;
var __r109, __r110;
var __r108;
"";
__r108 = this._mode;
this._mode = "";
__r109 = this.ctx;
__r110 = __r109._wrap;
__r109._wrap = true;
__r111 = this.position;
this.position = this.position - 1;
__r112 = this.ctx;
this.ctx = {
elem: "layout-unit",
content: this.ctx};
return this.apply(__$fn2);
}

function $733(__$callback) {
return __$callback.call(this,null,true);
}

function $745(__$callback) {
var __$i56;
var __$i44;
var __$i30;
var __$i18;
var _$3fctx, _$3fa, _$3fprops, _$3fp;
_$3fctx = this.ctx;
_$3fa = {
src: "chrome://yandex-vb/content/fastdial/layout/_/La6qi18Z8LwgnZdsAr1qy1GwCwo.gif",
alt: ""};
_$3fprops = ["alt", "width", "height"];
__$i18 = _$3fctx.url;
if (__$i18)
{
__$i30 = _$3fa.src = _$3fctx.url;
}
 else
{
__$i30 = __$i18;
}

while (true) {
if (! (_$3fp = _$3fprops.shift()))
{
break;
}
 else
{
__$i44 = _$3fctx[_$3fp];
if (__$i44)
{
__$i56 = _$3fa[_$3fp] = _$3fctx[_$3fp];
}
 else
{
__$i56 = __$i44;
}

}

}

return __$callback.call(this,null,_$3fa);
}

function $750(__$callback) {
return __$callback.call(this,null,"img");
}

function $758(__$callback) {
return __$callback.call(this,null,{
block: "b-icon",
mix: [{
block: "b-spin",
elem: "icon"}]});
}

function $763(__$callback) {
var __$i44;
var __$i34;
var __$i22;
var __$i12;
var _$3am, _$3amods;
_$3am = {
};
_$3amods = this.ctx.mods;
__$i12 = ! _$3amods;
if (__$i12)
{
__$i22 = __$i12;
}
 else
{
__$i22 = ! _$3amods.size;
}

if (__$i22)
{
_$3am.size = "27";
}
 else
{
undefined;
}

__$i34 = ! _$3amods;
if (__$i34)
{
__$i44 = __$i34;
}
 else
{
__$i44 = ! _$3amods.theme;
}

if (__$i44)
{
_$3am.theme = "grey-27";
}
 else
{
undefined;
}

return __$callback.call(this,null,[{
mods: _$3am}]);
}

function $768(__$callback) {
return __$callback.call(this,null,true);
}

function $776(__$callback) {
var __$i79;
var __$i69;
var __$i63;
var __$i53;
var __$i45;
var __$i33;
var _$38props, _$38p;
var _$38a, _$38ctx;
_$38a = {
type: this.ctx.type,
value: ""};
_$38ctx = this.ctx;
_$38props = ["tabindex", "name", "value"];
while (true) {
if (! (_$38p = _$38props.shift()))
{
break;
}
 else
{
__$i33 = _$38ctx[_$38p];
if (__$i33)
{
__$i45 = _$38a[_$38p] = _$38ctx[_$38p];
}
 else
{
__$i45 = __$i33;
}

}

}

__$i53 = _$38ctx.disabled;
if (__$i53)
{
__$i63 = _$38a.disabled = "disabled";
}
 else
{
__$i63 = __$i53;
}

__$i69 = _$38ctx.typeMod != "simple";
if (__$i69)
{
__$i79 = _$38a.hidefocus = "true";
}
 else
{
__$i79 = __$i69;
}

return __$callback.call(this,null,_$38a);
}

function $779(__$callback) {
var __$i80;
var __$i70;
var __$i64;
var __$i50;
var __$i44;
var __$i30;
var __$i24;
var __$i10;
var _$2ya;
_$2ya = {
role: "button"};
__$i10 = this.ctx.url;
if (__$i10)
{
__$i24 = _$2ya.href = this.ctx.url;
}
 else
{
__$i24 = __$i10;
}

__$i30 = this.ctx.target;
if (__$i30)
{
__$i44 = _$2ya.target = this.ctx.target;
}
 else
{
__$i44 = __$i30;
}

__$i50 = this.ctx.counter;
if (__$i50)
{
__$i64 = _$2ya.onmousedown = this.ctx.counter;
}
 else
{
__$i64 = __$i50;
}

__$i70 = this.mods.disabled;
if (__$i70)
{
__$i80 = _$2ya["aria-disabled"] = true;
}
 else
{
__$i80 = __$i70;
}

return __$callback.call(this,null,_$2ya);
}

function $784(__$callback) {
return __$callback.call(this,null,"input");
}

function $787(__$callback) {
return __$callback.call(this,null,"i");
}

function $789(__$callback) {
return __$callback.call(this,null,"");
}

function $791(__$callback) {
return __$callback.call(this,null,"span");
}

function $793(__$callback) {
return __$callback.call(this,null,"i");
}

function $798(__$callback) {
return __$callback.call(this,null,"a");
}

function $803(__$callback) {
if (! ! this.elem === false)
{
return $805.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

function $805(__$callback) {
return __$callback.call(this,null,"span");
}

function $810(__$callback) {
return __$callback.call(this,null,this.ctx.content);
}

function $813(__$callback) {
return __$callback.call(this,null,[{
elem: "left"}, {
elem: "content",
tag: "span",
content: {
elem: "text",
content: this.ctx.content}}, {
elem: "click"}, this._input]);
}

function $818(__$callback) {
var __$i44;
var __$i34;
var __$i22;
var __$i12;
var _$2zm, _$2zmods;
_$2zm = {
};
_$2zmods = this.ctx.mods;
__$i12 = ! _$2zmods;
if (__$i12)
{
__$i22 = __$i12;
}
 else
{
__$i22 = ! _$2zmods.size;
}

if (__$i22)
{
_$2zm.size = "s";
}
 else
{
undefined;
}

__$i34 = ! _$2zmods;
if (__$i34)
{
__$i44 = __$i34;
}
 else
{
__$i44 = ! _$2zmods.theme;
}

if (__$i44)
{
_$2zm.theme = "grey-s";
}
 else
{
undefined;
}

return __$callback.call(this,null,[{
mods: _$2zm}]);
}

function $823(__$callback) {
return __$callback.call(this,null,true);
}

function $829(__$callback) {
var __$i66;
var __$i21;
var __$i22;
var __$r6;
function __$fn6(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r6 = __$r;
}

__r100._inputClick = __r101;
this._input = __r102;
"";
return __$callback.call(this,null);
}

var __r102;
var __r100, __r101;
"";
__r100 = this.ctx;
__r101 = __r100._inputClick;
__r100._inputClick = true;
__r102 = this._input;
__$i21 = this;
__$i22 = "_input";
if (this.ctx.type)
{
__$i66 = {
elem: "input",
type: this.ctx.type,
tabindex: this.ctx.tabindex,
disabled: this.mods.disabled,
typeMod: this.mods.type,
name: this.ctx.name,
value: this.ctx.value};
}
 else
{
__$i66 = "";
}

__$i21[__$i22] = __$i66;
return this.apply(__$fn6);
}

function $839(__$callback) {
return __$callback.call(this,null,"span");
}

function $841(__$callback) {
return __$callback.call(this,null,"span");
}

function $845(__$callback) {
return __$callback.call(this,null,"span");
}

function $849(__$callback) {
return __$callback.call(this,null,"span");
}

function $852(__$callback) {
var __$i14;
if (this.ctx.url)
{
__$i14 = "a";
}
 else
{
__$i14 = "div";
}

return __$callback.call(this,null,__$i14);
}

function $859(__$callback) {
return __$callback.call(this,null,[{
elem: "text",
tag: "span",
content: this.ctx.content}, {
elem: "helper",
tag: "span"}]);
}

function $863(__$callback) {
return __$callback.call(this,null,[this.ctx.content, {
elem: "helper",
tag: "span"}]);
}

function $866(__$callback) {
return __$callback.call(this,null,[this.ctx.content, {
elem: "click",
tag: "i"}]);
}

function $871(__$callback) {
var __$i56;
var __$i44;
var _$2nctx, _$2na, _$2nprops, _$2np;
_$2nctx = this.ctx;
_$2na = {
style: "background-color: " + _$2nctx.bg};
_$2nprops = ["title", "target"];
if (_$2nctx.url)
{
_$2na.href = _$2nctx.url;
}
 else
{
undefined;
}

while (true) {
if (! (_$2np = _$2nprops.pop()))
{
break;
}
 else
{
__$i44 = _$2nctx[_$2np];
if (__$i44)
{
__$i56 = _$2na[_$2np] = _$2nctx[_$2np];
}
 else
{
__$i56 = __$i44;
}

}

}

return __$callback.call(this,null,_$2na);
}

function $876(__$callback) {
return __$callback.call(this,null,true);
}

function $884(__$callback) {
return __$callback.call(this,null,{
elem: "wrapper",
content: this.ctx.content});
}

function $889(__$callback) {
return __$callback.call(this,null,true);
}

function $894(__$callback) {
return __$callback.call(this,null,"div");
}

function $902(__$callback) {
return __$callback.call(this,null,"span");
}

function $904(__$callback) {
return __$callback.call(this,null,"span");
}

function $908(__$callback) {
return __$callback.call(this,null,"span");
}

function $912(__$callback) {
return __$callback.call(this,null,"span");
}

function $914(__$callback) {
return __$callback.call(this,null,"span");
}

function $916(__$callback) {
return __$callback.call(this,null,"span");
}

function $918(__$callback) {
return __$callback.call(this,null,"span");
}

function $921(__$callback) {
return __$callback.call(this,null,"a");
}

function $928(__$callback) {
return __$callback.call(this,null,[{
elem: "text",
tag: "span",
content: this.ctx.content}, {
elem: "helper",
tag: "span"}]);
}

function $932(__$callback) {
return __$callback.call(this,null,[this.ctx.content, {
elem: "helper",
tag: "span"}]);
}

function $935(__$callback) {
return __$callback.call(this,null,[this.ctx.content, {
elem: "click",
tag: "i"}]);
}

function $940(__$callback) {
var __$i67;
var __$i55;
var _$25ctx, _$25props, _$25p, _$25a;
_$25ctx = this.ctx;
_$25props = ["title", "target"];
_$25a = {
};
if (_$25ctx.url)
{
_$25a.href = _$25ctx.url;
}
 else
{
undefined;
}

if (_$25ctx.bg)
{
_$25a.style = "background-color: " + _$25ctx.bg;
}
 else
{
undefined;
}

while (true) {
if (! (_$25p = _$25props.pop()))
{
break;
}
 else
{
__$i55 = _$25ctx[_$25p];
if (__$i55)
{
__$i67 = _$25a[_$25p] = _$25ctx[_$25p];
}
 else
{
__$i67 = __$i55;
}

}

}

return __$callback.call(this,null,_$25a);
}

function $945(__$callback) {
return __$callback.call(this,null,true);
}

function $954(__$callback) {
return __$callback.call(this,null,"div");
}

function $965(__$callback) {
return __$callback.call(this,null,{
src: this.ctx.url});
}

function $970(__$callback) {
return __$callback.call(this,null,{
rel: "stylesheet",
href: this.ctx.url});
}

function $974(__$callback) {
return __$callback.call(this,null,{
rel: "shortcut icon",
href: this.ctx.url});
}

function $976(__$callback) {
return __$callback.call(this,null,this.ctx.attrs);
}

function $981(__$callback) {
return __$callback.call(this,null,"script");
}

function $984(__$callback) {
return __$callback.call(this,null,"link");
}

function $986(__$callback) {
return __$callback.call(this,null,"style");
}

function $988(__$callback) {
return __$callback.call(this,null,"");
}

function $990(__$callback) {
return __$callback.call(this,null,"link");
}

function $992(__$callback) {
return __$callback.call(this,null,"meta");
}

function $994(__$callback) {
return __$callback.call(this,null,"head");
}

function $996(__$callback) {
return __$callback.call(this,null,"html");
}

function $999(__$callback) {
return __$callback.call(this,null,"body");
}

function $1004(__$callback) {
return __$callback.call(this,null,false);
}

function $1006(__$callback) {
return __$callback.call(this,null,false);
}

function $1008(__$callback) {
return __$callback.call(this,null,false);
}

function $1010(__$callback) {
return __$callback.call(this,null,false);
}

function $1012(__$callback) {
return __$callback.call(this,null,false);
}

function $1014(__$callback) {
return __$callback.call(this,null,false);
}

function $1021(__$callback) {
var __$i88;
var __$i84;
var __$r17;
function __$fn17(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r17 = __$r;
}

this._mode = __r86;
__r87._ieCommented = __r88;
this.ctx = __r89;
"";
undefined;
return __$fn16.call(this);
}

var __$r16;
function __$fn16(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r16 = __$r;
}

return __$callback.call(this,null);
}

var __$r15;
function __$fn15(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r15 = __$r;
}

this._mode = __r84;
this.ctx = __r85;
"";
undefined;
return __$fn16.call(this);
}

var __r89;
var __r87, __r88;
var __r86;
var _$1nhideRule;
var __r85;
var __r84;
var _$1nie;
var __this;
__this = this;
_$1nie = this.ctx.ie;
if (_$1nie === true)
{
"";
__r84 = this._mode;
this._mode = "";
__r85 = this.ctx;
this.ctx = [6, 7, 8, 9].map(function (v) {
return {
elem: "css",
url: this.ctx.url + ".ie" + v + ".css",
ie: "IE " + v};
}
,this);
return apply.call(__this,__$fn15);
}
 else
{
if (! _$1nie)
{
__$i88 = ["gt IE 9", "<!-->", "<!--"];
}
 else
{
if (_$1nie === "!IE")
{
__$i84 = [_$1nie, "<!-->", "<!--"];
}
 else
{
__$i84 = [_$1nie, "", ""];
}

__$i88 = __$i84;
}

_$1nhideRule = __$i88;
"";
__r86 = this._mode;
this._mode = "";
__r87 = this.ctx;
__r88 = __r87._ieCommented;
__r87._ieCommented = true;
__r89 = this.ctx;
this.ctx = ["<!--[if " + _$1nhideRule[0] + "]>", _$1nhideRule[1], this.ctx, _$1nhideRule[2], "<![endif]-->"];
return apply.call(__this,__$fn17);
}

}

function $1026(__$callback) {
if (! ! this.ctx._wrapped === false)
{
if (! ! this.elem === false)
{
return $1029.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}
 else
{
return $1070.call(this,__$callback);
}

}

function $1029(__$callback) {
var __$i63;
var __$i32;
var __$i33;
var __$i34;
var __$i38;
var __$i43;
var __$i48;
var __$r6;
function __$fn6(__$e, __$r) {
var __$r7;
function __$fn7(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r7 = __$r;
}

this._mode = __r73;
__r74._wrapped = __r75;
this.ctx = __r76;
"";
undefined;
return __$callback.call(this,null);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r6 = __$r;
}

__r72 = __$r6;
this._mode = __r71;
"";
_$14dtype = __r72;
__$i32 = _$14dtype;
__$i33 = "root";
__$i34 = "head";
__$i38 = {
tag: "meta",
attrs: {
charset: "utf-8"}};
__$i43 = {
tag: "meta",
attrs: {
"http-equiv": "X-UA-Compatible",
content: "IE=EmulateIE7, IE=edge"}};
__$i48 = {
tag: "title",
content: _$14ctx.title};
if (_$14ctx.favicon)
{
__$i63 = {
elem: "favicon",
url: _$14ctx.favicon};
}
 else
{
__$i63 = "";
}

_$14buf = [__$i32, {
elem: __$i33,
content: [{
elem: __$i34,
content: [__$i38, __$i43, __$i48, __$i63, _$14ctx.meta, {
block: "i-ua"}, _$14ctx.head]}, _$14ctx]}];
"";
__r73 = this._mode;
this._mode = "";
__r74 = this.ctx;
__r75 = __r74._wrapped;
__r74._wrapped = true;
__r76 = this.ctx;
this.ctx = _$14buf;
return apply.call(__this,__$fn7);
}

var __r76;
var __r74, __r75;
var __r73;
var _$14ctx, _$14dtype, _$14buf;
var __r71, __r72;
var __this;
__this = this;
_$14ctx = this.ctx;
"";
__r71 = this._mode;
this._mode = "doctype";
return apply.call(__this,__$fn6);
}

function $1037(__$callback) {
var __$i66;
var __$r6;
function __$fn6(__$e, __$r) {
var __$r7;
function __$fn7(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r7 = __$r;
}

__r81 = __$r7;
this._mode = __r80;
"";
_$1kjsParams = __r81;
if (_$1kmix)
{
__$i66 = _$1kmix.push(_$1kjsParams);
}
 else
{
__$i66 = _$1kmix = [_$1kjsParams];
}

return __$callback.call(this,null,_$1kmix);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r6 = __$r;
}

__r79 = __$r6;
__r77._iGlobal = __r78;
"";
_$1kmix = __r79;
"";
__r80 = this._mode;
this._mode = "js-params";
return apply.call(__this,__$fn7);
}

var _$1kmix, _$1kjsParams;
var __r77, __r78, __r79, __r80, __r81;
var __this;
__this = this;
"";
__r77 = this.ctx;
__r78 = __r77._iGlobal;
__r77._iGlobal = true;
return apply.call(__this,__$fn6);
}

function $1040(__$callback) {
if (! ! this.elem === false)
{
return $1042.call(this,__$callback);
}
 else
{
return $1070.call(this,__$callback);
}

}

function $1042(__$callback) {
return __$callback.call(this,null,[{
elem: "body"}]);
}

function $1047(__$callback) {
return __$callback.call(this,null,{
elem: "body",
content: this.ctx.content});
}

function $1052(__$callback) {
return __$callback.call(this,null,"i-ua_js_no i-ua_css_standard");
}

function $1057(__$callback) {
var __$i13;
var __$i6;
__$i6 = this.ctx.doctype;
if (__$i6)
{
__$i13 = __$i6;
}
 else
{
__$i13 = "<!DOCTYPE html>";
}

return __$callback.call(this,null,__$i13);
}

function $1065(__$callback) {
var __$i62;
var __$i63;
var __$i48;
var __$i41;
var __$i38;
var __$i31;
var __$r23;
function __$fn23(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r23 = __$r;
}

this._buf.push(BEM.I18N(_$12keyset,_$12key,_$12params));
return __$callback.call(this,null);
}

var __$r22;
function __$fn22(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r22 = __$r;
}

__r70 = __$r22;
this._buf = __r67;
this._mode = __r68;
this.ctx = __r69;
"";
__r70;
__$i62[__$i63] = _$12cnt.join("");
return __$fn23.call(this);
}

var _$12cnt;
var _$12ctx, _$12keyset, _$12key, _$12params;
var __r67, __r68, __r69, __r70;
var __this;
__this = this;
if (! this.ctx)
{
return __$callback.call(this,null,"");
}
 else
{
undefined;
_$12ctx = this.ctx;
_$12keyset = _$12ctx.keyset;
_$12key = _$12ctx.key;
__$i31 = _$12ctx.params;
if (__$i31)
{
__$i38 = __$i31;
}
 else
{
__$i38 = {
};
}

_$12params = __$i38;
__$i41 = _$12keyset;
if (__$i41)
{
__$i48 = __$i41;
}
 else
{
__$i48 = _$12key;
}

if (! __$i48)
{
return __$callback.call(this,null,"");
}
 else
{
undefined;
if (_$12ctx.content)
{
__$i62 = _$12params;
__$i63 = "content";
_$12cnt = [];
"";
__r67 = this._buf;
this._buf = _$12cnt;
__r68 = this._mode;
this._mode = "";
__r69 = this.ctx;
this.ctx = _$12ctx.content;
return apply.call(__this,__$fn22);
}
 else
{
undefined;
return __$fn23.call(this);
}

}

}

}

function $1070(__$callback) {
if (! (typeof BEM === "undefined" || ! BEM.I18N) === false)
{
if (! ! this._start === false)
{
return $1073.call(this,__$callback);
}
 else
{
return $1076.call(this,__$callback);
}

}
 else
{
return $1076.call(this,__$callback);
}

}

function $1073(__$callback) {
var __$i14;
var __$i2;
var __$r8;
function __$fn8(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r8 = __$r;
}

return __$callback.call(this,null,__$r8);
}

__$i2 = function (bem_) {
this.BEM = bem_;
this.BEM.I18N = function (keyset, key) {
return key;
}
;
}
;
if (typeof BEM === "undefined")
{
__$i14 = {
};
}
 else
{
__$i14 = BEM;
}

__$i2(__$i14);
return apply.call(this,__$fn8);
}

function $1076(__$callback) {
if (this.block === "i-bem")
{
if (this._mode === "default")
{
if (this.elem === "i18n")
{
return $1080.call(this,__$callback);
}
 else
{
return $1085.call(this,__$callback);
}

}
 else
{
return $1085.call(this,__$callback);
}

}
 else
{
return $1085.call(this,__$callback);
}

}

function $1080(__$callback) {
var __$i62;
var __$i63;
var __$i48;
var __$i41;
var __$i38;
var __$i31;
var __$r23;
function __$fn23(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r23 = __$r;
}

this._buf.push(BEM.I18N(_$10keyset,_$10key,_$10params));
return __$callback.call(this,null);
}

var __$r22;
function __$fn22(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r22 = __$r;
}

__r66 = __$r22;
this._buf = __r63;
this._mode = __r64;
this.ctx = __r65;
"";
__r66;
__$i62[__$i63] = _$10cnt.join("");
return __$fn23.call(this);
}

var _$10cnt;
var _$10ctx, _$10keyset, _$10key, _$10params;
var __r63, __r64, __r65, __r66;
var __this;
__this = this;
if (! this.ctx)
{
return __$callback.call(this,null,"");
}
 else
{
undefined;
_$10ctx = this.ctx;
_$10keyset = _$10ctx.keyset;
_$10key = _$10ctx.key;
__$i31 = _$10ctx.params;
if (__$i31)
{
__$i38 = __$i31;
}
 else
{
__$i38 = {
};
}

_$10params = __$i38;
__$i41 = _$10keyset;
if (__$i41)
{
__$i48 = __$i41;
}
 else
{
__$i48 = _$10key;
}

if (! __$i48)
{
return __$callback.call(this,null,"");
}
 else
{
undefined;
if (_$10ctx.content)
{
__$i62 = _$10params;
__$i63 = "content";
_$10cnt = [];
"";
__r63 = this._buf;
this._buf = _$10cnt;
__r64 = this._mode;
this._mode = "";
__r65 = this.ctx;
this.ctx = _$10ctx.content;
return apply.call(__this,__$fn22);
}
 else
{
undefined;
return __$fn23.call(this);
}

}

}

}

function $1085(__$callback) {
if (! (typeof BEM === "undefined" || ! BEM.I18N) === false)
{
if (! ! this._start === false)
{
return $1088.call(this,__$callback);
}
 else
{
return $1091.call(this,__$callback);
}

}
 else
{
return $1091.call(this,__$callback);
}

}

function $1088(__$callback) {
var __$i14;
var __$i2;
var __$r8;
function __$fn8(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r8 = __$r;
}

return __$callback.call(this,null,__$r8);
}

__$i2 = function (bem_) {
this.BEM = bem_;
this.BEM.I18N = function (keyset, key) {
return key;
}
;
}
;
if (typeof BEM === "undefined")
{
__$i14 = {
};
}
 else
{
__$i14 = BEM;
}

__$i2(__$i14);
return apply.call(this,__$fn8);
}

function $1091(__$callback) {
var __t = this.block;
if (__t === "i-jquery")
{
if (this._mode === "default")
{
if (this.elem === "core")
{
return $1095.call(this,__$callback);
}
 else
{
return $1167.call(this,__$callback);
}

}
 else
{
return $1167.call(this,__$callback);
}

}
 else
if (__t === "i-ua")
{
var __t = this._mode;
if (__t === "content")
{
if (! ! this.elem === false)
{
return $1103.call(this,__$callback);
}
 else
{
return $1167.call(this,__$callback);
}

}
 else
if (__t === "bem")
{
if (! ! this.elem === false)
{
return $1108.call(this,__$callback);
}
 else
{
return $1167.call(this,__$callback);
}

}
 else
if (__t === "tag")
{
if (! ! this.elem === false)
{
return $1113.call(this,__$callback);
}
 else
{
return $1167.call(this,__$callback);
}

}
 else
{
return $1167.call(this,__$callback);
}

}
 else
if (__t === "b-page")
{
if (this._mode === "js-params")
{
if (! ! this.elem === false)
{
return $1121.call(this,__$callback);
}
 else
{
return $1167.call(this,__$callback);
}

}
 else
{
return $1167.call(this,__$callback);
}

}
 else
if (__t === "i-global")
{
if (this._mode === "public-params")
{
if (! this.elem === false)
{
return $1129.call(this,__$callback);
}
 else
{
return $1132.call(this,__$callback);
}

}
 else
{
return $1132.call(this,__$callback);
}

}
 else
{
return $1167.call(this,__$callback);
}

}

function $1095(__$callback) {
var __$r2;
function __$fn2(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r2 = __$r;
}

__r62 = __$r2;
this._mode = __r60;
this.ctx = __r61;
"";
return __$callback.call(this,null,__r62);
}

var __r60, __r61, __r62;
var __this;
__this = this;
"";
__r60 = this._mode;
this._mode = "";
__r61 = this.ctx;
this.ctx = {
block: "b-page",
elem: "js",
url: "//yandex.st/jquery/1.7.2/jquery.min.js"};
return apply.call(__this,__$fn2);
}

function $1103(__$callback) {
return __$callback.call(this,null,[";(function(d,e,c,r){", "e=d.documentElement;", "c=\"className\";", "r=\"replace\";", "e[c]=e[c][r](\"i-ua_js_no\",\"i-ua_js_yes\");", "if(d.compatMode!=\"CSS1Compat\")", "e[c]=e[c][r](\"i-ua_css_standart\",\"i-ua_css_quirks\")", "})(document);"].join(""));
}

function $1108(__$callback) {
return __$callback.call(this,null,false);
}

function $1113(__$callback) {
return __$callback.call(this,null,"script");
}

function $1121(__$callback) {
var __$i57;
var __$i83;
var __$i39;
var __$i40;
var __$r18;
function __$fn18(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r18 = __$r;
}

while (__$fi40 < __$i40.length) {
_$ue = __$i40[__$fi40];
__$i57 = _$u_this.hasOwnProperty(_$ue);
if (__$i57)
{
"";
__r58 = this.elem;
this.elem = _$ue;
return apply.call(__this,__$fn16);
}
 else
{
__$i83 = __$i57;
return __$fn17.call(this);
}

}

this._mode = __r56;
this.block = __r57;
"";
return __$callback.call(this,null,_$ublock);
}

var __$r17;
function __$fn17(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r17 = __$r;
}

if (__$i83)
{
_$ujs[_$ue] = _$u_this[_$ue];
}
 else
{
undefined;
}

__$fi40++;
return __$fn18.call(this);
}

var __$r16;
function __$fn16(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r16 = __$r;
}

__r59 = __$r16;
this.elem = __r58;
"";
__$i83 = __r59;
return __$fn17.call(this);
}

var __$fi40;
var __r57;
var __r56;
var _$u_this, _$ujs, _$ublock, _$ue;
var __r58, __r59;
var __this;
__this = this;
_$u_this = this["i-global"];
_$ujs = {
};
_$ublock = {
block: "i-global",
js: _$ujs};
"";
__r56 = this._mode;
this._mode = "public-params";
__r57 = this.block;
this.block = "i-global";
_$ue = undefined;
_$ue;
__$i39 = _$u_this;
__$i40 = typeof __$i39 === "object" && __$i39 !== null ? Object.keys(__$i39) : [];
__$fi40 = 0;
return __$fn18.call(this);
}

function $1129(__$callback) {
var __$i35;
var __$i28;
__$i28 = {
id: 1,
lang: 1,
"content-region": 1,
"user-region": 1,
login: 1,
displayName: 1,
index: 1,
yandexuid: 1,
"passport-host": 1,
"pass-host": 1,
"passport-msg": 1,
"static-host": 1,
"lego-static-host": 1,
"social-host": 1,
clck: 1,
"click-host": 1,
"export-host": 1,
"i-host": 1,
"social-retpath": 1,
"lego-path": 1,
sid: 1,
retpath: 1}[this.elem];
if (__$i28)
{
__$i35 = __$i28;
}
 else
{
__$i35 = false;
}

return __$callback.call(this,null,__$i35);
}

function $1132(__$callback) {
var __t = this.elem;
if (__t === "lego-static-host")
{
return $1134.call(this,__$callback);
}
 else
if (__t === "export-host")
{
return $1136.call(this,__$callback);
}
 else
if (__t === "social-host")
{
return $1138.call(this,__$callback);
}
 else
if (__t === "pass-host")
{
return $1140.call(this,__$callback);
}
 else
if (__t === "passport-host")
{
return $1142.call(this,__$callback);
}
 else
if (__t === "click-host")
{
return $1144.call(this,__$callback);
}
 else
if (__t === "content-region")
{
return $1146.call(this,__$callback);
}
 else
if (__t === "tld")
{
return $1148.call(this,__$callback);
}
 else
if (__t === "lang")
{
return $1150.call(this,__$callback);
}
 else
{
if (! this.elem === false)
{
return $1153.call(this,__$callback);
}
 else
{
var __t = this._mode;
if (__t === "default")
{
if (! ! this.elem === false)
{
return $1157.call(this,__$callback);
}
 else
{
return $1167.call(this,__$callback);
}

}
 else
if (__t === "env")
{
if (! ! this.elem === false)
{
return $1162.call(this,__$callback);
}
 else
{
return $1167.call(this,__$callback);
}

}
 else
{
return $1167.call(this,__$callback);
}

}

}

}

function $1134(__$callback) {
return __$callback.call(this,null,"//yandex.st/lego/2.10-68");
}

function $1136(__$callback) {
return __$callback.call(this,null,"//export.yandex.ru");
}

function $1138(__$callback) {
return __$callback.call(this,null,"//social.yandex.ru");
}

function $1140(__$callback) {
return __$callback.call(this,null,"//pass.yandex.ru");
}

function $1142(__$callback) {
return __$callback.call(this,null,"https://passport.yandex.ru");
}

function $1144(__$callback) {
return __$callback.call(this,null,"//clck.yandex.ru");
}

function $1146(__$callback) {
return __$callback.call(this,null,"ru");
}

function $1148(__$callback) {
return __$callback.call(this,null,"ru");
}

function $1150(__$callback) {
return __$callback.call(this,null,"ru");
}

function $1153(__$callback) {
return __$callback.call(this,null,"");
}

function $1157(__$callback) {
var __$i120;
var __$i121;
var __$i77;
var __$i57;
var __$i36;
var __$i23;
var __$i14;
var __$i7;
var __$fi121;
var _$ip;
var _$iparams, _$iiGlobal, _$iisTldChanged, _$itld, _$ixYaDomain, _$iyaDomain;
__$i7 = this.ctx.params;
if (__$i7)
{
__$i14 = __$i7;
}
 else
{
__$i14 = {
};
}

_$iparams = __$i14;
_$iiGlobal = this["i-global"];
__$i23 = _$iparams.tld;
if (__$i23)
{
__$i36 = _$iparams.tld !== _$iiGlobal.tld;
}
 else
{
__$i36 = __$i23;
}

_$iisTldChanged = __$i36;
if (_$iisTldChanged)
{
_$itld = _$iparams.tld;
if (_$itld === "tr")
{
__$i57 = "yandex.com.tr";
}
 else
{
__$i57 = "yandex." + _$itld;
}

_$ixYaDomain = __$i57;
if (["ua", "by", "kz"].indexOf(_$itld) != - 1)
{
__$i77 = "yandex.ru";
}
 else
{
__$i77 = _$ixYaDomain;
}

_$iyaDomain = __$i77;
_$iiGlobal["content-region"] = _$itld;
_$iiGlobal["click-host"] = "//clck." + _$iyaDomain;
_$iiGlobal["passport-host"] = "https://passport." + _$iyaDomain;
_$iiGlobal["pass-host"] = "//pass." + _$ixYaDomain;
_$iiGlobal["social-host"] = "//social." + _$ixYaDomain;
_$iiGlobal["export-host"] = "//export." + _$ixYaDomain;
}
 else
{
undefined;
}

_$ip;
__$i120 = _$iparams;
__$i121 = typeof __$i120 === "object" && __$i120 !== null ? Object.keys(__$i120) : [];
__$fi121 = 0;
while (__$fi121 < __$i121.length) {
_$ip = __$i121[__$fi121];
_$iiGlobal[_$ip] = _$iparams[_$ip];
__$fi121++;
}

return __$callback.call(this,null);
}

function $1162(__$callback) {
return __$callback.call(this,null,{
});
}

function $1167(__$callback) {
if (! this._start === false)
{
if (! ! this["i-global"] === false)
{
return $1170.call(this,__$callback);
}
 else
{
return $1173.call(this,__$callback);
}

}
 else
{
return $1173.call(this,__$callback);
}

}

function $1170(__$callback) {
var __$i84;
var __$i85;
var __$i88;
var __$i89;
var __$i90;
var __$i60;
var __$i61;
var __$r12;
function __$fn12(__$e, __$r) {
var __$r13;
function __$fn13(__$e, __$r) {
var __$r14;
function __$fn14(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r14 = __$r;
}

return __$callback.call(this,null);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r13 = __$r;
}

__r55 = __$r13;
this._mode = __r53;
this.block = __r54;
"";
__$i84[__$i85] = __$i88[__$i89](__$i90,__r55);
return this.apply(__$fn14);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r12 = __$r;
}

while (true) {
if (! (_$ge = _$ges.shift()))
{
break;
}
 else
{
"";
__r52 = this.elem;
this.elem = _$ge;
__$i60 = _$gps;
__$i61 = _$ge;
return this.apply(__$fn11);
}

}

this._mode = __r50;
this.block = __r51;
"";
__$i84 = this;
__$i85 = "i-global";
__$i88 = this._;
__$i89 = "extend";
__$i90 = _$gps;
"";
__r53 = this._mode;
this._mode = "env";
__r54 = this.block;
this.block = "i-global";
return apply.call(__this,__$fn13);
}

var __$r11;
function __$fn11(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r11 = __$r;
}

__$i60[__$i61] = __$r11;
this.elem = __r52;
"";
return __$fn12.call(this);
}

var __r52;
var __r51;
var __r50;
var _$gps, _$ges, _$ge;
var __r53, __r54, __r55;
var __this;
__this = this;
_$gps = {
};
_$ges = ["lang", "tld", "content-region", "click-host", "passport-host", "pass-host", "social-host", "export-host", "login", "lego-static-host"];
"";
__r50 = this._mode;
this._mode = "default";
__r51 = this.block;
this.block = "i-global";
return __$fn12.call(this);
}

function $1173(__$callback) {
if (! ! this._start === false)
{
return $1175.call(this,__$callback);
}
 else
{
var __t = this._mode;
if (__t === "content")
{
return $1178.call(this,__$callback);
}
 else
if (__t === "mix")
{
return $1180.call(this,__$callback);
}
 else
if (__t === "bem")
{
return $1182.call(this,__$callback);
}
 else
if (__t === "jsAttr")
{
return $1184.call(this,__$callback);
}
 else
if (__t === "js")
{
return $1186.call(this,__$callback);
}
 else
if (__t === "cls")
{
return $1188.call(this,__$callback);
}
 else
if (__t === "attrs")
{
return $1190.call(this,__$callback);
}
 else
if (__t === "tag")
{
return $1192.call(this,__$callback);
}
 else
{
if (! this.ctx === false)
{
if (! this.ctx.link === false)
{
if (! ! this._.isSimple(this.ctx) === false)
{
return $1197.call(this,__$callback);
}
 else
{
return $1202.call(this,__$callback);
}

}
 else
{
return $1202.call(this,__$callback);
}

}
 else
{
return $1202.call(this,__$callback);
}

}

}

}

function $1175(__$callback) {
var _$fbuildEscape, _$fctx;
var _$fBEM_, _$ftoString, _$fSHORT_TAGS;
_$fBEM_ = {
};
_$ftoString = Object.prototype.toString;
_$fSHORT_TAGS = {
area: 1,
base: 1,
br: 1,
col: 1,
command: 1,
embed: 1,
hr: 1,
img: 1,
input: 1,
keygen: 1,
link: 1,
meta: 1,
param: 1,
source: 1,
wbr: 1};
(function (BEM, undefined) {
var MOD_DELIM, ELEM_DELIM, NAME_PATTERN;
MOD_DELIM = "_";
ELEM_DELIM = "__";
NAME_PATTERN = "[a-zA-Z0-9-]+";
function buildModPostfix(modName, modVal, buffer) {
buffer.push(MOD_DELIM,modName,MOD_DELIM,modVal);
}

function buildBlockClass(name, modName, modVal, buffer) {
var __$i314;
var __$i303;
buffer.push(name);
__$i303 = modVal;
if (__$i303)
{
__$i314 = buildModPostfix(modName,modVal,buffer);
}
 else
{
__$i314 = __$i303;
}

}

function buildElemClass(block, name, modName, modVal, buffer) {
var __$i339;
var __$i328;
buildBlockClass(block,undefined,undefined,buffer);
buffer.push(ELEM_DELIM,name);
__$i328 = modVal;
if (__$i328)
{
__$i339 = buildModPostfix(modName,modVal,buffer);
}
 else
{
__$i339 = __$i328;
}

}

BEM.INTERNAL = {
NAME_PATTERN: NAME_PATTERN,
MOD_DELIM: MOD_DELIM,
ELEM_DELIM: ELEM_DELIM,
buildModPostfix: function (modName, modVal, buffer) {
var __$i369;
var __$i350;
var __$i343;
var res;
__$i343 = buffer;
if (__$i343)
{
__$i350 = __$i343;
}
 else
{
__$i350 = [];
}

res = __$i350;
buildModPostfix(modName,modVal,res);
if (buffer)
{
__$i369 = res;
}
 else
{
__$i369 = res.join("");
}

return __$i369;
}
,
buildClass: function (block, elem, modName, modVal, buffer) {
var __$i499;
var __$i486;
var __$i464;
var __$i457;
var __$i447;
var __$i439;
var __$i432;
var __$i417;
var __$i407;
var res;
var typeOf;
typeOf = typeof modName;
if (typeOf == "string")
{
if (typeof modVal != "string")
{
buffer = modVal;
modVal = modName;
modName = elem;
elem = undefined;
}
 else
{
undefined;
}

}
 else
{
if (typeOf != "undefined")
{
buffer = modName;
modName = undefined;
}
 else
{
__$i407 = elem;
if (__$i407)
{
__$i417 = typeof elem != "string";
}
 else
{
__$i417 = __$i407;
}

if (__$i417)
{
buffer = elem;
elem = undefined;
}
 else
{
undefined;
}

}

}

__$i432 = elem;
if (__$i432)
{
__$i439 = __$i432;
}
 else
{
__$i439 = modName;
}

if (__$i439)
{
__$i447 = __$i439;
}
 else
{
__$i447 = buffer;
}

if (! __$i447)
{
return block;
}
 else
{
undefined;
__$i457 = buffer;
if (__$i457)
{
__$i464 = __$i457;
}
 else
{
__$i464 = [];
}

res = __$i464;
if (elem)
{
__$i486 = buildElemClass(block,elem,modName,modVal,res);
}
 else
{
__$i486 = buildBlockClass(block,modName,modVal,res);
}

if (buffer)
{
__$i499 = res;
}
 else
{
__$i499 = res.join("");
}

return __$i499;
}

}
,
buildModsClasses: function (block, elem, mods, buffer) {
var __$i621;
var __$i519;
var __$i520;
var __$i510;
var __$i503;
var modVal;
var __$fi520;
var modName;
var res;
__$i503 = buffer;
if (__$i503)
{
__$i510 = __$i503;
}
 else
{
__$i510 = [];
}

res = __$i510;
if (mods)
{
modName = undefined;
modName;
__$i519 = mods;
__$i520 = typeof __$i519 === "object" && __$i519 !== null ? Object.keys(__$i519) : [];
__$fi520 = 0;
while (__$fi520 < __$i520.length) {
modName = __$i520[__$fi520];
if (! mods.hasOwnProperty(modName))
{
__$fi520++;
continue;
}
 else
{
undefined;
modVal = mods[modName];
if (modVal == null)
{
__$fi520++;
continue;
}
 else
{
undefined;
modVal = mods[modName] + "";
if (! modVal)
{
__$fi520++;
continue;
}
 else
{
undefined;
res.push(" ");
if (elem)
{
buildElemClass(block,elem,modName,modVal,res);
}
 else
{
buildBlockClass(block,modName,modVal,res);
}

__$fi520++;
}

}

}

}

}
 else
{
undefined;
}

if (buffer)
{
__$i621 = res;
}
 else
{
__$i621 = res.join("");
}

return __$i621;
}
,
buildClasses: function (block, elem, mods, buffer) {
var __$i674;
var __$i654;
var __$i632;
var __$i625;
var res;
__$i625 = buffer;
if (__$i625)
{
__$i632 = __$i625;
}
 else
{
__$i632 = [];
}

res = __$i632;
if (elem)
{
__$i654 = buildElemClass(block,elem,undefined,undefined,res);
}
 else
{
__$i654 = buildBlockClass(block,undefined,undefined,res);
}

this.buildModsClasses(block,elem,mods,buffer);
if (buffer)
{
__$i674 = res;
}
 else
{
__$i674 = res.join("");
}

return __$i674;
}
};
}
)(_$fBEM_);
_$fbuildEscape = (function () {
var ts, f;
ts = {
"\"": "&quot;",
"&": "&amp;",
"<": "&lt;",
">": "&gt;"};
f = function (t) {
var __$i686;
var __$i679;
__$i679 = ts[t];
if (__$i679)
{
__$i686 = __$i679;
}
 else
{
__$i686 = t;
}

return __$i686;
}
;
return function (r) {
r = new RegExp(r, "g");
return function (s) {
return ("" + s).replace(r,f);
}
;
}
;
}
)();
_$fctx = {
ctx: this,
_start: true,
apply: apply,
_buf: [],
_: {
isArray: function (obj) {
return _$ftoString.call(obj) === "[object Array]";
}
,
isSimple: function (obj) {
var __$i133;
var __$i123;
var __$i114;
var t;
t = typeof obj;
__$i114 = t === "string";
if (__$i114)
{
__$i123 = __$i114;
}
 else
{
__$i123 = t === "number";
}

if (__$i123)
{
__$i133 = __$i123;
}
 else
{
__$i133 = t === "boolean";
}

return __$i133;
}
,
isShortTag: function (t) {
return _$fSHORT_TAGS.hasOwnProperty(t);
}
,
extend: function (o1, o2) {
var __$i242;
var __$i230;
var __$i212;
var __$i213;
var __$i202;
var __$i190;
var __$i172;
var __$i173;
var __$i160;
var __$i153;
var __$i150;
var __$i142;
var __$fi213;
var __$fi173;
var res, n;
__$i142 = ! o1;
if (__$i142)
{
__$i150 = __$i142;
}
 else
{
__$i150 = ! o2;
}

if (__$i150)
{
__$i153 = o1;
if (__$i153)
{
__$i160 = __$i153;
}
 else
{
__$i160 = o2;
}

return __$i160;
}
 else
{
undefined;
res = {
};
n = undefined;
n;
__$i172 = o1;
__$i173 = typeof __$i172 === "object" && __$i172 !== null ? Object.keys(__$i172) : [];
__$fi173 = 0;
while (__$fi173 < __$i173.length) {
n = __$i173[__$fi173];
__$i190 = o1.hasOwnProperty(n);
if (__$i190)
{
__$i202 = res[n] = o1[n];
}
 else
{
__$i202 = __$i190;
}

__$fi173++;
}

n = undefined;
n;
__$i212 = o2;
__$i213 = typeof __$i212 === "object" && __$i212 !== null ? Object.keys(__$i212) : [];
__$fi213 = 0;
while (__$fi213 < __$i213.length) {
n = __$i213[__$fi213];
__$i230 = o2.hasOwnProperty(n);
if (__$i230)
{
__$i242 = res[n] = o2[n];
}
 else
{
__$i242 = __$i230;
}

__$fi213++;
}

return res;
}

}
,
identify: (function () {
var cnt, id, expando, get;
cnt = 0;
id = _$fBEM_.__id = + new Date();
expando = "__" + id;
get = function () {
return "uniq" + id + ++cnt;
}
;
return function (obj, onlyGet) {
var __$i721;
var __$i712;
if (! obj)
{
return get();
}
 else
{
undefined;
__$i712 = onlyGet;
if (__$i712)
{
__$i721 = __$i712;
}
 else
{
__$i721 = obj[expando];
}

if (__$i721)
{
return obj[expando];
}
 else
{
return obj[expando] = get();
}

}

}
;
}
)(),
xmlEscape: _$fbuildEscape("[&<>]"),
attrEscape: _$fbuildEscape("[\"&<>]")},
BEM: _$fBEM_,
isFirst: function () {
return this.position === 1;
}
,
isLast: function () {
return this.position === this._listLength;
}
,
generateId: function () {
return this._.identify(this.ctx);
}
};
_$fctx.apply();
return __$callback.call(this,null,_$fctx._buf.join(""));
}

function $1178(__$callback) {
return __$callback.call(this,null,this.ctx.content);
}

function $1180(__$callback) {
return __$callback.call(this,null,undefined);
}

function $1182(__$callback) {
return __$callback.call(this,null,undefined);
}

function $1184(__$callback) {
return __$callback.call(this,null,undefined);
}

function $1186(__$callback) {
return __$callback.call(this,null,undefined);
}

function $1188(__$callback) {
return __$callback.call(this,null,undefined);
}

function $1190(__$callback) {
return __$callback.call(this,null,undefined);
}

function $1192(__$callback) {
return __$callback.call(this,null,undefined);
}

function $1197(__$callback) {
var __$i18;
var __$i8;
var _$6res;
var _$6contents;
var __r48, __r49;
var __this;
__this = this;
function _$6follow() {
var data;
if (this.ctx.link === "no-follow")
{
return undefined;
}
 else
{
undefined;
data = this._links[this.ctx.link];
"";
__r48 = this.ctx;
this.ctx = data;
__r49 = apply.call(__this);
this.ctx = __r48;
"";
return __r49;
}

}

__$i8 = ! cache;
if (__$i8)
{
__$i18 = __$i8;
}
 else
{
__$i18 = ! this._cacheLog;
}

if (__$i18)
{
return __$callback.call(this,null,_$6follow.call(this));
}
 else
{
undefined;
_$6contents = this._buf.slice(this._cachePos).join("");
this._cachePos = this._buf.length;
this._cacheLog.push(_$6contents,{
log: this._localLog.slice(),
link: this.ctx.link});
_$6res = _$6follow.call(this);
this._cachePos = this._buf.length;
return __$callback.call(this,null,_$6res);
}

}

function $1202(__$callback) {
if (! cache === false)
{
if (! this.ctx === false)
{
if (! this.ctx.cache === false)
{
return $1206.call(this,__$callback);
}
 else
{
return $1211.call(this,__$callback);
}

}
 else
{
return $1211.call(this,__$callback);
}

}
 else
{
return $1211.call(this,__$callback);
}

}

function $1206(__$callback) {
var __$r56;
function __$fn56(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r56 = __$r;
}

_$5res = __$r56;
_$5tail = this._buf.slice(this._cachePos).join("");
if (_$5tail)
{
_$5cacheLog.push(_$5tail);
}
 else
{
undefined;
}

__r43.cache = __r44;
this._cachePos = __r45;
this._cacheLog = __r46;
this._localLog = __r47;
"";
cache.set(this.ctx.cache,{
log: _$5cacheLog,
res: _$5res});
return __$callback.call(this,null,_$5res);
}

var __$r55;
function __$fn55(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r55 = __$r;
}

while (true) {
if (! (_$5i < _$5cached.log.length))
{
break;
}
 else
{
if (typeof _$5cached.log[_$5i] === "string")
{
this._buf.push(_$5cached.log[_$5i]);
_$5i++;
return __$fn54.call(this);
}
 else
{
undefined;
_$5log = _$5cached.log[_$5i];
_$5reverseLog = _$5log.log.map(function (entry) {
return {
key: entry[0],
value: _$5setProperty(this,entry[0],entry[1])};
}
,this).reverse();
"";
__r38 = this.ctx;
__r39 = __r38.cache;
__r38.cache = null;
__r40 = this._cacheLog;
this._cacheLog = null;
__r41 = this.ctx;
__r42 = __r41.link;
__r41.link = _$5log.link;
return apply.call(__this,__$fn53);
}

}

}

return __$callback.call(this,null,_$5cached.res);
}

var __$r54;
function __$fn54(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r54 = __$r;
}

return __$fn55.call(this);
}

var __$r53;
function __$fn53(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r53 = __$r;
}

__r38.cache = __r39;
this._cacheLog = __r40;
__r41.link = __r42;
"";
undefined;
_$5reverseLog.forEach(function (entry) {
_$5setProperty(this,entry.key,entry.value);
}
,this);
_$5i++;
return __$fn54.call(this);
}

var _$5tail;
var __r47;
var __r46;
var __r45;
var __r43, __r44;
var _$5cacheLog, _$5res;
var __r41, __r42;
var __r40;
var __r38, __r39;
var _$5log, _$5reverseLog;
var _$5i;
var _$5cached;
var __this;
__this = this;
function _$5setProperty(obj, key, value) {
var i;
var host, previous;
var i;
var target;
if (key.length === 0)
{
return undefined;
}
 else
{
undefined;
if (Array.isArray(value))
{
target = obj;
i = 0;
while (true) {
if (! (i < value.length - 1))
{
break;
}
 else
{
target = target[value[i]];
i++;
}

}

value = target[value[i]];
}
 else
{
undefined;
}

host = obj;
i = 0;
previous = host[key[i]];
host[key[i]] = value;
return previous;
}

while (true) {
if (! (i < key.length - 1))
{
break;
}
 else
{
host = host[key[i]];
i++;
}

}

}

if (_$5cached = cache.get(this.ctx.cache))
{
_$5i = 0;
return __$fn55.call(this);
}
 else
{
undefined;
_$5cacheLog = [];
"";
__r43 = this.ctx;
__r44 = __r43.cache;
__r43.cache = null;
__r45 = this._cachePos;
this._cachePos = this._buf.length;
__r46 = this._cacheLog;
this._cacheLog = _$5cacheLog;
__r47 = this._localLog;
this._localLog = [];
return apply.call(__this,__$fn56);
}

}

function $1211(__$callback) {
if (this._mode === "default")
{
return $1213.call(this,__$callback);
}
 else
{
if (! this._.isSimple(this.ctx) === false)
{
if (! ! this._mode === false)
{
return $1217.call(this,__$callback);
}
 else
{
return $1220.call(this,__$callback);
}

}
 else
{
return $1220.call(this,__$callback);
}

}

}

function $1213(__$callback) {
var __$i713;
var __$i714;
var __$i657;
var __$i647;
var __$i648;
var __$i649;
var __$i650;
var __$i613;
var __$i603;
var __$i601;
var __$i593;
var __$i583;
var __$i584;
var __$i581;
var __$i563;
var __$i558;
var __$i548;
var __$i544;
var __$i541;
var __$i526;
var __$i516;
var __$i508;
var __$i500;
var __$i491;
var __$i487;
var __$i483;
var __$i464;
var __$i467;
var __$i462;
var __$i453;
var __$i449;
var __$i439;
var __$i436;
var __$i427;
var __$i422;
var __$i413;
var __$i386;
var __$i379;
var __$i362;
var __$i939;
var __$i927;
var __$i334;
var __$i315;
var __$i316;
var __$i319;
var __$i322;
var __$i325;
var __$i304;
var __$i297;
var __$i294;
var __$i287;
var __$i282;
var __$i272;
var __$i876;
var __$i864;
var __$i865;
var __$i856;
var __$i844;
var __$i845;
var __$i826;
var __$i817;
var __$i811;
var __$i802;
var __$i248;
var __$i243;
var __$i239;
var __$i230;
var __$i212;
var __$i778;
var __$i768;
var __$i176;
var __$i155;
var __$i152;
var __$i148;
var __$i129;
var __$i114;
var __$i115;
var __$i118;
var __$i86;
var __$i75;
var __$i68;
var __$i60;
var __$i55;
var __$i45;
var __$r205;
function __$fn205(__$e, __$r) {
var __$r208;
function __$fn208(__$e, __$r) {
var __$r218;
function __$fn218(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r218 = __$r;
}

return __$callback.call(this,null);
}

var __$r217;
function __$fn217(__$e, __$r) {
var __$r220;
function __$fn220(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r220 = __$r;
}

__$i927 = _$4tag;
if (__$i927)
{
__$i939 = _$4buf.push("</",_$4tag,">");
}
 else
{
__$i939 = __$i927;
}

return __$fn218.call(this);
}

var __$r219;
function __$fn219(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r219 = __$r;
}

this._notNewList = __r28;
this.position = __r29;
this._listLength = __r30;
this.ctx = __r31;
this._mode = __r32;
"";
undefined;
return __$fn220.call(this);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r217 = __$r;
}

__r27 = __$r217;
this._mode = __r26;
"";
_$4content = __r27;
__$i802 = _$4content;
if (__$i802)
{
__$i811 = __$i802;
}
 else
{
__$i811 = _$4content === 0;
}

if (__$i811)
{
__$i817 = this.block;
if (__$i817)
{
__$i826 = __$i817;
}
 else
{
__$i826 = this.elem;
}

_$4isBEM = __$i826;
"";
__r28 = this._notNewList;
this._notNewList = false;
__r29 = this.position;
__$i844 = this;
__$i845 = "position";
if (_$4isBEM)
{
__$i856 = 1;
}
 else
{
__$i856 = this.position;
}

__$i844[__$i845] = __$i856;
__r30 = this._listLength;
__$i864 = this;
__$i865 = "_listLength";
if (_$4isBEM)
{
__$i876 = 1;
}
 else
{
__$i876 = this._listLength;
}

__$i864[__$i865] = __$i876;
__r31 = this.ctx;
this.ctx = _$4content;
__r32 = this._mode;
this._mode = "";
return apply.call(__this,__$fn219);
}
 else
{
undefined;
return __$fn220.call(this);
}

}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r208 = __$r;
}

if (this._.isShortTag(_$4tag))
{
_$4buf.push("/>");
return __$fn218.call(this);
}
 else
{
__$i768 = _$4tag;
if (__$i768)
{
__$i778 = _$4buf.push(">");
}
 else
{
__$i778 = __$i768;
}

"";
__r26 = this._mode;
this._mode = "content";
return apply.call(__this,__$fn217);
}

}

var __$r207;
function __$fn207(__$e, __$r) {
var __$r209;
function __$fn209(__$e, __$r) {
var __$r210;
function __$fn210(__$e, __$r) {
var __$r213;
function __$fn213(__$e, __$r) {
var __$r215;
function __$fn215(__$e, __$r) {
var __$r216;
function __$fn216(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r216 = __$r;
}

__r25 = __$r216;
this._mode = __r24;
"";
_$4attrs = __r25;
_$4attrs = this._.extend(_$4attrs,_$4v.attrs);
if (_$4attrs)
{
_$4name = undefined;
_$4name;
__$i713 = _$4attrs;
__$i714 = typeof __$i713 === "object" && __$i713 !== null ? Object.keys(__$i713) : [];
__$fi714 = 0;
while (__$fi714 < __$i714.length) {
_$4name = __$i714[__$fi714];
_$4buf.push(" ",_$4name,"=\"",this._.attrEscape(_$4attrs[_$4name]),"\"");
__$fi714++;
}

}
 else
{
undefined;
}

return __$fn208.call(this);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r215 = __$r;
}

"";
__r24 = this._mode;
this._mode = "attrs";
return apply.call(__this,__$fn216);
}

var __$r214;
function __$fn214(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r214 = __$r;
}

__r23 = __$r214;
this._mode = __r22;
"";
_$4jsAttr = __r23;
__$i647 = _$4buf;
__$i648 = "push";
__$i649 = " ";
__$i650 = _$4jsAttr;
if (__$i650)
{
__$i657 = __$i650;
}
 else
{
__$i657 = "onclick";
}

__$i647[__$i648](__$i649,__$i657,"=\"return ",this._.attrEscape(JSON.stringify(_$4jsParams)),"\"");
return __$fn215.call(this);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r213 = __$r;
}

if (_$4jsParams)
{
"";
__r22 = this._mode;
this._mode = "jsAttr";
return apply.call(__this,__$fn214);
}
 else
{
undefined;
return __$fn215.call(this);
}

}

var __$r212;
function __$fn212(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r212 = __$r;
}

__$i581 = _$4cls;
if (__$i581)
{
__$i583 = _$4buf;
__$i584 = "push";
if (_$4isBEM)
{
__$i593 = " ";
}
 else
{
__$i593 = "";
}

__$i601 = __$i583[__$i584](__$i593,_$4cls);
}
 else
{
__$i601 = __$i581;
}

__$i603 = _$4addJSInitClass;
if (__$i603)
{
__$i613 = _$4buf.push(" i-bem");
}
 else
{
__$i613 = __$i603;
}

_$4buf.push("\"");
return __$fn213.call(this);
}

var __$r211;
function __$fn211(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r211 = __$r;
}

__r19 = __$r211;
this._mode = __r18;
"";
_$4mix = __r19;
__$i362 = _$4v.mix;
if (__$i362)
{
if (_$4mix)
{
__$i379 = _$4mix.concat(_$4v.mix);
}
 else
{
__$i379 = _$4v.mix;
}

__$i386 = _$4mix = __$i379;
}
 else
{
__$i386 = __$i362;
}

if (_$4mix)
{
_$4i = 0;
_$4l = _$4mix.length;
while (true) {
if (! (_$4i < _$4l))
{
break;
}
 else
{
_$4mixItem = _$4mix[_$4i++];
__$i413 = _$4mixItem.block;
if (__$i413)
{
__$i422 = __$i413;
}
 else
{
__$i422 = _$4mixItem.elem;
}

_$4hasItem = __$i422;
__$i427 = _$4mixItem.block;
if (__$i427)
{
__$i436 = __$i427;
}
 else
{
__$i436 = _$4_this.block;
}

_$4block = __$i436;
__$i439 = _$4hasItem;
if (__$i439)
{
__$i449 = _$4buf.push(" ");
}
 else
{
__$i449 = __$i439;
}

__$i453 = _$4BEM_.INTERNAL;
if (_$4hasItem)
{
__$i462 = "buildClasses";
}
 else
{
__$i462 = "buildModsClasses";
}

__$i464 = _$4block;
__$i467 = _$4mixItem.elem;
if (__$i467)
{
__$i487 = __$i467;
}
 else
{
if (_$4mixItem.block)
{
__$i483 = undefined;
}
 else
{
__$i483 = _$4_this.elem;
}

__$i487 = __$i483;
}

__$i491 = _$4mixItem.elemMods;
if (__$i491)
{
__$i500 = __$i491;
}
 else
{
__$i500 = _$4mixItem.mods;
}

__$i453[__$i462](__$i464,__$i487,__$i500,_$4buf);
if (_$4mixItem.js)
{
__$i508 = _$4jsParams;
if (__$i508)
{
__$i516 = __$i508;
}
 else
{
__$i516 = _$4jsParams = {
};
}

__$i526 = _$4BEM_.INTERNAL.buildClass(_$4block,_$4mixItem.elem);
if (_$4mixItem.js === true)
{
__$i541 = {
};
}
 else
{
__$i541 = _$4mixItem.js;
}

__$i516[__$i526] = __$i541;
__$i544 = _$4addJSInitClass;
if (__$i544)
{
__$i563 = __$i544;
}
 else
{
__$i548 = _$4block;
if (__$i548)
{
__$i558 = ! _$4mixItem.elem;
}
 else
{
__$i558 = __$i548;
}

__$i563 = _$4addJSInitClass = __$i558;
}

}
 else
{
undefined;
}

}

}

}
 else
{
undefined;
}

return __$fn212.call(this);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r210 = __$r;
}

__r17 = __$r210;
this._mode = __r16;
"";
_$4cls = __r17;
__$i272 = _$4cls;
if (__$i272)
{
__$i282 = __$i272;
}
 else
{
__$i282 = _$4cls = _$4v.cls;
}

__$i287 = _$4v.block;
if (__$i287)
{
__$i294 = _$4jsParams;
}
 else
{
__$i294 = __$i287;
}

_$4addJSInitClass = __$i294;
__$i297 = _$4isBEM;
if (__$i297)
{
__$i304 = __$i297;
}
 else
{
__$i304 = _$4cls;
}

if (__$i304)
{
_$4buf.push(" class=\"");
if (_$4isBEM)
{
__$i315 = _$4BEM_.INTERNAL;
__$i316 = "buildClasses";
__$i319 = this.block;
__$i322 = _$4v.elem;
__$i325 = _$4v.elemMods;
if (__$i325)
{
__$i334 = __$i325;
}
 else
{
__$i334 = _$4v.mods;
}

__$i315[__$i316](__$i319,__$i322,__$i334,_$4buf);
"";
__r18 = this._mode;
this._mode = "mix";
return apply.call(__this,__$fn211);
}
 else
{
undefined;
return __$fn212.call(this);
}

}
 else
{
undefined;
return __$fn213.call(this);
}

}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r209 = __$r;
}

__r15 = __$r209;
this._mode = __r14;
"";
_$4isBEM = __r15;
__$i212 = typeof _$4isBEM != "undefined";
if (__$i212)
{
__$i248 = __$i212;
}
 else
{
if (typeof _$4v.bem != "undefined")
{
__$i243 = _$4v.bem;
}
 else
{
__$i230 = _$4v.block;
if (__$i230)
{
__$i239 = __$i230;
}
 else
{
__$i239 = _$4v.elem;
}

__$i243 = __$i239;
}

__$i248 = _$4isBEM = __$i243;
}

"";
__r16 = this._mode;
this._mode = "cls";
return apply.call(__this,__$fn210);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r207 = __$r;
}

_$4buf.push("<",_$4tag);
"";
__r14 = this._mode;
this._mode = "bem";
return apply.call(__this,__$fn209);
}

var __$r206;
function __$fn206(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r206 = __$r;
}

__r13 = __$r206;
this._mode = __r12;
"";
_$4js = __r13;
if (_$4js)
{
__$i114 = this._;
__$i115 = "extend";
__$i118 = _$4v.js;
if (_$4js === true)
{
__$i129 = {
};
}
 else
{
__$i129 = _$4js;
}

__$i152 = __$i114[__$i115](__$i118,__$i129);
}
 else
{
if (_$4v.js === true)
{
__$i148 = {
};
}
 else
{
__$i148 = _$4v.js;
}

__$i152 = __$i148;
}

_$4js = __$i152;
__$i155 = _$4js;
if (__$i155)
{
__$i176 = (_$4jsParams = {
})[_$4BEM_.INTERNAL.buildClass(this.block,_$4v.elem)] = _$4js;
}
 else
{
__$i176 = __$i155;
}

return __$fn207.call(this);
}

if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r205 = __$r;
}

__r9 = __$r205;
this._mode = __r8;
"";
_$4tag = __r9;
__$i45 = typeof _$4tag != "undefined";
if (__$i45)
{
__$i55 = __$i45;
}
 else
{
__$i55 = _$4tag = _$4v.tag;
}

__$i60 = typeof _$4tag != "undefined";
if (__$i60)
{
__$i68 = __$i60;
}
 else
{
__$i68 = _$4tag = "div";
}

if (_$4tag)
{
__$i75 = this.block;
if (__$i75)
{
__$i86 = _$4v.js !== false;
}
 else
{
__$i86 = __$i75;
}

if (__$i86)
{
"";
__r12 = this._mode;
this._mode = "js";
return apply.call(__this,__$fn206);
}
 else
{
undefined;
return __$fn207.call(this);
}

}
 else
{
undefined;
return __$fn208.call(this);
}

}

var __r32;
var __r31;
var __r30;
var __r29;
var __r28;
var _$4isBEM;
var _$4content;
var __$fi714;
var _$4name;
var _$4attrs;
var _$4jsAttr;
var _$4i, _$4l, _$4mixItem, _$4hasItem, _$4block;
var _$4mix;
var _$4addJSInitClass;
var _$4cls;
var _$4isBEM;
var _$4jsParams, _$4js;
var _$4_this, _$4BEM_, _$4v, _$4buf, _$4tag;
var __r18, __r8, __r12, __r13, __r14, __r15, __r16, __r17, __r9, __r19, __r22, __r23, __r24, __r25, __r26, __r27;
var __this;
__this = this;
_$4_this = this;
_$4BEM_ = _$4_this.BEM;
_$4v = this.ctx;
_$4buf = this._buf;
"";
__r8 = this._mode;
this._mode = "tag";
return apply.call(__this,__$fn205);
}

function $1217(__$callback) {
var __$i43;
var __$i30;
var __$i20;
var __$i11;
var _$3ctx;
this._listLength--;
_$3ctx = this.ctx;
__$i11 = _$3ctx;
if (__$i11)
{
__$i20 = _$3ctx !== true;
}
 else
{
__$i20 = __$i11;
}

if (__$i20)
{
__$i30 = __$i20;
}
 else
{
__$i30 = _$3ctx === 0;
}

if (__$i30)
{
__$i43 = this._buf.push(_$3ctx);
}
 else
{
__$i43 = __$i30;
}

return __$callback.call(this,null);
}

function $1220(__$callback) {
if (! ! this._mode === false)
{
if (! ! this.ctx === false)
{
return $1223.call(this,__$callback);
}
 else
{
return $1226.call(this,__$callback);
}

}
 else
{
return $1226.call(this,__$callback);
}

}

function $1223(__$callback) {
this._listLength--;
return __$callback.call(this,null);
}

function $1226(__$callback) {
if (! this._.isArray(this.ctx) === false)
{
if (! ! this._mode === false)
{
return $1229.call(this,__$callback);
}
 else
{
return $1232.call(this,__$callback);
}

}
 else
{
return $1232.call(this,__$callback);
}

}

function $1229(__$callback) {
var __$i93;
var __$i83;
var __$r20;
function __$fn20(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r20 = __$r;
}

while (true) {
if (! (_$1i < _$1l))
{
break;
}
 else
{
"";
__r7 = this.ctx;
this.ctx = _$1v[_$1i++];
return apply.call(__this,__$fn19);
}

}

undefined;
__$i83 = _$1prevNotNewList;
if (__$i83)
{
__$i93 = __$i83;
}
 else
{
__$i93 = this.position = _$1prevPos;
}

return __$callback.call(this,null);
}

var __$r19;
function __$fn19(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r19 = __$r;
}

this.ctx = __r7;
"";
return __$fn20.call(this);
}

var __r7;
var _$1v, _$1l, _$1i, _$1prevPos, _$1prevNotNewList;
var __this;
__this = this;
_$1v = this.ctx;
_$1l = _$1v.length;
_$1i = 0;
_$1prevPos = this.position;
_$1prevNotNewList = this._notNewList;
if (_$1prevNotNewList)
{
this._listLength += _$1l - 1;
}
 else
{
this.position = 0;
this._listLength = _$1l;
}

this._notNewList = true;
return __$fn20.call(this);
}

function $1232(__$callback) {
if (! true === false)
{
if (! ! this._mode === false)
{
return $1235.call(this,__$callback);
}
 else
{
return $e.call(this,__$callback);
}

}
 else
{
return $e.call(this,__$callback);
}

}

function $1235(__$callback) {
var __$i235;
var __$i222;
var __$i211;
var __$i212;
var __$i215;
var __$i208;
var __$i199;
var __$i194;
var __$i181;
var __$i182;
var __$i187;
var __$i173;
var __$i165;
var __$i149;
var __$i150;
var __$i128;
var __$i119;
var __$i110;
var __$i111;
var __$i112;
var __$i102;
var __$i98;
var __$i84;
var __$i85;
var __$i86;
var __$i76;
var __$i61;
var __$i62;
var __$i67;
var __$i44;
var __$i34;
var __$i29;
var __$i20;
var __$r54;
function __$fn54(__$e, __$r) {
if (__$e)
{
return __$callback.call(this,__$e,__$r);
}
 else
{
__$r54 = __$r;
}

undefined;
this._mode = __r0;
this._links = __r1;
this.block = __r2;
this._currBlock = __r3;
this.elem = __r4;
this.mods = __r5;
this.elemMods = __r6;
"";
return __$callback.call(this,null);
}

var __r6;
var __r5;
var __r4;
var __r3;
var __r2;
var __r1;
var __r0;
var _$0vBlock, _$0vElem, _$0block;
var __this;
__this = this;
_$0vBlock = this.ctx.block;
_$0vElem = this.ctx.elem;
__$i20 = this._currBlock;
if (__$i20)
{
__$i29 = __$i20;
}
 else
{
__$i29 = this.block;
}

_$0block = __$i29;
__$i34 = this.ctx;
if (__$i34)
{
__$i44 = __$i34;
}
 else
{
__$i44 = this.ctx = {
};
}

"";
__r0 = this._mode;
this._mode = "default";
__r1 = this._links;
__$i61 = this;
__$i62 = "_links";
__$i67 = this.ctx.links;
if (__$i67)
{
__$i76 = __$i67;
}
 else
{
__$i76 = this._links;
}

__$i61[__$i62] = __$i76;
__r2 = this.block;
__$i84 = this;
__$i85 = "block";
__$i86 = _$0vBlock;
if (__$i86)
{
__$i102 = __$i86;
}
 else
{
if (_$0vElem)
{
__$i98 = _$0block;
}
 else
{
__$i98 = undefined;
}

__$i102 = __$i98;
}

__$i84[__$i85] = __$i102;
__r3 = this._currBlock;
__$i110 = this;
__$i111 = "_currBlock";
__$i112 = _$0vBlock;
if (__$i112)
{
__$i119 = __$i112;
}
 else
{
__$i119 = _$0vElem;
}

if (__$i119)
{
__$i128 = undefined;
}
 else
{
__$i128 = _$0block;
}

__$i110[__$i111] = __$i128;
__r4 = this.elem;
this.elem = this.ctx.elem;
__r5 = this.mods;
__$i149 = this;
__$i150 = "mods";
if (_$0vBlock)
{
__$i165 = this.ctx.mods;
}
 else
{
__$i165 = this.mods;
}

if (__$i165)
{
__$i173 = __$i165;
}
 else
{
__$i173 = {
};
}

__$i149[__$i150] = __$i173;
__r6 = this.elemMods;
__$i181 = this;
__$i182 = "elemMods";
__$i187 = this.ctx.elemMods;
if (__$i187)
{
__$i194 = __$i187;
}
 else
{
__$i194 = {
};
}

__$i181[__$i182] = __$i194;
__$i199 = this.block;
if (__$i199)
{
__$i208 = __$i199;
}
 else
{
__$i208 = this.elem;
}

if (__$i208)
{
__$i211 = this;
__$i212 = "position";
__$i215 = this.position;
if (__$i215)
{
__$i222 = __$i215;
}
 else
{
__$i222 = 0;
}

__$i235 = __$i211[__$i212] = __$i222 + 1;
}
 else
{
__$i235 = this._listLength--;
}

return apply.call(__this,__$fn54);
}

function $e(__$callback) {
throw new Error();
}

return exports;
}
)(typeof exports === "undefined" ? {
} : exports);
;
return function (options) {
if (! options)
options = {
};
cache = options.cache;
return xjst.apply.call([this]);
}
;
}
)();
typeof exports === "undefined" || (exports.BEMHTML = BEMHTML);
