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



const EXTENSION_ID = "{19503e42-ca3c-4c27-b1e2-9cdb2170ee34}";
const EXTENSION_NAME = "FlashGot";
const CHROME_NAME = "flashgot";
const VERSION = "1.1.9.4";
const SERVICE_NAME = EXTENSION_NAME + " Service";
const SERVICE_CTRID = "@maone.net/flashgot-service;1";
const SERVICE_ID = "{2a55fc5c-7b31-4ee1-ab15-5ee2eb428cbe}";
    
const SERVICE_CONSTRUCTOR = FlashGotService;

// interfaces implemented by this component
const SERVICE_IIDS = 
[ 
  CI.nsISupports,
  CI.nsISupportsWeakReference,
  CI.nsIObserver,
  CI.nsIURIContentListener
];

// categories which this component is registered in
const SERVICE_CATS = ["app-startup"];

const IOS = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);

const IO = {
  readFile: function(file) {
    const is = CC["@mozilla.org/network/file-input-stream;1"]
      .createInstance(CI.nsIFileInputStream );
    is.init(file ,0x01, 0400, null);
    const sis = CC["@mozilla.org/scriptableinputstream;1"]
      .createInstance(CI.nsIScriptableInputStream );
    sis.init(is);
    const res = sis.read(sis.available());
    is.close();
    return res;
  },
  writeFile: function(file, content) {
    const unicodeConverter = CC["@mozilla.org/intl/scriptableunicodeconverter"]
      .createInstance(CI.nsIScriptableUnicodeConverter);
    try {
      unicodeConverter.charset = charset ? charset : "UTF-8";
    } catch(ex) {
      unicodeConverter.charset = "UTF-8";
    }
    
    content = unicodeConverter.ConvertFromUnicode(content);
    const os = CC["@mozilla.org/network/file-output-stream;1"]
      .createInstance(CI.nsIFileOutputStream);
    os.init(file, 0x02 | 0x08 | 0x20, 0700, 0);
    os.write(content, content.length);
    os.flush();
    os.close();
  }
};

const LOADER = CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);
const _INCLUDED = {};
const INCLUDE = function(name) {
  if (arguments.length > 1)
    for (var j = 0, len = arguments.length; j < len; j++)
      arguments.callee(arguments[j]);
  else if (!_INCLUDED[name]) {
    try {
      LOADER.loadSubScript("chrome://flashgot/content/"+ name + ".js");
      _INCLUDED[name] = true;
    } catch(e) {
      dump("INCLUDE " + name + ": " + e + "\n");
    }
  }
}

INCLUDE('XPCOM', 'DOM', 'DMS', 'HttpInterceptor', 'MediaSniffer');

const SHUTDOWN = "profile-before-change";
const STARTUP = "profile-after-change";

var fg, singleton; // singleton
function FlashGotService() {
  this.wrappedJSObject = fg = singleton = this;
  
  if ("nsIChromeRegistrySea" in CI) INCLUDE("SMUninstaller");
  
  const os = this.observerService;
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
  VERSION: VERSION
,
  dom: DOM,
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
          this.observerService.addObserver(this, "em-action-requested", false);
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
      DOM.updateStyleSheet(s, true);
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
         DOM.updateStyleSheet(s, false);
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
      INCLUDE("flashgotHttpServer");
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
    
  
    this.delayExec(function(t) { fg._downloadDelayed(links, opType, dm); }); 
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
      if (l.description) l.description = l.description.replace(/\s+/g, ' ');
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
  
  get RedirectContext() {
    delete this.__proto__.RedirectContext;
    INCLUDE('RedirectContext');
    return this.__proto__.RedirectContext = RedirectContext;
  },
  _processRedirects: function(links, opType, dm) {
    links.progress.update(30);
    this.delayExec(function() {  
      new fg.RedirectContext(links, opType, dm, function(processedBy) {
        links.redirProcessedBy = processedBy;
        fg._sendToDM(links, opType, dm);
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
    this.delayExec(function() {
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
    var uri;
    var udom = {};
    var uname = {};
    var upwd = {};
    var l;
    for (var j = links.length; j-- > 0;) {
      l = links[j];
      try {
        uri = IOS.newURI(l.href, null, null);
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

  delayExec: function(callback, delay) {
    const timer = CC["@mozilla.org/timer;1"].createInstance(
      CI.nsITimer);
     var args = Array.prototype.slice.call(arguments, 2);
     timer.initWithCallback({ 
         notify: this.delayedRunner,
         context: { callback: callback, args: args, self: this }
      },  delay || 1, 0);
  },
  delayedRunner: function() {
    var ctx = this.context;
    try {
       ctx.callback.apply(ctx.self, ctx.args);
     } catch(e) {
        if(ns.consoleDump) ns.dump("Delayed Runner error: " + e + ", " + e.stack);
     }
     finally {
       ctx.args = null;
       ctx.callback = null;
     }
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
  get getString() {
    delete this.__proto__.getString;
    INCLUDE('Strings');
    const ss = new Strings("flashgot");
    return this.__proto__.getString = function(name, parms) { return ss.getString(name, parms) };
  },

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
    var w = DOM.getChromeWindow(document.defaultView.top);
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
    
    if (this.smUninstaller) this.smUninstaller.check();
    
    const os = this.observerService;
    this.interceptor = new HttpInterceptor();
    os.addObserver(this.interceptor, "http-on-modify-request", true);

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
    var firstSupported = null;
    for (j = dms.length; j-- >0;) {
      dm = dms[j];
      if (dm.supported) {
        dms.found = true;
        cache.push(firstSupported = dm.name);
        if (dm.exclusive) exclusive = true;
      } else {
        this.log("Warning: download manager " + dm.name + " not found");
        if (defaultDM == dm.name) {
          defaultDM = null;
          this.log(dm.name + " was default download manager: resetting.");
        }
      }
    }
    
    this.setPref("detect.cache", cache.join(","));
    
    if (!defaultDM && firstSupported) {
      while (!firstSupported.autoselect && cache.length) {
        firstSupported = cache.shift();
      }
      this.defaultDM = firstSupported;
      this.log("Default download manager set to " + this.defaultDM);
    } else if(!dms.found) {
      this.log("Serious warning! no supported download manager found...");
    }
    
    if (exclusive) {
      for (j = dms.length; j-->0;) {
        if (!(dms[j].custom || dms[j].supported) ) {
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
      INCLUDE("referrerSpoofer");
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
  _setupLegacyPrefs: function() {
    // check and move flashgot.flashgot.dmsopts branch from previous bug
    try {
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
