const fs = require('fs');
const path = require('path');

// Simulate storage or read from any local storage dump / mock data / Supabase
console.log('=== SYSTEMIC AUDIT FOR BUG 9 ===');

// Check schema file for constraints
const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('\n[Schema Inspection]');
  console.log('coordinators.email UNIQUE constraint present?:', schema.includes('email TEXT UNIQUE NOT NULL'));
  console.log('political_parties REFERENCES college_events(id)?:', schema.includes('event_id UUID REFERENCES college_events(id)'));
  console.log('committees REFERENCES college_events(id)?:', schema.includes('event_id UUID REFERENCES college_events(id)'));
  console.log('learners REFERENCES college_events(id)?:', schema.includes('event_id UUID REFERENCES college_events(id)'));
}

// Inspect storageService.ts for scoping & duplicate prevention
const storageServicePath = path.join(__dirname, '..', 'src', 'services', 'storageService.ts');
const storageContent = fs.readFileSync(storageServicePath, 'utf8');

console.log('\n[Codebase Leak Inspection in storageService.ts]');
const lines = storageContent.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('event_id') && (line.includes('|| !') || line.includes('|| (!'))) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

// Check Supabase credentials in .env if any
const envPath = path.join(__dirname, '..', '.env');
console.log('\n.env file exists?:', fs.existsSync(envPath));
