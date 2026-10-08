import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

console.log('Using Supabase URL from .env:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const targetEventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';

async function inspect() {
  console.log(`\n--- Inspecting Event: ${targetEventId} ---`);
  const { data: event, error: eventErr } = await supabase
    .from('college_events')
    .select('id, college_name, social_coverage')
    .eq('id', targetEventId)
    .single();

  if (eventErr) {
    console.error('Error fetching college_events:', eventErr);
  } else {
    console.log('Found event:', event.college_name);
    const sc = event.social_coverage || {};
    console.log('Social coverage keys:', Object.keys(sc));

    // Inspect sessions/agenda in social_coverage
    const agenda = sc.agenda || [];
    console.log(`\nAgenda items count: ${agenda.length}`);
    agenda.forEach((a, i) => {
      console.log(`Agenda[${i}]: id="${a.id}", title="${a.title}", name="${a.name}", day=${a.day || a.day_number}`);
    });

    const sessions = sc.sessions || [];
    console.log(`\nSessions count: ${sessions.length}`);
    sessions.forEach((s, i) => {
      console.log(`Session[${i}]: id="${s.id}", title="${s.title}", name="${s.name}", day=${s.day}`);
    });

    // Inspect scores in social_coverage
    const scores = Array.isArray(sc.scores) ? sc.scores : [];
    console.log(`\nTotal scores in social_coverage: ${scores.length}`);
    
    // Group scores by session_id / session_name
    const bySession = {};
    scores.forEach(s => {
      const sessKey = `${s.session_id} | ${s.session_name}`;
      if (!bySession[sessKey]) bySession[sessKey] = [];
      bySession[sessKey].push(s);
    });

    console.log('\nScores breakdown by session in social_coverage:');
    for (const [k, list] of Object.entries(bySession)) {
      console.log(`  Session "${k}": ${list.length} scores`);
    }
  }

  // Also check relational jury_evaluations table
  console.log('\n--- Checking public.jury_evaluations table ---');
  const { data: evals, error: evalErr } = await supabase
    .from('jury_evaluations')
    .select('*')
    .eq('event_id', targetEventId);

  if (evalErr) {
    console.log('jury_evaluations query result/error:', evalErr.message || evalErr);
  } else {
    console.log(`jury_evaluations rows found: ${evals ? evals.length : 0}`);
    if (evals && evals.length > 0) {
      const bySessionEval = {};
      evals.forEach(e => {
        const sessKey = `${e.session_id} | ${e.session_name}`;
        if (!bySessionEval[sessKey]) bySessionEval[sessKey] = [];
        bySessionEval[sessKey].push(e);
      });
      console.log('jury_evaluations breakdown by session:');
      for (const [k, list] of Object.entries(bySessionEval)) {
        console.log(`  Session "${k}": ${list.length} rows`);
      }
    }
  }
}

inspect().catch(console.error);
