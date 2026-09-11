const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\sound\\OneDrive\\Documents\\GitHub\\TN_Assembly-';
const dstDir = 'C:\\Users\\sound\\Documents\\GitHub\\TN_Assembly-';

function sync(s, d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  for (const item of fs.readdirSync(s)) {
    if (['.git', 'node_modules', 'dist', 'test-results', 'brain', '.user_uploaded', '.env'].includes(item)) continue;
    const sp = path.join(s, item);
    const dp = path.join(d, item);
    try {
      const st = fs.statSync(sp);
      if (st.isDirectory()) {
        sync(sp, dp);
      } else {
        if (!fs.existsSync(dp) || fs.statSync(dp).mtimeMs < st.mtimeMs || fs.statSync(dp).size !== st.size) {
          fs.copyFileSync(sp, dp);
          console.log('Synced:', item);
        }
      }
    } catch (err) {
      // ignore cloud stub error
    }
  }
}

sync(srcDir, dstDir);
console.log('Sync complete.');
