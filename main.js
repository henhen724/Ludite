"using strict"

// Import parts of electron to use
const { app, BrowserWindow, Menu, ipcMain: ipc } = require("electron");
const forever = require('forever-monitor');
const { workerId, workerMsg, awakeMsg } = require("./service/config");
const path = require("path");
const url = require("url");
const { spawn } = require("child_process");
const {
  ADD_URL,
  DELETE_URL,
  EDIT_URL,
  RECEIVED_STATE,
  REQUEST_STATE
} = require("./src/actions/types");
const { PATH: statefilepath } = require("./config/statefilepath");
const { loadStateFile } = require("./config/util");
const defaultState = require("./config/defaultstate");
const fs = require("fs");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const mainMenuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Quit",
        accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
        click() {
          app.quit();
        }
      }
    ]
  }
];

// Keep a reference for dev mode
let dev = false;
if (
  process.defaultApp ||
  /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
  /[\\/]electron[\\/]/.test(process.execPath)
) {
  dev = true;
  mainMenuTemplate.push({
    label: "Developer Tools",
    submenu: [
      {
        label: "Toggle DevTools",
        accelerator: process.platform == "darwin" ? "Command+I" : "Ctrl+I",
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      }
    ]
  });
}


fileIpc.config.retry = 1;
fileIpc.config.stopRetrying = true;
let randNum = Math.random();
let connect = false;

function connectToWorker() {
  fileIpc.connectTo(workerId, () => {
    fileIpc.of[workerId].on('connect', () => {
      console.log("Connected to worker.");
    })
  });
}
connectToWorker();

async function startHiddenService() {
  var connected = false;
  const randNum = Math.random();
  fileIpc.of[workerId].on(workerMsg, data => {
    console.log("Connected with ", workerMsg, " seed: ", data);
    if(data === randNum)
      connected = true;
  });
  fileIpc.of[workerId].emit(awakeMsg, randNum);
  setTimeout(() => {
      if(!connected)
      {
        spawn("node",  [path.join(__dirname, '/service/worker.js')]);
        console.log("spawning worker.");
        setTimeout(connectToWorker, 500);
      }
      else
        console.log("Worker found: ", connected);
    }, 500);
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: { nodeIntegration: true }
  });

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  // and load the index.html of the app.
  let indexPath;
  if (dev && process.argv.indexOf("--noDevServer") === -1) {
    indexPath = url.format({
      protocol: "http:",
      host: "localhost:4000",
      pathname: "index.html",
      slashes: true
    });
  } else {
    indexPath = url.format({
      protocol: "file:",
      pathname: path.join(__dirname, "dist", "index.html"),
      slashes: true
    });
  }
  mainWindow.loadURL(indexPath);

  // Don't show until we are ready and loaded
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Open the DevTools automatically if developing
    if (dev) {
      // mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
if (process.argv.indexOf("--hidden") === -1)
  app.on("ready", () => {
    createWindow();
    startHiddenService();
  });
else app.on("ready", startHiddenService);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== "darwin") {
  //   app.quit();
  // }
  startHiddenService();
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

const buf = Buffer.alloc(256);

writeDefaultState = () => {
  fs.writeFile(statefilepath, JSON.stringify(defaultState), err => {
    if (err) {
      console.log("Unable to write file.");
      throw err;
    }
  });
}

//IPC event functions which write input from the render thread to file


try {
  fs.watch(statefilepath, (eventType, filename) => {
    console.log(eventType);
    loadStateFile().then(data => {
      stateObj = data;
      if(typeof mainWindow !== 'undefined' && mainWindow !== null)
        mainWindow.webContents.send(RECEIVED_STATE, stateObj);
    }).catch(error => console.log(error));
  })
}
catch (err) {
  console.log(err);
  writeDefaultState();
}

loadStateFile().then(data => {
  stateObj = data;
}).catch(error => console.log(error));

ipc.on(REQUEST_STATE, (event, arg) => {
  fs.readFile(statefilepath, "utf8", (err, data) => {
    if (err) throw err;
    console.log(data);
    event.sender.send(RECEIVED_STATE, JSON.parse(data));
  });
});

const performJsonActionOnFile = func => {
  fs.readFile(statefilepath, "utf8", (err, data) => {
    if (err) throw err;
    var stateObject = JSON.parse(data);
    stateObject = func(stateObject);
    console.log(stateObject);
    fs.writeFile(statefilepath, JSON.stringify(stateObject), "utf8", err => {
      if (err) throw err;
      console.log("Successfully saved.");
    });
  });
};

ipc.on(ADD_URL, (event, arg) => {
  console.log("A url was added", arg);
  performJsonActionOnFile(stateObj => {
    stateObj.block_urls.push(arg);
    return stateObj;
  });
});

ipc.on(DELETE_URL, (event, arg) => {
  console.log("A url was deleted", arg);
  performJsonActionOnFile(stateObj => {
    return stateObj.block_urls.filter(url => url.id == arg);
  });
});

ipc.on(EDIT_URL, (event, arg) => {
  console.log("A url was edit", arg);
  performJsonActionOnFile(stateObj => {
    stateObj.block_urls = stateObj.block_urls.map(url => {
      if (url.id == arg.id) {
        if (arg.maxvisits != null) url.maxvisits = arg.maxvisits;
        if (arg.dns != null) url.dns = arg.dns;
      }
      return url;
    });
    return stateObj
  });
});
