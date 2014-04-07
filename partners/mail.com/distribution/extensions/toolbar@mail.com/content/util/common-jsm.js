var scope = {};
Components.utils.import("resource://unitedtb/util/util.js", scope);
var importJSM = scope.importJSM;
importJSM("util/sanitizeDatatypes.js", scope);
importJSM("util/observer.js", scope);
importJSM("util/fetchhttp.js", scope);
importJSM("util/JXON.js", scope);
importJSM("util/brand-var-loader.js", scope);
scope.build = {}
importJSM("build.js", scope.build);

var EXPORTED_SYMBOLS = [];

for (let symbol in scope) {
  EXPORTED_SYMBOLS.push(symbol);
}

scope.mixInto(scope, this);