import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const l of envContent.split('\n')) {
  if (l.startsWith('VITE_SUPABASE_URL=')) url = l.replace('VITE_SUPABASE_URL=', '').trim();
  if (l.startsWith('VITE_SUPABASE_ANON_KEY=')) key = l.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
}

async function run() {
  const res = await fetch(`${url}/rest/v1/college_events?select=id,college_name,social_coverage`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const text = await res.text();
  let events;
  try {
    events = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse:', text);
    return;
  }
  if (!Array.isArray(events)) {
    console.error('Events is not an array:', events);
    return;
  }
  console.log(`Loaded ${events.length} events`);
  let totalAllScores = 0;

  for (const ev of events) {
    const sc = ev.social_coverage || {};
    const scores = Array.isArray(sc.scores) ? sc.scores : [];
    totalAllScores += scores.length;
    console.log(`\n--- Event: ${ev.name} (id: ${ev.id}) ---`);
    console.log(`Scores count: ${scores.length}`);
    if (scores.length > 0) {
      console.log('Sample score keys:', Object.keys(scores[0]));
      console.log('Sample score:', JSON.stringify(scores[0], null, 2));

      // Analyze all scores
      const testScores = [];
      const learnersWithScores = new Set();
      const sessionJuryCounts = {};

      scores.forEach(s => {
        learnersWithScores.add(s.learner_id);
        const combo = `${s.session_id || s.session_name} / ${s.jury_id || s.juror_name}`;
        sessionJuryCounts[combo] = (sessionJuryCounts[combo] || 0) + 1;

        const isTest = 
          s.is_test === true || 
          s.isTest === true ||
          (typeof s.id === 'string' && s.id.toLowerCase().startsWith('test')) ||
          (typeof s.session_id === 'string' && s.session_id.toLowerCase().includes('test')) ||
          (typeof s.session_name === 'string' && s.session_name.toLowerCase().includes('test')) ||
          (typeof s.juror_name === 'string' && s.juror_name.toLowerCase().includes('test')) ||
          (typeof s.feedback === 'string' && s.feedback.toLowerCase().includes('test')) ||
          (typeof s.learner_name === 'string' && s.learner_name.toLowerCase().includes('test'));

        if (isTest) {
          testScores.push(s);
        }
      });

      console.log(`Distinct learners with scores: ${learnersWithScores.size}`);
      console.log('Session / Jury distributions:', sessionJuryCounts);
      console.log(`Identified test scores count: ${testScores.length}`);
      if (testScores.length > 0) {
        console.log('Sample test score:', JSON.stringify(testScores[0], null, 2));
      }
    }
  }
  console.log(`\nTotal scores across all events: ${totalAllScores}`);
}

run().catch(console.error);
