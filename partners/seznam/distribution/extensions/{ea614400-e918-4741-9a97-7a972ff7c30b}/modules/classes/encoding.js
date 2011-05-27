var EXPORTED_SYMBOLS = [];
Components.utils.import("resource://foxcub/foxcubService.js");
/**
*
*  Javascript crc32
*  http://www.webtoolkit.info/
*
**/
FoxcubService.Encoding = FoxcubService.JAK.ClassMaker.makeClass({
	NAME : "FoxcubService.Encoding",
	VERSION : "0.1"
});

FoxcubService.Encoding.prototype.toUTF8 = function(txt, charset) {
	var conv = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
			.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
	conv.charset = charset;
	return conv.ConvertToUnicode(txt);

}

// BASE64
FoxcubService.Encoding.prototype._keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
//BASE64-DECODE
FoxcubService.Encoding.prototype._base64_decode = function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
 
		} 
		return output;
}
//
FoxcubService.Encoding.prototype._base64_encode = function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		while (i < input.length) {
 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
		}
 
		return output;
}

//QUOTED-PRINTABLE
//QUOTED-PRINTABLE-DECODE
FoxcubService.Encoding.prototype._qp_decode = function(str) {
    var RFC2045Decode1 = /=\r\n/gm,
    RFC2045Decode2IN = /=([0-9A-F]{2})/gim,
    RFC2045Decode2OUT = function (sMatch, sHex) {        
       return String.fromCharCode(parseInt(sHex, 16));
    };
    return str.replace(RFC2045Decode1, '').replace(RFC2045Decode2IN, RFC2045Decode2OUT);
}
//QUOTED-PRINTABLE-ENCODE
FoxcubService.Encoding.prototype._qp_encode = function(str) {
    var hexChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
    RFC2045Encode1IN = / \r\n|\r\n|[^!-<>-~ ]/gm,
    RFC2045Encode1OUT = function (sMatch) {
        if (sMatch.length > 1) {
            return sMatch.replace(' ', '=20');
        }
        var chr = sMatch.charCodeAt(0);
        return '=' + hexChars[((chr >>> 4) & 15)] + hexChars[(chr & 15)];
    },
    RFC2045Encode2IN = /.{1,72}(?!\r\n)[^=]{0,3}/g,
    RFC2045Encode2OUT = function (sMatch) {
        if (sMatch.substr(sMatch.length - 2) === '\r\n') {
            return sMatch;
        }
        return sMatch + '=\r\n';
    };
    str = str.replace(RFC2045Encode1IN, RFC2045Encode1OUT).replace(RFC2045Encode2IN, RFC2045Encode2OUT);
    return str.substr(0, str.length - 3);
}

//

FoxcubService.Encoding.prototype.CRYPT_KEY = 7;

FoxcubService.Encoding.prototype.encrypt = function(str) {
	var encrypted_str = "";

	for (c = 0; c < str.length; c++) {
		if (str.charCodeAt(c) == 32) {
			encrypted_str += " ";
			continue;
		}

		encrypted_str += String.fromCharCode((str.charCodeAt(c) ^ c));
	}
	return encrypted_str;
}

FoxcubService.Encoding.prototype.decrypt = function(str) {
	var decrypted_str = "";
	for (c = 0; c < str.length; c++) {
		if (str.charCodeAt(c) == 32) {
			decrypted_str += " ";
			continue;
		}
		decrypted_str += String.fromCharCode(c ^ str.charCodeAt(c));
	}
	return decrypted_str;
}
