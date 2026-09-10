const fs = require('fs');

const targetFiles = [
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000191.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000192.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000193.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000005.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000007.ldb'
];

for (const f of targetFiles) {
  if (!fs.existsSync(f)) continue;
  const buf = fs.readFileSync(f);
  const str8 = buf.toString('utf8');
  
  if (str8.includes('elections_v6') || str8.includes('Assembly Speaker Election')) {
    console.log(`\n=== Found in ${f} ===`);
    let idx = 0;
    while ((idx = str8.indexOf('elections_v6', idx)) !== -1) {
      const start = Math.max(0, idx - 50);
      const end = Math.min(str8.length, idx + 2000);
      console.log('ELECTIONS SNIPPET:', str8.substring(start, end));
      idx += 12;
    }
    idx = 0;
    while ((idx = str8.indexOf('Assembly Speaker Election', idx)) !== -1) {
      const start = Math.max(0, idx - 50);
      const end = Math.min(str8.length, idx + 500);
      console.log('SPEAKER SNIPPET:', str8.substring(start, end));
      idx += 25;
    }
  }
}
