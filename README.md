# desktop-gen-electron
> An offline QR code generator

The use of the [yarn](https://yarnpkg.com/) package manager is recommended, as opposed to using `npm`.

```bash
# install dependencies
yarn

# add a new package
yarn add [package-name]

# run application in development mode
yarn dev

# compile source code and create webpack output
yarn compile

# `yarn compile` & create build with electron-builder
yarn dist

# `yarn compile` & create unpacked build with electron-builder
yarn dist:dir
```

### Project structure

* /build - put the icons for the app in this folder with these exact filenames; icon.icns, icon.ico, icon.png. https://www.electron.build/icons
* /src/main/main.js - entry point of the app. Here's where you create a window for your app through the BrowserWindow Electron module passing a .html file along
* /static - contains all static assets which don't need any pre-processing. Images, CSSes, HTMLs, etc.