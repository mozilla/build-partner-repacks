function StartUp()
{
   var file = Components.classes["@mozilla.org/file/directory_service;1"]  
                    .getService(Components.interfaces.nsIProperties)  
                    .get("ProfD", Components.interfaces.nsIFile);  
	file.append("quicklaunch.sqlite");
	if (!file.exists() || file.fileSize == 0){
		var storageService = Components.classes["@mozilla.org/storage/service;1"]  
                           .getService(Components.interfaces.mozIStorageService);  
		var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
		mDBConn.executeSimpleSQL("CREATE TABLE quicklaunchs (name VARCHAR(32) PRIMARY KEY, path VARCHAR(1024), args VARCHAR(255))");
	}
	DoEnabling();
}


function AcceptDialog()
{
  return true;
}

// invoke the createProfile Wizard
function addQuickLaunch()
{
  var params = {inn:{name:"", path:"", args:""}, out:null};   
  window.openDialog('chrome://quicklaunch/content/editQuickLaunch.xul',
                    'QuickLaunchEdit', 'centerscreen,chrome,modal,titlebar',params);
  if (params.out){
    var file = Components.classes["@mozilla.org/file/directory_service;1"]  
                    .getService(Components.interfaces.nsIProperties)  
                    .get("ProfD", Components.interfaces.nsIFile);  
	file.append("quicklaunch.sqlite");
	var storageService = Components.classes["@mozilla.org/storage/service;1"]  
                .getService(Components.interfaces.mozIStorageService);  
	var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  

	mDBConn.executeSimpleSQL("INSERT INTO quicklaunchs (name,path,args) VALUES('"+params.out.name+"','"+params.out.path+"','"+params.out.args+"')");
	document.getElementById("quicklaunchs").builder.rebuild();
  }else {
		//press cancel, do nothing.
  }
}

// do button enabling based on tree selection
function DoEnabling()
{
  var deleteButton = document.getElementById("deleteButton");
  var renameButton = document.getElementById("renameButton");

  var disabled = document.getElementById("quicklaunch-tree").view.selection.count == 0;
  deleteButton.disabled = disabled;
  renameButton.disabled = disabled;
}


function editQuickLaunch()
{
  var tree = document.getElementById("quicklaunch-tree");
  Application.console.log(tree.currentIndex);
  var params = {inn:{name:tree.view.getCellText(tree.currentIndex,tree.columns.getColumnAt(1)), path:tree.view.getCellText(tree.currentIndex,tree.columns.getColumnAt(2)), args:tree.view.getCellText(tree.currentIndex,tree.columns.getColumnAt(3))}, out:null};   
  window.openDialog('chrome://quicklaunch/content/editQuickLaunch.xul',
                    'QuickLaunchEdit', 'centerscreen,chrome,modal,titlebar',params);
  if (params.out){
    var file = Components.classes["@mozilla.org/file/directory_service;1"]  
                    .getService(Components.interfaces.nsIProperties)  
                    .get("ProfD", Components.interfaces.nsIFile);  
	file.append("quicklaunch.sqlite");
	var storageService = Components.classes["@mozilla.org/storage/service;1"]  
                .getService(Components.interfaces.mozIStorageService);  
	var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  

	mDBConn.executeSimpleSQL("UPDATE quicklaunchs set name='"+params.out.name+"',path='"+params.out.path+"',args='"+params.out.args+"' where name='"+ params.inn.name + "'");
	document.getElementById("quicklaunchs").builder.rebuild();
	return true;
  }else {
		//press cancel, do nothing.
	return false;
  }
  
}

function deleteQuickLaunch(){
  var tree = document.getElementById("quicklaunch-tree");
  var name = tree.view.getCellText(tree.currentIndex,tree.columns.getColumnAt(1));
  var file = Components.classes["@mozilla.org/file/directory_service;1"]  
                  .getService(Components.interfaces.nsIProperties)  
                  .get("ProfD", Components.interfaces.nsIFile);  
  file.append("quicklaunch.sqlite");
  var storageService = Components.classes["@mozilla.org/storage/service;1"]  
                .getService(Components.interfaces.mozIStorageService);  
  var mDBConn = storageService.openDatabase(file); // Will also create the file if it does not exist  
  mDBConn.executeSimpleSQL("DELETE FROM quicklaunchs WHERE name='"+name+"'");
  document.getElementById("quicklaunchs").builder.rebuild();

}

// handle key event on tree
function HandleKeyEvent(aEvent)
{

}

function HandleClickEvent(aEvent)
{
  if (aEvent.button == 0 && aEvent.target.parentNode.view.selection.count != 0 && editQuickLaunch()) {
    
    return true;
  }

  return false;
}
