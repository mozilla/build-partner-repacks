/**
 * This represents a web page (in form of an URL) that the user can
 * navigate to in the main browser window.
 * @param url {URL as String}
 */
function mURLResult(title, descr, icon, url)
{
  mResult.call(this, title, descr, icon);
  this.url = url;
}
mURLResult.prototype =
{
  _url : null, // {String}

  /**
   * Load this in the browser window, if the user activates this result.
   * @returns {URL as String}
   */
  get url()
  {
    return this._url;
  },
  set url(val)
  {
    this._url = sanitize.url(val);
  },

  activate : function(firefoxWindow)
  {
    firefoxWindow.united.loadPage(this._url); // from util.js
  },

}
extend(mURLResult, mResult);
