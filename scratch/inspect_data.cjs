const fs = require('fs');
const path = require('path');

// Extract localStorage entries from leveldb raw files
function extractJsonFromLeveldb(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    // LevelDB stores keys and values. In Chromium, localStorage keys often look like:
    // _https://tnassembly.vercel.app\x00\x01tn_assembly_events\x01<JSON>
    // or UTF-16 strings
    const latin1 = buf.toString('latin1');
    return latin1;
  } catch (e) {
    return '';
  }
}

const targetFiles = [
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000191.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000192.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000193.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000005.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000007.ldb'
];

let allContent = '';
for (const f of targetFiles) {
  allContent += extractJsonFromLeveldb(f) + '\n';
}

console.log('Total content length:', allContent.length);

// Extract JSON arrays for events, learners, coordinators, event_days, day_attendance
function findJsonArrays(content, keyword) {
  const regex = new RegExp(`\\[\\{[^]*?"${keyword}"[^]*?\\}\\]`, 'g');
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[0]);
      matches.push(parsed);
    } catch (e) {
      // not valid JSON
    }
  }
  return matches;
}

// Search for tn_assembly_events
const eventMatches = [];
const eventRegex = /\[\{"id":"[0-9a-f\-]+"[^]+?\}\]/g;
let em;
while ((em = eventRegex.exec(allContent)) !== null) {
  try {
    const parsed = JSON.parse(em[0]);
    if (parsed.length > 0 && parsed[0].college_name) {
      eventMatches.push(parsed);
    }
  } catch (e) {}
}

console.log('Found event arrays:', eventMatches.length);
if (eventMatches.length > 0) {
  const latestEvents = eventMatches[eventMatches.length - 1];
  console.log('\n--- LATEST EVENTS IN STORAGE ---');
  latestEvents.forEach(ev => {
    console.log({
      id: ev.id,
      college_name: ev.college_name,
      slug: ev.slug,
      assigned_coordinator_email: ev.assigned_coordinator_email,
      assigned_coordinator_name: ev.assigned_coordinator_name,
      location: ev.location,
      dates: ev.dates,
      participant_count: ev.participant_count,
      created_at: ev.created_at,
      updated_at: ev.updated_at
    });
  });
}

// Search for learners
const learnerMatches = [];
let lm;
while ((lm = eventRegex.exec(allContent)) !== null) {
  try {
    const parsed = JSON.parse(lm[0]);
    if (parsed.length > 0 && parsed[0].access_code && parsed[0].full_name) {
      learnerMatches.push(parsed);
    }
  } catch (e) {}
}
console.log('Found learner arrays:', learnerMatches.length);
if (learnerMatches.length > 0) {
  const latestLearners = learnerMatches[learnerMatches.length - 1];
  console.log(`\n--- LATEST LEARNERS COUNT: ${latestLearners.length} ---`);
  const eventIdCounts = {};
  latestLearners.forEach(l => {
    eventIdCounts[l.event_id] = (eventIdCounts[l.event_id] || 0) + 1;
  });
  console.log('Learners by event_id:', eventIdCounts);

  // Check leadership roles
  const leadershipRoles = latestLearners.filter(l => 
    l.role && (
      l.role.toLowerCase().includes('speaker') ||
      l.role.toLowerCase().includes('chief minister') ||
      l.role.toLowerCase().includes('minister') ||
      l.role.toLowerCase().includes('opposition')
    )
  );
  console.log(`\n--- LEADERSHIP ROLES (${leadershipRoles.length}) ---`);
  leadershipRoles.slice(0, 10).forEach(l => {
    console.log({
      id: l.id,
      name: l.full_name,
      role: l.role,
      bench: l.bench,
      party_name: l.party_name,
      event_id: l.event_id
    });
  });
}

// Check event_days
const dayMatches = [];
let dm;
const dayRegex = /\[\{"id":"[0-9a-f\-]+","event_id"[^]+?\}\]/g;
while ((dm = dayRegex.exec(allContent)) !== null) {
  try {
    const parsed = JSON.parse(dm[0]);
    if (parsed.length > 0 && parsed[0].day_number !== undefined) {
      dayMatches.push(parsed);
    }
  } catch (e) {}
}
console.log('Found event_days arrays:', dayMatches.length);
if (dayMatches.length > 0) {
  const latestDays = dayMatches[dayMatches.length - 1];
  console.log(`\n--- LATEST EVENT DAYS COUNT: ${latestDays.length} ---`);
  latestDays.forEach(d => {
    console.log({
      id: d.id,
      event_id: d.event_id,
      day_number: d.day_number,
      name: d.name,
      activities_count: d.activities?.length || 0,
      status: d.status
    });
  });
}
