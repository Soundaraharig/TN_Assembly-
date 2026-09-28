const fs = require('fs');
const line = fs.readFileSync('c:/Users/sound/Documents/GitHub/TN_Assembly-/scratch/raw_arts_line.txt', 'utf8');

const parts = line.split('\t');
console.log('Parts count by tab:', parts.length);
let jsonStr = '';
for (let i = 0; i < parts.length; i++) {
  if (parts[i].startsWith('{') && parts[i].includes('proceedings_questions')) {
    jsonStr = parts[i];
    console.log('Found JSON at part', i, 'length:', jsonStr.length);
    break;
  }
}

if (!jsonStr) {
  const idx = line.indexOf('\'{"');
  if (idx !== -1) {
    const end = line.indexOf("', 'jkkn-arts-tn-assembly-2026'");
    jsonStr = line.substring(idx + 1, end).replace(/''/g, "'");
  }
}

if (jsonStr) {
  let sc;
  try {
    sc = JSON.parse(jsonStr);
  } catch (e1) {
    try {
      const cleanJson = jsonStr.replace(/\\\\/g, '\\').replace(/\\t/g, '\t').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
      sc = JSON.parse(cleanJson);
    } catch (e2) {
      console.error('Failed to parse:', e2.message);
    }
  }

  if (sc) {
    const pqs = sc.proceedings_questions || [];
    console.log('Successfully extracted', pqs.length, 'questions!');
    pqs.forEach((q, i) => {
      console.log((i + 1) + '. ' + q.id + ' | ' + q.student_name + ' | chars: ' + (q.question_text || '').length);
      console.log('   Full text: ' + (q.question_text || '').replace(/\n/g, ' '));
    });
    fs.writeFileSync('c:/Users/sound/Documents/GitHub/TN_Assembly-/scratch/complete_original_questions.json', JSON.stringify(pqs, null, 2), 'utf8');
    console.log('Saved to scratch/complete_original_questions.json!');
  }
}
