/**
 * This service takes care of the most recently used files.
 */

const mruStorage = require('electron-json-storage');
const mruStorageKey = "MRU";
const maxEntries = 10;

module.exports = (function () {

  /**
   * Append a file to MRU list. If the file is already present, the file will be moved up the list.
   * @param {String} filePath
   */
  function appendFile(filePath) {
    this.readMru().then(mru => {
      if (mru !== null) {
        // Remove duplicate
        mru.forEach((path, i) => {
          if (path === filePath) mru.splice(i, 1);
        });

        // Max 10 entries
        if (mru.length >= maxEntries)
          mru.pop();
      } else {
        mru = [];
      }

      // Add the new work order file path
      mru.unshift(filePath);
      // Save the new MRU list
      mruStorage.set(mruStorageKey, mru, (error) => {
        if (error) throw error;
      });
    });
  }

  /**
   * Reads the MRU and returns the list of paths. If there are no entries, returns null.
   * @returns {Promise} Can be consumed to get te MRU list
   */
  function readMru() {
    return new Promise((resolve) => {
      hasMru().then((hasMru) => {
        if (!hasMru)
          resolve(null);
        mruStorage.get(mruStorageKey, (error, data) => {
          if (error) throw error;
          resolve(data);
        });
      });
    });
  }

  /**
   * Checks if there are entries the in MRU.
   * @returns {Boolean}
   */
  function hasMru() {
    return new Promise((resolve) => {
      mruStorage.has(mruStorageKey, (error, hasMru) => {
        resolve(hasMru);
      });
    });

  }

  /**
   * Removes the MRU list
   */
  function removeMru() {
    mruStorage.remove(mruStorageKey, (error) => {
      if (error) throw error;
    });
  }

  return {
    appendFile: appendFile,
    readMru: readMru,
    hasMru: hasMru,
    removeMru: removeMru
  }
}());
