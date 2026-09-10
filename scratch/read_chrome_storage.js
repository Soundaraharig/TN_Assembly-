const fs = require('fs');
const path = require('path');

const profiles = ['Profile 1', 'Profile 2', 'Default'];
const results = [];

for (const profile of profiles) {
  const dir = `C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\${profile}\\Local Storage\\leveldb`;
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
  for (const f of files) {
    try {
      const fullPath = path.join(dir, f);
      const buf = fs.readFileSync(fullPath);
      const str = buf.toString('latin1');
      if (str.includes('tn_assembly') || str.includes('college_events') || str.includes('200fdd74') || str.includes('JKKNCET')) {
        results.push({ profile, file: f, size: buf.length, path: fullPath });
      }
    } catch (e) {
      // Locked or inaccessible
    }
  }
}

console.log('Matches found in files:', results);
