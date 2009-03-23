const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{D2B0138F-3A7F-4FF5-812F-8B04FBCFDEB5}");
const CLASS_NAME = "Ebay Encryption Service";
const CONTRACT_ID = "@glaxstar.org/ebaycomp/ebay-encryption-service;1";

/**
 * Ebay encryption service. It handles encryption and decryption of strings.
 * @author Jorge Villalobos Glaxstar Corp. Taken from:
 * FIRE ENCRYPTER BUILD 2.9 / 3.0
 * By Ronald van den Heetkamp
 * www.jungsonnstudios.com
 * Binary string encoding and decoding taken from:
 * Base64 encode / decode
 * http://www.webtoolkit.info/
 */
var EbayEncryptionService = {
  /* log service */
  _logService : null,
  /* pre-computed multiplicative inverse in GF(2^8). */
  _sbox :
    [ 0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b,
      0xfe, 0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0,
      0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26,
      0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
      0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2,
      0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0,
      0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed,
      0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
      0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f,
      0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5,
      0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec,
      0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
      0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14,
      0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c,
      0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d,
      0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
      0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f,
      0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e,
      0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11,
      0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
      0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f,
      0xb0, 0x54, 0xbb, 0x16 ],
  /* Round Constant used for the Key Expansion [1st col is 2^(r-1) in GF(2^8)].
     */
  _rcon :
    [ [ 0x00, 0x00, 0x00, 0x00 ], [ 0x01, 0x00, 0x00, 0x00 ],
      [ 0x02, 0x00, 0x00, 0x00 ], [ 0x04, 0x00, 0x00, 0x00 ],
      [ 0x08, 0x00, 0x00, 0x00 ], [ 0x10, 0x00, 0x00, 0x00 ],
      [ 0x20, 0x00, 0x00, 0x00 ], [ 0x40, 0x00, 0x00, 0x00 ],
      [ 0x80, 0x00, 0x00, 0x00 ], [ 0x1b, 0x00, 0x00, 0x00 ],
      [ 0x36, 0x00, 0x00, 0x00 ] ],
  /* character mapping. */
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  /**
   * Initialize the component.
   */
  init : function() {
    //dump("EbayEncryptionService.init().\n");

    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
  },

  /**
   * Encrypts a string of data using the 128 bit AES encryption algorithm.
   * @param aData the data to encrypt.
   * @param aKey the key used to encrypt the data.
   * @return the given data encrypted with the 128 bit AES algorithm, using the
   * given key.
   */
  encryptAES128 : function(aData, aKey) {
    this._logService.debug("Begin: EbayEncryptionService.encryptAES128");

    var pwBytes = new Array(16);
    var pwKeySchedule = this._keyExpansion([0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1]);
    var counterBlock = new Array(16);
    var blockCount = Math.ceil(aData.length / 16);
    var aEncryptedData = new Array(blockCount);
    var ctrTxt = "";
    var nonce;
    var key;
    var keySchedule;
    var cipherCntr;
    var blockLength;
    var ct;
    var dataByte;
    var cipherByte;

    for (var i = 0; i < 16; i++) {
      pwBytes[i] = aKey.charCodeAt(i);
    }

    key = this._cipher(pwBytes, pwBytes, pwKeySchedule);
    // initialise counter block (NIST SP800-38A §B.2).
    nonce = (new Date()).getTime();

    for (var i = 0; i < 8; i++) {
      counterBlock[i] = (nonce >>> i*8) & 0xff;
    }
    // generate key schedule - an expansion of the key into distinct Key Rounds
    // for each round.
    keySchedule = this._keyExpansion(key);

    for (var b = 0; b < blockCount; b++) {
      for (var c = 0; c < 8; c++) {
        // set counter in counter block.
        counterBlock[15 - c] = (b >>> c * 8) & 0xff;
      }
      // encrypt counter block.
      cipherCntr = this._cipher(counterBlock, key, keySchedule);
      // calculate length of final block:
      blockLength = ((b < blockCount - 1) ? 16 : (aData.length - 1) % 16 + 1);
      ct = "";
      // xor aData with ciphered counter byte-by-byte.
      for (var i = 0; i < blockLength; i++) {
        dataByte = aData.charCodeAt(b * 16 + i);
        cipherByte = dataByte ^ cipherCntr[i];

        ct += String.fromCharCode(cipherByte);
      }
      // escape troublesome characters in aEncryptedData.
      aEncryptedData[b] = this._escCtrlChars(ct);
    }

    for (var i = 0; i < 4; i++) {
      ctrTxt += String.fromCharCode(counterBlock[i]);
    }

    ctrTxt = this._escCtrlChars(ctrTxt);

    return this._encodeUTF(ctrTxt + "+" + aEncryptedData.join("+"));
  },

  /**
   * Decrypts a string of data using the 128 bit AES encryption algorithm.
   * @param aEncryptedData the data to decrypt.
   * @param aKey the key used to decrypt the data.
   * @param the decrypted data with the 128 bit AES algorithm, using the given
   * key.
   */
  decryptAES128 : function(aEncryptedData, aKey) {
    this._logService.debug("Begin: EbayEncryptionService.decryptAES128");

    var pwBytes = new Array(16);
    var counterBlock = new Array(16);
    var pwKeySchedule = this._keyExpansion([0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1]);
    var key;
    var keySchedule;
    var ctrTxt;
    var plaintext;
    var cipherCntr;
    var pt;
    var encryptedDataByte;
    var plaintextByte;

    for (var i = 0; i < 16; i++) {
      pwBytes[i] = aKey.charCodeAt(i);
    }

    key = this._cipher(pwBytes, pwBytes, pwKeySchedule);
    keySchedule = this._keyExpansion(key);
    // split aEncryptedData into array of block-length strings.
    aEncryptedData = this._decodeUTF(aEncryptedData).split('+');
    // recover nonce from 1st element of aEncryptedData.
    ctrTxt = this._unescCtrlChars(aEncryptedData[0]);

    for (var i = 0; i < 8; i++) {
      counterBlock[i] = ctrTxt.charCodeAt(i % 4);
    }

    plaintext = new Array(aEncryptedData.length - 1);

    for (var b = 1; b < aEncryptedData.length; b++) {
      for (var c = 0; c < 8; c++) {
        // set counter in counter block.
        counterBlock[15 - c] = ((b - 1) >>> c * 8) & 0xff;
      }
      // encrypt counter block.
      cipherCntr = this._cipher(counterBlock, key, keySchedule);
      aEncryptedData[b] = this._unescCtrlChars(aEncryptedData[b]);
      pt = '';

      for (var i = 0; i < aEncryptedData[b].length; i++) {
        encryptedDataByte = aEncryptedData[b].charCodeAt(i);
        plaintextByte = encryptedDataByte ^ cipherCntr[i];
        pt += String.fromCharCode(plaintextByte);
      }

      plaintext[b] = pt;
    }

    return unescape(plaintext.join(''));
  },

  /**
   * Apply the AES cypher.
   * @param aInput the input to cypher.
   * @param aKey the key used to encrypt / decrypt.
   * @param aKeySchedule the key shedule to use for the cypher.
   * @return input string with the cypher applied to it.
   */
  _cipher : function(aInput, aKey, aKeySchedule) {
    this._logService.trace("Begin: EbayEncryptionService._cipher");

    var Nk = aKey.length / 4; // key length (in words).
    var Nr = Nk + 6; // no of rounds.
    var Nb = 4; // block size: no of columns in state (fixed at 4 for AES).
    var state = [[],[],[],[]];
    var output;

    // initialise 4xNb byte-array 'state' with input.
    for (var i = 0; i < 4 * Nb; i++) {
      state[i % 4][Math.floor(i / 4)] = aInput[i];
    }

    state = this._addRoundKey(state, aKeySchedule, 0, Nb);

    for (var round = 1; round < Nr; round++) {
      state = this._subBytes(state, Nb);
      state = this._shiftRows(state, Nb);
      state = this._mixColumns(state, Nb);
      state = this._addRoundKey(state, aKeySchedule, round, Nb);
    }

    state = this._subBytes(state, Nb);
    state = this._shiftRows(state, Nb);
    state = this._addRoundKey(state, aKeySchedule, Nr, Nb);
    output = new Array(4*Nb); // convert to 1-d array before returning

    for (var i = 0; i< 4 * Nb; i++) {
      output[i] = state[i % 4][Math.floor(i / 4)];
    }

    return output;
  },

  /**
   * Apply sbox to state S [§5.1.1].
   * @param aState the state to transform.
   * @param aColumnCount the number of columns in the state.
   * @return the transformed state.
   */
  _subBytes : function(aState, aColumnCount) {
    this._logService.trace("Begin: EbayEncryptionService._subBytes");

    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < aColumnCount; c++) {
        aState[r][c] = this._sbox[aState[r][c]];
      }
    }

    return aState;
  },

  /**
   * Shift row r of state S left by r bytes [§5.1.2].
   * @param aState the state to transform.
   * @param aColumnCount the number of columns in the state.
   * @return the transformed state.
   */
  _shiftRows : function(aState, aColumnCount) {
    this._logService.trace("Begin: EbayEncryptionService._shiftRows");

    var t = new Array(4);
    // note that this will work for Nb=4,5,6, but not 7,8: see
    // fp.gladman.plus.com/cryptography_technology/rijndael/aes.spec.311.pdf
    for (var r = 1; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        t[c] = aState[r][(c + r) % aColumnCount]; // shift into temp copy.
      }

      for (var c = 0; c < 4; c++) {
        aState[r][c] = t[c]; // and copy back.
      }
    }

    return aState;
  },

  /**
   * Combine bytes of each col of state S [§5.1.3].
   * @param aState the state to transform.
   * @param aColumnCount the number of columns in the state.
   * @return the transformed state.
   */
  _mixColumns : function(aState, aColumnCount) {
    this._logService.trace("Begin: EbayEncryptionService._mixColumns");

    var a;
    var b;

    for (var c = 0; c < 4; c++) {
      a = new Array(4);  // 'a' is a copy of the current column from 's'.
      b = new Array(4);  // 'b' is a{02} in GF(2^8).

      for (var i = 0; i < 4; i++) {
        a[i] = aState[i][c];
        b[i] =
          ((aState[i][c] & 0x80) ? (aState[i][c] << 1 ^ 0x011b) :
           (aState[i][c] << 1));
      }

      // a[n] ^ b[n] is a{03} in GF(2^8).
      aState[0][c] = b[0] ^ a[1] ^ b[1] ^ a[2] ^ a[3]; // 2*a0 + 3*a1 + a2 + a3
      aState[1][c] = a[0] ^ b[1] ^ a[2] ^ b[2] ^ a[3]; // a0 * 2*a1 + 3*a2 + a3
      aState[2][c] = a[0] ^ a[1] ^ b[2] ^ a[3] ^ b[3]; // a0 + a1 + 2*a2 + 3*a3
      aState[3][c] = a[0] ^ b[0] ^ a[1] ^ a[2] ^ b[3]; // 3*a0 + a1 + a2 + 2*a3
    }

    return aState;
  },

  /**
   * xor Round Key into state S [§5.1.4].
   * @param aState the state to transform.
   * @param aKeySchedule the key shedule to use for the cypher.
   * @param aRound the round number.
   * @param aColumnCount the number of columns in the state.
   * @return the transformed state.
   */
  _addRoundKey : function(aState, aKeySchedule, aRound, aColumnCount) {
    this._logService.trace("Begin: EbayEncryptionService._addRoundKey");

    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < aColumnCount; c++) {
        aState[r][c] ^= aKeySchedule[aRound * 4 + c][r];
      }
    }

    return aState;
  },

  /**
   * Generate Key Schedule (byte-array Nr+1 x Nb) from Key [§5.2].
   * @param aKey the key used to generate the schedule.
   * @return the key schedule generated with the key.
   */
  _keyExpansion : function(aKey) {
    this._logService.trace("Begin: EbayEncryptionService._keyExpansion");

    var Nk = aKey.length / 4; // key length (in words).
    var Nr = Nk + 6; // no of rounds.
    var Nb = 4; // block size: no of columns in state (fixed at 4 for AES).
    var w = new Array(Nb * (Nr + 1));
    var temp = new Array(4);
    var r;

    for (var i = 0; i < Nk; i++) {
      r = [aKey[4 * i], aKey[4 * i + 1], aKey[4 * i + 2], aKey[4 * i + 3]];
      w[i] = r;
    }

    for (var i = Nk; i < (Nb * (Nr + 1)); i++) {
      w[i] = new Array(4);

      for (var t = 0; t < 4; t++) {
        temp[t] = w[i - 1][t];
      }

      if (i % Nk == 0) {
        temp = this._subWord(this._rotWord(temp));

        for (var t = 0; t < 4; t++) {
          temp[t] ^= this._rcon[i / Nk][t];
        }
      } else if (Nk > 6 && i % Nk == 4) {
        temp = this._subWord(temp);
      }

      for (var t = 0; t < 4; t++) {
        w[i][t] = w[i-Nk][t] ^ temp[t];
      }
    }

    return w;
  },

  /**
   * Apply sbox to 4-byte word w.
   * @param aWord the word to transform.
   * @return the transformed word.
   */
  _subWord : function(aWord) {
    this._logService.trace("Begin: EbayEncryptionService._subWord");

    for (var i = 0; i < 4; i++) {
      aWord[i] = this._sbox[aWord[i]];
    }

    return aWord;
  },

  /**
   * Rotate 4-byte word w left by one byte.
   * @param aWord the word to transform.
   * @return the transformed word.
   */
  _rotWord : function(aWord) {
    this._logService.trace("Begin: EbayEncryptionService._rotWord");
    aWord[4] = aWord[0];

    for (var i = 0; i < 4; i++) {
      aWord[i] = aWord[i + 1];
    }

    return aWord;
  },

  /**
   * Escape control chars which might cause problems handling ciphertext.
   * @param aString the string to escape.
   * @return the escaped string.
   */
  _escCtrlChars : function(aString) {
    this._logService.trace("Begin: EbayEncryptionService._escCtrlChars");
    // \xa0 to cater for bug in Firefox; include '+' to leave it free for use as
    // a block marker.
    var escaped =
      aString.replace(
        /[\0\v\f\xa0+!]/g,
        function(c) { return ('!' + c.charCodeAt(0) + '!'); });

    return escaped;
  },

  /**
   * Encode a base 64 binary string into a UTF8 string.
   * @param aInput the string in base 64 to encode to UTF8.
   * @return the encoded string, in UTF8.
   */
  _encodeUTF : function (aInput) {
    this._logService.trace("Begin: EbayEncryptionService._encodeUTF");

    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    aInput = this._utf8Encode(aInput);

    while (i < aInput.length) {
      chr1 = aInput.charCodeAt(i++);
      chr2 = aInput.charCodeAt(i++);
      chr3 = aInput.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output =
        output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
    }

    return output;
  },

  /**
   * Decode aUTF8 string into a base 64 binary string.
   * @param aInput the string in UTF8 to decode to base 64.
   * @return the decoded string, in base 64 binary format.
   */
  _decodeUTF : function (aInput) {
    this._logService.trace("Begin: EbayEncryptionService._decodeUTF");

    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    aInput = aInput.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < aInput.length) {
      enc1 = this._keyStr.indexOf(aInput.charAt(i++));
      enc2 = this._keyStr.indexOf(aInput.charAt(i++));
      enc3 = this._keyStr.indexOf(aInput.charAt(i++));
      enc4 = this._keyStr.indexOf(aInput.charAt(i++));
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

    output = this._utf8Decode(output);

    return output;
  },

  /**
   * Encode a base 64 binary string into a UTF8 string.
   * @param aInput the string in base 64 to encode to UTF8.
   * @return the encoded string, in UTF8.
   */
  _utf8Encode : function (aInput) {
    this._logService.trace("Begin: EbayEncryptionService._utf8Encode");

    var utftext = "";
    var c;

    aInput = aInput.replace(/\r\n/g,"\n");

    for (var n = 0; n < aInput.length; n++) {
      c = aInput.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  },

  /**
   * Decode aUTF8 string into a base 64 binary string.
   * @param aInput the string in UTF8 to decode to base 64.
   * @return the decoded string, in base 64 binary format.
   */
  _utf8Decode : function (aInput) {
    this._logService.trace("Begin: EbayEncryptionService._utf8Decode");

    var string = "";
    var i = 0;
    var c = 0;
    var c1 = 0;
    var c2 = 0;

    while (i < aInput.length) {
      c = aInput.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if ((c > 191) && (c < 224)) {
        c2 = aInput.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = aInput.charCodeAt(i+1);
        c3 = aInput.charCodeAt(i+2);
        string +=
          String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
    }

    return string;
  },

  /**
   * Unescape potentially problematic control characters.
   * @param aString the string to unescape.
   * @return the unescaped string.
   */
  _unescCtrlChars : function(aString) {
    var unescaped =
      aString.replace(
        /!\d\d?\d?!/g,
        function(c) { return String.fromCharCode(c.slice(1, -1)); });

    return unescaped;
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIEbayEncryptionService) &&
        !aIID.equals(CI.nsISupports)) {
      throw CR.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
};

/**
 * The nsIFactory interface allows for the creation of nsISupports derived
 * classes without specifying a concrete class type.
 * More: http://developer.mozilla.org/en/docs/nsIFactory
 */
var EbayEncryptionServiceFactory = {
  /* single instance of the component. */
  _singletonObj: null,

  /**
   * Creates an instance of the class associated with this factory.
   * @param aOuter pointer to a component that wishes to be aggregated in the
   * resulting instance. This can be nsnull if no aggregation is requested.
   * @param aIID the interface type to be returned.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NO_AGGREGATION if aOuter is not null. This component
   * doesn't support aggregation.
   */
  createInstance: function(aOuter, aIID) {
    if (aOuter != null) {
      throw CR.NS_ERROR_NO_AGGREGATION;
    }
    // in this case we need a unique instance of the service.
    if (!this._singletonObj) {
      this._singletonObj = EbayEncryptionService;
      EbayEncryptionService.init();
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var EbayEncryptionServiceModule = {
  /**
   * When the nsIModule is discovered, this method will be called so that any
   * setup registration can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   * @param aType loader type being used to load this module.
   */
  registerSelf : function(aCompMgr, aLocation, aLoaderStr, aType) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
      CLASS_ID, CLASS_NAME, CONTRACT_ID, aLocation, aLoaderStr, aType);
  },

  /**
   * When the nsIModule is being unregistered, this method will be called so
   * that any cleanup can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   */
  unregisterSelf : function (aCompMgr, aLocation, aLoaderStr) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
  },

  /**
   * This method returns a class object for a given ClassID and IID.
   * @param aCompMgr the global component manager.
   * @param aClass the ClassID of the object instance requested.
   * @param aIID the IID of the object instance requested.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NOT_IMPLEMENTED if aIID is inadequate.
   * @throws NS_ERROR_NO_INTERFACE if the interface is not found.
   */
  getClassObject : function(aCompMgr, aClass, aIID) {
    if (!aIID.equals(CI.nsIFactory)) {
      throw CR.NS_ERROR_NOT_IMPLEMENTED;
    }

    if (aClass.equals(CLASS_ID)) {
      return EbayEncryptionServiceFactory;
    }

    throw CR.NS_ERROR_NO_INTERFACE;
  },

  /**
   * This method may be queried to determine whether or not the component
   * module can be unloaded by XPCOM.
   * @param aCompMgr the global component manager.
   * @return true if the module can be unloaded by XPCOM. false otherwise.
   */
  canUnload: function(aCompMgr) {
    return true;
  }
};

/**
 * Initial entry point.
 * @param aCompMgr the global component manager.
 * @param aFileSpec component file.
 * @return the module for the service.
 */
function NSGetModule(aCompMgr, aFileSpec) {
  return EbayEncryptionServiceModule;
}
