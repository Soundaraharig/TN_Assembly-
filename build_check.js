import { execSync } from 'child_process';
try {
  execSync('npm.cmd run build', { stdio: 'inherit' });
  console.log('Build check passed');
} catch (err) {
  console.error('Build check failed', err);
  process.exit(1);
}