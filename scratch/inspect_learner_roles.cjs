const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLearnerRoles() {
  console.log('=== INSPECTING LEARNER ROLES IN SUPABASE ===\n');

  const events = [
    { id: '200fdd74-4d21-44d5-9f63-9a07bf267824', name: 'JKKNCET' },
    { id: '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8', name: 'JKKN ARTS' }
  ];

  for (const ev of events) {
    const { data: learners, error } = await supabase
      .from('learners')
      .select('id, full_name, role, event_id')
      .eq('event_id', ev.id);

    console.log(`Event: ${ev.name} (${ev.id}) - Total Learners: ${learners?.length}`);
    const nonMla = (learners || []).filter(l => l.role && l.role !== 'Member of Legislative Assembly (MLA)' && l.role !== 'MLA');
    console.log(`  Non-MLA roles (${nonMla.length}):`);
    nonMla.forEach(l => {
      console.log(`    ${l.full_name} (${l.id}) -> Role: "${l.role}"`);
    });
  }
}

inspectLearnerRoles().catch(console.error);
