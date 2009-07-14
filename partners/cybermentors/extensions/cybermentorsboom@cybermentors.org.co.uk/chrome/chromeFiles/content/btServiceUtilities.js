function finalUIStartup(brandObject) {
  this.installXPIs(brandObject);
}
function profileAfterChange(brandObject) {
  /* If we are switching to big boom, set the theme to classic */
  try {
	if (gPrefBranch.getBoolPref("extensions.brandthunder.bigBoom") == true) {
	  gPrefBranch.setCharPref("general.skins.selectedSkin", "classic/1.0");
	}
  } catch (ex) {}
}
function  profileBeforeChange(brandObject) {
  var skinSwitchPending = gPrefBranch.getBoolPref("extensions.dss.switchPending");
	if (skinSwitchPending) {
	  gPrefBranch.setBoolPref("extensions.brandthunder.bigBoom", false);
  }
  try {
	gPrefBranch.clearUserPref("general.useragent.extra.brandthunder");
  } catch (ex) {}
  try {
	/* Don't clear the keywordURL pref if we weren't the ones who set it */
	var keywordURL = gPrefBranch.getCharPref("keyword.URL");
	if (keywordURL.match("chrff-brandt_off")) {
	  gPrefBranch.clearUserPref("keyword.URL");
	}
  } catch (ex) {}
}
function firstRun (brandObject) {
  function getVersionFromExtension(extfile) {
	var zipReader = Cc["@mozilla.org/libjar/zip-reader;1"]
							  .createInstance(Ci.nsIZipReader);
	try {
	  zipReader.init(extfile);
	  zipReader.open();
	} catch(ex) {
	  zipReader.open(extfile);
	}
	var tempfile = Cc["@mozilla.org/file/directory_service;1"]
							 .getService(Ci.nsIProperties)
							 .get("TmpD", Ci.nsIFile);
	tempfile.append("install.rdf");
	tempfile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0600);
	zipReader.extract("install.rdf", tempfile);
	zipReader.close();
	var ioServ = Cc["@mozilla.org/network/io-service;1"]
						   .getService(Ci.nsIIOService);
	var fph = ioServ.getProtocolHandler("file")
					.QueryInterface(Ci.nsIFileProtocolHandler);

	var fileURL = fph.getURLSpecFromFile(tempfile);
	var RDF = Cc["@mozilla.org/rdf/rdf-service;1"]
						 .getService(Ci.nsIRDFService);
	var InstallManifestRoot = RDF.GetResource("urn:mozilla:install-manifest");
	var ds = RDF.GetDataSourceBlocking(fileURL);
	var target = ds.GetTarget(InstallManifestRoot,
							  RDF.GetResource("http://www.mozilla.org/2004/em-rdf#version"), true);
	return target.QueryInterface(Ci.nsIRDFLiteral).Value;
  }
  function extensionEnabled(extensionID) {
	var rdfs = Cc["@mozilla.org/rdf/rdf-service;1"]
						 .getService(Ci.nsIRDFService);
	var extensionDS= Cc["@mozilla.org/extensions/manager;1"]
							   .getService(Ci.nsIExtensionManager).datasource;
	var extension = rdfs.GetResource("urn:mozilla:item:" + extensionID);

	var arc = rdfs.GetResource("http://www.mozilla.org/2004/em-rdf#userDisabled");
	var userDisabled = extensionDS.GetTarget(extension, arc, true);
	if (userDisabled) {
	  userDisabled = userDisabled.QueryInterface(Ci.nsIRDFLiteral).Value;
	  return (userDisabled == false);
	}
	return true;
  }
  function extensionGetHomePage(extensionID) {
	var rdfs = Cc["@mozilla.org/rdf/rdf-service;1"]
						 .getService(Ci.nsIRDFService);
	var extensionDS= Cc["@mozilla.org/extensions/manager;1"]
							   .getService(Ci.nsIExtensionManager).datasource;
	var extension = rdfs.GetResource("urn:mozilla:item:" + extensionID);

	var arc = rdfs.GetResource("http://www.mozilla.org/2004/em-rdf#homepageURL");
	var homePage = extensionDS.GetTarget(extension, arc, true);
	if (homePage) {
	  homePage = homePage.QueryInterface(Ci.nsIRDFLiteral).Value;
	  return homePage;
	}
	return "";
  }

  var firstrun = true;

  var btClientPrefBranch = Cc["@mozilla.org/preferences-service;1"]
							   .getService(Ci.nsIPrefService)
							   .getBranch("extensions.brandthunder." + brandObject.clientCode + ".");

  var btPrefBranch = Cc["@mozilla.org/preferences-service;1"]
						   .getService(Ci.nsIPrefService)
						   .getBranch("extensions.brandthunder.");

  try{
	firstrun = btClientPrefBranch.getBoolPref("firstrun");
	if (firstrun == false) {
	  /* What if firstrun was set for previous toolbar? if so, check for boom prefs */
	  try {
		btPrefBranch.getCharPref("currentBoom");
		return;
	  } catch (ex) {
		btClientPrefBranch.setBoolPref("firstrun", false);
		/* If currentBoom wasn't set, this is a first run from a toolbar, not a boom */
	  }
	}
  } catch(e) {
  //nothing
  }

  /* For first run, set the theme to classic,
	 set the currentBoom, and set big boom */
  
  gPrefBranch.setCharPref("general.skins.selectedSkin", "classic/1.0");

  var initialBoom;

  var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"]
								.getService(Components.interfaces.nsICookieManager);

  var e = cookieManager.enumerator;
  while (e.hasMoreElements()) {
	var cookie = e.getNext();
	if (cookie && cookie instanceof Components.interfaces.nsICookie) {
	  if ((cookie.host == "brandthunder.com") || (cookie.host == ".brandthunder.com")) {
		if (cookie.name == brandObject.shortName) {
		  initialBoom = cookie.value;
		  cookieManager.remove(cookie.domain, cookie.name, cookie.path, false);
		  break;
		}
	  }
	}
  }

  if (!initialBoom) {
	for (let i in brandObject.booms) {
	  initialBoom = i;
	  break; 
	}
  }

  btPrefBranch.setCharPref("currentBoom", initialBoom);


  btPrefBranch.setBoolPref("bigBoom", true);

  var em = Cc["@mozilla.org/extensions/manager;1"]
					 .getService(Ci.nsIExtensionManager);
  
  /* Before we do anything, uninstall old CCK */
  /* Set a pref which indicates we are upgrading from an old version */
  if (brandObject.cckID) {
	if (em.getInstallLocation(brandObject.cckID)) {
	  btClientPrefBranch.setBoolPref("upgrade", true);
	  em.uninstallItem(brandObject.cckID);
	}
  }

  /* If we have a themeID, uninstall the old theme */
  if (brandObject.themeID) {
	if (em.getInstallLocation(brandObject.themeID)) {
	  em.uninstallItem(brandObject.themeID);
	}
  }

  /* Disable old toolbars */
	var oldToolbars = ["nlttoolbar@nltmusic.com",
					   "washcapstoolbar@washingtoncaps.com",
					   "osutoolbar@coachtressel.com",
					   "hufftoolbar@huffingtonpost.com",
					   "starpulsetoolbar@starpulse.com",
					   "dynastytoolbar@dynastyreps.com",
					   "juliannehoughtoolbar@juliannehough.com",
					   "sugarlandtoolbar@sugarlandmusic.com"];

  for (let i = 0; i < oldToolbars.length; i++) {
	if (oldToolbars[i] != brandObject.extensionID) {
	  if (em.getInstallLocation(oldToolbars[i])) {
		if (extensionEnabled(oldToolbars[i])) {
		  em.disableItem(oldToolbars[i]);
		}
	  }
	}
  }

  /* Disable old CCKs */
  var oldCCKs = ["nltcck@nltmusic.com",
				 "osucck@coachtressel.com",
				 "washcapscck@washingtoncaps.com"];

  for (let i = 0; i < oldCCKs.length; i++) {
	if (oldCCKs[i] != brandObject.cckID) {
	  if (em.getInstallLocation(oldCCKs[i])) {
		if (extensionEnabled(oldCCKs[i])) {
		  em.disableItem(oldCCKs[i]);
		}
	  }
	}
  }


  /* Disable any other brand thunder extensions by enumerating through */
  /* all extensions and looking for http://brandthunder.com */
  /* ugly I know */
  var items = em.getItemList(Ci.nsIUpdateItem.TYPE_EXTENSION, {});

  for (var i = 0; i < items.length; i++) {
	if (items[i].id != brandObject.extensionID) {
	  if (extensionEnabled(items[i].id)) {
		if (extensionGetHomePage(items[i].id).match("brandthunder.com") &&
			(!extensionGetHomePage(items[i].id).match("boom"))) {
		  em.disableItem(items[i].id);
		}
	  }
	}
  }
}

function installXPIs(brandObject) {
  var items_installed = false;
  var em = Cc["@mozilla.org/extensions/manager;1"]
					 .getService(Ci.nsIExtensionManager);

  try {
    var extdir = em.getInstallLocation(brandObject.extensionID)
					 .getItemLocation(brandObject.extensionID);
  } catch (ex) {
	return;
  }

  var e = extdir.directoryEntries;
  while (e.hasMoreElements()) {
	var f = e.getNext().QueryInterface(Components.interfaces.nsIFile);
	var splitpath = f.path.split(".");
	/* Only load XPI files */
	if (splitpath[splitpath.length-1] == "xpi") {
	  em.installItemFromFile(f, "app-profile");
	  items_installed = true;
	  try {
        f.remove(true);
	  } catch (ex) {
		/* Ignore error - it's already gone */
		/* This happens on FF2 in some cases for some reason */
	  }
	}
  }
  if (items_installed) {
	    var nsIAppStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                                        .getService(Components.interfaces.nsIAppStartup);
    nsIAppStartup.quit(nsIAppStartup.eRestart | nsIAppStartup.eAttemptQuit);    

  }
}
