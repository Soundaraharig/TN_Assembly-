const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qyijhztjvxansctqhpkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWpoenRqdnhhbnNjdHFocGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDY5NzIsImV4cCI6MjEwNTgyMjk3Mn0.uhh-wH2-G1nxuoGDzGmg_SrDDZlZIJWG8IOuO1NHG0g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatch() {
  const eventId = '200fdd74-4d21-44d5-9f63-9a07bf267824';
  const { data: event } = await supabase.from('college_events').select('social_coverage').eq('id', eventId).single();
  const sc = event.social_coverage;

  for (const [key, value] of Object.entries(sc)) {
    const s = JSON.stringify(value);
    if (s.includes('cf05e4af') || s.includes('RFNQNU') || s.includes('Aravakurichi') || s.includes('Dhanush') || s.includes('dhanush')) {
      console.log(`Key "${key}" matches! Type: ${Array.isArray(value) ? `array of ${value.length}` : typeof value}`);
      if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          const itemStr = JSON.stringify(item);
          if (itemStr.includes('cf05e4af') || itemStr.includes('RFNQNU') || itemStr.includes('Aravakurichi') || itemStr.includes('dhanush') || itemStr.includes('Dhanush')) {
            console.log(`  Index ${idx}:`, itemStr);
          }
        });
      }
    }
  }
}

checkMatch().catch(console.error);
