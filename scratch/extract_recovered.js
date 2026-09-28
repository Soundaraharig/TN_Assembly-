import fs from 'fs';

const file = 'C:/Users/sound/.gemini/antigravity-ide/brain/44ff0304-59fe-4c77-bfb0-46f3c606b511/.system_generated/logs/transcript_full.jsonl';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const line = lines[143];
const obj = JSON.parse(line);
const c = obj.content;

// The truncated line 1 is:
// [
//   {
//     "id": "q-1790356950191-w318c",
//     "student_name": "pandeeshwari",

const marker = '"bench": "Opposition",\n    "constituency": "Salem (West)",';
const idx = c.indexOf(marker);
if (idx !== -1) {
  const jsonSlice = '[\n  {\n    "id": "q-1790356950191-w318c",\n    "student_name": "pandeeshwari",\n    ' + c.substring(idx).trim();
  fs.writeFileSync('scratch/recovered_questions.json', jsonSlice, 'utf8');
  try {
    const arr = JSON.parse(jsonSlice);
    console.log('SUCCESS! Parsed', arr.length, 'questions!');
    arr.forEach((q, i) => {
      console.log(`[#${i+1}] ID: ${q.id} | Name: ${q.student_name} | Const: ${q.constituency} | Ministry: ${q.ministry} | Status: ${q.status} | CallingOrder: ${q.calling_order}`);
    });
  } catch (err) {
    console.error('Parse error:', err.message);
  }
}
