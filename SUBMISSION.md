# Brainwave 2026 – Midnight Track Submission Form

> **Project Name:** Shade — Shielded Intent Matching Engine  
> **Tagline:** Zero-Knowledge Privacy-Preserving Dark Pool & Intent Matching Engine Built on Midnight.  
> **GitHub Repo:** https://github.com/thesumedh/Shade  
> **Devpost Submission Link:** https://devpost.com/submit-to/30979-brainwave-2026-midnight-track/manage/submissions/1138277-shade-shielded-intent-matching-engine/edit  

---

## 📌 1. Project Overview & Elevator Pitch

**Shade** is a next-generation decentralized, trustless dark pool built natively on the **Midnight Network**. It leverages zero-knowledge SNARKs and Midnight's **Compact** language to enable institutional and retail traders to submit shielded order commitments and match counterparties on-chain—**without ever revealing prices, order sizes, or trader identities to the public ledger or any intermediary**.

---

## 💡 2. Inspiration (The Story)

On traditional public blockchains (Ethereum, Solana), placing a trade is like playing poker with all your cards face up. Every pending order broadcast to the public mempool exposes its asset, direction, size, and limit price.

This transparency creates a multi-billion dollar problem:
1. **Maximal Extractable Value (MEV):** Predatory bots scan pending transactions to sandwich-attack and front-run trades, extracting millions from users.
2. **Information Leakage:** Institutional funds and whales cannot move meaningful size without moving the market against themselves before the trade even settles.
3. **Centralized Dark Pools:** Traditional finance attempts to solve this with off-chain dark pools, but they require 100% blind trust in centralized brokers who frequently front-run their own clients.

We asked: **What if we could have the privacy of a dark pool with the trustlessness and self-custody of a decentralized blockchain?**

With **Midnight's dual-ledger Kachina model**, this became possible for the first time.

---

## ⚙️ 3. What It Does

Shade enables peer-to-peer shielded block trading:
- **Shielded Order Submission:** Traders create buy/sell intents locally on their device. A 32-byte cryptographic commitment is generated. Only this hash is recorded on Midnight Preprod—prices and quantities stay 100% private.
- **Off-Chain Intent Discovery:** An ephemeral, stateless WebSocket relay connects traders without ever learning their order details.
- **Zero-Knowledge Match Verification:** When opposite orders cross (e.g. Buyer's limit price >= Seller's ask price), a local ZK proof is generated off-chain using the Docker Proof Server.
- **On-Chain Settlement:** Midnight's smart contract verifies the proof and updates the state to `MATCHED`. The ledger validates that the match was mathematically fair and valid without ever seeing the numbers.
- **1-Click Browser Deployment:** Traders can deploy and join dedicated dark pools directly from the browser using the Midnight Lace Wallet.

---

## 🛠️ 4. How We Built It (Architecture)

1. **Smart Contract Layer (Compact):**
   - Implemented in Midnight's **Compact** language (`shade.compact`).
   - 5 Zero-Knowledge circuits: `submit_order`, `match_orders`, `cancel_order`, `get_balance`, and `transfer_tokens`.
   - Utilizes `persistentCommit<Order>()` to hash local private state and `disclose()` strictly on boolean validation checks to prevent numerical data leakage.
2. **Proving Layer (Docker ZK Proof Server):**
   - Runs `midnightntwrk/proof-server:8.0.3` locally to execute fast, client-side zero-knowledge proof generation.
3. **Frontend & Trading Terminal (Next.js 15 & TailwindCSS):**
   - Interactive 3D Obsidian aesthetics built with Three.js.
   - Real-time dual-trader split-screen testing environment.
   - Integrated with `@midnight-ntwrk/midnight-js-contracts` and DApp Connector API v4.
4. **Wallet Integration (Midnight Lace Wallet):**
   - Connects to Midnight Preprod with automatic address and key derivation (shielded coin public key & encryption public key).
5. **Stateless Relay (Node.js & WebSockets):**
   - Ephemeral peer discovery broadcasting only on-chain commitment hashes.

---

## 🧗 5. Challenges We Ran Into & How We Overcame Them

1. **WASM Module Duplication in Webpack:**
   - *Challenge:* Next.js bundling created duplicate copies of `@midnight-ntwrk/*` WASM modules across workspace packages, breaking `instanceof ChargedState` checks.
   - *Solution:* Configured `config.resolve.modules = [path.resolve(__dirname, 'node_modules'), 'node_modules']` in `next.config.ts` to strictly deduplicate WASM singletons.
2. **DApp Connector API v4 Serialization:**
   - *Challenge:* Unsealed transactions in Lace v4 require hex-encoded strings for balancing, while the SDK expects deserialized objects.
   - *Solution:* Built custom browser-safe hex encoders/decoders and extracted transaction IDs via `tx.identifiers()[0]`.
3. **Cross-Platform Node Heap Allocation:**
   - *Challenge:* Node memory limits during testnet block syncs.
   - *Solution:* Replaced in-memory storage with `NoOpTransactionHistoryStorage` and optimized buffer management.

---

## 🏆 6. Accomplishments That We're Proud Of

- ✨ **End-to-End Functional ZK Flow:** Successfully executing full order creation, proving, and match settlement on Midnight Preprod with real ZK-SNARKs.
- ⚡ **1-Click In-Browser Contract Deployment:** Enabling users to spin up instant private dark pools without touching the terminal.
- 🎨 **World-Class User Experience:** Designing a responsive, high-performance UI with Three.js 3D visualizers that make zero-knowledge cryptography feel intuitive.

---

## 📚 7. What We Learned

- How Midnight's **Kachina model** fundamentally differs from traditional transparent smart contracts by cleanly separating private state (witnesses) from public state (ledger).
- Best practices for writing secure, leak-free **Compact** circuits using boolean-only disclosures.
- Integrating Midnight Lace Wallet and orchestrating off-chain proof servers in client-side React applications.

---

## 🔮 8. What's Next for Shade

- **Atomic Asset Swaps:** Direct integration with Midnight's native token shielding (`sendUnshielded`/`receiveUnshielded`) for trustless asset transfers upon match confirmation.
- **Partial Order Fills:** Nullifier-based state trees enabling large orders to be filled across multiple smaller counterparty orders without revealing quantities.
- **Decentralized Matchmaker Protocol:** Incentivizing third-party matchmakers to find crossing orders and earn protocol rewards while remaining zero-knowledge blind to order contents.

---

## 🏷️ 9. Built With (Tags for Devpost)

- `Midnight Network`
- `Compact`
- `Zero-Knowledge Proofs (ZK-SNARKs)`
- `Next.js`
- `TypeScript`
- `Three.js`
- `Docker`
- `WebSockets`
- `TailwindCSS`
- `Midnight Lace Wallet`
