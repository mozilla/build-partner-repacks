var gPrefElements = [];

/**
 * Hook up an setting UI element to a setting storage, and keep them in sync.
 * This is the base implementation.
 * You only need to implement storeValue, and defaultValue or reset().
 *
 * @param element {DOMElement}  UI element displaying the setting
 */
function SettingElement(element)
{
  united.assert(element && element instanceof united.Ci.nsIDOMElement);
  this.element = element;

  if (this.element.tagName == "checkbox")
    this.elementValueProperty = "checked";

  this._hookup();

  this._oldValue = this.elementValue; // for "dirty" detection in save()
}
SettingElement.prototype =
{
  /**
   * This property (with this name) on the element will be set/get.
   * E.g. for textfields, this is E("myfield").value.
   */
  elementValueProperty : "value",
  /**
   * This event (with this name) on the element will be listed for,
   * to know about the user having changed the value.
   * This will be needed for instant-apply (currently not implemented).
   */
  //elementChangeEvent : "command",

  /**
   * - Set initial value of UI element
   * - Set event handlers of UI element
   * - Observe pref changes
   */
  _hookup : function()
  {
    this.elementValue = this.storeValue;
    // register with window
    gPrefElements.push(this);
  },

  /**
   * Call this when the dialog is closed and prefs are saved.
   * 1. remove event handlers from UI element
   * 2. remove pref observer
   */
  unhook : function()
  {
  },

  /**
   * Save the UI element's current value to storage.
   */
  save : function()
  {
    if (this.elementValue == this._oldValue &&
        typeof(this.elementValue) != "object") // == doesn't work for objects
      return; // avoid side effects in storeValue
    this.storeValue = this.elementValue;
  },

  /**
   * Don't save the UI element's value to storage.
   * Generally a no-op.
   */
  cancel : function()
  {
  },

  get elementValue()
  {
     return this.element[this.elementValueProperty];
  },
  set elementValue(val)
  {
     this.element[this.elementValueProperty] = val;
  },

  reset : function()
  {
     this.storeValue = this.defaultValue;
     this.elementValue = this.storeValue;
  },

  get storeValue()
  {
     throw new NotReached("implement this");
  },
  set storeValue(val)
  {
     throw new NotReached("implement this");
  },

  /**
   * Only for reset()
   */
  get defaultValue()
  {
     throw new NotReached("implement this or overwrite reset");
  },

  /**
   * Checks whether the user input in the element is correct.
   * Default implementation is to
   * call the function in the onvalidate="" XUL attribute of the element.
   *
   * @param save {Boolean}
   *      true, if [Save] button has been pressed.
   *        (or instant apply?)
   *      false, if the user just moved the cursor to another field.
   *        (or instant apply?)
   * @return {String}
   *      if there was an error: user-displayable error message
   *      else: null
   */
  validate : function(save)
  {
    let validator = this.element.getAttribute("onvalidate");
    if (!validator)
      return null;
    let varstr = "let save = " + united.sanitize.boolean(save) + "; ";
    let errorMsg = eval(varstr + validator); // meh, no other way to run onfoo event handlers
    return errorMsg;
  },

}

/**
 * Hook up a pref to an UI element, to keep them in sync.
 *
 * This implements a class that you can hook up to any UI element.
 * The class observes a pref and syncs the UI element and pref, i.e.
 * 1. the UI element has the value of the pref on init
 * 2. the pref gets the UI element's value on Save
 * 3. on reset, the UI element is set to the default pref value.
 *
 * The hookup happens in the ctor.
 *
 * @param element {DOMElement}  UI element displaying the pref
 * @param prefName {String}  name of pref (within prefBranch) to observe
 * @param prefBranch {Preferences (from Preferences.js)}   E.g. generalPref or ourPref
 */
function AutoPrefElement(element, prefName, prefBranch)
{
  united.assert(prefBranch && typeof(prefBranch.isSet) == "function");
  this.prefName = united.sanitize.nonemptystring(prefName);
  this.prefBranch = prefBranch;
  SettingElement.call(this, element);
}
AutoPrefElement.prototype =
{

  /**
   * - Set initial value of UI element
   * - Set event handlers of UI element
   * - Observe pref changes
   */
  _hookup : function()
  {
    // set event handlers
    //this._onElementChangeCB = makeCallback(this, this.onElementChanged);
    //this.element.addEventListener(this.elementChangeEvent, this._onElementChangeCB, false);
    // observe pref
    this.prefBranch.observe(this.prefName, this.onPrefChanged, this);

    SettingElement.prototype._hookup.apply(this, arguments);
  },

  /**
   * Call this when the dialog is closed and prefs are saved.
   * 1. remove event handlers from UI element
   * 2. remove pref observer
   */
  unhook : function()
  {
    //this.element.removeEventListener(this.elementChangeEvent, this._onElementChangeCB, false);
    this.prefBranch.ignore(this.prefName, this.onPrefChanged, this);
  },

  onPrefChanged : function()
  {
    this.elementValue = this.prefBranch.get(this.prefName);
  },


  get storeValue()
  {
    return this.prefBranch.get(this.prefName);
  },
  set storeValue(val)
  {
    this.prefBranch.set(this.prefName, val);
  },

  reset : function()
  {
    this.prefBranch.reset(this.prefName);
    // pref observer doesn't trigger, if user changed the element and didn't save yet
    this.elementValue = this.storeValue;
  },

}
united.extend(AutoPrefElement, SettingElement);

/**
 * Utility function that gets all elements that have a
 * preference="" XUL atttribute,
 * and creates an |AutoPrefElement| for them.
 *
 * @param container {DOMElement}   Get all elements underneath this element
 * @param prefBranch {Preferences}   @see AutoPrefElement ctor
 */
function hookupAllPreferencesElements(element, prefBranch)
{
  united.assert(element instanceof united.Ci.nsIDOMElement);
  var prefName = element.getAttribute("preference");
  if (prefName)
    new AutoPrefElement(element, prefName, prefBranch);

  // recurse
  if (element.hasChildNodes())
  {
    let children = element.childNodes;
    for (let i = 0; i < children.length; i++)
    {
      let child = children.item(i);
      if (child.nodeType == kNodeTypeElement)
        hookupAllPreferencesElements(child, prefBranch);
    }
  }
}

const kNodeTypeElement = 1;
