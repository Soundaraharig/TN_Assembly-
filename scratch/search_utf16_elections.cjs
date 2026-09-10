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
  if (fs.existsSync(f)) {
    const buf = fs.readFileSync(f);
    // search for 'elections' in utf16le
    const needle = Buffer.from('elections', 'utf16le');
    let pos = 0;
    while ((pos = buf.indexOf(needle, pos)) !== -1) {
      console.log(`Found 'elections' (utf16le) in ${f} at ${pos}`);
      const str = buf.slice(Math.max(0, pos - 100), Math.min(buf.length, pos + 1000)).toString('utf16le');
      console.log('Context:', str.slice(0, 300));
      pos += needle.length;
    }

    // also search for 'elections' in utf8
    const needleUtf8 = Buffer.from('tn_assembly_elections', 'utf8');
    pos = 0;
    while ((pos = buf.indexOf(needleUtf8, pos)) !== -1) {
      console.log(`Found 'tn_assembly_elections' (utf8) in ${f} at ${pos}`);
      const str = buf.slice(Math.max(0, pos - 100), Math.min(buf.length, pos + 1000)).toString('utf8');
      console.log('Context:', str.slice(0, 300));
      pos += needleUtf8.length;
    }
  }
}
