const { workerId, testWorkerId, awakeMsg, testWorkerMsg } = require("./config.js");
const exec = require('child_process').exec;

const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}

const ipc = require('node-ipc');

ipc.config.id = testWorkerId;
ipc.config.retry = 1;
ipc.config.maxRetries = true;
ipc.config.stopRetrying = true;
ipc.config.logger = console.log.bind(console);

sendTestMsg = () => {
    ipc.of[workerId].emit(awakeMsg, "The message we send");
    setTimeout(sendTestMsg, 10000)
};

var connected = false;

ipc.connectTo(workerId, () => {
    ipc.of[workerId].on('connect', () => {
        //sendTestMsg();
        ipc.log('## connected to world ##'.rainbow, ipc.config.delay);
        connected = true;
    });
    ipc.of[workerId].on(
        'disconnect',
        function(){
            ipc.log('disconnected from world'.notice);
            connected = false;
        }
    );
});


setTimeout(() => {
    if(connected)
        console.log("IS CONNECTED.");
    else
        console.log("NOT CONNECTED.");
}, 10000)

// ps.lookup({command: 'node', psargs: 'ux'},
//     (err, rsltLst) => {
//         rsltLst.forEach(function( process ){
//             if( process ){
//                 console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
//             }
//         });
//     }
// )

