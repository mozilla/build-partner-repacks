var Request = require('request').Request;
var jetpackStorageMgr = require('simple-storage');
var jetpackStorage = jetpackStorageMgr.storage;
var tabs = require('tabs');
var prefService = require('preferences-service');
var appInfo = require('xul-app');
const jpSelf = require("self");
const {Cc, Ci} = require('chrome');
const xpcom = require("xpcom");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

if(typeof YAHOO=="undefined")
{
   YAHOO={};
}

if(!YAHOO.ULT)
{
   YAHOO.ULT={};
}

if(!YAHOO.ULT.BEACON)
{
   YAHOO.ULT.BEACON="http://geo.yahoo.com/t";
}

YAHOO.ULT.SRC_SPACEID_KEY='_S';
YAHOO.ULT.DEST_SPACEID_KEY='_s';
YAHOO.ULT.YLC_LIBSRC=2;
YAHOO.ULT.CTRL_C='\x03';
YAHOO.ULT.CTRL_D='\x04';
YAHOO.ULT.BASE64_STR="ABCDEFGHIJKLMNOP"+"QRSTUVWXYZabcdef"+"ghijklmnopqrstuv"+"wxyz0123456789._-";

YAHOO.ULT.track_click=function(u,p)
{
   if(!u||!p)
   {
      return u;
   }
   
p._r=YAHOO.ULT.YLC_LIBSRC;
   var ks=[];
   var i=0;
   for(var k in p)
   {
      var v=p[k];
      if(typeof(v)=='undefined')
      {
         v=p[k]='';
      }
      
if(k.length<1)
      {
         return u;
      }
      
if(k.length>8)
      {
         return u;
      }
      
if(k.indexOf(' ')!=-1)
      {
         return u;
      }
      
if(YAHOO.ULT.has_ctrl_char(k)||YAHOO.ULT.has_ctrl_char(v))
      {
         return u;
      }
      
ks[i++]=k;
   }
   
ks=ks.sort();
   var f=[];
   for(i=0;i<ks.length;i++)
   {
      f[i]=ks[i]+YAHOO.ULT.CTRL_C+p[ks[i]];
   }
   
f=f.join(YAHOO.ULT.CTRL_D);
   if(f.length<1||f.length>1024)
   {
      return u;
   }

   f=';_ylc='+YAHOO.ULT.encode64(f);
   i=u.indexOf('/*');
   if(i==-1)
   {
      i=u.indexOf('/?');
   }
   
if(i==-1)
   {
      i=u.indexOf('?');
   }
   
if(i==-1)
   {
      return u+f;
   }
   else
   {
      return u.substr(0,i)+f+u.substr(i);
   }
};

YAHOO.ULT.beacon_click=function(p,i)
{
   
if(p)
   {
      var url=YAHOO.ULT.track_click(YAHOO.ULT.BEACON,p);
      url+='?t='+Math.random();
      return url;
   }

};

YAHOO.ULT.has_ctrl_char=function(s)
{
   for(var i=0;i<s.length;i++)
   {
      if(s.charCodeAt(i)<0x20)
      {
         return true;
      }
   }
   
return false;
};

YAHOO.ULT.encode64=function(input)
{
   var output="";
   var chr1,chr2,chr3="";
   var enc1,enc2,enc3,enc4="";
   var i=0;
   do
   {
      chr1=input.charCodeAt(i++);
      chr2=input.charCodeAt(i++);
      chr3=input.charCodeAt(i++);
      enc1=chr1>>2;
      enc2=((chr1&3)<<4)|(chr2>>4);
      enc3=((chr2&15)<<2)|(chr3>>6);
      enc4=chr3&63;
      if(isNaN(chr2))
      {
         enc3=enc4=64;
      }
      else if(isNaN(chr3))
      {
         enc4=64;
      }
      
output=output+
YAHOO.ULT.BASE64_STR.charAt(enc1)+
YAHOO.ULT.BASE64_STR.charAt(enc2)+
YAHOO.ULT.BASE64_STR.charAt(enc3)+
YAHOO.ULT.BASE64_STR.charAt(enc4);
      chr1=chr2=chr3="";
      enc1=enc2=enc3=enc4="";
   }
   while(i<input.length);
   return output;
};

var g_nanoClientVer= "YNanoFF 1.0.2";

ChromeDebugManager=
{
   _mDebugMode: false,

   logError: function(text)
   {
      if (this._mDebugMode)
         console.log(text);
   }
};

ChromeTrackingManager=
{ 
   _mTimeLastInstallAction: 0,
   _mNanoUUID: "",

   init: function()
   {
      try
      {
         this._mNanoUUID= jetpackStorage['perm_ynano_uuid'];
         if (!this._mNanoUUID)
         {
            this._mNanoUUID= this.generateUUID();
            jetpackStorage['perm_ynano_uuid']= this._mNanoUUID;
            jetpackStorageMgr.save();
         }         
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.init error: ' + e.message);
      }      
   },   

   getInstallDate: function(pluginId)
   {
      var installDate= null;
      
      try
      {
         installDate= jetpackStorage['ynano_' + pluginId + '_installDate'];
         if (!installDate)
         {
            installDate= (new Date()).toString();
            jetpackStorage['ynano_' + pluginId + '_installDate']= installDate;
            jetpackStorageMgr.save();
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.getInstallDate error: ' + e.message);
      }

      return installDate;
   },
   
   isBeaconSent: function(pluginId, beaconType)
   {
      try
      {
         var sentBeaconsJSON= jetpackStorage['ynano_' + pluginId + '_trackingState'];
         if (sentBeaconsJSON)
         {
            var sentBeacons= JSON.parse(sentBeaconsJSON);
            return sentBeacons[beaconType];
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.isBeaconSent error: ' + e.message);
      }

      return false;
   },

   setBeaconSent: function(pluginId, beaconType, bSent)
   {
      try
      {
         var sentBeacons= {};
         
         var sentBeaconJSON= jetpackStorage['ynano_' + pluginId + '_trackingState'];
         if (sentBeaconJSON)
            sentBeaconJSON= JSON.parse(sentBeaconJSON);

         sentBeacons[beaconType]= bSent;
         jetpackStorage['ynano_' + pluginId + '_trackingState']= JSON.stringify(sentBeacons);
         jetpackStorageMgr.save();
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.setBeaconSent error: ' + e.message);
      }
   },
   
   setTrackingDataJSON: function(pluginId, aryJSON)
   {
      jetpackStorage['ynano_' + pluginId + '_trackingData']= aryJSON;
      jetpackStorageMgr.save();
      this.sendBeacon(pluginId, 'install', false /*bForce*/);
   },

   sendBeacon: function(pluginId, beaconType, bForce)
   {
      try
      {
         //console.log('sendBeacon (' + beaconType + ') is_sent: ' + this.isBeaconSent(pluginId, beaconType));
         if (bForce || !this.isBeaconSent(pluginId, beaconType))
         {
            var trackingDataJSON= jetpackStorage['ynano_' + pluginId + '_trackingData'];
            if (trackingDataJSON)
            {
               var trackingData= JSON.parse(trackingDataJSON);
               var trackTypeCount= trackingData.length;
               for (var trackTypeOn= 0; trackTypeOn < trackTypeCount; trackTypeOn++)
               {
                  var trackTypeCur= trackingData[trackTypeOn];
                  if (trackTypeCur.trackEvt.toLowerCase() == beaconType.toLowerCase())
                  {
                     var trackParams= {};
                     trackParams[YAHOO.ULT.SRC_SPACEID_KEY]= trackTypeCur.trackSpaceID;

                     for (var paramOn in trackTypeCur.trackParams)
                     {
                        var paramVal= trackTypeCur.trackParams[paramOn];
         	      	 
                        if (paramVal == '{installDate}')
                           paramVal= this.getInstallDate(pluginId);
                        else if (paramVal == '{nanoVer}')
                           paramVal= g_nanoClientVer;
                        else if (paramVal == '{nanoUUID}')
                           paramVal= this._mNanoUUID;
                        else if (paramVal == '{userSignedIn}')
                           paramVal= ((ChromeCookieManager._mYahooBlindYID != '') ? '1' : '0');

                        trackParams[paramOn]= paramVal; 	         
                     }

                     //console.log('sending beacon: ' + JSON.stringify(trackParams));
                     var trackURL= YAHOO.ULT.beacon_click(trackParams);

                     var trackRequest= Request({ url: trackURL });
                     trackRequest.get();
                     break;
                  }
               }

               this.setBeaconSent(pluginId, beaconType, true);      	
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.sendBeacon error: ' + e.message);
      }
   },

   sendBeaconToAllPlugins: function(beaconType, bForce)
   {
      try
      {
         var plugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
         var pluginCount= plugins.length;
         for (var pluginOn= 0; pluginOn < pluginCount; pluginOn++)
         {
            var pluginCur= plugins[pluginOn];
            this.sendBeacon(pluginCur.pluginID, beaconType, bForce);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.sendBeaconToAllPlugins error: ' + e.message);
      }   
   },

   clearTrackForAllPlugins: function(beaconType)
   {
      try
      {
         for (var storageID in jetpackStorage)
         {
            var pos= storageID.indexOf('_trackingState');
            if (pos != -1)
            {
               var pluginID= storageID.substr(0, pos);
               this.setBeaconSent(pluginID, beaconType, false);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.sendBeaconToAllPlugins error: ' + e.message);
      }   
   },

   generateUUID: function()
   {
      var strUUID= "";

      try
      {
         var timeSeed= ((new Date()).getTime()).toString();
         timeSeed= timeSeed.substr(timeSeed.length - 3);
         for (var seedOn= 0; seedOn < timeSeed; seedOn++)
            Math.random();

         for (var charOn= 0; charOn < 32; charOn++)
         {
            var charCur= Math.floor(Math.random() * 36);
            if (charCur > 25)
               charCur= String.fromCharCode(48 + charCur - 26);
            else
               charCur= String.fromCharCode(65 + charCur);

            strUUID += charCur;

            switch (charOn)
            {
               case 7:
               case 11:
               case 15:
               case 19:
                  strUUID += '-';
                  break;
            };
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.generateUUID error: ' + e.message);
      }

      return strUUID;
   }      
};

ChromeCookieManager =
{
  _mYahooBlindYID: "",
  _mCookieRegData: {},

  registerPluginCookies: function(pluginId, cookieJson)
  {
      try
      {
         for(var index = 0, lindex = cookieJson.length; index < lindex; index++)
         {
            var cookieNames = cookieJson[index].cookies;
            var fullDomain = cookieJson[index].domain;
            var partDomain = fullDomain;

            var schemeIdx= fullDomain.indexOf('://');
            if (schemeIdx != -1)
               fullDomain= partDomain= cookieJson[index].domain.substr(schemeIdx + 3);
            if (fullDomain.indexOf("www.") != -1)
              fullDomain = partDomain = fullDomain.substr(3);

            var dotIdx= fullDomain.indexOf('.');
            if (dotIdx != -1)
               partDomain= fullDomain.substr(dotIdx);

            for(var nameIndex = 0, lnameIndex = cookieNames.length; nameIndex < lnameIndex; nameIndex++)
            {
               var cookieName = cookieNames[nameIndex];
               if(!this._mCookieRegData[cookieName])
                  this._mCookieRegData[cookieName] = {};

               var domainArray = this._mCookieRegData[cookieName];
               if(!domainArray[fullDomain])
                  domainArray[fullDomain] = {};
               if(!domainArray[partDomain])
                  domainArray[partDomain] = {};

               this._mCookieRegData[cookieName][fullDomain][pluginId] = { pluginID: pluginId, lastChange: 0 };
               this._mCookieRegData[cookieName][partDomain][pluginId] = { pluginID: pluginId, lastChange: 0 };
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCookieManager::registerPluginCookies error: ' + e.message);
      }
  },

  getPluginIDsForCookie: function(cookieName, domain)
  {
    if(this._mCookieRegData[cookieName] && this._mCookieRegData[cookieName][domain])
    {
      return this._mCookieRegData[cookieName][domain];
    }
  },

  getBlindYIDFromYCookie: function(cookieVal)
  {
     try
     {
        this._mYahooBlindYID= "";
        if (cookieVal && (cookieVal.search(/^l=[^&]/) > -1 || 
                          cookieVal.search(/&l=[^&]/) > -1 || 
                          cookieVal.indexOf("np=1") > -1))
        {
           var nStart= -1, nLength = -1;
           if ((nStart= cookieVal.search("&l=")) > -1)
           {                    
              nStart += 3;
              if ((nLength = cookieVal.substr(nStart).search("&")) > -1)
              {                                
                 cookieVal= cookieVal.substr(nStart, nLength);                                
                 cookieVal= cookieVal.replace(/\./g, "^"); 
                 var reBlind = new RegExp('[:\\/?*"|<>]','g');
                 this._mYahooBlindYID= cookieVal.replace(reBlind, "_");
              }                    
           }
        }
     }
     catch (e)
     {
        ChromeDebugManager.logError('ChromeCookieManager::getBlindYIDFromYCookie error: ' + e.message);
     }
   } 
};

ChromePluginManager=
{
  _mEventRegData: {},

  registerEventsForPlugin: function(tab, pluginId, eventList)
  {
    for(var index = 0, lindex = eventList.length; index < lindex; index++)
    {
      var eventName = eventList[index];
      if(!this._mEventRegData[tab])
      {
        this._mEventRegData[tab] = {};
      }
      if(!this._mEventRegData[tab][pluginId])
      {
        this._mEventRegData[tab][pluginId] = {};
      }
      this._mEventRegData[tab][pluginId][eventName] = true;
    }
  },

  unregisterEventsForPlugin: function(tab, pluginId)
  {
    if(this._mEventRegData[tab] && this._mEventRegData[tab][pluginId])
    {
      delete this._mEventRegData[tab][pluginId];
    }
  },

  isEventSupportedForPlugin: function(tab, pluginId, eventName)
  {
    if(this._mEventRegData[tab] && this._mEventRegData[tab][pluginId] && this._mEventRegData[tab][pluginId][eventName])
    {
      return true;
    }
    return false;
  },

  getPluginListForTab: function(tab)
  {
    return this._mEventRegData[tab];
  },

  installPlugin: function(pluginID)
  {
    jetpackStorage['ynano_' + pluginID + '_installed']= true;
    jetpackStorageMgr.save();
  },

  uninstallPlugin: function(pluginID)
  {
    jetpackStorage['ynano_' + _pluginID + '_installed']= false;
    jetpackStorageMgr.save();
  },

  isPluginInstalled: function(pluginID)
  {
    return (jetpackStorage['ynano_' + pluginID + '_installed'] !== false);
  },

  getInstalledPlugins: function(callObj)
  {
    var plugins = ChromeScriptInjector.getPlugins();
    var installedPlugins = [];
    for (var index in plugins)
    {
      var pluginId = plugins[index].pluginID;
      if (this.isPluginInstalled(plugins[index].pluginID))
      {
        installedPlugins.push(pluginId);
      }
    }
    return installedPlugins;
  }
};

ChromeNavigationManager=
{
  navigate: function(callObj, worker)
  {
    var pvData = JSON.parse(callObj.pvData);
    if (pvData.navTarget == "self")
    {
       this.navigateSelf(pvData.navURL, worker);
    }
    else if (pvData.navTarget == "tab")
    {
      ChromeScriptInjector.onDeactivate(worker.tab); 
      tabs.open({url: pvData.navURL, inBackground: false});
    }
    else
      tabs.open({url: pvData.navURL, inNewWindow: true});
  },

  navigateSelf: function(url, worker)
  {
     worker.domWindow.document.location= url;
  }
};

Base64Encoder= 
{
   _mEncodeChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

   encodeData: function(dataIn)
   {
      var base64Out= "";

      try
      {
         var dataCharOn= 0;
    
         while (dataCharOn < dataIn.length)
         {
            var padBytes= 0;

            // get the next 3 bytes of data by taking the next 3 unicode chars which come in
            // (minus the useless high-order bytes)
            var aryData3Bytes= [];
            for (var byteOn= 0; byteOn < 3; byteOn++)
            {
               if (dataCharOn >= dataIn.length)
               {
                  aryData3Bytes.push(0);
                  padBytes++;
               }
               else
                  aryData3Bytes.push(dataIn.charCodeAt(dataCharOn++) & 0xff);
            }
    
            // get each coded index into our encode array, 6 bits at a time, from the raw data
            var aryCodes= [];
            aryCodes.push(aryData3Bytes[0] >> 2); 
            aryCodes.push(((aryData3Bytes[0] & 0x3) << 4) | (aryData3Bytes[1] >> 4)); 
            aryCodes.push(((aryData3Bytes[1] & 0x0f) << 2) | (aryData3Bytes[2] >> 6)); 
            aryCodes.push(aryData3Bytes[2] & 0x3f); 

            // change all padding to char 64 (=)
            while (padBytes > 0)
               aryCodes[3 - --padBytes]= 64;

            for (var codeOn= 0; codeOn < 4; codeOn++)
               base64Out += this._mEncodeChars.charAt(aryCodes[codeOn]);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('Base64Encoder::encodeData error: ' + e.message);
      }

      return base64Out;
   }
};

ChromeResourcePreloader=
{
   _mPreloadURL: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20data.headers%20where%20url%3D%22{url}%22%20and%20ua%3D%22{ua}%22&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
   _mPreloadUA: "Mozilla/5.0 (compatible; Yahoo! Nano; http://help.yahoo.com/help/us/ysearch/slurp)",
   _mAryPageList: new Array(),
   _mAryResourceList: new Array(),
   _mAlreadyPreloaded: {},
   _mBase64FetchesRemain: {},
   _mActivePreloads: 0,
   _mLastPreloadReset: 0,
   _mMaxSimultaneousDownloads: 16,
   //_mElementsFetched: 0,

   preloadResources: function(isPage, aryList, timeStamp)
   {
      try
      {
         if (aryList && (aryList.length > 0))
         {
            this._mLastPreloadReset= timeStamp;
            
            for (var elemOn= 0, aryLength= aryList.length; elemOn < aryLength; elemOn++)
            {
               var elemUrl= aryList[elemOn];
               if (!this._mAlreadyPreloaded[elemUrl])
               {
                  this._mAlreadyPreloaded[elemUrl]= true;

                  var objPreload=
                  {
                     elemUrl: elemUrl,
                     timeStamp: timeStamp
                  };
                  
                  if (isPage)
                     this._mAryPageList.push(objPreload);
                  else
                     this._mAryResourceList.push(objPreload);
               }
            }

            var objPreloadCur;
            while (objPreloadCur= isPage ? this._mAryPageList.pop() : this._mAryResourceList.pop())
               this.loadResource(objPreloadCur, isPage, null /*base64ImageFetchUUID*/, null, null);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::preloadResources error: ' + e.message);
      }
   },

   cancelActivePreloads: function()
   {
      this._mLastPreloadReset= (new Date().getTime());
   },

   fetchImagesAsBase64: function(callObj, worker)
   {
      try
      {
         var aryList= JSON.parse(callObj.pvData);
         if (aryList)
         {
            var fetchUUID= ChromeTrackingManager.generateUUID();
            this._mBase64FetchesRemain[fetchUUID]= aryList.length;
            
            for (var elemOn= 0, elemLast= aryList.length; elemOn < elemLast; elemOn++)
            {
               var objPreload=
               {
                  elemUrl: aryList[elemOn],
                  timeStamp: 0
               };

               this.loadResource(objPreload, false /*isPage*/, fetchUUID /*base64ImageFetchUUID*/, worker, callObj.pluginID);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::fetchImagesAsBase64 error: ' + e.message);
      }
   },

   fixupResourceURL: function(rootUrl, rawResourceURL)
   {
      try
      {
         var resourceURL= rawResourceURL;
         if (resourceURL && (resourceURL.length > 2))
         {
            resourceURL= resourceURL.substring(1, resourceURL.length - 1);
            resourceURL= resourceURL.replace("&quot;", "");
            if (resourceURL.indexOf("://") == -1)
               resourceURL= rootUrl + ((resourceURL[0] == '/') ? resourceURL : ('/' + resourceURL));
            //console.log('[PC] adding ' + resourceURL);
            return resourceURL;
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::fixupResourceURL error (' + rawResourceURL + '): ' + e.message);
      }

      return null;      
   },

   checkForDownloadableResources: function(objPreload, srcContent)
   {
      try
      {
         //console.log('[PC] ***** SCANNING: ' + objPreload.elemUrl);
	  
         var aryResources= [];
         var srcUrl= objPreload.elemUrl;

         var rootUrl= "";
         var idx= srcUrl.indexOf("://");
         if (idx != -1)
         {
            idx= srcUrl.indexOf("/", idx + 3);
            rootUrl= (idx == -1) ? srcUrl : srcUrl.substring(0, idx);
         }

         // this is valid for HTML or CSS
         var backgroundResourceUrls= srcContent.match(/background[^:]*:[ ]*url[ ]*['"\(]([^'"\)]*)['"\)]/ig);
         if (backgroundResourceUrls)
         {
            for (var index= 0, lindex= backgroundResourceUrls.length; index < lindex; index++)
            {
               var backgroundResource= backgroundResourceUrls[index];
               var backgroundUrl= backgroundResource.match(/['"(]([^'"\)]*)['"\)]/ig)[0];
               if ((backgroundUrl= this.fixupResourceURL(rootUrl, backgroundUrl)) != null)
                  aryResources.push(backgroundUrl);
            }
         }

         // these are valid for HTML only
         if ((srcUrl.lastIndexOf(".css") != (srcUrl.length - 4)) || (srcUrl.indexOf(".css?") != -1))
         {
            var styleResourceUrls= srcContent.match(/<link[^>]*href[ ]*=[ ]*['"]([^'"]*)['"]/ig);
            if (styleResourceUrls)
            {
               for (var index= 0, lindex= styleResourceUrls.length; index < lindex; index++)
               {
                  var styleResource= styleResourceUrls[index];
                  var styleUrl= styleResource.match(/href[ ]*=[ ]*['"]([^'"]*)['"]/ig)[0].match(/['"]([^'"]*)['"]/ig)[0];
                  if (styleUrl && styleUrl.match(/\.(css|jpg|jpeg|png|gif|bmp|xml|ico)/gi))
                  {
                     if ((styleUrl= this.fixupResourceURL(rootUrl, styleUrl)) != null)
                        aryResources.push(styleUrl);
                  }
               }
            }

            var imageResourceUrls= srcContent.match(/<img[^>]*src[ ]*=[ ]*['"]([^'"]*)['"]/ig);
            if (imageResourceUrls)
            {
               for (var index= 0, lindex= imageResourceUrls.length; index < lindex; index++)
               {
                  var imageResource= imageResourceUrls[index];
                  var imageUrl= imageResource.match(/src[ ]*=[ ]*['"]([^'"]*)['"]/ig)[0].match(/['"][^'"]*['"]/ig)[0];
                  if ((imageUrl= this.fixupResourceURL(rootUrl, imageUrl)) != null)
                     aryResources.push(imageUrl);
               }
            }

            var scriptResourceUrls= srcContent.match(/<script[^>]*src[ ]*=[ ]*['"]([^'"]*)['"]/ig);
            if (scriptResourceUrls)
            {
               for (var index= 0, lindex= scriptResourceUrls.length; index < lindex; index++)
               {
                  var scriptResource= scriptResourceUrls[index];
                  var scriptUrl= scriptResource.match(/src[ ]*=[ ]*['"]([^'"]*)['"]/ig)[0].match(/['"]([^'"]*)['"]/ig)[0];
                  if ((scriptUrl= this.fixupResourceURL(rootUrl, scriptUrl)) != null)
                     aryResources.push(scriptUrl);
               }
            }
         }
         else
         {
            // this is valid for CSS only
            var importUrls= srcContent.match(/@import[ ]+url[ ]*\(['"]*([^'"\)]*)\)/ig);
            if (importUrls)
            {
               for (var index= 0, lindex= importUrls.length; index < lindex; index++)
               {
                  var importResource= importUrls[index];
                  var importUrl= importResource.match(/\(['"]*([^'"\)]*)\)/ig)[0].match(/([^'"\)]*)/ig)[0];
                  if ((importUrl= this.fixupResourceURL(rootUrl, importUrl)) != null)
                     aryResources.push(importUrl);
               }
            }
         }

         //this._mElementsFetched += aryResources.length;
         //console.log('[PC] found ' + this._mElementsFetched + ' resources so far');
         this.preloadResources(false /*isPage*/, aryResources, objPreload.timeStamp);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::checkForDownloadableResources error: ' + e.message);
      }
   },

   loadResource: function(objPreload, isPage, base64ImageFetchUUID, worker, pluginID)
   {
      try
      {
         var _self= this, url= objPreload.elemUrl;

         if ((objPreload.timeStamp > 0) && (objPreload.timeStamp < this._mLastPreloadReset))
            return;

         if (this._mActivePreloads >= this._mMaxSimultaneousDownloads)
         {
            require("timer").setTimeout(function() { _self.loadResource(objPreload, isPage, base64ImageFetchUUID, worker, pluginID); }, 100);
            return;
         }
        
         if (isPage)
         {
            url= this._mPreloadURL.replace('{url}', encodeURIComponent(url))
                                  .replace('{ua}', encodeURIComponent(this._mPreloadUA));
         }
         
         var request;

         var requestParams= 		 
         {
            url: url, 
            onComplete: function(response)        
            {          
               _self._mActivePreloads--;
               
               if (isPage || (objPreload.elemUrl.lastIndexOf(".css") == (objPreload.elemUrl.length - 4)) || (objPreload.elemUrl.indexOf(".css?") != -1))
               {
                  if (response.status == 200)
                  {
                     var responseText= response.text;

                     if (isPage)
                     {
                        var contentBegin= responseText.indexOf('<content>');
                        var contentEnd= responseText.lastIndexOf('</content>');
                        if ((contentBegin != -1) && (contentEnd != -1))
                        {
                           var pageContent= responseText.substring(contentBegin + 9, contentEnd);
                           pageContent= pageContent.replace(/&amp;/g, '&');
                           pageContent= pageContent.replace(/&lt;/g, '<');
                           pageContent= pageContent.replace(/&gt;/g, '>');
                  
                           _self.checkForDownloadableResources(objPreload, pageContent);
                        }
                     }
                     else
                        _self.checkForDownloadableResources(objPreload, responseText);
                  }
               }
               else if (base64ImageFetchUUID && worker && pluginID)
               {
                  var headerStr= "";
                  var encodedData= "";
                  
                  if (response.status == 200)
                  {
                     encodedData= Base64Encoder.encodeData(response.text);

                     var hdrBits= encodedData.substr(0, 3);
                     if (hdrBits == "R0l")
                        headerStr= "data:image/gif;base64,";
                     else if (hdrBits == "iVB")
                        headerStr= "data:image/png;base64,";
                     else if (hdrBits == "/9j")
                        headerStr= "data:image/jpeg;base64,";
                     else
                     {
                        var nIdxExt= url.lastIndexOf('.');
                        if (nIdxExt != -1)
                           headerStr= "data:image" + ((nIdxExt == -1) ? "" : ("/" + url.substr(nIdxExt + 1))) + ";base64,";
                        else
                           response.status= 415; // set unsupported media type if we can't figure out what this is
                     }
                  }

                  var evtObj=
                  {
                     eventFn: "onBase64ImageFetch",
                     eventPv:
                     {
                        imgURL: url,
                        imgStatus: response.status,
                        imgData: ((response.status == 200) ? (headerStr + encodedData) : "")
                     },
                     pluginID: pluginID
                  };

                  ChromeScriptInjector.fireEventToTab(evtObj, worker, false);

                  if (!--_self._mBase64FetchesRemain[request.base64ImageFetchUUID])
                  {
                     _self._mBase64FetchesRemain[request.base64ImageFetchUUID]= null;
                     
                     var evtObj=
                     {
                        eventFn: "onBase64ImageFetchesComplete",
                        eventPv: null,
                        pluginID: pluginID
                     };
                     
                     ChromeScriptInjector.fireEventToTab(evtObj, worker, false);
                  }				  
               }
            }
         };

         if (base64ImageFetchUUID)
            requestParams.overrideMimeType= "text/plain; charset=x-user-defined";

         request= Request(requestParams);

         if (base64ImageFetchUUID)
            request.base64ImageFetchUUID= base64ImageFetchUUID;		 

         this._mActivePreloads++;
         request.get();
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::loadResource error (' + url + '): ' + e.message);
      }
   }
};

ChromePerfMonitor=
{
  _mAryPerfMetrics: {},
  _mBootStart: null,
  _mBootEnd: null,

  getPerfMetricsForPlugin: function(tab, pluginId)
  {
    if(this._mAryPerfMetrics[tab] && this._mAryPerfMetrics[tab][pluginId])
    {
      var metrics = {};
      metrics['msecBoot'] = this._mBootEnd - this._mBootStart;
      metrics['msecPageLoad'] = this._mAryPerfMetrics[tab]['pageEnd'] - this._mAryPerfMetrics[tab]['pageStart'];
      metrics['msecInject'] = this._mAryPerfMetrics[tab][pluginId]['loadEnd'] - this._mAryPerfMetrics[tab][pluginId]['loadStart'];
      metrics['tsInjectStart'] = this._mAryPerfMetrics[tab][pluginId]['loadStart'];
      return metrics;
    }
  },

  setPerfMetricsForPlugin: function(tab, pluginId, name, value, overwrite)
  {
    if( ! this._mAryPerfMetrics[tab])
    {
      this._mAryPerfMetrics[tab] = {};
    }
    if( ! this._mAryPerfMetrics[tab][pluginId])
    {
      this._mAryPerfMetrics[tab][pluginId] = {};
    }
    if((this._mAryPerfMetrics[tab][pluginId][name] && overwrite) || !this._mAryPerfMetrics[tab][pluginId][name])
      this._mAryPerfMetrics[tab][pluginId][name] = value;
  },

  setBootStart: function(time)
  {
    this._mBootStart = time;
  },

  setBootEnd: function(time)
  {
    this._mBootEnd = time;
  },

  setPageLoadStart: function(tab, time, overwrite)
  {
    if( ! this._mAryPerfMetrics[tab])
    {
      this._mAryPerfMetrics[tab] = {};
    }
    if((this._mAryPerfMetrics[tab]['pageStart'] && overwrite) || !this._mAryPerfMetrics[tab]['pageStart'])
      this._mAryPerfMetrics[tab]['pageStart'] = time;
  },

  setPageLoadEnd: function(tab, time, overwrite)
  {
    if( ! this._mAryPerfMetrics[tab])
    {
      this._mAryPerfMetrics[tab] = {};
    }
    if((this._mAryPerfMetrics[tab]['pageEnd'] && overwrite) || !this._mAryPerfMetrics[tab]['pageEnd'])
      this._mAryPerfMetrics[tab]['pageEnd'] = time;
  },

  onPageAttach: function(worker, pluginId)
  {
     var timeCur= (new Date()).getTime();
     this.setPageLoadEnd(worker.tab, timeCur, true /*overwrite*/);
     this.setPerfMetricsForPlugin(worker.tab, pluginId, 'loadStart', timeCur, true /*overwrite*/);
  }
};

ChromeImageCapture=
{
  showHidePlugins: function(worker, bShow, fnContinue)
  {
    try
    {
      worker.port.emit('ynano_FF_util', { func: (bShow ? "showPlugins" : "hidePlugins") });
      if (fnContinue)
        require("timer").setTimeout(fnContinue, 100);
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeImageCapture::showHidePlugins error: ' + e.message);
    }
  },

  getCurTabImageAsCanvas: function(worker)
  {
    try
    {
      var docUse= worker.domWindow.document;
      var workerDOMWindow= worker.domWindow;

      var canvas= docUse.createElement('canvas');
      canvas.width= workerDOMWindow.innerWidth;
      canvas.height= workerDOMWindow.innerHeight;

      var context= canvas.getContext("2d");
      context.drawWindow(workerDOMWindow, workerDOMWindow.scrollX, workerDOMWindow.scrollY, canvas.width, canvas.height, "rgb(255,255,255)");
      return canvas;
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeImageCapture::getCurTabImage error: ' + e.message);
    }
  },
   
  captureTabImage: function(worker, callObj)
  {
    try
    {
      var _self= this;
           
      //_self.showHidePlugins(worker, false /*bShow*/, function()
      //{				  
        var imageCanvas= _self.getCurTabImageAsCanvas(worker);

        //_self.showHidePlugins(worker, true /*bShow*/, function()
        //{
          var imgArgs= JSON.parse(callObj.pvData);
          _self.convertToDesiredSizeAndReturn(worker, imgArgs, callObj, imageCanvas);                                      
        //});
      //});
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeImageCapture::captureTabImage error: ' + e.message);
    }
  },

  convertToDesiredSizeAndReturn: function(worker, imgArgs, callObj, imageCanvas)
  {
    try
    {
      var docUse= worker.domWindow.document;
		 		 
      if (imgArgs.scaleWidth && imgArgs.scaleHeight)
      {
        var canvasSize= docUse.createElement('canvas');
        var contextSize= canvasSize.getContext("2d");
        var imgAspect= imageCanvas.width / imageCanvas.height;
        var scaleAspect= imgArgs.scaleWidth / imgArgs.scaleHeight;
        var nWidth, nHeight, xOfs= 0;

        canvasSize.width= imgArgs.scaleWidth;
        canvasSize.height= imgArgs.scaleHeight;

        if (imgAspect < scaleAspect)
        {
          nWidth= imageCanvas.width;
          nHeight= Math.round(imageCanvas.width / scaleAspect);
        }
        else
        {
          nHeight= imageCanvas.height;
          nWidth= Math.round(imageCanvas.height * scaleAspect);
 
          xOfs= Math.round((imageCanvas.width / 2) - (nWidth / 2));
        }

        contextSize.drawImage(imageCanvas, xOfs, 0, nWidth, nHeight, 0, 0, imgArgs.scaleWidth, imgArgs.scaleHeight);

        callObj.ret = {};
        callObj.ret.imgData= canvasSize.toDataURL("image/png");
        worker.port.emit('ynano_FF', callObj);
      }
      else
      {
        callObj.ret = {};
        callObj.ret.imgData= imageCanvas.toDataURL("image/png");
        worker.port.emit('ynano_FF', callObj);
      }
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeImageCapture::convertToDesiredSizeAndReturn error: ' + e.message);
    }   
  }
};

ChromeHistoryManager=
{
   _mAryHistory: [],
   _mMaxCachedResults: 1000,
   _mDaysOfHistoryToConsider: 30,
   _mStalePeriod: 60 * 60 * 5 * 1000, // 5 minutes
   _mLastInit: 0,
   
   ensureInit: function(force, fnRet)
   {
      try
      {
         var timeCur= (new Date()).getTime();
         //console.log('---- initializing history ----');

         if (((timeCur - this._mLastInit) > this._mStalePeriod) || force)
         {
            this._mLastInit= timeCur;           

            var historyService= Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);

            var query= historyService.getNewQuery();        
            query.beginTime= timeCur - (86400000000 * this._mDaysOfHistoryToConsider);
            query.beginTimeReference= query.TIME_RELATIVE_EPOCH;
            query.hasBeginTime= true;

            var options= historyService.getNewQueryOptions();                
            options.maxResults= this._mMaxCachedResults;

            var result= historyService.executeQuery(query, options);
            if (result)
            {
               var container= result.root;
               container.containerOpen= true;

               //console.log('found ' + container.childCount + ' results going back ' + this._mDaysOfHistoryToConsider + ' days.');
               if ((this._mDaysOfHistoryToConsider < 360) && (container.childCount < this._mMaxCachedResults))
               {
                  container.containerOpen= false;

                  this._mDaysOfHistoryToConsider += 30;
                  this.ensureInit(true /*force*/, fnRet);
               }
               else
               {

                  this._mAryHistory= [];

                  for (var resultOn= 0, resultCount= container.childCount; resultOn < resultCount; resultOn++)
                  {
                     var resultCur= container.getChild(resultOn);
                     if (resultCur && resultCur.title)
                     {
                        this._mAryHistory.push(
                        {
                           title: resultCur.title,
                           url: resultCur.uri,
                           visits: resultCur.accessCount,
                           ts: Math.floor(resultCur.time / 1000000)
                        });
                     }
                  }

                  container.containerOpen= false;

                  this._mAryHistory.sort(function(left, right)
                  {
                     return left.ts < right.ts;
                  });

                  //console.log(JSON.stringify(this._mAryHistory));

                  if (fnRet)
                     fnRet();
           	   }
            }
         }
         else if (fnRet)
            fnRet();
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeHistoryManager::ensureInit error: ' + e.message);
      }
   },

   queryHistory: function(callObj, worker)
   {
      try
      {
         var criteriaObj= ((callObj.pvData.length > 0) ? JSON.parse(callObj.pvData) : {});
         var reTitle= (criteriaObj.regexTitle ? new RegExp(criteriaObj.regexTitle, 'g') : null);
         var reURL= (criteriaObj.regexURL ? new RegExp(criteriaObj.regexURL, 'g') : null);
         var resultsLeft= (criteriaObj.maxResults ? criteriaObj.maxResults : -1);
         var aryMatches= [];
         var _self= this;

         this.ensureInit(ChromeScriptInjector._mInUnitTests /*force*/, function()
         {
            for (var histOn= 0, histCount= _self._mAryHistory.length; histOn < histCount; histOn++)
            {
               var histObjOn= _self._mAryHistory[histOn];
            
               if ((!reTitle && !reURL) ||
                   (reTitle && histObjOn.title.match(reTitle)) ||
                   (reURL && histObjOn.url.match(reURL)))
               {
                  if ((resultsLeft != -1) && (resultsLeft-- == 0))
                     break;

                  aryMatches.push(histObjOn);
               }
            }

            callObj.ret= aryMatches;
            worker.port.emit('ynano_FF', callObj);
         });
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeHistoryManager::queryHistory error: ' + e.message);
      }   
   }
};

ChromeSearchProviderHandler=
{
  createOpenSearchXMLFromProviderInfo: function(provInfo)
  {
    var xmlDoc= null;
	
    try
    {
      var AppShellService= Cc["@mozilla.org/appshell/appShellService;1"].getService(Ci.nsIAppShellService);
      var document= AppShellService.hiddenDOMWindow.document;
	
      xmlDoc= document.implementation.createDocument("", "", null);
      if (xmlDoc)
      {
        var elemRoot= xmlDoc.createElementNS("http://www.mozilla.org/2006/browser/search/", "SearchPlugin");  
        if (elemRoot)
        {		  
          var elemShortName= xmlDoc.createElement("ShortName");
          if (elemShortName)
          {
            var nodeShortNameText= xmlDoc.createTextNode(provInfo.providerName);
            elemShortName.appendChild(nodeShortNameText);
            elemRoot.appendChild(elemShortName);
          }

          var elemDesc= xmlDoc.createElement("Description");
          if (elemDesc)
          {
            var nodeShortNameText= xmlDoc.createTextNode(provInfo.providerName);
            elemDesc.appendChild(nodeShortNameText);
            elemRoot.appendChild(elemDesc);
          }

          var posSchemeEnd= provInfo.searchURL.indexOf("://");
          if (posSchemeEnd != -1)
          {
            var posDomainEnd= provInfo.searchURL.indexOf("/", posSchemeEnd + 3);
            if (posDomainEnd != -1)
            {
              var searchDomain= provInfo.searchURL.substring(0, posDomainEnd + 1);
			  
              var elemImage= xmlDoc.createElement("Image");
              if (elemImage)
              {
                var nodeImgSourceText= xmlDoc.createTextNode(searchDomain + 'favicon.ico');
                elemImage.appendChild(nodeImgSourceText);
                elemImage.setAttribute("height", "16");
                elemImage.setAttribute("width", "16");
                elemImage.setAttribute("type", "16");
                elemRoot.appendChild(elemImage);
              }
            }
          }

          var elemSearchUrl= xmlDoc.createElement("Url");
          if (elemSearchUrl)
          {
            elemSearchUrl.setAttribute("type", "text/html");
            elemSearchUrl.setAttribute("template", provInfo.searchURL);
            elemRoot.appendChild(elemSearchUrl);
          }

          var elemSuggUrl= xmlDoc.createElement("Url");
          if (elemSearchUrl)
          {
            elemSuggUrl.setAttribute("type", "application/x-suggestions+json");
            elemSuggUrl.setAttribute("template", provInfo.suggURL);
            elemRoot.appendChild(elemSuggUrl); 
          }

          xmlDoc.appendChild(elemRoot);  
        }
      }
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeSearchProviderHandler::createOpenSearchXMLFromProviderInfo error: ' + e.message);
    }

    return xmlDoc;
  },

  writeOpenSearchXMLFile: function(xmlDoc, provInfo)
  {
    try
    {
      var fldrProfileRoot= Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
      if (fldrProfileRoot)
      {
        var fldrSearchPlugins= fldrProfileRoot.clone();
        if (fldrSearchPlugins)
        {
          fldrSearchPlugins.append("searchplugins");
          if (!fldrSearchPlugins.exists() || !fldrSearchPlugins.isDirectory())
            fldrSearchPlugins.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);

          var fileSearchProvider= fldrSearchPlugins.clone();
          if (fileSearchProvider)
          {
            fileSearchProvider.append(encodeURIComponent(provInfo.providerName) + '.xml');
            var oFOStream= Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);  
            if (oFOStream)
            {
              oFOStream.init(fileSearchProvider, 0x02 | 0x08 | 0x20, 0664, 0); 

              var xmlSerializer= Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);  
              if (xmlSerializer)
                xmlSerializer.serializeToStream(xmlDoc, oFOStream, "");  

              oFOStream.close();  
            }
          }
        }
      }
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeSearchProviderHandler::writeOpenSearchFile error: ' + e.message);
    }
  },
  
  setSearchProvider: function(callObj)
  {
    try
    {
      var provInfo= JSON.parse(callObj.pvData);

      var xmlDoc= this.createOpenSearchXMLFromProviderInfo(provInfo);
      if (xmlDoc)
        this.writeOpenSearchXMLFile(xmlDoc, provInfo);

      // Set it in prefs, just to be sure
      prefService.set('browser.search.defaultenginename', provInfo.providerName);
	
      var engine = prefService.get('browser.search.selectedEngine');
      prefService.set('browser.search.selectedEngine', provInfo.providerName);
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeSearchProviderHandler::setSearchProvider error: ' + e.message);
    }
  }
};

ChromePageCallHandler=
{
  installPlugin: function(callObj, worker)
  {
    if (this.isTabAYahooSite(worker))
    {
      var pluginID = callObj.pvData;
      ChromePluginManager.installPlugin(pluginID);
    }
  },

  uninstallPlugin: function(callObj, worker)
  {
    if (this.isTabAYahooSite(worker))
    {
      var pluginID = callObj.pvData;
      ChromePluginManager.uninstallPlugin(pluginID);
    }
  },

  getInstalledPlugins: function(callObj, worker)
  {
    var installedPlugins = ChromePluginManager.getInstalledPlugins(callObj);
    callObj.ret = installedPlugins;
    ChromeScriptInjector.fireEventToTab(callObj, worker, false);
  },

  setHomePage: function(callObj, worker)
  {
    if (this.isTabAYahooSite(worker))
      prefService.set('browser.startup.homepage', callObj.pvData);
  },

  setSearchProvider: function(callObj, worker)
  {
    if (this.isTabAYahooSite(worker))
      ChromeSearchProviderHandler.setSearchProvider(callObj);
  },

  getNanoPrefs: function(callObj, worker)
  {
    if (this.isTabAYahooSite(worker))
      ChromePageCallHandler.getNanoPrefs(callObj, worker);
  },

  setNanoPrefs: function(callObj, worker)
  {
    if (this.isTabAYahooSite(worker))
      ChromePageCallHandler.setNanoPrefs(callObj, worker);
  },

  handleCall: function(callObj, worker)
  {
    if (this[callObj.callFn])
    {
      this[callObj.callFn](callObj, worker);
    }
  },

  isTabAYahooSite: function(worker)
  {
    var reMatch= worker.tab.url.match("://[/]*([^/]*).yahoo.com[$|/]*");
    return (reMatch && (reMatch.length > 0)) ? true : false;
  }
};

ChromeScriptInjector=
{
  _mNanoBridgeCodeURL: "",
  _mNanoBridgeCode: null,
  _mPageBridgeURL: "",
  _mInjectCodeInPage: "",
  _mInjectCodeInSecurePage: "",
  _mScriptRemain: 0,
  _mWorkers: null,
  _mFeedUrl: "https://nano.data.toolbar.yahoo.com/nanoFeed",
  //_mFeedUrl: "http://icethinsquare-vm0.atlanta.corp.yahoo.com/ytoolbar/nanoclients/nanoFeedTest.php",
  _mFeedJSON: null,
  _mAryPluginResourceCollection: {ts:0, normal:{}, unittest:{}},
  _mLastActiveTab: null,
  _mLastIdleTab: null,
  _mActiveIdleTimeout: null,
  _mInUnitTests: false,
  _mNewTabURL: null,
  _mRetriedNanoFeed: false,
  _mInjectAtTop: false,
  _mDevPluginJSON: null,
  _mSeenNanoMode: false,
  _mQAMode: null,

  detachWorker: function(worker)
  {
    var index = this._mWorkers.indexOf(worker);
    if (index != -1)
      this._mWorkers.splice(index, 1);
  },

  verifyNanoInstalled: function(callObj, worker)
  {
    callObj.ret= true;
    worker.port.emit('ynano_FF', callObj);     
  },

  getVersion: function(callObj, worker)
  {
    callObj.ret= { nanoVer: g_nanoClientVer };
    worker.port.emit('ynano_FF', callObj);     
  },

  getPerfMetrics: function(callObj, worker)
  {
    callObj.ret = ChromePerfMonitor.getPerfMetricsForPlugin(worker.tab, callObj.pluginID);
    worker.port.emit('ynano_FF', callObj);
  },

  sinkClientEvents: function(callObj, worker) {
    if (!worker.isSinked)
      worker.isSinked= {};
    worker.isSinked[callObj.pluginID]= true;
    ChromePerfMonitor.setPerfMetricsForPlugin(worker.tab, callObj.pluginID, 'loadEnd', (new Date()).getTime(), true /*overwrite*/);
    ChromePluginManager.registerEventsForPlugin(worker.tab, callObj.pluginID, JSON.parse(callObj.pvData));
    //console.log("SINK " + JSON.parse(callObj.pvData));

    var evtObj=
    {
      eventFn: "onNavigateComplete",
      eventPv: { URL: worker.tab.url },
      pluginID: callObj.pluginID
    };

    this.fireEventToTab(evtObj, worker, false);

    if (worker.evtsToFireOnSink && worker.evtsToFireOnSink[callObj.pluginID])
    {
      for (var evtOn= 0, evtCount= worker.evtsToFireOnSink[callObj.pluginID].length; evtOn < evtCount; evtOn++)
        this.fireEventToTab(worker.evtsToFireOnSink[callObj.pluginID][evtOn], worker, false);

      worker.evtsToFireOnSink[callObj.pluginID]= [];
    }
  },

  unsinkClientEvents: function(callObj, worker) {
    worker.isSinked[callObj.pluginID]= false;
    ChromePluginManager.unregisterEventsForPlugin(worker.tab, callObj.pluginID);
  },

  queryBrowserHistory: function(callObj, worker)
  {
    ChromeHistoryManager.queryHistory(callObj, worker);
  },

  fetchBrowserBookmarks: function(callObj, worker)
  {
  },

  navigateURL: function(callObj, worker) {
    ChromeNavigationManager.navigate(callObj, worker);
  },

  sendNavigateResponse: function(callObj, worker) 
  {
    if (worker.tab.navTimeout)
    {
      require("timer").clearInterval(worker.tab.navTimeout);
      worker.tab.navTimeout= null;
    }
	
    var navURL= (callObj.pvData.indexOf('{') != -1 ? JSON.parse(callObj.pvData).URL : callObj.pvData);
    if (!worker.ignoreNextNavResponse)
    {
      if (navURL != "")
      {
        worker.tab.allowNextNavURL= navURL;
        ChromeNavigationManager.navigateSelf(navURL, worker);
      }
    }
  },

  getBrowserState: function(callObj, worker) {
    callObj.ret= {};
    callObj.ret.type= "Firefox";
    callObj.ret.browserVer= appInfo.version;
    callObj.ret.nanoVer= g_nanoClientVer;
    callObj.ret.inPrivate= require("private-browsing").isActive;
    callObj.ret.UUID= ChromeTrackingManager._mNanoUUID;
    worker.port.emit('ynano_FF', callObj);
  },

  trackCookies: function(callObj, worker) {
    var _self = this;
    var cookieJson = JSON.parse(callObj.pvData);
    ChromeCookieManager.registerPluginCookies(callObj.pluginID, cookieJson);
  },

  preloadPages: function(callObj, worker) {
    ChromeResourcePreloader.preloadResources(true /*isPage*/, JSON.parse(callObj.pvData), (new Date()).getTime());
  },

  getTabImageData: function(callObj, worker) {
    ChromeImageCapture.captureTabImage(worker, callObj);
  },

  fetchImagesAsBase64: function(callObj, worker) {
    ChromeResourcePreloader.fetchImagesAsBase64(callObj, worker);
  },

  update: function(callObj, worker) {
    var evtObj=
    {
      eventFn: "onUpdate",
	  eventPv: callObj.pvData,
	  pluginID: callObj.pluginID
    };

    this.fireEventToAllTabs(evtObj, worker, true);
  },

  sendMessage: function(callObj, worker) {
    var evtObj=
    {
      eventFn: "onMessage",
	  eventPv: JSON.parse(callObj.pvData),
	  pluginID: callObj.pluginID
    };
	
    this.fireEventToAllTabs(evtObj, worker, true);
  },

  sendTrackingData: function(callObj, worker)
  {
     ChromeTrackingManager.setTrackingDataJSON(callObj.pluginID, callObj.pvData);
  },

  performTrack: function(callObj, worker)
  {
     ChromeTrackingManager.sendBeacon(callObj.pluginID, callObj.pvData, false /*bForce*/);
  },

  runScriptInPage: function(callObj, worker)
  {
     worker.port.emit('ynano_FF', callObj);
  },

  setNanoPrefs: function(callObj, worker)
  {
     try
     {
       var objPrefs= JSON.parse(callObj.pvData);
       for (var prefName in objPrefs)
         jetpackStorage["ynano_pref_" + prefName]= objPrefs[prefName];
       jetpackStorageMgr.save();
     }
     catch (e)
     {
       ChromeDebugManager.logError('ChromeCallHandler::setNanoPrefs error: ' + e.message);
     }
  },

  getNanoPrefs: function(callObj, worker)
  {
     try
     {
       var ret= {};

       var aryPrefs= JSON.parse(callObj.pvData);
       for (var prefOn= 0, prefCount= aryPrefs.length; prefOn < prefCount; prefOn++)
       {
         var prefName= aryPrefs[prefOn];
         ret[prefName]= jetpackStorage["ynano_pref_" + prefName];
       }

       callObj.ret= ret;
       worker.port.emit('ynano_FF', callObj);
     }
     catch (e)
     {
        ChromeDebugManager.logError('ChromeCallHandler::setNanoPrefs error: ' + e.message);
     }
  },

  fireEventToTab: function(evtObj, worker, fireOnSink)
  {
    try {
      if (evtObj.pluginID)
      {
        if (fireOnSink && (!worker.isSinked || !worker.isSinked[evtObj.pluginID]))
        {
          if (!worker.evtsToFireOnSink)
            worker.evtsToFireOnSink= {};
          if (!worker.evtsToFireOnSink[evtObj.pluginID])
            worker.evtsToFireOnSink[evtObj.pluginID]= [];
		  
          worker.evtsToFireOnSink[evtObj.pluginID].push(evtObj);
        }
        else if (ChromePluginManager.isEventSupportedForPlugin(worker.tab, evtObj.pluginID, evtObj.eventFn))
        {
          evtObj.isEvent = true;
          delete evtObj.callFn;
          worker.port.emit('ynano_FF', evtObj);
        }
      }
    } catch (e) {
      ChromeDebugManager.logError("Error in fireEventToTab: " + e.message);
    }
  },

  fireEventToAllTabs: function(evtObj, worker, ignoreSelf) {
    try {
      evtObj.isEvent = true;
      delete evtObj.callFn;
      for (var i = 0; i < ChromeScriptInjector._mWorkers.length; i++) {
        if (ignoreSelf && ChromeScriptInjector._mWorkers[i].tab == worker.tab)
          continue;
        if (evtObj.pluginID && ChromePluginManager.isEventSupportedForPlugin(ChromeScriptInjector._mWorkers[i].tab, evtObj.pluginID, evtObj.eventFn))
        {
          ChromeScriptInjector._mWorkers[i].port.emit('ynano_FF', evtObj);
        }
     }
    } catch (e) {
      ChromeDebugManager.logError("Error in fireEventToAllTabs: " + e.message);
    }
  },

  addContent: function(pluginId, injectContent, forUnitTests)
  {
    try 
    {
      var bInlineContent= !injectContent.injectRemote && !injectContent.injectWithBridge;
      if (bInlineContent)
      {
        var _self= this,
            tsBeforeFetch= this._mAryPluginResourceCollection.ts;

        var aryPluginResourceCollection= this._mAryPluginResourceCollection[forUnitTests ? "unittest" : "normal"];
        if (pluginId)
        {
          aryPluginResourceCollection[pluginId].resourcesRemain++;
        }
        this._mScriptRemain++;

        var request = Request({
          url: injectContent.contentUrlSSL ? injectContent.contentUrlSSL : injectContent.contentUrl,
          onComplete: function(response)
          {
            if (_self._mAryPluginResourceCollection.ts == tsBeforeFetch)
            {
              var injectCode= response.text;
              injectCode= injectCode.replace(/\n/g, "");
              injectCode= injectCode.replace(/\r/g, "");
              if( pluginId && ! injectContent.injectRemote ) injectContent.injectCode= injectCode;
              else if(! pluginId) _self._mNanoBridgeCode = injectCode;
              else injectContent.injectCode= "";

              if (pluginId && --aryPluginResourceCollection[pluginId]['resourcesRemain'] == 0)
                aryPluginResourceCollection['pluginsNotReady']--;
			
              if (aryPluginResourceCollection['pluginsNotReady'] == 0 && _self._mNanoBridgeCode)
                ChromePerfMonitor.setBootEnd((new Date()).getTime());
            }
          }
        });
        request.get();
      }

      return bInlineContent;
    } 
    catch (e) 
    {
      ChromeDebugManager.logError('ChromeScriptInjector.addContent error: ' + e.message);
    }
  },

  addAllScript: function(plugins, forUnitTests)
  {
    //console.log('addAllScript called (forUnitTests:' + forUnitTests + ')');
    try
    {
      this.addContent(null, {"contentUrl": this._mNanoBridgeCodeURL}, forUnitTests);
      var timeCur= (new Date()).getTime();
      var aryPluginResourceCollection= this._mAryPluginResourceCollection[forUnitTests ? "unittest" : "normal"];
      aryPluginResourceCollection['pluginsNotReady'] = 0;
      for(var index = 0, lindex = plugins.length; index < lindex; index++)
      {
        var bFoundInlineContent= false;
        var pluginId = plugins[index].pluginID;
        aryPluginResourceCollection[pluginId] = {};
        aryPluginResourceCollection[pluginId].resourcesRemain = 0;

        var injectContents = plugins[index].injectContent;
        for(var cindex = 0, lcindex = injectContents.length; cindex < lcindex; cindex++)
        {
          var injectContent = injectContents[cindex];
          if (this.addContent(pluginId, injectContent, forUnitTests) && !bFoundInlineContent)
          {
            aryPluginResourceCollection['pluginsNotReady']++;
            bFoundInlineContent= true;
          }
        }
        aryPluginResourceCollection[pluginId]['startedLoading'] = true;

        for each (var tabCur in tabs)
          ChromePerfMonitor.setPerfMetricsForPlugin(tabCur, pluginId, 'loadStart', timeCur, true /*overwrite*/);
      }
    } catch (e) {
      ChromeDebugManager.logError('ChromeScriptInjector.addAllScript error: ' + e.message);
    }
  },

  getPlugins: function(forUnitTests)
  {
    if (this._mFeedJSON && this._mFeedJSON.YNanoClientFeed && (forUnitTests ? this._mFeedJSON.YNanoClientFeed.unittest.plugins :
                                                                              this._mFeedJSON.YNanoClientFeed.plugins))
      return (forUnitTests ? this._mFeedJSON.YNanoClientFeed.unittest.plugins : this._mFeedJSON.YNanoClientFeed.plugins);
  },

  pluginsAreReady: function()
  {
    try {
      var activeURL= tabs.activeTab.url;
      if (!this._mFeedJSON || !this._mFeedJSON.YNanoClientFeed || !activeURL || !this._mNanoBridgeCode)
        return false;

      if (this._mFeedJSON.YNanoClientFeed.unittest)
      {
        var triggerURL= this._mFeedJSON.YNanoClientFeed.unittest.triggerURL;

        var paramIdx= activeURL.indexOf('?');
        if (paramIdx != -1)
          activeURL= activeURL.substr(0, paramIdx); 

        if (activeURL.indexOf(triggerURL) == 0)
        {
          //console.log('in unit tests');
          this._mInUnitTests= true;
        }
        else if (!this._mSeenNanoMode && (activeURL.indexOf('about:ynano-') == 0))
        {
          this._mSeenNanoMode= true;
               
          this.fetchFeed(false /*forceDefaultFeedURL*/, activeURL.substr(12));
          return false;
        }
      }

      this.checkForNewTabOverride();

      var aryPluginResourceCollection= this._mAryPluginResourceCollection[this._mInUnitTests ? "unittest" : "normal"];	 
      return (aryPluginResourceCollection['pluginsNotReady'] == 0);	
    } catch (e) {
      ChromeDebugManager.logError("ChromeScriptInjector.pluginsAreReady error: " + e.message);
    }

	return false;
  },

  checkForNewTabOverride: function()
  {
    try
    {
      var plugins= this.getPlugins(this._mInUnitTests);

      for (var index= 0, lindex= plugins.length; index < lindex; index++)
      {
        if (!this._mNewTabURL && plugins[index].newTabOverride)
        {
           this._mNewTabURL= plugins[index].newTabOverride;
           break;
        }
      }
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeScriptInjector.checkForNewTabOverride error: ' + e.message);
    }  
  },

  fetchFeed: function(forceDefaultFeedURL, qaMode)
  {
    try 
    {	
      ChromePerfMonitor.setBootStart((new Date()).getTime());

      //console.log('booted: ' + qaMode);

      this._mQAMode= qaMode;

      this._mAryPluginResourceCollection=
      {
         ts:(new Date()).getTime(), 
         normal:{}, 
         unittest:{}
      };                       
      	  
      ChromePluginManager.installPlugin('SearchX');          
      ChromeTrackingManager.init();
      ChromeHistoryManager.ensureInit(false, null);

      var _self= this;

      var devJSONpath= prefService.get("yahoo.ynano.devJSON");
      if (devJSONpath && (devJSONpath != ""))
      {
        var requestDevJSON= Request(
        {
          url: devJSONpath,
          onComplete: function(response)
          {
            if (response.status == 200)
            {
              _self._mDevPluginJSON= JSON.parse(response.text);

              for (var index = 0, lindex = _self._mDevPluginJSON.plugins.length; index < lindex; index++)
                ChromePluginManager.installPlugin(_self._mDevPluginJSON.plugins[index].pluginID);   
            }
          }
        });
		
        requestDevJSON.get();
      }

      var feedUrl= this._mFeedUrl;
      if (!forceDefaultFeedURL)
      {
        var storedFeedUrl= jetpackStorage['ynano_nanoFeedURL'];
        if (typeof(storedFeedUrl) == "string")
        {
          var reMatch= storedFeedUrl.match("://[/]*([^/]*).yahoo.com[$|/]*");
          if (reMatch && (reMatch.length > 0))
            feedUrl= storedFeedUrl;
        }
      }              
	  
      feedUrl += ("?nanoVer=" + encodeURIComponent(g_nanoClientVer));
      if (qaMode)
        feedUrl += ('&qamode=' + qaMode);
      //console.log("DINGO5 " + feedUrl);
	  
      var request= Request(
      {
        url: feedUrl,
        onComplete: function(response)
        {
          if (response.status == 200)
          {
            //console.log(response.text);
            _self._mFeedJSON = JSON.parse(response.text);

            if (_self._mFeedJSON.YNanoClientFeed)
            {
              _self.readFeedConfig();

              if (_self._mDevPluginJSON)
                _self._mFeedJSON.YNanoClientFeed.plugins= _self._mDevPluginJSON.plugins;
			
              if (_self._mFeedJSON.YNanoClientFeed.unittest)
                _self.addAllScript(_self.getPlugins(true), true);
		  
              _self.addAllScript(_self.getPlugins(false), false);
            }
          }
          else if (!_self._mRetriedNanoFeed)
          {
            _self._mRetriedNanoFeed= true;
            _self.fetchFeed(true /*forceDefaultFeedURL*/, _self.qaMode);
          }
        }
      });
	  
      request.get();
    } 
    catch (e) 
    {
      ChromeDebugManager.logError("ChromeScriptInjector.fetchFeed error: " + e.message);
    }
  },

  readFeedConfig: function()
  {
    try
    {     
      var configObj= this._mFeedJSON.YNanoClientFeed.config;
      if (configObj)
      {
        if (configObj.preloadURL)
          ChromeResourcePreloader._mPreloadURL= configObj.preloadURL;
        if (configObj.preloadUA)
          ChromeResourcePreloader._mPreloadUA= configObj.preloadUA;
        if (configObj.nanoBridgeJS)
          this._mNanoBridgeCodeURL= configObj.nanoBridgeJS;
        if (configObj.pageBridgeJS)
          this._mPageBridgeURL= configObj.pageBridgeJS;
        if (configObj.debugMode)
          ChromeDebugManager._mDebugMode= configObj.debugMode;
        if (configObj.injectAtTop)
          this._mInjectAtTop= configObj.injectAtTop;
        if (configObj.nanoFeedURL)
        {
          jetpackStorage['ynano_nanoFeedURL']= configObj.nanoFeedURL;
          jetpackStorageMgr.save();        
        }	
      }
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeScriptInjector.readFeedConfig error: ' + e.message);
    }
  },

  getNanoPropScript: function(withEmbed)
  {
    var nanoPropScript= "";
      
    try
    {
      nanoPropScript= 
      "try {" +
      "  YAHOO.NanoBridge.setProperties({" +
      "    nanoVer: '" + g_nanoClientVer + "'," +
      "    nanoUUID: '" + ChromeTrackingManager._mNanoUUID + "'," +
      "    nanoBridgeJS: '" + this._mNanoBridgeCodeURL + "'," +
      "    pageBridgeJS: '" + this._mPageBridgeURL + "'," +
      "    debugMode: " + (ChromeDebugManager._mDebugMode ? "true" : "false") + 
      "  }, " + (withEmbed ? "true" : "false") + ");" +
      "} catch(e) { }";
    }
    catch (e)
    {
      ChromeDebugManager.logError('ChromeScriptInjector.getNanoPropScript error: ' + e.message);
    }

    return nanoPropScript;	
  },

  injectNanoBridge: function()
  {
    try
    {
      var injectCode = "";

      injectCode += this._mNanoBridgeCode;

      injectCode+= "YInjectNanoBridge = function() {" +
      "  if (((document.readyState == 'complete') || (document.readyState == 'interactive')) && document.body && document.defaultView === document.defaultView.top) {" +
      "    try {" +
      "       if (window.content == null) return true;" +
      "       if (document && document.getElementById('ynano_hooks_page')) return true;" +
      "       YAHOO.NanoBridge.initPageInterface();" + this.getNanoPropScript(false) +
      "     } catch (e) { }" +
      "     return true;" +
      "  }" +
      "  return false;" +
      "};" +
      "if (!YInjectNanoBridge())" +
      "  document.addEventListener('onreadystatechange', function() { YInjectNanoBridge(); }, false);";

      //console.log("ChromeScriptInjector.injectNanoBridge code: " + injectCode);

      this._mInjectCodeInPage = injectCode;
      this._mInjectCodeInSecurePage = injectCode;
    } catch (e) {
      ChromeDebugManager.logError('ChromeScriptInjector.injectNanoBridge error: ' + e.message);
    }
  },

  injectScriptIntoPage: function(pluginObj, injectBridgeCode, securePage)
  {
    try
    {
      var pluginId= pluginObj.pluginID;
      var injectContents= pluginObj.injectContent;
      var injectScriptTags = "", injectStyleTags = "", inlineScriptCode = "", inlineStyleCode = "", injectCode = "";
      var inProductionMode= (!prefService.isSet("yahoo.ynano.qamode") || (prefService.get("yahoo.ynano.qamode") == 'prod') || (prefService.get("yahoo.ynano.qamode") == 'production'));

      injectCode += "YInjectNanoPlugins_"+pluginId+"= function() {" +
      "  if (document.getElementById('ynano_iframe_"+pluginId+"')) return true;" +
      "  if (((document.readyState == 'complete') || (document.readyState == 'interactive')) && document.body && document.defaultView === document.defaultView.top) {" +
      "    if (window.content == null) return true;" +
      "    try {" +
      "      YAHOO.NanoBridge.PluginInterface.init({pluginID:'" + pluginId + "',name:'page'});" + this.getNanoPropScript(true) +
      "      var iframe= document.createElement('iframe');" +
      "      iframe.id = 'ynano_iframe_"+pluginId+"';" +
      "      iframe.type = 'content';" +
      "      iframe.style.cssText='position:absolute;width:1px;height:1px;top:0px;left:-9999px;';" +
      "      iframe.scrolling='no';" +
      "      iframe.frameBorder='0';";

      if (this._mInjectAtTop)
      {
        injectCode += "if (document.body.firstChild)" +
        "  document.body.insertBefore(iframe, document.body.firstChild);" +
        "else";
      }

      injectCode +=
      "        document.body.appendChild(iframe);" +
      "      iframe.contentWindow.onload=function(){" +
      "        iframeDoc= iframe.contentDocument;" +
      "        iframeDoc.open().write('<html><head>";

      inlineScriptCode += this._mNanoBridgeCode;

      for (var index = 0, lindex = injectContents.length; index < lindex; index++)
      {
        var injectContent = injectContents[index];
        if (!injectContent.injectWithBridge)
        {
          if (injectContent.contentType == "JS")
          {
            if(injectContent.injectRemote)
            {
              var contentUrl= (securePage ? injectContent.contentUrlSSL : injectContent.contentUrl);
              if (!contentUrl)
                contentUrl= injectContent.contentUrl;

              injectScriptTags += '<scr' + 'ipt type="text/javascript" src="' + contentUrl + '"></scr\'+' + '\'ipt>';
            }
            else
              inlineScriptCode += injectContent.injectCode;
          }
          else if (injectContent.contentType == "CSS")
          {
            if(injectContent.injectRemote)
            {
              var contentUrl= (securePage ? injectContent.contentUrlSSL : injectContent.contentUrl);
              if (!contentUrl)
                contentUrl= injectContent.contentUrl;

              injectStyleTags += '<sty' + 'le type="text/css" rel="stylesheet" src="' + contentUrl + '"></scr' + 'ipt>';
            }
            else
              inlineStyleCode += injectContent.injectCode;
          }
        }
      }

      if (inlineScriptCode.length > 0)
      {
        inlineScriptCode= inlineScriptCode.replace(/\\/g, "\\\\");
        inlineScriptCode= inlineScriptCode.replace(/'/g, "\\'");

        injectCode += '<scr' + 'ipt type="text/javascript">' + inlineScriptCode +
                      '</scr' + 'ipt>'; 
      }
      if (inlineStyleCode.length > 0)
      {
        inlineStyleCode= inlineStyleCode.replace(/\\/g, "\\\\");
        inlineStyleCode= inlineStyleCode.replace(/'/g, "\\'");

        injectCode += '<sty' + 'le type="text/css" rel="stylesheet">' + inlineStyleCode +
                      '</sty' + 'le>';
      }

      injectCode += injectScriptTags+injectStyleTags;

      injectCode += "         </head><body></body></html>');" +
                    "         iframeDoc.close();" +
                    "         YAHOO.NanoBridge.PluginInterface.sinkWithIFrame(iframeDoc, '"+pluginId+"');" +
                    "       };" +
                    "     } catch (e) { YAHOO.NanoBridge.logError('YInjectNanoPlugins error:' + e.message); }" +
                    "     return true;" +
                    "  }" +
                    "  return false;" +
                    "};" +
                    "if (!YInjectNanoPlugins_"+pluginId+"())" +                    
                    "  document.onreadystatechange= function() { YInjectNanoPlugins_"+pluginId+"(); };";
                    
      //console.log("ChromeScriptInjector.injectScriptIntoPage code: " + injectCode);

      this._mInjectCodeInPage += injectCode;
      if (securePage)
        this._mInjectCodeInSecurePage += injectCode;
    } catch (e) {
      ChromeDebugManager.logError('ChromeScriptInjector.injectScriptIntoPage error: ' + e.message);
    }
  },

  getInjectCodeInPage: function(securePage)
  {
    if (securePage)
      return this._mInjectCodeInSecurePage;
    else
      return this._mInjectCodeInPage;
  },

  setupPageAttach: function(securePage)
  {
    try
    {
      tabs.activeTab.isActiveNano= true;
      
      var pageAttach= 
      {
        include: (securePage ? ["https://*"] : ["http://*"]),
        contentScriptWhen: 'ready',
        contentScript: ChromeScriptInjector.getInjectCodeInPage(securePage),
        onAttach: function(worker) 
        {           
          try
          {
            worker.tab.hasNanoWorker= true;
			
            ChromeScriptInjector._mWorkers.push(worker);
            worker.port.on('ynano_FF', function(data)
            {
              //console.log("DINGO " + data.callFn);
              ChromeScriptInjector.handleCall(data, worker);
            });
            worker.on('detach', function()
            {
              ChromeScriptInjector.detachWorker(worker);
            });

            var pluginIds = ChromePluginManager.getInstalledPlugins();
            for (var i = 0; i < pluginIds.length; i++)
              ChromePerfMonitor.onPageAttach(worker, pluginIds[i]);
          }
          catch (e) 
          {
            ChromeDebugManager.logError('pageAttach error: ' + e.message);
          }
        }     
      };
      var pageMode = require("page-mod").PageMod(pageAttach);

      require("timer").setTimeout(function()
      {
        for each (var tabCur in tabs)
        {
          if (!tabCur.hasNanoWorker)
          {
            tabCur.hasNanoWorker= true;

            var workerCur= tabCur.attach(pageAttach);
            workerCur.port.on('ynano_FF', function(data)
            {
              //console.log("DINGO2 " + data.callFn);
              ChromeScriptInjector.handleCall(data, workerCur);
            });
            workerCur.on('detach', function()
            {
              ChromeScriptInjector.detachWorker(workerCur);
            });
	    	
            ChromeScriptInjector._mWorkers.push(workerCur);

            var timeCur= (new Date()).getTime();
            ChromePerfMonitor.setPageLoadStart(tabCur, timeCur, true /*overwrite*/);

            var pluginIds = ChromePluginManager.getInstalledPlugins();
            for (var i = 0; i < pluginIds.length; i++)
              ChromePerfMonitor.onPageAttach(workerCur, pluginIds[i]);		  
          }
       	}
      }, 1000);
    } catch (e) {
      ChromeDebugManager.logError('ChromeScriptInjector.setupPageAttach error: ' + e.message);
    }  
  },

  handleCall: function(callObj, worker)
  {
    if (callObj.callFn == "getVersion" || callObj.callFn == "verifyNanoInstalled")
    {
      ChromeScriptInjector[callObj.callFn](callObj, worker);
      return;
    }
    if (callObj.srcIsPlugin)
    {
      ChromeScriptInjector[callObj.callFn](callObj, worker);
    } else {
      ChromePageCallHandler.handleCall(callObj, worker);
    }
  },

  findWorkerForTab: function(tab)
  {
     if (this._mWorkers)
     {
       for (var i = 0; i < this._mWorkers.length; i++)
       {
         if (this._mWorkers[i].tab == tab)
           return this._mWorkers[i];
       }
     }

     return null;
  },

  onActivate: function(tab)
  {
    tab.isActiveNano= true;
    var _self= this;
    this._mLastActiveTab= tab;
    if (!this._mActiveIdleTimeout)
      this._mActiveIdleTimeout= require("timer").setTimeout(function() { _self.sendActiveIdleEvents(); }, 500);
  },

  onDeactivate: function(tab)
  {
    tab.isActiveNano= false;
    var _self= this;
    this._mLastIdleTab= tab; 
    if (!this._mActiveIdleTimeout)
      this._mActiveIdleTimeout= require("timer").setTimeout(function() { _self.sendActiveIdleEvents(); }, 500);
  },

  sendActiveIdleEvents: function()
  {
    //console.log('**** handling active/idle: ' + this._mLastIdleTab + ', ' + this._mLastActiveTab);
    if (this._mLastIdleTab && this._mLastActiveTab)
    {
      if (this._mLastIdleTab.window == this._mLastActiveTab.window)
      {  
        //console.log('---- issuing onPageIdle');
        var worker= ChromeScriptInjector.findWorkerForTab(this._mLastIdleTab);
        if (worker)
        {
          var plugins= ChromeScriptInjector.getPlugins(this._mInUnitTests);
          for(var i = 0, length = plugins.length; i < length ; i++)
          {
            callObj = {};
            callObj.pluginID= plugins[i].pluginID;
            callObj.eventFn = "onPageIdle" ;
            this.fireEventToTab(callObj, worker, false);
          }
        }

        //console.log('--- issuing onPageActive');
        var worker= ChromeScriptInjector.findWorkerForTab(this._mLastActiveTab);
        if (worker)
        {	  	 
          var plugins= ChromeScriptInjector.getPlugins(this._mInUnitTests);
          for(var i = 0, length = plugins.length; i < length ; i++)
          {
            callObj = {};
            callObj.pluginID= plugins[i].pluginID;
            callObj.eventFn = "onPageActive" ;
            this.fireEventToTab(callObj, worker, true /*fireOnSink*/);
          }
        }
      }
    }

    this._mLastIdleTab= this._mLastActiveTab= this._mActiveIdleTimeout= null;
  }
};

function injectScriptRegister()
{
  if (!ChromeScriptInjector.pluginsAreReady())
    require("timer").setTimeout(function() { injectScriptRegister(); }, 500);
  else
  {
    ChromeScriptInjector._mWorkers = new Array();

    var plugins = ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
    ChromeScriptInjector.injectNanoBridge();
    for(var index = 0, lindex = plugins.length; index < lindex; index++)
    {
      var pluginId= plugins[index].pluginID;
      if ( ! ChromePluginManager.isPluginInstalled(pluginId) ) continue;
      var pluginVer= (plugins[index].pluginVer ? plugins[index].pluginVer : '0');
      if (!jetpackStorage['ynano_' + pluginId + '_v' + pluginVer + '_firstLoadTime'])
      {
        jetpackStorage['ynano_' + pluginId + '_v' + pluginVer + '_firstLoadTime']= (new Date()).getTime();
        jetpackStorageMgr.save();
        var firstRunURL= plugins[index].firstRunURL;
        if (firstRunURL)
          tabs.open(firstRunURL);
      }
      if (plugins[index].injectTarget.location == 'page')
      {
        ChromeScriptInjector.injectScriptIntoPage(plugins[index], !index, false /*securePage*/);
        if (plugins[index].injectTarget.injectOnSecurePages)
          ChromeScriptInjector.injectScriptIntoPage(plugins[index], !index, true /*securePage*/);
      }
    }
    ChromeScriptInjector.setupPageAttach(false /*securePage*/);
    if (!prefService.isSet("yahoo.ynano.qamode") || (prefService.get("yahoo.ynano.qamode") == 'prod') || (prefService.get("yahoo.ynano.qamode") == 'production'))
      ChromeScriptInjector.setupPageAttach(true /*securePage*/);
  }
  
  require('observer-service').add('cookie-changed', function(subject, data)
  {
    try {
      var now= new Date().getTime();
      var cookie = subject.QueryInterface(Ci.nsICookie);
      if (cookie)
      {
        if ((cookie.name == 'Y') && (cookie.host.indexOf('.yahoo.com') != -1))
           ChromeCookieManager.getBlindYIDFromYCookie(cookie.value);
         
        var plugins = ChromeCookieManager.getPluginIDsForCookie(cookie.name, cookie.host);
        if (plugins)
        {
          for (var plugin in plugins)
          {
            if ((now - plugins[plugin].lastChange) > 5)
            {
              callObj = {};
              callObj.pluginID = plugin;
              callObj.eventFn = "onCookieChange";
              callObj.eventPv = {cookieName: cookie.name, cookieVal: cookie.value, cookieDomain: cookie.host};
              ChromeScriptInjector.fireEventToAllTabs(callObj, null, false);

              plugins[plugin].lastChange= now;
            }
          }
        }
      }
    } catch(e) {
      ChromeDebugManager.logError("Error in cookie-changed observer: " + e.message);
    }
  });
  require('observer-service').add('http-on-modify-request', function(subject, data)
  {
    try
    {
      subject.QueryInterface(Components.interfaces.nsIHttpChannel);
      
      if (subject.loadFlags & subject.LOAD_INITIAL_DOCUMENT_URI)
      {
        var notificationCallbacks= subject.notificationCallbacks ? subject.notificationCallbacks : subject.loadGroup.notificationCallbacks;
        if (subject.notificationCallbacks && ChromeScriptInjector._mWorkers)
        {         
          var navURL= subject.URI.spec;
          var domWin= notificationCallbacks.getInterface(Ci.nsIDOMWindow);
          if (domWin)
          {
            domWin.seenInitialURI= true;
			
            var bFiredEvent= false;
            var domWinID= domWin.QueryInterface(Ci.nsIInterfaceRequestor)
                                .getInterface(Ci.nsIDOMWindowUtils)
                                .currentInnerWindowID;

            var navCancelled= false;
            for (var workerOn= 0; workerOn < ChromeScriptInjector._mWorkers.length; workerOn++)
            {
              var workerCur= ChromeScriptInjector._mWorkers[workerOn];
              if (workerCur && workerCur.isSinked)
              {
                if (workerCur.tab.allowNextNavURL != navURL)
                {
                  var workerWin= null;
                  var workerWinID= null;

                  try
                  {
                    workerWin= workerCur.domWindow;
                    workerWinID= workerWin.QueryInterface(Ci.nsIInterfaceRequestor)
                                          .getInterface(Ci.nsIDOMWindowUtils)
                                          .currentInnerWindowID;
                  }
                  catch (e)
                  {
                    // ignore failure- sometimes this doesn't exist for non-top level workers
                  }

                  if (workerWin && workerWinID && (workerWinID == domWinID))
                  {        
                    ChromeResourcePreloader.cancelActivePreloads();
					
                    if (workerCur.lastBeforeNavURL != navURL)
                    {
                      var plugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
                      var pluginCount= plugins.length;
                      for (var pluginOn= 0; pluginOn < pluginCount; pluginOn++)
                      {
                        var pluginCur= plugins[pluginOn];
                        if (ChromePluginManager.isEventSupportedForPlugin(workerCur.tab, pluginCur.pluginID, "onBeforeNavigate"))
                        {						  
                          var evtObj=
                          {
                            eventFn: "onBeforeNavigate",
                            eventPv:
                            { 
                              URL: navURL,
                              requestType: subject.requestMethod 
                            },
                            pluginID: pluginCur.pluginID
                          };

                          ChromeScriptInjector.fireEventToTab(evtObj, workerCur, false);	

                          workerCur.lastBeforeNavURL= navURL;
                        }
                      }
                    }
	
                    if (workerCur.lastBeforeNavURL == navURL)
                    {
                      if (subject.requestMethod == "GET")
                      {
                        workerCur.ignoreNextNavResponse= false;
                        subject.cancel(Components.results.NS_BINDING_SUCCEEDED);
                        navCancelled= true;

                        if (!workerCur.tab.navTimeout)
                        {
                          var tabTimeout= workerCur.tab;
                          tabTimeout.navTimeout= require("timer").setTimeout(function() 
                          {
                            tabTimeout.navTimeout= null;
                            tabTimeout.url= tabTimeout.allowNextNavURL= navURL;
                          }, 1000);
                        }
                      }
                      else
                        workerCur.ignoreNextNavResponse= true;
                    }
                  }
                }
              }

              if (!navCancelled)
                ChromePerfMonitor.setPageLoadStart(workerCur.tab, (new Date()).getTime(), true /*overwrite*/);
            }
          }
  		}  		
      }
  	}
  	catch (e)
  	{
  	  ChromeDebugManager.logError("Error in http-on-modify-request observer: " + e.message);
  	}
  });

  tabs.on('activate', function(tab) 
  {
    if (!tab.isActiveNano) 
      ChromeScriptInjector.onActivate(tab);
  });

  tabs.on('deactivate', function(tab) 
  {
    if (tab.isActiveNano)
      ChromeScriptInjector.onDeactivate(tab);
  });

  tabs.on('open', function(tab)
  {     
    var prefNewTabOvr= jetpackStorage["ynano_pref_EnableNewTabOverride"];
    if (prefNewTabOvr)
      prefNewTabOvr= prefNewTabOvr.toLowerCase();

    var prefNewTabEverShown= jetpackStorage["ynano_pref_NewTabEverShown"];
    if (prefNewTabEverShown)
      prefNewTabEverShown= prefNewTabEverShown.toLowerCase();

    if ((prefNewTabOvr && ((prefNewTabOvr == 'true') || (prefNewTabOvr == '1'))) ||
        (!prefNewTabEverShown || ((prefNewTabEverShown != 'true') && (prefNewTabEverShown != '1'))))
    {	     
      if (ChromeScriptInjector._mNewTabURL && ((tab.url == "about:blank") || (tab.url == "about:newtab")))
      {
        // all new tabs start with about:blank, but if it is still about:blank in 1/2 second then redirect
        var openTime= (new Date()).getTime();
        var intOpen= require("timer").setInterval(function()
        {
          var timeCur= (new Date()).getTime();
          var tabDOMWindow= tab.contentWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
          if (((timeCur - openTime) > 500) || tabDOMWindow.seenInitialURI)
          {
            require("timer").clearInterval(intOpen);
			
            if (!tabDOMWindow.seenInitialURI && ((tab.url == "about:blank") || (tab.url == "about:newtab")))
            {
              jetpackStorage["ynano_pref_NewTabEverShown"]= "true";
              jetpackStorageMgr.save();

              tab.url= ChromeScriptInjector._mNewTabURL;
            }
          }
        }, 100);
      }
    }
  });

  AddonListener=
  {
     onDisabled: function(addOn) { this.onDisableOrUninstall(addOn); },
     onUninstall: function(addOn) { this.onDisableOrUninstall(addOn); }, // never actually see this, just a disable call when removed
  
     onEnabled: function(addOn)
     {
       if (addOn.id == jpSelf.id)
       {
         ChromeTrackingManager.clearTrackForAllPlugins("install");
         ChromeTrackingManager.clearTrackForAllPlugins("activate");
       }
     },

     onDisableOrUninstall: function(addOn)
     {
       try
       {
         if (addOn.id == jpSelf.id)
         {
           var timeCur= (new Date()).getTime();

           if (!addOn._mTimeLastInstallAction)
             addOn._mTimeLastInstallAction= 0;

           if ((timeCur - addOn._mTimeLastInstallAction) > 500) // because of multiple calls coming in
           {
             addOn._mTimeLastInstallAction= timeCur;
             ChromeTrackingManager.sendBeaconToAllPlugins("uninstall", true /*bForce*/);

             for (var storageID in jetpackStorage)
             {
               if (storageID.indexOf('ynano_') == 0)
                 jetpackStorage[storageID]= null;
             }

             jetpackStorageMgr.save();
           }
		   
           AddonManager.removeAddonListener(this);
         }
       }
       catch (e)
       {
         ChromeDebugManager.logError('onDisableOrUninstall error: ' + e.message);
       }
     }
  };

  AddonManager.addAddonListener(AddonListener);
}

exports.main = function(options, callbacks)
{
  ChromeScriptInjector.fetchFeed(false /*forceDefaultFeedURL*/, prefService.isSet("yahoo.ynano.qamode") ? prefService.get("yahoo.ynano.qamode") : null);
  injectScriptRegister();
};
