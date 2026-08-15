import { deploy, configureProviders, buildWalletAndWaitForFunds, getCoinPublicKeyBytes, setLogger } from './api.js';
import { PreprodConfig } from './config.js';
import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

setLogger(logger);

const getSeed = (): string => {
  if (process.env.DEPLOYER_SEED) return process.env.DEPLOYER_SEED.trim();
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^(?:DEPLOYER_SEED|MIDNIGHT_SEED)=(.*)$/m);
      if (match) return match[1].trim();
    }
  } catch {}
  return '0000000000000000000000000000000000000000000000000000000000000001';
};

async function run() {
  const config = new PreprodConfig();
  const seed = getSeed();

  logger.info(`Starting deployment on Preprod with seed: ${seed.slice(0, 8)}...`);

  const walletCtx = await buildWalletAndWaitForFunds(config, seed);
  const providers = await configureProviders(walletCtx, config);

  const ownerBytes = await getCoinPublicKeyBytes(walletCtx);
  const deployedContract = await deploy(providers, {}, ownerBytes);
  const address = deployedContract.deployTxData.public.contractAddress;

  logger.info(`SUCCESS: Shade contract deployed at: ${address}`);

  // Save the address to a file for the interaction scripts and frontend
  const addressFile = path.resolve(process.cwd(), 'deployed-address.txt');
  fs.writeFileSync(addressFile, address);
  logger.info(`Address saved to ${addressFile}`);

  // Also update frontend/.env.local if frontend folder exists
  const frontendEnvPath = path.resolve(process.cwd(), '..', 'frontend', '.env.local');
  try {
    fs.writeFileSync(frontendEnvPath, `NEXT_PUBLIC_SHADE_ADDRESS=${address}\nNEXT_PUBLIC_RELAY_URL=ws://localhost:4400\n`);
    logger.info(`Updated ${frontendEnvPath} with new contract address`);
  } catch {}

  await walletCtx.wallet.stop();
}

run().catch((err) => {
  logger.error(err);
  process.exit(1);
});
