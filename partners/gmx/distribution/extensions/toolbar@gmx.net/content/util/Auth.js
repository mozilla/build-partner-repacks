/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 * Not any newer versions of these licenses
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Thunderbird source code
 *
 * The Initial Developer of the Original Code is
 *  Ben Bucksch <ben.bucksch beonex.com>
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * AUTH methods implementation
 * This part implements the authentication mechanisms
 * - AUTH PLAIN
 * - AUTH CRAM-MD5
 * in a generic way.
 *
 * @author Ben Bucksch <ben.bucksch beonex.com>
 */

const EXPORTED_SYMBOLS = [ "AuthPLAIN", "AuthLOGIN",
    "AuthCRAMMD5", "AuthDIGESTMD5", "sha1",
    "atob", "btoa", ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");

//<copied from="thunderbird-source/mailnews/test/fakeserver/auth.js" license="MPL 1.1">

/**
 * Implements AUTH PLAIN
 * @see RFC 4616
 */
var AuthPLAIN = {
  /**
   * Takes full PLAIN auth line, and decodes it.
   *
   * @param line {String}
   * @returns {Object { username : value, password : value } }
   * @throws {String}   error to return to client
   */
  decodeLine: function(line) {
    dump("AUTH PLAIN line -" + line + "-\n");
    line = atob(line); // base64 decode
    aap = line.split("\u0000"); // 0-charater is delimiter
    if (aap.length != 3)
      throw "Expected three parts";
    /* aap is: authorize-id, authenticate-id, password.
       Generally, authorize-id = authenticate-id = username.
       authorize-id may thus be empty and then defaults to authenticate-id. */
    var result = {};
    var authzid = aap[0];
    result.username = aap[1];
    result.password = aap[2];
    dump("authorize-id: -" + authzid + "-, username: -" + result.username + "-, password: -" + result.password + "-\n");
    if (authzid && authzid != result.username)
      throw "Expecting a authorize-id that's either the same as authenticate-id or empty";
    return result;
  },

  /**
   * Create an AUTH PLAIN line, to allow a client to authenticate to a server.
   * Useful for tests.
   */
  encodeLine : function(username, password)
  {
    return btoa("\u0000" + username + "\u0000" + password); // base64 encode
  },
};

var AuthLOGIN = {
  /**
   * Takes full LOGIN auth line, and decodes it.
   * It may contain either username or password,
   * depending on state/step (first username, then pw).
   *
   * @param line {String}
   * @returns {String}   username or password
   * @throws {String}   error to return to client
   */
  decodeLine: function (line) {
    dump("AUTH LOGIN -" + atob(line) + "-\n");
    return atob(line); // base64 decode
  },
};

/**
  * Implements AUTH CRAM-MD5
  * @see RFC 2195, RFC 2104
  */
var AuthCRAMMD5 = {
  /**
   * First part of CRAM exchange is that the server sends
   * a challenge to the client. The client response depends on
   * the challenge. (This prevents replay attacks, I think.)
   * This function generates the challenge.
   *
   * TODO it doesn't create a secure challenge
   *
   * You need to store it, you'll need it to check the client response.
   *
   * @param domain {String}   Your hostname or domain,
   *    e.g. "example.com", "mx.example.com" or just "localhost".
   * @returns {String}   The challenge.
   *   It's already base64-encoded. Send it as-is to the client.
   */
  createChallenge : function(domain)
  {
    var timestamp = new Date().getTime(); // unixtime
    var random = Math.round(Math.random() * 10000000000); // TODO not really random
    var challenge = "<" + timestamp + "." + random + "@" + domain + ">";
    dump("CRAM challenge unencoded: " + challenge + "\n");
    return btoa(challenge);
  },
  /**
   * Takes full CRAM-MD5 auth line, and decodes it.
   *
   * Compare the returned |digest| to the result of
   * encodeCRAMMD5(). If they match, the |username|
   * returned here is authenticated.
   *
   * @param line {String}
   * @returns {Object { username : value, digest : value } }
   * @throws {String}   error to return to client
   */
  decodeLine : function(line)
  {
    dump("AUTH CRAM-MD5 line -" + line + "-\n");
    line = atob(line);
    dump("base64 decoded -" + line + "-\n");
    sp = line.split(" ");
    if (sp.length != 2)
      throw "Expected one space";
    var result = {};
    result.username = sp[0];
    result.digest = sp[1];
    return result;
  },
  /**
   * Constructs the auth line to send to the server, to authenticate.
   * You send this after you received the challenge string from the server.
   *
   * @param username {String}
   * @param password {String}
   * @param challenge {String}
   * @returns {String}   what you send to the server
   */
  encodeLine : function(username, password, challenge)
  {
    return btoa(username + " " + this.encodeCRAMMD5(challenge, password));
  },
  /**
   * @param text {String}   server challenge (base64-encoded)
   * @param key {String}   user's password
   * @return {String}   digest as hex string
   */
  encodeCRAMMD5 : function(text, key)
  {
    text = atob(text); // createChallenge() returns it already encoded
    dump("encodeCRAMMD5(text: -" + text + "-, key: -" + key + "-)\n");
    const kInputLen = 64;
    //const kHashLen = 16;
    const kInnerPad = 0x36; // per spec
    const kOuterPad = 0x5C;

    key = this.textToNumberArray(key);
    text = this.textToNumberArray(text);
    // Make sure key is exactly kDigestLen bytes long. Algo per spec.
    if (key.length > kInputLen)
      key = this.md5(key); // (results in kHashLen)
    while (key.length < kInputLen)
      key.push(0); // fill up with zeros

    // MD5((key XOR outerpad) + MD5((key XOR innerpad) + text)) , per spec
    var digest = this.md5(this.xor(key, kOuterPad)
         .concat(this.md5(this.xor(key, kInnerPad)
         .concat(text))));
    return this.arrayToHexString(digest);
  },
  // Utils
  /**
   * @param binary {Array of Integer}
   * @returns {Array of Integer, length of input}
   */
  xor : function(binary, value)
  {
    var result = [];
    for (var i = 0; i < binary.length; i++)
      result.push(binary[i] ^ value);
    return result;
  },
  /**
   * @param binary {Array of Integer}   octets
   * @returns {String, length 16 chars}  16 octets, one per character
   */
  md5raw : function(binary)
  {
    var md5 = Cc["@mozilla.org/security/hash;1"]
        .createInstance(Ci.nsICryptoHash);
    md5.init(Ci.nsICryptoHash.MD5);
    md5.update(binary, binary.length);
    return md5.finish(false);
  },
  /**
   * @param binary {Array of Integer}   octets @see md5raw()
   * @returns {Array of Integer, length 16 elements}  16 octets
   */
  md5 : function(binary)
  {
    return this.textToNumberArray(this.md5raw(binary));
  },
  /**
   * @param binary {Array of Integer}   octets @see md5raw()
   * @returns {String}  @see arrayToHexString
   */
  md5hex : function(binary)
  {
    return this.arrayToHexString(this.md5(binary));
  },
  /**
   * @param text {String} some normal text
   * @returns {Array of Integer} charcodes of |text|
   *     Each input char will be one array element,
   *     the charcode of the character.
   */
  textToNumberArray : function(text)
  {
    var array = [];
    for (var i = 0; i < text.length; i++)
      array.push(text.charCodeAt(i) & 0xFF); // convert string (only lower byte) to array
    return array;
  },
  /**
   * @param binary {Array of Integer} e.g. output of this.md5()
   * @returns String with represents each input number has 2-digit hex number,
   *     concatinated as string
   */
  arrayToHexString : function(binary)
  {
    var result = "";
    for (var i = 0; i < binary.length; i++)
    {
      if (binary[i] > 255)
        throw "unexpected that value > 255";
      let hex = binary[i].toString(16);
      if (hex.length < 2)
        hex = "0" + hex;
      result += hex;
    }
    return result;
  },
  /**
   * @param binary {Array of Integer} e.g. output of this.md5()
   * @returns a text string, created by using each Integer as charcode
   */
  /*
  arrayToString : function(binary)
  {
    var result = "";
    for (var i = 0; i < binary.length; i++)
    {
      if (binary[i] > 255)
        throw "unexpected that value > 255";
      result += String.fromCharCode(binary[i]);
    }
    return result;
  },
  */
};
//</copied>

/**
  * Implements AUTH DIGEST-MD5
  * @see RFC 2831
  * NOT WORKING yet
  */
var AuthDIGESTMD5 = {
  __proto__ : AuthCRAMMD5,

  /**
   * @param challenge {String}   server challenge (base64-encoded)
   * @param username {String}
   * @param password {String}
   * @param servername {String} the Jabber name of the server
   * @param hostname {String} the hostname of the server
   * @returns {String}   digest as hex string
   */
  encodeDIGESTMD5 : function(challenge, username, password,
                             servername, hostname)
  {
    var params = this.splitParams(atob(challenge));
    assert(params.algorithm == "md5-sess");
    assert(params.charset == "utf-8", "Auth DIGEST: Need UTF-8");
    assert(params.nonce);

    var digestURI = '"xmpp/' + servername + '"'; // per RFC 3920 example
    //var digestURI = '"xmpp/' + hostname + '/' + servername + '"'; // per RFC 2831
    var cnonce = this.createChallenge(servername);

    // This is not working yet. I didn't quite understand what they mean with
    // H("str") (not HEX(H()), i.e. MD5 of a string
    debug("A1");
    // A1 = { H( { username-value, ":", realm-value, ":", passwd } ),
    //     ":", nonce-value, ":", cnonce-value }
    var A1 = this.textToNumberArray(this.md5raw(
        this.textToNumberArray(username + ":" + servername + ":" + password))).concat(
        this.textToNumberArray(":" + params.nonce + ":" + cnonce));
    var A2 = this.textToNumberArray("AUTHENTICATE:" + digestURI);
    debug("resp");
    // MD5HEX({ MD5HEX(A1), ":", nonce-value, ":" nc-value, ":", cnonce-value,
    //     ":", qop-value, ":", MD5HEX(A2) })
    var resp = this.md5hex(this.textToNumberArray(
        this.md5hex(A1) + ":" + params.nonce + ":00000001:" +
        cnonce + ":auth:" + this.md5hex(A2)));

    var response = {};
    response.username = '"' + username + '"';
    response.nonce = '"' + params.nonce + '"';
    response.nc = "00000001";
    response.cnonce = '"' + cnonce + '"';
    response.qop = "auth";
    response.charset = "utf-8";
    response.response = resp;
    response["digest-uri"] = digestURI;
    debugObject(response, "response");
    return btoa(this.joinParams(response));
  },
  /**
   * Splits 'foo=dfgdfg,bar="dfghdfg",baz=dgfhfdgh'
   * into { foo : "dfgdfg", bar : "dfghdfg", baz = "dgfhfdgh" }
   * @throws MalformedException
   */
  splitParams : function(text)
  {
    var result = {};
    for each (let nvText in text.split(","))
    {
      let nv = nvText.split("=", 2);
      let name = sanitize.alphanumdash(nv[0]);
      let value = sanitize.label(nv[1]);
      if (value[0] == '"' && value.substr(-1, 1) == '"')
        value = value.substr(1, value.length - 2); // remove surrounding ""
      dump("  " + name + "=" + value + "\n");
      result[name] = value;
    }
    return result;
  },
  /**
   * @param obj {Object} e.g. { foo : "dfgdfg", bar : "dfghdfg", baz = "dgfhfdgh" }
   * @returns e.g. 'foo=dfgdfg,bar="dfghdfg",baz=dgfhfdgh'
   */
  joinParams : function(obj)
  {
    var array = [];
    for (let name in obj)
      array.push(name + "=" + obj[name]);
    return array.join(",");
  },
  textToNumberArray : function(text)
  {
    return this.textToDirectNumberArray(text);
  },
  // only for debug output
  textToACSIINumberArray : function(text)
  {
    debug("input string: " + text);
    var array = this.__proto__.textToNumberArray.call(this, text);
    var output = "";
    for each (let e in array)
      output += " " + e;
    debug("ascii output string: " + output);
    return array;
  },
  textToDirectNumberArray : function(text)
  {
    debug("input string: " + text);
    var array = [];
    for (var i = 0; i < text.length; i++)
      array.push(text.charCodeAt(i));
    var output = "";
    for each (let e in array)
      output += " " + e;
    debug("direct output string: " + output);
    return array;
  },
};


// <copied from="mailnews/test/resources/mailTestUtils.js">
/**
 * atob() = base64 decode
 * Converts a base64-encoded string to a string with the octet data.
 * @see RFC 4648
 *
 * The extra parameters are optional arguments that are used to override the
 * official base64 characters for values 62 and 63. If not specified, they
 * default to '+' and '/'.
 *
 * No unicode translation is performed during the conversion.
 *
 * @param str    A string argument representing the encoded data
 * @param c62    The (optional) character for the value 62
 * @param c63    The (optional) character for the value 63
 * @return       An string with the data
 */
function atob(str, c62, c63) {
  var result = [];
  var bits = [];
  c62 = c62 ? c62.charCodeAt(0) : 43;
  c63 = c63 ? c63.charCodeAt(0) : 47;
  for (var i=0;i<str.length;i++) {
    let c = str.charCodeAt(i);
    let val = 0;
    if (65 <= c && c <= 90) // A-Z
      val = c-65;
    else if (97 <= c && c <= 122) // a-z
      val = c-97+26;
    else if (48 <= c && c <= 57) // 0-9
      val = c-48+52;
    else if (c == c62)
      val = 62;
    else if (c == c63)
      val = 63;
    else if (c == 61) {
      for (var q=i+1;q<str.length;q++)
        if (str[q] != '=')
          throw "Character after =: "+str[q];
      break;
    } else
      throw "Illegal character in input: "+c;
    bits.push((val >> 5) & 1);
    bits.push((val >> 4) & 1);
    bits.push((val >> 3) & 1);
    bits.push((val >> 2) & 1);
    bits.push((val >> 1) & 1);
    bits.push((val >> 0) & 1);
    if (bits.length >= 8)
      result.push(bits.splice(0, 8).reduce(function (form, bit) {
        return (form << 1) | bit;
      }, 0));
  }
  return result.reduce(function (str, c) { return str + String.fromCharCode(c); }, "");
}

/**
 * btoa() = base64 encode
 * Converts a string or array of octets to a base64-encoded string.
 * @see RFC 4648
 *
 * The extra parameters are optional arguments that are used to override the
 * official base64 characters for values 62 and 63. If not specified, they
 * default to '+' and '/'.
 *
 * Data is treated as if it were modulo 256.
 *
 * @param str    A string or array with the data to be encoded
 * @param c62    The (optional) character for the value 62
 * @param c63    The (optional) character for the value 63
 * @return       An string with the encoded data
 */
function btoa(arr, c62, c63) {
  if (typeof arr == "string")
    arr = arr.split("").map(function (e) { return e.charCodeAt(0); });
  if (!c62) c62 = "+";
  if (!c63) c63 = "/";

  var bits = [];
  for each (var octet in arr) {
    bits.push((octet >> 7) & 1);
    bits.push((octet >> 6) & 1);
    bits.push((octet >> 5) & 1);
    bits.push((octet >> 4) & 1);
    bits.push((octet >> 3) & 1);
    bits.push((octet >> 2) & 1);
    bits.push((octet >> 1) & 1);
    bits.push((octet >> 0) & 1);
  }
  while (bits.length % 6 != 0)
    bits.push(0);
  var result = "";
  while (bits.length > 0) {
    let code = bits.splice(0, 6).reduce(function (form, bit) {
        return (form << 1) | bit;
    });
    if (code <= 25)
      result += String.fromCharCode(code+65);
    else if (code <= 51)
      result += String.fromCharCode(code-26+97);
    else if (code <= 61)
      result += String.fromCharCode(code-52+48);
    else if (code == 62)
      result += c62;
    else if (code == 63)
      result += c63;
  }
  while (result.length % 4 != 0)
    result += "=";
  return result;
}
//</copied>

// Copied from https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsICryptoHash#Computing_the_Hash_of_a_String
function sha1(text) {
  var converter = Cc['@mozilla.org/intl/scriptableunicodeconverter']
      .createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = 'UTF-8';
  var result = {};
  var data = converter.convertToByteArray(text, result);
  var ch = Cc["@mozilla.org/security/hash;1"]
      .createInstance(Ci.nsICryptoHash);
  ch.init(ch.SHA1);
  ch.update(data, data.length);
  var hash = ch.finish(false);
  function toHexString(charCode) {
    return ('0' + charCode.toString(16)).slice(-2);
  }
  return [toHexString(hash.charCodeAt(i)) for (i in hash)].join('');
}
