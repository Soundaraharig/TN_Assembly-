const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data';
const filesToCheck = [
  'Profile 1/000363.ldb',
  'Profile 1/000365.ldb',
  'Profile 2/000052.ldb',
  'Profile 2/000057.log',
  'Profile 2/000058.ldb',
  'Default/000123.ldb'
];

console.log('=== EXTRACTING DATA FROM CHROME STORAGE ===\n');

for (const rel of filesToCheck) {
  const p = path.join(base, rel.replace('/', path.sep));
  if (!fs.existsSync(p)) continue;
  const buf = fs.readFileSync(p);

  // Search for UTF-16 or UTF-8 strings
  // In Chromium, keys often look like: _https://tnassembly.vercel.app\x00\x01<key_name>
  const latin1 = buf.toString('latin1');
  
  // Find elections
  const elecIndices = [];
  let idx = 0;
  while ((idx = latin1.indexOf('tn_assembly_elections', idx)) !== -1) {
    elecIndices.push(idx);
    idx += 21;
  }

  if (elecIndices.length > 0) {
    console.log(`[${rel}] Found 'tn_assembly_elections' at ${elecIndices.length} positions:`, elecIndices);
    elecIndices.forEach(pos => {
      // slice next 4000 bytes
      const slice = buf.slice(pos, pos + 4000);
      const u8 = slice.toString('utf8');
      const u16 = slice.toString('utf16le');
      // Look for JSON array in either
      const m8 = u8.match(/\[\{.+?\}\]/);
      const m16 = u16.match(/\[\{.+?\}\]/);
      if (m8) {
        try {
          const parsed = JSON.parse(m8[0]);
          console.log(`  Parsed JSON (utf8, length ${parsed.length}):`, parsed.map(e => ({ id: e.id, title: e.title, status: e.status, votes: e.total_votes, winner: e.winner })));
        } catch (e) {
          console.log('  utf8 match found but JSON.parse failed:', m8[0].slice(0, 100));
        }
      }
      if (m16) {
        try {
          const parsed = JSON.parse(m16[0]);
          console.log(`  Parsed JSON (utf16le, length ${parsed.length}):`, parsed.map(e => ({ id: e.id, title: e.title, status: e.status, votes: e.total_votes, winner: e.winner })));
        } catch (e) {
          console.log('  utf16le match found but JSON.parse failed:', m16[0].slice(0, 100));
        }
      }
    });
  }
}
