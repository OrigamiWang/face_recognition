const { execSync } = require('child_process');

try {
  console.log('Attempting to close Face Recognition...');
  execSync('taskkill /F /IM "Face Recognition.exe"', { stdio: 'ignore' });
} catch (error) {
  console.log('Face Recognition was not running or could not be closed.');
}

console.log('Waiting for processes to close...');
setTimeout(() => {
  console.log('Continuing with installation...');
}, 5000);