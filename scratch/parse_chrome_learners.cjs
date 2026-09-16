const fs = require('fs');

const file = 'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000325.log';
const buf = fs.readFileSync(file);
const target = 'tn_assembly_learners_v6';
const idx = buf.indexOf(target);
console.log('Key index:', idx);

const startBracket = buf.indexOf('[', idx);
console.log('startBracket:', startBracket);

// Leveldb records have a length prefix or we can scan object by object
const rawStr = buf.slice(startBracket).toString('utf8');
// Find objects by regex
const matches = rawStr.match(/\{"id":"[a-f0-9\-]+"[^\}]+\}/g) || [];
console.log('Found object matches count:', matches.length);

const validLearners = [];
for (const m of matches) {
  try {
    const obj = JSON.parse(m);
    if (obj.id && obj.access_code) {
      validLearners.push(obj);
    }
  } catch (e) {}
}

console.log('Valid learners parsed:', validLearners.length);
if (validLearners.length > 0) {
  console.log('Sample parsed:', validLearners[0]);
  const withParty = validLearners.filter(l => l.party_name);
  const withConst = validLearners.filter(l => l.constituency_number);
  const withComm = validLearners.filter(l => l.committee_name);
  console.log('With party:', withParty.length);
  console.log('With const:', withConst.length);
  console.log('With comm:', withComm.length);
}
