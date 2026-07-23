const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../public/logo-transparent.png');
const dest = path.join(__dirname, '../public/logo.png');

fs.copyFileSync(src, dest);
console.log('Successfully updated public/logo.png with transparent version!');
