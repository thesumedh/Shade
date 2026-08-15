import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { Buffer } from 'buffer';
import fs from 'node:fs';
import path from 'node:path';

// Support --network preview or --network preprod (default preview)
const args = process.argv.slice(2);
const networkArgIndex = args.indexOf('--network');
const network = networkArgIndex !== -1 && args[networkArgIndex + 1] ? args[networkArgIndex + 1] : 'preview';

setNetworkId(network as any);

const networkId = getNetworkId();

// Check for existing seed or generate a new random seed
const envPath = path.resolve(process.cwd(), '.env');
let seed = process.env.DEPLOYER_SEED || process.env.MIDNIGHT_SEED;

if (!seed && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^(?:DEPLOYER_SEED|MIDNIGHT_SEED)=(.*)$/m);
  if (match) seed = match[1].trim();
}

if (!seed) {
  seed = toHex(Buffer.from(generateRandomSeed()));
  // Save to .env
  fs.writeFileSync(envPath, `DEPLOYER_SEED=${seed}\n`);
  console.log(`✓ Generated new seed and saved to ${envPath}\n`);
}

const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
if (hdWallet.type !== 'seedOk') {
  throw new Error('Failed to initialize HDWallet from seed');
}

const derivationResult = hdWallet.hdWallet
  .selectAccount(0)
  .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
  .deriveKeysAt(0);

if (derivationResult.type !== 'keysDerived') {
  throw new Error('Failed to derive keys');
}

const keys = derivationResult.keys;
const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);
const unshieldedAddress = unshieldedKeystore.getBech32Address();

const DIV = '═'.repeat(64);
const faucetUrl = network === 'preview'
  ? 'https://faucet.preview.midnight.network/'
  : 'https://faucet.preprod.midnight.network/';

console.log(`
${DIV}
  SHADE DEPLOYER WALLET                     Network: ${network.toUpperCase()}
${DIV}
  Seed (Hex):
  ${seed}

  Unshielded Address (Request testnet tNIGHT here):
  ${unshieldedAddress}

  Faucet URL:
  ${faucetUrl}
${DIV}
`);
