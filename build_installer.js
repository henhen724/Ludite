const win_settings = {
    appDirectory: './builds/ludite-win32-x64',
    outputDirectory: './installers',
    authors: 'Henry Hunt',
    exe: './ludite.exe',
    setupMsi: 'Ludite.msi',
    setupExe: 'UpdateLudite.exe'
}

const mac_settings = {
    appPath: './builds/ludite-darwin-x64/ludite.app',
    name: 'Ludite',
    out: './installers',
    overwrite: true
}
var installPromise = null;
switch(process.platform){
    case "win32":
        const electronInstaller = require("electron-winstaller");
        installPromise = electronInstaller.createWindowsInstaller(win_settings);
        break;
    case "darwin":
        const createDMG = require('electron-installer-dmg');
        installPromise = new Promise((accept, reject) => {
            createDMG(mac_settings, err => {
                if(err)
                    reject(err);
                else
                    accept();
            })
        })
}


installPromise.then(() => {
    console.log("Installer Build Complete");
}).catch(err => {
    console.log("The installer builder through the following error:\n", err);
})