

module.exports = (function () {
    const EC_LEVEL = "Q";

    /**
   * Used for getting the base64 representation of a PNG image
   * @param image to convert to base64 PNG
   * @returns {Promise} can be consumed to get the buffer
   */
  function toPngBase64Buffer(image) {
    return new Promise((resolve) => {
      image.png().toBuffer(function (err, data, info) {
        resolve(data.toString('base64'));
      });
    });
  }

    /**
   * This function encapsulates the basic logic for generating a generic qr image which can be further processed according
   * to the needs.
   * @returns {object} a sharp image object which can be processed by other sharp image manipulations
   */
  function generateBaseImage(content, generationOptions) {
    return new Promise((resolve) => {
      let centerImageBuffer;
      let centerImageIsFingerprint;
      let centerImageSize;
      if (generationOptions.customImage) {
        centerImageBuffer = generationOptions.customImage['image'];
        centerImageIsFingerprint = generationOptions.customImage['isFingerprint'];
        centerImageSize = generationOptions.customImage['size'];
      } else {
        centerImageBufferCache = Promise.resolve(); // reset cache
      }

      let customStrings = generationOptions.customStrings;
      let shouldAddWhiteSpace = generationOptions['shouldAddWhiteSpaceBorder'];

      // Generate a basic qr code in bitmatrix format
      let bitmatrix = qrEncoder.encode(content, EC_LEVEL);
      const height = bitmatrix.length, width = bitmatrix[0].length, channels = 1;
      const minBounds = (height - generationOptions.placeholderCells) / 2;
      const maxBounds = minBounds + generationOptions.placeholderCells;
      const flatColourData = preprocessBitmatrix(bitmatrix, minBounds, maxBounds);

      const resizeHeight = generationOptions.outputFormat === 'PNG' ? generationOptions.preDefinedFlankSize : height * generationOptions.cellSizeInPx;
      const resizeWidth = generationOptions.outputFormat === 'PNG' ? generationOptions.preDefinedFlankSize : width * generationOptions.cellSizeInPx;
      // Generate base sharp image
      let image = sharp(Buffer.from(flatColourData), {
        raw: {
          width: width,
          height: height,
          channels: channels
        }
      })
        .resize(resizeHeight, resizeWidth, {
          kernel: sharp.kernel.nearest,
          interpolator: sharp.interpolator.nearest
        });

      // Add a white border by extending the image by a size of 1 cell
      if (shouldAddWhiteSpace) {
        let borderSizeInPixels = Math.ceil(generationOptions.outputFormat === 'PNG' ? generationOptions.preDefinedFlankSize / height : generationOptions.cellSizeInPx);
        image.background({r: 255, g: 255, b: 255, alpha: 1})
          .extend({
            top: borderSizeInPixels,
            bottom: borderSizeInPixels,
            left: borderSizeInPixels,
            right: borderSizeInPixels
          });
      }


      // If no overlays need to be added, resolve the image immediately
      if (!centerImageBuffer && (!customStrings || customStrings.length === 0)) {
        resolve(image)
      }
      // If only 1 overlay has to be added, e.g. serialized workorder, overlay and resolve immediately
      else if (centerImageBuffer && centerImageIsFingerprint) {
        resolve(image.overlayWith(centerImageBuffer));
      }

      // Calculate the centerImageBuffer if it isn't already calculate and is a custom image
      else if ((centerImageBuffer && !centerImageIsFingerprint) &&
        (centerImageBufferCacheIsEmpty || lastCenterImageBufferLength !== centerImageBuffer.length || lastSize !== centerImageSize)) {
        let centerImage;

        lastSize = centerImageSize;
        lastCenterImageBufferLength = centerImageBuffer.length;
        centerImage = sharp(centerImageBuffer);

        // CenterImage is always square
        let pixelAmountRoot = resizeHeight * resizeWidth;
        let pixelAmountCenterImage = pixelAmountRoot * centerImageSize;
        let customImageFlankLength = Math.sqrt(pixelAmountCenterImage);

        // Resize the qr code based on the pixels per cell
        centerImageBufferCache = centerImage.resize(Math.ceil(customImageFlankLength), Math.ceil(customImageFlankLength), {
          kernel: sharp.kernel.nearest,
          interpolator: sharp.interpolator.nearest
        }).tiff().toBuffer();
        centerImageBufferCacheIsEmpty = false;

        // If the customImage is the only thing that needs to be added, resolve instantly
      } else if (!centerImageBufferCacheIsEmpty && (!customStrings || customStrings.length === 0)) {
        // Use precalculated buffer, resolve instantly
        centerImageBufferCache.then(data => {
          resolve(image.overlayWith(data));
        });
      }
      // If multiple overlays have to be added, add them recursively and convert back to sharp object each time
      // as sharp does not support overlay chaining this results in poor performance, there is an open pr to support
      // overlay chaining though.

      // Store the customStrings and centerImage in an array as buffers if present
      centerImageBufferCache.then(buffer => {
        let overlays = [];
        if (buffer)
          overlays.push({imageBuffer: buffer, gravity: 0});
        if (customStrings) {
          customStrings.forEach(function callback(customStringDescriptor) {
            let buffer = text2png(customStringDescriptor['text'], {
              font: '10px sans-serif',
              output: 'buffer'
            });
            overlays.push({imageBuffer: buffer, gravity: customStringDescriptor['gravity']});
          });
        }

        // Prepare the base image for overlaying
        image = image.tiff().toBuffer();

        // Overlay the images one by one
        let composite = overlays.reduce(function (input, overlay) {
          return input.then(function (data) {
            return sharp(data).overlayWith(overlay['imageBuffer'], {gravity: overlay['gravity']}).tiff().toBuffer();
          });
        }, image);

        composite.then(function (data) {
          resolve(sharp(data));
        });
      });
    });
  }
  
  return {
    generateToPngBase64Buffer: function (content, generationOptions) {
      return new Promise((resolve) => {
        if (generationOptions.outputFormat === 'PNG')
          generationOptions.preDefinedFlankSize = Math.floor((generationOptions.physicalSizeInCm * generationOptions.dpi) / 2.54);
        generateBaseImage(generationOptions.urlPrefix + content, generationOptions).then(image => {
          resolve(toPngBase64Buffer(image));
        });
      });
    }
  };
}());