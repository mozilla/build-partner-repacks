"use strict;";
let EXPORTED_SYMBOLS = ["Nigori"];
Cu.import("resource://gre/modules/ctypes.jsm");
XPCOMUtils.defineLazyGetter(this, "CryptoUtils", function () {
    try {
        return Cu.import("resource://gre/modules/services-crypto/utils.js", {}).CryptoUtils;
    } catch (e) {
        return Cu.import("resource://services-sync/util.js", {}).Utils;
    }
});
let AES_128_CBC = 184;
let KEYSIZE_AES_128 = 16;
let NIGORI_PASSWORD_TYPE = [
    0,
    0,
    0,
    1
].map(function (ch) {
    return String.fromCharCode(ch);
}).join("");
function Nigori(pass, username, host) {
    if (!pass) {
        return this;
    }
    this.Suser = this.deriveKeyFromPassword(this.concat(username, host), "saltsalt", 1001, 16);
    this.Kuser = this.deriveKeyFromPassword(pass, this.Suser, 1002, 16);
    this.Kenc = this.deriveKeyFromPassword(pass, this.Suser, 1003, 16);
    this.Kmac = this.deriveKeyFromPassword(pass, this.Suser, 1004, 16);
    this.encryptor = Encryptor.createInstance(AES_128_CBC, KEYSIZE_AES_128);
    this.name = this.permute("nigori-key");
    return this;
}
Nigori.initByImport = function Nigori_initByImport(Kuser, Kenc, Kmac) {
    function NigoriInitByImport() {
        this.Kuser = Kuser;
        this.Kenc = Kenc;
        this.Kmac = Kmac;
        this.encryptor = Encryptor.createInstance(AES_128_CBC, KEYSIZE_AES_128);
        return this;
    }
    NigoriInitByImport.prototype = Nigori.prototype;
    return new NigoriInitByImport();
};
Nigori.prototype = {
    finalize: function Nigori_finalize() {
        this.encryptor.finalize();
        this.encryptor = null;
    },
    permute: function Nigori_permute(plaintext) {
        let text = this.concat(NIGORI_PASSWORD_TYPE, plaintext);
        let iv = this._createEmptyIV();
        let cipher = this.encryptor.encrypt(text, btoa(this.Kenc), iv);
        let hash = this._makeHMACHash(cipher);
        return btoa(cipher + hash);
    },
    encrypt: function Nigori_encrypt(plaintext) {
        let iv = btoa(CryptoUtils.generateRandomBytes(KEYSIZE_AES_128));
        let cipher = this.encryptor.encrypt(plaintext, btoa(this.Kenc), iv);
        let hash = this._makeHMACHash(cipher);
        let res = atob(iv) + cipher + hash;
        return btoa(res);
    },
    decrypt: function Nigori_decrypt(cipher) {
        const HASH_SIZE = 32;
        let bin = atob(cipher);
        let iv = bin.substring(0, KEYSIZE_AES_128);
        let cipherText = bin.substring(iv.length, bin.length - HASH_SIZE);
        let hash = bin.substring(bin.length - HASH_SIZE, bin.length);
        if (hash !== this._makeHMACHash(cipherText)) {
            throw new Error("Wrong hash");
        }
        let enc = this.encryptor.decrypt(btoa(cipherText), btoa(this.Kenc), btoa(iv));
        return enc;
    },
    deriveKeyFromPassword: function Nigori_deriveKeyFromPassword(pass, salt, iter, length) {
        return CryptoUtils.pbkdf2Generate(pass, salt, iter, length);
    },
    swap32: function Nigori_swap32(n) {
        return (n >> 24 & 255) << 0 | (n >> 16 & 255) << 8 | (n >> 8 & 255) << 16 | (n >> 0 & 255) << 24;
    },
    concat: function Nigori_concat(A, B) {
        let res = "";
        let buffer = new ArrayBuffer(4);
        let view32 = new Uint32Array(buffer);
        view32[0] = this.swap32(A.length);
        let view8 = new Uint8Array(buffer);
        for (let [
                    ,
                    ch
                ] in Iterator(view8)) {
            res += String.fromCharCode(ch);
        }
        res += A;
        buffer = new ArrayBuffer(4);
        view32 = new Uint32Array(buffer);
        view32[0] = this.swap32(B.length);
        view8 = new Uint8Array(buffer);
        for (let [
                    ,
                    ch
                ] in Iterator(view8)) {
            res += String.fromCharCode(ch);
        }
        res += B;
        return res;
    },
    _createEmptyIV: function Nigori__createEmptyIV() {
        return btoa(new Array(17).join(String.fromCharCode(0)));
    },
    _makeHMACHash: function Nigori__makeHMACHash(cipherText) {
        let key = CryptoUtils.makeHMACKey(this.Kmac);
        let hasher = CryptoUtils.makeHMACHasher(4, key);
        let arr = [cipherText.charCodeAt(i) for (i in cipherText)];
        hasher.update(arr, arr.length);
        return hasher.finish(false);
    }
};
let Encryptor = {
    init: function Encryptor_init() {
        Cc["@mozilla.org/psm;1"].getService(Ci.nsISupports);
        let path = ctypes.libraryName("nss3");
        try {
            this._nsslib = ctypes.open(path);
        } catch (e) {
            let file = Services.dirsvc.get("GreD", Ci.nsIFile);
            file.append(path);
            this._nsslib = ctypes.open(file.path);
        }
        this._typedef();
        this._declareAPI();
    },
    finalize: function Encryptor_finalize() {
        this._nss = null;
        this._types = null;
        this._nsslib = null;
    },
    createInstance: function Encryptor_createInstance(algorithm, keySize) {
        function Encryptor() {
            this.mechanism = this._nss.PK11_AlgtagToMechanism(algorithm);
            this.blockSize = this._nss.PK11_GetBlockSize(this.mechanism, null);
            this.ivLength = this._nss.PK11_GetIVLength(this.mechanism);
            this.keySize = keySize;
            this.keygenMechanism = this._nss.CKM_AES_KEY_GEN;
            this.padMechanism = this._nss.PK11_GetPadMechanism(this.mechanism);
            this._ivSECItem = null;
            this._ivSECItemContents = null;
            let signed = new ctypes.int();
            let unsigned = new ctypes.unsigned_int();
            this._commonCryptSignedOutputSize = signed;
            this._commonCryptUnsignedOutputSize = unsigned;
            this._commonCryptSignedOutputSizeAddr = signed.address();
            this._commonCryptUnsignedOutputSizeAddr = unsigned.address();
            this._encryptionSymKeyMemo = Object.create(null);
            this._decryptionSymKeyMemo = Object.create(null);
            this._sharedInputBuffer = null;
            this._sharedInputBufferInts = null;
            this._sharedInputBufferSize = 0;
            this._sharedOutputBuffer = null;
            this._sharedOutputBufferSize = 0;
            this._getInputBuffer(1024);
            this._getOutputBuffer(1024);
        }
        Encryptor.prototype = this;
        let instance = new Encryptor();
        this.initIVSECItem.call(instance);
        return instance;
    },
    initIVSECItem: function initIVSECItem() {
        if (this._ivSECItem) {
            this._ivSECItemContents = null;
            this._freeSECItem(this._ivSECItem);
        }
        let item = this._nss.SECITEM_AllocItem(null, null, this.blockSize);
        if (item.isNull()) {
            throw "SECITEM_AllocItem failed.";
        }
        let ptr = ctypes.cast(item.contents.data, ctypes.unsigned_char.array(this.blockSize).ptr);
        let contents = ctypes.cast(ptr.contents, ctypes.uint8_t.array(this.blockSize));
        this._ivSECItem = item;
        this._ivSECItemContents = contents;
    },
    encrypt: function Encryptor_encrypt(plaintext, key, iv) {
        let len = plaintext.length;
        let input = this._getInputBuffer(len);
        this._byteCompressInts(plaintext, this._sharedInputBufferInts, len);
        let outputBufferSize = len + this.blockSize;
        let outputBuffer = this._getOutputBuffer(outputBufferSize);
        outputBuffer = this._commonCrypt(input, len, outputBuffer, outputBufferSize, key, iv, this._nss.CKA_ENCRYPT);
        let data = outputBuffer.address();
        len = outputBuffer.length;
        let expanded = "";
        let intData = ctypes.cast(data, ctypes.uint8_t.array(len).ptr).contents;
        for (let i = 0; i < len; i++) {
            expanded += String.fromCharCode(intData[i]);
        }
        return expanded;
    },
    decrypt: function Encryptor_decrypt(cipher, key, iv) {
        let plaintext = "";
        if (cipher.length) {
            plaintext = atob(cipher);
        }
        let plaintextLength = plaintext.length;
        let input = this._getInputBuffer(plaintextLength);
        this._byteCompressInts(plaintext, this._sharedInputBufferInts, plaintextLength);
        let outputBuffer = this._commonCrypt(input, plaintextLength, this._getOutputBuffer(plaintextLength), plaintextLength, key, iv, this._nss.CKA_DECRYPT);
        let outputBufferLength = outputBuffer.length;
        let intData = ctypes.cast(outputBuffer.address(), ctypes.uint8_t.array(outputBufferLength).ptr).contents;
        let expanded = "";
        for (let i = 0; i < outputBufferLength; i++)
            expanded += String.fromCharCode(intData[i]);
        return expanded;
    },
    _getInputBuffer: function Encryptor__getInputBuffer(size) {
        if (size > this._sharedInputBufferSize) {
            let b = new ctypes.ArrayType(ctypes.unsigned_char, size)();
            this._sharedInputBuffer = b;
            this._sharedInputBufferInts = ctypes.cast(b, ctypes.uint8_t.array(size));
            this._sharedInputBufferSize = size;
        }
        return this._sharedInputBuffer;
    },
    _getOutputBuffer: function Encryptor__getOutputBuffer(size) {
        if (size > this._sharedOutputBufferSize) {
            let b = new ctypes.ArrayType(ctypes.unsigned_char, size)();
            this._sharedOutputBuffer = b;
            this._sharedOutputBufferSize = size;
        }
        return this._sharedOutputBuffer;
    },
    _commonCrypt: function Encryptor__commonCrypt(input, inputLength, output, outputLength, symmetricKey, iv, operation) {
        iv = atob(iv);
        if (iv.length < this.blockSize)
            throw "IV too short; must be " + this.blockSize + " bytes.";
        if (iv.length > this.blockSize) {
            iv = iv.slice(0, this.blockSize);
        }
        this._byteCompressInts(iv, this._ivSECItemContents, iv.length);
        let ctx, symKey, ivParam;
        try {
            ivParam = this._nss.PK11_ParamFromIV(this.padMechanism, this._ivSECItem);
            if (ivParam.isNull()) {
                throw Components.Exception("can't convert IV to param", Cr.NS_ERROR_FAILURE);
            }
            symKey = this._importSymKey(symmetricKey, operation);
            ctx = this._nss.PK11_CreateContextBySymKey(this.padMechanism, operation, symKey, ivParam);
            if (ctx.isNull()) {
                throw Components.Exception("couldn't create context for symkey", Cr.NS_ERROR_FAILURE);
            }
            let maxOutputSize = outputLength;
            if (this._nss.PK11_CipherOp(ctx, output, this._commonCryptSignedOutputSize.address(), maxOutputSize, input, inputLength)) {
                throw Components.Exception("cipher operation failed", Cr.NS_ERROR_FAILURE);
            }
            let actualOutputSize = this._commonCryptSignedOutputSize.value;
            let finalOutput = output.addressOfElement(actualOutputSize);
            maxOutputSize -= actualOutputSize;
            if (this._nss.PK11_DigestFinal(ctx, finalOutput, this._commonCryptUnsignedOutputSizeAddr, maxOutputSize)) {
                throw Components.Exception("cipher finalize failed", Cr.NS_ERROR_FAILURE);
            }
            actualOutputSize += this._commonCryptUnsignedOutputSize.value;
            let newOutput = ctypes.cast(output, ctypes.unsigned_char.array(actualOutputSize));
            return newOutput;
        } catch (e) {
            throw e;
        } finally {
            if (ctx && !ctx.isNull()) {
                this._nss.PK11_DestroyContext(ctx, true);
            }
            if (ivParam && !ivParam.isNull()) {
                this._nss.SECITEM_FreeItem(ivParam, true);
            }
        }
    },
    _importSymKey: function Encryptor__importSymKey(encodedKeyString, operation) {
        let memo;
        switch (operation) {
        case this._nss.CKA_ENCRYPT:
            memo = this._encryptionSymKeyMemo;
            break;
        case this._nss.CKA_DECRYPT:
            memo = this._decryptionSymKeyMemo;
            break;
        default:
            throw "Unsupported operation in importSymKey.";
        }
        if (encodedKeyString in memo) {
            return memo[encodedKeyString];
        }
        let keyItem;
        let slot;
        try {
            keyItem = this._makeSECItem(encodedKeyString, true);
            slot = this._nss.PK11_GetInternalKeySlot();
            if (slot.isNull()) {
                throw Components.Exception("can't get internal key slot", Cr.NS_ERROR_FAILURE);
            }
            let symKey = this._nss.PK11_ImportSymKey(slot, this.padMechanism, this._nss.PK11_OriginUnwrap, operation, keyItem, null);
            if (!symKey || symKey.isNull()) {
                throw Components.Exception("symkey import failed", Cr.NS_ERROR_FAILURE);
            }
            return memo[encodedKeyString] = symKey;
        } finally {
            if (slot && !slot.isNull()) {
                this._nss.PK11_FreeSlot(slot);
            }
            this._freeSECItem(keyItem);
        }
    },
    _makeSECItem: function Encryptor__makeSECItem(input, isEncoded) {
        if (isEncoded) {
            input = atob(input);
        }
        let len = input.length;
        let item = this._nss.SECITEM_AllocItem(null, null, len);
        if (item.isNull()) {
            throw "SECITEM_AllocItem failed.";
        }
        let ptr = ctypes.cast(item.contents.data, ctypes.unsigned_char.array(len).ptr);
        let dest = ctypes.cast(ptr.contents, ctypes.uint8_t.array(len));
        this._byteCompressInts(input, dest, len);
        return item;
    },
    _freeSECItem: function Encryptor__freeSECItem(zap) {
        if (zap && !zap.isNull()) {
            this._nss.SECITEM_ZfreeItem(zap, true);
        }
    },
    _byteCompressInts: function Encryptor__byteCompressInts(jsString, intArray, count) {
        let len = jsString.length;
        let end = Math.min(len, count);
        for (let i = 0; i < end; i++)
            intArray[i] = jsString.charCodeAt(i) & 255;
    },
    _typedef: function Encryptor__typedef() {
        this._types.CK_MECHANISM_TYPE = ctypes.unsigned_long;
        this._types.CK_ATTRIBUTE_TYPE = ctypes.unsigned_long;
        this._types.PRBool = ctypes.int;
        this._types.SECOidTag = ctypes.int;
        this._types.PK11Origin = ctypes.int;
        this._types.SECItemType = ctypes.int;
        this._types.SECStatus = ctypes.int;
        this._types.PK11SymKey = ctypes.void_t;
        this._types.PK11SlotInfo = ctypes.void_t;
        this._types.PLArenaPool = ctypes.void_t;
        this._types.PK11Context = ctypes.void_t;
        this._types.SECItem = ctypes.StructType("SECItem", [
            { type: this._types.SECItemType },
            { data: ctypes.unsigned_char.ptr },
            { len: ctypes.int }
        ]);
    },
    _declareAPI: function Encryptor__declareAPI() {
        this._nss.CKA_ENCRYPT = 260;
        this._nss.CKA_DECRYPT = 261;
        this._nss.CKM_AES_KEY_GEN = 4224;
        this._nss.PK11_OriginUnwrap = 4;
        this._nss.PK11_GetPadMechanism = this._nsslib.declare("PK11_GetPadMechanism", ctypes.default_abi, this._types.CK_MECHANISM_TYPE, this._types.CK_MECHANISM_TYPE);
        this._nss.PK11_AlgtagToMechanism = this._nsslib.declare("PK11_AlgtagToMechanism", ctypes.default_abi, this._types.CK_MECHANISM_TYPE, this._types.SECOidTag);
        this._nss.PK11_ImportSymKey = this._nsslib.declare("PK11_ImportSymKey", ctypes.default_abi, this._types.PK11SymKey.ptr, this._types.PK11SlotInfo.ptr, this._types.CK_MECHANISM_TYPE, this._types.PK11Origin, this._types.CK_ATTRIBUTE_TYPE, this._types.SECItem.ptr, ctypes.voidptr_t);
        this._nss.PK11_ParamFromIV = this._nsslib.declare("PK11_ParamFromIV", ctypes.default_abi, this._types.SECItem.ptr, this._types.CK_MECHANISM_TYPE, this._types.SECItem.ptr);
        this._nss.PK11_GetInternalKeySlot = this._nsslib.declare("PK11_GetInternalKeySlot", ctypes.default_abi, this._types.PK11SlotInfo.ptr);
        this._nss.PK11_FreeSlot = this._nsslib.declare("PK11_FreeSlot", ctypes.default_abi, ctypes.void_t, this._types.PK11SlotInfo.ptr);
        this._nss.SECITEM_AllocItem = this._nsslib.declare("SECITEM_AllocItem", ctypes.default_abi, this._types.SECItem.ptr, this._types.PLArenaPool.ptr, this._types.SECItem.ptr, ctypes.unsigned_int);
        this._nss.SECITEM_ZfreeItem = this._nsslib.declare("SECITEM_ZfreeItem", ctypes.default_abi, ctypes.void_t, this._types.SECItem.ptr, this._types.PRBool);
        this._nss.SECITEM_FreeItem = this._nsslib.declare("SECITEM_FreeItem", ctypes.default_abi, ctypes.void_t, this._types.SECItem.ptr, this._types.PRBool);
        this._nss.PK11_CreateContextBySymKey = this._nsslib.declare("PK11_CreateContextBySymKey", ctypes.default_abi, this._types.PK11Context.ptr, this._types.CK_MECHANISM_TYPE, this._types.CK_ATTRIBUTE_TYPE, this._types.PK11SymKey.ptr, this._types.SECItem.ptr);
        this._nss.PK11_CipherOp = this._nsslib.declare("PK11_CipherOp", ctypes.default_abi, this._types.SECStatus, this._types.PK11Context.ptr, ctypes.unsigned_char.ptr, ctypes.int.ptr, ctypes.int, ctypes.unsigned_char.ptr, ctypes.int);
        this._nss.PK11_DigestFinal = this._nsslib.declare("PK11_DigestFinal", ctypes.default_abi, this._types.SECStatus, this._types.PK11Context.ptr, ctypes.unsigned_char.ptr, ctypes.unsigned_int.ptr, ctypes.unsigned_int);
        this._nss.PK11_DestroyContext = this._nsslib.declare("PK11_DestroyContext", ctypes.default_abi, ctypes.void_t, this._types.PK11Context.ptr, this._types.PRBool);
        this._nss.PK11_GetBlockSize = this._nsslib.declare("PK11_GetBlockSize", ctypes.default_abi, ctypes.int, this._types.CK_MECHANISM_TYPE, this._types.SECItem.ptr);
        this._nss.PK11_GetIVLength = this._nsslib.declare("PK11_GetIVLength", ctypes.default_abi, ctypes.int, this._types.CK_MECHANISM_TYPE);
    },
    _nsslib: null,
    _nss: {},
    _types: {}
};
Encryptor.init();
