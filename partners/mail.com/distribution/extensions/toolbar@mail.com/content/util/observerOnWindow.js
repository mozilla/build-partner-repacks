var gWindowObservers = [];

function registerWindowObserver(observer)
{
  registerObserverOnList(gWindowObservers, observer);
}
function unregisterWindowObserver(observer)
{
  unregisterObserverOnList(gWindowObservers, observer);
}
function notifyWindowObservers(msg, obj)
{
  notifyObserversOnList(gWindowObservers, msg, obj);
}

// convenience functions

function autoregisterWindowObserver(listenForMsg, func)
{
  assert(typeof(func) == "function");
  assert(typeof(listenForMsg) == "string");
  var windowObserver =
  {
    notification : function(msg, obj)
    {
      if (msg == listenForMsg)
        func(obj);
    }
  };
  registerWindowObserver(windowObserver);
  // no unregister necessary
}

function autoregisterGlobalObserver(listenForMsg, func)
{
  assert(typeof(func) == "function");
  assert(typeof(listenForMsg) == "string");
  var globalObserver =
  {
    notification : function(msg, obj)
    {
      if (msg == listenForMsg)
        func(obj);
    }
  };
  registerGlobalObserver(globalObserver);
  window.addEventListener("unload", function()
  {
    unregisterGlobalObserver(globalObserver);
  }, false);
}
