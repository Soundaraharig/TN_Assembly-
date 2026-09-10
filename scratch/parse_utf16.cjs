const fs = require('fs');

const f = 'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log';
const buf = fs.readFileSync(f);

// Let's decode UTF-16LE
const s16 = buf.toString('utf16le');
console.log('UTF-16LE total string length:', s16.length);

// Search for "JKKNCET"
let pos = s16.indexOf('JKKNCET');
console.log('JKKNCET pos in UTF-16LE:', pos);
if (pos !== -1) {
  // find preceding '['
  const startBracket = s16.lastIndexOf('[', pos);
  console.log('startBracket:', startBracket);
  if (startBracket !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = startBracket; i < s16.length; i++) {
      if (s16[i] === '[') depth++;
      else if (s16[i] === ']') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    console.log('end bracket:', end);
    if (end !== -1) {
      const jsonStr = s16.slice(startBracket, end + 1);
      try {
        const events = JSON.parse(jsonStr);
        console.log('Successfully parsed events! Count:', events.length);
        console.log(JSON.stringify(events, null, 2));
      } catch (e) {
        console.log('JSON parse error:', e.message);
        console.log('First 200 chars:', jsonStr.slice(0, 200));
        console.log('Last 200 chars:', jsonStr.slice(-200));
      }
    }
  }
}

// Search for learners in UTF-16LE (e.g. search for student names or "access_code")
let acPos = s16.indexOf('access_code');
console.log('access_code pos in UTF-16LE:', acPos);
if (acPos !== -1) {
  const startBracket = s16.lastIndexOf('[', acPos);
  if (startBracket !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = startBracket; i < s16.length; i++) {
      if (s16[i] === '[') depth++;
      else if (s16[i] === ']') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      const jsonStr = s16.slice(startBracket, end + 1);
      try {
        const learners = JSON.parse(jsonStr);
        console.log('Successfully parsed learners! Count:', learners.length);
      } catch (e) {
        console.log('Learners JSON parse error:', e.message);
      }
    }
  }
}
