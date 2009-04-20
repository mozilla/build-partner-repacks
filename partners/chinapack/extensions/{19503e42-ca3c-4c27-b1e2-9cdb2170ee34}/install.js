const APP_DISPLAY_NAME = "FlashGot";
const APP_NAME = "flashgot";
const APP_PACKAGE = "/informaction/flashgot";
const APP_VERSION = "1.1.8";

const APP_PREFS_FILE="defaults/preferences/flashgot.js";
const APP_XPCOM_SERVICE="components/flashgotService.js";
const APP_JAR_FILE = "flashgot.jar";
const APP_CONTENT_FOLDER = "content/flashgot/";
const APP_LOCALES = [
  "it-IT","th-TH","de-DE","nl-NL", 
  "ru-RU","es-ES","es-AR", "es-CL", // "ms-MY",
  "hu-HU", "sv-SE","fr-FR", "fi-FI",
  "he-IL","tr-TR","sr-YU", "ca-AD",
  "zh-TW","zh-CN","el-GR", "uk-UA",
  "lt-LT","ja-JP","pl-PL", "hr-HR",
  "id-ID","cs-CZ","ko-KR", "be-BY",
  "nb-NO","ro-RO","sk-SK",
  "fa-IR","sl-SI","ar-JO",
  "bg-BG","da-DK","pt-BR",
  "pt-PT","sq-AL",
  "am-HY","ar","ar-SA","hi-IN","km-KH",
  "mn-MN","vi-VN","gl-ES",
  "en-US" 
  ];

const APP_SUCCESS_MESSAGE = APP_DISPLAY_NAME+" should now be available in your context menu when you restart Mozilla.";

const INST_TO_PROFILE = "Do you wish to install "+APP_DISPLAY_NAME+" to your profile?\nIf you are in doubt, this is the preferred option: click OK.\n(Click Cancel if you want "+APP_DISPLAY_NAME+" installing to the Mozilla directory.)";


var instToProfile = true;

myPerformInstall(false);

function myPerformInstall(secondTry) {
  
  var err;
  initInstall(APP_NAME, APP_PACKAGE, APP_VERSION);
  
  function chromeExistsIn(folder) {
    var chrome = getFolder(folder, APP_JAR_FILE);
    var isDir = File.isDirectory(chrome);
    if (!isDir) isDir = /\/$/.test(chrome);
    if (isDir)
      File.dirRemove(chrome);  
    return !chrome || !isDir;
  }
  
  if(!secondTry) {  
    // profile installs only work since 2003-03-06
    instToProfile = chromeExistsIn(getFolder("Profile", "chrome")) ||
      !chromeExistsIn(getFolder("chrome")) && 
        buildID > 2003030600 && !!confirm(INST_TO_PROFILE);
  }
  
  var chromef = instToProfile ? getFolder("Profile", "chrome") : getFolder("chrome");
  err = addFile(APP_PACKAGE, APP_VERSION, "chrome/" + APP_JAR_FILE, chromef, null);
  
  if(APP_PREFS_FILE && (err == SUCCESS) ) {
    const prefDirs=[
      getFolder(getFolder("Profile"),"pref"),
      getFolder(getFolder(getFolder("Program"),"defaults"),"pref")
      ];
    for(var j=prefDirs.length; j-->0;) {
      var prefDir=prefDirs[j];
      if(!File.exists(prefDir)) {
        File.dirCreate(prefDir);
      }
      err = addFile(APP_PACKAGE, APP_VERSION,  APP_PREFS_FILE, prefDir, null, true);
      logComment("Adding "+APP_PREFS_FILE+" in "+prefDir+": exit code = "+err);
    }
  }
  
  if(err == SUCCESS) {
    var jar = getFolder(chromef, APP_JAR_FILE);
    const chromeFlag=instToProfile?PROFILE_CHROME:DELAYED_CHROME;
  
    registerChrome(CONTENT | chromeFlag, jar, APP_CONTENT_FOLDER);
    var localesCount=APP_LOCALES.length;
    if(localesCount>0) {
      registerChrome(LOCALE | chromeFlag, jar, "content/flashgot/"+APP_LOCALES[--localesCount]+"/");
      while(localesCount-- >0) {
        registerChrome(LOCALE  | chromeFlag, jar, "locale/"+APP_LOCALES[localesCount]+"/flashgot/");
      }
    }
    registerChrome(SKIN | chromeFlag, jar, "skin/classic/flashgot/");
    
    
    if(APP_XPCOM_SERVICE) {
      var componentsDir = getFolder("Components");
      /*
      if (!(APP_XPCOM_SERVICE instanceof Array)) {
        APP_XPCOM_SERVICE = [APP_XPCOM_SERVICE];
      }
      for (var s = APP_XPCOM_SERVICE.length; s-- > 0;)
        addFile(APP_PACKAGE,APP_VERSION, APP_XPCOM_SERVICE[s], componentsDir, null, true);
      */
      addFile(APP_PACKAGE,APP_VERSION, APP_XPCOM_SERVICE, componentsDir, null, true);
      addFile(APP_NAME, "components/.autoreg", getFolder("Program"), "");
    }
    
    err = performInstall();
    if(err == -239 && !secondTry) {
      alert("Chrome registration problem, maybe transient, retrying...");
      cancelInstall(err);
      myPerformInstall(true);
      return;
    }
    if(err == SUCCESS || err == 999) {
      alert(APP_DISPLAY_NAME+" "+APP_VERSION+" has been succesfully installed in your " + 
          (instToProfile ? "profile" : "browser") +
          ".\n" + APP_SUCCESS_MESSAGE);
    } else {
      var msg = "Install failed!!! Error code:" + err;

      if(err == -239) {
        msg += "\nThis specific error is usually transient:"
          +"\nif you retry to install again, it will probably go away."
      }

      alert(msg);
      cancelInstall(err);
    }
  } else {
    alert("Failed to create " +APP_JAR_FILE +"\n"
      +"You probably don't have appropriate permissions \n"
      +"(write access to your profile or chrome directory). \n"
      +"_____________________________\nError code:" + err);
    cancelInstall(err);
  }
}