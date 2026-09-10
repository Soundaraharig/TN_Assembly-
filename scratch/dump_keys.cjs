const fs = require('fs');

const f = 'C:\\Users\\sound\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb\\000006.log';
const buf = fs.readFileSync(f);

// Find all occurrences of "_https://tnassembly.vercel.app"
const target = Buffer.from('_https://tnassembly.vercel.app', 'utf8');
let pos = 0;
while ((pos = buf.indexOf(target, pos)) !== -1) {
  // read the key
  const endKey = buf.indexOf(0x01, pos + target.length + 2);
  const keyBuf = buf.slice(pos, endKey !== -1 && endKey - pos < 100 ? endKey : pos + 60);
  console.log('Key:', keyBuf.toString('utf8'));
  
  // Look at next bytes
  const nextSlice = buf.slice(pos + keyBuf.length, pos + keyBuf.length + 300);
  console.log('Next bytes (hex):', nextSlice.slice(0, 20).toString('hex'));
  console.log('Next bytes (utf16le):', nextSlice.toString('utf16le').slice(0, 100));
  console.log('Next bytes (utf8):', nextSlice.toString('utf8').slice(0, 100));
  console.log('----------------------------------------------------');
  pos += target.length;
}
