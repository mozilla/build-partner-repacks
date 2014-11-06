"use strict";
const EXPORTED_SYMBOLS = ["DataURI"];
const PERMS_FILE = parseInt("0644", 8);
const MODE_RDONLY = 1;
const Cc = Components.classes;
const Ci = Components.interfaces;
const FileInputStream = Cc["@mozilla.org/network/file-input-stream;1"];
const BinInputStream = Cc["@mozilla.org/binaryinputstream;1"];
const mimeService = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);
function getTypeFromFile(aFile) {
    try {
        return mimeService.getTypeFromFile(aFile);
    } catch (e) {
    }
    return null;
}
const DataURI = function DataURI(aHeaders, aContent) {
    if (!(this instanceof DataURI)) {
        return new DataURI(aHeaders, aContent);
    }
    this.headers = {};
    for (let key in aHeaders) {
        this.headers[key] = aHeaders[key];
    }
    this.content = Array.isArray(aContent) ? btoa(String.fromCharCode.apply(null, aContent)) : aContent;
    return this;
};
DataURI.fromFile = function DataURI_fromFile(aFile, aContentType) {
    let contentType = aContentType || getTypeFromFile(aFile) || "";
    const headers = {
        contentType: contentType,
        base64: true
    };
    const content = DataURI.encodeFile(aFile);
    const dataURI = DataURI(headers, content);
    return dataURI;
};
DataURI.prototype.headers = {
    contentType: "text/plain",
    base64: false
};
DataURI.prototype.content = "";
DataURI.prototype.toString = function DataURI_toString() {
    let headers = this.headers;
    let base64 = headers.base64;
    let content = this.content;
    if (!base64) {
        content = encodeURIComponent(content);
    }
    let uri = "data:";
    uri += headers.contentType || "";
    if (base64) {
        uri += ";base64";
    }
    uri += "," + content;
    return uri;
};
DataURI.encodeFile = function DataURI_encodeFile(aFile) {
    const fileStream = FileInputStream.createInstance(Ci.nsIFileInputStream);
    fileStream.init(aFile, MODE_RDONLY, PERMS_FILE, 0);
    const encoded = DataURI.encodeFileStream(fileStream);
    fileStream.close();
    return encoded;
};
DataURI.encodeFileStream = function DataURI_encodeFileStream(aFileStream) {
    const binStream = BinInputStream.createInstance(Ci.nsIBinaryInputStream);
    binStream.setInputStream(aFileStream);
    const encoded = DataURI.encodeBinStream(binStream);
    binStream.close();
    return encoded;
};
DataURI.encodeBinStream = function DataURI_encodeBinStream(aBinStream) {
    let bytes = aBinStream.readByteArray(aBinStream.available());
    return btoa(String.fromCharCode.apply(null, bytes));
};
