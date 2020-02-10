const electronInstaller = require("electron-winstaller");

const settings = {
    appDirectory: './builds/ludite-win32-x64',
    outputDirectory: './installers',
    authors: 'Henry Hunt',
    exe: './ludite.exe',
    setupMsi: 'Ludite.msi',
    setupExe: 'UpdateLudite.exe'
}

installPromise = electronInstaller.createWindowsInstaller(settings);

installPromise.then(() => {
    console.log("Installer Build Complete");
}).catch(err => {
    console.log("The Windows installer through the following error:\n", err);
})