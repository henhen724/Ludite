"using strict"

const { app, BrowserWindow, Menu, ipcMain: ipc } = require("electron");
const forever = require('forever-monitor');
const { workerId, workerMsg, awakeMsg } = require("./service/config");
const path = require("path");
const url = require("url");
const {
  ADD_URL,
  DELETE_URL,
  EDIT_URL,
  EDIT_USR,
  EDIT_REF,
  EDIT_STR,
  EDIT_END,
  RECEIVED_STATE,
  REQUEST_STATE
} = require("./src/actions/types");
const { PATH: statefilepath } = require("./config/statefilepath");
const { loadStateFile, foreverlist } = require("./config/util");
const defaultState = require("./config/defaultstate");
const fs = require("fs");

//Write default state to the state file (Used when statefile is missing or otherwise corrupted)
writeDefaultState = () => {
  fs.writeFile(statefilepath, JSON.stringify(defaultState), err => {
    if (err) {
      console.log("Unable to write file.");
      throw err;
    }
  });
}

//Load/create statefile and watch for changes made by the worker
loadStateFile().then(data => {
  stateObj = data;
}).catch(err => {
  console.log(err);
  writeDefaultState();
});

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
  if(err.code === 'ENOENT')
    writeDefaultState();
}

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

const performJsonActionOnFile = func => {
  return new Promise((resolve, reject) => {
    fs.readFile(statefilepath, "utf8", (err, data) => {
      if (err) reject(err);
      try{
        var stateObject = JSON.parse(data);
        stateObject = func(stateObject);
        console.log(stateObject);
        fs.writeFile(statefilepath, JSON.stringify(stateObject), "utf8", err => {
          if (err) reject(err);
          console.log("Successfully saved.");
          resolve(stateObject);
        });
      } catch(err) {
        console.log(err);
        setTimeout(() => performJsonActionOnFile(func).then(rslt => resolve(rslt)), 500);
      }
    });
  });
};

const startHiddenService = async () => {
  const start = Date.now();
  performJsonActionOnFile(stateObj => {
    stateObj.msg = awakeMsg;
    return stateObj;
  }).then(() => {
    const interval = Date.now() - start;
    setTimeout(() => {
      loadStateFile().then(stateObj => {
        if(stateObj.msg !== workerMsg)
        {
          const child = new (forever.Monitor)(path.join(__dirname, "service", "worker.js"), {max: 1, uid: workerId, outFile: './service/worker.log'});
          child.on('exit:code', code => {
            console.error("Worker exited with code: " + code);
          });
          child.start();
      }
      })
    }, 5*interval);
  })
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    backgroundColor: '#574c4f',
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: { nodeIntegration: true },
    icon: path.join(__dirname, "public", "favicon.ico")
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
else {
  app.on("ready", () => {
    startHiddenService();
    process.exit(0);
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== "darwin") {
  //   app.quit();
  // }
  startHiddenService();
  process.exit(0);
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

const buf = Buffer.alloc(256);

//IPC event functions which write input from the render thread to file


ipc.on(REQUEST_STATE, (event, arg) => {
  fs.readFile(statefilepath, "utf8", (err, data) => {
    if (err) throw err;
    console.log(data);
    event.sender.send(RECEIVED_STATE, JSON.parse(data));
  });
});

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

ipc.on(EDIT_STR, (event, arg) => {
  console.log("The start time was changed", arg);
  performJsonActionOnFile(stateObj => {
    stateObj.start_time = arg
    return stateObj
  });
});

ipc.on(EDIT_END, (event, arg) => {
  console.log("A url was edit", arg);
  performJsonActionOnFile(stateObj => {
    stateObj.end_time = arg
    return stateObj
  });
});

ipc.on(EDIT_USR, (event, arg) => {
  console.log("A user email changed", arg);
  performJsonActionOnFile(stateObj => {
    stateObj.user_email = arg;
    return stateObj;
  });
});

ipc.on(EDIT_REF, (event, arg) => {
  console.log("A url was edit", arg);
  performJsonActionOnFile(stateObj => {
    stateObj.ref_email = arg;
    return stateObj;
  });
});