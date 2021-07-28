const {app, BrowserWindow, session, Menu, Notification} = require('electron');

const log = require('electron-log');
const {autoUpdater} = require('electron-updater');

const path = require('path');
const isDevelopment = process.env.NODE_ENV === 'development';
const {format} = require('url');
const port = 9002;

const config = require('../../config.json');

// isDevelopment && require('react-devtools-electron');
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

const intr = (() => {
  if(!isDevelopment){
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 30000)
  }
})();

let mainWindow;

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message =
    log_message +
    ' (' +
    progressObj.transferred +
    '/' +
    progressObj.total +
    ')';
  sendStatusToWindow(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
  // autoUpdater.quitAndInstall();

  const NOTIFICATION_TITLE = 'An update is ready';
  const NOTIFICATION_BODY = 'Please restart your app to complete the update';

  function showNotification() {
    new Notification({
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY,
    }).show();
  }
  showNotification();
});

let deeplinkingUrl;

// Force Single Instance Application
app.requestSingleInstanceLock();
app.on('second-instance', (event, argv, cwd) => {

  // Protocol handler for win32
  // argv: An array of the second instance’s (command line / deep linked) arguments
  if (process.platform == 'win32') {
    // Keep only command line / deep linked arguments
    deeplinkingUrl = argv.slice(1)
  }
    logEverywhere('app.makeSingleInstance# ' + deeplinkingUrl)
    // if(mainWindow){
      mainWindow.webContents.send('ping', encodeURIComponent(deeplinkingUrl))
    // }

    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
})
// if (shouldQuit) {
//   app.quit()
//   return
// }


const createWindow = () => {
  const name = app.getName();
  const template = [
    {
      label: name,
      submenu: [
        {
          label: 'About ' + name,
          role: 'about',
        },
        {type: 'separator'},
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click() {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:'},
        {label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:'},
        {type: 'separator'},
        {label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:'},
        {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
        {label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:'},
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:',
        },
      ],
    },
  ];
  autoUpdater.checkForUpdatesAndNotify();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Create the browser window.
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Chrome';
    callback({cancel: false, requestHeaders: details.requestHeaders});
  });

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true,
    },
    show: false,
  });

  mainWindow.webContents.on(
    'new-window',
    (event, url, frameName, disposition, options, additionalFeatures) => {
      // console.log('modal opened', event, url, frameName, disposition, options);
      if (frameName === 'modal') {
        // open window as modal
        event.preventDefault();
        Object.assign(options, {
          modal: true,
          parent: mainWindow,
          // frame: false,
        });
        event.newGuest = new BrowserWindow(options);
      }
    },
  );

  // and load the index.html of the app.
  // mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (isDevelopment) {
    mainWindow.loadURL(`http://localhost:${port}`);
  } else {
    mainWindow.loadURL(
      format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  // Open the DevTools.
  // isDevelopment && mainWindow.webContents.openDevTools();
    
  // Protocol handler for win32
  if (process.platform == 'win32') {
    // Keep only command line / deep linked arguments
    deeplinkingUrl = process.argv.slice(1)
    console.log('platform', process.platform)
    // mainWindow.webContents.send('ping', encodeURIComponent(deeplinkingUrl))
  }
  logEverywhere("createWindow# " + deeplinkingUrl)
  mainWindow.webContents.on('did-finish-load', () => {
    if(deeplinkingUrl){
      mainWindow.webContents.send('ping', encodeURIComponent(deeplinkingUrl))
    }
  }) 
  mainWindow.once('ready-to-show', () => {
    if (process.platform === 'win32' && isDevelopment) {
      mainWindow.reload();
    }
    mainWindow.show();
  });

  // Set a variable when the app is quitting.
  let isAppQuitting = false;
  if(process.platform === 'darwin'){
    app.on('before-quit', function (evt) {
      isAppQuitting = true;
    });
  }
  // on OSX, we don't want to quit the app on close, hide the app modal.
  mainWindow.on('close', function (evt) {
      if (!isAppQuitting) {
          evt.preventDefault();
          mainWindow.hide();
      }
  });
};

// Define custom protocol handler. Deep linking works on packaged versions of the application!
app.setAsDefaultProtocolClient(`${config.PRODUCT_ID.toLowerCase()}`)


app.on('will-finish-launching', function () {
  // Protocol handler for osx
  app.on('open-url', function(event, url) {
    event.preventDefault()
    deeplinkingUrl = url
    logEverywhere('open-url# ' + deeplinkingUrl)
    if(mainWindow){
      mainWindow.webContents.send('ping', encodeURIComponent(deeplinkingUrl))
    }
  })
})

// Log both at dev console and at running node console instance
function logEverywhere(s) {
  console.log(s);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`console.log("${s}")`);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  clearInterval(intr);
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (BrowserWindow.getAllWindows().length === 0) {
  //   createWindow();
  // }
  mainWindow.show();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
