/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */var GSFastPass={domain:"getsatisfaction.com",key:"r1lq7f1az3iy",secret:"gjubxhodu5lyxygqvnf6e6leen48rgex",generateURL:function(aEmail,aName,aUserId,aIsSecure,aAdditionalFields){var url=(aIsSecure?"https://":"http://")+this.domain+"/fastpass";var accessor={consumerSecret:GSFastPass.secret,tokenSecret:""};var message={action:url,method:"GET",parameters:[]};OAuth.setParameter(message,"email",aEmail);OAuth.setParameter(message,"name",aName);OAuth.setParameter(message,"uid",aUserId);OAuth.setParameter(message,"oauth_token","");OAuth.setParameter(message,"oauth_version","1.0");OAuth.setParameter(message,"oauth_consumer_key",this.key);for(var[name,value]in Iterator(aAdditionalFields)){OAuth.setParameter(message,name,value);}
OAuth.setTimestampAndNonce(message);OAuth.SignatureMethod.sign(message,accessor);url=OAuth.addToURL(url,message.parameters);return url;}}