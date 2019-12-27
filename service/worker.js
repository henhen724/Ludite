const { workerId, testWorkerId, workerMsg, testWorkerMsg, awakeMsg } = require("./config.js");
const activeWin = require("active-win");
const fs = require("fs");
const ipc = require("node-ipc");
const netstat = require("node-netstat");
const psList = require("ps-list");
const defaultState = require("../config/defaultstate");
const { PATH: statefilepath } = require("../config/statefilepath");
const { loadStateFile } = require("../config/util");
const dns = require("dns");

ipc.config.id = workerId;
ipc.config.retry = 1;
ipc.config.logger = console.log.bind(console);
ipc.serve(() => ipc.server.on(awakeMsg, (data, socket) => {
  ipc.server.emit(socket, workerMsg, data);
}));

//USE NODEMAILER TO SEND EMAIL

var prosConnDict = {} //Process connection dictionary
var appProsDict = {} //App names to list of their process objects
var blockIP2Dns = {} //Keys are all IPs to track and their related dns
var currentApp = ""
var stateObj = defaultState

setBlockIPs = () => {
  // console.log(dns.getServers());
  stateObj.block_urls.forEach(urlObj => {
    dns.resolve(urlObj.dns, (err, addresses) => {
      if(err)
      {
        console.error("Error: ", err);
      }
      else
      {
        addresses.forEach(address => {
          // console.log("Address: ", address)
          blockIP2Dns[address] = urlObj.dns
        })
      }
    })
  })
  setTimeout(setBlockIPs, 10000);
}


saveState = () => {
  fs.writeFile(statefilepath, JSON.stringify(stateObj), err => {
    if(err)
      console.error(err);
    else
      console.log("File Saved.");
  })
}

try {
  fs.watch(statefilepath, (eventType, filename) => {
    loadStateFile().then(data => {
      stateObj = data;
      setBlockIPs();
    }).catch(error => console.log(error));
  })
}
catch (err) {
  console.error(err);
  console.log("Closing worker process.");
  if(err.code == 'ENOENT' || err.errno == -4058)
  {
    console.log("STATE FILE MISSING.");
    process.exit(-4058);
  }
  else
  {
    process.exit(1)
  }
}

//Find current window and set worker state
findWindows = async () => {
  window = await activeWin();
  // console.log(window);
  if (window != null && appProsDict[window.owner.name] != null) {
    if(currentApp !== window.owner.name)
    {
      currentApp = window.owner.name;
      appProsDict[currentApp].forEach(pid => {
        if (typeof prosConnDict[pid] !== 'undefined')
        {
          console.log("Checking\n", prosConnDict[pid], "\n\nAgainst\n", blockIP2Dns)
          prosConnDict[pid].forEach(addrtime => {
            if(typeof blockIP2Dns[addrtime.address] !== 'undefined')
            {
              stateObj.block_urls = stateObj.block_urls.map(urlObj => {
                if (urlObj.dns === blockIP2Dns[addrtime.address])
                  urlObj.visits += 1;
                return urlObj;
              })
              saveState();
            }
          });
        }
      });
    }
  }
  setTimeout(findWindows, 500);
};

//Setup netstat listener for out going packets
netstat({ watch: true }, item => {
  if (!isNaN(item.remote.port) && item.remote.address != null && item.remote.address != '127.0.0.1') {
    if (prosConnDict[item.pid] === undefined)
      prosConnDict[item.pid] = []
    prevConn = prosConnDict[item.pid].find(addrtime => addrtime.address === item.remote.address)
    if (typeof prevConn === 'undefined' || prevConn === null)
    {
      prosConnDict[item.pid].push({ address: item.remote.address, time: Date.now() });
      if(typeof blockIP2Dns[item.remote.address] !== 'undefined')
      {
        stateObj.block_urls = stateObj.block_urls.map(urlObj => {
          if (urlObj.dns === blockIP2Dns[item.remote.address])
            urlObj.visits += 1;
          return urlObj;
        })
        saveState();
      }
    }
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
      newAppProsDict[entry.name] = [];
    newAppProsDict[entry.name].push(entry.pid);
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
  console.clear();
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
  setTimeout(printInfo, 3000);
}

loadStateFile().then(data => {
  stateObj = data;
  setBlockIPs();
}).catch(error => console.log(error));

//Start 3 async threads
ipc.server.start();
updateProcessTable();
removeTimeoutConn();
findWindows();
// printInfo();