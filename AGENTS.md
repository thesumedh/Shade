# AGENTS.md

Developer changelog for AI-assisted fixes. Each entry records what broke, why, and exactly what was changed so future agents can orient quickly.

---

## 2026-04-10 — Browser wallet integration fixes

### Fix 1: Network ID not initialized before contract operations

**Error:** `"Network ID has not been configured. Call setNetworkId() before any wallet or contract operation."`
**Trace:** `app/dashboard/page.tsx` → `lib/shade-api.ts` (`contract.callTx.submit_order()`)

**Root cause:** The Midnight SDK requires a global network ID singleton (from `@midnight-ntwrk/midnight-js-network-id`) to be set before any wallet or contract call. The CLI does this in its config constructors (`shade-cli/src/config.ts` via `setAllNetworkIds()`), but the browser's `createBrowserProviders` never called it.

**Fix:** `frontend/lib/providers.ts`
- Added `import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id'`
- Called `setNetworkId(network)` at the top of `createBrowserProviders()`, before any provider is constructed

---

### Fix 2: Duplicate WASM module instances causing `instanceof ChargedState` failure

**Error:** `ContractRuntimeError: Error executing circuit 'submit_order' … expected instance of ChargedState`

**Root cause:** The contract is linked as `file:../contract` in `frontend/package.json`. When webpack bundles the frontend, imports inside `contract/dist/managed/shade/contract/index.js` resolve upward to the root workspace `node_modules/`, while SDK packages in the frontend resolve to `frontend/node_modules/`. This creates two separate copies of the WASM module. `instanceof`-based checks fail when crossing module boundaries.

**Fix:** `frontend/next.config.ts`
- Added `config.resolve.modules = [path.resolve(__dirname, 'node_modules'), 'node_modules']` in the webpack config callback. This collapses both WASM copies into one.

---

### Fix 3: `balanceTx` wrong serialization format and broken return object

**Error:** `"Unexpected error submitting scoped transaction '<unnamed>': Error"` (after wallet signs)

**Root cause (part A):** DApp Connector API v4's `balanceUnsealedTransaction(tx: string)` expects a **hex-encoded string**, but the old code passed `tx.serialize()` raw (`Uint8Array`) directly.

**Root cause (part B):** WASM objects have no enumerable own properties, so spreading them produces `{}`. The SDK received a bare object with only a patched `serialize()`, missing the `identifiers()` method it needs.

**Fix:** `frontend/lib/providers.ts`
- Added `toHex()` and `fromHex()` helpers (browser-safe, no `Buffer`)
- Rewrote `balanceTx`:
  ```ts
  balanceTx: async (tx, _ttl?) => {
    const balanced = await injectedWallet.balanceUnsealedTransaction(toHex(tx.serialize()));
    return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
  }
  ```

---

### Fix 4: `submitTx` returns `void` instead of `TransactionId`

**Root cause:** The DApp Connector API's `submitTransaction` returns `Promise<void>`. But `MidnightProvider.submitTx` must return `Promise<TransactionId>` (a string).

**Fix:** `frontend/lib/providers.ts`
- Rewrote `submitTx` to extract the tx ID from the `FinalizedTransaction` before calling `submitTransaction`:
  ```ts
  submitTx: async (tx) => {
    const txId = tx.identifiers()[0];
    await injectedWallet.submitTransaction(toHex(tx.serialize()));
    return txId;
  }
  ```

---

### Fix 5: `getUnshieldedAddress` wrong field name

**Root cause:** DApp Connector API v4 returns `{ unshieldedAddress: string }`, but the code checked `addr?.address`.

**Fix:** `frontend/contexts/WalletContext.tsx`
- Changed field lookup order to check `addr?.unshieldedAddress` first.

---

## Key architectural notes

- **DApp Connector API v4 transaction flow:**
  1. `balanceUnsealedTransaction(hexString)` → `{tx: hexString}` — wallet signs here
  2. `submitTransaction(hexString)` → `void` — must return tx ID separately via `tx.identifiers()[0]`
  3. Deserialize balanced hex back using `Transaction.deserialize('signature', 'proof', 'binding', bytes)`

- **Duplicate WASM modules:** Any `file:`-linked package that imports `@midnight-ntwrk/*` WASM packages will resolve to root `node_modules` instead of `frontend/node_modules`. Always keep `config.resolve.modules = [path.resolve(__dirname, 'node_modules'), 'node_modules']` in `next.config.ts`.

- **Network ID:** Must call `setNetworkId(networkId)` once before any Midnight SDK operation. In the browser this is done inside `createBrowserProviders`. In the CLI it is done in each config class constructor via `setAllNetworkIds`.
