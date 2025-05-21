const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the out directory exists
if (!fs.existsSync(path.join(__dirname, 'out'))) {
  console.log('Creating out directory...');
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
}

// Compile TypeScript
console.log('Compiling TypeScript...');
try {
  execSync('npm run compile', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to compile TypeScript:', error);
  process.exit(1);
}

// Package the extension
console.log('Packaging extension...');
try {
  execSync('npx vsce package', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to package extension:', error);
  process.exit(1);
}

console.log('Extension packaged successfully!');