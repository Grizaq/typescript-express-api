// cleanup.js
const fs = require('fs');
const path = require('path');

// Directories to scan for JS files that should be removed
const dirsToClean = [
  'src',
  'dist'
];

// File extensions to look for and remove
const extensionsToRemove = [
  '.js',
  '.js.map'
];

// Directories to skip (e.g., node_modules)
const skipDirs = [
  'node_modules',
  'coverage',
  'dist'
];

// Counter for statistics
let removed = 0;

// Recursively scan directories
function cleanDir(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    // If it's a directory, recursively clean it (unless it's in the skip list)
    if (stat.isDirectory() && !skipDirs.includes(item)) {
      cleanDir(fullPath);
      continue;
    }
    
    // If it's a file with an extension we want to remove
    if (stat.isFile()) {
      const ext = path.extname(item);
      const baseExt = path.extname(path.basename(item, ext)); // For .js.map files
      
      if (extensionsToRemove.includes(ext) || 
          (ext === '.map' && baseExt === '.js')) {
        // Check if there's a corresponding .ts file
        const tsFile = fullPath.replace(/\.js(\.map)?$/, '.ts');
        
        if (fs.existsSync(tsFile)) {
          console.log(`Removing ${fullPath}`);
          fs.unlinkSync(fullPath);
          removed++;
        }
      }
    }
  }
}

// Start the cleaning process
console.log('Starting cleanup of generated JavaScript files...');
for (const dir of dirsToClean) {
  cleanDir(dir);
}
console.log(`Cleanup complete. Removed ${removed} files.`);