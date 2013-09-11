const EXPORTED_SYMBOLS = ["$wc"];
;
(function () {
var glob = this;
var define = function (key, val) {
if (key in this)
throw new Error("Redeclaration of " + this + "[\"" + key + "\"]" + " from " + this[key] + " to " + val);
var id = this === glob ? key : this + "." + key;
if (val && Object(val) === val && ! val.hasOwnProperty("toString"))
{
val.toString = function () {
return id;
}
;
}

this[key] = val;
return val;
}
;
define("$define",define);
}
)();
$define("$wc",new function () {
this.define = $define;
}
());
with ($wc) $wc.define("$Applier",function (procList) {
var len = procList.length;
return function () {
var res = [];
for (var i = 0;i < len;++i) res[i] = procList[i].apply(this,arguments);
return res;
}
;
}
);
with ($wc) $wc.define("$Concater",function (delim) {
delim = delim || "";
return function (list) {
return list.join(delim);
}
;
}
);
with ($wc) $wc.define("$Pipe",function () {
var list = arguments;
var len = list.length;
if (len === 1)
return list[0];
if (len === 0)
return function (data) {
return data;
}
;
return function () {
if (! arguments.length)
arguments.length = 1;
for (var i = 0;i < len;++i) arguments[0] = list[i].apply(this,arguments);
return arguments[0];
}
;
}
);
with ($wc) $wc.define("$Value",function (val) {
return function () {
return val;
}
;
}
);
with ($wc) $wc.define("$Lexer",new function () {
var offsetSize = /^$/.exec("").length;
return function (lexems) {
if (! lexems)
throw new Error("lexems is required");
var regexpList = [];
var nameList = [];
var sizeList = [];
for(var name in lexems) {
var regexp = lexems[name];
nameList.push(name);
regexpList.push(regexp.source);
sizeList.push(RegExp("^$|" + regexp).exec("").length - offsetSize);
}

var regexp = RegExp("([\\s\\S]*?)((" + regexpList.join(")|(") + ")|$)","g");
var lexer = function (starter, handler) {
if (! starter)
throw new Error("starter is required");
if (! handler)
throw new Error("handler is required");
var parser = function (str) {
str = String(str);
var pos = 0;
var state = starter();
while (pos < str.length) {
regexp.lastIndex = pos;
var found = regexp.exec(str);
pos = regexp.lastIndex;
var prefix = found[1];
if (prefix)
state = handler.call(this,state,"",[prefix]);
if (! found[2])
continue;
var valN = 4;
for (var i = 0;i < sizeList.length;++i) {
var size = sizeList[i];
if (found[valN - 1])
{
var args = found.slice(valN,valN + size);
state = handler.call(this,state,nameList[i],args);
break;
}

valN += size + 1;
}

}

return state;
}
;
return parser;
}
;
return lexer;
}
;
}
());
with ($wc) $wc.define("$Parser",new function () {
var Parser = function (syntaxes) {
var lexems = {
};
for(var name in syntaxes) {
var regexp = syntaxes[name].regexp;
if (! regexp)
continue;
lexems[name] = regexp;
}

var handlers = {
"": $Pipe()};
for(var name in syntaxes) handlers[name] = syntaxes[name].handler;
var lexer = $Lexer(lexems);
var lexer_parser = lexer(Array,function (state, name, found) {
state.push(handlers[name].apply(this,found));
return state;
}
);
var parser = function () {
return lexer_parser.apply(this,arguments);
}
;
return parser;
}
;
Parser.define = $define;
return Parser;
}
());
with ($wc) $wc.define("$Template",function (filter) {
var parse = $Parser(new function () {
this.open = new function () {
this.regexp = /\{\{/;
this.handler = $Value($Value("{"));
}
();
this.close = new function () {
this.regexp = /\}\}/;
this.handler = $Value($Value("}"));
}
();
this.selector = new function () {
this.regexp = /\{([^\{\}]+)\}/;
this.handler = function (sel) {
return function (data) {
data = data[sel];
switch (typeof data) {
case "undefined":
return "{" + sel + "}";
case "function":
return data();
default:
return filter(data);
}

}
;
}
;
}
();
this[""] = new function () {
this.handler = $Value;
}
();
}
());
return function (str) {
return $Pipe($Applier(parse(str)),$Concater());
}
;
}
);
$wc.$Template.$Simple = $wc.$Template($wc.$Pipe());
with ($wc) $wc.define("$uri",new function () {
this.$encode = encodeURIComponent;
this.$decode = decodeURIComponent;
this.$Template = $Template(this.$encode);
}
());
