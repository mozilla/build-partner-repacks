/**
 * Allows JS code (esp. Firefox extensions) to store an arbitrary JS object
 * as app-global object, meaning it will be preserved for the lifetime of
 * the application instance (e.g. until the browser is exited).
 * Use this when you need to use the same object across all Firefox windows.
 */

var EXPORTED_SYMBOLS = [ "setGlobalObject", "getGlobalObject", "haveGlobalObject" ];

var objects = [];

function setGlobalObject(namespace, name, obj)
{
  var id = namespace + "-" + name;
  objects[id] = obj;
}

function getGlobalObject(namespace, name)
{
  var id = namespace + "-" + name;
  if (typeof(objects[id]) == "undefined")
    throw "object " + name + " in namespace " + namespace + " does not exist";
  return objects[id];
}

function haveGlobalObject(namespace, name)
{
  var id = namespace + "-" + name;
  return typeof(objects[id]) != "undefined";
}
