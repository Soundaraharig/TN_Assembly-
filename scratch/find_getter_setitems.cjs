const fs = require('fs');
const content = fs.readFileSync('src/services/storageService.ts', 'utf8');
const lines = content.split('\n');

let currentMethod = 'unknown';
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/(?:public|private|protected)\s+(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/);
  if (m) {
    currentMethod = m[1];
  }
  if (line.includes('setItem(') || line.includes('setItemSafe(')) {
    console.log(`Line ${i + 1} [in ${currentMethod}]: ${line.trim()}`);
  }
}
