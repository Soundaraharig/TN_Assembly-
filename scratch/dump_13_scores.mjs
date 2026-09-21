import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const l of envContent.split('\n')) {
  if (l.startsWith('VITE_SUPABASE_URL=')) url = l.replace('VITE_SUPABASE_URL=', '').trim();
  if (l.startsWith('VITE_SUPABASE_ANON_KEY=')) key = l.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
}

async function dump() {
  const resp = await fetch(`${url}/rest/v1/college_events?id=eq.05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8&select=social_coverage`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const data = await resp.json();
  const scores = data[0].social_coverage.scores || [];
  console.log(`Scores count: ${scores.length}`);
  scores.forEach((s, i) => {
    console.log(`[${i}] id: ${s.id} | learner: ${s.learner_name} (${s.learner_id}) | jury: ${s.juror_name} (${s.jury_id}) | session: ${s.session_name} (${s.session_id}) | total: ${s.total} | feedback: '${s.feedback}'`);
  });
}

dump();
