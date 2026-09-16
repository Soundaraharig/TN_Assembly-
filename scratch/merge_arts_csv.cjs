const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'ARTS');
const files = [
  'arts party 1.csv',
  'arts party2.csv',
  'arts party3.csv',
  'arts party4.csv',
  'ARTS party5.csv'
];

let mergedLines = ['S.No,Student Name,Access Code,Constituency Number,Constituency Name,Allocated Party'];
let currentSNo = 1;

files.forEach(f => {
  const filePath = path.join(dir, f);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split(/\r?\n/).slice(1);
  lines.forEach(l => {
    if (!l.trim()) return;
    const parts = l.split(',');
    // Re-index S.No
    parts[0] = String(currentSNo++);
    mergedLines.push(parts.join(','));
  });
});

const mergedPath = path.join(dir, 'all_arts_80_delegates.csv');
fs.writeFileSync(mergedPath, mergedLines.join('\n'), 'utf8');
console.log(`✅ Merged all 5 party files into: ${mergedPath}`);
console.log(`Total delegates in merged CSV: ${mergedLines.length - 1}`);
