/**
 * Copyright (c) 2008-2009 Glaxstar Ltd. All rights reserved.
 */

var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://glaxebay/gsCommon.js");
Cu.import("resource://glaxebay/Util/gsUtilCommon.js");

/**
 * Base64 encoder / decoder.
 */
GlaxEbay.Util.Base64Encoder = {
  /* Logger for this object. */
  _logger : null,
  /* The hidden DOM window. Holds encoding and decoding functions. */
  _hiddenWindow : null,

  /**
   * We want quick mappings back and forth, so we precompute two maps.
   */
  _init : function() {
    this._logger = GlaxEbay.getLogger("GlaxEbay.Util.Base64Encoder");
    this._logger.trace("_init");

    this._hiddenWindow =
      Cc["@mozilla.org/appshell/appShellService;1"].
        getService(Ci.nsIAppShellService).hiddenDOMWindow;
  },

  /**
   * Base64-encode a binary string.
   * @param aBinaryString a binary string to encode.
   * @return string containing the base64 encoding.
   */
  encodeString : function(aBinaryString) {
    this._logger.debug("encodeString");

    return this._hiddenWindow.btoa(aBinaryString);
  },

  /**
   * Base64-decode a string.
   * @param aString string to decode.
   * @return binary string representing the decoded value.
   * @throws Exception is the input string is invalid.
   */
  decodeString : function(aString) {
    this._logger.debug("decodeString");

    return this._hiddenWindow.atob(aString);
  },

  /**
   * Helper function that turns a string into an array of numbers.
   * @param aString String to arrify.
   * @return Array holding numbers corresponding to the UCS character codes
   * of each character in aString.
   */
  arrayifyString : function(aString) {
    this._logger.debug("arrayifyString");

    let output = new Array();

    for (let i = 0; i < aString.length; i++) {
      output.push(aString.charCodeAt(i));
    }

    return output;
  },

  /**
   * Helper function that turns an array of numbers into the string given by the
   * concatenation of the characters to which the numbers correspond (got
   * that?).
   * @param aArray Array of numbers representing characters.
   * @return Stringification of the array.
   */
  stringifyArray : function(aArray) {
    this._logger.debug("stringifyArray");

    let output = new Array();

    for (let i = 0; i < aArray.length; i++) {
      output[i] = String.fromCharCode(aArray[i]);
    }

    return output.join("");
  }
};

/**
 * Constructor.
 */
(function() {
  this._init();
}).apply(GlaxEbay.Util.Base64Encoder);
