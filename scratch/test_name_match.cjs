const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeNameTokens(name) {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function areNamesMatching(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.trim().toLowerCase();
  const cleanB = nameB.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const tokensA = normalizeNameTokens(nameA);
  const tokensB = normalizeNameTokens(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Sorted tokens match (e.g. "K. Dhanush" and "Dhanush K")
  const sortedA = [...tokensA].sort().join(' ');
  const sortedB = [...tokensB].sort().join(' ');
  if (sortedA === sortedB) return true;

  // Single letter initial + same main name
  // e.g. "Dhanush" and "K Dhanush"
  const mainTokensA = tokensA.filter(t => t.length > 1);
  const mainTokensB = tokensB.filter(t => t.length > 1);
  if (mainTokensA.length > 0 && mainTokensB.length > 0) {
    if (mainTokensA.sort().join(' ') === mainTokensB.sort().join(' ')) {
      return true;
    }
  }

  return false;
}

async function test() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: event } = await supabase.from('college_events').select('social_coverage').eq('id', eventId).single();
  const { data: learners } = await supabase.from('learners').select('*').eq('event_id', eventId);
  const questions = event.social_coverage.proceedings_questions || [];

  console.log('Testing name matching:');
  console.log('K. Dhanush vs Dhanush K:', areNamesMatching('K. Dhanush', 'Dhanush K'));
  console.log('K. Dhanush vs Dhanush. K:', areNamesMatching('K. Dhanush', 'Dhanush. K'));
  console.log('BOOMESH.M vs M. BOOMESH:', areNamesMatching('BOOMESH.M', 'M. BOOMESH'));
  console.log('Deepica. C vs C. Deepica:', areNamesMatching('Deepica. C', 'C. Deepica'));
  console.log('Dharanish. K vs K. Dharanish:', areNamesMatching('Dharanish. K', 'K. Dharanish'));
  console.log('K. Dhanush vs Dharanish. K:', areNamesMatching('K. Dhanush', 'Dharanish. K'));
}

test().catch(console.error);
