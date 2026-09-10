const fs = require('fs');

const files = [
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000191.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000192.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000193.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000005.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000007.ldb'
];

function extractKeyExact(targetKey) {
  const targetBuf = Buffer.from(targetKey, 'utf8');
  let latestParsed = null;

  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const buf = fs.readFileSync(f);
    let pos = 0;
    while ((pos = buf.indexOf(targetBuf, pos)) !== -1) {
      // Look forward up to 100 bytes for UTF-16 '[' (0x5b 0x00) or UTF-8 '[' (0x5b)
      for (let i = pos + targetBuf.length; i < Math.min(pos + targetBuf.length + 100, buf.length - 2); i++) {
        if (buf[i] === 0x5b && buf[i+1] === 0x00) {
          // UTF-16 array
          // scan until ']' (0x5d 0x00)
          let end = i + 2;
          let depth = 1;
          while (end < buf.length - 1) {
            if (buf[end] === 0x5b && buf[end+1] === 0x00) depth++;
            else if (buf[end] === 0x5d && buf[end+1] === 0x00) {
              depth--;
              if (depth === 0) {
                end += 2;
                break;
              }
            }
            end += 2;
          }
          if (depth === 0) {
            const rawUtf16 = buf.slice(i, end).toString('utf16le');
            try {
              const parsed = JSON.parse(rawUtf16);
              latestParsed = { parsed, file: f };
            } catch (e) {}
          }
          break;
        } else if (buf[i] === 0x5b && buf[i+1] !== 0x00) {
          // UTF-8 array
          let end = i + 1;
          let depth = 1;
          while (end < buf.length) {
            if (buf[end] === 0x5b) depth++;
            else if (buf[end] === 0x5d) {
              depth--;
              if (depth === 0) {
                end++;
                break;
              }
            }
            end++;
          }
          if (depth === 0) {
            const rawUtf8 = buf.slice(i, end).toString('utf8');
            try {
              const parsed = JSON.parse(rawUtf8);
              latestParsed = { parsed, file: f };
            } catch (e) {}
          }
          break;
        }
      }
      pos += targetBuf.length;
    }
  }
  return latestParsed;
}

console.log('=== EXTRACTING ACCURATE DATA ===\n');

// 1. Events
const evRes = extractKeyExact('tn_assembly_events');
if (evRes) {
  console.log(`[EVENTS] Found in ${evRes.file}: count = ${evRes.parsed.length}`);
  evRes.parsed.forEach((e, idx) => {
    console.log(`Event #${idx + 1}:`, {
      id: e.id,
      college_name: e.college_name,
      slug: e.slug,
      assigned_coordinator_email: e.assigned_coordinator_email,
      assigned_coordinator_name: e.assigned_coordinator_name,
      location: e.location,
      dates: e.dates,
      participant_count: e.participant_count,
      status: e.status,
      created_at: e.created_at,
      updated_at: e.updated_at
    });
  });
} else {
  console.log('[EVENTS] Not found');
}

// 2. Learners
const lrRes = extractKeyExact('tn_assembly_learners');
if (lrRes) {
  console.log(`\n[LEARNERS] Found in ${lrRes.file}: count = ${lrRes.parsed.length}`);
  const counts = {};
  lrRes.parsed.forEach(l => {
    counts[l.event_id] = (counts[l.event_id] || 0) + 1;
  });
  console.log('Count by event_id:', counts);

  // Leadership inspection
  const leaders = lrRes.parsed.filter(l => 
    l.role && (
      l.role.toLowerCase().includes('speaker') ||
      l.role.toLowerCase().includes('minister') ||
      l.role.toLowerCase().includes('opposition') ||
      l.role.toLowerCase().includes('leader')
    )
  );
  console.log(`\n[LEADERSHIP ASSIGNMENTS IN LEARNERS] count = ${leaders.length}`);
  leaders.forEach(l => {
    console.log(`- ${l.role}: ${l.full_name} (${l.party_name || 'No Party'}, bench: ${l.bench}) [ID: ${l.id}, access_code: ${l.access_code}, event_id: ${l.event_id}]`);
  });
} else {
  console.log('[LEARNERS] Not found');
}

// 3. Event Days
const edRes = extractKeyExact('tn_assembly_event_days');
if (edRes) {
  console.log(`\n[EVENT DAYS] Found in ${edRes.file}: count = ${edRes.parsed.length}`);
  edRes.parsed.forEach(d => {
    console.log(`- Day ${d.day_number}: "${d.name}" (id: ${d.id}, event_id: ${d.event_id}, activities: ${d.activities?.length || 0})`);
  });
} else {
  console.log('\n[EVENT DAYS] count = 0 (none in storage)');
}

// 4. Attendance
const attRes = extractKeyExact('tn_assembly_day_attendance');
if (attRes) {
  console.log(`\n[DAY ATTENDANCE] Found in ${attRes.file}: count = ${attRes.parsed.length}`);
  const counts = {};
  attRes.parsed.forEach(a => {
    counts[a.event_id] = (counts[a.event_id] || 0) + 1;
  });
  console.log('Count by event_id:', counts);
} else {
  console.log('\n[DAY ATTENDANCE] count = 0 (none in storage)');
}

// 5. Coordinators
const coordRes = extractKeyExact('tn_assembly_coordinators');
if (coordRes) {
  console.log(`\n[COORDINATORS] Found in ${coordRes.file}: count = ${coordRes.parsed.length}`);
  coordRes.parsed.forEach(c => {
    console.log(`- ${c.name} (${c.email}), event_id: ${c.event_id}, id: ${c.id}`);
  });
} else {
  console.log('\n[COORDINATORS] Not found');
}
