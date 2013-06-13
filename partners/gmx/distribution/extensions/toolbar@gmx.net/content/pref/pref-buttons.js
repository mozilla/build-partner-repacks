function onLoad()
{
  try {
    new ToolbarMode(document.getElementById("buttons-toolbarmode"));
    new ButtonEnable(document.getElementById("buttons-list-list"));
  } catch (e) { errorCritical(e); }
}
window.addEventListener("load", onLoad, false);



function ButtonEnable(el)
{
  assert(el.tagName == "richlistbox");
  this._firefoxWindow = findSomeBrowserWindow();
  this._addButtonsToList(el, this._getAvailableButtons());
  // Need to check disabled modules again to remove buttons from listbox
  checkDisabledModules(window);
  SettingElement.call(this, el);
}
ButtonEnable.prototype =
{
  /**
   * Builds the listbox, by showing all available buttons,
   * and checking those that are enabled.
   * Called onload
   * @param listbox {<listbox>}
   * @param availableButtons {@see result of getAvailableButtons()}
   */
  _addButtonsToList : function(listbox, availableButtons)
  {
    for each (let button in availableButtons)
    {
      //debug("found button ID " + button.id + ", label " + button.label + ", icon <" + button.icon + ">");

      // build UI elements
      let listitem = document.createElement("richlistitem");
      // Set the ID of the item the same as the button so it can be removed
      listitem.setAttribute("id", button.id);
      let checkboxCell = document.createElement("listcell");
      let iconCell = document.createElement("listcell");
      let labelCell = document.createElement("listcell");
      let checkbox = document.createElement("checkbox");
      let icon = document.createElement("image");
      listitem.appendChild(checkboxCell);
      listitem.appendChild(iconCell);
      listitem.appendChild(labelCell);
      checkboxCell.appendChild(checkbox);
      iconCell.appendChild(icon);
      listbox.appendChild(listitem);

      // set UI values
      labelCell.setAttribute("label", button.label);
      icon.src = button.icon;
      checkbox.buttonID = button.id;

      // event handler
      var self = this;
      checkbox.addEventListener("command", function(event)
      {
        var checkbox = event.target;
        self.enableButton(checkbox.buttonID, checkbox.checked);
      }, false);
    }
  },

  /**
   * Returns all our buttons that *can* be added and removed to our toolbar.
   * This does not include all buttons on our toolbar, only the configurable ones.
   * They are returned in the default order.
   *
   * HACK: Pokes directly into the toolbar elements.
   *
   * @returns {Array of {
   *   id {String} element ID in the toolbar
   *   label {String}
   *   icon {URL as String}
   * }
   */
  _getAvailableButtons : function()
  {
    // Find all our buttons that are removable
    // Using the brand array ensures a consistent order
    var buttons = [];
    for (let i in brand.toolbar.items) {
      var button = this._firefoxWindow.document.querySelector("#united-" + i + "[united-removable='true']");
      if (button)
        buttons.push(button);
    }

    // get icon and label for each button
    var result = [];
    for (let i=0; i<  buttons.length; i++)
    {
      let button = buttons[i];
      var icon = this._firefoxWindow.getComputedStyle(button, null).listStyleImage;
      if (icon.substr(0, 4) == "url(") // strip url()
        icon = icon.substr(4, icon.length - 5);
      if (icon[0] == '"' || icon[0] == "'") // strip " and '
        icon = icon.substr(1, icon.length - 2);
      result.push({
        id : button.id,
        label : button.getAttribute("label"),
        icon : icon,
      });
    }
    return result;
  },
  
  /**
   * Enables or disabled a toolbar button
   *
   * @param id (String} element ID in the toolbar
   * @param enable {Boolean}
   *    if true, the button will be enabled
   *    if false, the button will be disabled
   */
  enableButton : function(id, enable)
  {
    if (enable)
    {
      arrayRemove(this._currentValue, id, true);
    }
    else
    {
      if (arrayContains(this._currentValue, id))
        return;
      this._currentValue.push(id);
    }
  },

  /**
   * @returns {Ordered Array of id {String}}
   */
  get storeValue()
  {
    return ourPref.get("hiddenButtons", "").split(",");
  },
  /**
   * @param val {Ordered Array of id {String}}
   */
  set storeValue(val)
  {
    assert(typeof(val) == "object", "must be a sorted array of element IDs");
    ourPref.set("hiddenButtons", val.join(","));
  },

  /**
   * Implementation:
   * To keep the sort order stable, e.g. due to Firefox Customize...,
   * and because the toolbar contains far more elements than we can configure here,
   * we do not read from UI directly,
   * but cache the value in this._currentValue and use enableButton().
   * @returns {Ordered Array of id {String}}
   */
  get elementValue()
  {
    return this._currentValue;
  },
  /**
   * @param val {Ordered Array of id {String}}
   */
  set elementValue(val)
  {
    assert(typeof(val) == "object", "must be a sorted array of element IDs");
    this._currentValue = val;

    // Update UI
    var checkboxNodes = this.element.getElementsByTagName("checkbox");
    for (let i = 0; i < checkboxNodes.length; i++)
    {
      let checkbox = checkboxNodes.item(i);
      checkbox.checked = !arrayContains(val, checkbox.buttonID);
    }
  },

  get defaultValue()
  {
    var hiddenButtons = [];
    // Read hidden buttons from brand.js
    for (let i in brand.toolbar.items)
      if (!brand.toolbar.items[i])
        hiddenButtons.push("united-" + i);
    return hiddenButtons;
  },
}
extend(ButtonEnable, SettingElement);

/**
 * Put |element| content of |targetArray| in a
 * similar position as it is in |exampleArray|.
 */
function sortElement(targetArray, exampleArray, element)
{
  arrayRemove(targetArray, element, true);
  var elIndex = exampleArray.indexOf(element);
  assert(elIndex != -1, "sortElement: element " + element + " must be in exampleArray");
  if (elIndex == 0)
  {
    // add at beginning
    targetArray.splice(0, 0, element);
    return;
  }
  for (let i = elIndex - 1; i >= 0; i--)
  {
    let preElIndex = targetArray.indexOf(exampleArray[i]);
    if (preElIndex == -1)
      continue;
    targetArray.splice(preElIndex + 1, 0, element);
    return;
  }
  // fallback: add at end
  targetArray.push(element);
}


function ToolbarMode(el)
{
  SettingElement.call(this, el);
}
ToolbarMode.prototype =
{
  get storeValue()
  {
    // HACK: Calls our function in Firefox window directly.
    // Need function calls with return value in messaging system.
    var firefoxWindow = findSomeBrowserWindow();
    var mode = firefoxWindow.unitedinternet.toolbar.getCurrentToolbarMode();
    if (mode == "text")
      mode = "full";
    return mode;
  },
  set storeValue(val)
  {
    notifyGlobalObservers("do-customize-toolbar", { mode : val });
  },

  get defaultValue()
  {
    return "full";
  },
}
extend(ToolbarMode, SettingElement);
