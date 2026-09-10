const fs = require('fs');

const files = [
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000191.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000192.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb\\000193.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000005.ldb',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log',
  'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000007.ldb'
];

function extractLocalStorageKey(keyName) {
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const buf = fs.readFileSync(f);
    
    // Look for keyName in ASCII
    const keyBuf = Buffer.from(keyName, 'utf8');
    let offset = 0;
    while ((offset = buf.indexOf(keyBuf, offset)) !== -1) {
      // Chrome stores localStorage value right after the key.
      // Usually there's a 1-byte separator (0x00 or 0x01) followed by length/format and data.
      // If it's UTF-16, it starts with 0x00 or '[' \0 '{' \0
      // Let's inspect bytes after offset
      const sub = buf.slice(offset + keyBuf.length, offset + keyBuf.length + 300000);
      
      // Try parsing as UTF-16LE
      // Find where '[' \0 '{' \0 starts
      const bracketIdx16 = sub.indexOf(Buffer.from('[{\"', 'utf16le'));
      if (bracketIdx16 !== -1 && bracketIdx16 < 50) {
        // Decode up to the matching end
        const str16 = sub.slice(bracketIdx16).toString('utf16le');
        // Find closing ']'
        const endBracket = str16.lastIndexOf(']');
        if (endBracket !== -1) {
          try {
            const parsed = JSON.parse(str16.slice(0, endBracket + 1));
            return parsed;
          } catch (e) {}
        }
      }

      // Try parsing as UTF-8
      const bracketIdx8 = sub.indexOf('[{');
      if (bracketIdx8 !== -1 && bracketIdx8 < 50) {
        const str8 = sub.slice(bracketIdx8).toString('utf8');
        const endBracket = str8.lastIndexOf(']');
        if (endBracket !== -1) {
          try {
            const parsed = JSON.parse(str8.slice(0, endBracket + 1));
            return parsed;
          } catch (e) {}
        }
      }

      offset += keyBuf.length;
    }
  }
  return null;
}

const events = extractLocalStorageKey('tn_assembly_events_v6');
console.log('--- EXTRACTED EVENTS ---');
if (events) {
  events.forEach(e => {
    console.log({
      id: e.id,
      college_name: e.college_name,
      assigned_coordinator_email: e.assigned_coordinator_email,
      assigned_coordinator_name: e.assigned_coordinator_name,
      participant_count: e.participant_count,
      created_at: e.created_at,
      updated_at: e.updated_at
    });
  });
} else {
  console.log('No events extracted via precise parser');
}

const learners = extractLocalStorageKey('tn_assembly_learners_v6');
console.log('\n--- EXTRACTED LEARNERS ---');
if (learners) {
  console.log('Total learners:', learners.length);
  const byEvent = {};
  learners.forEach(l => {
    byEvent[l.event_id] = (byEvent[l.event_id] || 0) + 1;
  });
  console.log('Learners by event ID:', byEvent);
  
  // Leadership
  const leadership = learners.filter(l => 
    l.role && (
      l.role.toLowerCase().includes('speaker') ||
      l.role.toLowerCase().includes('minister') ||
      l.role.toLowerCase().includes('opposition') ||
      l.role.toLowerCase().includes('party leader')
    )
  );
  console.log(`\nLeadership count: ${leadership.length}`);
  leadership.forEach(l => {
    console.log(`- ${l.role}: ${l.full_name} (${l.party_name || 'No Party'}, bench: ${l.bench}) [learner_id: ${l.id}, event_id: ${l.event_id}]`);
  });
} else {
  console.log('No learners extracted via precise parser');
}

const eventDays = extractLocalStorageKey('tn_assembly_event_days_v6');
console.log('\n--- EXTRACTED EVENT DAYS ---');
if (eventDays) {
  console.log('Total event days:', eventDays.length);
  eventDays.forEach(d => {
    console.log({
      id: d.id,
      event_id: d.event_id,
      day_number: d.day_number,
      name: d.name,
      activities: d.activities
    });
  });
} else {
  console.log('No event days found in storage (0 records)');
}

const attendance = extractLocalStorageKey('tn_assembly_day_attendance_v6');
console.log('\n--- EXTRACTED ATTENDANCE ---');
if (attendance) {
  console.log('Total attendance records:', attendance.length);
} else {
  console.log('No attendance records found in storage (0 records)');
}
