/**
 * This represents a search result, e.g. a word or URL.
 * The subclasses define the action, i.e. what should happen when the
 * selects this search result.
 *
 * Subclasses of this class will be instantiated by the mSearch engine.
 * Callers of the system do not instantiate it, but get it from
 * mSearch.currentResults. Callers do use the API defined here, though.
 */
function mResult(title, descr, icon, type)
{
  this.title = title;
  this.description = descr;
  this.icon = icon;
  this.type = type || "generic";
}
mResult.prototype =
{
  _title : null, // {String}
  _description : null, // {String}
  _icon : null, // {URL as String}

  /**
   * The user-visible name of the result,
   * e.g. the word, or the title of the webpage.
   * @returns {String}
   */
  get title()
  {
    return this._title;
  },
  set title(val)
  {
    this._title = sanitize.label(val);
  },

  /**
   * An explanatory text which is displayed to the user with lesser importance.
   * May be "".
   * @returns {String}
   */
  get description()
  {
    return this._description;
  },
  set description(val)
  {
    this._description = sanitize.label(val || "");;
  },

  /**
   * An explanatory text which is displayed to the user with lesser importance.
   * May be null.
   * @returns {URL as String}
   */
  get icon()
  {
    return this._icon;
  },
  set icon(val)
  {
    if (val)
      this._icon = sanitize.string(val);
    else
      this._icon = null;
  },

  /**
   * When the user decided for this result (e.g. clicked on it, not just hover over it),
   * you can call this function to do what the result stands for, e.g.
   * to load a webpage or trigger a web search.
   *
   * @param browserWindow {DOMWindow} the |window| object of the Firefox
   *     window (chrome) with |united| as member.
   */
  activate : function(firefoxWindow)
  {
    throw NotReached("abstract function");
  },
}
