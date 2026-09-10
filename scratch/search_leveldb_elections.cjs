const fs = require('fs');
const path = require('path');

function searchBufferForElections(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const buf = fs.readFileSync(filePath);
  const text = buf.toString('latin1');
  const results = [];

  // Look for any string containing "Ruling Party Leader" or "Assembly Speaker Election" or "Election"
  // with "Closed" or "winner" or "votes"
  const regex = /\{[^{}]*?"title"[^{}]*?"status"[^{}]*?\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      // try to parse JSON
      const parsed = JSON.parse(match[0]);
      if (parsed.title && parsed.status) {
        results.push(parsed);
      }
    } catch {
      // not strict JSON
    }
  }

  // Also check for larger JSON blocks
  const arrayRegex = /\[\{"id":"[^"]+?"[^{}]+?"title":[^]+?\}\]/g;
  let arrMatch;
  while ((arrMatch = arrayRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(arrMatch[0]);
      if (Array.isArray(parsed) && parsed[0]?.title) {
        results.push(...parsed);
      }
    } catch {}
  }

  return results;
}

const targetFiles = [
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000191.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000192.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000193.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000005.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000007.ldb'
];

console.log('=== SEARCHING CHROME LEVELDB FOR ALL HISTORICAL ELECTIONS ===');
for (const f of targetFiles) {
  const found = searchBufferForElections(f);
  if (found.length > 0) {
    console.log(`Found in ${f}: ${found.length} election records`);
    found.forEach(e => {
      console.log(`  Event: ${e.event_id} | Title: "${e.title}" | Status: ${e.status} | Winner: ${e.winner}`);
    });
  }
}
