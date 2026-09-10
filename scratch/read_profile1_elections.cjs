const fs = require('fs');

const buf = fs.readFileSync('C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000363.ldb');
const slice = buf.slice(100747, 106000);
const str = slice.toString('utf8');
const jsonStart = str.indexOf('[{"id"');
if (jsonStart !== -1) {
  const jsonEnd = str.lastIndexOf('}]') + 2;
  const json = str.slice(jsonStart, jsonEnd);
  try {
    const arr = JSON.parse(json);
    console.log('Total elections in Profile 1:', arr.length);
    arr.forEach((e, idx) => {
      console.log(`[${idx+1}] Event: ${e.event_id} | Title: "${e.title}" | Status: ${e.status} | Votes: ${e.total_votes} | Winner: ${e.winner}`);
      if (e.candidates && e.candidates.length > 0) {
        console.log('    Candidates:', e.candidates);
      }
    });
  } catch (err) {
    console.log('Error parsing JSON:', err.message);
    console.log('Raw start:', json.slice(0, 300));
  }
}
