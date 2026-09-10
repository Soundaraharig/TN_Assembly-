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
  // Search for UTF-16 or UTF-8 occurrences of 200fdd74
  const str8 = buf.toString('utf8');
  const str16 = buf.toString('utf16le');
  
  if (str8.includes('200fdd74') || str16.includes('200fdd74')) {
    console.log(`\n=== Found 200fdd74 in ${f} ===`);
    // Find snippets around 200fdd74
    const s = str8.includes('200fdd74') ? str8 : str16;
    let idx = 0;
    while ((idx = s.indexOf('200fdd74', idx)) !== -1) {
      const start = Math.max(0, idx - 100);
      const end = Math.min(s.length, idx + 400);
      console.log('Snippet:', JSON.stringify(s.substring(start, end)));
      idx += 8;
    }
  }

  // Search for tn_assembly_events
  if (str8.includes('tn_assembly_events') || str16.includes('tn_assembly_events')) {
    console.log(`\n=== Found tn_assembly_events in ${f} ===`);
    const s = str8.includes('tn_assembly_events') ? str8 : str16;
    let idx = 0;
    while ((idx = s.indexOf('tn_assembly_events', idx)) !== -1) {
      const start = Math.max(0, idx - 50);
      const end = Math.min(s.length, idx + 800);
      console.log('Events Snippet:', JSON.stringify(s.substring(start, end)));
      idx += 18;
    }
  }
}
