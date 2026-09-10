const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data';
const profiles = ['Default', 'Profile 1', 'Profile 2'];

for (const p of profiles) {
  const ldbDir = path.join(base, p, 'Local Storage', 'leveldb');
  if (!fs.existsSync(ldbDir)) continue;
  const files = fs.readdirSync(ldbDir).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
  for (const f of files) {
    const fullPath = path.join(ldbDir, f);
    try {
      const buf = fs.readFileSync(fullPath);
      const str = buf.toString('latin1');
      if (str.includes('200fdd74')) {
        console.log(`Found 200fdd74 in ${p}/${f}!`);
      }
      if (str.includes('tnassembly')) {
        console.log(`Found tnassembly in ${p}/${f}! Size: ${buf.length}`);
      }
    } catch {}
  }
}
