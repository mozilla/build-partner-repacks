Components.utils.import("resource://blackbird/BlackbirdServices.jsm");

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

var feeds;
var listbox;

function onLoad() {
  feeds = JSON.parse(BlackbirdServices.bbprefs.getCharPref("rssticker.feeds"));
  if (feeds.length > 0) {
	listbox = document.getElementById("rssticker-feeds");
	for (var i=0; i < feeds.length; i++) {
	  listbox.appendItem(feeds[i], feeds[i]);
	}
  }
  document.getElementById("rssticker-remove").disabled = true;
}

function onAccept() {
  BlackbirdServices.bbprefs.setCharPref("rssticker.feeds", JSON.stringify(feeds));
}

function onCancel() {
  if (document.getElementById("blackbird-options-window").instantApply) {
    BlackbirdServices.bbprefs.setCharPref("rssticker.feeds", JSON.stringify(feeds));
  }
}

function onUnload() {
}

function onSelect() {
  document.getElementById("rssticker-remove").disabled = false;
}

function onAddFeed() {
  var check = {};
  var input = {};
  BlackbirdServices.prompt.prompt(window, "Add Feed", "Enter a feed URL", input, null, check);
  listbox.appendItem(input.value, input.value);
  feeds.push(input.value);
}


function onRemoveFeed() {
  for (var i=0; i < feeds.length; i++) {
	if (feeds[i] == listbox.selectedItem.value) {
	  feeds.splice(i, 1);
	  listbox.removeItemAt(listbox.selectedIndex);
	  break;
	}
  }
  document.getElementById("rssticker-remove").disabled = true;
}