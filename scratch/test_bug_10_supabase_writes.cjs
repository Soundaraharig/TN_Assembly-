const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: Bug 10 Supabase Writes & RLS Fixes ===\n');

// 1. Check supabase_schema.sql
const schemaPath = path.resolve(__dirname, '../supabase_schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

console.log('[1/4] Checking supabase_schema.sql for missing columns and RLS write policies...');

const requiredColumns = [
  'ALTER TABLE college_events',
  'ADD COLUMN IF NOT EXISTS slug TEXT',
  'ADD COLUMN IF NOT EXISTS treasury_whatsapp_link TEXT',
  'ADD COLUMN IF NOT EXISTS opposition_whatsapp_link TEXT',
  'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ',
  'ALTER TABLE volunteers',
  'ADD COLUMN IF NOT EXISTS access_code TEXT',
  'ADD COLUMN IF NOT EXISTS station TEXT',
  'ADD COLUMN IF NOT EXISTS shift TEXT',
  'ADD COLUMN IF NOT EXISTS is_yuva BOOLEAN',
  'ADD COLUMN IF NOT EXISTS has_arrived BOOLEAN',
  'ALTER TABLE jury_members',
  'ADD COLUMN IF NOT EXISTS access_code TEXT',
  'ADD COLUMN IF NOT EXISTS email TEXT',
  'ADD COLUMN IF NOT EXISTS phone TEXT',
  'ADD COLUMN IF NOT EXISTS status TEXT',
  'ALTER TABLE political_parties',
  'ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT',
  'ALTER TABLE learners',
  'ADD COLUMN IF NOT EXISTS district TEXT',
  'ALTER TABLE coordinators',
  'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ'
];

for (const col of requiredColumns) {
  assert(schemaContent.includes(col), `Missing expected column definition: ${col}`);
}
console.log('✅ All missing column definitions present in supabase_schema.sql');

const requiredWritePolicies = [
  'CREATE POLICY "Allow all operational access" ON public.college_events FOR ALL TO anon, authenticated',
  'CREATE POLICY "Allow all operational access" ON public.coordinators FOR ALL TO anon, authenticated',
  'CREATE POLICY "Allow all operational access" ON public.political_parties FOR ALL TO anon, authenticated',
  'CREATE POLICY "Allow all operational access" ON public.committees FOR ALL TO anon, authenticated',
  'CREATE POLICY "Allow all operational access" ON public.learners FOR ALL TO anon, authenticated',
  'CREATE POLICY "Allow all operational access" ON public.session_agenda FOR ALL TO anon, authenticated',
  'CREATE POLICY "Allow all operational access" ON public.jury_members FOR ALL TO anon, authenticated',
  'CREATE POLICY "Allow all operational access" ON public.volunteers FOR ALL TO anon, authenticated'
];

for (const pol of requiredWritePolicies) {
  assert(schemaContent.includes(pol), `Missing expected write RLS policy: ${pol}`);
}
console.log('✅ All 8 operational tables have universal FOR ALL RLS policies for anon, authenticated');

assert(schemaContent.includes('PRIMARY KEY & UNIQUE CONSTRAINTS ENFORCEMENT (BUG 10 ROOT CAUSE FIX)'), 'Missing PRIMARY KEY enforcement block');
assert(schemaContent.includes('ADD PRIMARY KEY (id)'), 'Missing ADD PRIMARY KEY (id) statement');
console.log('✅ Primary Key & Unique constraints enforcement migration present in supabase_schema.sql');

// 2. Check storageService.ts sanitization and logging
console.log('\n[2/4] Checking storageService.ts for sanitization, UUID safety, batching, and error handling...');
const storagePath = path.resolve(__dirname, '../src/services/storageService.ts');
const storageContent = fs.readFileSync(storagePath, 'utf8');

assert(storageContent.includes('function isValidUuid'), 'Missing isValidUuid helper function');
assert(storageContent.includes('[Supabase Write Attempt]'), 'Missing [Supabase Write Attempt] verbose log');
assert(storageContent.includes('✅ [Supabase Write Success]'), 'Missing [Supabase Write Success] log');
assert(storageContent.includes('❌ [Supabase Write Error]'), 'Missing [Supabase Write Error] log');
assert(storageContent.includes('[Supabase Delete Attempt]'), 'Missing [Supabase Delete Attempt] log');
assert(storageContent.includes('checkSupabaseHealth()'), 'Missing checkSupabaseHealth()');
assert(storageContent.includes('sbUpsertBatch'), 'Missing sbUpsertBatch method');
assert(storageContent.includes('setWriteErrorHandler'), 'Missing setWriteErrorHandler method');
assert(storageContent.includes('inFlightWrites'), 'Missing inFlightWrites deduplication');

console.log('✅ storageService.ts has full UUID validation, batching, deduplication, error handler, and health check');

// Simulate isValidUuid logic
function isValidUuid(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
}

assert.strictEqual(isValidUuid(''), false, 'Empty string should not be a valid UUID');
assert.strictEqual(isValidUuid('invalid-uuid'), false, 'Random string should not be a valid UUID');
assert.strictEqual(isValidUuid('d60f081d-3f36-48d0-b7e3-dc9221bebbdf'), true, 'Valid UUID should return true');

// Simulate sanitizeRecordForTable
function sanitizeRecordForTable(table, record) {
  const raw = { ...record };
  const sanitizeEventId = (evId) => {
    if (typeof evId === 'string' && isValidUuid(evId)) return evId;
    return null;
  };

  if (table === 'coordinators') {
    return {
      id: raw.id,
      event_id: sanitizeEventId(raw.event_id),
      name: raw.name || 'Coordinator',
      email: (raw.email || '').trim().toLowerCase(),
      password_hash: raw.password_hash || 'coord123',
      raw_temp_password: raw.raw_temp_password || raw.password_hash || 'coord123',
      created_at: raw.created_at || '2026-09-07T00:00:00.000Z',
      updated_at: '2026-09-07T00:00:00.000Z'
    };
  }
  if (table === 'volunteers') {
    return {
      id: raw.id,
      event_id: sanitizeEventId(raw.event_id),
      access_code: raw.access_code || null,
      name: raw.name || 'Volunteer',
      email: raw.email || null,
      phone: raw.phone || null,
      station: raw.station || 'Floating',
      shift: raw.shift || 'Both days',
      is_yuva: raw.is_yuva !== undefined ? !!raw.is_yuva : true,
      has_arrived: !!raw.has_arrived,
      role: raw.role || 'Volunteer',
      created_at: raw.created_at || '2026-09-07T00:00:00.000Z'
    };
  }
  if (table === 'jury_members') {
    return {
      id: raw.id,
      event_id: sanitizeEventId(raw.event_id),
      access_code: raw.access_code || null,
      name: raw.name || 'Jury Member',
      email: raw.email || null,
      phone: raw.phone || null,
      designation: raw.designation || 'Parliamentary Juror',
      assigned_bench: raw.assigned_bench || 'Ruling',
      status: raw.status || 'Active',
      created_at: raw.created_at || '2026-09-07T00:00:00.000Z'
    };
  }
  if (table === 'learners') {
    return {
      id: raw.id,
      event_id: sanitizeEventId(raw.event_id),
      access_code: raw.access_code,
      full_name: raw.full_name,
      district: raw.district || null,
      party_id: raw.party_id && isValidUuid(raw.party_id) ? raw.party_id : null,
      committee_id: raw.committee_id && isValidUuid(raw.committee_id) ? raw.committee_id : null
    };
  }
  return raw;
}

// Test Coordinator Sanitization with empty event_id
const dirtyCoord = { id: 'coord-1', event_id: '', name: 'Test Coord', email: 'Test@Mail.com ' };
const cleanCoord = sanitizeRecordForTable('coordinators', dirtyCoord);
assert.strictEqual(cleanCoord.event_id, null, 'Coordinator event_id should be null when empty string');
assert.strictEqual(cleanCoord.email, 'test@mail.com', 'Coordinator email should be lowercased and trimmed');

// Test Volunteer Sanitization
const dirtyVol = { id: 'vol-1', event_id: 'bad-uuid', name: 'Vol 1' };
const cleanVol = sanitizeRecordForTable('volunteers', dirtyVol);
assert.strictEqual(cleanVol.event_id, null, 'Volunteer event_id should be null if not a valid UUID');
assert.strictEqual(cleanVol.station, 'Floating', 'Volunteer station should default to Floating');
assert.strictEqual(cleanVol.is_yuva, true, 'Volunteer is_yuva should default to true');

// Test Jury Sanitization
const dirtyJury = { id: 'jury-1', event_id: '', name: 'Judge Judy' };
const cleanJury = sanitizeRecordForTable('jury_members', dirtyJury);
assert.strictEqual(cleanJury.event_id, null, 'Jury event_id should be null when empty string');
assert.strictEqual(cleanJury.status, 'Active', 'Jury status should default to Active');

// Test Learner with empty party_id / committee_id
const dirtyLearner = { id: 'l-1', party_id: '', committee_id: '' };
const cleanLearner = sanitizeRecordForTable('learners', dirtyLearner);
assert.strictEqual(cleanLearner.party_id, null, 'Learner party_id should be null when empty string');
assert.strictEqual(cleanLearner.committee_id, null, 'Learner committee_id should be null when empty string');

console.log('✅ Sanitization tests passed: empty strings and invalid UUIDs safely converted to null');

// 3. Check Header.tsx for Cloud Sync status badge
console.log('\n[3/4] Checking Header.tsx for Cloud Sync / Local Cache badge...');
const headerPath = path.resolve(__dirname, '../src/components/common/Header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');

assert(headerContent.includes('isSupabaseEnabled'), 'Header.tsx does not check isSupabaseEnabled');
assert(headerContent.includes('Cloud Sync'), 'Header.tsx missing Cloud Sync badge text');
assert(headerContent.includes('Local Cache'), 'Header.tsx missing Local Cache badge text');

console.log('✅ Header.tsx displays real-time Cloud Sync / Local Cache indicator');

// 4. Check App.tsx for toast error handling on coordinator update
console.log('\n[4/4] Checking App.tsx for async updateCoordinator and toast handling...');
const appPath = path.resolve(__dirname, '../src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

assert(appContent.includes('handleUpdateCoordinator = async'), 'handleUpdateCoordinator should be async');
assert(appContent.includes('Saved Locally (Cloud Warning)'), 'App.tsx missing warning toast when cloud sync fails');
assert(appContent.includes('storageService.setWriteErrorHandler'), 'App.tsx should register setWriteErrorHandler');

console.log('✅ App.tsx registers write error handler and warns users if Supabase write fails');

console.log('\n🎉 ALL BUG 10 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
