const { createClient } = require('@supabase/supabase-js');
const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

async function test() {
  const c1 = await sb.from('learners').select('school_name').limit(1);
  console.log('school_name:', c1.error ? c1.error.message : 'EXISTS');
  const c2 = await sb.from('learners').select('party_group_link').limit(1);
  console.log('party_group_link:', c2.error ? c2.error.message : 'EXISTS');
  const c3 = await sb.from('learners').select('committee_group_link').limit(1);
  console.log('committee_group_link:', c3.error ? c3.error.message : 'EXISTS');
}
test();
