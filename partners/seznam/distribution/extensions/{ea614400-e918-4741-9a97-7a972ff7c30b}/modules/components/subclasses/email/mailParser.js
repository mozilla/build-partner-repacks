var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");

FoxcubService.Email.MailParser = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : 'FoxcubService.Email.MailParser',
	VERSION : '0.1',
	IMPLEMENT : [FoxcubService.JAK.Components,FoxcubService.LogInterface]
});


FoxcubService.Email.MailParser.prototype.CRLF = "\r\n";

FoxcubService.Email.MailParser.prototype.$constructor = function(rawMSG){
	
	this._rawMSG = rawMSG;
	this.decodeHeaderVal = FoxcubService.JAK.bind(this,this._decodeHeaderVal);
};
/**
 *  Parser mailov
 */
FoxcubService.Email.MailParser.prototype.init = function(rawMSG){
	this._rawHeaders = null;
	this._rawBody = null;
	this.data = {
		childs : [],
		headers : null,
	    html : null,
	    plain : null
	}
};
FoxcubService.Email.MailParser.prototype.parse = function(){
	try{
		//inicializujeme premenne
		this.init();
		//rozdelime na hlavicku a telo spravy
		this._initRawHeadersAndRawBody();
		//rozparsujeme hlavicku - len pre nas dolezite casti
		this._parseHeaders();
		//rozparsujeme telo - pozor rekurzivne
		this._parseBody();
	}catch(e){
		this.log(e.toString(),"error")
		return false;
	}
	return this.data;
	
};
//iba ziskame zaujimave data z rekurzivnej struktury a trosku ich upravime vola sa az po rozparsovani mailu
FoxcubService.Email.MailParser.prototype.usefull = function(data){
	var out = {};
	out.FROM = this._getArrayVal(data,["headers","FROM","DEF"],"").replace(/.*[^a-zA-Z0-9._-]([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}).*/,"$1");
	out.SUBJECT = this._getArrayVal(data,["headers","SUBJECT","DEF"],"");
	var html =  this._usefull_search(data,"html");
	var plain =  this._usefull_search(data,"plain");
	
	if(html){
		html = html.replace(/<[^>]+>/g," ");
	}
	out.TEXT = plain ? plain : html;
	if(out.TEXT){

		out.TEXT = out.TEXT.replace(/\s+/g," ").replace(new RegExp("^[\\s\\[\\]\\-.,:></()+_=*&^%$#@!'\"$^\\\\]+", "gi"),"");
		
		if(out.TEXT.length>100){

			out.TEXT = out.TEXT.substring(0,100);
			out.TEXT = out.TEXT.substring(0,out.TEXT.lastIndexOf(" ")) + " ...";
			
		}
		
	}
	
	
	//out.TEXT = 
	return out;
};
//hladame text alebo html
FoxcubService.Email.MailParser.prototype._usefull_search = function(data,key){
	if(!data)return null;
	var val = null;
	if(data[key]){
		
		val = data[key];
	}else{
		for(var i in data.childs){
			var tmlpval = this._usefull_search(data.childs[i],key);
			if(tmlpval){
				val = tmlpval;
				break;
			}
		}		
	}
	return val;
};
//pomocna funkcia - ziska hodnotu z pola ak neexistuje vrati defaultnu
FoxcubService.Email.MailParser.prototype._getArrayVal = function(array,path,def){
	data = array;
	for(var i in path){
		if(path[i] in data){
			data = data[path[i]]
		}else{
			return def;
		}
	}
	return data;
};
//pokus o rzonaprsovanie maillu 
FoxcubService.Email.MailParser.prototype._parseBody = function(){
	if(!this._rawBody)return;
	//jedna sa mime?
	if(this._getArrayVal(this.data.headers,['CONTENT-TYPE','BOUNDARY'],false)){
		//zistime boundary(oddelovac casti v mailoch)
		var boundary = "--" + this.data.headers['CONTENT-TYPE']['BOUNDARY'];
		var boundaryEnd = boundary + "--";
		var chunks = this._rawBody.split(this.CRLF);
		var lastMSG = null;
		//hladame boudary .. ak najdeme nacetame cely a vytvoryme novu instanciu parsera ktorej predame danu cast
		for(var i in chunks){
			if(chunks[i] == boundaryEnd){
				return;
			}
			if(chunks[i] == boundary){				
				if(lastMSG){
					var msgStr = lastMSG.join(this.CRLF);
					//osobitne parsujeme podsekciu
					var part = new FoxcubService.Email.MailParser(msgStr);
					//vysledok ulozime
					this.data.childs.push(part.parse());					
				}
				lastMSG = [];
				continue;
			}
			if(lastMSG){
				lastMSG.push(chunks[i]);
			}
		}
		//pre poslednu cast 
		if(lastMSG){
				var msgStr = lastMSG.join(this.CRLF);
				var part = new FoxcubService.Email.MailParser(msgStr);
				this.data.childs.push(part.parse());					
		}
	}else{
		//ak sa jedna o jednoduchu spravu kukneme ci je content text alebo html ak ano dekodujeme a ulozime
		var content = this._getArrayVal(this.data.headers,['CONTENT-TYPE','CONTENT'],"TEXT/PLAIN").toUpperCase();
		var isPlain = (content=="TEXT/PLAIN");
		var isHTML = (content=="TEXT/HTML");
		if(isPlain || isHTML){
			
			var charset = this._getArrayVal(this.data.headers,['CONTENT-TYPE','CHARSET'],"UTF-8");
			var encoding = this._getArrayVal(this.data.headers,['CONTENT-TRANSFER-ENCODING','ENCODING'],"");
			if(isHTML){
				this.data.html = this._decode(this._rawBody,charset,encoding)
			}else{
				this.data.plain  = this._decode(this._rawBody,charset,encoding)
			}
		}
		
	}
};
//dekodovanie spravy
FoxcubService.Email.MailParser.prototype._decode = function(str,charset,encoding) {

	encoding = encoding.toUpperCase();
	charset = charset.toUpperCase();
	switch(encoding){
		case 'Q':
		case 'QUOTED-PRINTABLE':str = FoxcubService.functions.encoding._qp_decode(str);break;
		case 'B':
		case 'BASE64':str = FoxcubService.functions.encoding._base64_decode(str);break;		
	}
	str = FoxcubService.functions.encoding.toUTF8(str,charset);
	return str;
}
//rozparsovanie hlaviciek
FoxcubService.Email.MailParser.prototype._parseHeaders = function(){
	//splitneme po riadkoch
	var headers = this._rawHeaders.split(this.CRLF);
	var tmpHeaders = {};
	var lastHeaderKey = null;
	var defCounter = 0;
	//spajame az kym nenarazime na dialsiu
	for(var i in headers){
		
		var matches = headers[i].match(/^([^\:]+):(.*)/)
		if(matches){
			lastHeaderKey = matches[1].toUpperCase();
			tmpHeaders[lastHeaderKey] = matches[2]; 
		}else if(lastHeaderKey && headers[i]){
			var matches = headers[i].match(/^[ \t]+(.*)/)
			tmpHeaders[lastHeaderKey] += "\n" + matches[1]; 
		}
	}
	for(var i in tmpHeaders){
		tmpHeaders[i] = this._parseHeadersValues(i,tmpHeaders[i]);
	}
	//this.log(tmpHeaders)
	this.data.headers = tmpHeaders;
};

FoxcubService.Email.MailParser.prototype._decodeHeaderVal = function(val){
	var patt1=/=\?([\w\-]+)\?(B|Q)\?([^?]*)\?=/;
	var matches = val.match(patt1);
	return this._decode(matches[3],matches[1],matches[2])
}
//funkcia parsuje iba pre nas zaujimave hlavicky
FoxcubService.Email.MailParser.prototype._parseHeadersValues = function(key,val){
	val = val.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	
	var obj = {RAW:val};
	switch(key){
		case 'SUBJECT':
		case 'FROM':	
			var patt1=/=\?([\w\-]+)\?(B|Q)\?([^?]*)\?=/g;
			//dekodujeme
			obj.DEF = val.replace(patt1,this.decodeHeaderVal);
			 //alert(val.match(/=\?[^\s\?]\?(B|Q)\?[^\s\?]\?=/));
			 break;
		case 'RECEIVED':
			 var vals = val.split(";");
			 for(var i in vals){
			 	    var date = Date.parse(vals[i].replace(/^\s\s*/, '').replace(/\s\s*$/, ''))
			 	    if(date){
			 	    	obj.DATE = date;
			 	    }
			 }
			 break;
		case 'CONTENT-TRANSFER-ENCODING':
			 //kodovanie spravy - transportne
			 obj.ENCODING = val.replace("\"","");
			 break;			 
		case 'CONTENT-TYPE':
			 
			 var matches = val.match(/^(.+);/);
			 if(matches){
			 	obj.CONTENT = matches[1];
			 }
			 //ziskame hranicu
			 var matches = val.match(/boundary="?([^\s"]+)"?/i);
			// alert(matches)
			 if(matches){
			 	obj.BOUNDARY = matches[1];
			 }
			 //ziskame charset
			 var matches = val.match(/charset="?([^\s"]+)"?/i);
			
			 if(matches){
			 	obj.CHARSET = matches[1];
			 }
			 break;
		default:break;
	}
	return obj;
};

//rozdelenie na hlavicky a telo
FoxcubService.Email.MailParser.prototype._initRawHeadersAndRawBody = function(){
	var chunks = this._rawMSG.split(this.CRLF+this.CRLF);
	this._rawHeaders = chunks[0];
	//alert(this._rawHeaders)
	delete(chunks[0])
	if(chunks.length)this._rawBody = chunks.join(this.CRLF+this.CRLF);
	//alert(this._rawBody)
};
