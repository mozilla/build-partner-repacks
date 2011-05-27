/**
 * Whether the UI currently is in edit mode.
 */
var gIsEditing = false;

/**
 * Specifies which module is currently shown to the user.
 */
var gCurrentModule;

/**
 * Keeps track of currently displayed checkboxes.
 * The |entry| of a checkbox points to the 
 * {Entry} instance it is controlling.
 */
var gCheckBoxes = [];

/**
 * Holds Module instances. Modules can be
 * retrieved using their |key| as property name.
 */
var gModules = {};

/**
 * Array holding localized weekdays. 0: sunday.
 */
var gWeek; 

var united = getTopLevelWindowContext().united;

/**
 * i18n StringBundle
 */ 
var sb;

function onLoad()
{
  sb = new united.StringBundle("chrome://unitedtb/locale/newtab/store-management.properties");
  gWeek = [ sb.get("sunday"), sb.get("monday"), sb.get("tuesday"),
            sb.get("wednesday"), sb.get("thursday"), sb.get("friday"),
            sb.get("saturday"), sb.get("sunday") ];
  var mode = document.location.href.match(/\?mode=(.*)/)[1];
  addModule(new PSHModule());
  // may throw
  switchModule(gModules[mode]);

}

window.addEventListener("load", onLoad, false);

/**
 * Adds module to generic UI.
 * @param module {Module}
 */
function addModule(module)
{
  united.assert(module.key, "Module must have key");
  united.assert(! gModules[module.key], "Module already added"); 
  gModules[module.key] = module;
  addButton(module);
}

/**
 * Adds button for a |module| to UI.
 * The user can switch to the |module|
 * by clicking on that button,
 * causing the module's entries to be loaded
 * into the UI.
 * 
 * @param module {Module} 
 */
function addButton(module)
{
  united.debug("adding button for module: " + module.label);
  var buttons = document.getElementById("buttonlist");
  var newButton = document.createElement("a");
  newButton.setAttribute("class", "mode-toggle");
  newButton.appendChild(document.createTextNode(module.label));
  newButton.module = module;
  newButton.addEventListener("click", onSwitchModule, false);
  buttons.appendChild(newButton);
  united.debug("added button");
}

/**
 * Clears Entry list.
 */
function resetList()
{
  var list = document.getElementById("items-list");
  cleanElement(list);
}

/**
 * Given a date, discards the time portion of that date.
 * So for 02-02-2011 13:42, you will get
 * 02-02-2011 00:00.
 *
 * @param datetime {Date}
 */
function discardTime(datetime)
{
  var date = new Date(datetime.getTime())
  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setMinutes(0);
  date.setHours(0);
  return date;
}

/**
 * Callback for |Module.getEntries|.
 *
 * Displays Entries to the user. Also adds a checkbox
 * which is hidden by default.
 * 
 * @param entries {Arry of {Entry}} Entries to be displayed
 */
function addEntries(entries)
{
  united.assert(entries, "addEntries method needs argument");
  var list = document.getElementById("items-list");
  /**
   * Sort |entries| into days.
   * Each day gets an array with all the |Entry|s for that day.
   * E.g. [ 0 : [ Entry, Entry, Entry ], // today
   *          1 : [ Entry, Entry, Entry ], // yesterday
   *          2 : [ Entry, Entry, Entry ], // 2 days ago
   *        ]
   * {Array of { Array of Entry } }, with first index = day distance from today
   */
  const dayLength = 24*60*60*1000; // one day in MS
  const today = discardTime(new Date());
  var dayEntries = [];
  for each (let entry in entries)
  {
    let dayDistance = Math.floor((today - discardTime(entry.date)) / dayLength);
    if (! dayEntries[dayDistance])
      dayEntries[dayDistance] = [];
    dayEntries[dayDistance].push(entry);
  }
  for (let dayDistance in dayEntries)
  {
    if (! dayEntries[dayDistance].length)
      continue;
    // Create date header
    let relativeDate = "";
    if (dayDistance == 0)
      relativeDate = sb.get("today") + " - ";
    else if (dayDistance == 1)
      relativeDate = sb.get("yesterday") + " - ";
    let date = dayEntries[dayDistance][0].date;
    let weekDay = gWeek[date.getDay()];
    let dayString = relativeDate + weekDay + ", " + date.toLocaleDateString();
    let header = document.createElement("h2");
    header.appendChild(document.createTextNode(dayString));
    list.appendChild(header);

    // add term entries, with time
    for each (let entry in dayEntries[dayDistance])
    {
      let div = document.createElement("div");
      let checkbox = document.createElement("input");
      checkbox.setAttribute("type", "checkbox");
      checkbox.setAttribute("class", "edit-mode");
      checkbox.entry = entry;
      // if refreshUI is called while we're in edit mode
      // (e.g. when the user deletes something),
      // show the checkboxes
      if (gIsEditing)
        checkbox.style.visibility = "visible";
      else
        checkbox.style.visibility = "hidden";
      gCheckBoxes.push(checkbox);
      let link = document.createElement("a");
      link.entry = entry;
      let timeString = entry.date.toLocaleTimeString();
      // remove seconds
      timeString = timeString.slice(0, timeString.lastIndexOf(":"));
      link.appendChild(document.createTextNode(timeString  + " " + entry.label));
      link.addEventListener("click", entry.action, false);
      div.appendChild(checkbox);
      div.appendChild(link);
      list.appendChild(div);
    }
  }
}

/**
 * Refreshes UI by querying the current module again.
 */
function refreshUI()
{
  switchModule(gCurrentModule);
}

/**
 * Switch module. Will load the entries
 * for the new module into the UI.
 * 
 * @param module {Module} Module to be loaded
 */
function switchModule(module)
{
  united.assert(module, "unknown module requested or module is null");
  resetList();
  gCurrentModule = module;
  module.getEntries(addEntries, united.errorCritical);
}

/**
 * Handler for module buttons. Switches to module specified
 * by the button.
 */
function onSwitchModule(event)
{
    if (!event)
      return;
    var module = event.target.module;
    switchModule(module);
}

/**
 * Handler for edit-button. Kicks UI in and out of edit mode.
 */
function onToggleEdit()
{
    var editButton = document.getElementById("edit-button");
    united.cleanElement(editButton);
    if (gIsEditing)
    {
      var text = editButton.getAttribute("edit-string");
      editButton.appendChild(document.createTextNode(text));
    }
    else
    {
      var text = editButton.getAttribute("exit-string");
      editButton.appendChild(document.createTextNode(text));
    }
    // if we're editing user toggles button, we want to go back to normal mode
    var elementsList = document.getElementsByClassName("edit-mode");
    for (let i = 0, l = elementsList.length; i < l; i++)
    {
      let el = elementsList.item(i);
      if (!gIsEditing)
        el.style.visibility = "visible";
      else
        el.style.visibility = "hidden";
    }
    gIsEditing = ! gIsEditing;
}


/**
 * Deletes all items from list.
 *
 * The list is refreshed once deletion was successful.
 */
function onDeleteAll()
{
  for each (let checkBox in gCheckBoxes)
  {
    united.assert(checkBox.entry, "checkBox needs entry field");
    checkBox.entry.delete(function() {}, united.errorCritical);
  }
  refreshUI();
}

/**
 * Deletes currently selected items from list.
 *
 */
function onDeleteSelection()
{
  for each (let checkBox in gCheckBoxes)
  {
    if (!checkBox.checked)
      continue;
    united.assert(checkBox.entry);
    checkBox.entry.delete(function() {}, united.errorCritical);
  }
  // TODO: do not refresh UI completely, just delete items we deleted from the UI
  refreshUI();
}
