var gParams = window.arguments[0];

function StartUp()
{
	document.getElementById("name").value = gParams.inn.name;
	document.getElementById("path").value = gParams.inn.path;
	document.getElementById("args").value = gParams.inn.args;

}


// function : <profileSelection.js>::AcceptDialog();
// purpose  : sets the current profile to the selected profile (user choice: "Start Mozilla")
function AcceptDialog()
{
  if (document.getElementById("path").value != null && document.getElementById("path").value != ""){
	var out = {name: document.getElementById("name").value, path: document.getElementById("path").value, args: document.getElementById("args").value};
	gParams.out = out;
  } else {
	gParams.out = null;
  }
  return true;
}

function openFilePicker(event){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;

	var fp = Components.classes["@mozilla.org/filepicker;1"]
				   .createInstance(nsIFilePicker);
	fp.init(window, "Dialog Title", nsIFilePicker.modeOpen);
	if (document.getElementById("path").value != null && document.getElementById("path").value != ""){
		var defaultFile = Components.classes["@mozilla.org/file/local;1"].
						 createInstance(Components.interfaces.nsILocalFile);
		defaultFile.initWithPath(document.getElementById("path").value);
	}
	fp.displayDirectory = defaultFile;
	fp.appendFilters(nsIFilePicker.filterApps);
	fp.appendFilters(nsIFilePicker.filterAll);
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	  var file = fp.file;
	  // Get the path as string. Note that you usually won't 
	  // need to work with the string paths.
	  var path = fp.file.path;
	  // work with returned nsILocalFile...
	  document.getElementById("path").value = path;
	  document.getElementById("name").value = file.leafName.slice(0,file.leafName.lastIndexOf('.'));
	}

}
