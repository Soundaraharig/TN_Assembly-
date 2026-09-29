const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchEverywhere() {
  const learnerId = 'cf05e4af-28ef-4f0d-9d0b-303e4391341f';
  const accessCode = 'RFNQNU';

  console.log('Searching for learner ID, access code, or Aravakurichi in all tables...');

  // Tables to check
  const tables = [
    'proceedings_questions',
    'questions',
    'student_votes',
    'day_attendance',
    'login_records',
    'speaking_requests',
    'bill_votes',
    'nominations',
    'flash_votes'
  ];

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*');
      if (error) {
        // console.log(`Table ${t} select error:`, error.message);
        continue;
      }
      const matches = data.filter(row => {
        const str = JSON.stringify(row).toLowerCase();
        return str.includes(learnerId.toLowerCase()) || str.includes(accessCode.toLowerCase()) || str.includes('aravakurichi') || str.includes('dhanush');
      });
      if (matches.length > 0) {
        console.log(`Table "${t}" has ${matches.length} matches:`);
        matches.forEach(m => console.log('  ', JSON.stringify(m).substring(0, 200)));
      }
    } catch (e) {
      // ignore
    }
  }

  // Check all events social_coverage for ANY occurrence of RFNQNU or cf05e4af
  const { data: events } = await supabase.from('college_events').select('id, college_name, social_coverage');
  events.forEach(ev => {
    const scStr = JSON.stringify(ev.social_coverage || {});
    if (scStr.includes(learnerId) || scStr.includes(accessCode) || scStr.includes('RFNQNU') || scStr.includes('Aravakurichi')) {
      console.log(`Event "${ev.college_name}" social_coverage contains match!`);
    }
  });
}

searchEverywhere().catch(console.error);
