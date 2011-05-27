/**
 * This implements the horoscope button on our toolbar in a dropdown.
 * If no sign is selected, the preference dialog is displayed.
 */

var horoscopeButton = null;

var gStringBundle;

function onLoad(event)
{
  horoscopeButton = document.getElementById("united-horoscope-button");
  horoscopeButton.addEventListener("popupshowing", onDropdownOpened, false);
  // compare appendBrandedMenuitems()
  try {
  gStringBundle = new united.StringBundle(
      "chrome://unitedtb/locale/horoscope/horoscope.properties");
  buildTypeMenu();
  } catch (e) { united.debug(e); } // TODO

  var entry = {};
  entry.url = united.brand.horoscope.horoscopeURL;
  horoscopeButton.entry = entry;
};
window.addEventListener("load", onLoad, false);

function buildTypeMenu()
{
  var menu = document.getElementById("united-horoscope-button-dropdown");
  united.cleanElement(menu);
  var menuitems = ["tag","woche","monat","jahr","liebe","partnertest","typologie"];
  for (let i=0; i < menuitems.length; i++)
  {
    let menuitem = document.createElement("menuitem");
    menuitem.setAttribute("value", menuitems[i]);
    menuitem.setAttribute("label", gStringBundle.getString(menuitems[i]));
    var entry = {};
    entry.url = united.brand.horoscope.horoscopeURL.replace("{TYPE}",menuitems[i]);
    menuitem.entry = entry;
    menu.appendChild(menuitem);
  }
  let menuitem = document.createElement("menuitem");
  menuitem.setAttribute("label", gStringBundle.getString("more"));
  var entry = {};
  entry.url = united.brand.horoscope.moreURL;
  menuitem.entry = entry;
  menu.appendChild(menuitem);
}

function onDropdownOpened(event)
{
  if (!united.ourPref.isSet("horoscope.sign"))
  {
    united.openPrefWindow("horoscope");
    event.preventDefault();
  }
}

/**
 * @param entry {Object}  one element of united.brand.horoscope.dropdownURLEntries
 */
function onItemClicked(entry)
{
  var partnertestMapping = {
    "widder": 1,
    "stier": 2,
    "zwillinge": 3,
    "krebs": 4,
    "loewe": 5,
    "jungfrau": 6,
    "waage": 7,
    "skorpion": 8,
    "schuetze": 9,
    "steinbock": 10,
    "wassermann": 11,
    "fische": 12
  };

  if (!united.ourPref.isSet("horoscope.sign"))
  {
    united.openPrefWindow("horoscope");
    // If they chose not to select a sign, return
    if (!united.ourPref.isSet("horoscope.sign"))
    {
      return;
    }
  }

  var type = united.ourPref.get("horoscope.type");
  var sign = united.ourPref.get("horoscope.sign");
  var url = entry.url.replace("{TYPE}", type);
  if (sign == "none")
  {
    url = url.replace("{SIGN}", "")
  }
  else
  {
    url = url.replace("{SIGN}", sign)
  }
  if (url.match("partnertest"))
  {
    if (!united.ourPref.isSet("horoscope.sign.partner") || !united.ourPref.isSet("horoscope.gender"))
    {
      united.openPrefWindow("horoscope");
      // If they chose not to fill in the data we need, just return
      if (!united.ourPref.isSet("horoscope.sign.partner") || !united.ourPref.isSet("horoscope.gender"))
      {
        return;
      }

    }
    try {
      var webnav = window.gBrowser.webNavigation;
      united.assert(webnav instanceof Ci.nsIWebNavigation);
      var flags = Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_HISTORY;
      var partnersign = united.ourPref.get("horoscope.sign.partner");
      var gender = united.ourPref.get("horoscope.gender");
      // z = male, rz = female
      var z, rz;
      if (gender == "male")
      {
        z = partnertestMapping[sign];
        rz = partnertestMapping[partnersign];
      }
      else
      {
        rz = partnertestMapping[sign];
        z = partnertestMapping[partnersign];
      }
      if (z && rz) {
        webnav.loadURI(united.brand.horoscope.partnertestURL, flags, null,
            createPostDataFromString("z=" + z + "&rz=" + rz, "application/x-www-form-urlencoded"), null);
      } else {
        united.loadPage(united.brand.horoscope.horoscopeURL.replace("{SIGN}", "").replace("{TYPE}", "partnertest"), "tab");
      }
    } catch (e) {
      united.error(e);
      united.loadPage(united.brand.horoscope.horoscopeURL.replace("{SIGN}", sign).replace("{TYPE}", "partnertest"), "tab");
    }
  }
  else
  {
    united.loadPage(url, "tab");
  }
}

// <copied from="email.js">
/**
 * Takes a JavaScript string and MIME-Type and creates and nsIInputStream
 * suitable for passing to webnavigation.loadURI().
 * @param uploadBody {String}
 * @param mimetype {String}
 */
function createPostDataFromString(uploadBody, mimetype)
{
  var stringStream = Cc["@mozilla.org/io/string-input-stream;1"]
      .createInstance(Ci.nsIStringInputStream);
  stringStream.data = uploadBody;
  var postData = Cc["@mozilla.org/network/mime-input-stream;1"]
      .createInstance(Ci.nsIMIMEInputStream);
  postData.addHeader("Content-Type", mimetype);
  postData.addContentLength = true;
  postData.setData(stringStream);
  return postData;
}
// </copied>
