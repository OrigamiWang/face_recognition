const { exec } = require('child_process');
const server = require('./server.js');

// 等待服务器启动
setTimeout(() => {
  // 打开默认浏览器
  const url = 'http://localhost:8668';
  switch (process.platform) {
    case 'darwin':
      exec(`open ${url}`);
      break;
    case 'win32':
      exec(`start ${url}`);
      break;
    default:
      exec(`xdg-open ${url}`);
  }
}, 1000);