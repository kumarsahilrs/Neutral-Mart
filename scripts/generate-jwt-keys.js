#!/usr/bin/env node
/**
 * NirmalMandi — JWT RS256 Key Generator
 * Run: node scripts/generate-jwt-keys.js
 *
 * Outputs base64-encoded private + public keys ready to paste into .env
 * and Railway environment variables.
 */
const { generateKeyPairSync } = require('crypto');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const privB64 = Buffer.from(privateKey).toString('base64');
const pubB64  = Buffer.from(publicKey).toString('base64');

console.log('\n✅ NirmalMandi JWT RS256 Key Pair Generated\n');
console.log('─'.repeat(60));
console.log('\nCopy these into your .env AND Railway environment variables:\n');
console.log(`JWT_PRIVATE_KEY=${privB64}`);
console.log();
console.log(`JWT_PUBLIC_KEY=${pubB64}`);
console.log('\n' + '─'.repeat(60));
console.log('\n⚠  IMPORTANT:');
console.log('  • JWT_PRIVATE_KEY → auth-service only (keep secret)');
console.log('  • JWT_PUBLIC_KEY  → ALL services that verify tokens');
console.log('  • Never commit either key to git');
console.log('  • Store both as Railway environment variables\n');
