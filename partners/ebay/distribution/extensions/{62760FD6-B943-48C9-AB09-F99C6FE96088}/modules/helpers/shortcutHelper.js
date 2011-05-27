/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */EXPORTED_SYMBOLS=["ShortcutHelper"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;const PR_PERMS_DIRECTORY=0755;const MAC_ICNS_FILE="ebay.icns";const WIN_ICO_FILE="ebay.ico";var ShortcutHelper={_init:function(){try{Cu.import("resource://ebaycompanion/helpers/logger.js");Cu.import("resource://ebaycompanion/helpers/timer.js");Cu.import("resource://ebaycompanion/helpers/fileIOHelper.js");Cu.import("resource://ebaycompanion/constants.js");Cu.import("resource://glaxebay/gsCommon.js");this._copyIcon();}
catch(e){Logger.exception(e);}},_copyIcon:function(){let iconFile=Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD",Ci.nsIFile);iconFile.append("eBay Inc");iconFile.append(WIN_ICO_FILE);if(!iconFile.exists()){let copied=false;if(Constants.isFirefox4){copied=Constants.extractFileFromZip(WIN_ICO_FILE,WIN_ICO_FILE);}
if(!copied){let defaultFile=Constants.getDefaultsFolder(Constants.extensionId);defaultFile.append(WIN_ICO_FILE);defaultFile.copyTo(iconFile.parent,iconFile.leafName);}}},createShortcut:function(){let dirSvc=Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);let target=dirSvc.get("XREExeF",Ci.nsIFile);let parameters="-ebayComp";if(target.leafName.search("-bin")!=-1){let target_shell=target.parent;target_shell.append(target.leafName.replace("-bin",""));if(target_shell.exists()){target=target_shell;}}
let name=Constants.stringBundle.getString("extensions.{62760FD6-B943-48C9-AB09-F99C6FE96088}.name");let desk=dirSvc.get("Desk",Ci.nsIFile);let appIcon=Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD",Ci.nsIFile);appIcon.append("eBay Inc");switch(Constants.getOperatingSystem()){case"WINDOWS":case"VISTA":case"WIN7":appIcon.append(WIN_ICO_FILE);let shortcutScript=this._generateShortcutScript(target.path,name,appIcon.path,parameters);let cscript=Cc["@mozilla.org/file/local;1"]
.createInstance(Ci.nsILocalFile);cscript.initWithPath("C:\\Windows\\System32\\cscript.exe");let process=Cc["@mozilla.org/process/util;1"]
.createInstance(Ci.nsIProcess);process.init(cscript);let args=["//B",shortcutScript.path];process.run(false,args,args.length);new Timer(function(){try{shortcutScript.remove(false);}catch(e){Logger.exception(e);}},20000,Timer.TYPE_ONE_SHOT);break;default:break;}},_generateShortcutScript:function(aTarget,aName,aIcon,aParameters){let tempFile=GlaxEbay.getProfileDirectory();tempFile.append("shortcutTempScript.js");aTarget=aTarget.replace(/\\/g,"\\\\");aIcon=aIcon.replace(/\\/g,"\\\\");let data="var WshShell = WScript.CreateObject(\"WScript.Shell\");\n"+
"strDesktop = WshShell.SpecialFolders(\"Desktop\");\n"+
"var oShellLink = WshShell.CreateShortcut(strDesktop + \"\\\\"+aName+".lnk\");\n"+
"oShellLink.TargetPath = \""+aTarget+"\";\n"+
"oShellLink.WindowStyle = 1;\n"+
"oShellLink.IconLocation = \""+aIcon+", 0\";\n"+
"oShellLink.Description = \""+aName+"\";\n"+
"oShellLink.WorkingDirectory = strDesktop;\n"+
"oShellLink.Arguments = \""+aParameters+"\";\n"+
"oShellLink.Save();";FileIOHelper.stringToFile(data,tempFile,0755);return tempFile;},_createBundle:function(aTarget,aName,aIcon,aLocation,aParameters){let contents="<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"+
"<!DOCTYPE plist PUBLIC \"-//Apple Computer//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n"+
"<plist version=\"1.0\">\n"+
"<dict>\n"+
"<key>CFBundleExecutable</key>\n"+
"<string>"+aName+"</string>\n"+
"<key>CFBundleIconFile</key>\n"+
"<string>"+aIcon.leafName+"</string>\n"+
"</dict>\n"+
"</plist>";aLocation.append(aName+".app");if(aLocation.exists())
aLocation.remove(true);aLocation.create(Ci.nsIFile.DIRECTORY_TYPE,PR_PERMS_DIRECTORY);let bundle=aLocation.clone();aLocation.append("Contents");aLocation.create(Ci.nsIFile.DIRECTORY_TYPE,PR_PERMS_DIRECTORY);let info=aLocation.clone();info.append("Info.plist");FileIOHelper.stringToFile(contents,info);let resources=aLocation.clone();resources.append("Resources");resources.create(Ci.nsIFile.DIRECTORY_TYPE,PR_PERMS_DIRECTORY);aIcon.copyTo(resources,aIcon.leafName);let macos=aLocation.clone();macos.append("MacOS");macos.create(Ci.nsIFile.DIRECTORY_TYPE,PR_PERMS_DIRECTORY);let cmd="#!/bin/sh\nexec \""+aTarget.path+"\" "+aParameters;let script=macos.clone();script.append(aName);FileIOHelper.stringToFile(cmd,script,0755);return bundle;},_createLinuxShortcut:function(aTarget,aName,aLocation,aParameters){let cmd="#!/bin/sh\nexec \""+aTarget.path+"\" "+aParameters;let script=aLocation.clone();script.append(aName);FileIOHelper.stringToFile(cmd,script,0755);}};ShortcutHelper._init();