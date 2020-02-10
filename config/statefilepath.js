var PATH = "";
var dataFolder = "";
switch (process.platform) {
    case 'win32':
        PATH = "C:\\ProgramData\\.luditedata";
        dataFolder = "C:\\ProgramData\\Ludite";
        break;
    case 'darwin':
        if(process.defaultApp ||
            /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
            /[\\/]electron[\\/]/.test(process.execPath))    
        {
            PATH = ".luditedata"
        }
        else {
            PATH = "Library/Caches/luditedata"
        }
        break;
    default:
        PATH = ".luditedata"
}

module.exports = {
    PATH,
    dataFolder
}