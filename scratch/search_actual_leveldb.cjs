const fs = require('fs');
const path = require('path');
const base = 'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data';

const levelDirs = [
  path.join(base, 'Default', 'Local Storage', 'leveldb'),
  path.join(base, 'Profile 1', 'Local Storage', 'leveldb'),
  path.join(base, 'Profile 2', 'Local Storage', 'leveldb')
];

for (const d of levelDirs) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.ldb') && !f.endsWith('.log')) continue;
    const full = path.join(d, f);
    const buf = fs.readFileSync(full);
    const str = buf.toString('latin1');
    if (str.includes('200fdd74') || str.includes('Assembly Speaker') || str.includes('Dhanush') || str.includes('Rohith')) {
      console.log('Match in:', full);
      ['Assembly Speaker', 'Rohith', 'Dhanush', 'Vishnupriya'].forEach(term => {
        let idx = 0;
        while ((idx = str.indexOf(term, idx)) !== -1) {
          console.log(`  Found [${term}] at ${idx}:`);
          console.log('   ', JSON.stringify(str.substring(Math.max(0, idx - 100), Math.min(str.length, idx + 300))));
          idx += term.length + 20;
        }
      });
    }
  }
}
