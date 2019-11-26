const { workerId, testWorkerId, workerMsg, testWorkerMsg } = require("./config.js");
const activeWin = require("active-win");
const fs = require("fs");
const ipc = require('node-ipc');

ipc.config.id = 'a-unique-process-name1';
ipc.config.socketRoot = __dirname + '\\';
ipc.config.retry = 1500;
ipc.config.logger = console.log.bind(console);
ipc.serve(() => ipc.server.on('a-unique-message-name', message => {
  console.log(message);
}));
ipc.server.start();

//PACKET SCRAPER
//USE NODEMAILER TO SEND EMAIL

findWindows = async () => {
  console.log("FIND WINDOW");
  window = await activeWin();
  console.log("Window", window);
  setTimeout(findWindows, 100);
};

findWindows();