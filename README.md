# Shade — Shielded Intent Matching Engine

> **Built on [Midnight](https://midnight.network/) | Brainwave 2026 – Midnight Track**

Shade is a privacy-preserving intent-matching engine built on the **Midnight blockchain**. It allows traders to submit shielded order commitments and match them cryptographically — without revealing prices, sizes, or identities to the public ledger.

**For whom is it?** Institutional traders, crypto whales, and privacy-conscious retail users who need to move significant volume without moving the market.

**Why does it exist?** To solve the trillion-dollar problem of **Maximal Extractable Value (MEV)**. On public ledgers, bots front-run your trades and exploit your transparent order flow. Shade ensures that prices, sizes, and trader identities remain strictly confidential until a match is confirmed on-chain. No front-running. No information leakage. No trusted intermediary.

**Until now, the choice has always been: Privacy OR Trustlessness. Pick one. Shade gives you both.**

---

## Live Deployment

> _Deploy your own contract using the CLI — see setup instructions below._

- **Network:** Midnight PreProd
- **Contract Address:** _(deploy fresh using `shade-cli`)_
- **Explorer:** [Midnight PreProd Explorer](https://explorer.preprod.midnight.network/)

---

## Installation & Setup

### Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v22 or higher)
- **npm** (v10 or higher)
- **Midnight Lace Wallet** browser extension
- **Compact Compiler** (`compactc` v0.30.0+) for building the contract
- **Docker** (required for running the local ZK Proof Server)

### Midnight SDK Versions

| Package | Version |
| :--- | :--- |
| `@midnight-ntwrk/midnight-js-*` | `^4.0.0` |
| `@midnight-ntwrk/ledger-v8` | `8.x.x` |
| `@midnight-ntwrk/compact-js` | `^0.30.0` |
| `@midnight-ntwrk/compact-runtime` | `^0.16.0` |
| `@midnight-ntwrk/wallet-sdk-*` | `^3.0.0` |

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/thesumedh/Shade.git
cd Shade
npm install
```

### 2. Build the Contract

The Compact smart contract must be compiled before running the UI or CLI:

```bash
cd contract
npm run compact
npm run build
```

This compiles the Compact contract and generates:
- JavaScript bindings in `src/managed/shade/contract/`
- Prover/verifier keys in `src/managed/shade/keys/`
- ZK intermediate representations in `src/managed/shade/zkir/`

### 3. Run the Contract Tests (Optional)

```bash
cd contract
npm run test
```

### 4. Start the Proof Server

The local proof server generates zero-knowledge proofs locally, ensuring your private trade data never leaves your device. Start it before running the UI or CLI:

```bash
cd shade-cli
npm run preprod-ps
```

*(This runs a Docker container on `http://localhost:6300`)*

### 5. Build and Run the CLI

The CLI is used to deploy contracts, distribute demo tokens, and manage the DApp:

```bash
cd shade-cli
npm run build
npm run preprod
```

This requires a wallet seed (set via `DEPLOYER_SEED` in `shade-cli/.env`) funded with `tNight` tokens from the [Midnight Faucet](https://faucet.midnight.network/).

**CLI Interactive Menu:**
1. `Deploy a new Shade contract` (saves address to `deployed-address.txt`)
2. `Join an existing Shade contract`
3. `Display Status`
4. `Check Wallet Balances`
5. `Transfer Tokens` (Admin utility to fund test wallets)
6. `Submit Order / Match Orders / Cancel Order`

### 6. Start the Relay Server

Shade uses a lightweight WebSocket relay to broadcast commitment hashes between peers:

```bash
cd relay
npm install
npx tsx server.ts
```

### 7. Build and Run the UI

Copy the newly generated ZK assets to the frontend before starting:

```bash
cp -rf contract/src/managed/shade/keys/* frontend/public/zk/keys/
cp -rf contract/src/managed/shade/zkir/* frontend/public/zk/zkir/
```

Then start the development server:

```bash
cd frontend
npm run dev
```

The UI will be available at `http://localhost:3000/dashboard`.

### Environment Configuration

Create `frontend/.env.local` based on your deployment:

```env
NEXT_PUBLIC_SHADE_ADDRESS=<your-deployed-contract-address>
NEXT_PUBLIC_RELAY_URL=ws://localhost:4400
```

---

## Project Structure

```text
shade/
├── contract/                    # Compact smart contract
│   ├── src/
│   │   ├── shade.compact        # Core ZK intent matching logic
│   │   ├── witnesses.ts         # TypeScript private state fetchers
│   │   └── test/                # Contract tests & simulator
│   └── src/managed/             # Compiled output (keys, ZKIR, TS bindings)
├── shade-cli/                   # Command-line interface
│   ├── src/
│   │   ├── api.ts               # Contract deployment & interaction
│   │   └── cli.ts               # Interactive terminal menu
│   └── proof-server.yml         # Docker config for local ZK proof server
├── frontend/                    # Next.js React frontend
│   ├── app/dashboard/           # Main split-screen trading UI
│   ├── lib/                     # MidnightJS SDK integration & providers
│   └── public/zk/               # ZK proving assets served to the browser
└── relay/                       # Peer-to-peer WebSocket service
    └── server.ts                # Relay server logic
```

---

## How It Works

### The Problem with Traditional & Crypto Exchanges

In conventional DeFi, applying for a trade is an entirely transparent process. An individual broadcasts their trade direction, size, and limit price to a public mempool. This creates critical structural flaws:

1. **MEV & Front-Running:** Bots scan the mempool, see a large pending BUY order, and buy the asset first, instantly selling it back to the victim at a higher price (Sandwich attacks).
2. **Information Leakage:** Institutional trading strategies are exposed. The moment a whale begins accumulating an asset, the entire market reacts before their order is filled.
3. **Centralized Alternatives:** To escape this, traders retreat to centralized dark pools, sacrificing self-custody and trusting a black-box operator not to trade against them.

### Midnight's Solution: Rational Privacy in Action

Shade leverages Midnight's Kachina model to completely decouple the *knowledge* of a trade from the *validation* of a trade.

- **The Private State:** The trader's actual order (Direction, Price, Size) and a cryptographic Nonce remain securely on their local machine. This data is provided to the circuit as a *witness* and is never transmitted to the network.
- **The Public State:** The contract only records the `commitment` (a cryptographic hash of the order) and its status (`OPEN`, `MATCHED`, `CANCELLED`).

The bridge between these two worlds is the **Zero-Knowledge Proof**. The local proof server evaluates the private data off-chain to ensure two orders are a valid match (crossing prices, opposite directions). It then submits a proof to the ledger. The blockchain verifies the proof without ever seeing the underlying prices.

---

## Relay Service

The Relay Service acts as a stateless, decentralized message bus for traders. Because the Midnight blockchain only stores hashed order commitments, traders need a way to announce their presence to counterparties.

When a trader submits an order, the browser sends the *on-chain hash* (not the private order details) to the relay. The relay broadcasts this hash to other traders connected to the same contract address. The Relay Server never sees prices, sizes, or cryptographic nonces.

---

## Circuit Logic and Design Decisions

### `submit_order` Circuit

**Logic:** Takes the private order details and nonce from the local witness, hashes them, and stores the commitment in the `orders_state` ledger map.

**Design Decision:** The order data is never passed as a function argument. By retrieving it exclusively via `getOrder()` and `getOrderNonce()` witnesses, we guarantee the data originates directly from the user's local, isolated memory state.

### `match_orders` Circuit

**Logic:**
```typescript
assert(disclose(a_order.direction != b_order.direction), "Orders must be opposite");
assert(disclose(a_order.size == b_order.size), "Size mismatch");

if (disclose(a_order.direction == 0)) { // A is BUY, B is SELL
  assert(disclose(a_order.price >= b_order.price), "Price mismatch");
}
```

**Design Decision:** The `disclose()` wrapper is used *only* on the boolean result of the comparison. It does not disclose the size itself. The network verifies that "Order A's size equals Order B's size is TRUE", without ever knowing what the size actually is.

### `cancel_order` Circuit

**Logic:** Verifies the user knows the pre-image of the commitment, then updates the status in `orders_state` to `CANCELLED`.

**Design Decision:** State transitions are handled explicitly. Instead of deleting the commitment from the map, its state is updated to `CANCELLED`. This prevents the `match_orders` circuit from utilizing it, while preserving an on-chain audit trail of intent flow.

---

## Contract Features

### Trader Role (Permissionless)
- **`submit_order`** — Submit a shielded order (commitment only goes on-chain)
- **`match_orders`** — Match two open orders using ZK proofs
- **`cancel_order`** — Cancel your own order (ownership proved via ZK, not address)

### Owner Role (Deployer)
- **`transfer_tokens`** — Distribute demo tokens for testing purposes

---

## Roadmap

### Phase 2: Trustless Atomic Settlement
Integrate Midnight's native token shielding (`receiveUnshielded` / `sendUnshielded`) directly into the ZK circuits for atomic swaps upon match confirmation — eliminating counterparty risk.

### Phase 3: Fragmented Order Fills & Nullifier State Splitting
Enable partial fills via nullifier-based state splitting. A 10,000 token BUY matched against 2,000 token SELL invalidates the original commitment and generates a new one for the remaining 8,000 — all without revealing amounts.

### Phase 4: Decentralized Matchmaker Nodes
Replace the simple relay with decentralized Matchmaker nodes that earn fees for finding matches, while remaining unable to see order data due to ZK encryption.

---

## Built With

- [Midnight Network](https://midnight.network/) — Privacy-preserving blockchain
- [Compact](https://docs.midnight.network/develop/reference/compact/) — ZK circuit language
- [Next.js](https://nextjs.org/) — Frontend framework
- [Midnight Lace Wallet](https://docs.midnight.network/develop/tutorial/use-wallet/) — Browser wallet

---

## License

Apache-2.0 — See [LICENSE](LICENSE) for details.

---

*Shade — Submitted to Brainwave 2026 – Midnight Blockchain Track*
*Built by [thesumedh](https://github.com/thesumedh)*
