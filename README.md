# Shade — Shielded Intent Matching Engine

> **Built on [Midnight Network](https://midnight.network/) | Brainwave 2026 – Midnight Track**  
> *From Midnight Ideas to On-Chain Innovation*

[![Midnight Preprod](https://img.shields.io/badge/Network-Midnight_Preprod-4F46E5?style=for-the-badge&logo=blockchain&logoColor=white)](https://explorer.preprod.midnight.network/)
[![Compact ZK](https://img.shields.io/badge/Contract-Compact_v0.31.1-10B981?style=for-the-badge&logo=shield&logoColor=white)](https://docs.midnight.network/develop/reference/compact/)
[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)](LICENSE)

---

## 🎬 Project Video & Live Demo

- **Live DApp:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard) *(Local dev)*
- **Demo Video:**  
  > *[Demo Video Placeholder — Insert your YouTube / Loom walkthrough link here]*  
  [![Shade Demo Video](https://img.shields.io/badge/Watch_Demo_Video-YouTube-red?style=for-the-badge&logo=youtube)](https://youtube.com)
- **GitHub Repository:** [https://github.com/thesumedh/Shade](https://github.com/thesumedh/Shade)
- **Explorer (Midnight Preprod):** [https://explorer.preprod.midnight.network/](https://explorer.preprod.midnight.network/)

---

## 📖 The Story: Why Shade Exists

### The Trillion-Dollar Transparent Mempool Flaw
In traditional decentralized finance (DeFi), trading on public blockchains (Ethereum, Solana) requires exposing every detail of your financial intent: **asset, side, volume, and limit price**. 

This transparent order flow is exploited daily by predatory **Maximal Extractable Value (MEV)** bots through sandwich attacks, front-running, and latency arbitrage. When institutional funds or whales attempt to move large volume, transparent ledgers leak their market strategy before the trade even settles, causing massive slippage and market impact.

### The Broken Dilemma: Blind Trust vs. Information Leakage
Until now, market participants have faced an unacceptable trade-off:
1. **Public DEXs:** Transparent, self-custodial, but aggressively front-run by MEV searchers.
2. **Traditional Dark Pools:** Private, but fully centralized and opaque—requiring complete custody handover to brokers who frequently trade against their own order flow.

### The Midnight Breakthrough: Rational Privacy + Decentralization
**Shade** resolves this dilemma by utilizing **Midnight's dual-ledger Kachina model**. With Zero-Knowledge SNARKs and private smart contract circuits written in **Compact**, Shade enables **trustless, decentralized intent matching** where the blockchain verifies that orders match without ever knowing what the orders are.

> **"The network sees a proof of a match; it never sees the price or size."**

---

## 🏗️ System Architecture

Shade decouples the **knowledge of a trade** (kept in local client memory) from the **verification of a trade** (computed via ZK proofs and recorded on-chain).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                     USER BROWSER                                        │
│                                                                                         │
│  ┌────────────────────────┐      ┌────────────────────────┐      ┌───────────────────┐  │
│  │   Trader Interface     │      │   Private State Store  │      │ Midnight Lace     │  │
│  │   (Next.js 15 / UI)    │─────▶│   (Order, Nonce, Key)  │─────▶│ DApp Connector   │  │
│  └───────────┬────────────┘      └───────────┬────────────┘      └─────────┬─────────┘  │
└──────────────┼───────────────────────────────┼─────────────────────────────┼────────────┘
               │                               │ (Witness Fetching)          │
               │ (Commitment Broadcast)        ▼                             │ (Tx Signing)
               │                     ┌────────────────────┐                  │
               │                     │  ZK Proof Server   │                  │
               │                     │  (Docker :6300)    │                  │
               │                     │  Local Prover      │                  │
               │                     └─────────┬──────────┘                  │
               │                               │                             │
               ▼                               ▼ (ZK Proof Output)           ▼
┌─────────────────────────────┐      ┌─────────────────────────────────────────────────┐
│     Stateless P2P Relay     │      │            Midnight Preprod Blockchain          │
│    (WebSocket :4400)        │      │                                                 │
│                             │      │  ┌───────────────────────────────────────────┐  │
│  • Matches Intent Feeds     │      │  │        Shade Compact Smart Contract       │  │
│  • Discovers Counterparties │      │  │                                           │  │
│  • Zero Data Visibility     │      │  │  • orders_state: Map<Commitment, State>   │  │
│                             │      │  │  • match_count: Counter                   │  │
│                             │      │  │  • Circuits: submit, match, cancel        │  │
│                             │      │  └───────────────────────────────────────────┘  │
└─────────────────────────────┘      └─────────────────────────────────────────────────┘
```

---

## 🔬 Core Zero-Knowledge Circuits (`shade.compact`)

Shade's smart contract is implemented in Midnight's **Compact** domain-specific language:

### 1. `submit_order(): Bytes<32>`
- **Privacy Model:** The user's order `(direction, price, size)` and random 32-byte `nonce` remain in local client memory.
- **Circuit Logic:** Calculates `persistentCommit<Order>(order, nonce)` and discloses only the 32-byte cryptographic commitment hash to `orders_state[d_commit] = State.OPEN`.
- **Zero Information Leakage:** Neither price nor quantity is ever exposed on the public ledger.

### 2. `match_orders(commitA, commitB): []`
- **Privacy Model:** Reconstructs both private commitments inside the ZK circuit.
- **Cryptographic Verification:**
  ```rust
  assert(disclose(a_order.direction != b_order.direction), "Orders must be opposite");
  assert(disclose(a_order.size == b_order.size), "Size mismatch");

  if (disclose(a_order.direction == 0)) { // A is BUY, B is SELL
    assert(disclose(a_order.price >= b_order.price), "Price mismatch");
  }
  ```
- **The Magic of `disclose()` on Booleans:** The circuit only discloses the *boolean validation result* (e.g. `is_opposite == true`, `price_satisfied == true`). The underlying numerical values are never revealed.

### 3. `cancel_order(commitment): []`
- **Privacy Model:** Verifies the caller possesses the original pre-image `(order, nonce)` of the commitment without revealing the order parameters.
- **State Transition:** Updates `orders_state[commitment] = State.CANCELLED`.

---

## ⚡ Key Features

- 🛡️ **Zero Front-Running & MEV Protection:** No public order book or mempool exposure.
- 🔒 **Self-Custodial Privacy:** Private keys, nonces, and trade parameters never leave the trader's device.
- ⚡ **1-Click In-Browser Deployment:** Deploy dedicated Shade dark pool contracts straight from the browser UI with Midnight Lace Wallet.
- 🌐 **P2P Decentralized Relay:** Lightweight WebSocket relay broadcasts opaque commitment hashes between active peers.
- 💎 **Midnight Lace Wallet Native:** Seamless transaction signing and unsealed balance management via DApp Connector API v4.
- 📊 **Real-Time Cryptographic Visualizer:** Visual proof generated for order commitment states, peer presence, and match settlement.

---

## 🚀 Installation & Quick Start

### Prerequisites
- **Node.js** v22+
- **Docker Desktop** (for the local ZK Proof Server)
- **Midnight Lace Wallet Extension** (configured to **Preprod** network)
- **Compact Compiler** v0.31.1+

---

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/thesumedh/Shade.git
cd Shade
npm install
```

---

### Step 2: Start the ZK Proof Server (Docker)

```bash
cd shade-cli
npm run preprod-ps
```
*(Starts `midnightntwrk/proof-server:8.0.3` on `http://localhost:6300`)*

---

### Step 3: Start the P2P Relay Server

```bash
# In a new terminal
cd relay
npm start
```
*(Listens on `ws://localhost:4400`)*

---

### Step 4: Launch the Frontend Trading Terminal

```bash
# In a new terminal
cd frontend
npm run dev
```
Open **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)** in your browser.

---

## 🧪 End-to-End Testing Walkthrough

### 1. Connect Wallet
- Open `http://localhost:3000/dashboard` in two browser tabs or profiles.
- Connect your **Midnight Lace Wallet** in both windows (Preprod network).

### 2. Deploy or Join Dark Pool
- In Tab 1: Click **`⚡ DEPLOY NEW CONTRACT`** (or **`DEPLOY CONTRACT`** in top bar).
- Approve the transaction in your Lace wallet.
- The URL updates with `?contract=<address>`.
- Copy the **SHARE LINK** and paste it into Tab 2.

### 3. Place Shielded Orders
- **Tab 1 (Trader A):** Click **BUY**, set Size: `100`, Limit Price: `$5,000`, click **SUBMIT SHIELDED ORDER**.
  * The local proof server creates a ZK commitment proof.
  * The commitment hash appears on the Midnight Preprod blockchain.
- **Tab 2 (Trader B):** Click **SELL**, set Size: `100`, Limit Price: `$4,950`, click **SUBMIT SHIELDED ORDER**.

### 4. Zero-Knowledge Intent Match
- Click **MATCH INTENTS**.
- The ZK circuit verifies that `BUY price ($5,000) >= SELL price ($4,950)` and `Size (100) == Size (100)` entirely in zero knowledge.
- The transaction settles on-chain with zero price or identity data revealed to the public ledger!

---

## 📁 Repository Structure

```text
Shade/
├── contract/                    # Compact ZK Smart Contract
│   ├── src/
│   │   ├── shade.compact        # Core ZK Intent Matching circuits
│   │   ├── witnesses.ts         # TypeScript private state witnesses
│   │   └── test/                # Unit and simulator test suite
│   ├── dist/                    # Compiled ZK artifacts (keys, zkir, contract)
│   └── build.js                 # Cross-platform build script
├── shade-cli/                   # Node CLI & Deployer Tooling
│   ├── src/
│   │   ├── deploy-preprod.ts    # Automated Preprod deployer
│   │   ├── deploy-preview.ts    # Automated Preview deployer
│   │   ├── generate-wallet.ts   # Offline address & seed derivation
│   │   └── api.ts               # Midnight SDK wallet & contract interface
│   └── proof-server.yml         # Docker compose for ZK Proof Server
├── frontend/                    # Next.js 15 Web Application
│   ├── app/
│   │   ├── dashboard/           # Split-screen ZK trading terminal
│   │   ├── demo/                # Interactive architecture walkthrough
│   │   └── page.tsx             # 3D interactive landing page
│   ├── components/              # UI & Three.js visualizer components
│   ├── contexts/WalletContext   # Midnight Lace wallet connector
│   └── lib/shade-api.ts         # Browser-native contract invocation & ZK proofs
└── relay/                       # Stateless P2P WebSocket Message Bus
    └── server.ts                # Ephemeral order intent exchange
```

---

## 🏆 Brainwave 2026 Judging Criteria Alignment

| Category | Weight | How Shade Excels |
|---|---|---|
| **Innovation & Creativity** | 25% | First decentralized, trustless dark pool on Midnight solving the multi-billion dollar MEV & front-running crisis using boolean disclosure circuits. |
| **Technical Implementation** | 25% | Full-stack implementation featuring 5 Compact ZK circuits, local Docker proof server integration, Lace DApp connector v4, and stateless P2P intent relay. |
| **Impact & Problem Solving** | 20% | Directly addresses institutional and retail slippage, sandwich attacks, and toxic order flow on public blockchains. |
| **UX & Design** | 15% | High-end 3D visual aesthetic (Three.js), intuitive split-screen counterparty testing, 1-click in-browser deployment, and real-time state feedback. |
| **Scalability & Feasibility** | 10% | Off-chain ZK proof generation reduces on-chain verification to constant-time O(1) checks; stateless relay ensures high throughput. |
| **Presentation & Documentation** | 5% | Comprehensive setup instructions, complete architecture diagrams, automated deployment scripts, and clean codebase. |

---

## 🛣️ Future Roadmap

- [ ] **Phase 1 (Completed):** Core shielded intent matching circuits, Lace wallet integration, Next.js dark pool UI, P2P WebSocket relay.
- [ ] **Phase 2:** Atomic Settlement integration using Midnight's native shielded token transfers (`sendUnshielded`/`receiveUnshielded`).
- [ ] **Phase 3:** Nullifier-based Partial Fills enabling segmented orders (e.g. 10k buy matched against multiple smaller sells).
- [ ] **Phase 4:** Decentralized incentivized matchmaker network with ZK privacy-preserving bounty distribution.

---

## 📄 License

Licensed under the [Apache-2.0 License](LICENSE).

---

*Built with ❤️ for **Brainwave 2026 – Midnight Track** by [thesumedh](https://github.com/thesumedh)*
