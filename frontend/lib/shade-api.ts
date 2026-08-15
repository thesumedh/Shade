import { Shade, type ShadePrivateState, witnesses } from '@midnight-ntwrk/shade-contract';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import type { ShadeProviders, DeployedShadeContract } from './common-types';
import { ShadePrivateStateId } from './common-types';

const shadeCompiledContract = CompiledContract.make('shade', Shade.Contract).pipe(
  CompiledContract.withWitnesses(witnesses)
);

// Browser-safe hex decoder (no Node Buffer required)
const fromHex = (hex: string): Uint8Array => {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const matches = clean.match(/.{1,2}/g) ?? [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
};

// Ensures any string/Uint8Array is normalized into a strict 32-byte Uint8Array
const normalizeToBytes32 = (input: string | Uint8Array): Uint8Array => {
  const bytes32 = new Uint8Array(32);
  let src: Uint8Array;

  if (typeof input === 'string') {
    src = fromHex(input);
  } else if (input instanceof Uint8Array) {
    src = input;
  } else {
    src = new Uint8Array(0);
  }

  // Copy up to 32 bytes into the buffer
  bytes32.set(src.subarray(0, 32));
  return bytes32;
};

export const deployShade = async (
  providers: ShadeProviders,
  ownerAddr: string | Uint8Array,
  initialSupply: bigint = 1_000_000n
): Promise<DeployedShadeContract> => {
  const ownerBytes = normalizeToBytes32(ownerAddr);
  return deployContract(providers as any, {
    compiledContract: shadeCompiledContract as any,
    privateStateId: ShadePrivateStateId,
    initialPrivateState: {},
    args: [initialSupply, { bytes: ownerBytes }],
  }) as unknown as Promise<DeployedShadeContract>;
};

export const joinShade = async (
  providers: ShadeProviders,
  contractAddress: string,
): Promise<DeployedShadeContract> => {
  return findDeployedContract(providers as any, {
    contractAddress,
    compiledContract: shadeCompiledContract as any,
    privateStateId: ShadePrivateStateId,
    initialPrivateState: {},
  }) as unknown as Promise<DeployedShadeContract>;
};

export interface SubmitOrderResult {
  txData: { txId: string; blockHeight: number };
  commitment: Uint8Array;
  nonce: Uint8Array;
  order: Shade.Order;
}

// Any wallet can submit an order — no ownership check in the contract.
export const submitOrder = async (
  providers: ShadeProviders,
  contract: DeployedShadeContract,
  direction: 'BUY' | 'SELL',
  price: number,
  size: number
): Promise<SubmitOrderResult> => {
  const dirBigInt = direction === 'BUY' ? 0n : 1n;
  const priceBigInt = BigInt(Math.floor(price * 100));
  const sizeBigInt = BigInt(Math.floor(size * 100));

  const orderNonce = crypto.getRandomValues(new Uint8Array(32));
  const order: Shade.Order = { direction: dirBigInt, price: priceBigInt, size: sizeBigInt };

  const address = contract.deployTxData.public.contractAddress;
  providers.privateStateProvider.setContractAddress(address);
  const currentState = (await providers.privateStateProvider.get(ShadePrivateStateId)) ?? {};

  await providers.privateStateProvider.set(ShadePrivateStateId, {
    ...currentState,
    submitOrder: { order, nonce: orderNonce },
  });

  // submit_order() takes no arguments in the simplified contract
  let tx;
  try {
    tx = await contract.callTx.submit_order();
  } catch (err: any) {
    console.error("submit_order failed. Full error:", err);
    if (err.cause) {
      console.error("Underlying cause:", err.cause);
    }
    throw err;
  }

  return {
    txData: tx.public,
    commitment: tx.private.result as Uint8Array,
    nonce: orderNonce,
    order,
  };
};

// Any wallet can trigger a match — no ownership check in the contract.
export const matchOrders = async (
  providers: ShadeProviders,
  contract: DeployedShadeContract,
  orderA: Shade.Order,
  nonceA: Uint8Array,
  commitA: Uint8Array,
  orderB: Shade.Order,
  nonceB: Uint8Array,
  commitB: Uint8Array,
) => {
  const address = contract.deployTxData.public.contractAddress;
  providers.privateStateProvider.setContractAddress(address);
  const currentState = (await providers.privateStateProvider.get(ShadePrivateStateId)) ?? {};

  await providers.privateStateProvider.set(ShadePrivateStateId, {
    ...currentState,
    matchOrderA: { order: orderA, nonce: nonceA },
    matchOrderB: { order: orderB, nonce: nonceB },
  });

  let tx;
  try {
    tx = await contract.callTx.match_orders(commitA, commitB);
  } catch (err: any) {
    console.error("match_orders failed. Full error:", err);
    if (err.cause) {
      console.error("Underlying cause:", err.cause);
    }
    throw err;
  }
  return tx.public;
};

// Any wallet can cancel their own order — ownership proved via ZK commitment.
export const cancelOrder = async (
  providers: ShadeProviders,
  contract: DeployedShadeContract,
  order: Shade.Order,
  nonce: Uint8Array,
  commitment: Uint8Array,
) => {
  const address = contract.deployTxData.public.contractAddress;
  providers.privateStateProvider.setContractAddress(address);
  const currentState = (await providers.privateStateProvider.get(ShadePrivateStateId)) ?? {};

  await providers.privateStateProvider.set(ShadePrivateStateId, {
    ...currentState,
    cancelOrder: { order, nonce },
  });

  const tx = await contract.callTx.cancel_order(commitment);
  return tx.public;
};

export const transferTokens = async (
  providers: ShadeProviders,
  contract: DeployedShadeContract,
  amount: bigint,
  recipientAddr: string | Uint8Array
) => {
  const recipientBytes = normalizeToBytes32(recipientAddr);
  const tx = await contract.callTx.transfer_tokens(amount, { bytes: recipientBytes });
  return tx.public;
};
