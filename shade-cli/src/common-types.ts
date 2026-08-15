import { Shade, type ShadePrivateState } from '@midnight-ntwrk/shade-contract';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ProvableCircuitId } from '@midnight-ntwrk/compact-js';

export type ShadeCircuits = ProvableCircuitId<Shade.Contract<ShadePrivateState>>;

export const ShadePrivateStateId = 'shadePrivateState';

export type ShadeProviders = MidnightProviders<
  ShadeCircuits,
  typeof ShadePrivateStateId,
  ShadePrivateState
>;

export type ShadeContract = Shade.Contract<ShadePrivateState>;

export type DeployedShadeContract = DeployedContract<ShadeContract> | FoundContract<ShadeContract>;
