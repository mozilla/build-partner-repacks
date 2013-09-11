"use strict";
const {classes: Cc, interfaces: Ci} = Components;
const GLOBAL = this;
const migrator = {
init: function migrator_init(aMigrationModule) {

}
,
migrate: function migrator_migrate() {
var cacheFile = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD",Ci.nsIFile);
cacheFile.append("yandex");
cacheFile.append("users.sqlite");
if (! cacheFile.exists())
{
return;
}

var database = new Database(cacheFile, "update bookmarks set name = url where name is null or trim(name) = ''");
}
};
