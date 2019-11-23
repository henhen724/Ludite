const ipc = require('node-ipc');

ipc.config.id = 'a-unique-process-name2';
ipc.config.retry = 1500;
ipc.config.logger = console.log.bind(console);
ipc.connectTo('a-unique-process-name1', () => {
    console.log("Made it here");
    // ipc.of['a-unique-process-name1'].on('connect', () => {
    //     ipc.of['a-unique-process-name1'].emit('a-unique-message-name', "The message we send");
    // });
});