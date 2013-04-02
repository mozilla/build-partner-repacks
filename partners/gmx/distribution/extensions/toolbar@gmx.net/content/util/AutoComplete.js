// TODO: figure out how to make _popup only disappear if the focus goes outside the _popup or outside the _textfield
// apparently, the _popup does not receive focus or blur events

/**
 * Autocomplete textbox.
 *
 * @param textfield {DOMElement <input type="text">}
 * @param params   Object with the following optional parameters as properties:
 * Parameters:
 * @param source {AutocompleteSource} @see addSource().
 * @param defaultAction {Function (item)}
 *     Action to use if the individual item doesn't provide one.
 *     Optional, default: no action (i.e. just copy text, if onActionCopyText is default true)
 * @param onActionCopyText {Boolean}
 *     true: upon action, copy |AutocompleteItem.value| into |_textfield|
 *     false: don't do that.
 *     Optional, default true.
 * @param xul {Boolean}
 *     true: create a <xul:popup>
 *     false: create a <html:div> as popup
 *     Optional, default false.
 * @param showIcons {Boolean}
 *     true: create a column for icons
 *     false: ignore icons
 *     Optional, default false.
 */
function AutocompleteWidget(textfield, params)
{
  this._items = [];
  this._sources = [];
  if (typeof(params.xul) == "boolean")
    this._xul = params.xul;
  if (typeof(params.onActionCopyText) == "boolean")
    this._onActionCopyText = onActionCopyText;
  if (params.defaultAction && typeof(params.defaultAction) == "function")
    this._defaultAction = defaultAction;
  else
    this._defaultAction = function() {};
  if (params.source)
    this.addSource(params.source);
  if (typeof(params.showIcons) == "boolean")
    this._showIcons = params.showIcons;
  this._hookupToTextfield(textfield);
}

const HTML = "http://www.w3.org/1999/xhtml";
const XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

AutocompleteWidget.prototype =
{
  _document : null,
  _textfield : null,
  _popup : null,
  /**
   * {Array of AutocompleteItem}
   */
  _items : null,
  /**
   * Currently selected item.
   * Index into this._items.
   */
  _current : -1,
  /**
   * {Array of AutocompleteSource}
   */
  _sources : null,
  // @see ctor
  _onActionCopyText : true,
  // @see ctor
  _defaultAction : null,
  // @see ctor
  _xul : false,
  // @see ctor
  _showIcons : false,
  /**
   * Track what's in the |_textfield|
   */
  _previousContent : "",
  /**
   * open popup once an item is added
   * (but not before, and open only once)
   */
  _shouldShowSuggestions : false,

  /**
   * Sets up textfield for use with AutoComplete
   */ 
  _hookupToTextfield : function(textfield)
  {
    this._textfield = textfield;
    this._textfield.setAttribute("autocomplete", "off");
    this._document = this._textfield.ownerDocument;
  
    if (this._xul)
    {
      this._popup = this._document.createElementNS(XUL, "panel");
      this._popup._onPopupShown = this._onPopupShown;
      this._popup.addEventListener("popupshown", this._onPopupShown, false);
      this._popup.addEventListener("popupshowing", function(event)
      {
        event.target.popupBoxObject.setConsumeRollupEvent(
            Components.interfaces.nsIPopupBoxObject.ROLLUP_NO_CONSUME);
      }, false);
    }
    else
      this._popup = this._document.createElementNS(HTML, "div");
    // classList is not supported by all browsers.
    // There are third-party implementations available,
    // see https://developer.mozilla.org/en/DOM/element.classList
    // TODO: investigate panel level values: 
    // https://developer.mozilla.org/En/XUL/Attribute/panel.level
    this._popup.classList.add("ac-popup");
    this._popup.classList.add("ac-hidden");
    if (! this._xul)
    {
      this._popup.classList.add("ac-popup-html");
      this._popup.style.maxWidth = this._getSize(this._textfield).width + "px";
    }
    this._textfield.parentNode.appendChild(this._popup);

    var css = this._document.createElementNS(HTML, "style");
    css.appendChild(this._document.createTextNode(kAutocompleteCSS));
    this._textfield.parentNode.appendChild(css);

    var self = this;
    this._textfield.addEventListener("focus", function (event)
        { self._onTextfieldFocus(event); }, false);
    this._textfield.addEventListener("blur", function (event)
        { self._onTextfieldBlur(event); }, false);
    this._textfield.addEventListener("keypress", function (event)
        { self._onTextfieldKeyPress(event); }, false);
    this._textfield.addEventListener("keyup", function (event)
        { self._onTextfieldKeyUp(event); }, false);
  },

  /**
   * Event handler for |popupshown| on |_popup|.
   * On Windows, panels have a border of 3 pixels. So even though we
   * set the width of the panel to be the same as the textfield, it actually
   * ends up 6 pixels narrower. In order to have the items display correctly,
   * we need to set the max width of the ac_items to the real width of the
   * panel which we can get by getting the computed style of the panel.
   */
  _onPopupShown : function(event) {
    const kAutocompleteCSSMaxWidth = ".ac-popup:not(.ac-popup-html) .ac-item {max-width: %WIDTH%px;}"
    event.target.removeEventListener("popupshown", event.target._onPopupShown, false);
    var style = window.getComputedStyle(event.target, null);
    var width = parseInt(style.getPropertyValue("width"));
    var css = event.target.ownerDocument.createElementNS(HTML, "style");
    css.appendChild(event.target.ownerDocument.createTextNode(kAutocompleteCSSMaxWidth.replace("%WIDTH%", width)));
    this.parentNode.appendChild(css);
  },

  /**
   * Event handler for |focus| on |_textfield|.
   * Will show popup once |_textfield| gains |focus|.
   */
  _onTextfieldFocus : function(event)
  {
    /*
    // poke data sources - maybe they want to show something for the empty string
    if (! this.isShowingSuggestions())
    {
      this._onTextChanged(this._getText());
      this.showSuggestions();
    }
    */
  },
  
  /**
   * @returns true, if |child| is a part of |parent| in the DOM tree.
   */
  _domIsParent : function(parent, child)
  {
    var cur = child;
    while (true)
    {
      cur = cur.parentNode;
      if (!cur)
        return false;
      else if (cur == parent)
        return true;
    }
  },

  /**
   * Event handler for |blur| on |_textfield|
   */
  _onTextfieldBlur : function(event)
  {
    // focus moved to popup. this workaround
    // prevents to hide the popup before the click event can fire
    // when user clicks on an item
    if (! this._xul &&
        (this._document.activeElement == this._popup ||
         this._domIsParent(this._document.activeElement, this._popup)))
      return;
    this.hideSuggestions();
  },

  /**
   * Event handler for |keypress| on |_textfield|
   */
  _onTextfieldKeyPress : function(event)
  {
    //dump("keypress in ac, key " + event.keyCode + ", char " + event.charCode + "\n");
    // @see <http://mxr.mozilla.org/mozilla-central/source/dom/interfaces/events/nsIDOMKeyEvent.idl#43>
    // <http://www.w3.org/TR/2001/WD-DOM-Level-3-Events-20010410/events.html>
    // TODO: use |event.key| attribute?
    if (event.keyCode == event.DOM_VK_DOWN)
    {
      this.skipOneForward();
      event.preventDefault();
    }
    else if (event.keyCode == event.DOM_VK_UP)
    {
      this.skipOneBackward();
      event.preventDefault();
    }
    else if (event.keyCode == event.DOM_VK_PAGE_DOWN)
    {
      this.skipPageForward();
      event.preventDefault();
    }
    else if (event.keyCode == event.DOM_VK_PAGE_UP)
    {
      this.skipPageBackward();
      event.preventDefault();
    }
    else if (event.keyCode == event.DOM_VK_END &&
        this.isShowingSuggestions() && this.currentItem())
    {
      this.skipToEnd();
      event.preventDefault();
    }
    else if (event.keyCode == event.DOM_VK_HOME &&
        this.isShowingSuggestions())
    {
      this.cancel();
      event.preventDefault();
    }
    else if (event.keyCode == event.DOM_VK_TAB &&
        !this.currentItem())
    {
      // allow to TAB from textfield to popup, but
      // otherwise do normal TAB action (TAB in popup goes to next widget)
      this.showSuggestions();
      this.skipOneForward();
      event.preventDefault();
    }
    else if (event.keyCode == event.DOM_VK_ESCAPE &&
        this.isShowingSuggestions())
    {
      this.cancel();
      //this._textfield.focus();
      event.preventDefault();
    }
    else if (event.keyCode == event.DOM_VK_RETURN ||
        event.keyCode == event.DOM_VK_ENTER)
    {
      if (this.isShowingSuggestions() && this.currentItem())
      {
        this._onItemSelected(this.currentItem());
      }
      else
      {
        this._onTextEntered(event);
      }
      this.cancel();
      event.preventDefault();
    }
  },

  /**
   * We use this to know when the text changed, and
   * pass it on to the data source.
   */
  _onTextfieldKeyUp : function(event)
  {
    var text = this._getText();
    if (text == this._previousContent)
      return;
    this._onTextChanged(text);
    this._previousContent = text;
  },


  /////////////////////////////////////////////////////////////////
  // Public API

  /**
   * Add suggestion source to AutoComplete instance.
   *
   * Suggestion sources are objects providing a
   * |onTextChanged| method. This method will be called when
   * the user enters text into the textfield.
   * The suggestion may then call addItem on the AutoComplete
   * instance to provide suggestions to the user.
   * It is recommended to call clearItems() beforehand.
   *
   * Sources or any other callers are allowed to call
   * addItem before adding themselves as source or 
   * before being called on their |onTextChanged| method.
   *
   * @param source {AutocompleteSource}
   */
  addSource : function(source)
  {
    if (!source instanceof AutocompleteSource)
      throw "must be an |AutocompleteSource| object";
    this._sources.push(source);
  },

  /**
   * Adds item to autocomplete suggestions.
   *
   * The item will have its |action| field modified.
   * 
   * @param item {AutocompleteItem} item to be added to list
   */
  addItem : function(item) 
  {
    var itemDiv = this._createItemElement(item);
    this._popup.appendChild(itemDiv);
    this._items.push(item);
    if (this._shouldShowSuggestions)
      this.showSuggestions();
  },

  /**
   * Insert item after specified point in |_popup|.
   *
   * If |pivot| is null, |newItem| is inserted at the end
   * of |_popup|.
   *
   * @param pivot {AutocompleteItem} item after which |newItem| is inserted
   * @param newItem {AutocompleteItem} item to be added
   */
  insertItemAfter : function (pivot, newItem)
  {
    var pivotElement = pivot ? this._elementForItem(pivot) : null;
    var newItemElement = this._createItemElement(newItem);
    var realPivot = pivotElement ? pivotElement.nextSibling : null;
    // following code emulates insertAfter according to
    // https://developer.mozilla.org/En/DOM/Node.insertBefore
    this._popup.insertBefore(newItemElement, realPivot);
    var pivotIndex = this._items.indexOf(pivot);
    this._items.splice(pivotIndex + 1, 0, newItem);
    if (this._shouldShowSuggestions)
      this.showSuggestions();
  },

  /**
   * Insert item in front of specified point in |_popup|.
   *
   * If |pivot| is null, |newItem| is inserted at the end
   * of |_popup|.
   * 
   * @param pivot {AutocompleteItem} item in front of which |newItem| is inserted
   * @param newItem {AutocompleteItem} item to be added
   */
  insertItemBefore : function (pivot, newItem)
  {
    var pivotElement = pivot ? this._elementForItem(pivot) : null;
    var newItemElement = this._createItemElement(newItem);
    this._popup.insertBefore(newItemElement, pivotElement);
    var pivotIndex = this._items.indexOf(pivot);
    this._items.splice(pivotIndex, 0, newItem);
    if (this._shouldShowSuggestions)
      this.showSuggestions();
  },

  /**
   * Creates a |div| |DomElement| from an item.
   * Element can then be added to |_popup.children|.
   *
   */
  _createItemElement : function(item)
  {
    if ( !(item instanceof AutocompleteItem))
      throw "need AutocompleteItem";
    var itemDiv = item.createElement(this._document, this);
    itemDiv.classList.add("ac-item");
    itemDiv.setAttribute("selected", "false");

    var self = this;
    itemDiv.addEventListener("click", function() {
      self._onItemClicked(item);
    }, false);
    itemDiv.addEventListener("mouseover", function() {
      self._onItemHover(item);
    }, false);
    item._element = itemDiv;
    return itemDiv;
  },

  /**
   * Deletes all list entries.
   */
  clearItems : function()
  {
    while (this._popup.firstChild)
      this._popup.removeChild(this._popup.firstChild);
    this._items = [];
    this._current = -1;
  },

  /**
   * Returns copy of items list.
   * @returns {Array of AutocompleteItem}
   */
  getItems : function()
  {
    return this._items.slice(0);
  },

  /**
   * Returns currently selected item.
   * @returns {AutocompleteItem}
   */
  currentItem : function()
  {
    return this._items[this._current];
  },

  /**
   * Highlights the given item (as if the user used the cursor keys).
   * Does not trigger the action (as if the user pressed RETURN).
   *
   * @param newItem {AutocompleteItem}
   */
  selectItem : function(newItem, noscroll)
  {
    var index = this._items.indexOf(newItem);
    if (index == -1)
      throw "no such item known";
    this.selectItemByIndex(index, noscroll);
  },

  /**
   * @see selectItem()
   * @param newIndex {Integer} array index
   *     >= 0 and < number of items
   */
  selectItemByIndex : function(newIndex, noscroll)
  {
    if (newIndex < 0 || newIndex >= this._items.length)
      throw "invalid item index";
    if (this._items[newIndex].nonSelectable)
      throw "item is not selectable";
    var prevEl = this._elementForItem(this.currentItem());
    if (prevEl != null)
      prevEl.setAttribute("selected", "false");
    this._current = newIndex;
    var elem = this._elementForItem(this.currentItem());
    elem.setAttribute("selected", "true");
    if (!noscroll)
      elem.scrollIntoView(false);
  },

  /**
   * This is like selectItemByIndex, but if the newIndex
   * is a nonSelectable item, we go forward or backward
   * until we find a selectable item, then select that.
   * @param newIndex @see selectItemByIndex()
   * @param forward {Boolean}
   *     if true and newIndex is nonSelectable, chose a later item.
   *     if false and newIndex is nonSelectable, chose an earlier item.
   *     if there are no selectable items before/after the given
   *     newIndex, the selection is not changed at all.
   */
  selectItemByIndexButSkipNonSelectable : function(newIndex, forward)
  {
    if (newIndex < 0 || newIndex >= this._items.length)
      throw "invalid item index";
    while (this._items[newIndex].nonSelectable)
    {
      if (forward)
        newIndex++;
      else
        newIndex--;
      if (newIndex < 0 || newIndex >= this._items.length)
        return;
    }
    this.selectItemByIndex(newIndex);
  },

  shouldShowSuggestions : function()
  {
    this._shouldShowSuggestions = true;
  },

  /**
   * Show suggestion popup.
   */
  showSuggestions : function()
  {
    if (this.isShowingSuggestions())
      return;
    this._popup.classList.remove("ac-hidden");
    // XUL <popup> <https://developer.mozilla.org/en/XUL/PopupGuide/OpenClose>
    if (this._popup.openPopup)
    {
      this._popup.openPopup(this._textfield, "after_start", false, false);
      this._textfield.focus();
    }
  },

  /**
   * Hide suggestion popup.
   */
  hideSuggestions : function()
  {
    if (! this.isShowingSuggestions())
      return;
    this._popup.classList.add("ac-hidden");
    if (this._popup.openPopup) // XUL
      this._popup.hidePopup();
  },

  /**
   * Returns whether |_popup| is showing.
   * TODO doesn't work when user clicked elsewhere to close the popup
   */
  isShowingSuggestions : function()
  {
    if (this._popup.openPopup) // XUL
      return this._popup.state == "open";
    else // HTML
      return ! this._popup.classList.contains("ac-hidden");
  },

  /**
   * Called when the text in the textfield really changed.
   * Tells the data sources about it.
   */
  _onTextChanged : function(text)
  {
    for (var i = 0, l = this._sources.length; i < l; i++)
    {
        var source = this._sources[i];
        source.onTextChanged(text);
    }
  },

  /**
   * Called when the user pressed enter in the textfield,
   * not in the popup.
   * Calls the event handler
   */
  _onTextEntered : function(event)
  {
    var handler = this._textfield.getAttribute("ontextentered");
    if (!handler)
      return;
    eval(handler);
  },

  /**
   * @param item {AutocompleteItem}
   * @returns element {DOMElement}
   */
  _elementForItem : function(item)
  {
    if (!item)
      return null;
    return item._element;
  },

  /**
   * Gets the screen size in px of an DOM element.
   * @param el {DOMElement}
   * @returns { height {Integer}, width {Integer} }
   */
  _getSize : function(el)
  {
    var style = this._document.defaultView.getComputedStyle(el, null);
    var height = parseInt(style.getPropertyValue("height"));
    var width = parseInt(style.getPropertyValue("width"));

    //var borderLeft = parseInt(style.getPropertyValue("border-left-width"));
    //var borderRight = parseInt(style.getPropertyValue("border-right-width"));
    //var borderTop = parseInt(style.getPropertyValue("border-top-width"));
    //var borderBottom = parseInt(style.getPropertyValue("border-bottom-width"));

    var paddingLeft = parseInt(style.getPropertyValue("padding-left"));
    var paddingRight = parseInt(style.getPropertyValue("padding-right"));
    var paddingTop = parseInt(style.getPropertyValue("padding-top"));
    var paddingBottom = parseInt(style.getPropertyValue("padding-bottom"));

    //if (! isNaN(borderLeft))
    //  width += borderLeft;
    //if (! isNaN(borderRight))
    //  width += borderRight;
    //if (! isNaN(borderTop))
    //  height += borderTop
    //if (! isNaN(borderBottom))
    //  height += borderBottom

    if (! isNaN(paddingLeft))
      width += paddingLeft;
    if (! isNaN(paddingRight))
      width += paddingRight;
    if (! isNaN(paddingTop))
      height += paddingTop
    if (! isNaN(paddingBottom))
      height += paddingBottom

    return { height : height, width : width };
  },

  /**
   * Gets the position of a DOM element relative to its parent element, in px.
   * @param el {DOMElement}
   * @returns { left {Integer}, top {Integer} }
   */
  _getPosition : function(el)
  {
    return { left : el.offsetHeight, top: el.offsetTop };
  },

  /**
   * Callback for list entries. Called once
   * the user hovers the cursor over an entry.
   * The item is then selected in the UI.  
   */
  _onItemHover : function(item)
  {
    if (! item.nonSelectable)
      this.selectItem(item, true);
  },

  _onItemClicked : function(item)
  {
    this._onItemSelected(item);
  },

  /**
   * Copies the |text| field into the textbox.
   */
  _onItemSelected : function(item)
  {
    if (item.nonSelectable)
      return;
    this.cancel();
    if (this._onActionCopyText)
      this._setText(item.value);
    if (! item.action)
      this._defaultAction(item);
    else
      item.action(item);
  },

  /**
   * Replaces content of |_textfield| with supplied string.
   *
   * Only call as a result of user actions to prevent bad user experience.
   * 
   * @param text {String} text for the textfield
   */
  _setText : function(text)
  {
    // set |_previousContent|, otherwise 
    // |_onKeyUp| will call |_onTextChanged|.
    // reason: |_onKeyPress| calls |_setText|
    // and |_onKeyUp| is called *afterwards*
    this._previousContent = text;
    this._textfield.value =  text;
  },
 
  /**
   * Returns content of |_textfield|.
   */ 
  _getText : function()
  {
    return this._textfield.value;
  },

  /**
   * Selects next item in list.
   */
  skipOneForward : function()
  {
    var oldIndex = this._current;
    if (oldIndex + 1 < this._items.length)
      this.selectItemByIndexButSkipNonSelectable(oldIndex + 1, true);
    if (oldIndex == this._current) // no sel. items after us, so wrap around to start
      this.selectItemByIndexButSkipNonSelectable(0, true);
  },

  /**
   * Selects previous entry in list.
   */
  skipOneBackward : function()
  {
    var oldIndex = this._current;
    if (oldIndex - 1 > 0)
      this.selectItemByIndexButSkipNonSelectable(oldIndex - 1, false);
    if (oldIndex == this._current) // no sel. items before us, so wrap around to end
      this.selectItemByIndexButSkipNonSelectable(this._items.length - 1, false);
  },

  _kPageCount : 7,

  /**
   * PageUp
   */
  skipPageBackward : function()
  {
    if (! this._popupIsScrolly())
    {
      this.selectItemByIndexButSkipNonSelectable(
           Math.max(this._current - this._kPageCount, 0), true);
    }
    else
    {
      var popupHeight = this._getSize(this._popup).height;
      var targetHeight = popupHeight -
          this._getSize(this._elementForItem(this.currentItem())).height;
      var heightSum = 0;
      while (heightSum < targetHeight)
      {
        var last = this._current;
        // skipOneBackward may skip many items if the nonSelectable flag is present
        this.skipOneBackward();
        while (this._current < last)
        {
          var itemHeight = this._getSize(this._elementForItem(this._items[last])).height;
          heightSum += itemHeight;
          last--;
        }
      }
    }
  },

  /**
   * PageDown
   */
  skipPageForward : function()
  {
    if (! this._popupIsScrolly())
    {
      this.selectItemByIndexButSkipNonSelectable(
           Math.min(this._current + this._kPageCount,
                    this._items.length - 1), false);
    }
    else
    {
      var popupHeight = this._getSize(this._popup).height;
      var targetHeight = popupHeight -
          this._getSize(this._elementForItem(this.currentItem())).height;
      var heightSum = 0;
      while (heightSum < targetHeight)
      {
        var last = this._current;
        // skipOneForward may skip many items if the nonSelectable flag is present
        this.skipOneForward();
        while (last < this._current)
        {
          var itemHeight = this._getSize(this._elementForItem(this._items[last])).height;
          heightSum += itemHeight;
          last++;
        }
      }
    }
  },

  /**
   * Guesses as to whether |_popup| is showing all of
   * its items or if there is a scrollbar.
   */
  _popupIsScrolly : function ()
  {
    var style = window.getComputedStyle(this._popup);
    var height = style.getPropertyValue("height");
    var maxHeight = style.getPropertyValue("max-height");
    if (parseInt(height) > parseInt(maxHeight))
      return true
    return false;
  },

  /**
   * End key
   */
  skipToEnd : function()
  {
    this.selectItemByIndexButSkipNonSelectable(
         this._items.length - 1, false);
  },

  /**
   * Home (Pos1) key
   */
  skipToStart : function()
  {
    this.selectItemByIndexButSkipNonSelectable(0, true);
  },
  
  cancel : function()
  {
    this.hideSuggestions();
    for (var i = 0, l = this._sources.length; i < l; i++)
    {
        var source = this._sources[i];
        try {
          source.cancel();
        } catch (e) { dump(e + "\n"); }
    }
  },

}


// <copy from="util.js">
function ac_extend(child, supertype)
{
  child.prototype.__proto__ = supertype.prototype;
}

function ac_assert(test, errorMsg)
{
  if (!test)
    throw new NotReached(errorMsg ? errorMsg : "Bug: assertion failed");
}
// </copy>


/**
 * This object must be implemented (subclassed) by the
 * user of the AutocompleteWidget, to add |AutocompleteItem|s.
 */
function AutocompleteSource()
{
}
AutocompleteSource.prototype =
{
  /**
   * The AutocompleteWidget will call this function when the
   * user changed the text in the textfield.
   *
   * Typically, you will want to react to this by providing
   * corresponding |AutocompleteItem|s, by calling addItem().
   *
   * @param text {String}  value of text field
   */
  onTextChanged : function(text)
  {
    throw "You must implement this";
  },
  /**
   * When called, the source must stop any network requests
   * and not add items anymore
   * (until there is a new reasons to do so, e.g. a new onTextChanged())
   */
  cancel : function()
  {
    throw "You must implement this";
  },
}


/**
 * This represents one option in the autocomplete dropdown.
 *
 * The |AutocompleteSource| must instantiate subclasses of it
 * and add them to the |AutocompleteWidget| via addItem().
 *
 * This is an abstract base class. Use one of the subclasses, or implement your own.
 *
 * @param value {User-visible String} will be filled into the textfield when the item is selected
 * @param label {User-visible String} Title of the item, represents the item to the user.
 * @param description {User-visible String} A longer text for the item.
 * @param icon {String} URL to icon
 * @param action {Function} Will be called when the user picks this item.
 *      This is not invoked by merely selecting it with the keyboard, but the
 *      user has either click on it with the mouse
 *      or press Return/Enter with the keyboard.
 *      Optional. The standard action is to fill the title into the textfield 
 *     and to let the user trigger the Return action there.
 * @param layout {DOMElement} DOM subtree which represents this item.
 *      Optional. The standard layout is to show only the title.
 * @param nonSelectable {Boolean} If true, this item will be skipped when
 *      selecting with the keyboard, and will not trigger any action.
 * @param classes {Array of String} list of CSS classes for this entry
 */
function AutocompleteItem(value, label, description, icon, action, nonSelectable)
{
  if (!(typeof(action) == "function" || action == null))
    throw "action must be a function or null";
  if (!typeof(nonSelectable) == "boolean")
    throw "nonSelectable must be boolean";
  if (!label && value)
    label = value;
  this.value = value;
  this.label = label;
  this.description = description;
  this.icon = icon;
  this.action = action;
  this.nonSelectable = nonSelectable;
}
AutocompleteItem.prototype =
{
  label : null,
  value : null,
  description : null,
  icon : null,
  action : null,
  nonSelectable : null,

  toString : function ()
  {
    return "item, value: " + this.value + ", label: " + this.label + ", descr: " + this.description + ", " + (this.nonSelectable ? "non-" : "") + "selectable";
  },

  /**
   * Creates new DOM nodes, which will be used as visual representation
   * of this item to the user.
   *
   * This will be invoked by |AutocompleteWidget|.
   * @param document {DOM Document node} use this to do
   *     document.createElementNS()
   * @param widget {AutocompleteWidget}
   */
  createElement : function(document, widget)
  {
    throw "You must implement this";
  },
}

/**
 * This uses a simple default layout, showing label and description and icon.
 * You can style it with CSS to your liking.
 *
 * @param classes {Array of String}  List of CSS class names (class="") for this item
 * @param highlightedText {String}  A substring of label that will be highlighted
 *     (by default bold)
 */
function SimpleAutocompleteItem(value, label, description, icon, action, nonSelectable, highlightedText, classes)
{
  AutocompleteItem.call(this, value, label, description, icon, action, nonSelectable);
  if (classes && typeof(classes.length) != "number")
    throw "classes must be an Array or null";
  this.classes = classes;
  if (highlightedText && typeof(highlightedText) != "string")
    throw "highlightedText must be a string or null";
  this.highlightedText = highlightedText;
}
SimpleAutocompleteItem.prototype =
{
  classes : null,

  toString : function ()
  {
    return "standard-" + AutocompleteItem.prototype.toString.apply(this, arguments) +
        ", highlight " + this.highlightedText +
        ", classes: " + (this.classes ? this.classes.join(",") : "none");
  },

  createElement : function(document, widget)
  {
    var itemDiv = document.createElementNS(HTML, "div");
    var iconDiv = document.createElementNS(HTML, "div");
    if (widget._showIcons)
    {
      iconDiv.classList.add("ac-item-icon");
      var imgNode = document.createElementNS(HTML, "img");
      if (this.icon)
        imgNode.setAttribute("src", this.icon);
      iconDiv.appendChild(imgNode);
      itemDiv.appendChild(iconDiv);
    }
    var labelDiv = document.createElementNS(HTML, "div");
    let highlightStart = this.highlightedText ? this.label.indexOf(this.highlightedText) : -1;
    if (highlightStart != -1)
    {
      let before = this.label.substring(0, highlightStart);
      let after = this.label.substring(highlightStart + this.highlightedText.length);
      labelDiv.appendChild(document.createTextNode(before));
      let highlightE = document.createElementNS(HTML, "ac-item-highlighted-text");
      highlightE.appendChild(document.createTextNode(this.highlightedText));
      labelDiv.appendChild(highlightE);
      labelDiv.appendChild(document.createTextNode(after));
    }
    else
      labelDiv.appendChild(document.createTextNode(this.label));
    labelDiv.classList.add("ac-item-label");
    itemDiv.appendChild(labelDiv);
    if (this.description)
    {
      var descDiv = document.createElementNS(HTML, "div");
      descDiv.classList.add("ac-item-desc");
      descDiv.appendChild(document.createTextNode(this.description));
      itemDiv.appendChild(descDiv);
    }
    if (this.classes)
      for (var i = 0; i < this.classes.length; i++)
        itemDiv.classList.add(this.classes[i]);
    return itemDiv;
  },
}
ac_extend(SimpleAutocompleteItem, AutocompleteItem);

/**
 * This allows you to supply a template DOM tree, which will be used as
 * item display.
 * Text nodes can use placeholders, which will be replaces with the
 * value, label and description that you pass in here.
 * TODO icon
 *
 * @param layout {DOM Element}
 *     Will be cloned for each item.
 */
function ReplacedTextLayoutAutocompleteItem(value, label, description, icon, action, nonSelectable, layout)
{
  AutocompleteItem.call(this, value, label, description, icon, action, nonSelectable);
  if ( !layout)
    throw "need a DOM tree as layout param";
  this.layout = layout;
}
ReplacedTextLayoutAutocompleteItem.prototype =
{
  layout : null,

  toString : function ()
  {
    return "ReplacedTextLayout-" +
        AutocompleteItem.prototype.toString.apply(this, arguments);
  },

  createElement : function(document, widget)
  {
    var itemDiv = this.layout.clone();
    var self = this;

    // substitute variables in layout with |item.label| etc.
    var walker = document.createTreeWalker(itemDiv,
      NodeFilter.SHOW_TEXT,
      { acceptNode : function (node) { return NodeFilter.FILTER_ACCEPT } },
      false);
    while (walker.nextNode())
    {
      var cur = walker.currentNode;
      var text = cur.nodeValue;
      text = text.replace(/%%value%%/g, self.value);
      text = text.replace(/%%label%%/g, self.label);
      text = text.replace(/%%description%%/g, self.description);
      cur.nodeValue = text;
    }

    return itemDiv;
  },
}
ac_extend(ReplacedTextLayoutAutocompleteItem, AutocompleteItem);

const kAutocompleteCSS = "\n\
.ac-popup:not(.ac-popup-html) {\n\
  height : 1px;\n\
}\n\
.ac-popup {\n\
  visibility : visible;\n\
  overflow: auto;\n\
  max-height : 50em;\n\
  cursor: default;\n\
  background-color: white;\n\
}\n\
.ac-popup-html {\n\
  position: relative;\n\
  z-index: 1;\n\
  border: outset 1px;\n\
  background-color: Window;\n\
}\n\
\n\
.ac-hidden {\n\
  display : none;\n\
}\n\
.ac-popup div.ac-item {\n\
   padding: 0px 4px;\n\
   overflow: hidden;\n\
}\n\
\n\
.ac-popup div.ac-item-icon {\n\
  float : left;\n\
  position : relative;\n\
  margin: 2px;\n\
}\n\
\n\
.ac-popup div.ac-item-label {\n\
  position : relative;\n\
  overflow: hidden;\n\
  text-overflow: ellipsis;\n\
  margin-top: 2px;\n\
  margin-bottom: 2px;\n\
  white-space: nowrap;\n\
}\n\
\n\
/* These show up under each search result */\n\
.ac-popup div.ac-item-desc {\n\
  display : none;\n\
  margin: 2px;\n\
}\n\
\n\
.ac-popup div.ac-item[selected=true] {\n\
   background-color: Highlight;\n\
   color: HighlightText;\n\
}\n\
\n\
.ac-popup div.ac-item-icon {\n\
  margin: 2px;\n\
  min-width: 16px;\n\
}\n\
.ac-popup div.ac-item-icon img {\n\
  width: 16px;\n\
  height: 16px;\n\
}\n\
/* section header */\n\
.ac-popup div.ac-item-header {\n\
  position : relative;\n\
  color: GrayText !important;\n\
  font-size: smaller;\n\
  text-overflow: ellipsis;\n\
  white-space: nowrap;\n\
}\n\
.ac-popup div.ac-item-label > ac-item-highlighted-text {\n\
  display : inline;\n\
  font-weight: bold;\n\
}\n\
";
