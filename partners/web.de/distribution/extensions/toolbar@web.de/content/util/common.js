var united;
if (!united)
{
  united = {};

  Components.utils.import("resource://unitedtb/util/util.js", united);
  Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js", united);
  Components.utils.import("resource://unitedtb/util/fetchhttp.js", united);
  Components.utils.import("resource://unitedtb/util/observer.js", united);
  Components.utils.import("resource://unitedtb/main/brand-var-loader.js", united);
  Components.utils.import("resource://unitedtb/build.js", united);
  united.loadJS("chrome://unitedtb/content/util/observerOnWindow.js", united);
  united.loadJS("chrome://unitedtb/content/util/uiutil.js", united);
}
