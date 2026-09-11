const { createClient } = require('@supabase/supabase-js');
const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

async function testUpsert() {
  const { error } = await sb.from('learners').upsert([{
    id: '00000000-0000-0000-0000-000000000000',
    event_id: '200fdd74-4d21-44d5-9f63-9a07bf267824',
    access_code: 'TEST00',
    full_name: 'Test Upsert',
    school_name: 'Test School'
  }]);
  console.log('Upsert with unknown col:', error ? error.message : 'SUCCESS');
}
testUpsert();
