const { spawn } = require("child_process");
setInterval(() => spawn("echo", ["hello"], { detached: true }), 500); 
