const fs = require("fs");
//const { PATH: statefilepath, WORKERERRPATH, WORKERLOGPATH } = require("../config/statefilepath");
const statefilepath = "C:\\ProgramData\\.luditedata";
const WORKERLOGPATH = "C:\\ProgramData\\luditeworker.log";
const WORKERERRPATH = "C:\\ProgramData\\luditeworker.err";
//Setting output to pipe to the worker log file
const workerLog = fs.createWriteStream(WORKERLOGPATH);
process.stdout.write = workerLog.write.bind(workerLog);
//Setting error output to pipe to the worker err file
const workerErr = fs.createWriteStream(WORKERERRPATH);
process.stderr.write = workerErr.write.bind(workerErr);

process.on('uncaughtException', err => {
  console.log("THE WORKER THROWS AN ERROR");
  console.error("THE WORKER THROWS THE FOLLOWING ERROR:\n", (err && err.stack) ? err.stack : err);
  setTimeout(() => process.exit(1), 1000);
});

const activeWin = require("active-win");
const psList = require("ps-list");
const defaultState = require("../config/defaultstate");
const { loadStateFile, netstat, fastlist, duringInterval, sendEmail } = require("../config/util");
const { awakeMsg, workerMsg } = require("./config");
const dns = require("dns");

//USE NODEMAILER TO SEND EMAIL

var prosConnDict = {} //Process connection dictionary
var appProsDict = {} //App names to list of their process objects
var blockIP2Dns = {} //Keys are all IPs to track and their related dns
var currentApp = ""
var stateObj = defaultState

setBlockIPs = () => {
  // console.log(dns.getServers());
  if (typeof stateObj.block_urls === 'undefined')
    return setTimeout(setBlockIPs, 10000)
  stateObj.block_urls.forEach(urlObj => {
    dns.resolve(urlObj.dns, (err, addresses) => {
      if (err) {
        if (err.code === 'ENODATA')
          stateObj.block_urls = stateObj.block_urls.map(urlObj2 => {
            if (urlObj2.dns === urlObj.dns)
              urlObj2.error = 'The url you gave isn\'t invalid.'
            return urlObj2
          });
        else
          console.error("Error: ", err);
      }
      else {
        addresses.forEach(address => {
          // console.log("Address: ", address)
          blockIP2Dns[address] = { dns: urlObj.dns, time: Date.now() }
        })
      }
    })
  })
  setTimeout(setBlockIPs, 10000);
}


saveState = () => {
  fs.writeFile(statefilepath, JSON.stringify(stateObj), err => {
    if (err)
      console.error(err);
    else
      console.log("File Saved.");
  })
}

loadStateFile().then(data => {
  stateObj = data;
  if (stateObj.msg === awakeMsg) {
    stateObj.msg = workerMsg;
    console.log("Awake recieved.");
    saveState();
  }
  setBlockIPs();
}).catch(error => console.log(error));

try {
  fs.watch(statefilepath, (eventType, filename) => {
    loadStateFile().then(data => {
      stateObj = data;
      if (stateObj.msg === awakeMsg) {
        stateObj.msg = workerMsg;
        console.log("Awake recieved.");
        saveState();
      }
      setBlockIPs();
    }).catch(error => console.log(error));
  })
}
catch (err) {
  console.error(err);
  console.log("Closing worker process.");
  if (err.code == 'ENOENT' || err.errno == -4058) {
    console.log("STATE FILE MISSING.");
    process.exit(-4058);
  }
  else {
    process.exit(1)
  }
}

//Find current window and set worker state
findWindows = async () => {
  window = await activeWin();
  if (typeof window === 'undefined')
    return setTimeout(findWindows, 500);
  // console.log(window);
  if (process.platform === 'darwin') {
    const possiblename = window.owner.path.split("/").find(dir => dir.split('.app').length > 1);
    if (typeof possiblename !== 'undefined')
      window.owner.name = window.owner.path.split("/").find(dir => dir.split('.app').length > 1).split(".app")[0]
  }
  if (window != null && appProsDict[window.owner.name] != null) {
    if (currentApp !== window.owner.name) {
      currentApp = window.owner.name;
      appProsDict[currentApp].forEach(pid => {
        if (typeof prosConnDict[pid] !== 'undefined') {
          // console.log("Checking\n", prosConnDict[pid], "\n\nAgainst\n", blockIP2Dns)
          prosConnDict[pid].forEach(addrtime => {
            if (typeof blockIP2Dns[addrtime.address] !== 'undefined' && duringInterval(stateObj.start_time, stateObj.end_time)) {
              console.log("Added site based on window highlight")
              stateObj.block_urls = stateObj.block_urls.map(urlObj => {
                if (urlObj.dns === blockIP2Dns[addrtime.address].dns) {
                  urlObj.visits += 1;
                  if (urlObj.visits >= urlObj.maxvisits)
                    sendEmail(urlObj.dns, stateObj.user_email, stateObj.ref_email);
                }
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
const updateProsConnDict = () => {
  netstat().then(itemlist => {
    itemlist.forEach(item => {
      if (!item)
        return;
      if (item.state === 'ESTABLISHED' && !isNaN(item.remote.port) && item.remote.address != null && item.remote.address != '127.0.0.1') {
        if (prosConnDict[item.pid] === undefined)
          prosConnDict[item.pid] = []
        prevConn = prosConnDict[item.pid].find(addrtime => addrtime.address === item.remote.address)
        if (typeof prevConn === 'undefined' || prevConn === null) {
          prosConnDict[item.pid].push({ address: item.remote.address, time: Date.now() });
          if (typeof blockIP2Dns[item.remote.address] !== 'undefined' && duringInterval(stateObj.start_time, stateObj.end_time)) {
            console.log("Adding site from connection.");
            stateObj.block_urls = stateObj.block_urls.map(urlObj => {
              if (urlObj.dns === blockIP2Dns[item.remote.address].dns)
                urlObj.visits += 1;
              if (urlObj.visits >= urlObj.maxvisits)
                sendEmail(urlObj.dns, stateObj.user_email, stateObj.ref_email);
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
    })
    setTimeout(updateProsConnDict, 500);
  });
}

updateProcessTable = async () => {
  var processTable;
  if (process.platform === 'win32')
    processTable = await fastlist();
  else {
    processTable = await psList();
  }
  // console.log(processTable);
  if (typeof processTable === 'undefined' || processTable === null)
    return setTimeout(updateProcessTable, 1000)
  newAppProsDict = {}
  processTable.forEach(entry => {
    if (process.platform === 'darwin') {
      const possiblename = entry.cmd.split("/").find(dir => dir.split('.app').length > 1);
      if (typeof possiblename !== 'undefined')
        entry.name = entry.cmd.split("/").find(dir => dir.split('.app').length > 1).split(".app")[0]
    }
    if (newAppProsDict[entry.name] === undefined)
      newAppProsDict[entry.name] = [];
    newAppProsDict[entry.name].push(entry.pid);
  })
  appProsDict = newAppProsDict;
  setTimeout(updateProcessTable, 1000);
}

removeTimeoutConn = async () => {
  // Remove connection which have timeout from the netstat table
  prosToSearch = Object.keys(prosConnDict);
  if (prosToSearch === [] || prosToSearch === undefined)
    setTimeout(removeTimeoutConn, 500);
  prosToSearch.forEach(pid => {
    prosConnDict[pid] = prosConnDict[pid].filter(addrtime => Date.now() - addrtime.time < 1000);
    if (prosConnDict[pid].length === 0)
      delete prosConnDict[pid];
  });
  // Do the same thing for the blockIP2Dns table
  addrToSearch = Object.keys(blockIP2Dns);
  if (addrToSearch === [] || addrToSearch === undefined)
    setTimeout(removeTimeoutConn, 500);
  addrToSearch.forEach(address => {
    if (Date.now() - blockIP2Dns[address].time >= 100000)
      delete blockIP2Dns[address];
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
  console.table(Object.keys(blockIP2Dns).map((address, index) => { return { 'dns': blockIP2Dns[address].dns, 'address': address } }));
  setTimeout(printInfo, 3000);
}

//Start 3 async threads
updateProcessTable();
updateProsConnDict();
removeTimeoutConn();
findWindows();
printInfo();