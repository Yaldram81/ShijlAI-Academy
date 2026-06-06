const { spawn } = require('child_process');
const fs = require('fs');

const logFd = fs.openSync('/home/z/my-project/dev.log', 'a');

const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
  cwd: '/home/z/my-project',
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
  detached: true,
  stdio: ['ignore', logFd, logFd]
});

child.unref();

console.log('Spawned next dev server with PID:', child.pid);
