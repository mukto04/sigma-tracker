const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run next-on-pages build
console.log('Building with @cloudflare/next-on-pages...');
execSync('npx @cloudflare/next-on-pages', { stdio: 'inherit' });

// Create .assetsignore to prevent _worker.js being uploaded as asset
const assetsDir = path.join('.vercel', 'output', 'static');
const ignoreFile = path.join(assetsDir, '.assetsignore');
fs.writeFileSync(ignoreFile, '_worker.js\n');
console.log('Created .assetsignore to exclude _worker.js from assets.');
