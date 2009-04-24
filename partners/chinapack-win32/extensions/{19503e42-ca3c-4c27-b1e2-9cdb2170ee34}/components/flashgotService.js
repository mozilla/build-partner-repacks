/***** BEGIN LICENSE BLOCK *****

    FlashGot - a Firefox extension for external download managers integration
    Copyright (C) 2004-2009 Giorgio Maone - g.maone@informaction.com

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
                             
***** END LICENSE BLOCK *****/

const CI = Components.interfaces;
const CC = Components.classes;
const NS_BINDING_ABORTED = 0x804b0002;


// Utilities

function Strings(chromeName) {
  this.chromeName = chromeName;
}

Strings.wrap = function(s, length, sep) {
  if (!sep) sep = ' ';
    
  function wrapPara(p) {
    if (!length) length = 80;
    if (p.length <= length) return p;
    chunks = [];
    var pos;
    while (p.length > length) {
      pos = p.lastIndexOf(sep, length);
      if (pos < 0) pos = p.indexOf(sep, length);
      if (pos < 0) break;
      chunks.push(p.substring(0, pos));
      p = p.substring(pos + 1);
    }

    if (chunks.length) {
      res  = chunks.join("\n");
      if (p.length) res += "\n" + p;
      return res;
    } else return p;
  }
  if (typeof(s) != "string") s = s.toString();
  var paras = s.split("\n");
  
  for (var j = 0; j < paras.length; j++) paras[j] = wrapPara(paras[j]);
  return paras.join("\n");
}

Strings.prototype = {
  bundles: {},
  getBundle: function(path) {
    if (path in this.bundles) return this.bundles[path];
    try {
      return this.bundles[path] = 
        CC["@mozilla.org/intl/stringbundle;1"]
                  .getService(CI.nsIStringBundleService)
                  .createBundle("chrome://" + this.chromeName +  "/" + path +
                                "/" + this.chromeName + ".properties");
    } catch(ex) {
      return this.bundles[path] = null;
    }
  },
  
 
  _stringFrom: function(bundle, name, parms) {
    try {
      return parms ? bundle.formatStringFromName(name, parms, parms.length) : bundle.GetStringFromName(name);
    } catch(ex) {
      return null;
    }
  }
,
  getString: function(name, parms) {
    var s=this._stringFrom(this.getBundle("locale"), name, parms);
    return s || this._stringFrom(this.getBundle("content/en-US"), name, parms) || name;
  }
  
};

var DOMUtils = {
  getDocShellFromWindow: function(window) {
    try {
      return window.QueryInterface(CI.nsIInterfaceRequestor)
                   .getInterface(CI.nsIWebNavigation)
                   .QueryInterface(CI.nsIDocShell);
    } catch(e) {
      return null;
    }
  },
  getChromeWindow: function(window) {
    try {
      return this.getDocShellFromWindow(window)
        .QueryInterface(CI.nsIDocShellTreeItem).rootTreeItem
        .QueryInterface(CI.nsIInterfaceRequestor)
        .getInterface(CI.nsIDOMWindow).top;
    } catch(e) {
      return null;
    }
  },
  updateStyleSheet: function(sheet, enabled) {
    
    const sssClass = CC["@mozilla.org/content/style-sheet-service;1"];
    if (!sssClass) return;
      
    const sss = sssClass.getService(CI.nsIStyleSheetService);
    const uri = CC['@mozilla.org/network/io-service;1'].getService(CI.nsIIOService)
        .newURI("data:text/css," + sheet, null, null);
    if (sss.sheetRegistered(uri, sss.USER_SHEET)) {
      if (!enabled) sss.unregisterSheet(uri, sss.USER_SHEET);
    } else {
      try {
        if (enabled) sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
      } catch(e) {
        dump("Error registering stylesheet " + uri + ": " + e + "\n"); 
      }
    }
  },
  
  _wm: null,
  get windowMediator() {
    return this._wm || (this._wm = 
        CC['@mozilla.org/appshell/window-mediator;1']
                  .getService(CI.nsIWindowMediator));
  },
  
  _winType: null,
  perWinType: function(delegate) {
    var wm = this.windowMediator;
    var w = null;
    var aa = Array.prototype.slice.call(arguments);
    for each(var type in ['navigator:browser', 'emusic:window', 'Songbird:Main']) {
     aa[0] = type;
      w = delegate.apply(wm, aa);
      if (w) {
        this._winType = type;
        break;
      }
    }
    return w;
  },
  get mostRecentBrowserWindow() {
    var res = this._winType && this.windowMediator.getMostRecentWindow(this._winType, true);
    return res || this.perWinType(this.windowMediator.getMostRecentWindow, true);
  },
  get windowEnumerator() {
    var res = this._winType && this.windowMediator.getZOrderDOMWindowEnumerator(this._winType, true);
    return res || this.perWinType(this.windowMediator.getZOrderDOMWindowEnumerator, true);
  }
};

// *****************************************************************************
// START DMS CLASSES
// *****************************************************************************

const ASK_NEVER = [false, false, false];

// *** Base/Windows DMS ********************************************************
function FlashGotDM(name) {
  if (arguments.length > 0) {
    this._init(name);
  }
}

FlashGotDM.init = function(service) {
  FlashGotDM.dms = [];
  FlashGotDM.dmtests = {};
  FlashGotDM.executables = {};
  FlashGotDM.deleteOnExit = [];
  FlashGotDM.deleteOnUninstall = [];
  FlashGotDM.initDMS(service);
};

FlashGotDM.cleanup = function(uninstalling) {
  var trash = [].concat(FlashGotDM.deleteOnExit);
  if (uninstalling) trash = trash.concat(FlashGotDM.deleteOnUninstall);
  for each (var f in trash) {
    if (f instanceof CI.nsIFile) {
      try { f.remove(true); } catch(ex) {}
    }
  }
};

FlashGotDM.prototype = {
  _init: function(name) {
    this.name = name;
    const dms = FlashGotDM.dms;
    var pos = dms.length;
    if (name in dms) {
      var other = dms[name];
      for (var j = pos; j-- > 0;) {
        if (dms[j] == other) {
          pos = j;
          break;
        }
      }
    }
    dms[name] = dms[pos] = this;
  }
,
  _service: null,
  _cookieManager: null,
  _exeFile: false,
  _supported: null,
  custom: false,
  disabledLink: false,
  disabledSel: false,
  disabledAll: false,
  exeName: "FlashGot.exe",
  askPath: ASK_NEVER,
  cookieSupport: true,
  postSupport: false,
  priority: ""
,  
  _codeName: null,
  get codeName() {
    return this._codeName || (this._codeName = this.name.replace(/\W/g,"_"));
  },
  
  getPref: function(name, def) {
    return this.service.getPref("dmsopts." + this.codeName + "." + name, def);
  },
  setPref: function(name, value) {
    this.service.setPref("dmsopts." + this.codeName + "." + name, value);
  },
  
  get asciiFilter() {
    return this.getPref("asciiFilter", false);
  },
  
  get shownInContextMenu() {
    return this.getPref("shownInContextMenu", false);
  },
  set shownInContextMenu(b) {
    this.setPref("shownInContextMenu", b);
    return b;
  }
,
  get service() {
    return this._service || (this._service =
      CC[SERVICE_CTRID].getService(CI.nsISupports).wrappedJSObject);
  }
,
  get cookieManager() {
    return this._cookieManager ? this._cookieManager : this._cookieManager =
      CC["@mozilla.org/cookiemanager;1"
        ].getService(CI.nsICookieManager);
  }
,
  get exeFile() {
    if (typeof(this._exeFile) == "object") return this._exeFile;
    const exeName = this.exeName;
    if (!exeName) return this._exeFile = null;
    if (typeof(FlashGotDM.executables[exeName]) == "object") {
      return this._exeFile = FlashGotDM.executables[exeName];
    }
    try {
      var exeFile = this.service.profDir.clone();
      exeFile.append(exeName);
      this._exeFile = this.checkExePlatform(exeFile);
      if(this._exeFile) {
        FlashGotDM.deleteOnUninstall.push(this._exeFile);
        if (this.createExecutable()) {
          this.log(this._exeFile.path + " created");
        }
      }
    } catch(ex) {
      this._exeFile=null;
      this.log("Can't init " + exeName + ":\n" + ex.message);
    }
    return FlashGotDM.executables[exeName] = this._exeFile;
  }
,
  checkExePlatform: function(exeFile) {
    
    var path = exeFile.path;
    if (/\/.*\.exe/.test(path)) {
      if (!(this.service.getPref("useWine", true) || this.name == this.service.defaultDM))
        return null;
      
      if(!FlashGotDM.wine) {
        // check for wine
        var wine = CC["@mozilla.org/file/local;1"].createInstance(CI.nsILocalFile);
        var winePaths = this.service.getPref("wine.paths", "/usr/bin/wine:/usr/local/bin/wine:/opt/local/bin/wine:/Applications/Darwine/Wine.bundle/Contents/bin/wine");
        if (!winePaths) return null;
        
        for each(var winePath in winePaths.split(/[;:,]+/)) {
          try {
            wine.initWithPath(winePath);
            if(wine.exists()) {
              FlashGotDM.wine = wine;
              break;
            }
          } catch(e) {}
        }
        if(!FlashGotDM.wine) return null;
        FlashGotDM.wineExecutables = [];
      }
      FlashGotDM.wineExecutables.push(exeFile);
      return exeFile;
    }
    if (FlashGotDMMac.isMac) return null;
    return /\\.*\.sh$/i.test(path) ? null : exeFile;
  }
,
  get supported() {
    if (typeof(this._supported) == "boolean") return this._supported;
    if (this.customSupportCheck) {
      return this._supported = this.customSupportCheck();
    }
    return this.baseSupportCheck();
  },
  
  baseSupportCheck: function() {
    if (!this.exeName) return true;
    if (!this.exeFile) return false;
    
    var dmtest;
    if (typeof(FlashGotDM.dmtests[this.exeName]) != "string") {
      const dmtestFile = this.service.tmpDir.clone();
      dmtestFile.append(this.exeName + ".test");
      try {
        if (dmtestFile.exists()) {
          try { dmtestFile.remove(false); } catch(rex) {}
        }
        this.launchSupportTest(dmtestFile);
        this.log(dmtest = this.service.readFile(dmtestFile)); 
      } catch(ex) {
        this.log(ex.message);
        dmtest = "";
      }
      FlashGotDM.dmtests[this.exeName] = dmtest;
    } else dmtest = FlashGotDM.dmtests[this.exeName];
    return this._supported = dmtest.indexOf(this.name+"|OK")>-1;
  }
,
  readWinRegString: function(hkroot, hkpath, hk) {
    if (!hk) hk = "";
    var key, ret = null;
    if ("@mozilla.org/windows-registry-key;1" in CC) {  // Firefox 1.5 or newer
      key = CC["@mozilla.org/windows-registry-key;1"].createInstance(CI.nsIWindowsRegKey);
      key.open(key["ROOT_KEY_" + hkroot], hkpath, key.ACCESS_READ);
      ret = key.readStringValue(hk);
      key.close();
    } else {
      hkroot = hkroot.replace(/^([A-Z])*_(A_Z).*$/, "HK$1$2"); // CURRENT_USER -> HKCU
      if ("@mozilla.org/winhooks;1" in CC) {	// SeaMonkey or other older non-toolkit application
        key = CC["@mozilla.org/winhooks;1"].getService(CI.nsIWindowsRegistry);
      } else if ("@mozilla.org/browser/shell-service;1" in CC) {
        key = CC["@mozilla.org/browser/shell-service;1"].getService(CI.nsIWindowsShellService)
          && ("getRegistryEntry" in key);
      }
      if (key) key.getRegistryEntry(key[hkroot], hkpath, hk);
    }
    return ret;
  }
,
  launchSupportTest: function (testFile) {
    this.runNative(["-o", testFile.path], true);
  },
  
  shouldList: function() {
    return this.supported;
  }
,
  log: function(msg) {
    this.service.log(msg);
  }
,
  updateProgress: function(links, idx, len) {
    if (!links.progress) return;
    if ((idx % 100) == 0) {
      if (!len) {
        links.progress.update(100);
        return;
      }
      links.progress.update(70 + 29 * idx / len);
    }
  }
,
  isValidLink: null
,
  createJobHeader: function(links, opType) {
    return links.length+";" + this.name + ";" +
      (this.service.getPref(this.codeName + ".quiet." + opType, false)
        ? this.service.OP_QET : opType)
      + ";" + links.folder + ";\n"
  }
,
  createJobBody: function(links) {
    var jobLines = [];
    var postData = links.postData || "";
 
    for (var j = 0, len = links.length, l; j < len; j++) {
      jobLines.push((l = links[j]).href,
           l.description,
           this.getCookie(l, links),
           postData);
      this.updateProgress(links, j, len);
    }
    return jobLines.join("\n");
  }
,
  createJob: function(links, opType, extras) {
    var job = this.createJobHeader(links, opType) 
      + this.getReferrer(links) + "\n"
      + this.createJobBody(links);
      
    if (typeof(links.document) == "object") {
      job += "\n" + links.document.referrer + "\n" + links.document.cookie + "\n";
    } else {
      job += "\n\n\n";
    }
    if(!extras) job += "\n\n";
    else {
      while(extras.length < 3) extras.push('');
      job += extras.join("\n");
    }
    var cph = this.getPref("cookiePersistence", null);
    if(cph != null) job += cph;
    return job;
  }
,
  _bgJob: true,
  get bgJob() {
    return this._bgJob && this.service.bgProcessing; 
  }
,
  download: function(links, opType) {
    try {
      links.folder = links.folder || (links.length > 0 ? this.selectFolder(links, opType) : "");
      this.checkCookieSupport();
      this.performDownload(links, opType);
    } catch(ex) {
      this.log(ex + "\n" + ex.stack);
    } finally {
      this.updateProgress(links, 0); // 100%
    }
  }
,
  // best override point
  performDownload: function(links, opType) {
    this.performJob(this.createJob(links, opType));
  }
,
  getReferrer: function(links) {
    if (links.redirProcessedBy) {
      for (p in links.redirProcessedBy) {
        if (this.service.getPref("redir.anonymous." + p, false)) return "";
      }
    }
    if (!this.service.getPref("autoReferrer", true))
      return this.service.getPref("fakeReferrer", "");
    
    var ret = links.referrer || links.document && links.document.URL || links[0] && links[0].href;
    
    return (ret && /^https?:*/.test(ret)) ? ret : ""; 
  }
,
  checkCookieSupport: function() {
    this.getCookie = this.cookieSupport && !this.service.getPref("omitCookies")
    ? this._getCookie
    :function() { return ""; }
    ;
  }
,
  getCookie: function() { return ""; }
,
  _getCookie: function(link, links) {
    if (!this.cookieSupport) return (this.getCookie = function() { return ""; })();
    var host, cookies;
    if ((cookies = links.cookies)) {
      host = link.host;
      return host && cookies[host] || "";
    }
    this.initCookies(links);
    return this._getCookie(link, links);
  },
  
  initCookies: function(links) {
    var host, cookies, j, objCookie;
    const hostCookies = {};
    
    var l, parts;
    for (j = links.length; j-- > 0;) {
      l = links[j];
      parts = l.href.match(/http[s]{0,1}:\/\/([^\/]+\.[^\/]+)/i); // host?
      if (parts) {
        host = parts[1];
        var hpos = host.indexOf("@");
        if (hpos > -1) host = host.substring(hpos + 1);
        hostCookies[l.host = host] = "";
      } else {
        l.host = null;
      }
    }
    
    var cookieHost, cookieTable, tmpCookie;
    const domainCookies={};

    for (var iter = this.cookieManager.enumerator; iter.hasMoreElements();) {
      if ((objCookie = iter.getNext()) instanceof CI.nsICookie) {
        cookieHost = objCookie.host;
        if (cookieHost.charAt(0) == ".") {
          cookieHost = cookieHost.substring(1);
          cookieTable = domainCookies;
          if (typeof(tmpCookie=domainCookies[cookieHost]) != "string") {
            tmpCookie = "";
          }
        } else {
          if (typeof(tmpCookie=hostCookies[cookieHost])!="string") continue;
          cookieTable = hostCookies;
        }
        cookieTable[cookieHost] = tmpCookie.concat(objCookie.name + "=" + objCookie.value + "; ");
      }
    }

    for (cookieHost in hostCookies) {
      var dotPos;
      for (host = cookieHost; (dotPos=host.indexOf('.'))>=0; ) { 
        if ((tmpCookie = domainCookies[host])) {
          hostCookies[cookieHost] += tmpCookie;
        }
        host = host.substring(dotPos+1);
      }
    }
    
    links.cookies = hostCookies;
  },

  // see http://www.cookiecentral.com/faq/#3.5 and http://www.xulplanet.com/references/xpcomref/ifaces/nsICookie.html
  formatNSCookie: function(cookie) {
    return [
      cookie.host,
      cookie.isDomain ? "TRUE" : "FALSE",
      cookie.path,
      cookie.isSecure? "TRUE" : "FALSE",
      cookie.expires || this.cookieExpires,
      cookie.name,
      cookie.value
    ].join("\t");
  },
  cookieExpires: 0, // to be set once in getCookies()
  createCookieFile: function() {
    if (this.service.getPref("omitCookies")) return null;
    
    const cookies = [];
    this.cookieExpires = new Date().getTime() + 24 * 3600 * 3650; // ten years for session cookies
    
    for (var cookie, iter = this.cookieManager.enumerator; iter.hasMoreElements();) {
      if ((cookie = iter.getNext()) instanceof CI.nsICookie) {
        cookies.push(this.formatNSCookie(cookie));
      }
    }
    
    const f = this.service.tmpDir.clone();
    f.append("cookies");
    f.createUnique(0, 0600);
    this.service.writeFile(f, cookies.join("\n"));
    return f.path;
  }
,
  createJobFile: function(job) {
    const jobFile = this.service.tmpDir.clone();
    jobFile.append("flashgot.fgt");
    jobFile.createUnique(0, 0700);
    this.service.writeFile(jobFile, job);
    return jobFile;
  }
, 
  _waitForNative: true,
  get waitForNative() {
    return this._waitForNative && this.service.bgProcessing;
  }
,
  performJob: function(job) {
    const jobFile = this.createJobFile(job);
    this.runNative([jobFile.path], this.waitForNative);
  }
,
  createExecutable: function() {
    const exeFile = this.exeFile;
    if (!exeFile) return false;
    
    var channel;
    
    const ios = CC['@mozilla.org/network/io-service;1'].getService(CI.nsIIOService);
    var bis = CC['@mozilla.org/binaryinputstream;1'].createInstance(CI.nsIBinaryInputStream);
    
    bis.setInputStream((
      channel = ios.newChannel("chrome://flashgot/content/" + this.exeName, null, null)
    ).open());

    const bytesCount = channel.contentLength;
    const templateImage = bis.readBytes(bytesCount);
    bis.close();
 
    if (exeFile.exists()) {
      try {
        bis.setInputStream((
          channel = ios.newChannelFromURI(ios.newFileURI(exeFile))
        ).open());
        if (channel.contentLength == bytesCount) {
          try {
            if (bis.readBytes(bytesCount) == templateImage) {
              return false;
            }
          } finally {
            bis.close();
          }
        }
      } catch(ioex) {
        this.log(ioex);
      }
    }
    
    var bos = null;
    try {
      const fos = CC["@mozilla.org/network/file-output-stream;1"].createInstance(CI.nsIFileOutputStream);
      fos.init(exeFile, 0x02 | 0x08, 0700, 0);
      bos = CC['@mozilla.org/binaryoutputstream;1'].createInstance(CI.nsIBinaryOutputStream);
      bos.setOutputStream(fos);
      bos.writeBytes(templateImage, bytesCount);
      bos.close();
      return true;
    } catch(ioex) {
      this.log("Error writing " + exeFile.path + ": " + ioex);
    } finally {
      if (bos) try { bos.close(); } catch(e) {}
    }
    return false;
  }
,
  runNative: function(args, blocking, exeFile) {
    try {
      if (typeof(exeFile) == "object"
        || (exeFile = this.exeFile).exists()
        || this.createExecutable()) {
        const proc = CC['@mozilla.org/process/util;1'].createInstance(
          CI.nsIProcess);
        if (FlashGotDM.wine && FlashGotDM.wineExecutables.indexOf(exeFile) > -1) {
          args.unshift(exeFile.path);
          exeFile = FlashGotDM.wine;
        }
        proc.init(exeFile);
        this.log("Running " + exeFile.path + " " + args.join(" ") + " -- " +(blocking ? "blocking" : "async") );
        proc.run(blocking,args,args.length,{});
        if (blocking && proc.exitValue != 0) {
          this.log("Warning: native invocation of\n"
            +exeFile.path
            +"\nwith arguments <"
            +args.join(" ")
            +">\nreturned " + proc.exitValue);
        }
        return proc.exitValue;
      } else {
        this.log("Bad executable " + exeFile);
      }
    } catch(err) {
      this.log("Error running native executable:\n" + exeFile.path + 
        " " + args.join(" ") + "\n" + err.message);
    }
    return 0xffffffff;
  }
,
  getWindow: function() {
    return this.service.getWindow();
  }
,
  selectFolder: function(links, opType) { 


    const autoPref_FF = "browser.download.useDownloadDir";
    const autoPref_Moz = "browser.download.autoDownload";
    
    var initialDir = null;
    var downloadDir = null;
    links.quickDownload = false;
    
    const pref = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);
    
    function findDownloadDir(prefName) {
      try {
        downloadDir = initialDir = pref.getComplexValue(prefName, CI.nsILocalFile);
        return prefName;
      } catch(ex) {
        return "";
      }
    }
    const isMulti = opType != this.service.OP_ONE;
    const multiDirPref = "flashgot.multiDir";
    var downloadDirPref = 
                    (isMulti && findDownloadDir(multiDirPref)) ||
                    findDownloadDir("browser.download.dir") ||
                    findDownloadDir("browser.download.downloadDir") || 
                    findDownloadDir("browser.download.defaultFolder") ||
                    "browser.download.dir"; 
    
    if (isMulti) downloadDirPref = multiDirPref;
    
    try {
      links.quickDownload = pref.getBoolPref(autoPref_FF);
    } catch(noFFEx) {
      try {
        links.quickDownload = pref.getBoolPref(autoPref_Moz);
      } catch(noMozEx) {}
    }
   
    if (!this.askPath[opType]) return "";
    
    if (((!isMulti) || this.service.getPref("multiQuiet", false)) && 
        downloadDir && downloadDir.exists() && downloadDir.isDirectory()  && 
        links.quickDownload) {
      return downloadDir.path;
    }
    
    var params = {
      title: "FlashGot (" + this.name.replace(/[\(\)]/g, "") + ")",
      initialDir: initialDir,
      choosenDir: null
    }
    
    this.getWindow().openDialog(
              "chrome://flashgot/content/chooser.xul",
              "flashgotChooser",
              "chrome, dialog, modal, dependent, centerscreen",
              params);
    
    if (params.choosenDir) {
      pref.setComplexValue(downloadDirPref, CI.nsILocalFile, params.choosenDir);
      var path = new String(params.choosenDir.path);
      path._fgSelected = true;
      return path;
    }
  
    throw new Error("Download cancelled by user");

  },
  sanitizeWinArg: function(a) {
    return a.replace(/([\|\(\) &\^])/g, "^$1"); 
  },
  supportURLList: function(links, argsTemplate) {
    if (/\[[^\]]*UFILE[^\]]*\]/.test(argsTemplate) && links.length) {
      // we must create a file list
      var sep = this.service.isWindows ? "\r\n" : "\n";
      var urlList = "";
      for (j = 0; j < links.length; j++) {
        urlList += links[j].href + sep;
      }
      links.length = 1;
      return this.createJobFile(urlList).path
    }
    return null;
  },
  nativeUI: null,
  hideNativeUI: function(document) {
    if (!(this.nativeUI && this.getPref("hideNativeUI", true))) return;
    this.service.hideNativeUI(document, this.nativeUI);
  }
}




// *** Unix-like DMS ***********************************************************
function FlashGotDMX(name,cmd,argsTemplate) {
  if (arguments.length != 0) {
    this._init(name);
    const cmds = FlashGotDMX.prototype.unixCmds;
    cmds[name] = cmd;
    this.unixCmd = cmd;
    if (argsTemplate) this.argsTemplate = argsTemplate;
    this.cookieSupport =  /\[.*?(?:CFILE|COOKIE).*?\]/.test(this.argsTemplate);
  }
  if (FlashGotDMMac.isMac) {
    this.createJobFile = FlashGotDMMac.prototype.createJobFile;
  }
}
FlashGotDMX.prototype = new FlashGotDM();
FlashGotDMX.constructor = FlashGotDMX;
FlashGotDMX.prototype.exeName = "flashgot.sh";
FlashGotDMX.prototype.askPath = [true, true, true];
FlashGotDMX.prototype.unixCmds = {};
FlashGotDMX.prototype.__defineGetter__("unixShell", function() {
  var f = CC["@mozilla.org/file/local;1"].createInstance(CI.nsILocalFile);
  try {
    f.initWithPath("/bin/sh");
    if (!f.exists()) {
      this.log(f.path + " not found");
      f = null;
    }
  } catch(ex) {
    f = null;
    this.log("No *X shell: " + ex.message);
  }
  delete FlashGotDMX.prototype.unixShell;
  return FlashGotDMX.prototype.unixShell = f;
});

FlashGotDMX.prototype.argsTemplate = "[URL]";
FlashGotDMX.prototype.launchSupportTest = function(testFile) {
  const cmds = this.unixCmds;
  var script="(\n";

  for (var name in cmds) {
    cmd = cmds[name];
    script +=" [ -x \"`which '" + cmd + "'`\" ] && echo '"
      + name + "|OK' || echo '" + name+"|KO'\n"; 
  }
  script += ") > '" + testFile.path + "'\n"; 
  this.performJob(script, true);
};

FlashGotDMX.prototype.createCmdLine = function(parms) {
  return this.unixCmd + " " +
    this.argsTemplate.replace(/\[(.*?)(URL|REFERER|COOKIE|FOLDER|POST|UFILE|CFILE)(.*?)\]/g,
      function(all, before, parm, after) {
          v = parms[parm]; 
          return typeof(v) != "undefined" && v != null
            ? before + v + after
            : "";
      }
   ) +" &\n";
};
FlashGotDMX.prototype.shellEsc = function(s) {
  return s ? s.replace(/([\\\*\?\[\]\$&<>\|\(\)\{\};"'`])/g,"\\$1").replace(/\s/g,"\\ ") : null;
};
FlashGotDMX.prototype.createJob = function(links, opType) {
  const shellEsc = this.shellEsc;
  // basic implementation

  const folder = shellEsc(links.folder);
  const referrer = shellEsc(this.getReferrer(links));
  const postData = shellEsc(links.postData);
  var job = "";
  var l, url;
  
  var cookieFile = this.createCookieFile();
  var urlListFile = this.supportURLList(links, this.argsTemplate);
  for (var j = 0, len = links.length; j < len; j++) {
    l = links[j];
    url = l.href;
    job += this.createCmdLine({
      URL: shellEsc(url), 
      REFERER: referrer, 
      COOKIE: shellEsc(this.getCookie(l, links)),
      CFILE: cookieFile,
      FOLDER: folder, 
      POST: postData,
      UFILE: shellEsc(urlListFile)
    });
    this.updateProgress(links, j, len);
  }
  return job;
};
FlashGotDMX.prototype.performJob = function(job, blocking) {
  const jobFile = this.createJobFile("#!" + this.unixShell.path + "\n" + job);
  jobFile.permissions = 0700;
  var exeFile = FlashGotDMMac.isMac ? FlashGotDMMac.exeFile : jobFile;
  this.runNative([],
    this.waitForNative || (typeof(blocking) != "undefined" && blocking),
    exeFile);
};
FlashGotDMX.prototype.checkExePlatform = function(exeFile) {
  return this.unixShell && exeFile;
};
FlashGotDMX.prototype.createExecutable = function() {
  return false;
};



// *** Mac OS X DMS ************************************************************
function FlashGotDMMac(name, creatorId, macAppName) {
  if (arguments.length != 0) {
    this._initMac(name, creatorId, macAppName);
  }
}
FlashGotDMMac.exeFile = null;
FlashGotDMMac.appleScriptFile = null;
FlashGotDMMac.appleScriptName = "flashgot-mac-script";
FlashGotDMMac.OSASCRIPT = "/usr/bin/osascript";
FlashGotDMMac.isMac = (function() {
  const f = CC["@mozilla.org/file/local;1"].createInstance(CI.nsILocalFile);
  try {
    f.initWithPath(FlashGotDMMac.OSASCRIPT);
    return f.exists();
  } catch(ex) {
  }
  return false;
})();
FlashGotDMMac.prototype = new FlashGotDM();
FlashGotDMMac.constructor = FlashGotDMMac;
FlashGotDMMac.prototype.exeName = "FlashGot";
FlashGotDMMac.prototype.cookieSupport = false;
FlashGotDMMac.prototype.macCreators = [];
FlashGotDMMac.prototype._initMac = function(name, creatorId, macAppName) {
  this._init(name);
 
  if (creatorId) {
    const creators=FlashGotDMMac.prototype.macCreators;
    creators[creators.length] = {name: name, id: creatorId};
  }
  this.macAppName = macAppName ? macAppName : name;
  this.initAppleScriptBridge();
  FlashGotDMMac.exeFile = this.exeFile;
};

FlashGotDMMac.prototype.initAppleScriptBridge = function() {
  if (FlashGotDMMac.appletScriptFile) return;
  
  var home = this.service.home && this.service.home.parent;
  if (home) home.append("mac-flashgot");

  if (!(home && home.exists() && home.isWritable())) {
    (FlashGotDMMac.appleScriptFile = this.service.tmpDir.clone())
      .append(FlashGotDMMac.appleScriptName);
    return;
  }
  (FlashGotDMMac.appleScriptFile = home.clone())
    .append(FlashGotDMMac.appleScriptName);
  (FlashGotDMMac.prototype._exeFile = home.clone()).append(this.exeName);
  
  this.log("Setting executable permissions on " + this._exeFile.path);
  this._exeFile.permissions = 0700;
  FlashGotDMMac.prototype.createExecutable = function() { return false; }
}
FlashGotDMMac.prototype.shellEsc = function(s) {
  return s ? "'" + s.replace(/'/g, '"\'"') + "'" : null; 
}
FlashGotDMMac.prototype.createScriptLauncher = function() {
  return "#!/bin/sh\n" +
    "SCRIPT=" + this.shellEsc(FlashGotDMMac.appleScriptFile.path) + "\n" +
    "USCRIPT=\"$SCRIPT.$$\"\n" + 
    "mv \"$SCRIPT\" \"$USCRIPT\" || exit 1\n" +
    "head -n 1 \"$USCRIPT\" | grep '#!' >/dev/null &&  \"$USCRIPT\" || " +
    FlashGotDMMac.OSASCRIPT + " \"$USCRIPT\"";
};
FlashGotDMMac.prototype.checkExePlatform = function(exeFile) {
  return FlashGotDMMac.isMac && exeFile || null;
};
FlashGotDMMac.prototype.createExecutable = function() {
  
  
  var exeFile = this._exeFile;
  if (!exeFile) return false;

  try {
   var scriptLauncher = this.createScriptLauncher();
   var mustCreate = true;
   if (exeFile.exists()) {
     if (this.service.readFile(exeFile) == scriptLauncher) {
       exists = true;
       if (exeFile.isExecutable()) return false;
       mustCreate = false;
     } else {
       this.log(exeFile.path + " is corrupted or obsolete, replacing it...");
       try { exeFile.remove(true); } catch(rex) {} 
     }
   } else {
     this.log(exeFile.path + " not found, creating it...");
   }
   if (mustCreate) {
     this.log("Creating Mac executable");
     exeFile.create(0, 0700);
     this.service.writeFile(exeFile, scriptLauncher);
   }
   this.log("Setting executable permissions on " + exeFile.path);
   exeFile.permissions = 0700;
   return mustCreate;
  } catch(ex) {
    this.log("Cannot create Mac executable: " + ex.message);
  }
  return false;
};
FlashGotDMMac.prototype.launchSupportTest = function(testFile) {
  const creators = FlashGotDMMac.prototype.macCreators;
  
  var s = [
    'global gRes',
    'set gRes to ""',
    'on theTest(theName, theId)',
    '  set gRes to gRes & theName',
    '  try',
    '    tell app "Finder" to get application file id theId',
    '    set gRes to gRes & "|OK\n"',
    '  on error',
    '    set gRes to gRes & "|KO\n"',
    '  end try',
    'end theTest'
  ];
  for (var j = creators.length; j-- > 0; ) {
    s.push('theTest("' + creators[j].name + '","' +creators[j].id + '")'); 
  }
  s.push(
    'set theFile to POSIX file "' + testFile.path + '"',
    'try',
    '  set fh to open for access theFile with write permission',
    '  write (gRes) to theFile',
    '  close access fh',
    'on error',
    '  try',
    '    close access fh',
    '  end try',
    'end try'
  );
  this.performJob(s.join("\n"), true);
};
FlashGotDMMac.prototype.createJobFile = function(job) {
  const jobFile = FlashGotDMMac.appleScriptFile;
  try {
    jobFile.remove(true);
  } catch(ex) {}
  try {
    jobFile.create(0, 0600);
    this.service.writeFile(jobFile, job, /^#/.test(job) ? null : this.service.getPref("appleScriptEncoding"));
    return jobFile;
  } catch(ex) {
    this.log("Cannot write " + (jobFile && jobFile.path) + ex.message);
  }
  return null;
}
FlashGotDMMac.prototype.performJob = function(job, blocking) {
  if (this.createJobFile(job)) 
    this.runNative([], 
        typeof(blocking) == "boolean" ? blocking : this.waitForNative, 
        this.exeFile);
};

FlashGotDMMac.prototype.createJob = function(links,opType) {
  const referrer = this.getReferrer(links);
  var job = "tell application \""+ this.macAppName+ "\"\n";
  for (var j = 0, len = links.length; j < len; j++) {
    job += 'GetURL "' + links[j].href + '" from "' + referrer  + "\"\n";
    this.updateProgress(links, j, len);
  }
  job += "end tell\n";
  return job;
};



// *** Custom DMS **************************************************************
function FlashGotDMCust(name) {
  if (arguments.length == 0 || (!name) || (!name.length)) return;
  name = name.replace(/,/g, " ");
  this._init(name);
  this.prefsBase = "custom." + this.codeName + ".";
}

FlashGotDMCust.init = function(service) {
  const names = service.getPref("custom", "").split(/\s*,\s*/);
  for (var j = names.length; j-->0;) {
    new FlashGotDMCust(names[j]);
  }
}

FlashGotDMCust.persist = function(service) {
  const dms = FlashGotDM.dms;
  const cdms = [];
  for (var j = dms.length; j-->0;) {
    if (dms[j].custom) cdms.push(dms[j].name);
  }
  service.setPref("custom", cdms.join(","));
}

FlashGotDMCust.prototype = new FlashGotDM();
FlashGotDMCust.constructor = FlashGotDM;

delete FlashGotDMCust.prototype.launchSupportTest;
delete FlashGotDMCust.prototype.exeFile;
FlashGotDMCust.prototype.PLACEHOLDERS = ["URL", "REFERER", "COOKIE", "FOLDER", "POST", "UFILE", "CFILE"];

FlashGotDMCust.prototype.custom = true;
FlashGotDMCust.prototype. _supported = true;
FlashGotDMCust.prototype.cookieSupport = false;
FlashGotDMCust.prototype.postSupport = true;
FlashGotDMCust.prototype.askPath = [true, true, true];

FlashGotDMCust.prototype.__defineGetter__("exeFile",function() {
  try {
    return this.service.prefs.getComplexValue(this.prefsBase + "exe", 
      CI.nsILocalFile);
  } catch(ex) {
    return null;
  }
});
FlashGotDMCust.prototype.__defineSetter__("exeFile",function(v) {
  try {
    if (v) {
      this.service.prefs.setComplexValue(this.prefsBase + "exe", 
          CI.nsILocalFile,v);
      return v;
    }
  } catch(ex) {
  }
  return null;
});

FlashGotDMCust.prototype.__defineGetter__("argsTemplate", function() {
  if (this.forcedTemplate) return this.forcedTemplate;
  var t = this.service.getPref(this.prefsBase+"args", "[URL]");
  return /['"`]/.test(t) ? this.argsTemplate = t : t;
});
FlashGotDMCust.prototype.__defineSetter__("argsTemplate",function(v) {
  if (!v) {
    v = "";
  } else {
    v = v.replace(/['"`]/g,"");
  }
  this.service.setPref(this.prefsBase + "args", v);
  this.askPath = [];
  return v;
});


FlashGotDMCust.prototype.download = function(links, opType) {
  const t = this.argsTemplate;
  this.cookieSupport = /\[.*?(?:CFILE|COOKIE).*?\]/.test(t);
  this.askPath[opType] = /\[.*?FOLDER.*?\]/.test(t);
  var exeFile = this.exeFile;
  // portable hacks
  if (exeFile && !exeFile.exists()) {
    // try changing the first part of path
    var path = exeFile.path;
    var profPath = this.service.profDir.path;
    var pos1, pos2;g
    if (path[1] == ":" && profPath[1] == ":") { 
      // easy, it's Windows, swap drive letter
      path = profPath[0] + path.substring(1);
    } else if(path.indexOf("/mount/") == 0 && profPath.indexOf("/mount/") == 0) {
      pos1 = path.indexOf("/", 7);
      pos2 = profPath.indexOf("/", 7);
      path = "/mount/" + profPath.substring(7, pos2) + path.substring(pos1); 
    } else if((pos1 = path.indexOf("/",1)) > 0 && (pos2 = profPath.indexOf("/", 1)) > 0) {
      path = profPath.substring(0, pos2) + path.substring(pos1);
    } else exeFile = null;
    if (exeFile) {
      exeFile = exeFile.clone().QueryInterface(CI.nsILocalFile).initWithPath(path);
      if (!exeFile.exists()) exeFile = null;
    }
  }
  links.exeFile= (exeFile || 
    (exeFile = this.exeFile = this.locateExeFile())) ? exeFile : null;
  FlashGotDM.prototype.download.call(this, links, opType);
};

FlashGotDMCust.prototype.locateExeFile = function(name) {


  if (!name) name = this.name;
  var title = this.service.getString("custom.exeFile");
  title = 'FlashGot (' + name + ') - ' + title;
  
  const fp = CC["@mozilla.org/filepicker;1"].createInstance(CI.nsIFilePicker);
  const win = this.getWindow();
  fp.init(win, title, CI.nsIFilePicker.modeOpen);
  fp.appendFilters(CI.nsIFilePicker.filterApps);
  fp.appendFilters(CI.nsIFilePicker.filterAll);

  if (fp.show() == CI.nsIFilePicker.returnOK) {
    var file = fp.file.QueryInterface(CI.nsILocalFile);
    if (file.exists()) {
      return file;
    }
  }
  return null;
};

FlashGotDMCust.prototype._addParts=function(a, s) {
  var parts=s.split(/\s+/);
  var k, p;
  for (k in parts) {
    if ((p = parts[k])) {
      a[a.length] = p;
    }
  }
};

FlashGotDMCust.prototype.makeArgs = function(parms) {
  const args = [];
  var t = this.argsTemplate;
  var j, v, len, s;
  
  var idx;
  
  for (var m; 
      m = t.match( /\[([\s\S]*?)(\S*)\b(URL|REFERER|COOKIE|FOLDER|POST|CFILE|UFILE)\b(\S*?)([\s\S]*?)\]/); 
      t = t.substring(idx + m[0].length) 
     ) {

    if ((idx = m.index) > 0) {
      this._addParts(args, t.substring(0, idx));
    }
    
    v = parms[m[3]];
    if (!v) continue;
    
    this._addParts(args, m[1]);
    args[args.length] = m[2] + v + m[4];
    this._addParts(args, m[5]);
  }
  
  if (t.length) {
    this._addParts(args, t);
  }
  return args;
};

FlashGotDMCust.prototype.createJob = function(links, opType) {
  return { links: links, opType: opType };
};

FlashGotDMCust.prototype.shellEsc = function(s) {
  return s ? '"' + s.replace(/"/g, '""') + '"' : null;
}

FlashGotDMCust.prototype.winEscHack = function(s) {
  // hack for bug at http://mxr.mozilla.org/seamonkey/source/xpcom/threads/nsProcessCommon.cpp#149 
  return (/[;&=]/.test(s) && !/\s/.test(s)) // "=" and ";" are command line separators on win!!!
    ? s + " " : s; // we add a space to force escaping
}

FlashGotDMCust.prototype.performJob = function(job) {
  const links = job.links;
  const exeFile = links.exeFile;
  if (links.length < 1 || !exeFile) return;
  
  var esc = (this.service.isWindows && this.getPref("winEscHack", true))
    ? this.winEscHack : function(s) { return s; }
  
  const folder = links.folder;
  const referrer = esc(this.getReferrer(links));
  const postData = esc(links.postData);
  var cookieFile = this.createCookieFile();
  var urlListFile = this.supportURLList(links, this.argsTemplate);
  var maxLinks = this.service.getPref(this.prefsBase + "maxLinks", 0);
  if (maxLinks > 0 && links.length > maxLinks) {
    this.log("Too many links (" + links.length + "), cutting to " 
        + this.prefsBase + "maxLinks (" + maxLinks + ")");
    links.length = maxLinks;
  }
  var l;
 
  
  for (var j = 0, len = links.length; j < len; j++) {
    l = links[j];
    this.runNative(
      this.makeArgs({
        URL: esc(l.href), 
        REFERER: referrer, 
        COOKIE: esc(this.getCookie(l, links)), 
        FOLDER: folder, 
        POST: postData,
        CFILE: cookieFile,
        UFILE: urlListFile
       }),
       false, exeFile);
    this.updateProgress(links, j, len);
  }
};
FlashGotDMCust.prototype.checkExePlatform = function(exeFile) {
  return exeFile;
};
FlashGotDMCust.prototype.createExecutable = function() {
  return false;
};
// End FlashGotDMCust.prototype

// *****************************************************************************
// END DMS CLASSES
// *****************************************************************************

// DMS initialization

FlashGotDM.initDMS = function(service) {
  const isWin = service.isWindows;
  var dm;

  new FlashGotDM("BitComet");

  dm = new FlashGotDM("Download Accelerator Plus");
  dm.nativeUI = "#dapctxmenu1, #dapctxmenu2";
  
  dm.performDownload =  function(links, opType) {
    if (!("IDAPComponent" in CI)) {
      this.log("DAP extension not found, falling back to IE integration");
      FlashGotDM.prototype.performDownload.apply(this, arguments);
      return;
    }
    
    function getDAP() {
      return CC["@speedbit.com/dapfirefox/dapcomponent;1"].createInstance(CI.IDAPComponent);
    }
    function downloadDoc(doc) {
      getDAP().RigthClickMenuDownloadAll(doc, "Firefox");
      doc.defaultView.location.href = "about:blank";
    }
    
    try {
    
      if (opType == this.service.OP_ONE) {
        var l = links[0];
        getDAP().RigthClickMenuDownload(
          l.href, this.getReferrer(links), this.getCookie(l, links), l.description, "Firefox");
        return;
      }
      
      if (!links.document) {
        this.log("DAP: No document found");
        return;
      }
      
      var doc = links.document;
      var url = doc.URL;
      if (opType == this.service.OP_SEL) {
        var bwin = links.browserWindow || this.service.getBrowserWindow(doc);
        if (!bwin) {
          this.log("DAP: no browser window found");
          return;
        }
        var f = bwin.document.getElementById("_flashgot_iframe");
        
        f.docShell.QueryInterface(CI.nsIWebPageDescriptor).loadPage(
          DOMUtils.getDocShellFromWindow(doc.defaultView).QueryInterface(CI.nsIWebPageDescriptor).currentDescriptor,
          2
        );
        
        var dm = this;
        f.addEventListener("DOMContentLoaded", function(ev) {
          try {
            var f = ev.currentTarget;
            f.removeEventListener(ev.type, arguments.callee, false);
            var doc = f.contentDocument;
            if (doc.URL != url) return;
            var root = doc.documentElement;
            while(root.firstChild) root.removeChild(root.firstChild);
            root.appendChild(doc.createElement("head"));
            root.appendChild(doc.createElement("body"));
            var frag = doc.createDocumentFragment();
            var a, l;
            for(var j = 0; j < links.length; j++) {
              a = doc.createElement("a");
              l = links[j];
              a.href = l.href;
              a.appendChild(doc.createTextNode(l.description));
              frag.appendChild(a);
            }
            doc.body.appendChild(frag);
            downloadDoc(doc, "Firefox");
          } catch(e) {
            dm.log("DAP Selection: " + e.message + " - " + e.stack);
          }
        }, false);
        
      } else {
        downloadDoc(doc);
      }
    } catch(e) {
      this.log("DAP: " + e.message + " - " + e.stack);
      return;
    }
  };
  
  
  
  
  new FlashGotDM("Download Master");
  
  for each (dm in [new FlashGotDM("DTA"), new FlashGotDM("DTA (Turbo)")]) {
    dm.__defineGetter__("supported", 
      function() { 
        return  "dtaIFilterManager" in CI || "@downthemall.net/privacycontrol;1" in CC 
    });
    dm.turboDTA = /Turbo/.test(dm.name);
    dm.nativeUI = dm.turboDTA
      ? "#context-dta-savelinkt, #context-tdta, #dtaCtxTDTA, #dtaCtxSaveT, #dtaCtxTDTA-direct, #dtaCtxSaveT-direct"
      : "#context-dta-savelink, #context-dta, #dtaCtxDTA, #dtaCtxSave, #dtaCtxDTA-direct, #dtaCtxSave-direct";
      
    dm.performDownload = function(links, opType) {
      if(!links.document) {
        this.log("No document found in " + links);
        return;
      }
      var w = links.browserWindow || this.service.getBrowserWindow(links.document);
      if(!(w && w.DTA_AddingFunctions && w.DTA_AddingFunctions.saveLinkArray)) {
        this.log("DTA Support problem: " + w + ", " + (w && w.DTA_AddingFunctions) + ", tb:" +
          w.gBrowser + ", wl:" + w.location + ", wo:" + w.wrappedJSObject + ", " +
            (w && w.DTA_AddingFunctions && w.DTA_AddingFunctions.saveLinkArray));
        return;
      }
      var mlSupport = w.DTA_getLinkPrintMetalink;
      var turbo = this.turboDTA;
      var cs = links.document && links.document.characterSet || "UTF-8";
      var anchors = [], images = [], l, arr;
      var hash, ml;
      var referrer = this.getReferrer(links);
      var tag;
      var single = opType == this.service.OP_ONE;
      var ios = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
      var wrapURL = w.DTA_URL
        ? w.DTA_URL.toSource().indexOf("DTA_URL(url, preference)") > -1
          ? function(url, cs) { return new w.DTA_URL(ios.newURI(url, cs, null)); }
          : function(url, cs) { return new w.DTA_URL(url, cs); }
        : function(url) { return url };
      var lastItem = null;
      for (var j = 0, len = links.length; j < len; j++) {
        l = links[j];
        arr = single || !(tag = l.tagName) || tag.toLowerCase() == "a" ? anchors : images;
        try {
          arr.push(lastItem = { 
              url: wrapURL(l.href, cs),
              description: l.description,
              ultDescription: '',
              referrer: referrer
          });
          
          if (arr == anchors && mlSupport && l.href.indexOf("#") > 0) {
            hash = l.href.match(/.*#(.*)/)[1];
            ml = mlSupport(l.href);
            if (ml) {
              arr.push(lastItem = {
                url: wrapURL(ml, cs),
                description: '[metalink] http://www.metalinker.org/',
                ultDescription: '',
                referrer: referrer,
                metalink: true
              });
            }
          } 
        } catch(e) {
          this.log("DTA: " + e.message);
        }
        this.updateProgress(links, j, len);
      }
      if (!lastItem) {
        this.log("DTA: no link found in " + links.length);
      } else if (single && w.DTA_AddingFunctions.saveSingleLink) {
        w.DTA_AddingFunctions.saveSingleLink(turbo, lastItem.url, lastItem.referrer, lastItem.description, links.postData);
      } else {
        w.DTA_AddingFunctions.saveLinkArray(turbo, anchors, images);
      }
    }
  }
  
  new FlashGotDM("FlashGet");
  
  dm = new FlashGotDM("FlashGet 2");
  dm = new FlashGotDM("FlashGet 2.x");
  dm.nativeUI = "#flashgetSingle, #flashgetAll, #flashgetSep";
  
  dm = new FlashGotDM("Free Download Manager");
  dm._waitForNative=false;
  
  new FlashGotDM("FreshDownload");
  
  
  dm = new FlashGotDM("GetRight");
  dm.metalinkSupport = true;
  dm.download=function(links, opType) {
    const service = this.service;
    if (opType == service.OP_ONE && !service.getPref("GetRight.quick")) {
      opType = service.OP_SEL;
    }
    FlashGotDM.prototype.download.call(this, links, opType);
  };
  
  dm.createJob = function(links, opType) {
    const service = this.service;
    var folder = links.folder;
    if (!(folder && folder._fgSelected)) folder = false;
    
    var referrer = this.getReferrer(links);
    
    switch (opType) {
      case service.OP_ONE:
        var job = FlashGotDM.prototype.createJob.call(this, links, opType,
          this.service.getPref("GetRight.old") ? ["old"] : null
          ).replace(/; /g, ";");
        return job;
      case service.OP_SEL:
      case service.OP_ALL:
        var urlList = "";
        var referrerLine = (referrer && referrer.length > 0) ? "\r\nReferer: " + referrer + "\r\n" : "\r\n";
        var replacer = service.getPref("GetRight.replaceSpecialChars", true) ? /[^\w\.-]/g : /[\x00-\x1f\\]+/g;
        var l, k, len, decodedURL, urlParts, fileSpec, cookie;
        
        for (var j = 0; j < links.length; j++) {
          l=links[j];
          
          if (l.fname) fileSpec = l.fname;
          else if (folder) {
            fileSpec = '';
            decodedURL = unescape(l.href);
            urlParts = decodedURL.match(/\/\/.+[=\/]([^\/]+\.\w+)/);
            if (!urlParts) urlParts=l.href.match(/.*\/(.*\w+.*)/);
            if (urlParts && (fileSpec = urlParts[1])
              // && (links.length==1 ||  !/\.(php|[\w]?htm[l]?|asp|jsp|do|xml|rdf|\d+)$/i.test(fileSpec))
             ) {  
              urlParts = fileSpec.match(/(.*\.\w+).*/);
              if (urlParts) fileSpec = urlParts[1];
              fileSpec = fileSpec.replace(replacer, '_');
            } else continue;
          } else fileSpec = '';
          
          if (fileSpec) {
            if (folder) fileSpec = folder + "\\" + fileSpec;
            fileSpec = "File: " + fileSpec + "\r\n";
          }
          
          urlList+="URL: "+l.href
            +"\r\nDesc: "+l.description + "\r\n" + fileSpec;
          
            if (l.md5) {
            urlList += "MD5: " + l.md5 + "\r\n";
          }
          if (l.sha1) {
            urlList += "SHA1: " + l.sha1+ "\r\n";
          }
          if (l.metalinks) {
            for (k = 0, len = Math.min(16, l.metalinks.length); k < len; k++) {
              urlList += "Alt: " + l.metalinks[k] + "\r\n";
            }
          } else {
            urlList += referrerLine;
            if ((cookie = this.getCookie(l, links))) {
              urlList += "Cookie: " + cookie + "\r\n";
            }
          }
          this.updateProgress(links, j, len);
        }
        var file = service.tmpDir.clone();
        file.append("flashgot.grx");
        file.createUnique(0,0600);
        var charset=null;
        try {
          charset=service.getPref("GetRight.charset",
            service.prefService.QueryInterface(CI.nsIPrefBranch
            ).getComplexValue("intl.charset.default",
              CI.nsIPrefLocalizedString).data);
        } catch(ex) {}
        service.writeFile(file, urlList, charset);
        referrer = file.path;
        break;
    }
    var cmdOpts="/Q";
    if (service.getPref("GetRight.autostart",false)) { // CHECK ME!!!
      cmdOpts+="\n /AUTO";
    }
    return this.createJobHeader({ length: 0, folder: "" }, opType) +
      referrer + "\n" + cmdOpts;
  };
  dm.askPath=[false,true,true];
  
  new FlashGotDM("GigaGet");
  
  new FlashGotDM("HiDownload");
  new FlashGotDM("InstantGet");
  
  dm = new FlashGotDM("iGetter Win");
  dm.nativeUI = "#all-igetter, #igetter-link";
  dm.__defineGetter__("supported", function() {
    if (typeof(this._supported) == "boolean") return this._supported;
    if (FlashGotDMMac.isMac) return this._supported = false;
    
    this._supported = ("nsIGetterMoz" in CI);
    this.cookieSupport = false;
    if (this._supported) return true;
    this.cookieSupport = true;
    return this._supported = !!this.createExecutable();
  });
  dm.createExecutable = function() {
    var exeFile, path, key;
    
    exeFile = CC["@mozilla.org/file/local;1"].createInstance(CI.nsILocalFile);
    try {
      path = this.readWinRegString("CURRENT_USER", "Software\\iGetter")
      exeFile.initWithPath(path);
    } catch(e) {
      path = null;
    }
    if (!(path && exeFile.exists())) {
      try {
        exeFile = CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties)
                    .get("ProgF", CI.nsIFile);
        exeFile.append("iGetter");
        exeFile.append("iGetter.exe");
      } catch(e) {
        path = "C:\\Program Files\\iGetter\\iGetter.exe";
        try {
          exeFile.initWithPath(path);
        } catch(e2) {
          return null;
        }
      }
    }
    
    this.browser = 3;
    if ("@mozilla.org/xre/app-info;1" in Components.classes) {
      var info = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
      if(info.name.indexOf("Firefox") > -1) this.browser = 4;
    }	
    
    return exeFile.exists() ? this._exeFile = exeFile : null;
  }
  dm.createJob = function(links, opType) {
    const cs = this.cookieSupport;
    var l;
    var job = [this.getReferrer(links)];
    for (var j=0; j < links.length; j++) {
      l = links[j];
      job.push(l.href,
        cs ? l.description + "~%iget^=" + this.getCookie(l, links)
           : l.description
      );
    }
    return job.join("\r\n") + "\r\n";
  };
  dm.performJob = function(job) {
    const file = this.createJobFile(job);
    if (this.exeFile) {
      this.runNative(['-f', file.path, '-b', this.browser])
    } else {
      CC["@presenta/iGetter"]
              .getService(CI.nsIGetterMoz)
              .NewURL(file.path);
      if (file.exists()) file.remove(0);
    }
  };
  
  new FlashGotDM("Internet Download Accelerator");
  (new FlashGotDM("Internet Download Manager")).postSupport = true;

  var lg2002 = new FlashGotDM("LeechGet 2002");
  var lg2004 = new FlashGotDM("LeechGet");
  lg2004._bgJob = lg2002._bgJob=false;

  lg2004.createJob=lg2002.createJob = function(links, opType) {
    const service=this.service;
    var referrer;
    switch (opType) {
      case service.OP_ONE:
        return FlashGotDM.prototype.createJob.call(this, links, 
            links.quickDownload ? service.OP_ONE : service.OP_SEL);
        
      case service.OP_SEL:
        var htmlDoc="<html><head><title>FlashGot selection</title></head><body>";
        var l;
        for (var j=0, len=links.length; j<len; j++) {
          l = links[j];
          var des = l.description;
          var tag = l.tagName ? l.tagName.toLowerCase() : "";
          htmlDoc = htmlDoc.concat(tag == "img"
            ? '<img src="' + l.href + '" alt="' + des
              + '" width="' + l.width + '" height="' + l.height +
              "\" />\n"
            : "<a href=\"" + l.href + "\">" + des + "</a>\n");
          this.updateProgress(links, j, len);
        }
        referrer = service.httpServer.addDoc(
          htmlDoc.concat("</body></html>")
        );
        break;
       default:
        referrer = links.document && links.document.URL || "";
        if (referrer.match(/^\s*file:/i)) { // fix for local URLs
          // we serve local URLs through built-in HTTP server...
          return this.createJob(links,service.OP_SEL);
        }
    }
    return this.createJobHeader({ length: 0, folder: "" },opType) + referrer + "\n";
  };
 
  new FlashGotDM("Net Transport");
  new FlashGotDM("Net Transport 2");
  new FlashGotDM("NetAnts");
  new FlashGotDM("Mass Downloader");
  
  dm = new FlashGotDM("Orbit");
  dm.nativeUI = "#OrbitDownloadUp, #OrbitDownload, #OrbitDownloadAll";
  
  dm = new FlashGotDM("ReGet");
  dm.postSupport = true;
  if("@reget.com/regetextension;1" in CC) {
    try {
      dm.reGetService = CC["@reget.com/regetextension;1"].createInstance(CI.IRegetDownloadFFExtension);
      if (dm.reGetService.isExtensionEnabled()) {
        dm._supported = true;
        dm.performJob = function() {};
        dm.createJob = function(links, opType) {
          const rg = this.reGetService;
          var l;
          var len = links.length;
          var ref = links.referrer;
          if (len == 1) {
            l = links[0];
            rg.setUrl(l.href);
            rg.setInfo(l.description);
            rg.setCookie(this.getCookie(l, links));
            rg.setReferer(ref);
            rg.setPostData(links.postData);
            rg.setConfirmation(true);
            rg.addDownload();
            return;
          }
          for (var j = 0; j < len; j++) {
            l = links[j];
            rg.addToMassDownloadList(
              l.href,
              ref,
              this.getCookie(l, links),
              l.description,
              "");
            this.updateProgress(links, j, len);
          }
          rg.runMassDownloadList();
        }
      }
    } catch(rgEx) {}
  }
  
  if (isWin) {
    dm = new FlashGotDMCust("Retriever");
    dm.cookieSupport = true;
    dm.askPath = ASK_NEVER;
    dm.custom = false;
    dm._supported = null;
    
    if (service.getPref(dm.prefsBase + "maxLinks", -1000) == -1000) {
      service.setPref(dm.prefsBase + "maxLinks", 10);
    }
    dm.customSupportCheck = function() {
      var wrk;
      try {
        cmd = this.readWinRegString("CLASSES_ROOT", "Retriever.Retriever.jar.HalogenWare\\shell\\Open\\command");
        this.jarPath = cmd.replace(/.*-jar "?(.*?\.jar).*/, "$1");
        this.argsTemplate = "[URL] [Referer:REFERER] [Cookie:COOKIE] [post:POST]";
        
        var exeFile = CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties)
          .get("WinD", CI.nsIFile);
        exeFile.append("System32");
        exeFile.append("javaw.exe");
        this.exeFile = exeFile;
        
        return true;
      } catch(e) {
        return false;
      } 
    };
    
    dm.makeArgs = function(parms) {
      return ["-jar", this.jarPath].concat(
        FlashGotDMCust.prototype.makeArgs.apply(this, arguments)
      );
    };
    
    dm = new FlashGotDMCust("DownloadStudio");
    dm.cookieSupport = true;
    dm.askPath = ASK_NEVER;
    dm.custom = false;
    dm._supported = null;
    
    dm.customSupportCheck = function() {
      var wrk;
      try {
        var path = this.readWinRegString("LOCAL_MACHINE", "SOFTWARE\\Conceiva\\DownloadStudio", "Path");
        if (!path) return false;
        var exeFile = CC["@mozilla.org/file/local;1"].createInstance(CI.nsILocalFile);
        exeFile.initWithPath(path);
        exeFile.append("DownloadStudio.exe");
        if (exeFile.exists() && exeFile.isExecutable()){
          this.exeFile = exeFile;
          this.argsTemplate = "<downloadstudio><originator>firefox</originator> " +
            "<script><add_jobs display_dialog=yes><joblist><job> [<url>URL</url>] " +
            "[<url_list_file>UFILE</url_list_file>] [<referer>REFERER</referer>] " +
            "[<post_data>POST</post_data>] [<cookie>COOKIE</cookie>] " +
            "</job></joblist></add_jobs></script></downloadstudio>";
          return true;
        }
      } catch(e) {}
      return false;
    };
    
  }
  
  const httpFtpValidator = function(url) {
    return /^(http:|ftp:)/.test(url);
  };
  dm = new FlashGotDM("Star Downloader");
  dm.cookieSupport = false;
  dm.isValidLink = httpFtpValidator;
  dm._waitForNative = false;
  
  dm = new FlashGotDM("TrueDownloader");
  dm.isValidLink = httpFtpValidator;
  dm._waitForNative = false;
  
  dm = new FlashGotDM("Thunder");
  dm.nativeUI = "#ThunderDownloadUp, #ThunderDownload, #ThunderDownloadAll";
  dm.thunderDelay = 3000;
  dm.performDownload = function(links, opType) {
    var self = this;
    var postCall = function() {
      self.__proto__.performDownload.call(self, links, opType);
    }
    try {
      var path = this.readWinRegString("LOCAL_MACHINE","Software\\Thunder Network\\ThunderOem\\thunder_backwnd", "Path");
      var exeFile = CC["@mozilla.org/file/local;1"].createInstance(CI.nsILocalFile);
      exeFile.initWithPath(path);
      this.runNative([], false, exeFile);
      this.service._delay(postCall, this.thunderDelay); // give thunder one second to popup (more if cold start)
      this.thunderDelay = 1000;
      return;
    } catch(e) {}
    postCall;
  }
  new FlashGotDM("Thunder (Old)");
  
  
  if (isWin) {
    dm = new FlashGotDM("WellGet");
    dm.getRelativeExe = function() {
      try {
        return this.service.prefs.getComplexValue("WellGet.path", CI.nsILocalFile);
      } catch(ex) {}
      return null;
    };
    dm.customSupportCheck = function() {
      var wellGetExe = this.getRelativeExe();
      try {
         var currentPath = wellGetExe.path;
         if(wellGetExe.exists() && wellGetExe.isExecutable()) return true;
         
         wellGetExe.initWithPath(this.service.profDir.path.substring(0,2) +
           currentPath.substring(2));
         if (wellGetExe.exists() && wellGetExe.isExecutable()) {
           if(wellGetExe.path != currentPath) {
              this.service.prefs.setComplexValue("WellGet.path",  CI.nsILocalFile, wellGetExe);
           }
           return true;
         }
         return false;
      } catch(ex) {
      }
      
      return !wellGetExe && this.baseSupportCheck();
    };
    dm.createJob = function(links, opType) {
      var wellGetExe = this.getRelativeExe();
      return FlashGotDM.prototype.createJob.call(this, links, opType, 
        wellGetExe ? [wellGetExe.path] : null);
    };
    dm.shouldList = function() { return true; }
  }
  
  dm = new FlashGotDMX("Aria", "aria", "[-r REFERER] [-d FOLDER] -g [URL]");
  dm.createJob = function(links,opType) {
    return FlashGotDMX.prototype.createJob.call(this,links,opType) + "\nsleep 4\n" + this.unixCmd+" -s &\n";
  };
  dm._waitForNative = false;
  
  dm = new FlashGotDMX("Downloader 4 X (nt)", "nt");
  dm.createJob = function(links,opType) {
    return this.unixCmd + "&\nsleep 1\n" +
      (links.folder && links.folder._fgSelected
      ? this.unixCmd + " -d '" + links.folder + "'\n"
      :"") + 
      FlashGotDMX.prototype.createJob.call(this,links,opType);
  };
  
  dm = new FlashGotDMX("Downloader 4 X", "d4x", "[--referer REFERER] [--directory FOLDER] [-a URL] [--al POST] [COOKIE]");
  dm.askPath = [false, true, true];
  dm.cookieSupport = true;
  dm.createJob = function(links, opType) {
    const service = this.service;
    const shellEsc = this.shellEsc;
    const referrer = shellEsc(this.getReferrer(links));
    const folder = links.folder._fgSelected && links.folder || null;
    const quiet = service.getPref(this.codeName + ".quiet",false);
    const len = links.length;
    var job;
    
    if (len > 0) {
        
      var urls = [];
      for (var j = 0; j < len; j++) {
        urls.push(shellEsc(links[j].href));
        this.updateProgress(links, j, len);
      }
      urls = urls.join(" ");
      
      var promptURLs_fakePost = null;
      var quietURLs_fakeCookie = null;
      
      if (quiet) {
        quietURLs_fakeCookie = urls;
        urls = null;
      } else if(len>1) {
        promptURLs_fakePost = urls;
        urls = null;
      }
      
      var cookieFile = this.createCookieFile();
      
      job = cookieFile
        ? "mkdir -p $HOME/.netscape && ln -fs " + 
          shellEsc(this.createCookieFile().path) + 
          " $HOME/.netscape/cookies\n"
        : "";
       
      job += this.createCmdLine({
         URL: urls, 
         REFERER: referrer,
         COOKIE: quietURLs_fakeCookie || null,
         FOLDER: folder,
         POST: promptURLs_fakePost
      });
    } else job = "";
    
    return job;
  };
  
  dm = new FlashGotDMX("GNOME Gwget","gwget");
  dm.askPath = ASK_NEVER;
  dm.createJob=function(links, opType) {
    if (opType == service.OP_ALL) {
      links.length = 1;
      links[0].href = links.document ? links.document.URL : this.getReferrer(links);
      opType = service.OP_ONE;
    }
    return FlashGotDMX.prototype.createJob.call(this, links, opType)
  } 
  
  dm = new FlashGotDMX("KDE KGet","kget");
  dm.askPath = ASK_NEVER;
  
  if (isWin) {
    new FlashGotDM("wxDownload Fast");
  } else {
    dm=new FlashGotDMX("wxDownload Fast", "wxdfast", "[-reference REFERER] [-destination FOLDER] [-list UFILE]");
    dm.askPath = ASK_NEVER;
  }

  dm = new FlashGotDMX("cURL","curl", '-L -O [--referer REFERER] [-b COOKIE] [-d POST] [URL]');
  dm.postSupport = true;
  if (FlashGotDMMac.isMac) dm.priority = "zzzz"; // prefer built-in
  dm.createJob = function(links,opType) {
    var job="[ -x \"`which 'xterm'`\" ] &&  DOWN_CMD='xterm -e curl' || DOWN_CMD='curl'\n";
    if (links.folder) job += "cd '" + links.folder + "'\n";
    this.unixCmd = "$DOWN_CMD";
    return job + FlashGotDMX.prototype.createJob.call(this,links,opType);
  };
  
  dm = new FlashGotDMX("Wget", "wget", '-c [--directory-prefix=FOLDER] [--referer=REFERER] [--post-data=POST] [--load-cookies=CFILE] [--header=Cookie:COOKIE] [--input-file=UFILE]');
  dm.postSupport = true;
  dm.createJob=function(links,opType) {
    var job="[ -x \"`which 'xterm'`\" ] &&  DOWN_CMD='xterm -e wget' || DOWN_CMD='wget'\n";
    this.unixCmd = "$DOWN_CMD";
    return job + FlashGotDMX.prototype.createJob.call(this,links,opType);
  };
  
  dm = new FlashGotDMX("Aria 2", "aria2c", '--continue [-d FOLDER] [--referer=REFERER] [--load-cookies=CFILE] [--input-file=UFILE]');
  dm.postSupport = false;
  dm.createJob=function(links,opType) {
    var job="[ -x \"`which 'xterm'`\" ] &&  DOWN_CMD='xterm -e aria2c' || DOWN_CMD='aria2c'\n";
    this.unixCmd = "$DOWN_CMD";
    return job + FlashGotDMX.prototype.createJob.call(this,links,opType);
  };

  function FlashGotDMSD(version) {
    this._initMac(typeof(version) == "number" && version > 3 ? "Speed Download" : ("Speed Download " + version), "Spee");
    this.version = version;
    if (version > 2 || version == "Lite") {
      this.cookieSupport = true;
      this.postSupport = true;
    }
  };
  
  FlashGotDMSD.prototype=new FlashGotDMMac();
  FlashGotDMSD.prototype.createJob = function(links,opType) {
    var urlList = [];
    var cookieList = [];
    var l;
    for (var j=0, len = links.length; j < len; j++) {
      l = links[j];
      urlList.push(l.href);
      if (this.cookieSupport) {
        cookieList.push(this.getCookie(l, links));
      }
      this.updateProgress(links, j, len);
    }
    var job = 'tell app "' + this.macAppName + 
      '" to AddURL {"' + urlList.join('","') + '"}';
    
    if (this.postSupport) {

      if (links.postData) { 
        job +=' with form data "' + links.postData + '"';
      }

      const referer = this.getReferrer(links);
      if (referer && referer.length) {
        job += ' from "' + referer + '"';
      }

      if (cookieList.length) {
        job += ' with cookies {"' + cookieList.join('","') + '"}';
      }
    }
    
    return job;
  };
  
  if (service.getPref("oldSD", false)) {
    new FlashGotDMSD(2);
    new FlashGotDMSD(3);
  }
  new FlashGotDMSD(3.5);
  new FlashGotDMSD("Lite");
  
  dm = new FlashGotDMMac("Leech", "com.manytricks.Leech");
  dm.askPath = [true, true, true];
  dm.cookieSupport = dm.postSupport = true;
  dm.createJob = function(links, opType) {
    var urlList = [];
    var cookieList = [];
    var l;
    for (var j = 0, len = links.length; j < len; j++) {
      l = links[j];
      urlList.push(l.href);
      if (this.cookieSupport) {
        cookieList.push(this.getCookie(l, links).replace(/;\s*$/, ''));
      }
      this.updateProgress(links, j, len);
    }
    
    var job = 'tell app "' + this.macAppName + '" to download URLs {"'
      + urlList.join('", "') + '"}';
    if (links.postData) {
      job += ' by posting data "' + links.postData + '"';
    }
    job += ' to POSIX path "' + links.folder + '"';
    if (cookieList.length) {
      job += ' using cookies "' + cookieList.join('; ') + '; "'; 
    }
    const referer = this.getReferrer(links);
    if (referer && referer.length) {
      job += ' with referrer "' + referer + '"';
    }
    
    return job;
  }
  
  dm = new FlashGotDMMac("iGetter", "iGET");
  dm.cookieSupport = true;
  dm.createJob = function(links, opType) {
    const referrer = this.getReferrer(links);
    var l, params = [];
    for (var j = 0, len = links.length; j < len; j++) {
      l = links[j];
      params.push('{\u00ABclass ----\u00BB:"' + l.href + 
        '", \u00ABclass refe\u00BB:"' + referrer  + 
        '", \u00ABclass cook\u00BB:"' + this.getCookie(l, links) +
        '"}');
      this.updateProgress(links, j, len);
    }
    var job = "tell application \""+ this.macAppName+ 
      "\"\n\u00ABevent iGETGURL\u00BB {" +
       params.join(",") +
      "} given \u00ABclass brsg\u00BB:\"MOZB\"\n" +
      "end tell\n";
    return job;
  };
  

  
  
  if ("nsIDownloadManager" in CI) {
    dm = new FlashGotDM(service.getString("dm.builtIn"));
    dm._codeName = "_Built_In_";
    dm._supported = true;
    dm.priority = "zzz"; // put on the bottom of the list
    
    dm.askPath = [true, true, true];
    dm.postSupport = true;
    dm.performDownload = function(links, opType) {
      var ios = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
      const persistFlags = CI.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
      const dType = CI.nsIDownloadManager.DOWNLOAD_TYPE_DOWNLOAD;
      var postData = links.postStream || null;
      var cs = links.document && links.document.characterSet || "UTF-8";
      var ref = this.getReferrer(links);
      var refURI = ref && ios.newURI(ref, cs, null) || null;
      var uri, folder, file, m;
      var persist, args;
      var now = Date.now() * 1000;
      var dm = CC["@mozilla.org/download-manager;1"].getService(CI.nsIDownloadManager);
      folder = CC["@mozilla.org/file/local;1"].createInstance(CI.nsILocalFile);
      folder.initWithPath(links.folder);
      var mozAddDownload;
      if(dm.startBatchUpdate) {
        mozAddDownload = typeof(dType) == "undefined" 
          ? function(src, dest, des, persist) { return dm.addDownload(src, dest, des, null, now, null, persist); }
          : function(src, dest, des, persist) { return dm.addDownload(dType, src, dest, des, null, null, now, null, persist); }
          ;
        dm.startBatchUpdate();
      } else {
        mozAddDownload = function(src, dest, des, persist) { return dm.addDownload(dType, src, dest, des, null, now, null, persist); };
      }
      var dl;
      for(var j = 0, len = links.length, l; j < len; j++) {
        l = links[j];
        try {
          uri = ios.newURI(l.href, cs, null);
          if(!(uri instanceof CI.nsIURL)) continue;
          file = folder.clone();
          file.append(
            l.fname ||
            unescape((uri.fileName || uri.filePath.replace(/.*?([^\/]*)\/?$/, '$1') || uri.host))
            .replace(/[\x00-\x1f\\\/\&\|\^;:]+/g, '_')
            );
          if(!this.getPref("overwrite", false)) {
            for (;;) {
              if(!file.exists()) {
                file.create(0, 0644);
                break;
              } else { // rename
                m = file.leafName.match(/(.*?)(?:\((\d+)\))?(\.[^\.]+$|$)/);
                file.leafName = m[1] + "(" + ((m[2] && parseInt(m[2]) || 0) + 1) + ")" + m[3]; 
              }
            }
          }
          persist = CC["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(CI.nsIWebBrowserPersist);
          persist.persistFlags = persistFlags;
          
          this.service.log("Saving " + l.href + " to " + file.path);
          
          persist.progressListener = dl = 
            mozAddDownload(uri, ios.newFileURI(file), file.leafName, persist)
              .QueryInterface(CI.nsIWebProgressListener);
          persist.saveURI(uri, null, // cachekey
                  refURI, postData, null, file);
          this.updateProgress(links, j, len);
        } catch (e) {
          this.service.log("Skipping link " + l.href + ": " + e);
        }
      }
      if(dm.endBatchUpdate) dm.endBatchUpdate();
      if(dm.flush) dm.flush();
      
      if(this.getPref("showDM", true)) {
        try { // SeaMonkey
          dm.open(links.browserWindow, dl);
        } catch(notSeamonkey) {
          
          const DMBRANCH = "browser.download.manager.";
          var prefs = this.service.prefService.getBranch(DMBRANCH);
          try {
            if (!(prefs.getBoolPref("showWhenStarting") && prefs.getBoolPref("useWindow")))
              return;
          } catch(noPref) {
            return;
          }
          
          
          
          try { // 1.9 (Toolkit)
             // http://mxr.mozilla.org/seamonkey/source/toolkit/components/downloads/src/nsDownloadProxy.h#94
             var dmui = CC["@mozilla.org/download-manager-ui;1"].getService(CI.nsIDownloadManagerUI);
             var focus = false;
             try {
               focus = prefs.getBoolPref("focusWhenStarting");
             } catch(noPref) {}
             if (dmui.visible && !focus) {
               dmui.getAttention();
               return;
             }
             dmui.show(null, dl, CI.nsIDownloadManagerUI.REASON_NEW_DOWNLOAD);
          } catch(e1) {
            try { // 1.8 (Firefox 2)
              links.browserWindow.document.getElementById("Tools:Downloads").doCommand();
            } catch(e2) {
            }
          }
        }
      }
    };
  }
  
  FlashGotDMCust.init(service);
  
  service.sortDMS();
  
  dm = null;
};

// *****************************************************************************
// HTTP interceptor (nsIURIContentListener + http-on-modify-request observer)
// *****************************************************************************

function HttpInterceptor(service) {
  this.service = service;

  CC["@mozilla.org/uriloader;1"].getService(
    CI.nsIURILoader).registerContentListener(this);
}

HttpInterceptor.prototype = {
  service: null,
  
  autoStart: false,
  interceptAll: true,
  bypassAutoStart: false,
  forceAutoStart: false,
  
  lastPost: null, // last uploadChannel
 
  interfaces: [
    CI.nsIURIContentListener,
    CI.nsIObserver, 
    CI.nsISupportsWeakReference,
    CI.nsISupports
  ],
  
  QueryInterface: function(iid) {
     xpcom_checkInterfaces(iid, this.interfaces, Components.results.NS_ERROR_NO_INTERFACE);
     return this;
  },
  
  setup: function() { // profile initialization
    this.autoStart = this.service.getPref("autoStart", false);
    this.interceptAll = this.service.getPref("interceptAll", true);
  },
  
  dispose: function() {
    CC["@mozilla.org/uriloader;1"].getService(
        CI.nsIURILoader).unRegisterContentListener(this);
  },
  
  log: function(msg) {
    this.service.log(msg);
  },
  
  _shouldIntercept: function(contentType) {
    // dump("FG: _shouldIntercept("+contentType+")\n");
    if (this.bypassAutoStart) return false;
    const service = this.service;
    if (!(service.DMS && service.DMS.found)) return false;
    if (this.forceAutoStart) return true;
    
    if (!this.autoStart) return false;
    
    if (this.interceptAll &&
      !/\bxpinstall|text|xml|vnd\.mozilla|multipart\/x-mixed-replace\b/.test(contentType)) {
      return true;
    }

    if (contentType == "application/x-unknown-content-type" || /\b(?:xml|rss|javascript|json)\b/.test(contentType)) return false;
    var ms = MediaSniffer.mimeService;
    return service.extensions.some(function(e) {
      try { return contentType == ms.getTypeFromExtensions(e); } catch(ex) { return false; }
    });
  }
, 
  _willHandle: function(url, contentType) {
    if (!/^(http|https|ftp|sftp|rtsp|mms):/i.test(url) ) {
      if ((/^\s*javascript/i).test(url)) this.log("JavaScript url intercepted: "+url);
      return false;
    }
    return true;
  }
,
  extractPostData: function(channel, res) {
    res = res || {};
    res.postData = res.postStream = null;
    if (channel instanceof CI.nsIUploadChannel &&
       channel.uploadStream instanceof CI.nsISeekableStream) {
      this.log("Extracting post data...");
      var sis;
      try {
        res.postStream = channel.uploadStream;
        res.postStream.seek(0, 0);
        sis = CC['@mozilla.org/scriptableinputstream;1'].createInstance(CI.nsIScriptableInputStream);
        sis.init(res.postStream);
        var postData  = sis.read(sis.available());
        res.postStream.seek(0, 0);
        
        // buffered persistent copy 
        res.postStream = CC["@mozilla.org/io/string-input-stream;1"].createInstance(CI.nsIStringInputStream);
        res.postStream.setData(postData, postData.length);
        if (res.postStream instanceof CI.nsISeekableStream) res.postStream.seek(0, 0);
        
        // remove headers
        postData = postData.replace(/\s+$/,'').split(/[\r\n]+/)
        res.postData = postData[postData.length - 1];
      } catch(ex) {
        this.log(ex.message);
      } finally {
        if (sis) sis.close();
      }
    }
    return res;
  },
  /* nsIURIContentListener */
  
  canHandleContent: function(contentType, isContentPreferred, desiredContentType) {
    // dump("FG: canHandleContent "+contentType+")\n");
    return this._shouldIntercept(contentType);
  }
,
  lastRequest: null,
  doContent: function(contentType, isContentPreferred, channel, contentHandler) {

    channel.QueryInterface(CI.nsIChannel);
    const uri = channel.URI;
    // dump("FG: doContent " +contentType + " " + uri.spec + "\n");
    if (!this._willHandle(uri.spec, contentType)) {
      throw new Error("FlashGot not interested in " + contentType + " from " + uri.spec);
    }
    
    this.log("Intercepting download...");

    const pathParts=uri.path.split(/\//);
    var links = [ {
     href: channel.URI.spec, 
     description: pathParts[pathParts.length-1],
     noRedir: true
    } ];
    
    
    
    if (channel instanceof CI.nsIHttpChannel) {
      links.referrer = channel.referrer && channel.referrer.spec || "";
      this.extractPostData(channel, links);
    }
    
    try {
        links.document = channel.notificationCallbacks.QueryInterface(
            CI.nsIInterfaceRequestor).getInterface(
            CI.nsIDOMWindow).document;
        links.browserWindow = DOMUtils.getChromeWindow(links.document.defaultView.top);
        if (links.browserWindow.wrappedJSObject) links.browserWindow = links.browserWindow.wrappedJSObject;
      } catch(e) {
        this.log("Can't set referrer document for " + links[0].href + " from " + links.referrer);
    }
    
    var firstAttempt;
    if (contentHandler) {
      this.lastRequest = null;
      firstAttempt = true;
      this.forceAutoStart = false;
    } else {
      var requestLines = [ channel.requestMethod, links[0].href, links.referrer || "", links.postData || ""].join("\n\n");
      firstAttempt = this.lastRequest != requestLines;
      this.lastRequest = requestLines;
    }
    
    if (firstAttempt) {
       var self = this;
       this.service._delay(function() {
          self.forceAutoStart = false;
          if(self.service.download(links))
            self.log("...interception done!");
        }, 10);
    } else {
      // dump("Second attempt, skipping.\n");
      this.lastRequest = null;
      this.forceAutoStart = false;
    }
    
    if (!channel.isPending()) { 
      try {
        channel.requestMethod = "HEAD";
        channel.loadFlags = CI.nsIChannel.LOAD_RETARGETED | CI.nsIChannel.LOAD_RETARGETED_DOCUMENT_URI | CI.nsICachingChannel.LOAD_ONLY_FROM_CACHE;
      } catch(e) {}
    }
    channel.cancel(NS_BINDING_ABORTED); 

    this.log("Original request cancelled.");
    
    return true;
  },
  contentHandler: {
      onStartRequest: function(request, context) { 
        throw "cancelled"; 
      }, 
      onStopRequest: function() {}, 
      onDataAvailable: function() {}
   }
,
  isPreferred: function(contentType, desiredContentType) {
    // dump("FG: isPreferred("+contentType+","+desiredContentType+")\n");
    return this._shouldIntercept(contentType);
  }
,
  onStartURIOpen: function(uri) {
    // dump("FG: onStartURIOpen "+ uri + (uri && uri.spec) + "\n");
    return false;
  }
,
  // http-on-modify-request Observer 
  observe: function(channel, topic, data) {
    if (channel instanceof CI.nsIHttpChannel) {
      
      if (channel instanceof CI.nsIUploadChannel) {
        this.lastPost = channel;
      }
      if (this.forceAutoStart) {
        this.doContent("flashgot/forced", true, channel, null);
        return;
      }
      
      
    }
  }
}

var MediaSniffer = {
  interfaces: [
    CI.nsIObserver, 
    CI.nsISupportsWeakReference,
    CI.nsISupports,
    CI.nsIWebProgressListener
  ],
  
  QueryInterface: function(iid) {
     xpcom_checkInterfaces(iid, this.interfaces, Components.results.NS_ERROR_NO_INTERFACE);
     return this;
  },
  fg: null,
  
  debug: false,
  // http-on-examine-response Observer
  
  mimeService: CC['@mozilla.org/uriloader/external-helper-app-service;1']
                     .getService(CI.nsIMIMEService),
  mediaTypesRx: /\b(?:audio|video|smil)\b/i,
  mediaMap: {
    "asx": "video/x-ms-asx", // fake, see "media" processor
    "flv": "video/flv", // flv is not mapped by MimeService
    "f4v": "video/mp4",
    "f4a": "video/mp4",
    "f4b": "video/mp4",
    "f4p": "video/mp4",
    "mp3": "audio/mp3", // MimeService chokes on this
    "mp4": "video/mp4" // just to be sure :)
  },
  get inverseMediaMap() {
    var m = {};
    for (var p in this.mediaMap) m[this.mediaMap[p]] = p;
    delete this.inverseMediaMap;
    return this.inverseMediaMap = m;
  },
  
  sniffType: function(channel, forcedContentType) {
    var path;
    if (channel instanceof CI.nsIHttpChannel) {
      try {
        path = channel.getResponseHeader("content-disposition");
      } catch(e) {}
     }
    if (!path) path = channel.URI.path;
    path = path.replace(/#[\s\S]*/, '');
    if (path.length > 1024) path = path.substring(0, 1024);
    const extFinder = /([^"\/]+\.(\w{2,5}))(?=[\?&]|$)/g;
    extFinder.lastIndex = 0;
    var m, ext, contentType, ms;
    while((m = extFinder.exec(path))) {
      ext = m[2];
      if ((contentType = this.mediaMap[ext])) break;
      try {
        contentType = this.mimeService.getTypeFromExtension(ext);
        if (this.mediaTypesRx.test(contentType)) break;
      } catch(e) {}
    }
    
    var fname;
    if (forcedContentType && !(forcedContentType == "video/x-ms-asf" && contentType == "video/x-ms-asx")) {
      var fname = m && m[1];
      if (!fname) {
        fname = (channel.URI instanceof CI.nsIURL) && channel.URI.fileName || path.replace(/.*\//g, '');
        try {
          fname += "." + (this.inverseMediaMap[forcedContentType] || this.mimeService.getPrimaryExtension(forcedContentType, '')); 
        } catch(ex) {}
      }
      return { fname: fname, contentType: forcedContentType };
    }
    
    return m && { fname: m[1], contentType: contentType };
  },
  
  observe: function(channel, topic, data) {
    if (channel instanceof CI.nsIChannel) {
      try {
        var contentType = channel.contentType;
        if (!contentType || /\b(?:x?html|image|css|javascript|shockwave)\b/i.test(contentType)) return;
        
        if (this.debug) dump("Examining " + channel.URI.spec + " (" + contentType + ")\n");
        
        var typeInfo = null;
        if (this.mediaTypesRx.test(contentType) || (typeInfo = this.sniffType(channel))) {

          var win = (channel.notificationCallbacks || channel.loadGroup.notificationCallbacks)
            .QueryInterface(
              CI.nsIInterfaceRequestor).getInterface(
              CI.nsIDOMWindow).top;

          if (this.debug) dump("Media Window: " + win + " - " + win.location.href + " -- " + contentType + "\n");
          var media = win._flashgotMedia || (win._flashgotMedia = []);
          var url = channel.URI.spec;
          var map = media._map || (media._map = {});
          
          if (!(url in map)) {
            // asf content type can also refer to an asx, we need to check the file name to decide
            if (!typeInfo) {
              typeInfo = this.sniffType(channel, contentType)
            }
            
            contentType = typeInfo.contentType;
            
            var tip = url.match(/[^\/]*$/)[0] || '';
            if (tip) {
                tip = contentType + ": " + tip;
                if (tip.length > 60) {
                    tip = tip.substring(0, 29) + "..." + tip.slice(-28); 
                }
            } else tip = contentType;
            
            var title = win.document.title || '';
            const unicode = this.fg.getPref("media.unicode") && /^UTF.?8$/i.test(win.document.characterSet);
            if (title) {
              // remove site name from title
              title = title.replace(new RegExp("\\b(?:" +
                  (win.location.host || '').split(".").filter(function(s) { return s }).join("|")  + ")\\b", 'ig'), '')
                  .replace(/https?:\/{2}/gi, '').replace(unicode ? /^[^\w\u0080-\uffff]*(.*?)[^\w\u0080-\uffff]*$/g : /^\W*(.*?)\W*$/g, '$1').replace(unicode ? /[\u0000-\u0020]+/g : /\W+/g, '_')
            }
            
            var fname = title && this.fg.getPref("media.guessName", true) && (title + "_" + typeInfo.fname)
              .replace(unicode ? /[^\w\.\u0080-\uffff]+/g : /[^\w\.]+/g, '_').replace(/_get_video\b/, '')
                        || '';
          
            var redirect;
            var host = (channel.originalURI || channel.URI).host;
            if (host) {
              host = host.replace(/\./g, '_');
              while(host && (redirect = this.fg.getPref("media.redirect." + host, -1)) == -1) {
                host = host.replace(/.*?(?:_|$)/, '');
              }
            }
            if (redirect == -1) redirect = this.fg.getPref("media.redirect", 0); // 0 - no redirect, 1 redirect, 2 include both initial and final url
            if (redirect == 0) url = channel.originalURI && channel.originalURI.spec || url;
            while(url) {
              media.push (map[url] = {
                href: (fname && this.fg.getPref("media.forceNameHack", true) && url.indexOf("#") == -1) ? url + "#/" + encodeURIComponent(fname) : url,
                referrer: (channel instanceof CI.nsIHttpChannel) && channel.referrer && channel.referrer.spec,
                description: title + " (" + contentType + ")",
                contentType: contentType,
                tip: tip,
                fname: fname
              });
              
              url = redirect == 2 && (!channel.originalURI || channel.originalURI.spec == url ? null : channel.originalURI.spec);
            }
          }

          var bw = DOMUtils.mostRecentBrowserWindow;
          if (bw && bw.gFlashGot) bw.gFlashGot.updateMediaUI();
          
          if (this.debug) dump(win._flashgotMedia && win._flashgotMedia.toSource() + "\n");
        }
      } catch(e) {
        var msg = topic + " " + e.toString();
        if (channel) {
          msg += " -- " + channel.URI.spec;
          try {
            msg += ", " + channel.contentType;
          } catch(e1) {}
        }
        if (this.debug) dump(msg + "\n");
      }
    }
  },
  
  onStateChange: function(wp, channel, stateFlag) {
    // here we wait STATE_STOP of cached channels
    if ((stateFlag & 16) && (channel instanceof CI.nsICachingChannel))
      this.observe(channel, "http-cached-stop", null);
  }
  /*
  ,
  onLinkIconAvailable: function() {},
  onLocationChange: function() {},
  onStatusChange: function() {},
  onSecurityChange: function() {}, 
  onProgressChange: function() {}
  */
}


// *****************************************************************************
// XPCOM Service
// *****************************************************************************

const SHUTDOWN = "profile-before-change";
const STARTUP = "profile-after-change";

function FlashGotService() {
  
  const os = CC['@mozilla.org/observer-service;1'].getService(CI.nsIObserverService);
  
  os.addObserver(this, SHUTDOWN, false);
  os.addObserver(this, "xpcom-shutdown", false);
  os.addObserver(this, STARTUP, false);

}

FlashGotService.prototype = {
  OP_ONE: 0, 
  OP_SEL: 1,
  OP_ALL: 2,
  OP_QET: 3
,
  VERSION: "1.1.8"
,
  domUtils: DOMUtils,
  get wrappedJSObject() {
    return this;
  }
,
  unregister: function() {
    try {
      const os = this.observerService;
      os.removeObserver(this, "em-action-requested");
      os.removeObserver(this, SHUTDOWN);
      os.removeObserver(this, "xpcom-shutdown");
      os.removeObserver(this, STARTUP);
    } catch(ex) {
      this.log("Error unregistering service as observer: "+ex);
    }
  }
,
  QueryInterface: function(iid) {
     xpcom_checkInterfaces(iid, SERVICE_IIDS, Components.results.NS_ERROR_NO_INTERFACE);
     return this;
  }
,
  observerService: CC['@mozilla.org/observer-service;1'].getService(CI.nsIObserverService),
  /* nsIObserver */  
  observe: function(subject, topic, data) {
    if (subject == this.prefs) {
      this.syncPrefs(data);
    } else {
      switch (topic) {
        case "xpcom-shutdown":
          this.unregister();
          break;
        case SHUTDOWN: 
          this.cleanup();
          break;
        case STARTUP:
          this.init();
          this.interceptor.setup();
          const osvr = CC['@mozilla.org/observer-service;1'].getService(CI.nsIObserverService);
          osvr.addObserver(this, "em-action-requested", false);
          break;
        case "em-action-requested":
          if ((subject instanceof CI.nsIUpdateItem)
              && subject.id == EXTENSION_ID) {
            if (data == "item-uninstalled") {
              this.uninstalling = true;
            } else if (data == "item-enabled" || data == "item-cancel-action") {
              this.uninstalling = false;
            }
          }
        break;
      }
    }
  },
  uninstalling: false
,
  syncPrefs: function(name) {
    this.logEnabled = this.getPref("logEnabled", true);
    if (name) {
      switch (name) {
        case "hide-icons":
          var w;
          for (var wins = this.windowMediator.getEnumerator(null); wins.hasMoreElements();) {
             w=wins.getNext();
             if (typeof(w.gFlashGot)=="object" && w.gFlashGot.toggleMainMenuIcon) {
               w.gFlashGot.toggleMainMenuIcon();
             }
          }
        break;
        
        case "autoStart":
        case "interceptAll":
          this.interceptor[name] = this.getPref(name);
        break;
      
      }
    }
  }
,
  
  get defaultDM() {
    return this.getPref("defaultDM", null);
  },
  set defaultDM(name) {
    this.setPref("defaultDM", name);
    return name;
  },

  get isWindows() {
    return ("nsIWindowsShellService" in CI) || ("@mozilla.org/winhooks;1" in CC);
  }
,

  get extensions() {
    var s = this.getPref("extensions", "");
    return s ? s.split(/[\s,]+/) : [];
  },
  set extensions(v) {
    var arr = ((typeof(v) == "object" && v.join)
        ? v
        : typeof(v) == "string" && v && v.toLowerCase().split(',') || []
        ).map(function(e) { return e && e.replace(/[^\w\-]/g, '') })
         .filter(function(e) { return e });
    arr.sort();
    this.setPref("extensions", arr.join(','));
    return arr || [];
  },
  addExtension: function(e) {
    this.extensions = this.extensions.concat(e);
  }
,
  extractIds: function(css) {
    var ids = css.match(/#[^ ,]+/g);
    for(var j = ids.length; j-- > 0; ids[j] = ids[j].substring(1));
    return ids;
  },
  hideNativeUI: function(document, selectors) {
    var s = selectors + " {display: none !important}";
    if("nsIDownloadManagerUI" in CI) { // Toolkit, sync stylesheets
      this.domUtils.updateStyleSheet(s, true);
    } else {
      for each (var id in this.extractIds(selectors)) try {
        document.getElementById(id).style.display = "none";
      } catch(e) {}
    }
    (document._FlashGot_NativeUI_styleSheets || 
      (document._FlashGot_NativeUI_styleSheets = [])
    ).push(s);
  },
  restoreNativeUIs: function(document) {
     var ss = document._FlashGot_NativeUI_styleSheets;
     if(!ss) return;
     var toolkit = "nsIDownloadManagerUI" in CI;
     var id;
     for each (var s in ss) {
       if(toolkit) {
         this.domUtils.updateStyleSheet(s, false);
       } else {
          for each (id in this.extractIds(s)) try {
            document.getElementById(id).style.display = "";
          } catch(e) {}
       }
     }
     document._FlashGot_NativeUI_styleSheets = null;
  },
  _httpServer: null,
  get httpServer() {
    if (typeof(FlashGotHttpServer) != "function") {
      CC["@mozilla.org/moz/jssubscript-loader;1"]
          .getService(CI.mozIJSSubScriptLoader)
          .loadSubScript("chrome://flashgot/content/flashgotHttpServer.js", null);
    }
    return ((!this._httpServer) || this._httpServer.isDown) ?
       this._httpServer=new FlashGotHttpServer(this)
      :this._httpServer;
  }

,
  download: function(links, opType, dmName) {
    
    switch (links.length) {
      case 0: 
        return false;
      case 1: 
        opType = this.OP_ONE; 
        break;
      default:
        if (!opType) opType = this.OP_SEL;
    }
    
    if (!dmName) dmName = this.defaultDM;
    const dm = this.DMS[dmName];
    if (!dm) {
      this.log("FlashGot error: no download manager selected!");
      return false;
    }
    
    // surrogate missing attributes
    
    if (!links.progress) {
      links.progress = { update: function() {} };
    } else {
      links.progress.update(12);
    }
    
   
    var service = this;
    this._delay(function(t) { service._downloadDelayed(links, opType, dm); }); 
    return true;
  },
  
  _downloadDelayed: function(links, opType, dm) {
    
     if (!links.postData) { 
      links.postData = null;
    } else if(!dm.postSupport) {
      // surrogate POST parameters as query string
      links[0].href += (links[0].href.indexOf("?") > -1 ?  "&" : "?") + links.postData;
    }

    const encodedURLs = this.getPref(dm.getPref("encode"), this.getPref("encode", true));

    const extFilter = this.getPref("extfilter", false) && !this.interceptor.interceptAll ?
        new RegExp("\.(" +
          this.extensions.join("|").replace(/[^\w-|]/,"") + 
          ")\\b", "i") : null;
    
    var logMsg = "Processing "+links.length+" links ";
    if (this.logEnabled && typeof(links.startTime) == "number") {
      logMsg += "scanned in ms" + (Date.now() - links.startTime);
    }
    
    

    if (!links.startTime) links.startTime = Date.now();
    const pg = links.progress;
    
    const escapeCheckNo=/(%[0-9a-f]{2,4})/i;
    const escapeCheckYes=/[\s]+/;
    
    var len = links.length;
    
    var filters = null;
    
    if (len > 1) {
      filters = [];
      
      const isValid = dm.isValidLink; 
      if (isValid)  filters.push(function(href) { return isValid(href) });
      if (extFilter) filters.push(function(href) { return extFilter.test(href) });

      if (filters.length) {
        filters.doFilter = function(href) {
          for (var j = this.length; j-- > 0;) if(!this[j](href)) return false;
          return true;
        }
      } else {
        filters = null;
      }
    }
    
    
    const map = {};
    pg.update(10);
    
    const stripHash = dm.getPref("stripHash", false);
    
    var j, l, href, ol, pos1, pos2;
    for (j = 0; j < len; j++) {
      l = links[j];
      if (l.description) l.description = l.description.replace(/\s+/, ' ');
      l._pos = j;
      href = l.href;
      if ((!filters) || filters.doFilter(href)) {
        ol = map[href];
        if (ol) { // duplicate, keep the longest description
          if (ol.description.length < l.description.length) {
            map[href] = l;
            l.href = ol.href; // keep sanitizations
          }
        } else {
          map[href] = l;
          
          // encoding checks
          try {
            if (encodedURLs) { 
              if (escapeCheckYes.test(href) || !escapeCheckNo.test(href)) { 
                href = encodeURI(href);
              }
              // workaround for malformed hash urls
             
              while ((pos1 = href.indexOf("#")) > -1 // has fragment?
                && href[pos1 + 1] != "!" // skip metalinks!
                && (href.indexOf("?") > pos1 || pos1 != href.lastIndexOf('#')) // fragment before query or double fragment ? 
              ) {
                href = href.substring(0, pos1) + '%23' + href.substring(pos1 + 1);
              }
              
              l.href = href;
            } else {  
              l.href = decodeURI(href);
            }
            if (stripHash) l.href = l.href.replace(/#.*/g, '');
            
          } catch(e) {
            dump("Problem "
              + ( encodedURLs ? "escaping" : "unescaping")
              + " URL " + href + ": "+ e.message + "\n");
          }
        }
      }
    }
    pg.update(25);
    
    links.length = 0;
    for (href in map) links[links.length] = map[href];
    
    if (this.getPref("noDesc", false) || dm.getPref("noDesc", false)) {
      for (j = links.length; j-- > 0;) links[j].description = '';
    } else if(dm.asciiFilter) {
      for (j = links.length; j-- > 0;) {
        l = links[j];
        if(l.description) 
          l.description = l.description.replace(/[^\u0020-\u007f]/g, "") || l.href;
      }
    }
    
    
    this._processRedirects(links, opType, dm);
  },
  
  _processRedirects: function(links, opType, dm) {
    links.progress.update(30);
    var service = this;
    this._delay(function() {
      new RedirectContext(links, opType, dm, function(processedBy) {
        links.redirProcessedBy = processedBy;
        service._sendToDM(links, opType, dm);
        service = null;
      }).process();
    });
  },
  
  _sendToDM: function(links, opType, dm) {
    
    if (this.getPref("httpauth", false)) {
      dm.log("Adding authentication info");
      this._addAuthInfo(links);
    }
    
    if (dm.metalinkSupport && this.getPref("metalink", true)) {
      dm.log("Adding metalink info");
      if (this._processMetalinks(links)) {
        opType = this.OP_SEL; // force "ask path"
      }
    }
    
    if (links.length > 1) {
      dm.log("Sorting again "+links.length+" links");
      links.sort(function(a,b) {
        a=a._pos; b=b._pos;
        return a>b?1:a<b?-1:0;
      });
    }
    
    this._addQsSuffix(links);
    
    links.progress.update(70);
    
    dm.log("Preprocessing done in ms" + (Date.now() - links.startTime) );
    
    // "true" download
    this._delay(function(t) {
        dm.log("Starting dispatch");
        var startTime = Date.now();
    
        dm.download(links, opType);

        var now = Date.now();
        var logMsg = "Dispatch done in ms" + (now - startTime);
        if (typeof(links.startTime) == "number") { 
          logMsg += "\nTotal processing time: ms" + (now - links.startTime);
        }  
        dm.log(logMsg);
      });
  },
  
  _addQsSuffix: function(links) {
    var suffix = this.getPref("queryStringSuffix");
    if (suffix) {
      var rep = function(url, most, qs, hash) {
        return most + (qs ? qs + "&" : "?") + suffix + hash;
      }
      var l;
      for (var j = links.length; j-- > 0;) {
        l = links[j];
        l.href = l.href.replace(/^(.*?)(\?[^#]*)?(#.*)?$/, rep);
      }
    }
  },
  
  _addAuthInfo: function(links) {
    const httpAuthManager = CC['@mozilla.org/network/http-auth-manager;1']
                              .getService(CI.nsIHttpAuthManager);
    const ios = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);
    var uri;
    var udom = {};
    var uname = {};
    var upwd = {};
    var l;
    for (var j = links.length; j-- > 0;) {
      l = links[j];
      try {
        uri = ios.newURI(l.href, null, null);
        if (l.userPass && l.userPass.indexOf(":") > -1) continue;
        httpAuthManager.getAuthIdentity(uri.scheme, uri.host, uri.port < 0 ? (uri.scheme == "https" ? 443 : 80) : uri.port, null, null, uri.path, udom, uname, upwd);
        this.log("Authentication data for " + uri + " added.");
        l.href = uri.scheme + "://" + uname.value + ":" + upwd.value + "@" + 
                 uri.host + (uri.port < 0 ? "" : (":" + uri.port)) + uri.spec.substring(uri.prePath.length);
      } catch(e) {}
    }
  },
  _processMetalinks: function(links) {
    var hasMetalinks = false;
    var l, k, href, pos, parts, couple, key;
    for (var j = links.length; j-- > 0;) {
       l = links[j];
       href = l.href;
       pos = href.indexOf("#!");
       if (pos < 0) continue;
       parts = href.substring(pos + 2).split("#!");
       if (parts[0].indexOf("metalink3!") == 0) continue; // per Ant request
       
       hasMetalinks = true;
       l.metalinks = [];
       for (k = 0; k < parts.length; k++) {
         couple = parts[k].split("!");
         if (couple.length != 2) continue;
         key = couple[0].toLowerCase();
         switch (key) {
           case "md5": case "sha1":
             l[key] = couple[1];
             break;
           case "metalink":
            if (/^(https?|ftp):/i.test(couple[1])) {
              l.metalinks.push(couple[1]);
            }
            break;
         }
       }
    }
    return links.hasMetalinks = hasMetalinks;
  }
,
  _delay: function(callback, time) {
     var timerCallback = { notify: callback }; 
     CC["@mozilla.org/timer;1"].createInstance(CI.nsITimer)
              .initWithCallback(timerCallback, time || 0, CI.nsITimer.TYPE_ONE_SHOT);
  }
,
  yield: function() {
    try {
      const eqs = CI.nsIEventQueueService;
      if (eqs) {
        CC["@mozilla.org/event-queue-service;1"]
          .getService(eqs).getSpecialEventQueue(eqs.UI_THREAD_EVENT_QUEUE)
          .processPendingEvents();
      } else {
        const curThread = CC["@mozilla.org/thread-manager;1"].getService().currentThread;
        while (curThread.hasPendingEvents()) curThread.processNextEvent(false);
      }
    } catch(e) {}
  },
  
  
  
  get bgProcessing() {
    return false;
      // this.getPref("bgProcessing", true);
  }
,
  get prefService() {
    delete this.__proto__.prefService;
    return this.__proto__.prefService = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService);
  }
,
  savePrefs: function() {
    return this.prefService.savePrefFile(null);
  }
,
  getPref: function(name, def) {
    const IPC = CI.nsIPrefBranch;
    const prefs = this.prefs;
    try {
      switch (prefs.getPrefType(name)) {
        case IPC.PREF_STRING:
          return prefs.getCharPref(name);
        case IPC.PREF_INT:
          return prefs.getIntPref(name);
        case IPC.PREF_BOOL:
          return prefs.getBoolPref(name);
      }
    } catch(e) {}
    return def;
  }
,
  setPref: function(name,value) {
    const prefs=this.prefs;
    switch (typeof(value)) {
      case "string":
          prefs.setCharPref(name,value);
          break;
      case "boolean":
        prefs.setBoolPref(name,value);
        break;
      case "number":
        prefs.setIntPref(name,value);
        break;
      default:
        throw new Error("Unsupported type "+typeof(value)+" for preference "+name);
    }
  }
,
  strings: new Strings("flashgot"),
  getString: function(name, parms) {
    return this.strings.getString(name, parms);
  }
,
  _logFile: null,
  get logFile() {
    if (this._logFile==null) {
      this._logFile=this.profDir.clone();
      this._logFile.append("flashgot.log");
    }
    return this._logFile;
  }
,
  logStream: null,
  logEnabled: false,
  log: function(msg) {
    if (this.logEnabled) {
      try {
        if (!this.logStream) {
          const logFile=this.logFile;
          const logStream=CC["@mozilla.org/network/file-output-stream;1"
            ].createInstance(CI.nsIFileOutputStream );
          logStream.init(logFile, 0x02 | 0x08 | 0x10, 0600, 0 );
          this.logStream=logStream;
          const header="*** Log start at "+new Date().toGMTString()+"\n";
          this.logStream.write(header,header.length);
        }
        
        if (msg!=null) {
          msg+="\n";
          this.logStream.write(msg,msg.length);
        }
        this.logStream.flush();
      } catch(ex) {
        dump(ex.message+"\noccurred logging this message:\n"+msg);
      }
    }
  }
,
  dumpStack: function(msg) {
    dump( (msg?msg:"")+"\n"+new Error().stack+"\n");
  }
,
  clearLog: function() {
    try {
      if (this.logStream) {
        try {
          this.logStream.close();
        } catch(eexx) {
          dump(eexx.message);
        }
      }
      if (this.logFile) this.logFile.remove(true);
      this.logStream=null;
      this.log(null);
    } catch(ex) { dump(ex.message); }
  } 
,
  get windowMediator() {
    return CC["@mozilla.org/appshell/window-mediator;1"
      ].getService(CI.nsIWindowMediator);
  }
,
  getWindow: function() {
    return this.windowMediator.getMostRecentWindow(null);
  }
,
  getBrowserWindow: function(document) {
    if (!document) return null;
    var w = DOMUtils.getChromeWindow(document.defaultView.top);
    return w.wrappedJSObject || w; 
  }
,
  get prefs() {
    delete this.__proto__.prefs;
    return this.__proto__.prefs = this.prefService.getBranch("flashgot.").QueryInterface(CI.nsIPrefBranchInternal);
  }
,
  DMS: null,
  tmpDir: null,
  profDir: null,
  _initialized: false,
  init: function() {
    if (this._initialized) return;
    
    const os = this.observerService;
    this.interceptor = new HttpInterceptor(this);
    os.addObserver(this.interceptor, "http-on-modify-request", true);
    MediaSniffer.fg = this;
    if (this.getPref("media.enabled", true)) {
      os.addObserver(MediaSniffer, "http-on-examine-response", true);
      CC['@mozilla.org/docloaderservice;1'].getService(CI.nsIWebProgress)
        .addProgressListener(MediaSniffer, CI.nsIWebProgress.NOTIFY_STATE_NETWORK);
    }
    
    try {
      const startTime = Date.now();
      
      const fileLocator = CC["@mozilla.org/file/directory_service;1"].getService(
        CI.nsIProperties);
      
      var profDir = this.profDir = fileLocator.get("ProfD", CI.nsIFile);
      
      function prepareTmp(t) {
        t.append("flashgot." + encodeURI(profDir.leafName).replace(/%/g,"_"));
        if (t.exists()) {
         if (!t.isDirectory()) t.createUnique(1, 0700);
        } else {
          t.create(1,0700);
        }
        return t;
      }
      
      try {
        this.tmpDir = prepareTmp(this.prefs.getComplexValue("tmpDir", CI.nsILocalFile));
      } catch(ex) {
        this.tmpDir = prepareTmp(fileLocator.get("TmpD", CI.nsILocalFile));
      }
       
      this.prefs.addObserver("", this, false);
      this.syncPrefs();
      
      this.log("Per-session init started");
        
      this._setupLegacyPrefs();

      this.DMS = this.checkDownloadManagers(true, false);
      this.log("Per-session init done in " + (Date.now() - startTime) + "ms");
    } catch(initEx) {
      this._initException = initEx;
      try { this.log(initEx); } catch(e) {}
    }
    this._initialized=true; 
  },

  dispose: function() {
    this.prefs.removeObserver("", this);
    const os = this.observerService;
    os.removeObserver(this.interceptor, "http-on-modify-request");
    this.interceptor.dispose();
    this.interceptor = null;
    try {
      os.removeObserver(MediaSniffer, "http-on-examine-response");
      CC['@mozilla.org/docloaderservice;1'].getService(CI.nsIWebProgress)
        .removeProgressListener(MediaSniffer);
    } catch(e) {}
    
    this._initialized=false;
  }
,
  createCustomDM: function(name) {
    const dm = new FlashGotDMCust(name);
    if (name && name.length) {
      FlashGotDMCust.persist(this);
      this.sortDMS();
      this.checkDownloadManagers(false, false);
    }
    return dm;
  }
,
 removeCustomDM: function(name) {
   const dms = FlashGotDM.dms;
   for (var j = dms.length; j-->0;) {
     if (dms[j].custom && dms[j].name == name) {
       dms.splice(j, 1);
       delete dms[name];
     }
   }
   FlashGotDMCust.persist(this);
   this.checkDownloadManagers(false, false);
 }
,
  sortDMS: function() {
    FlashGotDM.dms.sort(function(a,b) { 
      a = a.priority || a.name.toLowerCase(); 
      b = b.priority || b.name.toLowerCase();
      return a > b ? 1 : a < b ?-1 : 0; 
    });
  }
, 
  checkDownloadManagers: function(init, detect) {
    
    if (init || detect) FlashGotDM.init(this);
    
    const dms = FlashGotDM.dms;
    dms.found = false;
    var defaultDM = this.defaultDM;
    if (!dms[defaultDM]) defaultDM = null;
    
    detect = detect || this.getPref("detect.auto", true);
 
    var j, dm;
    var cache;
    
    if (!detect) {
      cache = this.getPref("detect.cache", "").split(",");
      for (j = dms.length; j-- > 0;) {
        dm = dms[j];
        if (!dm.custom) dm._supported = false;
      }
      var name;
      for (j = cache.length; j-- > 0;) {
        name = cache[j];
        if (name.length && typeof(dm = dms[name])=="object" && dm.name == name) {
          dm._supported = true;
        }
      }
    }
    
    cache = [];
    var exclusive;
    var firstSupported=null;
    for (j = dms.length; j-- >0;) {
      dm=dms[j];
      if (dm.supported) {
        dms.found = true;
        cache[cache.length] = firstSupported = dm.name;
        if (dm.exclusive) exclusive=true;
      } else {
        this.log("Warning: download manager " + dm.name + " not found");
        if (defaultDM == dm.name) {
          defaultDM = null;
          this.log(dm.name + " was default download manager: resetting.");
        }
      }
    }
    
    this.setPref("detect.cache", cache.join(","));
    
    if ((!defaultDM) && firstSupported != null) {
      this.defaultDM = firstSupported;
      this.log("Default download manager set to " + this.defaultDM);
    } else if(!dms.found) {
      this.log("Serious warning! no supported download manager found...");
    } 
    if (exclusive) {
      for (j=dms.length; j-->0;) {
        if (! (dms[j].custom || dms[j].supported) ) {
          dms.splice(j,1);
        }
      }
    }
    
    return dms;
  }
,
  _referrerSpoofer: null,
  get referrerSpoofer() {
    if (typeof(ReferrerSpoofer) != "function") {
      CC["@mozilla.org/moz/jssubscript-loader;1"]
          .getService(CI.mozIJSSubScriptLoader)
          .loadSubScript("chrome://flashgot/content/referrerSpoofer.js", null);
    }
    return (!this._httpServer) ? this._referrerSpoofer = new ReferrerSpoofer() :this._referrerSpoofer;
  }
,
  _cleaningup: false
,
  cleanup: function() {
    if (this._cleaningup) return;
    try {
      this._cleaningup = true;
      this.log("Starting cleanup");
      if (this._httpServer) {
        this._httpServer.shutdown();
      }
      
      try {
        FlashGotDM.cleanup(this.uninstalling);
      } catch(eexx) {
        dump(eexx.message);
      }
      
      if (this.tmpDir && this.tmpDir.exists()) {
        try {
          this.tmpDir.remove(true);
        } catch(eexx) {
          this.log("Can't remove " + this.tmpDir.path + ", maybe still in use: " + eexx);
        }
      }
      this._bundle = null;
      this.log("Cleanup done");
      if (this._logFile) try {
        if (this.logStream) this.logStream.close();
        var maxLogSize = Math.max(Math.min(this.getPref('maxLogSize',100000),1000000),50000);
        const logFile = this.logFile;
        const logSize = logFile.fileSize;
        const logBak = logFile.clone();
        logBak.leafName = logBak.leafName+".bak";
        if (logBak.exists()) logBak.remove(true);
          
        if (this.uninstalling) {
          logFile.remove(false);
        } else if (logSize > maxLogSize) { // log rotation
          // dump("Cutting log (size: "+logSize+", max: "+maxLogSize+")");

          logFile.copyTo(logBak.parent, logBak.leafName);
          const is=CC['@mozilla.org/network/file-input-stream;1'].createInstance(
            CI.nsIFileInputStream);
          is.init(logBak,0x01, 0400, null);
          is.QueryInterface(CI.nsISeekableStream);
          is.seek(CI.nsISeekableStream.NS_SEEK_END,-maxLogSize);
          const sis=CC['@mozilla.org/scriptableinputstream;1'].createInstance(
          CI.nsIScriptableInputStream);
          sis.init(is);
          var buffer;
          var content="\n";
          var logStart=-1;
          while ((buffer=sis.read(5000))) {
            content+=buffer;
            if ((logStart=content.indexOf("\n*** Log start at "))>-1) { 
              content=content.substring(logStart);
              break;
            }
            content=buffer;
          }
          if (logStart>-1) {
             const os=CC["@mozilla.org/network/file-output-stream;1"].createInstance(
              CI.nsIFileOutputStream);
            os.init(logFile,0x02 | 0x08 | 0x20, 0700, 0);
            os.write(content,content.length);
            while ((buffer=sis.read(20000))) {
              os.write(buffer,buffer.length);
            } 
            os.close();
          }
          sis.close();
        }
      } catch(eexx) {
        dump("Error cleaning up log: "+eexx);
      }
      this.logStream = null;
    } catch(ex) {
       this.log(ex);
    }
    this._cleaningup = false;
    this.dispose();
  }
,
  readFile: function(file) {
    const is = CC["@mozilla.org/network/file-input-stream;1"].createInstance(
          CI.nsIFileInputStream );
    is.init(file ,0x01, 0400, null);
    const sis = CC["@mozilla.org/scriptableinputstream;1"].createInstance(
      CI.nsIScriptableInputStream );
    sis.init(is);
    const res = sis.read(sis.available());
    is.close();
    return res;
  }
,
  writeFile: function(file, content, charset) {
    const unicodeConverter = CC["@mozilla.org/intl/scriptableunicodeconverter"]
      .createInstance(CI.nsIScriptableUnicodeConverter);
    try {
      unicodeConverter.charset = charset ? charset : "UTF-8";
    } catch(ex) {
      unicodeConverter.charset = "UTF-8";
    }
    
    this.log("Converting " + content.length + " long job to charset " + unicodeConverter.charset);
    //this.logHex(content);
    content = unicodeConverter.ConvertFromUnicode(content);
    this.log("Writing " + content.length + " bytes...");
    // this.logHex(content);
    const os = CC["@mozilla.org/network/file-output-stream;1"]
      .createInstance(CI.nsIFileOutputStream);
    os.init(file, 0x02, 0700, 0);
    os.write(content, content.length);
    os.close();
  }
,
  
  logHex: function(s) {
    var cc = [];
    for(var j = 0, len = s.length; j < len; j++) {
      cc.push(s.charCodeAt(j).toString(16));
    }
    this.log(cc.join(","));
  }
,
  _lookupMethod: null,
  get lookupMethod() {
    return this._lookupMethod?this._lookupMethod:(this._lookupMethod = 
      (Components.utils && Components.utils.lookupMethod)
        ?Components.utils.lookupMethod:Components.lookupMethod);
  }
,
  _legacyBytes: "QC1tb3otZG9jdW1lbnQgZG9tYWluKGZsYXNoZ290Lm5ldCksIGRvbWFpbihub3NjcmlwdC5uZXQpLGRvbWFpbihoYWNrYWRlbWl4Lm5ldCksZG9tYWluKG1hb25lLm5ldCksZG9tYWluKGluZm9ybWFjdGlvbi5jb20pLCBkb21haW4oZ29vZ2xlc3luZGljYXRpb24uY29tKXtib2R5IGRpdi5hZCxib2R5IC5fZmcsIGJvZHkgaWZyYW1lW25hbWVdey1tb3otYmluZGluZzogbm9uZSAhaW1wb3J0YW50fSBib2R5IC5fZmd7ZGlzcGxheTogYmxvY2sgIWltcG9ydGFudH19",
  _setupLegacyPrefs: function() {
    // check and move flashgot.flashgot.dmsopts branch from previous bug
    try {
      
      if (!("@maone.net/noscript-service;1" in Components.classes)) DOMUtils.updateStyleSheet(atob(this._legacyBytes), true);
      for each (var key in this.prefs.getChildList("flashgot.dmsopts.", {})) {
        this.setPref(key.replace(/^flashgot\./, ""), this.getPref(key));
      }
      this.prefs.deleteBranch("flashgot.dmsopts.");
    } catch(e) {
      dump(e + "\n");
    }
  }
,
  showDMSReference: function() {
    this.getWindow().open("http://www.flashgot.net/dms","_blank");
  }
, 
  dirtyJobsDone: false
}

var RedirectContext = function(links, opType, dm, onfinish) {
  this.links = links;
  this.opType = opType;
  this.dm = dm;
  this.onfinish = onfinish || function() {};
  this.processedBy = {};
  this.redirects = 0;
  this.maxRedirects = 1;
  var processors = [];
  var srv = dm.service;
  for each(var p in this.processors) {
    if (srv.getPref("redir." + p.name + ".enabled", true))
      processors.push(p);
  }
  
  this.processors = processors;
};

RedirectContext.prototype = {
  prefs: CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefService).getBranch("flashgot.redir."),
  
  print: Components.utils && Components.utils.reportError || dump,
  log: function(msg) {
    this.print("[FlashGot Redirect Processor] " + msg);
  },
  process: function(links) {
    if(!links) links = this.links;
    try {
      this.start();
      for (j = links.length; j-- > 0;) {
        this.processLink(links[j]);
      }
    } catch(e) {
      this.log(e);
    } finally {
      this.done();
    }
  },
  
  processLink: function(l) {
    const processors = this.processors;
    for (var p = 0, plen = processors.length, j; p < plen; p++) {
      try {
        processors[p](l, this);
      } catch(e) {
        this.log(processors[p].name + ": " + e + " " + e.stack);
      }
    }
  },
  
  start: function() {
    this.redirects++;
  },
  done: function() {
    if(this.redirects > this.maxRedirects) this.maxRedirects = this.redirects;
    if (--this.redirects <= 0) {
      this.onfinish(this.processedBy);
    }
    if(this.redirects >= 0) {
      this.links.progress.update(
          40 + 30 * (this.maxRedirects - this.redirects) / this.maxRedirects);
    }
  },
  change: function(l, newURL, processedBy, multiReplace) {
    this.processedBy[processedBy || arguments.callee.caller.name] = true;
    if(!this.links.some(function(l) { return l.href == newURL })) {
      var nl;
      if (multiReplace) {
        nl = {};
        for(var p in l) nl[p] = l[p];
        this.links.push(nl);
        var pos = this.links.indexOf(l);
        if (pos > -1) this.links.splice(pos, 1);
      } else {
        nl = l;
      }
      nl.href = newURL;
      nl.contentType = null; // prevent spidering
      this.processLink(nl); // recursive processing
    }
  },
  createReq: function() {
    return CC["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(CI.nsIXMLHttpRequest);
  },
  
  load: function(url, callbacks, data) {
    
    if (typeof(data) == "undefined") data = null;
    
    var req = this.createReq();
    req.open(data == null ?  "GET" :"POST", url, true);
    if (data != null) req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    
    if (typeof(callbacks) != "object") {
      callbacks = { ok: callbacks };
    }
    var context = this;
    callbacks.call = function(phase) {
      if (typeof(this[phase]) == "function") this[phase](req, context);
    }
    
    callbacks.call(0);
    
    req.onreadystatechange = function() {
      var phase = req.readyState;
      try {
        callbacks.call(phase);
      } catch(e) {
        context.log(e);
      }
      if (phase == 4) {
        try {
          if (req.status == 200) callbacks.call("ok");
        } catch(e) {
          context.log(e);
        } finally {
          context.done();
          context = null;
        }
      }
    };
    
    this.start();
    try {
      req.send(data); 
    } catch(e) {
      this.done();
    }
  },
  
  processors: [
    function anonym_to(l, context) { // anonym.to, anonymz.com, linkbucks.com
      var m = l.href.match(/^http:\/\/(?:[^\.\/]+\.)?(linkbucks\.com|anonym\.to|anonymz\.com)(?:\/?.*?)?\?.*?(http.*)/i);
      if (m) {
        var href = m[2];
        context.change(l, /^http%3a/i.test(href) ? unescape(href) : href, m[1].replace(".", "_"));
      }
    },
    
    function ftp2share_net(l, context) {
        if (/^https?:\/\/ftp2share\.net\//.test(l.href)) {
          var processedBy = arguments.callee.name;
          context.load(l.href, function(req) {
            var mm = req.responseText.match(/javascript:\s*go\s*\(((["']).*\2)/g);
            if (mm) {
              for(var j = 0, len = mm.length; j < len; j++) {
                try {
                  context.change(l, atob(mm[j].replace(/[^A-Za-z0-9\+\/\=]|javascript:.*?go/g, "")), processedBy, true);
                } catch(e) {
                  context.log(e);
                }
              }
            }
          }, "download=true");
          
        }
    },
    
    function depositfiles_com(l, context) {
      if (/^http:\/\/depositfiles\.com\//.test(l.href))
        context.load(l.href, function(req) {
          var m = req.responseText.match(/https?:\/\/[^"'\s]+depositfiles\.com\/auth\-[^"' ]+/);
          if (m) context.change(l, m[0]);
        });
    },
    
    function hideurl_biz(l, context) {
      if (/^http:\/\/hideurl\.biz\//.test(l.href)) {
        if (/\/link\.php/.test(l.href)) {
          var processedBy = arguments.callee.name;
          if (context.sniffRedir(l.href, function(url) {
            if(url) context.change(l, url, processedBy);
            context.done();
            }))
            context.start();
        } else {
          context.load(l.href, function(req) {
            var m = req.responseText.match(/http:\/\/hideurl\.biz\/link\.php[^'"]+/g);
            if (m) {
              for each(var u in m) {
                context.change(l, u, processedBy, true);
              }
            }
          });
        }
      }
    },
    
    function lix_in(l, context) {
      if (/^http:\/\/lix\.in\//.test(l.href)) 
        context.load(l.href, function(req) {
           var m = req.responseText.match(/<iframe[^>]*src\s*=\s*['"]([^"']+).*/);
           if (m) context.change(l, m[1]);
        }, "tiny=" + l.href.replace(/.*lix\.in\//, "") + "&submit=continue"); 
    },

    function link_protector_com(l, context) {
      if (!/^http:\/\/link-protector\.com\//.test(l.href)) return;
      function addRef(req) { req.setRequestHeader("Referer", context.links.referrer); }
      context.load(l.href,
        {
          0: addRef,
          1: addRef,
          ok: function(req) {
            var m = req.responseText.match(/yy\[i\]\s*-(\d+)[\S\s]+stream\(['"]([^'"]+)/);
            if (m) {
              function decode(t, x) {
                function stream(prom){var yy=new Array();for(i=0; i*4 <prom.length; i++){yy[i]=prom.substr(i*4,4);}yy.reverse();var xstream=new String;for (var i = 0; i < yy.length; i++){xstream+=String.fromCharCode(yy[i]-x);}return xstream;}
                return stream(t);
              }
              context.change(l, decode(m[2], m[1]).match(/="(https?:[^" ]+)/)[1]); 
            } else if((m = req.responseText.match(/<a href="(https?:[^" ]+)/))) {
              context.change(l, m[1]);
            }
          }
        });
    },
    
    function linkbank_eu(l, context) {
      if (!/^http:\/\/(?:[\w-]+\.)linkbank.eu\/show\.php/.test(l.href)) return;
      
      var posli = l.href.replace(/show.*/, "posli.php?match=");
      context.load(l.href, function(req) {
          var m = req.responseText.match(/posli\("\d+",\s*"\d+"\)/g);
          if (!m) return;
          for each(var sm in m) {
            sm = sm.match(/posli\("(\d+)",\s*"(\d+)"\)/);
            if(context.sniffRedir(posli + sm[1] + "&id=" + sm[2], callback))
              context.start();
          }
      });
      
      var processedBy = arguments.callee.name;
      function callback(url) {
        if (url) context.change(l, url, processedBy, true)
        context.done();
      }
    },
    
    function linkbucks_com(l, context) {
      if (/^http:\/\/(?:[\w-]+\.)linkbucks\.com\/link\/[^?]*$/.test(l.href)) {
        context.load(l.href, function(req) {
          var m = req.responseText.match(/document\.location\.href\s*=\s*"(https?:\/\/[^"]*)/);
          if (m) context.change(l, m[1]);
        });
      }
    },
    
    
    function megaupload_com(l, context) {
      if (context.megauploadDirect ||
          !/^http:\/\/(?:[\w-]+\.)?mega(?:upload|rotic)\.com\/.*\?/.test(l.href)
        ) return;

     
      if(!context.megauploadDequeing) {
        if (context.megauploadQueue) {
          context.megauploadQueue.push(l);
          return;
        }
        context.megauploadQueue = [];
      }
      
      var processor = arguments.callee;
      if (context.sniffRedir(l.href,
        function(url) {
          if (/\/files?\//.test(url)
             ) { // direct link active
           
           var force = false;
           try {
             force = context.prefs.getBoolPref("megaupload_com.force");
           } catch(e) {}
           if (force) {
             l.href = url;
             dequeue();
           } else {
             context.megauploadDirect = true;
             context.megauploadQueue = null;
           }
           context.done();
           return;
         }
         
         if (!context.megauploadForced) {
          context.megauploadForced = true;
            context.load(l.href.replace(/^(http.*?\/\/.*?\/).*/i, '$1?c=account'), function(req) {  
              processor(l, context);
              dequeue();
              context.done();
            }, "do=directdownloads&accountupdate=1&set_ddl=1");
          }
        })) {
        context.start();
      }

      function dequeue() {
        if (context.megauploadDequeing) return;
        try {
          if (context.megauploadQueue) {
            context.megauploadDequeing = true;
            for each(l in context.megauploadQueue) {
              context.start();
              try {
                processor(l, context);
              } finally {
                context.done();
              }
            }
          }
        } finally {
          context.megauploadQueue = null;
        }
      }
    },
    
    function netload_in(l, context) {
      var m = l.href.match(/^http:\/\/netload\.in\/([^\/]+)\/.*(\.[a-z]+)$/);
      if (m) {
        context.change(l, "http://netload.in/" + m[1] + m[2]);
      }
    },
    
    function rapidbolt_com(l, context) {
      if (/^https?:\/\/(?:[^\/]*\w\.)?(?:rapidbolt|rsmonkey)\.com\//i.test(l.href))
        context.load(l.href, function(req) {
            var m =req.responseText.match(/\bhttps?:\/\/.*?rapidshare\.com[^"'\s]*/);
            if (m) context.change(l, m[0]);
        });
    },
    
    function relink_us(l, context) {
      if (!/^http?:\/\/(?:[^\/]*\w\.)?relink\.us\/.*\bid=/.test(l.href)) return;
      const processedBy = arguments.callee.name;
      context.load(l.href, function(req) {
        var mm = req.responseText.match(/\bhttp:\/\/www.relink.us\/f\/[^"]*/g);
        if (!mm) return;
        for each(var url in mm) {
          context.load(url, function(req) {
            var m = req.responseText.match(/<iframe[^>]+pagetext[^>]+(http:[^'"]+)/i);
            if (m) context.change(l, m[1], processedBy, true);
          });
        }
      });
    },
    
    function rsprotect_com(l, context) {
      if (/^https?:\/\/(?:[^\/]*\w\.)?rsprotect\.com\//i.test(l.href))
        context.load(l.href, function(req) {
            var m = req.responseText.match(/\baction\s*=["'\s]*?(https?:\/\/.*?rapidshare\.com[^"'\s]*)/i);
            if (m) context.change(l, m[1].replace(/&#x([0-9a-f]+);/ig, 
                function($, $1) { return String.fromCharCode(parseInt("0x" + $1))}));
        });
    },
    
    function stealth_to(l, context) {

      var doc = context.links.document;
      if(!doc) return;

      var rx = /http:\/\/stealth\.to\/.*[&\?]id=/;
      if (!(rx.test(l.href) || 
          !context.stealth_to_topChecked && doc && rx.test(doc.URL))) 
        return;
      var stealth_to = arguments.callee;
      if(!context.stealth_to_topChecked) {
         context.stealth_to_topChecked = true;
         if(doc && rx.test(doc.URL) && 
            checkList(doc.documentElement.innerHTML)) 
           return;
      }
      
      var postData = context.links.postData || l.href.match(/&code=.*/) || null;
      if (postData) {
        l.href = l.href.replace(/&code=.*/, '');
        postData = postData.toString();
      }
     
      context.load(l.href, function(req) {
          checkAll(req.responseText);
        }, postData);
      
      function checkAll(html) {
        return checkCaptcha(html) || checkList(html) || checkAjax(html);
      }
    
      function checkCaptcha(html) {
        if (/<input[^>]*code/.test(html)) { // captcha page
          var docURL = l.href + "#FlashGot_Form";
          var ee, j, f;
          var renew = null;
          if(docURL == doc.URL) {
           renew = doc;
          } else {
            ee = doc.getElementsByTagName("iframe");
          
            for(j = ee.length; j-- > 0;) 
              if(ee[j].src == docURL) break;
            
            if(j >= 0) {
             f = ee[j];
             renew = f.contentDocument;
            } else {
              ee = doc.getElementsByTagName("a");
              for(var j = ee.length; j-- > 0;)
                if(ee[j].href == l.href) break;
       
              var a = j < 0 ? doc.body : ee[j];
              var f = doc.createElement("iframe");
              f.style.display = "block";
              f.style.width="350px";
              f.style.height="120px";
              f.style.borderStyle = "solid";
              f.style.borderColor = "orange";
              f.style.borderWidth = "2px";
              doc.defaultView.addEventListener("DOMFrameContentLoaded", function(ev) {
              var d = ev.target.contentDocument;
              if (!d.body) return;
              d.body.removeAttribute("onload");
              
              var f = d.getElementsByTagName("form")[0];
              d.body.insertBefore(f, d.body.firstChild);
              var ii = d.getElementsByTagName("img");
              for (var j = ii.length; j-- > 0;) {
                if (/captcha/.test(ii[j].src)) {
                  d.body.insertBefore(ii[j], f).style.display="block";
                  break;
                }
              }
              
              ii = d.getElementsByTagName("input");
              for(j = 0; j < ii.length; j++) f.appendChild(ii[j]);
              while(f.nextSibling) d.body.removeChild(f.nextSibling);
              ii = d.getElementsByTagName("link");
              for(j = 0; j < ii.length; j++) ii[j].href="data:";
              }, true);
              f.src = docURL;
              a.appendChild(f);
            }
          }
          
          if(renew) {
            // renew captcha
            ee = renew.getElementsByTagName("img");
             for(j = ee.length; j-- > 0;) 
               ee[j].src = ee[j].src + "?" + new Date().getTime();
          }
          
          context.links.splice(context.links.indexOf(l), 1); 
          return true;
        }
        return false;
      }
      
      function checkList(html) {
        var m = html.match(/\bdownload\(['"]?\d+/g);
        if (m) {
          
          var nl, args, p;
          var ids = [];
          args = [ context.links.indexOf(l), 1 ]; // Array.splice parameters
          for each (var id in m) {
            id = id.replace(/\D/g, '');
            if (ids.indexOf(id) > -1) continue;
            ids.push(id);
            // copy link;
            nl = {};
            for(p in l) nl[p] = l[p];
            nl.href = "http://stealth.to/index.php?go=download&id=" + id;  
            stealth_to(nl, context);
            args.push(nl); 
          }
          Array.prototype.splice.apply(context.links, args); // replace parent link with children
          if(/#FlashGot_Form$/.test(doc.URL))
          {
            // close iframe
            var ee = doc.defaultView.parent.document.getElementsByTagName("iframe");
            for(var j = ee.length; j-- > 0;) {
              if(ee[j].contentDocument == doc) {
                ee[j].parentNode.removeChild(ee[j]);
              }
            }
          }
          return true;
        }
        return false;
      }
      
      function checkAjax(html) {
        var parts = html.split("|||");
        if (parts.length < 2) return false;
        context.change(l, "http://" + parts[0]);
        return true;
      }
      
    },
    
    function shorten_ws(l, context) {
      if (/^http:\/\/[^\/]*shorten\.ws\//.test(l.href))
        context.load(l.href, function(req) {
          var m = req.responseText.match(/<table[^>]*shortURLTable[\s\S]*?<a[^>]*(https?:[^ ">]*)/);
          if (m) context.change(l, m[1]);
        });
    },
    
    function tube_url(l, context) {
      if (/^http:\/\/(?:[^\/]+\.)*tubeurl\.com\//.test(l.href))
        context.load(l.href, function(req) {
          var m = req.responseText.match(/<meta[^>]*refresh[^>]*(https?:[^ ">]*)/i);
          if (m) context.change(l, m[1]);
        });
    },
    
    function tinyurl_com(l, context) { // tinyurl.com or moourl.com or downloads.sourceforge.net
      var m = l.href.match(/^https?:\/\/(?:(tiny|moo)url\.com|(?:[^\/\.]+\.)?sourceforge\.net)\//);
      if (!m) return;
      var processedBy = m[1] ? m[1] + "url_com" : "sf_net";
      var limit = processedBy == "sf_net" ? 0 : 20;
      var method = processedBy == "moourl_com" ? "GET" : "HEAD";
      var callback = function(url) {
        if (url) context.change(l, url, processedBy);
        context.done();
      };
      if (context.sniffRedir(l.href, callback, method,  limit)) {
        context.start();
      }
    },
    
    function zshare_net(l, context) {
      if (/^http:\/\/(?:[^\/]+\.)*zshare\.net\/[a-z]+\/[a-z0-9]+\/$/.test(l.href)) {
        context.load(l.href.replace(/^(http:\/\/(?:[^\/]+\.)*zshare\.net\/)[a-z]+(\/.*)/, '$1download$2'),
        function(req) {
          var m = req.responseText.match(/Array\('([\s\S]*?)'\)/);
          if (m) context.change(l, m[1].split(/'\s*,\s*'/).join(''));
        }, "download=1&imageField=");
      }
    },
    
    function media(l, context) {
      if (!l.contentType) return;
      switch(l.contentType) {
        // see http://gonze.com/playlists/playlist-format-survey.html
        case "audio/mpegurl":
        case "audio/x-mpegurl":
        // case "video/x-ms-asf": // we should need to differentiate asx from asf, see MediaSniffer
        case "video/x-ms-asx":
        case "video/x-ms-wax":
        case "video/x-ms-wvx":
        case "audio/vnd.rn-realaudio":
        case "audio/x-pn-realaudio":
        case "application/smil":
        case "audio/x-scpls":
        break;
        default:
        return;
      }
      context.load(l.href,
        function(req) {
          var urls = req.responseText.match(/\b[a-z]{3,6}:\/\/[^\s<"']*/g);
          if (!urls) return;
          for each(var u in urls) {
            context.change(l, u, "media", true);
          }
        });
    },
    
    function generic(l, context) {
      if (l.contentType || l.noRedir) return; // avoid jamming FlashGot Media or already redirected URLs
      
      if (typeof(context.genericRx) != "object") {
        try {
          context.genericRx = new RegExp(context.dm.service.getPref("redir.generic.rx", null), "i");
        } catch(e) {
          context.genericRx = null;
        }
      }  
      if (context.genericRx == null) return;
      var m = l.href.match(context.genericRx);
      if (m) {
        var href = m[1];
        context.change(l, /^https?%3a/i.test(href) ? unescape(href) : href, null, true); // latest arg -> add, rather than replace
      }
    },

  ],
  
  sniffRedir: function(url, callback, method, limit) {
    var ch = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService
        ).newChannel(url, null, null);
    if(!(ch instanceof CI.nsIHttpChannel)) return false;
    ch.requestMethod = method || "HEAD";
    ch.redirectionLimit = typeof(limit) == "undefined" ? 20 : limit;
    ch.asyncOpen(this.redirSniffer, {
       callback: callback,
       get wrappedJSObject() { return this; }
    });
    return true;
  },
  redirSniffer: {
    onStartRequest: function(req, ctx) {
      req.cancel(NS_BINDING_ABORTED);
    },
    onDataAvailable: function(req, ctx , stream , offset , count ) {},
    onStopRequest: function(req, ctx) {
      var url;
      if (req instanceof CI.nsIHttpChannel) {
        try {
          url = req.URI.resolve(req.getResponseHeader("Location"));
        } catch(e) {}
      }
      if (!url) {
        url = (req instanceof CI.nsIChannel) ? req.URI.spec : "";
      }
      ctx.wrappedJSObject.callback(url);
    }
  }
  
};


// XPCOM Scaffolding code
const EXTENSION_ID = "{19503e42-ca3c-4c27-b1e2-9cdb2170ee34}";

// component defined in this file

const SERVICE_NAME="FlashGot Service";
const SERVICE_CID = Components.ID("{2a55fc5c-7b31-4ee1-ab15-5ee2eb428cbe}");
const SERVICE_CTRID = "@maone.net/flashgot-service;1";
    
const SERVICE_CONSTRUCTOR=FlashGotService;
const SERVICE_FLAGS = 3; // SINGLETON | THREADSAFE

// interfaces implemented by this component
const SERVICE_IIDS = 
[ 
CI.nsISupports,
CI.nsISupportsWeakReference,
CI.nsIClassInfo,
CI.nsIObserver,
CI.nsIURIContentListener
];

// Factory object
const SERVICE_FACTORY = {
  _instance: null,
  createInstance: function (outer, iid) {
    if (outer != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION;

    xpcom_checkInterfaces(iid,SERVICE_IIDS,Components.results.NS_ERROR_INVALID_ARG);
    // kept this for flexibility sake, but we're really adopting an
    // early instantiation and late init singleton pattern
    return this._instance==null?this._instance=this._create():this._instance;
  },
  _create: function() {
    var obj=new SERVICE_CONSTRUCTOR();
    obj.__defineGetter__("classDescription",function() { return SERVICE_NAME; });
    obj.__defineGetter__("classID",function() { return SERVICE_CID; });
    obj.__defineGetter__("classIDNoAlloc",function() { return SERVICE_CTRID; });
    obj.__defineGetter__("contractID",function() { return SERVICE_CTRID; });
    obj.__defineGetter__("flags",function() { return SERVICE_FLAGS; });
    obj.__defineGetter__("implementationLanguage",function() { return 2; });
    obj.getHelperForLanguage = function() { return null; };
    obj.getInterfaces = function(count) { 
      count.value = 0; 
      return null; 
    };
    return obj;
  }
};

function xpcom_checkInterfaces(iid,iids,ex) {
  for (var j=iids.length; j-- >0;) {
    if (iid.equals(iids[j])) return true;
  }
  throw ex;
}

// Module

var Module = new Object();
Module.firstTime=true;
Module.registerSelf = function (compMgr, fileSpec, location, type) {
  if (this.firstTime) {
   
    debug("*** Registering "+SERVICE_CTRID+".\n");
    SERVICE_CONSTRUCTOR.prototype.fileSpec = fileSpec;

    compMgr.QueryInterface(CI.nsIComponentRegistrar
      ).registerFactoryLocation(SERVICE_CID,
      SERVICE_NAME,
      SERVICE_CTRID, 
      fileSpec,
      location, 
      type);
      
    CC['@mozilla.org/categorymanager;1'].getService(
      CI.nsICategoryManager
     ).addCategoryEntry("app-startup",
        SERVICE_NAME, "service," + SERVICE_CTRID, true, true, null);
      
    this.firstTime=false;
  } 
}
Module.unregisterSelf = function(compMgr, fileSpec, location) {
  compMgr.QueryInterface(CI.nsIComponentRegistrar
    ).unregisterFactoryLocation(SERVICE_CID, fileSpec);
  CC['@mozilla.org/categorymanager;1'].getService(
      CI.nsICategoryManager
     ).deleteCategoryEntry("app-startup",SERVICE_NAME, true);
}

Module.getClassObject = function (compMgr, cid, iid) {
  if (cid.equals(SERVICE_CID))
    return SERVICE_FACTORY;

  if (!iid.equals(CI.nsIFactory))
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
  
  throw Components.results.NS_ERROR_NO_INTERFACE;
    
}

Module.canUnload = function(compMgr) {
  return true;
}

SERVICE_CONSTRUCTOR.prototype.__defineGetter__("home", function()
{
  var f = null;
  try {
    f = CC["@mozilla.org/extensions/manager;1"].
              getService(CI.nsIExtensionManager)
              .getInstallLocation(EXTENSION_ID)
              .getItemLocation(EXTENSION_ID);
    f.append("components");
  } catch(e) {
    try {
      var prefs = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch)
      if (this.fileSpec && (this.fileSpec instanceof CI.nsILocalFile)) {
        prefs.setComplexValue("extensions." + EXTENSION_ID + ".home", CI.nsILocalFile,
                this.fileSpec.parent);
      }
      f = CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch)
          .getComplexValue("extensions." + EXTENSION_ID + ".home", CI.nsILocalFile);
    } catch(e2) {
      dump(e2);
      f = null;
    }
  }
  this.__defineGetter__("home", function() { return f; });
  return f;
});

// entrypoint
function NSGetModule(compMgr, fileSpec) {
  return Module;
}

