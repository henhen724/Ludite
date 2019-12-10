const { workerId, testWorkerId, workerMsg, testWorkerMsg } = require("./config.js");
const ipc = require('node-ipc');

ipc.config.id = testWorkerId;
ipc.config.retry = 1500;
ipc.config.logger = console.log.bind(console);

sendTestMsg = () => {
    ipc.of[workerId].emit(testWorkerMsg, "The message we send");
    setTimeout(sendTestMsg, 10000)
};

ipc.connectTo(workerId, () => {
    ipc.of[workerId].on('connect', () => {
        sendTestMsg();
    });
});
    

