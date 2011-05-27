/**
 * This is a message passing mechanism between modules, to decouple them,
 * per Tom. E.g. the search bar sends an event that the user has searched
 * something, and the Amazon widget listens for that.
 *
 * Your module MUST define which public notifications it sends out,
 * what they mean, when exactly they will be sent, and define the |object|
 * contents precisely, just like you'd define a public function signature.
 * Your module SHOULD define which public notifications it listens to.
 *
 * There are 2 types of observers, global ones that go out to all windows,
 * and those that are limited to the current window. The latter notifies
 * only those observers that were registered in the same window.
 */

const EXPORTED_SYMBOLS = [
  "registerGlobalObserver", "unregisterGlobalObserver",
  "notifyGlobalObservers",
  // *OnList() are mainly for observerWindow.js
  "registerObserverOnList", "unregisterObserverOnList",
  "notifyObserversOnList",
  ];

Components.utils.import("resource://unitedtb/util/util.js");

var gGlobalObservers = [];

/**
 * Subscribe yourself to hear the messages.
 * Currently, you'll be called for all msgs. Maybe you should
 * optionally be able to spec which msgs you wand and only get those?
 *
 * @param observer {Object with function notification(msg, object)}
 */
function registerObserverOnList(observerList, observer)
{
  assert(typeof(observer.notification) == "function", "need object with function 'notification'");
  observerList.push(observer);
}

function unregisterObserverOnList(observerList, observer)
{
  assert(typeof(observer.notification) == "function", "need object with function 'notification'");
  arrayRemove(observerList, observer);
}

/**
 * Calls all observers.
 *
 * @param obs {Array of observers} internal list of observers to notify
 * @param msg {String} the type of notification, e.g. "search-started"
 * @param obj {Object} additional information, depending on type of msg.
 *
 * You MUST define the msg and object, see top of file.
 */
function notifyObserversOnList(observerList, msg, obj)
{
  assert(typeof(msg) == "string");
  debug(msg + " message sent (" + new Date().toLocaleString() + ")");
  //debugObject(obj, "obj", 1);
  for (let i = 0, l = observerList.length; i < l; i++)
  {
    try {
      observerList[i].notification(msg, obj);
    } catch (e) { errorInBackend(e); }
  }
}

function registerGlobalObserver(observer)
{
  registerObserverOnList(gGlobalObservers, observer);
}
function unregisterGlobalObserver(observer)
{
  unregisterObserverOnList(gGlobalObservers, observer);
}
function notifyGlobalObservers(msg, obj)
{
  notifyObserversOnList(gGlobalObservers, msg, obj);
}
