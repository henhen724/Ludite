const { PATH: statefilepath } = require('./statefilepath');
const fs = require("fs");

loadStateFile = () => {
    return new Promise((resolve, reject) => {
      fs.readFile(statefilepath, (err, data) => {
        if (err) {
          console.log(err);
          reject({
            msg: 'An error occured while reading the state file.',
            error: err
          })
        }
        dataStr = data.toString();
        try {
          const stateObj = JSON.parse(dataStr);
          console.log(stateObj);
          resolve(stateObj)
        } catch (err) {
          console.log("Error: ", err)
          console.log("JSON parse failed.\nString: ", dataStr);
          console.log("Buffer ", data);
          reject({
            msg: 'An error occured while parsing the file.',
            error: err
          })
        }
      })
    })
  }

exports.loadStateFile = loadStateFile;