const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking questions table...');
  const { data: qData, error: qErr } = await supabase.from('questions').select('*').limit(5);
  if (qErr) {
    console.log('Error selecting from questions:', qErr.message);
  } else {
    console.log('Sample row from questions:', qData[0] ? Object.keys(qData[0]) : 'empty');
    const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    console.log('Total rows in questions:', count);
  }

  console.log('Checking proceedings_questions table...');
  const { data: pqData, error: pqErr } = await supabase.from('proceedings_questions').select('*').limit(5);
  if (pqErr) {
    console.log('Error selecting from proceedings_questions:', pqErr.message);
  } else {
    console.log('Sample row from proceedings_questions:', pqData[0] ? Object.keys(pqData[0]) : 'empty');
    const { count } = await supabase.from('proceedings_questions').select('*', { count: 'exact', head: true });
    console.log('Total rows in proceedings_questions:', count);
  }
}

checkTables().catch(console.error);
