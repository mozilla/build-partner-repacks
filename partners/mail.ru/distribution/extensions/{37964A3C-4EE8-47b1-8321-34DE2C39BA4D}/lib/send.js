importScripts('rawdeflate.js');
importScripts('base64.js');
self.addEventListener('message', function(e) {
    var B = "\tBF:" + docEncoding(e.data.dataHtml);
    var params = e.data.U1
        + "\nT:" + e.data.T
        + "\tR:" + e.data.R
        + "\tU:" + e.data.U
        + "\tTI:" + e.data.TI
        + "\tUW:" + e.data.UW
        + "\tC:" + e.data.C
        + "\tLT:" + e.data.LT
        + B;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", e.data.url, false);//true);
    xhr.setRequestHeader('User-Agent', 'MailRuSputnik');
    //xhr.setRequestHeader('Host', 's.sputnik.mail.ru');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Content-Length', params.length);
    xhr.setRequestHeader('Expect', '100-continue');
    xhr.setRequestHeader('Connection', 'close');
    xhr.setRequestHeader(
        "Cookie",
        "mrcu="
        + e.data.mrcu
        + "; usr="
        + e.data.usr
        + "; usr2=ver="
        + e.data.ver
        + "&ref="
        + e.data.ref
        + "&sd="
        + e.data.sd
        );
    xhr.send(params);
});

function docEncoding(doc) {
    var docEnc = unescape(encodeURIComponent( doc ));
    var base64Doc = Base64.encode(docEnc);
    var docDef = RawDeflate(base64Doc);
    var arrayByte = stringToBytes2(docDef);
    arrayByte.unshift(156);
    arrayByte.unshift(120);
    var arrayDocXor = [];
    for (var i = 0; i < arrayByte.length; i++){
        arrayDocXor[i] = arrayByte[i]^0xAB;
    }
    var docBase64 = Base64.encode(arrayDocXor);
//      self.postMessage({
//          'base64Doc':base64Doc,
//          'deflateDoc':docDef,
//          'arrayByte':arrayByte,
//          'arrayByte_xor':arrayDocXor,
//          'result':docBase64
//      });  
    return docBase64;
}
//docEncoding();