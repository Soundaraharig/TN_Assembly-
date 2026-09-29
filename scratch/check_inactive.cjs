const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLearnerStatuses() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: learners } = await supabase.from('learners').select('*').eq('event_id', eventId);
  const inactive = learners.filter(l => l.is_active === false || l.status === 'Inactive');
  console.log(`Total learners: ${learners.length}, Inactive: ${inactive.length}`);
  inactive.forEach(l => console.log('  Inactive learner:', l.full_name, l.id));
}

checkLearnerStatuses().catch(console.error);
