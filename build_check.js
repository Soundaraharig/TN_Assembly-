const { execSync } = require('child_process');
try {
  execSync('cd C:\\Users\\Soundarahari\\Documents\\GitHub\\TN_Assembly- && npx tsc --noEmit', { stdio: 'pipe' });
  console.log('TypeScript check passed');
} catch (err) {
  console.error('TypeScript check failed:', err.stdout || err.stderr);
  process.exit(1);
}