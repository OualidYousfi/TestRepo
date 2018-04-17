/**
 * The main module for generating qr codes,
 * relies on the qr service.
 */

const qr = require('./qr.service');

module.exports = (function () {
    /**
  * Generate a preview of the qr code in base64 PNG format
  * @returns {Promise} can be consumed to get the buffer
  */
    function generatePreview(content, generationOptions) {
        return new Promise((resolve) => {
            resolve(qr.generateToPngBase64Buffer(content, generationOptions));
        });
    }

    return {
        generatePreview: generatePreview
    }
}());