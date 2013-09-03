var scope = {};
Components.utils.import("resource://unitedtb/util/util.js", scope);
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js", scope);
Components.utils.import("resource://unitedtb/util/observer.js", scope);
Components.utils.import("resource://unitedtb/util/fetchhttp.js", scope);
Components.utils.import("resource://unitedtb/util/JXON.js", scope);
Components.utils.import("resource://unitedtb/util/brand-var-loader.js", scope);
scope.build = {}
Components.utils.import("resource://unitedtb/build.js", scope.build);

var EXPORTED_SYMBOLS = [];

for (let symbol in scope) {
  EXPORTED_SYMBOLS.push(symbol);
}

scope.mixInto(scope, this);