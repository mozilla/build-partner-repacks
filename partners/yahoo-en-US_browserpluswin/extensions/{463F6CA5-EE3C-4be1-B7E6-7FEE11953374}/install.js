const APP_DISPLAY_NAME = "FoxyTunes";
const APP_VERSION = "3.5.6.1";
const APP_SHORT_NAME = "foxytunes";
const APP_AUTHOR = "iosart";
const APP_PACKAGE = "/" + APP_AUTHOR + "/" + APP_SHORT_NAME;
const APP_JAR_FILE = APP_SHORT_NAME + ".jar";
const BLD_ID_MOZILLA_MIN = 20040101; // 1.6
const APP_WHERE_MESSAGE = "Install " + APP_DISPLAY_NAME +
				" to your profile folder (OK) or to your program folder (Cancel) ?";
const APP_BUILD_TOO_OLD = APP_DISPLAY_NAME + " " + APP_VERSION 	+
				" must be installed to builds released after " +
				BLD_ID_MOZILLA_MIN + " !";

const APP_CONTENT_FOLDER = "content/";
const APP_LOCALE_FOLDER	 = "locale/";
const APP_LOCALES 	 = ["en-US"];
const APP_SKIN_FOLDER	 = "skin/classic/";

const APP_COMPONENTS_FOLDER	= "components/";
const APP_PLATFORM_FOLDER	= "platform/";
const XPT_FILE_NAME 		= "FoxyTunes.xpt";
const DLL_FILE_NAME	 	= "FoxyTunes.dll";
const MODULE_LOADER_FILE_NAME = "ModuleLoader.js";
const AUTOREG_FILE_NAME = ".autoreg";

function verifyNoError(errorMessage) {
	err = getLastError();

	if (err != SUCCESS) {
		alert(errorMessage + " (" + err + ")");
        	cancelInstall(err);
	}

	return err;
}

function getPlatform() {
	var platformStr;
	if ('platform' in Install) {
		platformStr = new String(Install.platform);
		if (platformStr.search(/Windows/gi) != -1) {
			return "windows";
		}

		if (platformStr.search(/Linux/gi) != -1) {
			return "linux";
		}

		if (platformStr.search(/Mac/gi) != -1) {
			return "mac";
		}
    	}
	return '';
}

function platformSpecificInstall() {
	var platform = getPlatform();

	var componentsDir = getFolder("Components"); 
    var platformFolder = "WINNT/";
    switch (platform) {
        case "linux": platformFolder = "Linux/";
                        break;
        case "mac": platformFolder = "Darwin/";
                    break;
    }
	
    addFile(DLL_FILE_NAME, APP_VERSION, APP_PLATFORM_FOLDER + platformFolder + APP_COMPONENTS_FOLDER + DLL_FILE_NAME, componentsDir, "");  
		if (verifyNoError("Couldn't install " + DLL_FILE_NAME) != SUCCESS) { return false; }
	return true;
}

function preinstallCleanup() {
	initInstall("pre-install-cleanup", "/foxytunes-cleanup", "0.0"); 

	// remove old files if exist

	var oldFile = getFolder("Components", XPT_FILE_NAME); 	
	File.remove(oldFile);

	oldFile = getFolder("Components", DLL_FILE_NAME); 	
	File.remove(oldFile);

    oldFile = getFolder("Components", MODULE_LOADER_FILE_NAME);
    File.remove(oldFile);

	performInstall(); 
}

function perfromInstallation() {
	var err;

	// verify that the Mozilla build is not too old
	var currBuild = new String(buildID).substr(0, 8) - 0;
	if (currBuild && currBuild < BLD_ID_MOZILLA_MIN) {
	   alert(APP_BUILD_TOO_OLD);
   	   cancelInstall(INSTALL_NOT_STARTED);
	   return;
	}

        initInstall(APP_DISPLAY_NAME, APP_SHORT_NAME, APP_VERSION);
	if (verifyNoError("Couldn't init the installation process") != SUCCESS) { return; }

	// install chrome:
	var where, chromef;
	var inProfile = confirm(APP_WHERE_MESSAGE);
	if (inProfile) {
		chromef = getFolder("Profile", "chrome");
		where = PROFILE_CHROME;
   	} else {
		chromef = getFolder("chrome");
		where = DELAYED_CHROME;
   	}

    	addFile(APP_PACKAGE, APP_VERSION, "chrome/" + APP_JAR_FILE, chromef, null);
	err = verifyNoError("Failed to create " + APP_JAR_FILE + "\n" +
		            "You probably don't have appropriate permissions \n" +
		            "(write access to " + (inProfile ? "profile" : "browser") + "/chrome directory). \n"); 
	if (err != SUCCESS) { return; }

	var jar = getFolder(chromef, APP_JAR_FILE);

	registerChrome(CONTENT | where, jar, APP_CONTENT_FOLDER);
	if (verifyNoError("Couldn't register " + APP_CONTENT_FOLDER + " folder") != SUCCESS) { return; }

    // register the default (fallback) locale:
	registerChrome(LOCALE  | where, jar, APP_CONTENT_FOLDER + 'locale/en-US/');
    // register all the other locales
  	for (var iLocale=0; iLocale < APP_LOCALES.length; iLocale++) {
	 	var localeFolder = APP_LOCALE_FOLDER + APP_LOCALES[iLocale] + "/";
		registerChrome(LOCALE  | where, jar, localeFolder);
		if (verifyNoError("Couldn't register " + localeFolder + " folder") != SUCCESS) { return; }
  	}

	registerChrome(SKIN    | where, jar, APP_SKIN_FOLDER);
	if (verifyNoError("Couldn't register " + APP_SKIN_FOLDER + " folder") != SUCCESS) { return; }

	// install XPCOM components:
	var componentsDir = getFolder("Components"); 

	addFile(XPT_FILE_NAME, APP_VERSION, APP_COMPONENTS_FOLDER + XPT_FILE_NAME, componentsDir, "");  
	if (verifyNoError("Couldn't install " + XPT_FILE_NAME) != SUCCESS) { return; }

    addFile(MODULE_LOADER_FILE_NAME, APP_VERSION, APP_COMPONENTS_FOLDER + MODULE_LOADER_FILE_NAME, componentsDir, "");  
	if (verifyNoError("Couldn't install " + MODULE_LOADER_FILE_NAME) != SUCCESS) { return; }


	if (!platformSpecificInstall()) {
		return;
	}

    var programDir = getFolder("Program");
	addFile(AUTOREG_FILE_NAME, APP_VERSION, APP_COMPONENTS_FOLDER + AUTOREG_FILE_NAME, programDir, "");  

    File.remove(getFolder("Components", "xpti.dat"));
    File.remove(getFolder("Components", "compreg.dat"));

    performInstall();

	err = getLastError();
	if (err == SUCCESS) {
            alert(APP_DISPLAY_NAME + " version " + APP_VERSION + " has been successfully installed to your " +
	               (inProfile?"profile":"program") + " folder.\n\n" +
		       "Please, restart the browser before continuing!");
      	} else {
		if (err == REBOOT_NEEDED) {
			alert("Install failed because a previous version of " + 
					APP_DISPLAY_NAME + " has not been uninstalled.");
		} else {
			alert("Install failed! Error code:" + err);
		}
		cancelInstall(err);
      	}
}

// perfrom some clean up before installing
preinstallCleanup();

// Call the main installation function
perfromInstallation();
