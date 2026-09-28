const fs = require('fs');
const readline = require('readline');
const stream = fs.createReadStream('c:/Users/sound/Documents/GitHub/TN_Assembly-/supabase-production-backup-2026-09-24-1800/database/data.sql');
const rl = readline.createInterface({ input: stream });

rl.on('line', (line) => {
  if (line.includes('05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8')) {
    console.log('Found line in data.sql! Length:', line.length);
    const jsonStart = line.indexOf('\'{"');
    const slugIdx = line.indexOf("', 'jkkn-arts-tn-assembly-2026'");
    console.log('jsonStart:', jsonStart, 'slugIdx:', slugIdx);
    if (jsonStart !== -1 && slugIdx !== -1) {
      const jsonStr = line.substring(jsonStart + 1, slugIdx).replace(/''/g, "'");
      const sc = JSON.parse(jsonStr);
      const pqs = sc.proceedings_questions || sc.questions || [];
      console.log('Found questions in backup:', pqs.length);
      pqs.forEach((q, i) => {
        console.log((i+1) + '. ' + q.id + ' | ' + q.student_name + ' | length: ' + (q.question_text||'').length);
        console.log('   Text: ' + (q.question_text||'').substring(0, 100).replace(/\n/g, ' '));
      });
      fs.writeFileSync('c:/Users/sound/Documents/GitHub/TN_Assembly-/scratch/authentic_untruncated_backup_questions.json', JSON.stringify(pqs, null, 2), 'utf8');
      console.log('SAVED authentic untruncated questions to scratch/authentic_untruncated_backup_questions.json!');
      process.exit(0);
    }
  }
});
