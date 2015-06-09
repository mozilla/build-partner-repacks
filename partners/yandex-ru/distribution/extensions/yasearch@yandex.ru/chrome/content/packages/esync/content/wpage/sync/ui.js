(function(a,b){function cy(a){return f.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}
function cu(a){if(!cj[a]){var b=c.body,d=f("<"+a+">").appendTo(b),e=d.css("display");d.remove();if(e==="none"||e===""){
ck||(ck=c.createElement("iframe"),ck.frameBorder=ck.width=ck.height=0),b.appendChild(ck);if(!cl||!ck.createElement)cl=(ck.contentWindow||ck.contentDocument).document,
cl.write((f.support.boxModel?"<!doctype html>":"")+"<html><body>"),cl.close();d=cl.createElement(a),cl.body.appendChild(d),
e=f.css(d,"display"),b.removeChild(ck)}cj[a]=e}return cj[a]}function ct(a,b){var c={};f.each(cp.concat.apply([],cp.slice(0,b)),function(){
c[this]=a});return c}function cs(){cq=b}function cr(){setTimeout(cs,0);return cq=f.now()}function ci(){
try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function ch(){try{return new a.XMLHttpRequest;
}catch(b){}}function cb(a,c){a.dataFilter&&(c=a.dataFilter(c,a.dataType));var d=a.dataTypes,e={},g,h,i=d.length,j,k=d[0],l,m,n,o,p;
for(g=1;g<i;g++){if(g===1)for(h in a.converters)typeof h=="string"&&(e[h.toLowerCase()]=a.converters[h]);
l=k,k=d[g];if(k==="*")k=l;else if(l!=="*"&&l!==k){m=l+" "+k,n=e[m]||e["* "+k];if(!n){p=b;for(o in e){
j=o.split(" ");if(j[0]===l||j[0]==="*"){p=e[j[1]+" "+k];if(p){o=e[o],o===!0?n=p:p===!0&&(n=o);break}}
}}!n&&!p&&f.error("No conversion from "+m.replace(" "," to ")),n!==!0&&(c=n?n(c):p(o(c)))}}return c}function ca(a,c,d){
var e=a.contents,f=a.dataTypes,g=a.responseFields,h,i,j,k;for(i in g)i in d&&(c[g[i]]=d[i]);while(f[0]==="*")f.shift(),
h===b&&(h=a.mimeType||c.getResponseHeader("content-type"));if(h)for(i in e)if(e[i]&&e[i].test(h)){f.unshift(i);
break}if(f[0]in d)j=f[0];else{for(i in d){if(!f[0]||a.converters[i+" "+f[0]]){j=i;break}k||(k=i)}j=j||k;
}if(j){j!==f[0]&&f.unshift(j);return d[j]}}function b_(a,b,c,d){if(f.isArray(b))f.each(b,function(b,e){
c||bD.test(a)?d(a,e):b_(a+"["+(typeof e=="object"?b:"")+"]",e,c,d)});else if(!c&&f.type(b)==="object")for(var e in b)b_(a+"["+e+"]",b[e],c,d);else d(a,b);
}function b$(a,c){var d,e,g=f.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((g[d]?a:e||(e={}))[d]=c[d]);
e&&f.extend(!0,a,e)}function bZ(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h=a[f],i=0,j=h?h.length:0,k=a===bS,l;
for(;i<j&&(k||!l);i++)l=h[i](c,d,e),typeof l=="string"&&(!k||g[l]?l=b:(c.dataTypes.unshift(l),l=bZ(a,c,d,e,l,g)));
(k||!l)&&!g["*"]&&(l=bZ(a,c,d,e,"*",g));return l}function bY(a){return function(b,c){typeof b!="string"&&(c=b,
b="*");if(f.isFunction(c)){var d=b.toLowerCase().split(bO),e=0,g=d.length,h,i,j;for(;e<g;e++)h=d[e],j=/^\+/.test(h),
j&&(h=h.substr(1)||"*"),i=a[h]=a[h]||[],i[j?"unshift":"push"](c)}}}function bB(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=b==="width"?1:0,g=4;
if(d>0){if(c!=="border")for(;e<g;e+=2)c||(d-=parseFloat(f.css(a,"padding"+bx[e]))||0),c==="margin"?d+=parseFloat(f.css(a,c+bx[e]))||0:d-=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0;
return d+"px"}d=by(a,b);if(d<0||d==null)d=a.style[b];if(bt.test(d))return d;d=parseFloat(d)||0;if(c)for(;e<g;e+=2)d+=parseFloat(f.css(a,"padding"+bx[e]))||0,
c!=="padding"&&(d+=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0),c==="margin"&&(d+=parseFloat(f.css(a,c+bx[e]))||0);
return d+"px"}function bo(a){var b=c.createElement("div");bh.appendChild(b),b.innerHTML=a.outerHTML;return b.firstChild;
}function bn(a){var b=(a.nodeName||"").toLowerCase();b==="input"?bm(a):b!=="script"&&typeof a.getElementsByTagName!="undefined"&&f.grep(a.getElementsByTagName("input"),bm);
}function bm(a){if(a.type==="checkbox"||a.type==="radio")a.defaultChecked=a.checked}function bl(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[];
}function bk(a,b){var c;b.nodeType===1&&(b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),
c=b.nodeName.toLowerCase(),c==="object"?b.outerHTML=a.outerHTML:c!=="input"||a.type!=="checkbox"&&a.type!=="radio"?c==="option"?b.selected=a.defaultSelected:c==="input"||c==="textarea"?b.defaultValue=a.defaultValue:c==="script"&&b.text!==a.text&&(b.text=a.text):(a.checked&&(b.defaultChecked=b.checked=a.checked),
b.value!==a.value&&(b.value=a.value)),b.removeAttribute(f.expando),b.removeAttribute("_submit_attached"),
b.removeAttribute("_change_attached"))}function bj(a,b){if(b.nodeType===1&&!!f.hasData(a)){var c,d,e,g=f._data(a),h=f._data(b,g),i=g.events;
if(i){delete h.handle,h.events={};for(c in i)for(d=0,e=i[c].length;d<e;d++)f.event.add(b,c,i[c][d])}h.data&&(h.data=f.extend({},h.data));
}}function bi(a,b){return f.nodeName(a,"table")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a;
}function U(a){var b=V.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());
return c}function T(a,b,c){b=b||0;if(f.isFunction(b))return f.grep(a,function(a,d){var e=!!b.call(a,d,a);
return e===c});if(b.nodeType)return f.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){
var d=f.grep(a,function(a){return a.nodeType===1});if(O.test(b))return f.filter(b,d,!c);b=f.filter(b,d);
}return f.grep(a,function(a,d){return f.inArray(a,b)>=0===c})}function S(a){return!a||!a.parentNode||a.parentNode.nodeType===11;
}function K(){return!0}function J(){return!1}function n(a,b,c){var d=b+"defer",e=b+"queue",g=b+"mark",h=f._data(a,d);
h&&(c==="queue"||!f._data(a,e))&&(c==="mark"||!f._data(a,g))&&setTimeout(function(){!f._data(a,e)&&!f._data(a,g)&&(f.removeData(a,d,!0),
h.fire())},0)}function m(a){for(var b in a){if(b==="data"&&f.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1;
}return!0}function l(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(k,"-$1").toLowerCase();d=a.getAttribute(e);
if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:f.isNumeric(d)?+d:j.test(d)?f.parseJSON(d):d;
}catch(g){}f.data(a,c,d)}else d=b}return d}function h(a){var b=g[a]={},c,d;a=a.split(/\s+/);for(c=0,d=a.length;c<d;c++)b[a[c]]=!0;
return b}var c=a.document,d=a.navigator,e=a.location,f=function(){function J(){if(!e.isReady){try{c.documentElement.doScroll("left");
}catch(a){setTimeout(J,1);return}e.ready()}}var e=function(a,b){return new e.fn.init(a,b,h)},f=a.jQuery,g=a.$,h,i=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,j=/\S/,k=/^\s+/,l=/\s+$/,m=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,n=/^[\],:{}\s]*$/,o=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,p=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,q=/(?:^|:|,)(?:\s*\[)+/g,r=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,t=/(msie) ([\w.]+)/,u=/(mozilla)(?:.*? rv:([\w.]+))?/,v=/-([a-z]|[0-9])/gi,w=/^-ms-/,x=function(a,b){
return(b+"").toUpperCase()},y=d.userAgent,z,A,B,C=Object.prototype.toString,D=Object.prototype.hasOwnProperty,E=Array.prototype.push,F=Array.prototype.slice,G=String.prototype.trim,H=Array.prototype.indexOf,I={};
e.fn=e.prototype={constructor:e,init:function(a,d,f){var g,h,j,k;if(!a)return this;if(a.nodeType){this.context=this[0]=a,
this.length=1;return this}if(a==="body"&&!d&&c.body){this.context=c,this[0]=c.body,this.selector=a,this.length=1;
return this}if(typeof a=="string"){a.charAt(0)!=="<"||a.charAt(a.length-1)!==">"||a.length<3?g=i.exec(a):g=[null,a,null];
if(g&&(g[1]||!d)){if(g[1]){d=d instanceof e?d[0]:d,k=d?d.ownerDocument||d:c,j=m.exec(a),j?e.isPlainObject(d)?(a=[c.createElement(j[1])],
e.fn.attr.call(a,d,!0)):a=[k.createElement(j[1])]:(j=e.buildFragment([g[1]],[k]),a=(j.cacheable?e.clone(j.fragment):j.fragment).childNodes);
return e.merge(this,a)}h=c.getElementById(g[2]);if(h&&h.parentNode){if(h.id!==g[2])return f.find(a);this.length=1,
this[0]=h}this.context=c,this.selector=a;return this}return!d||d.jquery?(d||f).find(a):this.constructor(d).find(a);
}if(e.isFunction(a))return f.ready(a);a.selector!==b&&(this.selector=a.selector,this.context=a.context);
return e.makeArray(a,this)},selector:"",jquery:"1.7.2",length:0,size:function(){return this.length},toArray:function(){
return F.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},
pushStack:function(a,b,c){var d=this.constructor();e.isArray(a)?E.apply(d,a):e.merge(d,a),d.prevObject=this,
d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")");
return d},each:function(a,b){return e.each(this,a,b)},ready:function(a){e.bindReady(),A.add(a);return this;
},eq:function(a){a=+a;return a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0);
},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(F.apply(this,arguments),"slice",F.call(arguments).join(","));
},map:function(a){return this.pushStack(e.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){
return this.prevObject||this.constructor(null)},push:E,sort:[].sort,splice:[].splice},e.fn.init.prototype=e.fn,
e.extend=e.fn.extend=function(){var a,c,d,f,g,h,i=arguments[0]||{},j=1,k=arguments.length,l=!1;typeof i=="boolean"&&(l=i,
i=arguments[1]||{},j=2),typeof i!="object"&&!e.isFunction(i)&&(i={}),k===j&&(i=this,--j);for(;j<k;j++)if((a=arguments[j])!=null)for(c in a){
d=i[c],f=a[c];if(i===f)continue;l&&f&&(e.isPlainObject(f)||(g=e.isArray(f)))?(g?(g=!1,h=d&&e.isArray(d)?d:[]):h=d&&e.isPlainObject(d)?d:{},
i[c]=e.extend(l,h,f)):f!==b&&(i[c]=f)}return i},e.extend({noConflict:function(b){a.$===e&&(a.$=g),b&&a.jQuery===e&&(a.jQuery=f);
return e},isReady:!1,readyWait:1,holdReady:function(a){a?e.readyWait++:e.ready(!0)},ready:function(a){
if(a===!0&&!--e.readyWait||a!==!0&&!e.isReady){if(!c.body)return setTimeout(e.ready,1);e.isReady=!0;if(a!==!0&&--e.readyWait>0)return;
A.fireWith(c,[e]),e.fn.trigger&&e(c).trigger("ready").off("ready")}},bindReady:function(){if(!A){A=e.Callbacks("once memory");
if(c.readyState==="complete")return setTimeout(e.ready,1);if(c.addEventListener)c.addEventListener("DOMContentLoaded",B,!1),
a.addEventListener("load",e.ready,!1);else if(c.attachEvent){c.attachEvent("onreadystatechange",B),a.attachEvent("onload",e.ready);
var b=!1;try{b=a.frameElement==null}catch(d){}c.documentElement.doScroll&&b&&J()}}},isFunction:function(a){
return e.type(a)==="function"},isArray:Array.isArray||function(a){return e.type(a)==="array"},isWindow:function(a){
return a!=null&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){
return a==null?String(a):I[C.call(a)]||"object"},isPlainObject:function(a){if(!a||e.type(a)!=="object"||a.nodeType||e.isWindow(a))return!1;
try{if(a.constructor&&!D.call(a,"constructor")&&!D.call(a.constructor.prototype,"isPrototypeOf"))return!1;
}catch(c){return!1}var d;for(d in a);return d===b||D.call(a,d)},isEmptyObject:function(a){for(var b in a)return!1;
return!0},error:function(a){throw new Error(a)},parseJSON:function(b){if(typeof b!="string"||!b)return null;
b=e.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(n.test(b.replace(o,"@").replace(p,"]").replace(q,"")))return new Function("return "+b)();
e.error("Invalid JSON: "+b)},parseXML:function(c){if(typeof c!="string"||!c)return null;var d,f;try{a.DOMParser?(f=new DOMParser,
d=f.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c));
}catch(g){d=b}(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&e.error("Invalid XML: "+c);
return d},noop:function(){},globalEval:function(b){b&&j.test(b)&&(a.execScript||function(b){a.eval.call(a,b);
})(b)},camelCase:function(a){return a.replace(w,"ms-").replace(v,x)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase();
},each:function(a,c,d){var f,g=0,h=a.length,i=h===b||e.isFunction(a);if(d){if(i){for(f in a)if(c.apply(a[f],d)===!1)break;
}else for(;g<h;)if(c.apply(a[g++],d)===!1)break}else if(i){for(f in a)if(c.call(a[f],f,a[f])===!1)break;
}else for(;g<h;)if(c.call(a[g],g,a[g++])===!1)break;return a},trim:G?function(a){return a==null?"":G.call(a);
}:function(a){return a==null?"":(a+"").replace(k,"").replace(l,"")},makeArray:function(a,b){var c=b||[];
if(a!=null){var d=e.type(a);a.length==null||d==="string"||d==="function"||d==="regexp"||e.isWindow(a)?E.call(c,a):e.merge(c,a);
}return c},inArray:function(a,b,c){var d;if(b){if(H)return H.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;
for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=a.length,e=0;if(typeof c.length=="number")for(var f=c.length;e<f;e++)a[d++]=c[e];else while(c[e]!==b)a[d++]=c[e++];
a.length=d;return a},grep:function(a,b,c){var d=[],e;c=!!c;for(var f=0,g=a.length;f<g;f++)e=!!b(a[f],f),
c!==e&&d.push(a[f]);return d},map:function(a,c,d){var f,g,h=[],i=0,j=a.length,k=a instanceof e||j!==b&&typeof j=="number"&&(j>0&&a[0]&&a[j-1]||j===0||e.isArray(a));
if(k)for(;i<j;i++)f=c(a[i],i,d),f!=null&&(h[h.length]=f);else for(g in a)f=c(a[g],g,d),f!=null&&(h[h.length]=f);
return h.concat.apply([],h)},guid:1,proxy:function(a,c){if(typeof c=="string"){var d=a[c];c=a,a=d}if(!e.isFunction(a))return b;
var f=F.call(arguments,2),g=function(){return a.apply(c,f.concat(F.call(arguments)))};g.guid=a.guid=a.guid||g.guid||e.guid++;
return g},access:function(a,c,d,f,g,h,i){var j,k=d==null,l=0,m=a.length;if(d&&typeof d=="object"){for(l in d)e.access(a,c,l,d[l],1,h,f);
g=1}else if(f!==b){j=i===b&&e.isFunction(f),k&&(j?(j=c,c=function(a,b,c){return j.call(e(a),c)}):(c.call(a,f),
c=null));if(c)for(;l<m;l++)c(a[l],d,j?f.call(a[l],l,c(a[l],d)):f,i);g=1}return g?a:k?c.call(a):m?c(a[0],d):h;
},now:function(){return(new Date).getTime()},uaMatch:function(a){a=a.toLowerCase();var b=r.exec(a)||s.exec(a)||t.exec(a)||a.indexOf("compatible")<0&&u.exec(a)||[];
return{browser:b[1]||"",version:b[2]||"0"}},sub:function(){function a(b,c){return new a.fn.init(b,c)}
e.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function(d,f){
f&&f instanceof e&&!(f instanceof a)&&(f=a(f));return e.fn.init.call(this,d,f,b)},a.fn.init.prototype=a.fn;
var b=a(c);return a},browser:{}}),e.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){
I["[object "+b+"]"]=b.toLowerCase()}),z=e.uaMatch(y),z.browser&&(e.browser[z.browser]=!0,e.browser.version=z.version),
e.browser.webkit&&(e.browser.safari=!0),j.test(" ")&&(k=/^[\s\xA0]+/,l=/[\s\xA0]+$/),h=e(c),c.addEventListener?B=function(){
c.removeEventListener("DOMContentLoaded",B,!1),e.ready()}:c.attachEvent&&(B=function(){c.readyState==="complete"&&(c.detachEvent("onreadystatechange",B),
e.ready())});return e}(),g={};f.Callbacks=function(a){a=a?g[a]||h(a):{};var c=[],d=[],e,i,j,k,l,m,n=function(b){
var d,e,g,h,i;for(d=0,e=b.length;d<e;d++)g=b[d],h=f.type(g),h==="array"?n(g):h==="function"&&(!a.unique||!p.has(g))&&c.push(g);
},o=function(b,f){f=f||[],e=!a.memory||[b,f],i=!0,j=!0,m=k||0,k=0,l=c.length;for(;c&&m<l;m++)if(c[m].apply(b,f)===!1&&a.stopOnFalse){
e=!0;break}j=!1,c&&(a.once?e===!0?p.disable():c=[]:d&&d.length&&(e=d.shift(),p.fireWith(e[0],e[1])))},p={
add:function(){if(c){var a=c.length;n(arguments),j?l=c.length:e&&e!==!0&&(k=a,o(e[0],e[1]))}return this;
},remove:function(){if(c){var b=arguments,d=0,e=b.length;for(;d<e;d++)for(var f=0;f<c.length;f++)if(b[d]===c[f]){
j&&f<=l&&(l--,f<=m&&m--),c.splice(f--,1);if(a.unique)break}}return this},has:function(a){if(c){var b=0,d=c.length;
for(;b<d;b++)if(a===c[b])return!0}return!1},empty:function(){c=[];return this},disable:function(){c=d=e=b;
return this},disabled:function(){return!c},lock:function(){d=b,(!e||e===!0)&&p.disable();return this},
locked:function(){return!d},fireWith:function(b,c){d&&(j?a.once||d.push([b,c]):(!a.once||!e)&&o(b,c));
return this},fire:function(){p.fireWith(this,arguments);return this},fired:function(){return!!i}};return p;
};var i=[].slice;f.extend({Deferred:function(a){var b=f.Callbacks("once memory"),c=f.Callbacks("once memory"),d=f.Callbacks("memory"),e="pending",g={
resolve:b,reject:c,notify:d},h={done:b.add,fail:c.add,progress:d.add,state:function(){return e},isResolved:b.fired,
isRejected:c.fired,then:function(a,b,c){i.done(a).fail(b).progress(c);return this},always:function(){
i.done.apply(i,arguments).fail.apply(i,arguments);return this},pipe:function(a,b,c){return f.Deferred(function(d){
f.each({done:[a,"resolve"],fail:[b,"reject"],progress:[c,"notify"]},function(a,b){var c=b[0],e=b[1],g;
f.isFunction(c)?i[a](function(){g=c.apply(this,arguments),g&&f.isFunction(g.promise)?g.promise().then(d.resolve,d.reject,d.notify):d[e+"With"](this===i?d:this,[g]);
}):i[a](d[e])})}).promise()},promise:function(a){if(a==null)a=h;else for(var b in h)a[b]=h[b];return a;
}},i=h.promise({}),j;for(j in g)i[j]=g[j].fire,i[j+"With"]=g[j].fireWith;i.done(function(){e="resolved";
},c.disable,d.lock).fail(function(){e="rejected"},b.disable,d.lock),a&&a.call(i,i);return i},when:function(a){
function m(a){return function(b){e[a]=arguments.length>1?i.call(arguments,0):b,j.notifyWith(k,e)}}function l(a){
return function(c){b[a]=arguments.length>1?i.call(arguments,0):c,--g||j.resolveWith(j,b)}}var b=i.call(arguments,0),c=0,d=b.length,e=Array(d),g=d,h=d,j=d<=1&&a&&f.isFunction(a.promise)?a:f.Deferred(),k=j.promise();
if(d>1){for(;c<d;c++)b[c]&&b[c].promise&&f.isFunction(b[c].promise)?b[c].promise().then(l(c),j.reject,m(c)):--g;
g||j.resolveWith(j,b)}else j!==a&&j.resolveWith(j,d?[a]:[]);return k}}),f.support=function(){var b,d,e,g,h,i,j,k,l,m,n,o,p=c.createElement("div"),q=c.documentElement;
p.setAttribute("className","t"),p.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>",
d=p.getElementsByTagName("*"),e=p.getElementsByTagName("a")[0];if(!d||!d.length||!e)return{};g=c.createElement("select"),
h=g.appendChild(c.createElement("option")),i=p.getElementsByTagName("input")[0],b={leadingWhitespace:p.firstChild.nodeType===3,
tbody:!p.getElementsByTagName("tbody").length,htmlSerialize:!!p.getElementsByTagName("link").length,style:/top/.test(e.getAttribute("style")),
hrefNormalized:e.getAttribute("href")==="/a",opacity:/^0.55/.test(e.style.opacity),cssFloat:!!e.style.cssFloat,
checkOn:i.value==="on",optSelected:h.selected,getSetAttribute:p.className!=="t",enctype:!!c.createElement("form").enctype,
html5Clone:c.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",submitBubbles:!0,changeBubbles:!0,
focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,
pixelMargin:!0},f.boxModel=b.boxModel=c.compatMode==="CSS1Compat",i.checked=!0,b.noCloneChecked=i.cloneNode(!0).checked,
g.disabled=!0,b.optDisabled=!h.disabled;try{delete p.test}catch(r){b.deleteExpando=!1}!p.addEventListener&&p.attachEvent&&p.fireEvent&&(p.attachEvent("onclick",function(){
b.noCloneEvent=!1}),p.cloneNode(!0).fireEvent("onclick")),i=c.createElement("input"),i.value="t",i.setAttribute("type","radio"),
b.radioValue=i.value==="t",i.setAttribute("checked","checked"),i.setAttribute("name","t"),p.appendChild(i),
j=c.createDocumentFragment(),j.appendChild(p.lastChild),b.checkClone=j.cloneNode(!0).cloneNode(!0).lastChild.checked,
b.appendChecked=i.checked,j.removeChild(i),j.appendChild(p);if(p.attachEvent)for(n in{submit:1,change:1,
focusin:1})m="on"+n,o=m in p,o||(p.setAttribute(m,"return;"),o=typeof p[m]=="function"),b[n+"Bubbles"]=o;
j.removeChild(p),j=g=h=p=i=null,f(function(){var d,e,g,h,i,j,l,m,n,q,r,s,t,u=c.getElementsByTagName("body")[0];
!u||(m=1,t="padding:0;margin:0;border:",r="position:absolute;top:0;left:0;width:1px;height:1px;",s=t+"0;visibility:hidden;",
n="style='"+r+t+"5px solid #000;",q="<div "+n+"display:block;'><div style='"+t+"0;display:block;overflow:hidden;'></div></div>"+"<table "+n+"' cellpadding='0' cellspacing='0'>"+"<tr><td></td></tr></table>",
d=c.createElement("div"),d.style.cssText=s+"width:0;height:0;position:static;top:0;margin-top:"+m+"px",
u.insertBefore(d,u.firstChild),p=c.createElement("div"),d.appendChild(p),p.innerHTML="<table><tr><td style='"+t+"0;display:none'></td><td>t</td></tr></table>",
k=p.getElementsByTagName("td"),o=k[0].offsetHeight===0,k[0].style.display="",k[1].style.display="none",
b.reliableHiddenOffsets=o&&k[0].offsetHeight===0,a.getComputedStyle&&(p.innerHTML="",l=c.createElement("div"),
l.style.width="0",l.style.marginRight="0",p.style.width="2px",p.appendChild(l),b.reliableMarginRight=(parseInt((a.getComputedStyle(l,null)||{
marginRight:0}).marginRight,10)||0)===0),typeof p.style.zoom!="undefined"&&(p.innerHTML="",p.style.width=p.style.padding="1px",
p.style.border=0,p.style.overflow="hidden",p.style.display="inline",p.style.zoom=1,b.inlineBlockNeedsLayout=p.offsetWidth===3,
p.style.display="block",p.style.overflow="visible",p.innerHTML="<div style='width:5px;'></div>",b.shrinkWrapBlocks=p.offsetWidth!==3),
p.style.cssText=r+s,p.innerHTML=q,e=p.firstChild,g=e.firstChild,i=e.nextSibling.firstChild.firstChild,
j={doesNotAddBorder:g.offsetTop!==5,doesAddBorderForTableAndCells:i.offsetTop===5},g.style.position="fixed",
g.style.top="20px",j.fixedPosition=g.offsetTop===20||g.offsetTop===15,g.style.position=g.style.top="",
e.style.overflow="hidden",e.style.position="relative",j.subtractsBorderForOverflowNotVisible=g.offsetTop===-5,
j.doesNotIncludeMarginInBodyOffset=u.offsetTop!==m,a.getComputedStyle&&(p.style.marginTop="1%",b.pixelMargin=(a.getComputedStyle(p,null)||{
marginTop:0}).marginTop!=="1%"),typeof d.style.zoom!="undefined"&&(d.style.zoom=1),u.removeChild(d),l=p=d=null,
f.extend(b,j))});return b}();var j=/^(?:\{.*\}|\[.*\])$/,k=/([A-Z])/g;f.extend({cache:{},uuid:0,expando:"jQuery"+(f.fn.jquery+Math.random()).replace(/\D/g,""),
noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){a=a.nodeType?f.cache[a[f.expando]]:a[f.expando];
return!!a&&!m(a)},data:function(a,c,d,e){if(!!f.acceptData(a)){var g,h,i,j=f.expando,k=typeof c=="string",l=a.nodeType,m=l?f.cache:a,n=l?a[j]:a[j]&&j,o=c==="events";
if((!n||!m[n]||!o&&!e&&!m[n].data)&&k&&d===b)return;n||(l?a[j]=n=++f.uuid:n=j),m[n]||(m[n]={},l||(m[n].toJSON=f.noop));
if(typeof c=="object"||typeof c=="function")e?m[n]=f.extend(m[n],c):m[n].data=f.extend(m[n].data,c);g=h=m[n],
e||(h.data||(h.data={}),h=h.data),d!==b&&(h[f.camelCase(c)]=d);if(o&&!h[c])return g.events;k?(i=h[c],
i==null&&(i=h[f.camelCase(c)])):i=h;return i}},removeData:function(a,b,c){if(!!f.acceptData(a)){var d,e,g,h=f.expando,i=a.nodeType,j=i?f.cache:a,k=i?a[h]:h;
if(!j[k])return;if(b){d=c?j[k]:j[k].data;if(d){f.isArray(b)||(b in d?b=[b]:(b=f.camelCase(b),b in d?b=[b]:b=b.split(" ")));
for(e=0,g=b.length;e<g;e++)delete d[b[e]];if(!(c?m:f.isEmptyObject)(d))return}}if(!c){delete j[k].data;
if(!m(j[k]))return}f.support.deleteExpando||!j.setInterval?delete j[k]:j[k]=null,i&&(f.support.deleteExpando?delete a[h]:a.removeAttribute?a.removeAttribute(h):a[h]=null);
}},_data:function(a,b,c){return f.data(a,b,c,!0)},acceptData:function(a){if(a.nodeName){var b=f.noData[a.nodeName.toLowerCase()];
if(b)return b!==!0&&a.getAttribute("classid")===b}return!0}}),f.fn.extend({data:function(a,c){var d,e,g,h,i,j=this[0],k=0,m=null;
if(a===b){if(this.length){m=f.data(j);if(j.nodeType===1&&!f._data(j,"parsedAttrs")){g=j.attributes;for(i=g.length;k<i;k++)h=g[k].name,
h.indexOf("data-")===0&&(h=f.camelCase(h.substring(5)),l(j,h,m[h]));f._data(j,"parsedAttrs",!0)}}return m;
}if(typeof a=="object")return this.each(function(){f.data(this,a)});d=a.split(".",2),d[1]=d[1]?"."+d[1]:"",
e=d[1]+"!";return f.access(this,function(c){if(c===b){m=this.triggerHandler("getData"+e,[d[0]]),m===b&&j&&(m=f.data(j,a),
m=l(j,a,m));return m===b&&d[1]?this.data(d[0]):m}d[1]=c,this.each(function(){var b=f(this);b.triggerHandler("setData"+e,d),
f.data(this,a,c),b.triggerHandler("changeData"+e,d)})},null,c,arguments.length>1,null,!1)},removeData:function(a){
return this.each(function(){f.removeData(this,a)})}}),f.extend({_mark:function(a,b){a&&(b=(b||"fx")+"mark",
f._data(a,b,(f._data(a,b)||0)+1))},_unmark:function(a,b,c){a!==!0&&(c=b,b=a,a=!1);if(b){c=c||"fx";var d=c+"mark",e=a?0:(f._data(b,d)||1)-1;
e?f._data(b,d,e):(f.removeData(b,d,!0),n(b,c,"mark"))}},queue:function(a,b,c){var d;if(a){b=(b||"fx")+"queue",
d=f._data(a,b),c&&(!d||f.isArray(c)?d=f._data(a,b,f.makeArray(c)):d.push(c));return d||[]}},dequeue:function(a,b){
b=b||"fx";var c=f.queue(a,b),d=c.shift(),e={};d==="inprogress"&&(d=c.shift()),d&&(b==="fx"&&c.unshift("inprogress"),
f._data(a,b+".run",e),d.call(a,function(){f.dequeue(a,b)},e)),c.length||(f.removeData(a,b+"queue "+b+".run",!0),
n(a,b,"queue"))}}),f.fn.extend({queue:function(a,c){var d=2;typeof a!="string"&&(c=a,a="fx",d--);if(arguments.length<d)return f.queue(this[0],a);
return c===b?this:this.each(function(){var b=f.queue(this,a,c);a==="fx"&&b[0]!=="inprogress"&&f.dequeue(this,a);
})},dequeue:function(a){return this.each(function(){f.dequeue(this,a)})},delay:function(a,b){a=f.fx?f.fx.speeds[a]||a:a,
b=b||"fx";return this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}});
},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){function m(){--h||d.resolveWith(e,[e]);
}typeof a!="string"&&(c=a,a=b),a=a||"fx";var d=f.Deferred(),e=this,g=e.length,h=1,i=a+"defer",j=a+"queue",k=a+"mark",l;
while(g--)if(l=f.data(e[g],i,b,!0)||(f.data(e[g],j,b,!0)||f.data(e[g],k,b,!0))&&f.data(e[g],i,f.Callbacks("once memory"),!0))h++,
l.add(m);m();return d.promise(c)}});var o=/[\n\t\r]/g,p=/\s+/,q=/\r/g,r=/^(?:button|input)$/i,s=/^(?:button|input|object|select|textarea)$/i,t=/^a(?:rea)?$/i,u=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,v=f.support.getSetAttribute,w,x,y;
f.fn.extend({attr:function(a,b){return f.access(this,f.attr,a,b,arguments.length>1)},removeAttr:function(a){
return this.each(function(){f.removeAttr(this,a)})},prop:function(a,b){return f.access(this,f.prop,a,b,arguments.length>1);
},removeProp:function(a){a=f.propFix[a]||a;return this.each(function(){try{this[a]=b,delete this[a]}catch(c){}
})},addClass:function(a){var b,c,d,e,g,h,i;if(f.isFunction(a))return this.each(function(b){f(this).addClass(a.call(this,b,this.className));
});if(a&&typeof a=="string"){b=a.split(p);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{
g=" "+e.className+" ";for(h=0,i=b.length;h<i;h++)~g.indexOf(" "+b[h]+" ")||(g+=b[h]+" ");e.className=f.trim(g);
}}}return this},removeClass:function(a){var c,d,e,g,h,i,j;if(f.isFunction(a))return this.each(function(b){
f(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(p);
for(d=0,e=this.length;d<e;d++){g=this[d];if(g.nodeType===1&&g.className)if(a){h=(" "+g.className+" ").replace(o," ");
for(i=0,j=c.length;i<j;i++)h=h.replace(" "+c[i]+" "," ");g.className=f.trim(h)}else g.className=""}}return this;
},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";if(f.isFunction(a))return this.each(function(c){
f(this).toggleClass(a.call(this,c,this.className,b),b)});return this.each(function(){if(c==="string"){
var e,g=0,h=f(this),i=b,j=a.split(p);while(e=j[g++])i=d?i:!h.hasClass(e),h[i?"addClass":"removeClass"](e);
}else if(c==="undefined"||c==="boolean")this.className&&f._data(this,"__className__",this.className),
this.className=this.className||a===!1?"":f._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;
for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(o," ").indexOf(b)>-1)return!0;
return!1},val:function(a){var c,d,e,g=this[0];{if(!!arguments.length){e=f.isFunction(a);return this.each(function(d){
var g=f(this),h;if(this.nodeType===1){e?h=a.call(this,d,g.val()):h=a,h==null?h="":typeof h=="number"?h+="":f.isArray(h)&&(h=f.map(h,function(a){
return a==null?"":a+""})),c=f.valHooks[this.type]||f.valHooks[this.nodeName.toLowerCase()];if(!c||!("set"in c)||c.set(this,h,"value")===b)this.value=h;
}})}if(g){c=f.valHooks[g.type]||f.valHooks[g.nodeName.toLowerCase()];if(c&&"get"in c&&(d=c.get(g,"value"))!==b)return d;
d=g.value;return typeof d=="string"?d.replace(q,""):d==null?"":d}}}}),f.extend({valHooks:{option:{get:function(a){
var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,g=a.selectedIndex,h=[],i=a.options,j=a.type==="select-one";
if(g<0)return null;c=j?g:0,d=j?g+1:i.length;for(;c<d;c++){e=i[c];if(e.selected&&(f.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!f.nodeName(e.parentNode,"optgroup"))){
b=f(e).val();if(j)return b;h.push(b)}}if(j&&!h.length&&i.length)return f(i[g]).val();return h},set:function(a,b){
var c=f.makeArray(b);f(a).find("option").each(function(){this.selected=f.inArray(f(this).val(),c)>=0}),
c.length||(a.selectedIndex=-1);return c}}},attrFn:{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,
offset:!0},attr:function(a,c,d,e){var g,h,i,j=a.nodeType;if(!!a&&j!==3&&j!==8&&j!==2){if(e&&c in f.attrFn)return f(a)[c](d);
if(typeof a.getAttribute=="undefined")return f.prop(a,c,d);i=j!==1||!f.isXMLDoc(a),i&&(c=c.toLowerCase(),
h=f.attrHooks[c]||(u.test(c)?x:w));if(d!==b){if(d===null){f.removeAttr(a,c);return}if(h&&"set"in h&&i&&(g=h.set(a,d,c))!==b)return g;
a.setAttribute(c,""+d);return d}if(h&&"get"in h&&i&&(g=h.get(a,c))!==null)return g;g=a.getAttribute(c);
return g===null?b:g}},removeAttr:function(a,b){var c,d,e,g,h,i=0;if(b&&a.nodeType===1){d=b.toLowerCase().split(p),
g=d.length;for(;i<g;i++)e=d[i],e&&(c=f.propFix[e]||e,h=u.test(e),h||f.attr(a,e,""),a.removeAttribute(v?e:c),
h&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(r.test(a.nodeName)&&a.parentNode)f.error("type property can't be changed");else if(!f.support.radioValue&&b==="radio"&&f.nodeName(a,"input")){
var c=a.value;a.setAttribute("type",b),c&&(a.value=c);return b}}},value:{get:function(a,b){if(w&&f.nodeName(a,"button"))return w.get(a,b);
return b in a?a.value:null},set:function(a,b,c){if(w&&f.nodeName(a,"button"))return w.set(a,b,c);a.value=b;
}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",
cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",
frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,g,h,i=a.nodeType;
if(!!a&&i!==3&&i!==8&&i!==2){h=i!==1||!f.isXMLDoc(a),h&&(c=f.propFix[c]||c,g=f.propHooks[c]);return d!==b?g&&"set"in g&&(e=g.set(a,d,c))!==b?e:a[c]=d:g&&"get"in g&&(e=g.get(a,c))!==null?e:a[c];
}},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):s.test(a.nodeName)||t.test(a.nodeName)&&a.href?0:b;
}}}}),f.attrHooks.tabindex=f.propHooks.tabIndex,x={get:function(a,c){var d,e=f.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b;
},set:function(a,b,c){var d;b===!1?f.removeAttr(a,c):(d=f.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase()));
return c}},v||(y={name:!0,id:!0,coords:!0},w=f.valHooks.button={get:function(a,c){var d;d=a.getAttributeNode(c);
return d&&(y[c]?d.nodeValue!=="":d.specified)?d.nodeValue:b},set:function(a,b,d){var e=a.getAttributeNode(d);
e||(e=c.createAttribute(d),a.setAttributeNode(e));return e.nodeValue=b+""}},f.attrHooks.tabindex.set=w.set,
f.each(["width","height"],function(a,b){f.attrHooks[b]=f.extend(f.attrHooks[b],{set:function(a,c){if(c===""){
a.setAttribute(b,"auto");return c}}})}),f.attrHooks.contenteditable={get:w.get,set:function(a,b,c){b===""&&(b="false"),
w.set(a,b,c)}}),f.support.hrefNormalized||f.each(["href","src","width","height"],function(a,c){f.attrHooks[c]=f.extend(f.attrHooks[c],{
get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),f.support.style||(f.attrHooks.style={
get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=""+b;
}}),f.support.optSelected||(f.propHooks.selected=f.extend(f.propHooks.selected,{get:function(a){var b=a.parentNode;
b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex);return null}})),f.support.enctype||(f.propFix.enctype="encoding"),
f.support.checkOn||f.each(["radio","checkbox"],function(){f.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value;
}}}),f.each(["radio","checkbox"],function(){f.valHooks[this]=f.extend(f.valHooks[this],{set:function(a,b){
if(f.isArray(b))return a.checked=f.inArray(f(a).val(),b)>=0}})});var z=/^(?:textarea|input|select)$/i,A=/^([^\.]*)?(?:\.(.+))?$/,B=/(?:^|\s)hover(\.\S+)?\b/,C=/^key/,D=/^(?:mouse|contextmenu)|click/,E=/^(?:focusinfocus|focusoutblur)$/,F=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,G=function(a){
var b=F.exec(a);b&&(b[1]=(b[1]||"").toLowerCase(),b[3]=b[3]&&new RegExp("(?:^|\\s)"+b[3]+"(?:\\s|$)"));
return b},H=function(a,b){var c=a.attributes||{};return(!b[1]||a.nodeName.toLowerCase()===b[1])&&(!b[2]||(c.id||{}).value===b[2])&&(!b[3]||b[3].test((c["class"]||{}).value));
},I=function(a){return f.event.special.hover?a:a.replace(B,"mouseenter$1 mouseleave$1")};f.event={add:function(a,c,d,e,g){
var h,i,j,k,l,m,n,o,p,q,r,s;if(!(a.nodeType===3||a.nodeType===8||!c||!d||!(h=f._data(a)))){d.handler&&(p=d,
d=p.handler,g=p.selector),d.guid||(d.guid=f.guid++),j=h.events,j||(h.events=j={}),i=h.handle,i||(h.handle=i=function(a){
return typeof f!="undefined"&&(!a||f.event.triggered!==a.type)?f.event.dispatch.apply(i.elem,arguments):b;
},i.elem=a),c=f.trim(I(c)).split(" ");for(k=0;k<c.length;k++){l=A.exec(c[k])||[],m=l[1],n=(l[2]||"").split(".").sort(),
s=f.event.special[m]||{},m=(g?s.delegateType:s.bindType)||m,s=f.event.special[m]||{},o=f.extend({type:m,
origType:l[1],data:e,handler:d,guid:d.guid,selector:g,quick:g&&G(g),namespace:n.join(".")},p),r=j[m];if(!r){
r=j[m]=[],r.delegateCount=0;if(!s.setup||s.setup.call(a,e,n,i)===!1)a.addEventListener?a.addEventListener(m,i,!1):a.attachEvent&&a.attachEvent("on"+m,i);
}s.add&&(s.add.call(a,o),o.handler.guid||(o.handler.guid=d.guid)),g?r.splice(r.delegateCount++,0,o):r.push(o),
f.event.global[m]=!0}a=null}},global:{},remove:function(a,b,c,d,e){var g=f.hasData(a)&&f._data(a),h,i,j,k,l,m,n,o,p,q,r,s;
if(!!g&&!!(o=g.events)){b=f.trim(I(b||"")).split(" ");for(h=0;h<b.length;h++){i=A.exec(b[h])||[],j=k=i[1],
l=i[2];if(!j){for(j in o)f.event.remove(a,j+b[h],c,d,!0);continue}p=f.event.special[j]||{},j=(d?p.delegateType:p.bindType)||j,
r=o[j]||[],m=r.length,l=l?new RegExp("(^|\\.)"+l.split(".").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;
for(n=0;n<r.length;n++)s=r[n],(e||k===s.origType)&&(!c||c.guid===s.guid)&&(!l||l.test(s.namespace))&&(!d||d===s.selector||d==="**"&&s.selector)&&(r.splice(n--,1),
s.selector&&r.delegateCount--,p.remove&&p.remove.call(a,s));r.length===0&&m!==r.length&&((!p.teardown||p.teardown.call(a,l)===!1)&&f.removeEvent(a,j,g.handle),
delete o[j])}f.isEmptyObject(o)&&(q=g.handle,q&&(q.elem=null),f.removeData(a,["events","handle"],!0));
}},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,e,g){if(!e||e.nodeType!==3&&e.nodeType!==8){
var h=c.type||c,i=[],j,k,l,m,n,o,p,q,r,s;if(E.test(h+f.event.triggered))return;h.indexOf("!")>=0&&(h=h.slice(0,-1),
k=!0),h.indexOf(".")>=0&&(i=h.split("."),h=i.shift(),i.sort());if((!e||f.event.customEvent[h])&&!f.event.global[h])return;
c=typeof c=="object"?c[f.expando]?c:new f.Event(h,c):new f.Event(h),c.type=h,c.isTrigger=!0,c.exclusive=k,
c.namespace=i.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+i.join("\\.(?:.*\\.)?")+"(\\.|$)"):null,
o=h.indexOf(":")<0?"on"+h:"";if(!e){j=f.cache;for(l in j)j[l].events&&j[l].events[h]&&f.event.trigger(c,d,j[l].handle.elem,!0);
return}c.result=b,c.target||(c.target=e),d=d!=null?f.makeArray(d):[],d.unshift(c),p=f.event.special[h]||{};
if(p.trigger&&p.trigger.apply(e,d)===!1)return;r=[[e,p.bindType||h]];if(!g&&!p.noBubble&&!f.isWindow(e)){
s=p.delegateType||h,m=E.test(s+h)?e:e.parentNode,n=null;for(;m;m=m.parentNode)r.push([m,s]),n=m;n&&n===e.ownerDocument&&r.push([n.defaultView||n.parentWindow||a,s]);
}for(l=0;l<r.length&&!c.isPropagationStopped();l++)m=r[l][0],c.type=r[l][1],q=(f._data(m,"events")||{})[c.type]&&f._data(m,"handle"),
q&&q.apply(m,d),q=o&&m[o],q&&f.acceptData(m)&&q.apply(m,d)===!1&&c.preventDefault();c.type=h,!g&&!c.isDefaultPrevented()&&(!p._default||p._default.apply(e.ownerDocument,d)===!1)&&(h!=="click"||!f.nodeName(e,"a"))&&f.acceptData(e)&&o&&e[h]&&(h!=="focus"&&h!=="blur"||c.target.offsetWidth!==0)&&!f.isWindow(e)&&(n=e[o],
n&&(e[o]=null),f.event.triggered=h,e[h](),f.event.triggered=b,n&&(e[o]=n));return c.result}},dispatch:function(c){
c=f.event.fix(c||a.event);var d=(f._data(this,"events")||{})[c.type]||[],e=d.delegateCount,g=[].slice.call(arguments,0),h=!c.exclusive&&!c.namespace,i=f.event.special[c.type]||{},j=[],k,l,m,n,o,p,q,r,s,t,u;
g[0]=c,c.delegateTarget=this;if(!i.preDispatch||i.preDispatch.call(this,c)!==!1){if(e&&(!c.button||c.type!=="click")){
n=f(this),n.context=this.ownerDocument||this;for(m=c.target;m!=this;m=m.parentNode||this)if(m.disabled!==!0){
p={},r=[],n[0]=m;for(k=0;k<e;k++)s=d[k],t=s.selector,p[t]===b&&(p[t]=s.quick?H(m,s.quick):n.is(t)),p[t]&&r.push(s);
r.length&&j.push({elem:m,matches:r})}}d.length>e&&j.push({elem:this,matches:d.slice(e)});for(k=0;k<j.length&&!c.isPropagationStopped();k++){
q=j[k],c.currentTarget=q.elem;for(l=0;l<q.matches.length&&!c.isImmediatePropagationStopped();l++){s=q.matches[l];
if(h||!c.namespace&&!s.namespace||c.namespace_re&&c.namespace_re.test(s.namespace))c.data=s.data,c.handleObj=s,
o=((f.event.special[s.origType]||{}).handle||s.handler).apply(q.elem,g),o!==b&&(c.result=o,o===!1&&(c.preventDefault(),
c.stopPropagation()))}}i.postDispatch&&i.postDispatch.call(this,c);return c.result}},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode);
return a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
filter:function(a,d){var e,f,g,h=d.button,i=d.fromElement;a.pageX==null&&d.clientX!=null&&(e=a.target.ownerDocument||c,
f=e.documentElement,g=e.body,a.pageX=d.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),
a.pageY=d.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?d.toElement:i),
!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0);return a}},fix:function(a){if(a[f.expando])return a;var d,e,g=a,h=f.event.fixHooks[a.type]||{},i=h.props?this.props.concat(h.props):this.props;
a=f.Event(g);for(d=i.length;d;)e=i[--d],a[e]=g[e];a.target||(a.target=g.srcElement||c),a.target.nodeType===3&&(a.target=a.target.parentNode),
a.metaKey===b&&(a.metaKey=a.ctrlKey);return h.filter?h.filter(a,g):a},special:{ready:{setup:f.bindReady
},load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){
f.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null);
}}},simulate:function(a,b,c,d){var e=f.extend(new f.Event,c,{type:a,isSimulated:!0,originalEvent:{}});
d?f.event.trigger(e,null,b):f.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},f.event.handle=f.event.dispatch,
f.removeEvent=c.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1);
}:function(a,b,c){a.detachEvent&&a.detachEvent("on"+b,c)},f.Event=function(a,b){if(!(this instanceof f.Event))return new f.Event(a,b);
a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?K:J):this.type=a,
b&&f.extend(this,b),this.timeStamp=a&&a.timeStamp||f.now(),this[f.expando]=!0},f.Event.prototype={preventDefault:function(){
this.isDefaultPrevented=K;var a=this.originalEvent;!a||(a.preventDefault?a.preventDefault():a.returnValue=!1);
},stopPropagation:function(){this.isPropagationStopped=K;var a=this.originalEvent;!a||(a.stopPropagation&&a.stopPropagation(),
a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=K,this.stopPropagation();
},isDefaultPrevented:J,isPropagationStopped:J,isImmediatePropagationStopped:J},f.each({mouseenter:"mouseover",
mouseleave:"mouseout"},function(a,b){f.event.special[a]={delegateType:b,bindType:b,handle:function(a){
var c=this,d=a.relatedTarget,e=a.handleObj,g=e.selector,h;if(!d||d!==c&&!f.contains(c,d))a.type=e.origType,
h=e.handler.apply(this,arguments),a.type=b;return h}}}),f.support.submitBubbles||(f.event.special.submit={
setup:function(){if(f.nodeName(this,"form"))return!1;f.event.add(this,"click._submit keypress._submit",function(a){
var c=a.target,d=f.nodeName(c,"input")||f.nodeName(c,"button")?c.form:b;d&&!d._submit_attached&&(f.event.add(d,"submit._submit",function(a){
a._submit_bubble=!0}),d._submit_attached=!0)})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,
this.parentNode&&!a.isTrigger&&f.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){
if(f.nodeName(this,"form"))return!1;f.event.remove(this,"._submit")}}),f.support.changeBubbles||(f.event.special.change={
setup:function(){if(z.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")f.event.add(this,"propertychange._change",function(a){
a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),f.event.add(this,"click._change",function(a){
this._just_changed&&!a.isTrigger&&(this._just_changed=!1,f.event.simulate("change",this,a,!0))});return!1;
}f.event.add(this,"beforeactivate._change",function(a){var b=a.target;z.test(b.nodeName)&&!b._change_attached&&(f.event.add(b,"change._change",function(a){
this.parentNode&&!a.isSimulated&&!a.isTrigger&&f.event.simulate("change",this.parentNode,a,!0)}),b._change_attached=!0);
})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments);
},teardown:function(){f.event.remove(this,"._change");return z.test(this.nodeName)}}),f.support.focusinBubbles||f.each({
focus:"focusin",blur:"focusout"},function(a,b){var d=0,e=function(a){f.event.simulate(b,a.target,f.event.fix(a),!0);
};f.event.special[b]={setup:function(){d++===0&&c.addEventListener(a,e,!0)},teardown:function(){--d===0&&c.removeEventListener(a,e,!0);
}}}),f.fn.extend({on:function(a,c,d,e,g){var h,i;if(typeof a=="object"){typeof c!="string"&&(d=d||c,c=b);
for(i in a)this.on(i,c,d,a[i],g);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,
d=b):(e=d,d=c,c=b));if(e===!1)e=J;else if(!e)return this;g===1&&(h=e,e=function(a){f().off(a);return h.apply(this,arguments);
},e.guid=h.guid||(h.guid=f.guid++));return this.each(function(){f.event.add(this,a,e,d,c)})},one:function(a,b,c,d){
return this.on(a,b,c,d,1)},off:function(a,c,d){if(a&&a.preventDefault&&a.handleObj){var e=a.handleObj;
f(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler);return this;
}if(typeof a=="object"){for(var g in a)this.off(g,c,a[g]);return this}if(c===!1||typeof c=="function")d=c,
c=b;d===!1&&(d=J);return this.each(function(){f.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c);
},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){f(this.context).on(a,this.selector,b,c);
return this},die:function(a,b){f(this.context).off(a,this.selector||"**",b);return this},delegate:function(a,b,c,d){
return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length==1?this.off(a,"**"):this.off(b,a,c);
},trigger:function(a,b){return this.each(function(){f.event.trigger(a,b,this)})},triggerHandler:function(a,b){
if(this[0])return f.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||f.guid++,d=0,e=function(c){
var e=(f._data(this,"lastToggle"+a.guid)||0)%d;f._data(this,"lastToggle"+a.guid,e+1),c.preventDefault();
return b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},
hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){
f.fn[b]=function(a,c){c==null&&(c=a,a=null);return arguments.length>0?this.on(b,null,a,c):this.trigger(b);
},f.attrFn&&(f.attrFn[b]=!0),C.test(b)&&(f.event.fixHooks[b]=f.event.keyHooks),D.test(b)&&(f.event.fixHooks[b]=f.event.mouseHooks);
}),function(){function x(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];
while(j){if(j[d]===c){k=e[j.sizset];break}if(j.nodeType===1){g||(j[d]=c,j.sizset=h);if(typeof b!="string"){
if(j===b){k=!0;break}}else if(m.filter(b,[j]).length>0){k=j;break}}j=j[a]}e[h]=k}}}function w(a,b,c,e,f,g){
for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break;
}j.nodeType===1&&!g&&(j[d]=c,j.sizset=h);if(j.nodeName.toLowerCase()===b){k=j;break}j=j[a]}e[h]=k}}}var a=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,d="sizcache"+(Math.random()+"").replace(".",""),e=0,g=Object.prototype.toString,h=!1,i=!0,j=/\\/g,k=/\r\n/g,l=/\W/;
[0,0].sort(function(){i=!1;return 0});var m=function(b,d,e,f){e=e||[],d=d||c;var h=d;if(d.nodeType!==1&&d.nodeType!==9)return[];
if(!b||typeof b!="string")return e;var i,j,k,l,n,q,r,t,u=!0,v=m.isXML(d),w=[],x=b;do{a.exec(""),i=a.exec(x);
if(i){x=i[3],w.push(i[1]);if(i[2]){l=i[3];break}}}while(i);if(w.length>1&&p.exec(b))if(w.length===2&&o.relative[w[0]])j=y(w[0]+w[1],d,f);else{
j=o.relative[w[0]]?[d]:m(w.shift(),d);while(w.length)b=w.shift(),o.relative[b]&&(b+=w.shift()),j=y(b,j,f);
}else{!f&&w.length>1&&d.nodeType===9&&!v&&o.match.ID.test(w[0])&&!o.match.ID.test(w[w.length-1])&&(n=m.find(w.shift(),d,v),
d=n.expr?m.filter(n.expr,n.set)[0]:n.set[0]);if(d){n=f?{expr:w.pop(),set:s(f)}:m.find(w.pop(),w.length===1&&(w[0]==="~"||w[0]==="+")&&d.parentNode?d.parentNode:d,v),
j=n.expr?m.filter(n.expr,n.set):n.set,w.length>0?k=s(j):u=!1;while(w.length)q=w.pop(),r=q,o.relative[q]?r=w.pop():q="",
r==null&&(r=d),o.relative[q](k,r,v)}else k=w=[]}k||(k=j),k||m.error(q||b);if(g.call(k)==="[object Array]")if(!u)e.push.apply(e,k);else if(d&&d.nodeType===1)for(t=0;k[t]!=null;t++)k[t]&&(k[t]===!0||k[t].nodeType===1&&m.contains(d,k[t]))&&e.push(j[t]);else for(t=0;k[t]!=null;t++)k[t]&&k[t].nodeType===1&&e.push(j[t]);else s(k,e);
l&&(m(l,h,e,f),m.uniqueSort(e));return e};m.uniqueSort=function(a){if(u){h=i,a.sort(u);if(h)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1);
}return a},m.matches=function(a,b){return m(a,null,null,b)},m.matchesSelector=function(a,b){return m(b,null,null,[a]).length>0;
},m.find=function(a,b,c){var d,e,f,g,h,i;if(!a)return[];for(e=0,f=o.order.length;e<f;e++){h=o.order[e];
if(g=o.leftMatch[h].exec(a)){i=g[1],g.splice(1,1);if(i.substr(i.length-1)!=="\\"){g[1]=(g[1]||"").replace(j,""),
d=o.find[h](g,b,c);if(d!=null){a=a.replace(o.match[h],"");break}}}}d||(d=typeof b.getElementsByTagName!="undefined"?b.getElementsByTagName("*"):[]);
return{set:d,expr:a}},m.filter=function(a,c,d,e){var f,g,h,i,j,k,l,n,p,q=a,r=[],s=c,t=c&&c[0]&&m.isXML(c[0]);
while(a&&c.length){for(h in o.filter)if((f=o.leftMatch[h].exec(a))!=null&&f[2]){k=o.filter[h],l=f[1],
g=!1,f.splice(1,1);if(l.substr(l.length-1)==="\\")continue;s===r&&(r=[]);if(o.preFilter[h]){f=o.preFilter[h](f,s,d,r,e,t);
if(!f)g=i=!0;else if(f===!0)continue}if(f)for(n=0;(j=s[n])!=null;n++)j&&(i=k(j,f,n,s),p=e^i,d&&i!=null?p?g=!0:s[n]=!1:p&&(r.push(j),
g=!0));if(i!==b){d||(s=r),a=a.replace(o.match[h],"");if(!g)return[];break}}if(a===q)if(g==null)m.error(a);else break;
q=a}return s},m.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)};var n=m.getText=function(a){
var b,c,d=a.nodeType,e="";if(d){if(d===1||d===9||d===11){if(typeof a.textContent=="string")return a.textContent;
if(typeof a.innerText=="string")return a.innerText.replace(k,"");for(a=a.firstChild;a;a=a.nextSibling)e+=n(a);
}else if(d===3||d===4)return a.nodeValue}else for(b=0;c=a[b];b++)c.nodeType!==8&&(e+=n(c));return e},o=m.selectors={
order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href");
},type:function(a){return a.getAttribute("type")}},relative:{"+":function(a,b){var c=typeof b=="string",d=c&&!l.test(b),e=c&&!d;
d&&(b=b.toLowerCase());for(var f=0,g=a.length,h;f<g;f++)if(h=a[f]){while((h=h.previousSibling)&&h.nodeType!==1);
a[f]=e||h&&h.nodeName.toLowerCase()===b?h||!1:h===b}e&&m.filter(b,a,!0)},">":function(a,b){var c,d=typeof b=="string",e=0,f=a.length;
if(d&&!l.test(b)){b=b.toLowerCase();for(;e<f;e++){c=a[e];if(c){var g=c.parentNode;a[e]=g.nodeName.toLowerCase()===b?g:!1;
}}}else{for(;e<f;e++)c=a[e],c&&(a[e]=d?c.parentNode:c.parentNode===b);d&&m.filter(b,a,!0)}},"":function(a,b,c){
var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("parentNode",b,f,a,d,c);
},"~":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("previousSibling",b,f,a,d,c);
}},find:{ID:function(a,b,c){if(typeof b.getElementById!="undefined"&&!c){var d=b.getElementById(a[1]);
return d&&d.parentNode?[d]:[]}},NAME:function(a,b){if(typeof b.getElementsByName!="undefined"){var c=[],d=b.getElementsByName(a[1]);
for(var e=0,f=d.length;e<f;e++)d[e].getAttribute("name")===a[1]&&c.push(d[e]);return c.length===0?null:c;
}},TAG:function(a,b){if(typeof b.getElementsByTagName!="undefined")return b.getElementsByTagName(a[1]);
}},preFilter:{CLASS:function(a,b,c,d,e,f){a=" "+a[1].replace(j,"")+" ";if(f)return a;for(var g=0,h;(h=b[g])!=null;g++)h&&(e^(h.className&&(" "+h.className+" ").replace(/[\t\n\r]/g," ").indexOf(a)>=0)?c||d.push(h):c&&(b[g]=!1));
return!1},ID:function(a){return a[1].replace(j,"")},TAG:function(a,b){return a[1].replace(j,"").toLowerCase();
},CHILD:function(a){if(a[1]==="nth"){a[2]||m.error(a[0]),a[2]=a[2].replace(/^\+|\s*/g,"");var b=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2]==="even"&&"2n"||a[2]==="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);
a[2]=b[1]+(b[2]||1)-0,a[3]=b[3]-0}else a[2]&&m.error(a[0]);a[0]=e++;return a},ATTR:function(a,b,c,d,e,f){
var g=a[1]=a[1].replace(j,"");!f&&o.attrMap[g]&&(a[1]=o.attrMap[g]),a[4]=(a[4]||a[5]||"").replace(j,""),
a[2]==="~="&&(a[4]=" "+a[4]+" ");return a},PSEUDO:function(b,c,d,e,f){if(b[1]==="not")if((a.exec(b[3])||"").length>1||/^\w/.test(b[3]))b[3]=m(b[3],null,null,c);else{
var g=m.filter(b[3],c,d,!0^f);d||e.push.apply(e,g);return!1}else if(o.match.POS.test(b[0])||o.match.CHILD.test(b[0]))return!0;
return b},POS:function(a){a.unshift(!0);return a}},filters:{enabled:function(a){return a.disabled===!1&&a.type!=="hidden";
},disabled:function(a){return a.disabled===!0},checked:function(a){return a.checked===!0},selected:function(a){
a.parentNode&&a.parentNode.selectedIndex;return a.selected===!0},parent:function(a){return!!a.firstChild;
},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!m(c[3],a).length},header:function(a){
return/h\d/i.test(a.nodeName)},text:function(a){var b=a.getAttribute("type"),c=a.type;return a.nodeName.toLowerCase()==="input"&&"text"===c&&(b===c||b===null);
},radio:function(a){return a.nodeName.toLowerCase()==="input"&&"radio"===a.type},checkbox:function(a){
return a.nodeName.toLowerCase()==="input"&&"checkbox"===a.type},file:function(a){return a.nodeName.toLowerCase()==="input"&&"file"===a.type;
},password:function(a){return a.nodeName.toLowerCase()==="input"&&"password"===a.type},submit:function(a){
var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"submit"===a.type},image:function(a){
return a.nodeName.toLowerCase()==="input"&&"image"===a.type},reset:function(a){var b=a.nodeName.toLowerCase();
return(b==="input"||b==="button")&&"reset"===a.type},button:function(a){var b=a.nodeName.toLowerCase();
return b==="input"&&"button"===a.type||b==="button"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName);
},focus:function(a){return a===a.ownerDocument.activeElement}},setFilters:{first:function(a,b){return b===0;
},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){
return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){
return c[3]-0===b},eq:function(a,b,c){return c[3]-0===b}},filter:{PSEUDO:function(a,b,c,d){var e=b[1],f=o.filters[e];
if(f)return f(a,c,b,d);if(e==="contains")return(a.textContent||a.innerText||n([a])||"").indexOf(b[3])>=0;
if(e==="not"){var g=b[3];for(var h=0,i=g.length;h<i;h++)if(g[h]===a)return!1;return!0}m.error(e)},CHILD:function(a,b){
var c,e,f,g,h,i,j,k=b[1],l=a;switch(k){case"only":case"first":while(l=l.previousSibling)if(l.nodeType===1)return!1;
if(k==="first")return!0;l=a;case"last":while(l=l.nextSibling)if(l.nodeType===1)return!1;return!0;case"nth":
c=b[2],e=b[3];if(c===1&&e===0)return!0;f=b[0],g=a.parentNode;if(g&&(g[d]!==f||!a.nodeIndex)){i=0;for(l=g.firstChild;l;l=l.nextSibling)l.nodeType===1&&(l.nodeIndex=++i);
g[d]=f}j=a.nodeIndex-e;return c===0?j===0:j%c===0&&j/c>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b;
},TAG:function(a,b){return b==="*"&&a.nodeType===1||!!a.nodeName&&a.nodeName.toLowerCase()===b},CLASS:function(a,b){
return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>-1},ATTR:function(a,b){var c=b[1],d=m.attr?m.attr(a,c):o.attrHandle[c]?o.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c),e=d+"",f=b[2],g=b[4];
return d==null?f==="!=":!f&&m.attr?d!=null:f==="="?e===g:f==="*="?e.indexOf(g)>=0:f==="~="?(" "+e+" ").indexOf(g)>=0:g?f==="!="?e!==g:f==="^="?e.indexOf(g)===0:f==="$="?e.substr(e.length-g.length)===g:f==="|="?e===g||e.substr(0,g.length+1)===g+"-":!1:e&&d!==!1;
},POS:function(a,b,c,d){var e=b[2],f=o.setFilters[e];if(f)return f(a,c,b,d)}}},p=o.match.POS,q=function(a,b){
return"\\"+(b-0+1)};for(var r in o.match)o.match[r]=new RegExp(o.match[r].source+/(?![^\[]*\])(?![^\(]*\))/.source),
o.leftMatch[r]=new RegExp(/(^(?:.|\r|\n)*?)/.source+o.match[r].source.replace(/\\(\d+)/g,q));o.match.globalPOS=p;
var s=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{
Array.prototype.slice.call(c.documentElement.childNodes,0)[0].nodeType}catch(t){s=function(a,b){var c=0,d=b||[];
if(g.call(a)==="[object Array]")Array.prototype.push.apply(d,a);else if(typeof a.length=="number")for(var e=a.length;c<e;c++)d.push(a[c]);else for(;a[c];c++)d.push(a[c]);
return d}}var u,v;c.documentElement.compareDocumentPosition?u=function(a,b){if(a===b){h=!0;return 0}if(!a.compareDocumentPosition||!b.compareDocumentPosition)return a.compareDocumentPosition?-1:1;
return a.compareDocumentPosition(b)&4?-1:1}:(u=function(a,b){if(a===b){h=!0;return 0}if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;
var c,d,e=[],f=[],g=a.parentNode,i=b.parentNode,j=g;if(g===i)return v(a,b);if(!g)return-1;if(!i)return 1;
while(j)e.unshift(j),j=j.parentNode;j=i;while(j)f.unshift(j),j=j.parentNode;c=e.length,d=f.length;for(var k=0;k<c&&k<d;k++)if(e[k]!==f[k])return v(e[k],f[k]);
return k===c?v(a,f[k],-1):v(e[k],b,1)},v=function(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){
if(d===b)return-1;d=d.nextSibling}return 1}),function(){var a=c.createElement("div"),d="script"+(new Date).getTime(),e=c.documentElement;
a.innerHTML="<a name='"+d+"'/>",e.insertBefore(a,e.firstChild),c.getElementById(d)&&(o.find.ID=function(a,c,d){
if(typeof c.getElementById!="undefined"&&!d){var e=c.getElementById(a[1]);return e?e.id===a[1]||typeof e.getAttributeNode!="undefined"&&e.getAttributeNode("id").nodeValue===a[1]?[e]:b:[];
}},o.filter.ID=function(a,b){var c=typeof a.getAttributeNode!="undefined"&&a.getAttributeNode("id");return a.nodeType===1&&c&&c.nodeValue===b;
}),e.removeChild(a),e=a=null}(),function(){var a=c.createElement("div");a.appendChild(c.createComment("")),
a.getElementsByTagName("*").length>0&&(o.find.TAG=function(a,b){var c=b.getElementsByTagName(a[1]);if(a[1]==="*"){
var d=[];for(var e=0;c[e];e++)c[e].nodeType===1&&d.push(c[e]);c=d}return c}),a.innerHTML="<a href='#'></a>",
a.firstChild&&typeof a.firstChild.getAttribute!="undefined"&&a.firstChild.getAttribute("href")!=="#"&&(o.attrHandle.href=function(a){
return a.getAttribute("href",2)}),a=null}(),c.querySelectorAll&&function(){var a=m,b=c.createElement("div"),d="__sizzle__";
b.innerHTML="<p class='TEST'></p>";if(!b.querySelectorAll||b.querySelectorAll(".TEST").length!==0){m=function(b,e,f,g){
e=e||c;if(!g&&!m.isXML(e)){var h=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);if(h&&(e.nodeType===1||e.nodeType===9)){
if(h[1])return s(e.getElementsByTagName(b),f);if(h[2]&&o.find.CLASS&&e.getElementsByClassName)return s(e.getElementsByClassName(h[2]),f);
}if(e.nodeType===9){if(b==="body"&&e.body)return s([e.body],f);if(h&&h[3]){var i=e.getElementById(h[3]);
if(!i||!i.parentNode)return s([],f);if(i.id===h[3])return s([i],f)}try{return s(e.querySelectorAll(b),f);
}catch(j){}}else if(e.nodeType===1&&e.nodeName.toLowerCase()!=="object"){var k=e,l=e.getAttribute("id"),n=l||d,p=e.parentNode,q=/^\s*[+~]/.test(b);
l?n=n.replace(/'/g,"\\$&"):e.setAttribute("id",n),q&&p&&(e=e.parentNode);try{if(!q||p)return s(e.querySelectorAll("[id='"+n+"'] "+b),f);
}catch(r){}finally{l||k.removeAttribute("id")}}}return a(b,e,f,g)};for(var e in a)m[e]=a[e];b=null}}(),
function(){var a=c.documentElement,b=a.matchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||a.msMatchesSelector;
if(b){var d=!b.call(c.createElement("div"),"div"),e=!1;try{b.call(c.documentElement,"[test!='']:sizzle");
}catch(f){e=!0}m.matchesSelector=function(a,c){c=c.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!m.isXML(a))try{
if(e||!o.match.PSEUDO.test(c)&&!/!=/.test(c)){var f=b.call(a,c);if(f||!d||a.document&&a.document.nodeType!==11)return f;
}}catch(g){}return m(c,null,null,[a]).length>0}}}(),function(){var a=c.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";
if(!!a.getElementsByClassName&&a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length===1)return;
o.order.splice(1,0,"CLASS"),o.find.CLASS=function(a,b,c){if(typeof b.getElementsByClassName!="undefined"&&!c)return b.getElementsByClassName(a[1]);
},a=null}}(),c.documentElement.contains?m.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):!0);
}:c.documentElement.compareDocumentPosition?m.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16);
}:m.contains=function(){return!1},m.isXML=function(a){var b=(a?a.ownerDocument||a:0).documentElement;return b?b.nodeName!=="HTML":!1;
};var y=function(a,b,c){var d,e=[],f="",g=b.nodeType?[b]:b;while(d=o.match.PSEUDO.exec(a))f+=d[0],a=a.replace(o.match.PSEUDO,"");
a=o.relative[a]?a+"*":a;for(var h=0,i=g.length;h<i;h++)m(a,g[h],e,c);return m.filter(f,e)};m.attr=f.attr,
m.selectors.attrMap={},f.find=m,f.expr=m.selectors,f.expr[":"]=f.expr.filters,f.unique=m.uniqueSort,f.text=m.getText,
f.isXMLDoc=m.isXML,f.contains=m.contains}();var L=/Until$/,M=/^(?:parents|prevUntil|prevAll)/,N=/,/,O=/^.[^:#\[\.,]*$/,P=Array.prototype.slice,Q=f.expr.match.globalPOS,R={
children:!0,contents:!0,next:!0,prev:!0};f.fn.extend({find:function(a){var b=this,c,d;if(typeof a!="string")return f(a).filter(function(){
for(c=0,d=b.length;c<d;c++)if(f.contains(b[c],this))return!0});var e=this.pushStack("","find",a),g,h,i;
for(c=0,d=this.length;c<d;c++){g=e.length,f.find(a,this[c],e);if(c>0)for(h=g;h<e.length;h++)for(i=0;i<g;i++)if(e[i]===e[h]){
e.splice(h--,1);break}}return e},has:function(a){var b=f(a);return this.filter(function(){for(var a=0,c=b.length;a<c;a++)if(f.contains(this,b[a]))return!0;
})},not:function(a){return this.pushStack(T(this,a,!1),"not",a)},filter:function(a){return this.pushStack(T(this,a,!0),"filter",a);
},is:function(a){return!!a&&(typeof a=="string"?Q.test(a)?f(a,this.context).index(this[0])>=0:f.filter(a,this).length>0:this.filter(a).length>0);
},closest:function(a,b){var c=[],d,e,g=this[0];if(f.isArray(a)){var h=1;while(g&&g.ownerDocument&&g!==b){
for(d=0;d<a.length;d++)f(g).is(a[d])&&c.push({selector:a[d],elem:g,level:h});g=g.parentNode,h++}return c;
}var i=Q.test(a)||typeof a!="string"?f(a,b||this.context):0;for(d=0,e=this.length;d<e;d++){g=this[d];while(g){
if(i?i.index(g)>-1:f.find.matchesSelector(g,a)){c.push(g);break}g=g.parentNode;if(!g||!g.ownerDocument||g===b||g.nodeType===11)break;
}}c=c.length>1?f.unique(c):c;return this.pushStack(c,"closest",a)},index:function(a){if(!a)return this[0]&&this[0].parentNode?this.prevAll().length:-1;
if(typeof a=="string")return f.inArray(this[0],f(a));return f.inArray(a.jquery?a[0]:a,this)},add:function(a,b){
var c=typeof a=="string"?f(a,b):f.makeArray(a&&a.nodeType?[a]:a),d=f.merge(this.get(),c);return this.pushStack(S(c[0])||S(d[0])?d:f.unique(d));
},andSelf:function(){return this.add(this.prevObject)}}),f.each({parent:function(a){var b=a.parentNode;
return b&&b.nodeType!==11?b:null},parents:function(a){return f.dir(a,"parentNode")},parentsUntil:function(a,b,c){
return f.dir(a,"parentNode",c)},next:function(a){return f.nth(a,2,"nextSibling")},prev:function(a){return f.nth(a,2,"previousSibling");
},nextAll:function(a){return f.dir(a,"nextSibling")},prevAll:function(a){return f.dir(a,"previousSibling");
},nextUntil:function(a,b,c){return f.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return f.dir(a,"previousSibling",c);
},siblings:function(a){return f.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return f.sibling(a.firstChild);
},contents:function(a){return f.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:f.makeArray(a.childNodes);
}},function(a,b){f.fn[a]=function(c,d){var e=f.map(this,b,c);L.test(a)||(d=c),d&&typeof d=="string"&&(e=f.filter(d,e)),
e=this.length>1&&!R[a]?f.unique(e):e,(this.length>1||N.test(d))&&M.test(a)&&(e=e.reverse());return this.pushStack(e,a,P.call(arguments).join(","));
}}),f.extend({filter:function(a,b,c){c&&(a=":not("+a+")");return b.length===1?f.find.matchesSelector(b[0],a)?[b[0]]:[]:f.find.matches(a,b);
},dir:function(a,c,d){var e=[],g=a[c];while(g&&g.nodeType!==9&&(d===b||g.nodeType!==1||!f(g).is(d)))g.nodeType===1&&e.push(g),
g=g[c];return e},nth:function(a,b,c,d){b=b||1;var e=0;for(;a;a=a[c])if(a.nodeType===1&&++e===b)break;return a;
},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var V="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",W=/ jQuery\d+="(?:\d+|null)"/g,X=/^\s+/,Y=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,Z=/<([\w:]+)/,$=/<tbody/i,_=/<|&#?\w+;/,ba=/<(?:script|style)/i,bb=/<(?:script|object|embed|option|style)/i,bc=new RegExp("<(?:"+V+")[\\s/>]","i"),bd=/checked\s*(?:[^=]|=\s*.checked.)/i,be=/\/(java|ecma)script/i,bf=/^\s*<!(?:\[CDATA\[|\-\-)/,bg={
option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],
tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],
area:[1,"<map>","</map>"],_default:[0,"",""]},bh=U(c);bg.optgroup=bg.option,bg.tbody=bg.tfoot=bg.colgroup=bg.caption=bg.thead,
bg.th=bg.td,f.support.htmlSerialize||(bg._default=[1,"div<div>","</div>"]),f.fn.extend({text:function(a){
return f.access(this,function(a){return a===b?f.text(this):this.empty().append((this[0]&&this[0].ownerDocument||c).createTextNode(a));
},null,a,arguments.length)},wrapAll:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapAll(a.call(this,b));
});if(this[0]){var b=f(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),
b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this);
}return this},wrapInner:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapInner(a.call(this,b));
});return this.each(function(){var b=f(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){
var b=f.isFunction(a);return this.each(function(c){f(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){
return this.parent().each(function(){f.nodeName(this,"body")||f(this).replaceWith(this.childNodes)}).end();
},append:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.appendChild(a);
})},prepend:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild);
})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this);
});if(arguments.length){var a=f.clean(arguments);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments);
}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling);
});if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,f.clean(arguments));
return a}},remove:function(a,b){for(var c=0,d;(d=this[c])!=null;c++)if(!a||f.filter(a,[d]).length)!b&&d.nodeType===1&&(f.cleanData(d.getElementsByTagName("*")),
f.cleanData([d])),d.parentNode&&d.parentNode.removeChild(d);return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++){
b.nodeType===1&&f.cleanData(b.getElementsByTagName("*"));while(b.firstChild)b.removeChild(b.firstChild);
}return this},clone:function(a,b){a=a==null?!1:a,b=b==null?a:b;return this.map(function(){return f.clone(this,a,b);
})},html:function(a){return f.access(this,function(a){var c=this[0]||{},d=0,e=this.length;if(a===b)return c.nodeType===1?c.innerHTML.replace(W,""):null;
if(typeof a=="string"&&!ba.test(a)&&(f.support.leadingWhitespace||!X.test(a))&&!bg[(Z.exec(a)||["",""])[1].toLowerCase()]){
a=a.replace(Y,"<$1></$2>");try{for(;d<e;d++)c=this[d]||{},c.nodeType===1&&(f.cleanData(c.getElementsByTagName("*")),
c.innerHTML=a);c=0}catch(g){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){
if(this[0]&&this[0].parentNode){if(f.isFunction(a))return this.each(function(b){var c=f(this),d=c.html();
c.replaceWith(a.call(this,b,d))});typeof a!="string"&&(a=f(a).detach());return this.each(function(){var b=this.nextSibling,c=this.parentNode;
f(this).remove(),b?f(b).before(a):f(c).append(a)})}return this.length?this.pushStack(f(f.isFunction(a)?a():a),"replaceWith",a):this;
},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){var e,g,h,i,j=a[0],k=[];if(!f.support.checkClone&&arguments.length===3&&typeof j=="string"&&bd.test(j))return this.each(function(){
f(this).domManip(a,c,d,!0)});if(f.isFunction(j))return this.each(function(e){var g=f(this);a[0]=j.call(this,e,c?g.html():b),
g.domManip(a,c,d)});if(this[0]){i=j&&j.parentNode,f.support.parentNode&&i&&i.nodeType===11&&i.childNodes.length===this.length?e={
fragment:i}:e=f.buildFragment(a,this,k),h=e.fragment,h.childNodes.length===1?g=h=h.firstChild:g=h.firstChild;
if(g){c=c&&f.nodeName(g,"tr");for(var l=0,m=this.length,n=m-1;l<m;l++)d.call(c?bi(this[l],g):this[l],e.cacheable||m>1&&l<n?f.clone(h,!0,!0):h);
}k.length&&f.each(k,function(a,b){b.src?f.ajax({type:"GET",global:!1,url:b.src,async:!1,dataType:"script"
}):f.globalEval((b.text||b.textContent||b.innerHTML||"").replace(bf,"/*$0*/")),b.parentNode&&b.parentNode.removeChild(b);
})}return this}}),f.buildFragment=function(a,b,d){var e,g,h,i,j=a[0];b&&b[0]&&(i=b[0].ownerDocument||b[0]),
i.createDocumentFragment||(i=c),a.length===1&&typeof j=="string"&&j.length<512&&i===c&&j.charAt(0)==="<"&&!bb.test(j)&&(f.support.checkClone||!bd.test(j))&&(f.support.html5Clone||!bc.test(j))&&(g=!0,
h=f.fragments[j],h&&h!==1&&(e=h)),e||(e=i.createDocumentFragment(),f.clean(a,i,e,d)),g&&(f.fragments[j]=h?e:1);
return{fragment:e,cacheable:g}},f.fragments={},f.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",
insertAfter:"after",replaceAll:"replaceWith"},function(a,b){f.fn[a]=function(c){var d=[],e=f(c),g=this.length===1&&this[0].parentNode;
if(g&&g.nodeType===11&&g.childNodes.length===1&&e.length===1){e[b](this[0]);return this}for(var h=0,i=e.length;h<i;h++){
var j=(h>0?this.clone(!0):this).get();f(e[h])[b](j),d=d.concat(j)}return this.pushStack(d,a,e.selector);
}}),f.extend({clone:function(a,b,c){var d,e,g,h=f.support.html5Clone||f.isXMLDoc(a)||!bc.test("<"+a.nodeName+">")?a.cloneNode(!0):bo(a);
if((!f.support.noCloneEvent||!f.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!f.isXMLDoc(a)){
bk(a,h),d=bl(a),e=bl(h);for(g=0;d[g];++g)e[g]&&bk(d[g],e[g])}if(b){bj(a,h);if(c){d=bl(a),e=bl(h);for(g=0;d[g];++g)bj(d[g],e[g]);
}}d=e=null;return h},clean:function(a,b,d,e){var g,h,i,j=[];b=b||c,typeof b.createElement=="undefined"&&(b=b.ownerDocument||b[0]&&b[0].ownerDocument||c);
for(var k=0,l;(l=a[k])!=null;k++){typeof l=="number"&&(l+="");if(!l)continue;if(typeof l=="string")if(!_.test(l))l=b.createTextNode(l);else{
l=l.replace(Y,"<$1></$2>");var m=(Z.exec(l)||["",""])[1].toLowerCase(),n=bg[m]||bg._default,o=n[0],p=b.createElement("div"),q=bh.childNodes,r;
b===c?bh.appendChild(p):U(b).appendChild(p),p.innerHTML=n[1]+l+n[2];while(o--)p=p.lastChild;if(!f.support.tbody){
var s=$.test(l),t=m==="table"&&!s?p.firstChild&&p.firstChild.childNodes:n[1]==="<table>"&&!s?p.childNodes:[];
for(i=t.length-1;i>=0;--i)f.nodeName(t[i],"tbody")&&!t[i].childNodes.length&&t[i].parentNode.removeChild(t[i]);
}!f.support.leadingWhitespace&&X.test(l)&&p.insertBefore(b.createTextNode(X.exec(l)[0]),p.firstChild),
l=p.childNodes,p&&(p.parentNode.removeChild(p),q.length>0&&(r=q[q.length-1],r&&r.parentNode&&r.parentNode.removeChild(r)));
}var u;if(!f.support.appendChecked)if(l[0]&&typeof(u=l.length)=="number")for(i=0;i<u;i++)bn(l[i]);else bn(l);
l.nodeType?j.push(l):j=f.merge(j,l)}if(d){g=function(a){return!a.type||be.test(a.type)};for(k=0;j[k];k++){
h=j[k];if(e&&f.nodeName(h,"script")&&(!h.type||be.test(h.type)))e.push(h.parentNode?h.parentNode.removeChild(h):h);else{
if(h.nodeType===1){var v=f.grep(h.getElementsByTagName("script"),g);j.splice.apply(j,[k+1,0].concat(v));
}d.appendChild(h)}}}return j},cleanData:function(a){var b,c,d=f.cache,e=f.event.special,g=f.support.deleteExpando;
for(var h=0,i;(i=a[h])!=null;h++){if(i.nodeName&&f.noData[i.nodeName.toLowerCase()])continue;c=i[f.expando];
if(c){b=d[c];if(b&&b.events){for(var j in b.events)e[j]?f.event.remove(i,j):f.removeEvent(i,j,b.handle);
b.handle&&(b.handle.elem=null)}g?delete i[f.expando]:i.removeAttribute&&i.removeAttribute(f.expando),
delete d[c]}}}});var bp=/alpha\([^)]*\)/i,bq=/opacity=([^)]*)/,br=/([A-Z]|^ms)/g,bs=/^[\-+]?(?:\d*\.)?\d+$/i,bt=/^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,bu=/^([\-+])=([\-+.\de]+)/,bv=/^margin/,bw={
position:"absolute",visibility:"hidden",display:"block"},bx=["Top","Right","Bottom","Left"],by,bz,bA;f.fn.css=function(a,c){
return f.access(this,function(a,c,d){return d!==b?f.style(a,c,d):f.css(a,c)},a,c,arguments.length>1)},
f.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=by(a,"opacity");return c===""?"1":c}return a.style.opacity;
}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0
},cssProps:{"float":f.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!!a&&a.nodeType!==3&&a.nodeType!==8&&!!a.style){
var g,h,i=f.camelCase(c),j=a.style,k=f.cssHooks[i];c=f.cssProps[i]||i;if(d===b){if(k&&"get"in k&&(g=k.get(a,!1,e))!==b)return g;
return j[c]}h=typeof d,h==="string"&&(g=bu.exec(d))&&(d=+(g[1]+1)*+g[2]+parseFloat(f.css(a,c)),h="number");
if(d==null||h==="number"&&isNaN(d))return;h==="number"&&!f.cssNumber[i]&&(d+="px");if(!k||!("set"in k)||(d=k.set(a,d))!==b)try{
j[c]=d}catch(l){}}},css:function(a,c,d){var e,g;c=f.camelCase(c),g=f.cssHooks[c],c=f.cssProps[c]||c,c==="cssFloat"&&(c="float");
if(g&&"get"in g&&(e=g.get(a,!0,d))!==b)return e;if(by)return by(a,c)},swap:function(a,b,c){var d={},e,f;
for(f in b)d[f]=a.style[f],a.style[f]=b[f];e=c.call(a);for(f in b)a.style[f]=d[f];return e}}),f.curCSS=f.css,
c.defaultView&&c.defaultView.getComputedStyle&&(bz=function(a,b){var c,d,e,g,h=a.style;b=b.replace(br,"-$1").toLowerCase(),
(d=a.ownerDocument.defaultView)&&(e=d.getComputedStyle(a,null))&&(c=e.getPropertyValue(b),c===""&&!f.contains(a.ownerDocument.documentElement,a)&&(c=f.style(a,b))),
!f.support.pixelMargin&&e&&bv.test(b)&&bt.test(c)&&(g=h.width,h.width=c,c=e.width,h.width=g);return c;
}),c.documentElement.currentStyle&&(bA=function(a,b){var c,d,e,f=a.currentStyle&&a.currentStyle[b],g=a.style;
f==null&&g&&(e=g[b])&&(f=e),bt.test(f)&&(c=g.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),
g.left=b==="fontSize"?"1em":f,f=g.pixelLeft+"px",g.left=c,d&&(a.runtimeStyle.left=d));return f===""?"auto":f;
}),by=bz||bA,f.each(["height","width"],function(a,b){f.cssHooks[b]={get:function(a,c,d){if(c)return a.offsetWidth!==0?bB(a,b,d):f.swap(a,bw,function(){
return bB(a,b,d)})},set:function(a,b){return bs.test(b)?b+"px":b}}}),f.support.opacity||(f.cssHooks.opacity={
get:function(a,b){return bq.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":"";
},set:function(a,b){var c=a.style,d=a.currentStyle,e=f.isNumeric(b)?"alpha(opacity="+b*100+")":"",g=d&&d.filter||c.filter||"";
c.zoom=1;if(b>=1&&f.trim(g.replace(bp,""))===""){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bp.test(g)?g.replace(bp,e):g+" "+e;
}}),f(function(){f.support.reliableMarginRight||(f.cssHooks.marginRight={get:function(a,b){return f.swap(a,{
display:"inline-block"},function(){return b?by(a,"margin-right"):a.style.marginRight})}})}),f.expr&&f.expr.filters&&(f.expr.filters.hidden=function(a){
var b=a.offsetWidth,c=a.offsetHeight;return b===0&&c===0||!f.support.reliableHiddenOffsets&&(a.style&&a.style.display||f.css(a,"display"))==="none";
},f.expr.filters.visible=function(a){return!f.expr.filters.hidden(a)}),f.each({margin:"",padding:"",border:"Width"
},function(a,b){f.cssHooks[a+b]={expand:function(c){var d,e=typeof c=="string"?c.split(" "):[c],f={};for(d=0;d<4;d++)f[a+bx[d]+b]=e[d]||e[d-2]||e[0];
return f}}});var bC=/%20/g,bD=/\[\]$/,bE=/\r?\n/g,bF=/#.*$/,bG=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,bH=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,bI=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,bJ=/^(?:GET|HEAD)$/,bK=/^\/\//,bL=/\?/,bM=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bN=/^(?:select|textarea)/i,bO=/\s+/,bP=/([?&])_=[^&]*/,bQ=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,bR=f.fn.load,bS={},bT={},bU,bV,bW=["*/"]+["*"];
try{bU=e.href}catch(bX){bU=c.createElement("a"),bU.href="",bU=bU.href}bV=bQ.exec(bU.toLowerCase())||[],
f.fn.extend({load:function(a,c,d){if(typeof a!="string"&&bR)return bR.apply(this,arguments);if(!this.length)return this;
var e=a.indexOf(" ");if(e>=0){var g=a.slice(e,a.length);a=a.slice(0,e)}var h="GET";c&&(f.isFunction(c)?(d=c,
c=b):typeof c=="object"&&(c=f.param(c,f.ajaxSettings.traditional),h="POST"));var i=this;f.ajax({url:a,
type:h,dataType:"html",data:c,complete:function(a,b,c){c=a.responseText,a.isResolved()&&(a.done(function(a){
c=a}),i.html(g?f("<div>").append(c.replace(bM,"")).find(g):c)),d&&i.each(d,[c,b,a])}});return this},serialize:function(){
return f.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?f.makeArray(this.elements):this;
}).filter(function(){return this.name&&!this.disabled&&(this.checked||bN.test(this.nodeName)||bH.test(this.type));
}).map(function(a,b){var c=f(this).val();return c==null?null:f.isArray(c)?f.map(c,function(a,c){return{
name:b.name,value:a.replace(bE,"\r\n")}}):{name:b.name,value:c.replace(bE,"\r\n")}}).get()}}),f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){
f.fn[b]=function(a){return this.on(b,a)}}),f.each(["get","post"],function(a,c){f[c]=function(a,d,e,g){
f.isFunction(d)&&(g=g||e,e=d,d=b);return f.ajax({type:c,url:a,data:d,success:e,dataType:g})}}),f.extend({
getScript:function(a,c){return f.get(a,b,c,"script")},getJSON:function(a,b,c){return f.get(a,b,c,"json");
},ajaxSetup:function(a,b){b?b$(a,f.ajaxSettings):(b=a,a=f.ajaxSettings),b$(a,b);return a},ajaxSettings:{
url:bU,isLocal:bI.test(bV[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",
processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript",
"*":bW},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"
},converters:{"* text":a.String,"text html":!0,"text json":f.parseJSON,"text xml":f.parseXML},flatOptions:{
context:!0,url:!0}},ajaxPrefilter:bY(bS),ajaxTransport:bY(bT),ajax:function(a,c){function w(a,c,l,m){
if(s!==2){s=2,q&&clearTimeout(q),p=b,n=m||"",v.readyState=a>0?4:0;var o,r,u,w=c,x=l?ca(d,v,l):b,y,z;if(a>=200&&a<300||a===304){
if(d.ifModified){if(y=v.getResponseHeader("Last-Modified"))f.lastModified[k]=y;if(z=v.getResponseHeader("Etag"))f.etag[k]=z;
}if(a===304)w="notmodified",o=!0;else try{r=cb(d,x),w="success",o=!0}catch(A){w="parsererror",u=A}}else{
u=w;if(!w||a)w="error",a<0&&(a=0)}v.status=a,v.statusText=""+(c||w),o?h.resolveWith(e,[r,w,v]):h.rejectWith(e,[v,w,u]),
v.statusCode(j),j=b,t&&g.trigger("ajax"+(o?"Success":"Error"),[v,d,o?r:u]),i.fireWith(e,[v,w]),t&&(g.trigger("ajaxComplete",[v,d]),
--f.active||f.event.trigger("ajaxStop"))}}typeof a=="object"&&(c=a,a=b),c=c||{};var d=f.ajaxSetup({},c),e=d.context||d,g=e!==d&&(e.nodeType||e instanceof f)?f(e):f.event,h=f.Deferred(),i=f.Callbacks("once memory"),j=d.statusCode||{},k,l={},m={},n,o,p,q,r,s=0,t,u,v={
readyState:0,setRequestHeader:function(a,b){if(!s){var c=a.toLowerCase();a=m[c]=m[c]||a,l[a]=b}return this;
},getAllResponseHeaders:function(){return s===2?n:null},getResponseHeader:function(a){var c;if(s===2){
if(!o){o={};while(c=bG.exec(n))o[c[1].toLowerCase()]=c[2]}c=o[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){
s||(d.mimeType=a);return this},abort:function(a){a=a||"abort",p&&p.abort(a),w(0,a);return this}};h.promise(v),
v.success=v.done,v.error=v.fail,v.complete=i.add,v.statusCode=function(a){if(a){var b;if(s<2)for(b in a)j[b]=[j[b],a[b]];else b=a[v.status],
v.then(b,b)}return this},d.url=((a||d.url)+"").replace(bF,"").replace(bK,bV[1]+"//"),d.dataTypes=f.trim(d.dataType||"*").toLowerCase().split(bO),
d.crossDomain==null&&(r=bQ.exec(d.url.toLowerCase()),d.crossDomain=!(!r||r[1]==bV[1]&&r[2]==bV[2]&&(r[3]||(r[1]==="http:"?80:443))==(bV[3]||(bV[1]==="http:"?80:443)))),
d.data&&d.processData&&typeof d.data!="string"&&(d.data=f.param(d.data,d.traditional)),bZ(bS,d,c,v);if(s===2)return!1;
t=d.global,d.type=d.type.toUpperCase(),d.hasContent=!bJ.test(d.type),t&&f.active++===0&&f.event.trigger("ajaxStart");
if(!d.hasContent){d.data&&(d.url+=(bL.test(d.url)?"&":"?")+d.data,delete d.data),k=d.url;if(d.cache===!1){
var x=f.now(),y=d.url.replace(bP,"$1_="+x);d.url=y+(y===d.url?(bL.test(d.url)?"&":"?")+"_="+x:"")}}(d.data&&d.hasContent&&d.contentType!==!1||c.contentType)&&v.setRequestHeader("Content-Type",d.contentType),
d.ifModified&&(k=k||d.url,f.lastModified[k]&&v.setRequestHeader("If-Modified-Since",f.lastModified[k]),
f.etag[k]&&v.setRequestHeader("If-None-Match",f.etag[k])),v.setRequestHeader("Accept",d.dataTypes[0]&&d.accepts[d.dataTypes[0]]?d.accepts[d.dataTypes[0]]+(d.dataTypes[0]!=="*"?", "+bW+"; q=0.01":""):d.accepts["*"]);
for(u in d.headers)v.setRequestHeader(u,d.headers[u]);if(d.beforeSend&&(d.beforeSend.call(e,v,d)===!1||s===2)){
v.abort();return!1}for(u in{success:1,error:1,complete:1})v[u](d[u]);p=bZ(bT,d,c,v);if(!p)w(-1,"No Transport");else{
v.readyState=1,t&&g.trigger("ajaxSend",[v,d]),d.async&&d.timeout>0&&(q=setTimeout(function(){v.abort("timeout");
},d.timeout));try{s=1,p.send(l,w)}catch(z){if(s<2)w(-1,z);else throw z}}return v},param:function(a,c){
var d=[],e=function(a,b){b=f.isFunction(b)?b():b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b);
};c===b&&(c=f.ajaxSettings.traditional);if(f.isArray(a)||a.jquery&&!f.isPlainObject(a))f.each(a,function(){
e(this.name,this.value)});else for(var g in a)b_(g,a[g],c,e);return d.join("&").replace(bC,"+")}}),f.extend({
active:0,lastModified:{},etag:{}});var cc=f.now(),cd=/(\=)\?(&|$)|\?\?/i;f.ajaxSetup({jsonp:"callback",
jsonpCallback:function(){return f.expando+"_"+cc++}}),f.ajaxPrefilter("json jsonp",function(b,c,d){var e=typeof b.data=="string"&&/^application\/x\-www\-form\-urlencoded/.test(b.contentType);
if(b.dataTypes[0]==="jsonp"||b.jsonp!==!1&&(cd.test(b.url)||e&&cd.test(b.data))){var g,h=b.jsonpCallback=f.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,i=a[h],j=b.url,k=b.data,l="$1"+h+"$2";
b.jsonp!==!1&&(j=j.replace(cd,l),b.url===j&&(e&&(k=k.replace(cd,l)),b.data===k&&(j+=(/\?/.test(j)?"&":"?")+b.jsonp+"="+h))),
b.url=j,b.data=k,a[h]=function(a){g=[a]},d.always(function(){a[h]=i,g&&f.isFunction(i)&&a[h](g[0])}),
b.converters["script json"]=function(){g||f.error(h+" was not called");return g[0]},b.dataTypes[0]="json";
return"script"}}),f.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){f.globalEval(a);return a;
}}}),f.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1);
}),f.ajaxTransport("script",function(a){if(a.crossDomain){var d,e=c.head||c.getElementsByTagName("head")[0]||c.documentElement;
return{send:function(f,g){d=c.createElement("script"),d.async="async",a.scriptCharset&&(d.charset=a.scriptCharset),
d.src=a.url,d.onload=d.onreadystatechange=function(a,c){if(c||!d.readyState||/loaded|complete/.test(d.readyState))d.onload=d.onreadystatechange=null,
e&&d.parentNode&&e.removeChild(d),d=b,c||g(200,"success")},e.insertBefore(d,e.firstChild)},abort:function(){
d&&d.onload(0,1)}}}});var ce=a.ActiveXObject?function(){for(var a in cg)cg[a](0,1)}:!1,cf=0,cg;f.ajaxSettings.xhr=a.ActiveXObject?function(){
return!this.isLocal&&ch()||ci()}:ch,function(a){f.extend(f.support,{ajax:!!a,cors:!!a&&"withCredentials"in a
})}(f.ajaxSettings.xhr()),f.support.ajax&&f.ajaxTransport(function(c){if(!c.crossDomain||f.support.cors){
var d;return{send:function(e,g){var h=c.xhr(),i,j;c.username?h.open(c.type,c.url,c.async,c.username,c.password):h.open(c.type,c.url,c.async);
if(c.xhrFields)for(j in c.xhrFields)h[j]=c.xhrFields[j];c.mimeType&&h.overrideMimeType&&h.overrideMimeType(c.mimeType),
!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(j in e)h.setRequestHeader(j,e[j]);
}catch(k){}h.send(c.hasContent&&c.data||null),d=function(a,e){var j,k,l,m,n;try{if(d&&(e||h.readyState===4)){
d=b,i&&(h.onreadystatechange=f.noop,ce&&delete cg[i]);if(e)h.readyState!==4&&h.abort();else{j=h.status,
l=h.getAllResponseHeaders(),m={},n=h.responseXML,n&&n.documentElement&&(m.xml=n);try{m.text=h.responseText;
}catch(a){}try{k=h.statusText}catch(o){k=""}!j&&c.isLocal&&!c.crossDomain?j=m.text?200:404:j===1223&&(j=204);
}}}catch(p){e||g(-1,p)}m&&g(j,k,m,l)},!c.async||h.readyState===4?d():(i=++cf,ce&&(cg||(cg={},f(a).unload(ce)),
cg[i]=d),h.onreadystatechange=d)},abort:function(){d&&d(0,1)}}}});var cj={},ck,cl,cm=/^(?:toggle|show|hide)$/,cn=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,co,cp=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],cq;
f.fn.extend({show:function(a,b,c){var d,e;if(a||a===0)return this.animate(ct("show",3),a,b,c);for(var g=0,h=this.length;g<h;g++)d=this[g],
d.style&&(e=d.style.display,!f._data(d,"olddisplay")&&e==="none"&&(e=d.style.display=""),(e===""&&f.css(d,"display")==="none"||!f.contains(d.ownerDocument.documentElement,d))&&f._data(d,"olddisplay",cu(d.nodeName)));
for(g=0;g<h;g++){d=this[g];if(d.style){e=d.style.display;if(e===""||e==="none")d.style.display=f._data(d,"olddisplay")||"";
}}return this},hide:function(a,b,c){if(a||a===0)return this.animate(ct("hide",3),a,b,c);var d,e,g=0,h=this.length;
for(;g<h;g++)d=this[g],d.style&&(e=f.css(d,"display"),e!=="none"&&!f._data(d,"olddisplay")&&f._data(d,"olddisplay",e));
for(g=0;g<h;g++)this[g].style&&(this[g].style.display="none");return this},_toggle:f.fn.toggle,toggle:function(a,b,c){
var d=typeof a=="boolean";f.isFunction(a)&&f.isFunction(b)?this._toggle.apply(this,arguments):a==null||d?this.each(function(){
var b=d?a:f(this).is(":hidden");f(this)[b?"show":"hide"]()}):this.animate(ct("toggle",3),a,b,c);return this;
},fadeTo:function(a,b,c,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b
},a,c,d)},animate:function(a,b,c,d){function g(){e.queue===!1&&f._mark(this);var b=f.extend({},e),c=this.nodeType===1,d=c&&f(this).is(":hidden"),g,h,i,j,k,l,m,n,o,p,q;
b.animatedProperties={};for(i in a){g=f.camelCase(i),i!==g&&(a[g]=a[i],delete a[i]);if((k=f.cssHooks[g])&&"expand"in k){
l=k.expand(a[g]),delete a[g];for(i in l)i in a||(a[i]=l[i])}}for(g in a){h=a[g],f.isArray(h)?(b.animatedProperties[g]=h[1],
h=a[g]=h[0]):b.animatedProperties[g]=b.specialEasing&&b.specialEasing[g]||b.easing||"swing";if(h==="hide"&&d||h==="show"&&!d)return b.complete.call(this);
c&&(g==="height"||g==="width")&&(b.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY],
f.css(this,"display")==="inline"&&f.css(this,"float")==="none"&&(!f.support.inlineBlockNeedsLayout||cu(this.nodeName)==="inline"?this.style.display="inline-block":this.style.zoom=1));
}b.overflow!=null&&(this.style.overflow="hidden");for(i in a)j=new f.fx(this,b,i),h=a[i],cm.test(h)?(q=f._data(this,"toggle"+i)||(h==="toggle"?d?"show":"hide":0),
q?(f._data(this,"toggle"+i,q==="show"?"hide":"show"),j[q]()):j[h]()):(m=cn.exec(h),n=j.cur(),m?(o=parseFloat(m[2]),
p=m[3]||(f.cssNumber[i]?"":"px"),p!=="px"&&(f.style(this,i,(o||1)+p),n=(o||1)/j.cur()*n,f.style(this,i,n+p)),
m[1]&&(o=(m[1]==="-="?-1:1)*o+n),j.custom(n,o,p)):j.custom(n,h,""));return!0}var e=f.speed(b,c,d);if(f.isEmptyObject(a))return this.each(e.complete,[!1]);
a=f.extend({},a);return e.queue===!1?this.each(g):this.queue(e.queue,g)},stop:function(a,c,d){typeof a!="string"&&(d=c,
c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]);return this.each(function(){function h(a,b,c){var e=b[c];f.removeData(a,c,!0),
e.stop(d)}var b,c=!1,e=f.timers,g=f._data(this);d||f._unmark(!0,this);if(a==null)for(b in g)g[b]&&g[b].stop&&b.indexOf(".run")===b.length-4&&h(this,g,b);else g[b=a+".run"]&&g[b].stop&&h(this,g,b);
for(b=e.length;b--;)e[b].elem===this&&(a==null||e[b].queue===a)&&(d?e[b](!0):e[b].saveState(),c=!0,e.splice(b,1));
(!d||!c)&&f.dequeue(this,a)})}}),f.each({slideDown:ct("show",1),slideUp:ct("hide",1),slideToggle:ct("toggle",1),
fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){f.fn[a]=function(a,c,d){
return this.animate(b,a,c,d)}}),f.extend({speed:function(a,b,c){var d=a&&typeof a=="object"?f.extend({},a):{
complete:c||!c&&b||f.isFunction(a)&&a,duration:a,easing:c&&b||b&&!f.isFunction(b)&&b};d.duration=f.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in f.fx.speeds?f.fx.speeds[d.duration]:f.fx.speeds._default;
if(d.queue==null||d.queue===!0)d.queue="fx";d.old=d.complete,d.complete=function(a){f.isFunction(d.old)&&d.old.call(this),
d.queue?f.dequeue(this,d.queue):a!==!1&&f._unmark(this)};return d},easing:{linear:function(a){return a;
},swing:function(a){return-Math.cos(a*Math.PI)/2+.5}},timers:[],fx:function(a,b,c){this.options=b,this.elem=a,
this.prop=c,b.orig=b.orig||{}}}),f.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),
(f.fx.step[this.prop]||f.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];
var a,b=f.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,c,d){
function h(a){return e.step(a)}var e=this,g=f.fx;this.startTime=cq||cr(),this.end=c,this.now=this.start=a,
this.pos=this.state=0,this.unit=d||this.unit||(f.cssNumber[this.prop]?"":"px"),h.queue=this.options.queue,
h.elem=this.elem,h.saveState=function(){f._data(e.elem,"fxshow"+e.prop)===b&&(e.options.hide?f._data(e.elem,"fxshow"+e.prop,e.start):e.options.show&&f._data(e.elem,"fxshow"+e.prop,e.end));
},h()&&f.timers.push(h)&&!co&&(co=setInterval(g.tick,g.interval))},show:function(){var a=f._data(this.elem,"fxshow"+this.prop);
this.options.orig[this.prop]=a||f.style(this.elem,this.prop),this.options.show=!0,a!==b?this.custom(this.cur(),a):this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),
f(this.elem).show()},hide:function(){this.options.orig[this.prop]=f._data(this.elem,"fxshow"+this.prop)||f.style(this.elem,this.prop),
this.options.hide=!0,this.custom(this.cur(),0)},step:function(a){var b,c,d,e=cq||cr(),g=!0,h=this.elem,i=this.options;
if(a||e>=i.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),i.animatedProperties[this.prop]=!0;
for(b in i.animatedProperties)i.animatedProperties[b]!==!0&&(g=!1);if(g){i.overflow!=null&&!f.support.shrinkWrapBlocks&&f.each(["","X","Y"],function(a,b){
h.style["overflow"+b]=i.overflow[a]}),i.hide&&f(h).hide();if(i.hide||i.show)for(b in i.animatedProperties)f.style(h,b,i.orig[b]),
f.removeData(h,"fxshow"+b,!0),f.removeData(h,"toggle"+b,!0);d=i.complete,d&&(i.complete=!1,d.call(h));
}return!1}i.duration==Infinity?this.now=e:(c=e-this.startTime,this.state=c/i.duration,this.pos=f.easing[i.animatedProperties[this.prop]](this.state,c,0,1,i.duration),
this.now=this.start+(this.end-this.start)*this.pos),this.update();return!0}},f.extend(f.fx,{tick:function(){
var a,b=f.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||f.fx.stop();
},interval:13,stop:function(){clearInterval(co),co=null},speeds:{slow:600,fast:200,_default:400},step:{
opacity:function(a){f.style(a.elem,"opacity",a.now)},_default:function(a){a.elem.style&&a.elem.style[a.prop]!=null?a.elem.style[a.prop]=a.now+a.unit:a.elem[a.prop]=a.now;
}}}),f.each(cp.concat.apply([],cp),function(a,b){b.indexOf("margin")&&(f.fx.step[b]=function(a){f.style(a.elem,b,Math.max(0,a.now)+a.unit);
})}),f.expr&&f.expr.filters&&(f.expr.filters.animated=function(a){return f.grep(f.timers,function(b){
return a===b.elem}).length});var cv,cw=/^t(?:able|d|h)$/i,cx=/^(?:body|html)$/i;"getBoundingClientRect"in c.documentElement?cv=function(a,b,c,d){
try{d=a.getBoundingClientRect()}catch(e){}if(!d||!f.contains(c,a))return d?{top:d.top,left:d.left}:{top:0,
left:0};var g=b.body,h=cy(b),i=c.clientTop||g.clientTop||0,j=c.clientLeft||g.clientLeft||0,k=h.pageYOffset||f.support.boxModel&&c.scrollTop||g.scrollTop,l=h.pageXOffset||f.support.boxModel&&c.scrollLeft||g.scrollLeft,m=d.top+k-i,n=d.left+l-j;
return{top:m,left:n}}:cv=function(a,b,c){var d,e=a.offsetParent,g=a,h=b.body,i=b.defaultView,j=i?i.getComputedStyle(a,null):a.currentStyle,k=a.offsetTop,l=a.offsetLeft;
while((a=a.parentNode)&&a!==h&&a!==c){if(f.support.fixedPosition&&j.position==="fixed")break;d=i?i.getComputedStyle(a,null):a.currentStyle,
k-=a.scrollTop,l-=a.scrollLeft,a===e&&(k+=a.offsetTop,l+=a.offsetLeft,f.support.doesNotAddBorder&&(!f.support.doesAddBorderForTableAndCells||!cw.test(a.nodeName))&&(k+=parseFloat(d.borderTopWidth)||0,
l+=parseFloat(d.borderLeftWidth)||0),g=e,e=a.offsetParent),f.support.subtractsBorderForOverflowNotVisible&&d.overflow!=="visible"&&(k+=parseFloat(d.borderTopWidth)||0,
l+=parseFloat(d.borderLeftWidth)||0),j=d}if(j.position==="relative"||j.position==="static")k+=h.offsetTop,
l+=h.offsetLeft;f.support.fixedPosition&&j.position==="fixed"&&(k+=Math.max(c.scrollTop,h.scrollTop),
l+=Math.max(c.scrollLeft,h.scrollLeft));return{top:k,left:l}},f.fn.offset=function(a){if(arguments.length)return a===b?this:this.each(function(b){
f.offset.setOffset(this,a,b)});var c=this[0],d=c&&c.ownerDocument;if(!d)return null;if(c===d.body)return f.offset.bodyOffset(c);
return cv(c,d,d.documentElement)},f.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;f.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(f.css(a,"marginTop"))||0,
c+=parseFloat(f.css(a,"marginLeft"))||0);return{top:b,left:c}},setOffset:function(a,b,c){var d=f.css(a,"position");
d==="static"&&(a.style.position="relative");var e=f(a),g=e.offset(),h=f.css(a,"top"),i=f.css(a,"left"),j=(d==="absolute"||d==="fixed")&&f.inArray("auto",[h,i])>-1,k={},l={},m,n;
j?(l=e.position(),m=l.top,n=l.left):(m=parseFloat(h)||0,n=parseFloat(i)||0),f.isFunction(b)&&(b=b.call(a,c,g)),
b.top!=null&&(k.top=b.top-g.top+m),b.left!=null&&(k.left=b.left-g.left+n),"using"in b?b.using.call(a,k):e.css(k);
}},f.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),c=this.offset(),d=cx.test(b[0].nodeName)?{
top:0,left:0}:b.offset();c.top-=parseFloat(f.css(a,"marginTop"))||0,c.left-=parseFloat(f.css(a,"marginLeft"))||0,
d.top+=parseFloat(f.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(f.css(b[0],"borderLeftWidth"))||0;
return{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||c.body;
while(a&&!cx.test(a.nodeName)&&f.css(a,"position")==="static")a=a.offsetParent;return a})}}),f.each({
scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);f.fn[a]=function(e){
return f.access(this,function(a,e,g){var h=cy(a);if(g===b)return h?c in h?h[c]:f.support.boxModel&&h.document.documentElement[e]||h.document.body[e]:a[e];
h?h.scrollTo(d?f(h).scrollLeft():g,d?g:f(h).scrollTop()):a[e]=g},a,e,arguments.length,null)}}),f.each({
Height:"height",Width:"width"},function(a,c){var d="client"+a,e="scroll"+a,g="offset"+a;f.fn["inner"+a]=function(){
var a=this[0];return a?a.style?parseFloat(f.css(a,c,"padding")):this[c]():null},f.fn["outer"+a]=function(a){
var b=this[0];return b?b.style?parseFloat(f.css(b,c,a?"margin":"border")):this[c]():null},f.fn[c]=function(a){
return f.access(this,function(a,c,h){var i,j,k,l;if(f.isWindow(a)){i=a.document,j=i.documentElement[d];
return f.support.boxModel&&j||i.body&&i.body[d]||j}if(a.nodeType===9){i=a.documentElement;if(i[d]>=i[e])return i[d];
return Math.max(a.body[e],i[e],a.body[g],i[g])}if(h===b){k=f.css(a,c),l=parseFloat(k);return f.isNumeric(l)?l:k;
}f(a).css(c,h)},c,a,arguments.length,null)}}),a.jQuery=a.$=f,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){
return f})})(window);var BEMHTML=function(){var cache,exports={},xjst=function(exports){function $1(__$ctx){
var __t=__$ctx._mode;if(__t==="attrs"){return $2(__$ctx)}else if(__t==="tag"){return $10(__$ctx)}else if(__t==="default"){
return $25(__$ctx)}else if(__t==="content"){return $39(__$ctx)}else{return $47(__$ctx)}}function $2(__$ctx){
if(__$ctx.block==="checkbox"){if(__$ctx.elem==="label"){var _$36a=__$ctx.ctx.attrs||{};_$36a["for"]=__$ctx._checkboxAttrs.id;
return _$36a;return}else{return $47(__$ctx)}}else{return $47(__$ctx)}}function $10(__$ctx){var __t=__$ctx.block;
if(__t==="checkbox"){if(__$ctx.elem==="label"){return"label";return}else{return $47(__$ctx)}}else if(__t==="popup"){
var __t=__$ctx.elem;if(__t==="close"||__t==="tail"){return"i";return}else{return $47(__$ctx)}}else{return $47(__$ctx);
}}function $25(__$ctx){if(__$ctx.block==="popup"){return $26(__$ctx)}else{return $47(__$ctx)}}function $26(__$ctx){
if(!(__$ctx["__$anflg10"]!==true)===false){if(!(__$ctx.mods&&__$ctx.mods["has-close"]==="yes")===false){
if(!!__$ctx.elem===false){__$ctx.ctx.content.push({elem:"close"});if(__$ctx._localLog){__$ctx._localLog.push([["__$anflg10"],true]);
{"";var __r0=__$ctx["__$anflg10"];__$ctx["__$anflg10"]=true;$26(__$ctx);__$ctx["__$anflg10"]=__r0;""}
__$ctx._localLog=__$ctx._localLog.slice(0,-1)}else{"";var __r1=__$ctx["__$anflg10"];__$ctx["__$anflg10"]=true;
$26(__$ctx);__$ctx["__$anflg10"]=__r1;""}undefined;return}else{return $47(__$ctx)}}else{return $47(__$ctx);
}}else{return $47(__$ctx)}}function $39(__$ctx){if(__$ctx.block==="popup"){if(!!__$ctx.elem===false){
return[{elem:"under",mods:__$ctx.ctx.underMods},__$ctx.ctx.content];return}else{return $47(__$ctx)}}else{
return $47(__$ctx)}}function $47(__$ctx){if(__$ctx.block==="popup"){if(!!__$ctx.ctx._defaults===false){
if(!!__$ctx.elem===false){return $51(__$ctx)}else{return $56(__$ctx)}}else{return $56(__$ctx)}}else{return $56(__$ctx);
}}function $51(__$ctx){__$ctx.ctx.mods=__$ctx._.extend({theme:"ffffff",autoclosable:"yes",adaptive:"yes",
animate:"yes"},__$ctx.ctx.mods);if(__$ctx.ctx.zIndex){var _$30attrs=__$ctx.ctx.attrs||(__$ctx.ctx.attrs={});
_$30attrs.style=(_$30attrs.style||"")+";z-index:"+__$ctx.ctx.zIndex+";"}else{undefined}if(__$ctx._localLog){
"";var __r0=__$ctx.ctx,__r1=__r0._defaults;__r0._defaults=true;$1(__$ctx);__r0._defaults=__r1;""}else{
"";var __r2=__$ctx.ctx,__r3=__r2._defaults;__r2._defaults=true;$1(__$ctx);__r2._defaults=__r3;""}undefined;
return}function $56(__$ctx){var __t=__$ctx._mode;if(__t==="attrs"){var __t=__$ctx.block;if(__t==="input"){
var __t=__$ctx.elem;if(__t==="control"){return $59(__$ctx)}else if(__t==="hint"){return{"for":__$ctx._inputId
};return}else{return $139(__$ctx)}}else if(__t==="button"){return $71(__$ctx)}else if(__t==="checkbox"){
if(__$ctx.elem==="control"){var _$2ba=__$ctx.ctx.attrs||{};_$2ba.id=__$ctx._checkboxAttrs.id;_$2ba.type="checkbox";
__$ctx.mods.disabled&&(_$2ba.disabled="disabled");__$ctx.mods.checked=="yes"&&(_$2ba.checked="checked");
return _$2ba;return}else{return $139(__$ctx)}}else if(__t==="link"){if(!!__$ctx.elem===false){return $104(__$ctx);
}else{if(!(__$ctx["__$anflg3"]!==true)===false){if(!!__$ctx.elem===false){return $108(__$ctx)}else{return $111(__$ctx);
}}else{return $111(__$ctx)}}}else if(__t==="b-link"){if(!!__$ctx.elem===false){return $118(__$ctx)}else{
return $139(__$ctx)}}else if(__t==="b-page"){var __t=__$ctx.elem;if(__t==="js"){if(!__$ctx.ctx.url===false){
return{src:__$ctx.ctx.url};return}else{return $139(__$ctx)}}else if(__t==="css"){if(!__$ctx.ctx.url===false){
return{rel:"stylesheet",href:__$ctx.ctx.url};return}else{return $139(__$ctx)}}else if(__t==="favicon"){
return{rel:"shortcut icon",href:__$ctx.ctx.url};return}else if(__t==="meta"){return __$ctx.ctx.attrs;return;
}else{return $139(__$ctx)}}else{return $139(__$ctx)}}else if(__t==="js"){var __t=__$ctx.block;if(__t==="input"){
if(!!__$ctx.elem===false){return __$ctx.mods.popup=="gradient"?{popupMods:{gradient:"yes"}}:true;return;
}else{return $399(__$ctx)}}else if(__t==="button"||__t==="checkbox"){if(!!__$ctx.elem===false){return true;
return}else{return $399(__$ctx)}}else{return $399(__$ctx)}}else if(__t==="value"){if(__$ctx.block==="input"){
return $401(__$ctx)}else{return $512(__$ctx)}}else if(__t==="bem"){var __t=__$ctx.block;if(__t==="b-page"){
var __t=__$ctx.elem;if(__t==="js"||__t==="css"||__t==="favicon"||__t==="meta"||__t==="head"||__t==="root"){
return false;return}else{return $442(__$ctx)}}else if(__t==="i-ua"){if(!!__$ctx.elem===false){return false;
return}else{return $442(__$ctx)}}else{return $442(__$ctx)}}else if(__t==="xUACompatible"){if(__$ctx.block==="b-page"){
if(!!__$ctx.elem===false){return $446(__$ctx)}else{return $512(__$ctx)}}else{return $512(__$ctx)}}else if(__t==="default"){
var __t=__$ctx.block;if(__t==="input"){return $275(__$ctx)}else if(__t==="button"){if(!!__$ctx.elem===false){
return $302(__$ctx)}else{return $512(__$ctx)}}else if(__t==="checkbox"){if(!!__$ctx.elem===false){return $310(__$ctx);
}else{return $315(__$ctx)}}else if(__t==="b-page"){if(__$ctx.elem==="css"){if(!__$ctx.ctx.hasOwnProperty("ie")===false){
if(!!__$ctx.ctx._ieCommented===false){return $330(__$ctx)}else{return $335(__$ctx)}}else{return $335(__$ctx);
}}else{return $335(__$ctx)}}else if(__t==="i-bem"){if(__$ctx.elem==="i18n"){return $345(__$ctx)}else{
return $512(__$ctx)}}else if(__t==="i-jquery"){if(__$ctx.elem==="core"){return $350(__$ctx)}else{return $512(__$ctx);
}}else if(__t==="i-global"){return $353(__$ctx)}else{return $512(__$ctx)}}else if(__t==="cls"){if(__$ctx.block==="b-page"){
if(__$ctx.elem==="root"){return"i-ua_js_no i-ua_css_standard";return}else{return $472(__$ctx)}}else{return $472(__$ctx);
}}else if(__t==="doctype"){if(__$ctx.block==="b-page"){if(!!__$ctx.elem===false){return $476(__$ctx)}else{
return $512(__$ctx)}}else{return $512(__$ctx)}}else if(__t==="js-params"){if(__$ctx.block==="b-page"){
if(!!__$ctx.elem===false){return $484(__$ctx)}else{return $512(__$ctx)}}else{return $512(__$ctx)}}else if(__t==="public-params"){
if(__$ctx.block==="i-global"){return $490(__$ctx)}else{return $512(__$ctx)}}else if(__t==="env"){if(__$ctx.block==="i-global"){
return $498(__$ctx)}else{return $512(__$ctx)}}else if(__t==="content"){var __t=__$ctx.block;if(__t==="input"){
if(__$ctx.elem==="clear"){if(!!__$ctx.ctx.content===false){return"";return}else{return $273(__$ctx)}}else{
return $273(__$ctx)}}else if(__t==="button"){if(!!__$ctx.elem===false){return{elem:"text",tag:"span",
content:__$ctx.ctx.content};return}else{return $273(__$ctx)}}else if(__t==="checkbox"){if(!!__$ctx.elem===false){
return[{elem:"box",tag:"span",elemMods:__$ctx.mods.checked==="yes"?{checked:"yes"}:"",content:[{elem:"control",
attrs:__$ctx.ctx.checkboxAttrs||{}},{elem:"tick",tag:"i"}]},__$ctx.ctx.content];return}else{return $273(__$ctx);
}}else if(__t==="b-page"){if(!!__$ctx.elem===false){return{elem:"body",content:__$ctx.ctx.content};return;
}else{return $273(__$ctx)}}else if(__t==="i-ua"){return $261(__$ctx)}else{return $273(__$ctx)}}else if(__t===""){
return $505(__$ctx)}else if(__t==="tag"){var __t=__$ctx.block;if(__t==="input"){var __t=__$ctx.elem;if(__t==="hint"){
return"label";return}else if(__t==="clear"){return"span";return}else if(__t==="control"){return"input";
return}else{if(!!__$ctx.elem===false){return"span";return}else{return $236(__$ctx)}}}else if(__t==="button"){
if(!__$ctx.ctx.url===false){if(!!__$ctx.elem===false){return"a";return}else{return $159(__$ctx)}}else{
return $159(__$ctx)}}else if(__t==="checkbox"){if(__$ctx.elem==="control"){return"input";return}else{
if(!!__$ctx.elem===false){return"span";return}else{return $236(__$ctx)}}}else if(__t==="link"){var __t=__$ctx.elem;
if(__t==="inner"||__t==="icon"){if(!(__$ctx.mods&&__$ctx.mods.link)===false){return"span";return}else{
return $183(__$ctx)}}else{return $183(__$ctx)}}else if(__t==="b-link"){if(!!__$ctx.elem===false){return"a";
return}else{return $236(__$ctx)}}else if(__t==="b-page"){var __t=__$ctx.elem;if(__t==="js"){return"script";
return}else if(__t==="css"){if(!__$ctx.ctx.url===false){return"link";return}else{return"style";return;
}}else if(__t==="body"){return"";return}else if(__t==="favicon"){return"link";return}else if(__t==="meta"){
return"meta";return}else if(__t==="head"){return"head";return}else if(__t==="root"){return"html";return;
}else{if(!!__$ctx.elem===false){return"body";return}else{return $236(__$ctx)}}}else if(__t==="i-ua"){
if(!!__$ctx.elem===false){return"script";return}else{return $236(__$ctx)}}else{return $236(__$ctx)}}else if(__t==="jsAttr"){
return undefined;return}else if(__t==="mix"){if(__$ctx.block==="b-page"){return $452(__$ctx)}else{return $464(__$ctx);
}}else{return $512(__$ctx)}}function $59(__$ctx){if(!(__$ctx["__$anflg9"]!==true)===false){if(!(__$ctx.mods&&__$ctx.mods.type==="password")===false){
return $62(__$ctx)}else{return $66(__$ctx)}}else{return $66(__$ctx)}}function $62(__$ctx){var __r0,__r1,__r2,__r3;
return __$ctx._.extend(__$ctx._localLog?(__$ctx._localLog.push([["__$anflg9"],true]),__bv53=("",__r0=__$ctx["__$anflg9"],
__$ctx["__$anflg9"]=true,__r1=$59(__$ctx),__$ctx["__$anflg9"]=__r0,"",__r1),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv53):("",__r2=__$ctx["__$anflg9"],__$ctx["__$anflg9"]=true,__r3=$59(__$ctx),__$ctx["__$anflg9"]=__r2,
"",__r3),{type:"password"});return}function $66(__$ctx){var _$2ta=__$ctx._.extend({id:__$ctx._inputId,
name:__$ctx._name},__$ctx.ctx.controlAttrs);(__$ctx._value||__$ctx._value===0)&&(_$2ta.value=__$ctx._value);
__$ctx.mods.disabled&&(_$2ta.disabled="disabled");return _$2ta;return}function $71(__$ctx){if(!(__$ctx["__$anflg6"]!==true)===false){
if(!__$ctx.ctx.url===false){if(!!__$ctx.elem===false){return $75(__$ctx)}else{return $80(__$ctx)}}else{
return $80(__$ctx)}}else{return $80(__$ctx)}}function $75(__$ctx){var __r0,__r1,__r2,__r3;var _$2hctx=__$ctx.ctx,_$2hp=__$ctx._localLog?(__$ctx._localLog.push([["__$anflg6"],true]),
__bv44=("",__r0=__$ctx["__$anflg6"],__$ctx["__$anflg6"]=true,__r1=$71(__$ctx),__$ctx["__$anflg6"]=__r0,
"",__r1),__$ctx._localLog=__$ctx._localLog.slice(0,-1),__bv44):("",__r2=__$ctx["__$anflg6"],__$ctx["__$anflg6"]=true,
__r3=$71(__$ctx),__$ctx["__$anflg6"]=__r2,"",__r3),_$2ha={href:_$2hctx.url};_$2hctx.target&&(_$2ha.target=_$2hctx.target);
__$ctx.mods.disabled&&(_$2ha["aria-disabled"]=true);return __$ctx._.extend(_$2hp,_$2ha);return}function $80(__$ctx){
if(!(__$ctx["__$anflg5"]!==true)===false){if(!!__$ctx.elem===false){if(!!__$ctx.ctx.url===false){return $84(__$ctx);
}else{return $89(__$ctx)}}else{return $89(__$ctx)}}else{return $89(__$ctx)}}function $84(__$ctx){var __r0,__r1,__r2,__r3;
var _$2gctx=__$ctx.ctx,_$2gp=__$ctx._localLog?(__$ctx._localLog.push([["__$anflg5"],true]),__bv43=("",
__r0=__$ctx["__$anflg5"],__$ctx["__$anflg5"]=true,__r1=$71(__$ctx),__$ctx["__$anflg5"]=__r0,"",__r1),
__$ctx._localLog=__$ctx._localLog.slice(0,-1),__bv43):("",__r2=__$ctx["__$anflg5"],__$ctx["__$anflg5"]=true,
__r3=$71(__$ctx),__$ctx["__$anflg5"]=__r2,"",__r3),_$2ga={type:_$2gctx.type?_$2gctx.type:"button"},_$2gprops=["name","value"],_$2gi;
while(_$2gi=_$2gprops.shift()){_$2gctx[_$2gi]&&(_$2ga[_$2gi]=_$2gctx[_$2gi])}__$ctx.mods.disabled&&(_$2ga.disabled="disabled");
return __$ctx._.extend(_$2gp,_$2ga);return}function $89(__$ctx){if(!true===false){if(!!__$ctx.elem===false){
var _$2fctx=__$ctx.ctx,_$2fa={role:"button"};_$2fctx.tabindex&&(_$2fa.tabindex=_$2fctx.tabindex);return _$2fa;
return}else{return $139(__$ctx)}}else{return $139(__$ctx)}}function $104(__$ctx){return{href:__$ctx.ctx.url
};return}function $108(__$ctx){var __r0,__r1,__r2,__r3;var _$1xa=(__$ctx._localLog?(__$ctx._localLog.push([["__$anflg3"],true]),
__bv39=("",__r0=__$ctx["__$anflg3"],__$ctx["__$anflg3"]=true,__r1=$104(__$ctx),__$ctx["__$anflg3"]=__r0,
"",__r1),__$ctx._localLog=__$ctx._localLog.slice(0,-1),__bv39):("",__r2=__$ctx["__$anflg3"],__$ctx["__$anflg3"]=true,
__r3=$104(__$ctx),__$ctx["__$anflg3"]=__r2,"",__r3))||{};if((__$ctx.mods||{}).disabled!=="yes"){_$1xa.tabindex=__$ctx.ctx.tabindex||0;
}else{undefined}return _$1xa;return}function $111(__$ctx){if(!!__$ctx.elem===false){return $113(__$ctx);
}else{return $139(__$ctx)}}function $113(__$ctx){var __r0,__r1,__r2,__r3,__r4,__r5,__r6,__r7;var _$1vctx=__$ctx.ctx,_$1va={
href:__$ctx._.isSimple(_$1vctx.url)?_$1vctx.url:(p=[],__$ctx._localLog?(__$ctx._localLog.push([["_mode"],""],[["_buf"],p]),
__bv38=("",__r0=__$ctx._mode,__$ctx._mode="",__r1=__$ctx._buf,__$ctx._buf=p,__r2=__$ctx.ctx,__$ctx.ctx=_$1vctx.url,
__r3=$505(__$ctx),__$ctx._mode=__r0,__$ctx._buf=__r1,__$ctx.ctx=__r2,"",__r3),__$ctx._localLog=__$ctx._localLog.slice(0,-2),
__bv38):("",__r4=__$ctx._mode,__$ctx._mode="",__r5=__$ctx._buf,__$ctx._buf=p,__r6=__$ctx.ctx,__$ctx.ctx=_$1vctx.url,
__r7=$505(__$ctx),__$ctx._mode=__r4,__$ctx._buf=__r5,__$ctx.ctx=__r6,"",__r7),p.join(""))};["title","target","id"].forEach(function(param){
_$1vctx[param]&&(_$1va[param]=_$1vctx[param])});if(!_$1vctx.url){_$1va.role="button";_$1va.tabindex=0;
}else{undefined}if((_$1vctx.mods||{}).disabled){_$1va["aria-disabled"]=true;if(_$1vctx.url){_$1va.tabindex=-1;
}else{delete _$1va.tabindex}}else{undefined}return _$1va;return}function $118(__$ctx){var __r0,__r1,__r2,__r3,__r4,__r5,__r6,__r7;
var _$1tctx=__$ctx.ctx,_$1tprops=["title","target"],_$1tp=typeof _$1tctx.url,_$1ta={href:_$1tp==="undefined"||_$1tp==="string"?_$1tctx.url:(_$1tp=[],
__$ctx._localLog?(__$ctx._localLog.push([["_buf"],_$1tp],[["_mode"],""]),__bv37=("",__r0=__$ctx._buf,
__$ctx._buf=_$1tp,__r1=__$ctx._mode,__$ctx._mode="",__r2=__$ctx.ctx,__$ctx.ctx=_$1tctx.url,__r3=$505(__$ctx),
__$ctx._buf=__r0,__$ctx._mode=__r1,__$ctx.ctx=__r2,"",__r3),__$ctx._localLog=__$ctx._localLog.slice(0,-2),
__bv37):("",__r4=__$ctx._buf,__$ctx._buf=_$1tp,__r5=__$ctx._mode,__$ctx._mode="",__r6=__$ctx.ctx,__$ctx.ctx=_$1tctx.url,
__r7=$505(__$ctx),__$ctx._buf=__r4,__$ctx._mode=__r5,__$ctx.ctx=__r6,"",__r7),_$1tp.join(""))};while(_$1tp=_$1tprops.pop()){
_$1tctx[_$1tp]&&(_$1ta[_$1tp]=_$1tctx[_$1tp])}return _$1ta;return}function $139(__$ctx){return undefined;
return}function $159(__$ctx){if(!!__$ctx.elem===false){return"button";return}else{return $236(__$ctx);
}}function $183(__$ctx){if(!(__$ctx.mods&&__$ctx.mods.link)===false){return"span";return}else{var __t=__$ctx.elem;
if(__t==="inner"||__t==="icon"){return"span";return}else{if(!!__$ctx.elem===false){return"a";return}else{
if(__$ctx.elem==="inner"){return"span";return}else{if(!!__$ctx.elem===false){return __$ctx.ctx.url?"a":"span";
return}else{return $236(__$ctx)}}}}}}function $236(__$ctx){return undefined;return}function $261(__$ctx){
if(!(__$ctx["__$anflg1"]!==true)===false){if(!!__$ctx.elem===false){return $264(__$ctx)}else{return $267(__$ctx);
}}else{return $267(__$ctx)}}function $264(__$ctx){var __r0,__r1,__r2,__r3;var _$xc=__$ctx._localLog?(__$ctx._localLog.push([["__$anflg1"],true]),
__bv26=("",__r0=__$ctx["__$anflg1"],__$ctx["__$anflg1"]=true,__r1=$261(__$ctx),__$ctx["__$anflg1"]=__r0,
"",__r1),__$ctx._localLog=__$ctx._localLog.slice(0,-1),__bv26):("",__r2=__$ctx["__$anflg1"],__$ctx["__$anflg1"]=true,
__r3=$261(__$ctx),__$ctx["__$anflg1"]=__r2,"",__r3);_$xc+=[";(function(d,e,c,r,n,w,v,f){","e=d.documentElement;",'c="className";','r="replace";','n="createElementNS";','f="firstChild";','w="http://www.w3.org/2000/svg";','e[c]+=" i-ua_svg_"+(!!d[n]&&!!d[n](w,"svg").createSVGRect?"yes":"no");','v=d.createElement("div");','v.innerHTML="<svg/>";','e[c]+=" i-ua_inlinesvg_"+((v[f]&&v[f].namespaceURI)==w?"yes":"no");',"})(document);"].join("");
return _$xc;return}function $267(__$ctx){if(!!__$ctx.elem===false){return[";(function(d,e,c,r){","e=d.documentElement;",'c="className";','r="replace";','e[c]=e[c][r]("i-ua_js_no","i-ua_js_yes");','if(d.compatMode!="CSS1Compat")','e[c]=e[c][r]("i-ua_css_standart","i-ua_css_quirks")',"})(document);"].join("");
return}else{return $273(__$ctx)}}function $273(__$ctx){return __$ctx.ctx.content;return}function $275(__$ctx){
if(__$ctx.elem==="control"){if(!(__$ctx["__$anflg8"]!==true)===false){if(!!__$ctx.mods.clear===false){
return $279(__$ctx)}else{return $284(__$ctx)}}else{return $284(__$ctx)}}else{return $284(__$ctx)}}function $279(__$ctx){
if(__$ctx._localLog){__$ctx._localLog.push([["__$anflg8"],true]);{"";var __r0=__$ctx["__$anflg8"];__$ctx["__$anflg8"]=true;
if(__$ctx._localLog){__$ctx._localLog.push([["_mode"],""]);{"";var __r1=__$ctx.ctx;__$ctx.ctx={elem:"box",
tag:"span",content:[__$ctx.ctx,{elem:"clear"}]};var __r2=__$ctx._mode;__$ctx._mode="";$505(__$ctx);__$ctx.ctx=__r1;
__$ctx._mode=__r2;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1)}else{"";var __r3=__$ctx.ctx;__$ctx.ctx={
elem:"box",tag:"span",content:[__$ctx.ctx,{elem:"clear"}]};var __r4=__$ctx._mode;__$ctx._mode="";$505(__$ctx);
__$ctx.ctx=__r3;__$ctx._mode=__r4;""}__$ctx["__$anflg8"]=__r0;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1);
}else{"";var __r5=__$ctx["__$anflg8"];__$ctx["__$anflg8"]=true;if(__$ctx._localLog){__$ctx._localLog.push([["_mode"],""]);
{"";var __r6=__$ctx.ctx;__$ctx.ctx={elem:"box",tag:"span",content:[__$ctx.ctx,{elem:"clear"}]};var __r7=__$ctx._mode;
__$ctx._mode="";$505(__$ctx);__$ctx.ctx=__r6;__$ctx._mode=__r7;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1);
}else{"";var __r8=__$ctx.ctx;__$ctx.ctx={elem:"box",tag:"span",content:[__$ctx.ctx,{elem:"clear"}]};var __r9=__$ctx._mode;
__$ctx._mode="";$505(__$ctx);__$ctx.ctx=__r8;__$ctx._mode=__r9;""}__$ctx["__$anflg8"]=__r5;""}undefined;
return}function $284(__$ctx){if(!!__$ctx.elem===false){if(!!(__$ctx.ctx.mods||{}).theme===false){return $287(__$ctx);
}else{return $290(__$ctx)}}else{return $290(__$ctx)}}function $287(__$ctx){var __r0,__r1,__r2,__r3,__r4,__r5,__r6,__r7,__r8,__r9;
return __$ctx._localLog?("",__r0=__$ctx.ctx,__r1=__r0.mods,__r0.mods=__$ctx.ctx.mods||{},__r2=__$ctx.ctx.mods,
__r3=__r2.theme,__r2.theme="normal",__r4=$275(__$ctx),__r0.mods=__r1,__r2.theme=__r3,"",__r4):("",__r5=__$ctx.ctx,
__r6=__r5.mods,__r5.mods=__$ctx.ctx.mods||{},__r7=__$ctx.ctx.mods,__r8=__r7.theme,__r7.theme="normal",
__r9=$275(__$ctx),__r5.mods=__r6,__r7.theme=__r8,"",__r9);return}function $290(__$ctx){if(!(__$ctx["__$anflg7"]!==true)===false){
if(!!__$ctx._inputId===false){if(!!__$ctx.elem===false){return $294(__$ctx)}else{return $512(__$ctx)}
}else{return $512(__$ctx)}}else{return $512(__$ctx)}}function $294(__$ctx){var __r0,__r1,__r2,__r3,__r4,__r5;
var _$2mvalue=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"value"]),__bv45=("",__r0=__$ctx._mode,
__$ctx._mode="value",__r1=__$ctx.ctx,__$ctx.ctx=__$ctx.ctx.value,__r2=$401(__$ctx),__$ctx._mode=__r0,
__$ctx.ctx=__r1,"",__r2),__$ctx._localLog=__$ctx._localLog.slice(0,-1),__bv45):("",__r3=__$ctx._mode,
__$ctx._mode="value",__r4=__$ctx.ctx,__$ctx.ctx=__$ctx.ctx.value,__r5=$401(__$ctx),__$ctx._mode=__r3,
__$ctx.ctx=__r4,"",__r5);if(__$ctx._localLog){__$ctx._localLog.push([["__$anflg7"],true]);{"";var __r6=__$ctx["__$anflg7"];
__$ctx["__$anflg7"]=true;if(__$ctx._localLog){__bv46=__$ctx.ctx.id||__$ctx.generateId();__bv47=__$ctx.ctx.name||"";
__$ctx._localLog.push([["_inputId"],__bv46],[["_name"],__bv47],[["_value"],_$2mvalue],[["_inputLink"],true],[["_disabled"],["mods","disabled"]]);
{"";var __r7=__$ctx._inputId;__$ctx._inputId=__bv46;var __r8=__$ctx._name;__$ctx._name=__bv47;var __r9=__$ctx._value;
__$ctx._value=_$2mvalue;var __r10=__$ctx._inputLink;__$ctx._inputLink=true;var __r11=__$ctx._disabled;
__$ctx._disabled=__$ctx.mods.disabled;$275(__$ctx);__$ctx._inputId=__r7;__$ctx._name=__r8;__$ctx._value=__r9;
__$ctx._inputLink=__r10;__$ctx._disabled=__r11;""}__$ctx._localLog=__$ctx._localLog.slice(0,-5)}else{
"";var __r12=__$ctx._inputId;__$ctx._inputId=__$ctx.ctx.id||__$ctx.generateId();var __r13=__$ctx._name;
__$ctx._name=__$ctx.ctx.name||"";var __r14=__$ctx._value;__$ctx._value=_$2mvalue;var __r15=__$ctx._inputLink;
__$ctx._inputLink=true;var __r16=__$ctx._disabled;__$ctx._disabled=__$ctx.mods.disabled;$275(__$ctx);__$ctx._inputId=__r12;
__$ctx._name=__r13;__$ctx._value=__r14;__$ctx._inputLink=__r15;__$ctx._disabled=__r16;""}__$ctx["__$anflg7"]=__r6;
""}__$ctx._localLog=__$ctx._localLog.slice(0,-1)}else{"";var __r17=__$ctx["__$anflg7"];__$ctx["__$anflg7"]=true;
if(__$ctx._localLog){__bv46=__$ctx.ctx.id||__$ctx.generateId();__bv47=__$ctx.ctx.name||"";__$ctx._localLog.push([["_inputId"],__bv46],[["_name"],__bv47],[["_value"],_$2mvalue],[["_inputLink"],true],[["_disabled"],["mods","disabled"]]);
{"";var __r18=__$ctx._inputId;__$ctx._inputId=__bv46;var __r19=__$ctx._name;__$ctx._name=__bv47;var __r20=__$ctx._value;
__$ctx._value=_$2mvalue;var __r21=__$ctx._inputLink;__$ctx._inputLink=true;var __r22=__$ctx._disabled;
__$ctx._disabled=__$ctx.mods.disabled;$275(__$ctx);__$ctx._inputId=__r18;__$ctx._name=__r19;__$ctx._value=__r20;
__$ctx._inputLink=__r21;__$ctx._disabled=__r22;""}__$ctx._localLog=__$ctx._localLog.slice(0,-5)}else{
"";var __r23=__$ctx._inputId;__$ctx._inputId=__$ctx.ctx.id||__$ctx.generateId();var __r24=__$ctx._name;
__$ctx._name=__$ctx.ctx.name||"";var __r25=__$ctx._value;__$ctx._value=_$2mvalue;var __r26=__$ctx._inputLink;
__$ctx._inputLink=true;var __r27=__$ctx._disabled;__$ctx._disabled=__$ctx.mods.disabled;$275(__$ctx);__$ctx._inputId=__r23;
__$ctx._name=__r24;__$ctx._value=__r25;__$ctx._inputLink=__r26;__$ctx._disabled=__r27;""}__$ctx["__$anflg7"]=__r17;
""}undefined;return}function $302(__$ctx){if(!!(__$ctx.ctx.mods||{}).theme===false){return $304(__$ctx);
}else{return $512(__$ctx)}}function $304(__$ctx){if(__$ctx._localLog){"";var __r0=__$ctx.ctx,__r1=__r0.mods;
__r0.mods=__$ctx._.extend(__$ctx.ctx.mods||{},{theme:"normal"});$302(__$ctx);__r0.mods=__r1;""}else{"";
var __r2=__$ctx.ctx,__r3=__r2.mods;__r2.mods=__$ctx._.extend(__$ctx.ctx.mods||{},{theme:"normal"});$302(__$ctx);
__r2.mods=__r3;""}undefined;return}function $310(__$ctx){if(!!(__$ctx.ctx.mods||{}).theme===false){return $312(__$ctx);
}else{return $315(__$ctx)}}function $312(__$ctx){if(__$ctx._localLog){"";var __r0=__$ctx.ctx,__r1=__r0.mods;
__r0.mods=__$ctx._.extend(__$ctx.ctx.mods||{},{theme:"normal"});$310(__$ctx);__r0.mods=__r1;""}else{"";
var __r2=__$ctx.ctx,__r3=__r2.mods;__r2.mods=__$ctx._.extend(__$ctx.ctx.mods||{},{theme:"normal"});$310(__$ctx);
__r2.mods=__r3;""}undefined;return}function $315(__$ctx){if(!(__$ctx["__$anflg4"]!==true)===false){if(!!__$ctx._checkboxAttrs===false){
if(!!__$ctx.elem===false){return $319(__$ctx)}else{return $512(__$ctx)}}else{return $512(__$ctx)}}else{
return $512(__$ctx)}}function $319(__$ctx){if(__$ctx._localLog){__$ctx._localLog.push([["__$anflg4"],true]);
{"";var __r0=__$ctx["__$anflg4"];__$ctx["__$anflg4"]=true;if(__$ctx._localLog){__bv40=(__$ctx.ctx.checkboxAttrs||{}).id?__$ctx.ctx.checkboxAttrs:{
id:"id"+__$ctx.generateId()};__$ctx._localLog.push([["_checkboxAttrs"],__bv40]);{"";var __r1=__$ctx._checkboxAttrs;
__$ctx._checkboxAttrs=__bv40;$310(__$ctx);__$ctx._checkboxAttrs=__r1;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1);
}else{"";var __r2=__$ctx._checkboxAttrs;__$ctx._checkboxAttrs=(__$ctx.ctx.checkboxAttrs||{}).id?__$ctx.ctx.checkboxAttrs:{
id:"id"+__$ctx.generateId()};$310(__$ctx);__$ctx._checkboxAttrs=__r2;""}__$ctx["__$anflg4"]=__r0;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1);
}else{"";var __r3=__$ctx["__$anflg4"];__$ctx["__$anflg4"]=true;if(__$ctx._localLog){__bv40=(__$ctx.ctx.checkboxAttrs||{}).id?__$ctx.ctx.checkboxAttrs:{
id:"id"+__$ctx.generateId()};__$ctx._localLog.push([["_checkboxAttrs"],__bv40]);{"";var __r4=__$ctx._checkboxAttrs;
__$ctx._checkboxAttrs=__bv40;$310(__$ctx);__$ctx._checkboxAttrs=__r4;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1);
}else{"";var __r5=__$ctx._checkboxAttrs;__$ctx._checkboxAttrs=(__$ctx.ctx.checkboxAttrs||{}).id?__$ctx.ctx.checkboxAttrs:{
id:"id"+__$ctx.generateId()};$310(__$ctx);__$ctx._checkboxAttrs=__r5;""}__$ctx["__$anflg4"]=__r3;""}undefined;
return}function $330(__$ctx){var _$1mie=__$ctx.ctx.ie;if(_$1mie===true){if(__$ctx._localLog){__$ctx._localLog.push([["_mode"],""]);
{"";var __r4=__$ctx._mode;__$ctx._mode="";var __r5=__$ctx.ctx;__$ctx.ctx=[6,7,8,9].map(function(v){return{
elem:"css",url:this.ctx.url+".ie"+v+".css",ie:"IE "+v}},__$ctx);$505(__$ctx);__$ctx._mode=__r4;__$ctx.ctx=__r5;
""}__$ctx._localLog=__$ctx._localLog.slice(0,-1)}else{"";var __r6=__$ctx._mode;__$ctx._mode="";var __r7=__$ctx.ctx;
__$ctx.ctx=[6,7,8,9].map(function(v){return{elem:"css",url:this.ctx.url+".ie"+v+".css",ie:"IE "+v}},__$ctx);
$505(__$ctx);__$ctx._mode=__r6;__$ctx.ctx=__r7;""}undefined}else{var _$1mhideRule=!_$1mie?["gt IE 9","<!-->","<!--"]:_$1mie==="!IE"?[_$1mie,"<!-->","<!--"]:[_$1mie,"",""];
if(__$ctx._localLog){__$ctx._localLog.push([["_mode"],""]);{"";var __r8=__$ctx._mode;__$ctx._mode="";var __r9=__$ctx.ctx,__r10=__r9._ieCommented;
__r9._ieCommented=true;var __r11=__$ctx.ctx;__$ctx.ctx=["<!--[if "+_$1mhideRule[0]+"]>",_$1mhideRule[1],__$ctx.ctx,_$1mhideRule[2],"<![endif]-->"];
$505(__$ctx);__$ctx._mode=__r8;__r9._ieCommented=__r10;__$ctx.ctx=__r11;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1);
}else{"";var __r12=__$ctx._mode;__$ctx._mode="";var __r13=__$ctx.ctx,__r14=__r13._ieCommented;__r13._ieCommented=true;
var __r15=__$ctx.ctx;__$ctx.ctx=["<!--[if "+_$1mhideRule[0]+"]>",_$1mhideRule[1],__$ctx.ctx,_$1mhideRule[2],"<![endif]-->"];
$505(__$ctx);__$ctx._mode=__r12;__r13._ieCommented=__r14;__$ctx.ctx=__r15;""}undefined}return}function $335(__$ctx){
if(!(__$ctx["__$anflg2"]!==true)===false){if(!!__$ctx.elem===false){return $338(__$ctx)}else{return $512(__$ctx);
}}else{return $512(__$ctx)}}function $338(__$ctx){var __r0,__r1,__r2,__r3,__r4,__r5,__r6,__r7;var _$12ctx=__$ctx.ctx,_$12dtype=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"doctype"]),
__bv29=("",__r0=__$ctx._mode,__$ctx._mode="doctype",__r1=$476(__$ctx),__$ctx._mode=__r0,"",__r1),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv29):("",__r2=__$ctx._mode,__$ctx._mode="doctype",__r3=$476(__$ctx),__$ctx._mode=__r2,"",__r3),_$12xUA=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"xUACompatible"]),
__bv30=("",__r4=__$ctx._mode,__$ctx._mode="xUACompatible",__r5=$446(__$ctx),__$ctx._mode=__r4,"",__r5),
__$ctx._localLog=__$ctx._localLog.slice(0,-1),__bv30):("",__r6=__$ctx._mode,__$ctx._mode="xUACompatible",
__r7=$446(__$ctx),__$ctx._mode=__r6,"",__r7),_$12buf=[_$12dtype,{elem:"root",content:[{elem:"head",content:[{
tag:"meta",attrs:{charset:"utf-8"}},_$12xUA,{tag:"title",content:_$12ctx.title},_$12ctx.favicon?{elem:"favicon",
url:_$12ctx.favicon}:"",_$12ctx.meta,{block:"i-ua"},_$12ctx.head]},_$12ctx]}];if(__$ctx._localLog){__$ctx._localLog.push([["__$anflg2"],true]);
{"";var __r8=__$ctx["__$anflg2"];__$ctx["__$anflg2"]=true;if(__$ctx._localLog){__$ctx._localLog.push([["_mode"],""]);
{"";var __r9=__$ctx.ctx;__$ctx.ctx=_$12buf;var __r10=__$ctx._mode;__$ctx._mode="";$505(__$ctx);__$ctx.ctx=__r9;
__$ctx._mode=__r10;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1)}else{"";var __r11=__$ctx.ctx;__$ctx.ctx=_$12buf;
var __r12=__$ctx._mode;__$ctx._mode="";$505(__$ctx);__$ctx.ctx=__r11;__$ctx._mode=__r12;""}__$ctx["__$anflg2"]=__r8;
""}__$ctx._localLog=__$ctx._localLog.slice(0,-1)}else{"";var __r13=__$ctx["__$anflg2"];__$ctx["__$anflg2"]=true;
if(__$ctx._localLog){__$ctx._localLog.push([["_mode"],""]);{"";var __r14=__$ctx.ctx;__$ctx.ctx=_$12buf;
var __r15=__$ctx._mode;__$ctx._mode="";$505(__$ctx);__$ctx.ctx=__r14;__$ctx._mode=__r15;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1);
}else{"";var __r16=__$ctx.ctx;__$ctx.ctx=_$12buf;var __r17=__$ctx._mode;__$ctx._mode="";$505(__$ctx);__$ctx.ctx=__r16;
__$ctx._mode=__r17;""}__$ctx["__$anflg2"]=__r13;""}undefined;return}function $345(__$ctx){var __r0,__r1,__r2,__r3,__r4,__r5,__r6,__r7;
if(!__$ctx.ctx){return""}else{undefined}var _$zctx=__$ctx.ctx,_$zkeyset=_$zctx.keyset,_$zkey=_$zctx.key,_$zparams=_$zctx.params||{};
if(!(_$zkeyset||_$zkey)){return""}else{undefined}if(_$zctx.content){var _$zcnt;_$zparams.content=(_$zcnt=[],
__$ctx._localLog?(__$ctx._localLog.push([["_buf"],_$zcnt],[["_mode"],""]),__bv28=("",__r0=__$ctx._buf,
__$ctx._buf=_$zcnt,__r1=__$ctx._mode,__$ctx._mode="",__r2=__$ctx.ctx,__$ctx.ctx=_$zctx.content,__r3=$505(__$ctx),
__$ctx._buf=__r0,__$ctx._mode=__r1,__$ctx.ctx=__r2,"",__r3),__$ctx._localLog=__$ctx._localLog.slice(0,-2),
__bv28):("",__r4=__$ctx._buf,__$ctx._buf=_$zcnt,__r5=__$ctx._mode,__$ctx._mode="",__r6=__$ctx.ctx,__$ctx.ctx=_$zctx.content,
__r7=$505(__$ctx),__$ctx._buf=__r4,__$ctx._mode=__r5,__$ctx.ctx=__r6,"",__r7),_$zcnt.join(""))}else{undefined;
}__$ctx._buf.push(BEM.I18N(_$zkeyset,_$zkey,_$zparams));return}function $350(__$ctx){var __r0,__r1,__r2,__r3,__r4,__r5;
return __$ctx._localLog?(__$ctx._localLog.push([["_mode"],""]),__bv27=("",__r0=__$ctx._mode,__$ctx._mode="",
__r1=__$ctx.ctx,__$ctx.ctx={block:"b-page",elem:"js",url:"//yastatic.net/jquery/1.8.3/jquery.min.js"},
__r2=$505(__$ctx),__$ctx._mode=__r0,__$ctx.ctx=__r1,"",__r2),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv27):("",__r3=__$ctx._mode,__$ctx._mode="",__r4=__$ctx.ctx,__$ctx.ctx={block:"b-page",elem:"js",url:"//yastatic.net/jquery/1.8.3/jquery.min.js"
},__r5=$505(__$ctx),__$ctx._mode=__r3,__$ctx.ctx=__r4,"",__r5);return}function $353(__$ctx){var __t=__$ctx.elem;
if(__t==="lego-static-host"){return"//yastatic.net/lego/2.10-142";return}else if(__t==="export-host"){
return"//export.yandex.ru";return}else if(__t==="social-host"){return"//social.yandex.ru";return}else if(__t==="pass-host"){
return"//pass.yandex.ru";return}else if(__t==="passport-host"){return"https://passport.yandex.ru";return;
}else if(__t==="click-host"){return"//clck.yandex.ru";return}else if(__t==="content-region"||__t==="tld"||__t==="lang"){
return"ru";return}else{if(!__$ctx.elem===false){return"";return}else{if(!!__$ctx.elem===false){return $377(__$ctx);
}else{return $512(__$ctx)}}}}function $377(__$ctx){var _$hparams=__$ctx.ctx.params||{},_$hiGlobal=__$ctx["i-global"],_$hisTldChanged=_$hparams.tld&&_$hparams.tld!==_$hiGlobal.tld,_$htld,_$hxYaDomain,_$hyaDomain;
if(_$hisTldChanged){_$htld=_$hparams.tld;_$hxYaDomain=_$htld==="tr"?"yandex.com.tr":"yandex."+_$htld;_$hyaDomain=["ua","by","kz"].indexOf(_$htld)!=-1?"yandex.ru":_$hxYaDomain;
_$hiGlobal["content-region"]=_$htld;_$hiGlobal["click-host"]="//clck."+_$hyaDomain;_$hiGlobal["passport-host"]="https://passport."+_$hyaDomain;
_$hiGlobal["pass-host"]="//pass."+_$hxYaDomain;_$hiGlobal["social-host"]="//social."+_$hxYaDomain;_$hiGlobal["export-host"]="//export."+_$hxYaDomain;
}else{undefined}for(var _$hp in _$hparams){_$hiGlobal[_$hp]=_$hparams[_$hp]}return}function $399(__$ctx){
return undefined;return}function $401(__$ctx){if(!__$ctx._.isSimple(__$ctx.ctx)===false){return __$ctx.ctx;
return}else{if(!__$ctx.ctx===false){if(!!__$ctx.elem===false){return $407(__$ctx)}else{return $410(__$ctx);
}}else{return $410(__$ctx)}}}function $407(__$ctx){var _$2ovalue=[];if(__$ctx._localLog){__$ctx._localLog.push([["_buf"],_$2ovalue],[["_mode"],""]);
{"";var __r0=__$ctx._buf;__$ctx._buf=_$2ovalue;var __r1=__$ctx._mode;__$ctx._mode="";$505(__$ctx);__$ctx._buf=__r0;
__$ctx._mode=__r1;""}__$ctx._localLog=__$ctx._localLog.slice(0,-2)}else{"";var __r2=__$ctx._buf;__$ctx._buf=_$2ovalue;
var __r3=__$ctx._mode;__$ctx._mode="";$505(__$ctx);__$ctx._buf=__r2;__$ctx._mode=__r3;""}undefined;return _$2ovalue.join("");
return}function $410(__$ctx){if(!true===false){if(!!__$ctx.elem===false){return"";return}else{return $512(__$ctx);
}}else{return $512(__$ctx)}}function $442(__$ctx){return undefined;return}function $446(__$ctx){return{
tag:"meta",attrs:{"http-equiv":"X-UA-Compatible",content:"IE=EmulateIE7, IE=edge"}};return}function $452(__$ctx){
if(!!__$ctx.ctx._iGlobal===false){if(!!__$ctx.elem===false){return $455(__$ctx)}else{return $458(__$ctx);
}}else{return $458(__$ctx)}}function $455(__$ctx){var __r0,__r1,__r2,__r3,__r4,__r5,__r6,__r7,__r8,__r9;
var _$1imix=__$ctx._localLog?("",__r0=__$ctx.ctx,__r1=__r0._iGlobal,__r0._iGlobal=true,__r2=$452(__$ctx),
__r0._iGlobal=__r1,"",__r2):("",__r3=__$ctx.ctx,__r4=__r3._iGlobal,__r3._iGlobal=true,__r5=$452(__$ctx),
__r3._iGlobal=__r4,"",__r5),_$1ijsParams=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"js-params"]),
__bv33=("",__r6=__$ctx._mode,__$ctx._mode="js-params",__r7=$484(__$ctx),__$ctx._mode=__r6,"",__r7),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv33):("",__r8=__$ctx._mode,__$ctx._mode="js-params",__r9=$484(__$ctx),__$ctx._mode=__r8,"",__r9);_$1imix?_$1imix.push(_$1ijsParams):_$1imix=[_$1ijsParams];
return _$1imix;return}function $458(__$ctx){if(!!__$ctx.elem===false){return[{elem:"body"}];return}else{
return $464(__$ctx)}}function $464(__$ctx){return undefined;return}function $472(__$ctx){return undefined;
return}function $476(__$ctx){return __$ctx.ctx.doctype||"<!DOCTYPE html>";return}function $484(__$ctx){
var __r0,__r1,__r2,__r3,__r4,__r5,__r6,__r7;var _$t_this=__$ctx["i-global"],_$tjs={},_$tblock={block:"i-global",
js:_$tjs},_$te;for(_$te in _$t_this){if(_$t_this.hasOwnProperty(_$te)&&(__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"public-params"],[["block"],"i-global"],[["elem"],_$te]),
__bv25=("",__r0=__$ctx._mode,__$ctx._mode="public-params",__r1=__$ctx.block,__$ctx.block="i-global",__r2=__$ctx.elem,
__$ctx.elem=_$te,__r3=$490(__$ctx),__$ctx._mode=__r0,__$ctx.block=__r1,__$ctx.elem=__r2,"",__r3),__$ctx._localLog=__$ctx._localLog.slice(0,-3),
__bv25):("",__r4=__$ctx._mode,__$ctx._mode="public-params",__r5=__$ctx.block,__$ctx.block="i-global",
__r6=__$ctx.elem,__$ctx.elem=_$te,__r7=$490(__$ctx),__$ctx._mode=__r4,__$ctx.block=__r5,__$ctx.elem=__r6,
"",__r7))){_$tjs[_$te]=_$t_this[_$te]}else{undefined}}return _$tblock;return}function $490(__$ctx){if(!__$ctx.elem===false){
return{id:1,lang:1,tld:1,"content-region":1,"user-region":1,login:1,displayName:1,index:1,yandexuid:1,
"passport-host":1,"pass-host":1,"passport-msg":1,"static-host":1,"lego-static-host":1,"social-host":1,
clck:1,"click-host":1,"export-host":1,"i-host":1,"social-retpath":1,"lego-path":1,sid:1,retpath:1,uid:1
}[__$ctx.elem]||false;return}else{return $512(__$ctx)}}function $498(__$ctx){if(!!__$ctx.elem===false){
return{};return}else{return $512(__$ctx)}}function $505(__$ctx){if(!!__$ctx["i-global"]===false){return $507(__$ctx);
}else{return $512(__$ctx)}}function $507(__$ctx){var __r7,__r0,__r2,__r3,__r4,__r5,__r6,__r1,__r8,__r9,__r10,__r11,__r12,__r13;
var _$fps={},_$fes=["lang","tld","content-region","click-host","passport-host","pass-host","social-host","export-host","login","lego-static-host"],_$fe;
while(_$fe=_$fes.shift()){_$fps[_$fe]=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"default"],[["block"],"i-global"],[["elem"],_$fe]),
__bv23=("",__r0=__$ctx._mode,__$ctx._mode="default",__r1=__$ctx.block,__$ctx.block="i-global",__r2=__$ctx.elem,
__$ctx.elem=_$fe,__r3=$353(__$ctx),__$ctx._mode=__r0,__$ctx.block=__r1,__$ctx.elem=__r2,"",__r3),__$ctx._localLog=__$ctx._localLog.slice(0,-3),
__bv23):("",__r4=__$ctx._mode,__$ctx._mode="default",__r5=__$ctx.block,__$ctx.block="i-global",__r6=__$ctx.elem,
__$ctx.elem=_$fe,__r7=$353(__$ctx),__$ctx._mode=__r4,__$ctx.block=__r5,__$ctx.elem=__r6,"",__r7)}__$ctx["i-global"]=__$ctx._.extend(_$fps,__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"env"],[["block"],"i-global"]),
__bv24=("",__r8=__$ctx._mode,__$ctx._mode="env",__r9=__$ctx.block,__$ctx.block="i-global",__r10=$498(__$ctx),
__$ctx._mode=__r8,__$ctx.block=__r9,"",__r10),__$ctx._localLog=__$ctx._localLog.slice(0,-2),__bv24):("",
__r11=__$ctx._mode,__$ctx._mode="env",__r12=__$ctx.block,__$ctx.block="i-global",__r13=$498(__$ctx),__$ctx._mode=__r11,
__$ctx.block=__r12,"",__r13));applyc(__$ctx);undefined;return}function $512(__$ctx){if(!__$ctx.ctx===false){
if(!__$ctx.ctx.link===false){if(!!__$ctx._.isSimple(__$ctx.ctx)===false){return $516(__$ctx)}else{return $521(__$ctx);
}}else{return $521(__$ctx)}}else{return $521(__$ctx)}}function $516(__$ctx){var __r0,__r1,__r2,__r3;function _$6follow(){
if(this.ctx.link==="no-follow"){return undefined}else{undefined}var data=this._links[this.ctx.link];return __$ctx._localLog?("",
__r0=this.ctx,this.ctx=data,__r1=$1(__$ctx),this.ctx=__r0,"",__r1):("",__r2=this.ctx,this.ctx=data,__r3=$1(__$ctx),
this.ctx=__r2,"",__r3)}if(!cache||!__$ctx._cacheLog){return _$6follow.call(__$ctx)}else{undefined}var _$6contents=__$ctx._buf.slice(__$ctx._cachePos).join("");
__$ctx._cachePos=__$ctx._buf.length;__$ctx._cacheLog.push(_$6contents,{log:__$ctx._localLog.slice(),link:__$ctx.ctx.link
});var _$6res=_$6follow.call(__$ctx);__$ctx._cachePos=__$ctx._buf.length;return _$6res;return}function $521(__$ctx){
if(!cache===false){if(!__$ctx.ctx===false){if(!__$ctx.ctx.cache===false){return $525(__$ctx)}else{return $530(__$ctx);
}}else{return $530(__$ctx)}}else{return $530(__$ctx)}}function $525(__$ctx){var _$5cached;function _$5setProperty(obj,key,value){
if(key.length===0){return undefined}else{undefined}if(Array.isArray(value)){var target=obj;for(var i=0;i<value.length-1;i++){
target=target[value[i]]}value=target[value[i]]}else{undefined}var host=obj,previous;for(var i=0;i<key.length-1;i++){
host=host[key[i]]}previous=host[key[i]];host[key[i]]=value;return previous}if(_$5cached=cache.get(__$ctx.ctx.cache)){
var _$5oldLinks=__$ctx._links;if(__$ctx.ctx.links){__$ctx._links=__$ctx.ctx.links}else{undefined}for(var _$5i=0;_$5i<_$5cached.log.length;_$5i++){
if(typeof _$5cached.log[_$5i]==="string"){__$ctx._buf.push(_$5cached.log[_$5i]);continue}else{undefined;
}var _$5log=_$5cached.log[_$5i],_$5reverseLog;_$5reverseLog=_$5log.log.map(function(entry){return{key:entry[0],
value:_$5setProperty(this,entry[0],entry[1])}},__$ctx).reverse();if(__$ctx._localLog){__$ctx._localLog.push([["_cacheLog"],null]);
{"";var __r0=__$ctx.ctx,__r1=__r0.cache;__r0.cache=null;var __r2=__$ctx._cacheLog;__$ctx._cacheLog=null;
var __r3=__$ctx.ctx,__r4=__r3.link;__r3.link=_$5log.link;$1(__$ctx);__r0.cache=__r1;__$ctx._cacheLog=__r2;
__r3.link=__r4;""}__$ctx._localLog=__$ctx._localLog.slice(0,-1)}else{"";var __r5=__$ctx.ctx,__r6=__r5.cache;
__r5.cache=null;var __r7=__$ctx._cacheLog;__$ctx._cacheLog=null;var __r8=__$ctx.ctx,__r9=__r8.link;__r8.link=_$5log.link;
$1(__$ctx);__r5.cache=__r6;__$ctx._cacheLog=__r7;__r8.link=__r9;""}undefined;_$5reverseLog.forEach(function(entry){
_$5setProperty(this,entry.key,entry.value)},__$ctx)}__$ctx._links=_$5oldLinks;return _$5cached.res}else{
undefined}var _$5cacheLog=[],_$5res;if(__$ctx._localLog){__bv21=[];__$ctx._localLog.push([["_cachePos"],["_buf","length"]],[["_cacheLog"],_$5cacheLog],[["_localLog"],__bv21]);
{"";var __r10=__$ctx.ctx,__r11=__r10.cache;__r10.cache=null;var __r12=__$ctx._cachePos;__$ctx._cachePos=__$ctx._buf.length;
var __r13=__$ctx._cacheLog;__$ctx._cacheLog=_$5cacheLog;var __r14=__$ctx._localLog;__$ctx._localLog=__bv21;
{_$5res=$1(__$ctx);var _$5tail=__$ctx._buf.slice(__$ctx._cachePos).join("");if(_$5tail){_$5cacheLog.push(_$5tail);
}else{undefined}}__r10.cache=__r11;__$ctx._cachePos=__r12;__$ctx._cacheLog=__r13;__$ctx._localLog=__r14;
""}__$ctx._localLog=__$ctx._localLog.slice(0,-3)}else{"";var __r15=__$ctx.ctx,__r16=__r15.cache;__r15.cache=null;
var __r17=__$ctx._cachePos;__$ctx._cachePos=__$ctx._buf.length;var __r18=__$ctx._cacheLog;__$ctx._cacheLog=_$5cacheLog;
var __r19=__$ctx._localLog;__$ctx._localLog=[];{_$5res=$1(__$ctx);var _$5tail=__$ctx._buf.slice(__$ctx._cachePos).join("");
if(_$5tail){_$5cacheLog.push(_$5tail)}else{undefined}}__r15.cache=__r16;__$ctx._cachePos=__r17;__$ctx._cacheLog=__r18;
__$ctx._localLog=__r19;""}cache.set(__$ctx.ctx.cache,{log:_$5cacheLog,res:_$5res});return _$5res;return;
}function $530(__$ctx){var __t=__$ctx._mode;if(__t==="default"){return $532(__$ctx)}else if(__t===""){
if(!__$ctx._.isSimple(__$ctx.ctx)===false){__$ctx._listLength--;var _$3ctx=__$ctx.ctx;(_$3ctx&&_$3ctx!==true||_$3ctx===0)&&__$ctx._buf.push(_$3ctx);
return}else{if(!!__$ctx.ctx===false){__$ctx._listLength--;return}else{if(!__$ctx._.isArray(__$ctx.ctx)===false){
return $541(__$ctx)}else{if(!true===false){return $544(__$ctx)}else{return $e(__$ctx)}}}}}else{return $e(__$ctx);
}}function $532(__$ctx){var __r24,__r0,__r2,__r3,__r8,__r9,__r10,__r11,__r12,__r13,__r14,__r15,__r16,__r17,__r18,__r19,__r20,__r21,__r22,__r23,__r1,__r25,__r26,__r27,__r28,__r29,__r30,__r31,__r36,__r37,__r38,__r39,__r40,__r41,__r42,__r43,__r44,__r45,__r46,__r47;
var _$4_this=__$ctx,_$4BEM_=_$4_this.BEM,_$4v=__$ctx.ctx,_$4buf=__$ctx._buf,_$4tag;_$4tag=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"tag"]),
__bv6=("",__r0=__$ctx._mode,__$ctx._mode="tag",__r1=$10(__$ctx),__$ctx._mode=__r0,"",__r1),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv6):("",__r2=__$ctx._mode,__$ctx._mode="tag",__r3=$10(__$ctx),__$ctx._mode=__r2,"",__r3);typeof _$4tag!="undefined"||(_$4tag=_$4v.tag);
typeof _$4tag!="undefined"||(_$4tag="div");if(_$4tag){var _$4jsParams,_$4js;if(__$ctx.block&&_$4v.js!==false){
_$4js=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"js"]),__bv8=("",__r8=__$ctx._mode,__$ctx._mode="js",
__r9=$47(__$ctx),__$ctx._mode=__r8,"",__r9),__$ctx._localLog=__$ctx._localLog.slice(0,-1),__bv8):("",
__r10=__$ctx._mode,__$ctx._mode="js",__r11=$47(__$ctx),__$ctx._mode=__r10,"",__r11);_$4js=_$4js?__$ctx._.extend(_$4v.js,_$4js===true?{}:_$4js):_$4v.js===true?{}:_$4v.js;
_$4js&&((_$4jsParams={})[_$4BEM_.INTERNAL.buildClass(__$ctx.block,_$4v.elem)]=_$4js)}else{undefined}_$4buf.push("<",_$4tag);
var _$4isBEM=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"bem"]),__bv9=("",__r12=__$ctx._mode,
__$ctx._mode="bem",__r13=$47(__$ctx),__$ctx._mode=__r12,"",__r13),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv9):("",__r14=__$ctx._mode,__$ctx._mode="bem",__r15=$47(__$ctx),__$ctx._mode=__r14,"",__r15);typeof _$4isBEM!="undefined"||(_$4isBEM=typeof _$4v.bem!="undefined"?_$4v.bem:_$4v.block||_$4v.elem);
var _$4cls=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"cls"]),__bv10=("",__r16=__$ctx._mode,__$ctx._mode="cls",
__r17=$47(__$ctx),__$ctx._mode=__r16,"",__r17),__$ctx._localLog=__$ctx._localLog.slice(0,-1),__bv10):("",
__r18=__$ctx._mode,__$ctx._mode="cls",__r19=$47(__$ctx),__$ctx._mode=__r18,"",__r19);_$4cls||(_$4cls=_$4v.cls);
var _$4addJSInitClass=_$4v.block&&_$4jsParams;if(_$4isBEM||_$4cls){_$4buf.push(' class="');if(_$4isBEM){
_$4BEM_.INTERNAL.buildClasses(__$ctx.block,_$4v.elem,_$4v.elemMods||_$4v.mods,_$4buf);var _$4mix=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"mix"]),
__bv11=("",__r20=__$ctx._mode,__$ctx._mode="mix",__r21=$47(__$ctx),__$ctx._mode=__r20,"",__r21),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv11):("",__r22=__$ctx._mode,__$ctx._mode="mix",__r23=$47(__$ctx),__$ctx._mode=__r22,"",__r23);_$4v.mix&&(_$4mix=_$4mix?_$4mix.concat(_$4v.mix):_$4v.mix);
if(_$4mix){var _$4visited={};function _$4visitedKey(block,elem){return(block||"")+"__"+(elem||"")}_$4visited[_$4visitedKey(__$ctx.block,__$ctx.elem)]=true;
if(!__$ctx._.isArray(_$4mix)){_$4mix=[_$4mix]}else{undefined}for(var _$4i=0;_$4i<_$4mix.length;_$4i++){
var _$4mixItem=_$4mix[_$4i];if(!_$4mixItem){continue}else{undefined}var _$4hasItem=_$4mixItem.block||_$4mixItem.elem,_$4block=_$4mixItem.block||_$4mixItem._block||_$4_this.block,_$4elem=_$4mixItem.elem||_$4mixItem._elem||_$4_this.elem;
_$4hasItem&&_$4buf.push(" ");_$4BEM_.INTERNAL[_$4hasItem?"buildClasses":"buildModsClasses"](_$4block,_$4mixItem.elem||_$4mixItem._elem||(_$4mixItem.block?undefined:_$4_this.elem),_$4mixItem.elemMods||_$4mixItem.mods,_$4buf);
if(_$4mixItem.js){(_$4jsParams||(_$4jsParams={}))[_$4BEM_.INTERNAL.buildClass(_$4block,_$4mixItem.elem)]=_$4mixItem.js===true?{}:_$4mixItem.js;
_$4addJSInitClass||(_$4addJSInitClass=_$4block&&!_$4mixItem.elem)}else{undefined}if(_$4hasItem&&!_$4visited[_$4visitedKey(_$4block,_$4elem)]){
_$4visited[_$4visitedKey(_$4block,_$4elem)]=true;var _$4nestedMix=__$ctx._localLog?(__$ctx._localLog.push([["block"],_$4block],[["elem"],_$4elem],[["_mode"],"mix"]),
__bv12=("",__r24=__$ctx.block,__$ctx.block=_$4block,__r25=__$ctx.elem,__$ctx.elem=_$4elem,__r26=__$ctx._mode,
__$ctx._mode="mix",__r27=$47(__$ctx),__$ctx.block=__r24,__$ctx.elem=__r25,__$ctx._mode=__r26,"",__r27),
__$ctx._localLog=__$ctx._localLog.slice(0,-3),__bv12):("",__r28=__$ctx.block,__$ctx.block=_$4block,__r29=__$ctx.elem,
__$ctx.elem=_$4elem,__r30=__$ctx._mode,__$ctx._mode="mix",__r31=$47(__$ctx),__$ctx.block=__r28,__$ctx.elem=__r29,
__$ctx._mode=__r30,"",__r31);if(_$4nestedMix){for(var _$4j=0;_$4j<_$4nestedMix.length;_$4j++){var _$4nestedItem=_$4nestedMix[_$4j];
if(!_$4nestedItem.block&&!_$4nestedItem.elem||!_$4visited[_$4visitedKey(_$4nestedItem.block,_$4nestedItem.elem)]){
_$4nestedItem._block=_$4block;_$4nestedItem._elem=_$4elem;_$4mix.splice(_$4i+1,0,_$4nestedItem)}else{
undefined}}}else{undefined}}else{undefined}}}else{undefined}}else{undefined}_$4cls&&_$4buf.push(_$4isBEM?" ":"",_$4cls);
_$4addJSInitClass&&_$4buf.push(" i-bem");_$4buf.push('"')}else{undefined}if(_$4jsParams){var _$4jsAttr=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"jsAttr"]),
__bv14=("",__r36=__$ctx._mode,__$ctx._mode="jsAttr",__r37=$47(__$ctx),__$ctx._mode=__r36,"",__r37),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv14):("",__r38=__$ctx._mode,__$ctx._mode="jsAttr",__r39=$47(__$ctx),__$ctx._mode=__r38,"",__r39);_$4buf.push(" ",_$4jsAttr||"onclick",'="return ',__$ctx._.attrEscape(JSON.stringify(_$4jsParams)),'"');
}else{undefined}var _$4attrs=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"attrs"]),__bv15=("",
__r40=__$ctx._mode,__$ctx._mode="attrs",__r41=$2(__$ctx),__$ctx._mode=__r40,"",__r41),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv15):("",__r42=__$ctx._mode,__$ctx._mode="attrs",__r43=$2(__$ctx),__$ctx._mode=__r42,"",__r43);_$4attrs=__$ctx._.extend(_$4attrs,_$4v.attrs);
if(_$4attrs){var _$4name;for(_$4name in _$4attrs){if(_$4attrs[_$4name]===undefined){continue}else{undefined;
}_$4buf.push(" ",_$4name,'="',__$ctx._.attrEscape(_$4attrs[_$4name]),'"')}}else{undefined}}else{undefined;
}if(__$ctx._.isShortTag(_$4tag)){_$4buf.push("/>")}else{_$4tag&&_$4buf.push(">");var _$4content=__$ctx._localLog?(__$ctx._localLog.push([["_mode"],"content"]),
__bv16=("",__r44=__$ctx._mode,__$ctx._mode="content",__r45=$39(__$ctx),__$ctx._mode=__r44,"",__r45),__$ctx._localLog=__$ctx._localLog.slice(0,-1),
__bv16):("",__r46=__$ctx._mode,__$ctx._mode="content",__r47=$39(__$ctx),__$ctx._mode=__r46,"",__r47);if(_$4content||_$4content===0){
var _$4isBEM=__$ctx.block||__$ctx.elem;if(__$ctx._localLog){__bv17=_$4isBEM?1:__$ctx.position;__bv18=_$4isBEM?1:__$ctx._listLength;
__$ctx._localLog.push([["_notNewList"],false],[["position"],__bv17],[["_listLength"],__bv18],[["_mode"],""]);
{"";var __r48=__$ctx._notNewList;__$ctx._notNewList=false;var __r49=__$ctx.position;__$ctx.position=__bv17;
var __r50=__$ctx._listLength;__$ctx._listLength=__bv18;var __r51=__$ctx.ctx;__$ctx.ctx=_$4content;var __r52=__$ctx._mode;
__$ctx._mode="";$47(__$ctx);__$ctx._notNewList=__r48;__$ctx.position=__r49;__$ctx._listLength=__r50;__$ctx.ctx=__r51;
__$ctx._mode=__r52;""}__$ctx._localLog=__$ctx._localLog.slice(0,-4)}else{"";var __r53=__$ctx._notNewList;
__$ctx._notNewList=false;var __r54=__$ctx.position;__$ctx.position=_$4isBEM?1:__$ctx.position;var __r55=__$ctx._listLength;
__$ctx._listLength=_$4isBEM?1:__$ctx._listLength;var __r56=__$ctx.ctx;__$ctx.ctx=_$4content;var __r57=__$ctx._mode;
__$ctx._mode="";$47(__$ctx);__$ctx._notNewList=__r53;__$ctx.position=__r54;__$ctx._listLength=__r55;__$ctx.ctx=__r56;
__$ctx._mode=__r57;""}undefined}else{undefined}_$4tag&&_$4buf.push("</",_$4tag,">")}return}function $541(__$ctx){
var _$1v=__$ctx.ctx,_$1l=_$1v.length,_$1i=0,_$1prevPos=__$ctx.position,_$1prevNotNewList=__$ctx._notNewList;
if(_$1prevNotNewList){__$ctx._listLength+=_$1l-1}else{__$ctx.position=0;__$ctx._listLength=_$1l}__$ctx._notNewList=true;
while(_$1i<_$1l){var _$1newCtx=_$1v[_$1i++];if(__$ctx._localLog){"";var __r0=__$ctx.ctx;__$ctx.ctx=_$1newCtx==null?"":_$1newCtx;
$47(__$ctx);__$ctx.ctx=__r0;""}else{"";var __r1=__$ctx.ctx;__$ctx.ctx=_$1newCtx==null?"":_$1newCtx;$47(__$ctx);
__$ctx.ctx=__r1;""}undefined}_$1prevNotNewList||(__$ctx.position=_$1prevPos);return}function $544(__$ctx){
var _$0vBlock=__$ctx.ctx.block,_$0vElem=__$ctx.ctx.elem,_$0block=__$ctx._currBlock||__$ctx.block;__$ctx.ctx||(__$ctx.ctx={});
if(__$ctx._localLog){__bv0=__$ctx.ctx.links||__$ctx._links;__bv1=_$0vBlock||(_$0vElem?_$0block:undefined);
__bv2=_$0vBlock||_$0vElem?undefined:_$0block;__bv3=(_$0vBlock?__$ctx.ctx.mods:__$ctx.mods)||{};__bv4=__$ctx.ctx.elemMods||{};
__$ctx._localLog.push([["_mode"],"default"],[["_links"],__bv0],[["block"],__bv1],[["_currBlock"],__bv2],[["elem"],["ctx","elem"]],[["mods"],__bv3],[["elemMods"],__bv4]);
{"";var __r0=__$ctx._mode;__$ctx._mode="default";var __r1=__$ctx._links;__$ctx._links=__bv0;var __r2=__$ctx.block;
__$ctx.block=__bv1;var __r3=__$ctx._currBlock;__$ctx._currBlock=__bv2;var __r4=__$ctx.elem;__$ctx.elem=__$ctx.ctx.elem;
var __r5=__$ctx.mods;__$ctx.mods=__bv3;var __r6=__$ctx.elemMods;__$ctx.elemMods=__bv4;{__$ctx.block||__$ctx.elem?__$ctx.position=(__$ctx.position||0)+1:__$ctx._listLength--;
$25(__$ctx);undefined}__$ctx._mode=__r0;__$ctx._links=__r1;__$ctx.block=__r2;__$ctx._currBlock=__r3;__$ctx.elem=__r4;
__$ctx.mods=__r5;__$ctx.elemMods=__r6;""}__$ctx._localLog=__$ctx._localLog.slice(0,-7)}else{"";var __r7=__$ctx._mode;
__$ctx._mode="default";var __r8=__$ctx._links;__$ctx._links=__$ctx.ctx.links||__$ctx._links;var __r9=__$ctx.block;
__$ctx.block=_$0vBlock||(_$0vElem?_$0block:undefined);var __r10=__$ctx._currBlock;__$ctx._currBlock=_$0vBlock||_$0vElem?undefined:_$0block;
var __r11=__$ctx.elem;__$ctx.elem=__$ctx.ctx.elem;var __r12=__$ctx.mods;__$ctx.mods=(_$0vBlock?__$ctx.ctx.mods:__$ctx.mods)||{};
var __r13=__$ctx.elemMods;__$ctx.elemMods=__$ctx.ctx.elemMods||{};{__$ctx.block||__$ctx.elem?__$ctx.position=(__$ctx.position||0)+1:__$ctx._listLength--;
$25(__$ctx);undefined}__$ctx._mode=__r7;__$ctx._links=__r8;__$ctx.block=__r9;__$ctx._currBlock=__r10;__$ctx.elem=__r11;
__$ctx.mods=__r12;__$ctx.elemMods=__r13;""}return}function $e(__$ctx){throw new Error(this);return}!function oninit(){
(function(global,bem_){if(bem_.I18N){return undefined}else{undefined}global.BEM=bem_;var i18n=bem_.I18N=function(keyset,key){
return key};i18n.keyset=function(){return i18n};i18n.key=function(key){return key};i18n.lang=function(){
return undefined}})(this,typeof BEM==="undefined"?{}:BEM)}();!function oninit(){var BEM_={},toString=Object.prototype.toString,SHORT_TAGS={
area:1,base:1,br:1,col:1,command:1,embed:1,hr:1,img:1,input:1,keygen:1,link:1,meta:1,param:1,source:1,
wbr:1};(function(BEM,undefined){var MOD_DELIM="_",ELEM_DELIM="__",NAME_PATTERN="[a-zA-Z0-9-]+";function buildModPostfix(modName,modVal,buffer){
buffer.push(MOD_DELIM,modName,MOD_DELIM,modVal)}function buildBlockClass(name,modName,modVal,buffer){
buffer.push(name);modVal&&buildModPostfix(modName,modVal,buffer)}function buildElemClass(block,name,modName,modVal,buffer){
buildBlockClass(block,undefined,undefined,buffer);buffer.push(ELEM_DELIM,name);modVal&&buildModPostfix(modName,modVal,buffer);
}BEM.INTERNAL={NAME_PATTERN:NAME_PATTERN,MOD_DELIM:MOD_DELIM,ELEM_DELIM:ELEM_DELIM,buildModPostfix:function(modName,modVal,buffer){
var res=buffer||[];buildModPostfix(modName,modVal,res);return buffer?res:res.join("")},buildClass:function(block,elem,modName,modVal,buffer){
var typeOf=typeof modName;if(typeOf=="string"){if(typeof modVal!="string"){buffer=modVal;modVal=modName;
modName=elem;elem=undefined}else{undefined}}else{if(typeOf!="undefined"){buffer=modName;modName=undefined;
}else{if(elem&&typeof elem!="string"){buffer=elem;elem=undefined}else{undefined}}}if(!(elem||modName||buffer)){
return block}else{undefined}var res=buffer||[];elem?buildElemClass(block,elem,modName,modVal,res):buildBlockClass(block,modName,modVal,res);
return buffer?res:res.join("")},buildModsClasses:function(block,elem,mods,buffer){var res=buffer||[];if(mods){
var modName;for(modName in mods){if(!mods.hasOwnProperty(modName)){continue}else{undefined}var modVal=mods[modName];
if(modVal==null){continue}else{undefined}modVal=mods[modName]+"";if(!modVal){continue}else{undefined}
res.push(" ");if(elem){buildElemClass(block,elem,modName,modVal,res)}else{buildBlockClass(block,modName,modVal,res);
}}}else{undefined}return buffer?res:res.join("")},buildClasses:function(block,elem,mods,buffer){var res=buffer||[];
elem?buildElemClass(block,elem,undefined,undefined,res):buildBlockClass(block,undefined,undefined,res);
this.buildModsClasses(block,elem,mods,buffer);return buffer?res:res.join("")}}})(BEM_);var buildEscape=function(){
var ts={'"':"&quot;","&":"&amp;","<":"&lt;",">":"&gt;"},f=function(t){return ts[t]||t};return function(r){
r=new RegExp(r,"g");return function(s){return(""+s).replace(r,f)}}}();function BEMContext(context,apply_){
this.ctx=typeof context===null?"":context;this.apply=apply_;this._buf=[];this._=this;this._start=true;
this._mode="";this._listLength=0;this._notNewList=false;this.position=0;this.block=undefined;this.elem=undefined;
this.mods=undefined;this.elemMods=undefined}BEMContext.prototype.isArray=function isArray(obj){return toString.call(obj)==="[object Array]";
};BEMContext.prototype.isSimple=function isSimple(obj){var t=typeof obj;return t==="string"||t==="number"||t==="boolean";
};BEMContext.prototype.isShortTag=function isShortTag(t){return SHORT_TAGS.hasOwnProperty(t)};BEMContext.prototype.extend=function extend(o1,o2){
if(!o1||!o2){return o1||o2}else{undefined}var res={},n;for(n in o1){o1.hasOwnProperty(n)&&(res[n]=o1[n]);
}for(n in o2){o2.hasOwnProperty(n)&&(res[n]=o2[n])}return res};BEMContext.prototype.identify=function(){
var cnt=0,id=BEM_["__id"]=+new Date,expando="__"+id,get=function(){return"uniq"+id+ ++cnt};return function(obj,onlyGet){
if(!obj){return get()}else{undefined}if(onlyGet||obj[expando]){return obj[expando]}else{return obj[expando]=get();
}}}();BEMContext.prototype.xmlEscape=buildEscape("[&<>]");BEMContext.prototype.attrEscape=buildEscape('["&<>]');
BEMContext.prototype.BEM=BEM_;BEMContext.prototype.isFirst=function isFirst(){return this.position===1;
};BEMContext.prototype.isLast=function isLast(){return this.position===this._listLength};BEMContext.prototype.generateId=function generateId(){
return this.identify(this.ctx)};exports.apply=BEMContext.apply=function _apply(){var ctx=new BEMContext(this,apply);
ctx.apply();return ctx._buf.join("")}}();return exports;exports.apply=apply;function apply(ctx){return applyc(ctx||this);
}function applyc(__$ctx){return $1(__$ctx)}return exports}(typeof exports==="undefined"?{}:exports);return function(options){
var context=this;if(!options)options={};cache=options.cache;return function(){if(context===this)context=undefined;
var __bv0,__bv1,__bv2,__bv3,__bv4,__bv5,__bv6,__bv7,__bv8,__bv9,__bv10,__bv11,__bv12,__bv13,__bv14,__bv15,__bv16,__bv17,__bv18,__bv19,__bv20,__bv21,__bv22,__bv23,__bv24,__bv25,__bv26,__bv27,__bv28,__bv29,__bv30,__bv31,__bv32,__bv33,__bv34,__bv35,__bv36,__bv37,__bv38,__bv39,__bv40,__bv41,__bv42,__bv43,__bv44,__bv45,__bv46,__bv47,__bv48,__bv49,__bv50,__bv51,__bv52,__bv53,__bv54;
return xjst.apply.call([context])}.call(null)}}();typeof exports==="undefined"||(exports.BEMHTML=BEMHTML);
(function($){var hasIntrospection=function(){_}.toString().indexOf("_")>-1,emptyBase=function(){},objCreate=Object.create||function(ptp){
var inheritance=function(){};inheritance.prototype=ptp;return new inheritance},needCheckProps=true,testPropObj={
toString:""};for(var i in testPropObj){testPropObj.hasOwnProperty(i)&&(needCheckProps=false)}var specProps=needCheckProps?["toString","valueOf"]:null;
function override(base,result,add){var hasSpecProps=false;if(needCheckProps){var addList=[];$.each(specProps,function(){
add.hasOwnProperty(this)&&(hasSpecProps=true)&&addList.push({name:this,val:add[this]})});if(hasSpecProps){
$.each(add,function(name){addList.push({name:name,val:this})});add=addList}}$.each(add,function(name,prop){
if(hasSpecProps){name=prop.name;prop=prop.val}if($.isFunction(prop)&&(!hasIntrospection||prop.toString().indexOf(".__base")>-1)){
var baseMethod=base[name]||function(){};result[name]=function(){var baseSaved=this.__base;this.__base=baseMethod;
var result=prop.apply(this,arguments);this.__base=baseSaved;return result}}else{result[name]=prop}})}
$.inherit=function(){var args=arguments,hasBase=$.isFunction(args[0]),base=hasBase?args[0]:emptyBase,props=args[hasBase?1:0]||{},staticProps=args[hasBase?2:1],result=props.__constructor||hasBase&&base.prototype.__constructor?function(){
return this.__constructor.apply(this,arguments)}:function(){};if(!hasBase){result.prototype=props;result.prototype.__self=result.prototype.constructor=result;
return $.extend(result,staticProps)}$.extend(result,base);var basePtp=base.prototype,resultPtp=result.prototype=objCreate(basePtp);
resultPtp.__self=resultPtp.constructor=result;override(basePtp,resultPtp,props);staticProps&&override(base,result,staticProps);
return result};$.inheritSelf=function(base,props,staticProps){var basePtp=base.prototype;override(basePtp,basePtp,props);
staticProps&&override(base,base,staticProps);return base}})(jQuery);(function($){var counter=0,expando="__"+ +new Date,get=function(){
return"uniq"+ ++counter};$.identify=function(obj,onlyGet){if(!obj)return get();var key="uniqueID"in obj?"uniqueID":expando;
return onlyGet||key in obj?obj[key]:obj[key]=get()}})(jQuery);(function($){$.isEmptyObject||($.isEmptyObject=function(obj){
for(var i in obj)return false;return true})})(jQuery);(function($){$.extend({debounce:function(fn,timeout,invokeAsap,ctx){
if(arguments.length==3&&typeof invokeAsap!="boolean"){ctx=invokeAsap;invokeAsap=false}var timer;return function(){
var args=arguments;ctx=ctx||this;invokeAsap&&!timer&&fn.apply(ctx,args);clearTimeout(timer);timer=setTimeout(function(){
invokeAsap||fn.apply(ctx,args);timer=null},timeout)}},throttle:function(fn,timeout,ctx){var timer,args,needInvoke;
return function(){args=arguments;needInvoke=true;ctx=ctx||this;timer||function(){if(needInvoke){fn.apply(ctx,args);
needInvoke=false;timer=setTimeout(arguments.callee,timeout)}else{timer=null}}()}}})})(jQuery);(function($){
var storageExpando="__"+ +new Date+"storage",getFnId=function(fn,ctx){return $.identify(fn)+(ctx?$.identify(ctx):"");
},Observable={buildEventName:function(e){return e},on:function(e,data,fn,ctx,_special){if(typeof e=="string"){
if($.isFunction(data)){ctx=fn;fn=data;data=undefined}var id=getFnId(fn,ctx),storage=this[storageExpando]||(this[storageExpando]={}),eList=e.split(" "),i=0,eStorage;
while(e=eList[i++]){e=this.buildEventName(e);eStorage=storage[e]||(storage[e]={ids:{},list:{}});if(!(id in eStorage.ids)){
var list=eStorage.list,item={fn:fn,data:data,ctx:ctx,special:_special};if(list.last){list.last.next=item;
item.prev=list.last}else{list.first=item}eStorage.ids[id]=list.last=item}}}else{var _this=this;$.each(e,function(e,fn){
_this.on(e,fn,data,_special)})}return this},onFirst:function(e,data,fn,ctx){return this.on(e,data,fn,ctx,{
one:true})},un:function(e,fn,ctx){if(typeof e=="string"||typeof e=="undefined"){var storage=this[storageExpando];
if(storage){if(e){var eList=e.split(" "),i=0,eStorage;while(e=eList[i++]){e=this.buildEventName(e);if(eStorage=storage[e]){
if(fn){var id=getFnId(fn,ctx),ids=eStorage.ids;if(id in ids){var list=eStorage.list,item=ids[id],prev=item.prev,next=item.next;
if(prev){prev.next=next}else if(item===list.first){list.first=next}if(next){next.prev=prev}else if(item===list.last){
list.last=prev}delete ids[id]}}else{delete this[storageExpando][e]}}}}else{delete this[storageExpando];
}}}else{var _this=this;$.each(e,function(e,fn){_this.un(e,fn,ctx)})}return this},trigger:function(e,data){
var _this=this,storage=_this[storageExpando],rawType;typeof e==="string"?e=$.Event(_this.buildEventName(rawType=e)):e.type=_this.buildEventName(rawType=e.type);
e.target||(e.target=_this);if(storage&&(storage=storage[e.type])){var item=storage.list.first,ret;while(item){
e.data=item.data;ret=item.fn.call(item.ctx||_this,e,data);if(typeof ret!=="undefined"){e.result=ret;if(ret===false){
e.preventDefault();e.stopPropagation()}}item.special&&item.special.one&&_this.un(rawType,item.fn,item.ctx);
item=item.next}}return this}};$.observable=$.inherit(Observable,Observable)})(jQuery);(function($,undefined){
var afterCurrentEventFns=[],blocks={},channels={};function buildModFnName(elemName,modName,modVal){return(elemName?"__elem_"+elemName:"")+"__mod"+(modName?"_"+modName:"")+(modVal?"_"+modVal:"");
}function modFnsToProps(modFns,props,elemName){$.isFunction(modFns)?props[buildModFnName(elemName,"*","*")]=modFns:$.each(modFns,function(modName,modFn){
$.isFunction(modFn)?props[buildModFnName(elemName,modName,"*")]=modFn:$.each(modFn,function(modVal,modFn){
props[buildModFnName(elemName,modName,modVal)]=modFn})})}function buildCheckMod(modName,modVal){return modVal?Array.isArray(modVal)?function(block){
var i=0,len=modVal.length;while(i<len)if(block.hasMod(modName,modVal[i++]))return true;return false}:function(block){
return block.hasMod(modName,modVal)}:function(block){return block.hasMod(modName)}}this.BEM=$.inherit($.observable,{
__constructor:function(mods,params,initImmediately){var _this=this;_this._modCache=mods||{};_this._processingMods={};
_this._params=params;_this.params=null;initImmediately!==false?_this._init():_this.afterCurrentEvent(function(){
_this._init()})},_init:function(){if(!this._initing&&!this.hasMod("js","inited")){this._initing=true;if(!this.params){
this.params=$.extend(this.getDefaultParams(),this._params);delete this._params}this.setMod("js","inited");
delete this._initing;this.hasMod("js","inited")&&this.trigger("init")}return this},changeThis:function(fn,ctx){
return fn.bind(ctx||this)},afterCurrentEvent:function(fn,ctx){this.__self.afterCurrentEvent(this.changeThis(fn,ctx));
},trigger:function(e,data){this.__base(e=this.buildEvent(e),data).__self.trigger(e,data);return this},
buildEvent:function(e){typeof e=="string"&&(e=$.Event(e));e.block=this;return e},hasMod:function(elem,modName,modVal){
var len=arguments.length,invert=false;if(len==1){modVal="";modName=elem;elem=undefined;invert=true}else if(len==2){
if(typeof elem=="string"){modVal=modName;modName=elem;elem=undefined}else{modVal="";invert=true}}var res=this.getMod(elem,modName)===modVal;
return invert?!res:res},getMod:function(elem,modName){var type=typeof elem;if(type==="string"||type==="undefined"){
modName=elem||modName;var modCache=this._modCache;return modName in modCache?modCache[modName]:modCache[modName]=this._extractModVal(modName);
}return this._getElemMod(modName,elem)},_getElemMod:function(modName,elem,elemName){return this._extractModVal(modName,elem,elemName);
},getMods:function(elem){var hasElem=elem&&typeof elem!="string",_this=this,modNames=[].slice.call(arguments,hasElem?1:0),res=_this._extractMods(modNames,hasElem?elem:undefined);
if(!hasElem){modNames.length?modNames.forEach(function(name){_this._modCache[name]=res[name]}):_this._modCache=res;
}return res},setMod:function(elem,modName,modVal){if(typeof modVal=="undefined"){modVal=modName;modName=elem;
elem=undefined}var _this=this;if(!elem||elem[0]){var modId=(elem&&elem[0]?$.identify(elem[0]):"")+"_"+modName;
if(this._processingMods[modId])return _this;var elemName,curModVal=elem?_this._getElemMod(modName,elem,elemName=_this.__self._extractElemNameFrom(elem)):_this.getMod(modName);
if(curModVal===modVal)return _this;this._processingMods[modId]=true;var needSetMod=true,modFnParams=[modName,modVal,curModVal];
elem&&modFnParams.unshift(elem);[["*","*"],[modName,"*"],[modName,modVal]].forEach(function(mod){needSetMod=_this._callModFn(elemName,mod[0],mod[1],modFnParams)!==false&&needSetMod;
});!elem&&needSetMod&&(_this._modCache[modName]=modVal);needSetMod&&_this._afterSetMod(modName,modVal,curModVal,elem,elemName);
delete this._processingMods[modId]}return _this},_afterSetMod:function(modName,modVal,oldModVal,elem,elemName){},
toggleMod:function(elem,modName,modVal1,modVal2,condition){if(typeof elem=="string"){condition=modVal2;
modVal2=modVal1;modVal1=modName;modName=elem;elem=undefined}if(typeof modVal2=="undefined"){modVal2="";
}else if(typeof modVal2=="boolean"){condition=modVal2;modVal2=""}var modVal=this.getMod(elem,modName);
(modVal==modVal1||modVal==modVal2)&&this.setMod(elem,modName,typeof condition==="boolean"?condition?modVal1:modVal2:this.hasMod(elem,modName,modVal1)?modVal2:modVal1);
return this},delMod:function(elem,modName){if(!modName){modName=elem;elem=undefined}return this.setMod(elem,modName,"");
},_callModFn:function(elemName,modName,modVal,modFnParams){var modFnName=buildModFnName(elemName,modName,modVal);
return this[modFnName]?this[modFnName].apply(this,modFnParams):undefined},_extractModVal:function(modName,elem){
return""},_extractMods:function(modNames,elem){return{}},channel:function(id,drop){return this.__self.channel(id,drop);
},getDefaultParams:function(){return{}},del:function(obj){var args=[].slice.call(arguments);typeof obj=="string"&&args.unshift(this);
this.__self.del.apply(this.__self,args);return this},destruct:function(){}},{_name:"i-bem",blocks:blocks,
decl:function(decl,props,staticProps){if(typeof decl=="string")decl={block:decl};else if(decl.name){decl.block=decl.name;
}if(decl.baseBlock&&!blocks[decl.baseBlock])throw'baseBlock "'+decl.baseBlock+'" for "'+decl.block+'" is undefined';
props||(props={});if(props.onSetMod){modFnsToProps(props.onSetMod,props);delete props.onSetMod}if(props.onElemSetMod){
$.each(props.onElemSetMod,function(elemName,modFns){modFnsToProps(modFns,props,elemName)});delete props.onElemSetMod;
}var baseBlock=blocks[decl.baseBlock||decl.block]||this;if(decl.modName){var checkMod=buildCheckMod(decl.modName,decl.modVal);
$.each(props,function(name,prop){$.isFunction(prop)&&(props[name]=function(){var method;if(checkMod(this)){
method=prop}else{var baseMethod=baseBlock.prototype[name];baseMethod&&baseMethod!==props[name]&&(method=this.__base);
}return method?method.apply(this,arguments):undefined})})}if(staticProps&&typeof staticProps.live==="boolean"){
var live=staticProps.live;staticProps.live=function(){return live}}var block;decl.block==baseBlock._name?(block=$.inheritSelf(baseBlock,props,staticProps))._processLive(true):(block=blocks[decl.block]=$.inherit(baseBlock,props,staticProps))._name=decl.block;
return block},_processLive:function(heedLive){return false},create:function(block,params){typeof block=="string"&&(block={
block:block});return new blocks[block.block](block.mods,params)},getName:function(){return this._name;
},_extractElemNameFrom:function(elem){},afterCurrentEvent:function(fn,ctx){afterCurrentEventFns.push({
fn:fn,ctx:ctx})==1&&setTimeout(this._runAfterCurrentEventFns,0)},_runAfterCurrentEventFns:function(){
var fnsLen=afterCurrentEventFns.length;if(fnsLen){var fnObj,fnsCopy=afterCurrentEventFns.splice(0,fnsLen);
while(fnObj=fnsCopy.shift())fnObj.fn.call(fnObj.ctx||this)}},changeThis:function(fn,ctx){return fn.bind(ctx||this);
},del:function(obj){var delInThis=typeof obj=="string",i=delInThis?0:1,len=arguments.length;delInThis&&(obj=this);
while(i<len)delete obj[arguments[i++]];return this},channel:function(id,drop){if(typeof id=="boolean"){
drop=id;id=undefined}id||(id="default");if(drop){if(channels[id]){channels[id].un();delete channels[id];
}return}return channels[id]||(channels[id]=new $.observable)}})})(jQuery);(function(){Object.keys||(Object.keys=function(obj){
var res=[];for(var i in obj)obj.hasOwnProperty(i)&&res.push(i);return res})})();(function(){var ptp=Array.prototype,toStr=Object.prototype.toString,methods={
indexOf:function(item,fromIdx){fromIdx=+(fromIdx||0);var t=this,len=t.length;if(len>0&&fromIdx<len){fromIdx=fromIdx<0?Math.ceil(fromIdx):Math.floor(fromIdx);
fromIdx<-len&&(fromIdx=0);fromIdx<0&&(fromIdx=fromIdx+len);while(fromIdx<len){if(fromIdx in t&&t[fromIdx]===item)return fromIdx;
++fromIdx}}return-1},forEach:function(callback,ctx){var i=-1,t=this,len=t.length;while(++i<len)i in t&&(ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t));
},map:function(callback,ctx){var i=-1,t=this,len=t.length,res=new Array(len);while(++i<len)i in t&&(res[i]=ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t));
return res},filter:function(callback,ctx){var i=-1,t=this,len=t.length,res=[];while(++i<len)i in t&&(ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t))&&res.push(t[i]);
return res},reduce:function(callback,initialVal){var i=-1,t=this,len=t.length,res;if(arguments.length<2){
while(++i<len){if(i in t){res=t[i];break}}}else{res=initialVal}while(++i<len)i in t&&(res=callback(res,t[i],i,t));
return res},some:function(callback,ctx){var i=-1,t=this,len=t.length;while(++i<len)if(i in t&&(ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t)))return true;
return false},every:function(callback,ctx){var i=-1,t=this,len=t.length;while(++i<len)if(i in t&&!(ctx?callback.call(ctx,t[i],i,t):callback(t[i],i,t)))return false;
return true}};for(var name in methods)ptp[name]||(ptp[name]=methods[name]);Array.isArray||(Array.isArray=function(obj){
return toStr.call(obj)==="[object Array]"})})();(function(){var slice=Array.prototype.slice;Function.prototype.bind||(Function.prototype.bind=function(ctx){
var fn=this,args=slice.call(arguments,1);return function(){return fn.apply(ctx,args.concat(slice.call(arguments)));
}})})();(function(BEM,$,undefined){var MOD_DELIM="_",ELEM_DELIM="__",NAME_PATTERN="[a-zA-Z0-9-]+";function buildModPostfix(modName,modVal,buffer){
buffer.push(MOD_DELIM,modName,MOD_DELIM,modVal)}function buildBlockClass(name,modName,modVal,buffer){
buffer.push(name);modVal&&buildModPostfix(modName,modVal,buffer)}function buildElemClass(block,name,modName,modVal,buffer){
buildBlockClass(block,undefined,undefined,buffer);buffer.push(ELEM_DELIM,name);modVal&&buildModPostfix(modName,modVal,buffer);
}BEM.INTERNAL={NAME_PATTERN:NAME_PATTERN,MOD_DELIM:MOD_DELIM,ELEM_DELIM:ELEM_DELIM,buildModPostfix:function(modName,modVal,buffer){
var res=buffer||[];buildModPostfix(modName,modVal,res);return buffer?res:res.join("")},buildClass:function(block,elem,modName,modVal,buffer){
var typeOf=typeof modName;if(typeOf=="string"){if(typeof modVal!="string"&&typeof modVal!="number"){buffer=modVal;
modVal=modName;modName=elem;elem=undefined}}else if(typeOf!="undefined"){buffer=modName;modName=undefined;
}else if(elem&&typeof elem!="string"){buffer=elem;elem=undefined}if(!(elem||modName||buffer)){return block;
}var res=buffer||[];elem?buildElemClass(block,elem,modName,modVal,res):buildBlockClass(block,modName,modVal,res);
return buffer?res:res.join("")},buildClasses:function(block,elem,mods,buffer){if(elem&&typeof elem!="string"){
buffer=mods;mods=elem;elem=undefined}var res=buffer||[];elem?buildElemClass(block,elem,undefined,undefined,res):buildBlockClass(block,undefined,undefined,res);
mods&&$.each(mods,function(modName,modVal){if(modVal){res.push(" ");elem?buildElemClass(block,elem,modName,modVal,res):buildBlockClass(block,modName,modVal,res);
}});return buffer?res:res.join("")}}})(BEM,jQuery);jQuery.cookie=function(name,value,options){if(typeof value!="undefined"){
options=options||{};if(value===null){value="";options.expires=-1}var expires="";if(options.expires&&(typeof options.expires=="number"||options.expires.toUTCString)){
var date;if(typeof options.expires=="number"){date=new Date;date.setTime(date.getTime()+options.expires*24*60*60*1e3);
}else{date=options.expires}expires="; expires="+date.toUTCString()}var path=options.path?"; path="+options.path:"";
var domain=options.domain?"; domain="+options.domain:"";var secure=options.secure?"; secure":"";document.cookie=[name,"=",encodeURIComponent(value),expires,path,domain,secure].join("");
}else{var cookieValue=null;if(document.cookie&&document.cookie!=""){var cookies=document.cookie.split(";");
for(var i=0;i<cookies.length;i++){var cookie=jQuery.trim(cookies[i]);if(cookie.substring(0,name.length+1)==name+"="){
cookieValue=decodeURIComponent(cookie.substring(name.length+1));break}}}return cookieValue}};(function($){
var map={"%D0":"%D0%A0","%C0":"%D0%90","%C1":"%D0%91","%C2":"%D0%92","%C3":"%D0%93","%C4":"%D0%94","%C5":"%D0%95",
"%A8":"%D0%81","%C6":"%D0%96","%C7":"%D0%97","%C8":"%D0%98","%C9":"%D0%99","%CA":"%D0%9A","%CB":"%D0%9B",
"%CC":"%D0%9C","%CD":"%D0%9D","%CE":"%D0%9E","%CF":"%D0%9F","%D1":"%D0%A1","%D2":"%D0%A2","%D3":"%D0%A3",
"%D4":"%D0%A4","%D5":"%D0%A5","%D6":"%D0%A6","%D7":"%D0%A7","%D8":"%D0%A8","%D9":"%D0%A9","%DA":"%D0%AA",
"%DB":"%D0%AB","%DC":"%D0%AC","%DD":"%D0%AD","%DE":"%D0%AE","%DF":"%D0%AF","%E0":"%D0%B0","%E1":"%D0%B1",
"%E2":"%D0%B2","%E3":"%D0%B3","%E4":"%D0%B4","%E5":"%D0%B5","%B8":"%D1%91","%E6":"%D0%B6","%E7":"%D0%B7",
"%E8":"%D0%B8","%E9":"%D0%B9","%EA":"%D0%BA","%EB":"%D0%BB","%EC":"%D0%BC","%ED":"%D0%BD","%EE":"%D0%BE",
"%EF":"%D0%BF","%F0":"%D1%80","%F1":"%D1%81","%F2":"%D1%82","%F3":"%D1%83","%F4":"%D1%84","%F5":"%D1%85",
"%F6":"%D1%86","%F7":"%D1%87","%F8":"%D1%88","%F9":"%D1%89","%FA":"%D1%8A","%FB":"%D1%8B","%FC":"%D1%8C",
"%FD":"%D1%8D","%FE":"%D1%8E","%FF":"%D1%8F"};function convert(str){return str.replace(/%.{2}/g,function($0){
return map[$0]||$0})}function decode(func,str){var decoded="";try{decoded=func(str)}catch(e){try{decoded=func(convert(str));
}catch(e){decoded=str}}return decoded}$.extend({decodeURI:function(str){return decode(decodeURI,str)},
decodeURIComponent:function(str){return decode(decodeURIComponent,str)}})})(jQuery);(function(BEM,$,undefined){
var INTERNAL=BEM.INTERNAL,ELEM_DELIM=INTERNAL.ELEM_DELIM,SHORT_TAGS={area:1,base:1,br:1,col:1,command:1,
embed:1,hr:1,img:1,input:1,keygen:1,link:1,meta:1,param:1,source:1,wbr:1},buildClass=INTERNAL.buildClass,buildClasses=INTERNAL.buildClasses,decls={};
function addPropToDecl(decl,name,fn){(decl[name]||(decl[name]=[])).unshift(fn)}function buildDeclFn(fn,desc){
return desc.modName?function(ctx){(ctx._curBlock.mods||{})[desc.modName]===desc.modVal&&fn(ctx)}:fn}function join(a,b){
var isArrayB=$.isArray(b),res;$.isArray(a)?isArrayB?res=a.concat(b):(res=a).push(b):isArrayB?(res=b).unshift(a):res=[a,b];
return res}var attrEscapes={'"':"&quot;","&":"&amp;","<":"&lt;",">":"&gt;"},attrEscapesRE=/["&<>]/g;function escapeAttr(attrVal){
return attrVal.replace(attrEscapesRE,function(needToEscape){return attrEscapes[needToEscape]})}BEM.HTML={
decl:function(desc,props){typeof desc=="string"&&(desc={block:desc});desc.name&&(desc.block=desc.name);
var decl=decls[desc.block]||(decls[desc.block]={});props.onBlock&&addPropToDecl(decl,"_block",buildDeclFn(props.onBlock,desc));
if(props.onElem){$.isFunction(props.onElem)?addPropToDecl(decl,"_elem",buildDeclFn(props.onElem,desc)):$.each(props.onElem,function(elem,fn){
addPropToDecl(decl,"_elem"+(elem==="*"?"":ELEM_DELIM+elem),buildDeclFn(fn,desc))})}},build:function(params){
var builder=new this.Ctx(params);builder._buildAll();return builder._flush()},Ctx:$.inherit({__constructor:function(params){
this._buffer=[];this._params=params;this._tParams=null;this._tParamsChanges=null;this._curBlock=undefined;
},pos:function(){return this._params._pos},isFirst:function(){return this._params._pos===1},isLast:function(){
var params=this._params;return params._pos===params._siblingsCount},params:function(params){var _this=this;
if(typeof params=="undefined")return _this._params;_this._params=params;return _this},param:function(name,val,force,needExtend){
var _this=this,params=_this._params;if(typeof val=="undefined")return params[name];if(force||!(name in params)){
params[name]=val}else if(needExtend){params[name]=$.extend(val,params[name])}return _this},attrs:function(val,force){
return this.param("attrs",val,force,true)},attr:function(name,val,force){var _this=this;if(typeof val=="undefined")return(_this._params.attrs||{})[name];
var attrs=_this._params.attrs;attrs?(force||!(name in attrs))&&(attrs[name]=val):(_this._params.attrs={})[name]=val;
return _this},tag:function(val,force){return this.param("tag",val,force)},cls:function(val,force){return this.param("cls",val,force);
},mods:function(val,force){return this.param("mods",val,force,true)},mod:function(name,val,force){var _this=this;
if(typeof val=="undefined")return(_this._params.mods||{})[name];var mods=_this._params.mods;mods?(force||!(name in mods))&&(mods[name]=val):(_this._params.mods={})[name]=val;
return _this},mix:function(val,force){var _this=this,params=_this._params;if(typeof val=="undefined")return params.mix;
if(force||!("mix"in params)){params.mix=val}else{params.mix=params.mix.concat(val)}return _this},js:function(val){
return this.param("js",val)},content:function(val,force){return this.param("content",val,force)},wrapContent:function(obj){
var _this=this,params=_this._params;obj.content=params.content;params.content=obj;return _this},beforeContent:function(obj){
var _this=this,params=_this._params;params.content=join(obj,params.content);return _this},afterContent:function(obj){
var _this=this,params=_this._params;params.content=join(params.content,obj);return _this},wrap:function(obj){
var _this=this,params=_this._params;obj.block||(obj._curBlock=_this._curBlock);obj.content=params._wrapper?params._wrapper:params;
params._wrapper=obj;return _this},tParam:function(name,val){var _this=this,tParams=_this._tParams||(_this._tParams={});
if(typeof val=="undefined")return tParams[name];var tParamsChanges=_this._tParamsChanges||(_this._tParamsChanges={});
name in tParamsChanges||(tParamsChanges[name]=tParams[name]);tParams[name]=val;return _this},generateId:function(){
return $.identify()},stop:function(){this._params._isStopped=true},_buildAll:function(){var _this=this,buffer=_this._buffer,params=_this._params,paramsType=typeof params;
if(paramsType=="string"||paramsType=="number"){buffer.push(params)}else if($.isArray(params)){var i=0,len=params.length,currParams,currParamsType;
while(i<len){_this._params=currParams=params[i++];currParamsType=typeof currParams;if(currParamsType=="string"||currParamsType=="number"){
buffer.push(currParams)}else if(currParams){currParams._pos=i;currParams._siblingsCount=len;_this._buildByDecl();
}}}else if(params){_this._params._pos=_this._params._siblingsCount=1;_this._buildByDecl()}},_build:function(){
var _this=this,buffer=_this._buffer,params=_this._params,tag=params.tag||"div",jsParams,isBEM=params.block||params.elem,curBlock=isBEM&&(params.block||_this._curBlock.block),addInitingCls=false;
if(params.js){(jsParams={})[buildClass(curBlock,params.elem)]=params.js===true?{}:params.js;addInitingCls=!params.elem;
}buffer.push("<",tag);if(isBEM||params.cls){buffer.push(' class="');if(isBEM){buildClasses(curBlock,params.elem,params.mods,buffer);
params.mix&&$.each(params.mix,function(i,mix){if(mix){buffer.push(" ");buildClasses(mix.block,mix.elem,mix.mods,buffer);
if(mix.js){(jsParams||(jsParams={}))[buildClass(mix.block,mix.elem)]=mix.js===true?{}:mix.js;addInitingCls||(addInitingCls=!mix.elem);
}}})}params.cls&&buffer.push(isBEM?" ":"",params.cls);addInitingCls&&buffer.push(" i-bem");buffer.push('"');
}jsParams&&buffer.push(' onclick="return ',escapeAttr(JSON.stringify(jsParams)),'"');params.attrs&&$.each(params.attrs,function(name,val){
typeof val!="undefined"&&val!==null&&val!==false&&buffer.push(" ",name,'="',val.toString().replace(/"/g,"&quot;"),'"');
});if(SHORT_TAGS[tag]){buffer.push("/>")}else{buffer.push(">");if(typeof params.content!="undefined"){
_this._params=params.content;_this._buildAll()}buffer.push("</",tag,">")}},_flush:function(){var res=this._buffer.join("");
delete this._buffer;return res},_buildByDecl:function(){var _this=this,currBlock=_this._curBlock,params=_this._params;
params._curBlock&&(_this._curBlock=params._curBlock);params.block&&(_this._curBlock=params);if(!params._wrapper){
if(params.block||params.elem){var decl=decls[_this._curBlock.block];if(decl){var fns;if(params.elem){
fns=decl["_elem"+ELEM_DELIM+params.elem];decl._elem&&(fns=fns?fns.concat(decl._elem):decl._elem)}else{
fns=decl._block}if(fns){var i=0,fn;while(fn=fns[i++]){fn(_this);if(params._isStopped)break}}}}if(params._wrapper){
params._curBlock=_this._curBlock;_this._params=params._wrapper;return _this._buildAll()}}var tParamsChanges=_this._tParamsChanges;
_this._tParamsChanges=null;_this._build();_this._curBlock=currBlock;if(tParamsChanges){var tParams=_this._tParams;
$.each(tParamsChanges,function(name,val){typeof val=="undefined"?delete tParams[name]:tParams[name]=val;
})}}})}})(BEM,jQuery);(function(undefined){if(window.JSON)return;var _toString=Object.prototype.toString,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,meta={
"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},stringify;window.JSON={stringify:stringify=function(val){
if(val===null){return"null"}if(typeof val==="undefined"){return undefined}switch(_toString.call(val)){
case"[object String]":escapable.lastIndex=0;return'"'+(escapable.test(val)?val.replace(escapable,function(a){
var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}):val)+'"';
case"[object Number]":case"[object Boolean]":return""+val;case"[object Array]":var res="[",i=0,len=val.length,strVal;
while(i<len){strVal=stringify(val[i]);res+=(i++?",":"")+(typeof strVal==="undefined"?"null":strVal)}return res+"]";
case"[object Object]":if(_toString.call(val.toJSON)==="[object Function]"){return stringify(val.toJSON());
}var res="{",i=0,strVal;for(var key in val){if(val.hasOwnProperty(key)){strVal=stringify(val[key]);typeof strVal!=="undefined"&&(res+=(i++?",":"")+'"'+key+'":'+strVal);
}}return res+"}";default:return undefined}}}})();(function(BEM,$,undefined){var win=$(window),doc=$(document),uniqIdToDomElems={},uniqIdToBlock={},domElemToParams={},liveEventCtxStorage={},liveClassEventStorage={},blocks=BEM.blocks,INTERNAL=BEM.INTERNAL,NAME_PATTERN=INTERNAL.NAME_PATTERN,MOD_DELIM=INTERNAL.MOD_DELIM,ELEM_DELIM=INTERNAL.ELEM_DELIM,buildModPostfix=INTERNAL.buildModPostfix,buildClass=INTERNAL.buildClass;
function init(domElem,uniqInitId){var domNode=domElem[0];$.each(getParams(domNode),function(blockName,params){
processParams(params,domNode,blockName,uniqInitId);var block=uniqIdToBlock[params.uniqId];if(block){if(block.domElem.index(domNode)<0){
block.domElem=block.domElem.add(domElem);$.extend(block._params,params)}}else{initBlock(blockName,domElem,params);
}})}function initBlock(blockName,domElem,params,forceLive,callback){if(typeof params=="boolean"){callback=forceLive;
forceLive=params;params=undefined}var domNode=domElem[0];params=processParams(params||getParams(domNode)[blockName],domNode,blockName);
var uniqId=params.uniqId;if(uniqIdToBlock[uniqId]){return uniqIdToBlock[uniqId]._init()}uniqIdToDomElems[uniqId]=uniqIdToDomElems[uniqId]?uniqIdToDomElems[uniqId].add(domElem):domElem;
var parentDomNode=domNode.parentNode;if(!parentDomNode||parentDomNode.nodeType===11){$.unique(uniqIdToDomElems[uniqId]);
}var blockClass=blocks[blockName]||DOM.decl(blockName,{},{live:true});if(!(blockClass._liveInitable=!!blockClass._processLive())||forceLive||params.live===false){
var block=new blockClass(uniqIdToDomElems[uniqId],params,!!forceLive);delete uniqIdToDomElems[uniqId];
callback&&callback.apply(block,Array.prototype.slice.call(arguments,4));return block}}function processParams(params,domNode,blockName,uniqInitId){
(params||(params={})).uniqId||(params.uniqId=(params.id?blockName+"-id-"+params.id:$.identify())+(uniqInitId||$.identify()));
var domUniqId=$.identify(domNode),domParams=domElemToParams[domUniqId]||(domElemToParams[domUniqId]={});
domParams[blockName]||(domParams[blockName]=params);return params}function findDomElem(ctx,selector,excludeSelf){
var res=ctx.find(selector);return excludeSelf?res:res.add(ctx.filter(selector))}function getParams(domNode){
var uniqId=$.identify(domNode);return domElemToParams[uniqId]||(domElemToParams[uniqId]=extractParams(domNode));
}function extractParams(domNode){var fn=domNode.onclick||domNode.ondblclick;if(!fn&&domNode.tagName.toLowerCase()=="body"){
var elem=$(domNode),attr=elem.attr("onclick")||elem.attr("ondblclick");attr&&(fn=Function(attr))}return fn?fn():{};
}function cleanupDomNode(domNode){delete domElemToParams[$.identify(domNode)]}function removeDomNodeFromBlock(block,domNode){
block.domElem.length===1?block.destruct(true):block.domElem=block.domElem.not(domNode)}function getClientNode(){
return doc[0][$.support.boxModel?"documentElement":"body"]}$.fn.bem=function(blockName,params){return initBlock(blockName,this,params,true);
};var DOM=BEM.DOM=BEM.decl("i-bem__dom",{__constructor:function(domElem,params,initImmediately){var _this=this;
_this.domElem=domElem;_this._eventNameCache={};_this._elemCache={};uniqIdToBlock[_this._uniqId=params.uniqId||$.identify(_this)]=_this;
_this._needSpecialUnbind=false;_this.__base(null,params,initImmediately)},findBlocksInside:function(elem,block){
return this._findBlocks("find",elem,block)},findBlockInside:function(elem,block){return this._findBlocks("find",elem,block,true);
},findBlocksOutside:function(elem,block){return this._findBlocks("parents",elem,block)},findBlockOutside:function(elem,block){
return this._findBlocks("closest",elem,block)[0]||null},findBlocksOn:function(elem,block){return this._findBlocks("",elem,block);
},findBlockOn:function(elem,block){return this._findBlocks("",elem,block,true)},_findBlocks:function(select,elem,block,onlyFirst){
if(!block){block=elem;elem=undefined}var ctxElem=elem?typeof elem=="string"?this.findElem(elem):elem:this.domElem,isSimpleBlock=typeof block=="string",blockName=isSimpleBlock?block:block.block||block.blockName,selector="."+(isSimpleBlock?buildClass(blockName):buildClass(blockName,block.modName,block.modVal))+(onlyFirst?":first":""),domElems=ctxElem.filter(selector);
select&&(domElems=domElems.add(ctxElem[select](selector)));if(onlyFirst){return domElems[0]?initBlock(blockName,domElems.eq(0),true):null;
}var res=[],uniqIds={};$.each(domElems,function(i,domElem){var block=initBlock(blockName,$(domElem),true);
if(!uniqIds[block._uniqId]){uniqIds[block._uniqId]=true;res.push(block)}});return res},bindToDomElem:function(domElem,event,fn){
var _this=this;fn?domElem.bind(_this._buildEventName(event),function(e){(e.data||(e.data={})).domElem=$(this);
return fn.apply(_this,arguments)}):$.each(event,function(event,fn){_this.bindToDomElem(domElem,event,fn);
});return _this},bindToDoc:function(event,fn){this._needSpecialUnbind=true;return this.bindToDomElem(doc,event,fn);
},bindToWin:function(event,fn){var _fn=fn,currentHeight,currentWidth;if(event==="resize"){fn=function(){
var height=win.height(),width=win.width();if(currentHeight!==height||currentWidth!==width){currentHeight=height;
currentWidth=width;_fn.apply(this,arguments)}}}this._needSpecialUnbind=true;return this.bindToDomElem(win,event,fn);
},bindTo:function(elem,event,fn){if(!event||$.isFunction(event)){fn=event;event=elem;elem=this.domElem;
}else if(typeof elem=="string"){elem=this.elem(elem)}return this.bindToDomElem(elem,event,fn)},unbindFromDomElem:function(domElem,event){
domElem.unbind(this._buildEventName(event));return this},unbindFromDoc:function(event){return this.unbindFromDomElem(doc,event);
},unbindFromWin:function(event){return this.unbindFromDomElem(win,event)},unbindFrom:function(elem,event){
if(!event){event=elem;elem=this.domElem}else if(typeof elem=="string"){elem=this.elem(elem)}return this.unbindFromDomElem(elem,event);
},_buildEventName:function(event){var _this=this;return event.indexOf(" ")>1?event.split(" ").map(function(e){
return _this._buildOneEventName(e)}).join(" "):_this._buildOneEventName(event)},_buildOneEventName:function(event){
var _this=this,eventNameCache=_this._eventNameCache;if(event in eventNameCache)return eventNameCache[event];
var uniq="."+_this._uniqId;if(event.indexOf(".")<0)return eventNameCache[event]=event+uniq;var lego=".bem_"+_this.__self._name;
return eventNameCache[event]=event.split(".").map(function(e,i){return i==0?e+lego:lego+"_"+e}).join("")+uniq;
},trigger:function(e,data){this.__base(e=this.buildEvent(e),data).domElem&&this._ctxTrigger(e,data);return this;
},_ctxTrigger:function(e,data){var _this=this,storage=liveEventCtxStorage[_this.__self._buildCtxEventName(e.type)],ctxIds={};
storage&&_this.domElem.each(function(){var ctx=this,counter=storage.counter;while(ctx&&counter){var ctxId=$.identify(ctx,true);
if(ctxId){if(ctxIds[ctxId])break;var storageCtx=storage.ctxs[ctxId];if(storageCtx){$.each(storageCtx,function(uniqId,handler){
handler.fn.call(handler.ctx||_this,e,data)});counter--}ctxIds[ctxId]=true}ctx=ctx.parentNode}})},setMod:function(elem,modName,modVal){
if(elem&&typeof modVal!="undefined"&&elem.length>1){var _this=this;elem.each(function(){var item=$(this);
item.__bemElemName=elem.__bemElemName;_this.setMod(item,modName,modVal)});return _this}return this.__base(elem,modName,modVal);
},_extractModVal:function(modName,elem,elemName){var domNode=(elem||this.domElem)[0],matches;domNode&&(matches=domNode.className.match(this.__self._buildModValRE(modName,elemName||elem)));
return matches?matches[2]:""},_extractMods:function(modNames,elem){var res={},extractAll=!modNames.length,countMatched=0;
((elem||this.domElem)[0].className.match(this.__self._buildModValRE("("+(extractAll?NAME_PATTERN:modNames.join("|"))+")",elem,"g"))||[]).forEach(function(className){
var iModVal=(className=className.trim()).lastIndexOf(MOD_DELIM),iModName=className.substr(0,iModVal-1).lastIndexOf(MOD_DELIM);
res[className.substr(iModName+1,iModVal-iModName-1)]=className.substr(iModVal+1);++countMatched});countMatched<modNames.length&&modNames.forEach(function(modName){
modName in res||(res[modName]="")});return res},_afterSetMod:function(modName,modVal,oldModVal,elem,elemName){
var _self=this.__self,classPrefix=_self._buildModClassPrefix(modName,elemName),classRE=_self._buildModValRE(modName,elemName),needDel=modVal==="";
(elem||this.domElem).each(function(){var className=this.className;className.indexOf(classPrefix)>-1?this.className=className.replace(classRE,needDel?"":"$1"+classPrefix+modVal):needDel||$(this).addClass(classPrefix+modVal);
});elemName&&this.dropElemCache(elemName,modName,oldModVal).dropElemCache(elemName,modName,modVal)},findElem:function(ctx,names,modName,modVal){
if(arguments.length%2){modVal=modName;modName=names;names=ctx;ctx=this.domElem}else if(typeof ctx=="string"){
ctx=this.findElem(ctx)}var _self=this.__self,selector="."+names.split(" ").map(function(name){return buildClass(_self._name,name,modName,modVal);
}).join(",.");return findDomElem(ctx,selector)},_elem:function(name,modName,modVal){var key=name+buildModPostfix(modName,modVal),res;
if(!(res=this._elemCache[key])){res=this._elemCache[key]=this.findElem(name,modName,modVal);res.__bemElemName=name;
}return res},elem:function(names,modName,modVal){if(modName&&typeof modName!="string"){modName.__bemElemName=names;
return modName}if(names.indexOf(" ")<0){return this._elem(names,modName,modVal)}var res=$([]),_this=this;
names.split(" ").forEach(function(name){res=res.add(_this._elem(name,modName,modVal))});return res},dropElemCache:function(names,modName,modVal){
if(names){var _this=this,modPostfix=buildModPostfix(modName,modVal);names.indexOf(" ")<0?delete _this._elemCache[names+modPostfix]:names.split(" ").forEach(function(name){
delete _this._elemCache[name+modPostfix]})}else{this._elemCache={}}return this},elemParams:function(elem){
var elemName;if(typeof elem=="string"){elemName=elem;elem=this.elem(elem)}else{elemName=this.__self._extractElemNameFrom(elem);
}return extractParams(elem[0])[buildClass(this.__self.getName(),elemName)]||{}},elemify:function(elem,elemName){
(elem=$(elem)).__bemElemName=elemName;return elem},containsDomElem:function(domElem){var res=false;this.domElem.each(function(){
return!(res=domElem.parents().andSelf().index(this)>-1)});return res},buildSelector:function(elem,modName,modVal){
return this.__self.buildSelector(elem,modName,modVal)},destruct:function(keepDOM){var _this=this,_self=_this.__self;
_this._isDestructing=true;_this._needSpecialUnbind&&_self.doc.add(_self.win).unbind("."+_this._uniqId);
_this.dropElemCache().domElem.each(function(i,domNode){var params=getParams(domNode);$.each(params,function(blockName,blockParams){
var block=uniqIdToBlock[blockParams.uniqId];block?block._isDestructing||removeDomNodeFromBlock(block,domNode):delete uniqIdToDomElems[blockParams.uniqId];
});cleanupDomNode(domNode)});keepDOM||_this.domElem.remove();delete uniqIdToBlock[_this.un()._uniqId];
delete _this.domElem;delete _this._elemCache;_this.__base()}},{scope:null,doc:doc,win:win,_processLive:function(heedLive){
var _this=this,res=_this._liveInitable;if("live"in _this){var noLive=typeof res=="undefined";if(noLive^heedLive){
res=_this.live()!==false;_this.live=function(){}}}return res},init:function(ctx,callback,callbackCtx){
if(!ctx||$.isFunction(ctx)){callbackCtx=callback;callback=ctx;ctx=doc}var uniqInitId=$.identify();findDomElem(ctx,".i-bem").each(function(){
init($(this),uniqInitId)});callback&&this.afterCurrentEvent(function(){callback.call(callbackCtx||this,ctx);
});this._runAfterCurrentEventFns();return ctx},destruct:function(keepDOM,ctx,excludeSelf){if(typeof keepDOM!="boolean"){
excludeSelf=ctx;ctx=keepDOM;keepDOM=undefined}findDomElem(ctx,".i-bem",excludeSelf).each(function(i,domNode){
var params=getParams(this);$.each(params,function(blockName,blockParams){if(blockParams.uniqId){var block=uniqIdToBlock[blockParams.uniqId];
block?removeDomNodeFromBlock(block,domNode):delete uniqIdToDomElems[blockParams.uniqId]}});cleanupDomNode(this);
});keepDOM||(excludeSelf?ctx.empty():ctx.remove())},update:function(ctx,content,callback,callbackCtx){
this.destruct(ctx,true);this.init(ctx.html(content),callback,callbackCtx)},replace:function(ctx,content){
this.destruct(true,ctx);this.init($(content).replaceAll(ctx))},append:function(ctx,content){this.init($(content).appendTo(ctx));
},prepend:function(ctx,content){this.init($(content).prependTo(ctx))},before:function(ctx,content){this.init($(content).insertBefore(ctx));
},after:function(ctx,content){this.init($(content).insertAfter(ctx))},_buildCtxEventName:function(e){
return this._name+":"+e},_liveClassBind:function(className,e,callback,invokeOnInit){var _this=this;if(e.indexOf(" ")>-1){
e.split(" ").forEach(function(e){_this._liveClassBind(className,e,callback,invokeOnInit)})}else{var storage=liveClassEventStorage[e],uniqId=$.identify(callback);
if(!storage){storage=liveClassEventStorage[e]={};doc.bind(e,_this.changeThis(_this._liveClassTrigger,_this));
}storage=storage[className]||(storage[className]={uniqIds:{},fns:[]});if(!(uniqId in storage.uniqIds)){
storage.fns.push({uniqId:uniqId,fn:_this._buildLiveEventFn(callback,invokeOnInit)});storage.uniqIds[uniqId]=storage.fns.length-1;
}}return this},_liveClassUnbind:function(className,e,callback){var storage=liveClassEventStorage[e];if(storage){
if(callback){if(storage=storage[className]){var uniqId=$.identify(callback);if(uniqId in storage.uniqIds){
var i=storage.uniqIds[uniqId],len=storage.fns.length-1;storage.fns.splice(i,1);while(i<len)storage.uniqIds[storage.fns[i++].uniqId]=i-1;
delete storage.uniqIds[uniqId]}}}else{delete storage[className]}}return this},_liveClassTrigger:function(e){
var storage=liveClassEventStorage[e.type];if(storage){var node=e.target,classNames=[];for(var className in storage)storage.hasOwnProperty(className)&&classNames.push(className);
do{var nodeClassName=" "+node.className+" ",i=0;while(className=classNames[i++]){if(nodeClassName.indexOf(" "+className+" ")>-1){
var j=0,fns=storage[className].fns,fn,stopPropagationAndPreventDefault=false;while(fn=fns[j++])if(fn.fn.call($(node),e)===false)stopPropagationAndPreventDefault=true;
stopPropagationAndPreventDefault&&e.preventDefault();if(stopPropagationAndPreventDefault||e.isPropagationStopped())return;
classNames.splice(--i,1)}}}while(classNames.length&&(node=node.parentNode))}},_buildLiveEventFn:function(callback,invokeOnInit){
var _this=this;return function(e){var args=[_this._name,((e.data||(e.data={})).domElem=$(this)).closest(_this.buildSelector()),true],block=initBlock.apply(null,invokeOnInit?args.concat([callback,e]):args);
if(block&&!invokeOnInit&&callback)return callback.apply(block,arguments)}},liveInitOnEvent:function(elemName,event,callback){
return this.liveBindTo(elemName,event,callback,true)},liveBindTo:function(to,event,callback,invokeOnInit){
if(!event||$.isFunction(event)){callback=event;event=to;to=undefined}if(!to||typeof to=="string"){to={
elem:to}}to.elemName&&(to.elem=to.elemName);var _this=this;if(to.elem&&to.elem.indexOf(" ")>0){to.elem.split(" ").forEach(function(elem){
_this._liveClassBind(buildClass(_this._name,elem,to.modName,to.modVal),event,callback,invokeOnInit)});
return _this}return _this._liveClassBind(buildClass(_this._name,to.elem,to.modName,to.modVal),event,callback,invokeOnInit);
},liveUnbindFrom:function(elem,event,callback){var _this=this;if(elem.indexOf(" ")>1){elem.split(" ").forEach(function(elem){
_this._liveClassUnbind(buildClass(_this._name,elem),event,callback)});return _this}return _this._liveClassUnbind(buildClass(_this._name,elem),event,callback);
},_liveInitOnBlockEvent:function(event,blockName,callback,findFnName){var name=this._name;blocks[blockName].on(event,function(e){
var args=arguments,blocks=e.block[findFnName](name);callback&&blocks.forEach(function(block){callback.apply(block,args);
})});return this},liveInitOnBlockEvent:function(event,blockName,callback){return this._liveInitOnBlockEvent(event,blockName,callback,"findBlocksOn");
},liveInitOnBlockInsideEvent:function(event,blockName,callback){return this._liveInitOnBlockEvent(event,blockName,callback,"findBlocksOutside");
},liveInitOnBlockInit:function(blockName,callback){return this.liveInitOnBlockEvent("init",blockName,callback);
},liveInitOnBlockInsideInit:function(blockName,callback){return this.liveInitOnBlockInsideEvent("init",blockName,callback);
},on:function(ctx,e,data,fn,fnCtx){return ctx.jquery?this._liveCtxBind(ctx,e,data,fn,fnCtx):this.__base(ctx,e,data,fn);
},un:function(ctx,e,fn,fnCtx){return ctx.jquery?this._liveCtxUnbind(ctx,e,fn,fnCtx):this.__base(ctx,e,fn);
},liveCtxBind:function(ctx,e,data,fn,fnCtx){return this._liveCtxBind(ctx,e,data,fn,fnCtx)},_liveCtxBind:function(ctx,e,data,fn,fnCtx){
var _this=this;if(typeof e=="string"){if($.isFunction(data)){fnCtx=fn;fn=data;data=undefined}if(e.indexOf(" ")>-1){
e.split(" ").forEach(function(e){_this._liveCtxBind(ctx,e,data,fn,fnCtx)})}else{var ctxE=_this._buildCtxEventName(e),storage=liveEventCtxStorage[ctxE]||(liveEventCtxStorage[ctxE]={
counter:0,ctxs:{}});ctx.each(function(){var ctxId=$.identify(this),ctxStorage=storage.ctxs[ctxId];if(!ctxStorage){
ctxStorage=storage.ctxs[ctxId]={};++storage.counter}ctxStorage[$.identify(fn)+(fnCtx?$.identify(fnCtx):"")]={
fn:fn,data:data,ctx:fnCtx}})}}else{$.each(e,function(e,fn){_this._liveCtxBind(ctx,e,fn,data)})}return _this;
},liveCtxUnbind:function(ctx,e,fn,fnCtx){return this._liveCtxUnbind(ctx,e,fn,fnCtx)},_liveCtxUnbind:function(ctx,e,fn,fnCtx){
var _this=this,storage=liveEventCtxStorage[e=_this._buildCtxEventName(e)];if(storage){ctx.each(function(){
var ctxId=$.identify(this,true),ctxStorage;if(ctxId&&(ctxStorage=storage.ctxs[ctxId])){fn&&delete ctxStorage[$.identify(fn)+(fnCtx?$.identify(fnCtx):"")];
if(!fn||$.isEmptyObject(ctxStorage)){storage.counter--;delete storage.ctxs[ctxId]}}});storage.counter||delete liveEventCtxStorage[e];
}return _this},_extractElemNameFrom:function(elem){if(elem.__bemElemName)return elem.__bemElemName;var matches=elem[0].className.match(this._buildElemNameRE());
return matches?matches[1]:undefined},extractParams:extractParams,_buildModClassPrefix:function(modName,elem){
return buildClass(this._name)+(elem?ELEM_DELIM+(typeof elem==="string"?elem:this._extractElemNameFrom(elem)):"")+MOD_DELIM+modName+MOD_DELIM;
},_buildModValRE:function(modName,elem,quantifiers){return new RegExp("(\\s|^)"+this._buildModClassPrefix(modName,elem)+"("+NAME_PATTERN+")(?=\\s|$)",quantifiers);
},_buildElemNameRE:function(){return new RegExp(this._name+ELEM_DELIM+"("+NAME_PATTERN+")(?:\\s|$)")},
buildSelector:function(elem,modName,modVal){return"."+buildClass(this._name,elem,modName,modVal)},getBlockByUniqId:function(uniqId){
return uniqIdToBlock[uniqId]},getWindowSize:function(){return{width:win.width(),height:win.height()}}
});$(function(){BEM.DOM.scope=$("body")})})(BEM,jQuery);(function(){String.prototype.trim||(String.prototype.trim=function(){
var str=this.replace(/^\s\s*/,""),ws=/\s/,i=str.length;while(ws.test(str.charAt(--i)));return str.slice(0,i+1);
})})();(function(Lego){if(!Lego)Lego=window.Lego={};Lego.isSessionValid=function(){return!!Lego.getCookie("yandex_login");
}})(window.Lego);BEM.DOM.decl("i-global",{onSetMod:{js:function(){this.del(this.__self._params=$.extend({},this.params),"uniqId","name");
var params=this.__self._params;params["passport-msg"]||(params["passport-msg"]=params.id);if(params["show-counters"]===undefined){
params["show-counters"]=Math.round(Math.random()*100)<=params["show-counters-percent"]}params.locale=params.lang;
$(function(){params.oframebust&&Lego.oframebust(params.oframebust)})}},getDefaultParams:function(){return{
id:"",login:Lego.isSessionValid()?$.cookie("yandex_login")||"":"",yandexuid:$.cookie("yandexuid"),lang:"ru",
tld:"ru",retpath:encodeURI($.decodeURI(location.href)),"passport-host":"https://passport.yandex.ru","pass-host":"//pass.yandex.ru",
"social-host":"//social.yandex.ru","lego-path":"/lego","show-counters-percent":100}}},{param:function(name){
return(this._params||{})[name]}});(function(Lego){if(!Lego)Lego=window.Lego={};!Lego.params&&(Lego.params={});
function preparseHost(h){return h.replace(/^(?:https?:)?\/\//,"")}Lego.c=function(w,a,opts){var host=preparseHost(opts&&opts.host||BEM.blocks["i-global"].param("click-host")||"clck.yandex.ru"),url=function(w,h,t,a){
h=h.replace("'","%27");return h.indexOf("/dtype=")>-1?h:location.protocol+"//"+host+"/"+t+"/dtype="+w+"/rnd="+((new Date).getTime()+Math.round(Math.random()*100))+(a?"/*"+(h.match(/^http/)?h:location.protocol+"//"+location.host+(h.match("^/")?h:"/"+h)):"/*data="+encodeURIComponent("url="+encodeURIComponent(h.match(/^http/)?h:location.protocol+"//"+location.host+(h.match("^/")?h:"/"+h))));
},click=function(){var head=document.getElementsByTagName("head")[0]||document.getElementsByTagName("body")[0];
var script=document.createElement("script");script.setAttribute("src",url(w,location.href,"jclck"));head.insertBefore(script,head.firstChild);
};if(a){if(a.className.match(/b-link_pseudo_yes/)||a.href&&a.href.match(/^mailto:/)||opts&&opts.noRedirect===true){
click()}else if(a.href){var h=a.href;a.href=url(w,h,"redir");setTimeout(function(){a.href=h},500)}else if(a.form){
if(a.type.match(/submit|button|image/)){var h=a.form.action;a.form.action=url(w,h,"redir",true);setTimeout(function(){
a.form.action=h},500)}else{click()}}else if(a.action){a.action=url(w,a.action,"redir",true)}else{throw"counter.js: not link and not form!";
}}else{click()}}})(window.Lego);(function(Lego,undefined){if(!Lego)Lego=window.Lego={};Lego.cp=function(pi,ci,p,v,a,opts){
typeof v==="string"||(opts=a,a=v,v=undefined);Lego.c("stred/pid="+pi+"/cid="+ci+(p?"/path="+p+(v?"/vars="+v:""):""),a,opts);
}})(window.Lego);(function(Lego){if(!Lego)Lego=window.Lego={};Lego.ch=function(p,v,a){BEM.blocks["i-global"].param("show-counters")&&Lego.cp(0,2219,p,v,a);
}})(window.Lego);(function(Lego){if(!Lego)Lego=window.Lego={};Lego.getCookie=function(n){var c=document.cookie;
if(c.length<1)return false;var b=c.indexOf(n+"=");if(b==-1)return false;b+=n.length+1;var e=c.indexOf(";",b);
return decodeURIComponent(e==-1?c.substring(b):c.substring(b,e))}})(window.Lego);(function($,Lego){if(!Lego)Lego=window.Lego={};
Lego.init||(Lego.init=function(params){(params=Lego.params=$.extend({id:"",login:Lego.isSessionValid()?Lego.getCookie("yandex_login")||"":"",
yandexuid:Lego.getCookie("yandexuid"),locale:"ru",retpath:window.location.toString(),"passport-host":"//passport.yandex.ru",
"pass-host":"//pass.yandex.ru","passport-msg":params.id,"social-host":"//social.yandex.ru","lego-path":"/lego",
"show-counters-percent":100},params,Lego.params))["show-counters"]=Math.round(Math.random()*100)<=params["show-counters-percent"];
BEM.blocks["i-global"]._params||$.extend(BEM.blocks["i-global"]._params={},params);$(function(){params.oframebust&&Lego.oframebust(params.oframebust);
});return params});Lego.block||(Lego.block={});Lego.blockInit||(Lego.blockInit=function(context,blockSelector){
context=context||document;blockSelector=blockSelector||".g-js";$(context).find(blockSelector).each(function(){
var block=$(this),params=this.onclick?this.onclick():{},name=params.name||"",init=Lego.block[name];if(init&&!block.data(name)){
init.call(block,params);block.data(name,true).addClass(name+"_js_inited")}})});Lego.blockInitBinded||(Lego.blockInitBinded=!!$(document).ready(function(){
Lego.blockInit()}))})(jQuery,window.Lego);(function(Lego){if(!Lego)Lego=window.Lego={};Lego.messages=Lego.messages||{};
Lego.message=function(id,text){return Lego.params.locale=="ru"?text:Lego.messages[id]||text}})(window.Lego);
$(function(){BEM.DOM.init()});(function(undefined){window.blocks={};window.root=function(){return $("body").bem("b-page");
};window.replaceURL=function(text,url,newTab,mods,js){return text.replace(/%%(.*)%%/,BEMHTML.apply({block:"link",
mods:mods||{},js:js||false,url:url||"",content:"$1",attrs:newTab?{target:"_blank"}:{}}))};window.cache={
_storage:{eCode:{badLogin:0,badConnection:1,firstTime:2,badToken:3,captcha:5}},set:function(key,value){
if($.isPlainObject(value))value=$.extend({},value);this._storage[key]=value||null},get:function(key){
return this._storage[key]||null}};window.getDomain=function(){switch(window.platform.brandID){case"tb":
return"yandex.com.tr";case"ua":return"yandex.ua"}var lang=window.platform.language,tld;switch(lang){case"tr":
tld="com.tr";break;case"be":tld="by";break;case"kk":tld="kz";break;case"uk":tld="ua";break;default:tld="ru";
}return"yandex."+tld};window.onbeforeunload=function(e){if(!cache.get("preventLeave"))return;if(!e)e=window.event;
e.cancelBubble=true;var settings=cache.get("settings"),error=settings&&settings.error,firstTime=error===cache.get("eCode").firstTime,sure=BEM.I18N("i-sync-i18n__error",firstTime?"sureToLeaveContinueButton":"sureToLeaveSaveButton");
e.returnValue=sure;if(e.stopPropagation){e.stopPropagation();e.preventDefault()}return sure};BEM.DOM.decl("b-page",{
onSetMod:{js:function(){var _this=this,docElement=$(document.documentElement);docElement.addClass("i-ua_js_yes");
setTimeout(function(){BEM.I18N.lang(window.platform.language);document.title=BEM.I18N("i-sync-i18n__content","synchronization");
window.platform.onMessage.addListener(function(data){_this._handleEvent(data)});window.platform.sendMessage({
message:"ready",data:null})},300)},type:{main:function(){var settings=cache.get("settings");settings.captcha=settings.captchaURL&&settings.captchaKey&&{
captchaKey:settings.captchaKey,captchaURL:settings.captchaURL}||null;var params={page:"main",settings:settings
},html=BEMHTML.apply(blocks["b-page"](params));BEM.DOM.update(this.domElem,html);cache.set("preventLeave",null);
},login:function(){var settings=cache.get("settings");settings.captcha=settings.captchaURL&&settings.captchaKey&&{
captchaKey:settings.captchaKey,captchaURL:settings.captchaURL}||null;var params={page:"login",settings:settings
},html=BEMHTML.apply(blocks["b-page"](params));cache.set("preventLeave",null);BEM.DOM.update(this.domElem,html);
},settings:function(){var settings=cache.get("settings"),params={page:"settings",settings:settings},html=BEMHTML.apply(blocks["b-page"](params));
cache.set("preventLeave",null);BEM.DOM.update(this.domElem,html)}}},sendStat:function(param,callback){
$("body").append('<img id="stat-count-%id" style="display:none;" src="%url" />'.replace("%url",this._getStatURL(param)).replace("%id",++this._statCounter));
if(!callback)return;var finished=false;var done=function(e){if(finished)return;finished=true;callback();
};var img=$("#stat-count-"+this._statCounter);img.length&&img.load(done).error(done);setTimeout(done,1e3);
if(!img.length)done()},_statCounter:0,_getStatURL:function(param){var url="https://clck.yandex.ru/click/dtype=stred/pid=12/cid=72327/path=%b.%pdata=http://yandex.ru?rand="+parseInt(Math.random()*1e4,10);
if(param==="showdisk"||param==="notshowdisk"){param+="*"}else{param="showdisk."+param+"*"}url=url.replace("%b",this.navigator()).replace("%p",param);
return url},getIeVersion:function(){var iev=0,ieold=/MSIE (\d+\.\d+);/.test(navigator.userAgent),trident=!!navigator.userAgent.match(/Trident\/7.0/),rv=navigator.userAgent.indexOf("rv:11.0");
if(ieold)iev=new Number(RegExp.$1);if(navigator.appVersion.indexOf("MSIE 10")!=-1)iev=10;if(trident&&rv!=-1)iev=11;
return iev},navigator:function(){if(root().getIeVersion()===0){return"firefox"}else{return"ie"}},enableForms:function(){
this.findBlocksInside("signin").forEach(function(form){form&&form.enable()})},removeCaptcha:function(){
[this.findBlockInside({block:"input",modName:"type",modVal:"captcha"}),this.findBlockInside({block:"link",
modName:"captcha",modVal:"yes"}),this.findBlockInside({block:"popup",modName:"captcha",modVal:"yes"})].forEach(function(block){
block&&block.destruct()});$(".captcha").remove()},_handleEvent:function(eventData){var message=eventData.message,data=eventData.data;
switch(message){case"init":cache.set("settings",data);cache.set("alertedAboutNewLogin",false);this.setMod("branding",window.platform.brandID);
this.setMod("language",window.platform.language);this.delMod("type");if(data.synced){this.setMod("type","settings");
}else if(data.username){this.setMod("type","login")}else{this.setMod("type","main")}break;case"error":
switch(data.code){case 0:this.removeCaptcha();this.showPopup("login-fail",BEM.I18N("i-sync-i18n__error","credentialErrorTitle"),BEM.I18N("i-sync-i18n__error","credentialErrorText"));
this.enableForms();break;case 1:this.removeCaptcha();this.showPopup("login-fail",BEM.I18N("i-sync-i18n__error","networkErrorTitle"),BEM.I18N("i-sync-i18n__error","networkErrorText"));
this.enableForms();break;case 4:this.removeCaptcha();this.showPopup("login-fail",BEM.I18N("i-sync-i18n__error","uknownErrorTitle"),BEM.I18N("i-sync-i18n__error","uknownErrorText"));
this.enableForms();break;case 5:var settings=cache.get("settings"),signin=this.findBlockInside("signin"),login=this.findBlockInside({
block:"input",modName:"type",modVal:"login"}).val()||"",password=this.findBlockInside({block:"input",
modName:"type",modVal:"password"}).val()||"";settings.error=data.code;settings.captcha=data;cache.set("settings",settings);
var json=blocks["signin"]({settings:settings},login,password);BEM.DOM.update(signin.domElem,BEMHTML.apply(json));
signin.reset();this.showPopup("captcha",BEM.I18N("i-sync-i18n__error","captchaPopupTitle"),BEM.I18N("i-sync-i18n__error","captchaPopupText"));
break}break}},showPopup:function(type,title,text){var purpose,popupMods;if(type==="captcha"){popupMods={
captcha:"yes"};purpose=$(".input_type_captcha")}else{popupMods=null;purpose=$(".input_type_login")}$(".popup").remove();
BEM.DOM.append(this.domElem,BEMHTML.apply(blocks["popup"](null,title,text,popupMods)));var newPopup=this.findBlockInside("popup");
this.afterCurrentEvent(function(){newPopup.show(purpose)})},getLoginFromString:function(str){return str.split("@")[0];
}})})();(function(Lego){Lego=Lego||{};Lego.oframebustMatchDomain=function(whitelist,domain){whitelist=Object.prototype.toString.call(whitelist)==="[object Array]"?whitelist:function(){
var arr=[];for(var k in whitelist){whitelist.hasOwnProperty(k)&&arr.push(k)}return arr}();for(var i=0,l=whitelist.length;i<l;i++){
var d=whitelist[i];if(typeof d=="string"){if(/(\?|\*)/.test(d)){var re=d.replace(/\./g,"\\.").replace(/\*/g,".*").replace(/\?/g,".{1}");
if(new RegExp("^"+re+"$").test(domain))return true}else if(domain==d){return true}}else{try{if(d.test(domain))return true;
}catch(e){}}}}})(window.Lego);(function(Lego){Lego=Lego||{};Lego.oframebust=function(whitelist){if(window.top.location!=window.location){
var match=document.referrer.match(/^https?:\/\/([^:\/\s]+)\/?.*/);if(!match)return;!Lego.oframebustMatchDomain(whitelist,match[1])&&(window.top.location=window.location);
}}})(window.Lego);BEM.HTML.decl("b-link",{onBlock:function(ctx){ctx.tag("a").attr("href",ctx.param("url"));
var props=["title","target"],p;while(p=props.pop())ctx.param(p)&&ctx.attr(p,ctx.param(p))}});BEM.DOM.decl("link",{
onSetMod:{disabled:function(modName,modVal){var disabled=modVal==="yes";this.domElem.attr({"aria-disabled":disabled,
tabindex:disabled?-1:0})}},onBlock:function(ctx){ctx.tag("a").attr("href",ctx.param("url"));var props=["title","target"],p;
while(p=props.pop())ctx.param(p)&&ctx.attr(p,ctx.param(p))}});BEM.DOM.decl({block:"link",modName:"action",
modVal:"open-settings"},{onSetMod:{js:function(){this.bindTo("click",function($e){$e.preventDefault();
var settings=this.findBlockOutside("settings");settings.delMod(settings.findElem("form-wrapper"),"hide");
this.destruct()})}}});BEM.DOM.decl({block:"link",modName:"action",modVal:"license-link"},{onSetMod:{js:function(){
this.bindTo("mouseup",function($e){if($e.which<3)root().sendStat("lsclick")})}}});BEM.DOM.decl({block:"link",
modName:"action",modVal:"disk-direct-link"},{onSetMod:{js:function(){this.bindTo("mouseup",function($e){
if($e.which<3)root().sendStat("linkclick")})}}});BEM.DOM.decl("wrapper-logo",{onSetMod:{js:function(){
this.domElem.on("click","a",function(){return false})}}});(function(undefined){BEM.DOM.decl("signin",{
onSetMod:{js:{inited:function(){var _this=this;this.setMod("disabled","no");this.bindTo(this.findElem("submit"),"click",this._onSubmitClick,this);
this.findBlocksInside("input").forEach(function(input){input.on("change",_this._onInputChange,_this)});
this.bindToDoc("keypress",this._onKeyPress)}}},_onSubmitClick:function(){this.submit()},reset:function(){
this._unBind();this.delMod("js");this.setMod("js","inited")},_onInputChange:function(){var userData=this.serialize();
if(userData.username&&userData.password)this.enable();else this.findBlockInside("button").setMod("disabled","yes");
},validateLogin:function(fullLogin){fullLogin=fullLogin.split("@");var domain=fullLogin[1];if(!domain)return true;
return/^(yandex|narod|ya)(\.com)?\.[a-z]{2,3}$/i.test(domain)},submit:function(){if(this.findBlockInside("button").getMod("disabled")==="yes")return;
var userData=this.serialize();if(!userData.username||!userData.password)return;if(!this.validateLogin(userData.username)){
this.findBlockOutside("b-page").showPopup("fail-login",BEM.I18N("i-sync-i18n__error","credentialErrorTitle"),BEM.I18N("i-sync-i18n__error","credentialErrorText"));
return}if(!this._checkSameLogin(userData)){var text;if(root().navigator()==="firefox"){text=BEM.I18N("i-sync-i18n__error","anotherLogin-fx",{
login1:'<strong class="login">'+cache.get("settings").username+"</strong>",login2:'<strong class="login">'+userData.username+"</strong>"
})}else{text=BEM.I18N("i-sync-i18n__error","anotherLogin-ie",{login1:'<strong class="login">'+cache.get("settings").username+"</strong>",
login2:'<strong class="login">'+userData.username+"</strong>"})}cache.set("alertedAboutNewLogin",true);
this.findBlockOutside("b-page").showPopup("fail-login","",text);return}this.disable();var captchaInput=this.findBlockInside({
block:"input",modName:"type",modVal:"captcha"});captchaInput&&$.extend(userData,{captchaKey:cache.get("settings").captcha.captchaKey,
captchaAnswer:captchaInput.val()});this.afterCurrentEvent(function(){userData.username=this.findBlockOutside("b-page").getLoginFromString(userData.username);
window.platform.sendMessage({message:"login",data:userData})})},_checkSameLogin:function(userData){var settings=cache.get("settings"),username=settings&&settings.username||null,alerted=cache.get("alertedAboutNewLogin"),getLogin=this.findBlockOutside("b-page").getLoginFromString;
if(!username)return true;if(getLogin(username)===getLogin(userData.username))return true;if(alerted)return true;
return false},_unBind:function(){var _this=this;this.unbindFrom(this.findElem("submit"),"click");this.findBlocksInside("input").forEach(function(input){
input&&input.un("change",_this._onInputChange,_this)});this.unbindFromDoc("keypress",this._onKeyPress);
},destruct:function(){this._unBind();this.__base.apply(this,arguments)},_onKeyPress:function($e){if($e.keyCode===13)this._onEnterPress();
},_onEnterPress:function(){!this.isDisabled()&&this.submit()},disable:function(){var inputs=this.findBlocksInside("input"),button=this.findBlockInside("button");
inputs&&inputs.forEach(function(input){input.setMod("disabled","yes")});button&&button.setMod("disabled","yes");
this.setMod("disabled","yes")},enable:function(){this.findBlocksInside("input").forEach(function(input){
if(input.getMod("reenable")==="yes"&&input.getMod("always-disabled")!=="yes")input.delMod("disabled");
});this.findBlockInside("button").delMod("disabled");this.delMod("disabled")},isDisabled:function(){return this.getMod("disabled")==="yes";
},serialize:function(){var loginBlock=this.findBlockInside({block:"input",modName:"type",modVal:"login"
}),passBlock=this.findBlockInside({block:"input",modName:"type",modVal:"password"});return{username:loginBlock.val().trim(),
password:passBlock.val().trim()}}})})();(function($){var leftClick=$.event.special.leftclick={setup:function(){
$(this).bind("click",leftClick.handler)},teardown:function(){$(this).unbind("click",leftClick.handler);
},handler:function(e){if(!e.button){e.type="leftclick";$.event.handle.apply(this,arguments);e.type="click";
}}}})(jQuery);BEM.DOM.decl("checkbox",{onSetMod:{js:function(){this.setMod("checked",this.elem("control").prop("checked")?"yes":"");
this._isControlFocused()&&this.setMod("focused","yes")},focused:{yes:function(){if(this.isDisabled())return false;
this._isControlFocused()||this.elem("control").focus();this.setMod(this.elem("box"),"focused","yes");this.afterCurrentEvent(function(){
this.trigger("focus")})},"":function(){this._isControlFocused()&&this.elem("control").blur();this.delMod(this.elem("box"),"focused");
this.afterCurrentEvent(function(){this.trigger("blur")})}},checked:function(modName,modVal){this.elem("control").prop("checked",modVal==="yes");
this.afterCurrentEvent(function(){this.trigger("change")});this.setMod(this.elem("box"),"checked",modVal);
},disabled:function(modName,modVal){this.elem("control").prop("disabled",modVal==="yes")}},isDisabled:function(){
return this.hasMod("disabled","yes")},isChecked:function(){return this.hasMod("checked","yes")},toggle:function(){
this.toggleMod("checked","yes","")},val:function(val){var checkbox=this.elem("control");if(typeof val==="undefined")return checkbox.val();
checkbox.val(val);return this},_onClick:function(e){if(this.isDisabled())return;if(e.target!==this.elem("control")[0]){
e.preventDefault();this.toggle()}this.setMod("focused","yes")},_onChange:function(e){e.target.checked?this.setMod("checked","yes"):this.delMod("checked");
},_onFocusInFocusOut:function(e){this.setMod("focused",e.type==="focusin"?"yes":"")},_onMouseOverMouseOut:function(e){
this.isDisabled()||this.setMod("hovered",e.type==="mouseover"?"yes":"")},_isControlFocused:function(){
try{return this.containsDomElem($(this.__self.doc[0].activeElement))}catch(e){return false}}},{live:function(){
this.liveBindTo("leftclick",function(e){this._onClick(e)}).liveBindTo("control","change",function(e){
this._onChange(e)}).liveBindTo("control","focusin focusout",function(e){this._onFocusInFocusOut(e)}).liveBindTo("mouseover mouseout",function(e){
this._onMouseOverMouseOut(e)});return false}});BEM.DOM.decl("checkbox",{onSetMod:{focused:function(modName,modVal,oldVal){
this.__base.apply(this,arguments);if(modVal==="yes"){this.bindToDoc("click",function(e){if(!$(e.target).parents(".checkbox").is(this.domElem)){
this.delMod("focused")}})}else{this.unbindFromDoc("click")}}}});BEM.DOM.decl("button",{onSetMod:{js:function(){
var disabled=this.isDisabled(),domElem=this.domElem;(this._href=domElem.attr("href"))&&disabled&&domElem.removeAttr("href");
},disabled:function(modName,modVal){var isDisabled=modVal=="yes",domElem=this.domElem;this._href&&(isDisabled?domElem.removeAttr("href"):domElem.attr("href",this._href));
this.afterCurrentEvent(function(){domElem.attr("disabled",isDisabled)})},pressed:function(modName,modVal){
if(this.isDisabled())return false;this.trigger(modVal=="yes"?"press":"release")}},isDisabled:function(){
return this.hasMod("disabled","yes")},url:function(val){if(typeof val=="undefined"){return this._href;
}else{this._href=val;this.isDisabled()||this.domElem.attr("href",val);return this}}});BEM.DOM.decl("button",{
onSetMod:{js:function(){this.__base.apply(this,arguments);this._control=this.elem("control").length&&this.elem("control")||this.domElem;
},focused:{yes:function(){if(this.isDisabled())return false;this.bindToWin("unload",function(){this.delMod("focused");
}).bindTo("keydown",this._onKeyDown);this._isControlFocused()||this._control.focus();this.afterCurrentEvent(function(){
this.trigger("focus")})},"":function(){this.unbindFromWin("unload").unbindFrom("keydown");this._isControlFocused()&&this._control.blur();
this.afterCurrentEvent(function(){this.trigger("blur")})}},disabled:function(modName,modVal){this.__base.apply(this,arguments);
modVal=="yes"&&this.domElem.keyup()},hovered:function(modName,modVal){if(this.isDisabled())return false;
modVal===""&&this.delMod("pressed")},pressed:function(modName,modVal){this.isDisabled()||this.setMod("focused","yes");
return this.__base.apply(this,arguments)}},_isControlFocused:function(){try{return this.containsDomElem($(this.__self.doc[0].activeElement));
}catch(e){return false}},_onKeyDown:function(e){var keyCode=e.keyCode;if((keyCode==13||keyCode==32)&&!this._keyDowned){
this._keyDowned=true;this.setMod("pressed","yes").bindTo("keyup",function(){this.delMod("pressed").unbindFrom("keyup");
delete this._keyDowned;if(keyCode==32&&this.domElem.attr("href")){document.location=this.domElem.attr("href");
}})}},_onClick:function(e){this.isDisabled()?e.preventDefault():this.afterCurrentEvent(function(){this.trigger("click");
})},destruct:function(){this.delMod("focused");this.__base.apply(this,arguments)}},{live:function(){var eventsToMods={
mouseover:{name:"hovered",val:"yes"},mouseout:{name:"hovered"},mousedown:{name:"pressed",val:"yes"},mouseup:{
name:"pressed"},focusin:{name:"focused",val:"yes"},focusout:{name:"focused"}};this.liveBindTo("leftclick",function(e){
this._onClick(e)}).liveBindTo("mouseover mouseout mouseup focusin focusout",function(e){var mod=eventsToMods[e.type];
this.setMod(mod.name,mod.val||"")}).liveBindTo("mousedown",function(e){var mod=eventsToMods[e.type];e.which==1&&this.setMod(mod.name,mod.val||"");
})}});(function(undefined){BEM.DOM.decl({block:"button",modName:"prevent",modVal:"yes"},{_onKeyDown:function(e){
return false}})})();(function(undefined){BEM.DOM.decl({block:"button",modName:"action",modVal:"save"},{
_onClick:function(){this.__base.apply(this,arguments);this.findBlockOutside("b-page").findBlockInside("settings").submit();
}})})();(function(undefined){BEM.DOM.decl({block:"button",modName:"action",modVal:"cancel"},{_onClick:function(){
this.__base.apply(this,arguments);window.platform.sendMessage({message:"cancel",data:null})}})})();(function(undefined){
BEM.DOM.decl({block:"button",modName:"action",modVal:"logout"},{_onClick:function(){this.__base.apply(this,arguments);
if(confirm(BEM.I18N("i-sync-i18n__error","sureTurnSyncOff",{newline:"\n"}))){window.platform.sendMessage({
message:"logout",data:null})}}})})();(function(undefined){BEM.DOM.decl({block:"button",modName:"action",
modVal:"delete-data"},{_onClick:function(){this.__base.apply(this,arguments);var login=cache.get("settings").username+"@"+window.getDomain();
if(confirm(BEM.I18N("i-sync-i18n__error","sureDeleteData",{login:login}))){window.platform.sendMessage({
message:"deleteData",data:null})}}})})();(function(undefined){BEM.DOM.decl({block:"button",modName:"action",
modVal:"install-yadisk"},{_onClick:function(){var os=window.platform.os,url="https://webdav.yandex.ru/share/dist/elements/";
root().sendStat("downloadclick",function(){window.location.href=url});if(os==="mac"){url+="Yandex.Disk.Mac.dmg?root";
}else{url+="YandexDiskSetupPack%l.exe?root".replace("%l",platform.brandID==="tb"?"Tr":"Ru")}}})})();(function($){
BEM.DOM.decl("wrapper",{onSetMod:{js:function(){var logo=$(".input_type_login"),popup=$(".popup");popup.bem("popup").show(logo);
}}})})(jQuery);BEM.DOM.decl("input",{onSetMod:{js:function(){this._val=this.elem("control").val();this.bindFocus();
},disabled:function(modName,modVal){this.elem("control").attr("disabled",modVal==="yes")},focused:function(modName,modVal){
if(this.hasMod("disabled","yes"))return false;var focused=modVal=="yes";focused?this._focused||this._focus():this._focused&&this._blur();
this.afterCurrentEvent(function(){this.trigger(focused?"focus":"blur")})}},bindFocus:function(){this.bindTo(this.elem("control"),{
focus:this._onFocus,blur:this._onBlur})},isDisabled:function(){return this.hasMod("disabled","yes")},
val:function(val,data){if(typeof val=="undefined")return this._val;var input=this.elem("control");input.val()!=val&&input.val(val);
this._val=val;this.trigger("change",data);return this},name:function(name){return this.elem("control").attr("name");
},_onFocus:function(){this._focused=true;return this.setMod("focused","yes")},_onBlur:function(){this._focused=false;
return this.delMod("focused")},_focus:function(){this.elem("control").focus()},_blur:function(){this.elem("control").blur();
}},{});(function(){var instances=[],sysChannel,update=function(){var instance,i=0;while(instance=instances[i++])instance.val(instance.elem("control").val());
},getActiveElement=function(doc){try{return doc.activeElement}catch(e){}};BEM.DOM.decl("input",{onSetMod:{
js:{inited:function(){this.__base.apply(this,arguments);var _this=this,input=_this.elem("control"),activeElement=getActiveElement(_this.__self.doc[0]),haveToSetAutoFocus=_this.params.autoFocus&&!(activeElement&&$(activeElement).is("input, textarea"));
if(activeElement===input[0]||haveToSetAutoFocus){_this.setMod("focused","yes")._focused=true}if(!sysChannel){
sysChannel=_this.channel("sys").on({tick:update,idle:function(){sysChannel.un("tick",update)},wakeup:function(){
sysChannel.on("tick",update)}})}}}},bindFocus:function(){this._instanceIndex=instances.push(this.bindTo(this.elem("control"),{
focus:this._onFocus,blur:this._onBlur}))-1},val:function(val,data){if(typeof val=="undefined")return this._val;
if(this._val!=val){var input=this.elem("control");input.val()!=val&&input.val(val);this._val=val;this.trigger("change",data);
}return this},_focus:function(){var input=this.elem("control")[0];if(input.createTextRange&&!input.selectionStart){
var range=input.createTextRange();range.move("character",input.value.length);range.select()}else{input.focus();
}},destruct:function(){this.__base.apply(this,arguments);this.params.shortcut&&this.unbindFromDoc("keydown");
instances.splice(this._instanceIndex,1);var i=this._instanceIndex,instance;while(instance=instances[i++])--instance._instanceIndex;
}},{})})();BEM.DOM.decl("input",{onSetMod:{js:function(){this.__base.apply(this,arguments);this.params.shortcut&&this.bindToDoc("keydown",function(e){
if(e.ctrlKey&&e.which===38&&!$(e.target).is("input, textarea")){this.setMod("focused","yes")}})}}});(function(){
var timer,counter=0,isIdle=false,idleInterval=0,channel=BEM.channel("sys"),TICK_INTERVAL=50;BEM.decl("i-system",{},{
start:function(){$(document).bind("mousemove keydown",function(){idleInterval=0;if(isIdle){isIdle=false;
channel.trigger("wakeup")}});this._tick()},_tick:function(){var _this=this;channel.trigger("tick",{counter:counter++
});if(!isIdle&&(idleInterval+=TICK_INTERVAL)>3e3){isIdle=true;channel.trigger("idle")}timer=setTimeout(function(){
_this._tick()},TICK_INTERVAL)}}).start()})();BEM.DOM.decl("input",{onSetMod:{js:function(){this.__base.apply(this,arguments);
var _this=this;if(_this.elem("clear")&&!_this.hasMod("clear","visibility","visible")){_this.bindTo("box","click",function(e){
_this.setMod("focused","yes")})}_this.bindInput()}},onElemSetMod:{clear:{visibility:{visible:function(){
this.unbindFrom("box","click")},"":function(){var _this=this;this.bindTo("box","click",function(e){_this.setMod("focused","yes");
})}}}},bindInput:function(){var _this=this;_this.bindTo("input",function(){_this.val(_this.elem("control").val());
_this._updateClear()});_this.on("change",_this._updateClear)._updateClear()},_onClearClick:function(){
this.trigger("clear");this.removeInsets&&this.removeInsets();return this.clearInput({source:"clear"}).setMod("focused","yes");
},clearInput:function(data){this.elem("control").val("");this._val="";this.trigger("change",data);return this;
},_updateClear:function(){return this.toggleMod(this.elem("clear"),"visibility","visible","",!!this._val);
}},{live:function(){this.__base.apply(this,arguments);this.liveBindTo("clear","leftclick",function(e){
this._onClearClick()});return false}});BEM.DOM.decl("input",{bindInput:function(){var _this=this;_this.on("change",_this._updateClear)._updateClear();
},clearInput:function(data){this.val("",data);return this}});BEM.DOM.decl("input",{onSetMod:{js:function(){
this.__base.apply(this,arguments);(this._hasHint=!!this.elem("hint")[0])&&this.on("change",this._updateHint)._updateHint();
},focused:function(){this.__base.apply(this,arguments);this._hasHint&&this._updateHint()}},_updateHint:function(){
this.toggleMod(this.elem("hint"),"visibility","visible",!this.val())}});(function($){var KEYDOWN_EVENT=$.browser.opera&&$.browser.version<12.1?"keypress":"keydown",hasOwn=Object.prototype.hasOwnProperty,generateDirectionsCache;
BEM.DOM.decl("popup",{getDefaultParams:function(){var tailOffset={left:15,right:15,top:15,bottom:15};return{
directions:[{to:"bottom",axis:"center",tail:{axis:"center"}},{to:"top",axis:"center",tail:{axis:"center"
}},{to:"right",axis:"middle",tail:{axis:"middle"}},{to:"left",axis:"middle",tail:{axis:"middle"}}],tail:{
width:24.04,height:12.02,offset:tailOffset},duration:150}},onSetMod:{js:function(){this._cache={};this._viewport=this.__self.win;
this._scope=BEM.DOM.scope;this._channel=BEM.channel("popups");this._inContainer=null;this._isParentFixed=false;
this._owner=null;this._userPosition=null;this._parent=null;this._childs=[];this._isShown=false;this._isHiding=false;
this._positions={};this._currPos={};this._visibilityFactor=null;this._direction=false;this._directions={};
var defaultParams=this.getDefaultParams(),userParams=this.params,defaults=this._repackDirParams(defaultParams.directions),user=this._repackDirParams(userParams.generateDirections?this._generateDirections:userParams.directions);
userParams.tail&&(this.params.tail=this._mergeParams(defaultParams.tail,userParams.tail,{offset:this._offsetParamsHook
}));this._order=user.keys.map(function(key){var userDirection=user.directions[key],defaultDirection=defaults.directions[key];
defaultDirection||(defaultDirection=defaults.directions[userDirection.to]);this._directions[key]=this._mergeParams(defaultDirection,userDirection,{
offset:this._offsetParamsHook,tail:this._tailParamsHook});return key},this)},visibility:{visible:function(){
this._onShown()},"":function(){this._onHidden()}}},show:function(params){var owner;if(params instanceof BEM){
owner=params.domElem}else if(params instanceof $){owner=params}else if(!params){return}if(owner){if(this._owner&&owner[0]!==this._owner[0]){
this.delMod("visibility")}this._owner=owner;var parent=this.findBlockOutside(owner,"popup");parent&&this.setParent(parent);
}else{this._userPosition=params}return this.setMod("visibility","outside").repaint()},hide:function(){
if(this._isHiding){return this}if(this._isShown){this._isHiding=true;this._childs.forEach(function(child){
child.hide()});if(this.hasMod("animate","yes")&&!this.hasMod("fade-out","no")){var _this=this;this.beforeHide(function(){
_this.delMod("visibility")});return this}}return this.delMod("visibility")},toggle:function(owner){return this._isShown&&!this._isHiding?this.hide():this.show(owner||this._owner);
},repaint:function(){this._moveToContainer();var direction=this._pickDirection();this.setMod("to",direction.to)._show(this._positions[direction.key],this._tailPos&&this._tailPos[direction.key]);
return this},getCurrPos:function(){return this._currPos},getCurrDirection:function(){return this._direction;
},setContent:function(content){BEM.DOM.update(this.elem("content"),content);this._isShown&&this.repaint();
return this},isShown:function(){return this._isShown},setParent:function(parent){this._parent=parent;this._isParentFixed=parent.hasMod("position","fixed");
parent.addChild(this);return this},addChild:function(child){var len=this._childs.length,i;for(i=0;i<len;i++){
if(this._childs[i]._uniqId==child._uniqId){return}}this._childs.push(child);child.on("hide",function(){
this.removeChild(child)},this)},removeChild:function(child){var len=this._childs.length,i;for(i=0;i<len;i++){
if(this._childs[i]._uniqId==child._uniqId){this._childs.splice(i,1);break}}},_show:function(position,tailPos){
this._currPos=position;tailPos&&this.elem("tail").removeAttr("style").css(tailPos);this.domElem.css(position);
(!this._isShown||this._isHiding)&&(this.hasMod("animate","yes")&&!this.hasMod("fade-in","no"))&&this.afterShow();
this._isHiding=false;this.setMod("visibility","visible");return this},_onShown:function(){this.bindToDoc(KEYDOWN_EVENT,function(e){
if(e.which===27){$(this.__self.doc[0].activeElement).blur();this.hide()}});this._attachUnder();this._isShown=true;
this.hasMod("autoclosable","yes")&&this.afterCurrentEvent(function(){this._enableAutoclosable()});this.hasMod("adaptive","yes")&&this._enableAdaptive();
var bro=$.browser;if(bro.msie&&parseInt(bro.version,10)>=9){var nodes=[this.domElem,this.elem("content")],zIndexes=nodes.map(function(node){
return parseInt(node.css("z-index"),10)||""});this.domElem[0].onresize=function(){nodes.forEach(function(node,i){
node.css("z-index",zIndexes[i]+1)});setTimeout(function(){nodes.forEach(function(node,i){node.css("z-index",zIndexes[i]);
})},0)}}this._channel.on("hide",this.hide,this);this.trigger("show")},_onHidden:function(){this.unbindFromDoc(KEYDOWN_EVENT);
this._detachUnder();this.hasMod("autoclosable","yes")&&this._disableAutoclosable();this.hasMod("adaptive","yes")&&this._disableAdaptive();
this._cache={};this._isShown=false;this._isHiding=false;var bro=$.browser;if(bro.msie&&parseInt(bro.version,10)>=9){
this.domElem[0].onresize=null}this._channel.un("hide");this.trigger("hide")},_mergeParams:function(defaultParams,userParams,hooks){
var res={};hooks||(hooks={});defaultParams&&typeof defaultParams=="object"&&Object.keys(defaultParams).forEach(function(key){
res[key]=defaultParams[key]});Object.keys(userParams).forEach(function(key){var hookRes=hasOwn.call(hooks,key)?hooks[key].call(this,defaultParams[key],userParams[key]):userParams[key];
res[key]=!hookRes||typeof hookRes!="object"||Array.isArray(hookRes)?hookRes:defaultParams[key]?this._mergeParams(defaultParams[key],hookRes,hooks):hookRes;
},this);return res},_offsetParamsHook:function(defaultParams,userParams){return typeof userParams=="number"?{
top:userParams,bottom:userParams,left:userParams,right:userParams}:userParams},_tailParamsHook:function(defaultParams,userParams){
userParams.offset||(userParams.offset=this.params.tail.offset);return userParams},_generateDirections:function(){
if(generateDirectionsCache)return generateDirectionsCache;var directions=[["bottom","top"],["left","right"]],axises=[["center","left","right"],["middle","top","bottom"]],tailAxises=axises,directionsLen=directions.length,res=[];
for(var tier=0;tier<directionsLen;tier++){var directionsTier=directions[tier],tierLen=directionsTier.length;
for(var j=0;j<tierLen;j++){var axisesTier=axises[tier],axisesTierLen=axisesTier.length;for(var k=0;k<axisesTierLen;k++){
var tailAxisesTier=tailAxises[tier],tailAxisesTierLen=tailAxisesTier.length;for(var l=0;l<tailAxisesTierLen;l++){
res.push({direction:directionsTier[j],axis:axisesTier[k],tail:{axis:tailAxisesTier[l]}})}}}}return generateDirectionsCache=res;
},_repackDirParams:function(dirParams){var directions={},keys=[];(typeof dirParams=="string"||$.isPlainObject(dirParams))&&(dirParams=[dirParams]);
keys=dirParams.map(function(direction){if(typeof direction=="string"){var keys=direction.split("-");direction={
to:keys[0],tail:{}};keys[1]&&(direction.axis=keys[1]);keys[2]&&(direction.tail.axis=keys[2])}var key=direction.to;
directions[key]||(directions[key]=direction);direction.axis&&(key+="-"+direction.axis);direction.key=key;
directions[key]=direction;return key},this);return{directions:directions,keys:keys}},setViewport:function(viewport){
this._viewport=viewport;return this},_pickDirection:function(){var order=this._order,len=this.hasMod("adaptive","yes")?order.length:1,i;
this._visibilityFactor=0;for(i=0;i<len;i++){var key=order[i],direction=this._directions[key];this._resetPos(key)._pushPos(key,this._calcPos(direction))._pushPos(key,this._calcOffsets(direction));
this._hasTail()&&this._resetTailPos(key)._pushTailPos(key,this._calcTailPos(direction))._pushTailPos(key,this._calcTailOffset(direction))._pushPos(key,this._calcOffsetByTail(direction));
this._pushPos(key,this._getParentOffset());var visibilityFactor=this._calcVisibilityFactor(direction);
if(visibilityFactor>this._visibilityFactor||!this._direction){this._visibilityFactor=visibilityFactor;
this._direction=this._directions[key];if(visibilityFactor==100){break}}}return this._direction},_getParentOffset:function(){
var offset=this.domElem.offsetParent().offset();offset.left*=-1;offset.top*=-1;return offset},_calcPos:function(direction){
var ownerPos=this.getOwnerPos(),ownerSize=this.getOwnerSize(),popupSize=this.getPopupSize(),axis=direction.axis,userPos=this.params.position||{},position={};
switch(direction.to){case"bottom":position={top:hasOwn.call(userPos,"top")?userPos.top:ownerPos.top+ownerSize.height,
left:hasOwn.call(userPos,"left")?userPos.left:this._calcLeft(axis)};break;case"top":position={top:hasOwn.call(userPos,"top")?userPos.top:ownerPos.top-popupSize.height,
left:hasOwn.call(userPos,"left")?userPos.left:this._calcLeft(axis)};break;case"left":position={top:hasOwn.call(userPos,"top")?userPos.top:this._calcTop(axis),
left:hasOwn.call(userPos,"left")?userPos.left:ownerPos.left-popupSize.width};break;case"right":position={
top:hasOwn.call(userPos,"top")?userPos.top:this._calcTop(axis),left:hasOwn.call(userPos,"left")?userPos.left:ownerPos.left+ownerSize.width
};break}return position},_calcTop:function(axis){var top=0,popupSize=this.getPopupSize(),ownerPos=this.getOwnerPos(),ownerSize=this.getOwnerSize();
if(axis=="top"){top+=ownerPos.top}else if(axis=="middle"){top+=ownerPos.top+ownerSize.height/2-popupSize.height/2;
}else if(axis=="bottom"){top+=ownerPos.top+ownerSize.height-popupSize.height}return top},_calcLeft:function(axis){
var left=0,popupSize=this.getPopupSize(),ownerPos=this.getOwnerPos(),ownerSize=this.getOwnerSize();if(axis=="left"){
left+=ownerPos.left}else if(axis=="center"){left+=ownerPos.left+ownerSize.width/2-popupSize.width/2}else if(axis=="right"){
left+=ownerPos.left+ownerSize.width-popupSize.width}return left},_calcOffsets:function(direction){var cache=this._cache.offset||(this._cache.offset={}),key=direction.key,offsetParams=direction.offset,offset;
if(cache[key]){return cache[key]}if(!offsetParams){return false}offset={left:0,top:0};offsetParams.left&&(offset.left+=offsetParams.left);
offsetParams.right&&(offset.left-=offsetParams.right);offsetParams.top&&(offset.top+=offsetParams.top);
offsetParams.bottom&&(offset.top-=offsetParams.bottom);return cache[key]=offset},_hasTail:function(){
return this.elem("tail").length!==0},_moveToContainer:function(container){container||(container=this._parent?this._parent.domElem:this._scope);
this._inContainer?container.children(":last")[0]===this.domElem[0]||this.domElem.appendTo(container):this._inContainer=!!this.domElem.appendTo(container);
},_resetPos:function(key){key?this._positions[key]=null:this._positions={};return this},_pushPosTo:function(target,key,offset){
if(offset===false){return}if(typeof key=="string"){this._sum(target[key]||(target[key]={}),offset)}else{
offset=key;Object.keys(target).forEach(function(key){this._sum(target[key],offset)},this)}},_pushPos:function(key,offset){
this._pushPosTo(this._positions,key,offset);return this},_sum:function(source,adds){Object.keys(adds).forEach(function(key){
source[key]=(source[key]||0)+adds[key]})},_getSizeOf:function(domElem){return{height:domElem.outerHeight(),
width:domElem.outerWidth()}},getOwnerSize:function(){return this._owner?this._cache.ownerSize||(this._cache.ownerSize=this._getSizeOf(this._owner)):{
height:0,width:0}},getPopupSize:function(){return this._getSizeOf(this.domElem)},_getPosOf:function(domElem){
return domElem.offset()||{left:0,top:0}},getOwnerPos:function(){var pos;if(this._owner){pos=this._getPosOf(this._owner);
if(this.hasMod("position","fixed")){var viewport=this._viewport;pos.top-=viewport.scrollTop();pos.left-=viewport.scrollLeft();
}}return pos||this._userPosition},_calcVisibilityFactor:function(direction){var viewport=this._viewport,viewportSize=this._getSizeOf(viewport),popupSize=this.getPopupSize(),popupPos=this._positions[direction.key],parentOffset=this._parent?this._parent.domElem.offset():{
top:0,left:0},top=popupPos.top+(this._isParentFixed?parentOffset.top:-viewport.scrollTop()),left=popupPos.left+(this._isParentFixed?parentOffset.left:-viewport.scrollLeft()),right=left+popupSize.width-viewportSize.width,bottom=top+popupSize.height-viewportSize.height,visibleRect={
height:popupSize.height,width:popupSize.width},popupArea,visibleArea,visibility=100;bottom>0&&(visibleRect.height-=bottom);
top<0&&(visibleRect.height+=top);left<0&&(visibleRect.width+=left);right>0&&(visibleRect.width-=right);
if(visibleRect.height<0||visibleRect.width<0){visibility=0}else{visibleArea=Math.abs(visibleRect.height*visibleRect.width);
popupArea=popupSize.height*popupSize.width;popupArea!=visibleArea&&(visibility=visibleArea/popupArea*100);
}return visibility},destruct:function(){var args=arguments;this._channel.un("hide");this._childs.forEach(function(child){
child.destruct.apply(child,args)});return this.__base.apply(this,args)}},{live:function(){this.liveBindTo("close","leftclick",function(){
this.hide()})}})})(jQuery);BEM.DOM.decl({block:"popup",modName:"autoclosable",modVal:"yes"},{onSetMod:{
autoclosable:{"":function(){this._disableAutoclosable()}}},_enableAutoclosable:function(){var under=this._under;
if(this.hasMod(under,"type","paranja")){under.is("iframe")&&(under=$([under[0].contentWindow,under[0].contentWindow.document]));
this.bindTo(under,"leftclick tap",function(e){e.stopPropagation();this.hide()})}this.bindToDoc("leftclick tap",function(domEvent){
if(this._isRelatedNode($(domEvent.target))){return}var e=$.Event("outside-click");this.trigger(e,domEvent);
e.isDefaultPrevented()||this.hide()})},_disableAutoclosable:function(){this.hasMod(this._under,"type","paranja")&&this.unbindFrom(this._under,"leftclick tap");
this.unbindFromDoc("leftclick tap")},_isRelatedNode:function(node){if(this.containsDomElem(node)||this._owner&&this.containsDomElem.call({
domElem:this._owner},node)){return true}var len=this._childs.length,i;for(i=0;i<len;i++){if(this.containsDomElem.call({
domElem:this._childs[i].domElem},node)){return true}}return false}});BEM.DOM.decl({block:"popup",modName:"adaptive",
modVal:"yes"},{onSetMod:{adaptive:{yes:function(){this._enableAdaptive()},no:function(){this._disableAdaptive();
}},"watch-scroll":{yes:function(){this._watchScroll()},no:function(){this._unwatchScroll()}},visibility:{
visible:function(){this.__base();this.hasMod("adaptive","yes")&&this._enableAdaptive()},"":function(){
this.__base();this._disableAdaptive()}}},_enableAdaptive:function(){this.bindToWin("resize",this.onResize)._watchScroll();
},_disableAdaptive:function(){this.unbindFromWin("resize")._unwatchScroll()},getScrollEvents:function(){
return["scroll"]},_watchScroll:function(){if(this._owner&&!this.hasMod("watch-scroll","no")){this.bindTo(this._owner.parents().add(this._viewport),this.getScrollEvents().join(" "),this.onScroll,this);
}},_unwatchScroll:function(){this._owner&&this.unbindFromDomElem(this._owner.parents().add(this._viewport),this.getScrollEvents().join(" "));
},onResize:function(e){this._cache={};this._isHiding||this.repaint()},onScroll:function(e){this._cache={};
this._isHiding||this.repaint()},destruct:function(){this._disableAdaptive();this.__base.apply(this,arguments);
}});BEM.DOM.decl({block:"popup",modName:"animate",modVal:"yes"},{afterShow:function(){var direction=this.getCurrDirection();
if(!direction){return}var to=direction.to,position=this.getCurrPos(),popupSize=this.getPopupSize(),tailOpts=this.params.tail,animateOpts={
opacity:1,top:position.top,left:position.left},cssOpts={opacity:0,top:position.top,left:position.left
};if(to=="bottom"){cssOpts.top+=10}else if(to=="top"){cssOpts.top-=10}else if(to=="left"){cssOpts.left-=10;
}else if(to=="right"){cssOpts.left+=10}this.domElem.stop(true).css(cssOpts).animate(animateOpts,this.params.duration);
},beforeHide:function(callback){var direction=this.getCurrDirection();if(!direction){return callback();
}var to=direction.to,position=this.getCurrPos(),popupSize=this.getPopupSize(),tailOpts=this.params.tail,domElem=this.domElem,animateOpts={
top:position.top,left:position.left,opacity:0};if(to=="bottom"){animateOpts.top+=10}else if(to=="top"){
animateOpts.top-=10}else if(to=="left"){animateOpts.left-=10}else if(to=="right"){animateOpts.left+=10;
}return domElem.stop(true,true).animate(animateOpts,this.params.duration,function(){callback();domElem.css("opacity","");
})}});(function(){var underPool=[];BEM.DOM.decl("popup",{onSetMod:{js:function(){this.__base.call(this);
var under=this.findElem("under").first();this._underClassAttr=under.attr("class");if(this.isDivEnough()){
this._under=under}else{under.remove();this._under=null}this._underInPool=false}},isDivEnough:function(){
return false},_createUnder:function(){return $('<iframe frameBorder="0" src="'+"about:blank"+'"/>')},
_getUnder:function(){if(this._under){return this._under}var fromPool=underPool.pop();fromPool&&(this._underInPool=false);
return this._under=fromPool||this._createUnder()},_attachUnder:function(){var under=this._under=this._getUnder();
under.attr("class",this._underClassAttr);this.hasMod(under,"type","paranja")?under.detach().insertBefore(this.domElem):under.prependTo(this.domElem);
},_detachUnder:function(){var under=this._under;underPool.push(under.detach());this._under=null;this._underInPool=true;
},destruct:function(){this._underInPool&&underPool.pop();return this.__base.apply(this,arguments)}})})();
BEM.DOM.decl("popup",{_createUnder:function(){return $('<div class="popup__under" />')}});BEM.DOM.decl("popup",{
onSetMod:{js:function(){this.__base();this._tailPos={}}},_calcTailPos:function(direction){var to=direction.to,currentPos=this._positions[direction.key],axis=direction.tail.axis,position={};
if(to=="top"||to=="bottom"){position.left=this._calcTailLeft(axis,currentPos)}else if(to=="left"||to=="right"){
position.top=this._calcTailTop(axis,currentPos)}return position},_calcTailTop:function(axis,popupPos){
var top=0,correction=0,ownerSize=this.getOwnerSize(),ownerPos=this.getOwnerPos(),tailHeight=this.params.tail.width,popupSize=this.getPopupSize(),chunk=popupSize.height,topOffset=ownerPos.top-popupPos.top,bottomOffset=popupPos.top+popupSize.height-(ownerPos.top+ownerSize.height);
if(topOffset>0){top+=topOffset;chunk-=topOffset}bottomOffset>0&&(chunk-=bottomOffset);if(axis=="middle"){
chunk-=tailHeight;top+=chunk/2}else if(axis=="bottom"){chunk-=tailHeight;top+=chunk}top<0&&(top=0);return top;
},_calcTailLeft:function(axis,popupPos){var left=0,correction=0,ownerSize=this.getOwnerSize(),ownerPos=this.getOwnerPos(),tailWidth=this.params.tail.width,popupSize=this.getPopupSize(),leftOffset=ownerPos.left-popupPos.left,chunk=popupSize.width,rightOffset=popupPos.left+popupSize.width-(ownerPos.left+ownerSize.width);
if(leftOffset>0){left+=leftOffset;chunk-=leftOffset}rightOffset>0&&(chunk-=rightOffset);if(axis=="center"){
chunk-=tailWidth;left+=chunk/2}else if(axis=="right"){chunk-=tailWidth;left+=chunk}return left},_calcOffsetByTail:function(params){
var tail=this.params.tail,height=tail.height,position={};switch(params.to){case"top":position={top:-height
};break;case"bottom":position={top:height};break;case"right":position={left:height};break;case"left":
position={left:-height};break}return position},_calcTailOffset:function(direction){var offset={},to=direction.to,tailParams=direction.tail,tailOffset=tailParams.offset,tailAxis=tailParams.axis;
if(!tailOffset){return false}if(to=="top"||to=="bottom"){offset.left=0;if(tailAxis=="left"){offset.left+=tailOffset.left;
}else if(tailAxis=="center"){tailOffset.left&&(offset.left+=tailOffset.left);tailOffset.right&&(offset.left-=tailOffset.right);
}else if(tailAxis=="right"){offset.left-=tailOffset.right}}else if(to=="left"||to=="right"){offset.top=0;
if(tailAxis=="top"){offset.top+=tailOffset.top}else if(tailAxis=="middle"){tailOffset.top&&(offset.top+=tailOffset.top);
tailOffset.bottom&&(offset.top-=tailOffset.bottom)}else if(tailAxis=="bottom"){offset.top-=tailOffset.bottom;
}}return offset},_resetTailPos:function(key){key?this._tailPos[key]=null:this._tailPos={};return this;
},_pushTailPos:function(key,offset){this._pushPosTo(this._tailPos,key,offset);return this}});(function(undefined){
function sendStat(param){root().sendStat(param)}BEM.DOM.decl("settings",{onSetMod:{js:function(){var params=this.params;
if(params.firstTime){if(params.yadisk){sendStat("showdisk")}else{sendStat("notshowdisk")}}this.findBlockInside("settings-form").on("unchecked",this._onUncheck,this);
params=null}},_onUncheck:function($e,unchecked){var firstTime=cache.get("settings").error===2;if(unchecked&&!firstTime)this.delMod(this.findElem("alert"),"hidden");else this.setMod(this.findElem("alert"),"hidden","yes");
},submit:function(){this.findBlockInside("settings-form").submit()}})})();(function(undefined){BEM.DOM.decl("settings-form",{
isChanged:false,onSetMod:{js:function(){var _this=this;this.findBlocksInside("checkbox").forEach(function(checkbox){
checkbox.on("change",_this._onCheckboxChanged,_this)})}},_onCheckboxChanged:function(){this._calculateDiff();
this._checkedIsUnchecked()},_checkedIsUnchecked:function(){var newVals=this.vals(),oldVals=cache.get("settings").settings,unchecked=false;
for(key in oldVals){if(oldVals[key]&&oldVals[key]!==newVals[key])unchecked=true}if(unchecked)this.trigger("unchecked",true);else this.trigger("unchecked",false);
},vals:function(){var newVals={};this.findBlocksInside("checkbox").forEach(function(checkbox){newVals[checkbox.params.name]=checkbox.isChecked();
});return newVals},_calculateDiff:function(){var newVals=this.vals(),oldVals=cache.get("settings").settings,changed=false;
for(key in oldVals){if(oldVals[key]!==newVals[key]){changed=true;break}}this.isChanged=changed;cache.set("preventLeave",changed);
},submit:function(){var newVals=this.vals();var settings=cache.get("settings");settings.error=null;cache.set("settings",settings);
cache.set("preventLeave",null);window.platform.sendMessage({message:"saveSettings",data:{settings:newVals
}})}})})();blocks["head-logo"]=function(params){return[{block:"head-logo",content:{block:"b-link",url:"https://"+window.getDomain(),
attrs:{title:BEM.I18N("i-sync-i18n__head-logo","yandex")},content:{block:"head-logo",elem:"logo"}}}]};
blocks["b-page"]=function(params){return this["b-page_type_"+params.page](params)};blocks["b-page_type_main"]=function(params){
return[blocks["wrapper-logo"](params),blocks["wrapper"](params)]};blocks["b-page_type_settings"]=function(params){
return[blocks["wrapper-logo"](params),blocks["wrapper"](params)]};blocks["b-page_type_login"]=function(params){
return[blocks["wrapper-logo"](params),blocks["wrapper"](params)]};blocks["b-page_type_allready"]=function(params){
return[blocks["wrapper-logo"](params),blocks["wrapper"](params)]};blocks["wrapper-logo"]=function(){return{
block:"wrapper-logo",js:true,content:[{block:"link",url:"#",content:[{elem:"icon"},{elem:"inner",content:BEM.I18N("i-sync-i18n__head-logo","text")
}]}]}};blocks["wrapper__inner"]=function(params){return this["wrapper__inner_type_"+params.page](params);
};blocks["wrapper__inner_type_login"]=function(params){return[{elem:"inner",mods:{type:"login"},content:[blocks["description"](params)]
},blocks["wrapper__inner_type_main-login"](params)]};blocks["wrapper__inner_type_main-login"]=function(params){
return{elem:"inner",mods:{type:"main-login"},content:[blocks["head-logo"](params),blocks["signin"](params)]
}};blocks["wrapper__inner_type_main"]=function(params){return[{elem:"inner",mods:{type:"main"},content:[{
block:"description",content:[{elem:"title",content:BEM.I18N("i-sync-i18n__content","synchronization")
},{elem:"text",content:BEM.I18N("i-sync-i18n__content","turnOnSync")},{elem:"text",content:BEM.I18N("i-sync-i18n__content","syncIsFast")
}]}]},blocks["wrapper__inner_type_main-login"](params),{elem:"line"},{elem:"inner",mods:{type:"main"},
content:[{block:"description",content:[{elem:"text",content:[{elem:"text-title",content:BEM.I18N("i-sync-i18n__content","twoComputers")
},BEM.I18N("i-sync-i18n__content","saveHomeAndWork")]},{elem:"text",content:[{elem:"text-title",content:BEM.I18N("i-sync-i18n__content","restoreBrowserSettings")
},BEM.I18N("i-sync-i18n__content","settingsAndPasswordsSafeNow")]}]}]},{elem:"inner",mods:{type:"main"
},content:[{block:"sync-pic"}]}]};blocks["wrapper__inner_type_settings"]=function(params){var error=params.settings.error,yadisk=params.settings.yadisk,firstTime=error===cache.get("eCode").firstTime;
return[{elem:"inner",mods:{type:"settings"},content:[{elem:"inner-padding",content:blocks["settings"](params),
mods:{first:"yes"}},firstTime&&{block:"wrapper",elem:"line",elemMods:{type:"settings"}},firstTime&&yadisk&&{
elem:"inner-padding",mods:{last:"yes"},content:blocks["yadisk"](params)}]},{block:"wrapper-button",content:[{
block:"button",mods:{size:"s",theme:"pseudo",action:"delete-data"},content:BEM.I18N("i-sync-i18n__button","deleteData")
},{block:"button",mods:{size:"s",theme:"pseudo",action:"logout"},content:BEM.I18N("i-sync-i18n__button","turnSyncOff")
}]}]};blocks["signin"]=function(params,login,password){login=login||"";password=password||"";var settings=params.settings,error=settings&&settings.error,captcha=!!settings.captcha,loginMods={
size:"m",type:"login",reenable:"yes"};return{block:"signin",id:"1",js:true,tag:"form",content:[{block:"input",
mods:loginMods,value:params.settings&&params.settings.username||login,content:[{elem:"hint",content:BEM.I18N("i-sync-i18n__content","login")
},{elem:"control"}]},{block:"input",mods:{size:"m",type:"password",reenable:"yes"},value:password,content:[{
elem:"hint",content:BEM.I18N("i-sync-i18n__content","password")},{elem:"control"}]},captcha&&{block:"captcha",
tag:"img",attrs:{src:settings.captcha.captchaURL.replace(/^http(?!s)/,"https")}},captcha&&{block:"input",
mods:{size:"m",type:"captcha"},content:[{elem:"hint",content:BEM.I18N("i-sync-i18n__content","symbolsFromPic")
},{elem:"control"}]},{block:"button",mix:[{block:"signin",id:"1",elem:"submit"}],mods:{size:"m",theme:"action",
disabled:"yes",prevent:"yes"},content:BEM.I18N("i-sync-i18n__button","turnSyncOn")},{block:"link",url:"https://passport."+window.getDomain()+"/passport?mode=restore",
attrs:{target:"_blank"},content:BEM.I18N("i-sync-i18n__link","forgetPass")},"<br>",{block:"link",url:"https://passport."+window.getDomain()+"/registration",
attrs:{target:"_blank"},content:BEM.I18N("i-sync-i18n__link","createAccount")}]}};blocks["checkbox"]=function(params,name){
var mods=params.settings.settings[name]?{size:"s",checked:"yes"}:{size:"s"};return{block:"checkbox",mods:mods,
js:{name:name},content:[{elem:"label",content:BEM.I18N("i-sync-i18n__checkbox",name)}]}};blocks["description"]=function(params){
var settings=params.settings,error=settings&&settings.error,badToken=error===cache.get("eCode").badToken;
return{block:"description",content:[{elem:"title",content:BEM.I18N("i-sync-i18n__content","synchronization")
},{elem:"text",content:badToken&&BEM.I18N("i-sync-i18n__content","badToken")||BEM.I18N("i-sync-i18n__content","syncWasUsed",{
login:'<strong class="login">'+params.settings.username+"</strong>"})}]}};blocks.yadisk=function(params){
var licenseText=replaceURL(BEM.I18N("i-sync-i18n__content","yaDiskLicense"),"https://legal."+getDomain()+"/disk_termsofuse/",true,{
action:"license-link"},true),diskText=replaceURL(BEM.I18N("i-sync-i18n__content","yaDiskText"),"https://disk."+getDomain()+"/?source=copy-elements",true,{
action:"disk-direct-link"},true);return[{block:"settings",mods:{type:"yadisk"},js:false,content:[{elem:"title",
content:diskText},{elem:"title",content:licenseText},{block:"button",mods:{theme:"action",action:"install-yadisk",
size:"m"},content:BEM.I18N("i-sync-i18n__button","install-yadisk")},{block:"button",mods:{theme:"normal",
action:"save",size:"m"},content:BEM.I18N("i-sync-i18n__button","cancel")}]}]};blocks["wrapper"]=function(params){
return{block:"wrapper",mix:[{block:"i-clearfix"}],content:blocks["wrapper__inner"](params)}};blocks["popup"]=function(params,title,text,mods){
var defaultMods={adaptive:"yes",type:"alert"};mods&&$.extend(defaultMods,mods);return{block:"popup",mods:defaultMods,
js:{directions:["left-middle"]},content:[{elem:"tail"},{elem:"close"},{elem:"content",content:blocks["popup-inner"](params,title,text)
}]}};blocks["popup-inner"]=function(params,title,text){return{block:"popup-inner",content:[title&&{elem:"title",
content:title},text&&{elem:"text",content:text}]}};blocks["settings"]=function(params){var error=params.settings.error,yadisk=params.settings.yadisk,firstTime=error===cache.get("eCode").firstTime,login=params.settings.username+"@"+window.getDomain();
if(firstTime){return[{block:"settings",mods:{hide:"yes"},js:{yadisk:yadisk,firstTime:firstTime},content:[{
elem:"title",content:[BEM.I18N("i-sync-i18n__content","allreadyDone")," ",BEM.I18N("i-sync-i18n__content","syncUsesLogin",{
login:'<span class="login">'+login+"</span>"})]},yadisk&&{elem:"title",mods:{nomargin:"yes"},content:{
block:"link",content:BEM.I18N("i-sync-i18n__link","syncSettings"),js:true,mods:{action:"open-settings",
link:"no"},url:"#"}},{elem:"form-wrapper",elemMods:{hide:yadisk?"yes":""},content:[{elem:"clear",mix:[{
block:"i-clearfix"}],content:[blocks["settings-form"](params)]},{elem:"alert",elemMods:{hidden:"yes"},
content:BEM.I18N("i-sync-i18n__error","youTurnedOffSomeSettings")},{elem:"buttons",content:[{block:"button",
mods:{size:"m",theme:"normal",action:"save"},content:BEM.I18N("i-sync-i18n__button","continueWork")}]
}]}]}]}return{block:"settings",js:true,content:{elem:"form-wrapper",content:[{elem:"clear",mix:[{block:"i-clearfix"
}],content:[blocks["settings-form"](params)]},{elem:"alert",elemMods:{hidden:"yes"},content:BEM.I18N("i-sync-i18n__error","youTurnedOffSomeSettings")
},{elem:"buttons",content:[{block:"button",mods:{size:"m",theme:"action",action:"save"},content:BEM.I18N("i-sync-i18n__button","continueWork")
}]}]}}};blocks["settings-form"]=function(params){function reOrderServices(services){var priorities=["vb","bookmarks","history","forms","passwords"],reordered=[],service;
while(service=priorities.shift()){if(typeof services[service]==="boolean"){reordered.push([service,services[service]]);
}}return reordered}return{block:"settings-form",js:true,content:[{elem:"title",content:BEM.I18N("i-sync-i18n__content","synchronize")
},{elem:"column",content:function(services){var bemjson=[];services=reOrderServices(services);services.forEach(function(service){
bemjson.push(blocks["checkbox"](params,service[0]))});return bemjson}(params.settings.settings)}]}};blocks["head-logo"]=function(params){
return[{block:"head-logo",content:{block:"b-link",url:"https://"+window.getDomain(),attrs:{title:BEM.I18N("i-sync-i18n__head-logo","yandex")
},content:{block:"head-logo",elem:"logo"}}}]};blocks["b-page"]=function(params){return this["b-page_type_"+params.page](params);
};blocks["b-page_type_main"]=function(params){return[blocks["wrapper-logo"](params),blocks["wrapper"](params)];
};blocks["b-page_type_settings"]=function(params){return[blocks["wrapper-logo"](params),blocks["wrapper"](params)];
};blocks["b-page_type_login"]=function(params){return[blocks["wrapper-logo"](params),blocks["wrapper"](params)];
};blocks["b-page_type_allready"]=function(params){return[blocks["wrapper-logo"](params),blocks["wrapper"](params)];
};blocks["wrapper-logo"]=function(){return{block:"wrapper-logo",js:true,content:[{block:"link",url:"#",
content:[{elem:"icon"},{elem:"inner",content:BEM.I18N("i-sync-i18n__head-logo","text")}]}]}};blocks["wrapper__inner"]=function(params){
return this["wrapper__inner_type_"+params.page](params)};blocks["wrapper__inner_type_login"]=function(params){
return[{elem:"inner",mods:{type:"login"},content:[blocks["description"](params)]},blocks["wrapper__inner_type_main-login"](params)];
};blocks["wrapper__inner_type_main-login"]=function(params){return{elem:"inner",mods:{type:"main-login"
},content:[blocks["head-logo"](params),blocks["signin"](params)]}};blocks["wrapper__inner_type_main"]=function(params){
return[{elem:"inner",mods:{type:"main"},content:[{block:"description",content:[{elem:"title",content:BEM.I18N("i-sync-i18n__content","synchronization")
},{elem:"text",content:BEM.I18N("i-sync-i18n__content","turnOnSync")},{elem:"text",content:BEM.I18N("i-sync-i18n__content","syncIsFast")
}]}]},blocks["wrapper__inner_type_main-login"](params),{elem:"line"},{elem:"inner",mods:{type:"main"},
content:[{block:"description",content:[{elem:"text",content:[{elem:"text-title",content:BEM.I18N("i-sync-i18n__content","twoComputers")
},BEM.I18N("i-sync-i18n__content","saveHomeAndWork")]},{elem:"text",content:[{elem:"text-title",content:BEM.I18N("i-sync-i18n__content","restoreBrowserSettings")
},BEM.I18N("i-sync-i18n__content","settingsAndPasswordsSafeNow")]}]}]},{elem:"inner",mods:{type:"main"
},content:[{block:"sync-pic"}]}]};blocks["wrapper__inner_type_settings"]=function(params){var error=params.settings.error,yadisk=params.settings.yadisk,firstTime=error===cache.get("eCode").firstTime;
return[{elem:"inner",mods:{type:"settings"},content:[{elem:"inner-padding",content:blocks["settings"](params),
mods:{first:"yes"}},firstTime&&{block:"wrapper",elem:"line",elemMods:{type:"settings"}},firstTime&&yadisk&&{
elem:"inner-padding",mods:{last:"yes"},content:blocks["yadisk"](params)}]},{block:"wrapper-button",content:[{
block:"button",mods:{size:"s",theme:"pseudo",action:"delete-data"},content:BEM.I18N("i-sync-i18n__button","deleteData")
},{block:"button",mods:{size:"s",theme:"pseudo",action:"logout"},content:BEM.I18N("i-sync-i18n__button","turnSyncOff")
}]}]};blocks["signin"]=function(params,login,password){login=login||"";password=password||"";var settings=params.settings,error=settings&&settings.error,captcha=!!settings.captcha,loginMods={
size:"m",type:"login",reenable:"yes"};return{block:"signin",id:"1",js:true,tag:"form",content:[{block:"input",
mods:loginMods,value:params.settings&&params.settings.username||login,content:[{elem:"hint",content:BEM.I18N("i-sync-i18n__content","login")
},{elem:"control"}]},{block:"input",mods:{size:"m",type:"password",reenable:"yes"},value:password,content:[{
elem:"hint",content:BEM.I18N("i-sync-i18n__content","password")},{elem:"control"}]},captcha&&{block:"captcha",
tag:"img",attrs:{src:settings.captcha.captchaURL.replace(/^http(?!s)/,"https")}},captcha&&{block:"input",
mods:{size:"m",type:"captcha"},content:[{elem:"hint",content:BEM.I18N("i-sync-i18n__content","symbolsFromPic")
},{elem:"control"}]},{block:"button",mix:[{block:"signin",id:"1",elem:"submit"}],mods:{size:"m",theme:"action",
disabled:"yes",prevent:"yes"},content:BEM.I18N("i-sync-i18n__button","turnSyncOn")},{block:"link",url:"https://passport."+window.getDomain()+"/passport?mode=restore",
attrs:{target:"_blank"},content:BEM.I18N("i-sync-i18n__link","forgetPass")},"<br>",{block:"link",url:"https://passport."+window.getDomain()+"/registration",
attrs:{target:"_blank"},content:BEM.I18N("i-sync-i18n__link","createAccount")}]}};blocks["checkbox"]=function(params,name){
var mods=params.settings.settings[name]?{size:"s",checked:"yes"}:{size:"s"};return{block:"checkbox",mods:mods,
js:{name:name},content:[{elem:"label",content:BEM.I18N("i-sync-i18n__checkbox",name)}]}};blocks["description"]=function(params){
var settings=params.settings,error=settings&&settings.error,badToken=error===cache.get("eCode").badToken;
return{block:"description",content:[{elem:"title",content:BEM.I18N("i-sync-i18n__content","synchronization")
},{elem:"text",content:badToken&&BEM.I18N("i-sync-i18n__content","badToken")||BEM.I18N("i-sync-i18n__content","syncWasUsed",{
login:'<strong class="login">'+params.settings.username+"</strong>"})}]}};blocks.yadisk=function(params){
var licenseText=replaceURL(BEM.I18N("i-sync-i18n__content","yaDiskLicense"),"https://legal."+getDomain()+"/disk_termsofuse/",true,{
action:"license-link"},true),diskText=replaceURL(BEM.I18N("i-sync-i18n__content","yaDiskText"),"https://disk."+getDomain()+"/?source=copy-elements",true,{
action:"disk-direct-link"},true);return[{block:"settings",mods:{type:"yadisk"},js:false,content:[{elem:"title",
content:diskText},{elem:"title",content:licenseText},{block:"button",mods:{theme:"action",action:"install-yadisk",
size:"m"},content:BEM.I18N("i-sync-i18n__button","install-yadisk")},{block:"button",mods:{theme:"normal",
action:"save",size:"m"},content:BEM.I18N("i-sync-i18n__button","cancel")}]}]};blocks["wrapper"]=function(params){
return{block:"wrapper",mix:[{block:"i-clearfix"}],content:blocks["wrapper__inner"](params)}};blocks["popup"]=function(params,title,text,mods){
var defaultMods={adaptive:"yes",type:"alert"};mods&&$.extend(defaultMods,mods);return{block:"popup",mods:defaultMods,
js:{directions:["left-middle"]},content:[{elem:"tail"},{elem:"close"},{elem:"content",content:blocks["popup-inner"](params,title,text)
}]}};blocks["popup-inner"]=function(params,title,text){return{block:"popup-inner",content:[title&&{elem:"title",
content:title},text&&{elem:"text",content:text}]}};blocks["settings"]=function(params){var error=params.settings.error,yadisk=params.settings.yadisk,firstTime=error===cache.get("eCode").firstTime,login=params.settings.username+"@"+window.getDomain();
if(firstTime){return[{block:"settings",mods:{hide:"yes"},js:{yadisk:yadisk,firstTime:firstTime},content:[{
elem:"title",content:[BEM.I18N("i-sync-i18n__content","allreadyDone")," ",BEM.I18N("i-sync-i18n__content","syncUsesLogin",{
login:'<span class="login">'+login+"</span>"})]},yadisk&&{elem:"title",mods:{nomargin:"yes"},content:{
block:"link",content:BEM.I18N("i-sync-i18n__link","syncSettings"),js:true,mods:{action:"open-settings",
link:"no"},url:"#"}},{elem:"form-wrapper",elemMods:{hide:yadisk?"yes":""},content:[{elem:"clear",mix:[{
block:"i-clearfix"}],content:[blocks["settings-form"](params)]},{elem:"alert",elemMods:{hidden:"yes"},
content:BEM.I18N("i-sync-i18n__error","youTurnedOffSomeSettings")},{elem:"buttons",content:[{block:"button",
mods:{size:"m",theme:"normal",action:"save"},content:BEM.I18N("i-sync-i18n__button","continueWork")}]
}]}]}]}return{block:"settings",js:true,content:{elem:"form-wrapper",content:[{elem:"clear",mix:[{block:"i-clearfix"
}],content:[blocks["settings-form"](params)]},{elem:"alert",elemMods:{hidden:"yes"},content:BEM.I18N("i-sync-i18n__error","youTurnedOffSomeSettings")
},{elem:"buttons",content:[{block:"button",mods:{size:"m",theme:"action",action:"save"},content:BEM.I18N("i-sync-i18n__button","continueWork")
}]}]}}};blocks["settings-form"]=function(params){function reOrderServices(services){var priorities=["vb","bookmarks","history","forms","passwords"],reordered=[],service;
while(service=priorities.shift()){if(typeof services[service]==="boolean"){reordered.push([service,services[service]]);
}}return reordered}return{block:"settings-form",js:true,content:[{elem:"title",content:BEM.I18N("i-sync-i18n__content","synchronize")
},{elem:"column",content:function(services){var bemjson=[];services=reOrderServices(services);services.forEach(function(service){
bemjson.push(blocks["checkbox"](params,service[0]))});return bemjson}(params.settings.settings)}]}};(function(global_,bem_,undefined){
if(typeof bem_.I18N==="function"&&bem_.I18N._proto){return bem_.I18N}if(typeof i18n==="undefined"){i18n={};
}BEM=bem_;var MOD_DELIM="_",ELEM_DELIM="__",DEFAULT_LANG="ru",cache={},stack=[],debug=false,hasConsole=typeof console!=="undefined"&&typeof console.log==="function";
function log(){if(debug&&hasConsole){console.log.apply(console,arguments)}}function bemName(decl){typeof decl==="string"&&(decl={
block:decl});return decl.block+(decl.elem?ELEM_DELIM+decl.elem:"")+(decl.modName?MOD_DELIM+decl.modName+MOD_DELIM+decl.modVal:"");
}function bemParse(name){var bemitem={};name.split(ELEM_DELIM).forEach(function(item,i){var keys=[i?"elem":"block","mod","val"];
item.split(MOD_DELIM).forEach(function(part,j){bemitem[keys[j]]=part})});return bemitem}function _pushStack(name){
if(!name)return false;return stack.push(name)}function _popStack(){return stack.length&&stack.pop()}function _i18n(){
this._lang="";this._prj="lego";this._keyset="";this._key=""}_i18n.prototype={lang:function(name){this._lang=name;
return this},project:function(name){this._prj=name;return this},keyset:function(name,saveCtx){saveCtx&&_pushStack(this._keyset);
this._keyset=bemName(name);return this},key:function(name){this._key=name;return this},decl:function(v){
var bemitem=bemParse(this._keyset),prj=bemitem.block==="i-tanker"?"tanker":this._prj,keyset=bemitem.elem||this._keyset,key=this._key;
prj=i18n[prj]||(i18n[prj]={});keyset=prj[keyset]||(prj[keyset]={});keyset[key]=typeof v==="function"?v:function(p){
return v};var l=cache[this._lang]||(cache[this._lang]={}),k=l[this._keyset]||(l[this._keyset]={});k[key]=v;
},val:function(params,ctx){var value=cache[this._lang]&&cache[this._lang][this._keyset],debugString="keyset: "+this._keyset+" key: "+this._key+" (lang: "+this._lang+")";
if(!value){log("[I18N_NO_KEYSET] %s",debugString);return""}value=value[this._key];var valtype=typeof value;
if(valtype==="undefined"){log("[I18N_NO_VALUE] %s",debugString);return""}if(valtype==="string"){return value;
}ctx||(ctx=this);return value.call(ctx,params)},_cache:function(){return cache}};bem_.I18N=function(base){
var klass=function(keyset,key,params){return klass.keyset(keyset).key(key,params)};klass._proto=base;klass.project=function(name){
this._proto.project(name);return this};klass.keyset=function(name){this._proto.keyset(name,true);return this;
};klass.key=function(name,params){var proto=this._proto,result,ksetRestored;proto.lang(this._lang).key(name);
result=proto.val.call(proto,params,klass);ksetRestored=_popStack();ksetRestored&&proto.keyset(ksetRestored,false);
return result};klass.decl=function(bemitem,keysets,params){var proto=this._proto,k;params||(params={});
params.lang&&proto.lang(params.lang);proto.keyset(bemitem);for(k in keysets){if(keysets.hasOwnProperty(k)){
proto.key(k).decl(keysets[k])}}return this};klass.lang=function(lang){typeof lang!=="undefined"&&(this._lang=lang);
return this._lang};klass.debug=function(flag){debug=!!flag};klass.lang(DEFAULT_LANG);return klass}(new _i18n);
})(this,typeof BEM==="undefined"?{}:BEM);(function(global_,bem_,undefined){if(typeof bem_.I18N==="function"&&bem_.I18N._proto){
return bem_.I18N}if(typeof i18n==="undefined"){i18n={}}BEM=bem_;var MOD_DELIM="_",ELEM_DELIM="__",DEFAULT_LANG="ru",cache={},stack=[],debug=false,hasConsole=typeof console!=="undefined"&&typeof console.log==="function";
function log(){if(debug&&hasConsole){console.log.apply(console,arguments)}}function bemName(decl){typeof decl==="string"&&(decl={
block:decl});return decl.block+(decl.elem?ELEM_DELIM+decl.elem:"")+(decl.modName?MOD_DELIM+decl.modName+MOD_DELIM+decl.modVal:"");
}function bemParse(name){var bemitem={};name.split(ELEM_DELIM).forEach(function(item,i){var keys=[i?"elem":"block","mod","val"];
item.split(MOD_DELIM).forEach(function(part,j){bemitem[keys[j]]=part})});return bemitem}function _pushStack(name){
if(!name)return false;return stack.push(name)}function _popStack(){return stack.length&&stack.pop()}function _i18n(){
this._lang="";this._prj="lego";this._keyset="";this._key=""}_i18n.prototype={lang:function(name){this._lang=name;
return this},project:function(name){this._prj=name;return this},keyset:function(name,saveCtx){saveCtx&&_pushStack(this._keyset);
this._keyset=bemName(name);return this},key:function(name){this._key=name;return this},decl:function(v){
var bemitem=bemParse(this._keyset),prj=bemitem.block==="i-tanker"?"tanker":this._prj,keyset=bemitem.elem||this._keyset,key=this._key;
prj=i18n[prj]||(i18n[prj]={});keyset=prj[keyset]||(prj[keyset]={});keyset[key]=typeof v==="function"?v:function(p){
return v};var l=cache[this._lang]||(cache[this._lang]={}),k=l[this._keyset]||(l[this._keyset]={});k[key]=v;
},val:function(params,ctx){var value=cache[this._lang]&&cache[this._lang][this._keyset],debugString="keyset: "+this._keyset+" key: "+this._key+" (lang: "+this._lang+")";
if(!value){log("[I18N_NO_KEYSET] %s",debugString);return""}value=value[this._key];var valtype=typeof value;
if(valtype==="undefined"){log("[I18N_NO_VALUE] %s",debugString);return""}if(valtype==="string"){return value;
}ctx||(ctx=this);return value.call(ctx,params)},_cache:function(){return cache}};bem_.I18N=function(base){
var klass=function(keyset,key,params){return klass.keyset(keyset).key(key,params)};klass._proto=base;klass.project=function(name){
this._proto.project(name);return this};klass.keyset=function(name){this._proto.keyset(name,true);return this;
};klass.key=function(name,params){var proto=this._proto,result,ksetRestored;proto.lang(this._lang).key(name);
result=proto.val.call(proto,params,klass);ksetRestored=_popStack();ksetRestored&&proto.keyset(ksetRestored,false);
return result};klass.decl=function(bemitem,keysets,params){var proto=this._proto,k;params||(params={});
params.lang&&proto.lang(params.lang);proto.keyset(bemitem);for(k in keysets){if(keysets.hasOwnProperty(k)){
proto.key(k).decl(keysets[k])}}return this};klass.lang=function(lang){typeof lang!=="undefined"&&(this._lang=lang);
return this._lang};klass.debug=function(flag){debug=!!flag};klass.lang(DEFAULT_LANG);return klass}(new _i18n);
})(this,typeof BEM==="undefined"?{}:BEM);BEM.I18N.decl("i-sync-i18n__button",{cancel:"Зачыніць",continueWork:"Працягнуць працу",
deleteData:"Выдаліць дадзеныя","install-yadisk":"Усталяваць Яндекс.Дыск",saveSettings:"Захаваць наладкі",
turnSyncOff:"Выключыць сінхранізацыю",turnSyncOn:"Уключыць сінхранізацыю"},{lang:"be"});BEM.I18N.decl("i-sync-i18n__checkbox",{
aboutBookmarks:"Текст про обычные закладки",aboutForms:"Текст про сохранение форм",aboutHistory:"Текст про историю посещений",
aboutPasswords:"Текст про сохранение паролей",aboutSearchHistory:"Текст про поисковую историю",aboutVb:"Текст про визуальные закладки",
bookmarks:"Закладкі",forms:"Аўтаматычнае запаўненне палей уводу",history:"Гісторыя наведванняў",passwords:"Паролі",
searchHistory:"Гісторыі пошука",vb:"Візуальныя закладкі "},{lang:"be"});BEM.I18N.decl("i-sync-i18n__content",{
allreadyDone:"Сінхранізацыя ўключаная.",almostDone:'Калі спатрэбіцца, Вы можаце змяніць набор дадзеных, якія сінхранізуюцца. Пасля ўнясення зменаў націсніце кнопку "Захаваць наладкі" для працягу працы.',
alreadyTurnedOn:"У вас ужо ўключана сінхранізацыя. Лагін сінхранізацыі:",badToken:"Памылка атрымання доступу да сервера сінхранізацыі (магчыма, Вы змянілі пароль). Вам неабходна аўтарызавацца для працягу сінхранізацыі, для гэтага ўвядзіце свой пароль яшчэ раз.",
canChangeInSettings:"Параметры сінхранізацыі можна змяніць у наладках.",login:"Лагін",password:"Пароль",
restoreBrowserSettings:"Лёгкае аднаўленне асабістых дадзеных",saveHomeAndWork:"Выкарыстоўвайце звыклыя наладкі браўзера на розных камп'ютарах. Вашы закладкі, паролі, гісторыя пошуку будуць заўсёды пад рукой.",
settingsAndPasswordsSafeNow:"Вашы паролі, закладкі ды іншыя наладкі больш не згубяцца. Вы зможаце аднавіць іх у кожны момант з вашага ўліковага запісу на Яндексе.",
showAnotherImage:"Паказаць іншую выяву",symbolsFromImage:"Знакі з выявы",syncIsFast:"Яны будуць даступныя вам на кожным кампьютары, дзе ўсталяваныя Элементы Яндекса або Яндекс.Браўзер.",
syncUsesLogin:function(params){return"Для сінхранізацыі выкарыстоўваецца ўліковы запіс Яндекса: "+params["login"];
},syncWasUsed:function(params){return"Раней вы выкарыстоўвалі сінхранізацыю для лагіна "+params["login"];
},synchronization:"Сінхранізацыя",synchronize:"Сінхранізаваць",turnOnSync:"Уключыце сінхранізацыю і захоўвайце вашы закладкі, паролі, гісторыю ды іншыя дадзеныя з браўзера на Яндексе.",
turnOnToRestore:"Уключыце сінхранізацыю для аднаўлення вашых дадзеных.",twoComputers:"Аднолькавы браўзер на працы і дома",
yaDiskLicense:"Пампуючы праграму, вы прымаеце ўмовы %%ліцэнзійнага пагаднення%%.",yaDiskText:"Вы таксама можаце ўсталяваць %%Яндекс.Дыск%%. Гэта бясплатны сервіс для захоўвання вашых файлаў і працы з імі на кожнай прыладзе, падключанай да інтэрнэта."
},{lang:"be"});BEM.I18N.decl("i-sync-i18n__error",{"anotherLogin-fx":function(params){return"Нехта з уліковым запісам "+params["login1"]+" ужо сінхранізаваў дадзеныя ў гэтым профілі браўзера. Калі гэта былі вы, рэкамендуем скарыстацца ім жа. Калі не - выкарыстоўвайце для ўліковага запісу "+params["login2"]+" іншы профіль браўзера, інакш вашы і чужыя наладкі змяшаюцца.";
},"anotherLogin-ie":function(params){return"Нехта з уліковым запісам "+params["login1"]+" ужо сінхранізаваў дадзеныя ў гэтым профілі браўзера. Калі гэта былі вы, рэкамендуем скарыстацца ім жа. Калі не - выкарыстоўвайце для ўліковага запісу "+params["login2"]+" асобны профіль браўзера ў Windows, інакш вашы і чужыя наладкі змяшаюцца.";
},authError:"Памылка аўтарызацыі",badLoginPass:"Няправільная пара лагін-пароль! Аўтарызавацца не атрымалася.",
badToken:"Памылка атрымання доступу да сервера сінхранізацыі (магчыма, Вы змянілі пароль). Вам неабходна аўтарызавацца для працягу сінхранізацыі, для гэтага ўвядзіце свой пароль яшчэ раз.",
captchaPopupText:"Вы шмат разоў уводзілі памылковы пароль. Увядзіце знакі з выявы і паўтарыце спробу.",
captchaPopupTitle:"Увядзіце знакі з выявы",checkKeyboard:"Праверце раскладку клавіятуры, ці не ×націснутая× клавіша «Caps×Lock», і×паспрабуйце ўвесці лагін і×пароль яшчэ×раз.",
credentialErrorText:"Аўтарызавацца не атрымалася. Праверце раскладку клавіятуры, ці не націснутая клавіша «Caps Lock», і паспрабуйце ўвесці лагін і пароль яшчэ раз.",
credentialErrorTitle:"Няправільны лагін або пароль",networkErrorText:"Аўтарызавацца не атрымалася. Праверце сувязь з інтэрнэтам і паспрабуйце ўвесці лагін і пароль яшчэ раз",
networkErrorTitle:"Адсутнічае сувязь з інтэрнэтам",sureDeleteData:function(params){return"Вы сапраўды хочаце выдаліць з сервера сінхранізацыі ўсе дадзеныя ўліковага запісу "+params["login"]+"? Аднаўленне гэтых дадзеных будзе немагчымае.";
},sureToLeaveContinueButton:"Вы спапраўды хочаце зачыніць старонку? Унесеныя змены не захоўваюцца.",sureToLeaveSaveButton:'Для прымянення наладак сінхранізацыі і працягу працы націсніце кнопку "Захаваць наладкі" на старонцы наладак.',
sureTurnSyncOff:function(params){return"Вы ўпэўненыя, што хочаце адключыць сінхранізацыю?"+params["newline"]+"Змены ў гэтым браўзеры не будуць адлюстроўвацца на іншых камп'ютарах. ";
},uknownErrorText:"Здаецца, нешта пайшло не так. Паспрабуйце аўтарызавацца пазней.",uknownErrorTitle:"Невядомая памылка",
youTurnedOffSomeSettings:"Вы адключылі сінхранізацыю часткі дадзеных. Гэтыя дадзеныя не будуць даступныя для аднаўлення з вашага ўліковага запісу на Яндексе."
},{lang:"be"});BEM.I18N.decl("i-sync-i18n__head-logo",{text:"Элементы Яндекса",yandex:"Яндекс"},{lang:"be"
});BEM.I18N.decl("i-sync-i18n__link",{createAccount:"Завесці ўліковы запіс",forgetPass:"Забылі пароль?",
syncSettings:"Наладкі сінхранізацыі"},{lang:"be"});BEM.I18N.lang("be");BEM.I18N.decl("i-sync-i18n__button",{
cancel:"Close",continueWork:"Continue work",deleteData:"Delete data","install-yadisk":"Install Yandex.Disk",
saveSettings:"Save settings",turnSyncOff:"Disable synchronization",turnSyncOn:"Enable synchronization"
},{lang:"en"});BEM.I18N.decl("i-sync-i18n__checkbox",{aboutBookmarks:"Text about regular bookmarks",aboutForms:"Text about saving forms",
aboutHistory:"Text about browsing history",aboutPasswords:"Text about saving passwords",aboutSearchHistory:"Text for search history",
aboutVb:"Text about Visual Bookmarks",bookmarks:"Bookmarks ",forms:"Auto-fill forms",history:"Browsing history",
passwords:"Passwords",searchHistory:"Search history",vb:"Visual Bookmarks"},{lang:"en"});BEM.I18N.decl("i-sync-i18n__content",{
allreadyDone:"Syncing enabled",almostDone:'If you need to, you can change the set of synchronized data. After making the changes, press the "Save settings" button to continue working.',
alreadyTurnedOn:"Synchronization is already enabled. Synchronization user name:",badToken:"Synchronization is unable to access the server (maybe you changed your password). You must log in to continue synchronization. To do so, enter your password again.",
canChangeInSettings:"You can change synchronization parameters in settings.",login:"User name",password:"Password",
restoreBrowserSettings:"Easily restore personal data",saveHomeAndWork:"Use your browser settings on different computers. Your bookmarks, passwords, and search history will always be at hand.",
settingsAndPasswordsSafeNow:"Now you will no longer lose your passwords, bookmarks, and other settings. You can restore them at any moment from your Yandex profile.",
showAnotherImage:"Show a different image",symbolsFromImage:"Enter the characters from the image",syncIsFast:"You can receive access to them from any device on which Yandex Elements or Yandex.Browser is installed.",
syncUsesLogin:function(params){return"The following Yandex account is used for syncing: "+params["login"];
},syncWasUsed:function(params){return"You have used synchronization for your user name "+params["login"]+" before";
},synchronization:"Synchronization",synchronize:"Sync",turnOnSync:"Enable synchronization and save your bookmarks, passwords, history, and other data from your browser on Yandex.",
turnOnToRestore:"Enable synchronization to restore your data.",twoComputers:"One browser for work and home",
yaDiskLicense:"By downloading the program, you agree to the terms of the %%license agreement%%.",yaDiskText:"You can also install %%Yandex.Disk%%. It is a free service for storing your files and working with them on any device connected to the internet."
},{lang:"en"});BEM.I18N.decl("i-sync-i18n__error",{"anotherLogin-fx":function(params){return"Synchronization of data in this browser profile was already enabled from the  "+params["login1"]+" account. If you enabled it, we recommend that you use it. If it was not you, we recommend that you use a different browser profile for the  "+params["login2"]+" account, otherwise your settings will merge with someone else's.";
},"anotherLogin-ie":function(params){return"Synchronization of data in this browser profile was already enabled from the  "+params["login1"]+" account. If you enabled it, we recommend that you use it. If it was not you, we recommend that you use a different Windows profile for the  "+params["login2"]+" account, otherwise your settings will merge with someone else's.";
},authError:"Login error",badLoginPass:"Incorrect user name-password combination! Not able to log in.",
badToken:"Synchronization is unable to access the server (perhaps you changed your password). You must log in to continue synchronization. To do so, enter your password again.",
captchaPopupText:"You entered the wrong password too many times. Enter the characters from the captcha display and try again.",
captchaPopupTitle:"Enter the characters from the captcha display",checkKeyboard:'Check your keyboard layout to see if the "Caps×Lock" key is×pressed×and×enter your user name and password again.',
credentialErrorText:'Login failed. Check your keyboard layout to see if the "Caps Lock" key is pressed and enter your user name and password again.',
credentialErrorTitle:"Incorrect user name or password",networkErrorText:"Login failed. Check your internet connection and enter your user name and password again.",
networkErrorTitle:"There is no connection to the internet",sureDeleteData:function(params){return"Do you really want to delete all data for the account "+params["login"]+" from the synchronization server? You will not be able to restore this data.";
},sureToLeaveContinueButton:"Do you really want to leave this page? All changes will be lost.",sureToLeaveSaveButton:'To apply synchronization settings and continue work, press the "Save settings" button on the settings page.',
sureTurnSyncOff:function(params){return"Are you sure you want to disable synchronization?"+params["newline"]+"Changes in this browser will not be reflected on other computers.";
},uknownErrorText:"Something went wrong.Try logging in later.",uknownErrorTitle:"Unknown error",youTurnedOffSomeSettings:"You disabled synchronization for part of your data. This data will not be able to be restored from your Yandex account."
},{lang:"en"});BEM.I18N.decl("i-sync-i18n__head-logo",{text:"Yandex Elements",yandex:"Яндекс"},{lang:"en"
});BEM.I18N.decl("i-sync-i18n__link",{createAccount:"Get an account",forgetPass:"Forgot your password?",
syncSettings:"Sync settings"},{lang:"en"});BEM.I18N.lang("en");BEM.I18N.decl("i-sync-i18n__button",{cancel:"Жабу",
continueWork:"Жұмысты жалғастыру",deleteData:"Деректерді жою","install-yadisk":"Яндекс.Дискті орнату",
saveSettings:"Баптауларды сақтау",turnSyncOff:"Синхрондауды өшіру",turnSyncOn:"Синхрондауды қосу"},{lang:"kk"
});BEM.I18N.decl("i-sync-i18n__checkbox",{aboutBookmarks:"Қалыпты бетбелгілер туралы мәтін",aboutForms:"Пішімдерді сақтау туралы мәтін",
aboutHistory:"Кіру журналы туралы мәтін",aboutPasswords:"Құпиясөздерді сақтау туралы мәтін",aboutSearchHistory:"Іздеулер журналы туралы мәтін",
aboutVb:"Визуалды бетбелгілер туралы мәтін",bookmarks:"Бетбелгілер",forms:"Енгізу жолағын автотолтыру",
history:"Кіру журналы",passwords:"Құпиясөздер",searchHistory:"Іздеулер журналы",vb:"Визуалды бетбелгілер"
},{lang:"kk"});BEM.I18N.decl("i-sync-i18n__content",{allreadyDone:"Синхрондау қосулы.",almostDone:'Қажет болғанда синхрондалатын деректердің жиынын өзгертуге болады. Өзгертулерді енгізген соң, жұмысты жалғастыру үшін "Баптауларды сақтау" түймесін басыңыз.',
alreadyTurnedOn:"Синхрондау бұрыннан қосылған. Синхрондау логині:",badToken:"Синхрондау серверіне қатынасу мүмкін емес (мүмкін, құпиясөзді өзгерткен шығарсыз). Синхрондауды жалғастыру үшін, авторизациялануыңыз қажет, ол үшін құпиясөзді қайта енгізіңіз.",
canChangeInSettings:"Синхрондау параметрлерін баптауларда өзгертуге болады.",login:"Логин",password:"Құпиясөз",
restoreBrowserSettings:"Жеке деректерді оңай қалпына келтіру",saveHomeAndWork:"Әртүрлі компьютерлерде браузердің үйреншікті баптауларын пайдаланыңыз. Бетбелгілер, құпиясөздер, іздеу журналы әрдайым жаныңыздан табылады.",
settingsAndPasswordsSafeNow:"Құпиясөздер, бетбелгілер мен басқа да баптаулар енді жоғалмайды. Оларды кез келген уақытта Яндекс есептік жазбасынан қалпына келтіруге болады.",
showAnotherImage:"Басқа суретті көрсету",symbolsFromImage:"Суреті бар символдар",syncIsFast:"Олар Яндекс элементтері немесе Яндекс.Браузер орнатылған кез келген компьютерде қол жетімді болады.",
syncUsesLogin:function(params){return"Синхрондауға Яндекстің мына есептік жазбасы қолданылады: "+params["login"];
},syncWasUsed:function(params){return"Бұрында синхрондау "+params["login"]+" логині үшін пайдаланылған";
},synchronization:"Синхрондау",synchronize:"Синхрондау",turnOnSync:"Синхрондауды қосып, браузерден Яндекске бетбелгілерді, құпиясөздерді, журналдар мен басқа деректерді сақтаңыз.",
turnOnToRestore:"Деректерді қалпына келтіру үшін синхрондауды қосыңыз.",twoComputers:"Жұмыста және үйде де бірдей браузер",
yaDiskLicense:"Бағдарламаны жүктей отырып сіз %%лицензиялық келісімнің%% шарттарын қабылдайсыз.",yaDiskText:"Сонымен бірге %%Яндекс.Дискті%% жүктей аласыз. Бұл файлдарыңызды сақтау мен олармен интернетке қосылған кез келген құрылғыда жұмыс істеуге арналған тегін сервис."
},{lang:"kk"});BEM.I18N.decl("i-sync-i18n__error",{"anotherLogin-fx":function(params){return params["login1"]+" атаулы есептік жазбасы бар пайдаланушы браузердің осы профиліндегі деректерді синхрондап қойған. Егер ол сіз болсаңыз, сол есептік жазбаны пайдалануды ұсынамыз. Егер олай болмаса - "+params["login2"]+" есептік жазбасы үшін басқа браузер профилін пайдаланыңыз, әйтпесе сіздің және бөгде баптаулар араласып кетеді.";
},"anotherLogin-ie":function(params){return params["login1"]+" атаулы есептік жазбасы бар пайдаланушы браузердің осы профиліндегі деректерді синхрондап қойған. Егер ол сіз болсаңыз, сол есептік жазбаны пайдалануды ұсынамыз. Егер олай болмаса - "+params["login2"]+" есептік жазбасы үшін Windows-тағы бөлек профильді пайдаланыңыз, әйтпесе сіздің және бөгде баптаулар араласып кетеді.";
},authError:"Авторизациялау қатесі",badLoginPass:"Логин-құпиясөз жұбы дұрыс емес! Авторизациялау сәтсіз болды.",
badToken:"Синхрондау серверіне қатынасу мүмкін емес (мүмкін, құпиясөзді өзгерткен шығарсыз). Синхрондауды жалғастыру үшін, авторизациялануыңыз қажет, ол үшін құпиясөзді қайта енгізіңіз.",
captchaPopupText:"Қате құпиясөзді бірнеше рет енгіздіңіз. Суреттегі символдарды енгізіп, әрекетті қайталаңыз.",
captchaPopupTitle:"Суреттегі символдарды енгізіңіз",checkKeyboard:"Пернетақта жаймасын, «Caps×Lock» пернесінің×басылып тұрмағанын×тексеріп,×логин мен құпиясөзді×қайта×енгізіңіз.",
credentialErrorText:"Авторизациялау сәтсіз болды. Пернетақта жаймасын, «Caps×Lock» пернесінің басылып тұрмағанын тексеріп, логин мен құпиясөзді қайта енгізіңіз.",
credentialErrorTitle:"Логин немесе құпиясөз қате",networkErrorText:"Авторизациялау сәтсіз болды. Интернет қосылымын тексеріп, логин мен құпиясөзді қайта енгізіңіз",
networkErrorTitle:"Интернетке қосылмаған",sureDeleteData:function(params){return"Синхрондау серверінен "+params["login"]+" есептік жазбасының барлық деректерін жою керек пе? Осы деректерді қайта қалпына келтіру мүмкін емес болады.";
},sureToLeaveContinueButton:"Веб-бетті жабу керек пе? Енгізілген өзгертулер сақталмайды.",sureToLeaveSaveButton:'Синхрондау баптауларын қолдану және жұмысты жалғастыру үшін, баптаулар веб-бетіндегі "Баптауларды сақтау" түймесін басыңыз.',
sureTurnSyncOff:function(params){return"Синхрондауды өшіру керектігіне сенімдісіз бе?"+params["newline"]+"Осы браузердегі өзгертулер басқа компьютерлерде көрсетілмейді.";
},uknownErrorText:"Ақау пайда болған сияқты. Авторизациялауды кейінірек қайталап көріңіз.",uknownErrorTitle:"Белгісіз қате",
youTurnedOffSomeSettings:"Деректердің бөлігін синхрондау өшірілді. Осы деректерді Яндекс есептік жазбасынан қалпына келтіру мүмкін емес болады."
},{lang:"kk"});BEM.I18N.decl("i-sync-i18n__head-logo",{text:"Яндекс Элементтері",yandex:"Яндекс"},{lang:"kk"
});BEM.I18N.decl("i-sync-i18n__link",{createAccount:"Есептік жазба жасау",forgetPass:"Құпиясөзді ұмытып қалдыңыз ба?",
syncSettings:"Сихнрондау баптаулары"},{lang:"kk"});BEM.I18N.lang("kk");BEM.I18N.decl("i-sync-i18n__button",{
cancel:"Закрыть",continueWork:"Продолжить работу",deleteData:"Удалить данные","install-yadisk":"Установить Яндекс.Диск",
saveSettings:"Сохранить настройки",turnSyncOff:"Выключить синхронизацию",turnSyncOn:"Включить синхронизацию"
},{lang:"ru"});BEM.I18N.decl("i-sync-i18n__checkbox",{aboutBookmarks:"Текст про обычные закладки",aboutForms:"Текст про сохранение форм",
aboutHistory:"Текст про историю посещений",aboutPasswords:"Текст про сохранение паролей",aboutSearchHistory:"Текст про поисковую историю",
aboutVb:"Текст про визуальные закладки",bookmarks:"Закладки",forms:"Автозаполнение полей ввода",history:"История посещений",
passwords:"Пароли",searchHistory:"Истории поиска",vb:"Визуальные закладки"},{lang:"ru"});BEM.I18N.decl("i-sync-i18n__content",{
allreadyDone:"Синхронизация включена.",almostDone:'При необходимости Вы можете изменить набор синхронизируемых данных. После внесения изменений нажмите кнопку "Сохранить настройки" для продолжения работы.',
alreadyTurnedOn:"У вас уже включена синхронизация. Логин синхронизации:",badToken:"Не удается получить доступ к серверу синхронизации (возможно, Вы сменили пароль). Вам необходимо авторизоваться для продолжения синхронизации, для этого введите свой пароль еще раз.",
canChangeInSettings:"Параметры синхронизации можно изменить в настройках.",login:"Логин",password:"Пароль",
restoreBrowserSettings:"Легкое восстановление личных данных",saveHomeAndWork:"Используйте привычные настройки браузера на разных компьютерах. Ваши закладки, пароли, история поиска будут всегда под рукой.",
settingsAndPasswordsSafeNow:"Ваши пароли, закладки и другие настройки больше не пропадут. Вы сможете восстановить их в любой момент из вашей учётной записи на Яндексе.",
showAnotherImage:"Показать другую картинку",symbolsFromImage:"Символы с изображения",syncIsFast:"Они будут доступны вам на любом компьютере, где установлены Элементы Яндекса или Яндекс.Браузер.",
syncUsesLogin:function(params){return"Для синхронизации используется учетная запись Яндекса: "+params["login"];
},syncWasUsed:function(params){return"Ранее вы использовали синхронизацию для логина "+params["login"];
},synchronization:"Синхронизация",synchronize:"Синхронизировать",turnOnSync:"Включите синхронизацию и сохраняйте ваши закладки, пароли, историю и другие данные из браузера на Яндексе.",
turnOnToRestore:"Включите синхронизацию для восстановления ваших данных.",twoComputers:"Одинаковый браузер на работе и дома",
yaDiskLicense:"Загружая программу, вы принимаете условия %%лицензионного соглашения%%.",yaDiskText:"Вы также можете установить %%Яндекс.Диск%%. Это бесплатный сервис для хранения ваших файлов и работы с ними на любом устройстве, подключенному к интернету."
},{lang:"ru"});BEM.I18N.decl("i-sync-i18n__error",{"anotherLogin-fx":function(params){return"Кто-то с учётной записью "+params["login1"]+" уже синхронизировал данные в этом профиле браузера. Если это были вы, рекомендуем воспользоваться ею же. Если нет - используйте для учётной записи "+params["login2"]+" другой профиль браузера, иначе ваши и чужие настройки смешаются.";
},"anotherLogin-ie":function(params){return"Кто-то с учётной записью "+params["login1"]+" уже синхронизировал данные в этом профиле браузера. Если это были вы, рекомендуем воспользоваться ею же. Если нет - используйте для учётной записи "+params["login2"]+" отдельный профиль в Windows, иначе ваши и чужие настройки смешаются.";
},authError:"Ошибка авторизации",badLoginPass:"Неправильная пара логин-пароль! Авторизоваться не удалось.",
badToken:"Не удается получить доступ к серверу синхронизации (возможно, Вы сменили пароль). Вам необходимо авторизоваться для продолжения синхронизации, для этого введите свой пароль еще раз.",
captchaPopupText:"Вы несколько раз ввели неправильный пароль. Введите символы с изображения и повторите попытку.",
captchaPopupTitle:"Введите символы с изображения",checkKeyboard:"Проверьте раскладку клавиатуры, не×нажата×ли клавиша «Caps×Lock» и×попробуйте ввести логин и×пароль еще×раз.",
credentialErrorText:"Авторизоваться не удалось. Проверьте раскладку клавиатуры, не нажата ли клавиша «Caps Lock» и попробуйте ввести логин и пароль ещё раз.",
credentialErrorTitle:"Неправильный логин или пароль",networkErrorText:"Авторизоваться не удалось. Проверьте связь с интернетом и попробуйте ввести логин и пароль ещё раз",
networkErrorTitle:"Отсутвует связь с интернетом",sureDeleteData:function(params){return"Вы действительно хотите удалить с сервера синхронизации все данные учётной записи "+params["login"]+"? Восстановление этих данных будет невозможно.";
},sureToLeaveContinueButton:"Вы действительно хотите закрыть страницу? Внесённые изменения не сохранятся.",
sureToLeaveSaveButton:'Для применения настроек синхронизации и продолжения работы нажмите кнопку "Сохранить настройки" на странице настроек.',
sureTurnSyncOff:function(params){return"Вы уверены, что хотите отключить синхронизацию?"+params["newline"]+"Изменения в этом браузере не будут отражаться на других компьютерах.";
},uknownErrorText:"Похоже, что-то пошло не так. Попробуйте авторизоваться позднее.",uknownErrorTitle:"Неизвестная ошибка",
youTurnedOffSomeSettings:"Вы отключили синхронизацию части данных. Эти данные не будут доступны для восстановления из вашей учётной записи на Яндексе."
},{lang:"ru"});BEM.I18N.decl("i-sync-i18n__head-logo",{text:"Элементы Яндекса",yandex:"Яндекс"},{lang:"ru"
});BEM.I18N.decl("i-sync-i18n__link",{createAccount:"Завести учетную запись",forgetPass:"Забыли пароль?",
syncSettings:"Настройки синхронизации"},{lang:"ru"});BEM.I18N.lang("ru");BEM.I18N.decl("i-sync-i18n__button",{
cancel:"Kapat",continueWork:"Devam",deleteData:"Veri sil","install-yadisk":"Yandex.Disk'i kur",saveSettings:"Ayarları kaydet",
turnSyncOff:"Eşitlemeyi durdur",turnSyncOn:"Eşitlemeyi aç"},{lang:"tr"});BEM.I18N.decl("i-sync-i18n__checkbox",{
aboutBookmarks:"Favoriler ile ilgili metin",aboutForms:"Formların kaydedilmesi ile ilgili metin",aboutHistory:"Ziyaret geçmişi ile ilgili metin",
aboutPasswords:"Şifre kaydedilmesiyle ilgili metin",aboutSearchHistory:"Arama geçmişi ile ilgili metin",
aboutVb:"Görsel Favoriler ile ilgili metin",bookmarks:"Favoriler",forms:"Formların otomatik doldurulması",
history:"Ziyaret geçmişi",passwords:"Şifreler",searchHistory:"Arama geçmişi",vb:"Görsel Favoriler"},{
lang:"tr"});BEM.I18N.decl("i-sync-i18n__content",{allreadyDone:"Eşitleme açık.",almostDone:'Gerekirse eşitlenen verileri değiştirebilirsiniz. Değişiklik yapıldıktan sonra çalışmaya devam etmek için "Ayarları kaydet" butonuna tıklayın.',
alreadyTurnedOn:"Eşitleme açık durumunda. Eşitleme girişi:",badToken:"Eşitleme sunucusuna erişim sağlanamıyor (şifreyi değiştirmiş olabilirsiniz). Eşitlemeye devam etmek için giriş yapmanız gerekiyor, bunu yapmak için yeniden şifre girin.",
canChangeInSettings:"Eşitleme parametrelerini ayarlardan değiştirebilirsiniz.",login:"Kullanıcı adı ",
password:"Şifre",restoreBrowserSettings:"Kişisel bilgilerin kolay geri getirilmesi",saveHomeAndWork:"Alıştığınız tarayıcı ayarlarını farklı bilgisayarlarda kullanın. Favorileriniz, şifreleriniz ve arama geçmişiniz her zaman elinizin altında.",
settingsAndPasswordsSafeNow:"Favorileriniz, şifreleriniz ve diğer ayarlarınız artık kaybolmaz. İstediğiniz anda Yandex'teki kayıtlardan onları geri getirebilirsiniz.",
showAnotherImage:"Görseli yenile",symbolsFromImage:"Görseldeki karakterler",syncIsFast:"Yandex.Browser ya da Yandex Elements kurulu olan her bilgisayarda onlara ulaşabilirsiniz.",
syncUsesLogin:function(params){return"Eşitleme için Yandex'teki hesabınız kullanılır: "+params["login"];
},syncWasUsed:function(params){return"Daha önce "+params["login"]+" kullanıcı adı için eşitleme kullandınız";
},synchronization:"Eşitleme",synchronize:"Eşitle",turnOnSync:"Eşitlemeyi açın ve favorilerinizi, şifrelerinizi ve tarayıcıdaki diğer ayarları Yandex'e kaydedin.",
turnOnToRestore:"Verilerinizi geri getirmek için eşitlemeyi açın. ",twoComputers:"Evde ve işte aynı tarayıcı",
yaDiskLicense:"Programı yükleyerek %%Lisans Sözleşmesi'nin%% koşullarını kabul etmiş sayılırsınız.",yaDiskText:"Ayrıca %%Yandex.Disk%%'i kurabilirsiniz. Yandex.Disk, dosya saklamak için ücretsiz bir servistir. Bu servis sayesinde dosyalarınızı saklayabilir ve internet bağlantısı olan herhangi bir cihazdan onlara erişebilirsiniz."
},{lang:"tr"});BEM.I18N.decl("i-sync-i18n__error",{"anotherLogin-fx":function(params){return params["login1"]+" hesabına sahip olan biri, verileri bu tarayıcı profilinde daha önce eşitledi. Bu işlemi yapan siz iseniz, aynı hesabı kullanmanızı öneririz. Siz değilseniz, "+params["login2"]+" hesabı için tarayıcının diğer profilini kullanın. Aksi takdirde başkasına ait ayarlar ile sizin ayarlarınız birbirine karışır.";
},"anotherLogin-ie":function(params){return params["login1"]+" hesabına sahip olan biri, verileri bu tarayıcı profilinde daha önce eşitledi. Bu işlemi yapan siz iseniz, aynı hesabı kullanmanızı öneririz. Siz değilseniz, "+params["login2"]+" hesabı için Windows'ta başka profil kullanın. Aksi takdirde başkasına ait ayarlar ile sizin ayarlarınız birbirine karışır.";
},authError:"Hatalı giriş",badLoginPass:"Kullanıcı adı ya da şifre yanlış! Giriş yapılamadı.",badToken:"Eşitleme sunucusuna erişilemiyor (şifrenizi değiştirmiş olabilirsiniz). Eşitlemeye devam etmek için giriş yapmanız gerekiyor, bunu yapmak için şifrenizi yeniden girin.",
captchaPopupText:"Birkaç kere üst üste yanlış şifre girdiniz. Görseldeki karakterleri girin ve yeniden deneyin.",
captchaPopupTitle:"Görseldeki karakterleri girin",checkKeyboard:'Klavye ayarlarını kontrol edin, "Caps×Lock" tuşu basılı×kalmış×olabilir, ardından kullanıcı adı×ve şifreyi yeniden girmeyi deneyin.',
credentialErrorText:'Giriş yapılamadı. Klavye ayarlarını kontrol edin, "Caps Lock" tuşu basılı kalmış olabilir, ardından kullanıcı adı ve şifreyi yeniden girmeyi deneyin.',
credentialErrorTitle:"Kullanıcı adı ya da şifre hatalı",networkErrorText:"Giriş yapılamadı. İnternet bağlantınızı kontrol edip kullanıcı adınızı ve şifrenizi yeniden girmeyi deneyin.",
networkErrorTitle:"İnternet bağlantısı yok",sureDeleteData:function(params){return params["login"]+" hesabının tüm bilgilerini eşitleme sunucusundan silmek istediğinize emin misiniz? Veriler geri getirilemez.";
},sureToLeaveContinueButton:"Sayfayı kapatmak istediğinize emin misiniz? Yapılan değişiklikler kaydedilmez.",
sureToLeaveSaveButton:'Eşitleme ayarlarını uygulamak ve çalışmaya devam etmek için ayarlar sayfasında "Ayarları kaydet" butonuna tıklayın.',
sureTurnSyncOff:function(params){return"Eşitlemeyi durdurmak istediğinize emin misiniz?"+params["newline"]+"Bu tarayıcıdaki değişimler diğer bilgisayarlarda gösterilmez.";
},uknownErrorText:"Hata oluştu. Daha sonra yeniden giriş yapmayı deneyin.",uknownErrorTitle:"Bilinmeyen hata",
youTurnedOffSomeSettings:"Bazı verilerin eşitlemesini kapattınız. Bu veriler, Yandex'teki kayıtlardan geri getirilemez."
},{lang:"tr"});BEM.I18N.decl("i-sync-i18n__head-logo",{text:"Yandex Elements",yandex:"Яндекс"},{lang:"tr"
});BEM.I18N.decl("i-sync-i18n__link",{createAccount:"Hesap aç",forgetPass:"Şifrenizi mi unuttunuz? ",
syncSettings:"Eşitleme ayarları"},{lang:"tr"});BEM.I18N.lang("tr");BEM.I18N.decl("i-sync-i18n__button",{
cancel:"Закрити",continueWork:"Продовжити роботу",deleteData:"Видалити дані","install-yadisk":"Встановити Яндекс.Диск",
saveSettings:"Зберегти налаштування",turnSyncOff:"Вимкнути синхронізацію",turnSyncOn:"Увімкнути синхронізацію"
},{lang:"uk"});BEM.I18N.decl("i-sync-i18n__checkbox",{aboutBookmarks:"Текст про звичайні закладки",aboutForms:"Текст про збереження форм",
aboutHistory:"Текст про історію відвідувань",aboutPasswords:"Текст про збереження паролів",aboutSearchHistory:"Текст про пошукову історію",
aboutVb:"Текст про візуальні закладки",bookmarks:"Закладки",forms:"Автозаповнення полів введення",history:"Історія відвідувань",
passwords:"Паролі",searchHistory:"Історії пошуку",vb:"Візуальні закладки"},{lang:"uk"});BEM.I18N.decl("i-sync-i18n__content",{
allreadyDone:"Синхронізацію увімкнено.",almostDone:'У разі потреби Ви можете змінити набір даних, що синхронізуються. Після внесення змін натисніть кнопку "Зберегти налаштування" для продовження роботи.',
alreadyTurnedOn:"У вас уже ввімкнено синхронізацію. Логін синхронізації:",badToken:"Не вдається отримати доступ до сервера синхронізації (можливо, Ви змінили пароль). Вам потрібно авторизуватися для продовження синхронізації, для цього введіть свій пароль ще раз.",
canChangeInSettings:"Параметри синхронізації можна змінити в налаштуваннях.",login:"Логін",password:"Пароль",
restoreBrowserSettings:"Легке відновлення особистих даних",saveHomeAndWork:"Використовуйте звичні налаштування браузера на різних комп'ютерах. Ваші закладки, паролі, історія пошуку будуть завжди під рукою.",
settingsAndPasswordsSafeNow:"Ваші паролі, закладки й інші налаштування вже не пропадуть. Ви зможете відновити їх у будь-який момент із вашого облікового запису на Яндексі.",
showAnotherImage:"Показати інше зображення",symbolsFromImage:"Символи із зображення",syncIsFast:"Вони будуть доступні вам на будь-якому комп'ютері, де встановлено Елементи Яндекса або Яндекс.Браузер.",
syncUsesLogin:function(params){return"Для синхронізації використовується обліковий запис Яндекса: "+params["login"];
},syncWasUsed:function(params){return"Раніше ви використовували синхронізацію для логіна "+params["login"];
},synchronization:"Синхронізація",synchronize:"Синхронізувати",turnOnSync:"Увімкніть синхронізацію та зберігайте ваші закладки, паролі, історію й інші дані з браузера на Яндексі.",
turnOnToRestore:"Увімкніть синхронізацію для відновлення ваших даних.",twoComputers:"Однаковий браузер на роботі та вдома",
yaDiskLicense:"Завантажуючи програму, ви приймаєте умови %%ліцензійної угоди%%.",yaDiskText:"Ви також можете встановити %%Яндекс.Диск%%. Це безкоштовний сервіс для зберігання ваших файлів і роботи з ними на будь-якому пристрої, підключеному до інтернету."
},{lang:"uk"});BEM.I18N.decl("i-sync-i18n__error",{"anotherLogin-fx":function(params){return"Хтось із обліковим записом "+params["login1"]+" уже синхронізував дані у цьому профілі браузера. Якщо це були ви, рекомендуємо скористатися ним же. Якщо ні, використовуйте для облікового запису "+params["login2"]+" інший профіль браузера, інакше ваші та чужі налаштування змішаються. ";
},"anotherLogin-ie":function(params){return"Хтось із обліковим записом "+params["login1"]+" уже синхронізував дані у цьому профілі браузера. Якщо це були ви, рекомендуємо скористатися ним же. Якщо ні, використовуйте для облікового запису "+params["login2"]+" окремий профіль у Windows, інакше ваші та чужі налаштування змішаються. ";
},authError:"Помилка авторизації",badLoginPass:"Неправильна пара логін-пароль! Авторизуватися не вдалося.",
badToken:"Не вдається отримати доступ до сервера синхронізації (можливо, Ви змінили пароль). Вам потрібно авторизуватися для продовження синхронізації, для цього введіть свій пароль ще раз.",
captchaPopupText:"Ви кілька разів ввели неправильний пароль. Введіть символи із зображення та повторіть спробу.",
captchaPopupTitle:"Введіть символи із зображення",checkKeyboard:"Перевірте розкладку клавіатури, чи×не×натиснута клавіша «Caps×Lock» і×спробуйте ввести логін і×пароль ще×раз.",
credentialErrorText:"Авторизуватися не вдалося. Перевірте розкладку клавіатури, чи не натиснута клавіша «Caps Lock» та спробуйте ввести логін і пароль ще раз.",
credentialErrorTitle:"Неправильний логін або пароль",networkErrorText:"Авторизуватися не вдалося. Перевірте зв'язок з інтернетом і спробуйте ввести логін і пароль ще раз",
networkErrorTitle:"Немає зв'язку з інтернетом",sureDeleteData:function(params){return"Ви дійсно хочете видалити із сервера синхронізації всі дані облікового запису "+params["login"]+"? Відновлення цих даних буде неможливе.";
},sureToLeaveContinueButton:"Ви дійсно хочете закрити сторінку? Внесені зміни не збережуться.",sureToLeaveSaveButton:'Для застосування налаштувань синхронізації та продовження роботи натисніть кнопку "Зберегти налаштування" на сторінці налаштувань.',
sureTurnSyncOff:function(params){return"Ви впевнені, що хочете вимкнути синхронізацію?"+params["newline"]+"Зміни в цьому браузері не відображатимуться на інших комп'ютерах.";
},uknownErrorText:"Схоже, щось пішло не так. Спробуйте авторизуватися пізніше.",uknownErrorTitle:"Невідома помилка",
youTurnedOffSomeSettings:"Ви вимкнули синхронізацію частини даних. Ці дані не будуть доступні для відновлення з вашого облікового запису на Яндексі."
},{lang:"uk"});BEM.I18N.decl("i-sync-i18n__head-logo",{text:"Елементи Яндекса",yandex:"Яндекс"},{lang:"uk"
});BEM.I18N.decl("i-sync-i18n__link",{createAccount:"Завести обліковий запис",forgetPass:"Забули пароль?",
syncSettings:"Налаштування синхронізації"},{lang:"uk"});BEM.I18N.lang("uk");