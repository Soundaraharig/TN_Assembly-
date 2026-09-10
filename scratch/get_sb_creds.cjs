async function main() {
  try {
    const res = await fetch('https://tnassembly.vercel.app');
    const html = await res.text();
    console.log('HTML length:', html.length);
    const matches = html.match(/src="(\/assets\/[^"]+)"/g);
    console.log('Script matches:', matches);
    if (matches) {
      for (const m of matches) {
        const src = m.match(/src="([^"]+)"/)[1];
        const jsRes = await fetch('https://tnassembly.vercel.app' + src);
        const js = await jsRes.text();
        console.log('Loaded script:', src, 'length:', js.length);
        const sbMatch = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
        if (sbMatch) {
          console.log('FOUND SUPABASE URL:', sbMatch[0]);
        }
        const anonMatch = js.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);
        if (anonMatch) {
          console.log('FOUND SUPABASE ANON KEY:', anonMatch[0]);
        }
      }
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
main();
