var PATH = "";
var dataFolder = "";
switch (process.platform) {
    case 'win32':
        PATH = "C:\\ProgramData\\.luditedata";
        dataFolder = "C:\\ProgramData\\Ludite";
        break;
    default:
        PATH = "./ludite"
}

module.exports = {
    PATH,
    dataFolder
}