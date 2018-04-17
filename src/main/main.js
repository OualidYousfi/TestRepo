'use strict'

import { app, BrowserWindow, dialog, ipcMain, shell} from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
const fs = require('fs');
const text2png = require('text2png');
const winston = require('winston');
//const sharp = require('sharp');
const canvas = require('canvas');

require('electron-reload')(path.join(__dirname, '/../dist'));
//no electron hard resets, etc

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({width: 850, height: 650})

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    //window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file',
      slashes: true
    }))
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, '/app/app.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()
})

//Sample usage of zipService
const zip = require('./zip.service');
const csv = require('./csv.service');
const mru = require('./mru.service');
const generator = require('./generator');

const woFileType = "zip";
let starttime = Date.now();
let workOrderFiles;
let zipPath = "";
let indexWithSavedProgress = 0;
let shouldSaveProgressOnFinish = false; // in case when generateNcodes was used and the zip is not totally finished
let previewExtendedId = "";
let previewSerial = "";
let shouldArchive = false;
let ipcRendererEventHook = undefined;

/**
 *  ipcMethods
 */

/**
 * Opens a file dialog to select a work order. When a file is chosen, it will be extracted and validated.
 */
ipcMain.on('select-work-order', (event) => {
  let selectedFile = dialog.showOpenDialog({
    title: "Select work order .zip file",
    properties: ['openFile'],
    filters: [{name: 'Work order', extensions: ['zip']}]
  });
  if (selectedFile !== undefined)
    extractZip(selectedFile[0], event.sender, true);
});

/** 'select-custom-image'
 * Opens a file dialog to choose a image to place in the center of the QR code. Returns the image in buffer back to the sender.
 * In case the user dropped an image on the QR code, this function turns the url of this image to buffer for the generator.
 * @param {String} droppedURl
 */
ipcMain.on('select-custom-image', (event, droppedUrl) => {
  let selectedImage;
  if (droppedUrl.length !== 0) // The user dropped an image on the QR code, file dialog won't be shown and just the buffer will be created
    selectedImage = droppedUrl;
  else {
    selectedImage = dialog.showOpenDialog({
      title: "Select image to place on the QR code",
      properties: ['openFile'],
      filters: [{name: 'image', extensions: ['png', 'jpg', 'jpeg']}]
    });
    if (selectedImage !== undefined)
      selectedImage = selectedImage[0];
  }
  if (selectedImage !== undefined) {
    selectedImage = fs.readFileSync(selectedImage);
    event.sender.send('selected-center-image', selectedImage);
  }
});

/** 'extract-work-order'
 * Users hovers a work order on the drop zone. This function checks the validity of this work order and extracts it.
 * @param {String} filePath
 */
ipcMain.on('extract-work-order', (event, filePath, isHover) => {
  extractZip(filePath, event.sender, isHover);
});

/** 'select-output-folder'
 * Shows a file dialog to select a save location for the QR codes. Returns the chosen location back to the sender.
 */
ipcMain.on('select-output-folder', (event) => {
  let outputDir = dialog.showOpenDialog({title: "Select output directory", properties: ['openDirectory']});
  if (outputDir !== undefined)
    event.sender.send('set-output-folder', outputDir);
});

function _addFingerPrintIfnecessary(generateOptions) {
  if (generateOptions.customImage !== null) {
    if (generateOptions.customImage.isFingerprint) {
      winston.log('debug', 'Adding the fingerprint to the generation options.');
      generateOptions.customImage.image = workOrderFiles['fingerprint.tiff'];
    }
  }
}

/** 'generate-preview'
 * Generates a preview QR code with the custom settings. Returns a png hash back to the sender.
 * @param {GenerateParameters} generateOptions : This object holds all the custom parameters
 */
ipcMain.on('generate-preview', (event, generateOptions) => {
  _addFingerPrintIfnecessary(generateOptions);
  let content = generateOptions.urlPrefix + previewExtendedId;
  generator.generatePreview(content, generateOptions).then(preview => {
    event.sender.send('render-preview', preview);
  });
});

/**
 * Extracts the work order zip. Appends the work order to the MRU list. Returns the extracted files back to the sender.
 * @param {String} filePath
 * @param {Event.sender} sender
 * @param {Boolean} noDrop : flag used in the sender (zip.service.ts) to show the next screen.
 * When this parameter is false it indicates that the user is holding a work order on the drop zone but has not released yet.
 */
let extractZip = function (filePath, sender, noDrop) {
  zipPath = filePath;
  zip.extractFiles(filePath, woFileType).then(result => {
    workOrderFiles = result;
    // Slicing 200, this will make sure we have the extended_id and serial number in the range
    previewExtendedId = result['codes.csv'].slice(0, 200).split('\n')[1].split(',')[0];
    previewSerial = result['codes.csv'].slice(0, 200).split('\n')[1].split(',')[1];

    sender.send('work-order-extracted', true, result['manifest.json'], noDrop, filePath, previewExtendedId, previewSerial);

    // Add the file to MRU list
    mru.appendFile(filePath);
  }).catch(function (e) {
    // Invalid work order -> show red warning on UI
    sender.send('work-order-extracted', false);
  });
};

/** 'show-in-folder'
 * Opens the file path in the file explorer.
 * @param {string} filePath
 */
ipcMain.on('show-in-folder', (event, filePath) => {
  shell.showItemInFolder(filePath);
});

/** 'get-mru'
 * Gets the MRU list. Returns the list back to the sender.
 * @returns {Array} list
 */
ipcMain.on('get-mru', (event) => {
  mru.readMru().then(list => {
    event.sender.send('mru-list', list);
  });
});