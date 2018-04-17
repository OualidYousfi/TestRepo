/**
 * Used for all csv-related operations.
 */
const csv = require("fast-csv");

module.exports = (function () {
  /**
   * Parses a string of comma separated values to an array of objects
   * @param {String} csvString
   * @returns {Promise<Object[]>} consume to get the object array
   */
  function parseCsvString(csvString) {
    return new Promise((resolve) => {
      let dataBuffer = [];
      csv
        .fromString(csvString, {headers: true})
        .on("data", function (data) {
          dataBuffer.push(data);
        })
        .on("end", function () {
          resolve(dataBuffer);
        });
    });

  }

  return {
    parseCsvString: parseCsvString
  }
})();
