/**
 * Copyright (c) 2008-2009 Glaxstar Ltd. All rights reserved.
 */

var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://glaxebay/gsCommon.js");
Cu.import("resource://glaxebay/Util/gsUtilCommon.js");
Cu.import("resource://glaxebay/Util/gsUtilBase64Encoder.js");

// The maximum size of block to read, in bytes.
const READ_BLOCK_SIZE = 512;

// open flags for the zip files
const PR_RDONLY      = 0x01;
const PR_WRONLY      = 0x02;
const PR_RDWR        = 0x04;
const PR_CREATE_FILE = 0x08;
const PR_APPEND      = 0x10;
const PR_TRUNCATE    = 0x20;
const PR_SYNC        = 0x40;
const PR_EXCL        = 0x80;

/**
 * Compression service. It handles compression and uncompression of strings.
 */
GlaxEbay.Util.CompressionService = {
  /* Logger for this object. */
  _logger : null,

  /**
   * Initialize the object.
   */
  _init : function() {
    this._logger = GlaxEbay.getLogger("GlaxEbay.Util.CompressionService");
    this._logger.trace("_init");
  },

  /**
   * Uncompresses a string of data using the ZIP algorithm.
   * @param aData the data to uncompress. It must be an UTF-8 encoded
   * representation of a ZIP file, holding a single file entry. The name of the
   * entry must not begin with '_' or '.'.
   * @return uncompressed data.
   * @throws Exception if the data string is null, or the data format is
   * invalid.
   */
  uncompressZIP : function(aData) {
    this._logger.debug("CompressionService.uncompressZIP");

    let zipReader =
      Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
    let foStream =
      Cc["@mozilla.org/network/file-output-stream;1"].
        createInstance(Ci.nsIFileOutputStream);
    let zipInputStream =
      Cc["@mozilla.org/scriptableinputstream;1"].
        createInstance(Ci.nsIScriptableInputStream);
    // XXX: the interface changed on Gecko 1.9, so we need to validate this.
    let isGecko18Reader = ("function" == typeof(zipReader.init));
    let tempFile = GlaxEbay.getProfileDirectory();
    let tempFileId = (new Date()).getTime(); // good enough for uniqueness.
    let unzipped = "";
    let foundEntry = false;
    let binaryData;
    let zipEntryEnum;
    let zipEntry;
    let zipEntryName;
    let block;
    let firstChar;

    if (null == aData) {
      this._logger.error("uncompressZIP. null data received.");
      throw "null data to uncompress.";
    }

    binaryData = GlaxEbay.Util.Base64Encoder.decodeString(aData);
    // create a temporary file with the received data.
    tempFile.append("Zip-" + tempFileId + ".zip");
    // write, create, truncate.
    foStream.init(tempFile, PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE, 0664, 0);
    foStream.write(binaryData, binaryData.length);

    if (foStream instanceof Ci.nsISafeOutputStream) {
      foStream.finish();
    } else {
      foStream.close();
    }

    this._logger.debug("uncompressZIP. Temp file written.");

    try {
      // use the zip reader to extract a file with the unzipped data.
      // XXX handle changes in nsIZipReader for FF3
      if (isGecko18Reader) {
        zipReader.init(tempFile);
        zipReader.open();
        zipEntryEnum = zipReader.findEntries("*"); // all entries.

        // look for the first valid entry. All entries starting with a _ or a .
        // will be ignored, as well as any additional entries.
        while (!foundEntry && zipEntryEnum.hasMoreElements()) {
          zipEntry = zipEntryEnum.getNext();
          zipEntry.QueryInterface(Ci.nsIZipEntry);
          firstChar = zipEntry.name.charAt(0);
          foundEntry = (("." != firstChar) && ("_" != firstChar));
        }
      } else {
        zipReader.open(tempFile);
        zipEntryEnum = zipReader.findEntries("*"); // all entries.
        // look for the first valid entry. All entries starting with a _ or a .
        // will be ignored, as well as any additional entries.
        while (!foundEntry && zipEntryEnum.hasMore()) {
          zipEntry = zipEntryEnum.getNext();
          firstChar = zipEntry.charAt(0);
          foundEntry = (("." != firstChar) && ("_" != firstChar));
        }
      }

      if (!foundEntry) {
        this._logger.error("uncompressZIP. no valid entries in the ZIP.");
        throw "There are no valid entries in the ZIP.";
      }

      zipEntryName = (isGecko18Reader ? zipEntry.name : zipEntry);
      zipInputStream.init(zipReader.getInputStream(zipEntryName));

      // read the contents of the zip file into our return value.
      do {
        block = zipInputStream.read(READ_BLOCK_SIZE);
        unzipped += block;
      } while (0 < block.length);

      // close streams.
      zipInputStream.close();
      zipReader.close();
    } catch (e) {
      this._logger.error("uncompressZIP. Invalid ZIP string:\n" + e);
      throw "Invalid ZIP string.";
    } finally {
      // remove the temporary file.
      tempFile.remove(false);
      this._logger.debug("uncompressZIP. Temp file removed.");
    }

    return unzipped;
  },

  /**
   * Compresses the file sent as parameter using the ZIP algorithm.
   * @param aFile the file to be compressed.
   * @return the compressed file
   * @throws Exception if the compression process fails
   */
  compressFile : function(aFile) {
    this._logger.debug("CompressionService.compressFile");

    let compressedFile = null;

    if (aFile && aFile.exists()) {
      let zipWriter =
        Components.Constructor("@mozilla.org/zipwriter;1", "nsIZipWriter");
      let zipW = new zipWriter();
      let fileName = aFile.leafName;
      let zipFileName = fileName.split(".")[0] + ".zip"
      compressedFile = aFile.clone();
      compressedFile.leafName = zipFileName;

      zipW.open(compressedFile, PR_RDWR | PR_CREATE_FILE | PR_TRUNCATE);
      zipW.addEntryFile(
        fileName, Ci.nsIZipWriter.COMPRESSION_DEFAULT, aFile, false);
      zipW.close();
    }

    return compressedFile;
  }
};

/**
 * Constructor.
 */
(function() {
  this._init();
}).apply(GlaxEbay.Util.CompressionService);
