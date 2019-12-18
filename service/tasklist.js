// DEPRECATED WINDOWS PROCESS TRACKER

const util = require('util');
const exec = util.promisify(require('child_process').exec)

module.exports = async () => {
    const { stdout, stderr } = await exec('TASKLIST /FO CSV /NH');
    if (stderr != '') {
        console.log(`TASKLIST /FO CSV /NH exited with error ${stderr}.`);
        return []
    }
    processes = stdout.split('\r\n');
    if (processes[0].slice(0, 4) == 'INFO')
        return [];
    processTable = [];
    processes = processes.slice(0, processes.length - 1);
    processes.forEach(str => {
        colums = str.split('\",\"').filter(ele => ele != '');
        colums[0] = colums[0].slice(1, colums[0].length);
        colums[colums.length - 1] = colums[colums.length - 1].slice(0, colums[colums.length - 1].length - 1);
        if (colums.length === 5) {
            processTable.push({
                name: colums[0],
                pid: colums[1],
                sessionName: colums[2],
                sessionNum: colums[3],
                memUse: colums[4]
            });
        }
        else
            console.log(colums);
    });
    // console.log(processTable);
    return processTable
}