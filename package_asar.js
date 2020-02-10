const packager = require('electron-packager')

const bundleElectronApp = async options => {
    const appPaths = await packager(options)
    console.log(`Electron app bundles created:\n${appPaths.join("\n")}`)
}

bundleElectronApp({
    dir: "./",
    out: "./builds",
    overwrite: true,
    asar: true
});