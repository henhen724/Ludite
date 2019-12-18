const { workerId, testWorkerId, workerMsg, testWorkerMsg } = require("./config.js");
const activeWin = require("active-win");
const fs = require("fs");
const ipc = require("node-ipc");
const netstat = require("node-netstat");
const psList = require("ps-list");

ipc.config.id = workerId;
ipc.config.retry = 1500;
ipc.config.logger = console.log.bind(console);
ipc.serve(() => ipc.server.on(testWorkerMsg, message => {
  console.log(message);
}));

//USE NODEMAILER TO SEND EMAIL

var prosConnDict = {} //Process connection dictionary
var appProsDict = {} //Array of process objects
var currentApp = ""
var stateObj = { block_urls: [] }

loadStateFile = () => {
  fs.readFile(".luditedata", (err, data) => {
    if (err) console.log(err);
    try {
      stateObj = JSON.parse(data.toString())
      console.log(stateObj);
    } catch {
      // console.log("JSON parse failed.\n", data.toString());
    }
  })
}

fs.watch('.luditedata', (eventType, filename) => {
  loadStateFile();
})

//Find current window and set worker state
findWindows = async () => {
  window = await activeWin();
  // console.log(window);
  if (window != null && appProsDict[window.owner.name] != null) {
    //console.log("Window: ", window, "IP ADDRESS: ", appProsDict[window.owner.name]);
    currentApp = window.owner.name;
  }
  setTimeout(findWindows, 10000);
};

//Setup netstat listener for out going packets
netstat({ watch: true }, item => {
  if (!isNaN(item.remote.port) && item.remote.address != null && item.remote.address != '127.0.0.1') {
    if (prosConnDict[item.pid] === undefined)
      prosConnDict[item.pid] = []
    prevConn = prosConnDict[item.pid].find(addrtime => addrtime.address === item.remote.address)
    if (typeof prevConn === 'undefined' || prevConn === null)
      prosConnDict[item.pid].push({ address: item.remote.address, time: Date.now() })
    else
      prosConnDict[item.pid] = prosConnDict[item.pid].map(addrtime => {
        if (addrtime.address === item.remote.address)
          return { address: addrtime.address, time: Date.now() };
        else
          return addrtime;
      })
  }
});

updateProcessTable = async () => {
  var processTable = await psList();
  // console.log(processTable);
  if (typeof processTable === 'undefined' || processTable === null)
    return setTimeout(updateProcessTable, 1000)
  newAppProsDict = {}
  processTable.forEach(entry => {
    if (newAppProsDict[entry.name] === undefined)
      newAppProsDict[entry.name] = []
    newAppProsDict[entry.name].push(entry.pid)
  })
  appProsDict = newAppProsDict;
  setTimeout(updateProcessTable, 1000);
}

removeTimeoutConn = async () => {
  prosToSearch = Object.keys(prosConnDict);
  if (prosToSearch === [] || prosToSearch === undefined)
    setTimeout(removeTimeoutConn, 500);
  prosToSearch.forEach(pid => {
    prosConnDict[pid] = prosConnDict[pid].filter(addrtime => Date.now() - addrtime.time < 10000);
    if (prosConnDict[pid].length === 0)
      delete prosConnDict[pid];
  });
  setTimeout(removeTimeoutConn, 500);
}

printInfo = async () => {
  // console.clear();
  console.log("Open Connections:");
  console.table(Object.keys(prosConnDict).map((pid, index) => { return { 'pid': pid, 'address': prosConnDict[pid].map(addrtime => addrtime.address) }; }));
  console.log("App Process Dictionary:");
  console.table(Object.keys(appProsDict).map((app, index) => { return { 'Application': app, 'processes': appProsDict[app] } }));
  if (typeof currentApp !== 'undefined' && typeof appProsDict[currentApp] !== 'undefined') {
    console.log("Current Highlighted App: ", currentApp);
    console.log("Process Assosiated: ", appProsDict[currentApp]);
    console.log("Connection Assosiated: ")
    appProsDict[currentApp].forEach(pid => {
      if (typeof prosConnDict[pid] !== 'undefined')
        console.table(prosConnDict[pid]);
    });
  }
  setTimeout(printInfo, 1000);
}
//Start 3 async threads
ipc.server.start();
updateProcessTable();
removeTimeoutConn();
findWindows();
printInfo();
loadStateFile();