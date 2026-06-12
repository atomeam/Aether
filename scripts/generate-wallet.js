const { Wallet } = require('ethers');

// Generate a new Ethereum wallet
const wallet = Wallet.createRandom();

console.log('=== Aether Payment Wallet ===');
console.log('');
console.log('IMPORTANT: Save this information securely!');
console.log('');
console.log('Wallet Address (public - safe to share):');
console.log(wallet.address);
console.log('');
console.log('Private Key (SECRET - never share):');
console.log(wallet.privateKey);
console.log('');
console.log('Mnemonic Phrase (SECRET - never share):');
console.log(wallet.mnemonic.phrase);
console.log('');
console.log('This wallet can receive USDC on Base, Arbitrum, or Polygon.');
console.log('Use the address for monapi/x402 payments.');
