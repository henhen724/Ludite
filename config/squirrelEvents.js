module.exports = handleSquirrelEvent = app => {
    if (process.argv.length === 1)
        return false; //The exit the event handler when the app is called with no squirrel event

    const squirrelCmd = process.argv[1];
    switch (squirrelCmd) {
        case '--squirrel-install':
            // fs.stat(dataFolder, (err, stats) => {
            //   if (err.code === 'ENOENT') {
            //     fs.mkdir(dataFolder, err => {
            //       if (err) {
            //         throw err;
            //       }
            //     });
            //   }
            //   else if (err) {
            //     throw err;
            //   }
            //   else {
            //     if (!stats.isDirectory()) {
            //       fs.unlink(dataFolder, err => {
            //         if (err)
            //           throw err;
            //         else {
            //           fs.mkdir(dataFolder, err => {
            //             throw err;
            //           });
            //         }
            //       })
            //     }
            //   }
            // })
            return true
        case '--squirrel-updated':
            return true;
        case '--squirrel-uninstall':
            // fs.rmdir(dataFolder, err => {
            //   if (err)
            //     throw err;
            // })
            return true;
        case '--squirrel-obsolete':
            return true;
        default:
            return false; //Also exit the handler is the command is not recognized squirrel command
    }
}