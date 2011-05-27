/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["Logger"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;Cu.import("resource://glaxebay/gsCommon.js");var Logger={DUMP_STACK:true,_logger:null,init:function(){this._logger=GlaxEbay.getLogger("Logger");this._logger.trace("_init");},exception:function(exception){let logString=exception.message;if(exception.stack){logString+="\n"+this._dumpJsStack(exception.stack);}else{logString+="\n"+this._dumpXpcomStack(exception.location);}
this._logger.error(logString);},log:function(message,dumpStack,nonStandardStack){let logString=message;if(dumpStack){logString+="\n"+
this._dumpXpcomStack(nonStandardStack?nonStandardStack:Components.stack.caller);}
this._logger.info(logString);},warning:function(message,dumpStack,nonStandardStack){let logString=message;if(dumpStack){logString+="\n"+
this._dumpXpcomStack(nonStandardStack?nonStandardStack:Components.stack.caller);}
this._logger.warn(logString);},error:function(message,dumpStack,nonStandardStack){let logString=message;if(dumpStack){logString+="\n"+
this._dumpXpcomStack(nonStandardStack?nonStandardStack:Components.stack.caller);}
this._logger.error(logString);},_getRelativePath:function(path){if(!this._baseStart){let extensionId="{62760FD6-B943-48C9-AB09-F99C6FE96088}";let index=path.indexOf(extensionId);if(index!=-1){this._baseStart=index+extensionId.length;}else{this.warning("Extension ID in Logger module is set incorrectly. "+
"Can't calculate relative paths for stack trace.");this._baseStart=7;}}
return path.slice(this._baseStart);},_dumpJsStack:function(stack){let message="--- JS Stack Trace:\n";let stackArray=stack.split("\n");stackArray.pop();for(let[,frame]in Iterator(stackArray)){frame=frame.split("@");let context=frame[0];let filePath=unescape(frame[1]);if(filePath.indexOf("file://")!=-1){filePath=this._getRelativePath(filePath);}
message+="---   "+filePath+"\n";}
return message;},_dumpXpcomStack:function(stack){let message="--- XPCOM Stack Trace:\n";let frame=stack;while(frame){let filePath=unescape(frame.filename);if(filePath.indexOf("file://")!=-1){filePath=this._getRelativePath(filePath);}
message+="---   "+filePath+":"+frame.lineNumber+"\n";frame=frame.caller;}
return message;}};Logger.init();