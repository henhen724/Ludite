const { workerId, testWorkerId, workerMsg, testWorkerMsg } = require("./config.js");
const activeWin = require("active-win");
const fs = require("fs");
const ipc = require("node-ipc");
const netstat = require("node-netstat");
const ps = require('ps-node');

ipc.config.id = workerId;
ipc.config.retry = 1500;
ipc.config.logger = console.log.bind(console);
ipc.serve(() => ipc.server.on(testWorkerMsg, message => {
  console.log(message);
}));


//USE NODEMAILER TO SEND EMAIL

//Find current window and set worker state
findWindows = async () => {
  console.log("Find window");
  // window = await activeWin();
  // console.log("Window", window);
  setTimeout(findWindows, 10000);
};


prosConnDict = {} //A dictionary which defines the IP address 
                           //a process has most recently connected to

//Setup netstat listener for out going packets
capturePackets = async () => {
  netstat({}, item => 
    {
      if(!isNaN(item.remote.port) && item.remote.address != null && item.remote.address != '127.0.0.1')
        prosConnDict[item.pid] = item.remote.address
    });
  setTimeout(capturePackets, 10);
};

printInfo = async () => {
  console.log("Packet capture");
  console.log(prosConnDict);
  setTimeout(printInfo, 10000)
}
//Start 3 async threads
ipc.server.start();
findWindows();
capturePackets();
printInfo();