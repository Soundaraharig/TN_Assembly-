const { createClient } = require('@supabase/supabase-js');
const url = 'https://svtjphzbuicnirynorlx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';
const sb = createClient(url, key);

async function checkRpc() {
  const rpcs = ['exec_sql', 'execute_sql', 'run_migration', 'exec'];
  for (const r of rpcs) {
    const { error } = await sb.rpc(r, { query: 'SELECT 1;' });
    console.log(r, error ? error.message : 'SUCCESS');
  }
}
checkRpc();
