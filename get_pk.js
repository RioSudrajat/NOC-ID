const fs = require('fs');
const bs58 = require('bs58');

// Baca file wallet json lu
const secret = JSON.parse(fs.readFileSync('C:/tmp/noc-keys/noc-devnet-deployer.json', 'utf8'));

// Deteksi versi bs58 (handle versi lama maupun baru)
const encode = bs58.encode || bs58.default.encode;

console.log('\n=========================================');
console.log('COPY KODE PRIVATE KEY DI BAWAH INI:');
console.log('=========================================\n');
console.log(encode(Uint8Array.from(secret)));
console.log('\n=========================================');