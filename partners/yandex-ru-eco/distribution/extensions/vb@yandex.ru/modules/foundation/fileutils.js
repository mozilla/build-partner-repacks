"use strict";
EXPORTED_SYMBOLS.push("fileutils");
const StrInputStreamFabric = Cc["@mozilla.org/io/string-input-stream;1"];
const nsIStringInputStream = Ci.nsIStringInputStream;
const fileutils = {
        MODE_RDONLY: 1,
        MODE_WRONLY: 2,
        MODE_RDWR: 4,
        MODE_CREATE: 8,
        MODE_APPEND: 16,
        MODE_TRUNCATE: 32,
        PERMS_FILE: parseInt("0644", 8),
        PERMS_DIRECTORY: parseInt("0755", 8),
        readTextFile: function FileUtils_readTextFile(file, encoding) {
            var inStream = this.openFile(file);
            try {
                return this.readStringFromStream(inStream, encoding);
            } catch (e) {
                throw new Error("Can not read file [" + file.path + "]\n" + strutils.formatError(e));
            } finally {
                inStream.close();
            }
        },
        writeTextFile: function FileUtils_writeTextFile(file, text, accessRights, modeFlags) {
            var fileOutStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
            var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
            try {
                fileOutStream.init(file, modeFlags || this.MODE_WRONLY | this.MODE_CREATE | this.MODE_TRUNCATE, accessRights || this.PERMS_FILE, 0);
                converter.init(fileOutStream, "UTF-8", 0, 0);
                converter.writeString(text);
            } catch (e) {
                throw new Error("Can not write file [" + file.path + "]\n" + strutils.formatError(e));
            } finally {
                converter.close();
                fileOutStream.close();
            }
        },
        writeStreamToFile: function FileUtils_writeStreamToFile(inputStream, destFile, accessRights, modeFlags, progressWatcher) {
            if (!(inputStream instanceof Ci.nsIInputStream))
                throw new TypeError("First argument must be nsIInputStream");
            if (!(destFile instanceof Ci.nsIFile))
                throw new TypeError("Second argument must be nsIFile");
            var fileOutStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
            try {
                let accessRights = accessRights || this.PERMS_FILE;
                let modeFlags = modeFlags || this.MODE_WRONLY | this.MODE_CREATE | this.MODE_TRUNCATE;
                fileOutStream.init(destFile, modeFlags, accessRights, 0);
                let binInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
                binInputStream.setInputStream(inputStream);
                try {
                    let size;
                    let buf;
                    while (size = binInputStream.available()) {
                        buf = binInputStream.readBytes(size);
                        fileOutStream.write(buf, size);
                        if (progressWatcher) {
                            let stop = progressWatcher.onWrite(size);
                            if (stop)
                                break;
                        }
                        if (buf.length === size)
                            break;
                    }
                } finally {
                    binInputStream.close();
                }
            } finally {
                fileOutStream.close();
            }
        },
        openFile: function FileUtils_openFile(file) {
            file = file.QueryInterface(Ci.nsILocalFile);
            var inStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            inStream.init(file, this.MODE_RDONLY, 0, inStream.CLOSE_ON_EOF);
            return inStream;
        },
        openBuffer: function FileUtils_openBuffer(buffer, bufferLen) {
            bufferLen = bufferLen || -1;
            var strInputStream = StrInputStreamFabric.createInstance(nsIStringInputStream);
            strInputStream.setData(buffer, bufferLen);
            return strInputStream;
        },
        xmlDocFromFile: function FileUtils_xmlDocFromFile(file, withSystemPrincipal) {
            var inStream = this.openFile(file);
            var fileURI = netutils.ioService.newFileURI(file);
            return this.xmlDocFromStream(inStream, fileURI, fileURI, withSystemPrincipal);
        },
        xmlDocFromStream: function FileUtils_xmlDocFromStream(docStream, docURI, baseURI, withSystemPrincipal, charset) {
            docStream = docStream.QueryInterface(Ci.nsIInputStream);
            try {
                let domParser = xmlutils.getDOMParser(docURI, baseURI, withSystemPrincipal);
                let XMLDoc = domParser.parseFromStream(docStream, charset || null, docStream.available(), "text/xml");
                if (XMLDoc.documentElement.localName == "parsererror")
                    throw new Error(XMLDoc.documentElement.textContent);
                return XMLDoc;
            } finally {
                docStream.close();
            }
        },
        xmlDocToFile: function FileUtils_xmlDocToFile(xmlDocument, destFile, accessRights, modeFlags) {
            var accessRights = accessRights || this.PERMS_FILE;
            var modeFlags = modeFlags || this.MODE_WRONLY | this.MODE_CREATE | this.MODE_TRUNCATE;
            var fileOutStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
            fileOutStream.init(destFile, modeFlags, accessRights, 0);
            try {
                xmlutils.xmlSerializer.serializeToStream(xmlDocument, fileOutStream, "");
            } finally {
                fileOutStream.close();
            }
        },
        jsonFromFile: function FileUtils_jsonFromFile(file) {
            try {
                let text = this.readTextFile(file);
                return JSON.parse(text);
            } catch (e) {
                throw new Error("Can not read json file [" + file.path + "]\n" + strutils.formatError(e));
            }
        },
        jsonFromStream: function FileUtils_jsonFromStream(anInputStream) {
            var text = this.readStringFromStream(anInputStream);
            return JSON.parse(text);
        },
        jsonToFile: function FileUtils_jsonToFile(json, file, accessRights, modeFlags) {
            var text = JSON.stringify(json);
            this.writeTextFile(file, text, accessRights, modeFlags);
        },
        readStringFromStream: function FileUtils_readStringFromStream(aInputStream, aEncoding) {
            var streamSize = aInputStream.available();
            var convStream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
            convStream.init(aInputStream, aEncoding || "UTF-8", streamSize, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
            try {
                let data = {};
                convStream.readString(streamSize, data);
                return data.value;
            } finally {
                convStream.close();
            }
        },
        extractZipArchive: function FileUtils_extractZipArchive(archiveFile, destDirFile) {
            if (!(archiveFile instanceof Ci.nsIFile) || !(destDirFile instanceof Ci.nsIFile))
                throw new TypeError("nsIFile required");
            function getItemFile(filePath) {
                var itemLocation = destDirFile.clone();
                filePath.split("/").forEach(function (part) itemLocation.append(part));
                return itemLocation;
            }
            var zReader = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
            zReader.open(archiveFile);
            try {
                let entries = zReader.findEntries("*/");
                while (entries.hasMore()) {
                    let entryName = entries.getNext();
                    let target = getItemFile(entryName);
                    if (!target.exists())
                        target.create(Ci.nsILocalFile.DIRECTORY_TYPE, destDirFile.permissions);
                }
                entries = zReader.findEntries(null);
                while (entries.hasMore()) {
                    let entryName = entries.getNext();
                    let target = getItemFile(entryName);
                    if (target.exists()) {
                        if (target.isDirectory())
                            continue;
                        else
                            target.remove();
                    }
                    zReader.extract(entryName, target);
                    target.permissions |= this.PERMS_FILE;
                }
            } finally {
                zReader.close();
            }
        },
        forceDirectories: function FileUtils_forceDirectories(dirFile, perm) {
            perm = perm || this.PERMS_DIRECTORY;
            if (!(dirFile.exists() && dirFile.isDirectory()))
                dirFile.create(Ci.nsIFile.DIRECTORY_TYPE, perm);
        },
        removeFileSafe: function FileUtils_removeFileSafe(file) {
            if (!file || !file.exists())
                return;
            file = file.clone();
            try {
                file.remove(true);
                if (!file.exists())
                    return;
            } catch (e) {
                Cu.reportError("Could not remove file [" + file.path + "]\n" + e);
            }
            var trash = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);
            trash.append("trash");
            trash.createUnique(Ci.nsIFile.DIRECTORY_TYPE, this.PERMS_DIRECTORY);
            try {
                file.moveTo(trash, file.leafName);
            } catch (e) {
                Cu.reportError("Could not move file [" + file.path + "] to trash dir\n" + e);
                return;
            }
            try {
                trash.remove(true);
            } catch (e) {
                Cu.reportError("Could not remove trash [" + trash.path + "]\n" + e);
            }
        },
        safeReplace: function fileutils_safeReplace(oldFile, newFile, backupName) {
            oldFile = oldFile.clone();
            newFile = newFile.clone();
            if (backupName === undefined)
                backupName = "backup";
            var destName = oldFile.leafName;
            var parentDir = oldFile.parent;
            var backupDir = parentDir.clone();
            backupDir.append(backupName);
            try {
                if (backupDir.exists())
                    backupDir.remove(true);
                if (oldFile.exists())
                    oldFile.moveTo(null, backupName);
            } catch (e) {
                throw new Error("Could not make old file backup. \n" + strutils.formatError(e));
            }
            try {
                newFile.moveTo(parentDir, destName);
                fileutils.removeFileSafe(backupDir);
            } catch (e) {
                if (backupDir.exists())
                    backupDir.moveTo(null, destName);
                throw e;
            }
        }
    };
