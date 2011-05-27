/**
 * An data entry, e.g. a visited URL.
 *
 * @param label {String} Label to be shown to the user
 * @param date {Date} Timestamp for this entry
 */
function Entry(label, date)
{
  this.label = label;
  this.date = date;
}

Entry.prototype = {
  /**
   * Deletes this item from the datasource.
   *
   * Implementations of this method should run asynchronously 
   * on a background thread to avoid blocking the main UI thread.
   *
   * @param successCallback {Function()} called if deletion is successful
   * @param errorCallback {Function(error) {String} error message} called if 
   *     deletion did not succeed
   */
  delete : function(successCallback, errorCallback)
  {
    throw new NotReached("Override the delete method in your Entry subclass.");
  },
  /**
   * Action to be executed.
   * This is set as the onclick handler for the Entry in the UI.
   *
   * @param event {DOMEvent} event which triggered this handler
   */  
  action : function(event)
  {
    throw new NotReached("Override the delete method in your Entry subclass.");
  },
}

/**
 * A data source module.
 * Provides entries.
 * 
 * @param key {String} internal identifier
 * @param label {String} label shown to the user
 */
function Module(key, label)
{
  this.key = key;
  this.label = label;
}
Module.prototype = {
  /**
   * Returns entries for this data source.
   *
   * Implementations of this method should run asynchronously 
   * on a background thread to avoid blocking the main UI thread.
   * 
   * @param successCallback {Function(entries) {Array of Entry}}
   * @param errorCallback {Function(error) {String}}
   */
  getEntries: function(successCallback, errorCallback)
  {
    throw new NotReached("Override the getEntries method in your Module subclass.");
  },
}

// This is a datasource for the Personal Search History.
// It is intended to be used with newtab-management-js.

Components.utils.import("resource://unitedtb/search/search-store.js", this);

function PSHModule()
{
  var sb = new united.StringBundle("chrome://unitedtb/locale/newtab/psh.properties");
  var label = sb.get("label");
  Module.call(this, "psh", label);
}

PSHModule.prototype =
{
  getEntries : function(successCallback, errorCallback)
  {
    // from search/search-store.js
    getLastSearchesWithDate(500, 
    function (results)
    {
      var entries = [];
      for each (let result in results)
      {
        let term = result[0];
        united.assert(term, "no term found?!");
        let date = result[1];
        united.assert(date, "no date found?!")
        //assert(typeof(date) == "date", "date not of type Date?!");
        entries.push(new PSHEntry(term, date));
      }
      successCallback(entries);
    }, errorCallback);
  }
}

united.extend(PSHModule, Module);


function PSHEntry(label, date)
{
  Entry.call(this, label, date);
}

PSHEntry.prototype =
{
  self : this,
  delete : function(successCallback, errorCallback)
  {
    deleteSearchTerm(this.label, successCallback, errorCallback);
  },
  action : function(event)
  {
    united.loadPage(united.brand.search.historyNewTabURL + event.target.entry.label);
  },
}
united.extend(PSHEntry, Entry);
