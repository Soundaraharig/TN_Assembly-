const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data';
const files = [
  path.join(base, 'Default', 'Local Storage', 'leveldb', '000123.ldb'),
  path.join(base, 'Default', 'Local Storage', 'leveldb', '000125.ldb'),
  path.join(base, 'Profile 1', 'Local Storage', 'leveldb', '000363.ldb'),
  path.join(base, 'Profile 1', 'Local Storage', 'leveldb', '000365.ldb'),
  path.join(base, 'Profile 2', 'Local Storage', 'leveldb', '000005.ldb'),
  path.join(base, 'Profile 2', 'Local Storage', 'leveldb', '000052.ldb'),
  path.join(base, 'Profile 2', 'Local Storage', 'leveldb', '000058.ldb')
];

function extractElections() {
  const targetBuf = Buffer.from('elections', 'utf8');

  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const buf = fs.readFileSync(f);
    let pos = 0;
    while ((pos = buf.indexOf(targetBuf, pos)) !== -1) {
      for (let i = pos; i < Math.min(pos + 200, buf.length - 2); i++) {
        if (buf[i] === 0x5b) { // '['
          let end = i + 1;
          let depth = 1;
          while (end < Math.min(buf.length, i + 50000)) {
            if (buf[end] === 0x5b) depth++;
            else if (buf[end] === 0x5d) {
              depth--;
              if (depth === 0) {
                end++;
                break;
              }
            }
            end++;
          }
          if (depth === 0) {
            const rawUtf8 = buf.slice(i, end).toString('utf8');
            try {
              const parsed = JSON.parse(rawUtf8);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
                console.log(`Found elections in ${f} (count: ${parsed.length}):`);
                parsed.forEach(e => {
                  console.log(`  Event: ${e.event_id} | Title: "${e.title}" | Status: ${e.status} | Votes: ${e.total_votes || 0} | Winner: ${e.winner || 'none'}`);
                  if (e.candidates && e.candidates.length > 0) {
                    console.log('    Candidates:', e.candidates);
                  }
                });
              }
            } catch (e) {}
          }
          break;
        }
      }
      pos += targetBuf.length;
    }
  }
}

extractElections();
