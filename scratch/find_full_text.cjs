const fs = require('fs');
const f = 'C:/Users/sound/.gemini/antigravity-ide/brain/4780c048-61ed-4f5e-9fb2-a72e05b4da28/.system_generated/logs/transcript_full.jsonl';
const text = fs.readFileSync(f, 'utf8');
const pos = 285663;
const prevTool = text.lastIndexOf('"CommandLine"', pos);
console.log(text.substring(prevTool, prevTool + 500));
