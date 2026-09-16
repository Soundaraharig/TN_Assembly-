const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL\s*=\s*([^\r\n]+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*([^\r\n]+)/);
const url = urlMatch[1].trim().replace(/^['"]|['"]$/g, '');
const key = keyMatch[1].trim().replace(/^['"]|['"]$/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function check() {
  const { count, error } = await supabase.from('learners').select('*', { count: 'exact', head: true });
  console.log('Exact count of learners in Supabase:', count, error ? error : '');
  const { data: cols, error: cErr } = await supabase.from('learners').select('*').limit(1);
  console.log('Sample learner columns:', Object.keys(cols?.[0] || {}));
}
check();
