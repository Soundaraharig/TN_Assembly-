const fs = require('fs');
const content = fs.readFileSync('src/services/storageService.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('proceedings_questions') && (l.includes('from(') || l.includes('select(') || l.includes('fetch'))) {
    console.log((i+1) + ': ' + l.trim());
  }
});
