const fs = require('fs');

const files = [
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000191.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000192.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000193.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000005.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000007.ldb'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const buf = fs.readFileSync(f);
  const s16 = buf.toString('utf16le');
  const pos = s16.indexOf('JKKNCET');
  if (pos !== -1) {
    console.log(`\n=== JKKNCET in ${f} (pos: ${pos}) ===`);
    console.log(s16.slice(pos - 100, pos + 1500));
  }
}
