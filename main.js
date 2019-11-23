"using strict"

// Import parts of electron to use
const { app, BrowserWindow, Menu, ipcMain: ipc } = require("electron");
const path = require("path");
const url = require("url");
const { execFile } = require("child_process");
const {
  ADD_URL,
  DELETE_URL,
  EDIT_URL,
  RECEIVED_STATE,
  REQUEST_STATE
} = require("./src/actions/types");
const fs = require("fs");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, workerWindow;

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
let WORKER_PROCESS;
function startHiddenService() {
  WORKER_PROCESS = execFile("service/worker.js");
  WORKER_PROCESS.on('message', (msg, handel) => {
    console.log(masg, handel);
  });
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

const statefilepath = "luditeurllist.data";
const buf = Buffer.alloc(256);
//IPC event functions from the worker
ipc.on("message-from-worker", (event, arg) => {
  console.log(arg);
});

//IPC event functions which write input from the render thread to file

fs.access(statefilepath, err => {
  if (err) {
    fs.writeFile(statefilepath, "{}", err => {
      if (err) {
        console.log("Unable to write file.");
        throw err;
      }
    });
  }
});

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
    var stateobject = JSON.parse(data);
    stateobject = func(stateobject);
    console.log(stateobject);
    fs.writeFile(statefilepath, JSON.stringify(stateobject), "utf8", err => {
      if (err) throw err;
      console.log("Successfully saved.");
    });
  });
};

ipc.on(ADD_URL, (event, arg) => {
  console.log("A url was added", arg);
  performJsonActionOnFile(stateobj => {
    if (!stateobj.block_urls) stateobj.block_urls = [];
    stateobj.block_urls.push(arg);
    return stateobj;
  });
});

ipc.on(DELETE_URL, (event, arg) => {
  console.log("A url was deleted", arg);
  performJsonActionOnFile(stateobj => {
    if (!stateobj.block_urls) stateobj.block_urls = [];
    return stateobj.block_urls.filter(url => url.id == arg);
  });
});

ipc.on(EDIT_URL, (event, arg) => {
  console.log("A url was edit", arg);
});
