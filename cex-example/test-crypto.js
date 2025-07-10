// test-crypto.js
// test-crypto.js
import crypto from 'crypto';

console.log('crypto支持:', {
  createHash: typeof crypto.createHash === 'function',
  sha256: crypto.getHashes().includes('sha256'),
  hash: typeof crypto.hash === 'function'  // 添加 Vite 使用的 hash 方法检查
});
