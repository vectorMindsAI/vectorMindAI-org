const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');

console.log('\nGenerated AUTH_SECRET:\n');
console.log(secret);
console.log('\n IMPORTANT: Copy this secret and add it to:');
console.log('   1. Your .env.local file (for local development)');
console.log('   2. Vercel Environment Variables (for production)\n');
console.log('   Vercel Dashboard → Settings → Environment Variables\n');
