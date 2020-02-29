var PATH = "";
var dataFolder = "";
var WORKERLOGPATH = "";
var WORKERERRPATH = "";
switch (process.platform) {
    case 'win32':
        PATH = "C:\\ProgramData\\.luditedata";
        dataFolder = "C:\\ProgramData\\Ludite";
        WORKERLOGPATH = "C:\\ProgramData\\luditeworker.log";
        WORKERERRPATH = "C:\\ProgramData\\luditeworker.err";
        break;
    case 'darwin':
        if (process.defaultApp ||
            /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
            /[\\/]electron[\\/]/.test(process.execPath)) {
            PATH = ".luditedata"
        }
        else {
            PATH = "Library/Caches/luditedata";
            WORKERLOGPATH = "tmp/luditeworker.log";
            WORKERERRPATH = "tmp/luditeworker.err";
        }
        break;
    default:
        PATH = ".luditedata"
        WORKERLOGPATH = "luditeworker.log"
        WORKERERRPATH = "luditeworker.err"
}

module.exports = {
    PATH,
    dataFolder,
    WORKERLOGPATH,
    WORKERERRPATH
}