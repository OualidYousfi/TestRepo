/**
 * Read the zip file and extract the files.
 */
const path = require('path');
const winston = require('winston');
const fs = require("fs");
const JSZip = require("jszip");

module.exports = (function () {
  /**
   * Extracts files into a fileDictionary {Object.<string, string>}
   * @param {String} path
   * @param {String} woFileType
   * @returns {Promise} can be consumed to get the file dictionary
   */
  function extractFiles(path, woFileType) {
    return new Promise((resolve) => {
      if (path.split('.').pop() !== woFileType) {
        throw "invalid work order type (required: " + woFileType + ")";
      }
      let fileDictionary = {};
      fs.readFile(path, function (err, data) {
        if (err) throw err;

        JSZip.loadAsync(data).then(function (zip) {
          let promises = [];
          for (let key in zip.files) {
            promises.push(extractToFileDictionaryAsync(zip, key, fileDictionary));
          }
          Promise.all(promises).then(() => {
            resolve(fileDictionary)
          });
        });
      });
    }).catch(function (e) {
      winston.log("info", "invalid WO file type: " + e);
      throw e;
    });
  }

  /**
   * Asynchronously add contents of a file to a dictionary with filename as key
   * @param {Object} zip
   * @param {String} key
   * @param {Object.<string, string>} fileDictionary
   * @returns {Promise}
   */
  function extractToFileDictionaryAsync(zip, key, fileDictionary) {
    return new Promise((resolve) => {
      let resultType = key.endsWith('.tiff') ? 'nodebuffer' : 'string';
      zip.file(key).async(resultType).then(function (data) {
        // zip library includes the foldername, "fingerprints", since the filename is random
        // this is the only way to find the fingerprint, change name for easier use
        parsedKey = key.includes("fingerprints") ? "fingerprint.tiff" : key;
        fileDictionary[parsedKey] = data;
        resolve();
      })
    }).catch(function (e) {
      winston.log("debug", "Extracting zip file failed: " + e);
      return e;
    });
  }

  /**
   * Adds a comment to a file in the zip.
   * @param {String} path
   * @param {String} fileName
   * @param {String} comment
   */
  function addCommentToArchiveMember(path, fileName, comment) {
    return new Promise((resolve) => {

      fs.readFile(path, function (err, data) {
        if (err) throw err;
        JSZip.loadAsync(data).then(function (zip) {
          zip.file(fileName).comment = comment;
          zip
            .generateNodeStream({type: 'nodebuffer', streamFiles: true})
            .pipe(fs.createWriteStream(path))
            .on('finish', function () {
              winston.log('debug', 'Written comment to file in zip:', {
                zipfile: path,
                fileName: fileName,
                comment: comment
              });
              resolve();
            });
        });
      });
    });

  }

  /**
   * Read a comment from a file in a zip archive
   * @param {String} path
   * @param {String} fileName
   * @returns {Promise} can be consumed to get the comment as {String}
   */
  function readCommentFromArchiveMember(path, fileName) {
    return new Promise((resolve) => {
      fs.readFile(path, function (err, data) {
        if (err) throw err;
        JSZip.loadAsync(data).then(function (zip) {
          resolve(zip.file(fileName).comment);
        });
      });
    });
  }

  /**
   * Generate an archive based on file names and file contents.
   * @param path destination for the archive
   * @param {Object.<string, string>} fileDictionary filenames and contents
   * @returns {Promise} resolves when the zip finished writing
   */
  function archive(path, fileDictionary) {
    return new Promise((resolve) => {
      let zip = new JSZip();
      for (let key in fileDictionary) {
        zip.file(key, fileDictionary[key], {binary: true, compression: "DEFLATE"})
      }
      zip
        .generateNodeStream({type: 'nodebuffer', streamFiles: true})
        .pipe(fs.createWriteStream(path))
        .on('finish', function () {
          resolve();
        });
    });
  }

  return {
    extractFiles: extractFiles,
    addCommentToArchiveMember: addCommentToArchiveMember,
    readCommentFromArchiveMember: readCommentFromArchiveMember,
    archive: archive
  }
}());
