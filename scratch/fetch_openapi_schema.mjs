const supabaseUrl = 'https://svtjphzbuicnirynorlx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dGpwaHpidWljbmlyeW5vcmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODA5MjAsImV4cCI6MjEwMzg1NjkyMH0.dTyCtgB1kCAwcuvdjo5rSkqLvslUO9XZE9CgThWfmM8';

async function fetchSchema() {
  const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });

  if (!resp.ok) {
    console.error('Failed to fetch OpenAPI schema:', resp.status, resp.statusText);
    return;
  }

  const spec = await resp.json();
  console.log('OpenAPI definitions found:');
  const tables = Object.keys(spec.definitions || {});
  console.log('Tables in schema cache:', tables);
  console.log('Total tables count:', tables.length);

  for (const t of tables) {
    const properties = Object.keys(spec.definitions[t]?.properties || {});
    console.log(`- ${t} (${properties.length} columns):`, properties.join(', '));
  }
}

fetchSchema().catch(console.error);
