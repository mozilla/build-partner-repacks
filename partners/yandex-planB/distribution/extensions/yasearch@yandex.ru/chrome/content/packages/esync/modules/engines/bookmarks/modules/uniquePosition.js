let EXPORTED_SYMBOLS = [
    "UniquePosition",
    "SUFFIX_LENGTH",
    "COMPRESS_BYTES_THRESHOLD"
];
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(this, "SCService", "@mozilla.org/streamConverters;1", "nsIStreamConverterService");
let SUFFIX_LENGTH = 28;
let kUint8Max = 255;
let COMPRESS_BYTES_THRESHOLD = 128;
function UniquePosition(uncompressed, suffix) {
    this.log = UniquePosition.log;
    if (!arguments.length) {
        this._isValid = false;
        return this;
    }
    if (!this._isValidStr(uncompressed)) {
        return UniquePosition.createInvalid();
    }
    if (arguments.length === 1) {
        this._compressed = this.compress(uncompressed);
        return this;
    }
    this._suffix = suffix;
    this._compressed = this.compress(uncompressed);
    return this;
}
UniquePosition.fromNumber = function (i, suffix) {
    let size = 8;
    let size32 = 4;
    let sign = i < 0 ? true : false;
    let lsw = i % Math.pow(2, 32);
    let msw = (i - lsw) / Math.pow(2, 32);
    if (sign) {
        msw = msw === 0 ? ~msw : msw - 1;
        if (~lsw === -1) {
            msw++;
        }
        lsw = lsw < 0 ? lsw : ~lsw + 1;
    }
    function toString(number) {
        let str = "";
        for (let i = size32; i > 0; i--) {
            let byte = number & 255;
            str = String.fromCharCode(byte) + str;
            number >>= 8;
        }
        return str;
    }
    let str = toString(msw ^ 2147483648);
    str += toString(lsw);
    return new UniquePosition(str + suffix, suffix);
};
UniquePosition.fromProto = function (proto) {
    if (proto.custom_compressed_v1) {
        return new UniquePosition(proto.custom_compressed_v1);
    } else if (proto.value) {
        return new UniquePosition(String.fromCharCode.apply("", proto.value));
    } else if (proto.uncompressed_length && proto.compressed_value) {
        let uncompressed = gzipUncompress(String.fromCharCode.apply("", proto.compressed_value));
        if (!uncompressed) {
            return UniquePosition.createInvalid();
        }
        return new UniquePosition(uncompressed);
    } else {
        return UniquePosition.createInvalid();
    }
};
UniquePosition.createInvalid = function UniquePosition_createInvalid() {
    return new UniquePosition();
};
UniquePosition.isValidSuffix = function UniquePosition_isValidSuffix(suffix) {
    return suffix.length === SUFFIX_LENGTH;
};
UniquePosition.Between = function UniquePosition_Between(before, after, suffix) {
    let mid = findBetweenWithSuffix(before.uncompress(), after.uncompress(), suffix);
    return new UniquePosition(mid + suffix, suffix);
};
UniquePosition.Before = function UniquePosition_Before(beforeUniquePosition, suffix) {
    let before = findSmallerWithSuffix(beforeUniquePosition.uncompress(), suffix);
    return new UniquePosition(before + suffix, suffix);
};
UniquePosition.After = function UniquePosition_After(afterUniquePosition, suffix) {
    let after = findGreaterWithSuffix(afterUniquePosition.uncompress(), suffix);
    return new UniquePosition(after + suffix, suffix);
};
UniquePosition.InitialPosition = function UniquePosition_InitialPosition(suffix) {
    return new UniquePosition(suffix, suffix);
};
UniquePosition.prototype = {
    lessThan: function UniquePosition_lessThan(other) {
        return this.compressed < other.compressed;
    },
    equals: function UniquePosition_equals(other) {
        if (!this.isValid && !other.isValid) {
            return true;
        }
        return this.compressed === other.compressed;
    },
    compress: function UniquePosition_compress(str) {
        let output = "";
        for (let i = 0, length = str.length; i < length;) {
            if (i + 4 <= str.length && this._isRepeatedCharPrefix(str, i)) {
                output += str.substr(i, 4);
                let repDigit = str[i];
                let runsUntil = null;
                for (let j = i + 4; j < length; j++) {
                    if (str[j] !== repDigit) {
                        runsUntil = j;
                        break;
                    }
                }
                let runLength = length - i;
                let encodeHigh = false;
                if (runsUntil) {
                    runLength = runsUntil - i;
                    encodeHigh = str[runsUntil].charCodeAt(0) > repDigit.charCodeAt(0);
                }
                output += this._writeEncodedRunLength(runLength, encodeHigh);
                i += runLength;
            } else {
                let len = Math.min(8, length - i);
                output += str.substr(i, len);
                i += len;
            }
        }
        return output;
    },
    uncompress: function UniquePosition_uncompress(str) {
        if (!str) {
            str = this._compressed;
        }
        let output = "";
        let i = 0;
        for (let length = str.length; i + 8 <= length; i += 8) {
            if (this._isRepeatedCharPrefix(str, i)) {
                let repDigit = str[i];
                let runLength = this._readEncodedRunLength(str, i + 4);
                for (let j = 0; j < runLength; j++) {
                    output += repDigit;
                }
            } else {
                output += str.substr(i, 8);
            }
        }
        output += str.substring(i);
        return output;
    },
    getSuffixForTest: function UniquePosition_getSuffixForTest() {
        let str = this.uncompress(this.compressed);
        let prefixLength = str.length - SUFFIX_LENGTH;
        return str.slice(0, prefixLength);
    },
    toNumber: function UniquePosition_toNumber() {
        let str = this.uncompress();
        let size = 8;
        let size32 = 4;
        function getLSW(str) {
            let y = 0;
            for (let i = 0; i < size32; i++) {
                let byte = String.charCodeAt(str, size32 - i - 1);
                y |= (byte & 255) << i * 8;
            }
            return y;
        }
        function getMSW(str) {
            let y = 0;
            for (let i = 0; i < size32; i++) {
                let byte = String.charCodeAt(str, size32 - i - 1);
                if (size32 - i === 1) {
                    byte ^= 128;
                }
                y |= (byte & 255) << i * 8;
            }
            return y;
        }
        let msw = getMSW(str.substr(0, 4));
        let lsw = getLSW(str.substr(4, 8));
        let sign = msw & 2147483648;
        let int64;
        if (sign) {
            msw = lsw === 0 ? msw - 1 : msw;
            msw = ~msw;
            if (lsw > 0) {
                lsw = Math.pow(2, 32) - lsw;
            }
            lsw = Math.abs(lsw);
            int64 = -(Math.pow(2, 32) * msw + lsw);
        } else {
            if (lsw < 0) {
                lsw = Math.pow(2, 32) + lsw;
            }
            int64 = Math.pow(2, 32) * msw + lsw;
        }
        return int64;
    },
    toString: function UniquePosition_toString() {
        let str = this.uncompress(this.compressed);
        if (!str) {
            return "INVALID[]";
        }
        let debugStr = fromStrToHex(str);
        if (!this.isValid) {
            debugStr = "INVALID[" + debugStr + "]";
        }
        let compressedStr = fromStrToHex(this.compressed);
        debugStr += ", compressed: " + compressedStr;
        return debugStr;
    },
    _isValidStr: function UniquePosition__isValidStr(str) {
        return str.length >= SUFFIX_LENGTH && str[str.length - 1] != 0;
    },
    _isRepeatedCharPrefix: function UniquePosition__isRepeatedCharPrefx(str, pos) {
        return str[pos] === str[pos + 1] && str[pos] === str[pos + 2] && str[pos] === str[pos + 3];
    },
    _writeEncodedRunLength: function UniquePosition__writeEncodedRunLength(length, highEnc) {
        let encodedLength = highEnc ? 4294967295 - length & 4294967295 : length;
        let str = "";
        str += String.fromCharCode(255 & encodedLength >> 24);
        str += String.fromCharCode(255 & encodedLength >> 16);
        str += String.fromCharCode(255 & encodedLength >> 8);
        str += String.fromCharCode(255 & encodedLength >> 0);
        return str;
    },
    _readEncodedRunLength: function UniquePosition__readEncodedRunLength(str, i) {
        let encodedLength = String.charCodeAt(str[i + 3], 0) << 0 | String.charCodeAt(str[i + 2], 0) << 8 | String.charCodeAt(str[i + 1], 0) << 16 | String.charCodeAt(str[i + 0], 0) << 24;
        if (encodedLength & 2147483648) {
            length = 4294967295 - encodedLength & 4294967295;
        } else {
            length = encodedLength;
        }
        return length;
    },
    _isValid: true,
    get compressed() this._compressed,
    get isValid() this._isValid
};
function gzipUncompress(str) {
    let stream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
    stream.setData(str, str.length);
    if (!stream.available()) {
        return null;
    }
    let gzipConverter = Cc["@mozilla.org/streamconv;1?from=gzip&to=uncompressed"].createInstance(Ci.nsIStreamConverter);
    let listener = Cc["@mozilla.org/network/stream-loader;1"].createInstance(Ci.nsIStreamLoader);
    let resp;
    listener.init({
        onStreamComplete: function (loader, ctx, status, length, result) {
            resp = String.fromCharCode.apply("", result);
        }
    });
    gzipConverter.asyncConvertData("gzip", "uncompressed", listener, null);
    listener.onStartRequest(null, null);
    listener.onDataAvailable(null, null, stream, null, stream.available());
    listener.onStopRequest(null, null, null);
    return resp;
}
function findBetweenWithSuffix(before, after, suffix) {
    let mid = "";
    if (before < suffix && suffix < after) {
        return mid;
    }
    let i = 0;
    for (; i < Math.min(before.length, after.length); i++) {
        let aDigit = before[i].charCodeAt(0);
        let bDigit = after[i].charCodeAt(0);
        if (bDigit - aDigit >= 2) {
            mid += String.fromCharCode(Math.floor(aDigit + (bDigit - aDigit) / 2));
            return mid;
        } else if (aDigit === bDigit) {
            mid += String.fromCharCode(aDigit);
            if (before.substr(i + 1) < suffix && suffix < after.substr(i + 1)) {
                return mid;
            }
        } else {
            aMid = mid;
            aMid += String.fromCharCode(aDigit);
            aMid += findGreaterWithSuffix(before.substr(i + 1), suffix);
            if (after.length > i + 1) {
                let bMid = mid;
                bMid += String.fromCharCode(bDigit);
                bMid += findSmallerWithSuffix(after.substr(i + 1), suffix);
                if (bMid.length < aMid.length) {
                    return bMid;
                }
            }
            return aMid;
        }
    }
    mid += findSmallerWithSuffix(after.substr(i), suffix);
    return mid;
}
function findGreaterWithSuffix(reference, suffix) {
    let refFFs = findFirstNotOf(reference, String.fromCharCode(kUint8Max));
    let suffixFFs = findFirstNotOf(suffix, String.fromCharCode(kUint8Max));
    if (refFFs === -1) {
        refFFs = reference.length;
    }
    if (suffixFFs === -1) {
        suffixFFs = suffix.length;
    }
    if (suffixFFs > refFFs) {
        return "";
    }
    let str = "";
    if (suffix.substr(suffixFFs) > reference.substr(refFFs)) {
        for (let i = 0, length = refFFs - suffixFFs; i < length; i++) {
            str += String.fromCharCode(kUint8Max);
        }
        return str;
    } else if (suffixFFs > 1) {
        for (let i = 0, length = refFFs - suffixFFs + 1; i < length; i++) {
            str += String.fromCharCode(kUint8Max);
        }
        return str;
    } else {
        let gtDigit = String.charCodeAt(reference, refFFs) + Math.floor((kUint8Max - String.charCodeAt(reference, refFFs) + 1) / 2);
        for (let i = 0, length = refFFs; i < length; i++) {
            str += String.fromCharCode(kUint8Max);
        }
        str += String.fromCharCode(gtDigit);
        return str;
    }
}
function findSmallerWithSuffix(reference, suffix) {
    let refZeroes = findFirstNotOf(reference, " ");
    let suffixZeroes = findFirstNotOf(suffix, " ");
    if (suffixZeroes > refZeroes) {
        return "";
    }
    let str = "";
    if (suffix.substr(suffixZeroes) < reference.substr(refZeroes)) {
        for (let i = 0, length = refZeroes - suffixZeroes; i < length; i++) {
            str += " ";
        }
        return str;
    } else if (suffixZeroes > 1) {
        for (let i = 0, length = refZeroes - suffixZeroes + 1; i < length; i++) {
            str += " ";
        }
        return str;
    } else {
        let ltDigit = Math.floor(String.charCodeAt(reference, refZeroes) / 2);
        for (let i = 0, length = refZeroes; i < length; i++) {
            str += " ";
        }
        str += String.fromCharCode(ltDigit);
        return str;
    }
}
function findFirstNotOf(seq, item) {
    for (let i = 0, length = seq.length; i < length; i++) {
        if (seq[i] !== item) {
            return i;
        }
    }
    return -1;
}
function fromStrToHex(str) {
    let hex = "0x";
    for (let i = 0, length = str.length; i < length; i++) {
        let char = String.charCodeAt(str, i).toString(16);
        if (char.length < 2) {
            char = "0" + char;
        }
        hex += char;
    }
    return hex;
}
