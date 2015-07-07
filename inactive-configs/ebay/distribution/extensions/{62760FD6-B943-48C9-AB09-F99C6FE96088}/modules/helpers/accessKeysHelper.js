/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const EXPORTED_SYMBOLS=["AccessKeysHelper"];const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;const _ENCRYPTION_KEY="e5033e64d96b2e0694cc2af10acd6c91";var AccessKeysHelper={_init:function(){try{Cu.import("resource://ebaycompanion/helpers/logger.js");Cu.import("resource://ebaycompanion/helpers/encryptionHelper.js");}
catch(e){Logger.exception(e);}},_uninit:function(){},getKeySet:function(aUseSandbox,aSiteId){let keyset={};let appName,devName,certName;if(!aUseSandbox){switch(aSiteId){case 0:{appName="sIk/TPj4+PiDyShY6O6ID57zE69PnS7XIscptervslJaZGgJ6LLJqBt77Dg=";devName="sIk/TA0NDQ3T0fyxw/GcyvuAta4jAPmEwiBkDn5of3TZozknD1o=";certName="sIk/TBERERGRT26lcjKsjJhZXtmB+D5BN4xVhywATpSkq/xmt+aTDmiHDgM=";keyset.appName=AesCtr.decrypt(appName,_ENCRYPTION_KEY,256);keyset.devName=AesCtr.decrypt(devName,_ENCRYPTION_KEY,256);keyset.certName=AesCtr.decrypt(certName,_ENCRYPTION_KEY,256);break;}
default:{appName="sIk/TBQUFBRYHHD9Ny9Po4MfmLbopXk5BeTmi8L2MvuMTQbQIHY=";devName="sIk/TBYWFhbFDjE6IyC0ioaBPpg3T8hvok3xn0Ppn0yfIdSJEo0=";certName="sIk/TBgYGBiR3Vz1uq6MQonHSxB+/zseUnpukzTzYRz1LSafwys=";keyset.appName=AesCtr.decrypt(appName,_ENCRYPTION_KEY,256);keyset.devName=AesCtr.decrypt(devName,_ENCRYPTION_KEY,256);keyset.certName=AesCtr.decrypt(certName,_ENCRYPTION_KEY,256);break;}}}else{switch(aSiteId){case 0:{appName="sIk/TBwcHByNHfsU5Vv3BtNMuAa+7ITCWwwtGDGqgFHe+q/0NGk=";devName="sIk/TB4eHh4Vi5tvOgTMhbsoYrwYt716A4KZUO9I0uYGz5zvzmo=";certName="sIk/TB8fHx/15oHGKlHHnMKUBvDgDPBoCgFShpQfo8vqPvvklLA=";keyset.appName=AesCtr.decrypt(appName,_ENCRYPTION_KEY,256);keyset.devName=AesCtr.decrypt(devName,_ENCRYPTION_KEY,256);keyset.certName=AesCtr.decrypt(certName,_ENCRYPTION_KEY,256);break;}
default:{appName="sIk/TCEhISH9W4m9iL9FhqyFQUQf6EOqe7E3yLwvEMANDFf72Mg=";devName="sIk/TCMjIyN1+S1ZZiuCawsMd2H0z10HtsuRH2pkFSXUzHpsfFE=";certName="sIk/TCQkJCQulubUHG60R1HWUSmuHb9UQvJW1NOvfRJrk9yOUMM=";keyset.appName=AesCtr.decrypt(appName,_ENCRYPTION_KEY,256);keyset.devName=AesCtr.decrypt(devName,_ENCRYPTION_KEY,256);keyset.certName=AesCtr.decrypt(certName,_ENCRYPTION_KEY,256);break;}}}
return keyset;}};AccessKeysHelper._init();