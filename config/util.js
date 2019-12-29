const path = require("path");
const { PATH: statefilepath } = require('./statefilepath');
const fs = require("fs");
const { spawn } = require("child_process");

//JSON FILE LOAD
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

// NETSTAT JS WRAPER
// NETSTAT PARSERS
const parseAddress = raw => {
  var port = null,
      address = null;
  if (raw[0] == '[') {
      port = raw.substring(raw.lastIndexOf(':') + 1);
      address = raw.substring(1, raw.indexOf(']'));
  } else if (raw.indexOf(':') != raw.lastIndexOf(':')) {
      port = raw.substring(raw.lastIndexOf(':') + 1);
      address = raw.substring(0, raw.lastIndexOf(':'));
  } else if (raw.indexOf(':') == raw.lastIndexOf(':') && raw.indexOf(':') != -1) {
      var parts = raw.split(':');
      port = parts[1];
      address = parts[0] || null;
  } else if (raw.indexOf('.') != raw.lastIndexOf('.')) {
      port = raw.substring(raw.lastIndexOf('.') + 1);
      address = raw.substring(0, raw.lastIndexOf('.'));
  }

  if (address && (address == '::' || address == '0.0.0.0')) {
      address = null;
  }

  return {
      port: port ? parseInt(port) : null,
      address: address
  };
};


const normalizeValues = function (item) {
  item.protocol = item.protocol.toLowerCase();
  var parts = item.local.split(':');
  item.local = parseAddress(item.local);
  item.remote = parseAddress(item.remote);

  if (item.protocol == 'tcp' && item.local.address && ~item.local.address.indexOf(':')) {
      item.protocol = 'tcp6';
  }

  if (item.pid == '-') {
      item.pid = 0;
  } else if (~item.pid.indexOf('/')) {
      parts = item.pid.split('/');
      item.pid = parts.length > 1 ? parts[0] : 0;
  } else if (isNaN(item.pid)) {
      item.pid = 0;
  }

  item.pid = parseInt(item.pid);
  // console.log(item);
  return item;
};

let netstatparser;
let netstatcmd;
let netstatargs;

switch(process.platform)
{
  case 'linux':
    netstatparser = line => {
          var parts = line.split(/\s/).filter(String);
          if (!parts.length || parts[0].match(/^(tcp|udp)/) === null) {
              return;
          }
    
          // NOTE: insert null for missing state column on UDP
          if (parts[0].indexOf('udp') === 0) {
              parts.splice(5, 0, null);
          }
    
          var name = '';
          var pid = parts.slice(6, parts.length).join(" ");
          if (parseName && pid.indexOf('/') > 0) {
            var pidParts = pid.split('/');
            pid = pidParts[0];
            name = pidParts.slice(1, pidParts.length).join('/');
          }
    
          var item = {
              protocol: parts[0],
              local: parts[3],
              remote: parts[4],
              state: parts[5],
              pid: pid
          };
    
          return normalizeValues(item);
    };
    netstatcmd = 'netstat';
    netstatargs = ['-apntu'];
    break;
  case 'darwin':
    netstatparser = line => {
          var parts = line.split(/\s/).filter(String);
          if (!parts.length || (parts.length != 10 && parts.length != 12)) {
              return;
          }
    
          var item = {
              protocol: parts[0] == 'tcp4' ? 'tcp' : parts[0],
              local: parts[3],
              remote: parts[4],
              state: parts[5],
              pid: parts[8]
          };
    
          return normalizeValues(item);
    };
    netstatcmd = 'netstat';
    netstatargs = ['-v', '-n', '-p', 'tcp'];
    break;
  case 'win32':
    netstatparser = line => {
            var parts = line.split(/\s/).filter(String);
            if (!parts.length || (parts.length != 5 && parts.length != 4)) {
              return;
            };
    
            var item = {
                protocol: parts[0],
                local: parts[1],
                remote: parts[2],
                state: parts[3] || null,
                pid: parts[parts.length - 1]
            };
    
            return normalizeValues(item);
    };
    netstatcmd = 'netstat.exe';
    netstatargs = ['-a', '-n', '-o', '-p', 'TCP'];
    break;
  default:
    throw new Error("INVALID PLATFORM: ", process.platform);
}

// NETSTAT EXEC

const netstat = () => {
  // console.log(netstatcmd)
  // console.log(netstatparser)
  return new Promise((resolve, reject) => {
    const childprocess = spawn(netstatcmd, netstatargs, { detached: true } );
    var stdout = '';
    var stderr = '';
    childprocess.stdout.on('data', data => {
      stdout += data.toString();
    })
    childprocess.stderr.on('data', data => {
      stderr += data.toString();
    })
    childprocess.on('close', code => {
      if(code != 0)
        reject(new Error("NETSTAT THROUGH THE FOLLOWING ERRORS: ", stderr, "\nExit with code ", code));
      else{
        resolve(stdout.match(/[^\r\n]+/g).map(line => netstatparser(line)));
      }
    })
  });
}

//END OF NETSTAT CODE

//FASTLIST EXEC AND PARSER
const TEN_MEGABYTES = 1000 * 1000 * 10;

const fastlist = async () => {
	const bin = path.join(__dirname, '../node_modules/ps-list/fastlist.exe');
  const fullstdout = await new Promise((resolve, reject) => {
    const childprocess = spawn(bin, {maxBuffer: TEN_MEGABYTES, detached: true});
    var stdout = '';
    var stderr = '';
    childprocess.stdout.on('data', data => {
      stdout += data.toString();
    });
    childprocess.stderr.on('data', data => {
      stderr += data.toString();
    });
    childprocess.on('close', code => {
      if(code != 0)
        reject(new Error("FASTLIST THROUGH THE FOLLOWING ERRORS: ", stderr, "\nExit with code ", code));
      else{
        resolve(stdout);
      }
    });
  });

	return fullstdout
		.trim()
		.split('\r\n')
		.map(line => line.split('\t'))
		.map(([name, pid, ppid]) => ({
			name,
			pid: Number.parseInt(pid, 10),
			ppid: Number.parseInt(ppid, 10)
		}));
};

exports.loadStateFile = loadStateFile;
exports.netstat = netstat;
exports.fastlist = fastlist