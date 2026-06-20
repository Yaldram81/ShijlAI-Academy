const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  try {
    fs.mkdirSync(to, { recursive: true });
    fs.cpSync(from, to, { recursive: true });
    console.log(`Successfully copied ${from} to ${to}`);
  } catch (err) {
    console.error(`Error copying ${from} to ${to}:`, err);
    process.exit(1);
  }
}

// 1. Copy .next/static to .next/standalone/.next/static
const nextStaticSrc = path.join(__dirname, '../.next/static');
const nextStaticDest = path.join(__dirname, '../.next/standalone/.next/static');
if (fs.existsSync(nextStaticSrc)) {
  copyFolderSync(nextStaticSrc, nextStaticDest);
} else {
  console.warn('.next/static directory does not exist, skipping copy.');
}

// 2. Copy public to .next/standalone/public
const publicSrc = path.join(__dirname, '../public');
const publicDest = path.join(__dirname, '../.next/standalone/public');
if (fs.existsSync(publicSrc)) {
  copyFolderSync(publicSrc, publicDest);
} else {
  console.warn('public directory does not exist, skipping copy.');
}
