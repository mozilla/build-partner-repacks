/**
 * This loads all our most common library files.
 * It should be loaded in every file, so that we always have them available.
 *
 * This file is specifically for HTML UI files. You load this via a
 * <script type="application/javascript;version=1.8"
 *     src="chrome://unitedtb/content/util/common-html.js"/>
 * It is loading the libraries directly into the page context,
 * because it's all our namespace and we don't need to worry about clashes.
 *
 * Compare common.js for XUL overlays.
 */

Components.utils.import("resource://unitedtb/util/util.js", this);
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js", this);
Components.utils.import("resource://unitedtb/util/fetchhttp.js", this);
Components.utils.import("resource://unitedtb/util/observer.js", this);
Components.utils.import("resource://unitedtb/main/brand-var-loader.js", this);
Components.utils.import("resource://unitedtb/build.js", this);
Components.utils.import("resource://gre/modules/Services.jsm", this);
loadJS("chrome://unitedtb/content/util/observerOnWindow.js", this);
loadJS("chrome://unitedtb/content/util/uiutil.js", this);